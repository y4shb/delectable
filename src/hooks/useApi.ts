import { useQuery } from '@tanstack/react-query';
import {
  fetchMe,
  fetchUser as fetchUserApi,
  fetchFeedReviews,
  fetchUserReviews,
  fetchPlaylists,
  fetchPlaylistDetail,
  fetchVenues,
  fetchVenueDetail,
  fetchVenueReviews,
  fetchNotifications,
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

export function useVenueReviews(venueId: string) {
  return useQuery({
    queryKey: ['venueReviews', venueId],
    queryFn: () => fetchVenueReviews(venueId),
    enabled: !!venueId,
  });
}

export function useNotifications() {
  return useQuery({
    queryKey: ['notifications'],
    queryFn: () => fetchNotifications(),
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
