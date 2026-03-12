/**
 * Topic Matching Database Service
 *
 * CRUD operations for consolidated_topics, topic_matches,
 * topic_relations, and matching_runs tables
 */

import { query, transaction } from './connection.js';

// ============================================================================
// CONSOLIDATED TOPICS CRUD
// ============================================================================

/**
 * Create a new consolidated topic
 */
export async function createConsolidatedTopic(data) {
  const {
    consolidatedName,
    consolidatedDescription,
    matchCount = 0,
    internalCount = 0,
    externalCount = 0,
    avgConfidence = 0,
    market
  } = data;

  const queryText = `
    INSERT INTO consolidated_topics (
      consolidated_name,
      consolidated_description,
      match_count,
      internal_count,
      external_count,
      avg_confidence,
      market
    ) VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING *
  `;

  const params = [
    consolidatedName,
    consolidatedDescription,
    matchCount,
    internalCount,
    externalCount,
    avgConfidence,
    market
  ];

  const result = await query(queryText, params);
  return result.rows[0];
}

/**
 * Get all consolidated topics for a market with match details
 */
export async function getConsolidatedTopics(market, status = 'active') {
  const queryText = `
    SELECT
      ct.*,
      COALESCE(
        json_agg(
          json_build_object(
            'match_id', tm.match_id,
            'topic_id', tm.topic_id,
            'source_type', tm.source_type,
            'match_method', tm.match_method,
            'similarity_score', tm.similarity_score,
            'llm_confidence', tm.llm_confidence,
            'llm_classification', tm.llm_classification
          )
        ) FILTER (WHERE tm.match_id IS NOT NULL),
        '[]'::json
      ) AS matches
    FROM consolidated_topics ct
    LEFT JOIN topic_matches tm ON ct.consolidated_id = tm.consolidated_id
    WHERE ct.market = $1
      AND ct.status = $2
    GROUP BY ct.consolidated_id
    ORDER BY ct.rank_score DESC NULLS LAST, ct.created_at DESC
  `;

  const result = await query(queryText, [market, status]);
  return result.rows;
}

/**
 * Update ranking for a consolidated topic
 */
export async function updateConsolidatedTopicRanking(consolidatedId, rankScore, rankPosition) {
  const queryText = `
    UPDATE consolidated_topics
    SET rank_score = $1,
        rank_position = $2,
        updated_at = CURRENT_TIMESTAMP
    WHERE consolidated_id = $3
    RETURNING *
  `;

  const result = await query(queryText, [rankScore, rankPosition, consolidatedId]);

  if (result.rows.length === 0) {
    return null;
  }

  return result.rows[0];
}

// ============================================================================
// TOPIC MATCHES CRUD
// ============================================================================

/**
 * Create a topic match entry
 */
export async function createTopicMatch(data) {
  const {
    consolidatedId,
    topicId,
    sourceType,
    matchMethod,
    similarityScore,
    llmConfidence,
    llmClassification,
    llmExplanation
  } = data;

  const queryText = `
    INSERT INTO topic_matches (
      consolidated_id,
      topic_id,
      source_type,
      match_method,
      similarity_score,
      llm_confidence,
      llm_classification,
      llm_explanation
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    RETURNING *
  `;

  const params = [
    consolidatedId,
    topicId,
    sourceType,
    matchMethod,
    similarityScore,
    llmConfidence,
    llmClassification,
    llmExplanation
  ];

  const result = await query(queryText, params);
  return result.rows[0];
}

/**
 * Get all matches for a consolidated topic
 */
export async function getMatchesForConsolidated(consolidatedId) {
  const queryText = `
    SELECT
      tm.*,
      t.topic_name,
      t.description,
      t.market,
      t.source
    FROM topic_matches tm
    LEFT JOIN topics t ON tm.topic_id = t.topic_id
    WHERE tm.consolidated_id = $1
    ORDER BY tm.similarity_score DESC NULLS LAST
  `;

  const result = await query(queryText, [consolidatedId]);
  return result.rows;
}

/**
 * Check if a topic is already part of a match group
 */
export async function getMatchesForTopic(topicId) {
  const queryText = `
    SELECT
      tm.*,
      ct.consolidated_name,
      ct.consolidated_description,
      ct.market
    FROM topic_matches tm
    LEFT JOIN consolidated_topics ct ON tm.consolidated_id = ct.consolidated_id
    WHERE tm.topic_id = $1
  `;

  const result = await query(queryText, [topicId]);
  return result.rows;
}

// ============================================================================
// TOPIC RELATIONS CRUD
// ============================================================================

/**
 * Create a topic relation
 */
export async function createTopicRelation(data) {
  const {
    topicId1,
    topicId2,
    relationship,
    confidence,
    explanation,
    matchMethod,
    similarityScore
  } = data;

  const queryText = `
    INSERT INTO topic_relations (
      topic_id_1,
      topic_id_2,
      relationship,
      confidence,
      explanation,
      match_method,
      similarity_score
    ) VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING *
  `;

  const params = [
    topicId1,
    topicId2,
    relationship,
    confidence,
    explanation,
    matchMethod,
    similarityScore
  ];

  const result = await query(queryText, params);
  return result.rows[0];
}

/**
 * Get all topics related to the given topic (checks both directions)
 */
export async function getRelatedTopics(topicId) {
  const queryText = `
    SELECT
      tr.*,
      CASE
        WHEN tr.topic_id_1 = $1 THEN t2.topic_name
        ELSE t1.topic_name
      END AS related_topic_name,
      CASE
        WHEN tr.topic_id_1 = $1 THEN t2.topic_id
        ELSE t1.topic_id
      END AS related_topic_id,
      CASE
        WHEN tr.topic_id_1 = $1 THEN t2.description
        ELSE t1.description
      END AS related_topic_description
    FROM topic_relations tr
    LEFT JOIN topics t1 ON tr.topic_id_1 = t1.topic_id
    LEFT JOIN topics t2 ON tr.topic_id_2 = t2.topic_id
    WHERE tr.topic_id_1 = $1 OR tr.topic_id_2 = $1
    ORDER BY tr.confidence DESC NULLS LAST
  `;

  const result = await query(queryText, [topicId]);
  return result.rows;
}

// ============================================================================
// MATCHING RUNS (AUDIT)
// ============================================================================

/**
 * Create a new matching run record
 */
export async function createMatchingRun(data) {
  const {
    market,
    internalTopicCount,
    externalTopicCount
  } = data;

  const queryText = `
    INSERT INTO matching_runs (
      market,
      internal_topic_count,
      external_topic_count,
      status
    ) VALUES ($1, $2, $3, 'running')
    RETURNING *
  `;

  const result = await query(queryText, [market, internalTopicCount, externalTopicCount]);
  return result.rows[0];
}

/**
 * Mark a matching run as completed with results
 */
export async function completeMatchingRun(runId, results) {
  const {
    totalPairsAnalyzed,
    stage1Matches,
    stage2Matches,
    relatedFlags,
    matchedTopicsCount,
    internalOnlyCount,
    externalOnlyCount,
    processingTimeMs
  } = results;

  const queryText = `
    UPDATE matching_runs
    SET status = 'completed',
        total_pairs_analyzed = $1,
        stage1_matches = $2,
        stage2_matches = $3,
        related_flags = $4,
        matched_topics_count = $5,
        internal_only_count = $6,
        external_only_count = $7,
        processing_time_ms = $8,
        completed_at = CURRENT_TIMESTAMP
    WHERE run_id = $9
    RETURNING *
  `;

  const params = [
    totalPairsAnalyzed,
    stage1Matches,
    stage2Matches,
    relatedFlags,
    matchedTopicsCount,
    internalOnlyCount,
    externalOnlyCount,
    processingTimeMs,
    runId
  ];

  const result = await query(queryText, params);

  if (result.rows.length === 0) {
    return null;
  }

  return result.rows[0];
}

/**
 * Mark a matching run as failed
 */
export async function failMatchingRun(runId, errorMessage) {
  const queryText = `
    UPDATE matching_runs
    SET status = 'failed',
        error_message = $1,
        completed_at = CURRENT_TIMESTAMP
    WHERE run_id = $2
    RETURNING *
  `;

  const result = await query(queryText, [errorMessage, runId]);

  if (result.rows.length === 0) {
    return null;
  }

  return result.rows[0];
}

// ============================================================================
// TRACK ASSIGNMENT
// ============================================================================

/**
 * Assign a topic to a data track (internal, external, or matched)
 */
export async function assignTopicTrack(topicId, track) {
  const queryText = `
    UPDATE topics
    SET data_track = $1,
        updated_at = CURRENT_TIMESTAMP
    WHERE topic_id = $2
      AND is_deleted = FALSE
    RETURNING *
  `;

  const result = await query(queryText, [track, topicId]);

  if (result.rows.length === 0) {
    return null;
  }

  return result.rows[0];
}

/**
 * Get topics filtered by data track and market
 */
export async function getTopicsByTrack(market, track, status = 'active') {
  const queryText = `
    SELECT
      t.*,
      CONCAT(t.target_demo_gender::text, ' ', t.target_demo_age::text) AS target_demo
    FROM topics t
    WHERE t.market = $1
      AND t.data_track = $2
      AND t.status = $3
      AND t.is_deleted = FALSE
    ORDER BY t.rank_score DESC NULLS LAST, t.created_at DESC
  `;

  const result = await query(queryText, [market, track, status]);
  return result.rows;
}

// ============================================================================
// THREE-TRACK DATA RETRIEVAL
// ============================================================================

/**
 * Get the full three-track data structure for a market
 * Returns internal track, center (matched) track, and external track
 */
export async function getThreeTrackData(market) {
  // Internal track: topics with data_track = 'internal' + related topics
  const internalQuery = `
    SELECT
      t.*,
      CONCAT(t.target_demo_gender::text, ' ', t.target_demo_age::text) AS target_demo,
      COALESCE(
        json_agg(
          json_build_object(
            'relation_id', tr.relation_id,
            'related_topic_id', CASE WHEN tr.topic_id_1 = t.topic_id THEN tr.topic_id_2 ELSE tr.topic_id_1 END,
            'relationship', tr.relationship,
            'confidence', tr.confidence
          )
        ) FILTER (WHERE tr.relation_id IS NOT NULL),
        '[]'::json
      ) AS related_topics
    FROM topics t
    LEFT JOIN topic_relations tr
      ON (tr.topic_id_1 = t.topic_id OR tr.topic_id_2 = t.topic_id)
    WHERE t.market = $1
      AND t.data_track = 'internal'
      AND t.status = 'active'
      AND t.is_deleted = FALSE
    GROUP BY t.topic_id
    ORDER BY t.rank_score DESC NULLS LAST, t.created_at DESC
  `;

  // Center track: consolidated topics with all match details
  const centerQuery = `
    SELECT
      ct.*,
      COALESCE(
        json_agg(
          json_build_object(
            'match_id', tm.match_id,
            'topic_id', tm.topic_id,
            'source_type', tm.source_type,
            'match_method', tm.match_method,
            'similarity_score', tm.similarity_score,
            'llm_confidence', tm.llm_confidence,
            'llm_classification', tm.llm_classification,
            'llm_explanation', tm.llm_explanation,
            'topic_name', t.topic_name,
            'topic_description', t.description
          )
        ) FILTER (WHERE tm.match_id IS NOT NULL),
        '[]'::json
      ) AS matches
    FROM consolidated_topics ct
    LEFT JOIN topic_matches tm ON ct.consolidated_id = tm.consolidated_id
    LEFT JOIN topics t ON tm.topic_id = t.topic_id
    WHERE ct.market = $1
      AND ct.status = 'active'
    GROUP BY ct.consolidated_id
    ORDER BY ct.rank_score DESC NULLS LAST, ct.created_at DESC
  `;

  // External track: topics with data_track = 'external' + related topics
  const externalQuery = `
    SELECT
      t.*,
      CONCAT(t.target_demo_gender::text, ' ', t.target_demo_age::text) AS target_demo,
      COALESCE(
        json_agg(
          json_build_object(
            'relation_id', tr.relation_id,
            'related_topic_id', CASE WHEN tr.topic_id_1 = t.topic_id THEN tr.topic_id_2 ELSE tr.topic_id_1 END,
            'relationship', tr.relationship,
            'confidence', tr.confidence
          )
        ) FILTER (WHERE tr.relation_id IS NOT NULL),
        '[]'::json
      ) AS related_topics
    FROM topics t
    LEFT JOIN topic_relations tr
      ON (tr.topic_id_1 = t.topic_id OR tr.topic_id_2 = t.topic_id)
    WHERE t.market = $1
      AND t.data_track = 'external'
      AND t.status = 'active'
      AND t.is_deleted = FALSE
    GROUP BY t.topic_id
    ORDER BY t.rank_score DESC NULLS LAST, t.created_at DESC
  `;

  const [internalResult, centerResult, externalResult] = await Promise.all([
    query(internalQuery, [market]),
    query(centerQuery, [market]),
    query(externalQuery, [market])
  ]);

  return {
    internalTrack: internalResult.rows,
    centerTrack: centerResult.rows,
    externalTrack: externalResult.rows
  };
}
