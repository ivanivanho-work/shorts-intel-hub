import { useState } from 'react';
import {
  Link2,
  Layers,
  GitMerge,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  CheckCircle2,
  Database,
  Globe,
  Play,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { runFullAnalysis } from '@/services/api';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ThreeTrackViewProps {
  market: string;
}

interface TopicEntry {
  id: string;
  topicName: string;
  description: string;
  source: 'internal' | 'external';
  score: number | null;
  referenceLink: string;
  relatedTopics?: string[];
}

interface MatchedSource {
  topicName: string;
  sourceType: 'internal' | 'external';
  method: 'embedding' | 'llm';
  confidence: number;
}

interface MatchedTopic {
  id: string;
  consolidatedName: string;
  matchCount: number;
  avgConfidence: number;
  llmExplanation: string;
  sources: MatchedSource[];
  referenceLink: string;
}

// ---------------------------------------------------------------------------
// Mock Data
// ---------------------------------------------------------------------------

const mockInternalTopics: Record<string, TopicEntry[]> = {
  JP: [
    { id: 'int-jp-1', topicName: 'Sushi Art Challenge', description: 'Artistic sushi plating techniques gaining traction in time-lapse format.', source: 'internal', score: 98, referenceLink: 'https://youtube.com/shorts/example1', relatedTopics: ['Japanese Food ASMR', 'Bento Box Art'] },
    { id: 'int-jp-2', topicName: 'Anime Dance Covers', description: 'Choreography recreations from popular anime openings trending with Gen Z.', source: 'internal', score: 91, referenceLink: 'https://youtube.com/shorts/example2' },
    { id: 'int-jp-3', topicName: 'Convenience Store Hauls', description: 'Reviews of seasonal convenience store products driving strong watchtime.', source: 'internal', score: 85, referenceLink: 'https://youtube.com/shorts/example3', relatedTopics: ['Konbini Reviews'] },
    { id: 'int-jp-4', topicName: 'Cherry Blossom Spots 2026', description: 'Early sakura forecasts and hidden viewing locations gaining search momentum.', source: 'internal', score: 79, referenceLink: 'https://youtube.com/shorts/example4' },
  ],
  KR: [
    { id: 'int-kr-1', topicName: 'K-Beauty Glass Skin', description: '10-second glass skin transformations trending among beauty creators.', source: 'internal', score: 96, referenceLink: 'https://youtube.com/shorts/example5', relatedTopics: ['Skincare Routine', 'Dewy Look Tutorial'] },
    { id: 'int-kr-2', topicName: 'Korean Street Food Spicy Challenge', description: 'Extreme spicy food challenges at Korean street markets.', source: 'internal', score: 93, referenceLink: 'https://youtube.com/shorts/example6' },
    { id: 'int-kr-3', topicName: 'K-Pop Random Dance', description: 'Random play dance events filmed at public locations in Seoul.', source: 'internal', score: 88, referenceLink: 'https://youtube.com/shorts/example7', relatedTopics: ['New Jeans Dance Cover'] },
  ],
  IN: [
    { id: 'int-in-1', topicName: 'Bollywood Transitions', description: 'Quick costume and location transitions synced to Bollywood hits.', source: 'internal', score: 99, referenceLink: 'https://youtube.com/shorts/example8' },
    { id: 'int-in-2', topicName: 'Cricket Match Reactions', description: 'Real-time reaction clips to key cricket moments.', source: 'internal', score: 97, referenceLink: 'https://youtube.com/shorts/example9', relatedTopics: ['IPL Highlights', 'Cricket Memes'] },
    { id: 'int-in-3', topicName: 'South Indian Recipe Hacks', description: 'Quick dosa and idli preparation tips for home cooks.', source: 'internal', score: 92, referenceLink: 'https://youtube.com/shorts/example10' },
    { id: 'int-in-4', topicName: 'Indian Wedding Dance', description: 'Choreographed sangeet performances going viral.', source: 'internal', score: 86, referenceLink: 'https://youtube.com/shorts/example11', relatedTopics: ['Wedding Choreography'] },
    { id: 'int-in-5', topicName: 'Chai Making Aesthetic', description: 'Satisfying masala chai preparation videos with ASMR elements.', source: 'internal', score: 80, referenceLink: 'https://youtube.com/shorts/example12' },
  ],
  ID: [
    { id: 'int-id-1', topicName: 'Indonesian Wedding Trends', description: 'Modern wedding decoration and outfit ideas trending across demographics.', source: 'internal', score: 95, referenceLink: 'https://youtube.com/shorts/example13' },
    { id: 'int-id-2', topicName: 'Dangdut Remix Dance', description: 'Dangdut music remixes with coordinated dance challenges.', source: 'internal', score: 91, referenceLink: 'https://youtube.com/shorts/example14', relatedTopics: ['Koplo Dance', 'Indonesian Music Challenge'] },
    { id: 'int-id-3', topicName: 'Jakarta Street Food', description: 'Quick street food tour videos of Jakarta culinary hotspots.', source: 'internal', score: 88, referenceLink: 'https://youtube.com/shorts/example15' },
  ],
  AUNZ: [
    { id: 'int-aunz-1', topicName: 'Aussie Beach Life', description: 'Beach day-in-the-life content gaining traction for summer season.', source: 'internal', score: 89, referenceLink: 'https://youtube.com/shorts/example16', relatedTopics: ['Bondi Beach Vlogs', 'Surf Culture'] },
    { id: 'int-aunz-2', topicName: 'NZ Extreme Sports', description: 'Quick clips of bungee jumping and skydiving in New Zealand.', source: 'internal', score: 86, referenceLink: 'https://youtube.com/shorts/example17' },
    { id: 'int-aunz-3', topicName: 'Australian Wildlife Encounters', description: 'Close encounters with unique Australian wildlife going viral.', source: 'internal', score: 84, referenceLink: 'https://youtube.com/shorts/example18' },
    { id: 'int-aunz-4', topicName: 'Melbourne Coffee Culture', description: 'Specialty coffee shop tours and latte art showcases.', source: 'internal', score: 78, referenceLink: 'https://youtube.com/shorts/example19', relatedTopics: ['Cafe Hopping'] },
  ],
};

const mockExternalTopics: Record<string, TopicEntry[]> = {
  JP: [
    { id: 'ext-jp-1', topicName: 'Japanese Food Art', description: 'Creative food presentation techniques trending on social platforms.', source: 'external', score: 92, referenceLink: 'https://vayner.example.com/jp-1', relatedTopics: ['Wagashi Art', 'Food Sculpting'] },
    { id: 'ext-jp-2', topicName: 'Harajuku Fashion Hauls', description: 'Street style transformation content from Tokyo fashion districts.', source: 'external', score: 88, referenceLink: 'https://vayner.example.com/jp-2' },
    { id: 'ext-jp-3', topicName: 'Anime Opening Dances', description: 'Dance trend recreations from popular anime series openings.', source: 'external', score: 85, referenceLink: 'https://vayner.example.com/jp-3' },
    { id: 'ext-jp-4', topicName: 'Retro Game Speedruns', description: 'Short-form speedrun highlights of classic console games.', source: 'external', score: 80, referenceLink: 'https://vayner.example.com/jp-4', relatedTopics: ['Nintendo Nostalgia'] },
    { id: 'ext-jp-5', topicName: 'Train Station Piano', description: 'Impromptu piano performances at major Japanese stations.', source: 'external', score: null, referenceLink: 'https://vayner.example.com/jp-5' },
  ],
  KR: [
    { id: 'ext-kr-1', topicName: 'Glass Skin Tutorial', description: 'Step-by-step Korean skincare routines for the glass skin effect.', source: 'external', score: 94, referenceLink: 'https://vayner.example.com/kr-1' },
    { id: 'ext-kr-2', topicName: 'K-Food Mukbang Shorts', description: 'Condensed mukbang content featuring Korean street food.', source: 'external', score: 90, referenceLink: 'https://vayner.example.com/kr-2', relatedTopics: ['ASMR Eating', 'Spicy Noodle Challenge'] },
    { id: 'ext-kr-3', topicName: 'New Jeans Choreography', description: 'Latest dance moves from New Jeans driving massive engagement.', source: 'external', score: 87, referenceLink: 'https://vayner.example.com/kr-3' },
  ],
  IN: [
    { id: 'ext-in-1', topicName: 'Bollywood Dance Challenges', description: 'Viral dance challenges set to latest Bollywood soundtracks.', source: 'external', score: 95, referenceLink: 'https://vayner.example.com/in-1' },
    { id: 'ext-in-2', topicName: 'Cricket Fan Reactions', description: 'Compilation-style fan reaction videos during live matches.', source: 'external', score: 91, referenceLink: 'https://vayner.example.com/in-2', relatedTopics: ['IPL Fan Culture'] },
    { id: 'ext-in-3', topicName: 'Regional Recipe Shorts', description: 'Quick traditional recipe videos from various Indian regions.', source: 'external', score: 87, referenceLink: 'https://vayner.example.com/in-3' },
    { id: 'ext-in-4', topicName: 'Sangeet Dance Prep', description: 'Wedding dance preparation and choreography content.', source: 'external', score: 83, referenceLink: 'https://vayner.example.com/in-4' },
    { id: 'ext-in-5', topicName: 'Street Chai Culture', description: 'Aesthetic cutting chai preparation in roadside stalls.', source: 'external', score: null, referenceLink: 'https://vayner.example.com/in-5', relatedTopics: ['Indian Street Food'] },
  ],
  ID: [
    { id: 'ext-id-1', topicName: 'Indonesian Wedding Inspiration', description: 'Bridal makeup and decoration ideas for modern Indonesian weddings.', source: 'external', score: 93, referenceLink: 'https://vayner.example.com/id-1' },
    { id: 'ext-id-2', topicName: 'Koplo Music Dance', description: 'Viral dance moves set to koplo and dangdut music remixes.', source: 'external', score: 89, referenceLink: 'https://vayner.example.com/id-2', relatedTopics: ['Joget Viral'] },
    { id: 'ext-id-3', topicName: 'Indonesian Culinary Tours', description: 'Short food tour videos covering Indonesian regional cuisines.', source: 'external', score: 85, referenceLink: 'https://vayner.example.com/id-3' },
  ],
  AUNZ: [
    { id: 'ext-aunz-1', topicName: 'Summer Beach Aesthetic', description: 'Aesthetic beach lifestyle content across Australian coastlines.', source: 'external', score: 87, referenceLink: 'https://vayner.example.com/aunz-1' },
    { id: 'ext-aunz-2', topicName: 'NZ Adventure Tourism', description: 'Adrenaline-packed extreme sports content from New Zealand.', source: 'external', score: 84, referenceLink: 'https://vayner.example.com/aunz-2', relatedTopics: ['Queenstown Adventures'] },
    { id: 'ext-aunz-3', topicName: 'Wildlife Close-Ups', description: 'Up-close wildlife footage from Australian natural habitats.', source: 'external', score: 82, referenceLink: 'https://vayner.example.com/aunz-3' },
    { id: 'ext-aunz-4', topicName: 'Flat White Culture', description: 'Specialty coffee and cafe culture content from Melbourne and beyond.', source: 'external', score: 76, referenceLink: 'https://vayner.example.com/aunz-4' },
    { id: 'ext-aunz-5', topicName: 'Outback Road Trips', description: 'Cinematic short clips from Australian outback driving adventures.', source: 'external', score: null, referenceLink: 'https://vayner.example.com/aunz-5' },
  ],
};

const mockMatchedTopics: Record<string, MatchedTopic[]> = {
  JP: [
    {
      id: 'match-jp-1',
      consolidatedName: 'Japanese Food Art & Sushi Plating',
      matchCount: 4,
      avgConfidence: 9.2,
      llmExplanation: 'Strong thematic overlap between internal sushi art content and external food art trends. Both focus on visual presentation techniques.',
      referenceLink: 'https://youtube.com/shorts/example1',
      sources: [
        { topicName: 'Sushi Art Challenge', sourceType: 'internal', method: 'embedding', confidence: 9.5 },
        { topicName: 'Japanese Food Art', sourceType: 'external', method: 'embedding', confidence: 9.4 },
        { topicName: 'Convenience Store Hauls', sourceType: 'internal', method: 'llm', confidence: 8.8 },
        { topicName: 'Wagashi Art', sourceType: 'external', method: 'llm', confidence: 9.1 },
      ],
    },
    {
      id: 'match-jp-2',
      consolidatedName: 'Anime Dance Trend Recreations',
      matchCount: 2,
      avgConfidence: 8.5,
      llmExplanation: 'Both sources identify anime opening dance covers as a rising trend among Gen Z audiences.',
      referenceLink: 'https://youtube.com/shorts/example2',
      sources: [
        { topicName: 'Anime Dance Covers', sourceType: 'internal', method: 'embedding', confidence: 8.7 },
        { topicName: 'Anime Opening Dances', sourceType: 'external', method: 'embedding', confidence: 8.3 },
      ],
    },
    {
      id: 'match-jp-3',
      consolidatedName: 'Retro Gaming Content',
      matchCount: 2,
      avgConfidence: 5.8,
      llmExplanation: 'Moderate overlap between retro gaming speedruns identified externally and broader gaming content signals internally.',
      referenceLink: 'https://youtube.com/shorts/example4',
      sources: [
        { topicName: 'Cherry Blossom Spots 2026', sourceType: 'internal', method: 'llm', confidence: 4.2 },
        { topicName: 'Retro Game Speedruns', sourceType: 'external', method: 'embedding', confidence: 7.4 },
      ],
    },
  ],
  KR: [
    {
      id: 'match-kr-1',
      consolidatedName: 'K-Beauty Glass Skin Routines',
      matchCount: 3,
      avgConfidence: 9.0,
      llmExplanation: 'Very strong cross-source signal for glass skin beauty content. Both internal and external data show rapid growth.',
      referenceLink: 'https://youtube.com/shorts/example5',
      sources: [
        { topicName: 'K-Beauty Glass Skin', sourceType: 'internal', method: 'embedding', confidence: 9.5 },
        { topicName: 'Glass Skin Tutorial', sourceType: 'external', method: 'embedding', confidence: 9.2 },
        { topicName: 'Dewy Look Tutorial', sourceType: 'internal', method: 'llm', confidence: 8.3 },
      ],
    },
    {
      id: 'match-kr-2',
      consolidatedName: 'Korean Street Food & Mukbang',
      matchCount: 2,
      avgConfidence: 8.8,
      llmExplanation: 'Korean street food spicy challenges map closely to external mukbang short-form content.',
      referenceLink: 'https://youtube.com/shorts/example6',
      sources: [
        { topicName: 'Korean Street Food Spicy Challenge', sourceType: 'internal', method: 'embedding', confidence: 9.1 },
        { topicName: 'K-Food Mukbang Shorts', sourceType: 'external', method: 'embedding', confidence: 8.5 },
      ],
    },
    {
      id: 'match-kr-3',
      consolidatedName: 'K-Pop Dance Covers',
      matchCount: 3,
      avgConfidence: 8.2,
      llmExplanation: 'K-Pop random dance events and New Jeans choreography content converge across sources.',
      referenceLink: 'https://youtube.com/shorts/example7',
      sources: [
        { topicName: 'K-Pop Random Dance', sourceType: 'internal', method: 'embedding', confidence: 8.0 },
        { topicName: 'New Jeans Choreography', sourceType: 'external', method: 'embedding', confidence: 8.6 },
        { topicName: 'New Jeans Dance Cover', sourceType: 'internal', method: 'llm', confidence: 8.0 },
      ],
    },
  ],
  IN: [
    {
      id: 'match-in-1',
      consolidatedName: 'Bollywood Dance & Transitions',
      matchCount: 2,
      avgConfidence: 9.5,
      llmExplanation: 'Near-identical topic detected across both sources. Bollywood transitions and dance challenges are the top trend.',
      referenceLink: 'https://youtube.com/shorts/example8',
      sources: [
        { topicName: 'Bollywood Transitions', sourceType: 'internal', method: 'embedding', confidence: 9.7 },
        { topicName: 'Bollywood Dance Challenges', sourceType: 'external', method: 'embedding', confidence: 9.3 },
      ],
    },
    {
      id: 'match-in-2',
      consolidatedName: 'Cricket Fan Content',
      matchCount: 3,
      avgConfidence: 8.9,
      llmExplanation: 'Cricket reactions are a top signal in both data sources, with IPL-related subtopics boosting match count.',
      referenceLink: 'https://youtube.com/shorts/example9',
      sources: [
        { topicName: 'Cricket Match Reactions', sourceType: 'internal', method: 'embedding', confidence: 9.2 },
        { topicName: 'Cricket Fan Reactions', sourceType: 'external', method: 'embedding', confidence: 9.0 },
        { topicName: 'IPL Fan Culture', sourceType: 'external', method: 'llm', confidence: 8.5 },
      ],
    },
    {
      id: 'match-in-3',
      consolidatedName: 'Indian Wedding Dance Content',
      matchCount: 2,
      avgConfidence: 6.4,
      llmExplanation: 'Moderate match between internal wedding dance signals and external sangeet preparation content.',
      referenceLink: 'https://youtube.com/shorts/example11',
      sources: [
        { topicName: 'Indian Wedding Dance', sourceType: 'internal', method: 'llm', confidence: 6.8 },
        { topicName: 'Sangeet Dance Prep', sourceType: 'external', method: 'llm', confidence: 6.0 },
      ],
    },
  ],
  ID: [
    {
      id: 'match-id-1',
      consolidatedName: 'Indonesian Wedding Content',
      matchCount: 2,
      avgConfidence: 9.1,
      llmExplanation: 'Strong cross-source match on Indonesian wedding inspiration and trends.',
      referenceLink: 'https://youtube.com/shorts/example13',
      sources: [
        { topicName: 'Indonesian Wedding Trends', sourceType: 'internal', method: 'embedding', confidence: 9.3 },
        { topicName: 'Indonesian Wedding Inspiration', sourceType: 'external', method: 'embedding', confidence: 8.9 },
      ],
    },
    {
      id: 'match-id-2',
      consolidatedName: 'Dangdut & Koplo Dance Trends',
      matchCount: 3,
      avgConfidence: 8.7,
      llmExplanation: 'Dangdut remix dance maps to koplo music dance with high semantic overlap.',
      referenceLink: 'https://youtube.com/shorts/example14',
      sources: [
        { topicName: 'Dangdut Remix Dance', sourceType: 'internal', method: 'embedding', confidence: 9.0 },
        { topicName: 'Koplo Music Dance', sourceType: 'external', method: 'embedding', confidence: 8.8 },
        { topicName: 'Joget Viral', sourceType: 'external', method: 'llm', confidence: 8.3 },
      ],
    },
  ],
  AUNZ: [
    {
      id: 'match-aunz-1',
      consolidatedName: 'Australian Beach & Summer Lifestyle',
      matchCount: 2,
      avgConfidence: 8.8,
      llmExplanation: 'Overlapping beach lifestyle content identified across both data sources for summer season.',
      referenceLink: 'https://youtube.com/shorts/example16',
      sources: [
        { topicName: 'Aussie Beach Life', sourceType: 'internal', method: 'embedding', confidence: 9.0 },
        { topicName: 'Summer Beach Aesthetic', sourceType: 'external', method: 'embedding', confidence: 8.6 },
      ],
    },
    {
      id: 'match-aunz-2',
      consolidatedName: 'NZ Adventure & Extreme Sports',
      matchCount: 2,
      avgConfidence: 8.5,
      llmExplanation: 'New Zealand extreme sports content aligns across sources with high confidence.',
      referenceLink: 'https://youtube.com/shorts/example17',
      sources: [
        { topicName: 'NZ Extreme Sports', sourceType: 'internal', method: 'embedding', confidence: 8.7 },
        { topicName: 'NZ Adventure Tourism', sourceType: 'external', method: 'embedding', confidence: 8.3 },
      ],
    },
    {
      id: 'match-aunz-3',
      consolidatedName: 'Coffee Culture Content',
      matchCount: 2,
      avgConfidence: 5.2,
      llmExplanation: 'Possible match between Melbourne coffee culture and flat white content. Lower confidence due to different angles.',
      referenceLink: 'https://youtube.com/shorts/example19',
      sources: [
        { topicName: 'Melbourne Coffee Culture', sourceType: 'internal', method: 'llm', confidence: 5.5 },
        { topicName: 'Flat White Culture', sourceType: 'external', method: 'llm', confidence: 4.9 },
      ],
    },
  ],
};

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function SourceTypeBadge({ type }: { type: 'internal' | 'external' }) {
  return type === 'internal' ? (
    <span className="px-2 py-0.5 rounded-full text-xs bg-purple-500/20 text-purple-400 border border-purple-500/30">
      Internal
    </span>
  ) : (
    <span className="px-2 py-0.5 rounded-full text-xs bg-blue-500/20 text-blue-400 border border-blue-500/30">
      External
    </span>
  );
}

function MethodBadge({ method }: { method: 'embedding' | 'llm' }) {
  return method === 'embedding' ? (
    <span className="px-2 py-0.5 rounded-full text-xs bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
      Embedding
    </span>
  ) : (
    <span className="px-2 py-0.5 rounded-full text-xs bg-amber-500/20 text-amber-400 border border-amber-500/30">
      LLM
    </span>
  );
}

function ConfidenceBadge({ avg }: { avg: number }) {
  if (avg >= 8) {
    return (
      <span className="px-2 py-0.5 rounded-full text-xs bg-green-500/20 text-green-400 border border-green-500/30">
        Strong Match
      </span>
    );
  }
  if (avg >= 5) {
    return (
      <span className="px-2 py-0.5 rounded-full text-xs bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">
        Likely Match
      </span>
    );
  }
  return (
    <span className="px-2 py-0.5 rounded-full text-xs bg-gray-500/20 text-gray-400 border border-gray-500/30">
      Possible
    </span>
  );
}

// ---------------------------------------------------------------------------
// TopicEntryCard (used by Internal & External columns)
// ---------------------------------------------------------------------------

function TopicEntryCard({ entry }: { entry: TopicEntry }) {
  const [showRelated, setShowRelated] = useState(false);
  const hasRelated = entry.relatedTopics && entry.relatedTopics.length > 0;

  return (
    <div className="bg-card border border-border rounded-lg p-4 hover:border-primary/50 transition-all">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-2">
        <h4 className="text-foreground font-medium leading-snug">{entry.topicName}</h4>
        <div className="text-right flex-shrink-0">
          <div className="text-lg font-bold text-foreground">
            {entry.score !== null ? entry.score : '\u2014'}
          </div>
          <div className="text-xs text-muted-foreground">Score</div>
        </div>
      </div>

      {/* Description (clamped to 2 lines) */}
      <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{entry.description}</p>

      {/* Badges & actions */}
      <div className="flex flex-wrap items-center gap-2">
        <SourceTypeBadge type={entry.source} />

        {hasRelated && (
          <button
            onClick={() => setShowRelated(!showRelated)}
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 hover:bg-indigo-500/30 transition-colors"
          >
            <Link2 className="size-3" />
            Related ({entry.relatedTopics!.length})
            {showRelated ? <ChevronUp className="size-3" /> : <ChevronDown className="size-3" />}
          </button>
        )}

        <a
          href={entry.referenceLink}
          target="_blank"
          rel="noopener noreferrer"
          className="ml-auto inline-flex items-center gap-1 text-xs text-primary hover:underline"
        >
          <ExternalLink className="size-3" />
          Ref
        </a>
      </div>

      {/* Expanded related topics */}
      {showRelated && hasRelated && (
        <div className="mt-3 pt-3 border-t border-border">
          <div className="flex flex-wrap gap-2">
            {entry.relatedTopics!.map((rt) => (
              <span
                key={rt}
                className="px-2 py-1 rounded-md text-xs bg-muted text-muted-foreground"
              >
                {rt}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// MatchedTopicCard (center column)
// ---------------------------------------------------------------------------

function MatchedTopicCard({
  topic,
  onApprove,
  isApproved,
}: {
  topic: MatchedTopic;
  onApprove: (id: string) => void;
  isApproved: boolean;
}) {
  const [expanded, setExpanded] = useState(false);

  const matchCountStyle =
    topic.matchCount >= 4
      ? 'bg-yellow-500/30 text-yellow-300 border-yellow-500/50 font-bold'
      : topic.matchCount >= 3
        ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30 font-semibold'
        : 'bg-yellow-500/10 text-yellow-400/80 border-yellow-500/20';

  return (
    <div
      className={`bg-card border rounded-lg p-4 transition-all ${
        isApproved
          ? 'border-green-500 bg-green-500/5'
          : 'border-border hover:border-yellow-500/50'
      }`}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-2">
        <h4 className="text-foreground font-semibold leading-snug">{topic.consolidatedName}</h4>
      </div>

      {/* Badges row */}
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <span
          className={`px-2 py-0.5 rounded-full text-xs border ${matchCountStyle}`}
        >
          {topic.matchCount} matches
        </span>
        <ConfidenceBadge avg={topic.avgConfidence} />
        <span className="text-xs text-muted-foreground">
          avg {topic.avgConfidence.toFixed(1)}/10
        </span>
      </div>

      {/* LLM explanation */}
      <p className="text-xs italic text-muted-foreground mb-3 leading-relaxed">
        {topic.llmExplanation}
      </p>

      {/* Expand / collapse sources */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="inline-flex items-center gap-1 text-xs text-primary hover:underline mb-3"
      >
        <Layers className="size-3" />
        {expanded ? 'Hide' : 'Show'} matched sources
        {expanded ? <ChevronUp className="size-3" /> : <ChevronDown className="size-3" />}
      </button>

      {expanded && (
        <div className="mb-3 space-y-2 pt-2 border-t border-border">
          {topic.sources.map((src, idx) => (
            <div
              key={idx}
              className="flex flex-wrap items-center gap-2 text-xs py-1"
            >
              <span className="text-foreground font-medium truncate max-w-[140px]">
                {src.topicName}
              </span>
              <SourceTypeBadge type={src.sourceType} />
              <MethodBadge method={src.method} />
              <span className="text-muted-foreground ml-auto tabular-nums">
                {src.confidence.toFixed(1)}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-2">
        <a
          href={topic.referenceLink}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-secondary text-secondary-foreground hover:bg-accent transition-colors text-xs"
        >
          <ExternalLink className="size-3" />
          Reference
        </a>

        {!isApproved ? (
          <button
            onClick={() => onApprove(topic.id)}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition-opacity text-xs"
          >
            <CheckCircle2 className="size-3" />
            Approve
          </button>
        ) : (
          <div className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-green-600 text-white text-xs">
            <CheckCircle2 className="size-3" />
            Approved
          </div>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Column Header
// ---------------------------------------------------------------------------

function ColumnHeader({
  icon: Icon,
  title,
  subtitle,
  count,
  accentClass,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  subtitle: string;
  count: number;
  accentClass: string;
}) {
  return (
    <div className={`bg-card border rounded-lg p-4 mb-4 border-l-4 ${accentClass}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Icon className="size-5 text-foreground" />
          <div>
            <h3 className="text-foreground font-semibold text-sm">{title}</h3>
            <p className="text-xs text-muted-foreground">{subtitle}</p>
          </div>
        </div>
        <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-muted text-foreground">
          {count}
        </span>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export function ThreeTrackView({ market }: ThreeTrackViewProps) {
  const [approvedMatches, setApprovedMatches] = useState<Set<string>>(new Set());
  const [analysisStatus, setAnalysisStatus] = useState<'idle' | 'running' | 'success' | 'error'>('idle');
  const [analysisMessage, setAnalysisMessage] = useState('');

  const internalTopics = mockInternalTopics[market] || [];
  const externalTopics = mockExternalTopics[market] || [];
  const matchedTopics = mockMatchedTopics[market] || [];

  const handleApprove = (id: string) => {
    setApprovedMatches((prev) => new Set(prev).add(id));
  };

  const handleRunFullAnalysis = async () => {
    setAnalysisStatus('running');
    setAnalysisMessage('Running topic matching and ranking...');
    try {
      const result = await runFullAnalysis(market);
      setAnalysisStatus('success');
      setAnalysisMessage(
        `Analysis complete — ${result.ranking.matchedRanked} matched, ` +
        `${result.ranking.internalRanked} internal, ${result.ranking.externalRanked} external topics ranked`
      );
      // Auto-clear success message after 8 seconds
      setTimeout(() => {
        setAnalysisStatus('idle');
        setAnalysisMessage('');
      }, 8000);
    } catch (err: any) {
      setAnalysisStatus('error');
      setAnalysisMessage(err.message || 'Analysis failed. Check console for details.');
    }
  };

  return (
    <div>
      {/* Run Full Analysis Button */}
      <div className="mb-6 flex items-center gap-4">
        <button
          onClick={handleRunFullAnalysis}
          disabled={analysisStatus === 'running'}
          className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${
            analysisStatus === 'running'
              ? 'bg-primary/50 text-primary-foreground cursor-not-allowed'
              : 'bg-primary text-primary-foreground hover:opacity-90 shadow-lg shadow-primary/25'
          }`}
        >
          {analysisStatus === 'running' ? (
            <Loader2 className="size-5 animate-spin" />
          ) : (
            <Play className="size-5" />
          )}
          {analysisStatus === 'running' ? 'Running Analysis...' : 'Run Full Analysis'}
        </button>

        {/* Status message */}
        {analysisMessage && (
          <div className={`flex items-center gap-2 text-sm px-4 py-2 rounded-lg ${
            analysisStatus === 'success'
              ? 'bg-green-500/10 text-green-400 border border-green-500/20'
              : analysisStatus === 'error'
              ? 'bg-red-500/10 text-red-400 border border-red-500/20'
              : 'bg-primary/10 text-primary border border-primary/20'
          }`}>
            {analysisStatus === 'success' && <CheckCircle2 className="size-4" />}
            {analysisStatus === 'error' && <AlertCircle className="size-4" />}
            {analysisStatus === 'running' && <Loader2 className="size-4 animate-spin" />}
            {analysisMessage}
          </div>
        )}
      </div>

      {/* Three-column grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* ---- Left Column: Internal Data ---- */}
      <div>
        <ColumnHeader
          icon={Database}
          title="Internal Source"
          subtitle="Nyan Cat Data"
          count={internalTopics.length}
          accentClass="border-l-purple-500"
        />
        <div className="space-y-3">
          {internalTopics.length === 0 ? (
            <div className="p-6 text-center bg-card rounded-lg border border-border">
              <p className="text-sm text-muted-foreground">No internal topics for this market</p>
            </div>
          ) : (
            internalTopics.map((entry) => (
              <TopicEntryCard key={entry.id} entry={entry} />
            ))
          )}
        </div>
      </div>

      {/* ---- Center Column: Matched Topics ---- */}
      <div>
        <ColumnHeader
          icon={GitMerge}
          title="Cross-Source Matches"
          subtitle="Internal + External Matches"
          count={matchedTopics.length}
          accentClass="border-l-yellow-500"
        />
        <div className="space-y-3">
          {matchedTopics.length === 0 ? (
            <div className="p-6 text-center bg-card rounded-lg border border-border">
              <p className="text-sm text-muted-foreground">No matched topics for this market</p>
            </div>
          ) : (
            matchedTopics.map((topic) => (
              <MatchedTopicCard
                key={topic.id}
                topic={topic}
                onApprove={handleApprove}
                isApproved={approvedMatches.has(topic.id)}
              />
            ))
          )}
        </div>
      </div>

      {/* ---- Right Column: External Data ---- */}
      <div>
        <ColumnHeader
          icon={Globe}
          title="External Source"
          subtitle="Vayner Media Data"
          count={externalTopics.length}
          accentClass="border-l-blue-500"
        />
        <div className="space-y-3">
          {externalTopics.length === 0 ? (
            <div className="p-6 text-center bg-card rounded-lg border border-border">
              <p className="text-sm text-muted-foreground">No external topics for this market</p>
            </div>
          ) : (
            externalTopics.map((entry) => (
              <TopicEntryCard key={entry.id} entry={entry} />
            ))
          )}
        </div>
      </div>
    </div>
    </div>
  );
}
