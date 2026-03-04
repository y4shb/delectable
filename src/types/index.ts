// Shared TypeScript types for Delectable
// These types match the backend API response shapes (camelCase-transformed).

export interface User {
  id: string;
  email?: string;
  name: string;
  avatarUrl: string;
  bio?: string;
  level: number;
  followersCount: number;
  followingCount: number;
  favoriteCuisines?: string[];
  isFollowing?: boolean;
  isFollowedBy?: boolean;
  createdAt?: string;
}

export interface UserPublic {
  id: string;
  name: string;
  avatarUrl: string;
  level: number;
}

export interface Venue {
  id: string;
  name: string;
  cuisineType: string;
  locationText: string;
  rating: number;
  photoUrl: string;
  tags: string[];
  latitude: number;
  longitude: number;
  reviewsCount: number;
  // detail-only fields
  city?: string;
  googlePlaceId?: string;
  createdAt?: string;
}

export interface Review {
  id: string;
  user: UserPublic;
  venue: string; // venue UUID (write-side)
  venueDetail: Venue;
  rating: number;
  text: string;
  photoUrl: string;
  dishName: string;
  tags: string[];
  likeCount: number;
  commentCount: number;
  isLiked: boolean;
  isBookmarked: boolean;
  recentComments: Comment[];
  createdAt: string;
}

export interface Comment {
  id: string;
  user: UserPublic;
  parent?: string | null;
  text: string;
  replies?: Comment[];
  createdAt: string;
}

export interface Bookmark {
  id: string;
  review: string;
  reviewDetail: Review;
  createdAt: string;
}

export interface TasteMatch {
  score: number;
  sharedVenues: string[];
}

export interface PlaylistItem {
  id: string;
  venue: string; // venue UUID
  venueDetail: Venue;
  caption: string;
  sortOrder: number;
  createdAt: string;
}

export interface Playlist {
  id: string;
  owner: UserPublic;
  title: string;
  description?: string;
  isPublic: boolean;
  itemsCount: number;
  items: PlaylistItem[];
  createdAt: string;
  updatedAt: string;
}

export interface PlaylistSummary {
  id: string;
  owner: UserPublic;
  title: string;
  description?: string;
  isPublic: boolean;
  itemsCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface Notification {
  id: string;
  notificationType: string;
  text: string;
  isRead: boolean;
  relatedObjectId?: string;
  createdAt: string;
}

// ---------------------------------------------------------------------------
// Display types — shapes consumed by UI components
// ---------------------------------------------------------------------------

/** Shape consumed by ReviewCard component */
export interface FeedReview {
  id: string;
  venue: string; // venue name (display)
  venueId?: string; // venue UUID for linking
  location: string; // venue location text
  dish?: string;
  tags: string[];
  user: { name: string; avatarUrl: string; level?: number };
  rating: number;
  text: string;
  photoUrl: string;
  date: string; // relative time string (e.g. "2h ago")
  likeCount: number;
  commentCount: number;
  isLiked: boolean;
  isBookmarked: boolean;
  recentComments?: Comment[];
}

/** Search autocomplete result */
export interface AutocompleteResult {
  type: 'venue' | 'user';
  id: string;
  title: string;
  subtitle: string;
  imageUrl: string;
}

/** Cursor-paginated response (feed, notifications) */
export interface CursorPaginatedResponse<T> {
  results: T[];
  next: string | null;
  previous: string | null;
  meta?: { unreadCount?: number };
}
