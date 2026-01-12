# Database Documentation

## Overview

The Shorts Intel Hub uses **Cloud SQL PostgreSQL 15+** with the **pgvector** extension for vector similarity search.

## Schema Design

### Core Tables

#### 1. **topics** - Main data table
Stores all trending topics with rankings and metadata.

**Key Fields:**
- `topic_id` (UUID) - Primary key
- `topic_name`, `description`, `reference_link` - Mandatory schema fields
- `market` - JP/KR/IN/ID/AUNZ
- `target_demo_gender`, `target_demo_age` - Demographic targeting
- `hashtags[]`, `audio` - Optional metadata
- `velocity`, `creation_rate`, `watchtime` - Ranking metrics
- `rank_score`, `rank_position` - Calculated rankings
- `status` - Lifecycle state (raw/processing/active/expired/archived/approved/deleted)
- `embedding` - 768-dim vector for deduplication
- `expires_at` - Auto-calculated (created + 3 weeks)

**Indexes:**
- Composite index on (market, gender, age, rank_score) for fast ranking queries
- HNSW vector index on embedding for similarity search
- Full-text search on topic_name + description
- Status, creation date, expiry date indexes

#### 2. **topic_duplicates** - Duplicate tracking
Tracks potential duplicates identified by vector similarity.

**Key Fields:**
- `topic_id_1`, `topic_id_2` - Pair of similar topics
- `similarity_score` - Cosine similarity (0-1)
- `merged` - Whether duplicates have been merged
- `merged_into` - Final topic after merge

#### 3. **ranking_configs** - Configurable weights
Stores ranking weights per market/demographic.

**Key Fields:**
- `market`, `target_demo_gender`, `target_demo_age` - Scope
- `velocity_weight`, `creation_rate_weight`, `watchtime_weight` - Must sum to 1.0
- `is_active` - Only one active config per market/demo

**Default:** All markets/demos start with equal weights (0.33, 0.33, 0.34)

#### 4. **file_uploads** - Upload tracking
Tracks all agency and music team file uploads.

**Key Fields:**
- `filename`, `file_size`, `file_type`
- `source` - agency/music
- `storage_path` - Cloud Storage location
- `status` - uploaded/processing/completed/failed
- `topics_created` - Number of topics extracted
- `raw_content`, `parsed_data` - File content and parsed structure

#### 5. **refresh_schedules** - Weekly automation
User-configurable refresh schedule per market.

**Key Fields:**
- `market` - One schedule per market
- `cron_expression` - Default: '0 6 * * 1' (Monday 6 AM)
- `timezone` - Market-specific timezone
- `last_run_at`, `next_run_at` - Execution tracking
- `is_active` - Enable/disable per market

**Default Schedules:**
- JP: Monday 6 AM Asia/Tokyo
- KR: Monday 6 AM Asia/Seoul
- IN: Monday 6 AM Asia/Kolkata
- ID: Monday 6 AM Asia/Jakarta
- AUNZ: Monday 6 AM Australia/Sydney

#### 6. **users** - Internal users
Stores user info for Firebase SSO.

**Key Fields:**
- `email`, `display_name`
- `role` - admin/manager/viewer
- `markets_access[]` - Array of accessible markets
- `firebase_uid` - Firebase Auth UID
- `is_active` - Account status

#### 7. **audit_logs** - Audit trail
Tracks all significant system actions.

**Key Fields:**
- `user_id`, `user_email`, `ip_address` - Actor
- `action` - e.g., 'topic_approved', 'config_updated'
- `resource_type`, `resource_id` - What was modified
- `details` - JSONB with action details
- `market`, `source` - Context

### Enums

- **market_type**: JP, KR, IN, ID, AUNZ
- **source_type**: youtube_search, nyan_cat, agency, music
- **topic_status**: raw, processing, active, expired, archived, approved, deleted
- **gender_type**: male, female
- **age_group_type**: 18-24, 25-34, 35-44

### Views

#### **active_topics**
Pre-filtered view of active, non-deleted, non-expired topics.

#### **top_10_topics**
Ranked topics with row_number per market/demo combination.

#### **market_stats**
Aggregated statistics per market (total, active, approved, expired counts).

### Functions

#### **find_similar_topics(embedding, threshold, limit)**
Returns topics with vector similarity above threshold.

**Parameters:**
- `query_embedding` - 768-dim vector to compare
- `similarity_threshold` - Default 0.85 (85% similar)
- `max_results` - Default 10

**Returns:**
- topic_id, topic_name, similarity score

**Usage:**
```sql
SELECT * FROM find_similar_topics(
    '[0.1, 0.2, ...]'::vector(768),
    0.85,
    10
);
```

### Triggers

- **update_updated_at** - Auto-updates `updated_at` timestamp on UPDATE
- **calculate_expiry** - Sets `expires_at` to `created_at + 3 weeks` on INSERT

## Data Lifecycle

### Topic States

```
raw → processing → active → expired → archived
                     ↓
                  approved → sent_to_agent_collective
```

**Flow:**
1. **raw** - Initial upload/ingestion
2. **processing** - AI normalization in progress
3. **active** - Ranked and visible in UI
4. **expired** - >3 weeks old OR negative velocity
5. **archived** - Moved out of active view
6. **approved** - Manager clicked "Approve & Send"
7. **deleted** - >2 years old (with user approval)

### Expiry Rules

**Auto-expire when:**
1. Topic age > 3 weeks from `created_at`
2. Velocity trend turns negative (declining engagement)

**Archival:**
- Expired topics: status → 'archived', `archived_at` set
- Kept in database for historical analysis

**Deletion:**
- Topics > 2 years: Flagged for deletion
- Requires user approval (notification sent)
- Soft delete: `is_deleted = TRUE`, `deleted_at` set

## Vector Search

### Embedding Strategy

**Gemini 3.0** generates 768-dimensional embeddings for each topic.

**Used for:**
- Deduplication (finding similar topics across sources)
- Semantic search
- Topic clustering

**Similarity Threshold:**
- Default: 0.85 (85% similar)
- Configurable per use case

**Index Type:**
- HNSW (Hierarchical Navigable Small World)
- Fast approximate nearest neighbor search
- Trade-off: Speed vs accuracy (good for 10k+ topics)

### Deduplication Flow

1. New topic ingested
2. Generate embedding with Gemini 3.0
3. Search for similar topics using `find_similar_topics()`
4. If similarity > 0.85:
   - Insert record into `topic_duplicates`
   - Flag for manual review or auto-merge
5. Merge: Keep higher-ranked topic, archive duplicate

## Ranking Algorithm

### Score Calculation

```
rank_score = (velocity * w1) + (creation_rate * w2) + (watchtime * w3)
```

**Where:**
- w1, w2, w3 = weights from `ranking_configs` (must sum to 1.0)
- Metrics normalized to 0-100 scale
- Higher score = better ranking

**Default Weights:** 0.33, 0.33, 0.34 (equal)

**Tunable:** Per market, per demographic via `ranking_configs`

### Ranking Per Demo/Market

Each of 30 segments (5 markets × 6 demos) has independent rankings.

**Query Example:**
```sql
SELECT *
FROM top_10_topics
WHERE market = 'JP'
  AND target_demo_gender = 'female'
  AND target_demo_age = '18-24'
  AND rank_within_demo <= 10
ORDER BY rank_score DESC;
```

## Setup Instructions

### 1. Create Cloud SQL Instance

```bash
cd scripts
./setup-db.sh
```

**What it does:**
- Creates Cloud SQL PostgreSQL 15 instance
- Enables pgvector extension
- Sets up backup schedule
- Creates database
- Sets postgres password

### 2. Apply Schema

```bash
./migrate-db.sh
```

**What it does:**
- Applies `schema.sql`
- Creates all tables, indexes, views, functions
- Inserts default data (refresh schedules, ranking configs)

### 3. Local Development with Cloud SQL Proxy

```bash
# Download Cloud SQL Proxy
curl -o cloud-sql-proxy https://storage.googleapis.com/cloud-sql-connectors/cloud-sql-proxy/v2.0.0/cloud-sql-proxy.darwin.amd64
chmod +x cloud-sql-proxy

# Run proxy
./cloud-sql-proxy <PROJECT>:<REGION>:<INSTANCE_NAME>

# Connect from another terminal
psql -h 127.0.0.1 -U postgres -d shorts_intel_hub
```

### 4. Verify Installation

```sql
-- Check tables
\dt

-- Check pgvector extension
SELECT * FROM pg_extension WHERE extname = 'vector';

-- Check default configs
SELECT * FROM ranking_configs LIMIT 5;

-- Check refresh schedules
SELECT * FROM refresh_schedules;
```

## Sample Queries

### Insert a Topic

```sql
INSERT INTO topics (
    topic_name, description, reference_link,
    market, target_demo_gender, target_demo_age,
    source, hashtags, audio,
    velocity, creation_rate, watchtime
) VALUES (
    'K-pop Dance Challenge',
    'Viral dance trend featuring NewJeans choreo',
    'https://youtube.com/watch?v=example',
    'KR', 'female', '18-24',
    'agency',
    ARRAY['#NewJeans', '#DanceChallenge', '#KPop'],
    'NewJeans - OMG',
    85.5, 72.3, 89.1
);
```

### Get Top 10 for Market/Demo

```sql
SELECT
    topic_name,
    description,
    rank_score,
    rank_within_demo,
    hashtags,
    reference_link
FROM top_10_topics
WHERE market = 'JP'
  AND target_demo_gender = 'male'
  AND target_demo_age = '25-34'
  AND rank_within_demo <= 10
ORDER BY rank_score DESC;
```

### Find Duplicates

```sql
SELECT
    t1.topic_name as topic_1,
    t2.topic_name as topic_2,
    d.similarity_score
FROM topic_duplicates d
JOIN topics t1 ON d.topic_id_1 = t1.topic_id
JOIN topics t2 ON d.topic_id_2 = t2.topic_id
WHERE d.merged = FALSE
  AND d.similarity_score > 0.90
ORDER BY d.similarity_score DESC;
```

### Update Ranking Weights

```sql
-- Deactivate current config
UPDATE ranking_configs
SET is_active = FALSE
WHERE market = 'JP'
  AND target_demo_gender = 'female'
  AND target_demo_age = '18-24';

-- Insert new config
INSERT INTO ranking_configs (
    market, target_demo_gender, target_demo_age,
    velocity_weight, creation_rate_weight, watchtime_weight,
    notes
) VALUES (
    'JP', 'female', '18-24',
    0.50, 0.30, 0.20,
    'Prioritize velocity for Gen Z females in Japan'
);
```

### Audit Log Query

```sql
SELECT
    timestamp,
    user_email,
    action,
    resource_type,
    details->>'topic_name' as topic_name
FROM audit_logs
WHERE action = 'topic_approved'
  AND timestamp > CURRENT_TIMESTAMP - INTERVAL '7 days'
ORDER BY timestamp DESC;
```

## Maintenance

### Weekly Tasks

1. **Monitor expired topics**
   ```sql
   SELECT COUNT(*) FROM topics WHERE status = 'expired';
   ```

2. **Archive old topics**
   ```sql
   UPDATE topics
   SET status = 'archived', archived_at = CURRENT_TIMESTAMP
   WHERE status = 'expired'
     AND archived_at IS NULL;
   ```

3. **Flag for deletion (>2 years)**
   ```sql
   SELECT * FROM topics
   WHERE created_at < CURRENT_TIMESTAMP - INTERVAL '2 years'
     AND is_deleted = FALSE;
   ```

### Performance Monitoring

```sql
-- Index usage
SELECT
    schemaname,
    tablename,
    indexname,
    idx_scan,
    idx_tup_read,
    idx_tup_fetch
FROM pg_stat_user_indexes
ORDER BY idx_scan DESC;

-- Table sizes
SELECT
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Slow queries
SELECT
    query,
    calls,
    mean_exec_time,
    max_exec_time
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 20;
```

## Backup & Recovery

**Automated Backups:**
- Daily at 3:00 AM (configured in setup-db.sh)
- Retained for 7 days (configurable)

**Manual Backup:**
```bash
gcloud sql backups create \
    --instance=shorts-intel-hub-db \
    --project=your-project-id
```

**Point-in-Time Recovery:**
```bash
gcloud sql backups restore <BACKUP_ID> \
    --backup-instance=shorts-intel-hub-db \
    --backup-instance-project=your-project-id \
    --instance=shorts-intel-hub-db-restored
```

---

**Database schema ready for Phase 1!** 🚀
