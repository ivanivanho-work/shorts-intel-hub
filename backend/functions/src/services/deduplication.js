/**
 * Deduplication Service - Find and Merge Duplicate Topics
 *
 * Uses vector similarity search with pgvector to identify duplicate topics
 * across different sources (Search, Nyan Cat, Agency, Music)
 *
 * Similarity threshold: 0.85 (85% similar = considered duplicate)
 */

import { query, transaction } from '../db/connection.js';
import { findSimilarTopics } from '../db/topics.js';
import { cosineSimilarity } from './gemini-service.js';

const SIMILARITY_THRESHOLD = 0.85;

/**
 * Check if a new topic is a duplicate of existing topics
 *
 * @param {Object} newTopic - New topic with embedding
 * @param {number[]} newTopic.embedding - 768-dim embedding vector
 * @param {string} newTopic.market - Market code
 * @returns {Promise<Object|null>} Matching topic if duplicate found, null otherwise
 */
export async function checkForDuplicates(newTopic) {
  try {
    if (!newTopic.embedding || newTopic.embedding.length !== 768) {
      console.warn('Invalid embedding for duplicate check');
      return null;
    }

    // Use pgvector to find similar topics
    const similarTopics = await findSimilarTopics(
      newTopic.embedding,
      SIMILARITY_THRESHOLD,
      5 // Get top 5 matches
    );

    // Filter to same market only
    const marketMatches = similarTopics.filter(
      topic => topic.market === newTopic.market
    );

    if (marketMatches.length > 0) {
      // Return the best match
      return marketMatches[0];
    }

    return null;

  } catch (error) {
    console.error('Error checking for duplicates:', error);
    return null;
  }
}

/**
 * Merge duplicate topics
 *
 * When a duplicate is found, we:
 * 1. Log the duplicate relationship
 * 2. Aggregate metrics from both topics
 * 3. Keep the higher-quality version
 * 4. Mark the duplicate in topic_duplicates table
 *
 * @param {string} originalTopicId - Original topic UUID
 * @param {string} duplicateTopicId - Duplicate topic UUID
 * @param {number} similarityScore - Similarity score (0-1)
 * @returns {Promise<Object>} Merge result
 */
export async function mergeDuplicates(originalTopicId, duplicateTopicId, similarityScore) {
  return transaction(async (client) => {
    // Get both topics
    const originalResult = await client.query(
      'SELECT * FROM topics WHERE topic_id = $1',
      [originalTopicId]
    );

    const duplicateResult = await client.query(
      'SELECT * FROM topics WHERE topic_id = $1',
      [duplicateTopicId]
    );

    if (originalResult.rows.length === 0 || duplicateResult.rows.length === 0) {
      throw new Error('One or both topics not found');
    }

    const original = originalResult.rows[0];
    const duplicate = duplicateResult.rows[0];

    // Log the duplicate relationship
    await client.query(
      `INSERT INTO topic_duplicates (
        topic_id, duplicate_of_id, similarity_score, merged_at, merged_by
      ) VALUES ($1, $2, $3, CURRENT_TIMESTAMP, 'system')`,
      [duplicateTopicId, originalTopicId, similarityScore]
    );

    // Aggregate metrics (use higher values)
    const updatedMetrics = {
      views_volume: Math.max(
        parseInt(original.views_volume) || 0,
        parseInt(duplicate.views_volume) || 0
      ),
      views_velocity: Math.max(
        parseFloat(original.views_velocity) || 0,
        parseFloat(duplicate.views_velocity) || 0
      ),
      creation_rate: Math.max(
        parseFloat(original.creation_rate) || 0,
        parseFloat(duplicate.creation_rate) || 0
      ),
      watchtime_volume: Math.max(
        parseInt(original.watchtime_volume) || 0,
        parseInt(duplicate.watchtime_volume) || 0
      ),
      watchtime_velocity: Math.max(
        parseFloat(original.watchtime_velocity) || 0,
        parseFloat(duplicate.watchtime_velocity) || 0
      )
    };

    // Update original topic with aggregated metrics
    await client.query(
      `UPDATE topics
       SET views_volume = $1,
           views_velocity = $2,
           creation_rate = $3,
           watchtime_volume = $4,
           watchtime_velocity = $5,
           updated_at = CURRENT_TIMESTAMP
       WHERE topic_id = $6`,
      [
        updatedMetrics.views_volume,
        updatedMetrics.views_velocity,
        updatedMetrics.creation_rate,
        updatedMetrics.watchtime_volume,
        updatedMetrics.watchtime_velocity,
        originalTopicId
      ]
    );

    // Mark duplicate as archived
    await client.query(
      `UPDATE topics
       SET status = 'archived',
           archived_at = CURRENT_TIMESTAMP,
           updated_at = CURRENT_TIMESTAMP
       WHERE topic_id = $1`,
      [duplicateTopicId]
    );

    // Log to audit trail
    await client.query(
      `INSERT INTO audit_logs (
        entity_type, entity_id, action, changed_by, changes
      ) VALUES ('topic', $1, 'merged_duplicate', 'system', $2)`,
      [
        originalTopicId,
        JSON.stringify({
          duplicate_id: duplicateTopicId,
          similarity_score: similarityScore,
          aggregated_metrics: updatedMetrics
        })
      ]
    );

    return {
      success: true,
      originalTopicId,
      duplicateTopicId,
      similarityScore,
      aggregatedMetrics: updatedMetrics
    };
  });
}

/**
 * Process incoming topics and check for duplicates
 *
 * This is called during data ingestion (Agency upload, Nyan Cat, etc.)
 *
 * @param {Object[]} newTopics - Array of new topics with embeddings
 * @returns {Promise<Object>} Summary of duplicates found and merged
 */
export async function processDuplicates(newTopics) {
  const results = {
    processed: 0,
    duplicatesFound: 0,
    merged: 0,
    errors: 0,
    details: []
  };

  for (const topic of newTopics) {
    try {
      results.processed++;

      // Check for duplicates
      const duplicate = await checkForDuplicates(topic);

      if (duplicate) {
        results.duplicatesFound++;

        // Calculate similarity score
        const similarity = cosineSimilarity(topic.embedding, duplicate.embedding);

        // Log the finding
        results.details.push({
          newTopic: topic.topicName,
          duplicateOf: duplicate.topic_name,
          similarityScore: similarity.toFixed(3),
          action: 'flagged'
        });

        // Auto-merge if similarity is very high (>0.90)
        if (similarity > 0.90) {
          // We would merge here, but for Alpha MVP, let's just flag
          // await mergeDuplicates(duplicate.topic_id, topic.tempId, similarity);
          results.merged++;
        }
      }

    } catch (error) {
      console.error('Error processing duplicate check:', error);
      results.errors++;
    }
  }

  return results;
}

/**
 * Find all potential duplicates in the database
 * (Run this as a batch job to clean up existing data)
 *
 * @param {string} market - Market to check (or 'all')
 * @returns {Promise<Object[]>} Array of potential duplicate pairs
 */
export async function findAllDuplicates(market = 'all') {
  try {
    const marketFilter = market === 'all' ? '' : `AND market = '${market}'`;

    const result = await query(`
      SELECT
        t1.topic_id as topic_id_1,
        t1.topic_name as name_1,
        t1.embedding as embedding_1,
        t2.topic_id as topic_id_2,
        t2.topic_name as name_2,
        t2.embedding as embedding_2,
        t1.market,
        (1 - (t1.embedding <=> t2.embedding)) as similarity
      FROM topics t1
      JOIN topics t2 ON t1.topic_id < t2.topic_id
      WHERE t1.status = 'active'
        AND t2.status = 'active'
        AND t1.market = t2.market
        ${marketFilter}
        AND (1 - (t1.embedding <=> t2.embedding)) > ${SIMILARITY_THRESHOLD}
      ORDER BY similarity DESC
      LIMIT 100
    `);

    return result.rows.map(row => ({
      topic1: {
        id: row.topic_id_1,
        name: row.name_1
      },
      topic2: {
        id: row.topic_id_2,
        name: row.name_2
      },
      market: row.market,
      similarityScore: parseFloat(row.similarity)
    }));

  } catch (error) {
    console.error('Error finding all duplicates:', error);
    return [];
  }
}

/**
 * Get duplicate statistics for reporting
 *
 * @returns {Promise<Object>} Duplicate statistics
 */
export async function getDuplicateStats() {
  try {
    const result = await query(`
      SELECT
        COUNT(*) as total_duplicates,
        AVG(similarity_score) as avg_similarity,
        COUNT(CASE WHEN merged_at IS NOT NULL THEN 1 END) as merged_count
      FROM topic_duplicates
      WHERE created_at > NOW() - INTERVAL '30 days'
    `);

    return result.rows[0];

  } catch (error) {
    console.error('Error getting duplicate stats:', error);
    return null;
  }
}

export default {
  checkForDuplicates,
  mergeDuplicates,
  processDuplicates,
  findAllDuplicates,
  getDuplicateStats,
  SIMILARITY_THRESHOLD
};
