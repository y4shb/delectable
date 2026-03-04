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

**Goal**: Build a production-grade Django REST API backend with PostgreSQL (PostGIS for geospatial, pg_trgm + tsvector for search). No ElasticSearch, no Redis for MVP — PostgreSQL handles search and LocMemCache handles caching until scale demands otherwise.

**Key Architecture Decisions (from research)**:
- **No ElasticSearch**: PostgreSQL `tsvector` + `pg_trgm` handles all search use cases (venue name fuzzy search, review full-text, autocomplete) at single-digit ms latency up to 10M+ rows.
- **No Redis for MVP**: Django's `LocMemCache` is sufficient at single-server scale. The caching abstraction layer (`CacheKeys`/`CacheTTL` classes) is built from day 1 so switching to Redis later is a settings change.
- **PostGIS**: Sub-millisecond geospatial queries via GIST-indexed `geography(Point, 4326)` columns, replacing naive Haversine formula full-table scans.
- **ArrayField for tags**: GIN-indexable, no JOINs, `@>` (contains) and `&&` (overlaps) operators. No separate Tags M2M table needed.
- **Database triggers for counts**: `followers_count`, `following_count`, `like_count`, `comment_count`, `items_count` maintained atomically via PostgreSQL triggers.
- **Cursor-based pagination for feeds**: Keyset pagination on `(created_at, id)` — O(1) performance, no skipped/duplicated items during scrolling.
- **UUID primary keys** for all public-facing entities.
- **Snake_case JSON in API**: Frontend adapter layer converts to camelCase for TypeScript.
- **JWT auth**: 15-minute access tokens in memory, 7-day refresh tokens in HttpOnly secure cookies, rotation + blacklisting.

---

#### 4.1 Django Project Setup

**Stack**:
- Django 5.2 LTS + Django REST Framework 3.15.x
- `djangorestframework-simplejwt` 5.3.x (token auth)
- `django-cors-headers` 4.x (CORS for Next.js frontend)
- `django-filter` 24.x (queryset filtering)
- `psycopg[binary]` 3.x (PostgreSQL adapter)
- `django.contrib.gis` (GeoDjango for PostGIS)
- `gunicorn` 22.x (production WSGI server)

**Project structure**:
```
backend/
├── manage.py
├── requirements.txt
├── config/
│   ├── __init__.py
│   ├── settings/
│   │   ├── __init__.py
│   │   ├── base.py         # Shared settings (INSTALLED_APPS, REST_FRAMEWORK, SIMPLE_JWT)
│   │   ├── dev.py          # DEBUG=True, CORS_ALLOW_ALL, LocMemCache, console email
│   │   └── prod.py         # Security hardening, Redis cache, S3 media, Sentry
│   ├── urls.py             # Root URL conf: /api/auth/, /api/users/, /api/venues/, etc.
│   ├── wsgi.py
│   └── asgi.py
├── apps/
│   ├── __init__.py
│   ├── core/               # Shared base models, permissions, pagination, cache keys
│   │   ├── models.py       # TimeStampedModel abstract base
│   │   ├── permissions.py  # IsOwnerOrReadOnly, IsOwner
│   │   ├── pagination.py   # CursorPagination, OffsetPagination
│   │   ├── cache_keys.py   # CacheKeys class (centralized key definitions)
│   │   ├── cache_ttls.py   # CacheTTL class (centralized TTL definitions)
│   │   └── exceptions.py   # Custom DRF exception handler
│   ├── users/              # Custom User model, auth views, Follow model
│   │   ├── models.py       # User (AbstractBaseUser), Follow
│   │   ├── managers.py     # UserManager (create_user, create_superuser)
│   │   ├── serializers.py  # UserSerializer, RegisterSerializer, LoginSerializer
│   │   ├── views.py        # RegisterView, LoginView (cookie-based), LogoutView, MeView
│   │   ├── urls.py
│   │   ├── signals.py      # Update follow counts on Follow create/delete
│   │   ├── admin.py
│   │   └── tests/
│   ├── venues/             # Venue model, geospatial queries
│   │   ├── models.py       # Venue with PointField, search_vector, ArrayField tags
│   │   ├── serializers.py  # VenueListSerializer, VenueDetailSerializer
│   │   ├── views.py        # VenueViewSet (list/detail, bbox, radius, cuisine filter)
│   │   ├── urls.py
│   │   ├── services.py     # unified_venue_search() with pg_trgm + tsvector
│   │   └── tests/
│   ├── reviews/            # Review CRUD, likes, comments
│   │   ├── models.py       # Review, ReviewLike, Comment
│   │   ├── serializers.py  # ReviewSerializer, CommentSerializer
│   │   ├── views.py        # ReviewViewSet, LikeView, CommentViewSet
│   │   ├── urls.py
│   │   ├── signals.py      # Update like_count, comment_count triggers
│   │   └── tests/
│   ├── playlists/          # Playlist CRUD, item management, reordering
│   │   ├── models.py       # Playlist, PlaylistItem
│   │   ├── serializers.py  # PlaylistSerializer, PlaylistItemSerializer
│   │   ├── views.py        # PlaylistViewSet, PlaylistItemViewSet
│   │   ├── urls.py
│   │   └── tests/
│   ├── feed/               # Feed generation, tab logic
│   │   ├── views.py        # FeedView (top-picks, recent, collections, explore tabs)
│   │   ├── urls.py
│   │   └── tests/
│   ├── search/             # Unified search across venues, users, reviews
│   │   ├── services.py     # unified_search(), autocomplete_search()
│   │   ├── views.py        # SearchView, AutocompleteView
│   │   ├── urls.py
│   │   └── tests/
│   └── notifications/      # Notification model, feed, mark-read
│       ├── models.py       # Notification (types: like, comment, follow, playlist_add)
│       ├── serializers.py  # NotificationSerializer
│       ├── views.py        # NotificationListView, MarkReadView
│       ├── urls.py
│       ├── signals.py      # Create notifications on like, comment, follow
│       └── tests/
```

**Key settings** (`config/settings/base.py`):
```python
AUTH_USER_MODEL = "users.User"

INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "django.contrib.gis",          # GeoDjango for PostGIS
    "django.contrib.postgres",     # ArrayField, trgm, SearchVector
    # Third party
    "rest_framework",
    "rest_framework_simplejwt",
    "rest_framework_simplejwt.token_blacklist",
    "django_filters",
    "corsheaders",
    # Local apps
    "apps.core",
    "apps.users",
    "apps.venues",
    "apps.reviews",
    "apps.playlists",
    "apps.feed",
    "apps.search",
    "apps.notifications",
]

DATABASES = {
    "default": {
        "ENGINE": "django.contrib.gis.db.backends.postgis",
        "NAME": os.environ.get("DB_NAME", "delectable"),
        "USER": os.environ.get("DB_USER", "postgres"),
        "PASSWORD": os.environ.get("DB_PASSWORD", "postgres"),
        "HOST": os.environ.get("DB_HOST", "127.0.0.1"),
        "PORT": os.environ.get("DB_PORT", "5432"),
    }
}

REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": [
        "rest_framework_simplejwt.authentication.JWTAuthentication",
    ],
    "DEFAULT_PERMISSION_CLASSES": [
        "rest_framework.permissions.IsAuthenticated",
    ],
    "DEFAULT_PAGINATION_CLASS": "apps.core.pagination.StandardPagination",
    "PAGE_SIZE": 20,
    "DEFAULT_FILTER_BACKENDS": [
        "django_filters.rest_framework.DjangoFilterBackend",
        "rest_framework.filters.OrderingFilter",
    ],
    "DEFAULT_THROTTLE_CLASSES": [
        "rest_framework.throttling.AnonRateThrottle",
        "rest_framework.throttling.UserRateThrottle",
    ],
    "DEFAULT_THROTTLE_RATES": {
        "anon": "100/hour",
        "user": "1000/hour",
        "login": "5/minute",
        "register": "3/minute",
    },
}

SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(minutes=15),
    "REFRESH_TOKEN_LIFETIME": timedelta(days=7),
    "ROTATE_REFRESH_TOKENS": True,
    "BLACKLIST_AFTER_ROTATION": True,
    "UPDATE_LAST_LOGIN": True,
    "ALGORITHM": "HS256",
    "SIGNING_KEY": os.environ.get("JWT_SECRET_KEY", SECRET_KEY),
    "USER_ID_FIELD": "id",
    "USER_ID_CLAIM": "user_id",
    "AUTH_HEADER_TYPES": ("Bearer",),
}

# Cache — MVP uses LocMemCache, switch to Redis at scale
CACHES = {
    "default": {
        "BACKEND": "django.core.cache.backends.locmem.LocMemCache",
        "LOCATION": "delectable-dev",
        "TIMEOUT": 300,
    }
}
```

**requirements.txt**:
```
Django>=5.2,<5.3
djangorestframework>=3.15,<4.0
djangorestframework-simplejwt>=5.3,<6.0
django-cors-headers>=4.4,<5.0
django-filter>=24.0
psycopg[binary]>=3.1,<4.0
gunicorn>=22.0
python-dotenv>=1.0
Pillow>=10.0
```

---

#### 4.2 Database Models (PostgreSQL + PostGIS)

**PostgreSQL extensions** (installed via initial migration):
```sql
CREATE EXTENSION IF NOT EXISTS postgis;    -- Geospatial
CREATE EXTENSION IF NOT EXISTS pg_trgm;    -- Fuzzy text matching
CREATE EXTENSION IF NOT EXISTS unaccent;   -- Accent-insensitive search
```

**User model** (`apps/users/models.py`):
```python
class User(AbstractBaseUser, PermissionsMixin):
    id            = UUIDField(primary_key=True, default=uuid4)
    email         = EmailField(unique=True)
    name          = CharField(max_length=150)
    avatar_url    = URLField(max_length=500, blank=True, default="")
    bio           = TextField(max_length=300, blank=True, default="")
    level         = PositiveIntegerField(default=1)
    followers_count  = PositiveIntegerField(default=0)  # trigger-maintained
    following_count  = PositiveIntegerField(default=0)  # trigger-maintained
    favorite_cuisines = ArrayField(CharField(max_length=50), default=list, blank=True)
    is_active     = BooleanField(default=True)
    is_staff      = BooleanField(default=False)
    search_vector = SearchVectorField(null=True)         # name search
    created_at    = DateTimeField(auto_now_add=True)
    updated_at    = DateTimeField(auto_now=True)

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["name"]

    # Indexes: GIN on search_vector, trigram GIN on name
```

**Follow model** (`apps/users/models.py`):
```python
class Follow(Model):
    follower   = ForeignKey(User, CASCADE, related_name="following_set")
    following  = ForeignKey(User, CASCADE, related_name="follower_set")
    created_at = DateTimeField(auto_now_add=True)

    # Constraints: UniqueConstraint(follower, following), CheckConstraint(no self-follow)
    # Indexes: BTree(follower, following), BTree(following, follower)
```

**Venue model** (`apps/venues/models.py`):
```python
class Venue(Model):
    id            = UUIDField(primary_key=True, default=uuid4)
    name          = CharField(max_length=300)
    location      = PointField(geography=True, srid=4326, null=True)  # PostGIS
    address       = CharField(max_length=500, blank=True)
    city          = CharField(max_length=100, blank=True)
    cuisine_type  = CharField(max_length=100, blank=True)
    tags          = ArrayField(CharField(max_length=50), default=list, blank=True)
    rating        = DecimalField(max_digits=3, decimal_places=1, default=0)
    reviews_count = PositiveIntegerField(default=0)         # trigger-maintained
    photo_url     = URLField(max_length=500, blank=True)
    google_place_id = CharField(max_length=200, blank=True)
    search_vector = SearchVectorField(null=True)             # auto-maintained via trigger
    created_at    = DateTimeField(auto_now_add=True)
    updated_at    = DateTimeField(auto_now=True)

    @property
    def latitude(self):
        return self.location.y if self.location else None

    @property
    def longitude(self):
        return self.location.x if self.location else None

    # Indexes:
    #   GIST on location (geospatial)
    #   GIN trigram on name (fuzzy search)
    #   GIN on tags (array contains/overlaps)
    #   GIN on search_vector (full-text)
    #   BTree(cuisine_type, -rating) (browse by cuisine)
```

**Review model** (`apps/reviews/models.py`):
```python
class Review(Model):
    id            = UUIDField(primary_key=True, default=uuid4)
    user          = ForeignKey(User, CASCADE, related_name="reviews")
    venue         = ForeignKey(Venue, CASCADE, related_name="reviews")
    rating        = DecimalField(max_digits=4, decimal_places=1, validators=[0-10])
    text          = TextField(max_length=2000, blank=True)
    photo_url     = URLField(max_length=500, blank=True)
    dish_name     = CharField(max_length=200, blank=True)
    tags          = ArrayField(CharField(max_length=50), default=list, blank=True)
    like_count    = PositiveIntegerField(default=0)     # trigger-maintained
    comment_count = PositiveIntegerField(default=0)     # trigger-maintained
    search_vector = SearchVectorField(null=True)
    created_at    = DateTimeField(auto_now_add=True)
    updated_at    = DateTimeField(auto_now=True)

    # Constraints: UniqueConstraint(user, venue) — one review per user per venue
    # Indexes:
    #   BTree(user, -created_at) — feed query, profile reviews
    #   BTree(venue, -created_at) — venue detail page
    #   GIN on tags, GIN on search_vector
```

**ReviewLike model**:
```python
class ReviewLike(Model):
    user       = ForeignKey(User, CASCADE, related_name="review_likes")
    review     = ForeignKey(Review, CASCADE, related_name="likes")
    created_at = DateTimeField(auto_now_add=True)
    # Constraint: UniqueConstraint(user, review)
```

**Comment model**:
```python
class Comment(Model):
    id         = UUIDField(primary_key=True, default=uuid4)
    user       = ForeignKey(User, CASCADE, related_name="comments")
    review     = ForeignKey(Review, CASCADE, related_name="comments")
    text       = TextField(max_length=1000)
    created_at = DateTimeField(auto_now_add=True)
    # Index: BTree(review, created_at)
```

**Playlist & PlaylistItem models** (`apps/playlists/models.py`):
```python
class Playlist(Model):
    id          = UUIDField(primary_key=True, default=uuid4)
    user        = ForeignKey(User, CASCADE, related_name="playlists")
    title       = CharField(max_length=200)
    description = TextField(max_length=1000, blank=True)
    items_count = PositiveIntegerField(default=0)  # trigger-maintained
    is_public   = BooleanField(default=True)
    created_at  = DateTimeField(auto_now_add=True)
    updated_at  = DateTimeField(auto_now=True)
    # Index: BTree(user, -updated_at)

class PlaylistItem(Model):
    id         = UUIDField(primary_key=True, default=uuid4)
    playlist   = ForeignKey(Playlist, CASCADE, related_name="items")
    venue      = ForeignKey(Venue, CASCADE, related_name="playlist_items")
    caption    = CharField(max_length=300, blank=True)
    sort_order = PositiveIntegerField(default=0)
    created_at = DateTimeField(auto_now_add=True)
    # Constraints: UniqueConstraint(playlist, venue), UniqueConstraint(playlist, sort_order)
    # Index: BTree(playlist, sort_order)
```

**Notification model** (`apps/notifications/models.py`):
```python
class Notification(Model):
    class Type(TextChoices):
        LIKE = "like"
        COMMENT = "comment"
        FOLLOW = "follow"
        PLAYLIST_ADD = "playlist_add"

    id                = UUIDField(primary_key=True, default=uuid4)
    recipient         = ForeignKey(User, CASCADE, related_name="notifications")
    notification_type = CharField(max_length=20, choices=Type.choices)
    text              = CharField(max_length=500)
    related_object_id = UUIDField(null=True, blank=True)
    is_read           = BooleanField(default=False)
    created_at        = DateTimeField(auto_now_add=True)
    # Index: BTree(recipient, is_read, -created_at)
    # Partial index: WHERE is_read = FALSE for fast unread queries
```

**Database triggers** (applied via `RunSQL` migrations):

1. **Follow count trigger**: On Follow INSERT/DELETE, atomically update `User.followers_count` and `User.following_count`
2. **Review like count trigger**: On ReviewLike INSERT/DELETE, update `Review.like_count`
3. **Comment count trigger**: On Comment INSERT/DELETE, update `Review.comment_count`
4. **Playlist items count trigger**: On PlaylistItem INSERT/DELETE, update `Playlist.items_count`
5. **Venue search vector trigger**: On Venue INSERT/UPDATE, rebuild `search_vector` from weighted `name` (A) + `cuisine_type` (B) + `tags` (C)
6. **Review search vector trigger**: On Review INSERT/UPDATE, rebuild `search_vector` from weighted `dish_name` (A) + `text` (B)

---

#### 4.3 API Endpoints (Complete Specification)

**Base URL**: `/api/v1/`
**JSON convention**: `snake_case` (frontend adapter converts to camelCase)
**Error format**: `{ "error": { "code": "VALIDATION_ERROR", "message": "...", "status": 422, "details": [...] } }`

**Authentication endpoints**:

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/auth/register/` | No | Register (email, name, password, password_confirm) → access token + refresh cookie + user |
| `POST` | `/auth/login/` | No | Login (email, password) → access token + refresh cookie + user |
| `POST` | `/auth/refresh/` | No | Refresh (reads HttpOnly cookie) → new access token + rotated refresh cookie |
| `POST` | `/auth/logout/` | No* | Blacklist refresh token, clear cookie |
| `GET` | `/auth/me/` | Yes | Current user profile |
| `PATCH` | `/auth/me/` | Yes | Update own profile (name, bio, avatar_url, favorite_cuisines) |

**User endpoints**:

| Method | Endpoint | Auth | Pagination | Description |
|--------|----------|------|------------|-------------|
| `GET` | `/users/{id}/` | No | — | Public user profile |
| `GET` | `/users/{id}/reviews/` | No | Cursor | User's reviews |
| `GET` | `/users/{id}/followers/` | Yes | Cursor | Follower list |
| `GET` | `/users/{id}/following/` | Yes | Cursor | Following list |
| `POST` | `/users/{id}/follow/` | Yes | — | Follow user → 201 |
| `DELETE` | `/users/{id}/follow/` | Yes | — | Unfollow user → 204 |

**Venue endpoints**:

| Method | Endpoint | Auth | Pagination | Description |
|--------|----------|------|------------|-------------|
| `GET` | `/venues/` | No | Offset | List venues (filters: `cuisine`, `tags`, `rating_min`, `lat`+`lng`+`radius`, `bbox`) |
| `GET` | `/venues/{id}/` | No | — | Venue detail (includes top_dishes, hours, website) |
| `GET` | `/venues/{id}/reviews/` | Yes | Cursor | Reviews for venue (sort: `recent`, `top`) |

**Query params for `GET /venues/`**:
- `cuisine` — filter by cuisine type (e.g., `Japanese`)
- `tags` — comma-separated, matches venues containing ALL tags
- `rating_min` — minimum rating (e.g., `8.0`)
- `lat`, `lng`, `radius` — radius query in meters (e.g., `lat=28.6&lng=77.2&radius=5000`)
- `bbox` — bounding box for map view (`sw_lat,sw_lng,ne_lat,ne_lng`)
- `sort` — one of: `rating`, `distance`, `recent` (default: `rating`)
- `limit` — items per page (default 20, max 100 for bbox)

**Review endpoints**:

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/reviews/` | Yes | Create review (venue_id, rating 0-10, text min 10 chars, photo_url, dish, tags max 10) |
| `PATCH` | `/reviews/{id}/` | Yes (owner) | Update own review |
| `DELETE` | `/reviews/{id}/` | Yes (owner) | Delete own review → 204 |
| `POST` | `/reviews/{id}/like/` | Yes | Like review → 201 |
| `DELETE` | `/reviews/{id}/like/` | Yes | Unlike review → 204 |
| `GET` | `/reviews/{id}/comments/` | Yes | List comments (cursor pagination) |
| `POST` | `/reviews/{id}/comments/` | Yes | Add comment (text 1-1000 chars) → 201 |
| `DELETE` | `/reviews/{rid}/comments/{cid}/` | Yes (author) | Delete comment → 204 |

**Feed endpoint**:

| Method | Endpoint | Auth | Pagination | Description |
|--------|----------|------|------------|-------------|
| `GET` | `/feed/` | Yes | Cursor | Main feed with `tab` param |

**Feed tab behavior**:
- `tab=recent` — Chronological reviews from followed users. Cursor encodes `(created_at, id)`.
- `tab=top-picks` — Algorithmic ranked feed. Cursor encodes `(score, id)`.
- `tab=explore` — Trending reviews from outside user's network.

**Feed response format** (denormalized — user, venue, review embedded in each item):
```json
{
  "data": [{
    "id": "fi_...",
    "item_type": "review",
    "review": { "id", "rating", "text", "dish", "photo_url", "tags", "like_count", "comment_count", "is_liked", "created_at" },
    "user": { "id", "name", "avatar_url", "level" },
    "venue": { "id", "name", "location" }
  }],
  "pagination": { "next_cursor": "...", "has_more": true, "limit": 20 }
}
```

**Search endpoints**:

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/search/` | Yes | Unified search (q, type=all/venue/user/review, cuisine, tags, lat, lng) |
| `GET` | `/search/autocomplete/` | Yes | Lightweight autocomplete (q, type=all/venue/user, max 10 results) |

**Search response** (type=all returns grouped results):
```json
{
  "data": {
    "venues": [{ "id", "name", "cuisine", "location", "rating", "photo_url" }],
    "users": [{ "id", "name", "avatar_url", "level" }],
    "reviews": [{ "id", "text", "rating", "user": {...}, "venue": {...} }]
  },
  "pagination": { "offset": 0, "limit": 20, "total": 45 }
}
```

**Playlist endpoints**:

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/playlists/` | Yes | List playlists (optional `user_id` filter) |
| `POST` | `/playlists/` | Yes | Create playlist (title, description, is_public) |
| `GET` | `/playlists/{id}/` | Yes | Playlist detail with embedded venue items |
| `PATCH` | `/playlists/{id}/` | Yes (owner) | Update playlist metadata |
| `DELETE` | `/playlists/{id}/` | Yes (owner) | Delete playlist → 204 |
| `POST` | `/playlists/{id}/items/` | Yes (owner) | Add venue to playlist (venue_id, caption) |
| `DELETE` | `/playlists/{pid}/items/{iid}/` | Yes (owner) | Remove item → 204 |
| `PATCH` | `/playlists/{pid}/items/reorder/` | Yes (owner) | Reorder items (item_ids array) |

**Notification endpoints**:

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/notifications/` | Yes | Notification feed (cursor pagination, includes `meta.unread_count`) |
| `POST` | `/notifications/mark-read/` | Yes | Mark read (notification_ids array or `all: true`) |

---

#### 4.4 Authentication Flow (JWT with HttpOnly Cookies)

**Token strategy**:
- **Access token** (15 min): Stored in JavaScript memory (NOT localStorage). Sent as `Authorization: Bearer <token>`. If XSS occurs, attacker has at most 15 minutes.
- **Refresh token** (7 days): Set as `HttpOnly`, `Secure`, `SameSite=Lax` cookie by Django. JavaScript cannot read it. Browser sends it automatically to `/api/auth/refresh/`. Path scoped to `/api/auth/`.
- **Rotation**: Each refresh generates a new refresh token. Old one is blacklisted via `rest_framework_simplejwt.token_blacklist`.

**Login flow**:
```
User submits email + password → POST /api/auth/login/
  ↓
Django validates credentials
  ↓
Generates access + refresh tokens
  ↓
Response body: { "access": "eyJ...", "user": { id, email, name, avatar_url, level, bio } }
Response cookie: Set-Cookie: de_refresh=eyJ...; HttpOnly; Secure; SameSite=Lax; Path=/api/auth/; Max-Age=604800
  ↓
Frontend: setAccessToken(data.access) in memory, setUser(data.user)
  ↓
Router.push('/feed')
```

**Session restoration** (on page load):
```
AuthContext.useEffect → POST /api/auth/refresh/ (browser auto-sends cookie)
  ↓
If 200: setAccessToken(data.access), GET /api/auth/me/, setUser(data)
If 401: setUser(null), redirect to /login
```

**Frontend API client** (`src/api/client.ts`):
- Axios instance with `withCredentials: true`
- Request interceptor: attach `Authorization: Bearer <token>` from memory
- Response interceptor: on 401, attempt refresh with mutex pattern (prevents multiple simultaneous refresh requests)
- Failed queue: requests that arrive during refresh are queued and retried with new token

**Next.js config** (`next.config.mjs`):
- API proxy rewrite: `/api/:path*` → `http://localhost:8000/api/:path*` (avoids CORS in dev, cookie domain matches)

---

#### 4.5 Search Implementation (PostgreSQL Only — No ElasticSearch)

**Why not ElasticSearch**: PostgreSQL's `tsvector` + `pg_trgm` handles all our search use cases at <15ms latency up to 10M+ documents. ElasticSearch adds: a separate cluster to manage, data synchronization complexity (dual-writes or CDC pipeline), and operational overhead — none of which is justified at our scale.

**Search capabilities**:

| Use Case | PostgreSQL Solution | Index Type |
|----------|-------------------|------------|
| Venue name search with typos | `pg_trgm` with `similarity()` | GIN trigram |
| Review full-text search | `tsvector`/`tsquery` with weighted vectors | GIN |
| Tag-based filtering | `ArrayField` with `@>` / `&&` operators | GIN |
| Autocomplete suggestions | `pg_trgm` with `similarity()` or `LIKE 'prefix%'` | GIN trigram / BTree |
| Combined geo + text search | PostGIS `ST_DWithin` + `tsvector` in single query | GIST + GIN |
| People search | `pg_trgm` on username/name | GIN trigram |

**Unified search service** (`apps/search/services.py`):
```python
def unified_search(query_text, user_location=None, cuisine=None, tags=None, limit=20):
    # 1. Text search: combine tsvector full-text + trigram fuzzy matching
    # 2. Geo filter: PostGIS ST_DWithin if user_location provided
    # 3. Cuisine filter: iexact match
    # 4. Tag filter: ArrayField contains
    # 5. Order by combined_score (Greatest of fts_rank, name_similarity)
```

**Search vector triggers** (auto-maintained via PostgreSQL triggers):
- **Venue**: `setweight(name, 'A') || setweight(cuisine_type, 'B') || setweight(tags, 'C')`
- **Review**: `setweight(dish_name, 'A') || setweight(text, 'B')`

---

#### 4.6 Geospatial Implementation (PostGIS)

**Setup**: `django.contrib.gis` + `geography(Point, 4326)` column + GIST index.

**Key queries**:

| Query | Django ORM | Use Case |
|-------|-----------|----------|
| Radius search | `Venue.objects.filter(location__distance_lte=(point, D(km=5)))` | "Nearby" venues |
| Bounding box | `Venue.objects.filter(location__within=bbox_polygon)` | Map viewport |
| Distance annotation | `.annotate(distance=Distance("location", point))` | Sort by distance |
| Combined geo+filter | `.filter(location__distance_lte=..., cuisine_type="Japanese", rating__gte=8)` | Filtered map |

**Performance**: GIST index on `location` column enables sub-millisecond spatial queries. No Haversine formula, no full-table scans.

---

#### 4.7 Caching Strategy (Phased)

**Phase 1 — MVP (current)**: `LocMemCache` with `CacheKeys`/`CacheTTL` abstraction classes.

| Data | TTL | Invalidation |
|------|-----|-------------|
| Feed pages | 2 min | On new review from followed user |
| Venue detail | 15 min | On new review for venue |
| Venue stats | 5 min | On new review for venue |
| User profile | 10 min | On profile edit |
| Search results | 5 min | Time-based only |

**CacheKeys class** (defined from day 1):
```python
class CacheKeys:
    @staticmethod
    def user_feed(user_id, cursor="first"):
        return f"v1:feed:user:{user_id}:cursor:{cursor}"

    @staticmethod
    def venue_detail(venue_id):
        return f"v1:venue:{venue_id}:detail"
    # ... etc
```

**Phase 2 — Growth (1K+ users)**: Switch to Redis via settings change only. Add: session-backed cache, rate limiting cache, signal-based invalidation.

**Phase 3 — Scale (50K+ users)**: Redis sorted sets for leaderboards/trending, Celery async invalidation for high-fanout events.

---

#### 4.8 Frontend Integration Plan

**Step 1: Create API client** (`src/api/client.ts`)
- Axios instance with `baseURL: ''` (uses Next.js proxy)
- `withCredentials: true` for refresh cookie
- Request interceptor: attach Bearer token from in-memory variable
- Response interceptor: 401 → refresh with mutex → retry failed requests → redirect to /login on refresh failure

**Step 2: Update AuthContext** (`src/context/AuthContext.tsx`)
- Replace mock login with `POST /api/auth/login/`
- Add `register()`, `logout()`, `refreshUser()` methods
- On mount: attempt session restoration via `POST /api/auth/refresh/`
- `isLoading` state to prevent flash of login page during session check

**Step 3: Replace mock API functions** (`src/api/mockApi.ts` → `src/api/client.ts`)
- Each `fetch*` function → `apiClient.get()` call
- Each mutation → `apiClient.post()/patch()/delete()` call
- Add response adapter layer: snake_case API → camelCase TypeScript
- React Query hooks stay the same, only `queryFn` changes

**Step 4: Type mapping** (API response → existing TypeScript interfaces):

| Frontend Type | API Source | Mapping |
|---------------|-----------|---------|
| `User` | `GET /users/{id}` | `avatar_url` → `avatarUrl`, `followers_count` → `followers` |
| `Venue` | `GET /venues/{id}` | `photo_url` → `photoUrl`, add `lat`/`lng` from `location` |
| `FeedReview` | `GET /feed` item | Flatten: `venue = item.venue.name`, `user = item.user`, fields from `item.review` |
| `Playlist` | `GET /playlists/{id}` | `items` array embedded, map snake_case |
| `PlaylistItem` | Nested in Playlist | `photo_url` from `item.venue.photo_url`, `venueId = item.venue.id` |

**Step 5: Connect login page** to real auth API
**Step 6: Connect feed** to `GET /api/feed/`
**Step 7: Connect map** to `GET /api/venues/?bbox=...`
**Step 8: Connect profile** to `GET /api/users/{id}/`
**Step 9: Connect playlists** to playlist API
**Step 10: Connect search** to `GET /api/search/`

---

#### 4.9 Implementation Order

The backend should be built in this sequence (each step is independently testable):

1. **Django project scaffold** — project structure, settings, requirements, manage.py
2. **PostgreSQL + PostGIS setup** — database creation, extensions, initial migration
3. **User model + auth views** — register, login (cookie-based), refresh, logout, me
4. **Venue model + views** — CRUD, geospatial queries, search vector triggers
5. **Review model + views** — CRUD, like/unlike, comments, count triggers
6. **Playlist model + views** — CRUD, item management, reorder
7. **Feed view** — cursor-paginated feed from followed users' reviews
8. **Search views** — unified search + autocomplete using pg_trgm + tsvector
9. **Notification model + views** — create on like/comment/follow, list + mark-read
10. **Frontend API client** — Axios interceptors, token management
11. **Frontend AuthContext** — real JWT auth replacing mock
12. **Frontend integration** — connect all pages to real API, replace mockApi
13. **Seed data migration** — load mock data into PostgreSQL for testing

---

### Milestone 5: Social Features & Content Interaction

**Goal**: Bring the social graph and content interaction features to life across frontend and backend. Users should be able to follow/unfollow, interact with content (like, comment, bookmark), view detailed review pages, and discover new users through taste matching.

#### 5.1 Social Graph Frontend

- **User profile enhancements**:
  - Follow/unfollow button on user profile and user cards
  - Followers/following list pages with infinite scroll
  - `is_following` and `is_followed_by` annotation flags in UserSerializer responses
  - Follow button states: "Follow" (outline) → "Following" (filled) → "Unfollow" (on hover, red outline)

- **User discovery**:
  - "Suggested Users" section on explore tab
  - Discovery signals: friend-of-friend connections, venue overlap (shared reviewed venues), cuisine preference overlap, popularity (follower count)
  - Scoring: `discovery_score = 0.4*mutual_friends + 0.3*venue_overlap + 0.2*cuisine_match + 0.1*popularity`

- **Taste match display**:
  - Percentage badge on user profile: "87% taste match"
  - Algorithm: Weighted hybrid — Adjusted Cosine Similarity (0.7) + Jaccard Similarity (0.3)
  - Adjusted Cosine: Compare rating vectors (normalized by each user's mean rating) for shared venues
  - Jaccard: Overlap of positively-rated venues (rating >= 7.0)
  - Confidence dampening: If shared venues < 3, multiply score by `shared_count / 3`
  - `TasteMatchCache` model: `user_a`, `user_b`, `score` (0-1), `shared_venues`, `computed_at`; recompute on new review via Celery or signal

#### 5.2 Content Interactions

- **Like toggle with animation**:
  - Heart burst animation on like (Framer Motion `AnimatePresence` + scale/opacity keyframes)
  - Double-tap to like on ReviewCard photo area (500ms debounce, fullscreen heart overlay)
  - Optimistic UI update (increment count immediately, rollback on API error)
  - Like API: `POST/DELETE /api/reviews/{id}/like/` (already exists in M4)

- **Comments system**:
  - Inline comment preview on review cards (show 2 most recent, "View all N comments" link)
  - Full comment thread on review detail page
  - Add `parent` ForeignKey to Comment model for threaded replies (max depth 1)
  - Constraint: parent must belong to same review

- **Bookmark/save system**:
  - Save button (bookmark icon) on ReviewCard and venue detail
  - `Bookmark` model: `user`, `review` (nullable), `venue` (nullable), `collection` FK, `created_at`
  - `BookmarkCollection` model: `user`, `name`, `is_default` (for "Want to Try", "Favorites")
  - Saved items page accessible from profile

- **"Add to Playlist" quick action**:
  - Bottom sheet on ReviewCard long-press or dedicated button
  - Shows user's playlists with "Create New" option
  - POST to existing playlist items API

#### 5.3 Review Detail Page

- **Layout** (`/review/[id]`):
  - Full-screen hero photo with carousel (if multiple photos)
  - User info bar (avatar, name, level, follow button, timestamp)
  - Rating display (large, with star animation)
  - Venue card (linked to venue detail)
  - Full review text (no truncation)
  - Tags section
  - Action bar: Like, Comment, Bookmark, Share
  - Comments section (threaded, with reply)
  - "More from this user" / "More about this venue" horizontal scroll

- **OG Meta tags** for social sharing:
  - `og:title`: "{user} reviewed {venue}"
  - `og:image`: review photo URL
  - `og:description`: review text truncated to 160 chars

- **API**: `GET /api/reviews/{id}/` — return full review with embedded user, venue, comments

#### 5.4 Taste Match Algorithm (Backend)

- **Adjusted Cosine Similarity**:
  ```python
  def adjusted_cosine(user_a_ratings, user_b_ratings, shared_venues):
      mean_a = mean(user_a_ratings.values())
      mean_b = mean(user_b_ratings.values())
      num = sum((user_a_ratings[v] - mean_a) * (user_b_ratings[v] - mean_b) for v in shared_venues)
      den_a = sqrt(sum((user_a_ratings[v] - mean_a)**2 for v in shared_venues))
      den_b = sqrt(sum((user_b_ratings[v] - mean_b)**2 for v in shared_venues))
      return num / (den_a * den_b) if den_a * den_b > 0 else 0
  ```

- **Final score**: `taste_match = 0.7 * adj_cosine + 0.3 * jaccard`
- **Confidence**: If `len(shared_venues) < 3`: `score *= len(shared_venues) / 3`
- **Caching**: Precompute top-50 matches per user, refresh daily via Celery beat

---

### Milestone 6: Feed Intelligence & Personalization

**Goal**: Replace the simple chronological feed with intelligent, personalized ranking. Implement explore/trending tabs, handle cold-start users, and enforce content diversity.

#### 6.1 Feed Scoring Algorithm (EdgeRank-Style)

- **Core formula**:
  ```
  Score = (0.30*Social + 0.25*Engagement + 0.25*Preference + 0.20*Quality) / (age_hours + 2)^1.5
  ```

- **Signal definitions**:
  | Signal | Weight | Components |
  |--------|--------|------------|
  | Social | 0.30 | `is_following` (1.0), interaction frequency with author (0-1), mutual follows bonus (+0.2) |
  | Engagement | 0.25 | Normalized `like_count`, `comment_count`, `bookmark_count` (log-scaled, capped at 95th percentile) |
  | Preference | 0.25 | Cuisine match (user's favorite_cuisines overlap), venue proximity, rating alignment |
  | Quality | 0.20 | Has photo (+0.3), text length > 100 chars (+0.2), specific rating (+0.1), tags > 2 (+0.1) |
  | Decay | divisor | `(age_hours + 2)^1.5` — reviews older than 48h decay rapidly |

- **PostgreSQL optimization**: Precompute `quality_score` on review save; cache social affinity in `UserAffinity` table updated on interaction; use SQL window functions for engagement percentiles

#### 6.2 Explore Tab & Trending Detection

- **Explore feed pipeline** (3 stages):
  1. **Candidate generation**: Reviews from non-followed users, rating >= 7.0, within 7 days, user's city/region
  2. **Scoring**: Same formula but Social signal replaced with Discovery signal (venue novelty, cuisine diversity, trending boost)
  3. **Diversity enforcement**: MMR re-ranking (see 6.4)

- **Trending detection** (Z-score anomaly + exponential decay):
  - `z_score = (recent_review_count - baseline_avg) / baseline_std`
  - `velocity = last_24h_reviews / (7d_avg_daily)`
  - `decay_score = sum(exp(-0.1 * age_hours) for each recent review)`
  - `trending_score = 0.4*z_score + 0.3*velocity + 0.3*decay_score`
  - `VenueTrendingScore` model: `venue` (OneToOne), `score`, `review_velocity`, `computed_at`; recomputed every 30 min via Celery beat

#### 6.3 Cold-Start Handling

- **4-tier fallback system**:
  | Tier | Trigger | Feed Strategy |
  |------|---------|--------------|
  | 0: Anonymous | No account | Global popular reviews, trending venues (read-only) |
  | 1: Cold Start | 0 follows, no taste profile | Cuisine-preference-based from taste wizard |
  | 2: Augmented | < 5 follows OR < 3 reviews | 60% curated + 40% social |
  | 3: Healthy | >= 5 follows AND >= 3 reviews | Full personalized feed |

- Auto-follow 3-5 curated "de. Tastemaker" accounts on signup to bootstrap feed
- `UserTasteProfile` model: `preferred_cuisines`, `dietary_restrictions`, `price_preference`, `spice_tolerance`, `completed_wizard`, `maturity_level` (0-5)

#### 6.4 Diversity Enforcement (MMR)

- **Maximal Marginal Relevance re-ranking**: Balance relevance vs. diversity with `lambda=0.7`
- **Similarity function**: Same-venue (0.5 weight), same-cuisine (0.3), same-user (0.2)
- **Hard rules**: Max 2 reviews from same venue in top 20, max 4 from same cuisine, max 3 from same user

---

### Milestone 7: Enhanced Search & Discovery

**Goal**: Upgrade search to be dish-aware, occasion-driven, and diet-friendly. Add collaborative filtering and enhanced map features.

#### 7.1 Dish as First-Class Entity

- **New `Dish` model**: `venue` FK, `name`, `category` (appetizer/main/dessert/drink), `avg_rating`, `review_count`, `photo_url`, `tags` ArrayField, `search_vector`
  - UniqueConstraint: `(venue, Lower(name))`
  - Indexes: GIN on search_vector, trigram GIN on name

- **Review model update**: Add `dish` ForeignKey (nullable, SET_NULL) alongside existing `dish_name`. Remove `UniqueConstraint(user, venue)` to allow multiple reviews per venue (one per dish)

- **Dish-level pages**: `/dish/[id]` — all reviews for a specific dish, average rating, photos
- **Dish-level search**: `GET /api/dishes/?q=tiramisu&venue_id=...`

#### 7.2 Occasion Tags ("Perfect For")

- **OccasionTag model**: `slug` (PK), `label`, `emoji`, `category` (social/time/vibe)
- **VenueOccasion model**: `venue` FK, `occasion` FK, `vote_count`; UniqueConstraint(venue, occasion)
- **OccasionVote model**: `user`, `venue`, `occasion`, `created_at`; UniqueConstraint(user, venue, occasion)

- **Predefined taxonomy** (The Infatuation style):
  - Social: Date Night 🕯️, Group Dinner 👥, Business Lunch 💼, Solo Dining 🧘, Family 👨‍👩‍👧‍👦
  - Time: Brunch 🥞, Late Night 🌙, Happy Hour 🍻, Weekend 🎉
  - Vibe: Cozy 🛋️, Trendy ✨, Rooftop 🏙️, Outdoor 🌿, Live Music 🎵, Hidden Gem 💎

- **UI**: "Perfect For" chips on venue detail, crowdsourced voting (tap to agree)
- **API**: `POST /api/venues/{id}/occasions/{slug}/vote/`, `GET /api/venues/?occasion=date-night`

#### 7.3 Dietary Filtering

- **DietaryReport model**: `venue` FK, `user` FK, `category` (vegetarian/vegan/gluten_free/halal/keto/nut_free), `scope` (venue/dish), `dish` FK (nullable), `is_available`, `confidence` (aggregated)
- Confidence scoring: `confidence = count_available / total_reports` — display badges when >= 0.7
- Filter chips on venue list and search
- **API**: `GET /api/venues/?dietary=vegetarian,gluten_free`

#### 7.4 Map Enhancements

- **Friends' venues layer**: `GET /api/venues/friends/?bbox=...` — venues reviewed by followed users; different marker style (avatar cluster dots); toggle in filter bar

- **Heatmap visualization**: deck.gl `HeatmapLayer` for review density; data source: review locations aggregated by grid cell; toggle between markers and heatmap view

- **Collaborative filtering** (venue similarity):
  - PostgreSQL materialized view: cosine similarity of co-occurring positive ratings (rating >= 7.0) between venue pairs with >= 2 shared users
  - `GET /api/venues/{id}/similar/` — returns venues with highest similarity
  - Refresh daily via Celery task

#### 7.5 AI-Powered Search (Optional — requires OpenAI API)

- **Conversational search**: "romantic Italian near me under $50"
  - OpenAI function calling (GPT-4o-mini) for structured query extraction → `{ cuisine, occasion, radius, price }`
  - Estimated cost: ~$1/day for 10K queries

- **Cost-effective fallback**: Keyword-based regex parser against known cuisine list, location patterns, occasion terms, and price indicators

---

### Milestone 8: Onboarding & Growth

**Goal**: Reduce friction, get users to value faster. Content-first onboarding (browse before signup), taste profiling, and progressive feature disclosure.

#### 8.1 Content-First Onboarding

- **Philosophy**: TikTok/Pinterest pattern — browse content before signup. Gate write actions behind auth.

- **ReadPublicWriteAuthenticated permission**: Allow `SAFE_METHODS` for unauthenticated; require auth for POST/PATCH/DELETE
  - Apply to: Feed, Venue list/detail, Review list, Search, Explore
  - Keep `IsAuthenticated` on: Review create, Like, Comment, Follow, Playlist CRUD, Notifications

- **AuthGate component** (frontend): Wraps interactive elements; shows signup prompt dialog if user clicks while unauthenticated
  - Usage: `<AuthGate action="like this review"><HeartButton /></AuthGate>`

- **Next.js middleware**: Allow unauthenticated access to `/feed`, `/venue/*`, `/review/*`; redirect to `/login` only for `/profile/*`, `/playlist/new`, `/review/new`

#### 8.2 Taste Profile Wizard

- **3-step flow** (triggered after registration, URL: `/onboarding`):

  1. **Cuisine preferences**: Visual emoji grid (12-16 options: 🍣 Japanese, 🍕 Italian, 🌮 Mexican, 🍜 Chinese, 🍛 Indian, 🍔 American, 🥐 French, 🍝 Mediterranean, 🥘 Thai, 🍱 Korean, 🥗 Healthy, 🧁 Desserts, ☕ Coffee, 🍷 Wine, 🌱 Vegetarian, 🔥 Street Food). Multi-select min 3, max 8.

  2. **Dietary preferences**: Toggle chips (Vegetarian, Vegan, Gluten-Free, Halal, Kosher, Nut-Free, Dairy-Free) + "No restrictions" option

  3. **Suggested users**: 8-12 curated tastemaker accounts; avatar, name, bio, cuisine specialties, follow button; "Follow All" shortcut; pre-select 3 accounts

- **Skip behavior**: Uses defaults (popular cuisines, no restrictions, auto-follow 3 curated accounts)

#### 8.3 Progressive Feature Disclosure

- **Maturity levels** (0-5):
  | Level | Trigger | Unlocks |
  |-------|---------|---------|
  | 0 | Account created | Browse, follow, like |
  | 1 | First review | Comment, bookmark, create playlist |
  | 2 | 3 reviews + 5 follows | Share, add to playlist, occasion voting |
  | 3 | 10 reviews + 2 playlists | Leaderboard visibility, badge progress |
  | 4 | 25 reviews | Verified reviewer badge, trending contributor |
  | 5 | 50 reviews + community engagement | Tastemaker status, curated feed contribution |

- **FeatureGate component**: Renders children if `user.maturityLevel >= minLevel`, else shows `LockedFeaturePrompt` with progress info

- **Gentle prompts**: "Write your first review to unlock comments!", "Create a playlist to share your spots!"

#### 8.4 First Post Wizard

- **QuickReviewView**: Simplified 3-field form for first-time posters
  - Photo-first flow: Camera → snap/upload → auto-detect venue (Places autocomplete) → rate (1-10 tap) → optional text → done
  - `QuickReviewSerializer` with relaxed validation (no min text length, no tags required)
  - Celebration animation on submission (confetti burst)

---

### Milestone 9: Notifications & Real-Time

**Goal**: Comprehensive notification system with real-time updates, smart nudges, and user-controlled preferences. Timely, relevant, and never spammy.

#### 9.1 Notification System Overhaul

- **Expanded Notification model** (extends existing M4 model):
  - Add fields: `actor` FK (who triggered), `priority` (high/medium/low), `channel` (in_app/push/email), `group_key` (for bundling, e.g. "like:review:{id}")
  - New types: `mention`, `trending`, `streak`, `badge`, `nudge`, `digest`

- **Notification bundling**: Group by `group_key` within 1-hour window — "Alice and 2 others liked your review"

- **Frequency caps**: Max 10 notifications/hour per user, max 3 of same type per hour
- **Smart timing**: Suppress during quiet hours (11 PM - 7 AM user local time), queue and deliver at 7 AM

#### 9.2 Real-Time Badge Updates (SSE)

- **SSE endpoint**: `GET /api/notifications/stream/` — `BadgeStreamView` streams `{"unread_count": N}` via `StreamingHttpResponse` with `text/event-stream` content type; polls DB every 5s

- **Polling fallback**: `GET /api/notifications/unread-count/` — returns `{"unread_count": N}`

- **Frontend**: `EventSource` API with auto-reconnect, update tab bar badge indicator

#### 9.3 Smart Nudges

- **Location-based**: `GET /api/venues/nearby-saved/?lat=...&lng=...&radius=500` — saved/bookmarked venues within radius; push: "You're near {venue}! You saved it 3 weeks ago."

- **Want-to-try reminders**: `VenueSaveReminder` model (`user`, `venue`, `remind_at`, `sent`); Celery daily check, remind for bookmarks > 7 days old not yet reviewed

- **Re-engagement**: "Your friend {name} just posted a review at {venue}" — triggered by friend activity in user's area

#### 9.4 Weekly Digest

- Celery beat task: Every Sunday 10 AM per timezone
- Content: Top 5 reviews from followed users, trending venues nearby, streak status, badge progress
- Delivery: In-app notification + optional email (respects preferences)

#### 9.5 Notification Preferences

- **NotificationPreference model**: `user` (OneToOne), per-category frequency (`likes`, `comments`, `follows`, `trending`, `nudges`, `digest`) — each: immediately/daily/weekly/off; `push_enabled`, `email_enabled`, `quiet_hours_start`, `quiet_hours_end`

- **Preference center UI**: Settings page with toggles per category, frequency selectors, quiet hours picker

---

### Milestone 10: Gamification & Retention

**Goal**: Drive repeat engagement through progression systems, social competition, and achievement tracking. Modeled after Duolingo's retention mechanics adapted for food discovery.

#### 10.1 XP & Level System

- **Models**:
  - `UserXP`: `user` (OneToOne), `total_xp`, `level` (1-20), `updated_at`
  - `XPTransaction`: `user` FK, `amount` (int, can be negative), `reason` (review/photo/comment/streak_bonus/badge_unlock), `source_id` (UUID), `created_at`

- **XP awards**: Review 100 (+50 with photo, +25 if >100 chars), Comment 25, Receive like 15 (cap 50/day), Give like 10 (cap 20/day), Streak day 50 (+25 per 7 consecutive), Badge unlock 200, First review at new venue 75

- **Level formula**: `XP_required = 75 * level^1.8` (20 levels)
  - Level 5: 1,275 XP | Level 10: 4,732 XP | Level 15: 10,143 XP | Level 20: 17,411 XP

- **Level-up UX**: Full-screen animation + notification + profile badge update

#### 10.2 Dining Streaks

- **DiningStreak model**: `user` (OneToOne), `current_streak`, `longest_streak`, `last_activity` (DateField), `streak_freezes` (max 2), `timezone`

- **Rules**: Day = user's local timezone calendar day; Activity = posting review or adding to playlist; 4-hour grace period (1 AM activity counts for previous day); Streak freeze earned every 7 consecutive days, auto-used on miss; Weekly flexible mode (5 of 7 days)

- **Visual**: GitHub-style contribution grid on profile page, colored by activity intensity

#### 10.3 Achievement Badges

- **8 categories × 4 tiers** (Bronze → Silver → Gold → Platinum):
  | Category | Bronze | Silver | Gold | Platinum |
  |----------|--------|--------|------|----------|
  | Explorer | 5 venues | 25 | 100 | 500 |
  | Critic | 10 reviews | 50 | 200 | 1000 |
  | Social | 10 follows | 50 | 200 | 1000 |
  | Photographer | 10 photos | 50 | 200 | 1000 |
  | Curator | 1 playlist | 5 | 20 | 50 |
  | Streak | 7 days | 30 | 90 | 365 |
  | Specialist | 10 in 1 cuisine | 25 | 50 | 100 |
  | Community | 50 likes given | 200 | 500 | 2000 |

- **UI**: Profile badge shelf, shimmer on unlock, locked badges grayed with progress bar

#### 10.4 Leaderboards

- **LeaderboardEntry model**: `user` FK, `board_type` (city/friends/cuisine:{name}), `period` (weekly/monthly/alltime), `score`, `rank`, `updated_at`

- **Redis sorted sets** for real-time ranking: `zadd`, `zrevrank`, `zrevrange`
- **Views**: City (top reviewers in user's city), Friends (among followed), Cuisine-specific
- **Time periods**: This week, this month, all time

#### 10.5 Year in Review ("de. Wrapped")

- **WrappedStats model**: `user` FK, `year`, `total_reviews`, `total_venues`, `total_cuisines`, `top_cuisine`, `top_venue_id`, `top_venue_name`, `longest_streak`, `total_likes_received`, `total_xp_earned`, `data_json` (JSONField for additional stats)
  - UniqueConstraint(user, year)
  - Generated annually via Celery task (December 31)

- **UI**: Swipeable card carousel (Spotify Wrapped style), 5-7 cards with animations
- **Sharing**: Reuse M11 share card system for shareable image cards

- **Activity dashboard**: `UserStatsCache` model — `reviews_30d`, `venues_30d`, `likes_given_30d`, `likes_recv_30d`, `top_cuisine_30d`; refreshed daily via Celery

---

### Milestone 11: Sharing & Virality

**Goal**: Turn every user interaction into a distribution event. Share infrastructure, deep linking, referral program, and viral content formats.

#### 11.1 Share Card Generation

- **Backend (Django Pillow)**: Generate branded share images server-side
  - Sizes: Instagram Story (1080×1920), Feed (1080×1080), Twitter (1200×675), OG default (1200×630)
  - Content: Review photo (cropped), gradient overlay, venue name, rating, "de." watermark

- **Frontend (Next.js `@vercel/og`)**: Edge function at `/api/og?type=review&id=xxx` for OG image generation on-the-fly; used as `<meta property="og:image">`

- **Share button**: Web Share API (`navigator.share()`) with fallback to copy-to-clipboard + toast

#### 11.2 Deep Linking

- **Universal Links (iOS)**: `/.well-known/apple-app-site-association` — paths: `/review/*`, `/venue/*`, `/playlist/*`, `/user/*`
- **App Links (Android)**: `/.well-known/assetlinks.json`
- **Web fallback**: All deep link URLs render full web pages with OG meta tags
- **Deferred deep linking**: `DeferredDeepLink` model (`target_url`, `referrer` FK, `fingerprint`, `claimed_by`, `claimed_at`) for attribution tracking

#### 11.3 Referral Program

- **Models**:
  - `InviteCode`: `code` (unique), `user` FK, `max_uses`, `use_count`
  - `Referral`: `inviter` FK, `invitee` FK, `invite_code` FK, `status` (signed_up/activated/churned)
  - `ReferralReward`: `user` FK, `reward_type` (xp_bonus/badge/premium_feature), `tier` (3/10/25), `claimed`

- **Two-sided rewards**: Inviter gets XP bonus + badge progress; invitee gets skip onboarding step + bonus XP
- **K-factor tracking**: `K = invites_sent × conversion_rate` — per user and global
- **Tiered incentives**: 3 referrals (Bronze Recruiter), 10 (Silver + 500 XP), 25 (Gold + exclusive badge)

#### 11.4 Collaborative Playlists

- **PlaylistCollaborator model**: `playlist` FK, `user` FK, `role` (editor/viewer), `added_by` FK; UniqueConstraint(playlist, user)
- **Playlist model additions**: `slug` (auto-generated), `share_code` (6-char alphanumeric), `fork_count`
- Share via link: `delectable.app/playlist/{slug}`
- Fork: Copy playlist to own account with attribution
- Activity feed within playlist: "Alice added Sushi Samba"

#### 11.5 Food Challenges

- **Models**:
  - `Challenge`: `title`, `description`, `rules`, `start_date`, `end_date`, `category` (cuisine/exploration/community), `target_count`, `cuisine_filter`, `xp_reward`, `badge_reward`, `is_active`
  - `ChallengeParticipant`: `challenge` FK, `user` FK, `progress`, `completed`, `joined_at`, `completed_at`
  - `ChallengeSubmission`: `participant` FK, `review` FK, `verified`, `created_at`

- **Leaderboard**: Redis sorted set per challenge, ranked by completion speed + quality
- **Discovery page**: `/challenges` — active, upcoming, past winners
- **Validation service**: Verify review meets challenge criteria (cuisine, date range, minimum quality)

---

### Milestone 12: Deployment & Infrastructure

**Goal**: Containerize all services, set up local development environment, create Kubernetes manifests, and implement CI/CD pipeline.

#### 12.1 Dockerization
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

#### 12.2 Kubernetes Manifests
- **Deployments**: frontend, backend (with resource limits, liveness/readiness probes)
- **Services**: ClusterIP for internal, LoadBalancer/Ingress for external
- **Ingress**: NGINX ingress controller with TLS termination
- **ConfigMaps**: Environment configuration per environment
- **Secrets**: Database credentials, API keys, JWT secret
- **Horizontal Pod Autoscaler**: Based on CPU/memory for backend
- **PersistentVolumeClaims**: For PostgreSQL and ElasticSearch data

#### 12.3 CI/CD Pipeline (GitHub Actions)
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

### Milestone 13: AI, ML & Advanced Intelligence

**Goal**: Build ML-powered recommendation engine and review quality scoring.

#### 13.1 Data Ingestion
- **Google Maps Places API**: Fetch venue data (name, address, photos, ratings, reviews)
  - Batch import for seeding
  - Periodic sync for updates
  - Respect rate limits with queuing (Celery + Redis)
- **Review quality signals**: Aggregate review metadata for ML features
- **ETL pipeline**:
  - Extract: API calls, user-generated data
  - Transform: Clean, normalize, featurize
  - Load: PostgreSQL for structured data, ElasticSearch for search indices

#### 13.2 ML Models (PyTorch)
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

#### 13.3 Backend Integration
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
