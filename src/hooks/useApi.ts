import { useMutation, useQuery } from '@tanstack/react-query';
import {
  fetchMe,
  fetchUser as fetchUserApi,
  fetchFeedReviews,
  fetchUserReviews,
  fetchReview,
  fetchReviewComments,
  fetchPlaylists,
  fetchPlaylistDetail,
  fetchVenues,
  fetchVenueDetail,
  fetchVenueReviews,
  fetchNotifications,
  fetchBookmarks,
  fetchFollowers,
  fetchFollowing,
  fetchSuggestedUsers,
  fetchTasteMatch,
  fetchTrendingVenues,
  fetchTasteProfile,
  fetchFeedTier,
  searchAll,
  fetchDishes,
  fetchDishDetail,
  fetchOccasions,
  fetchSimilarVenues,
  fetchFriendsVenues,
  fetchSavedPlaylists,
  fetchUserPlaylists,
  discoverVenues,
  fetchWantToTry,
  fetchChallenges,
  fetchChallengeDetail,
  fetchChallengeLeaderboard,
  fetchDinnerPlans,
  fetchDinnerPlanDetail,
  fetchDinnerPlanResult,
  fetchPersonalRankings,
  fetchNextComparison,
  submitComparison,
  fetchMonthlyRecap,
  fetchSeasonalHighlights,
  fetchWeatherRecommendations,
  fetchKitchenStories,
  fetchKitchenStoryDetail,
  fetchFoodGuides,
  fetchFoodGuideDetail,
} from '../api/api';
import type { DiscoverRequest, SearchFilters } from '../types';

export function useUser(id?: string) {
  const hasValidId = id !== undefined && id !== '';
  return useQuery({
    queryKey: hasValidId ? ['user', id] : ['me'],
    queryFn: () => (hasValidId ? fetchUserApi(id) : fetchMe()),
    enabled: id === undefined || id !== '', // Disable for empty string
  });
}

export function useFeedReviews(tab?: string) {
  const staleTime =
    tab === 'recent'
      ? 30 * 1000
      : tab === 'top-picks'
        ? 2 * 60 * 1000
        : tab === 'explore'
          ? 5 * 60 * 1000
          : 30 * 1000; // default to shortest
  return useQuery({
    queryKey: ['feedReviews', tab],
    queryFn: () => fetchFeedReviews(tab),
    staleTime,
  });
}

export function useUserReviews(userId?: string) {
  return useQuery({
    queryKey: ['userReviews', userId],
    queryFn: () => fetchUserReviews(userId!),
    enabled: !!userId,
  });
}

export function useReviewDetail(id?: string) {
  return useQuery({
    queryKey: ['reviewDetail', id],
    queryFn: () => fetchReview(id!),
    enabled: !!id,
  });
}

export function useReviewComments(reviewId?: string) {
  return useQuery({
    queryKey: ['reviewComments', reviewId],
    queryFn: () => fetchReviewComments(reviewId!),
    enabled: !!reviewId,
  });
}

export function usePlaylists() {
  return useQuery({
    queryKey: ['playlists'],
    queryFn: () => fetchPlaylists(),
    staleTime: 5 * 60 * 1000,
  });
}

export function usePlaylistDetail(id: string) {
  return useQuery({
    queryKey: ['playlistDetail', id],
    queryFn: () => fetchPlaylistDetail(id),
    enabled: !!id,
  });
}

export function useVenues() {
  return useQuery({
    queryKey: ['venues'],
    queryFn: () => fetchVenues(),
    staleTime: 10 * 60 * 1000,
  });
}

export function useVenueDetail(id: string) {
  return useQuery({
    queryKey: ['venueDetail', id],
    queryFn: () => fetchVenueDetail(id),
    enabled: !!id,
  });
}

export function useVenueReviews(venueId?: string) {
  return useQuery({
    queryKey: ['venueReviews', venueId],
    queryFn: () => fetchVenueReviews(venueId!),
    enabled: !!venueId,
  });
}

export function useNotifications() {
  return useQuery({
    queryKey: ['notifications'],
    queryFn: () => fetchNotifications(),
    staleTime: 30 * 1000,
  });
}

export function useBookmarks() {
  return useQuery({
    queryKey: ['bookmarks'],
    queryFn: () => fetchBookmarks(),
    staleTime: 2 * 60 * 1000,
  });
}

export function useFollowers(userId?: string) {
  return useQuery({
    queryKey: ['followers', userId],
    queryFn: () => fetchFollowers(userId!),
    enabled: !!userId,
  });
}

export function useFollowing(userId?: string) {
  return useQuery({
    queryKey: ['following', userId],
    queryFn: () => fetchFollowing(userId!),
    enabled: !!userId,
  });
}

export function useSuggestedUsers() {
  return useQuery({
    queryKey: ['suggestedUsers'],
    queryFn: () => fetchSuggestedUsers(),
  });
}

export function useTasteMatch(userId?: string) {
  return useQuery({
    queryKey: ['tasteMatch', userId],
    queryFn: () => fetchTasteMatch(userId!),
    enabled: !!userId,
  });
}

export function useTrendingVenues() {
  return useQuery({
    queryKey: ['trendingVenues'],
    queryFn: () => fetchTrendingVenues(),
    staleTime: 2 * 60 * 1000,
  });
}

export function useTasteProfile() {
  return useQuery({
    queryKey: ['tasteProfile'],
    queryFn: () => fetchTasteProfile(),
    staleTime: 5 * 60 * 1000,
  });
}

export function useFeedTier() {
  return useQuery({
    queryKey: ['feedTier'],
    queryFn: () => fetchFeedTier(),
    staleTime: 10 * 60 * 1000,
  });
}

export function useSearch(
  q: string,
  type: 'all' | 'venue' | 'user' | 'review' | 'dish' = 'all',
  filters?: SearchFilters,
) {
  return useQuery({
    queryKey: ['search', q, type, filters],
    queryFn: () => searchAll(q, type, 20, filters),
    enabled: q.length >= 2,
    staleTime: 60 * 1000,
  });
}

// ---------------------------------------------------------------------------
// M7: Enhanced Search & Discovery
// ---------------------------------------------------------------------------

export function useDishes(params?: { venue?: string; q?: string }) {
  return useQuery({
    queryKey: ['dishes', params],
    queryFn: () => fetchDishes(params),
    enabled: params !== undefined && (!!params.venue || !!params.q),
  });
}

export function useDishDetail(id?: string) {
  return useQuery({
    queryKey: ['dishDetail', id],
    queryFn: () => fetchDishDetail(id!),
    enabled: !!id,
  });
}

export function useOccasions() {
  return useQuery({
    queryKey: ['occasions'],
    queryFn: () => fetchOccasions(),
    staleTime: 60 * 60 * 1000, // 1 hour
  });
}

export function useSimilarVenues(venueId?: string) {
  return useQuery({
    queryKey: ['similarVenues', venueId],
    queryFn: () => fetchSimilarVenues(venueId!),
    enabled: !!venueId,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

export function useFriendsVenues() {
  return useQuery({
    queryKey: ['friendsVenues'],
    queryFn: () => fetchFriendsVenues(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// ---------------------------------------------------------------------------
// Playlist Save/Fork
// ---------------------------------------------------------------------------

export function useSavedPlaylists() {
  return useQuery({
    queryKey: ['savedPlaylists'],
    queryFn: () => fetchSavedPlaylists(),
    staleTime: 5 * 60 * 1000,
  });
}

export function useUserPlaylists(userId?: string) {
  return useQuery({
    queryKey: ['userPlaylists', userId],
    queryFn: () => fetchUserPlaylists(userId!),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
  });
}

// ---------------------------------------------------------------------------
// Decision Engine — "What Should I Eat?"
// ---------------------------------------------------------------------------

export function useDiscoverVenues() {
  return useMutation({
    mutationKey: ['discoverVenues'],
    mutationFn: (params: DiscoverRequest) => discoverVenues(params),
  });
}

// ---------------------------------------------------------------------------
// Want to Try
// ---------------------------------------------------------------------------

export function useWantToTry() {
  return useQuery({
    queryKey: ['wantToTry'],
    queryFn: () => fetchWantToTry(),
    staleTime: 2 * 60 * 1000,
  });
}

// ---------------------------------------------------------------------------
// Challenges
// ---------------------------------------------------------------------------

export function useChallenges() {
  return useQuery({
    queryKey: ['challenges'],
    queryFn: () => fetchChallenges(),
    staleTime: 2 * 60 * 1000,
  });
}

export function useChallengeDetail(id?: string) {
  return useQuery({
    queryKey: ['challengeDetail', id],
    queryFn: () => fetchChallengeDetail(id!),
    enabled: !!id,
  });
}

export function useChallengeLeaderboard(id?: string) {
  return useQuery({
    queryKey: ['challengeLeaderboard', id],
    queryFn: () => fetchChallengeLeaderboard(id!),
    enabled: !!id,
    staleTime: 60 * 1000,
  });
}

// ---------------------------------------------------------------------------
// Group Dining Consensus (Dinner Plans)
// ---------------------------------------------------------------------------

export function useDinnerPlans() {
  return useQuery({
    queryKey: ['dinnerPlans'],
    queryFn: () => fetchDinnerPlans(),
    staleTime: 2 * 60 * 1000,
  });
}

export function useDinnerPlanDetail(id?: string) {
  return useQuery({
    queryKey: ['dinnerPlanDetail', id],
    queryFn: () => fetchDinnerPlanDetail(id!),
    enabled: !!id,
  });
}

export function useDinnerPlanResult(id?: string) {
  return useQuery({
    queryKey: ['dinnerPlanResult', id],
    queryFn: () => fetchDinnerPlanResult(id!),
    enabled: !!id,
  });
}

// ---------------------------------------------------------------------------
// Elo-style Personal Rankings
// ---------------------------------------------------------------------------

export function usePersonalRankings(full = false, limit = 10) {
  return useQuery({
    queryKey: ['personalRankings', full, limit],
    queryFn: () => fetchPersonalRankings(full, limit),
    staleTime: 2 * 60 * 1000,
  });
}

export function useNextComparison(venueId?: string) {
  return useQuery({
    queryKey: ['nextComparison', venueId],
    queryFn: () => fetchNextComparison(venueId),
    staleTime: 0, // Always fetch fresh pairs
    retry: false,
  });
}

export function useSubmitComparison() {
  return useMutation({
    mutationFn: ({
      venueA,
      venueB,
      winner,
    }: {
      venueA: string;
      venueB: string;
      winner: string | null;
    }) => submitComparison(venueA, venueB, winner),
  });
}

// ---------------------------------------------------------------------------
// Monthly Recap
// ---------------------------------------------------------------------------

export function useMonthlyRecap(year?: number, month?: number) {
  return useQuery({
    queryKey: ['monthlyRecap', year, month],
    queryFn: () => fetchMonthlyRecap(year, month),
    staleTime: 10 * 60 * 1000,
    retry: false,
  });
}

// ---------------------------------------------------------------------------
// Seasonal Discovery
// ---------------------------------------------------------------------------

export function useSeasonalHighlights(season?: string) {
  return useQuery({
    queryKey: ['seasonalHighlights', season],
    queryFn: () => fetchSeasonalHighlights(season),
    staleTime: 30 * 60 * 1000, // 30 minutes
  });
}

export function useWeatherRecommendations(condition: string) {
  return useQuery({
    queryKey: ['weatherRecs', condition],
    queryFn: () => fetchWeatherRecommendations(condition),
    staleTime: 15 * 60 * 1000, // 15 minutes
    enabled: !!condition,
  });
}

// ---------------------------------------------------------------------------
// Kitchen Stories
// ---------------------------------------------------------------------------

export function useKitchenStories(params?: { venue?: string; storyType?: string }) {
  return useQuery({
    queryKey: ['kitchenStories', params],
    queryFn: () => fetchKitchenStories(params),
    staleTime: 5 * 60 * 1000,
  });
}

export function useKitchenStoryDetail(id?: string) {
  return useQuery({
    queryKey: ['kitchenStoryDetail', id],
    queryFn: () => fetchKitchenStoryDetail(id!),
    enabled: !!id,
  });
}

// ---------------------------------------------------------------------------
// Food Tourism Guides
// ---------------------------------------------------------------------------

export function useFoodGuides(params?: { city?: string }) {
  return useQuery({
    queryKey: ['foodGuides', params],
    queryFn: () => fetchFoodGuides(params),
    staleTime: 10 * 60 * 1000,
  });
}

export function useFoodGuideDetail(id?: string) {
  return useQuery({
    queryKey: ['foodGuideDetail', id],
    queryFn: () => fetchFoodGuideDetail(id!),
    enabled: !!id,
  });
}
