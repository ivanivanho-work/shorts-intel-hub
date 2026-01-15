import { useState } from 'react';
import { TrendCard } from '@/app/components/TrendCard';
import { StatsDashboard } from '@/app/components/StatsDashboard';
import { DeepDiveView } from '@/app/components/DeepDiveView';
import { ScoringSettings } from '@/app/components/ScoringSettings';
import { ArchiveView } from '@/app/components/ArchiveView';
import { ChevronDown, ChevronUp } from 'lucide-react';

// Mock data structure
interface Trend {
  id: string;
  topicName: string;
  description: string;
  targetDemo: string;
  referenceLink: string;
  hashtags?: string[];
  audio?: string;
  rank: number;
  score: number;
  velocity: 'increasing' | 'stable' | 'decreasing';
  ageInWeeks: number;
  source: 'Search' | 'Nyan Cat' | 'Agency' | 'Music';
  // Performance metrics
  viewsVolume?: string;
  viewsVelocity?: string;
  creationRate?: string;
  watchtimeVolume?: string;
  watchtimeVelocity?: string;
}

// Mock data for different markets and demos
const mockTrends: Record<string, Trend[]> = {
  JP: [
    {
      id: 'jp-1',
      topicName: 'Sushi Art Challenge',
      description: 'Creators showcasing artistic sushi plating techniques with viral time-lapse videos. High engagement among food enthusiasts.',
      targetDemo: 'Females 18-24',
      referenceLink: 'https://youtube.com/shorts/example1',
      hashtags: ['#SushiArt', '#FoodChallenge', '#JapaneseFood'],
      audio: 'Trending J-Pop Beat',
      rank: 1,
      score: 98,
      velocity: 'increasing',
      ageInWeeks: 1,
      source: 'Nyan Cat',
      viewsVolume: '1.2M',
      viewsVelocity: '10%',
      creationRate: '5%',
      watchtimeVolume: '1.5M',
      watchtimeVelocity: '12%',
    },
    {
      id: 'jp-2',
      topicName: 'Tokyo Street Fashion Hauls',
      description: 'Quick fashion transformation videos showcasing Harajuku and Shibuya street style trends. Strong CTR in urban markets.',
      targetDemo: 'Females 18-24',
      referenceLink: 'https://youtube.com/shorts/example2',
      hashtags: ['#TokyoFashion', '#StreetStyle', '#OOTD'],
      rank: 2,
      score: 94,
      velocity: 'increasing',
      ageInWeeks: 1,
      source: 'Agency',
      viewsVolume: '800K',
      viewsVelocity: '8%',
      creationRate: '4%',
      watchtimeVolume: '1M',
      watchtimeVelocity: '10%',
    },
    {
      id: 'jp-3',
      topicName: 'Anime Character Dance Trends',
      description: 'Dance covers inspired by popular anime openings. High engagement with Gen Z audiences.',
      targetDemo: 'Males 18-24',
      referenceLink: 'https://youtube.com/shorts/example3',
      hashtags: ['#AnimeDance', '#CosinMania', '#JPop'],
      audio: 'Idol - YOASOBI',
      rank: 3,
      score: 91,
      velocity: 'stable',
      ageInWeeks: 2,
      source: 'Music',
      viewsVolume: '600K',
      viewsVelocity: '5%',
      creationRate: '3%',
      watchtimeVolume: '800K',
      watchtimeVelocity: '7%',
    },
    {
      id: 'jp-4',
      topicName: 'Retro Gaming Speedruns',
      description: 'Short-form speedrun highlights of classic Nintendo games gaining traction.',
      targetDemo: 'Males 25-34',
      referenceLink: 'https://youtube.com/shorts/example4',
      hashtags: ['#Speedrun', '#RetroGaming', '#Nintendo'],
      rank: 4,
      score: 87,
      velocity: 'stable',
      ageInWeeks: 2,
      source: 'Search',
      viewsVolume: '500K',
      viewsVelocity: '4%',
      creationRate: '2%',
      watchtimeVolume: '700K',
      watchtimeVelocity: '6%',
    },
    {
      id: 'jp-5',
      topicName: 'Convenience Store Hauls',
      description: 'Reviews of new convenience store products and seasonal items. Strong watchtime metrics.',
      targetDemo: 'Females 18-24',
      referenceLink: 'https://youtube.com/shorts/example5',
      hashtags: ['#ConbiniHaul', '#JapanLife', '#NewProducts'],
      rank: 5,
      score: 85,
      velocity: 'increasing',
      ageInWeeks: 1,
      source: 'Nyan Cat',
      viewsVolume: '400K',
      viewsVelocity: '3%',
      creationRate: '1%',
      watchtimeVolume: '600K',
      watchtimeVelocity: '5%',
    },
    {
      id: 'jp-6',
      topicName: 'Kawaii Bento Boxes',
      description: 'Creative character bento lunch box designs going viral.',
      targetDemo: 'Females 25-34',
      referenceLink: 'https://youtube.com/shorts/example6',
      hashtags: ['#BentoBox', '#KawaiFood', '#LunchIdeas'],
      rank: 6,
      score: 82,
      velocity: 'stable',
      ageInWeeks: 2,
      source: 'Agency',
      viewsVolume: '300K',
      viewsVelocity: '2%',
      creationRate: '0.5%',
      watchtimeVolume: '500K',
      watchtimeVelocity: '4%',
    },
    {
      id: 'jp-7',
      topicName: 'Cherry Blossom Spots 2026',
      description: 'Early cherry blossom forecasts and hidden viewing spots gaining search momentum.',
      targetDemo: 'All 25-44',
      referenceLink: 'https://youtube.com/shorts/example7',
      hashtags: ['#Sakura2026', '#CherryBlossom', '#JapanTravel'],
      rank: 7,
      score: 79,
      velocity: 'increasing',
      ageInWeeks: 1,
      source: 'Search',
      viewsVolume: '200K',
      viewsVelocity: '1%',
      creationRate: '0.3%',
      watchtimeVolume: '400K',
      watchtimeVelocity: '3%',
    },
    {
      id: 'jp-8',
      topicName: 'J-Drama Reaction Videos',
      description: 'Quick reaction clips to trending Japanese drama plot twists.',
      targetDemo: 'Females 18-34',
      referenceLink: 'https://youtube.com/shorts/example8',
      hashtags: ['#JDrama', '#DramaReaction', '#AsianDrama'],
      rank: 8,
      score: 76,
      velocity: 'stable',
      ageInWeeks: 2,
      source: 'Nyan Cat',
      viewsVolume: '150K',
      viewsVelocity: '0.5%',
      creationRate: '0.2%',
      watchtimeVolume: '300K',
      watchtimeVelocity: '2%',
    },
    {
      id: 'jp-9',
      topicName: 'Office Worker Comedy Skits',
      description: 'Relatable workplace humor resonating with salaried workers.',
      targetDemo: 'Males 25-34',
      referenceLink: 'https://youtube.com/shorts/example9',
      hashtags: ['#Salaryman', '#WorkplaceHumor', '#JPComedy'],
      rank: 9,
      score: 74,
      velocity: 'decreasing',
      ageInWeeks: 2,
      source: 'Agency',
      viewsVolume: '100K',
      viewsVelocity: '0.3%',
      creationRate: '0.1%',
      watchtimeVolume: '200K',
      watchtimeVelocity: '1%',
    },
    {
      id: 'jp-10',
      topicName: 'Train Station Piano Performances',
      description: 'Impromptu piano performances at major Tokyo stations going viral.',
      targetDemo: 'All 18-44',
      referenceLink: 'https://youtube.com/shorts/example10',
      hashtags: ['#StationPiano', '#TokyoMusic', '#StreetPerformance'],
      audio: 'Classical Crossover',
      rank: 10,
      score: 71,
      velocity: 'stable',
      ageInWeeks: 1,
      source: 'Music',
      viewsVolume: '50K',
      viewsVelocity: '0.2%',
      creationRate: '0.05%',
      watchtimeVolume: '100K',
      watchtimeVelocity: '0.5%',
    },
    // Long tail items (rank > 10)
    {
      id: 'jp-11',
      topicName: 'Japanese Language Learning Hacks',
      description: 'Quick tips for learning Japanese vocabulary and grammar.',
      targetDemo: 'All 18-34',
      referenceLink: 'https://youtube.com/shorts/example11',
      hashtags: ['#LearnJapanese', '#JLPT', '#LanguageTips'],
      rank: 11,
      score: 68,
      velocity: 'stable',
      ageInWeeks: 3,
      source: 'Search',
      viewsVolume: '40K',
      viewsVelocity: '0.1%',
      creationRate: '0.03%',
      watchtimeVolume: '80K',
      watchtimeVelocity: '0.4%',
    },
    {
      id: 'jp-12',
      topicName: 'Capsule Toy Unboxings',
      description: 'Gacha machine toy reveals with collection showcases.',
      targetDemo: 'Males 18-24',
      referenceLink: 'https://youtube.com/shorts/example12',
      hashtags: ['#Gashapon', '#Unboxing', '#Collectibles'],
      rank: 12,
      score: 65,
      velocity: 'decreasing',
      ageInWeeks: 3,
      source: 'Nyan Cat',
      viewsVolume: '30K',
      viewsVelocity: '0.05%',
      creationRate: '0.02%',
      watchtimeVolume: '60K',
      watchtimeVelocity: '0.3%',
    },
  ],
  KR: [
    {
      id: 'kr-1',
      topicName: 'K-Beauty Glass Skin Routine',
      description: '10-second glass skin transformations trending heavily. High creation rate among beauty creators.',
      targetDemo: 'Females 18-24',
      referenceLink: 'https://youtube.com/shorts/example13',
      hashtags: ['#GlassSkin', '#KBeauty', '#Skincare'],
      rank: 1,
      score: 96,
      velocity: 'increasing',
      ageInWeeks: 1,
      source: 'Agency',
      viewsVolume: '1.5M',
      viewsVelocity: '15%',
      creationRate: '6%',
      watchtimeVolume: '2M',
      watchtimeVelocity: '18%',
    },
    {
      id: 'kr-2',
      topicName: 'Korean Street Food Challenges',
      description: 'Spicy food challenges featuring Korean street food going viral across APAC.',
      targetDemo: 'Males 18-24',
      referenceLink: 'https://youtube.com/shorts/example14',
      hashtags: ['#KoreanFood', '#SpicyChallenge', '#Mukbang'],
      rank: 2,
      score: 93,
      velocity: 'increasing',
      ageInWeeks: 1,
      source: 'Nyan Cat',
      viewsVolume: '1M',
      viewsVelocity: '10%',
      creationRate: '5%',
      watchtimeVolume: '1.5M',
      watchtimeVelocity: '15%',
    },
    {
      id: 'kr-3',
      topicName: 'New Jeans Dance Cover',
      description: 'Latest choreography from New Jeans driving massive engagement.',
      targetDemo: 'Females 13-24',
      referenceLink: 'https://youtube.com/shorts/example15',
      hashtags: ['#NewJeans', '#KpopDance', '#DanceCover'],
      audio: 'New Jeans - OMG',
      rank: 3,
      score: 90,
      velocity: 'stable',
      ageInWeeks: 2,
      source: 'Music',
      viewsVolume: '800K',
      viewsVelocity: '5%',
      creationRate: '3%',
      watchtimeVolume: '1M',
      watchtimeVelocity: '10%',
    },
  ],
  IN: [
    {
      id: 'in-1',
      topicName: 'Bollywood Dance Transitions',
      description: 'Quick costume and location transitions synced to Bollywood hits. Massive virality.',
      targetDemo: 'Females 18-24',
      referenceLink: 'https://youtube.com/shorts/example16',
      hashtags: ['#BollywoodDance', '#Transitions', '#IndianShorts'],
      audio: 'Latest Bollywood Hit',
      rank: 1,
      score: 99,
      velocity: 'increasing',
      ageInWeeks: 1,
      source: 'Music',
      viewsVolume: '2M',
      viewsVelocity: '20%',
      creationRate: '7%',
      watchtimeVolume: '2.5M',
      watchtimeVelocity: '25%',
    },
    {
      id: 'in-2',
      topicName: 'Cricket World Cup Reactions',
      description: 'Real-time reaction videos to key match moments driving high engagement.',
      targetDemo: 'Males 18-34',
      referenceLink: 'https://youtube.com/shorts/example17',
      hashtags: ['#Cricket', '#WorldCup', '#IndianCricket'],
      rank: 2,
      score: 97,
      velocity: 'increasing',
      ageInWeeks: 1,
      source: 'Search',
      viewsVolume: '1.5M',
      viewsVelocity: '15%',
      creationRate: '6%',
      watchtimeVolume: '2M',
      watchtimeVelocity: '20%',
    },
    {
      id: 'in-3',
      topicName: 'South Indian Recipe Hacks',
      description: 'Quick dosa and idli preparation tips resonating with home cooks.',
      targetDemo: 'Females 25-44',
      referenceLink: 'https://youtube.com/shorts/example18',
      hashtags: ['#SouthIndianFood', '#RecipeHacks', '#CookingTips'],
      rank: 3,
      score: 92,
      velocity: 'stable',
      ageInWeeks: 2,
      source: 'Nyan Cat',
      viewsVolume: '1M',
      viewsVelocity: '10%',
      creationRate: '5%',
      watchtimeVolume: '1.5M',
      watchtimeVelocity: '15%',
    },
  ],
  ID: [
    {
      id: 'id-1',
      topicName: 'Indonesian Wedding Trends',
      description: 'Modern Indonesian wedding decoration and outfit ideas trending across demographics.',
      targetDemo: 'Females 25-34',
      referenceLink: 'https://youtube.com/shorts/example19',
      hashtags: ['#IndonesianWedding', '#WeddingInspo', '#Pernikahan'],
      rank: 1,
      score: 95,
      velocity: 'increasing',
      ageInWeeks: 1,
      source: 'Agency',
      viewsVolume: '1.2M',
      viewsVelocity: '10%',
      creationRate: '4%',
      watchtimeVolume: '1.5M',
      watchtimeVelocity: '12%',
    },
    {
      id: 'id-2',
      topicName: 'Dangdut Remix Dance',
      description: 'Trending dangdut music remixes with coordinated dance challenges.',
      targetDemo: 'All 18-34',
      referenceLink: 'https://youtube.com/shorts/example20',
      hashtags: ['#Dangdut', '#DangdutRemix', '#IndonesianMusic'],
      audio: 'Dangdut Remix 2026',
      rank: 2,
      score: 91,
      velocity: 'increasing',
      ageInWeeks: 1,
      source: 'Music',
      viewsVolume: '800K',
      viewsVelocity: '8%',
      creationRate: '3%',
      watchtimeVolume: '1M',
      watchtimeVelocity: '10%',
    },
    {
      id: 'id-3',
      topicName: 'Jakarta Street Food Tours',
      description: 'Quick street food tour videos showcasing Jakarta culinary scene.',
      targetDemo: 'Males 18-34',
      referenceLink: 'https://youtube.com/shorts/example21',
      hashtags: ['#JakartaFood', '#StreetFood', '#IndonesianCuisine'],
      rank: 3,
      score: 88,
      velocity: 'stable',
      ageInWeeks: 2,
      source: 'Nyan Cat',
      viewsVolume: '600K',
      viewsVelocity: '5%',
      creationRate: '2%',
      watchtimeVolume: '800K',
      watchtimeVelocity: '7%',
    },
  ],
  AUNZ: [
    {
      id: 'aunz-1',
      topicName: 'Australian Summer Beach Life',
      description: 'Beach day-in-the-life content gaining traction for summer season.',
      targetDemo: 'All 18-34',
      referenceLink: 'https://youtube.com/shorts/example22',
      hashtags: ['#AussiesSummer', '#BeachLife', '#Australia'],
      rank: 1,
      score: 89,
      velocity: 'increasing',
      ageInWeeks: 1,
      source: 'Agency',
      viewsVolume: '1.5M',
      viewsVelocity: '15%',
      creationRate: '6%',
      watchtimeVolume: '2M',
      watchtimeVelocity: '20%',
    },
    {
      id: 'aunz-2',
      topicName: 'NZ Adventure Sports',
      description: 'Quick clips of extreme sports in New Zealand locations trending.',
      targetDemo: 'Males 18-34',
      referenceLink: 'https://youtube.com/shorts/example23',
      hashtags: ['#NZAdventure', '#ExtremeSports', '#NewZealand'],
      rank: 2,
      score: 86,
      velocity: 'stable',
      ageInWeeks: 2,
      source: 'Search',
      viewsVolume: '1M',
      viewsVelocity: '10%',
      creationRate: '5%',
      watchtimeVolume: '1.5M',
      watchtimeVelocity: '15%',
    },
    {
      id: 'aunz-3',
      topicName: 'Australian Wildlife Encounters',
      description: 'Close encounters with unique Australian wildlife going viral.',
      targetDemo: 'All 13-44',
      referenceLink: 'https://youtube.com/shorts/example24',
      hashtags: ['#AussieWildlife', '#Australia', '#Animals'],
      rank: 3,
      score: 84,
      velocity: 'increasing',
      ageInWeeks: 1,
      source: 'Nyan Cat',
      viewsVolume: '800K',
      viewsVelocity: '8%',
      creationRate: '3%',
      watchtimeVolume: '1M',
      watchtimeVelocity: '10%',
    },
  ],
};

const markets = [
  { code: 'JP', name: 'Japan' },
  { code: 'KR', name: 'South Korea' },
  { code: 'IN', name: 'India' },
  { code: 'ID', name: 'Indonesia' },
  { code: 'AUNZ', name: 'Australia & New Zealand' },
];

const demoOptions = [
  'All Demographics',
  'Females 18-24',
  'Males 18-24',
  'Females 25-34',
  'Males 25-34',
  'Females 18-34',
  'Males 18-34',
  'All 18-34',
  'All 25-44',
  'Females 13-24',
  'All 13-44',
];

export function MarketingDashboard() {
  const [selectedMarket, setSelectedMarket] = useState('JP');
  const [selectedDemo, setSelectedDemo] = useState('All Demographics');
  const [showLongTail, setShowLongTail] = useState(false);
  const [approvedTrends, setApprovedTrends] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState<'summary' | 'deepdive' | 'scoring' | 'archive'>('summary');
  const [selectedSource, setSelectedSource] = useState('All Sources');

  const trends = mockTrends[selectedMarket] || [];
  const filteredTrends = selectedDemo === 'All Demographics' 
    ? trends 
    : trends.filter(t => t.targetDemo === selectedDemo || t.targetDemo.startsWith('All'));

  const top10 = filteredTrends.filter(t => t.rank <= 10);
  const longTail = filteredTrends.filter(t => t.rank > 10);

  const handleTrendApproval = (trendId: string) => {
    setApprovedTrends(prev => new Set(prev).add(trendId));
  };

  return (
    <div className="px-6 py-6">
      <div className="max-w-7xl mx-auto">
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

            {activeTab === 'summary' && (
              <div className="flex-1 min-w-[200px]">
                <label className="block mb-2 text-foreground">Target Demo</label>
                <select
                  value={selectedDemo}
                  onChange={(e) => setSelectedDemo(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border border-border bg-card text-foreground"
                >
                  {demoOptions.map((demo) => (
                    <option key={demo} value={demo}>
                      {demo}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Tabs */}
          <div className="mb-6 border-b border-border">
            <div className="flex gap-4">
              <button
                onClick={() => setActiveTab('summary')}
                className={`px-4 py-3 font-medium transition-colors relative ${
                  activeTab === 'summary'
                    ? 'text-primary'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Top Topics & Trends
                {activeTab === 'summary' && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
                )}
              </button>
              <button
                onClick={() => setActiveTab('deepdive')}
                className={`px-4 py-3 font-medium transition-colors relative ${
                  activeTab === 'deepdive'
                    ? 'text-primary'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Deep Dive
                {activeTab === 'deepdive' && (
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
                Scoring Settings
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

          {/* Stats Dashboard - Only for Summary Tab */}
          {activeTab === 'summary' && (
            <StatsDashboard 
              market={selectedMarket} 
              totalTrends={filteredTrends.length}
              approvedCount={approvedTrends.size}
            />
          )}
        </div>

        {/* Tab Content */}
        {activeTab === 'summary' ? (
          <>
            {/* Last Updated Info */}
            <div className="mb-6 p-4 bg-muted rounded-lg">
              <p className="text-muted-foreground">
                <span className="font-medium text-foreground">Last Updated:</span> Monday, January 13, 2026 at 06:00 AM JST
              </p>
            </div>

            {/* Top 10 Section */}
            <div className="mb-8">
              <h2 className="text-foreground mb-4">Top 10 Trends - {selectedMarket}</h2>
              {top10.length === 0 ? (
                <div className="p-8 text-center bg-card rounded-lg border border-border">
                  <p className="text-muted-foreground">No trends found for selected filters</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {top10.map((trend) => (
                    <TrendCard 
                      key={trend.id} 
                      trend={trend}
                      onApprove={handleTrendApproval}
                      isApproved={approvedTrends.has(trend.id)}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Long Tail Section */}
            {longTail.length > 0 && (
              <div>
                <button
                  onClick={() => setShowLongTail(!showLongTail)}
                  className="flex items-center gap-2 mb-4 text-foreground hover:text-primary transition-colors"
                >
                  <h3>Long Tail Ideas ({longTail.length})</h3>
                  {showLongTail ? <ChevronUp className="size-5" /> : <ChevronDown className="size-5" />}
                </button>

                {showLongTail && (
                  <div className="space-y-4">
                    {longTail.map((trend) => (
                      <TrendCard 
                        key={trend.id} 
                        trend={trend}
                        onApprove={handleTrendApproval}
                        isApproved={approvedTrends.has(trend.id)}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        ) : activeTab === 'deepdive' ? (
          <DeepDiveView 
            trends={trends}
            selectedSource={selectedSource}
            onSourceChange={setSelectedSource}
          />
        ) : activeTab === 'scoring' ? (
          <ScoringSettings />
        ) : (
          <ArchiveView market={selectedMarket} />
        )}
      </div>
    </div>
  );
}