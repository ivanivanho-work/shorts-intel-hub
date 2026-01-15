import { TrendingUp, Database, Users, Sparkles } from 'lucide-react';

interface StatsDashboardProps {
  market: string;
  totalTrends: number;
  approvedCount: number;
}

export function StatsDashboard({ market, totalTrends, approvedCount }: StatsDashboardProps) {
  // Only show Total Active Trends and Approved This Week
  const stats = [
    {
      label: 'Total Active Trends',
      value: totalTrends,
      icon: Database,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      label: 'Approved This Week',
      value: approvedCount,
      icon: Sparkles,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {stats.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <div key={index} className="bg-card border border-border rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">{stat.label}</span>
              <div className={`${stat.bgColor} p-2 rounded-lg`}>
                <Icon className={`size-5 ${stat.color}`} />
              </div>
            </div>
            <div className="text-2xl font-bold text-foreground">{stat.value}</div>
          </div>
        );
      })}
    </div>
  );
}