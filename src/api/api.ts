import api, { setAccessToken } from './client';
import type {
  User,
  Venue,
  Review,
  Playlist,
  PlaylistSummary,
  Notification,
  NotificationPreference,
  FeedReview,
  AutocompleteResult,
  Comment,
  Bookmark,
  TasteMatch,
  TrendingVenue,
  TasteProfile,
  FeedTier,
  CursorPaginatedResponse,
  Dish,
  OccasionTag,
  FriendsVenue,
  SearchFilters,
  UserXP,
  XPTransaction,
  DiningStreak,
  ActivityDay,
  BadgeDefinition,
  UserBadge,
  LeaderboardEntry,
  WrappedStats,
  UserStats,
} from '../types';

// ---------------------------------------------------------------------------
// File Upload
// ---------------------------------------------------------------------------
export async function uploadPhoto(file: File): Promise<string> {
  const formData = new FormData();
  formData.append('file', file);
  const { data } = await api.post('/uploads/', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return data.url;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
export function formatRelativeTime(isoDate: string): string {
  const now = Date.now();
  const date = new Date(isoDate).getTime();
  if (isNaN(date)) return '';
  const diffMs = now - date;
  if (diffMs < 0) return 'just now';
  const diffMin = Math.floor(diffMs / 60_000);
  if (diffMin < 1) return 'just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 7) return `${diffDay}d ago`;
  const diffWeek = Math.floor(diffDay / 7);
  if (diffWeek < 5) return `${diffWeek}w ago`;
  const diffMonth = Math.floor(diffDay / 30.44);
  if (diffMonth < 12) return `${diffMonth}mo ago`;
  return `${Math.floor(diffDay / 365)}y ago`;
}

/** Transform a backend Review into the FeedReview shape expected by ReviewCard */
export function reviewToFeedReview(review: Review): FeedReview {
  return {
    id: review.id,
    venue: review.venueDetail?.name ?? '',
    venueId: review.venueDetail?.id ?? review.venue,
    location: review.venueDetail?.locationText ?? '',
    dish: review.dishName || undefined,
    tags: review.tags ?? [],
    user: {
      name: review.user.name,
      avatarUrl: review.user.avatarUrl,
      level: review.user.level,
    },
    rating: Number(review.rating),
    text: review.text,
    photoUrl: review.photoUrl ?? '',
    date: formatRelativeTime(review.createdAt),
    likeCount: review.likeCount ?? 0,
    commentCount: review.commentCount ?? 0,
    isLiked: review.isLiked ?? false,
    isBookmarked: review.isBookmarked ?? false,
    recentComments: review.recentComments ?? [],
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
  return data.data ?? data.results ?? data;
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

export async function createQuickReview(review: {
  venue: string;
  rating: number;
  photoUrl: string;
  dishName?: string;
  text?: string;
  tags?: string[];
}): Promise<{ data: Review; isFirstReview: boolean }> {
  const { data } = await api.post('/reviews/quick/', review);
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
  const reviews: Review[] = data.data ?? data.results ?? data;
  return reviews.map(reviewToFeedReview);
}

export async function fetchUserReviews(userId: string): Promise<FeedReview[]> {
  const { data } = await api.get(`/auth/users/${userId}/reviews/`);
  const reviews: Review[] = data.data ?? data.results ?? data;
  return reviews.map(reviewToFeedReview);
}

export async function fetchReviewComments(reviewId: string): Promise<Comment[]> {
  const { data } = await api.get(`/reviews/${reviewId}/comments/`);
  return data.data ?? data.results ?? data;
}

export async function createComment(
  reviewId: string,
  text: string,
  parentId?: string,
): Promise<Comment> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const body: any = { text };
  if (parentId) body.parent = parentId;
  const { data } = await api.post(`/reviews/${reviewId}/comments/`, body);
  return data;
}

// ---------------------------------------------------------------------------
// Feed
// ---------------------------------------------------------------------------
export async function fetchFeedReviews(tab?: string): Promise<FeedReview[]> {
  const params: Record<string, string> = {};
  if (tab) params.tab = tab;
  const { data } = await api.get('/feed/', { params });
  const reviews: Review[] = data.data ?? data.results ?? data;
  return reviews.map(reviewToFeedReview);
}

// ---------------------------------------------------------------------------
// Playlists
// ---------------------------------------------------------------------------
export async function fetchPlaylists(): Promise<PlaylistSummary[]> {
  const { data } = await api.get('/playlists/');
  return data.data ?? data.results ?? data;
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
  type: 'all' | 'venue' | 'user' | 'review' | 'dish' = 'all',
  limit = 20,
  filters?: SearchFilters,
): Promise<{ venues?: Venue[]; users?: User[]; reviews?: Review[]; dishes?: Dish[] }> {
  const params: Record<string, string | number> = { q, type, limit };
  if (filters?.occasion) params.occasion = filters.occasion;
  if (filters?.dietary?.length) params.dietary = filters.dietary.join(',');
  if (filters?.lat != null) params.lat = filters.lat;
  if (filters?.lng != null) params.lng = filters.lng;
  if (filters?.radius != null) params.radius = filters.radius;
  const { data } = await api.get('/search/', { params });
  return data.data ?? data;
}

export async function searchAutocomplete(
  q: string,
  type: 'all' | 'venue' | 'user' = 'all',
): Promise<AutocompleteResult[]> {
  const { data } = await api.get('/search/autocomplete/', {
    params: { q, type },
  });
  return data.data ?? data;
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

// ---------------------------------------------------------------------------
// Bookmarks
// ---------------------------------------------------------------------------
export async function bookmarkReview(reviewId: string): Promise<void> {
  await api.post(`/reviews/${reviewId}/bookmark/`);
}

export async function unbookmarkReview(reviewId: string): Promise<void> {
  await api.delete(`/reviews/${reviewId}/bookmark/`);
}

export async function fetchBookmarks(): Promise<Bookmark[]> {
  const { data } = await api.get('/bookmarks/');
  return data.data ?? data.results ?? data;
}

// ---------------------------------------------------------------------------
// Social Graph
// ---------------------------------------------------------------------------
export async function fetchFollowers(userId: string): Promise<User[]> {
  const { data } = await api.get(`/auth/users/${userId}/followers/`);
  return data.data ?? data.results ?? data;
}

export async function fetchFollowing(userId: string): Promise<User[]> {
  const { data } = await api.get(`/auth/users/${userId}/following/`);
  return data.data ?? data.results ?? data;
}

export async function fetchSuggestedUsers(): Promise<User[]> {
  const { data } = await api.get('/auth/suggested-users/');
  return data.data ?? data.results ?? data;
}

// ---------------------------------------------------------------------------
// Taste Match
// ---------------------------------------------------------------------------
export async function fetchTasteMatch(userId: string): Promise<TasteMatch> {
  const { data } = await api.get(`/auth/users/${userId}/taste-match/`);
  return data;
}

// ---------------------------------------------------------------------------
// Feed Intelligence (M6)
// ---------------------------------------------------------------------------
export async function fetchTrendingVenues(): Promise<TrendingVenue[]> {
  const { data } = await api.get('/feed/trending/');
  return data.data ?? data.results ?? data;
}

export async function fetchTasteProfile(): Promise<TasteProfile> {
  const { data } = await api.get('/feed/taste-profile/');
  return data;
}

export async function updateTasteProfile(
  updates: Partial<TasteProfile>,
): Promise<TasteProfile> {
  const { data } = await api.put('/feed/taste-profile/', updates);
  return data;
}

export async function fetchFeedTier(): Promise<FeedTier> {
  const { data } = await api.get('/feed/tier/');
  return data;
}

// ---------------------------------------------------------------------------
// M7: Enhanced Search & Discovery
// ---------------------------------------------------------------------------

// Dishes
export async function fetchDishes(params?: {
  venue?: string;
  q?: string;
}): Promise<Dish[]> {
  const { data } = await api.get('/dishes/', { params });
  return data.data ?? data.results ?? data;
}

export async function fetchDishDetail(id: string): Promise<Dish> {
  const { data } = await api.get(`/dishes/${id}/`);
  return data;
}

// Occasions
export async function fetchOccasions(): Promise<OccasionTag[]> {
  const { data } = await api.get('/occasions/');
  return data.data ?? data.results ?? data;
}

export async function voteOccasion(
  venueId: string,
  slug: string,
): Promise<void> {
  await api.post(`/venues/${venueId}/occasions/${slug}/vote/`);
}

export async function unvoteOccasion(
  venueId: string,
  slug: string,
): Promise<void> {
  await api.delete(`/venues/${venueId}/occasions/${slug}/vote/`);
}

// Dietary
export async function reportDietary(
  venueId: string,
  report: { category: string; isAvailable: boolean; scope?: string; dish?: string },
): Promise<void> {
  await api.post(`/venues/${venueId}/dietary/`, report);
}

// Similar Venues
export async function fetchSimilarVenues(venueId: string): Promise<Venue[]> {
  const { data } = await api.get(`/venues/${venueId}/similar/`);
  return data.data ?? data.results ?? data;
}

// Friends Venues
export async function fetchFriendsVenues(): Promise<FriendsVenue[]> {
  const { data } = await api.get('/venues/friends/');
  return data.data ?? data.results ?? data;
}

// Nearby Saved Venues
export async function fetchNearbySavedVenues(
  lat: number,
  lng: number,
  radius = 500,
): Promise<Venue[]> {
  const { data } = await api.get('/venues/nearby-saved/', {
    params: { lat, lng, radius },
  });
  return data.data ?? data.results ?? data;
}

// ---------------------------------------------------------------------------
// M9: Enhanced Notifications
// ---------------------------------------------------------------------------

export async function fetchUnreadCount(): Promise<number> {
  const { data } = await api.get('/notifications/unread-count/');
  return data.unread_count ?? data.unreadCount ?? 0;
}

export async function fetchNotificationPreferences(): Promise<NotificationPreference> {
  const { data } = await api.get('/notifications/preferences/');
  return data;
}

export async function updateNotificationPreferences(
  prefs: Partial<NotificationPreference>,
): Promise<NotificationPreference> {
  const { data } = await api.put('/notifications/preferences/', prefs);
  return data;
}

export async function fetchDigestPreview(): Promise<{
  reviewsThisWeek: number;
  likesReceived: number;
  streakDays: number;
  badgeProgress: Array<{ name: string; progress: number; required: number; percent: number }>;
  trendingVenues: TrendingVenue[];
}> {
  const { data } = await api.get('/notifications/digest-preview/');
  return data;
}

// ---------------------------------------------------------------------------
// M10: Gamification & Retention
// ---------------------------------------------------------------------------

// XP & Level
export async function fetchUserXP(): Promise<UserXP> {
  const { data } = await api.get('/gamification/xp/');
  return data;
}

export async function fetchXPHistory(): Promise<XPTransaction[]> {
  const { data } = await api.get('/gamification/xp/history/');
  return data.data ?? data.results ?? data;
}

// Streaks
export async function fetchDiningStreak(): Promise<DiningStreak> {
  const { data } = await api.get('/gamification/streak/');
  return data;
}

export async function fetchActivityGrid(weeks = 52): Promise<ActivityDay[]> {
  const { data } = await api.get('/gamification/activity-grid/', {
    params: { weeks },
  });
  return data.data ?? data;
}

// Badges
export async function fetchBadgeDefinitions(): Promise<BadgeDefinition[]> {
  const { data } = await api.get('/gamification/badges/');
  return data.data ?? data.results ?? data;
}

export async function fetchUserBadges(): Promise<UserBadge[]> {
  const { data } = await api.get('/gamification/my-badges/');
  return data.data ?? data.results ?? data;
}

// Leaderboards
export async function fetchLeaderboard(
  type: 'global' | 'city' | 'friends' | 'cuisine' = 'global',
  period: 'weekly' | 'monthly' | 'all_time' = 'weekly',
  scope?: string,
): Promise<{ data: LeaderboardEntry[]; userRank: LeaderboardEntry | null }> {
  const params: Record<string, string> = { type, period };
  if (scope) params.scope = scope;
  const { data } = await api.get('/gamification/leaderboard/', { params });
  return data;
}

export async function fetchFriendsLeaderboard(
  period: 'weekly' | 'monthly' | 'all_time' = 'weekly',
): Promise<LeaderboardEntry[]> {
  const { data } = await api.get('/gamification/leaderboard/friends/', {
    params: { period },
  });
  return data.data ?? data;
}

// Wrapped / Year in Review
export async function fetchWrappedStats(year?: number): Promise<WrappedStats> {
  const params: Record<string, number> = {};
  if (year) params.year = year;
  const { data } = await api.get('/gamification/wrapped/', { params });
  return data;
}

// User Stats
export async function fetchUserStats(): Promise<UserStats> {
  const { data } = await api.get('/gamification/stats/');
  return data;
}
