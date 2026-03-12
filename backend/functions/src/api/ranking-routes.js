/**
 * Ranking API Routes
 *
 * Endpoints for the ranking engine:
 * - Trigger ranking runs across all three tracks
 * - Get/save booster configuration
 */

import express from 'express';
import { body, query as queryValidator, validationResult } from 'express-validator';
import rateLimit from 'express-rate-limit';
import { rankTrack } from '../ranking/ranking-engine.js';
import { getTopicsByTrack, getConsolidatedTopics, updateConsolidatedTopicRanking } from '../db/topic-matching-db.js';
import { updateTopic } from '../db/topics.js';

// Rate limiter: 50 requests per 15 minutes
const rankingLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  message: 'Too many ranking requests, please try again later'
});

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

export function setupRankingRoutes(app) {
  const router = express.Router();

  // ============================================================================
  // POST /api/ranking/run - Trigger ranking for a specific market
  // ============================================================================

  router.post(
    '/run',
    rankingLimiter,
    [
      body('market').isIn(['JP', 'KR', 'IN', 'ID', 'AUNZ']),
      body('optionalBoosters').optional().isObject(),
      body('optionalBoosters.tools').optional().isBoolean(),
      body('optionalBoosters.geo').optional().isBoolean(),
      validate
    ],
    async (req, res, next) => {
      try {
        const { market, optionalBoosters } = req.body;

        // 1. Get topics for each track
        const [internalTopics, externalTopics, centerTopics] = await Promise.all([
          getTopicsByTrack(market, 'internal'),
          getTopicsByTrack(market, 'external'),
          getConsolidatedTopics(market)
        ]);

        // 2. Run ranking for each track
        const [internalRanked, externalRanked, matchedRanked] = await Promise.all([
          rankTrack(internalTopics, 'internal', market, optionalBoosters),
          rankTrack(externalTopics, 'external', market, optionalBoosters),
          rankTrack(centerTopics, 'matched', market, optionalBoosters)
        ]);

        // 3. Update each topic's rank_score and rank_position in DB
        // Note: rankTrack returns camelCase (rankScore, rankPosition)
        const updatePromises = [];

        for (const topic of internalRanked) {
          if (topic.topic_id) {
            updatePromises.push(
              updateTopic(topic.topic_id, {
                rank_score: topic.rankScore,
                rank_position: topic.rankPosition
              })
            );
          }
        }

        for (const topic of externalRanked) {
          if (topic.topic_id) {
            updatePromises.push(
              updateTopic(topic.topic_id, {
                rank_score: topic.rankScore,
                rank_position: topic.rankPosition
              })
            );
          }
        }

        for (const topic of matchedRanked) {
          if (topic.consolidated_id) {
            updatePromises.push(
              updateConsolidatedTopicRanking(
                topic.consolidated_id,
                topic.rankScore,
                topic.rankPosition
              )
            );
          }
        }

        await Promise.all(updatePromises);

        res.json({
          success: true,
          market,
          internalRanked: internalRanked.length,
          externalRanked: externalRanked.length,
          matchedRanked: matchedRanked.length
        });

      } catch (error) {
        console.error('Error running ranking:', error);
        next(error);
      }
    }
  );

  // ============================================================================
  // GET /api/ranking/config - Get current booster configuration
  // ============================================================================

  router.get(
    '/config',
    rankingLimiter,
    [
      queryValidator('market').isIn(['JP', 'KR', 'IN', 'ID', 'AUNZ']),
      validate
    ],
    async (req, res, next) => {
      try {
        const { market } = req.query;

        // Return defaults for now (config table not yet built)
        res.json({
          market,
          optionalBoosters: {
            tools: false,
            geo: false
          },
          weights: {
            internal: 0.8,
            external: 0.2
          }
        });

      } catch (error) {
        console.error('Error fetching ranking config:', error);
        next(error);
      }
    }
  );

  // ============================================================================
  // POST /api/ranking/config - Save booster configuration
  // ============================================================================

  router.post(
    '/config',
    rankingLimiter,
    [
      body('market').isIn(['JP', 'KR', 'IN', 'ID', 'AUNZ']),
      body('optionalBoosters').isObject(),
      body('optionalBoosters.tools').isBoolean(),
      body('optionalBoosters.geo').isBoolean(),
      validate
    ],
    async (req, res, next) => {
      try {
        const { market, optionalBoosters } = req.body;

        // Config storage can come later - just return success for now
        res.json({
          success: true,
          market,
          optionalBoosters
        });

      } catch (error) {
        console.error('Error saving ranking config:', error);
        next(error);
      }
    }
  );

  // ============================================================================
  // ERROR HANDLING
  // ============================================================================

  router.use((err, req, res, next) => {
    console.error('Ranking API Error:', err);
    res.status(500).json({
      error: 'Internal server error',
      message: err.message
    });
  });

  app.use('/api/ranking', router);
}

export default { setupRankingRoutes };
