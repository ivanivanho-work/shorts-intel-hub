-- Shorts Intel Hub Database Schema
-- PostgreSQL with pgvector extension
-- Target: Cloud SQL PostgreSQL 15+

-- Enable pgvector extension for vector similarity search
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- ENUMS
-- ============================================================================

-- Market enum
CREATE TYPE market_type AS ENUM ('JP', 'KR', 'IN', 'ID', 'AUNZ');

-- Data source enum
CREATE TYPE source_type AS ENUM ('youtube_search', 'nyan_cat', 'agency', 'music');

-- Topic status enum
CREATE TYPE topic_status AS ENUM ('raw', 'processing', 'active', 'expired', 'archived', 'approved', 'deleted');

-- Gender enum
CREATE TYPE gender_type AS ENUM ('male', 'female');

-- Age group enum
CREATE TYPE age_group_type AS ENUM ('18-24', '25-34', '35-44');

-- ============================================================================
-- CORE TABLES
-- ============================================================================

-- Topics table: Main data for all trending topics
CREATE TABLE topics (
    -- Identity
    topic_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    topic_name VARCHAR(500) NOT NULL,
    description TEXT NOT NULL,
    reference_link TEXT NOT NULL,

    -- Classification
    market market_type NOT NULL,
    target_demo_gender gender_type NOT NULL,
    target_demo_age age_group_type NOT NULL,
    source source_type NOT NULL,

    -- Metadata (optional fields from schema)
    hashtags TEXT[], -- Array of hashtags
    audio VARCHAR(500), -- Audio ID or song name

    -- Ranking metrics
    velocity FLOAT, -- View/creation growth rate
    creation_rate FLOAT, -- Content creation velocity
    watchtime FLOAT, -- Average watchtime metric
    rank_score FLOAT, -- Weighted composite score
    rank_position INTEGER, -- Position in demo/market ranking

    -- Status & lifecycle
    status topic_status DEFAULT 'raw',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    processed_at TIMESTAMP WITH TIME ZONE, -- When AI processing completed
    expires_at TIMESTAMP WITH TIME ZONE, -- Auto-calculated (created + 3 weeks)
    archived_at TIMESTAMP WITH TIME ZONE,
    deleted_at TIMESTAMP WITH TIME ZONE,

    -- Approval tracking
    approved_by VARCHAR(255), -- Email of approver
    approved_at TIMESTAMP WITH TIME ZONE,
    sent_to_agent_collective BOOLEAN DEFAULT FALSE,
    sent_at TIMESTAMP WITH TIME ZONE,

    -- AI processing
    embedding vector(768), -- Gemini embedding for deduplication (768 dimensions)
    normalized_data JSONB, -- Store normalized/processed data
    raw_data JSONB, -- Store original input data

    -- Soft delete
    is_deleted BOOLEAN DEFAULT FALSE,

    -- Constraints
    CONSTRAINT valid_reference_link CHECK (reference_link ~* '^https?://'),
    CONSTRAINT valid_rank_score CHECK (rank_score IS NULL OR (rank_score >= 0 AND rank_score <= 100)),
    CONSTRAINT valid_metrics CHECK (
        (velocity IS NULL OR velocity >= 0) AND
        (creation_rate IS NULL OR creation_rate >= 0) AND
        (watchtime IS NULL OR watchtime >= 0)
    )
);

-- Indexes for topics table
CREATE INDEX idx_topics_market_demo ON topics(market, target_demo_gender, target_demo_age);
CREATE INDEX idx_topics_status ON topics(status) WHERE is_deleted = FALSE;
CREATE INDEX idx_topics_rank ON topics(market, target_demo_gender, target_demo_age, rank_score DESC)
    WHERE status = 'active' AND is_deleted = FALSE;
CREATE INDEX idx_topics_created_at ON topics(created_at DESC);
CREATE INDEX idx_topics_expires_at ON topics(expires_at) WHERE status = 'active';
CREATE INDEX idx_topics_source ON topics(source);
CREATE INDEX idx_topics_approved ON topics(approved_at) WHERE approved_by IS NOT NULL;

-- Vector similarity search index (HNSW for fast approximate nearest neighbor)
CREATE INDEX idx_topics_embedding ON topics USING hnsw (embedding vector_cosine_ops)
    WHERE embedding IS NOT NULL;

-- Full-text search index
CREATE INDEX idx_topics_search ON topics USING gin(to_tsvector('english', topic_name || ' ' || description));

-- ============================================================================
-- DUPLICATE DETECTION TABLE
-- ============================================================================

-- Track potential duplicates detected by vector similarity
CREATE TABLE topic_duplicates (
    duplicate_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    topic_id_1 UUID NOT NULL REFERENCES topics(topic_id),
    topic_id_2 UUID NOT NULL REFERENCES topics(topic_id),
    similarity_score FLOAT NOT NULL, -- Cosine similarity (0-1)
    merged BOOLEAN DEFAULT FALSE,
    merged_into UUID REFERENCES topics(topic_id),
    merged_at TIMESTAMP WITH TIME ZONE,
    merged_by VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT different_topics CHECK (topic_id_1 != topic_id_2),
    CONSTRAINT valid_similarity CHECK (similarity_score >= 0 AND similarity_score <= 1)
);

CREATE INDEX idx_duplicates_topic1 ON topic_duplicates(topic_id_1);
CREATE INDEX idx_duplicates_topic2 ON topic_duplicates(topic_id_2);
CREATE INDEX idx_duplicates_unmerged ON topic_duplicates(merged) WHERE merged = FALSE;

-- ============================================================================
-- RANKING CONFIGURATION TABLE
-- ============================================================================

-- Store configurable ranking weights per market/demo
CREATE TABLE ranking_configs (
    config_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    market market_type NOT NULL,
    target_demo_gender gender_type,
    target_demo_age age_group_type,

    -- Weights (must sum to 1.0)
    velocity_weight FLOAT NOT NULL DEFAULT 0.33,
    creation_rate_weight FLOAT NOT NULL DEFAULT 0.33,
    watchtime_weight FLOAT NOT NULL DEFAULT 0.34,

    -- Config metadata
    is_active BOOLEAN DEFAULT TRUE,
    created_by VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    notes TEXT,

    -- Constraints
    CONSTRAINT valid_weights CHECK (
        velocity_weight >= 0 AND velocity_weight <= 1 AND
        creation_rate_weight >= 0 AND creation_rate_weight <= 1 AND
        watchtime_weight >= 0 AND watchtime_weight <= 1 AND
        ABS((velocity_weight + creation_rate_weight + watchtime_weight) - 1.0) < 0.01
    ),

    -- Only one active config per market/demo combination
    CONSTRAINT unique_active_config UNIQUE (market, target_demo_gender, target_demo_age, is_active)
        DEFERRABLE INITIALLY DEFERRED
);

CREATE INDEX idx_ranking_configs_active ON ranking_configs(market, target_demo_gender, target_demo_age)
    WHERE is_active = TRUE;

-- ============================================================================
-- FILE UPLOADS TABLE
-- ============================================================================

-- Track all file uploads from agencies and music team
CREATE TABLE file_uploads (
    upload_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    filename VARCHAR(500) NOT NULL,
    file_size BIGINT,
    file_type VARCHAR(100),
    source source_type NOT NULL,
    market market_type,

    -- Storage
    storage_path TEXT NOT NULL, -- Cloud Storage path
    storage_bucket VARCHAR(255),

    -- Processing status
    status VARCHAR(50) DEFAULT 'uploaded', -- uploaded, processing, completed, failed
    processed_at TIMESTAMP WITH TIME ZONE,
    topics_created INTEGER DEFAULT 0,
    error_message TEXT,

    -- Upload metadata
    uploaded_by VARCHAR(255), -- IP or identifier for agency uploads
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    -- Raw content
    raw_content TEXT, -- Store MD/CSV content
    parsed_data JSONB -- Store parsed structured data
);

CREATE INDEX idx_uploads_source ON file_uploads(source, uploaded_at DESC);
CREATE INDEX idx_uploads_status ON file_uploads(status);
CREATE INDEX idx_uploads_market ON file_uploads(market);

-- ============================================================================
-- REFRESH SCHEDULE TABLE
-- ============================================================================

-- User-configurable refresh schedule per market
CREATE TABLE refresh_schedules (
    schedule_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    market market_type NOT NULL UNIQUE,

    -- Schedule config (cron format: minute hour day month dayofweek)
    cron_expression VARCHAR(100) NOT NULL DEFAULT '0 6 * * 1', -- Monday 6 AM
    timezone VARCHAR(50) NOT NULL, -- e.g., 'Asia/Tokyo', 'Asia/Seoul'

    -- Last run tracking
    last_run_at TIMESTAMP WITH TIME ZONE,
    last_run_status VARCHAR(50), -- success, failed, running
    last_run_topics_processed INTEGER,
    next_run_at TIMESTAMP WITH TIME ZONE,

    -- Config metadata
    is_active BOOLEAN DEFAULT TRUE,
    updated_by VARCHAR(255),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    notes TEXT
);

-- Insert default schedules for all markets
INSERT INTO refresh_schedules (market, cron_expression, timezone, is_active) VALUES
    ('JP', '0 6 * * 1', 'Asia/Tokyo', TRUE),
    ('KR', '0 6 * * 1', 'Asia/Seoul', TRUE),
    ('IN', '0 6 * * 1', 'Asia/Kolkata', TRUE),
    ('ID', '0 6 * * 1', 'Asia/Jakarta', TRUE),
    ('AUNZ', '0 6 * * 1', 'Australia/Sydney', TRUE);

-- ============================================================================
-- USERS TABLE
-- ============================================================================

-- Store user info for internal users (SSO)
CREATE TABLE users (
    user_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) NOT NULL UNIQUE,
    display_name VARCHAR(255),

    -- Role-based access
    role VARCHAR(50) DEFAULT 'viewer', -- admin, manager, viewer
    markets_access market_type[], -- Array of markets user can access

    -- Auth
    firebase_uid VARCHAR(255) UNIQUE,
    last_login_at TIMESTAMP WITH TIME ZONE,

    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_firebase_uid ON users(firebase_uid);

-- ============================================================================
-- AUDIT LOG TABLE
-- ============================================================================

-- Track all significant actions for compliance and debugging
CREATE TABLE audit_logs (
    log_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    -- Actor
    user_id UUID REFERENCES users(user_id),
    user_email VARCHAR(255),
    ip_address INET,

    -- Action
    action VARCHAR(100) NOT NULL, -- e.g., 'topic_approved', 'config_updated', 'upload_completed'
    resource_type VARCHAR(50), -- e.g., 'topic', 'ranking_config', 'file_upload'
    resource_id UUID,

    -- Details
    details JSONB,
    metadata JSONB,

    -- Context
    market market_type,
    source source_type
);

CREATE INDEX idx_audit_logs_timestamp ON audit_logs(timestamp DESC);
CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_resource ON audit_logs(resource_type, resource_id);

-- ============================================================================
-- VIEWS
-- ============================================================================

-- Active topics view (commonly used query)
CREATE VIEW active_topics AS
SELECT
    t.*,
    CONCAT(target_demo_gender::text, ' ', target_demo_age::text) as target_demo
FROM topics t
WHERE t.status = 'active'
  AND t.is_deleted = FALSE
  AND (t.expires_at IS NULL OR t.expires_at > CURRENT_TIMESTAMP);

-- Top 10 topics per market/demo
CREATE VIEW top_10_topics AS
SELECT
    t.*,
    CONCAT(target_demo_gender::text, ' ', target_demo_age::text) as target_demo,
    ROW_NUMBER() OVER (
        PARTITION BY market, target_demo_gender, target_demo_age
        ORDER BY rank_score DESC NULLS LAST, created_at DESC
    ) as rank_within_demo
FROM active_topics t
WHERE rank_score IS NOT NULL;

-- Market summary statistics
CREATE VIEW market_stats AS
SELECT
    market,
    COUNT(*) as total_topics,
    COUNT(*) FILTER (WHERE status = 'active') as active_topics,
    COUNT(*) FILTER (WHERE status = 'approved') as approved_topics,
    COUNT(*) FILTER (WHERE status = 'expired') as expired_topics,
    MAX(created_at) as latest_topic_at,
    AVG(rank_score) FILTER (WHERE status = 'active') as avg_rank_score
FROM topics
WHERE is_deleted = FALSE
GROUP BY market;

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate expiry date (3 weeks from creation)
CREATE OR REPLACE FUNCTION calculate_expiry_date()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.expires_at IS NULL THEN
        NEW.expires_at = NEW.created_at + INTERVAL '3 weeks';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to find similar topics using vector similarity
CREATE OR REPLACE FUNCTION find_similar_topics(
    query_embedding vector(768),
    similarity_threshold FLOAT DEFAULT 0.85,
    max_results INT DEFAULT 10
)
RETURNS TABLE (
    topic_id UUID,
    topic_name VARCHAR,
    similarity FLOAT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        t.topic_id,
        t.topic_name,
        1 - (t.embedding <=> query_embedding) as similarity
    FROM topics t
    WHERE t.embedding IS NOT NULL
      AND t.is_deleted = FALSE
      AND 1 - (t.embedding <=> query_embedding) >= similarity_threshold
    ORDER BY t.embedding <=> query_embedding
    LIMIT max_results;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Update updated_at on topics
CREATE TRIGGER update_topics_updated_at BEFORE UPDATE ON topics
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Calculate expiry date on insert
CREATE TRIGGER calculate_topics_expiry BEFORE INSERT ON topics
    FOR EACH ROW EXECUTE FUNCTION calculate_expiry_date();

-- Update updated_at on ranking_configs
CREATE TRIGGER update_ranking_configs_updated_at BEFORE UPDATE ON ranking_configs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Update updated_at on refresh_schedules
CREATE TRIGGER update_refresh_schedules_updated_at BEFORE UPDATE ON refresh_schedules
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- INITIAL DATA
-- ============================================================================

-- Insert default ranking configurations (equal weights for all markets/demos)
INSERT INTO ranking_configs (market, target_demo_gender, target_demo_age, velocity_weight, creation_rate_weight, watchtime_weight, notes)
SELECT
    m.market,
    g.gender,
    a.age_group,
    0.33,
    0.33,
    0.34,
    'Default equal weight configuration'
FROM
    (SELECT unnest(enum_range(NULL::market_type)) as market) m
    CROSS JOIN
    (SELECT unnest(enum_range(NULL::gender_type)) as gender) g
    CROSS JOIN
    (SELECT unnest(enum_range(NULL::age_group_type)) as age_group) a;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE topics IS 'Main table storing all trending topics with rankings and metadata';
COMMENT ON TABLE topic_duplicates IS 'Tracks potential duplicate topics identified by vector similarity';
COMMENT ON TABLE ranking_configs IS 'Configurable ranking weights per market and demographic';
COMMENT ON TABLE file_uploads IS 'Upload history for agency and music team manual data';
COMMENT ON TABLE refresh_schedules IS 'User-configurable weekly refresh schedule per market';
COMMENT ON TABLE users IS 'Internal users with SSO authentication';
COMMENT ON TABLE audit_logs IS 'Audit trail for all significant system actions';

COMMENT ON COLUMN topics.embedding IS 'Gemini 3.0 embedding vector for semantic similarity search';
COMMENT ON COLUMN topics.expires_at IS 'Auto-calculated: created_at + 3 weeks';
COMMENT ON COLUMN topics.rank_score IS 'Weighted composite score: velocity * w1 + creation_rate * w2 + watchtime * w3';

-- ============================================================================
-- GRANTS (Adjust based on your service accounts)
-- ============================================================================

-- Grant appropriate permissions to application service account
-- GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA public TO 'shorts_intel_hub_app';
-- GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO 'shorts_intel_hub_app';
-- GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO 'shorts_intel_hub_app';
