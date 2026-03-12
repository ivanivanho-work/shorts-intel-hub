-- ============================================================================
-- Migration: Add ranking metric fields for IRS/ERS calculations
-- ============================================================================
--
-- PREREQUISITE: Run AFTER migration-topic-matching.sql
--
-- This migration adds the data columns needed by the ranking engine
-- (ranking-engine.js) to the topics and consolidated_topics tables.
-- These fields store the metrics from CSV uploads and internal data
-- pipelines that feed into IRS, ERS, and combined scoring.
--
-- ============================================================================

BEGIN;

-- ============================================================================
-- 1. INTERNAL (IRS) METRIC FIELDS — topics table
-- ============================================================================

-- Watch time in hours over the last 7 days (performance base input)
ALTER TABLE topics ADD COLUMN IF NOT EXISTS watch_time_hour_7d FLOAT DEFAULT 0;

-- Engagement rate over the last 7 days (performance base input)
ALTER TABLE topics ADD COLUMN IF NOT EXISTS engagement_7d FLOAT DEFAULT 0;

-- Total views in the last 7 days (reach efficiency, avg daily views)
ALTER TABLE topics ADD COLUMN IF NOT EXISTS views_7d FLOAT DEFAULT 0;

-- Views in the last 1 day (current momentum for predictive velocity)
ALTER TABLE topics ADD COLUMN IF NOT EXISTS views_1d FLOAT DEFAULT 0;

-- Subscriber/follower count at time of publish (reach efficiency denominator)
ALTER TABLE topics ADD COLUMN IF NOT EXISTS total_followers_at_publish INTEGER DEFAULT 0;

-- Days since the content was published (freshness decay input)
ALTER TABLE topics ADD COLUMN IF NOT EXISTS days_since_published INTEGER DEFAULT 0;

-- Visual quality score 0-1 (quality gate input)
ALTER TABLE topics ADD COLUMN IF NOT EXISTS visual_quality_score FLOAT DEFAULT 0.5;

-- Audio quality score 0-1 (quality gate input)
ALTER TABLE topics ADD COLUMN IF NOT EXISTS audio_quality_score FLOAT DEFAULT 0.5;

-- Actual watch time in hours (stickiness numerator)
ALTER TABLE topics ADD COLUMN IF NOT EXISTS watch_time_hour FLOAT DEFAULT 0;

-- Potential watch time in hours (stickiness denominator)
ALTER TABLE topics ADD COLUMN IF NOT EXISTS potential_watch_time_hour FLOAT DEFAULT 0;

-- Linear regression 7-day prediction (predictive velocity multiplier)
ALTER TABLE topics ADD COLUMN IF NOT EXISTS linear_reg_7d_pred FLOAT DEFAULT 1.0;

-- Lifetime uploads using Shorts Creation Tools (tools booster threshold)
ALTER TABLE topics ADD COLUMN IF NOT EXISTS shorts_creation_tools_uploads_lifetime INTEGER DEFAULT 0;

-- Creator country code(s), comma-separated (geo booster input)
ALTER TABLE topics ADD COLUMN IF NOT EXISTS creator_country_code VARCHAR(255) DEFAULT '';

-- Downstream uploads inspired by this topic in last 7 days
ALTER TABLE topics ADD COLUMN IF NOT EXISTS downstream_uploads_7d INTEGER DEFAULT 0;

-- ============================================================================
-- 2. EXTERNAL (ERS) METRIC FIELDS — topics table
-- ============================================================================

-- Total view count (impact score, velocity score input)
ALTER TABLE topics ADD COLUMN IF NOT EXISTS views_total INTEGER DEFAULT 0;

-- Like count (engagement rate for impact score)
ALTER TABLE topics ADD COLUMN IF NOT EXISTS likes INTEGER DEFAULT 0;

-- Comment count (engagement rate for impact score)
ALTER TABLE topics ADD COLUMN IF NOT EXISTS comments INTEGER DEFAULT 0;

-- Creator subscriber count (velocity score denominator)
ALTER TABLE topics ADD COLUMN IF NOT EXISTS creator_subscriber_count INTEGER DEFAULT 0;

-- Brand safety flag — false blocks the topic entirely (ERS gate)
ALTER TABLE topics ADD COLUMN IF NOT EXISTS brand_safe BOOLEAN DEFAULT TRUE;

-- User sentiment classification (ERS gate: 'Negative' blocks)
ALTER TABLE topics ADD COLUMN IF NOT EXISTS user_sentiment VARCHAR(20) DEFAULT 'Neutral';

-- Number of creations/videos for this topic (participation score)
ALTER TABLE topics ADD COLUMN IF NOT EXISTS creation_volume INTEGER DEFAULT 1;

-- Creation complexity level: Low, Medium, High (participation + replicability)
ALTER TABLE topics ADD COLUMN IF NOT EXISTS creation_complexity VARCHAR(10) DEFAULT 'Medium';

-- Comma-separated list of platforms where the topic is trending (distribution)
ALTER TABLE topics ADD COLUMN IF NOT EXISTS platforms_trending VARCHAR(500) DEFAULT '';

-- Date the topic/video was originally published (freshness, acceleration)
ALTER TABLE topics ADD COLUMN IF NOT EXISTS publication_date DATE;

-- Date the topic was first identified as trending
ALTER TABLE topics ADD COLUMN IF NOT EXISTS date_identified DATE;

-- Comma-separated list of markets where the topic is trending (market booster)
ALTER TABLE topics ADD COLUMN IF NOT EXISTS primary_markets VARCHAR(500) DEFAULT '';

-- Trend scale classification: Creator-Led, Viewer-Led, etc.
ALTER TABLE topics ADD COLUMN IF NOT EXISTS trend_scale VARCHAR(20) DEFAULT '';

-- Shorts video published date (alternative publication date source)
ALTER TABLE topics ADD COLUMN IF NOT EXISTS shorts_video_published_date DATE;

-- ============================================================================
-- 3. RANKING OUTPUT FIELDS — topics table
-- ============================================================================
-- These may already exist from schema.sql but we ensure they are present.

ALTER TABLE topics ADD COLUMN IF NOT EXISTS rank_score FLOAT;
ALTER TABLE topics ADD COLUMN IF NOT EXISTS rank_position INTEGER;

-- ============================================================================
-- 4. SCORING FIELDS — consolidated_topics table (center track)
-- ============================================================================

-- Individual IRS score for the matched topic's internal component
ALTER TABLE consolidated_topics ADD COLUMN IF NOT EXISTS irs_score FLOAT;

-- Individual ERS score for the matched topic's external component
ALTER TABLE consolidated_topics ADD COLUMN IF NOT EXISTS ers_score FLOAT;

-- Weighted combined score: IRS * 0.8 + ERS * 0.2
ALTER TABLE consolidated_topics ADD COLUMN IF NOT EXISTS combined_score FLOAT;

-- ============================================================================
-- 5. INDEXES
-- ============================================================================

-- Index for previous week lookups used by the ranking engine's
-- getPreviousWeekData() function. Filters on active, non-deleted topics
-- and sorts by created_at DESC for efficient range scans on the 7-14 day window.
CREATE INDEX IF NOT EXISTS idx_topics_prev_week
    ON topics(market, data_track, created_at DESC)
    WHERE status = 'active' AND is_deleted = FALSE;

COMMIT;
