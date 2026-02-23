# Delectable - Development Progress Tracker

> Last updated: 2026-02-23

---

## Overall Status

| Milestone | Status | Progress |
|-----------|--------|----------|
| M1: Front-End Foundations | COMPLETE | 100% |
| M2: UI Polish & State Management | IN PROGRESS | 15% |
| M3: Google Maps & Location Filtering | NOT STARTED | 0% |
| M4: Backend MVP & Data Storage | NOT STARTED | 0% |
| M5: Deployment, CI/CD & Containerization | NOT STARTED | 0% |
| M6: AI Recommendation & Quality Filtering | NOT STARTED | 0% |

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

## Milestone 2: UI Polish & State Management [IN PROGRESS]

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
- [ ] Expand `mockApi.ts` with async mock endpoint functions (Promise.resolve + setTimeout)
- [ ] Create React Query hook: `useUser()`
- [ ] Create React Query hook: `useReviews(filters?)`
- [ ] Create React Query hook: `usePlaylists(userId?)`
- [ ] Create React Query hook: `useVenues(bounds?, filters?)`
- [ ] Create React Query hook: `usePlaylistDetail(id)`
- [ ] Replace hardcoded feed data with `useReviews()` hook
- [ ] Replace hardcoded profile data with `useUser()` hook
- [ ] Replace hardcoded playlist data with `usePlaylistDetail()` hook
- [ ] Create `AuthContext` for user session management (stub)
- [ ] Create `UserPreferencesContext` for settings

### 2.3 Forms & Validation
- [ ] Install `react-hook-form`, `yup`, `@hookform/resolvers`
- [ ] Build "New Review" form page (`/review/new`) — matching app design language:
  - [ ] Venue autocomplete (Classy Pen header, peach accent)
  - [ ] Rating selector (0-10 scale, 0.1 increments)
  - [ ] Photo upload with preview (full-bleed card preview)
  - [ ] Tag multi-select (same chip style as ReviewCard: pink bg, peach text)
  - [ ] Yup validation schema
- [ ] Build "New Playlist" form page (`/playlist/new`) — wire up form logic
- [ ] Build "Edit Profile" form page (`/profile/edit`)

### 2.4 Styling Consistency & Design Conformance
- [ ] Audit typography: ensure all pages follow scale (38px logo, 32px greeting, 28px rating, 20px venue, etc.)
- [ ] Audit colors: replace all hardcoded hex with theme tokens
- [ ] Audit spacing: standardize to MUI 8px grid
- [ ] Audit border-radius: cards=32px, pills=48px, carousels=24px, chips=16px
- [ ] Responsive testing: 360px mobile, 768px tablet, 1024px+ desktop
- [ ] WCAG AA audit: contrast ratios, ARIA labels, keyboard nav, focus indicators
- [ ] Verify frosted glass effects render correctly across browsers (backdrop-filter support)

### 2.5 Navigation Flows
- [ ] Create `useRequireAuth()` hook for route protection
- [ ] Apply route protection to authenticated pages
- [ ] Add back button to detail pages (playlist detail, venue detail) — styled with app design
- [ ] Verify deep linking for `playlist/[id]` and future `review/[id]` pages
- [ ] Create branded 404 page (use "de." logo, Classy Pen, peach accent)

### 2.6 Missing Pages (matching design language)
- [x] `/notifications` page — notification items with avatars, action text, timestamps, unread dots
- [ ] `/review/new` page — review creation form with live card preview
- [x] `/playlist/new` page — playlist creation with venue search
- [ ] `/profile/edit` page — avatar upload, name, bio, cuisine prefs
- [ ] `/search` page or overlay — search input, autocomplete, grouped results
- [ ] `/404` not found page — branded with "de." logo

---

## Milestone 3: Google Maps & Location Filtering [NOT STARTED]

### 3.1 Enhanced Map Integration
- [x] Replace hardcoded 2-venue `venueCoords` array with all 6 venues (done during M1 bug fixes)
- [ ] Install and configure `@googlemaps/markerclusterer`
- [ ] Design custom SVG marker icons per venue type (matching peach/coral color scheme)
- [ ] Implement user geolocation (blue dot)
- [ ] Map bounds-based venue fetching on pan/zoom

### 3.2 Venue Filtering UI (overlaid on map, matching design language)
- [ ] POI type toggle chips (same chip style as ReviewCard tags: pink bg, peach text, 16px radius)
- [ ] Radius slider with translucent circle overlay on map
- [ ] Tag-based search input with autocomplete
- [ ] Minimum rating filter slider
- [ ] Sort options (distance, rating, recency)

### 3.3 Map-List Synchronization
- [x] Custom floating mini-card on marker click (replace default Google InfoWindow) — done during M1 bug fixes
  - [x] Must match app design: rounded corners (16px), shadow, photo thumbnail, peach accent
- [ ] Mini-card to venue detail navigation
- [ ] Map/List view toggle
- [ ] List view with venue cards (same visual style as ReviewCard)
- [ ] Create venue detail page (`/venue/[id]`)
  - [ ] Hero photo carousel (PhotoCarousel component, matching existing 24px radius)
  - [ ] Venue info section (name, cuisine, rating, location)
  - [ ] Reviews section (reuse ReviewCard component)
  - [ ] "Add to Playlist" + "Write Review" CTAs (peach primary buttons)
  - [ ] Related/nearby venues

---

## Milestone 4: Backend MVP & Data Storage [NOT STARTED]

### 4.1 Django Project Setup
- [ ] Initialize Django 5.x project with DRF
- [ ] Configure djangorestframework-simplejwt
- [ ] Set up PostgreSQL connection
- [ ] Set up Redis connection
- [ ] Set up ElasticSearch connection
- [ ] Configure CORS for Next.js frontend

### 4.2 Database Models
- [ ] Users model with profile fields
- [ ] Follows model (many-to-many self-referential)
- [ ] Venues model with location/type fields
- [ ] Reviews model with photos/tags (JSONB)
- [ ] ReviewLikes model
- [ ] Comments model
- [ ] Playlists model
- [ ] PlaylistItems model with ordering
- [ ] Tags lookup table
- [ ] Notifications model
- [ ] Run initial migrations

### 4.3 API Endpoints
- [ ] Auth endpoints (register, login, refresh, logout, me)
- [ ] User CRUD endpoints
- [ ] Follow/unfollow endpoints
- [ ] Venue list/detail/search/nearby endpoints
- [ ] Review CRUD + like/comment endpoints
- [ ] Playlist CRUD + item management endpoints
- [ ] Feed endpoint with cursor-based pagination
- [ ] Unified search endpoint

### 4.4 Frontend Integration
- [ ] Set up Axios interceptors for JWT auth
- [ ] Replace mock API functions with real API calls
- [ ] Implement token refresh logic
- [ ] Connect login page to auth API
- [ ] Connect feed to feed API
- [ ] Connect map to venues API
- [ ] Connect profile to users API
- [ ] Connect playlists to playlists API
- [ ] Connect search to search API

### 4.5 Caching & Search
- [ ] Configure Redis caching for sessions and hot data
- [ ] Set up ElasticSearch indices (venues, reviews, users)
- [ ] Implement full-text search with autocomplete
- [ ] Implement geo-queries for map bounds

---

## Milestone 5: Deployment, CI/CD & Containerization [NOT STARTED]

### 5.1 Dockerization
- [ ] Create Next.js Dockerfile (multi-stage)
- [ ] Create Django Dockerfile
- [ ] Create docker-compose.yml (frontend, backend, postgres, redis, elasticsearch)
- [ ] Create .env.example with all required variables
- [ ] Test local development with Docker Compose
- [ ] Add health check endpoints

### 5.2 Kubernetes
- [ ] Create Deployment manifests (frontend, backend)
- [ ] Create Service manifests
- [ ] Create Ingress manifest with TLS
- [ ] Create ConfigMaps and Secrets
- [ ] Create HorizontalPodAutoscaler
- [ ] Create PersistentVolumeClaims

### 5.3 CI/CD (GitHub Actions)
- [ ] PR workflow: lint + type-check + test + build
- [ ] Main branch workflow: build + push Docker images + deploy staging
- [ ] Release workflow: deploy production + run migrations
- [ ] Set up AWS ECR repository
- [ ] Set up EKS cluster (or alternative)

---

## Milestone 6: AI Recommendation & Quality Filtering [NOT STARTED]

### 6.1 Data Ingestion
- [ ] Google Maps Places API integration for venue seeding
- [ ] ETL pipeline: extract, transform, load
- [ ] Periodic sync job (Celery + Redis)
- [ ] Data quality validation

### 6.2 ML Models
- [ ] Review authenticity classifier (DistilBERT fine-tuned)
- [ ] Venue ranking algorithm (hybrid collaborative + content-based)
- [ ] Personalized feed ranker
- [ ] Model training pipeline
- [ ] Model serving infrastructure

### 6.3 Integration
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
