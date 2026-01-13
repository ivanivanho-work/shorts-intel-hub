/**
 * Ranking Configuration Service
 *
 * Manages ranking weights and score calculations
 */

import { query, transaction } from './connection.js';

/**
 * Get ranking configurations
 */
export async function getRankingConfigs(filters = {}) {
  const { market, gender, age } = filters;

  let whereConditions = ['is_active = TRUE'];
  const params = [];
  let paramCounter = 1;

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

  const queryText = `
    SELECT
      config_id,
      market,
      target_demo_gender,
      target_demo_age,
      CONCAT(target_demo_gender::text, ' ', target_demo_age::text) as target_demo,
      velocity_weight,
      creation_rate_weight,
      watchtime_weight,
      is_active,
      created_by,
      created_at,
      updated_at,
      notes
    FROM ranking_configs
    WHERE ${whereConditions.join(' AND ')}
    ORDER BY market, target_demo_gender, target_demo_age
  `;

  const result = await query(queryText, params);

  return result.rows;
}

/**
 * Get single ranking config
 */
export async function getRankingConfig(market, gender, age) {
  const queryText = `
    SELECT *
    FROM ranking_configs
    WHERE market = $1
      AND target_demo_gender = $2
      AND target_demo_age = $3
      AND is_active = TRUE
  `;

  const result = await query(queryText, [market, gender, age]);

  return result.rows[0] || null;
}

/**
 * Update ranking configuration
 */
export async function updateRankingConfig(market, gender, age, weights, updatedBy, notes = null) {
  const { velocityWeight, creationRateWeight, watchtimeWeight } = weights;

  // Validate weights sum to 1.0
  const sum = velocityWeight + creationRateWeight + watchtimeWeight;
  if (Math.abs(sum - 1.0) > 0.01) {
    throw new Error('Weights must sum to 1.0');
  }

  return transaction(async (client) => {
    // Deactivate current config
    const deactivateQuery = `
      UPDATE ranking_configs
      SET is_active = FALSE
      WHERE market = $1
        AND target_demo_gender = $2
        AND target_demo_age = $3
        AND is_active = TRUE
    `;

    await client.query(deactivateQuery, [market, gender, age]);

    // Insert new config
    const insertQuery = `
      INSERT INTO ranking_configs (
        market,
        target_demo_gender,
        target_demo_age,
        velocity_weight,
        creation_rate_weight,
        watchtime_weight,
        is_active,
        created_by,
        notes
      ) VALUES ($1, $2, $3, $4, $5, $6, TRUE, $7, $8)
      RETURNING *
    `;

    const result = await client.query(insertQuery, [
      market,
      gender,
      age,
      velocityWeight,
      creationRateWeight,
      watchtimeWeight,
      updatedBy,
      notes
    ]);

    // Log audit
    const auditQuery = `
      INSERT INTO audit_logs (
        user_email,
        action,
        resource_type,
        resource_id,
        details,
        market
      ) VALUES ($1, $2, $3, $4, $5, $6)
    `;

    await client.query(auditQuery, [
      updatedBy,
      'ranking_config_updated',
      'ranking_config',
      result.rows[0].config_id,
      JSON.stringify({
        market,
        demo: `${gender} ${age}`,
        oldWeights: 'deactivated',
        newWeights: weights
      }),
      market
    ]);

    return result.rows[0];
  });
}

/**
 * Calculate rank score for a topic
 */
export function calculateRankScore(velocity, creationRate, watchtime, weights) {
  const { velocityWeight, creationRateWeight, watchtimeWeight } = weights;

  // Normalize metrics to 0-100 scale (assuming max values)
  const normalizedVelocity = Math.min(100, Math.max(0, velocity || 0));
  const normalizedCreationRate = Math.min(100, Math.max(0, creationRate || 0));
  const normalizedWatchtime = Math.min(100, Math.max(0, watchtime || 0));

  // Calculate weighted score
  const rankScore =
    normalizedVelocity * velocityWeight +
    normalizedCreationRate * creationRateWeight +
    normalizedWatchtime * watchtimeWeight;

  return Math.round(rankScore * 100) / 100; // Round to 2 decimal places
}

/**
 * Recalculate rankings for all active topics in a segment
 */
export async function recalculateRankings(market, gender, age) {
  return transaction(async (client) => {
    // Get config
    const configQuery = `
      SELECT *
      FROM ranking_configs
      WHERE market = $1
        AND target_demo_gender = $2
        AND target_demo_age = $3
        AND is_active = TRUE
    `;

    const configResult = await client.query(configQuery, [market, gender, age]);

    if (configResult.rows.length === 0) {
      throw new Error('No active ranking config found for this segment');
    }

    const config = configResult.rows[0];

    // Get all active topics for this segment
    const topicsQuery = `
      SELECT topic_id, velocity, creation_rate, watchtime
      FROM topics
      WHERE market = $1
        AND target_demo_gender = $2
        AND target_demo_age = $3
        AND status = 'active'
        AND is_deleted = FALSE
    `;

    const topicsResult = await client.query(topicsQuery, [market, gender, age]);

    // Calculate new scores
    const updates = topicsResult.rows.map((topic) => {
      const rankScore = calculateRankScore(
        topic.velocity,
        topic.creation_rate,
        topic.watchtime,
        {
          velocityWeight: config.velocity_weight,
          creationRateWeight: config.creation_rate_weight,
          watchtimeWeight: config.watchtime_weight
        }
      );

      return {
        topicId: topic.topic_id,
        rankScore
      };
    });

    // Sort by score to determine positions
    updates.sort((a, b) => b.rankScore - a.rankScore);

    // Update all topics
    for (let i = 0; i < updates.length; i++) {
      const updateQuery = `
        UPDATE topics
        SET rank_score = $1,
            rank_position = $2,
            updated_at = CURRENT_TIMESTAMP
        WHERE topic_id = $3
      `;

      await client.query(updateQuery, [
        updates[i].rankScore,
        i + 1, // Position starts at 1
        updates[i].topicId
      ]);
    }

    return {
      market,
      demographic: `${gender} ${age}`,
      topicsUpdated: updates.length,
      config: {
        velocityWeight: config.velocity_weight,
        creationRateWeight: config.creation_rate_weight,
        watchtimeWeight: config.watchtime_weight
      }
    };
  });
}

/**
 * Recalculate all rankings for all segments
 */
export async function recalculateAllRankings() {
  const markets = ['JP', 'KR', 'IN', 'ID', 'AUNZ'];
  const genders = ['male', 'female'];
  const ages = ['18-24', '25-34', '35-44'];

  const results = [];

  for (const market of markets) {
    for (const gender of genders) {
      for (const age of ages) {
        try {
          const result = await recalculateRankings(market, gender, age);
          results.push(result);
        } catch (error) {
          console.error(`Failed to recalculate ${market} ${gender} ${age}:`, error.message);
          results.push({
            market,
            demographic: `${gender} ${age}`,
            error: error.message
          });
        }
      }
    }
  }

  return results;
}
