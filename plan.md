# Delectable - Comprehensive Development Plan

## 1. Project Overview

**Delectable** ("de.") is an AI-powered mobile-first web application for food enthusiasts to discover, curate, and share restaurant and dish experiences. It combines the discovery features of Zomato/Swiggy, the social engagement of Instagram, and the playlist-style curation of Spotify.

### Core Value Proposition
- Users create themed "playlists" of dishes/restaurants with photos and geotags
- Social feed showing friends' reviews, playlists, and AI-curated spotlights
- AI-powered venue and dish recommendations based on user history, social graph, and seasonal trends
- Map-based venue discovery with real-time filtering

---

## 2. Current State Analysis (as of code audit)

### Technology Stack In Use
| Layer | Technology | Version |
|-------|-----------|---------|
| Framework | Next.js (Pages Router) | 15.3.5 |
| Language | TypeScript | 5.8.3 |
| UI Library | Material UI (MUI) | 7.2.0 |
| CSS-in-JS | Emotion (@emotion/react, @emotion/styled, @emotion/server) | 11.x |
| Server State | React Query (@tanstack/react-query) | 5.81.5 |
| HTTP Client | Axios | 1.10.0 |
| Maps | @react-google-maps/api | 2.20.7 |
| Fonts | Inter (Google), Classy Pen (custom TTF) | - |

### Design System
- **Primary Color**: `#F24D4F` (peach/red accent)
- **Secondary Color**: `#FFD36E` (yellow accent)
- **Background (Light)**: `#faf9f6` / Paper: `#fff`
- **Background (Dark)**: `#111216` / Paper: `#18191c`
- **Border Radius**: 20px (global), cards use 4 (32px)
- **Typography**: Inter family, weights 400-700
- **Brand Font**: "Classy Pen" for "de." branding

### Files & Architecture
```
src/
├── api/
│   └── mockApi.ts              # Mock data (User, Reviews, Playlists, Venues)
├── components/
│   ├── BottomTabBar.tsx         # Floating pill-shaped 5-tab nav
│   ├── GoogleMapView.tsx        # Interactive Google Maps with markers
│   ├── Header.tsx               # "de." branding, theme toggle, profile icon
│   ├── PhotoCarousel.tsx        # Image carousel with dot indicators
│   ├── ReviewCard.tsx           # Full-bleed photo card with gradient overlay
│   ├── WelcomeSection.tsx       # "Hi {user}!" greeting + feed tabs
│   └── useDarkModeMapUrl.ts     # (Unused) dark mode embed URL generator
├── hooks/
│   └── useDarkMode.ts           # (Unused) system theme detection hook
├── layouts/
│   └── AppShell.tsx             # Main layout: Header + content + BottomTabBar
├── pages/
│   ├── _app.tsx                 # App root: Emotion, React Query, Theme providers
│   ├── _document.tsx            # SSR Emotion style extraction
│   ├── index.tsx                # Redirects to /feed
│   ├── feed.tsx                 # Feed page with welcome section + review cards
│   ├── login.tsx                # Email/password stub (Auth0 placeholder)
│   ├── map.tsx                  # Full-screen Google Maps page
│   ├── profile.tsx              # User profile with tabs
│   └── playlist/
│       └── [id].tsx             # Playlist detail page (basic placeholder)
├── theme/
│   ├── ColorModeContext.tsx      # React Context for dark/light mode
│   └── theme.ts                 # MUI theme factory (light/dark palettes)
├── types/
│   └── index.ts                 # TypeScript interfaces: User, Review, Playlist, Venue
└── createEmotionCache.ts        # Emotion SSR cache factory
```

### What's Working
1. **App Shell**: Responsive layout with auto-hiding header and floating bottom tab bar
2. **Feed Page**: Welcome greeting, tab-based filtering (Top Picks, Recent, Collections, Explore), 4 sample review cards with intersection-observer-based animations
3. **Review Cards**: Full-bleed photo cards with gradient overlay, rating badge, heart/like count, expandable tags and review text on hover/viewport focus
4. **Map Page**: Full-screen interactive Google Maps with dark mode styling, 2 dummy markers, InfoWindow on click
5. **Profile Page**: Static profile with avatar, follower/following counts, bio, Reviews/Playlists/Map tabs
6. **Playlist Detail**: Basic 3-card placeholder layout
7. **Login**: Simple email/password form (no actual auth)
8. **Dark/Light Mode**: Full toggle with themed map styles
9. **SSR**: Emotion styles extracted server-side via _document.tsx

### Known Issues & Gaps
1. Global CSS import is commented out in `_app.tsx` (line 1)
2. `useDarkModeMapUrl.ts` and `useDarkMode.ts` are unused dead code
3. Mock data is hardcoded in `feed.tsx` instead of using `mockApi.ts`
4. Missing pages: `/playlist/new`, `/notifications` (referenced in BottomTabBar)
5. Profile page is entirely static/hardcoded
6. No search functionality
7. No real authentication or route protection
8. No form validation library installed (react-hook-form, Yup)
9. No "New Playlist" or "New Review" creation flows
10. Map has only 2 hardcoded venues/markers
11. No map-to-detail navigation
12. Playlist detail page is a basic placeholder with no real data

---

## 3. Authoritative Design Specification (from code & image assets)

> This section is the single source of truth for the visual design of Delectable.
> All specifications are extracted from the existing codebase and the image assets
> in `public/images/` and `public/icons/`. Any new screens or components MUST
> conform to these patterns exactly.

### 3.1 Brand Identity

#### Logo: "de."
- Rendered in **"Classy Pen"** custom font (`public/fonts/ClassyPenRegular.ttf`)
- The font has a hand-drawn, sketch-hatched texture — each letter appears filled with fine diagonal pen strokes, giving it an artisanal, handcrafted feel
- Logo text is always lowercase: `de.` (the period is part of the mark)
- 7 pre-rendered icon variants exist in `public/icons/`:
  | File | Use Case |
  |------|----------|
  | `Untitled.png` | Primary — peach/coral on warm cream background |
  | `de-icon-classy-pen-peach-light.png` | Peach on light background (alternative) |
  | `de-icon-classy-pen-peach-dark.png` | Peach on dark background |
  | `de-icon-classy-pen-white.png` | White on dark background |
  | `de-icon-classy-pen-bright-white.png` | Bright white on dark background |
  | `de-icon-classy-pen-gray.png` | Dark gray on light background |
  | `de-icon-classy-pen-light-gray.png` | Light gray on light background |

#### Brand Voice
- App name is **"Delectable"**, abbreviated to **"de."** in the UI
- Greeting uses Classy Pen font: "Hi {name}!" — casual, warm, personal
- Tone: premium but approachable, food-obsessed, social

### 3.2 Color System

#### Core Palette
| Token | Light Mode | Dark Mode | Usage |
|-------|-----------|-----------|-------|
| `primary.main` | `#F24D4F` | `#F24D4F` | Logo, selected tabs, hearts, CTAs, active states |
| `secondary.main` | `#FFD36E` | `#FFD36E` | Yellow accent (badges, highlights) |
| `background.default` | `#faf9f6` (warm cream) | `#111216` (near-black, slight blue) | Page backgrounds |
| `background.paper` | `#fff` | `#18191c` | Card surfaces, overlays |
| `text.primary` | `#181818` | `#fff` | Headings, body text |
| `text.secondary` | `#595959` | `#bdbdbd` | Metadata, captions, secondary info |

#### Functional Colors
| Purpose | Value | Notes |
|---------|-------|-------|
| Heart/Like shape fill | `#F24D4F` | CSS-drawn heart using ::before/::after |
| Rating overlay text | `#fff` at 70% opacity | On photo, with text-shadow |
| Card border (light) | `rgba(255,255,255,0.3)` | 6px solid |
| Card border (dark) | `rgba(0,0,0,0.3)` | 6px solid |
| Gradient overlay | `transparent → rgba(0,0,0,0.85)` | Bottom of review card photos |
| Tag chip bg (light) | `rgba(251,234,236,0.9)` | Soft pink |
| Tag chip bg (dark) | `rgba(35,35,35,0.9)` | Near-black with peach border |
| Tag chip text | `#F24D4F` | Both modes |
| Tab selected bg | `#F24D4F` with `boxShadow: 0 2px 8px rgba(242,77,79,0.3)` | White text |
| Header bg (light) | `rgba(255,255,255,0)` | Fully transparent |
| Header bg (dark) | `rgba(18,18,18,0)` | Fully transparent |
| Bottom bar bg (light) | `rgba(255,255,255,0.75)` | Semi-transparent frosted |
| Bottom bar bg (dark) | `rgba(18,18,18,0.75)` | Semi-transparent frosted |

### 3.3 Typography

#### Font Stack
- **Body/UI**: `Inter, Arial, sans-serif` (loaded from Google Fonts: 400, 600, 700)
- **Brand/Display**: `"Classy Pen", Helvetica, sans-serif` (custom TTF)

#### Scale (from theme.ts + component usage)
| Variant | Size | Weight | Usage |
|---------|------|--------|-------|
| Brand display | 38px | 700 | Header "de." logo |
| Brand greeting | 32px | 500 | "Hi Yash!" welcome text |
| Rating overlay | 28px | 700 | Numeric rating on cards |
| Venue name (card) | 20px | 700 | Over photo, white, text-shadow |
| Feed tab labels | 16px | 600/700 | Tab pills, 700 when selected |
| Body / review text | 15px | 400 | Review content, white on dark gradient |
| Dish name (card) | 14px | 500 | Below venue name, white 80% opacity |
| Tag chip text | 13px | 600 | Cuisine/vibe tags |
| Timestamp | 13px | 400 | "2h ago", white 70% opacity |
| Heart count | 11px | 700 | Inside heart shape |
| h6 (MUI) | default | 600 | Section headers, profile name |
| body2 (MUI) | 14px | default | Follower counts, metadata |
| button | default | 600, no uppercase | All buttons use `textTransform: 'none'` |

### 3.4 Spacing & Layout

#### Global Layout
- **Content max-width**: 600px, centered (`mx: 'auto'`)
- **Content padding**: `px: 2` (16px), `py: 1` (8px)
- **Header clearance**: `pt: '72px'` (header height is 64px + gap)
- **Bottom clearance**: `pb: 11` (88px, clears floating bottom bar at 24px from bottom)
- **Scrollbar**: Hidden on all platforms (scrollbarWidth: none, ::-webkit-scrollbar: none)

#### Spacing Scale (MUI 8px base)
| Token | Value | Usage |
|-------|-------|-------|
| `mb: 1` | 8px | Tight gap (avatar to name) |
| `mb: 1.5` | 12px | Card content row to expandable |
| `mb: 2` | 16px | Card-to-card gap, section sub-items |
| `mb: 3` | 24px | Welcome text to tabs, section gaps |
| `p: 2` | 16px | Standard container padding |
| `p: 3` | 24px | Card content overlay padding |
| `gap: 1` | 8px | Tag chip spacing |
| `gap: 1.2` | 9.6px | Avatar/name/heart row |

#### Border Radius
| Element | Radius (MUI units → px) |
|---------|------------------------|
| Global theme default | 20px |
| Review cards | `borderRadius: 4` → 32px |
| Feed tab pills | `borderRadius: 6` → 48px |
| Bottom tab bar | `borderRadius: 6` → 48px |
| Photo carousel | `borderRadius: 3` → 24px |
| Tag chips | `borderRadius: 2` → 16px |

### 3.5 Component Design Specifications

#### Header (`Header.tsx`)
- **Position**: Fixed top, full viewport width, z-index 1200
- **Background**: Fully transparent with `backdropFilter: blur(2px)`
- **Shadow**: `0 2px 16px 0 rgba(0,0,0,0.06)` — extremely subtle
- **Height**: 64px (Toolbar minHeight)
- **Logo**: "de." centered absolutely, 38px Classy Pen font, primary color, `pointerEvents: none`
- **Right actions**: Theme toggle (sun/moon icons) + profile icon (AccountCircle), positioned absolutely right 8px
- **Auto-hide**: Slides up (`translateY(-110%)`) on scroll down, slides back on scroll up or near top (<32px)
- **Animation**: `transform 0.35s cubic-bezier(.4,0,.2,1)`

#### Bottom Tab Bar (`BottomTabBar.tsx`)
- **Position**: Fixed, `bottom: 24px`, centered (`left: 50%, translateX(-50%)`)
- **Dimensions**: `maxWidth: 275px`, `width: 90%`
- **Shape**: Pill (`borderRadius: 48px`), `py: 0.02` (nearly zero vertical padding)
- **Background**: Semi-transparent with blur — `rgba(255,255,255,0.75)` light / `rgba(18,18,18,0.75)` dark, `backdropFilter: blur(1px)`
- **Shadow**: `0 6px 24px 0 rgba(0,0,0,0.13)`
- **Tabs (5)**: Feed (Home), Map, Add (AddCircle), Alerts (Notifications), Profile (Person)
- **Icons**: 26px, no labels shown (`showLabels={false}`)
- **Active state**: Primary color (`#F24D4F`)
- **Spacing**: `px: 1.2`, `py: 0.3` per action, `minWidth: 0`
- **z-index**: 20

#### Review Card (`ReviewCard.tsx`) — THE CORE UX ELEMENT
This is the most important visual component. Every detail matters:

- **Container**:
  - `maxWidth: 420px`, `width: 90%`, centered (`mx: 'auto'`)
  - `borderRadius: 32px` (4 MUI units)
  - Border: `6px solid rgba(255,255,255,0.3)` light / `rgba(0,0,0,0.3)` dark
  - Shadow: `0 4px 24px 0 rgba(0,0,0,0.08)`
  - `mb: 16px` between cards
  - `cursor: pointer`

- **Photo area**:
  - `aspectRatio: 0.8` (portrait, taller than wide), `minHeight: 450px`
  - `object-fit: cover`, fills entire card width
  - Placeholder background: `#eee`

- **Rating badge**:
  - Absolute positioned: `top: 24px`, `right: 28px`
  - White, 28px, bold, 70% opacity
  - `textShadow: 0px 2px 8px rgba(0,0,0,0.65)`
  - Shows one decimal: `9.4`, `9.8`, etc.

- **Content overlay**:
  - Absolute positioned at bottom, full width
  - Background: `linear-gradient(transparent, rgba(0,0,0,0.85))`
  - Default state: `translateY(85%)` — only ~15% visible (shows venue name peek)
  - Expanded state: `translateY(0)` — full content visible
  - Trigger: Hover OR IntersectionObserver (card in center 50% of viewport)
  - Animation: `all 0.3s ease-in-out`
  - Padding: 24px (p: 3)
  - Min-height: 140px

- **Always-visible row** (inside content overlay):
  - Avatar: 36px circle, `border: 1px solid #fff`
  - Venue name: 20px, bold, white, text-shadow
  - Dish name (optional): 14px, 500 weight, `rgba(255,255,255,0.8)`, text-shadow
  - Heart shape: CSS-drawn using `::before`/`::after` pseudo-elements
    - Base: 22×20px box, `bgcolor: #F24D4F`
    - Two half-circles (11×18px, `borderRadius: 11px 11px 0 0`) rotated ±45°
    - Like count (11px, bold, white) centered inside with `zIndex: 1`

- **Expandable content** (hidden by default):
  - `opacity: 0`, `maxHeight: 0`, `overflow: hidden`
  - On expand: `opacity: 1`, `maxHeight: 200px`
  - Tags: horizontal flex wrap, Chip components
    - Light: `rgba(251,234,236,0.9)` bg, `#F24D4F` text, no border
    - Dark: `rgba(35,35,35,0.9)` bg, primary text, `2px solid primary` border
    - Height: 28px, 13px font, 600 weight, 16px border-radius
  - Review text: 15px, 400 weight, white
  - Timestamp: 13px, 400 weight, `rgba(255,255,255,0.7)`, flex-shrink: 0

- **IntersectionObserver behavior**:
  - Thresholds: [0, 0.25, 0.5, 0.75, 1]
  - rootMargin: '-10% 0px -10% 0px'
  - Card is "in view" when: intersectionRatio > 0.5 AND center distance < 25% viewport height
  - When in view: content slides up, expandable becomes visible
  - When out of view: content slides back down

#### Welcome Section (`WelcomeSection.tsx`)
- **Greeting**: "Hi Yash!" in Classy Pen font, 32px, primary color, left-aligned, `letterSpacing: 1`
- **Tabs**: Scrollable horizontal, pill-shaped selection
  - Options: "Top picks", "Recent", "Collections", "Explore"
  - Unselected: secondary text color, 600 weight
  - Selected: white text on primary bg, 700 weight, `boxShadow: 0 2px 8px rgba(242,77,79,0.3)`
  - Each tab: `px: 3`, `py: 1.5`, `mx: 0.5`, `borderRadius: 48px`
  - No default MUI indicator (hidden)
  - Hover (unselected): subtle bg tint
  - Transition: `all 0.2s ease-in-out`

#### Feed Page (`feed.tsx`)
- Full viewport width stretch: `width: 100vw`, `mx: calc(-50vw + 50%)`
- Smooth scrolling, hidden scrollbars
- Bottom padding: `pb: 11` (88px for bottom bar clearance)
- WelcomeSection at top, then filtered ReviewCards
- Tab filtering logic:
  - "Top picks": rating >= 9.5
  - "Recent": date includes "h ago" or "1d ago"
  - "Collections": tags include Coffee, Desserts, Group Dinner
  - "Explore": all reviews

#### Map Page (`map.tsx`)
- Full-screen fixed: `width: 100vw`, `height: 100vh`, `position: fixed`, `top: 0`, `left: 0`
- Body overflow hidden (`no-scroll` class)
- Google Maps fills entire container
- Dark mode: Custom 19-rule style array (deep navy/teal palette matching `#1d2c4d` base geometry)
- Default center: Connaught Place, New Delhi (`28.6304, 77.2177`)
- Default zoom: 13
- UI: All default controls disabled except zoom control
- Markers: Red dot icons (`maps.google.com/mapfiles/ms/icons/red-dot.png`), 44px scaled
- InfoWindow on marker click: venue name, cuisine, rating (basic HTML — to be replaced with custom mini-card)

#### Profile Page (`profile.tsx`)
- Centered column layout
- Avatar: 80px circle, `mb: 1`
- Name: h6, bold
- Stats: "1,376 followers · 86 following" — body2, secondary color
- Bio: "I do be eating" — body1, secondary color
- Tabs: MUI Tabs, centered — "Reviews", "Playlists", "Map"
- Below tabs: ReviewCards (same component as feed)

#### Login Page (`login.tsx`)
- Centered column, `mt: 4`
- Title: "Sign in to Delectable" — h5, bold
- Form: 320px max-width Stack with 16px spacing
- Fields: Email + Password (outlined TextFields)
- Buttons: "Sign In (stub)" contained primary + "Sign Up" text primary

#### Playlist Detail (`playlist/[id].tsx`)
- Title: "Playlist Detail" — h6, bold
- Stack of MUI Cards (borderRadius 32px)
- Each card: CardMedia (160px height, food image) + CardContent (title + caption)
- **NOTE: This is a placeholder** — needs to be redesigned to match review card quality

### 3.6 Photography & Image Style

The food images define the visual standard for all user-generated content:

| Image | Subject | Style |
|-------|---------|-------|
| `food2.jpg` | Japanese spread (sushi, gyoza, fried rice, shrimp) | Overhead flat-lay, black background, editorial/professional, multiple dishes arranged artfully |
| `food3.jpg` | Tiramisu in chocolate shell | Close-up macro, shallow depth of field, warm brown/cream tones, elegant plating on white dish |
| `food4.jpg` | Penne Arabiata at "PAUL" restaurant | Styled plate on dark slate surface, garnish (garlic, tomatoes, bread), brand-visible plate |
| `food5.jpg` | Pizza roll pinwheels on ceramic plate | Overhead on rustic wood table, styled props (sauce bottles, napkin, herbs, juice glass), warm earth tones |
| `avatar1.jpg` | B&W portrait, dramatic lighting | Moody, low-key lighting, glasses, black background — establishes a premium/artistic profile aesthetic |

**Key observations for future content**:
- Food photography is high-quality, professional-grade
- Dark/moody backgrounds or rustic wood surfaces dominate
- Overhead (flat-lay) and close-up angles preferred
- Warm color palette in food (oranges, browns, creams)
- Cards rely on the photos being visually compelling since they're full-bleed

### 3.7 Animation & Interaction Patterns

| Pattern | Details |
|---------|---------|
| Header auto-hide | `requestAnimationFrame`-throttled scroll listener; hide on scroll down, show on scroll up or near top (<32px) |
| Card content reveal | IntersectionObserver + CSS `transform: translateY()` and `opacity`; 0.3s ease-in-out |
| Tab selection | CSS transition `all 0.2s ease-in-out`; bg color + text color + shadow change simultaneously |
| Feed scroll | Native scrolling, hidden scrollbar, `scrollBehavior: smooth` |
| Page transitions | None currently — consider adding route-based transitions later |

### 3.8 Design Deviations & Bugs Found

These are inconsistencies between the design intent and the current implementation:

1. **Missing avatar images**: Feed references `avatar2.jpg`, `avatar3.jpg`, `avatar4.jpg` — only `avatar1.jpg` exists. These cards will show broken avatar images.
2. **Missing food1.jpg**: `mockApi.ts` references `/images/food1.jpg` but it doesn't exist in the images folder.
3. **Playlist detail is a placeholder**: Generic card layout doesn't match the polished review card design language.
4. **Login page lacks branding**: No "de." logo or Classy Pen styling; should have branded splash/hero.
5. **Profile doesn't show "level"**: User type has `level` field (e.g., level 9) but profile page doesn't display it. Feed cards reference levels too.
6. **Global CSS commented out**: Line 1 of `_app.tsx` has the globals.css import commented out, so the Classy Pen @font-face and `no-scroll` class load via `_document.tsx` link tags and inline styles instead of the proper CSS file.
7. **Dead code**: `useDarkModeMapUrl.ts` and `useDarkMode.ts` are unused.
8. **Map InfoWindow is default Google style**: Should be a custom-styled mini-card matching the app's design language.
9. **No transitions between pages**: App has no route transition animations.

---

## 4. User Personas (Reference)

### 4.1 Casual Foodie
- Wants quick "what's good nearby?" answers
- Skips long reviews; trusts curated lists from friends
- Primary flows: Feed browsing, Map discovery, Following friends

### 4.2 Social Curator
- Creates and shares themed playlists ("Best Street Tacos", "Date Night Spots")
- Follows others to expand horizons
- Primary flows: Playlist creation, Review posting, Social engagement

### 4.3 Explorer
- Travels frequently, filters by cuisine/rating/authenticity
- Relies on AI suggestions in unfamiliar cities
- Primary flows: Search & Filter, AI Recommendations, Map exploration

---

## 5. Milestone Breakdown

### Milestone 1: Front-End Foundations [COMPLETE]
**Status**: Done - all items checked off in previous plan.

**Deliverables Completed**:
- Next.js + TypeScript project initialized
- MUI + Emotion SSR integration
- Axios + React Query configured
- App shell with header + bottom tab bar
- Core views (Feed, Map, Profile, Playlist Detail, Login)
- Dark/light mode toggle
- Custom fonts (Classy Pen branding)
- Review card design with animations

---

### Milestone 2: UI Polish & State Management

**Goal**: Connect mock data through proper state management, build creation forms, enforce consistent styling, and implement navigation guards.

#### 2.1 State Integration
- **React Query + Mock JSON endpoints**:
  - Create mock API endpoint functions in `src/api/mockApi.ts` that simulate async behavior (wrap mock data with `Promise.resolve()` and optional `setTimeout` delays)
  - Create React Query hooks in `src/hooks/`:
    - `useUser()` - fetch current user profile
    - `useReviews(filters?)` - fetch feed reviews with filter params
    - `usePlaylists(userId?)` - fetch user's playlists
    - `useVenues(bounds?, filters?)` - fetch venues for map
    - `usePlaylistDetail(id)` - fetch single playlist with items
  - Replace hardcoded sample data in `feed.tsx` with `useReviews()` hook
  - Replace hardcoded profile data in `profile.tsx` with `useUser()` hook
  - Replace hardcoded playlist data in `playlist/[id].tsx` with `usePlaylistDetail()` hook

- **Global State (React Context)**:
  - `AuthContext`: user session, login state, JWT token (stub)
  - Extend existing `ColorModeContext` or keep as-is
  - `UserPreferencesContext`: saved cuisine preferences, location, notification settings
  - Create `src/contexts/AuthContext.tsx` and `src/contexts/PreferencesContext.tsx`

#### 2.2 Forms & Validation
- **Install dependencies**: `react-hook-form`, `yup`, `@hookform/resolvers`
- **"New Review" Form** (`src/pages/review/new.tsx`):
  - Venue name (text input with autocomplete from mock venues)
  - Dish name (optional text input)
  - Rating selector (0-10 scale, 0.1 increments, slider or dial)
  - Review text (textarea, 500 char limit)
  - Tags (multi-select chips from predefined list + custom)
  - Photo upload (file input, preview, max 5 images) - local preview only for now
  - Location/geotag (auto-detect or manual)
  - Yup schema validation: rating required 0-10, text required min 10 chars, at least 1 photo
- **"New Playlist" Form** (`src/pages/playlist/new.tsx`):
  - Title (required, max 60 chars)
  - Description (optional, max 200 chars)
  - Cover photo (upload or select from existing)
  - Add items: search venues, add caption per item
  - Yup schema: title required, at least 1 item
- **"Edit Profile" Form** (`src/pages/profile/edit.tsx`):
  - Avatar upload
  - Display name
  - Bio (max 160 chars)
  - Favorite cuisines (multi-select)

#### 2.3 Styling Consistency
- **Typography scale**: Ensure consistent use across all pages
  - H4 (32px): Welcome greeting, page titles
  - H5 (24px): Section headers
  - H6 (20px): Card titles, form headers
  - Subtitle1 (16px): Sub-headers
  - Body1 (16px): Regular text
  - Body2 (14px): Secondary text, metadata
  - Caption (12px): Timestamps, small labels
- **Spacing system**: Standardize using MUI's 8px grid
  - Section gaps: `mb: 3` (24px)
  - Card gaps: `mb: 2` (16px)
  - Inner padding: `p: 2` (16px) or `p: 3` (24px)
- **Color consistency**: Audit all hardcoded colors, replace with theme tokens
- **Responsive breakpoints**: Test and fix for mobile (360px), tablet (768px), desktop (1024px+)
- **Accessibility**:
  - All interactive elements must have `aria-label`
  - Contrast ratio >= 4.5:1 for text (WCAG AA)
  - Focus indicators on all interactive elements
  - Keyboard navigation through all flows
  - Screen reader-friendly card and tab structures (some ARIA already in place)

#### 2.4 Navigation Flows
- **Route protection**: Create `withAuth` HOC or custom hook `useRequireAuth()` that redirects to `/login` if no session
- **Apply protection** to: `/feed`, `/map`, `/profile`, `/playlist/*`, `/review/*`
- **Tab bar active state**: Already syncs with pathname - verify edge cases
- **Back button behavior**: Implement breadcrumb or back arrow on detail pages (playlist detail, review detail)
- **Deep linking**: Ensure playlist/[id] and future review/[id] pages work with direct URL access
- **404 page**: Create `src/pages/404.tsx` with branded design

#### 2.5 Missing Pages to Create
- `/notifications` - Notifications/alerts page (referenced by BottomTabBar)
- `/review/new` - New review creation form
- `/playlist/new` - New playlist creation form
- `/profile/edit` - Profile editing
- `/404` - Not found page
- `/search` - Search results page (or search overlay component)

---

### Milestone 3: Google Maps & Location Filtering

**Goal**: Replace basic map with fully interactive venue discovery with filtering, POI types, and map-list synchronization.

#### 3.1 Enhanced Map API Integration
- **Dynamic markers from state**: Replace hardcoded 2-venue `venueCoords` array with dynamic data from React Query `useVenues()` hook
- **Marker clustering**: Install `@googlemaps/markerclusterer` for handling many markers at zoom-out levels
- **Custom marker icons**: Design custom pin icons per venue type (restaurant, cafe, bar, coffee shop) using SVG or custom MUI icons
- **User's current location**: Request geolocation permission, show blue dot for user position
- **Map bounds-based fetching**: When map pans/zooms, fetch venues within new bounds (from mock data, later from API)

#### 3.2 Venue Filtering
- **POI type toggles**: Filter markers by type - Restaurant, Cafe, Bar, Coffee Shop
  - Implement as horizontal chip/toggle bar overlaid on map (top area below header)
  - Each type has a distinct icon and color
- **Radius slider**: Distance-based filtering from user's position or map center
  - Slider component overlaid on map (collapsible panel)
  - Values: 0.5km, 1km, 2km, 5km, 10km
  - Draw translucent radius circle on map
- **Tag-based search**: Search input on map view for cuisine tags, venue names
  - Autocomplete dropdown with matching venues and tags
  - Results filter map markers in real-time
- **Rating filter**: Minimum rating slider (0-10)
- **Sort options**: By distance, rating, recency of reviews

#### 3.3 Map-List Sync
- **Marker click -> Mini-card**: Clicking a map marker shows a floating mini-card (not Google's default InfoWindow) with:
  - Venue photo (thumbnail)
  - Venue name
  - Cuisine type
  - Rating
  - Distance from user
  - "View Details" CTA
- **Mini-card -> Detail navigation**: Tapping "View Details" navigates to venue detail page
- **List view toggle**: Toggle between map view and scrollable list view of same filtered results
  - List shows venue cards with photo, name, cuisine, rating, distance
  - Tapping list item centers map on venue and shows mini-card
- **Venue Detail Page** (`src/pages/venue/[id].tsx`):
  - Hero photo carousel
  - Name, cuisine, location, rating
  - Map embed showing venue location
  - Reviews from users (list of ReviewCards)
  - "Add to Playlist" button
  - "Write Review" button
  - Related/nearby venues

---

### Milestone 4: Backend MVP & Data Storage

**Goal**: Build a Django REST API backend with PostgreSQL, Redis caching, and ElasticSearch for fast search.

#### 4.1 Django REST API
- **Project setup**: Django 5.x + Django REST Framework + djangorestframework-simplejwt
- **Authentication endpoints**:
  - `POST /api/auth/register/` - User registration (email, password, name)
  - `POST /api/auth/login/` - JWT token pair (access + refresh)
  - `POST /api/auth/refresh/` - Refresh access token
  - `POST /api/auth/logout/` - Blacklist refresh token
  - `GET /api/auth/me/` - Current user profile
  - Future: OAuth2 social login (Google, Apple) via django-allauth
- **User endpoints**:
  - `GET /api/users/{id}/` - User profile
  - `PATCH /api/users/{id}/` - Update profile
  - `GET /api/users/{id}/reviews/` - User's reviews
  - `GET /api/users/{id}/playlists/` - User's playlists
  - `POST /api/users/{id}/follow/` - Follow user
  - `DELETE /api/users/{id}/follow/` - Unfollow user
  - `GET /api/users/{id}/followers/` - Follower list
  - `GET /api/users/{id}/following/` - Following list
- **Venue endpoints**:
  - `GET /api/venues/` - List venues (with filters: cuisine, tags, rating, bounds, radius)
  - `GET /api/venues/{id}/` - Venue detail
  - `GET /api/venues/{id}/reviews/` - Reviews for venue
  - `GET /api/venues/nearby/` - Nearby venues by coordinates + radius
  - `GET /api/venues/search/` - Full-text search
- **Review endpoints**:
  - `POST /api/reviews/` - Create review
  - `GET /api/reviews/{id}/` - Review detail
  - `PATCH /api/reviews/{id}/` - Update review
  - `DELETE /api/reviews/{id}/` - Delete review
  - `POST /api/reviews/{id}/like/` - Like review
  - `DELETE /api/reviews/{id}/like/` - Unlike review
  - `GET /api/reviews/{id}/comments/` - Comments on review
  - `POST /api/reviews/{id}/comments/` - Add comment
- **Playlist endpoints**:
  - `GET /api/playlists/` - List user's playlists
  - `POST /api/playlists/` - Create playlist
  - `GET /api/playlists/{id}/` - Playlist detail with items
  - `PATCH /api/playlists/{id}/` - Update playlist
  - `DELETE /api/playlists/{id}/` - Delete playlist
  - `POST /api/playlists/{id}/items/` - Add item to playlist
  - `DELETE /api/playlists/{id}/items/{itemId}/` - Remove item
- **Feed endpoint**:
  - `GET /api/feed/` - Personalized feed (friends' reviews + AI spotlights)
  - Pagination: cursor-based for infinite scroll
- **Search endpoint**:
  - `GET /api/search/?q=...&type=venues|reviews|playlists|users` - Unified search

#### 4.2 Database Modeling (PostgreSQL)
```
Users
├── id (UUID, PK)
├── email (unique)
├── password_hash
├── name
├── avatar_url
├── bio
├── level (int, computed from activity)
├── favorite_cuisines (JSONB)
├── location_lat, location_lng
├── created_at, updated_at

Follows
├── id (PK)
├── follower_id (FK -> Users)
├── following_id (FK -> Users)
├── created_at
├── UNIQUE(follower_id, following_id)

Venues
├── id (UUID, PK)
├── name
├── address
├── city
├── cuisine (varchar)
├── tags (JSONB array)
├── lat, lng
├── avg_rating (float, denormalized)
├── review_count (int, denormalized)
├── photo_urls (JSONB array)
├── venue_type (enum: restaurant, cafe, bar, coffee_shop)
├── google_place_id (varchar, nullable)
├── created_at, updated_at

Reviews
├── id (UUID, PK)
├── user_id (FK -> Users)
├── venue_id (FK -> Venues)
├── rating (float, 0-10)
├── text (text)
├── photos (JSONB array of URLs)
├── tags (JSONB array)
├── dish_name (varchar, nullable)
├── like_count (int, denormalized)
├── comment_count (int, denormalized)
├── created_at, updated_at

ReviewLikes
├── id (PK)
├── review_id (FK -> Reviews)
├── user_id (FK -> Users)
├── created_at
├── UNIQUE(review_id, user_id)

Comments
├── id (UUID, PK)
├── review_id (FK -> Reviews)
├── user_id (FK -> Users)
├── text (text)
├── created_at

Playlists
├── id (UUID, PK)
├── user_id (FK -> Users)
├── title
├── description
├── cover_photo_url
├── is_public (bool)
├── item_count (int, denormalized)
├── created_at, updated_at

PlaylistItems
├── id (UUID, PK)
├── playlist_id (FK -> Playlists)
├── venue_id (FK -> Venues)
├── caption
├── photo_url
├── order (int)
├── date_added

Tags (lookup table)
├── id (PK)
├── name (unique)
├── category (cuisine, vibe, occasion, dietary)

Notifications
├── id (UUID, PK)
├── user_id (FK -> Users)
├── type (enum: like, comment, follow, recommendation)
├── actor_id (FK -> Users, nullable)
├── target_type (review, playlist, venue)
├── target_id (UUID)
├── is_read (bool)
├── created_at
```

#### 4.3 Redis Cache
- **Session storage**: JWT blacklist, active sessions
- **Hot search results**: Cache top search queries for 5 minutes
- **Feed cache**: Pre-computed feed for active users (invalidate on new content)
- **Rate limiting**: Track API request counts per user
- **Leaderboard/trending**: Sorted sets for trending venues, popular tags

#### 4.4 ElasticSearch
- **Venue index**: name, cuisine, tags, city, rating - for full-text + faceted search
- **Review index**: text, tags, venue name - for content search
- **User index**: name, bio - for people search
- **Autocomplete**: Edge n-gram tokenizer for search-as-you-type
- **Geo queries**: Filter venues by bounding box or distance from point

---

### Milestone 5: Deployment, CI/CD & Containerization

**Goal**: Containerize all services, set up local development environment, create Kubernetes manifests, and implement CI/CD pipeline.

#### 5.1 Dockerization
- **Frontend Dockerfile** (Next.js):
  - Multi-stage build: install deps -> build -> production image
  - Base: `node:20-alpine`
  - Expose port 3000
  - Health check endpoint
- **Backend Dockerfile** (Django):
  - Base: `python:3.12-slim`
  - Install system deps (psycopg2, etc.)
  - Gunicorn WSGI server
  - Expose port 8000
  - Health check endpoint
- **Docker Compose** (`docker-compose.yml`):
  - Services: `frontend`, `backend`, `postgres`, `redis`, `elasticsearch`
  - Volumes for persistent data (postgres, elasticsearch)
  - Environment variables via `.env` file
  - Networking: internal bridge network
  - Development overrides: hot reload, source mounting

#### 5.2 Kubernetes Manifests
- **Deployments**: frontend, backend (with resource limits, liveness/readiness probes)
- **Services**: ClusterIP for internal, LoadBalancer/Ingress for external
- **Ingress**: NGINX ingress controller with TLS termination
- **ConfigMaps**: Environment configuration per environment
- **Secrets**: Database credentials, API keys, JWT secret
- **Horizontal Pod Autoscaler**: Based on CPU/memory for backend
- **PersistentVolumeClaims**: For PostgreSQL and ElasticSearch data

#### 5.3 CI/CD Pipeline (GitHub Actions)
- **On PR**:
  - Lint (ESLint for frontend, flake8/ruff for backend)
  - Type check (TypeScript strict)
  - Unit tests (Jest/Vitest for frontend, pytest for backend)
  - Build verification
- **On merge to main**:
  - Build Docker images
  - Push to AWS ECR (or Docker Hub)
  - Deploy to staging (EKS)
  - Run integration tests
- **On release tag**:
  - Deploy to production
  - Database migrations
  - Cache invalidation

---

### Milestone 6: AI Recommendation & Quality Filtering

**Goal**: Build ML-powered recommendation engine and review quality scoring.

#### 6.1 Data Ingestion
- **Google Maps Places API**: Fetch venue data (name, address, photos, ratings, reviews)
  - Batch import for seeding
  - Periodic sync for updates
  - Respect rate limits with queuing (Celery + Redis)
- **Review quality signals**: Aggregate review metadata for ML features
- **ETL pipeline**:
  - Extract: API calls, user-generated data
  - Transform: Clean, normalize, featurize
  - Load: PostgreSQL for structured data, ElasticSearch for search indices

#### 6.2 ML Models (PyTorch)
- **Review Authenticity Classifier**:
  - Input features: review text, user history, venue data, temporal patterns
  - Output: authenticity score (0-1)
  - Training data: labeled reviews (authentic/spam/fake)
  - Architecture: Fine-tuned text classifier (DistilBERT or similar)
- **Venue Ranking Algorithm**:
  - Hybrid scoring combining:
    - User preference similarity (collaborative filtering)
    - Content-based features (cuisine, tags, price range)
    - Social signals (friend reviews, popular among following)
    - Recency weighting (recent reviews weighted higher)
    - Quality weighting (higher-quality reviews count more)
  - Implementation: Two-tower retrieval model or gradient-boosted ranker
- **Personalized Feed Ranking**:
  - Score each potential feed item for a user
  - Features: social proximity, content relevance, freshness, engagement prediction
  - Serve top-K items via feed endpoint

#### 6.3 Backend Integration
- **Recommendation endpoint**:
  - `GET /api/recommendations/?lat=...&lng=...&limit=10`
  - Returns ranked venue suggestions with explanation ("Because your friend X loved it", "Popular in your area")
- **Feed scoring**: Inject ML-ranked items into feed alongside chronological friend content
- **Review quality badge**: Surface "Trusted Review" badge for high-authenticity reviews
- **Trending detection**: Identify trending venues/dishes in user's area

---

## 6. Detailed Component Specifications

### 6.1 ReviewCard Component (existing, to be enhanced)
- **Current**: Full-bleed photo, gradient overlay, intersection observer animation, expandable content
- **Enhancements needed**:
  - Double-tap to like (with heart animation)
  - Swipe left/right for next/previous review in feed
  - Bookmark/save button
  - Share button (copy link, share to social)
  - Comment inline expansion
  - "Add to Playlist" quick action
  - Venue name links to venue detail page

### 6.2 PlaylistCard Component (to be built)
- Horizontal scrollable card for playlists
- Cover image (first item's photo or custom)
- Title, item count, creator avatar
- Preview thumbnails of first 3-4 items
- Click navigates to playlist detail

### 6.3 VenueMiniCard Component (to be built for map)
- Floating card above map marker
- Venue photo thumbnail (80x80)
- Name, cuisine, rating
- Distance from user
- "View" CTA button
- Swipeable if multiple venues are close

### 6.4 SearchOverlay Component (to be built)
- Full-screen overlay triggered from search icon or tab
- Search input with autocomplete
- Recent searches
- Trending searches
- Results grouped by: Venues, Playlists, Users, Tags
- Each result type has distinct card design

### 6.5 NotificationItem Component (to be built)
- Avatar of actor
- Action description ("Yash liked your review", "New review at SavorWorks")
- Timestamp
- Unread indicator (dot)
- Click navigates to relevant content

---

## 7. API Contract Details (Frontend-Backend)

### Authentication Flow
```
1. User enters email + password
2. POST /api/auth/login/ -> { access: "jwt...", refresh: "jwt..." }
3. Store access token in memory, refresh in httpOnly cookie
4. Attach Authorization: Bearer <access> to all API requests (Axios interceptor)
5. On 401, POST /api/auth/refresh/ with refresh token
6. On refresh failure, redirect to /login
```

### Feed Pagination
```
GET /api/feed/?cursor=<timestamp>&limit=10
Response: {
  results: [...],
  next_cursor: "<timestamp>",
  has_more: true
}
```
- Infinite scroll: trigger fetch when user scrolls to bottom
- Pull-to-refresh: refetch from latest

### Image Upload
```
1. Frontend: Select file, validate (max 5MB, jpg/png/webp)
2. POST /api/upload/ with multipart form data
3. Backend: Store in S3 (or local for dev), return URL
4. Frontend: Use returned URL in review/playlist creation
```

---

## 8. Non-Functional Requirements

### Performance
- First Contentful Paint: < 1.5s
- Largest Contentful Paint: < 2.5s
- Time to Interactive: < 3s
- Feed scroll: 60fps, no jank
- Map interactions: < 100ms response
- API response times: < 200ms for reads, < 500ms for writes

### Security
- JWT with short-lived access tokens (15 min) + refresh tokens (7 days)
- HTTPS everywhere
- Input sanitization (XSS prevention)
- SQL injection prevention (Django ORM)
- Rate limiting (100 req/min per user)
- CORS configuration (whitelist frontend origin)
- Image upload validation (type, size, content scanning)

### Scalability
- Stateless backend (horizontal scaling)
- Read replicas for PostgreSQL
- Redis cluster for session/cache
- CDN for static assets and images
- ElasticSearch cluster for search

---

## 9. Risk Mitigation

| Risk | Impact | Mitigation |
|------|--------|------------|
| Google Maps API rate limits / cost | Map features degraded | Redis caching layer, tile caching, usage caps, server-side proxy |
| ML model bias or poor accuracy | Bad recommendations | Human-in-the-loop labeling, A/B testing, continuous retraining, fallback to popularity-based |
| Container orchestration complexity | Deployment delays | Start with Docker Compose, graduate to K8s after stability |
| 3rd-party API data restrictions | Reduced venue data | Fallback to user-generated content, manual venue addition |
| Mobile performance on low-end devices | Poor UX | Code splitting, lazy loading, image optimization (WebP, srcset) |

---

## 10. Development Workflow

### Branch Strategy
- `main` - Production-ready code
- `develop` - Integration branch
- `feature/*` - Individual feature branches
- `fix/*` - Bug fix branches
- PR reviews required before merge

### Code Quality
- ESLint + Prettier for frontend
- Ruff/Black for Python backend
- TypeScript strict mode
- Pre-commit hooks (Husky + lint-staged)
- Minimum 80% test coverage for critical paths

### Testing Strategy
- **Unit tests**: Components (React Testing Library), API views (pytest)
- **Integration tests**: API endpoint flows, database operations
- **E2E tests**: Critical user flows (Playwright or Cypress)
- **Visual regression**: Storybook + Chromatic (optional)
