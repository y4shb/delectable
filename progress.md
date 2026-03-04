# Delectable - Development Progress Tracker

> Last updated: 2026-03-04

---

## Overall Status

| Milestone | Status | Progress |
|-----------|--------|----------|
| M1: Front-End Foundations | COMPLETE | 100% |
| M2: UI Polish & State Management | COMPLETE | 100% |
| M3: Google Maps & Location Filtering | COMPLETE | 95% |
| M4: Backend MVP & Data Storage | COMPLETE | 100% |
| M5: Social Features & Content Interaction | NOT STARTED | 0% |
| M6: Feed Intelligence & Personalization | NOT STARTED | 0% |
| M7: Enhanced Search & Discovery | NOT STARTED | 0% |
| M8: Onboarding & Growth | NOT STARTED | 0% |
| M9: Notifications & Real-Time | NOT STARTED | 0% |
| M10: Gamification & Retention | NOT STARTED | 0% |
| M11: Sharing & Virality | NOT STARTED | 0% |
| M12: Deployment & Infrastructure | NOT STARTED | 0% |
| M13: AI, ML & Advanced Intelligence | NOT STARTED | 0% |

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
- [x] **ReviewCard** — Full-bleed photo (aspect 0.8, min 450px), gradient overlay, IntersectionObserver auto-expand, CSS heart shape with like count, expandable tags/text
- [x] **WelcomeSection** — "Hi Yash!" (32px Classy Pen, primary), pill-shaped tabs (Top Picks, Recent, Collections, Explore)
- [x] **Map page** — Full-screen fixed Google Maps, dark mode style array, body overflow hidden
- [x] **GoogleMapView** — Interactive with 6 markers, custom InfoWindow mini-card, bounds-based visibility, zoom control only
- [x] **Profile page** — 80px avatar, name, level badge, followers/following, bio, Reviews/Playlists/Map tabs
- [x] **Playlist detail** — Full-bleed photo cards with gradient overlays, venue info, matching ReviewCard design
- [x] **Login page** — Branded with "de." logo (Classy Pen 56px), tagline, rounded inputs, pill button
- [x] **PhotoCarousel** — Image viewer with dot indicators, ARIA roles
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
- [ ] Install and configure `@googlemaps/markerclusterer`
- [x] Design custom SVG marker icons per venue type — cuisine-specific pin markers (Japanese=coral/sushi, Italian=red/pizza, American=amber/burger, European=golden/croissant, Experimental=teal/flask)
- [x] Implement user geolocation (blue dot) — MyLocation FAB, navigator.geolocation, blue circle SVG marker
- [x] Map bounds-based venue fetching — filteredVenues with cuisine/rating filters applied via props

### 3.2 Venue Filtering UI (overlaid on map, matching design language)
- [x] POI type toggle chips — cuisine chips (Japanese, Italian, American, European, Experimental) in floating frosted-glass filter bar
- [ ] Radius slider with translucent circle overlay on map
- [ ] Tag-based search input with autocomplete
- [x] Minimum rating filter — "8+" star chip toggle in filter bar
- [ ] Sort options (distance, rating, recency)

### 3.3 Map-List Synchronization
- [x] Custom floating mini-card on marker click (replace default Google InfoWindow) — done during M1 bug fixes
  - [x] Must match app design: rounded corners (16px), shadow, photo thumbnail, peach accent
- [x] Mini-card to venue detail navigation — InfoWindow wrapped in Link to `/venue/[id]`, close button prevents propagation
- [x] Map/List view toggle — Map/List icons in filter bar, toggles between GoogleMapView and scrollable list
- [x] List view with venue cards — venue photo (48px rounded), name, cuisine, location, rating, links to venue detail
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

## Milestone 6: Feed Intelligence & Personalization [NOT STARTED]

### 6.1 Feed Scoring Algorithm
- [ ] EdgeRank-style feed_score() function (Social 0.30, Engagement 0.25, Preference 0.25, Quality 0.20)
- [ ] Time decay: `(age_hours + 2)^1.5`
- [ ] Precompute quality_score on review save
- [ ] UserAffinity table for cached social signals
- [ ] PostgreSQL window functions for engagement percentiles

### 6.2 Explore Tab & Trending
- [ ] Explore feed 3-stage pipeline (candidate generation → scoring → diversity)
- [ ] TrendingEngine: Z-score anomaly + velocity + exponential decay scoring
- [ ] VenueTrendingScore model (recomputed every 30 min via Celery beat)
- [ ] Trending section in explore tab UI

### 6.3 Cold-Start Handling
- [ ] 4-tier feed fallback (Anonymous → Cold Start → Augmented → Healthy)
- [ ] UserTasteProfile model (preferred_cuisines, dietary_restrictions, maturity_level)
- [ ] Auto-follow 3-5 curated tastemaker accounts on signup
- [ ] Tier detection logic in feed view

### 6.4 Diversity Enforcement (MMR)
- [ ] MMR re-ranking algorithm (lambda=0.7)
- [ ] Similarity function (same-venue 0.5, same-cuisine 0.3, same-user 0.2)
- [ ] Hard rules: max 2 same-venue, 4 same-cuisine, 3 same-user in top 20

---

## Milestone 7: Enhanced Search & Discovery [NOT STARTED]

### 7.1 Dish as First-Class Entity
- [ ] Dish model (venue FK, name, category, avg_rating, review_count, search_vector)
- [ ] Review model update: add dish FK, remove UniqueConstraint(user, venue)
- [ ] Dish-level pages: `/dish/[id]`
- [ ] Dish search API: `GET /api/dishes/?q=...`

### 7.2 Occasion Tags
- [ ] OccasionTag model (slug, label, emoji, category)
- [ ] VenueOccasion model (venue, occasion, vote_count)
- [ ] OccasionVote model (user, venue, occasion)
- [ ] Seed predefined taxonomy (Date Night, Group Dinner, Brunch, etc.)
- [ ] "Perfect For" section on venue detail page
- [ ] Occasion voting UI (tap to agree)
- [ ] API: `POST /api/venues/{id}/occasions/{slug}/vote/`

### 7.3 Dietary Filtering
- [ ] DietaryReport model (venue, user, category, scope, dish, is_available, confidence)
- [ ] Confidence scoring aggregation
- [ ] Dietary filter chips on venue list and search
- [ ] Dietary badges on venue cards (confidence >= 0.7)

### 7.4 Map Enhancements
- [ ] Friends' venues layer with avatar cluster dots
- [ ] Heatmap visualization (deck.gl HeatmapLayer)
- [ ] Toggle between markers and heatmap view
- [ ] Collaborative filtering: venue_similarity materialized view
- [ ] `GET /api/venues/{id}/similar/` endpoint
- [ ] Daily materialized view refresh via Celery

### 7.5 AI-Powered Search (Optional)
- [ ] Conversational search with OpenAI function calling (GPT-4o-mini)
- [ ] Keyword-based regex parser fallback
- [ ] Search query extraction: cuisine, occasion, radius, price

---

## Milestone 8: Onboarding & Growth [NOT STARTED]

### 8.1 Content-First Onboarding
- [ ] ReadPublicWriteAuthenticated permission class
- [ ] Apply to feed, venue, review list, search, explore endpoints
- [ ] AuthGate frontend component (wraps interactive elements, shows signup prompt)
- [ ] Next.js middleware for partial auth (allow /feed, /venue/*, /review/* unauthenticated)
- [ ] Anonymous feed fallback (popular/trending, no social signal)

### 8.2 Taste Profile Wizard
- [ ] Create `/onboarding` page with 3-step flow
- [ ] Step 1: Visual emoji cuisine grid (multi-select, min 3, max 8)
- [ ] Step 2: Dietary preference toggle chips
- [ ] Step 3: Suggested tastemaker accounts to follow
- [ ] Skip behavior with sensible defaults
- [ ] Redirect to /onboarding after registration

### 8.3 Progressive Feature Disclosure
- [ ] Maturity level tracking (0-5) based on user activity
- [ ] FeatureGate component (renders children if user meets level)
- [ ] LockedFeaturePrompt component with progress info
- [ ] Contextual nudge messages for next actions

### 8.4 First Post Wizard
- [ ] QuickReviewView: simplified 3-field form (photo, venue, rating)
- [ ] QuickReviewSerializer with relaxed validation
- [ ] Photo-first flow with Google Places autocomplete
- [ ] Celebration animation on first review submission

---

## Milestone 9: Notifications & Real-Time [NOT STARTED]

### 9.1 Notification System Overhaul
- [ ] Expand Notification model (actor, priority, channel, group_key fields)
- [ ] Add notification types: mention, trending, streak, badge, nudge, digest
- [ ] Notification bundling service (group by group_key within 1-hour window)
- [ ] Frequency caps (max 10/hour per user, max 3 same type/hour)
- [ ] Smart timing: suppress during quiet hours, deliver at 7 AM

### 9.2 Real-Time Badge Updates (SSE)
- [ ] BadgeStreamView SSE endpoint (`GET /api/notifications/stream/`)
- [ ] Polling fallback: `GET /api/notifications/unread-count/`
- [ ] Frontend EventSource API with auto-reconnect
- [ ] Tab bar badge indicator for unread count

### 9.3 Smart Nudges
- [ ] NearbySavedVenuesView: `GET /api/venues/nearby-saved/?lat=&lng=&radius=500`
- [ ] Location-based push notifications ("You're near {venue}!")
- [ ] VenueSaveReminder model for want-to-try follow-ups (7-day trigger)
- [ ] Re-engagement nudges from friend activity

### 9.4 Weekly Digest
- [ ] Celery beat task (Sunday 10 AM per timezone)
- [ ] Digest content: top reviews, trending venues, streak status, badge progress
- [ ] In-app notification + optional email delivery

### 9.5 Notification Preferences
- [ ] NotificationPreference model (per-category frequency, push/email toggles, quiet hours)
- [ ] Preference center UI page with toggles and frequency selectors
- [ ] Quiet hours picker

---

## Milestone 10: Gamification & Retention [NOT STARTED]

### 10.1 XP & Level System
- [ ] UserXP model (total_xp, level 1-20)
- [ ] XPTransaction audit log model
- [ ] XP awards: review 100, photo +50, comment 25, like 15/10, streak 50, badge 200
- [ ] Level formula: `XP = 75 * level^1.8` (20 levels)
- [ ] Level-up full-screen animation + notification

### 10.2 Dining Streaks
- [ ] DiningStreak model (current_streak, longest_streak, streak_freezes, timezone)
- [ ] Timezone-aware day tracking with 4-hour grace period
- [ ] Streak freeze system (earned every 7 days, max 2 banked)
- [ ] Weekly flexible mode (5 of 7 days)
- [ ] GitHub-style contribution grid on profile

### 10.3 Achievement Badges
- [ ] Badge definition system (8 categories × 4 tiers)
- [ ] Badge progress tracking and unlock detection
- [ ] Unlock notifications with shimmer animation
- [ ] Profile badge shelf with locked/unlocked states

### 10.4 Leaderboards
- [ ] LeaderboardEntry model (board_type, period, score, rank)
- [ ] Redis sorted sets for real-time ranking
- [ ] Leaderboard views: city, friends, cuisine-specific
- [ ] Weekly/monthly/all-time period switching

### 10.5 Year in Review ("de. Wrapped")
- [ ] WrappedStats model (annual statistics generation)
- [ ] Celery task for December 31 computation
- [ ] Swipeable card carousel UI (5-7 animated cards)
- [ ] Shareable image cards (reuse M11 share system)
- [ ] UserStatsCache model for activity dashboard (refreshed daily)

---

## Milestone 11: Sharing & Virality [NOT STARTED]

### 11.1 Share Card Generation
- [ ] Django Pillow backend for server-side share image generation
- [ ] Platform-specific sizes (Instagram Story/Feed, Twitter, OG)
- [ ] Next.js `@vercel/og` edge function for OG images
- [ ] Share button with Web Share API + clipboard fallback

### 11.2 Deep Linking
- [ ] Universal Links: `/.well-known/apple-app-site-association`
- [ ] App Links: `/.well-known/assetlinks.json`
- [ ] Web fallback with OG meta tags on all shareable pages
- [ ] DeferredDeepLink model for attribution tracking

### 11.3 Referral Program
- [ ] InviteCode model (code, user, max_uses, use_count)
- [ ] Referral model (inviter, invitee, status: signed_up/activated/churned)
- [ ] ReferralReward model (reward_type, tier, claimed)
- [ ] Two-sided rewards (inviter + invitee)
- [ ] K-factor tracking (invites × conversion rate)
- [ ] Tiered incentives (3/10/25 referrals)

### 11.4 Collaborative Playlists
- [ ] PlaylistCollaborator model (playlist, user, role: editor/viewer)
- [ ] Playlist model additions: slug, share_code, fork_count
- [ ] Share via link: `delectable.app/playlist/{slug}`
- [ ] Fork functionality with attribution
- [ ] Activity feed within playlist

### 11.5 Food Challenges
- [ ] Challenge model (title, rules, dates, target_count, cuisine_filter, rewards)
- [ ] ChallengeParticipant model (progress, completed)
- [ ] ChallengeSubmission model (review FK, verified)
- [ ] Redis sorted set leaderboard per challenge
- [ ] Challenge discovery page: `/challenges`
- [ ] Challenge validation service

---

## Milestone 12: Deployment & Infrastructure [NOT STARTED]

### 12.1 Dockerization
- [ ] Create Next.js Dockerfile (multi-stage)
- [ ] Create Django Dockerfile
- [ ] Create docker-compose.yml (frontend, backend, postgres, redis, elasticsearch)
- [ ] Create .env.example with all required variables
- [ ] Test local development with Docker Compose
- [ ] Add health check endpoints

### 12.2 Kubernetes
- [ ] Create Deployment manifests (frontend, backend)
- [ ] Create Service manifests
- [ ] Create Ingress manifest with TLS
- [ ] Create ConfigMaps and Secrets
- [ ] Create HorizontalPodAutoscaler
- [ ] Create PersistentVolumeClaims

### 12.3 CI/CD (GitHub Actions)
- [ ] PR workflow: lint + type-check + test + build
- [ ] Main branch workflow: build + push Docker images + deploy staging
- [ ] Release workflow: deploy production + run migrations
- [ ] Set up AWS ECR repository
- [ ] Set up EKS cluster (or alternative)

---

## Milestone 13: AI, ML & Advanced Intelligence [NOT STARTED]

### 13.1 Data Ingestion
- [ ] Google Maps Places API integration for venue seeding
- [ ] ETL pipeline: extract, transform, load
- [ ] Periodic sync job (Celery + Redis)
- [ ] Data quality validation

### 13.2 ML Models
- [ ] Review authenticity classifier (DistilBERT fine-tuned)
- [ ] Venue ranking algorithm (hybrid collaborative + content-based)
- [ ] Personalized feed ranker
- [ ] Model training pipeline
- [ ] Model serving infrastructure

### 13.3 Integration
- [ ] Recommendation API endpoint
- [ ] ML-scored feed endpoint
- [ ] "Trusted Review" badge UI
- [ ] Trending venue/dish detection
- [ ] Recommendation explanation text in UI

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
