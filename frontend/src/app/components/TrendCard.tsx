import { ExternalLink, TrendingUp, TrendingDown, Minus, CheckCircle2, Clock, Music, Hash } from 'lucide-react';

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
}

interface TrendCardProps {
  trend: Trend;
  onApprove: (trendId: string) => void;
  isApproved: boolean;
}

export function TrendCard({ trend, onApprove, isApproved }: TrendCardProps) {
  const handleApprove = () => {
    onApprove(trend.id);
    // In a real app, this would trigger the API call to Agent Collective
    console.log('Trend approved for Agent Collective:', trend);
  };

  const getVelocityIcon = () => {
    switch (trend.velocity) {
      case 'increasing':
        return <TrendingUp className="size-4 text-green-600" />;
      case 'decreasing':
        return <TrendingDown className="size-4 text-orange-600" />;
      default:
        return <Minus className="size-4 text-muted-foreground" />;
    }
  };

  const getVelocityLabel = () => {
    switch (trend.velocity) {
      case 'increasing':
        return 'Increasing';
      case 'decreasing':
        return 'Decreasing';
      default:
        return 'Stable';
    }
  };

  const getSourceBadgeColor = () => {
    switch (trend.source) {
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

  const isExpiring = trend.ageInWeeks >= 3;

  return (
    <div className={`bg-card border rounded-lg p-5 transition-all ${
      isApproved ? 'border-green-500 bg-green-50/50' : 'border-border hover:border-primary/50'
    }`}>
      <div className="flex gap-4">
        {/* Rank Badge */}
        <div className="flex-shrink-0">
          <div className="size-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold">
            #{trend.rank}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Header Row */}
          <div className="flex items-start justify-between gap-4 mb-3">
            <div className="flex-1">
              <h3 className="text-foreground mb-1">{trend.topicName}</h3>
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <span className={`px-2 py-1 rounded-full ${getSourceBadgeColor()}`}>
                  {trend.source}
                </span>
                <span className="px-2 py-1 rounded-full bg-muted text-muted-foreground">
                  {trend.targetDemo}
                </span>
                <div className="flex items-center gap-1 text-muted-foreground">
                  {getVelocityIcon()}
                  <span>{getVelocityLabel()}</span>
                </div>
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Clock className="size-4" />
                  <span>{trend.ageInWeeks}w old</span>
                  {isExpiring && (
                    <span className="ml-1 text-orange-600 font-medium">⚠️ Expiring Soon</span>
                  )}
                </div>
              </div>
            </div>

            {/* Score */}
            <div className="text-right flex-shrink-0">
              <div className="text-2xl font-bold text-foreground">{trend.score}</div>
              <div className="text-xs text-muted-foreground">Score</div>
            </div>
          </div>

          {/* Description */}
          <p className="text-foreground mb-3">{trend.description}</p>

          {/* Metadata Row */}
          <div className="flex flex-wrap gap-3 mb-4 text-sm">
            {trend.audio && (
              <div className="flex items-center gap-1 text-muted-foreground">
                <Music className="size-4" />
                <span>{trend.audio}</span>
              </div>
            )}
            {trend.hashtags && trend.hashtags.length > 0 && (
              <div className="flex items-center gap-1 text-muted-foreground">
                <Hash className="size-4" />
                <span>{trend.hashtags.join(', ')}</span>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <a
              href={trend.referenceLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-secondary text-secondary-foreground hover:bg-accent transition-colors"
            >
              <ExternalLink className="size-4" />
              View Reference
            </a>

            {!isApproved ? (
              <button
                onClick={handleApprove}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
              >
                <CheckCircle2 className="size-4" />
                Approve for Campaign
              </button>
            ) : (
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-green-600 text-white">
                <CheckCircle2 className="size-4" />
                Approved - Sent to Agent Collective
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}