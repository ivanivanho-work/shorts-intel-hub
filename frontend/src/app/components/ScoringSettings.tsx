'use client';

import { useState, useEffect, useCallback } from 'react';
import { Info, ChevronDown, ChevronUp, Search, Brain, BarChart3, Zap, Shield } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

interface BoosterConfig {
  tools: boolean;
  geo: boolean;
}

export function ScoringSettings() {
  const [boosters, setBoosters] = useState<BoosterConfig>({ tools: false, geo: false });
  const [market, setMarket] = useState('JP');
  const [saving, setSaving] = useState(false);
  const [matchingDetailOpen, setMatchingDetailOpen] = useState(false);
  const [rankingDetailOpen, setRankingDetailOpen] = useState(false);
  const [multipliersOpen, setMultipliersOpen] = useState(false);

  const fetchConfig = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/ranking/config?market=${market}`);
      if (res.ok) {
        const data = await res.json();
        setBoosters(data.optionalBoosters);
      }
    } catch (err) {
      console.error('Failed to fetch ranking config:', err);
    }
  }, [market]);

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  const saveConfig = async (updated: BoosterConfig) => {
    setSaving(true);
    try {
      await fetch(`${API_BASE}/ranking/config`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ market, optionalBoosters: updated })
      });
    } catch (err) {
      console.error('Failed to save ranking config:', err);
    } finally {
      setSaving(false);
    }
  };

  const toggleBooster = (key: keyof BoosterConfig) => {
    const updated = { ...boosters, [key]: !boosters[key] };
    setBoosters(updated);
    saveConfig(updated);
  };

  return (
    <div className="max-w-4xl space-y-6">
      {/* Market Selector */}
      <div className="flex items-center gap-3">
        <label className="text-sm font-medium text-muted-foreground">Market:</label>
        <select
          value={market}
          onChange={(e) => setMarket(e.target.value)}
          className="px-3 py-1.5 rounded-lg border border-border bg-card text-foreground text-sm"
        >
          {['JP', 'KR', 'IN', 'ID', 'AUNZ'].map((m) => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>
      </div>

      {/* ================================================================
          Section 1: Topic Matching — How It Works
          ================================================================ */}
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <button
          onClick={() => setMatchingDetailOpen(!matchingDetailOpen)}
          className="w-full px-5 py-3 border-b border-border bg-purple-500/10 flex items-center justify-between hover:bg-purple-500/15 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Search className="size-4 text-purple-400" />
            <h3 className="text-sm font-semibold text-purple-400 uppercase tracking-wider">
              Topic Matching Algorithm
            </h3>
          </div>
          {matchingDetailOpen ? (
            <ChevronUp className="size-4 text-purple-400" />
          ) : (
            <ChevronDown className="size-4 text-purple-400" />
          )}
        </button>

        {matchingDetailOpen && (
          <div className="p-5 space-y-5">
            <p className="text-sm text-muted-foreground leading-relaxed">
              The topic matching system identifies common topics across internal (Shorts/Nyan Cat) and external (Tubular/TikTok/Reels) data sources using a two-stage pipeline. Topics that appear on both platforms represent the highest-confidence trends.
            </p>

            {/* Stage 1 */}
            <div className="p-4 rounded-lg border border-border bg-muted/30">
              <div className="flex items-center gap-2 mb-3">
                <Zap className="size-4 text-yellow-400" />
                <h4 className="text-sm font-semibold text-foreground">Stage 1: Embedding Sweep</h4>
                <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-500/10 text-yellow-400 border border-yellow-500/20">Fast Pass</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed mb-3">
                Every topic's name and description is converted into a numerical vector (embedding) using Google's text embedding model. These vectors capture the semantic meaning of each topic — not just keywords, but the underlying concept.
              </p>
              <p className="text-xs text-muted-foreground leading-relaxed mb-3">
                We then calculate the <strong className="text-foreground">cosine similarity</strong> between every pair of internal and external topics. Cosine similarity measures how closely two vectors point in the same direction, on a scale from 0 (completely different) to 1 (identical meaning).
              </p>
              <div className="p-3 rounded bg-muted/50 border border-border">
                <div className="text-xs font-mono text-foreground/80 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="w-28 text-muted-foreground">Similarity &ge; 0.88</span>
                    <span className="px-2 py-0.5 rounded bg-green-500/10 text-green-400 text-xs">Auto-matched</span>
                    <span className="text-muted-foreground">— High confidence, sent directly to center track</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-28 text-muted-foreground">Similarity &lt; 0.88</span>
                    <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 text-xs">Passed to Stage 2</span>
                    <span className="text-muted-foreground">— Needs deeper review by LLM</span>
                  </div>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-3 italic">
                Stage 1 never discards topics. It only identifies the easy, obvious matches to reduce the workload for Stage 2.
              </p>
            </div>

            {/* Stage 2 */}
            <div className="p-4 rounded-lg border border-border bg-muted/30">
              <div className="flex items-center gap-2 mb-3">
                <Brain className="size-4 text-blue-400" />
                <h4 className="text-sm font-semibold text-foreground">Stage 2: LLM Verification</h4>
                <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">Deep Analysis</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed mb-3">
                All topic pairs not already matched in Stage 1 are sent to <strong className="text-foreground">Google Gemini</strong> for pairwise semantic analysis. The LLM reads both topic names and descriptions, understanding context, synonyms, and conceptual overlap that pure embeddings might miss.
              </p>
              <p className="text-xs text-muted-foreground leading-relaxed mb-3">
                For each pair, the LLM classifies the relationship as one of three categories:
              </p>
              <div className="p-3 rounded bg-muted/50 border border-border space-y-2">
                <div className="flex items-start gap-2 text-xs">
                  <span className="px-2 py-0.5 rounded bg-green-500/10 text-green-400 font-medium flex-shrink-0">SAME_TOPIC</span>
                  <span className="text-muted-foreground">These topics are fundamentally about the same trend or content theme. Merged into a single cross-source match on the center track.</span>
                </div>
                <div className="flex items-start gap-2 text-xs">
                  <span className="px-2 py-0.5 rounded bg-yellow-500/10 text-yellow-400 font-medium flex-shrink-0">RELATED_THEME</span>
                  <span className="text-muted-foreground">These topics share a broad theme but are distinct trends. Flagged as related for context but kept as separate entries on their respective tracks.</span>
                </div>
                <div className="flex items-start gap-2 text-xs">
                  <span className="px-2 py-0.5 rounded bg-muted text-muted-foreground font-medium flex-shrink-0">DIFFERENT</span>
                  <span className="text-muted-foreground">No meaningful connection. Topics remain independent on their own tracks.</span>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-3 italic">
                Pairs are processed in batches of 5 with rate limiting to stay within API quotas. A union-find algorithm handles transitive matches (if A=B and B=C, then A=B=C are all grouped together).
              </p>
            </div>
          </div>
        )}
      </div>

      {/* ================================================================
          Section 2: Ranking Algorithm — Detailed
          ================================================================ */}
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <button
          onClick={() => setRankingDetailOpen(!rankingDetailOpen)}
          className="w-full px-5 py-3 border-b border-border bg-yellow-500/10 flex items-center justify-between hover:bg-yellow-500/15 transition-colors"
        >
          <div className="flex items-center gap-2">
            <BarChart3 className="size-4 text-yellow-400" />
            <h3 className="text-sm font-semibold text-yellow-400 uppercase tracking-wider">
              Ranking Algorithm
            </h3>
          </div>
          {rankingDetailOpen ? (
            <ChevronUp className="size-4 text-yellow-400" />
          ) : (
            <ChevronDown className="size-4 text-yellow-400" />
          )}
        </button>

        {rankingDetailOpen && (
          <div className="p-5 space-y-5">
            <p className="text-sm text-muted-foreground leading-relaxed">
              After topic matching, each track is independently scored and ranked. Topics are scored using track-specific algorithms, then normalized to a 0-100 scale within each track.
            </p>

            {/* IRS Detail */}
            <div className="p-4 rounded-lg border border-purple-500/20 bg-purple-500/5">
              <h4 className="text-sm font-semibold text-purple-400 mb-2">IRS — Internal Ranking Score (Shorts Data)</h4>
              <p className="text-xs text-muted-foreground mb-3">
                Used for the Internal track. Measures how well a topic is performing on YouTube Shorts using 7 factors:
              </p>
              <div className="space-y-1.5 text-xs">
                <div className="flex items-start gap-2">
                  <span className="text-purple-400 font-mono w-4 flex-shrink-0">1.</span>
                  <div><strong className="text-foreground">Performance Base</strong> <span className="text-muted-foreground">— log(watch time) x engagement. Rewards high watch time with diminishing returns.</span></div>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-purple-400 font-mono w-4 flex-shrink-0">2.</span>
                  <div><strong className="text-foreground">Reach Efficiency</strong> <span className="text-muted-foreground">— views / subscribers. How well content performs beyond existing audience.</span></div>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-purple-400 font-mono w-4 flex-shrink-0">3.</span>
                  <div><strong className="text-foreground">Freshness Decay</strong> <span className="text-muted-foreground">— 1/(days+1). Newer content is weighted more heavily.</span></div>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-purple-400 font-mono w-4 flex-shrink-0">4.</span>
                  <div><strong className="text-foreground">Predictive Velocity</strong> <span className="text-muted-foreground">— (today's views / avg daily) x linear regression prediction. Captures current momentum.</span></div>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-purple-400 font-mono w-4 flex-shrink-0">5.</span>
                  <div><strong className="text-foreground">Quality Gate</strong> <span className="text-muted-foreground">— Average of visual and audio quality scores (0-1). Filters low-quality content.</span></div>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-purple-400 font-mono w-4 flex-shrink-0">6.</span>
                  <div><strong className="text-foreground">Stickiness</strong> <span className="text-muted-foreground">— Actual watch time / potential watch time. Measures viewer retention.</span></div>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-purple-400 font-mono w-4 flex-shrink-0">7.</span>
                  <div><strong className="text-foreground">Downstream Boost</strong> <span className="text-muted-foreground">— +10 points per downstream upload. Rewards content that inspires creation.</span></div>
                </div>
              </div>
              <div className="mt-3 p-2 rounded bg-muted/50 border border-border">
                <code className="text-xs text-foreground/80 font-mono">
                  IRS = (Performance x Reach x Freshness x Velocity x Quality x Stickiness) + Downstream
                </code>
              </div>
            </div>

            {/* ERS Detail */}
            <div className="p-4 rounded-lg border border-blue-500/20 bg-blue-500/5">
              <h4 className="text-sm font-semibold text-blue-400 mb-2">ERS — External Ranking Score (Off-Platform Data)</h4>
              <p className="text-xs text-muted-foreground mb-3">
                Used for the External track. Designed for Tubular/agency data where fields may be incomplete. Includes fallbacks for every field so missing data never breaks the score.
              </p>
              <div className="space-y-1.5 text-xs">
                <div className="flex items-start gap-2">
                  <span className="text-blue-400 font-mono w-4 flex-shrink-0">1.</span>
                  <div><strong className="text-foreground">Brand Safety Gate</strong> <span className="text-muted-foreground">— Instant zero if marked unsafe or negative sentiment.</span></div>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-blue-400 font-mono w-4 flex-shrink-0">2.</span>
                  <div><strong className="text-foreground">Impact Score</strong> <span className="text-muted-foreground">— log(views) x engagement rate. Core performance signal.</span></div>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-blue-400 font-mono w-4 flex-shrink-0">3.</span>
                  <div><strong className="text-foreground">Velocity Score</strong> <span className="text-muted-foreground">— views / subscriber count. Virality beyond existing reach.</span></div>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-blue-400 font-mono w-4 flex-shrink-0">4.</span>
                  <div><strong className="text-foreground">Weekly Acceleration</strong> <span className="text-muted-foreground">— Growth vs. previous week data. Falls back to daily velocity if no history.</span></div>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-blue-400 font-mono w-4 flex-shrink-0">5.</span>
                  <div><strong className="text-foreground">Participation</strong> <span className="text-muted-foreground">— Creation volume x complexity multiplier. More creators = stronger signal.</span></div>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-blue-400 font-mono w-4 flex-shrink-0">6.</span>
                  <div><strong className="text-foreground">Distribution</strong> <span className="text-muted-foreground">— +0.2x per platform trending on (TikTok, Reels, etc.).</span></div>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-blue-400 font-mono w-4 flex-shrink-0">7.</span>
                  <div><strong className="text-foreground">Freshness</strong> <span className="text-muted-foreground">— 1.3x if &lt;14 days old, 0.2x if older.</span></div>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-blue-400 font-mono w-4 flex-shrink-0">8.</span>
                  <div><strong className="text-foreground">Market Booster</strong> <span className="text-muted-foreground">— +0.1x per market the topic trends in.</span></div>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-blue-400 font-mono w-4 flex-shrink-0">9.</span>
                  <div><strong className="text-foreground">Trend Scale</strong> <span className="text-muted-foreground">— Creator-led (1.1x) vs. viewer-led (0.9x).</span></div>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-blue-400 font-mono w-4 flex-shrink-0">10.</span>
                  <div><strong className="text-foreground">Replicability</strong> <span className="text-muted-foreground">— Low complexity (1.0x) is easier to replicate vs. high (0.7x).</span></div>
                </div>
              </div>
              <div className="mt-3 p-2 rounded bg-muted/50 border border-border">
                <code className="text-xs text-foreground/80 font-mono">
                  ERS = (Impact x Velocity x Acceleration + Participation) x Distribution x Freshness x Market x Scale x Replicability
                </code>
              </div>
            </div>

            {/* Combined */}
            <div className="p-4 rounded-lg border border-yellow-500/20 bg-yellow-500/5">
              <h4 className="text-sm font-semibold text-yellow-400 mb-2">Combined Score (Cross-Source Matches)</h4>
              <p className="text-xs text-muted-foreground mb-3">
                Matched topics on the center track use a weighted blend of both scores. Internal data is weighted 4x heavier because it is more complete and directly represents Shorts performance.
              </p>
              <div className="p-2 rounded bg-muted/50 border border-border">
                <code className="text-xs text-foreground/80 font-mono">
                  Combined = IRS x 0.8 + ERS x 0.2
                </code>
              </div>
            </div>

            {/* Normalization */}
            <div className="p-3 rounded-lg border border-border bg-muted/30">
              <div className="flex items-center gap-2 mb-2">
                <Shield className="size-3.5 text-muted-foreground" />
                <span className="text-xs font-semibold text-foreground">Normalization</span>
              </div>
              <p className="text-xs text-muted-foreground">
                All raw scores within each track are normalized to 0-100 using min-max scaling. This ensures scores are comparable within a track regardless of the raw magnitude. The highest-scoring topic gets 100, the lowest gets 0, and everything else is proportionally distributed.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* ================================================================
          Section 3: Optional Boosters
          ================================================================ */}
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="px-5 py-3 border-b border-border bg-yellow-500/10">
          <h3 className="text-sm font-semibold text-yellow-400 uppercase tracking-wider">
            Optional Boosters
          </h3>
        </div>
        <div className="p-5 space-y-4">
          <p className="text-xs text-muted-foreground mb-2">
            These boosters apply to the Internal track (IRS) only and are toggled per market.
          </p>

          {/* Tools Boost Toggle */}
          <div className="flex items-center justify-between p-4 rounded-lg border border-border bg-muted/30">
            <div className="flex-1 mr-4">
              <div className="flex items-center gap-2 mb-1">
                <h4 className="text-sm font-medium text-foreground">Shorts Creation Tools Boost</h4>
                <span className="text-xs font-mono px-1.5 py-0.5 rounded bg-primary/20 text-primary">1.25x</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Boost topics where creators use YouTube Shorts creation tools (&gt;100 lifetime uploads). Rewards content produced with native Shorts tools.
              </p>
            </div>
            <button
              onClick={() => toggleBooster('tools')}
              disabled={saving}
              className={`relative w-12 h-6 rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary/50 ${
                boosters.tools ? 'bg-primary' : 'bg-muted-foreground/30'
              }`}
              role="switch"
              aria-checked={boosters.tools}
            >
              <span
                className={`block w-5 h-5 rounded-full bg-white shadow transition-transform duration-200 ${
                  boosters.tools ? 'translate-x-6' : 'translate-x-0.5'
                }`}
              />
            </button>
          </div>

          {/* Geo Diversity Toggle */}
          <div className="flex items-center justify-between p-4 rounded-lg border border-border bg-muted/30">
            <div className="flex-1 mr-4">
              <div className="flex items-center gap-2 mb-1">
                <h4 className="text-sm font-medium text-foreground">Geographic Diversity Boost</h4>
                <span className="text-xs font-mono px-1.5 py-0.5 rounded bg-primary/20 text-primary">+5%/country</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Boost topics trending across multiple countries. Each additional country adds a 5% multiplier to the IRS score.
              </p>
            </div>
            <button
              onClick={() => toggleBooster('geo')}
              disabled={saving}
              className={`relative w-12 h-6 rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary/50 ${
                boosters.geo ? 'bg-primary' : 'bg-muted-foreground/30'
              }`}
              role="switch"
              aria-checked={boosters.geo}
            >
              <span
                className={`block w-5 h-5 rounded-full bg-white shadow transition-transform duration-200 ${
                  boosters.geo ? 'translate-x-6' : 'translate-x-0.5'
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* ================================================================
          Section 4: Score Weights
          ================================================================ */}
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="px-5 py-3 border-b border-border bg-yellow-500/10">
          <h3 className="text-sm font-semibold text-yellow-400 uppercase tracking-wider">
            Score Weights (Matched Topics)
          </h3>
        </div>
        <div className="p-5 space-y-5">
          {/* Internal Weight Bar */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-foreground">Internal Weight (IRS)</span>
              <span className="text-sm font-bold text-primary">80%</span>
            </div>
            <div className="h-3 rounded-full bg-muted overflow-hidden">
              <div className="h-full rounded-full bg-primary" style={{ width: '80%' }} />
            </div>
          </div>

          {/* External Weight Bar */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-foreground">External Weight (ERS)</span>
              <span className="text-sm font-bold text-primary">20%</span>
            </div>
            <div className="h-3 rounded-full bg-muted overflow-hidden">
              <div className="h-full rounded-full bg-primary/60" style={{ width: '20%' }} />
            </div>
          </div>

          <p className="text-xs text-muted-foreground pt-1">
            These weights apply only to cross-source matched topics on the center track. Internal signal is weighted 4x heavier because Shorts data is more complete and directly relevant.
          </p>
        </div>
      </div>

      {/* ================================================================
          Section 5: Global Multipliers Reference (collapsible)
          ================================================================ */}
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <button
          onClick={() => setMultipliersOpen(!multipliersOpen)}
          className="w-full px-5 py-3 border-b border-border bg-yellow-500/10 flex items-center justify-between hover:bg-yellow-500/15 transition-colors"
        >
          <h3 className="text-sm font-semibold text-yellow-400 uppercase tracking-wider">
            Global Multipliers Reference
          </h3>
          {multipliersOpen ? (
            <ChevronUp className="size-4 text-yellow-400" />
          ) : (
            <ChevronDown className="size-4 text-yellow-400" />
          )}
        </button>

        {multipliersOpen && (
          <div className="p-5">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2 pr-4 text-muted-foreground font-medium">Multiplier</th>
                    <th className="text-left py-2 pr-4 text-muted-foreground font-medium">Applies To</th>
                    <th className="text-left py-2 text-muted-foreground font-medium">Values</th>
                  </tr>
                </thead>
                <tbody className="text-foreground/80">
                  <tr className="border-b border-border/50">
                    <td className="py-2.5 pr-4 font-medium text-foreground">Creation Complexity</td>
                    <td className="py-2.5 pr-4 text-xs text-muted-foreground">ERS</td>
                    <td className="py-2.5">
                      <span className="font-mono text-xs">Low = 1.3</span>
                      <span className="mx-2 text-muted-foreground">|</span>
                      <span className="font-mono text-xs">Medium = 1.0</span>
                      <span className="mx-2 text-muted-foreground">|</span>
                      <span className="font-mono text-xs">High = 0.7</span>
                    </td>
                  </tr>
                  <tr className="border-b border-border/50">
                    <td className="py-2.5 pr-4 font-medium text-foreground">Platform Boost</td>
                    <td className="py-2.5 pr-4 text-xs text-muted-foreground">ERS</td>
                    <td className="py-2.5 font-mono text-xs">+0.2 per platform</td>
                  </tr>
                  <tr className="border-b border-border/50">
                    <td className="py-2.5 pr-4 font-medium text-foreground">Freshness</td>
                    <td className="py-2.5 pr-4 text-xs text-muted-foreground">ERS</td>
                    <td className="py-2.5">
                      <span className="font-mono text-xs">&lt;14 days = 1.3x</span>
                      <span className="mx-2 text-muted-foreground">|</span>
                      <span className="font-mono text-xs">&gt;14 days = 0.2x</span>
                    </td>
                  </tr>
                  <tr className="border-b border-border/50">
                    <td className="py-2.5 pr-4 font-medium text-foreground">Market Boost</td>
                    <td className="py-2.5 pr-4 text-xs text-muted-foreground">ERS</td>
                    <td className="py-2.5 font-mono text-xs">+0.1 per market</td>
                  </tr>
                  <tr className="border-b border-border/50">
                    <td className="py-2.5 pr-4 font-medium text-foreground">Trend Scale</td>
                    <td className="py-2.5 pr-4 text-xs text-muted-foreground">ERS</td>
                    <td className="py-2.5">
                      <span className="font-mono text-xs">Creator-Led = 1.1x</span>
                      <span className="mx-2 text-muted-foreground">|</span>
                      <span className="font-mono text-xs">Viewer-Led = 0.9x</span>
                    </td>
                  </tr>
                  <tr className="border-b border-border/50">
                    <td className="py-2.5 pr-4 font-medium text-foreground">Replicability</td>
                    <td className="py-2.5 pr-4 text-xs text-muted-foreground">ERS</td>
                    <td className="py-2.5">
                      <span className="font-mono text-xs">Low = 1.0</span>
                      <span className="mx-2 text-muted-foreground">|</span>
                      <span className="font-mono text-xs">Medium = 0.8</span>
                      <span className="mx-2 text-muted-foreground">|</span>
                      <span className="font-mono text-xs">High = 0.7</span>
                    </td>
                  </tr>
                  <tr className="border-b border-border/50">
                    <td className="py-2.5 pr-4 font-medium text-foreground">Tools Boost</td>
                    <td className="py-2.5 pr-4 text-xs text-muted-foreground">IRS</td>
                    <td className="py-2.5 font-mono text-xs">1.25x (optional)</td>
                  </tr>
                  <tr className="border-b border-border/50">
                    <td className="py-2.5 pr-4 font-medium text-foreground">Geo Boost</td>
                    <td className="py-2.5 pr-4 text-xs text-muted-foreground">IRS</td>
                    <td className="py-2.5 font-mono text-xs">+5% per country (optional)</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 pr-4 font-medium text-foreground">Downstream</td>
                    <td className="py-2.5 pr-4 text-xs text-muted-foreground">IRS</td>
                    <td className="py-2.5 font-mono text-xs">+10 per upload</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
