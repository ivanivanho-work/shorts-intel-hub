/**
 * Ranking Engine — IRS / ERS / Combined Scoring
 *
 * Translates the Python ranking algorithms into Node.js for the
 * Shorts Intel Hub three-track data model:
 *
 *   - ERS (External Ranking Score) — External track
 *   - IRS (Internal Ranking Score) — Internal track
 *   - Combined IRS+ERS             — Center (Matched) track
 *
 * Every field access uses defensive fallbacks so incomplete data
 * never crashes the pipeline.
 */

import { query } from '../db/connection.js';

// ─── ERS Constants ──────────────────────────────────────────────────────────

/** Creation complexity multipliers — lower complexity = easier to replicate */
const CREATION_COMPLEXITY_LOW = 1.3;
const CREATION_COMPLEXITY_MEDIUM = 1.0;
const CREATION_COMPLEXITY_HIGH = 0.7;

/** Per-platform boost added to the distribution multiplier */
const PLATFORM_BOOST = 0.2;

/** Freshness multiplier for topics published within the last 14 days */
const FRESHNESS_BOOST = 1.3;

/** Freshness multiplier for topics older than 14 days */
const FRESHNESS_DECAY = 0.2;

/** Per-market boost added to the market booster */
const MARKET_BOOST = 0.1;

/** Trend scale multiplier when the trend is creator-led */
const CREATOR_LED_SCALE_BOOST = 1.1;

/** Trend scale multiplier when the trend is viewer-led */
const VIEWER_LED_SCALE_BOOST = 0.9;

/** Replicability multiplier for low creation complexity */
const REPLICABILITY_MULTIPLIER_LOW = 1.0;

/** Replicability multiplier for medium creation complexity */
const REPLICABILITY_MULTIPLIER_MEDIUM = 0.8;

/** Replicability multiplier for high creation complexity */
const REPLICABILITY_MULTIPLIER_HIGH = 0.7;

// ─── IRS Constants ──────────────────────────────────────────────────────────

/** Default visual/audio quality score when the field is missing */
const DEFAULT_VIDEO_QUALITY = 0.5;
const DEFAULT_AUDIO_QUALITY = 0.5;

/** Stickiness clamp bounds */
const STICKINESS_BOOST_MIN = 0.5;
const STICKINESS_BOOST_CAP = 1.5;

/** Shorts Creation Tools lifetime upload threshold for the tools booster */
const SCT_UPLOAD_LIFETIME_THRESHOLD = 100;

/** Multiplier applied when the tools booster is active */
const TOOLS_BOOST = 1.25;

/** Per-country boost for the geo booster */
const GEO_BOOST = 0.05;

/** Points added per downstream upload in the last 7 days */
const DOWNSTREAM_BOOST = 10;

// ─── Combined Constants ─────────────────────────────────────────────────────

/** Weight of IRS in the combined score */
const INTERNAL_SCORE_WEIGHT = 0.8;

/** Weight of ERS in the combined score */
const EXTERNAL_SCORE_WEIGHT = 0.2;

// ─── Field Mapping ──────────────────────────────────────────────────────────

/**
 * Normalize common field name variations so the ranking functions can work
 * with data from both the DB (snake_case) and CSV uploads (mixed case).
 *
 * The returned object uses consistent camelCase keys. For each target field
 * we check several possible source names (case-insensitive) and pick the
 * first one found. More-specific names (e.g. views_7d) take priority over
 * generic ones (e.g. views).
 *
 * @param {Object} row - Raw topic row from DB or CSV
 * @returns {Object} Row with normalized field names
 */
export function mapFields(row) {
  if (!row) return {};

  // Build a case-insensitive lookup map from the original row
  const ciMap = new Map();
  for (const [key, value] of Object.entries(row)) {
    ciMap.set(key.toLowerCase(), value);
  }

  /**
   * Return the value for the first matching key (case-insensitive).
   * @param {...string} keys - Candidate field names to check
   * @returns {*} The matched value or undefined
   */
  function pick(...keys) {
    for (const k of keys) {
      const val = ciMap.get(k.toLowerCase());
      if (val !== undefined && val !== null) return val;
    }
    return undefined;
  }

  return {
    // ── Identity ────────────────────────────────────────────────────────
    topicId: pick('topic_id', 'topicId', 'topicid'),
    topicName: pick('topic_name', 'topicName', 'topicname', 'name'),

    // ── Internal (IRS) metrics ──────────────────────────────────────────
    watchTimeHour7D: pick('watch_time_hour_7d', 'watchTimeHour7D', 'watchtimehour7d'),
    engagement7D: pick('engagement_7d', 'engagement7D', 'engagement7d'),
    views7D: pick('views_7d', 'views7D', 'views7d'),
    views1D: pick('views_1d', 'views1D', 'views1d'),
    subscribersAtPublish: pick(
      'total_followers_at_publish', 'totalFollowersAtPublish',
      'subscribers_at_publish', 'subscribersAtPublish',
      'totalfollowersatpublish',
    ),
    daysSincePublished: pick(
      'days_since_published', 'daysSincePublished', 'dayssincepublished',
    ),
    visualQualityScore: pick(
      'visual_quality_score', 'visualQualityScore', 'visualqualityscore',
    ),
    audioQualityScore: pick(
      'audio_quality_score', 'audioQualityScore', 'audioqualityscore',
    ),
    watchTimeHour: pick('watch_time_hour', 'watchTimeHour', 'watchtimehour'),
    potentialWatchTimeHour: pick(
      'potential_watch_time_hour', 'potentialWatchTimeHour',
      'potentialwatchtimehour',
    ),
    linearRegPrediction: pick(
      'linear_reg_7d_pred', 'linearReg7DPred', 'linearRegPrediction',
      'linearreg7dpred',
    ),
    shortsCreationToolsUploadsLifetime: pick(
      'shorts_creation_tools_uploads_lifetime',
      'shortsCreationToolsUploadsLifetime',
      'shortscreationtoolsuploadslifetime',
    ),
    creatorCountryCode: pick(
      'creator_country_code', 'creatorCountryCode', 'creatorcountrycode',
    ),
    downstreamUploads7D: pick(
      'downstream_uploads_7d', 'downstreamUploads7D', 'downstreamuploads7d',
    ),

    // ── External (ERS) metrics ──────────────────────────────────────────
    // For views, prefer the most specific available field
    views: pick('views_total', 'viewsTotal', 'views', 'Views', 'Views_7D', 'views_7d'),
    likes: pick('likes', 'Likes'),
    comments: pick('comments', 'Comments'),
    creatorSubscriberCount: pick(
      'creator_subscriber_count', 'creatorSubscriberCount',
      'creatorsubscribercount',
    ),
    brandSafe: pick('brand_safe', 'brandSafe', 'brandsafe'),
    userSentiment: pick('user_sentiment', 'userSentiment', 'usersentiment'),
    creationVolume: pick('creation_volume', 'creationVolume', 'creationvolume'),
    creationComplexity: pick(
      'creation_complexity', 'creationComplexity', 'creationcomplexity',
    ),
    platformsTrending: pick(
      'platforms_trending', 'platformsTrending', 'platformstrending',
    ),
    publicationDate: pick('publication_date', 'publicationDate', 'publicationdate'),
    dateIdentified: pick('date_identified', 'dateIdentified', 'dateidentified'),
    primaryMarkets: pick('primary_markets', 'primaryMarkets', 'primarymarkets'),
    trendScale: pick('trend_scale', 'trendScale', 'trendscale'),
    shortsVideoPublishedDate: pick(
      'shorts_video_published_date', 'shortsVideoPublishedDate',
      'shortsvideoblisheddate',
    ),

    // ── General / shared ────────────────────────────────────────────────
    market: pick('market'),
    dataTrack: pick('data_track', 'dataTrack', 'datatrack'),
    status: pick('status'),
    createdAt: pick('created_at', 'createdAt', 'createdat'),
    rankScore: pick('rank_score', 'rankScore', 'rankscore'),
    rankPosition: pick('rank_position', 'rankPosition', 'rankposition'),
  };
}

// ─── Helpers ────────────────────────────────────────────────────────────────

/**
 * Safely parse a value to a number. Returns the fallback if parsing fails
 * or the value is null/undefined.
 *
 * @param {*} value
 * @param {number} fallback
 * @returns {number}
 */
function num(value, fallback = 0) {
  if (value === null || value === undefined || value === '') return fallback;
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

/**
 * Calculate the number of days between a date and now.
 * Returns null if the date cannot be parsed.
 *
 * @param {string|Date} dateValue
 * @returns {number|null}
 */
function daysSince(dateValue) {
  if (!dateValue) return null;
  const d = new Date(dateValue);
  if (isNaN(d.getTime())) return null;
  const now = new Date();
  const diffMs = now - d;
  return Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
}

// ─── ERS (External Ranking Score) ───────────────────────────────────────────

/**
 * Calculate the External Ranking Score for a single topic.
 *
 * ERS is designed for agency / third-party data where fields may be
 * incomplete. Every field access includes a fallback so missing data
 * never produces NaN or crashes.
 *
 * @param {Object} row - Topic data (raw or mapped via mapFields)
 * @param {Map|null} prevWeekData - Map of topicName -> { views, score }
 *   from the previous week, used for weekly acceleration. Pass null to
 *   skip acceleration and fall back to daily velocity.
 * @returns {number} Raw ERS score (not yet normalized)
 */
export function calculateERS(row, prevWeekData = null) {
  const mapped = mapFields(row);

  // ── 1. Brand Safety Gate ────────────────────────────────────────────
  // If explicitly marked unsafe or negative sentiment, score is zero.
  // FALLBACK: if fields are missing, assume brand safe (don't block).
  const brandSafe = mapped.brandSafe;
  if (brandSafe === false || brandSafe === 'false') return 0.0;

  const sentiment = (mapped.userSentiment || '').toLowerCase();
  if (sentiment === 'negative') return 0.0;

  // ── 2. Impact Score ─────────────────────────────────────────────────
  // log(views) * engagement_rate
  // Engagement rate = (likes + comments) / views
  const views = num(mapped.views, 0);
  const safeViews = Math.max(views, 1); // avoid log(0)
  const likes = num(mapped.likes, 0);
  const comments = num(mapped.comments, 0);
  const engagementRate = (likes + comments) / safeViews;
  const impactScore = Math.log(safeViews) * engagementRate;

  // ── 3. Velocity Score ───────────────────────────────────────────────
  // views / subscriber_count — measures how viral vs. expected reach
  const subscriberCount = Math.max(num(mapped.creatorSubscriberCount, 1), 1);
  const velocityScore = views / subscriberCount;

  // ── 4. Weekly Acceleration ──────────────────────────────────────────
  // If we have last week's data for this topic, calculate growth rate.
  // Otherwise fall back to a simple daily velocity.
  let accelerationBoost = 1.0;

  if (prevWeekData && mapped.topicName && prevWeekData.has(mapped.topicName)) {
    const prev = prevWeekData.get(mapped.topicName);
    const prevViews = num(prev.views, 0);
    if (prevViews > 0) {
      // Growth rate: (current - previous) / previous
      accelerationBoost = 1 + ((views - prevViews) / prevViews);
    }
  } else {
    // Fallback: daily velocity using publication date or date_identified
    const pubDate = mapped.publicationDate || mapped.dateIdentified || mapped.shortsVideoPublishedDate;
    const dsp = daysSince(pubDate);
    if (dsp !== null && dsp > 0) {
      accelerationBoost = views / dsp;
    }
    // If no date is available at all, accelerationBoost stays 1.0
  }

  // ── 5. Participation Score ──────────────────────────────────────────
  // creation_volume * complexity_multiplier
  const creationVolume = num(mapped.creationVolume, 1);
  const complexity = (mapped.creationComplexity || 'Medium').toLowerCase();
  let complexityMultiplier;
  switch (complexity) {
    case 'low':
      complexityMultiplier = CREATION_COMPLEXITY_LOW;
      break;
    case 'high':
      complexityMultiplier = CREATION_COMPLEXITY_HIGH;
      break;
    default: // 'medium' or anything unexpected
      complexityMultiplier = CREATION_COMPLEXITY_MEDIUM;
  }
  const participationScore = creationVolume * complexityMultiplier;

  // ── 6. Distribution Multiplier ──────────────────────────────────────
  // 1 + (0.2 * platformCount) — more platforms = wider distribution
  let platformCount = 1;
  if (mapped.platformsTrending && typeof mapped.platformsTrending === 'string' && mapped.platformsTrending.trim()) {
    platformCount = mapped.platformsTrending.split(',').filter(p => p.trim()).length;
  }
  const distributionMultiplier = 1 + (PLATFORM_BOOST * platformCount);

  // ── 7. Freshness Multiplier ─────────────────────────────────────────
  // Recently published topics get a boost; old topics decay.
  const pubDate = mapped.publicationDate || mapped.dateIdentified || mapped.shortsVideoPublishedDate;
  const dsp = daysSince(pubDate);
  let freshnessMultiplier;
  if (dsp === null) {
    // No publication date available — neutral multiplier
    freshnessMultiplier = 1.0;
  } else if (dsp > 14) {
    freshnessMultiplier = FRESHNESS_DECAY;
  } else {
    freshnessMultiplier = FRESHNESS_BOOST;
  }

  // ── 8. Market Booster ───────────────────────────────────────────────
  // 1 + (0.1 * marketCount) — trending in more markets = stronger signal
  let marketCount = 1;
  if (mapped.primaryMarkets && typeof mapped.primaryMarkets === 'string' && mapped.primaryMarkets.trim()) {
    marketCount = mapped.primaryMarkets.split(',').filter(m => m.trim()).length;
  }
  const marketBooster = 1 + (MARKET_BOOST * marketCount);

  // ── 9. Trend Scale Multiplier ───────────────────────────────────────
  // Creator-Led trends are slightly more actionable than Viewer-Led.
  const trendScale = (mapped.trendScale || '').toLowerCase();
  let trendScaleMultiplier;
  if (trendScale === 'creator-led') {
    trendScaleMultiplier = CREATOR_LED_SCALE_BOOST;
  } else if (trendScale === 'viewer-led') {
    trendScaleMultiplier = VIEWER_LED_SCALE_BOOST;
  } else {
    trendScaleMultiplier = 1.0;
  }

  // ── 10. Replicability ──────────────────────────────────────────────
  // Based on creation complexity: easier to replicate = higher score
  let replicabilityMultiplier;
  switch (complexity) {
    case 'low':
      replicabilityMultiplier = REPLICABILITY_MULTIPLIER_LOW;
      break;
    case 'high':
      replicabilityMultiplier = REPLICABILITY_MULTIPLIER_HIGH;
      break;
    default:
      replicabilityMultiplier = REPLICABILITY_MULTIPLIER_MEDIUM;
  }

  // ── Final ERS Calculation ───────────────────────────────────────────
  const ers =
    ((impactScore * velocityScore * accelerationBoost) + participationScore) *
    distributionMultiplier *
    freshnessMultiplier *
    marketBooster *
    trendScaleMultiplier *
    replicabilityMultiplier;

  return ers;
}

// ─── IRS (Internal Ranking Score) ───────────────────────────────────────────

/**
 * Calculate the Internal Ranking Score for a single topic.
 *
 * IRS uses internal (Nyan Cat) data which is expected to be complete,
 * but sensible defaults are still provided for safety.
 *
 * @param {Object} row - Topic data (raw or mapped via mapFields)
 * @param {Object|null} optionalBoosters - Optional booster flags:
 *   { tools: boolean, geo: boolean }
 * @returns {number} Raw IRS score (not yet normalized)
 */
export function calculateIRS(row, optionalBoosters = null) {
  const mapped = mapFields(row);

  // ── 1. Performance Base ─────────────────────────────────────────────
  // log(watchTimeHour7D + 1) * engagement7D
  // Adding 1 inside log prevents log(0) = -Infinity
  const watchTimeHour7D = num(mapped.watchTimeHour7D, 0);
  const engagement7D = num(mapped.engagement7D, 0);
  const performanceBase = Math.log(watchTimeHour7D + 1) * engagement7D;

  // ── 2. Reach Efficiency ─────────────────────────────────────────────
  // views7D / subscribers — how efficiently the content reaches beyond
  // the existing subscriber base
  const views7D = num(mapped.views7D, 0);
  const subscribersAtPublish = Math.max(num(mapped.subscribersAtPublish, 1), 1);
  const reachEfficiency = views7D / subscribersAtPublish;

  // ── 3. Freshness Decay ──────────────────────────────────────────────
  // 1 / (daysSincePublished + 1) — newer content is weighted more heavily
  const daysSincePublished = num(mapped.daysSincePublished, 0);
  const freshnessDecay = 1 / (daysSincePublished + 1);

  // ── 4. Predictive Velocity ──────────────────────────────────────────
  // (views1D / avgDailyViews) * linearRegPrediction
  // avgDailyViews = views7D / 7
  // This captures "current momentum" (views1D vs average) multiplied
  // by the linear regression prediction for continued growth.
  const views1D = num(mapped.views1D, 0);
  const avgDailyViews = Math.max(views7D / 7, 0.1); // floor at 0.1 to avoid div-by-zero
  const linearRegPrediction = num(mapped.linearRegPrediction, 1.0);
  const currentMomentum = views1D / avgDailyViews;
  const predictionMultiplier = linearRegPrediction;

  // ── 5. Quality Gate ─────────────────────────────────────────────────
  // Average of visual and audio quality scores (each 0–1)
  const visualQuality = num(mapped.visualQualityScore, DEFAULT_VIDEO_QUALITY);
  const audioQuality = num(mapped.audioQualityScore, DEFAULT_AUDIO_QUALITY);
  const qualityAvg = (visualQuality + audioQuality) / 2;

  // ── 6. Stickiness ──────────────────────────────────────────────────
  // Ratio of actual watch time to potential watch time, clamped to
  // [STICKINESS_BOOST_MIN, STICKINESS_BOOST_CAP].
  const actualWatchTime = num(mapped.watchTimeHour, 0);
  const potentialWatchTime = Math.max(num(mapped.potentialWatchTimeHour, 0.01), 0.01);
  const stickinessMultiplier = Math.max(
    STICKINESS_BOOST_MIN,
    Math.min(actualWatchTime / potentialWatchTime, STICKINESS_BOOST_CAP),
  );

  // ── 7. IRS Core ────────────────────────────────────────────────────
  let irsCore =
    (performanceBase * reachEfficiency * freshnessDecay) *
    (currentMomentum * predictionMultiplier) *
    qualityAvg *
    stickinessMultiplier;

  // ── 8. Optional Boosters ───────────────────────────────────────────
  if (optionalBoosters) {
    // Tools booster: reward creators using Shorts Creation Tools
    // Only applies if they have exceeded the lifetime upload threshold
    if (
      optionalBoosters.tools === true &&
      num(mapped.shortsCreationToolsUploadsLifetime, 0) > SCT_UPLOAD_LIFETIME_THRESHOLD
    ) {
      irsCore *= TOOLS_BOOST;
    }

    // Geo booster: reward multi-country reach
    if (optionalBoosters.geo === true) {
      let countryCount = 1;
      const cc = mapped.creatorCountryCode;
      if (cc && typeof cc === 'string' && cc.trim()) {
        countryCount = cc.split(',').filter(c => c.trim()).length;
      }
      irsCore *= (1 + (GEO_BOOST * countryCount));
    }
  }

  // ── 9. Downstream ─────────────────────────────────────────────────
  // Add flat points for downstream uploads inspired by this content
  const downstreamUploads7D = num(mapped.downstreamUploads7D, 0);
  const irs = irsCore + (downstreamUploads7D * DOWNSTREAM_BOOST);

  return irs;
}

// ─── Combined IRS+ERS ───────────────────────────────────────────────────────

/**
 * Calculate the combined score for a matched (center track) topic.
 *
 * The combined score is a weighted blend of IRS and ERS:
 *   combined = IRS * 0.8 + ERS * 0.2
 *
 * This gives primary weight to internal data (which is more complete and
 * trustworthy) while still factoring in external signal.
 *
 * @param {Object} row - Topic data
 * @param {Map|null} prevWeekData - Previous week data for ERS acceleration
 * @param {Object|null} optionalBoosters - IRS optional boosters
 * @returns {number} Raw combined score (not yet normalized)
 */
export function calculateCombinedScore(row, prevWeekData = null, optionalBoosters = null) {
  const irs = calculateIRS(row, optionalBoosters);
  const ers = calculateERS(row, prevWeekData);
  return (irs * INTERNAL_SCORE_WEIGHT) + (ers * EXTERNAL_SCORE_WEIGHT);
}

// ─── Normalization ──────────────────────────────────────────────────────────

/**
 * Normalize an array of raw scores to the 0–100 range using min-max
 * normalization.
 *
 * If all scores are identical (max === min), the original scores are
 * returned unchanged to avoid division by zero.
 *
 * @param {number[]} scores - Array of raw numeric scores
 * @returns {number[]} Array of normalized scores (0–100)
 */
export function normalizeScores(scores) {
  if (!scores || scores.length === 0) return [];

  const min = Math.min(...scores);
  const max = Math.max(...scores);

  // If all scores are the same, return them unchanged
  if (max === min) return scores;

  const range = max - min;
  return scores.map(s => ((s - min) / range) * 100);
}

// ─── Previous Week Data Lookup ──────────────────────────────────────────────

/**
 * Query the database for topics from the previous week (7–14 days ago)
 * for a given market and track.
 *
 * Returns a Map keyed by topic name so the ERS acceleration calculation
 * can quickly look up last week's views for the same topic.
 *
 * @param {string} market - Market code (e.g. 'JP', 'KR')
 * @param {string} track - Data track ('internal', 'external', 'matched')
 * @returns {Promise<Map<string, Object>>} Map of topicName -> { views, score, ... }
 */
export async function getPreviousWeekData(market, track) {
  const queryText = `
    SELECT
      topic_name,
      views_total,
      views_7d,
      rank_score
    FROM topics
    WHERE market = $1
      AND data_track = $2
      AND status = 'active'
      AND is_deleted = FALSE
      AND created_at >= CURRENT_TIMESTAMP - INTERVAL '14 days'
      AND created_at < CURRENT_TIMESTAMP - INTERVAL '7 days'
    ORDER BY created_at DESC
  `;

  const result = await query(queryText, [market, track]);
  const map = new Map();

  for (const row of result.rows) {
    // Use the first occurrence for each topic name (most recent)
    if (!map.has(row.topic_name)) {
      map.set(row.topic_name, {
        views: row.views_total || row.views_7d || 0,
        score: row.rank_score || 0,
      });
    }
  }

  return map;
}

// ─── Main Ranking Function ──────────────────────────────────────────────────

/**
 * Score, normalize, and rank all topics in a single track.
 *
 * Steps:
 *   1. Calculate raw scores using the appropriate algorithm
 *   2. Normalize all scores to the 0–100 range
 *   3. Sort descending by normalized score
 *   4. Assign rank positions (1, 2, 3, ...)
 *
 * @param {Object[]} topics - Array of topic objects to rank
 * @param {'internal'|'external'|'matched'} track - Which scoring algorithm to use
 * @param {string} market - Market code for previous week lookups
 * @param {Object|null} optionalBoosters - Optional IRS boosters { tools, geo }
 * @returns {Promise<Object[]>} Topics with rankScore and rankPosition set,
 *   sorted by rank descending
 */
export async function rankTrack(topics, track, market, optionalBoosters = null) {
  if (!topics || topics.length === 0) return [];

  // Fetch previous week data for ERS acceleration (external and matched tracks)
  let prevWeekData = null;
  if (track === 'external' || track === 'matched') {
    try {
      prevWeekData = await getPreviousWeekData(market, track);
    } catch (err) {
      console.warn(
        `[RankingEngine] Failed to fetch previous week data for ${market}/${track}:`,
        err.message,
      );
      // Continue without previous week data — acceleration will use fallback
    }
  }

  // ── Step 1: Calculate raw scores ────────────────────────────────────
  const rawScores = topics.map(topic => {
    switch (track) {
      case 'internal':
        return calculateIRS(topic, optionalBoosters);
      case 'external':
        return calculateERS(topic, prevWeekData);
      case 'matched':
        return calculateCombinedScore(topic, prevWeekData, optionalBoosters);
      default:
        console.warn(`[RankingEngine] Unknown track "${track}", defaulting to ERS`);
        return calculateERS(topic, prevWeekData);
    }
  });

  // ── Step 2: Normalize scores to 0–100 ──────────────────────────────
  const normalizedScores = normalizeScores(rawScores);

  // ── Step 3 & 4: Attach scores, sort, and assign positions ──────────
  const rankedTopics = topics.map((topic, i) => ({
    ...topic,
    rankScore: Math.round(normalizedScores[i] * 100) / 100, // 2 decimal places
    rankPosition: 0, // placeholder, set after sort
  }));

  // Sort descending by normalized score
  rankedTopics.sort((a, b) => b.rankScore - a.rankScore);

  // Assign rank positions starting at 1
  for (let i = 0; i < rankedTopics.length; i++) {
    rankedTopics[i].rankPosition = i + 1;
  }

  return rankedTopics;
}

// ─── Exports ────────────────────────────────────────────────────────────────

export default {
  calculateERS,
  calculateIRS,
  calculateCombinedScore,
  normalizeScores,
  rankTrack,
  getPreviousWeekData,
  mapFields,
};
