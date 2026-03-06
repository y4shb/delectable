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

// ---------------------------------------------------------------------------
// Monthly Recap types
// ---------------------------------------------------------------------------

export interface MonthlyRecap {
  year: number;
  month: number;
  monthName: string;
  totalReviews: number;
  totalVenues: number;
  totalPhotos: number;
  newCuisinesTried: number;
  topCuisine: string;
  topVenueName: string;
  topRatedDish: string;
  longestStreakInMonth: number;
  xpEarned: number;
  likesReceived: number;
  statsData: Record<string, unknown>;
  generatedAt: string;
}

// ---------------------------------------------------------------------------
// Seasonal Discovery types
// ---------------------------------------------------------------------------

export interface SeasonalHighlight {
  id: string;
  venue: string;
  venueDetail: Venue;
  dishName: string;
  season: string;
  description: string;
  photoUrl: string;
  isActive: boolean;
  startDate: string;
  endDate: string;
  createdAt: string;
}

export interface WeatherRecommendation {
  condition: string;
  message: string;
  data: Venue[];
}

// ---------------------------------------------------------------------------
// Elo-style Personal Rankings
// ---------------------------------------------------------------------------

export interface PairwiseComparison {
  id: string;
  venueA: string;
  venueADetail: Venue;
  venueB: string;
  venueBDetail: Venue;
  winner: string | null;
  winnerDetail: Venue | null;
  createdAt: string;
}

export interface PersonalRanking {
  id: string;
  venue: string;
  venueDetail: Venue;
  eloScore: number;
  displayScore: number;
  comparisonCount: number;
  confidence: number;
  rank: number;
  updatedAt: string;
}

export interface RankingsResponse {
  data: PersonalRanking[];
  meta: {
    totalVenues: number;
    totalComparisons: number;
  };
}

export interface ComparisonPair {
  venueA: Venue;
  venueB: Venue;
}

export interface ComparisonResult {
  comparison: PairwiseComparison;
  updatedRankings: PersonalRanking[];
}

// ---------------------------------------------------------------------------
// Decision Engine — "What Should I Eat?" discovery types
// ---------------------------------------------------------------------------

export interface DiscoverRequest {
  occasion: string;
  distance?: 'walking' | 'short_drive' | 'worth_the_trip';
  dietary?: string[];
  cuisinePreference?: string;
  lat?: number;
  lng?: number;
}

export interface DiscoverResult {
  venue: Venue;
  score: number;
  explanation: string;
  matchReasons: string[];
  distanceKm: number | null;
}

export interface DiscoverResponse {
  picks: DiscoverResult[];
}

// ---------------------------------------------------------------------------
// Want to Try
// ---------------------------------------------------------------------------

export interface WantToTryItem {
  id: string;
  venue: string; // venue UUID
  venueDetail: Venue;
  note: string;
  createdAt: string;
}

// ---------------------------------------------------------------------------
// Challenges
// ---------------------------------------------------------------------------

export interface Challenge {
  id: string;
  title: string;
  description: string;
  rules: string;
  coverImageUrl: string;
  startDate: string;
  endDate: string;
  targetCount: number;
  cuisineFilter: string;
  tagFilter: string;
  xpReward: number;
  badgeSlug: string;
  status: string;
  participantCount: number;
  isParticipating: boolean;
  userProgress: {
    progress: number;
    completed: boolean;
    target: number;
  } | null;
  createdAt: string;
}

export interface ChallengeParticipant {
  id: string;
  userName: string;
  userAvatar: string;
  userLevel: number;
  progress: number;
  completed: boolean;
  joinedAt: string;
}

// ---------------------------------------------------------------------------
// Group Dining Consensus (Dinner Plans)
// ---------------------------------------------------------------------------

export interface DinnerPlanMember {
  id: string;
  user: UserPublic;
  role: 'host' | 'member';
  hasVoted: boolean;
  joinedAt: string;
}

export interface DinnerPlanVenue {
  id: string;
  venue: string; // venue UUID
  venueDetail: Venue;
  totalYes: number;
  totalNo: number;
  sortOrder: number;
}

export interface DinnerPlanVote {
  venueId: string;
  vote: 'yes' | 'no' | 'skip';
}

export interface DinnerPlan {
  id: string;
  creator: UserPublic;
  title: string;
  description: string;
  status: 'planning' | 'voting' | 'decided' | 'cancelled';
  shareCode: string;
  selectedVenue: string | null;
  selectedVenueDetail: Venue | null;
  voteDeadline: string | null;
  suggestedDate: string | null;
  suggestedTime: string | null;
  maxVenues: number;
  cuisineFilter: string;
  members: DinnerPlanMember[];
  venueOptions: DinnerPlanVenue[];
  totalMembers: number;
  votedCount: number;
  hasUserVoted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface DinnerPlanResult {
  planId: string;
  title: string;
  status: string;
  totalMembers: number;
  votedCount: number;
  allVoted: boolean;
  winner: {
    venueOptionId: string;
    venue: Venue;
    totalYes: number;
    totalNo: number;
    sortOrder: number;
  } | null;
  venueResults: Array<{
    venueOptionId: string;
    venue: Venue;
    totalYes: number;
    totalNo: number;
    sortOrder: number;
  }>;
  suggestedDate: string | null;
  suggestedTime: string | null;
}
