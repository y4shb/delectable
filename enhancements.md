# Delectable - Enhancements & Refinements Research

> Generated: 2026-03-05
> Based on: Full codebase analysis + industry research across food app UX, performance optimization, gamification psychology, and AI/ML trends

---

## Table of Contents

1. [Critical Performance Fixes](#1-critical-performance-fixes)
2. [UI/UX Enhancements](#2-uiux-enhancements)
3. [New Feature Ideas](#3-new-feature-ideas)
4. [Search & Discovery Improvements](#4-search--discovery-improvements)
5. [Feed Algorithm Refinements](#5-feed-algorithm-refinements)
6. [Gamification Improvements](#6-gamification-improvements)
7. [Social Feature Enhancements](#7-social-feature-enhancements)
8. [AI & ML Features](#8-ai--ml-features)
9. [Architecture & Infrastructure](#9-architecture--infrastructure)
10. [Design System Refinements](#10-design-system-refinements)
11. [Mobile & PWA Considerations](#11-mobile--pwa-considerations)
12. [Growth & Virality Mechanics](#12-growth--virality-mechanics)

---

## 1. Critical Performance Fixes

These are the highest-impact, lowest-effort improvements based on analysis of the actual codebase.

### 1.1 N+1 Query Elimination (Backend)

| Location | Issue | Fix | Queries Saved |
|----------|-------|-----|---------------|
| `feed/engine.py:56-100` | `get_social_score()` called per review in feed loop (3-4 queries each, up to 100 reviews) | Batch-prefetch all `UserAffinity` scores before the scoring loop | ~300/request |
| `feed/engine.py:112` | `review.bookmarks.count()` called per review in engagement scoring | Annotate `bookmark_count` on the initial queryset with `Count('bookmarks')` | ~100/request |
| `gamification/views.py:150-163` | `User.objects.get(id=...)` inside loop in `FriendsLeaderboardView` | Bulk fetch with `User.objects.filter(id__in=user_ids)` into a dict | ~30/request |
| `feed/views.py:105-108` | `compute_feed_score()` called per review without pre-computing viewer data | Call `_precompute_viewer_preference_data()` once before the loop (already done in explore_feed but not in top-picks) | ~200/request |

### 1.2 Caching Strategy

The current `LocMemCache` backend is per-process and not shared across workers. Switch to Redis.

**Cache layers by data volatility:**

| Data | TTL | Key Pattern |
|------|-----|-------------|
| Engagement percentiles | 30 min | `engagement_pcts` |
| Trending venues | 30 min | `trending:{limit}` |
| Anonymous feed | 5 min | `anon_feed:{limit}` |
| Badge definitions | 1 hour | `badge_defs` |
| User XP profile | 5 min | `xp:{user_id}` |
| Leaderboard (global) | 5 min | `lb:{type}:{period}` |
| Venue detail | 30 min | `venue:{id}` |
| User taste profile | 10 min | `taste:{user_id}` |

### 1.3 Frontend Bundle Optimization

| Technique | Impact |
|-----------|--------|
| Dynamic import `GoogleMapView` (only needed on map page) | ~25% initial bundle reduction |
| Dynamic import gamification components (stats, badges, wrapped pages) | ~15% bundle reduction |
| Add `optimizePackageImports` for `@mui/icons-material` in `next.config.mjs` | Tree-shake unused icons |
| Use `next/image` with AVIF/WebP, `sizes` attribute, blur placeholders | 40-70% image weight reduction |
| Replace Yup with Zod for smaller validation bundle | ~20KB savings |

### 1.4 React Query Tuning

**Recommended `staleTime` values per query type:**

| Query Key | Current | Recommended | Rationale |
|-----------|---------|-------------|-----------|
| `['feedReviews', 'recent']` | default (0) | 30s | Chronological, needs freshness |
| `['feedReviews', 'top-picks']` | default (0) | 2 min | Scored feed, less volatile |
| `['feedReviews', 'explore']` | default (0) | 5 min | Discovery content |
| `['venues']` | default (0) | 10 min | Semi-static |
| `['notifications']` | default (0) | 30s | Needs to feel real-time |
| `['gamification', 'badges']` | none | 30 min | Definitions rarely change |

**Additional React Query improvements:**
- Use `useInfiniteQuery` with `IntersectionObserver` for feed infinite scroll
- Prefetch venue details on review card hover via `queryClient.prefetchQuery`
- Prefetch the next feed tab in background when user is on current tab
- Use server-side prefetch with `HydrationBoundary` for initial feed load

### 1.5 SSE Notification Architecture

Current implementation polls the database every 5 seconds inside the SSE stream. With 1,000 connected users, that's 200 queries/second.

**Fix:**
1. Switch from WSGI to ASGI (Uvicorn) for async SSE support
2. Replace database polling with Redis pub/sub
3. Use `asyncio.sleep()` instead of `time.sleep()` (which blocks the worker)
4. Authenticate SSE via short-lived token in query params (EventSource doesn't support custom headers)

### 1.6 Database Indexing Additions

```
- Review: composite index on (user_id, created_at, like_count) for feed queries
- Notification: partial index on (recipient) WHERE is_read=FALSE for unread count
- Review: GIN index on tags JSONField for preference matching
```

---

## 2. UI/UX Enhancements

### 2.1 Feed Experience

| Enhancement | Description | Rationale |
|-------------|-------------|-----------|
| **Skeleton loading states** | Replace `CircularProgress` spinners with content-shaped skeleton cards | Perceived performance improvement; reduces layout shift |
| **Pull-to-refresh** | Add pull-to-refresh gesture on feed pages | Standard mobile UX pattern users expect |
| **Swipe-to-action on cards** | Swipe left to bookmark, swipe right to like | Reduces tap targets, faster interaction |
| **Video review support** | Allow short video clips (15-30s) in reviews | 48% of restaurant operators now use TikTok; video reviews are increasingly trusted |
| **Carousel/swipe discovery** | Option to swipe through reviews one-by-one (Tinder-style) | 100% task completion rate in user testing, preferred by 83% of users over lists |
| **Feed tabs redesign** | Replace text tabs with icon+label pills with counts (e.g., "Top Picks (12)") | Better visual hierarchy and information density |

### 2.2 Review Card Improvements

| Enhancement | Description |
|-------------|-------------|
| **Dish photo gallery** | Show multiple photos per review in a mini-carousel within the card |
| **Reaction emoji bar** | Replace binary like with emoji reactions (yum, fire, heart-eyes, drool) |
| **"Helpful" counter** | Add a "Helpful" button (separate from like) for review quality signal |
| **Price indicator** | Show $ / $$ / $$$ on the card based on venue price range |
| **Distance badge** | Show walking/driving time from user's location on each card |
| **Verified visit badge** | Visual indicator that the reviewer actually visited the venue |

### 2.3 Venue Detail Page

| Enhancement | Description |
|-------------|-------------|
| **Photo grid header** | Replace single hero photo with a 3-photo grid (1 large + 2 small) |
| **Operating hours** | Show open/closed status with hours; highlight "Closing soon" |
| **Menu section** | Visual menu with dish photos matched from reviews |
| **"Best Dishes" highlight** | Top 3 most-mentioned dishes with mini review excerpts |
| **Booking/reservation CTA** | Integration placeholder for OpenTable/Resy |
| **Wait time indicator** | Crowdsourced "how busy" reports from recent visitors |
| **Sentiment timeline** | Chart showing how venue rating has trended over the last 6 months |

### 2.4 Profile Page

| Enhancement | Description |
|-------------|-------------|
| **Taste DNA visualization** | Radar/spider chart showing cuisine preferences across 6-8 axes |
| **Map of reviewed venues** | Mini-map showing pins for every venue the user has reviewed |
| **"Food personality" archetype** | AI-assigned personality ("The Adventurer", "The Comfort Foodie", "The Health Hawk") |
| **Review highlights reel** | Top 3 most-liked reviews displayed prominently |
| **Following activity feed** | See recent activity from people you follow |

### 2.5 Navigation & Information Architecture

| Enhancement | Description |
|-------------|-------------|
| **Quick review FAB** | Floating action button for "quick review" accessible from any page |
| **Search in header** | Persistent search icon in the header for global search access |
| **Contextual back navigation** | Breadcrumb-style back navigation on detail pages |
| **Deep link support** | Universal links for sharing venues, reviews, and playlists |
| **Haptic feedback** | Vibration on like, bookmark, and streak milestone actions |

---

## 3. New Feature Ideas

### 3.1 High-Impact Features

#### Elo-Style Relative Ranking
Instead of absolute 1-10 ratings, present head-to-head comparisons: "Did you prefer Restaurant A or B?" This produces more meaningful personalized rankings. Beli's core innovation — now at 58M ratings, surpassing Yelp.

**Implementation:** New `PairwiseComparison` model tracking user choices. Build personal rankings using the Elo algorithm (used in chess). Display as a "My Top 10" list.

#### "What Should I Eat?" Decision Engine
Solve decision fatigue with a conversational flow:
1. "What's the occasion?" (Quick lunch / Date night / Group dinner / Solo comfort)
2. "How far will you go?" (Walking / Short drive / Worth the trip)
3. "Any requirements?" (Dietary filters)
4. Result: 3-5 curated picks with explanations

#### Group Dining Consensus
Tinder-style swiping among friend groups to find a restaurant everyone agrees on.
1. Create a "Dinner Plan" and invite friends
2. Each person swipes on suggested venues
3. App finds the match with highest overlap
4. Built-in poll for date/time selection

#### Time Machine (Dish Comparison)
Compare your experience of the same dish across visits. Track how a restaurant's quality evolves over time. Show a timeline view of ratings for a specific dish at a specific venue.

#### Offline Food Journal
Log meals without connectivity for travelers; sync when back online. Essential for international food tourism.

### 3.2 Medium-Impact Features

| Feature | Description |
|---------|-------------|
| **Restaurant "Want to Try" list** | Save venues to a dedicated "Want to Try" list with location-based reminders |
| **Price range filter** | Filter venues by $/$$/$$$/$$$$; track and surface in search |
| **Operating hours integration** | Show open/closed status; filter by "open now" |
| **Menu photos matching** | Auto-match user-submitted food photos to menu items |
| **Collaborative playlists** | Share playlist editing with friends; fork public playlists |
| **Food challenges** | Time-bound community challenges ("Try 10 new cuisines this month") |
| **Monthly mini-recap** | Shorter monthly version of Wrapped to maintain year-round engagement |
| **Restaurant response system** | Allow venue owners to respond to reviews |

### 3.3 Differentiating Features

| Feature | Description |
|---------|-------------|
| **AR dish preview** | Point camera at a table to see 3D dish previews via WebAR |
| **Supper club / exclusive events** | Premium tier with invite-only chef dinners and tastings |
| **Food tourism guides** | Curated city food guides with itineraries |
| **Kitchen stories** | Behind-the-scenes content from restaurants (chef interviews, sourcing) |
| **Seasonal discovery** | Highlight seasonal dishes and limited-time offerings |
| **Weather-aware recommendations** | "It's raining — here are the best ramen spots near you" |
| **Calendar integration** | Detect dinner plans from calendar and suggest venues |

---

## 4. Search & Discovery Improvements

### 4.1 Semantic Search (High Priority)

Replace keyword-based `icontains` search with vector-based semantic search:
- "cozy date night spot with great wine" should return relevant results even without exact keyword matches
- Use embedding model (e.g., `all-MiniLM-L6-v2` fine-tuned on food domain)
- Store embeddings in a vector database (Qdrant, Pinecone, or pgvector)
- Combine with existing keyword search for hybrid results

### 4.2 Search UX Improvements

| Enhancement | Description |
|-------------|-------------|
| **Voice search** | Microphone icon in search bar for hands-free queries |
| **Recent searches** | Persist and display recent search queries |
| **Popular searches** | Show trending search terms from the community |
| **Search suggestions** | Real-time suggestions as user types (currently exists but could be enhanced) |
| **Filter chips below search** | Persistent filter chips for cuisine, dietary, occasion, price, distance |
| **"Open now" filter** | Filter results to only show currently open venues |
| **Sort options in results** | Sort by relevance, rating, distance, newest, most reviewed |
| **Map toggle in results** | Switch between list and map view for search results |
| **Cross-modal search** | Upload a food photo and find similar dishes nearby |

### 4.3 Discovery Features

| Feature | Description |
|---------|-------------|
| **"Near Me" quick filters** | One-tap buttons: "Coffee", "Lunch", "Dinner", "Drinks" based on time of day |
| **Neighborhood exploration** | Browse by neighborhood with curated top picks |
| **"New & Trending" section** | Highlight recently opened venues and rising trending spots |
| **Cuisine deep-dive** | Dedicated pages per cuisine with top venues, popular dishes, and guides |
| **"Surprise Me" button** | Random high-rated venue within user's preferences |
| **Friend recommendations** | "3 of your friends loved this place" badges in search results |
| **Seasonal collections** | Curated seasonal lists ("Best Patios for Summer", "Cozy Winter Spots") |

---

## 5. Feed Algorithm Refinements

### 5.1 Scoring Improvements

| Component | Current | Proposed Improvement |
|-----------|---------|---------------------|
| **Social Signal** | Binary follow check + interaction count | Add interaction recency weighting (recent interactions count more); add comment reply reciprocity |
| **Engagement Signal** | Like/comment/bookmark counts | Add share count, time spent viewing (dwell time), save-to-playlist actions |
| **Preference Signal** | Cuisine match + tag overlap + rating alignment | Add dish-level preference matching, price range alignment, distance preference |
| **Quality Score** | Photo + text length + tags + dish name | Add photo quality score (ML-based), review helpfulness votes, reviewer reputation |
| **Time Decay** | `(age_hours + 2) ^ 1.5` | Tune decay curve per content type; slow decay for high-quality reviews, faster for trending content |

### 5.2 New Feed Signals

| Signal | Weight | Description |
|--------|--------|-------------|
| **Freshness bonus** | 0.10 | Boost reviews from the last 2 hours to keep feed feeling alive |
| **Venue novelty** | 0.05 | Boost venues the viewer hasn't seen before |
| **Photo quality** | 0.05 | Higher score for reviews with high-quality photos |
| **Author diversity** | MMR | Ensure no single author dominates the feed (already partially handled) |
| **Geographic relevance** | 0.10 | Boost venues near the viewer's location |
| **Recency of visit** | -0.05 | Down-weight venues the user has already reviewed |
| **Seasonal relevance** | 0.05 | Boost seasonally appropriate content |

### 5.3 Explore Feed Improvements

- Expand candidate window from 7 days to 14 days for broader discovery
- Add collaborative filtering: "Users with similar taste profiles also liked..."
- Add serendipity injection: 10% of explore feed should be from unfamiliar cuisines
- Add "new venue" boost for venues with < 5 reviews to help them gain visibility
- Consider geographic diversity: don't show 5 venues from the same neighborhood

### 5.4 Cold-Start Improvements

- **Tier 1 (Cold Start):** Ask for 3 quick ratings of popular venues during onboarding (like Netflix's "rate these to get started")
- **Tier 1 → 2 transition:** Auto-suggest follows after first review based on similar reviewers
- **Implicit signals:** Track browse/scroll behavior even before first review to infer preferences
- **Transfer learning:** If user connects social accounts, use cuisine interests from their profile

---

## 6. Gamification Improvements

### 6.1 Streak System Enhancements

| Enhancement | Description | Psychological Basis |
|-------------|-------------|---------------------|
| **Visual streak counter** | Prominent flame icon with day count on profile and feed | Loss aversion — makes the streak tangible |
| **Streak milestones** | Celebrate at 7, 14, 30, 50, 100, 365 days with unique badges | Variable rewards at meaningful thresholds |
| **Streak recovery window** | After breaking a streak, allow "earn back" by completing 2 actions within 24 hours | Reduces rage-quit from accidental breaks |
| **Streak leaderboard** | Show friends' current streaks | Social competition amplifies motivation |
| **Weekend flex mode** | Streak counts 5-of-7 days as active (already in model but enhance UI) | Prevents burnout; ethical design |
| **Gentle "at risk" notifications** | "Your 15-day streak is waiting for you!" (not pushy) | Caring nudge, not aggressive push |

### 6.2 Weekly Leagues (Duolingo Model)

Group users into leagues of ~30 based on weekly activity:
- Top 10 get promoted to higher league
- Bottom 5 get demoted
- League names: Bronze → Silver → Gold → Sapphire → Diamond → Master
- Weekly reset keeps competition fresh
- Show real-time league standings with activity updates

**Duolingo's leagues increased retention from 12% to 55%.**

### 6.3 Badge System Improvements

**New badge categories to add:**

| Category | Example Badges |
|----------|---------------|
| **Dish Explorer** | "Sushi Sensei" (rate 20+ sushi dishes), "Pizza Professor" (20+ pizza spots) |
| **Neighborhood Scout** | "East Side Expert" (10+ venues in a neighborhood) |
| **Hidden Gem Hunter** | "First Reviewer" at 5/15/30 venues |
| **Social Butterfly** | Receive 50/200/500 comments on reviews |
| **Taste Influencer** | 10/50/100 people try a venue based on your review |
| **Weekend Warrior** | Post every weekend for 4/12/26 weeks |
| **Early Bird / Night Owl** | 10+ reviews logged before 9 AM / after 10 PM |

**Badge design principles:**
- Badges should align with core behaviors you want to reinforce
- Make requirements transparent (show progress toward each badge)
- Consider badges that can be won AND lost (increases loss aversion)
- Connect some badges to real-world outcomes (exclusive access, features)

### 6.4 XP System Refinements

| Current | Proposed |
|---------|----------|
| Flat 100 XP per review | Bonus XP for longer text (+25), multiple photos (+25), first review at a venue (+50) |
| 10 XP for liking | Scale: 10 XP first 5 likes/day, 5 XP next 10, 0 after 15 (prevent farming) |
| No XP for search/browse | 5 XP for completing a venue detail view (reward exploration) |
| No multipliers | Double XP weekends, streak multipliers (7-day streak = 1.5x) |
| No XP for challenges | Challenge completion XP (200-500 based on difficulty) |

### 6.5 Year in Taste (Wrapped Enhancement)

Current Wrapped model exists but can be significantly improved:

**Must-have cards:**
1. **Personal Archetype** — AI-assigned food personality ("The Adventurer", "The Comfort Foodie")
2. **Top Cuisine Breakdown** — Pie chart of cuisines tried with comparison to average user
3. **Map Visualization** — Heat map of all neighborhoods/cities explored
4. **Dish of the Year** — Highest-rated dish with photo
5. **Streak Highlights** — Longest streak, total active days
6. **Social Impact** — "Your reviews helped 247 people decide where to eat"
7. **Prediction Card** — "Based on your 2026 tastes, in 2027 you'll love..."
8. **Friend Comparison** — "You and [friend] share 73% taste compatibility"
9. **Fun Stats** — "You ate enough ramen to fill an Olympic swimming pool"

**Share mechanics:**
- Pre-format all cards in 9:16 (Stories-optimized)
- Include subtle app branding (not dominant)
- One-tap share to Instagram/TikTok/Twitter
- Each card should represent the USER's identity, not the app

**Monthly Mini-Wrapped:**
- Shorter monthly recaps to maintain engagement year-round
- "Your March: 8 venues, 3 new cuisines, 12-day streak"

---

## 7. Social Feature Enhancements

### 7.1 Social Graph Improvements

| Feature | Description |
|---------|-------------|
| **Taste match leaderboard** | Rank friends by taste similarity percentage |
| **"People like you" discovery** | Suggest users with high taste match scores |
| **Dining companion tagging** | Tag who you ate with on reviews; build dining graph |
| **Mutual friends badge** | "You and [user] have 5 mutual friends" on profiles |
| **Follow recommendations** | "Based on your activity, you might enjoy following..." |

### 7.2 Review Interaction Improvements

| Feature | Description |
|---------|-------------|
| **Emoji reactions** | Replace binary like with reactions: 🤤 Drooling, 🔥 Fire, 😍 Heart-eyes, 👏 Applause, 📌 Must-try |
| **Review replies from venues** | Let venue owners respond to reviews |
| **"Helpful" votes** | Separate from likes; used to boost review visibility |
| **Photo comments** | Comment on specific photos within a review |
| **Review threading** | Multi-level comment threading (currently max depth 1; consider depth 2) |

### 7.3 Collaborative Features

| Feature | Description |
|---------|-------------|
| **Shared "Want to Try" lists** | Collaborative lists that friends can add to |
| **Group dining planner** | Create events, invite friends, vote on venues |
| **Playlist forking** | Fork a public playlist and customize it |
| **Co-authored reviews** | Two users who dined together can co-author a review |
| **Activity feed** | "What friends are eating" feed showing recent friend activity |

---

## 8. AI & ML Features

### 8.1 High Priority (Near-Term)

#### AI Review Summaries
Use an LLM to generate per-venue summaries organized by theme:
- Food quality summary (most mentioned dishes, flavor descriptors)
- Service summary (speed, friendliness, attentiveness)
- Ambiance summary (noise level, decor, vibe)
- Value summary (portion size, price-to-quality ratio)
- Overall: 3-5 key takeaways synthesized from all reviews

**Implementation:** RAG pipeline using venue reviews as context. Generate on first request, cache for 24 hours, regenerate when new reviews are added.

#### Smart Photo Enhancement
When users upload food photos:
- Auto-enhance lighting, color balance, and saturation
- Score photo quality (0-1) and prioritize high-quality photos in venue galleries
- Auto-crop to best composition

**Implementation:** Fine-tuned image enhancement model or API (e.g., Spyne.ai, MenuPhotoAI).

#### "Why You'll Love This" Explanations
For every recommendation, generate a personalized explanation:
- "Recommended because you love bold flavors and this place's mole sauce is praised in 23 reviews"
- "Your friend Sarah rated this 9.2 and you share 87% taste compatibility"

### 8.2 Medium Priority

#### Conversational Discovery Assistant
RAG-based chatbot that answers natural language questions:
- "What's a good place for a first date near Connaught Place?"
- "Where should I take my parents for their anniversary?"
- "What should I order at [Venue]?"
- Every recommendation traceable to actual reviews (citation links)

#### Photo-to-Dish Identification
Snap a photo of a dish and:
- Identify the dish using food recognition model
- Auto-fill dish name, cuisine tags
- Link to reviews of that dish at the venue
- Find similar dishes at other venues

#### Multi-Dimensional Taste Profiling
Build a dynamic taste profile across multiple axes:
- Cuisine preferences (weighted by review frequency and ratings)
- Spice tolerance (inferred from reviews)
- Price sensitivity (inferred from venue choices)
- Ambiance preference (casual vs. fine dining)
- Adventurousness score (how often they try new cuisines)
- Evolves continuously with every interaction

### 8.3 Future Considerations

| Feature | Description |
|---------|-------------|
| **Review authenticity detection** | ML classifier to flag suspicious reviews |
| **Predictive "Tonight's Pick"** | Predict what user wants based on patterns, weather, day |
| **Cross-modal visual search** | Upload a food photo → find similar dishes nearby |
| **AI venue comparison** | "Compare Restaurant A vs B for a birthday dinner" |
| **Group dining optimizer** | Find venues that satisfy diverse group preferences |
| **Mood-based discovery** | Select a mood → get curated recommendations |
| **Seasonal dish detection** | Identify and highlight seasonal menu items |

---

## 9. Architecture & Infrastructure

### 9.1 Switch to ASGI

Current WSGI blocks worker threads on SSE connections. Switch to ASGI:
```python
# config/settings/base.py
ASGI_APPLICATION = "config.asgi.application"
# Run with: uvicorn config.asgi:application --workers 4
```

### 9.2 Add Redis

Redis is needed for: cache backend, SSE pub/sub, Celery broker, rate limiting.
```yaml
# docker-compose.yml
redis:
  image: redis:7-alpine
  ports: ["6379:6379"]
```

### 9.3 Add Celery for Background Tasks

Move these to background tasks:
- `compute_trending_scores()` — run every 30 minutes
- `UserStatsCache` refresh — run every 15 minutes
- Leaderboard rank computation — run every 15 minutes
- Engagement percentile computation — run every 30 minutes
- Badge progress checking — run async after each XP award
- Digest/notification email sending — run per user preferences
- Review quality score computation — run async on review save

### 9.4 API Response Standardization

Current feed responses mix `{"results": [...]}` and `{"data": [...]}`. Standardize all responses to:
```json
{
  "data": [...],
  "meta": {
    "count": 20,
    "next_cursor": "abc123",
    "has_next": true
  }
}
```

### 9.5 Cursor-Based Pagination

The feed currently returns unpaginated responses. Implement cursor-based pagination:
- More efficient than offset pagination for real-time feeds
- Prevents duplicate/skipped items when new content is added
- `FeedCursorPagination` already exists in `core/pagination.py` but isn't used by `FeedView`

### 9.6 Database Connection Pooling

Add `django-db-connection-pool` or use PgBouncer. With ASGI + multiple workers, connection count can spike quickly.

### 9.7 Monitoring & Profiling

| Tool | Purpose |
|------|---------|
| `django-silk` | Request profiling and SQL query analysis (development) |
| Django Debug Toolbar | Catch N+1 queries during development |
| Next.js `useReportWebVitals` | Monitor Core Web Vitals (LCP, CLS, INP) in production |
| Sentry | Error tracking and performance monitoring |

---

## 10. Design System Refinements

### 10.1 Typography Scale Adjustment

| Element | Current | Proposed |
|---------|---------|----------|
| Page titles | Mixed sizes | Standardize: 28px bold |
| Section headers | Mixed | Standardize: 20px semibold |
| Card titles | 20px | Keep |
| Body text | 15px | Keep |
| Captions/metadata | 12-13px | Standardize: 13px |
| Micro text (timestamps) | 12px | Keep |

### 10.2 Animation & Micro-Interactions

| Interaction | Animation |
|-------------|-----------|
| Like button | Scale bounce (already exists) + particle burst for milestone likes |
| Bookmark toggle | Slide-down bookmark icon with color fill |
| Follow button | Checkmark animation on confirm |
| XP earned | Floating "+100 XP" counter that rises and fades |
| Streak increment | Flame pulse animation with counter increment |
| Badge unlock | Full-screen overlay with badge reveal animation |
| Level up | Confetti burst + level number animation |
| Pull-to-refresh | Custom branded animation (fork+knife spinner) |

### 10.3 Dark Mode Enhancements

| Area | Improvement |
|------|-------------|
| Review card gradients | Adjust gradient overlays for better contrast in dark mode |
| Map styling | Dark map styles already exist; ensure filter chips match |
| Image overlays | Increase text shadow weight for readability on dark backgrounds |
| Active states | Use higher-contrast active/pressed states |

### 10.4 Accessibility Improvements

| Area | Improvement |
|------|-------------|
| Color contrast | Audit all text on image overlays for WCAG AA (4.5:1 ratio) |
| Focus indicators | Add visible focus rings on all interactive elements |
| Screen reader labels | Audit all icons and interactive elements for `aria-label` |
| Reduced motion | Respect `prefers-reduced-motion` for all animations |
| Touch targets | Ensure all interactive elements are at least 44x44px |
| Skip navigation | Add "Skip to main content" link for keyboard users |

---

## 11. Mobile & PWA Considerations

### 11.1 Progressive Web App

| Feature | Description |
|---------|-------------|
| **Service worker** | Cache static assets and API responses for offline support |
| **Web app manifest** | Enable "Add to Home Screen" with app icon and splash screen |
| **Push notifications** | Web Push API for notification delivery without native app |
| **Offline review drafting** | Allow composing reviews offline; sync when connected |
| **Background sync** | Queue likes/bookmarks when offline; process when reconnected |

### 11.2 Mobile-Specific UX

| Feature | Description |
|---------|-------------|
| **Haptic feedback** | Vibration on like, bookmark, streak milestone |
| **Camera integration** | Direct camera access for quick review photos |
| **Share sheet integration** | Native share sheet for sharing reviews and venues |
| **Location-aware** | Auto-suggest nearby venues when creating reviews |
| **Swipe gestures** | Swipe between tabs, swipe to dismiss modals |

---

## 12. Growth & Virality Mechanics

### 12.1 Sharing Infrastructure

| Element | Specification |
|---------|---------------|
| **Share card format** | 9:16 ratio (Stories-optimized), app branding subtle |
| **Share content** | Review highlights, venue cards, badges, Wrapped cards, streak milestones |
| **Share targets** | Instagram Stories, TikTok, Twitter, WhatsApp, Copy Link |
| **OG meta tags** | Dynamic OG images for all shareable pages (venue, review, profile) |
| **Deep links** | Universal links that open the app or fall back to web |

### 12.2 Referral Program

| Component | Design |
|-----------|--------|
| **Incentive** | Core-feature reward (not just points) — e.g., unlock premium feature |
| **Structure** | Double-sided: inviter and invitee both benefit |
| **Mechanic** | One-click invite links with deep linking |
| **Tiers** | Progressive rewards at 3/10/25 successful referrals |
| **Urgency** | Limited-time referral bonus events |

### 12.3 Viral Loop Design

**Three viral loops to implement (in priority order):**

1. **Social/UGC Loop** — Every food photo and review shared to social media is a viral vector. Pre-format sharing cards. Share the USER's achievement, not the app brand.

2. **Collaborative Loop** — Features that require friends to get full value (group dining plans, shared lists, collaborative playlists). Using the product naturally generates invitations.

3. **Incentivized Referral Loop** — "Invite a friend, both get [reward]." Keep incentives simple and directly related to core app value.

### 12.4 Moments of Delight (Share Prompt Timing)

Prompt sharing at peak emotional satisfaction:
- Right after earning a badge
- When hitting a streak milestone (7, 30, 100 days)
- After completing a challenge
- When receiving a Wrapped/recap
- When a review crosses 10/50/100 likes
- After being featured in trending

**Never** prompt sharing during onboarding or before value delivery.

---

## Priority Implementation Roadmap

### Phase 1: Performance & Polish (Highest ROI)
1. Fix N+1 queries in feed engine (batch affinity, annotate bookmarks)
2. Add Redis cache layer
3. Implement Next.js image optimization
4. Dynamic imports for Maps and gamification
5. Fix SSE to use Redis pub/sub
6. Skeleton loading states

### Phase 2: Core UX Improvements
7. Infinite scroll with `useInfiniteQuery`
8. Pull-to-refresh
9. Feed algorithm tuning (geographic relevance, freshness boost)
10. Enhanced venue detail page (photo grid, best dishes, sentiment)
11. Profile taste DNA visualization
12. Quick review FAB

### Phase 3: Social & Engagement
13. Weekly leagues (Duolingo model)
14. Streak visualization and milestones
15. Shareable achievement cards (9:16 format)
16. Monthly mini-recaps
17. Emoji reactions on reviews
18. Group dining planner

### Phase 4: AI & Intelligence
19. AI review summaries per venue
20. Semantic search
21. Photo enhancement on upload
22. "Why you'll love this" explanations
23. Conversational discovery assistant
24. Photo-to-dish identification

### Phase 5: Growth & Virality (M11)
25. Share card generation
26. OG meta tags + deep links
27. Referral program
28. Collaborative playlists
29. Food challenges
30. Viral loop infrastructure

---

## Sources

### Food App UX & Trends
- [Top Food Delivery App Development Design Trends for 2025](https://beadaptify.com/blog/future-trends-in-food-delivery-app-development/)
- [Food Delivery App UI UX Design in 2025 - Medium](https://medium.com/@prajapatisuketu/food-delivery-app-ui-ux-design-in-2025-trends-principles-best-practices-4eddc91ebaee)
- [The 12 Best Food Review App Options for 2025 - Savor](https://www.savortheapp.com/blog/food-tracking-apps/food-review-app/)
- [How the Beli App Is Turning Dining Out Into a Competitive Sport - Today](https://www.today.com/food/trends/what-is-beli-app-rcna217748)
- [Case Study: Restaurant Discovery App - Suarx](https://www.suarx.co/portfolio/restaurant-discovery-app)
- [Yelp Redesigns its UX For Food Discovery - Localogy](https://www.localogy.com/2022/08/yelp-redesigns-its-ux-for-food-discovery/)

### Performance
- [Blazity: Expert Guide to Next.js Performance Optimization](https://blazity.com/the-expert-guide-to-nextjs-performance-optimization)
- [FreeCodeCamp: Optimize Django REST APIs](https://www.freecodecamp.org/news/how-to-optimize-django-rest-apis-for-performance/)
- [Haki Benita: Improve Serialization Performance in DRF](https://hakibenita.com/django-rest-framework-slow)
- [TanStack Query v5: Prefetching](https://tanstack.com/query/v5/docs/framework/react/guides/prefetching)
- [SSE vs WebSockets vs Long Polling 2025](https://dev.to/haraf/server-sent-events-sse-vs-websockets-vs-long-polling-whats-best-in-2025-5ep8)

### Gamification
- [Duolingo Gamification Explained - StriveCloud](https://www.strivecloud.io/blog/gamification-examples-boost-user-retention-duolingo)
- [Duolingo's Gamification Strategy: A Case Study - Trophy](https://trophy.so/blog/duolingo-gamification-case-study)
- [Hunger Games: Gamified Loyalty Programs - Food Institute](https://foodinstitute.com/focus/hunger-games-how-gamified-loyalty-programs-help-restaurants-win/)
- [Designing a Streak System: UX and Psychology - Smashing Magazine](https://www.smashingmagazine.com/2026/02/designing-streak-system-ux-psychology/)
- [Spotify Wrapped Marketing Strategy - NoGood](https://nogood.io/blog/spotify-wrapped-marketing-strategy/)

### AI & ML
- [Yelp AI Review Summaries](https://www.makersupport.com/yelp-introduces-ai-powered-review-summaries-for-us-restaurants-revolutionizing-how-diners-make-food-choices/)
- [Google Maps AI Review Summaries](https://mapsplatform.google.com/resources/blog/discover-more-faster-ai-powered-summaries-for-places-areas-and-reviews-are-now-generally-available/)
- [Uber Eats Query Understanding Engine](https://www.uber.com/blog/uber-eats-query-understanding/)
- [American Express AI Dining Companion](https://americanexpress.io/harnessing-gen-ai-to-power-restaurant-recommendations/)
- [iFood Personalized Recommendation with LightGBM](https://arxiv.org/abs/2508.03670)
- [Yelp Menu Vision - TechCrunch](https://techcrunch.com/2025/10/21/yelps-ai-assistant-can-now-scan-restaurant-menus-to-show-you-what-dishes-look-like/)
- [Qdrant Food Discovery Demo](https://qdrant.tech/articles/food-discovery-demo/)
