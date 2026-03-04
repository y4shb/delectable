import api, { setAccessToken } from './client';
import type {
  User,
  Venue,
  Review,
  Playlist,
  PlaylistSummary,
  Notification,
  FeedReview,
  AutocompleteResult,
  Comment,
  CursorPaginatedResponse,
} from '../types';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function formatRelativeTime(isoDate: string): string {
  const now = Date.now();
  const date = new Date(isoDate).getTime();
  const diffMs = now - date;
  const diffMin = Math.floor(diffMs / 60_000);
  if (diffMin < 1) return 'just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 7) return `${diffDay}d ago`;
  const diffWeek = Math.floor(diffDay / 7);
  if (diffWeek < 5) return `${diffWeek}w ago`;
  const diffMonth = Math.floor(diffDay / 30);
  if (diffMonth < 12) return `${diffMonth}mo ago`;
  return `${Math.floor(diffDay / 365)}y ago`;
}

/** Transform a backend Review into the FeedReview shape expected by ReviewCard */
export function reviewToFeedReview(review: Review): FeedReview {
  return {
    id: review.id,
    venue: review.venueDetail?.name ?? '',
    location: review.venueDetail?.locationText ?? '',
    dish: review.dishName || undefined,
    tags: review.tags ?? [],
    user: {
      name: review.user.name,
      avatarUrl: review.user.avatarUrl,
      level: review.user.level,
    },
    rating: review.rating,
    text: review.text,
    photoUrl: review.photoUrl ?? '',
    date: formatRelativeTime(review.createdAt),
    likeCount: review.likeCount ?? 0,
    commentCount: review.commentCount ?? 0,
  };
}

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------
export async function loginUser(
  email: string,
  password: string,
): Promise<{ user: User; access: string }> {
  const { data } = await api.post('/auth/login/', { email, password });
  return data;
}

export async function registerUser(
  email: string,
  name: string,
  password: string,
  passwordConfirm: string,
): Promise<{ user: User; access: string }> {
  const { data } = await api.post('/auth/register/', {
    email,
    name,
    password,
    passwordConfirm,
  });
  return data;
}

export async function refreshToken(): Promise<{ access: string }> {
  const { data } = await api.post('/auth/refresh/');
  return data;
}

export async function logoutUser(): Promise<void> {
  await api.post('/auth/logout/');
  setAccessToken(null);
}

// ---------------------------------------------------------------------------
// Users
// ---------------------------------------------------------------------------
export async function fetchMe(): Promise<User> {
  const { data } = await api.get('/auth/me/');
  return data;
}

export async function updateMe(
  updates: Partial<Pick<User, 'name' | 'bio' | 'avatarUrl' | 'favoriteCuisines'>>,
): Promise<User> {
  const { data } = await api.patch('/auth/me/', updates);
  return data;
}

export async function fetchUser(id: string): Promise<User> {
  const { data } = await api.get(`/auth/users/${id}/`);
  return data;
}

export async function followUser(id: string): Promise<void> {
  await api.post(`/auth/users/${id}/follow/`);
}

export async function unfollowUser(id: string): Promise<void> {
  await api.delete(`/auth/users/${id}/follow/`);
}

// ---------------------------------------------------------------------------
// Venues
// ---------------------------------------------------------------------------
export async function fetchVenues(): Promise<Venue[]> {
  const { data } = await api.get('/venues/');
  return data.results ?? data;
}

export async function fetchVenueDetail(id: string): Promise<Venue> {
  const { data } = await api.get(`/venues/${id}/`);
  return data;
}

// ---------------------------------------------------------------------------
// Reviews
// ---------------------------------------------------------------------------
export async function createReview(review: {
  venue: string;
  rating: number;
  text: string;
  photoUrl?: string;
  dishName?: string;
  tags?: string[];
}): Promise<Review> {
  const { data } = await api.post('/reviews/', review);
  return data;
}

export async function fetchReview(id: string): Promise<Review> {
  const { data } = await api.get(`/reviews/${id}/`);
  return data;
}

export async function likeReview(id: string): Promise<void> {
  await api.post(`/reviews/${id}/like/`);
}

export async function unlikeReview(id: string): Promise<void> {
  await api.delete(`/reviews/${id}/like/`);
}

export async function fetchVenueReviews(venueId: string): Promise<FeedReview[]> {
  const { data } = await api.get(`/venues/${venueId}/reviews/`);
  const reviews: Review[] = data.results ?? data;
  return reviews.map(reviewToFeedReview);
}

export async function fetchUserReviews(userId: string): Promise<FeedReview[]> {
  const { data } = await api.get(`/auth/users/${userId}/reviews/`);
  const reviews: Review[] = data.results ?? data;
  return reviews.map(reviewToFeedReview);
}

export async function fetchReviewComments(reviewId: string): Promise<Comment[]> {
  const { data } = await api.get(`/reviews/${reviewId}/comments/`);
  return data.results ?? data;
}

export async function createComment(
  reviewId: string,
  text: string,
): Promise<Comment> {
  const { data } = await api.post(`/reviews/${reviewId}/comments/`, { text });
  return data;
}

// ---------------------------------------------------------------------------
// Feed
// ---------------------------------------------------------------------------
export async function fetchFeedReviews(tab?: string): Promise<FeedReview[]> {
  const params: Record<string, string> = {};
  if (tab) params.tab = tab;
  const { data } = await api.get('/feed/', { params });
  const reviews: Review[] = data.results ?? data;
  return reviews.map(reviewToFeedReview);
}

// ---------------------------------------------------------------------------
// Playlists
// ---------------------------------------------------------------------------
export async function fetchPlaylists(): Promise<PlaylistSummary[]> {
  const { data } = await api.get('/playlists/');
  return data.results ?? data;
}

export async function fetchPlaylistDetail(id: string): Promise<Playlist> {
  const { data } = await api.get(`/playlists/${id}/`);
  return data;
}

export async function createPlaylist(playlist: {
  title: string;
  description?: string;
  isPublic?: boolean;
}): Promise<Playlist> {
  const { data } = await api.post('/playlists/', playlist);
  return data;
}

export async function addPlaylistItem(
  playlistId: string,
  venueId: string,
  caption?: string,
): Promise<void> {
  await api.post(`/playlists/${playlistId}/items/`, { venue: venueId, caption });
}

// ---------------------------------------------------------------------------
// Search
// ---------------------------------------------------------------------------
export async function searchAll(
  q: string,
  type: 'all' | 'venue' | 'user' | 'review' = 'all',
  limit = 20,
): Promise<{ venues?: Venue[]; users?: User[]; reviews?: Review[] }> {
  const { data } = await api.get('/search/', { params: { q, type, limit } });
  return data.data;
}

export async function searchAutocomplete(
  q: string,
  type: 'all' | 'venue' | 'user' = 'all',
): Promise<AutocompleteResult[]> {
  const { data } = await api.get('/search/autocomplete/', {
    params: { q, type },
  });
  return data.data;
}

// ---------------------------------------------------------------------------
// Notifications
// ---------------------------------------------------------------------------
export async function fetchNotifications(): Promise<
  CursorPaginatedResponse<Notification>
> {
  const { data } = await api.get('/notifications/');
  return data;
}

export async function markNotificationsRead(ids?: string[]): Promise<void> {
  if (ids) {
    await api.post('/notifications/mark-read/', { notificationIds: ids });
  } else {
    await api.post('/notifications/mark-read/', { all: true });
  }
}
