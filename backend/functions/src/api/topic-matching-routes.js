/**
 * Topic Matching API Routes
 *
 * Endpoints for the topic matching system:
 * - Trigger matching runs
 * - Retrieve three-track results
 * - Get consolidated topic details
 * - View run history and statistics
 */

import express from 'express';
import { body, param, query as queryValidator, validationResult } from 'express-validator';
import rateLimit from 'express-rate-limit';
import * as matchingDb from '../db/topic-matching-db.js';

// Rate limiter: 50 requests per 15 minutes
const matchingLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  message: 'Too many matching requests, please try again later'
});

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

/**
 * Generate mock internal and external topics for a market
 * Used until real data sources are connected
 */
function generateMockTopics(market) {
  const marketThemes = {
    JP: {
      internal: [
        { name: 'Anime Dance Challenge', description: 'Users recreate iconic anime dance sequences with original choreography' },
        { name: 'Konbini Mukbang', description: 'Convenience store food reviews and taste tests from Japanese konbini' },
        { name: 'Tokyo Street Fashion', description: 'Harajuku and Shibuya street style showcases and outfit transitions' }
      ],
      external: [
        { name: 'Anime Opening Recreations', description: 'Fans recreate anime openings with live-action interpretations' },
        { name: 'Japanese Convenience Store Hauls', description: 'Tourists and locals reviewing unique Japanese convenience store finds' },
        { name: 'Kawaii Fashion Lookbooks', description: 'Cute fashion styling videos featuring Japanese street fashion trends' }
      ]
    },
    KR: {
      internal: [
        { name: 'K-Pop Dance Cover', description: 'Fan dance covers of latest K-Pop group choreography' },
        { name: 'Korean Skincare Routine', description: '10-step Korean skincare routines and product reviews' },
        { name: 'Seoul Cafe Hopping', description: 'Aesthetic cafe tours in Seoul neighborhoods' }
      ],
      external: [
        { name: 'K-Pop Choreography Tutorial', description: 'Step-by-step tutorials for learning K-Pop dance moves' },
        { name: 'Glass Skin Tutorial', description: 'Achieving the Korean glass skin look with skincare and makeup' },
        { name: 'Korean Street Food Tour', description: 'Exploring popular Korean street food markets and vendors' }
      ]
    },
    IN: {
      internal: [
        { name: 'Bollywood Transition Reels', description: 'Creative outfit transitions synced to Bollywood music' },
        { name: 'Indian Street Food ASMR', description: 'Satisfying street food preparation videos from across India' },
        { name: 'Desi Comedy Sketches', description: 'Relatable comedy about Indian family and daily life' }
      ],
      external: [
        { name: 'Bollywood Dance Challenge', description: 'Users attempting iconic Bollywood dance sequences' },
        { name: 'Chaat Making Videos', description: 'Recipes and preparation of popular Indian chaat varieties' },
        { name: 'Indian Wedding Content', description: 'Lavish Indian wedding ceremonies and celebration highlights' }
      ]
    },
    ID: {
      internal: [
        { name: 'Indonesian Mukbang', description: 'Local food reviews featuring Indonesian cuisine' },
        { name: 'Dangdut Dance Trends', description: 'Viral dangdut music dance challenges and covers' },
        { name: 'Jakarta Life Vlogs', description: 'Day-in-the-life content from Jakarta creators' }
      ],
      external: [
        { name: 'Indonesian Street Food Tours', description: 'Exploring street food stalls across Indonesian cities' },
        { name: 'Indonesian Music Covers', description: 'Cover versions of trending Indonesian pop and dangdut songs' },
        { name: 'Bali Travel Content', description: 'Travel vlogs and hidden gem discoveries in Bali' }
      ]
    },
    AUNZ: {
      internal: [
        { name: 'Aussie Slang Challenge', description: 'Testing knowledge of Australian slang and expressions' },
        { name: 'Beach Lifestyle Vlogs', description: 'Coastal Australian lifestyle and surf culture content' },
        { name: 'Outback Adventures', description: 'Exploring remote Australian outback locations' }
      ],
      external: [
        { name: 'Australian Accent Challenge', description: 'Non-Australians attempting the Aussie accent' },
        { name: 'Surf and Beach Culture', description: 'Surfing tutorials and beach lifestyle content from AUNZ' },
        { name: 'NZ Nature Exploration', description: 'Hiking and nature content from New Zealand landscapes' }
      ]
    }
  };

  const themes = marketThemes[market] || marketThemes.JP;

  const internalTopics = themes.internal.map((t, i) => ({
    topicName: t.name,
    description: t.description,
    source: 'Search',
    sourceType: 'internal',
    market,
    mockId: `mock-int-${market}-${i}`
  }));

  const externalTopics = themes.external.map((t, i) => ({
    topicName: t.name,
    description: t.description,
    source: 'Agency',
    sourceType: 'external',
    market,
    mockId: `mock-ext-${market}-${i}`
  }));

  return { internalTopics, externalTopics };
}

/**
 * Run a mock matching pipeline for demonstration
 */
async function runMockMatchingPipeline(market, runId) {
  const startTime = Date.now();
  const { internalTopics, externalTopics } = generateMockTopics(market);

  const totalPairs = internalTopics.length * externalTopics.length;
  let stage1Matches = 0;
  let stage2Matches = 0;
  let relatedFlags = 0;

  // Simulate matching: first internal topic matches first external topic, etc.
  const matchCount = Math.min(internalTopics.length, externalTopics.length);

  for (let i = 0; i < matchCount; i++) {
    const internal = internalTopics[i];
    const external = externalTopics[i];

    // Create a consolidated topic for the match
    const consolidated = await matchingDb.createConsolidatedTopic({
      consolidatedName: internal.topicName,
      consolidatedDescription: `Matched topic: ${internal.description} + ${external.description}`,
      matchCount: 2,
      internalCount: 1,
      externalCount: 1,
      avgConfidence: 0.85 + (Math.random() * 0.1),
      market
    });

    stage1Matches++;
    stage2Matches++;

    // Create a relation between the remaining unmatched topics if any
    if (i < matchCount - 1) {
      relatedFlags++;
    }
  }

  const processingTimeMs = Date.now() - startTime;

  // Complete the run
  await matchingDb.completeMatchingRun(runId, {
    totalPairsAnalyzed: totalPairs,
    stage1Matches,
    stage2Matches,
    relatedFlags,
    matchedTopicsCount: stage1Matches * 2,
    internalOnlyCount: Math.max(0, internalTopics.length - matchCount),
    externalOnlyCount: Math.max(0, externalTopics.length - matchCount),
    processingTimeMs
  });

  return { stage1Matches, stage2Matches, relatedFlags, processingTimeMs };
}

export function setupMatchingRoutes(app) {
  const router = express.Router();

  // ============================================================================
  // POST /api/matching/run - Trigger a topic matching run
  // ============================================================================

  router.post(
    '/run',
    matchingLimiter,
    [
      body('market').isIn(['JP', 'KR', 'IN', 'ID', 'AUNZ']),
      validate
    ],
    async (req, res, next) => {
      try {
        const { market } = req.body;
        const { internalTopics, externalTopics } = generateMockTopics(market);

        // Create the matching run record
        const run = await matchingDb.createMatchingRun({
          market,
          internalTopicCount: internalTopics.length,
          externalTopicCount: externalTopics.length
        });

        // Run pipeline asynchronously (don't await for response)
        runMockMatchingPipeline(market, run.run_id).catch(async (error) => {
          console.error('Matching pipeline failed:', error);
          await matchingDb.failMatchingRun(run.run_id, error.message);
        });

        res.json({
          runId: run.run_id,
          status: 'running',
          market,
          internalTopicCount: internalTopics.length,
          externalTopicCount: externalTopics.length
        });

      } catch (error) {
        console.error('Error triggering matching run:', error);
        next(error);
      }
    }
  );

  // ============================================================================
  // GET /api/matching/results/:market - Get three-track results
  // ============================================================================

  router.get(
    '/results/:market',
    matchingLimiter,
    [
      param('market').isIn(['JP', 'KR', 'IN', 'ID', 'AUNZ']),
      validate
    ],
    async (req, res, next) => {
      try {
        const { market } = req.params;

        const { query: dbQuery } = await import('../db/connection.js');

        const [threeTrackData, lastRunResult] = await Promise.all([
          matchingDb.getThreeTrackData(market),
          dbQuery(
            `SELECT * FROM matching_runs WHERE market = $1 ORDER BY created_at DESC LIMIT 1`,
            [market]
          )
        ]);

        const lastRun = lastRunResult.rows.length > 0 ? lastRunResult.rows[0] : null;

        res.json({
          internalTrack: threeTrackData.internalTrack,
          centerTrack: threeTrackData.centerTrack,
          externalTrack: threeTrackData.externalTrack,
          lastRun,
          market
        });

      } catch (error) {
        console.error('Error fetching matching results:', error);
        next(error);
      }
    }
  );

  // ============================================================================
  // GET /api/matching/consolidated/:consolidatedId - Get single consolidated topic
  // ============================================================================

  router.get(
    '/consolidated/:consolidatedId',
    matchingLimiter,
    [
      param('consolidatedId').isUUID(),
      validate
    ],
    async (req, res, next) => {
      try {
        const { consolidatedId } = req.params;

        const matches = await matchingDb.getMatchesForConsolidated(consolidatedId);

        if (matches.length === 0) {
          return res.status(404).json({ error: 'Consolidated topic not found' });
        }

        res.json({
          consolidatedId,
          matches
        });

      } catch (error) {
        console.error('Error fetching consolidated topic:', error);
        next(error);
      }
    }
  );

  // ============================================================================
  // GET /api/matching/runs/:market - Get matching run history
  // ============================================================================

  router.get(
    '/runs/:market',
    matchingLimiter,
    [
      param('market').isIn(['JP', 'KR', 'IN', 'ID', 'AUNZ']),
      validate
    ],
    async (req, res, next) => {
      try {
        const { market } = req.params;

        // Query matching_runs table directly via the connection query
        const { query: dbQuery } = await import('../db/connection.js');

        const queryText = `
          SELECT *
          FROM matching_runs
          WHERE market = $1
          ORDER BY created_at DESC
          LIMIT 50
        `;

        const result = await dbQuery(queryText, [market]);

        res.json({
          runs: result.rows,
          market
        });

      } catch (error) {
        console.error('Error fetching matching runs:', error);
        next(error);
      }
    }
  );

  // ============================================================================
  // GET /api/matching/stats/:market - Get matching statistics
  // ============================================================================

  router.get(
    '/stats/:market',
    matchingLimiter,
    [
      param('market').isIn(['JP', 'KR', 'IN', 'ID', 'AUNZ']),
      validate
    ],
    async (req, res, next) => {
      try {
        const { market } = req.params;

        const { query: dbQuery } = await import('../db/connection.js');

        // Get counts by track
        const trackCountsQuery = `
          SELECT
            data_track,
            COUNT(*) as count
          FROM topics
          WHERE market = $1
            AND status = 'active'
            AND is_deleted = FALSE
            AND data_track IS NOT NULL
          GROUP BY data_track
        `;

        const trackResult = await dbQuery(trackCountsQuery, [market]);

        const trackCounts = {};
        for (const row of trackResult.rows) {
          trackCounts[row.data_track] = parseInt(row.count);
        }

        // Get consolidated topic stats
        const consolidatedStatsQuery = `
          SELECT
            COUNT(*) as total_matched,
            AVG(avg_confidence) as avg_confidence
          FROM consolidated_topics
          WHERE market = $1
            AND status = 'active'
        `;

        const consolidatedResult = await dbQuery(consolidatedStatsQuery, [market]);
        const consolidatedStats = consolidatedResult.rows[0] || {};

        // Get last run time
        const lastRunQuery = `
          SELECT completed_at
          FROM matching_runs
          WHERE market = $1
            AND status = 'completed'
          ORDER BY completed_at DESC
          LIMIT 1
        `;

        const lastRunResult = await dbQuery(lastRunQuery, [market]);
        const lastRunAt = lastRunResult.rows.length > 0
          ? lastRunResult.rows[0].completed_at
          : null;

        res.json({
          totalMatched: parseInt(consolidatedStats.total_matched) || 0,
          totalInternal: trackCounts.internal || 0,
          totalExternal: trackCounts.external || 0,
          lastRunAt,
          avgConfidence: parseFloat(consolidatedStats.avg_confidence) || 0,
          market
        });

      } catch (error) {
        console.error('Error fetching matching stats:', error);
        next(error);
      }
    }
  );

  // ============================================================================
  // ERROR HANDLING
  // ============================================================================

  router.use((err, req, res, next) => {
    console.error('Matching API Error:', err);
    res.status(500).json({
      error: 'Internal server error',
      message: err.message
    });
  });

  app.use('/api/matching', router);
}

export default { setupMatchingRoutes };
