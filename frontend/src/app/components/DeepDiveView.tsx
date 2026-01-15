import { ExternalLink, TrendingUp, TrendingDown, Minus } from 'lucide-react';

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

interface DeepDiveViewProps {
  trends: Trend[];
  selectedSource: string;
  onSourceChange: (source: string) => void;
}

const sources = ['All Sources', 'Search', 'Nyan Cat', 'Agency', 'Music'];

export function DeepDiveView({ trends, selectedSource, onSourceChange }: DeepDiveViewProps) {
  const filteredTrends = selectedSource === 'All Sources' 
    ? trends 
    : trends.filter(t => t.source === selectedSource);

  const getVelocityIcon = (velocity: string) => {
    switch (velocity) {
      case 'increasing':
        return <TrendingUp className="size-4 text-green-600" />;
      case 'decreasing':
        return <TrendingDown className="size-4 text-orange-600" />;
      default:
        return <Minus className="size-4 text-muted-foreground" />;
    }
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
      {/* Source Filter */}
      <div className="mb-6 flex items-center gap-4">
        <label className="text-foreground font-medium">Filter by Source:</label>
        <div className="flex gap-2">
          {sources.map((source) => (
            <button
              key={source}
              onClick={() => onSourceChange(source)}
              className={`px-4 py-2 rounded-lg transition-colors ${
                selectedSource === source
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary text-secondary-foreground hover:bg-accent'
              }`}
            >
              {source}
            </button>
          ))}
        </div>
      </div>

      {/* Results Count */}
      <div className="mb-4 p-4 bg-muted rounded-lg">
        <p className="text-muted-foreground">
          <span className="font-medium text-foreground">{filteredTrends.length}</span> trends from {selectedSource}
        </p>
      </div>

      {/* Table View */}
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1400px]">
            <thead className="bg-muted border-b border-border">
              <tr>
                <th className="px-4 py-3 text-left text-foreground font-medium w-[120px]">Source</th>
                <th className="px-4 py-3 text-left text-foreground font-medium w-[180px]">Topic Name</th>
                <th className="px-4 py-3 text-left text-foreground font-medium w-[400px]">Description</th>
                <th className="px-4 py-3 text-left text-foreground font-medium w-[140px]">Target Demo</th>
                <th className="px-4 py-3 text-left text-foreground font-medium w-[220px]">Performance</th>
                <th className="px-4 py-3 text-left text-foreground font-medium w-[100px]">Link</th>
              </tr>
            </thead>
            <tbody>
              {filteredTrends.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                    No trends found for selected filters
                  </td>
                </tr>
              ) : (
                filteredTrends.map((trend, index) => (
                  <tr 
                    key={trend.id}
                    className={`border-b border-border hover:bg-muted/50 transition-colors ${
                      index % 2 === 0 ? 'bg-card' : 'bg-muted/20'
                    }`}
                  >
                    {/* Source */}
                    <td className="px-4 py-4">
                      <span className={`px-2 py-1 rounded-full text-sm whitespace-nowrap ${getSourceBadgeColor(trend.source)}`}>
                        {trend.source}
                      </span>
                    </td>

                    {/* Topic Name */}
                    <td className="px-4 py-4">
                      <div className="font-medium text-foreground">{trend.topicName}</div>
                      {trend.audio && (
                        <div className="text-sm text-muted-foreground mt-1">🎵 {trend.audio}</div>
                      )}
                    </td>

                    {/* Description */}
                    <td className="px-4 py-4">
                      <div className="max-w-md text-foreground">{trend.description}</div>
                      {trend.hashtags && trend.hashtags.length > 0 && (
                        <div className="text-sm text-muted-foreground mt-2">
                          {trend.hashtags.join(' ')}
                        </div>
                      )}
                    </td>

                    {/* Target Demo */}
                    <td className="px-4 py-4">
                      <span className="px-2 py-1 rounded-full bg-secondary text-secondary-foreground text-sm">
                        {trend.targetDemo}
                      </span>
                    </td>

                    {/* Performance Metrics */}
                    <td className="px-4 py-4">
                      <div className="space-y-2 min-w-[200px]">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-sm text-muted-foreground">Score:</span>
                          <span className="font-semibold text-foreground">{trend.score}</span>
                        </div>
                        {trend.viewsVolume && (
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-sm text-muted-foreground">Views:</span>
                            <span className="text-sm text-foreground font-medium">{trend.viewsVolume}</span>
                          </div>
                        )}
                        {trend.viewsVelocity && (
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-sm text-muted-foreground">Views Δ:</span>
                            <span className="text-sm text-green-600 font-medium">{trend.viewsVelocity}</span>
                          </div>
                        )}
                        {trend.creationRate && (
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-sm text-muted-foreground">Creation:</span>
                            <span className="text-sm text-foreground font-medium">{trend.creationRate}</span>
                          </div>
                        )}
                        {trend.watchtimeVolume && (
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-sm text-muted-foreground">Watchtime:</span>
                            <span className="text-sm text-foreground font-medium">{trend.watchtimeVolume}</span>
                          </div>
                        )}
                        {trend.watchtimeVelocity && (
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-sm text-muted-foreground">WT Δ:</span>
                            <span className="text-sm text-green-600 font-medium">{trend.watchtimeVelocity}</span>
                          </div>
                        )}
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-sm text-muted-foreground">Age:</span>
                          <span className="text-sm text-foreground">{trend.ageInWeeks}w
                          {trend.ageInWeeks >= 3 && (
                            <span className="ml-1 text-orange-600">⚠️</span>
                          )}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Reference Link */}
                    <td className="px-4 py-4">
                      <a
                        href={trend.referenceLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-primary hover:underline"
                      >
                        <ExternalLink className="size-4" />
                        View
                      </a>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}