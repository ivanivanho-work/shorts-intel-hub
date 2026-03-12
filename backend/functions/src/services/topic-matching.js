/**
 * Topic Matching Algorithm — Two-Stage Pipeline
 *
 * Matches topics across Internal (Nyan Cat) and External (Vayner Media / Agency)
 * data sources using a two-stage approach:
 *
 *   Stage 1: Embedding Sweep (fast cosine similarity pass)
 *   Stage 2: LLM Deep Review (Gemini-based pairwise classification)
 *
 * Output is sorted into three tracks:
 *   - matchedTopics  (Center Track)  — consolidated cross-source or within-source matches
 *   - internalOnly   — internal topics not matched cross-source, with optional relatedTopics
 *   - externalOnly   — external topics not matched cross-source, with optional relatedTopics
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import { generateEmbedding, cosineSimilarity } from '../services/gemini-service.js';

// ─── Constants ───────────────────────────────────────────────────────────────

/** Cosine similarity threshold for automatic Stage 1 matching */
const AUTO_MATCH_THRESHOLD = 0.88;

/** Minimum LLM confidence (1-10) for SAME_TOPIC to count as a match */
const LLM_MATCH_MIN_CONFIDENCE = 6;

/** Maximum number of topic pairs per Gemini batch call */
const LLM_BATCH_SIZE = 5;

/** Delay between LLM API calls (ms) for rate limiting */
const LLM_RATE_LIMIT_MS = 200;

// Initialize Gemini for Stage 2 LLM calls
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Unique identifier for a topic. Falls back to topicName if topicId is absent.
 *
 * @param {Object} topic
 * @returns {string}
 */
function topicKey(topic) {
  return topic.topicId || topic.topicName;
}

/**
 * Determine the source type label for a topic.
 * Internal = Nyan Cat, External = Vayner Media / Agency.
 *
 * @param {Object} topic
 * @returns {'internal'|'external'}
 */
function sourceType(topic) {
  return topic.sourceType || 'internal';
}

/**
 * Pick the "best" name from a group of topics — longest name wins as a
 * simple heuristic for descriptiveness.
 *
 * @param {Object[]} topics
 * @returns {string}
 */
function pickBestName(topics) {
  return topics.reduce(
    (best, t) => (t.topicName.length > best.length ? t.topicName : best),
    '',
  );
}

/**
 * Pick the richest (longest) description from a group of topics.
 *
 * @param {Object[]} topics
 * @returns {string}
 */
function pickBestDescription(topics) {
  return topics.reduce(
    (best, t) => ((t.description || '').length > best.length ? t.description : best),
    '',
  );
}

// ─── Stage 1: Embedding Sweep ────────────────────────────────────────────────

/**
 * Compute pairwise cosine similarity between two sets of topics and return
 * pairs that exceed the auto-match threshold.
 *
 * Both sets may be the same array (for within-source comparisons). In that
 * case set `sameSet = true` so only unique pairs (i < j) are produced and
 * self-comparisons are skipped.
 *
 * @param {Object[]} topics1 - First set of topics (each must have `embedding`)
 * @param {Object[]} topics2 - Second set of topics (each must have `embedding`)
 * @param {boolean}  [sameSet=false] - True when topics1 === topics2
 * @returns {{ autoMatches: Object[], remaining: Object[] }}
 *   autoMatches — pairs with similarity >= AUTO_MATCH_THRESHOLD
 *   remaining   — all other pairs (candidates for Stage 2)
 */
export function embeddingSweep(topics1, topics2, sameSet = false) {
  const autoMatches = [];
  const remaining = [];

  for (let i = 0; i < topics1.length; i++) {
    const startJ = sameSet ? i + 1 : 0;

    for (let j = startJ; j < topics2.length; j++) {
      // Skip if both references point to the exact same topic object
      if (topics1[i] === topics2[j]) continue;

      const a = topics1[i];
      const b = topics2[j];

      // Guard against missing or empty embeddings
      if (
        !a.embedding || !b.embedding ||
        a.embedding.length === 0 || b.embedding.length === 0
      ) {
        remaining.push({ topicA: a, topicB: b, similarity: 0 });
        continue;
      }

      const similarity = cosineSimilarity(a.embedding, b.embedding);
      const pair = { topicA: a, topicB: b, similarity };

      if (similarity >= AUTO_MATCH_THRESHOLD) {
        autoMatches.push(pair);
      } else {
        remaining.push(pair);
      }
    }
  }

  return { autoMatches, remaining };
}

// ─── Stage 2: LLM Deep Review ────────────────────────────────────────────────

/**
 * Build the structured prompt sent to Gemini for pairwise topic comparison.
 *
 * @param {Object[]} pairs - Array of { topicA, topicB } objects
 * @returns {string} Prompt text
 */
function buildLLMPrompt(pairs) {
  const pairDescriptions = pairs.map((pair, idx) => {
    const a = pair.topicA;
    const b = pair.topicB;
    return [
      `--- Pair ${idx} ---`,
      `Topic A: ${a.topicName}`,
      `  Description: ${a.description || 'N/A'}`,
      `  Hashtags: ${(a.hashtags || []).join(', ') || 'N/A'}`,
      `  Target Demo: ${a.targetDemo || 'N/A'}`,
      `  Source: ${a.source || 'N/A'}`,
      `  Market: ${a.market || 'N/A'}`,
      `Topic B: ${b.topicName}`,
      `  Description: ${b.description || 'N/A'}`,
      `  Hashtags: ${(b.hashtags || []).join(', ') || 'N/A'}`,
      `  Target Demo: ${b.targetDemo || 'N/A'}`,
      `  Source: ${b.source || 'N/A'}`,
      `  Market: ${b.market || 'N/A'}`,
    ].join('\n');
  });

  return `You are analyzing trending topics from YouTube Shorts across APAC markets.
For each pair of topics below, determine if they represent the same underlying trend or theme.
Consider that different platforms and data sources may describe the same trend using different terminology, hashtags, or demographic framing.

For each pair, classify as:
- SAME_TOPIC: These describe the same underlying trend (even if using different words)
- RELATED_THEME: These share thematic overlap but are distinct trends
- DIFFERENT: No meaningful connection

Provide confidence (1-10) and a brief explanation for each.

Respond in JSON format: [{ "pairIndex": 0, "classification": "SAME_TOPIC", "confidence": 8, "explanation": "..." }, ...]

${pairDescriptions.join('\n\n')}`;
}

/**
 * Send a single batch of topic pairs to Gemini for classification.
 *
 * @param {Object[]} batch - Slice of candidate pairs (max LLM_BATCH_SIZE)
 * @returns {Promise<Object[]>} Array of { pairIndex, classification, confidence, explanation }
 */
async function classifyBatch(batch) {
  const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
  const prompt = buildLLMPrompt(batch);

  const result = await model.generateContent(prompt);
  const response = await result.response;
  const text = response.text();

  // Extract the JSON array from the response (may be wrapped in markdown fences)
  const jsonMatch = text.match(/\[[\s\S]*\]/);
  if (!jsonMatch) {
    throw new Error('Failed to parse JSON array from Gemini response');
  }

  return JSON.parse(jsonMatch[0]);
}

/**
 * Run LLM verification on all candidate pairs from Stage 1.
 *
 * Pairs are batched (up to LLM_BATCH_SIZE per call) with rate limiting.
 * Individual batch failures are caught and logged — they do not crash the
 * pipeline.
 *
 * @param {Object[]} candidatePairs - Array of { topicA, topicB, similarity }
 * @returns {Promise<Object[]>} Classified pairs with LLM judgments attached:
 *   { topicA, topicB, similarity, classification, confidence, explanation }
 */
export async function llmVerification(candidatePairs) {
  if (candidatePairs.length === 0) return [];

  const results = [];
  const batches = [];

  // Chunk candidate pairs into batches of LLM_BATCH_SIZE
  for (let i = 0; i < candidatePairs.length; i += LLM_BATCH_SIZE) {
    batches.push(candidatePairs.slice(i, i + LLM_BATCH_SIZE));
  }

  console.log(
    `[TopicMatching] Stage 2: ${candidatePairs.length} pairs in ${batches.length} batch(es)`,
  );

  for (let batchIdx = 0; batchIdx < batches.length; batchIdx++) {
    const batch = batches[batchIdx];

    try {
      console.log(
        `[TopicMatching] Processing batch ${batchIdx + 1}/${batches.length} (${batch.length} pairs)`,
      );

      const classifications = await classifyBatch(batch);

      // Merge classifications back into their corresponding candidate pairs
      const classifiedIndices = new Set();
      for (const cls of classifications) {
        const pairIndex = cls.pairIndex;

        if (pairIndex < 0 || pairIndex >= batch.length) {
          console.warn(
            `[TopicMatching] Invalid pairIndex ${pairIndex} in batch ${batchIdx + 1}, skipping`,
          );
          continue;
        }

        classifiedIndices.add(pairIndex);
        const pair = batch[pairIndex];

        results.push({
          topicA: pair.topicA,
          topicB: pair.topicB,
          similarity: pair.similarity,
          classification: cls.classification,
          confidence: cls.confidence,
          explanation: cls.explanation,
        });
      }

      // Handle pairs that the LLM didn't return results for
      for (let i = 0; i < batch.length; i++) {
        if (!classifiedIndices.has(i)) {
          results.push({
            topicA: batch[i].topicA,
            topicB: batch[i].topicB,
            similarity: batch[i].similarity,
            classification: 'DIFFERENT',
            confidence: 0,
            explanation: 'LLM did not return a classification for this pair',
          });
        }
      }
    } catch (error) {
      console.error(
        `[TopicMatching] Batch ${batchIdx + 1} failed:`, error.message,
      );

      // Mark every pair in the failed batch as DIFFERENT so we don't lose data
      for (const pair of batch) {
        results.push({
          topicA: pair.topicA,
          topicB: pair.topicB,
          similarity: pair.similarity,
          classification: 'DIFFERENT',
          confidence: 0,
          explanation: `LLM classification failed: ${error.message}`,
        });
      }
    }

    // Rate limit between batches (skip delay after the last one)
    if (batchIdx < batches.length - 1) {
      await new Promise(resolve => setTimeout(resolve, LLM_RATE_LIMIT_MS));
    }
  }

  return results;
}

// ─── Union-Find (Disjoint Set) ───────────────────────────────────────────────

/**
 * Minimal Union-Find implementation for transitive match grouping.
 * Topics that match A-B and B-C should all land in the same consolidated group.
 */
class UnionFind {
  constructor() {
    /** @type {Map<string, string>} */
    this.parent = new Map();
  }

  find(key) {
    if (!this.parent.has(key)) this.parent.set(key, key);
    if (this.parent.get(key) !== key) {
      // Path compression
      this.parent.set(key, this.find(this.parent.get(key)));
    }
    return this.parent.get(key);
  }

  union(a, b) {
    const rootA = this.find(a);
    const rootB = this.find(b);
    if (rootA !== rootB) this.parent.set(rootA, rootB);
  }

  /**
   * Return all groups as a Map<rootKey, Set<memberKey>>.
   * Only includes keys that have been registered via find/union.
   */
  groups() {
    const result = new Map();
    for (const key of this.parent.keys()) {
      const root = this.find(key);
      if (!result.has(root)) result.set(root, new Set());
      result.get(root).add(key);
    }
    // Ensure every root is also listed as a member of its own group
    for (const [root, members] of result) {
      members.add(root);
    }
    return result;
  }
}

// ─── Main Pipeline ───────────────────────────────────────────────────────────

/**
 * Run the full two-stage topic matching pipeline.
 *
 * @param {Object[]} internalTopics - Topics from internal (Nyan Cat) source.
 *   Each topic should have at minimum: topicId, topicName, description,
 *   embedding (768-dim array). sourceType will be set to 'internal'.
 * @param {Object[]} externalTopics - Topics from external (Agency) source.
 *   Same shape; sourceType will be set to 'external'.
 * @returns {Promise<{
 *   matchedTopics: Object[],
 *   internalOnly: Object[],
 *   externalOnly: Object[],
 *   stats: Object
 * }>}
 */
export async function runTopicMatching(internalTopics, externalTopics) {
  const startTime = Date.now();

  console.log(
    `[TopicMatching] Starting pipeline — ` +
    `${internalTopics.length} internal, ${externalTopics.length} external topics`,
  );

  // Tag source types so downstream logic can distinguish them
  internalTopics.forEach(t => { t.sourceType = 'internal'; });
  externalTopics.forEach(t => { t.sourceType = 'external'; });

  const allTopics = [...internalTopics, ...externalTopics];

  // ── Stage 1: Embedding Sweep ──────────────────────────────────────────────

  console.log('[TopicMatching] Stage 1: Embedding sweep');

  // 1a. Cross-source: internal x external
  const cross = embeddingSweep(internalTopics, externalTopics);

  // 1b. Within-source: internal x internal
  const withinInternal = embeddingSweep(internalTopics, internalTopics, true);

  // 1c. Within-source: external x external
  const withinExternal = embeddingSweep(externalTopics, externalTopics, true);

  // Aggregate all Stage 1 auto-matches
  const stage1AutoMatches = [
    ...cross.autoMatches,
    ...withinInternal.autoMatches,
    ...withinExternal.autoMatches,
  ];

  console.log(`[TopicMatching] Stage 1 auto-matches: ${stage1AutoMatches.length}`);

  // Collect topic keys that were auto-matched — these are removed from Stage 2
  const autoMatchedKeys = new Set();
  for (const match of stage1AutoMatches) {
    autoMatchedKeys.add(topicKey(match.topicA));
    autoMatchedKeys.add(topicKey(match.topicB));
  }

  // Build Stage 2 candidate pool: remaining pairs where BOTH topics were NOT
  // already auto-matched (auto-matched topics are already handled)
  const stage2Candidates = [
    ...cross.remaining,
    ...withinInternal.remaining,
    ...withinExternal.remaining,
  ].filter(
    pair =>
      !autoMatchedKeys.has(topicKey(pair.topicA)) &&
      !autoMatchedKeys.has(topicKey(pair.topicB)),
  );

  const totalPairs = stage1AutoMatches.length + stage2Candidates.length;

  console.log(`[TopicMatching] Stage 2 candidates: ${stage2Candidates.length} pairs`);

  // ── Stage 2: LLM Deep Review ─────────────────────────────────────────────

  console.log('[TopicMatching] Stage 2: LLM deep review');

  const llmResults = await llmVerification(stage2Candidates);

  // ── Build consolidated outputs ────────────────────────────────────────────

  const uf = new UnionFind();

  // Track per-edge metadata for building the final output
  const matchEdges = [];

  // Register Stage 1 auto-matches
  for (const m of stage1AutoMatches) {
    const keyA = topicKey(m.topicA);
    const keyB = topicKey(m.topicB);
    uf.union(keyA, keyB);
    matchEdges.push({
      topicA: m.topicA,
      topicB: m.topicB,
      confidence: Math.round(m.similarity * 10), // 0-1 scaled to 1-10
      method: 'embedding',
      explanation: 'High embedding similarity',
    });
  }

  // Register Stage 2 SAME_TOPIC matches meeting the confidence threshold
  let stage2Matches = 0;
  let relatedFlags = 0;
  const relatedPairs = [];

  for (const r of llmResults) {
    if (r.classification === 'SAME_TOPIC' && r.confidence >= LLM_MATCH_MIN_CONFIDENCE) {
      const keyA = topicKey(r.topicA);
      const keyB = topicKey(r.topicB);
      uf.union(keyA, keyB);
      matchEdges.push({
        topicA: r.topicA,
        topicB: r.topicB,
        confidence: r.confidence,
        method: 'llm',
        explanation: r.explanation,
      });
      stage2Matches++;
    } else if (r.classification === 'RELATED_THEME') {
      relatedPairs.push(r);
      relatedFlags++;
    }
  }

  // ── Group matched topics by their Union-Find root ─────────────────────────

  // Quick lookup map: topicKey -> topic object
  const topicByKey = new Map();
  for (const t of allTopics) {
    topicByKey.set(topicKey(t), t);
  }

  const groups = uf.groups();

  // Build matchedTopics from groups with 2+ members
  const matchedTopics = [];
  const crossSourceMatchedKeys = new Set();

  for (const [, memberKeys] of groups) {
    if (memberKeys.size < 2) continue;

    const members = [...memberKeys]
      .map(k => topicByKey.get(k))
      .filter(Boolean);

    if (members.length < 2) continue;

    // Determine if this group spans both sources
    const hasInternal = members.some(t => sourceType(t) === 'internal');
    const hasExternal = members.some(t => sourceType(t) === 'external');
    const matchType = hasInternal && hasExternal ? 'cross_source' : 'within_source';

    // Collect edges belonging to this group
    const groupEdges = matchEdges.filter(
      e => memberKeys.has(topicKey(e.topicA)) && memberKeys.has(topicKey(e.topicB)),
    );

    // Build the sources array with per-topic confidence and method
    const sources = members.map(t => {
      const key = topicKey(t);
      const edgesForTopic = groupEdges.filter(
        e => topicKey(e.topicA) === key || topicKey(e.topicB) === key,
      );

      const bestConf = edgesForTopic.length > 0
        ? Math.max(...edgesForTopic.map(e => e.confidence))
        : 0;

      const bestEdge = edgesForTopic.find(e => e.confidence === bestConf);
      const bestMethod = bestEdge ? bestEdge.method : 'embedding';

      return {
        topicId: t.topicId,
        topicName: t.topicName,
        sourceType: sourceType(t),
        confidence: bestConf,
        method: bestMethod,
      };
    });

    // Average confidence across all sources in this group
    const avgConfidence = sources.length > 0
      ? Math.round(
          (sources.reduce((sum, s) => sum + s.confidence, 0) / sources.length) * 10,
        ) / 10
      : 0;

    // Combine all explanations for this group
    const explanations = groupEdges.map(e => e.explanation).filter(Boolean);
    const llmExplanation = explanations.length > 0
      ? explanations.join(' | ')
      : 'High embedding similarity';

    matchedTopics.push({
      consolidatedName: pickBestName(members),
      consolidatedDescription: pickBestDescription(members),
      matchCount: members.length,
      sources,
      matchType,
      avgConfidence,
      llmExplanation,
    });

    // Cross-source matched topics are removed from internalOnly / externalOnly
    if (matchType === 'cross_source') {
      for (const key of memberKeys) {
        crossSourceMatchedKeys.add(key);
      }
    }
  }

  // ── Build relatedTopics lookup (bidirectional) ────────────────────────────

  const relatedMap = new Map();

  for (const rp of relatedPairs) {
    const keyA = topicKey(rp.topicA);
    const keyB = topicKey(rp.topicB);

    if (!relatedMap.has(keyA)) relatedMap.set(keyA, []);
    relatedMap.get(keyA).push({
      topicId: rp.topicB.topicId,
      topicName: rp.topicB.topicName,
      relationship: 'RELATED_THEME',
      confidence: rp.confidence,
    });

    if (!relatedMap.has(keyB)) relatedMap.set(keyB, []);
    relatedMap.get(keyB).push({
      topicId: rp.topicA.topicId,
      topicName: rp.topicA.topicName,
      relationship: 'RELATED_THEME',
      confidence: rp.confidence,
    });
  }

  // ── Build internalOnly / externalOnly tracks ──────────────────────────────
  // Within-source matches do NOT remove topics from their track — they only
  // get relatedTopics annotations. Only cross-source matches remove topics.

  const internalOnly = internalTopics
    .filter(t => !crossSourceMatchedKeys.has(topicKey(t)))
    .map(t => ({
      ...t,
      relatedTopics: relatedMap.get(topicKey(t)) || [],
    }));

  const externalOnly = externalTopics
    .filter(t => !crossSourceMatchedKeys.has(topicKey(t)))
    .map(t => ({
      ...t,
      relatedTopics: relatedMap.get(topicKey(t)) || [],
    }));

  // ── Sort matched topics by signal value ───────────────────────────────────
  // Higher match count = higher signal; ties broken by confidence.

  matchedTopics.sort((a, b) => {
    if (b.matchCount !== a.matchCount) return b.matchCount - a.matchCount;
    return b.avgConfidence - a.avgConfidence;
  });

  // ── Stats ─────────────────────────────────────────────────────────────────

  const processingTimeMs = Date.now() - startTime;

  const stats = {
    totalPairs,
    stage1Matches: stage1AutoMatches.length,
    stage2Matches,
    relatedFlags,
    processingTimeMs,
  };

  console.log(`[TopicMatching] Pipeline complete in ${processingTimeMs}ms`);
  console.log(
    `[TopicMatching] Results — ${matchedTopics.length} matched groups, ` +
    `${internalOnly.length} internal-only, ${externalOnly.length} external-only`,
  );
  console.log(
    `[TopicMatching] Stats — Stage1: ${stats.stage1Matches}, ` +
    `Stage2: ${stats.stage2Matches}, Related: ${stats.relatedFlags}`,
  );

  return { matchedTopics, internalOnly, externalOnly, stats };
}

export default {
  runTopicMatching,
  embeddingSweep,
  llmVerification,
};
