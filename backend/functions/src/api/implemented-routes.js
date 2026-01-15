/**
 * Implemented API Routes for Alpha MVP
 * These routes connect to the database and provide actual functionality
 */

import express from 'express';
import { body, param, query, validationResult } from 'express-validator';
import rateLimit from 'express-rate-limit';
import * as topicsDb from '../db/topics.js';
import * as rankingDb from '../db/ranking.js';
import { normalizeTopic, generateEmbedding } from '../services/gemini-service.js';
import { checkForDuplicates } from '../services/deduplication.js';

// Rate limiters
const standardLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests, please try again later'
});

const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 20,
  message: 'Upload limit reached, please try again later'
});

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

export function setupRoutes(app) {
  const router = express.Router();

  // ============================================================================
  // TOPICS ENDPOINTS
  // ============================================================================

  /**
   * GET /api/trends
   * Get trends with filtering
   */
  router.get(
    '/trends',
    standardLimiter,
    [
      query('market').isIn(['JP', 'KR', 'IN', 'ID', 'AUNZ']),
      query('targetDemo').optional().isString(),
      query('source').optional().isIn(['Search', 'Nyan Cat', 'Agency', 'Music', 'All Sources']),
      query('archived').optional().isBoolean(),
      validate
    ],
    async (req, res, next) => {
      try {
        const { market, targetDemo, source, archived } = req.query;

        const filters = { market };

        // Parse target demo (e.g., "Females 18-24")
        if (targetDemo && targetDemo !== 'All Demographics') {
          const parts = targetDemo.toLowerCase().split(' ');
          if (parts.length >= 2) {
            filters.gender = parts[0] === 'males' ? 'male' : 'female';
            filters.age = parts[1];
          }
        }

        if (source && source !== 'All Sources') {
          filters.source = source;
        }

        if (archived === 'true') {
          filters.status = 'archived';
        } else {
          filters.status = 'active';
        }

        const trends = await topicsDb.getTopics(filters);

        res.json({
          trends: trends.map(t => ({
            id: t.topic_id,
            topicName: t.topic_name,
            description: t.description,
            targetDemo: `${t.target_demo_gender === 'male' ? 'Males' : 'Females'} ${t.target_demo_age}`,
            referenceLink: t.reference_link,
            hashtags: t.hashtags || [],
            audio: t.audio,
            rank: t.rank_position,
            score: parseFloat(t.rank_score) || 0,
            velocity: t.views_velocity > 0 ? 'increasing' : t.views_velocity < 0 ? 'decreasing' : 'stable',
            ageInWeeks: Math.floor((Date.now() - new Date(t.created_at)) / (7 * 24 * 60 * 60 * 1000)),
            source: t.source,
            viewsVolume: t.views_volume?.toString() || '0',
            viewsVelocity: t.views_velocity?.toString() || '0',
            creationRate: t.creation_rate?.toString() || '0',
            watchtimeVolume: t.watchtime_volume?.toString() || '0',
            watchtimeVelocity: t.watchtime_velocity?.toString() || '0',
            createdAt: t.created_at,
            approvedBy: t.approved_by,
            approvedAt: t.approved_at
          })),
          lastUpdated: new Date().toISOString(),
          totalCount: trends.length
        });

      } catch (error) {
        console.error('Error fetching trends:', error);
        next(error);
      }
    }
  );

  /**
   * POST /api/trends/:id/approve
   * Approve a trend and send to Agent Collective
   */
  router.post(
    '/trends/:id/approve',
    standardLimiter,
    [
      param('id').isUUID(),
      body('approvedBy').isEmail(),
      validate
    ],
    async (req, res, next) => {
      try {
        const { id } = req.params;
        const { approvedBy } = req.body;

        const result = await topicsDb.approveTopic(id, approvedBy);

        if (!result) {
          return res.status(404).json({ error: 'Topic not found or already approved' });
        }

        // TODO: Send to Agent Collective via MCP Bridge
        // For now, just return success

        res.json({
          success: true,
          trend: {
            id: result.topic_id,
            topicName: result.topic_name,
            approvedBy: result.approved_by,
            approvedAt: result.approved_at,
            sentToAgentCollective: result.sent_to_agent_collective
          }
        });

      } catch (error) {
        console.error('Error approving trend:', error);
        next(error);
      }
    }
  );

  /**
   * GET /api/stats
   * Get dashboard statistics
   */
  router.get(
    '/stats',
    standardLimiter,
    [
      query('market').isIn(['JP', 'KR', 'IN', 'ID', 'AUNZ']),
      validate
    ],
    async (req, res, next) => {
      try {
        const { market } = req.query;

        const activeTopics = await topicsDb.getTopics({ market, status: 'active' });

        // Count approvals this week
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

        const approvedThisWeek = activeTopics.filter(t =>
          t.approved_at && new Date(t.approved_at) >= oneWeekAgo
        ).length;

        res.json({
          totalActiveTrends: activeTopics.length,
          approvedThisWeek,
          lastUpdated: new Date().toISOString()
        });

      } catch (error) {
        console.error('Error fetching stats:', error);
        next(error);
      }
    }
  );

  // ============================================================================
  // SCORING SETTINGS ENDPOINTS
  // ============================================================================

  /**
   * GET /api/scoring-settings
   * Get scoring weights for a market/demo
   */
  router.get(
    '/scoring-settings',
    standardLimiter,
    [
      query('market').isIn(['JP', 'KR', 'IN', 'ID', 'AUNZ']),
      query('gender').optional().isIn(['male', 'female']),
      query('age').optional().isIn(['18-24', '25-34', '35-44']),
      validate
    ],
    async (req, res, next) => {
      try {
        const { market, gender, age } = req.query;

        const config = await rankingDb.getRankingConfig(
          market,
          gender || 'female',
          age || '18-24'
        );

        if (!config) {
          return res.status(404).json({ error: 'Ranking config not found' });
        }

        res.json({
          weights: {
            viewsVolume: config.views_volume_weight,
            viewsVelocity: config.views_velocity_weight,
            creationRate: config.creation_rate_weight,
            watchtimeVolume: config.watchtime_volume_weight,
            watchtimeVelocity: config.watchtime_velocity_weight,
            ageInWeeks: config.age_weight
          },
          updatedAt: config.updated_at,
          market: config.market
        });

      } catch (error) {
        console.error('Error fetching scoring settings:', error);
        next(error);
      }
    }
  );

  /**
   * POST /api/scoring-settings
   * Update scoring weights
   */
  router.post(
    '/scoring-settings',
    standardLimiter,
    [
      body('market').isIn(['JP', 'KR', 'IN', 'ID', 'AUNZ']),
      body('gender').isIn(['male', 'female']),
      body('age').isIn(['18-24', '25-34', '35-44']),
      body('weights').isObject(),
      body('weights.viewsVolume').isFloat({ min: 0, max: 1 }),
      body('weights.viewsVelocity').isFloat({ min: 0, max: 1 }),
      body('weights.creationRate').isFloat({ min: 0, max: 1 }),
      body('weights.watchtimeVolume').isFloat({ min: 0, max: 1 }),
      body('weights.watchtimeVelocity').isFloat({ min: 0, max: 1 }),
      body('weights.ageInWeeks').isFloat({ min: 0, max: 1 }),
      validate
    ],
    async (req, res, next) => {
      try {
        const { market, gender, age, weights } = req.body;

        // Validate weights sum to 1.0
        const sum = Object.values(weights).reduce((a, b) => a + b, 0);
        if (Math.abs(sum - 1.0) > 0.01) {
          return res.status(400).json({ error: 'Weights must sum to 1.0 (100%)' });
        }

        const updated = await rankingDb.updateRankingConfig(market, gender, age, weights);

        // Recalculate rankings for this market/demo
        await rankingDb.recalculateRankings(market, gender, age);

        res.json({
          success: true,
          weights: updated
        });

      } catch (error) {
        console.error('Error updating scoring settings:', error);
        next(error);
      }
    }
  );

  // ============================================================================
  // AGENCY UPLOAD ENDPOINT
  // ============================================================================

  /**
   * POST /api/agency-upload
   * Submit agency data (with Gemini normalization)
   */
  router.post(
    '/agency-upload',
    uploadLimiter,
    [
      body('topicName').isString().isLength({ min: 5, max: 200 }),
      body('description').isString().isLength({ min: 10, max: 500 }),
      body('targetDemo').isString(),
      body('referenceLink').isURL(),
      body('source').isString(),
      body('market').isIn(['JP', 'KR', 'IN', 'ID', 'AUNZ']),
      validate
    ],
    async (req, res, next) => {
      try {
        const { topicName, description, targetDemo, referenceLink, source, market } = req.body;

        // Step 1: Normalize with Gemini
        const normalized = await normalizeTopic({
          topicName,
          description,
          source: 'Agency',
          targetDemo
        });

        // Step 2: Generate embedding
        const embeddingText = `${normalized.topicName} ${normalized.description}`;
        const embedding = await generateEmbedding(embeddingText);

        // Step 3: Check for duplicates
        const duplicate = await checkForDuplicates({
          embedding,
          market
        });

        if (duplicate) {
          return res.json({
            success: true,
            message: 'Similar topic already exists',
            isDuplicate: true,
            existingTopicId: duplicate.topic_id,
            similarityScore: duplicate.similarity
          });
        }

        // Step 4: Parse target demo
        const demoParts = normalized.targetDemo.toLowerCase().split(' ');
        const gender = demoParts[0] === 'males' ? 'male' : 'female';
        const age = demoParts[1] || '18-24';

        // Step 5: Create topic
        const newTopic = await topicsDb.createTopic({
          topicName: normalized.topicName,
          description: normalized.description,
          referenceLink,
          market,
          targetDemoGender: gender,
          targetDemoAge: age,
          source: 'Agency',
          hashtags: normalized.hashtags,
          embedding
        });

        res.json({
          success: true,
          message: 'Topic submitted successfully and processed by AI',
          trendId: newTopic.topic_id,
          normalizedName: normalized.topicName,
          isDuplicate: false
        });

      } catch (error) {
        console.error('Error processing agency upload:', error);
        next(error);
      }
    }
  );

  // ============================================================================
  // ERROR HANDLING
  // ============================================================================

  router.use((err, req, res, next) => {
    console.error('API Error:', err);
    res.status(500).json({
      error: 'Internal server error',
      message: err.message
    });
  });

  app.use('/api', router);
}

export default { setupRoutes };
