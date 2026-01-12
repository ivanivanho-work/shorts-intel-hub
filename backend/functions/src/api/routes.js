/**
 * API Routes Configuration
 *
 * Defines all REST API endpoints for Shorts Intel Hub
 */

import express from 'express';
import { body, param, query, validationResult } from 'express-validator';
import rateLimit from 'express-rate-limit';

// Rate limiters
const standardLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window
  message: 'Too many requests, please try again later'
});

const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20, // 20 uploads per hour
  message: 'Upload limit reached, please try again later'
});

/**
 * Validation middleware
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

/**
 * Setup all API routes
 */
export function setupRoutes(app) {
  const router = express.Router();

  // ============================================================================
  // TOPICS ENDPOINTS
  // ============================================================================

  /**
   * GET /topics
   * Get topics with filtering and pagination
   *
   * Query params:
   * - market: JP|KR|IN|ID|AUNZ
   * - gender: male|female
   * - age: 18-24|25-34|35-44
   * - status: active|expired|approved|archived
   * - limit: number (default 50, max 100)
   * - offset: number (default 0)
   * - sort: rank_score|created_at|updated_at (default rank_score)
   * - order: asc|desc (default desc)
   */
  router.get(
    '/topics',
    standardLimiter,
    [
      query('market').optional().isIn(['JP', 'KR', 'IN', 'ID', 'AUNZ']),
      query('gender').optional().isIn(['male', 'female']),
      query('age').optional().isIn(['18-24', '25-34', '35-44']),
      query('status').optional().isIn(['raw', 'processing', 'active', 'expired', 'archived', 'approved']),
      query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
      query('offset').optional().isInt({ min: 0 }).toInt(),
      query('sort').optional().isIn(['rank_score', 'created_at', 'updated_at']),
      query('order').optional().isIn(['asc', 'desc']),
      validate
    ],
    async (req, res, next) => {
      try {
        // TODO: Implement topic fetching logic
        res.json({
          topics: [],
          pagination: {
            limit: req.query.limit || 50,
            offset: req.query.offset || 0,
            total: 0
          }
        });
      } catch (error) {
        next(error);
      }
    }
  );

  /**
   * GET /topics/top10
   * Get top 10 topics for specific market/demo
   */
  router.get(
    '/topics/top10',
    standardLimiter,
    [
      query('market').isIn(['JP', 'KR', 'IN', 'ID', 'AUNZ']),
      query('gender').isIn(['male', 'female']),
      query('age').isIn(['18-24', '25-34', '35-44']),
      validate
    ],
    async (req, res, next) => {
      try {
        // TODO: Implement top 10 fetching logic
        res.json({
          market: req.query.market,
          demographic: {
            gender: req.query.gender,
            age: req.query.age
          },
          topics: []
        });
      } catch (error) {
        next(error);
      }
    }
  );

  /**
   * GET /topics/:topicId
   * Get single topic by ID
   */
  router.get(
    '/topics/:topicId',
    standardLimiter,
    [
      param('topicId').isUUID(),
      validate
    ],
    async (req, res, next) => {
      try {
        // TODO: Implement single topic fetching logic
        res.json({
          topic: null
        });
      } catch (error) {
        next(error);
      }
    }
  );

  /**
   * POST /topics/:topicId/approve
   * Approve a topic and send to Agent Collective
   */
  router.post(
    '/topics/:topicId/approve',
    standardLimiter,
    [
      param('topicId').isUUID(),
      body('approvedBy').isEmail(),
      validate
    ],
    async (req, res, next) => {
      try {
        // TODO: Implement approval logic
        // 1. Update topic status to 'approved'
        // 2. Record approver and timestamp
        // 3. Push to MCP Bridge
        res.json({
          success: true,
          topicId: req.params.topicId,
          approvedBy: req.body.approvedBy,
          sentToAgentCollective: true
        });
      } catch (error) {
        next(error);
      }
    }
  );

  // ============================================================================
  // UPLOAD ENDPOINTS
  // ============================================================================

  /**
   * POST /upload
   * Handle file upload from agency/music team
   */
  router.post(
    '/upload',
    uploadLimiter,
    [
      body('source').isIn(['agency', 'music']),
      body('market').optional().isIn(['JP', 'KR', 'IN', 'ID', 'AUNZ']),
      body('filename').isString(),
      body('content').isString(), // Base64 encoded file content
      validate
    ],
    async (req, res, next) => {
      try {
        // TODO: Implement upload logic
        // 1. Save to Cloud Storage
        // 2. Parse file content
        // 3. Queue for processing
        res.json({
          success: true,
          uploadId: 'temp-uuid',
          filename: req.body.filename,
          status: 'uploaded'
        });
      } catch (error) {
        next(error);
      }
    }
  );

  /**
   * GET /uploads
   * Get upload history
   */
  router.get(
    '/uploads',
    standardLimiter,
    [
      query('source').optional().isIn(['agency', 'music']),
      query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
      query('offset').optional().isInt({ min: 0 }).toInt(),
      validate
    ],
    async (req, res, next) => {
      try {
        // TODO: Implement upload history fetching
        res.json({
          uploads: [],
          pagination: {
            limit: req.query.limit || 50,
            offset: req.query.offset || 0,
            total: 0
          }
        });
      } catch (error) {
        next(error);
      }
    }
  );

  // ============================================================================
  // RANKING CONFIGURATION ENDPOINTS
  // ============================================================================

  /**
   * GET /ranking/configs
   * Get ranking configurations
   */
  router.get(
    '/ranking/configs',
    standardLimiter,
    [
      query('market').optional().isIn(['JP', 'KR', 'IN', 'ID', 'AUNZ']),
      query('gender').optional().isIn(['male', 'female']),
      query('age').optional().isIn(['18-24', '25-34', '35-44']),
      validate
    ],
    async (req, res, next) => {
      try {
        // TODO: Implement config fetching
        res.json({
          configs: []
        });
      } catch (error) {
        next(error);
      }
    }
  );

  /**
   * PUT /ranking/configs
   * Update ranking configuration weights
   */
  router.put(
    '/ranking/configs',
    standardLimiter,
    [
      body('market').isIn(['JP', 'KR', 'IN', 'ID', 'AUNZ']),
      body('gender').isIn(['male', 'female']),
      body('age').isIn(['18-24', '25-34', '35-44']),
      body('velocityWeight').isFloat({ min: 0, max: 1 }),
      body('creationRateWeight').isFloat({ min: 0, max: 1 }),
      body('watchtimeWeight').isFloat({ min: 0, max: 1 }),
      body('updatedBy').isEmail(),
      validate
    ],
    async (req, res, next) => {
      try {
        // Validate weights sum to 1.0
        const sum = req.body.velocityWeight + req.body.creationRateWeight + req.body.watchtimeWeight;
        if (Math.abs(sum - 1.0) > 0.01) {
          return res.status(400).json({
            error: 'Weights must sum to 1.0'
          });
        }

        // TODO: Implement config update logic
        res.json({
          success: true,
          config: {
            market: req.body.market,
            demographic: {
              gender: req.body.gender,
              age: req.body.age
            },
            weights: {
              velocity: req.body.velocityWeight,
              creationRate: req.body.creationRateWeight,
              watchtime: req.body.watchtimeWeight
            }
          }
        });
      } catch (error) {
        next(error);
      }
    }
  );

  // ============================================================================
  // SCHEDULER ENDPOINTS
  // ============================================================================

  /**
   * GET /schedules
   * Get refresh schedules for all markets
   */
  router.get(
    '/schedules',
    standardLimiter,
    async (req, res, next) => {
      try {
        // TODO: Implement schedule fetching
        res.json({
          schedules: []
        });
      } catch (error) {
        next(error);
      }
    }
  );

  /**
   * PUT /schedules/:market
   * Update refresh schedule for a market
   */
  router.put(
    '/schedules/:market',
    standardLimiter,
    [
      param('market').isIn(['JP', 'KR', 'IN', 'ID', 'AUNZ']),
      body('cronExpression').isString(),
      body('timezone').isString(),
      body('updatedBy').isEmail(),
      validate
    ],
    async (req, res, next) => {
      try {
        // TODO: Implement schedule update logic
        res.json({
          success: true,
          market: req.params.market,
          schedule: {
            cronExpression: req.body.cronExpression,
            timezone: req.body.timezone
          }
        });
      } catch (error) {
        next(error);
      }
    }
  );

  // ============================================================================
  // MARKET & DEMOGRAPHIC ENDPOINTS
  // ============================================================================

  /**
   * GET /markets
   * Get list of all markets
   */
  router.get('/markets', standardLimiter, (req, res) => {
    res.json({
      markets: [
        { code: 'JP', name: 'Japan', timezone: 'Asia/Tokyo' },
        { code: 'KR', name: 'Korea', timezone: 'Asia/Seoul' },
        { code: 'IN', name: 'India', timezone: 'Asia/Kolkata' },
        { code: 'ID', name: 'Indonesia', timezone: 'Asia/Jakarta' },
        { code: 'AUNZ', name: 'Australia/New Zealand', timezone: 'Australia/Sydney' }
      ]
    });
  });

  /**
   * GET /demographics
   * Get list of all demographics
   */
  router.get('/demographics', standardLimiter, (req, res) => {
    res.json({
      demographics: [
        { gender: 'male', age: '18-24', label: 'Male 18-24' },
        { gender: 'male', age: '25-34', label: 'Male 25-34' },
        { gender: 'male', age: '35-44', label: 'Male 35-44' },
        { gender: 'female', age: '18-24', label: 'Female 18-24' },
        { gender: 'female', age: '25-34', label: 'Female 25-34' },
        { gender: 'female', age: '35-44', label: 'Female 35-44' }
      ]
    });
  });

  // ============================================================================
  // STATISTICS ENDPOINTS
  // ============================================================================

  /**
   * GET /stats
   * Get overall statistics
   */
  router.get(
    '/stats',
    standardLimiter,
    [
      query('market').optional().isIn(['JP', 'KR', 'IN', 'ID', 'AUNZ']),
      validate
    ],
    async (req, res, next) => {
      try {
        // TODO: Implement stats fetching from market_stats view
        res.json({
          stats: {
            totalTopics: 0,
            activeTopics: 0,
            approvedTopics: 0,
            expiredTopics: 0,
            byMarket: {}
          }
        });
      } catch (error) {
        next(error);
      }
    }
  );

  // Mount router
  app.use('/api', router);

  return router;
}
