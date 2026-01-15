import { useState } from 'react';
import { Calendar, ChevronDown, ChevronUp } from 'lucide-react';

interface ArchivedTrend {
  id: string;
  topicName: string;
  description: string;
  targetDemo: string;
  rank: number;
  score: number;
  source: string;
}

interface WeeklyArchive {
  weekLabel: string;
  weekStart: string;
  weekEnd: string;
  market: string;
  trends: ArchivedTrend[];
}

// Mock archived data
const mockArchives: Record<string, WeeklyArchive[]> = {
  JP: [
    {
      weekLabel: 'Week of January 6-12, 2026',
      weekStart: '2026-01-06',
      weekEnd: '2026-01-12',
      market: 'Japan',
      trends: [
        {
          id: 'arch-jp-1',
          topicName: 'New Year Temple Visits',
          description: 'Traditional first shrine visits of the year trending across all demographics.',
          targetDemo: 'All 18-44',
          rank: 1,
          score: 97,
          source: 'Nyan Cat',
        },
        {
          id: 'arch-jp-2',
          topicName: 'Winter Sale Hauls',
          description: 'Department store winter sale shopping hauls gaining traction.',
          targetDemo: 'Females 18-34',
          rank: 2,
          score: 94,
          source: 'Agency',
        },
        {
          id: 'arch-jp-3',
          topicName: 'Osechi Cooking Tutorial',
          description: 'Traditional New Year food preparation videos.',
          targetDemo: 'Females 25-44',
          rank: 3,
          score: 89,
          source: 'Search',
        },
      ],
    },
    {
      weekLabel: 'Week of December 30, 2025 - January 5, 2026',
      weekStart: '2025-12-30',
      weekEnd: '2026-01-05',
      market: 'Japan',
      trends: [
        {
          id: 'arch-jp-4',
          topicName: 'Year-End Countdown Events',
          description: 'Live countdown celebrations from major cities.',
          targetDemo: 'All 18-34',
          rank: 1,
          score: 99,
          source: 'Nyan Cat',
        },
        {
          id: 'arch-jp-5',
          topicName: '2025 Recap Videos',
          description: 'Personal year-in-review montages trending.',
          targetDemo: 'All 18-44',
          rank: 2,
          score: 95,
          source: 'Search',
        },
        {
          id: 'arch-jp-6',
          topicName: 'Kohaku Uta Gassen Reactions',
          description: 'Reactions to NHK\'s annual music show.',
          targetDemo: 'All 25-54',
          rank: 3,
          score: 91,
          source: 'Music',
        },
      ],
    },
  ],
  KR: [
    {
      weekLabel: 'Week of January 6-12, 2026',
      weekStart: '2026-01-06',
      weekEnd: '2026-01-12',
      market: 'South Korea',
      trends: [
        {
          id: 'arch-kr-1',
          topicName: 'Lunar New Year Prep',
          description: 'Traditional Seollal preparation and gift ideas.',
          targetDemo: 'All 25-44',
          rank: 1,
          score: 96,
          source: 'Search',
        },
        {
          id: 'arch-kr-2',
          topicName: 'K-Drama Winter Fashion',
          description: 'Fashion inspired by hit winter dramas.',
          targetDemo: 'Females 18-34',
          rank: 2,
          score: 93,
          source: 'Agency',
        },
      ],
    },
  ],
  IN: [
    {
      weekLabel: 'Week of January 6-12, 2026',
      weekStart: '2026-01-06',
      weekEnd: '2026-01-12',
      market: 'India',
      trends: [
        {
          id: 'arch-in-1',
          topicName: 'Republic Day Preparations',
          description: 'Patriotic content leading up to Republic Day celebrations.',
          targetDemo: 'All 18-44',
          rank: 1,
          score: 95,
          source: 'Search',
        },
      ],
    },
  ],
  ID: [
    {
      weekLabel: 'Week of January 6-12, 2026',
      weekStart: '2026-01-06',
      weekEnd: '2026-01-12',
      market: 'Indonesia',
      trends: [
        {
          id: 'arch-id-1',
          topicName: 'New Year Beach Getaways',
          description: 'Beach vacation content trending post-holidays.',
          targetDemo: 'All 18-34',
          rank: 1,
          score: 92,
          source: 'Nyan Cat',
        },
      ],
    },
  ],
  AUNZ: [
    {
      weekLabel: 'Week of January 6-12, 2026',
      weekStart: '2026-01-06',
      weekEnd: '2026-01-12',
      market: 'Australia & New Zealand',
      trends: [
        {
          id: 'arch-aunz-1',
          topicName: 'Australia Day Planning',
          description: 'BBQ recipes and celebration ideas gaining momentum.',
          targetDemo: 'All 25-44',
          rank: 1,
          score: 88,
          source: 'Search',
        },
      ],
    },
  ],
};

interface ArchiveViewProps {
  market: string;
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

  const getSourceBadgeColor = (source: string) => {
    switch (source) {
      case 'Search':
        return 'bg-blue-500/20 text-blue-400 border border-blue-500/30';
      case 'Nyan Cat':
        return 'bg-purple-500/20 text-purple-400 border border-purple-500/30';
      case 'Agency':
        return 'bg-orange-500/20 text-orange-400 border border-orange-500/30';
      case 'Music':
        return 'bg-pink-500/20 text-pink-400 border border-pink-500/30';
      default:
        return 'bg-gray-500/20 text-gray-400 border border-gray-500/30';
    }
  };

  return (
    <div>
      {/* Info */}
      <div className="mb-6 p-4 bg-card border border-border rounded-lg flex gap-3">
        <Calendar className="size-5 text-primary flex-shrink-0 mt-0.5" />
        <div>
          <h4 className="text-foreground font-medium mb-1">Historical Archive</h4>
          <p className="text-muted-foreground text-sm">
            Browse past weeks' top topics and trends. Data is archived weekly and retained for 12 weeks.
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
                      <p className="text-sm text-muted-foreground">{archive.trends.length} top trends</p>
                    </div>
                  </div>
                  {isExpanded ? (
                    <ChevronUp className="size-5 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="size-5 text-muted-foreground" />
                  )}
                </button>

                {/* Week Content */}
                {isExpanded && (
                  <div className="border-t border-border">
                    <div className="p-5 space-y-3">
                      {archive.trends.map((trend) => (
                        <div
                          key={trend.id}
                          className="p-4 bg-muted/50 rounded-lg hover:bg-muted transition-colors"
                        >
                          <div className="flex items-start gap-4">
                            {/* Rank */}
                            <div className="flex-shrink-0">
                              <div className="size-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold">
                                #{trend.rank}
                              </div>
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-4 mb-2">
                                <h4 className="text-foreground font-medium">{trend.topicName}</h4>
                                <div className="text-right flex-shrink-0">
                                  <div className="text-xl font-bold text-foreground">{trend.score}</div>
                                  <div className="text-xs text-muted-foreground">Score</div>
                                </div>
                              </div>

                              <p className="text-foreground text-sm mb-3">{trend.description}</p>

                              <div className="flex flex-wrap items-center gap-2">
                                <span className={`px-2 py-1 rounded-full text-sm ${getSourceBadgeColor(trend.source)}`}>
                                  {trend.source}
                                </span>
                                <span className="px-2 py-1 rounded-full bg-secondary text-secondary-foreground text-sm">
                                  {trend.targetDemo}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
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