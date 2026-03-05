import { useQuery } from '@tanstack/react-query';
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
} from '../api/api';
import type { SearchFilters } from '../types';

export function useUser(id?: string) {
  const hasValidId = id !== undefined && id !== '';
  return useQuery({
    queryKey: hasValidId ? ['user', id] : ['me'],
    queryFn: () => (hasValidId ? fetchUserApi(id) : fetchMe()),
    enabled: id === undefined || id !== '', // Disable for empty string
  });
}

export function useFeedReviews(tab?: string) {
  return useQuery({
    queryKey: ['feedReviews', tab],
    queryFn: () => fetchFeedReviews(tab),
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
  });
}

export function useBookmarks() {
  return useQuery({
    queryKey: ['bookmarks'],
    queryFn: () => fetchBookmarks(),
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
