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
  // M7 fields
  occasions?: VenueOccasion[];
  dietaryBadges?: DietaryBadge[];
  dishes?: Dish[];
}

export interface Review {
  id: string;
  user: UserPublic;
  venue: string; // venue UUID (write-side)
  venueDetail?: Venue | null;
  rating: number;
  text: string;
  photoUrl: string;
  photoUrls: string[]; // all photos (primary + additional)
  dishName: string;
  tags: string[];
  likeCount: number;
  commentCount: number;
  isLiked: boolean;
  isBookmarked: boolean;
  recentComments: Comment[];
  createdAt: string;
  // M7 fields
  dish?: string; // dish UUID
  dishDetail?: Dish;
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

export interface TrendingVenue {
  id: string;
  name: string;
  cuisineType: string;
  locationText: string;
  rating: number;
  photoUrl: string;
  reviewsCount: number;
  trendingScore: number;
  reviewVelocity: number;
}

export interface TasteProfile {
  preferredCuisines: string[];
  dietaryRestrictions: string[];
  pricePreference: number;
  spiceTolerance: number;
  completedWizard: boolean;
  maturityLevel: number;
}

export interface FeedTier {
  tier: number;
  tierName: string;
}

export type PlaylistVisibility = 'public' | 'private' | 'followers';

export interface PlaylistItem {
  id: string;
  venue: string; // venue UUID
  venueDetail: Venue;
  caption: string;
  sortOrder: number;
  createdAt: string;
}

export interface ForkedFrom {
  id: string;
  title: string;
  owner: UserPublic;
}

export interface Playlist {
  id: string;
  owner: UserPublic;
  title: string;
  description?: string;
  visibility: PlaylistVisibility;
  itemsCount: number;
  saveCount: number;
  forkCount: number;
  items: PlaylistItem[];
  forkedFrom?: ForkedFrom | null;
  isSaved?: boolean;
  isOwner?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PlaylistSummary {
  id: string;
  owner: UserPublic;
  title: string;
  description?: string;
  visibility: PlaylistVisibility;
  itemsCount: number;
  saveCount: number;
  forkCount: number;
  forkedFrom?: ForkedFrom | null;
  isSaved?: boolean;
  isOwner?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SavedPlaylist {
  id: string;
  playlist: PlaylistSummary;
  createdAt: string;
}

export interface Notification {
  id: string;
  notificationType: string;
  priority: string;
  text: string;
  isRead: boolean;
  bundleCount: number;
  relatedObjectId?: string;
  extraData?: Record<string, unknown>;
  actor?: { id: string; name: string; avatarUrl: string };
  createdAt: string;
}

export interface NotificationPreference {
  likesEnabled: boolean;
  commentsEnabled: boolean;
  followsEnabled: boolean;
  mentionsEnabled: boolean;
  trendingEnabled: boolean;
  streaksEnabled: boolean;
  badgesEnabled: boolean;
  nudgesEnabled: boolean;
  digestEnabled: boolean;
  nearbyEnabled: boolean;
  socialFrequency: string;
  digestFrequency: string;
  pushEnabled: boolean;
  emailEnabled: boolean;
  smsEnabled: boolean;
  quietHoursEnabled: boolean;
  quietHoursStart: string;
  quietHoursEnd: string;
  timezone: string;
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
  user: { id?: string; name: string; avatarUrl: string; level?: number };
  rating: number;
  text: string;
  photoUrl: string;
  photoUrls: string[]; // all photos for multi-photo carousel
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

// ---------------------------------------------------------------------------
// M7: Enhanced Search & Discovery types
// ---------------------------------------------------------------------------

export interface Dish {
  id: string;
  name: string;
  category: string;
  avgRating: number;
  reviewCount: number;
  venue: string; // venue UUID
  venueDetail?: Venue;
}

export interface OccasionTag {
  slug: string;
  label: string;
  emoji: string;
  category: string;
}

export interface VenueOccasion {
  occasion: OccasionTag;
  voteCount: number;
  userVoted: boolean;
}

export interface DietaryBadge {
  category: string;
  confidence: number;
  isAvailable: boolean;
}

export interface FriendsVenue extends Venue {
  friendAvatars: { id: string; name: string; avatarUrl: string }[];
}

export interface SearchFilters {
  occasion?: string;
  dietary?: string[];
  lat?: number;
  lng?: number;
  radius?: number;
}

// ---------------------------------------------------------------------------
// M9/M10: Gamification types
// ---------------------------------------------------------------------------

export interface UserXP {
  totalXp: number;
  level: number;
  xpToNextLevel: number;
  levelProgress: number;
  xpInLevel: number;
}

export interface XPTransaction {
  id: string;
  reason: string;
  amount: number;
  description: string;
  createdAt: string;
}

export interface DiningStreak {
  currentStreak: number;
  longestStreak: number;
  streakFreezes: number;
  maxFreezes: number;
  lastActivityDate: string | null;
  flexibleMode: boolean;
}

export interface ActivityDay {
  date: string;
  level: number; // 0-4 intensity
}

export interface BadgeDefinition {
  id: string;
  slug: string;
  name: string;
  description: string;
  category: string;
  tier: string;
  iconUrl: string;
  requirementType: string;
  requirementValue: number;
  xpReward: number;
}

export interface UserBadge {
  id: string;
  badge: BadgeDefinition;
  progress: number;
  isUnlocked: boolean;
  unlockedAt: string | null;
  isDisplayed: boolean;
  progressPercent: number;
}

export interface LeaderboardEntry {
  rank: number;
  userId?: string;
  userName: string;
  userAvatar: string;
  userLevel: number;
  score: number;
  isSelf?: boolean;
}

export interface WrappedStats {
  year: number;
  totalReviews: number;
  totalVenues: number;
  totalPhotos: number;
  totalXp: number;
  levelsGained: number;
  badgesEarned: number;
  longestStreak: number;
  topCuisine: string;
  topVenue: string;
  topVenueVisits: number;
  totalLikesReceived: number;
  totalCommentsReceived: number;
  newFollowers: number;
  statsData: Record<string, unknown>;
  generatedAt: string;
}

export interface UserStats {
  totalReviews: number;
  totalVenues: number;
  totalPhotos: number;
  totalLikesGiven: number;
  totalLikesReceived: number;
  totalComments: number;
  avgRating: number;
  favoriteCuisine: string;
  reviewThisWeek: number;
  reviewThisMonth: number;
  lastRefreshed: string;
}
