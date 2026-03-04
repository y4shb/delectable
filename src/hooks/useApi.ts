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
  searchAll,
} from '../api/api';

export function useUser(id?: string) {
  return useQuery({
    queryKey: ['user', id],
    queryFn: () => (id ? fetchUserApi(id) : fetchMe()),
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

export function useSearch(
  q: string,
  type: 'all' | 'venue' | 'user' | 'review' = 'all',
) {
  return useQuery({
    queryKey: ['search', q, type],
    queryFn: () => searchAll(q, type),
    enabled: q.length >= 1,
  });
}
