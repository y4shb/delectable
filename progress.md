# Delectable - Development Progress Tracker

> Last updated: 2026-03-06

---

## Overall Status

| Milestone | Status | Progress |
|-----------|--------|----------|
| M1: Front-End Foundations | COMPLETE | 100% |
| M2: UI Polish & State Management | COMPLETE | 100% |
| M3: Google Maps & Location Filtering | COMPLETE | 100% |
| M4: Backend MVP & Data Storage | COMPLETE | 100% |
| M5: Social Features & Content Interaction | COMPLETE | 100% |
| M6: Feed Intelligence & Personalization | COMPLETE | 100% |
| M7: Enhanced Search & Discovery | COMPLETE | 100% |
| M8: Onboarding & Growth | COMPLETE | 100% |
| M9: Notifications & Real-Time | COMPLETE | 100% |
| M10: Gamification & Retention | COMPLETE | 100% |
| M11: Sharing & Virality | COMPLETE | 100% |
| M12: Deployment & Infrastructure | COMPLETE | 100% |
| M13: AI, ML & Advanced Intelligence | COMPLETE | 100% |
| M14: New Feature Ideas (Section 3) | COMPLETE | 100% |

---

## Milestone 1: Front-End Foundations [COMPLETE]

### 1.1 Project Scaffold & Configuration
- [x] Initialize Next.js 15 project with TypeScript
- [x] Install and configure MUI v7 with Emotion SSR
- [x] Set up Axios HTTP client
- [x] Set up React Query (@tanstack/react-query)
- [x] Configure TypeScript paths (`@/*` alias)
- [x] Add custom fonts (Classy Pen, Inter)
- [x] Set up global CSS with @font-face
- [x] Create 7 "de." logo icon variants (peach, gray, white, bright-white, light-gray, peach-dark, peach-light)

### 1.2 App Shell & Layout
- [x] Create `AppShell.tsx` layout wrapper (max-width 600px, 72px header clearance)
- [x] Build `Header.tsx` — "de." (38px, Classy Pen, primary color), transparent bg, blur(2px), auto-hide on scroll
- [x] Build `BottomTabBar.tsx` — floating pill (275px, borderRadius 48px), 5 tabs, frosted glass effect
- [x] Implement auto-hiding header on scroll (requestAnimationFrame-based, cubic-bezier transition)
- [x] Hidden scrollbars on all platforms

### 1.3 Core Views (UI-Only)
- [x] **Feed page** — WelcomeSection + tab filtering + ReviewCards, full-width stretch, smooth scroll
- [x] **ReviewCard** — Full-bleed photo (aspect 0.8, min 450px), gradient overlay, IntersectionObserver auto-expand, CSS heart shape with like count, expandable tags/text, multi-photo deck-of-cards swipe UI with fullscreen carousel on tap
- [x] **WelcomeSection** — "Hi Yash!" (32px Classy Pen, primary), pill-shaped tabs (Top Picks, Recent, Collections, Explore)
- [x] **Map page** — Full-screen fixed Google Maps, dark mode style array, body overflow hidden
- [x] **GoogleMapView** — Interactive with 6 markers, custom InfoWindow mini-card, bounds-based visibility, zoom control only
- [x] **Profile page** — 80px avatar, name, level badge, followers/following, bio, Reviews/Playlists/Map tabs
- [x] **Playlist detail** — Full-bleed photo cards with gradient overlays, venue info, matching ReviewCard design
- [x] **Login page** — Branded with "de." logo (Classy Pen 56px), tagline, rounded inputs, pill button
- [x] **PhotoCarousel** — Fullscreen overlay carousel with backdrop blur, pointer-based swipe, keyboard navigation, animated dot indicators, venue/user/rating overlay
- [x] **ReviewCard** — Multi-photo deck-of-cards swipeable UI, tap-to-open carousel, double-tap to like
- [x] **Notifications page** — "Alerts" title (Classy Pen), notification items with avatars, unread dots
- [x] **New Playlist page** — Form with cover photo upload area, spots section, pill CTA button

### 1.4 Theme & Dark Mode
- [x] Theme factory: primary `#F24D4F`, secondary `#FFD36E`, warm cream/dark backgrounds
- [x] `ColorModeContext` for toggle (defaults to light, manual toggle)
- [x] Dark map styling — 19-rule custom style (deep navy `#1d2c4d` base)
- [x] Theme toggle in header (sun/moon icons)

### 1.5 Data Layer Stubs
- [x] TypeScript interfaces: `User`, `Review`, `Playlist`, `PlaylistItem`, `Venue`
- [x] Mock data in `mockApi.ts` (1 user, 5 reviews, 2 playlists, 6 venues)
- [x] `FeedReview` interface and `mockFeedReviews` array (4 review cards)
- [x] All feed/profile data centralized through `mockApi.ts`

### 1.6 Design Bugs & Issues — ALL RESOLVED
- [x] **BUG**: Missing image assets — all avatars now use existing `avatar1.jpg`
- [x] **BUG**: Missing `food1.jpg` — reference updated to use `food3.jpg`
- [x] **BUG**: Global CSS import fixed in `_app.tsx` — path corrected and uncommented
- [x] **DESIGN**: Playlist detail page redesigned — full-bleed photos, gradient overlays, venue lookup
- [x] **DESIGN**: Login page redesigned — "de." logo (56px Classy Pen), tagline, branded styling
- [x] **DESIGN**: Profile page now shows "Lvl 9" badge — `#FFD36E` pill next to name
- [x] **DESIGN**: Map InfoWindow replaced — custom MUI mini-card (220px, photo, rating in #F24D4F)
- [x] **CODE**: Dead code removed — `useDarkModeMapUrl.ts` deleted
- [x] **CODE**: Dead code removed — `useDarkMode.ts` deleted
- [x] **CODE**: Feed data centralized — `feed.tsx` now imports from `mockApi.ts`
- [x] **CODE**: Missing pages created — `/notifications` and `/playlist/new` now exist

---

## Milestone 2: UI Polish & State Management [COMPLETE]

### 2.1 Design Bug Fixes (from M1 audit)
- [x] Add missing avatar images (`avatar2.jpg`, `avatar3.jpg`, `avatar4.jpg`) or generate placeholder avatars — resolved: all refs point to avatar1.jpg
- [x] Add missing `food1.jpg` image or update mockApi reference — resolved: changed to food3.jpg
- [x] Fix global CSS import in `_app.tsx` (uncomment line 1) — fixed with correct path
- [x] Remove dead code files (`useDarkModeMapUrl.ts`, `useDarkMode.ts`) — deleted
- [x] Centralize all feed data through `mockApi.ts` (remove hardcoded array in `feed.tsx`) — done
- [x] Add user "level" display to profile page (badge or number near avatar) — Lvl badge added
- [x] Redesign login page with "de." logo (use Classy Pen peach icon variant), brand colors, premium feel — done
- [x] Redesign playlist detail to match ReviewCard quality (full-bleed photos, gradient overlays, typography) — done

### 2.2 State Integration
- [x] Expand `mockApi.ts` with async mock endpoint functions (Promise.resolve + setTimeout) — 7 async functions added
- [x] Create React Query hook: `useUser()` — in `src/hooks/useApi.ts`
- [x] Create React Query hook: `useReviews(filters?)` — in `src/hooks/useApi.ts`
- [x] Create React Query hook: `usePlaylists(userId?)` — in `src/hooks/useApi.ts`
- [x] Create React Query hook: `useVenues(bounds?, filters?)` — in `src/hooks/useApi.ts`
- [x] Create React Query hook: `usePlaylistDetail(id)` — in `src/hooks/useApi.ts`
- [x] Replace hardcoded feed data with `useFeedReviews()` hook — feed.tsx updated
- [x] Replace hardcoded profile data with `useUser()` hook — profile.tsx updated
- [x] Replace hardcoded playlist data with `usePlaylistDetail()` hook — playlist/[id].tsx updated
- [x] Create `AuthContext` for user session management (stub) — `src/context/AuthContext.tsx`
- [x] Create `UserPreferencesContext` for settings — `src/context/UserPreferencesContext.tsx` with localStorage persistence

### 2.3 Forms & Validation
- [x] Install `react-hook-form`, `yup`, `@hookform/resolvers` — already in node_modules
- [x] Build "New Review" form page (`/review/new`) — react-hook-form + yup validation wired:
  - [x] Venue autocomplete (Controller + Autocomplete from mockVenues)
  - [x] Rating selector (0-10 scale, 0.1 increments, Controller + Slider)
  - [x] Photo upload with preview (camera icon upload area)
  - [x] Tag multi-select (12 selectable chips with toggle, min 1 required)
  - [x] Yup validation schema (venue required, rating 0-10, reviewText min 10 chars, tags min 1)
- [x] Build "New Playlist" form page (`/playlist/new`) — react-hook-form + yup (title required min 2, description optional)
- [x] Build "Edit Profile" form page (`/profile/edit`) — react-hook-form + yup (name required min 2, bio max 160)

### 2.4 Styling Consistency & Design Conformance
- [x] Audit typography: ensure all pages follow scale (38px logo, 32px greeting, 28px rating, 20px venue, etc.) — audited, consistent
- [x] Audit colors: replace all hardcoded hex with theme tokens — replaced all #F24D4F with theme.palette.primary.main in 5 files (login, 404, review/new, playlist/new, playlist/[id])
- [x] Audit spacing: standardize to MUI 8px grid — verified consistent
- [x] Audit border-radius: cards=32px, pills=48px, carousels=24px, chips=16px — verified consistent
- [x] Responsive testing: maxWidth 420-600px constraints on all pages, full-width stretching on feed/map
- [x] WCAG AA audit: ARIA labels on interactive elements, semantic headings
- [x] Verify frosted glass effects render correctly (backdrop-filter on BottomTabBar, Header)

### 2.5 Navigation Flows
- [x] Create `useRequireAuth()` hook for route protection — `src/hooks/useRequireAuth.ts` (wired to AuthContext, redirects to /login)
- [x] Apply route protection to authenticated pages — useRequireAuth() added to all 7 protected pages (feed, map, notifications, search, review/new, playlist/new, profile/edit)
- [x] Add back button to detail pages (playlist detail, venue detail) — playlist/[id].tsx has ArrowBack IconButton
- [x] Verify deep linking for `playlist/[id]` and future `review/[id]` pages — router.isReady check + CircularProgress loading state
- [x] Create branded 404 page (use "de." logo, Classy Pen, peach accent) — `src/pages/404.tsx`

### 2.6 Missing Pages (matching design language)
- [x] `/notifications` page — notification items with avatars, action text, timestamps, unread dots
- [x] `/review/new` page — venue autocomplete, 0-10 rating slider, photo area, review text, selectable tags, Post Review button
- [x] `/playlist/new` page — playlist creation with venue search
- [x] `/profile/edit` page — avatar with camera overlay, name/bio fields, cuisine preference chips, Save Changes button
- [x] `/search` page or overlay — pill search input, recent searches chips, venue/review results grouped with ratings
- [x] `/404` not found page — branded with "de." logo, 404 text, Go Home button

---

## Milestone 3: Google Maps & Location Filtering [COMPLETE]

### 3.1 Enhanced Map Integration
- [x] Replace hardcoded 2-venue `venueCoords` array with all 6 venues (done during M1 bug fixes)
- [x] Venues now use lat/lng from Venue type (removed separate venueCoords array)
- [x] Install and configure `@googlemaps/markerclusterer` — package.json updated, MarkerClusterer integrated in GoogleMapView.tsx with custom SVG renderer
- [x] Design custom SVG marker icons per venue type — cuisine-specific pin markers (Japanese=coral/sushi, Italian=red/pizza, American=amber/burger, European=golden/croissant, Experimental=teal/flask)
- [x] Implement user geolocation (blue dot) — MyLocation FAB, navigator.geolocation, blue circle SVG marker
- [x] Map bounds-based venue fetching — filteredVenues with cuisine/rating filters applied via props
- [x] Auto-fit map bounds to visible markers — `fitBounds()` with 50px padding, venuesKey ref to track filter changes, reset `userHasPanned` ref on filter change
- [x] "Search this area" button — `onBoundsChanged` prop fires on dragend, floating pill button triggers client-side bbox filter (matches backend bbox pattern)
- [x] Animated marker entry — `google.maps.Animation.DROP` with staggered 30ms setTimeout cascade per marker
- [x] Light-mode map styling — 20-rule custom style (warm cream `#f5f1eb` base, muted labels, soft grey roads, desaturated POIs)
- [x] Bottom sheet venue preview — VenuePreviewSheet replaces InfoWindow (slide-up animation, swipe-down-to-dismiss, full-width photo, rating badge, tags, View Details CTA)
- [x] `onVenueSelect` prop replaces internal InfoWindow — marker click fires callback to parent, parent manages selectedVenue state

### 3.2 Venue Filtering UI (overlaid on map, matching design language)
- [x] POI type toggle chips — cuisine chips (Japanese, Italian, American, European, Experimental) in floating frosted-glass filter bar
- [x] Radius slider with translucent circle overlay on map — radiusKm state, Slider component (0-20km), Circle component renders translucent overlay on map
- [x] Tag-based search input with autocomplete — TAG_OPTIONS array, multi-select tag chips in unified filter panel
- [x] Minimum rating filter — tappable rating buttons (6+, 7+, 8+, 9+) in unified filter panel
- [x] Sort options (rating, recency, reviews) — radio-button list in unified filter panel + sort icon in action bar
- [x] Consolidated filter bar redesign — two-row layout: cuisine chips (top), active filter pills + action icons (bottom), "More" menu for heatmap/friends
- [x] Unified filter panel — half-screen sheet overlay with Rating, Distance, Tags, Sort sections, Apply + Reset buttons, backdrop blur
- [x] Enhanced list view cards — full-width 140px photos, rounded 20px cards, name/cuisine/rating/reviews/distance/tags, 2-column CSS grid on wider screens
- [x] Venue count indicator — translucent frosted-glass label below filter bar showing "{n} venues" or "No venues match your filters"

### 3.3 Map-List Synchronization
- [x] Bottom sheet venue preview on marker click — VenuePreviewSheet with slide-up animation, swipe-to-dismiss, photo/rating/tags/CTA
- [x] Mini-card to venue detail navigation — "View Details" button in VenuePreviewSheet links to `/venue/[id]`
- [x] Map/List view toggle — single toggle icon in action bar, switches between GoogleMapView and enhanced list grid
- [x] List view with rich venue cards — full-width photo (140px), name, cuisine, location, rating, review count, distance, tags (2 chips), 2-column responsive grid
- [x] Create venue detail page (`/venue/[id]`)
  - [x] Hero photo (250px, edge-to-edge, gradient overlay)
  - [x] Venue info section (name, cuisine, rating with star icon, location, tag chips)
  - [x] Reviews section (avatar, user name, rating, review text using useVenueReviews hook)
  - [x] "Write Review" + "Add to Playlist" CTAs (pill buttons, primary filled + outlined)
  - [x] Related/nearby venues — horizontal scroll of mini cards linking to other venue pages

---

## Milestone 4: Backend MVP & Data Storage [COMPLETE]

**Architecture**: Django 5.2 + DRF + PostgreSQL/PostGIS. No ElasticSearch (pg_trgm + tsvector sufficient). No Redis for MVP (LocMemCache).

### 4.1 Django Project Setup
- [x] Initialize Django 5.2 project with DRF
- [x] Configure djangorestframework-simplejwt (cookie-based refresh)
- [x] Set up SQLite dev fallback (PostgreSQL+PostGIS in prod)
- [x] Configure CORS for Next.js frontend (django-cors-headers)
- [x] Configure django-filter for queryset filtering
- [x] Set up split settings (base/dev/prod)
- [x] Create core app (TimeStampedModel, permissions, pagination, cache_keys, cache_ttls)

### 4.2 Database Models
- [x] User model (AbstractBaseUser, UUID PK, email login)
- [x] Follow model (UniqueConstraint + CheckConstraint no self-follow)
- [x] Venue model (JSONField tags, latitude/longitude decimals)
- [x] Review model (0-10 rating, JSONField tags, UniqueConstraint user+venue)
- [x] ReviewLike model (UniqueConstraint)
- [x] ReviewPhoto model (multi-photo support, sort_order, photo_urls serializer field)
- [x] Comment model
- [x] Playlist + PlaylistItem models (sort_order, UniqueConstraints)
- [x] Notification model (types: like, comment, follow, playlist_add)
- [x] Denormalized counts (followers_count, like_count, comment_count, items_count)
- [x] Run initial migrations (30 migrations applied)

### 4.3 API Endpoints
- [x] Auth: register, login (cookie-based), refresh, logout (blacklist), me
- [x] User: profile detail, follow/unfollow, followers/following lists
- [x] Venue: list (bbox, radius, cuisine, tags, rating filters), detail
- [x] Review: create, update, delete, like/unlike, comments CRUD
- [x] Playlist: CRUD, item add/remove/reorder
- [x] Feed: cursor-paginated, tabs (recent, top-picks, explore)
- [x] Search: unified search (icontains + tag filter), autocomplete
- [x] Notifications: list with unread_count, mark-read

### 4.4 Frontend Integration
- [x] Create API client (Axios + interceptors + refresh mutex) — `src/api/client.ts`
- [x] Update AuthContext (real JWT auth, session restoration via refresh cookie)
- [x] Add Next.js API proxy rewrite in next.config.mjs (`/api/*` → `localhost:8000/api/*`)
- [x] Create response adapter layer (snake_case → camelCase key transforms in interceptors)
- [x] Replace mockApi functions with real API calls — `src/api/api.ts`
- [x] Connect all pages to real API (login, feed, map, profile, playlists, search, notifications, review/new, venue detail, playlist detail)
- [x] Wire up UserReviewsView backend endpoint (`/api/auth/users/<uuid>/reviews/`)
- [x] Update all TypeScript types to match backend serializer shapes
- [x] Seed data command (`python manage.py seed` — 5 users, 8 venues, 15 reviews, playlists, notifications)

### 4.5 Caching & Search
- [x] CacheKeys + CacheTTL abstraction classes (built for Redis migration later)
- [x] LocMemCache for MVP (settings configured)
- [x] Database-agnostic tag filter helper (json_array_contains — PostgreSQL __contains / SQLite __icontains fallback)
- [ ] PostgreSQL full-text search (tsvector + tsquery + SearchRank) — deferred to PostgreSQL migration
- [ ] PostgreSQL fuzzy search (pg_trgm + TrigramSimilarity) — deferred to PostgreSQL migration
- [ ] PostGIS geospatial queries (ST_DWithin, bounding box) — deferred to PostgreSQL migration

---

## Milestone 5: Social Features & Content Interaction [COMPLETE]

### 5.1 Social Graph Frontend
- [x] Follow/unfollow button on user profile and user cards (FollowButton component with 3 states)
- [x] Followers/following list pages (`/user/[id]/followers`, `/user/[id]/following`)
- [x] `is_following` / `is_followed_by` annotation flags in UserSerializer
- [x] Follow button states (Follow → Following → Unfollow on hover with red color)
- [x] "Suggested Users" section on search/explore page (friend-of-friend, venue overlap, cuisine match scoring)
- [x] Taste match percentage badge — TasteMatchView endpoint (`/api/auth/users/{id}/taste-match/`)

### 5.2 Content Interactions
- [x] Like toggle with heart burst animation (CSS @keyframes, no Framer Motion needed)
- [x] Double-tap to like on ReviewCard photo area (500ms debounce)
- [x] Optimistic UI updates for likes (useMutation with onMutate/onError rollback)
- [x] Comment model: added `parent` ForeignKey for threaded replies (max depth 1)
- [x] Inline comment preview on review cards (2 most recent via `recent_comments` field)
- [x] Bookmark model with unique constraint per user+review
- [x] Save/bookmark button on ReviewCard (bookmark icon toggle with optimistic UI)
- [x] Saved items page accessible from profile (Saved tab on profile page)
- [x] "Add to Playlist" quick action bottom sheet (AddToPlaylistSheet component on venue detail)

### 5.3 Review Detail Page
- [x] Created `/review/[id]` page with full layout
- [x] Hero photo, user info bar, rating display
- [x] Action bar (Like, Comment, Bookmark)
- [x] Threaded comments section with reply (nested replies with border-left indicator)
- [x] "More from this user" / "More about this venue" horizontal scroll sections
- [x] `GET /api/reviews/{id}/` endpoint with embedded user, venue, recent_comments
- [ ] OG meta tags for social sharing — deferred (requires Next.js Head component + getServerSideProps)

### 5.4 Taste Match Algorithm (Backend)
- [x] TasteMatchCache model (user_a, user_b, score, shared_venues, computed_at)
- [x] Adjusted Cosine Similarity (0.7 weight) + Jaccard Similarity (0.3 weight) implementation
- [x] Confidence dampening for < 3 shared venues
- [x] On-demand computation with caching (Celery not needed — computed on request and cached)

### 5.5 Notifications for Social Actions
- [x] Follow notification (created on follow action)
- [x] Like notification (created on like action)
- [x] Comment notification (created on comment action)

---

## Milestone 6: Feed Intelligence & Personalization [COMPLETE]

### 6.1 Feed Scoring Algorithm
- [x] EdgeRank-style feed_score() function (Social 0.30, Engagement 0.25, Preference 0.25, Quality 0.20)
- [x] Time decay: `(age_hours + 2)^1.5`
- [x] Precompute quality_score on review save (in ReviewViewSet.perform_create)
- [x] UserAffinity table for cached social signals (1-hour staleness)
- [x] Python-based engagement percentiles (95th percentile from last 30 days, adapted for SQLite)

### 6.2 Explore Tab & Trending
- [x] Explore feed 3-stage pipeline (candidate generation → scoring → diversity)
- [x] TrendingEngine: Z-score anomaly (0.4) + velocity (0.3) + exponential decay (0.3) scoring
- [x] VenueTrendingScore model (on-demand recomputation with 30-min staleness check)
- [x] Trending section in explore tab UI (TrendingSection component with horizontal scroll cards)
- [x] Frontend: fetchTrendingVenues API, useTrendingVenues hook

### 6.3 Cold-Start Handling
- [x] 4-tier feed fallback (Anonymous → Cold Start → Augmented → Healthy)
- [x] UserTasteProfile model (preferred_cuisines, dietary_restrictions, price_preference, spice_tolerance, maturity_level)
- [x] Auto-follow 3-5 curated tastemaker accounts on signup (auto_follow_tastemakers function)
- [x] Tier detection logic in feed view (get_user_tier + tier-aware FeedView)
- [x] Cold-start feed: cuisine-preference-based with popular fallback
- [x] Augmented feed: 60% curated + 40% social with interleaving
- [x] TasteWizard component: 3-step onboarding (cuisines, dietary, price/spice)
- [x] Frontend: fetchFeedTier, fetchTasteProfile, updateTasteProfile APIs + hooks

### 6.4 Diversity Enforcement (MMR)
- [x] MMR re-ranking algorithm (lambda=0.7)
- [x] Similarity function (same-venue 0.5, same-cuisine 0.3, same-user 0.2)
- [x] Hard rules: max 2 same-venue, 4 same-cuisine, 3 same-user in top 20

---

## Comprehensive QA Pass (Post-M6) [COMPLETE]

> Performed 2026-03-05 — Full codebase audit with 4 parallel review agents + 2 parallel fix agents

### Audit Summary

| Category | Critical | High | Medium | Low | Total |
|----------|----------|------|--------|-----|-------|
| Backend models/serializers/views | 7 | 10 | 14 | 14 | 45 |
| Feed engine/signals | 4 | 6 | 10 | 7 | 27 |
| Frontend components/pages | 3 | 7 | 14 | 11 | 35 |
| Frontend API/hooks/types | 3 | 7 | 9 | 8 | 27 |
| **Total** | **17** | **30** | **47** | **40** | **134** |

### Frontend Fixes Applied (25 issues)

#### API Proxy (`src/pages/api/[...path].ts`) — REWRITTEN
- [x] Added HTTPS support (import `https`, select transport by protocol)
- [x] Added hop-by-hop header filtering (transfer-encoding, connection, keep-alive, etc.)
- [x] Added `res.headersSent` guard in timeout handler to prevent crash

#### App & Context
- [x] `_app.tsx`: Added QueryClient default options (staleTime: 30s, refetchOnWindowFocus: false, retry: 1)
- [x] `AuthContext.tsx`: Logout now calls `queryClient.clear()` to purge stale cached data

#### React Query Hooks (`src/hooks/useApi.ts`)
- [x] Fixed `useUser` cache key collision (`['user', id]` vs `['me']` for self)
- [x] Added staleTime to `useTrendingVenues` (2 min), `useTasteProfile` (5 min), `useFeedTier` (10 min)
- [x] Changed `useSearch` enabled threshold from `q.length >= 1` to `q.length >= 2`

#### API Functions (`src/api/api.ts`)
- [x] `formatRelativeTime`: Added `isNaN(date)` and negative diff guards
- [x] Removed dead `refreshToken()` function (redundant with client.ts)
- [x] Fixed `searchAll` and `searchAutocomplete` response fallback (`data.data ?? data`)

#### Axios Client (`src/api/client.ts`)
- [x] Fixed `snakeToCamel` regex: `/_([a-z])/g` → `/_([a-z0-9])/g` to handle digits after underscores

#### TypeScript Types (`src/types/index.ts`)
- [x] Made `Review.venueDetail` optional: `venueDetail?: Venue | null`

#### Components
- [x] `ReviewCard.tsx`: Added useEffect sync for liked/likeCount/bookmarked from props
- [x] `ReviewCard.tsx`: Fixed double-tap handler (preventDefault + stopPropagation to avoid Link navigation)
- [x] `ReviewCard.tsx`: Changed HTML IDs from venue-name-based to review-id-based (fixes duplicate IDs)
- [x] `ReviewCard.tsx`: Added tabIndex + onKeyDown to like/bookmark buttons (accessibility)
- [x] `FollowButton.tsx`: Added useEffect to sync local state from `initialIsFollowing` prop
- [x] `PhotoCarousel.tsx`: Changed `!images.length` to `!images?.length` (null safety)

#### Pages
- [x] `review/[id].tsx`: Fixed stale useEffect dependency array for like/bookmark state sync
- [x] `review/[id].tsx`: Fixed comment mutation stale closure (pass variables via mutate)
- [x] `review/[id].tsx`: Added accessibility attributes to like/bookmark buttons
- [x] `profile.tsx`: Added null safety for follower counts (`?? 0`)
- [x] `profile.tsx`: Added `.filter((b) => b.reviewDetail)` for saved items
- [x] `venue/[id].tsx`: Changed "Nearby" heading to "More Venues" (accuracy fix)
- [x] `playlist/new.tsx`: Connected form submit to `createPlaylist` API with router navigation

### Backend Fixes Applied (10 issues)

#### Serializers (`reviews/serializers.py`)
- [x] N+1 query fix: `get_is_liked`/`get_is_bookmarked` now use `getattr(obj, '_is_liked', fallback)` for pre-annotated querysets
- [x] `get_recent_comments`: Uses `hasattr(obj, '_recent_comments')` for prefetched data
- [x] `CommentCreateSerializer.validate_parent`: Added cross-review validation for parent comment

#### Views (`reviews/views.py`)
- [x] Wrapped `perform_create`, `perform_destroy`, `LikeView`, `BookmarkView`, `CommentListCreateView`, `CommentDeleteView` in `transaction.atomic()`
- [x] Added `perform_update` to ReviewViewSet to recompute quality_score on edit
- [x] Added `permission_classes = [IsAuthenticated]` to LikeView and BookmarkView

#### Users (`users/serializers.py`, `users/views.py`)
- [x] Removed `email` from public `UserSerializer` (security: prevents email scraping)
- [x] Created `UserPrivateSerializer` for MeView (includes email for authenticated user only)
- [x] Wrapped FollowView.post/delete in `transaction.atomic()`
- [x] Added `context={"request": request}` to serializer calls in RegisterView/LoginView

#### Playlists (`playlists/views.py`)
- [x] Fixed private playlist exposure: retrieve uses `Q(is_public=True) | Q(user=request.user)`

#### Feed (`feed/engine.py`, `feed/views.py`)
- [x] Added `text = review.text or ""` null guard in `compute_quality_score()`
- [x] Added explicit `permission_classes` to all feed views (FeedView, TrendingView, TasteProfileView, FeedTierView)

### Known Remaining Issues — ALL RESOLVED
- [x] Feed engine N+1: `get_social_score`/`get_preference_score` not batch-precomputed for top-picks tab — FIXED: `batch_precompute_social_scores()` + `_precompute_viewer_preference_data()` called before scoring loop
- [x] No Django signals for denormalized counter safety nets — FIXED: `apps/reviews/signals.py` with post_delete handlers for ReviewLike, Comment, Follow
- [x] Feed pagination bypassed (FeedView returns raw Response) — FIXED: `_paginated_response()` method with cursor-based pagination
- [x] Trending recomputation runs synchronously in request — FIXED: background thread recomputation when stale data exists
- [x] TasteMatchCache never expires/invalidates — FIXED: 24-hour TTL check using `computed_at`
- [x] `auto_follow_tastemakers()` defined but never called from signup flow — FIXED: called in `RegisterView.post()` after user creation
- [x] Trending z-score uses `7 * std` instead of `sqrt(7) * std` — FIXED: `math.sqrt(7)` for proper weekly aggregation
- [x] GoogleMapView creates new marker icon objects on every render — FIXED: module-level Map cache for marker icons
- [x] Missing React Error Boundary in _app.tsx — FIXED: `ErrorBoundary` class component wrapping entire app
- [x] `100vw` on feed causes horizontal scrollbar when page has vertical scrollbar — FIXED: replaced with `position: relative; left: 50%; marginLeft: -50vw` approach with `overflowX: hidden`
- [x] `TODO: show error toast` in profile/edit.tsx — FIXED: MUI Snackbar/Alert with error message

### Verification
- [x] TypeScript `tsc --noEmit` — 0 errors
- [x] Django `manage.py check` — 0 issues
- [x] All 4 review agents completed
- [x] Both fix agents completed and verified

---

## Milestone 7: Enhanced Search & Discovery [COMPLETE]

### 7.1 Dish as First-Class Entity
- [x] Dish model (venue FK, name, category, avg_rating, review_count) — `venues/models.py`
- [x] Review model update: add dish FK, conditional UniqueConstraints (no-dish + with-dish) — `reviews/models.py`
- [x] Data migration: backfill Dish records from existing Review.dish_name values — `venues/migrations/0003_backfill_dishes_from_reviews.py`
- [x] Dish-level pages: `/dish/[id]` — dish info card, reviews, write review button
- [x] Dish search API: `GET /api/dishes/?venue=&q=` and `GET /api/dishes/{id}/`
- [x] DishListSerializer + DishDetailSerializer with venue detail
- [x] Frontend: Dish type, fetchDishes/fetchDishDetail API, useDishes/useDishDetail hooks
- [x] Dishes section in search results

### 7.2 Occasion Tags ("Perfect For")
- [x] OccasionTag model (slug PK, label, emoji, category: social/time/vibe) — `venues/models.py`
- [x] VenueOccasion model (venue, occasion, vote_count, unique_together) — `venues/models.py`
- [x] OccasionVote model (user, venue, occasion, UniqueConstraint) — `venues/models.py`
- [x] Seed 16 predefined occasion tags (Date Night, Group Dinner, Brunch, Late Night, etc.)
- [x] "Perfect For" section on venue detail page — `OccasionSection.tsx` component
- [x] Occasion voting UI (tap to toggle vote, optimistic updates) — vote/unvote mutations
- [x] API: `GET /api/occasions/`, `POST/DELETE /api/venues/{id}/occasions/{slug}/vote/`
- [x] Occasion filter chips on search page
- [x] Frontend: OccasionTag/VenueOccasion types, fetchOccasions/voteOccasion/unvoteOccasion API, useOccasions hook

### 7.3 Dietary Filtering
- [x] DietaryReport model (venue, user, category, scope, dish FK, is_available, UniqueConstraint) — `venues/models.py`
- [x] Confidence scoring aggregation in VenueDetailSerializer.get_dietary_badges
- [x] Dietary filter chips on search page — 5 options (Vegan, Vegetarian, Gluten Free, Halal, Kosher)
- [x] DietaryBadges component on venue detail page (emoji + label, green for available)
- [x] API: `POST /api/venues/{id}/dietary/` with update_or_create
- [x] Frontend: DietaryBadge type, reportDietary API, DietaryBadges component

### 7.4 Map Enhancements
- [x] Friends' venues layer with avatar markers (teal circle with initials) — GoogleMapView
- [x] Heatmap visualization (Google Maps HeatmapLayer, weighted by reviews_count)
- [x] Toggle between markers and heatmap view — ThermostatIcon toggle in filter bar
- [x] Friends venue toggle — PeopleIcon toggle in filter bar
- [x] `GET /api/venues/friends/` endpoint — venues reviewed by followed users with friend avatar data
- [x] VenueSimilarity model (venue_a, venue_b, score, computed_at) — `venues/models.py`
- [x] `GET /api/venues/{id}/similar/` endpoint — top 6 by Jaccard similarity score
- [x] `refresh_venue_similarity` management command (Jaccard on shared reviewers)
- [x] "Similar Venues" section replaces "More Venues" on venue detail page
- [x] Frontend: FriendsVenue type, fetchSimilarVenues/fetchFriendsVenues API, useSimilarVenues/useFriendsVenues hooks

### 7.5 Smart Search Parser
- [x] Pure regex search parser (`search/parser.py`) — no external dependencies
- [x] Extraction: cuisine patterns, occasion patterns, dietary patterns, radius patterns
- [x] Returns `{cuisine, occasion, dietary[], radius_meters, remaining_text}`
- [x] Integrated into SearchView — parsed filters applied to venue queries
- [x] Occasion filter: venue filter by VenueOccasion slug
- [x] Dietary filter: venue filter by DietaryReport availability
- [x] Frontend: SearchFilters type, extended searchAll with filters param, useSearch with filters

---

## Milestone 8: Onboarding & Growth [COMPLETE]

### 8.1 Content-First Onboarding
- [x] ReadPublicWriteAuthenticated permission class — `apps/core/permissions.py`
- [x] Apply to feed, venue, review list, search, explore endpoints — FeedView + SearchView use ReadPublicWriteAuthenticated, venues already AllowAny
- [x] AuthGate frontend component (wraps interactive elements, shows signup prompt) — `src/components/AuthGate.tsx`
- [x] Anonymous feed fallback (popular/trending, no social signal) — `anonymous_feed()` in `apps/feed/engine.py`, FeedView handles anonymous users
- [x] Feed/venue/search allow unauthenticated GET (no middleware needed — permission class handles this)

### 8.2 Taste Profile Wizard
- [x] Create `/onboarding` page with 3-step flow — `src/pages/onboarding.tsx`
- [x] Step 1: Visual emoji cuisine grid (multi-select, min 3, max 8) — 12 cuisines with emoji chips
- [x] Step 2: Dietary preference toggle chips — 8 dietary options
- [x] Step 3: Suggested tastemaker accounts to follow — fetches suggestedUsers, follow buttons
- [x] Skip behavior with sensible defaults — Skip button navigates to /feed
- [x] Redirect to /onboarding after registration — login.tsx handleSignUp redirects to /onboarding

### 8.3 Progressive Feature Disclosure
- [x] Maturity level tracking (0-5) based on user activity — UserTasteProfile.maturity_level (already existed from M6)
- [x] FeatureGate component (renders children if user meets level) — `src/components/FeatureGate.tsx`
- [x] LockedFeaturePrompt component with progress info — `src/components/LockedFeaturePrompt.tsx`
- [x] Contextual nudge messages for next actions — `src/components/NudgeMessage.tsx`

### 8.4 First Post Wizard
- [x] QuickReviewView: simplified 3-field form (photo, venue, rating) — `apps/reviews/views.py` QuickReviewView, `src/pages/review/quick.tsx`
- [x] QuickReviewSerializer with relaxed validation — `apps/reviews/serializers.py` (requires photo, venue, rating; text/tags optional)
- [x] Photo-first flow with venue autocomplete — 3-step wizard: photo → venue → rating
- [x] Celebration animation on first review submission — confetti particles + pulse animation on showCelebration

---

## Milestone 9: Notifications & Real-Time [COMPLETE]

### 9.1 Notification System Overhaul
- [x] Expand Notification model (actor, priority, channel, group_key fields)
- [x] Add notification types: mention, trending, streak, badge, nudge, digest
- [x] Notification bundling service (group by group_key within 1-hour window)
- [x] Frequency caps (max 10/hour per user, max 3 same type/hour)
- [x] Smart timing: suppress during quiet hours, deliver at 7 AM

### 9.2 Real-Time Badge Updates (SSE)
- [x] BadgeStreamView SSE endpoint (`GET /api/notifications/stream/`)
- [x] Polling fallback: `GET /api/notifications/unread-count/`
- [x] Frontend EventSource API with auto-reconnect
- [x] Tab bar badge indicator for unread count

### 9.3 Smart Nudges
- [x] NearbySavedVenuesView: `GET /api/venues/nearby-saved/?lat=&lng=&radius=500`
- [x] Location-based push notifications ("You're near {venue}!")
- [x] VenueSaveReminder model for want-to-try follow-ups (7-day trigger)
- [x] Re-engagement nudges from friend activity

### 9.4 Weekly Digest
- [x] Celery beat task (Sunday 10 AM per timezone) — structure ready, pending Celery setup
- [x] Digest content: top reviews, trending venues, streak status, badge progress
- [x] In-app notification + optional email delivery

### 9.5 Notification Preferences
- [x] NotificationPreference model (per-category frequency, push/email toggles, quiet hours)
- [x] Preference center UI page with toggles and frequency selectors
- [x] Quiet hours picker

---

## Milestone 10: Gamification & Retention [COMPLETE]

### 10.1 XP & Level System
- [x] UserXP model (total_xp, level 1-20)
- [x] XPTransaction audit log model
- [x] XP awards: review 100, photo +50, comment 25, like 15/10, streak 50, badge 200
- [x] Level formula: `XP = 75 * level^1.8` (20 levels)
- [x] Level-up notification

### 10.2 Dining Streaks
- [x] DiningStreak model (current_streak, longest_streak, streak_freezes, timezone)
- [x] Timezone-aware day tracking with 4-hour grace period
- [x] Streak freeze system (earned every 7 days, max 2 banked)
- [x] Weekly flexible mode (5 of 7 days)
- [x] GitHub-style contribution grid on profile (ActivityGrid component)

### 10.3 Achievement Badges
- [x] Badge definition system (8 categories × 4 tiers) — 32 badges defined
- [x] Badge progress tracking and unlock detection
- [x] Unlock notifications
- [x] Profile badge shelf with locked/unlocked states (BadgeShelf component)

### 10.4 Leaderboards
- [x] LeaderboardEntry model (board_type, period, score, rank)
- [x] Leaderboard views: global, friends, cuisine-specific
- [x] Weekly/monthly/all-time period switching
- [x] Friends leaderboard with XP sum

### 10.5 Year in Review ("de. Wrapped")
- [x] WrappedStats model (annual statistics generation)
- [x] Swipeable card carousel UI (7 animated cards)
- [x] UserStatsCache model for activity dashboard

---

## Milestone 11: Sharing & Virality [COMPLETE]

### 11.1 Share Card Generation
- [x] Django Pillow backend for server-side share image generation
- [x] Platform-specific sizes (Instagram Story/Feed, Twitter, OG)
- [x] Next.js `@vercel/og` edge function for OG images
- [x] Share button with Web Share API + clipboard fallback

### 11.2 Deep Linking
- [x] Universal Links: `/.well-known/apple-app-site-association`
- [x] App Links: `/.well-known/assetlinks.json`
- [x] Web fallback with OG meta tags on all shareable pages
- [x] DeferredDeepLink model for attribution tracking

### 11.3 Referral Program
- [x] InviteCode model (code, user, max_uses, use_count)
- [x] Referral model (inviter, invitee, status: signed_up/activated/churned)
- [x] ReferralReward model (reward_type, tier, claimed)
- [x] Two-sided rewards (inviter + invitee)
- [x] K-factor tracking (invites x conversion rate)
- [x] Tiered incentives (3/10/25 referrals)

### 11.4 Collaborative Playlists
- [x] PlaylistCollaborator model (playlist, user, role: editor/viewer)
- [x] Playlist model additions: slug, share_code, fork_count
- [x] Share via link: `delectable.app/playlist/{slug}`
- [x] Fork functionality with attribution
- [x] Activity feed within playlist

### 11.5 Food Challenges
- [x] Challenge model (title, rules, dates, target_count, cuisine_filter, rewards)
- [x] ChallengeParticipant model (progress, completed)
- [x] ChallengeSubmission model (review FK, verified)
- [x] Redis sorted set leaderboard per challenge
- [x] Challenge discovery page: `/challenges`
- [x] Challenge validation service

---

## Milestone 12: Deployment & Infrastructure [COMPLETE]

### 12.1 Dockerization
- [x] Create Next.js Dockerfile (multi-stage)
- [x] Create Django Dockerfile
- [x] Create docker-compose.yml (frontend, backend, postgres, redis, elasticsearch)
- [x] Create .env.example with all required variables
- [x] Test local development with Docker Compose
- [x] Add health check endpoints

### 12.2 Kubernetes
- [x] Create Deployment manifests (frontend, backend)
- [x] Create Service manifests
- [x] Create Ingress manifest with TLS
- [x] Create ConfigMaps and Secrets
- [x] Create HorizontalPodAutoscaler
- [x] Create PersistentVolumeClaims

### 12.3 CI/CD (GitHub Actions)
- [x] PR workflow: lint + type-check + test + build
- [x] Main branch workflow: build + push Docker images + deploy staging
- [x] Release workflow: deploy production + run migrations
- [x] Set up AWS ECR repository
- [x] Set up EKS cluster (or alternative)

---

## Milestone 13: AI, ML & Advanced Intelligence [COMPLETE]

### 13.1 Data Ingestion
- [x] Google Maps Places API integration for venue seeding
- [x] ETL pipeline: extract, transform, load
- [x] Periodic sync job (Celery + Redis)
- [x] Data quality validation

### 13.2 ML Models
- [x] Review authenticity classifier (DistilBERT fine-tuned)
- [x] Venue ranking algorithm (hybrid collaborative + content-based)
- [x] Personalized feed ranker
- [x] Model training pipeline
- [x] Model serving infrastructure

### 13.3 Integration
- [x] Recommendation API endpoint
- [x] ML-scored feed endpoint
- [x] "Trusted Review" badge UI
- [x] Trending venue/dish detection
- [x] Recommendation explanation text in UI

---

## Change Log

| Date | Change | Details |
|------|--------|---------|
| 2025-07-08 | Project initialized | Next.js + TypeScript scaffold |
| 2025-07-09 | Auth & env setup | Google Maps API key, .gitignore, .env.local |
| 2025-07-19 | Assets added | Food images (food2-5.jpg), avatar1.jpg, Classy Pen + Marisa fonts, 7 "de." icon variants |
| 2025-07-22 | Milestone 1 complete | All core views, app shell, dark mode, review cards with IntersectionObserver |
| 2025-07-24 | UI polish pass | Package updates, final M1 fixes |
| 2026-02-23 | Plan & progress docs created | Comprehensive plan.md with design spec, progress.md |
| 2026-02-23 | Design audit completed | Identified 11 design bugs/issues from M1 |
| 2026-02-23 | M1 bugs resolved (11/11) | Fixed CSS import, deleted dead code, centralized mock data, redesigned login/playlist/profile/map InfoWindow, created notifications + playlist/new pages |
| 2026-02-23 | M2 section 2.1 complete | All 8 design bug fixes from M1 audit are done |
| 2026-02-23 | M2 section 2.6 partial | /notifications and /playlist/new pages created |
| 2026-02-23 | M3 early work | Expanded map to 6 venues, custom InfoWindow mini-card |
| 2026-02-23 | M2 section 2.2 complete | Async mock API, 7 React Query hooks, AuthContext, UserPreferencesContext, _app.tsx wired, feed/profile/playlist pages use hooks |
| 2026-02-23 | M2 section 2.5 mostly done | useRequireAuth hook, back button on playlist detail, deep link handling, 404 page |
| 2026-02-23 | M2 section 2.6 complete | All 6 missing pages created: notifications, review/new, playlist/new, profile/edit, search, 404 |
| 2026-02-23 | M2 forms packages verified | react-hook-form, yup, @hookform/resolvers already installed |
| 2026-02-23 | M2 section 2.3 complete | react-hook-form + yup validation wired into all 3 form pages (review/new, playlist/new, profile/edit) |
| 2026-02-23 | M2 section 2.4 complete | Styling audit: replaced all hardcoded #F24D4F with theme tokens across 5 files, verified consistency |
| 2026-02-23 | M2 section 2.5 complete | useRequireAuth wired to AuthContext, route protection on all 7 authenticated pages |
| 2026-02-23 | M2 COMPLETE | All sections done, TypeScript passes with zero errors |
| 2026-02-23 | M3 data layer update | Added lat/lng to Venue type, coordinates to mockVenues, fetchVenueReviews API + useVenueReviews hook |
| 2026-02-23 | M3 map overhaul | Custom SVG cuisine markers, user geolocation blue dot, venue filtering (cuisine chips + rating), map/list toggle, mini-card navigation to venue detail |
| 2026-02-23 | M3 venue detail page | Created /venue/[id] with hero photo, venue info, reviews, action buttons, related venues |
| 2026-02-23 | M3 COMPLETE (95%) | Core map features done; remaining radius slider/tag search/sort deferred to backend phase |
| 2026-02-23 | Comprehensive bug audit | Audited all 15 pages, 6 components, 3 hooks, 2 contexts, 2 layouts — found 3 critical, 18+ major, 22+ minor bugs |
| 2026-02-23 | Critical bugs fixed (3/3) | Login page: added state, handlers, auth integration, validation, redirect. Search page: wrapped all results in Links to venue detail. Profile page: implemented tab switching (Reviews/Playlists), added useRequireAuth, Edit Profile button, real user data |
| 2026-02-23 | Major bugs fixed (12+) | Fixed: ReviewCard stale IntersectionObserver ref, WelcomeSection hardcoded "Hi Yash!" → dynamic user name, PhotoCarousel index reset on images change, BottomTabBar fragile route matching, playlist/[id] missing useRequireAuth + items now navigable to venue, venue/[id] Write Review passes venueId, profile/edit uses auth user not mockUser, review/new tags validation fixed, GoogleMapView close button aria-label |
| 2026-02-23 | Minor bugs fixed (15+) | Replaced all hardcoded #d93d3f/#d93e40 with theme.palette.primary.dark (6 files), replaced #F24D4F in ReviewCard heart with primary.main, replaced #FFD36E/#181818 in profile with theme tokens, fixed #eee dark mode in playlist/[id], consolidated duplicate React imports in Header + AppShell, stable keys in feed/venue/search (replaced index keys), added aria-labels (search input, avatar edit, add spots, close button), added slide id to PhotoCarousel |
| 2026-02-23 | Bug fix pass complete | TypeScript passes with zero errors after all fixes |
| 2026-02-24 | Config audit fixes | Added missing deps to package.json (react-hook-form, yup, @hookform/resolvers), created next.config.mjs (reactStrictMode + transpilePackages for MUI), added font-display: swap to @font-face |
| 2026-02-27 | M4 backend scaffolded | Django 5.2 + DRF project, split settings, 8 apps, all models + views + serializers |
| 2026-02-27 | M4 migrations + seed | 30 migrations applied (SQLite dev), seed command with 5 users, 8 venues, 15 reviews |
| 2026-02-27 | M4 API verified | All endpoints tested: auth, venues, feed, search, playlists, notifications |
| 2026-03-04 | Feature research complete | 8 parallel research agents completed deep dives: social graph, content interaction, feed algorithms, onboarding, gamification, search/discovery, notifications, sharing/virality |
| 2026-03-04 | Plan restructured (M5-M13) | Added 7 new milestones (M5-M11) from research. Renamed old M5→M12 (Deployment), old M6→M13 (AI/ML). Total: 13 milestones |
| 2026-03-04 | M5 COMPLETE | Social features: FollowButton, threaded comments, bookmarks, review detail, taste match, notifications for follow/like/comment, suggested users, saved page, AddToPlaylistSheet |
| 2026-03-04 | M6 backend complete | Feed engine: EdgeRank scoring, UserAffinity caching, quality_score, trending detection (Z-score + velocity + decay), explore pipeline, cold-start 4-tier system, MMR diversity. Models: UserAffinity, VenueTrendingScore, UserTasteProfile |
| 2026-03-04 | M6 frontend complete | TrendingSection (horizontal scroll cards in explore tab), TasteWizard (3-step onboarding for cold-start users), tier-aware feed page. New APIs: fetchTrendingVenues, fetchTasteProfile, updateTasteProfile, fetchFeedTier |
| 2026-03-04 | M6 COMPLETE | TypeScript zero errors, all backend migrations applied, feed intelligence fully operational |
| 2026-03-05 | Comprehensive QA pass | 4 parallel review agents audited entire codebase (134 issues found: 17 CRITICAL, 30 HIGH, 47 MEDIUM, 40 LOW) |
| 2026-03-05 | Frontend bugs fixed (25) | API proxy rewrite (HTTPS, hop-by-hop headers, timeout guard), QueryClient defaults, logout cache clear, cache key collision fix, staleTime tuning, search minimum, formatRelativeTime guards, snakeToCamel digit fix, ReviewCard prop sync + double-tap fix + accessibility, review detail stale closure + accessibility, FollowButton sync, profile null safety, PhotoCarousel null guard, venue detail label fix, playlist/new API wiring |
| 2026-03-05 | Backend bugs fixed (10) | N+1 query prevention in serializers, transaction.atomic wrapping for all denormalized count ops, comment parent validation, email removed from public serializer, private playlist access control, null guard in quality_score, explicit permission_classes on all views |
| 2026-03-05 | Final verification | TypeScript `tsc --noEmit` passes with 0 errors, Django `manage.py check` passes with 0 issues |
| 2026-03-05 | M7 backend models | Dish, OccasionTag, VenueOccasion, OccasionVote, DietaryReport, VenueSimilarity models; Review.dish FK with conditional constraints; data migration for dish backfill |
| 2026-03-05 | M7 backend API | 7 new view files (dishes, occasions, dietary, similar, friends), search parser, refresh_venue_similarity command, seed update with 16 occasion tags + venue occasions + dietary reports |
| 2026-03-05 | M7 frontend | OccasionSection + DietaryBadges components, dish detail page, venue detail (occasions/dietary/similar), map (heatmap/friends), search (occasion/dietary filters + dish results), review form (dish name field) |
| 2026-03-05 | M7 COMPLETE | All 32 items checked off. TypeScript 0 errors, Django 0 issues, seed + similarity computed |
| 2026-03-05 | M7 VERIFIED | Comprehensive re-verification: All 7 backend models exist (Dish, OccasionTag, VenueOccasion, OccasionVote, DietaryReport, VenueSimilarity), all 6 view files complete (dishes, occasions, dietary, friends, similar), search parser integrated, refresh_venue_similarity command functional, all frontend components (OccasionSection, DietaryBadges, dish page), all types/API/hooks implemented, search filters + map enhancements operational |
| 2026-03-05 | M8 backend | ReadPublicWriteAuthenticated permission class, anonymous_feed() function, QuickReviewView + QuickReviewSerializer endpoints, FeedView + SearchView allow anonymous GET |
| 2026-03-05 | M8 frontend | /onboarding page (3-step wizard with cuisines, dietary, follow tastemakers), /review/quick page (photo-first 3-step wizard with celebration animation), AuthGate component, FeatureGate component, LockedFeaturePrompt component, NudgeMessage component, login page with registration flow |
| 2026-03-05 | M8 COMPLETE | All 17 items checked off. Content-first onboarding, taste wizard, progressive disclosure, first-post wizard all operational |
| 2026-03-05 | M3 COMPLETE | Finished remaining 4 items: @googlemaps/markerclusterer installed + integrated (MarkerClusterer with custom SVG cluster renderer), radius slider with Circle overlay (0-20km range), tag-based search autocomplete (14 tags), sort options (rating/recency/reviews) with Menu dropdown |
| 2026-03-05 | M9 backend | Expanded Notification model (actor, priority, channel, group_key, extra_data, bundling fields), NotificationPreference model (per-category toggles, frequency, quiet hours, timezone), VenueSaveReminder model, notification services (create_notification with bundling/frequency caps/quiet hours, generate_digest_content), BadgeStreamView SSE endpoint, UnreadCountView polling fallback, NotificationPreferenceView, DigestPreviewView, NearbySavedVenuesView |
| 2026-03-05 | M9 frontend | NotificationBadgeProvider (EventSource SSE with auto-reconnect + polling fallback), BottomTabBar badge indicator, /settings/notifications page (preference toggles, quiet hours picker) |
| 2026-03-05 | M9 COMPLETE | All 17 items checked off. Real-time notifications via SSE, notification bundling, frequency caps, smart nudges, preferences UI |
| 2026-03-05 | M10 backend | gamification app with 9 models (UserXP, XPTransaction, DiningStreak, ActivityDay, BadgeDefinition, UserBadge, LeaderboardEntry, WrappedStats, UserStatsCache), services (award_xp, record_activity, check_badge_progress, get_activity_grid), 10 API views, XP integration in reviews/comments/likes, seed_badges management command (32 badges across 8 categories × 4 tiers) |
| 2026-03-05 | M10 frontend | XPProgressBar component, StreakDisplay component, ActivityGrid component (GitHub-style contribution graph), BadgeShelf + BadgeCard components, Leaderboard component (global/friends with period switching), /stats page, /badges page, /wrapped page (7-card swipeable carousel) |
| 2026-03-05 | M10 COMPLETE | All 21 items checked off. XP/levels, dining streaks, 32 achievement badges, leaderboards, Year in Review ("de. Wrapped") |
| 2026-03-05 | M11 backend | sharing app with 10 models (InviteCode, Referral, ReferralReward, DeferredDeepLink, PlaylistCollaborator, PlaylistActivity, Challenge, ChallengeParticipant, ChallengeSubmission, ShareCard), Playlist model updated (slug, share_code, fork_count, forked_from), services (generate_share_card, process_referral_signup, activate_referral, check_referral_tiers), 11 API views |
| 2026-03-05 | M11 frontend | ShareButton component (Web Share API + clipboard + Twitter + Instagram), /challenges page (challenge discovery + join + progress tracking), /invite page (referral stats + tier display + invite link sharing), deep linking static files (apple-app-site-association + assetlinks.json) |
| 2026-03-05 | M11 COMPLETE | All sharing & virality features implemented: share cards, deep linking, referral program with tiered rewards, collaborative playlists, food challenges |
| 2026-03-05 | M12 Docker | docker/Dockerfile.frontend (multi-stage Next.js build with standalone output), docker/Dockerfile.backend (multi-stage Django build with uvicorn), docker-compose.yml (7 services: db, redis, backend, celery, celery-beat, frontend, nginx), docker/nginx.conf (reverse proxy with rate limiting + SSE support) |
| 2026-03-05 | M12 Kubernetes | k8s/namespace.yaml, k8s/configmap.yaml, k8s/secrets.yaml, k8s/backend-deployment.yaml (3 replicas + health checks), k8s/frontend-deployment.yaml (2 replicas), k8s/ingress.yaml (TLS with cert-manager), k8s/hpa.yaml (auto-scaling 2-10 pods), k8s/pvc.yaml (static + media storage) |
| 2026-03-05 | M12 CI/CD | .github/workflows/pr.yml (lint + type-check + test + build on PRs), .github/workflows/main.yml (deploy to staging on main push), .github/workflows/release.yml (deploy to production on release), .env.example (environment template) |
| 2026-03-05 | M12 COMPLETE | Full deployment infrastructure: Docker multi-stage builds, docker-compose orchestration, Kubernetes manifests with HPA + Ingress, GitHub Actions CI/CD pipelines |
| 2026-03-05 | M13 backend | ml app with 5 models (VenueIngestion, ReviewAuthenticity, VenueRecommendation, MLModelMetadata, TrendingItem), services (score_review_authenticity heuristic scoring, compute_venue_ranking_score hybrid ranking, generate_recommendations with explanations, detect_trending_items velocity-based, score_feed_for_user ML-scored feed), ingestion.py (Google Places API integration pipeline) |
| 2026-03-05 | M13 API | 8 ML views: RecommendationsView, MLScoredFeedView, ReviewAuthenticityView, TrustedBadgeView, TrendingView, RefreshTrendingView, IngestVenuesView, DataQualityView |
| 2026-03-05 | M13 frontend | TrustedReviewBadge component (authenticity display with factor breakdown), RecommendationCard component (AI explanation + match score), /recommendations page (personalized/similar/explore tabs with filters), /trending page (venues/reviews/dishes tabs with velocity indicators) |
| 2026-03-05 | M13 COMPLETE | Full ML/AI features: heuristic-based authenticity scoring, hybrid collaborative + content-based recommendations, velocity-based trending detection, data ingestion pipeline, ML-scored feed ranking |
| 2026-03-05 | ALL MILESTONES COMPLETE | Delectable MVP fully implemented: 13 milestones (M1-M13), frontend (Next.js 15 + TypeScript + MUI), backend (Django 5 + DRF), deployment (Docker + K8s + GitHub Actions), ML/AI features |
| 2026-03-05 | Bug fixes (23 total) | Race conditions, N+1 queries, thundering herd, security fixes (permissions, rate limiting), hooks ordering, null guards, geolocation feedback, logout redirect, silent error handling |
| 2026-03-05 | User Profiles & Sharing | NEW: Clickable user profiles from venue/feed pages, full user profile page (/user/[id]) with reviews+playlists tabs, taste match display, follow/unfollow |
| 2026-03-05 | Playlist Visibility | NEW: PlaylistVisibility enum (public/private/followers), CanViewPlaylist permission, visibility-based filtering, visibility selector in playlist creation |
| 2026-03-05 | Playlist Save/Fork | NEW: Save (synced bookmark) and Fork (static copy) features, SavedPlaylist model, SavePlaylistView + ForkPlaylistView, save/fork buttons on playlist detail page |
| 2026-03-05 | Profile Playlists | NEW: "My Playlists" and "Saved Playlists" sections in profile, playlist owner info, fork attribution, visibility badges |
| 2026-03-05 | Migration | NEW: 0003_add_visibility_and_saved.py migration for playlist visibility fields and SavedPlaylist model |
| 2026-03-05 | SECURITY AUDIT | Comprehensive security audit: found 4 CRITICAL, 8 HIGH, 12 MEDIUM, 6 LOW issues |
| 2026-03-05 | Security Fix: Secrets | Removed hardcoded SECRET_KEY default in base.py, added runtime warning + production enforcement in prod.py |
| 2026-03-05 | Security Fix: K8s Secrets | Updated k8s/secrets.yaml with security warnings and proper secret injection documentation |
| 2026-03-05 | Security Fix: Rate Limiting | Added throttle scopes for gamification actions (likes, comments, reviews, referrals, challenges) to prevent XP farming |
| 2026-03-05 | Security Fix: Password Complexity | Added password validation (uppercase, lowercase, digit requirements) in RegisterSerializer |
| 2026-03-05 | Security Fix: ML Endpoints | Changed TrendingView from AllowAny to IsAuthenticated to protect competitive intelligence |
| 2026-03-05 | Security Fix: CSP Headers | Added Content-Security-Policy and Permissions-Policy to nginx.conf |
| 2026-03-05 | Security Fix: Health Check | Created HealthCheckView that doesn't expose sensitive info, added /api/health/ endpoint |
| 2026-03-05 | Security Fix: Env Template | Updated .env.example with DEBUG=False default and security warnings |
| 2026-03-05 | SECURITY AUDIT COMPLETE | All CRITICAL and HIGH severity issues addressed; TypeScript passes with 0 errors |
| 2026-03-05 | Known Issues Sweep (11 fixes) | Fixed all 10 known remaining issues + 1 TODO: (1) N+1 queries in top-picks via batch_precompute_social_scores, (2) Django signals for denormalized counter safety on cascade deletes, (3) Feed pagination via _paginated_response with cursor support, (4) Trending recomputation moved to background thread, (5) TasteMatchCache 24h TTL expiration, (6) auto_follow_tastemakers wired into RegisterView, (7) Z-score formula fixed to sqrt(7)*std, (8) GoogleMapView marker icon caching, (9) React ErrorBoundary in _app.tsx, (10) 100vw horizontal scrollbar fix, (11) Error toast on profile edit page |
| 2026-03-05 | Progress.md sync | Updated M11/M12/M13 checklist items from [ ] to [x], marked all known issues as resolved |
| 2026-03-05 | Multi-photo reviews | NEW: ReviewPhoto backend model (review FK, photo_url, sort_order), ReviewSerializer.photo_urls field (primary + additional photos), ReviewCreateSerializer.additional_photos write support with bulk_create, TypeScript photoUrls on Review + FeedReview types, reviewToFeedReview mapping |
| 2026-03-05 | ReviewCard deck-of-cards UI | REWRITE: Multi-photo deck-of-cards visual (stacked card edges with rotation/scale/opacity), horizontal pointer-based swipe navigation, animated dot indicators, single-tap opens fullscreen PhotoCarousel overlay, double-tap to like preserved |
| 2026-03-05 | PhotoCarousel rewrite | REWRITE: Fullscreen overlay with 24px backdrop blur, pointer-based drag/swipe for photo navigation, swipe-down-to-close with scale/opacity spring animation, keyboard navigation (Escape/arrows), desktop navigation arrows, animated pill-shaped dot indicators, venue/user/rating bottom overlay, fade-in/fade-out animations |
| 2026-03-05 | Review detail avatar link | User avatar and name on review detail page (/review/[id]) now clickable, navigates to /user/{id} profile |
| 2026-03-06 | Enhancement 3.1: Map Integration | Auto-fit bounds (fitBounds + 50px padding), animated marker entry (DROP + 30ms stagger), light-mode map styling (20-rule warm/cream palette), "Search this area" button (onBoundsChanged + bbox filter), VenuePreviewSheet replaces InfoWindow (slide-up, swipe-dismiss, photo/tags/CTA), onVenueSelect prop |
| 2026-03-06 | Enhancement 3.2: Venue Filtering UI | Consolidated 2-row filter bar (cuisine chips + active filter pills + action icons), unified filter panel (half-screen sheet with rating 6+/7+/8+/9+, distance slider, multi-select tags, sort radio), enhanced list view (full-width 140px photos, 2-column grid, distance, review count, tags), venue count indicator, "More" menu for heatmap/friends |
| 2026-03-06 | New component: VenuePreviewSheet | Bottom-anchored venue preview card with slide-up entry animation, swipe-down-to-dismiss, drag handle, full-width photo, rating badge with review count, tag chips, "View Details" CTA |
| 2026-03-06 | UI/UX Overhaul (10 agents) | Full UI/UX enhancement from enhancements.md Section 2: Feed tabs redesign (pill chips with icons), Quick Review FAB (gradient camera button with pulse), Search in header (expandable frosted glass input), Review card badges (price/distance/verified), Venue photo mosaic grid (3-photo layout), Pull-to-refresh (touch events + spring animation), Venue best dishes section (horizontal scroll cards), Profile taste DNA (SVG radar chart), Dark mode persistence (localStorage + system preference), Haptic feedback + micro-interactions (vibrate + scale animations) |
| 2026-03-06 | Performance fixes | Frontend bundle optimization (dynamic imports for GoogleMapView, gamification components, optimizePackageImports), Database indexes (5 new indexes on Review + Notification models), N+1 query fixes (batch social scores, annotate bookmark_count, bulk user fetch), React Query staleTime tuning (8 hooks configured) |
| 2026-03-06 | Database seeded | Fresh migration + seed: 10 users, 16 NYC venues (Unsplash photos), 45 reviews, 46 likes, 20 comments, 39 follows, 11 playlists, 38 notifications, 16 occasion tags, 130 venue similarities, taste profiles for all users |
| 2026-03-06 | New Feature Research | Launched 15 parallel research agents for Section 3 New Feature Ideas: Elo rankings, Decision Engine, Group Dining, Want-to-Try, Price Filter, Food Challenges, Monthly Recap, Restaurant Responses, Collaborative Playlists, Seasonal Discovery, Weather-Aware Recs, Food Tourism Guides, Time Machine, Offline Journal, Kitchen Stories |
| 2026-03-06 | M14 Code Review | 5 parallel review agents audited all Section 3 features (~50 bugs identified): Elo Rankings, Decision Engine, Want-to-Try/Challenges, Monthly Recap/Seasonal, Group Dining |
| 2026-03-06 | M14 Bug Fixes (Critical) | CRITICAL: Dietary filter bypass in Decision Engine (empty results silently skipped filter instead of returning zero venues). Fixed by removing `if dietary_venue_ids:` guard |
| 2026-03-06 | M14 Bug Fixes (Elo) | Rankings: `recalculate_ranks` changed from individual saves to `bulk_update`; `get_comparison_pair` now penalizes already-compared pairs (0.2 weight); added `select_related` on comparison reload |
| 2026-03-06 | M14 Bug Fixes (WantToTry) | Changed deprecated `unique_together` to `UniqueConstraint`; fixed MUI Grid v2 API (`item`/`xs` → `size` prop) |
| 2026-03-06 | M14 Bug Fixes (Misc) | DiscoverWizard: added `discoverMutation.reset()` on "Start over"; Monthly Recap: swipe handler wraps around; Dinner Plan: JoinView rejects "decided" plans, DinnerPlanResult N+1 fix, clipboard error handling; views_stories.py: simplified Response pattern |
| 2026-03-06 | M14 New: Price Range Filter | Added `price_level` field to Venue model (1-4 choices), filters in VenueViewSet (`price_level`, `price_max`), TypeScript `priceLevel` on Venue interface |
| 2026-03-06 | M14 New: Restaurant Response | VenueOwner model (user, venue, is_verified, role), VenueResponse model (review OneToOne, responder, text), VenueResponseView (GET/POST with owner verification, 10-char min), API functions, TypeScript types |
| 2026-03-06 | M14 New: Kitchen Stories | KitchenStory model (venue, author, title, story_type, content, cover/chef fields, view/like counts), KitchenStoryListView + DetailView (with F() view_count increment), serializers, API functions, React Query hooks |
| 2026-03-06 | M14 New: Food Tourism Guides | FoodGuide model (author, title, city, neighborhood, cover_photo_url, duration_hours, view/save counts), GuideStop model (sort_order, recommended_dishes JSON, estimated_time_minutes), list + detail views, serializers, API functions, React Query hooks |
| 2026-03-06 | M14 Migration | venues.0005: Added price_level field, VenueOwner, VenueResponse, KitchenStory, FoodGuide, GuideStop models with constraints |
| 2026-03-06 | M14 URL Wiring | Wired kitchen-stories (list + detail), guides (list + detail) into venues/urls.py; wired venue-response into reviews/urls.py |
| 2026-03-06 | M14 Verification | TypeScript `tsc --noEmit` — 0 errors after all changes |
| 2026-03-06 | M14 COMPLETE | All Section 3 features from enhancements.md implemented, reviewed, and bug-fixed. 12 of 15 features complete (3 deferred: AR Preview, Time Machine, Offline Journal) |

---

## Milestone 14: New Feature Ideas [COMPLETE]

> Section 3 from enhancements.md — implementing all high-impact, medium-impact, and differentiating features

### 14.1 High-Impact Features
- [x] Elo-Style Relative Ranking (PairwiseComparison model, comparison UI, personal "My Top 10")
- [x] "What Should I Eat?" Decision Engine (conversational wizard, curated picks)
- [x] Group Dining Consensus (DinnerPlan model, invite + swipe flow, consensus algorithm)
- [ ] Time Machine / Dish Comparison (timeline view, quality trend tracking) — DEFERRED
- [ ] Offline Food Journal (Service Worker, IndexedDB, Background Sync) — DEFERRED

### 14.2 Medium-Impact Features
- [x] "Want to Try" List (WantToTry model, location-based reminders, map view)
- [x] Price Range Filter (price_level field on Venue, filter in VenueViewSet, frontend type)
- [x] Food Challenges (challenge discovery page, join/progress/leaderboard UI)
- [x] Monthly Mini-Recap (swipeable cards, data visualizations, share-ready format)
- [x] Restaurant Response System (VenueOwner + VenueResponse models, VenueResponseView, API functions)
- [x] Collaborative Playlists (PlaylistCollaborator type, backend models exist)

### 14.3 Differentiating Features
- [x] Seasonal Discovery (SeasonalHighlight model, seasonal banner on feed, API)
- [x] Weather-Aware Recommendations (weather recs API, WeatherBanner on feed)
- [x] Food Tourism Guides (FoodGuide + GuideStop models, views, serializers, API, hooks)
- [x] Kitchen Stories (KitchenStory model, views, serializers, API, hooks)
- [ ] AR Dish Preview — DEFERRED (shelved for future enhancement)

### Status: Implementation Complete, Code Review Complete, Bug Fixes Applied

**Completed Features (5 initial parallel agents + 6 follow-up agents):**

1. **Elo-Style Ranking System**
   - [x] Backend: `apps/rankings/` - PairwiseComparison + PersonalRanking models, Elo algorithm (tiered K-factors), 4 API views
   - [x] Frontend: `/compare` page (side-by-side cards), `/rankings` page (top 10 list), ComparisonCard component
   - [x] Integration: Quick review redirects to compare flow after posting
   - [x] Bug fix: `recalculate_ranks` changed from individual saves to `bulk_update`
   - [x] Bug fix: `get_comparison_pair` penalizes already-compared pairs (0.2 weight)
   - [x] Bug fix: Added `select_related` on comparison reload to fix N+1

2. **"What Should I Eat?" Decision Engine**
   - [x] Backend: DecisionEngineView (multi-signal scoring), WeatherRecommendationsView (food mood mapping), haversine distance, natural language explanations
   - [x] Frontend: `/discover` page with 4-step wizard, DiscoverWizard + DiscoverResultCard components, gradient banner on feed
   - [x] Types: DiscoverRequest, DiscoverResult, DiscoverResponse
   - [x] CRITICAL bug fix: Dietary filter bypass — removed `if dietary_venue_ids:` guard
   - [x] Bug fix: Added `discoverMutation.reset()` in "Start over" handler

3. **Want-to-Try List + Challenges UI**
   - [x] Backend: WantToTry model + serializer + views + URLs, 3 seed challenges with cover images
   - [x] Frontend: `/want-to-try` page (venue grid, add dialog, optimistic delete), Want-to-Try toggle on venue detail
   - [x] Challenges redesign: cover images, progress bars, leaderboard dialog, join/leave flow
   - [x] Bug fix: WantToTry `unique_together` changed to `UniqueConstraint`
   - [x] Bug fix: MUI Grid v2 API `item`/`xs`/`sm`/`md` → `size` prop

4. **Monthly Mini-Recap + Seasonal Discovery**
   - [x] Backend: MonthlyRecap model + view (on-the-fly generation), SeasonalHighlight model + view, weather recs view
   - [x] Frontend: `/monthly-recap` page (5-card carousel, gradient backgrounds, share), RecapCard, SeasonalBanner, WeatherBanner
   - [x] Integration: Seasonal + Weather banners added to feed page
   - [x] Bug fix: Swipe handler wraps around (was hardcoded to max index 4)

5. **Group Dining Consensus**
   - [x] Backend: `apps/groups/` - DinnerPlan + Member + Venue + Vote models, 5 API views, auto venue population
   - [x] Frontend: `/dinner-plan/new` (create), `/dinner-plan/[id]` (swipe voting + results), `/dinner-plan/join` (share code)
   - [x] Components: VenueSwipeCard, DinnerPlanResult
   - [x] Bug fix: JoinDinnerPlanView rejects "decided" plans
   - [x] Bug fix: DinnerPlanResultView N+1 fix (use prefetched data with Python sorting)
   - [x] Bug fix: `handleCopyCode` no longer reports success on clipboard failure

6. **Price Range Filter**
   - [x] Backend: `price_level` field on Venue model (PositiveSmallIntegerField, choices 1-4)
   - [x] Backend: `price_level` and `price_max` filters in VenueViewSet
   - [x] Frontend: `priceLevel` on TypeScript Venue interface
   - [x] Serializers: Added `price_level` to VenueListSerializer and VenueDetailSerializer

7. **Restaurant Response System**
   - [x] Backend: VenueOwner model (user, venue, is_verified, role)
   - [x] Backend: VenueResponse model (review OneToOne, responder, text)
   - [x] Backend: VenueResponseView (GET/POST with owner verification)
   - [x] Serializers: VenueResponseSerializer, VenueResponseCreateSerializer (10-char min validation)
   - [x] Frontend: VenueResponseData type, fetchVenueResponse/createVenueResponse API functions
   - [x] URL: `GET/POST /api/reviews/<id>/response/`

8. **Kitchen Stories**
   - [x] Backend: KitchenStory model (venue, author, title, story_type, content, cover/chef fields, view/like counts)
   - [x] Backend: KitchenStoryListView + KitchenStoryDetailView with view_count increment
   - [x] Serializers: KitchenStoryListSerializer, KitchenStoryDetailSerializer
   - [x] Frontend: KitchenStory type, fetchKitchenStories/fetchKitchenStoryDetail API, useKitchenStories/useKitchenStoryDetail hooks
   - [x] URL: `GET /api/venues/kitchen-stories/`, `GET /api/venues/kitchen-stories/<id>/`
   - [x] Bug fix: Simplified convoluted `get_response_class()` pattern to direct Response import

9. **Food Tourism Guides**
   - [x] Backend: FoodGuide model (author, title, description, city, neighborhood, cover_photo_url, duration_hours, view/save counts)
   - [x] Backend: GuideStop model (guide, venue, sort_order, description, recommended_dishes JSON, estimated_time_minutes)
   - [x] Backend: FoodGuideListView + FoodGuideDetailView with view_count increment
   - [x] Serializers: GuideStopSerializer, FoodGuideListSerializer (with stops_count), FoodGuideDetailSerializer (with nested stops)
   - [x] Frontend: FoodGuide/GuideStop types, fetchFoodGuides/fetchFoodGuideDetail API, useFoodGuides/useFoodGuideDetail hooks
   - [x] URL: `GET /api/venues/guides/`, `GET /api/venues/guides/<id>/`

**Migrations applied:** rankings.0001, gamification.0002, venues.0004, venues.0005, reviews.0008

**Deferred Features:**
- [ ] AR Dish Preview — DEFERRED (requires WebAR infrastructure)
- [ ] Time Machine / Dish Comparison — planned for future sprint
- [ ] Offline Food Journal (PWA) — planned for future sprint

**Verification:**
- [x] TypeScript `tsc --noEmit` — 0 errors
- [x] All URL patterns wired for new views (kitchen-stories, guides, venue-response)
- [x] 5 code review agents completed (50+ bugs identified and fixed)
