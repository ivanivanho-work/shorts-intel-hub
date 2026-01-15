/**
 * Shared Type Definitions for Shorts Intel Hub
 * Export this file to your backend team for consistency
 */

// ============================================================================
// TREND TYPES
// ============================================================================

export interface Trend {
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
  
  // Backend metadata
  createdAt?: string;
  updatedAt?: string;
  approvedBy?: string;
  approvedAt?: string;
  archivedAt?: string;
  geminiProcessedAt?: string;
}

export type TrendSource = 'Search' | 'Nyan Cat' | 'Agency' | 'Music';
export type TrendVelocity = 'increasing' | 'stable' | 'decreasing';

// ============================================================================
// MARKET TYPES
// ============================================================================

export interface Market {
  code: string;
  name: string;
}

export const APAC_MARKETS: Market[] = [
  { code: 'JP', name: 'Japan' },
  { code: 'KR', name: 'South Korea' },
  { code: 'IN', name: 'India' },
  { code: 'ID', name: 'Indonesia' },
  { code: 'AUNZ', name: 'Australia & New Zealand' },
];

// ============================================================================
// DEMOGRAPHIC TYPES
// ============================================================================

export type Gender = 'Males' | 'Females' | 'All';
export type AgeRange = '13-17' | '18-24' | '25-34' | '35-44' | '45+';

export type TargetDemo = 
  | 'All Demographics'
  | 'Males 13-17'
  | 'Males 18-24'
  | 'Males 25-34'
  | 'Males 35-44'
  | 'Males 45+'
  | 'Females 13-17'
  | 'Females 18-24'
  | 'Females 25-34'
  | 'Females 35-44'
  | 'Females 45+';

// ============================================================================
// SCORING TYPES
// ============================================================================

export interface ScoringWeights {
  viewsVolume: number;
  viewsVelocity: number;
  creationRate: number;
  watchtimeVolume: number;
  watchtimeVelocity: number;
  ageInWeeks: number;
}

export const DEFAULT_SCORING_WEIGHTS: ScoringWeights = {
  viewsVolume: 0.25,
  viewsVelocity: 0.20,
  creationRate: 0.15,
  watchtimeVolume: 0.25,
  watchtimeVelocity: 0.10,
  ageInWeeks: 0.05,
};

// ============================================================================
// AGENCY UPLOAD TYPES
// ============================================================================

export interface AgencyUploadData {
  topicName: string;
  description: string;
  targetDemo: string;
  referenceLink: string;
  source: string;
}

export interface AgencyUploadResponse {
  success: boolean;
  message: string;
  trendId?: string;
}

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

export interface TrendsResponse {
  trends: Trend[];
  lastUpdated: string;
  totalCount: number;
}

export interface ScoringSettingsResponse {
  weights: ScoringWeights;
  updatedAt: string;
  market?: string;
}

export interface DashboardStatsResponse {
  totalActiveTrends: number;
  approvedThisWeek: number;
  lastUpdated: string;
}

export interface ApiError {
  error: string;
  message: string;
  statusCode: number;
}

// ============================================================================
// USER & AUTH TYPES
// ============================================================================

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'country_manager' | 'viewer';
  markets: string[]; // Market codes they have access to
}

export interface AuthResponse {
  token: string;
  user: User;
  expiresAt: string;
}

// ============================================================================
// FILTER TYPES
// ============================================================================

export interface TrendFilters {
  market: string;
  targetDemo?: TargetDemo;
  source?: TrendSource | 'All Sources';
  archived?: boolean;
  startDate?: string;
  endDate?: string;
}

// ============================================================================
// VIEW STATE TYPES
// ============================================================================

export type TabView = 'summary' | 'deepdive' | 'scoring' | 'archive';
export type AppView = 'dashboard' | 'upload';

// ============================================================================
// ARCHIVE TYPES
// ============================================================================

export interface ArchiveFilters {
  market: string;
  startDate?: Date;
  endDate?: Date;
  source?: TrendSource | 'All Sources';
}

// ============================================================================
// CONSTANTS
// ============================================================================

export const TREND_SOURCES: TrendSource[] = ['Search', 'Nyan Cat', 'Agency', 'Music'];

export const TARGET_DEMOS: TargetDemo[] = [
  'All Demographics',
  'Males 13-17',
  'Males 18-24',
  'Males 25-34',
  'Males 35-44',
  'Males 45+',
  'Females 13-17',
  'Females 18-24',
  'Females 25-34',
  'Females 35-44',
  'Females 45+',
];

export const VELOCITY_ICONS = {
  increasing: '↗',
  stable: '→',
  decreasing: '↘',
} as const;

export const VELOCITY_COLORS = {
  increasing: 'text-green-600',
  stable: 'text-muted-foreground',
  decreasing: 'text-orange-600',
} as const;

export const SOURCE_COLORS = {
  Search: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  'Nyan Cat': 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  Agency: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  Music: 'bg-pink-500/20 text-pink-400 border-pink-500/30',
} as const;
