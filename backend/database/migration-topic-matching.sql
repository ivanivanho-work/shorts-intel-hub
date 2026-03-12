-- ============================================================================
-- Migration: Topic Matching Algorithm & Three-Track Data Model
-- ============================================================================
--
-- PREREQUISITE: Run AFTER the initial schema.sql has been applied.
--
-- This migration adds support for the Topic Matching Algorithm which
-- classifies topics into three tracks:
--   - Internal track  (Nyan Cat data)
--   - External track  (Vayner Media / Agency data)
--   - Matched track   (cross-source matches consolidated into single entries)
--
-- New tables:
--   - consolidated_topics  (center track: merged cross-source entries)
--   - topic_matches        (links individual topics to consolidated entries)
--   - topic_relations      (within-source related-topic flags)
--   - matching_runs        (audit trail for each pipeline execution)
--
-- Changes to existing objects:
--   - source_type enum: adds 'internal' and 'external'
--   - topics table: adds data_track column
--
-- ============================================================================

BEGIN;

-- ============================================================================
-- 1. EXTEND source_type ENUM
-- ============================================================================
-- Add new source classifications. Old values (youtube_search, nyan_cat,
-- agency, music) are kept for backward compatibility.

ALTER TYPE source_type ADD VALUE IF NOT EXISTS 'internal';
ALTER TYPE source_type ADD VALUE IF NOT EXISTS 'external';

COMMIT;

-- NOTE: ALTER TYPE ... ADD VALUE cannot run inside a transaction in
-- PostgreSQL < 16. We commit the enum changes first, then open a new
-- transaction for the rest of the DDL.

BEGIN;

-- ============================================================================
-- 2. ADD data_track COLUMN TO topics
-- ============================================================================
-- Classifies each topic into one of the three tracks (or 'unprocessed'
-- if it has not yet been through the matching pipeline).

ALTER TABLE topics ADD COLUMN IF NOT EXISTS data_track VARCHAR(20) DEFAULT 'unprocessed'
    CHECK (data_track IN ('internal', 'external', 'matched', 'unprocessed'));

-- ============================================================================
-- 3. CREATE consolidated_topics TABLE (center track entries)
-- ============================================================================
-- Each row represents a single consolidated topic that was identified by
-- matching an internal topic with an external topic (or multiple of each).

CREATE TABLE IF NOT EXISTS consolidated_topics (
    consolidated_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Best consolidated data
    consolidated_name VARCHAR(500) NOT NULL,
    consolidated_description TEXT,

    -- Match metadata
    match_count INTEGER NOT NULL DEFAULT 0,
    internal_count INTEGER NOT NULL DEFAULT 0,
    external_count INTEGER NOT NULL DEFAULT 0,
    avg_confidence FLOAT,

    -- Ranking (applied after matching)
    rank_score FLOAT,
    rank_position INTEGER,

    -- Market context
    market market_type NOT NULL,

    -- Lifecycle
    status VARCHAR(20) DEFAULT 'active'
        CHECK (status IN ('active', 'archived', 'approved')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    -- Approval tracking (mirrors topics table)
    approved_by VARCHAR(255),
    approved_at TIMESTAMP WITH TIME ZONE,
    sent_to_agent_collective BOOLEAN DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_consolidated_market
    ON consolidated_topics(market, rank_score DESC);

CREATE INDEX IF NOT EXISTS idx_consolidated_status
    ON consolidated_topics(status) WHERE status = 'active';

-- ============================================================================
-- 4. CREATE topic_matches TABLE (cross-source matching)
-- ============================================================================
-- Replaces topic_duplicates for cross-source matching. Each row links one
-- topic to its consolidated entry, recording how the match was detected
-- and the associated confidence.

CREATE TABLE IF NOT EXISTS topic_matches (
    match_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- The consolidated entry this match belongs to
    consolidated_id UUID NOT NULL,

    -- The individual topic that was matched
    topic_id UUID NOT NULL REFERENCES topics(topic_id),

    -- Source classification
    source_type VARCHAR(20) NOT NULL
        CHECK (source_type IN ('internal', 'external')),

    -- How the match was detected
    match_method VARCHAR(20) NOT NULL
        CHECK (match_method IN ('embedding', 'llm')),

    -- Confidence and reasoning
    similarity_score FLOAT,                       -- cosine similarity (Stage 1)
    llm_confidence INTEGER
        CHECK (llm_confidence IS NULL OR (llm_confidence >= 1 AND llm_confidence <= 10)),
    llm_classification VARCHAR(20)
        CHECK (llm_classification IN ('SAME_TOPIC', 'RELATED_THEME', 'DIFFERENT')),
    llm_explanation TEXT,

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT unique_topic_per_consolidated UNIQUE (consolidated_id, topic_id)
);

CREATE INDEX IF NOT EXISTS idx_topic_matches_consolidated ON topic_matches(consolidated_id);
CREATE INDEX IF NOT EXISTS idx_topic_matches_topic       ON topic_matches(topic_id);
CREATE INDEX IF NOT EXISTS idx_topic_matches_source      ON topic_matches(source_type);

-- ============================================================================
-- 5. CREATE topic_relations TABLE (within-source related flags)
-- ============================================================================
-- Records relationships between topics from the same source (internal or
-- external). These are NOT cross-source matches -- they flag related or
-- duplicate topics within one track.

CREATE TABLE IF NOT EXISTS topic_relations (
    relation_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    topic_id_1 UUID NOT NULL REFERENCES topics(topic_id),
    topic_id_2 UUID NOT NULL REFERENCES topics(topic_id),

    -- Relationship details
    relationship VARCHAR(20) NOT NULL
        CHECK (relationship IN ('SAME_TOPIC', 'RELATED_THEME')),
    confidence INTEGER
        CHECK (confidence >= 1 AND confidence <= 10),
    explanation TEXT,

    -- Detection method
    match_method VARCHAR(20) NOT NULL
        CHECK (match_method IN ('embedding', 'llm')),
    similarity_score FLOAT,

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT different_topics_relation CHECK (topic_id_1 != topic_id_2),
    CONSTRAINT unique_relation_pair UNIQUE (topic_id_1, topic_id_2)
);

CREATE INDEX IF NOT EXISTS idx_topic_relations_topic1 ON topic_relations(topic_id_1);
CREATE INDEX IF NOT EXISTS idx_topic_relations_topic2 ON topic_relations(topic_id_2);

-- ============================================================================
-- 6. CREATE matching_runs TABLE (pipeline audit trail)
-- ============================================================================
-- One row per execution of the matching pipeline. Captures input/output
-- counts, timing, and error state for observability.

CREATE TABLE IF NOT EXISTS matching_runs (
    run_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Run metadata
    market market_type NOT NULL,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP WITH TIME ZONE,

    -- Input counts
    internal_topic_count INTEGER NOT NULL DEFAULT 0,
    external_topic_count INTEGER NOT NULL DEFAULT 0,

    -- Results
    total_pairs_analyzed INTEGER DEFAULT 0,
    stage1_matches INTEGER DEFAULT 0,       -- embedding pass
    stage2_matches INTEGER DEFAULT 0,       -- LLM verification pass
    related_flags INTEGER DEFAULT 0,        -- RELATED_THEME flags

    -- Output counts
    matched_topics_count INTEGER DEFAULT 0,
    internal_only_count INTEGER DEFAULT 0,
    external_only_count INTEGER DEFAULT 0,

    -- Status
    status VARCHAR(20) DEFAULT 'running'
        CHECK (status IN ('running', 'completed', 'failed')),
    error_message TEXT,

    -- Performance
    processing_time_ms INTEGER
);

CREATE INDEX IF NOT EXISTS idx_matching_runs_market ON matching_runs(market, started_at DESC);

-- ============================================================================
-- 7. TRIGGERS
-- ============================================================================

-- Auto-update updated_at on consolidated_topics
CREATE TRIGGER update_consolidated_topics_updated_at
    BEFORE UPDATE ON consolidated_topics
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 8. VIEWS
-- ============================================================================

-- Three-track summary: topic counts per track per market
CREATE OR REPLACE VIEW three_track_summary AS
SELECT
    market,
    COUNT(*) FILTER (WHERE data_track = 'internal')    AS internal_count,
    COUNT(*) FILTER (WHERE data_track = 'external')    AS external_count,
    COUNT(*) FILTER (WHERE data_track = 'matched')     AS matched_count,
    COUNT(*) FILTER (WHERE data_track = 'unprocessed') AS unprocessed_count
FROM topics
WHERE is_deleted = FALSE AND status = 'active'
GROUP BY market;

-- Consolidated topics with their matched source details
CREATE OR REPLACE VIEW consolidated_with_matches AS
SELECT
    ct.*,
    json_agg(json_build_object(
        'topicId',      tm.topic_id,
        'sourceType',   tm.source_type,
        'matchMethod',  tm.match_method,
        'confidence',   COALESCE(tm.llm_confidence, ROUND(tm.similarity_score * 10)::integer),
        'explanation',  tm.llm_explanation
    )) AS matched_sources
FROM consolidated_topics ct
JOIN topic_matches tm ON ct.consolidated_id = tm.consolidated_id
WHERE ct.status = 'active'
GROUP BY ct.consolidated_id;

-- ============================================================================
-- 9. TABLE COMMENTS
-- ============================================================================

COMMENT ON TABLE consolidated_topics IS 'Center track: merged cross-source topic entries created by the matching pipeline';
COMMENT ON TABLE topic_matches IS 'Links individual topics to their consolidated entries with match confidence';
COMMENT ON TABLE topic_relations IS 'Within-source related-topic flags (same track only)';
COMMENT ON TABLE matching_runs IS 'Audit trail for each topic matching pipeline execution';

COMMENT ON COLUMN topics.data_track IS 'Three-track classification: internal, external, matched, or unprocessed';
COMMENT ON COLUMN topic_matches.similarity_score IS 'Cosine similarity from Stage 1 embedding comparison';
COMMENT ON COLUMN topic_matches.llm_confidence IS 'LLM confidence score 1-10 from Stage 2 verification';
COMMENT ON COLUMN matching_runs.stage1_matches IS 'Pairs that passed the embedding similarity threshold';
COMMENT ON COLUMN matching_runs.stage2_matches IS 'Pairs confirmed as SAME_TOPIC by LLM verification';

COMMIT;
