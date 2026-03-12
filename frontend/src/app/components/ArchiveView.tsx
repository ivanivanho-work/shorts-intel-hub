import { useState } from 'react';
import { Calendar, ChevronDown, ChevronUp, Database, GitMerge, Globe } from 'lucide-react';

interface ArchivedTopic {
  id: string;
  topicName: string;
  description: string;
  score: number;
  rank: number;
  matchCount?: number;
  confidence?: number;
}

interface WeeklyArchive {
  weekLabel: string;
  weekStart: string;
  weekEnd: string;
  market: string;
  internalTrack: ArchivedTopic[];
  centerTrack: ArchivedTopic[];
  externalTrack: ArchivedTopic[];
}

// Mock archived data with three-track structure
const mockArchives: Record<string, WeeklyArchive[]> = {
  JP: [
    {
      weekLabel: 'Week of March 3-9, 2026',
      weekStart: '2026-03-03',
      weekEnd: '2026-03-09',
      market: 'Japan',
      internalTrack: [
        { id: 'a-jp-i1', topicName: 'Anime Dance Challenge', description: 'Users recreate iconic anime dance sequences with original choreography', score: 92, rank: 1 },
        { id: 'a-jp-i2', topicName: 'Konbini Mukbang', description: 'Convenience store food reviews and taste tests from Japanese konbini', score: 85, rank: 2 },
      ],
      centerTrack: [
        { id: 'a-jp-m1', topicName: 'Anime Opening Recreations', description: 'Matched: Internal anime dance + External live-action anime recreations', score: 95, rank: 1, matchCount: 2, confidence: 0.92 },
      ],
      externalTrack: [
        { id: 'a-jp-e1', topicName: 'Kawaii Fashion Lookbooks', description: 'Cute fashion styling videos featuring Japanese street fashion trends', score: 78, rank: 1 },
        { id: 'a-jp-e2', topicName: 'Japanese Convenience Store Hauls', description: 'Tourists and locals reviewing unique Japanese convenience store finds', score: 72, rank: 2 },
      ],
    },
    {
      weekLabel: 'Week of February 24 - March 2, 2026',
      weekStart: '2026-02-24',
      weekEnd: '2026-03-02',
      market: 'Japan',
      internalTrack: [
        { id: 'a-jp-i3', topicName: 'Tokyo Street Fashion', description: 'Harajuku and Shibuya street style showcases', score: 88, rank: 1 },
      ],
      centerTrack: [
        { id: 'a-jp-m2', topicName: 'Japanese Street Style', description: 'Matched: Internal Tokyo fashion + External Harajuku lookbooks', score: 91, rank: 1, matchCount: 3, confidence: 0.89 },
      ],
      externalTrack: [
        { id: 'a-jp-e3', topicName: 'Cherry Blossom Forecast', description: 'Early sakura predictions and best viewing spots for 2026', score: 80, rank: 1 },
      ],
    },
  ],
  KR: [
    {
      weekLabel: 'Week of March 3-9, 2026',
      weekStart: '2026-03-03',
      weekEnd: '2026-03-09',
      market: 'South Korea',
      internalTrack: [
        { id: 'a-kr-i1', topicName: 'K-Pop Dance Cover', description: 'Fan dance covers of latest K-Pop group choreography', score: 94, rank: 1 },
      ],
      centerTrack: [
        { id: 'a-kr-m1', topicName: 'K-Pop Choreography', description: 'Matched: Internal dance covers + External dance tutorials', score: 97, rank: 1, matchCount: 2, confidence: 0.95 },
      ],
      externalTrack: [
        { id: 'a-kr-e1', topicName: 'Glass Skin Tutorial', description: 'Achieving the Korean glass skin look with skincare and makeup', score: 82, rank: 1 },
      ],
    },
  ],
  IN: [
    {
      weekLabel: 'Week of March 3-9, 2026',
      weekStart: '2026-03-03',
      weekEnd: '2026-03-09',
      market: 'India',
      internalTrack: [
        { id: 'a-in-i1', topicName: 'Bollywood Transition Reels', description: 'Creative outfit transitions synced to Bollywood music', score: 90, rank: 1 },
      ],
      centerTrack: [
        { id: 'a-in-m1', topicName: 'Bollywood Dance Content', description: 'Matched: Internal transitions + External dance challenges', score: 93, rank: 1, matchCount: 2, confidence: 0.91 },
      ],
      externalTrack: [
        { id: 'a-in-e1', topicName: 'Indian Wedding Content', description: 'Lavish Indian wedding ceremonies and celebration highlights', score: 76, rank: 1 },
      ],
    },
  ],
  ID: [
    {
      weekLabel: 'Week of March 3-9, 2026',
      weekStart: '2026-03-03',
      weekEnd: '2026-03-09',
      market: 'Indonesia',
      internalTrack: [
        { id: 'a-id-i1', topicName: 'Indonesian Mukbang', description: 'Local food reviews featuring Indonesian cuisine', score: 86, rank: 1 },
      ],
      centerTrack: [
        { id: 'a-id-m1', topicName: 'Indonesian Food Content', description: 'Matched: Internal mukbang + External street food tours', score: 89, rank: 1, matchCount: 2, confidence: 0.88 },
      ],
      externalTrack: [
        { id: 'a-id-e1', topicName: 'Bali Travel Content', description: 'Travel vlogs and hidden gem discoveries in Bali', score: 74, rank: 1 },
      ],
    },
  ],
  AUNZ: [
    {
      weekLabel: 'Week of March 3-9, 2026',
      weekStart: '2026-03-03',
      weekEnd: '2026-03-09',
      market: 'Australia & New Zealand',
      internalTrack: [
        { id: 'a-aunz-i1', topicName: 'Aussie Slang Challenge', description: 'Testing knowledge of Australian slang and expressions', score: 83, rank: 1 },
      ],
      centerTrack: [
        { id: 'a-aunz-m1', topicName: 'Australian Culture Content', description: 'Matched: Internal slang challenges + External accent challenges', score: 87, rank: 1, matchCount: 2, confidence: 0.86 },
      ],
      externalTrack: [
        { id: 'a-aunz-e1', topicName: 'NZ Nature Exploration', description: 'Hiking and nature content from New Zealand landscapes', score: 71, rank: 1 },
      ],
    },
  ],
};

interface ArchiveViewProps {
  market: string;
}

function TrackColumn({
  icon: Icon,
  title,
  accentColor,
  topics
}: {
  icon: React.ElementType;
  title: string;
  accentColor: string;
  topics: ArchivedTopic[];
}) {
  return (
    <div>
      <div className={`flex items-center gap-2 mb-3 pb-2 border-b-2 ${accentColor}`}>
        <Icon className="size-4 text-muted-foreground" />
        <span className="text-sm font-medium text-muted-foreground">{title}</span>
        <span className="text-xs text-muted-foreground ml-auto">{topics.length}</span>
      </div>
      <div className="space-y-2">
        {topics.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-3">No topics</p>
        ) : (
          topics.map((topic) => (
            <div key={topic.id} className="p-3 bg-muted/50 rounded-lg">
              <div className="flex items-start justify-between gap-2 mb-1">
                <span className="text-sm font-medium text-foreground">{topic.topicName}</span>
                <span className="text-sm font-bold text-foreground flex-shrink-0">{topic.score}</span>
              </div>
              <p className="text-xs text-muted-foreground mb-2">{topic.description}</p>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">#{topic.rank}</span>
                {topic.matchCount && (
                  <span className="text-xs px-1.5 py-0.5 rounded bg-yellow-500/10 text-yellow-400 border border-yellow-500/20">
                    {topic.matchCount} matches
                  </span>
                )}
                {topic.confidence && (
                  <span className="text-xs text-muted-foreground">
                    {Math.round(topic.confidence * 100)}% conf
                  </span>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export function ArchiveView({ market }: ArchiveViewProps) {
  const [expandedWeeks, setExpandedWeeks] = useState<Set<string>>(new Set([mockArchives[market]?.[0]?.weekLabel]));

  const archives = mockArchives[market] || [];

  const toggleWeek = (weekLabel: string) => {
    const newExpanded = new Set(expandedWeeks);
    if (newExpanded.has(weekLabel)) {
      newExpanded.delete(weekLabel);
    } else {
      newExpanded.add(weekLabel);
    }
    setExpandedWeeks(newExpanded);
  };

  return (
    <div>
      {/* Info */}
      <div className="mb-6 p-4 bg-card border border-border rounded-lg flex gap-3">
        <Calendar className="size-5 text-primary flex-shrink-0 mt-0.5" />
        <div>
          <h4 className="text-foreground font-medium mb-1">Historical Archive</h4>
          <p className="text-muted-foreground text-sm">
            Browse past weeks' analysis results across all three tracks. Data is archived weekly and retained for 12 weeks.
          </p>
        </div>
      </div>

      {/* Archive List */}
      {archives.length === 0 ? (
        <div className="p-8 text-center bg-card rounded-lg border border-border">
          <Calendar className="size-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">No archived data available for {market}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {archives.map((archive) => {
            const isExpanded = expandedWeeks.has(archive.weekLabel);
            const totalTopics = archive.internalTrack.length + archive.centerTrack.length + archive.externalTrack.length;

            return (
              <div key={archive.weekLabel} className="bg-card border border-border rounded-lg overflow-hidden">
                {/* Week Header */}
                <button
                  onClick={() => toggleWeek(archive.weekLabel)}
                  className="w-full px-5 py-4 flex items-center justify-between hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Calendar className="size-5 text-muted-foreground" />
                    <div className="text-left">
                      <h3 className="text-foreground font-medium">{archive.weekLabel}</h3>
                      <p className="text-sm text-muted-foreground">
                        {totalTopics} topics — {archive.internalTrack.length} internal, {archive.centerTrack.length} matched, {archive.externalTrack.length} external
                      </p>
                    </div>
                  </div>
                  {isExpanded ? (
                    <ChevronUp className="size-5 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="size-5 text-muted-foreground" />
                  )}
                </button>

                {/* Week Content - Three Track Grid */}
                {isExpanded && (
                  <div className="border-t border-border p-5">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      <TrackColumn
                        icon={Database}
                        title="Internal (Nyan Cat)"
                        accentColor="border-purple-500"
                        topics={archive.internalTrack}
                      />
                      <TrackColumn
                        icon={GitMerge}
                        title="Cross-Source Matched"
                        accentColor="border-yellow-500"
                        topics={archive.centerTrack}
                      />
                      <TrackColumn
                        icon={Globe}
                        title="External (Vayner)"
                        accentColor="border-blue-500"
                        topics={archive.externalTrack}
                      />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
