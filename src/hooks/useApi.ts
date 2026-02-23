import { useQuery } from '@tanstack/react-query';
import {
  fetchUser,
  fetchReviews,
  fetchFeedReviews,
  fetchPlaylists,
  fetchPlaylistDetail,
  fetchVenues,
  fetchVenueDetail,
  fetchVenueReviews,
} from '../api/mockApi';

export function useUser(id?: string) {
  return useQuery({
    queryKey: ['user', id],
    queryFn: () => fetchUser(id),
  });
}

export function useReviews(filters?: { minRating?: number; tags?: string[] }) {
  return useQuery({
    queryKey: ['reviews', filters],
    queryFn: () => fetchReviews(filters),
  });
}

export function useFeedReviews(tab?: string) {
  return useQuery({
    queryKey: ['feedReviews', tab],
    queryFn: () => fetchFeedReviews(tab),
  });
}

export function usePlaylists(userId?: string) {
  return useQuery({
    queryKey: ['playlists', userId],
    queryFn: () => fetchPlaylists(userId),
  });
}

export function usePlaylistDetail(id: string) {
  return useQuery({
    queryKey: ['playlistDetail', id],
    queryFn: () => fetchPlaylistDetail(id),
    enabled: !!id,
  });
}

export function useVenues(filters?: { bounds?: any; cuisine?: string }) {
  return useQuery({
    queryKey: ['venues', filters],
    queryFn: () => fetchVenues(filters),
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
