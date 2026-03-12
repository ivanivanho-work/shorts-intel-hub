/**
 * API Service Layer for Shorts Intel Hub
 * Replace mock data with real backend calls
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

// ============================================================================
// TYPE DEFINITIONS
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
  viewsVolume?: string;
  viewsVelocity?: string;
  creationRate?: string;
  watchtimeVolume?: string;
  watchtimeVelocity?: string;
  
  // Backend fields
  createdAt?: string;
  updatedAt?: string;
  approvedBy?: string;
  approvedAt?: string;
  archivedAt?: string;
}

export interface ScoringWeights {
  viewsVolume: number;
  viewsVelocity: number;
  creationRate: number;
  watchtimeVolume: number;
  watchtimeVelocity: number;
  ageInWeeks: number;
}

export interface AgencyUploadData {
  topicName: string;
  description: string;
  targetDemo: string;
  referenceLink: string;
  source: string;
}

export interface TrendsResponse {
  trends: Trend[];
  lastUpdated: string;
  totalCount: number;
}

export interface ScoringSettingsResponse {
  weights: ScoringWeights;
  updatedAt: string;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get authentication token from storage
 * Adjust this based on your auth implementation
 */
function getAuthToken(): string {
  return localStorage.getItem('auth_token') || '';
}

/**
 * Generic fetch wrapper with error handling
 */
async function apiFetch<T>(
  endpoint: string, 
  options?: RequestInit
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `API Error: ${response.status}`);
    }

    return response.json();
  } catch (error) {
    console.error('API Fetch Error:', error);
    throw error;
  }
}

/**
 * Authenticated fetch wrapper
 */
async function authenticatedFetch<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  return apiFetch<T>(endpoint, {
    ...options,
    headers: {
      ...options?.headers,
      'Authorization': `Bearer ${getAuthToken()}`,
    },
  });
}

// ============================================================================
// TRENDS API
// ============================================================================

/**
 * Fetch trends with optional filtering
 */
export async function fetchTrends(params: {
  market: string;
  targetDemo?: string;
  source?: string;
  archived?: boolean;
}): Promise<TrendsResponse> {
  const queryParams = new URLSearchParams();
  queryParams.append('market', params.market);
  
  if (params.targetDemo && params.targetDemo !== 'All Demographics') {
    queryParams.append('targetDemo', params.targetDemo);
  }
  if (params.source && params.source !== 'All Sources') {
    queryParams.append('source', params.source);
  }
  if (params.archived) {
    queryParams.append('archived', 'true');
  }
  
  return authenticatedFetch<TrendsResponse>(
    `/trends?${queryParams.toString()}`
  );
}

/**
 * Approve a specific trend
 */
export async function approveTrend(trendId: string): Promise<{ success: boolean; trend: Trend }> {
  return authenticatedFetch(`/trends/${trendId}/approve`, {
    method: 'POST',
  });
}

/**
 * Get archived trends with date range
 */
export async function fetchArchivedTrends(params: {
  market: string;
  startDate?: string;
  endDate?: string;
  source?: string;
}): Promise<TrendsResponse> {
  const queryParams = new URLSearchParams();
  queryParams.append('market', params.market);
  
  if (params.startDate) queryParams.append('startDate', params.startDate);
  if (params.endDate) queryParams.append('endDate', params.endDate);
  if (params.source && params.source !== 'All Sources') {
    queryParams.append('source', params.source);
  }
  
  return authenticatedFetch<TrendsResponse>(
    `/trends/archive?${queryParams.toString()}`
  );
}

// ============================================================================
// SCORING SETTINGS API
// ============================================================================

/**
 * Get current scoring settings for a market
 */
export async function getScoringSettings(market?: string): Promise<ScoringSettingsResponse> {
  const queryParams = market ? `?market=${market}` : '';
  return authenticatedFetch<ScoringSettingsResponse>(
    `/scoring-settings${queryParams}`
  );
}

/**
 * Update scoring settings
 */
export async function updateScoringSettings(
  weights: ScoringWeights,
  market?: string
): Promise<{ success: boolean; weights: ScoringWeights }> {
  return authenticatedFetch(`/scoring-settings`, {
    method: 'POST',
    body: JSON.stringify({ weights, market }),
  });
}

// ============================================================================
// AGENCY UPLOAD API
// ============================================================================

/**
 * Submit agency upload data (no authentication required)
 */
export async function submitAgencyUpload(
  data: AgencyUploadData
): Promise<{ success: boolean; message: string; trendId?: string }> {
  return apiFetch(`/agency-upload`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

// ============================================================================
// STATISTICS API
// ============================================================================

/**
 * Get dashboard statistics
 */
export async function getDashboardStats(market: string): Promise<{
  totalActiveTrends: number;
  approvedThisWeek: number;
  lastUpdated: string;
}> {
  return authenticatedFetch(`/stats?market=${market}`);
}

// ============================================================================
// AUTHENTICATION (implement based on your auth system)
// ============================================================================

/**
 * Login user and store token
 */
export async function login(email: string, password: string): Promise<{ token: string; user: any }> {
  const response = await apiFetch<{ token: string; user: any }>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  
  // Store token
  localStorage.setItem('auth_token', response.token);
  
  return response;
}

/**
 * Logout user
 */
export function logout(): void {
  localStorage.removeItem('auth_token');
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated(): boolean {
  return !!getAuthToken();
}

// ============================================================================
// TOPIC MATCHING API
// ============================================================================

export interface ThreeTrackResponse {
  internalTrack: any[];
  centerTrack: any[];
  externalTrack: any[];
  lastRun: any;
  market: string;
}

export interface MatchingRunResponse {
  runId: string;
  status: string;
  market: string;
  internalTopicCount: number;
  externalTopicCount: number;
}

export interface MatchingStatsResponse {
  totalMatched: number;
  totalInternal: number;
  totalExternal: number;
  lastRunAt: string | null;
  avgConfidence: number;
  market: string;
}

/**
 * Trigger a topic matching run for a market
 */
export async function triggerMatchingRun(market: string): Promise<MatchingRunResponse> {
  return apiFetch<MatchingRunResponse>('/matching/run', {
    method: 'POST',
    body: JSON.stringify({ market }),
  });
}

/**
 * Get three-track results for a market
 */
export async function getThreeTrackResults(market: string): Promise<ThreeTrackResponse> {
  return authenticatedFetch<ThreeTrackResponse>(`/matching/results/${market}`);
}

/**
 * Get matching statistics for a market
 */
export async function getMatchingStats(market: string): Promise<MatchingStatsResponse> {
  return authenticatedFetch<MatchingStatsResponse>(`/matching/stats/${market}`);
}

/**
 * Get matching run history for a market
 */
export async function getMatchingRuns(market: string): Promise<{ runs: any[]; market: string }> {
  return authenticatedFetch<{ runs: any[]; market: string }>(`/matching/runs/${market}`);
}

/**
 * Get details for a single consolidated topic
 */
export async function getConsolidatedTopic(consolidatedId: string): Promise<any> {
  return authenticatedFetch<any>(`/matching/consolidated/${consolidatedId}`);
}

// ============================================================================
// RANKING API
// ============================================================================

export interface RankingRunResponse {
  success: boolean;
  market: string;
  internalRanked: number;
  externalRanked: number;
  matchedRanked: number;
}

/**
 * Trigger ranking for all three tracks in a market
 */
export async function triggerRankingRun(
  market: string,
  optionalBoosters?: { tools: boolean; geo: boolean }
): Promise<RankingRunResponse> {
  return apiFetch<RankingRunResponse>('/ranking/run', {
    method: 'POST',
    body: JSON.stringify({ market, optionalBoosters }),
  });
}

/**
 * Run Full Analysis: Topic Matching → Ranking (chained)
 * This is the one-click pipeline trigger
 */
export async function runFullAnalysis(
  market: string,
  optionalBoosters?: { tools: boolean; geo: boolean }
): Promise<{ matching: MatchingRunResponse; ranking: RankingRunResponse }> {
  // Step 1: Run topic matching
  const matching = await triggerMatchingRun(market);

  // Step 2: Wait briefly for matching to process (it runs async on backend)
  await new Promise(resolve => setTimeout(resolve, 3000));

  // Step 3: Run ranking on the results
  const ranking = await triggerRankingRun(market, optionalBoosters);

  return { matching, ranking };
}

// ============================================================================
// EXPORT ALL
// ============================================================================

export default {
  fetchTrends,
  approveTrend,
  fetchArchivedTrends,
  getScoringSettings,
  updateScoringSettings,
  submitAgencyUpload,
  getDashboardStats,
  login,
  logout,
  isAuthenticated,
  triggerMatchingRun,
  getThreeTrackResults,
  getMatchingStats,
  getMatchingRuns,
  getConsolidatedTopic,
  triggerRankingRun,
  runFullAnalysis,
};
