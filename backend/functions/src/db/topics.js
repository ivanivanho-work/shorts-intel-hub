/**
 * Topics Database Service
 *
 * CRUD operations for topics table
 */

import { query, transaction } from './connection.js';

/**
 * Get topics with filters and pagination
 */
export async function getTopics(filters = {}) {
  const {
    market,
    gender,
    age,
    status = 'active',
    limit = 50,
    offset = 0,
    sort = 'rank_score',
    order = 'desc',
    search
  } = filters;

  let whereConditions = ['is_deleted = FALSE'];
  const params = [];
  let paramCounter = 1;

  // Add filters
  if (market) {
    params.push(market);
    whereConditions.push(`market = $${paramCounter++}`);
  }

  if (gender) {
    params.push(gender);
    whereConditions.push(`target_demo_gender = $${paramCounter++}`);
  }

  if (age) {
    params.push(age);
    whereConditions.push(`target_demo_age = $${paramCounter++}`);
  }

  if (status) {
    params.push(status);
    whereConditions.push(`status = $${paramCounter++}`);
  }

  if (search) {
    params.push(`%${search}%`);
    whereConditions.push(`(topic_name ILIKE $${paramCounter++} OR description ILIKE $${paramCounter - 1})`);
  }

  // Build query
  const whereClause = whereConditions.join(' AND ');
  const orderByClause = `${sort} ${order.toUpperCase()} NULLS LAST`;

  const queryText = `
    SELECT
      topic_id,
      topic_name,
      description,
      reference_link,
      market,
      target_demo_gender,
      target_demo_age,
      CONCAT(target_demo_gender::text, ' ', target_demo_age::text) as target_demo,
      source,
      hashtags,
      audio,
      velocity,
      creation_rate,
      watchtime,
      rank_score,
      rank_position,
      status,
      created_at,
      updated_at,
      expires_at,
      approved_by,
      approved_at
    FROM topics
    WHERE ${whereClause}
    ORDER BY ${orderByClause}
    LIMIT $${paramCounter++}
    OFFSET $${paramCounter++}
  `;

  params.push(limit, offset);

  const result = await query(queryText, params);

  // Get total count
  const countQuery = `
    SELECT COUNT(*) as total
    FROM topics
    WHERE ${whereClause}
  `;

  const countResult = await query(countQuery, params.slice(0, -2)); // Remove limit and offset

  return {
    topics: result.rows,
    pagination: {
      limit,
      offset,
      total: parseInt(countResult.rows[0].total)
    }
  };
}

/**
 * Get top 10 topics for specific market/demo
 */
export async function getTop10Topics(market, gender, age) {
  const queryText = `
    SELECT *
    FROM top_10_topics
    WHERE market = $1
      AND target_demo_gender = $2
      AND target_demo_age = $3
      AND rank_within_demo <= 10
    ORDER BY rank_score DESC
  `;

  const result = await query(queryText, [market, gender, age]);

  return result.rows;
}

/**
 * Get single topic by ID
 */
export async function getTopicById(topicId) {
  const queryText = `
    SELECT
      t.*,
      CONCAT(target_demo_gender::text, ' ', target_demo_age::text) as target_demo,
      u.email as approved_by_email,
      u.display_name as approved_by_name
    FROM topics t
    LEFT JOIN users u ON t.approved_by = u.email
    WHERE t.topic_id = $1
      AND t.is_deleted = FALSE
  `;

  const result = await query(queryText, [topicId]);

  if (result.rows.length === 0) {
    return null;
  }

  return result.rows[0];
}

/**
 * Create new topic
 */
export async function createTopic(topicData) {
  const {
    topicName,
    description,
    referenceLink,
    market,
    gender,
    age,
    source,
    hashtags = [],
    audio = null,
    velocity = null,
    creationRate = null,
    watchtime = null,
    rawData = null
  } = topicData;

  const queryText = `
    INSERT INTO topics (
      topic_name,
      description,
      reference_link,
      market,
      target_demo_gender,
      target_demo_age,
      source,
      hashtags,
      audio,
      velocity,
      creation_rate,
      watchtime,
      raw_data,
      status
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, 'raw')
    RETURNING *
  `;

  const params = [
    topicName,
    description,
    referenceLink,
    market,
    gender,
    age,
    source,
    hashtags,
    audio,
    velocity,
    creationRate,
    watchtime,
    rawData ? JSON.stringify(rawData) : null
  ];

  const result = await query(queryText, params);

  return result.rows[0];
}

/**
 * Update topic
 */
export async function updateTopic(topicId, updates) {
  const allowedFields = [
    'topic_name',
    'description',
    'reference_link',
    'hashtags',
    'audio',
    'velocity',
    'creation_rate',
    'watchtime',
    'rank_score',
    'rank_position',
    'status',
    'normalized_data'
  ];

  const setStatements = [];
  const params = [];
  let paramCounter = 1;

  Object.entries(updates).forEach(([key, value]) => {
    if (allowedFields.includes(key)) {
      params.push(value);
      setStatements.push(`${key} = $${paramCounter++}`);
    }
  });

  if (setStatements.length === 0) {
    throw new Error('No valid fields to update');
  }

  params.push(topicId);

  const queryText = `
    UPDATE topics
    SET ${setStatements.join(', ')},
        updated_at = CURRENT_TIMESTAMP
    WHERE topic_id = $${paramCounter}
      AND is_deleted = FALSE
    RETURNING *
  `;

  const result = await query(queryText, params);

  if (result.rows.length === 0) {
    return null;
  }

  return result.rows[0];
}

/**
 * Approve topic and mark for Agent Collective
 */
export async function approveTopic(topicId, approvedBy) {
  return transaction(async (client) => {
    // Update topic
    const updateQuery = `
      UPDATE topics
      SET status = 'approved',
          approved_by = $1,
          approved_at = CURRENT_TIMESTAMP,
          sent_to_agent_collective = TRUE,
          sent_at = CURRENT_TIMESTAMP,
          updated_at = CURRENT_TIMESTAMP
      WHERE topic_id = $2
        AND is_deleted = FALSE
        AND status = 'active'
      RETURNING *
    `;

    const updateResult = await client.query(updateQuery, [approvedBy, topicId]);

    if (updateResult.rows.length === 0) {
      throw new Error('Topic not found or not in active status');
    }

    const topic = updateResult.rows[0];

    // Log to audit trail
    const auditQuery = `
      INSERT INTO audit_logs (
        user_email,
        action,
        resource_type,
        resource_id,
        details,
        market,
        source
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
    `;

    await client.query(auditQuery, [
      approvedBy,
      'topic_approved',
      'topic',
      topicId,
      JSON.stringify({
        topicName: topic.topic_name,
        market: topic.market,
        demo: `${topic.target_demo_gender} ${topic.target_demo_age}`
      }),
      topic.market,
      topic.source
    ]);

    return topic;
  });
}

/**
 * Archive expired topics
 */
export async function archiveExpiredTopics() {
  const queryText = `
    UPDATE topics
    SET status = 'archived',
        archived_at = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP
    WHERE status = 'active'
      AND (
        expires_at < CURRENT_TIMESTAMP
        OR (velocity IS NOT NULL AND velocity < 0)
      )
      AND is_deleted = FALSE
    RETURNING topic_id, topic_name, market
  `;

  const result = await query(queryText);

  return result.rows;
}

/**
 * Soft delete old topics (>2 years)
 */
export async function markOldTopicsForDeletion() {
  const queryText = `
    SELECT
      topic_id,
      topic_name,
      market,
      created_at
    FROM topics
    WHERE created_at < CURRENT_TIMESTAMP - INTERVAL '2 years'
      AND is_deleted = FALSE
      AND status IN ('archived', 'expired')
  `;

  const result = await query(queryText);

  return result.rows;
}

/**
 * Soft delete topic
 */
export async function softDeleteTopic(topicId, deletedBy) {
  return transaction(async (client) => {
    const updateQuery = `
      UPDATE topics
      SET is_deleted = TRUE,
          deleted_at = CURRENT_TIMESTAMP,
          updated_at = CURRENT_TIMESTAMP
      WHERE topic_id = $1
      RETURNING *
    `;

    const result = await client.query(updateQuery, [topicId]);

    if (result.rows.length === 0) {
      throw new Error('Topic not found');
    }

    // Log audit
    const auditQuery = `
      INSERT INTO audit_logs (
        user_email,
        action,
        resource_type,
        resource_id,
        details
      ) VALUES ($1, $2, $3, $4, $5)
    `;

    await client.query(auditQuery, [
      deletedBy,
      'topic_deleted',
      'topic',
      topicId,
      JSON.stringify({ topicName: result.rows[0].topic_name })
    ]);

    return result.rows[0];
  });
}

/**
 * Find similar topics using vector search
 */
export async function findSimilarTopics(embedding, threshold = 0.85, limit = 10) {
  const queryText = `
    SELECT * FROM find_similar_topics($1::vector, $2, $3)
  `;

  const result = await query(queryText, [
    `[${embedding.join(',')}]`,
    threshold,
    limit
  ]);

  return result.rows;
}

/**
 * Get topic statistics by market
 */
export async function getTopicStats(market = null) {
  let queryText = `SELECT * FROM market_stats`;
  const params = [];

  if (market) {
    queryText += ` WHERE market = $1`;
    params.push(market);
  }

  const result = await query(queryText, params);

  return market ? result.rows[0] : result.rows;
}
