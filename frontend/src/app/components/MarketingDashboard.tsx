import { useState } from 'react';
import { ScoringSettings } from '@/app/components/ScoringSettings';
import { ArchiveView } from '@/app/components/ArchiveView';
import { ThreeTrackView } from '@/app/components/ThreeTrackView';
import { ChevronDown, ChevronUp, Lightbulb } from 'lucide-react';

const markets = [
  { code: 'JP', name: 'Japan' },
  { code: 'KR', name: 'South Korea' },
  { code: 'IN', name: 'India' },
  { code: 'ID', name: 'Indonesia' },
  { code: 'AUNZ', name: 'Australia & New Zealand' },
];

export function MarketingDashboard() {
  const [selectedMarket, setSelectedMarket] = useState('JP');
  const [activeTab, setActiveTab] = useState<'three-track' | 'scoring' | 'archive'>('three-track');
  const [howItWorksOpen, setHowItWorksOpen] = useState(false);

  return (
    <div className="px-6 py-6">
      <div className="max-w-7xl mx-auto">

        {/* How This Works - Expandable */}
        <div className="mb-4 rounded-lg bg-card/50 backdrop-blur-sm border border-primary/20 overflow-hidden">
          <button
            onClick={() => setHowItWorksOpen(!howItWorksOpen)}
            className="w-full px-5 py-3.5 flex items-center justify-between hover:bg-muted/30 transition-colors"
          >
            <div className="flex items-center gap-2.5">
              <Lightbulb className="size-4 text-primary" />
              <h3 className="text-sm font-semibold text-foreground">How This Works</h3>
            </div>
            {howItWorksOpen ? (
              <ChevronUp className="size-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="size-4 text-muted-foreground" />
            )}
          </button>

          {howItWorksOpen && (
            <div className="px-5 pb-5 border-t border-border/50">
              <div className="pt-4 space-y-4">
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Intel Hub serves the latest topics & trends for SFV, drawing from <strong className="text-foreground">Shorts via Nyan Cat database</strong> and from <strong className="text-foreground">Tubular for TikTok & Reels data</strong>. This data is then put through a 2-layer topic matching system (keyword & semantic) and presented as 3 tracks:
                </p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="p-3 rounded-lg border border-purple-500/20 bg-purple-500/5">
                    <div className="text-xs font-semibold text-purple-400 uppercase tracking-wider mb-1">Internal Source</div>
                    <p className="text-xs text-muted-foreground">Shorts-only data from Nyan Cat. Topics trending on YouTube Shorts within the selected market.</p>
                  </div>
                  <div className="p-3 rounded-lg border border-yellow-500/20 bg-yellow-500/5">
                    <div className="text-xs font-semibold text-yellow-400 uppercase tracking-wider mb-1">Cross-Source Matches</div>
                    <p className="text-xs text-muted-foreground">Topics found on <strong className="text-foreground">both</strong> Shorts and off-platform (TikTok/Reels). These are the highest-value trends with the highest confidence of relevance.</p>
                  </div>
                  <div className="p-3 rounded-lg border border-blue-500/20 bg-blue-500/5">
                    <div className="text-xs font-semibold text-blue-400 uppercase tracking-wider mb-1">External Source</div>
                    <p className="text-xs text-muted-foreground">Off-platform only data from Tubular (TikTok & Reels). Topics trending elsewhere that may be emerging on Shorts.</p>
                  </div>
                </div>

                <div className="p-3 rounded-lg border border-border bg-muted/30">
                  <div className="text-xs font-semibold text-foreground mb-2">The Matching Pipeline</div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="px-2 py-1 rounded bg-primary/10 text-primary font-medium">Stage 1: Embedding Sweep</span>
                    <span>Auto-matches high-confidence pairs (cosine similarity &ge; 0.88)</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mt-2">
                    <span className="px-2 py-1 rounded bg-primary/10 text-primary font-medium">Stage 2: LLM Verification</span>
                    <span>Reviews all remaining pairs via Gemini for deeper semantic matching</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Yellow-glow control panel */}
        <div className="mb-6 p-6 rounded-lg bg-card/50 backdrop-blur-sm border border-yellow-500/20 shadow-[0_0_30px_rgba(234,179,8,0.15)]">
          {/* Filters */}
          <div className="mb-6 flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <label className="block mb-2 text-foreground">Market</label>
              <select
                value={selectedMarket}
                onChange={(e) => setSelectedMarket(e.target.value)}
                className="w-full px-4 py-2 rounded-lg border border-border bg-card text-foreground"
              >
                {markets.map((market) => (
                  <option key={market.code} value={market.code}>
                    {market.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Tabs */}
          <div className="border-b border-border">
            <div className="flex gap-4">
              <button
                onClick={() => setActiveTab('three-track')}
                className={`px-4 py-3 font-medium transition-colors relative ${
                  activeTab === 'three-track'
                    ? 'text-primary'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Intel Overview
                {activeTab === 'three-track' && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
                )}
              </button>
              <button
                onClick={() => setActiveTab('scoring')}
                className={`px-4 py-3 font-medium transition-colors relative ${
                  activeTab === 'scoring'
                    ? 'text-primary'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Control Panel
                {activeTab === 'scoring' && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
                )}
              </button>
              <button
                onClick={() => setActiveTab('archive')}
                className={`px-4 py-3 font-medium transition-colors relative ${
                  activeTab === 'archive'
                    ? 'text-primary'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Archive
                {activeTab === 'archive' && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'three-track' ? (
          <ThreeTrackView market={selectedMarket} />
        ) : activeTab === 'scoring' ? (
          <ScoringSettings />
        ) : (
          <ArchiveView market={selectedMarket} />
        )}
      </div>
    </div>
  );
}
