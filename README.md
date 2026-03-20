<div align="center">

<img src="https://img.shields.io/badge/de.-F24D4F?style=for-the-badge&logoColor=white&labelColor=F24D4F" alt="de." height="40" />

# Delectable

### *The Social Food Discovery Platform*

**Discover. Curate. Share. Repeat.**

<br />

[![Next.js](https://img.shields.io/badge/Next.js-15.5-black?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Django](https://img.shields.io/badge/Django-5.2-092E20?style=for-the-badge&logo=django&logoColor=white)](https://www.djangoproject.com/)
[![MUI](https://img.shields.io/badge/MUI-7-007FFF?style=for-the-badge&logo=mui&logoColor=white)](https://mui.com/)
[![Capacitor](https://img.shields.io/badge/Capacitor-iOS-119EFF?style=for-the-badge&logo=capacitor&logoColor=white)](https://capacitorjs.com/)
[![License](https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge)](LICENSE)

<br />

[**Live Demo**](#) · [**Report Bug**](https://github.com/yourusername/delectable/issues) · [**Request Feature**](https://github.com/yourusername/delectable/issues)

</div>

<br />

---

## About

**Delectable** (or **de.** for short) is an AI-powered mobile-first web application for food enthusiasts. Think of it as:

> **Instagram** meets **Spotify** meets **Yelp** — but for food lovers.

Create themed playlists of your favorite dishes, discover trending spots through your social graph, and share your culinary adventures with friends.

<br />

## Features

<table>
<tr>
<td width="50%">

### "What Should I Eat?" Decision Engine
A conversational wizard that considers your mood, dietary needs, budget, and location to recommend the perfect meal. Uses multi-signal scoring with natural language explanations for why each pick was chosen.

### Time Machine
Track how any restaurant's quality evolves over time with interactive SVG charts. Compare two dishes side-by-side with overlapping trend lines and automated winner detection via linear regression.

### Group Dining Consensus
Create a dinner plan, invite friends via share code, and swipe through venue options Tinder-style. A consensus algorithm finds the restaurant everyone agrees on.

</td>
<td width="50%">

### Smart Map with PostGIS
Full-text search with typo tolerance (pg_trgm), spatial queries (ST_DWithin), heatmap visualization, friends' venue markers, and custom cuisine-specific SVG pin icons. Supports bounding box, radius, and true distance sorting.

### Elo-Style Rankings
Venues are ranked using an Elo algorithm adapted from chess. Users compare pairs of restaurants head-to-head, and the system computes a personalized "My Top 10" with tiered K-factors based on comparison count.

### Feed Intelligence
EdgeRank-style scoring (social 30%, engagement 25%, preference 25%, quality 20%) with time decay, MMR diversity enforcement, 4-tier cold-start system, and trending detection via Z-score anomaly + velocity scoring.

</td>
</tr>
<tr>
<td width="50%">

### Gamification & Streaks
XP system with 20 levels, 32 achievement badges across 8 categories, dining streaks with freeze protection and timezone-aware tracking, GitHub-style activity grid, and a "de. Wrapped" year-in-review with swipeable animated cards.

### Food Playlists
Curate themed venue collections ("Best Tacos", "Date Night"). Save others' playlists (stays synced) or fork them (your own copy). Collaborative editing, fork attribution, and visibility controls (public/followers/private).

</td>
<td width="50%">

### Push Notifications (FCM)
Cross-platform push via Firebase Cloud Messaging — web (service worker), iOS (Capacitor), with quiet hours, per-category toggles, notification bundling ("Alice and 3 others liked your review"), and delivery analytics tracking.

### iOS Native App
Packaged via Capacitor with native camera, haptics, geolocation, push notifications, safe area handling (notch + home indicator), and Fastlane-automated TestFlight deployment. CI/CD via GitHub Actions.

</td>
</tr>
</table>

<details>
<summary><strong>More Features</strong></summary>

- **Occasion Tags** — Vote on what venues are "Perfect For" (Date Night, Group Dinner, Brunch, Late Night)
- **Dietary Filtering** — Community-reported dietary badges (Vegan, Gluten Free, Halal) with confidence scoring
- **Kitchen Stories** — Behind-the-scenes content from restaurants (chef profiles, origin stories)
- **Food Tourism Guides** — Curated walking tours with estimated times and recommended dishes per stop
- **Monthly Mini-Recap** — Swipeable data visualization cards summarizing your dining month
- **Referral Program** — Two-sided rewards with tiered incentives (3/10/25 referrals)
- **Content Moderation** — Report system with 6 report types, duplicate prevention, and moderation queue
- **S3 Image Upload** — Presigned URL direct-to-S3 upload with drag-drop, progress bar, and EXIF stripping
- **WCAG AA Accessibility** — Skip navigation, focus traps, reduced motion support, 44px touch targets, semantic HTML
- **Full-Text Search** — PostgreSQL tsvector + tsquery with weighted fields, trigram fuzzy matching for typo tolerance

</details>

<br />

## Tech Stack

<table>
<tr>
<td align="center" width="25%">

**Frontend**

![Next.js](https://img.shields.io/badge/-Next.js_15-000?style=flat-square&logo=next.js)
![TypeScript](https://img.shields.io/badge/-TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white)
![MUI](https://img.shields.io/badge/-MUI_7-007FFF?style=flat-square&logo=mui&logoColor=white)
![React Query](https://img.shields.io/badge/-React_Query-FF4154?style=flat-square&logo=react-query&logoColor=white)

</td>
<td align="center" width="25%">

**Backend**

![Django](https://img.shields.io/badge/-Django_5-092E20?style=flat-square&logo=django)
![DRF](https://img.shields.io/badge/-DRF-A30000?style=flat-square&logo=django&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/-PostgreSQL-4169E1?style=flat-square&logo=postgresql&logoColor=white)
![Redis](https://img.shields.io/badge/-Redis-DC382D?style=flat-square&logo=redis&logoColor=white)

</td>
<td align="center" width="25%">

**Infrastructure**

![Docker](https://img.shields.io/badge/-Docker-2496ED?style=flat-square&logo=docker&logoColor=white)
![Kubernetes](https://img.shields.io/badge/-Kubernetes-326CE5?style=flat-square&logo=kubernetes&logoColor=white)
![GitHub Actions](https://img.shields.io/badge/-GitHub_Actions-2088FF?style=flat-square&logo=github-actions&logoColor=white)
![Nginx](https://img.shields.io/badge/-Nginx-009639?style=flat-square&logo=nginx&logoColor=white)

</td>
<td align="center" width="25%">

**APIs & Mobile**

![Google Maps](https://img.shields.io/badge/-Google_Maps-4285F4?style=flat-square&logo=google-maps&logoColor=white)
![Firebase](https://img.shields.io/badge/-Firebase_FCM-FFCA28?style=flat-square&logo=firebase&logoColor=black)
![Capacitor](https://img.shields.io/badge/-Capacitor-119EFF?style=flat-square&logo=capacitor&logoColor=white)
![PostGIS](https://img.shields.io/badge/-PostGIS-336791?style=flat-square&logo=postgresql&logoColor=white)
![Celery](https://img.shields.io/badge/-Celery-37814A?style=flat-square&logo=celery&logoColor=white)
![S3](https://img.shields.io/badge/-AWS_S3-569A31?style=flat-square&logo=amazon-s3&logoColor=white)

</td>
</tr>
</table>

<br />

## Installation

### Prerequisites

- **Node.js** 18+ and **npm** 9+
- **Python** 3.11+ and **pip**
- **PostgreSQL** 15+
- **Redis** 7+
- **Google Maps API Key** ([Get one here](https://developers.google.com/maps/documentation/javascript/get-api-key))

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/delectable.git
cd delectable
```

### 2. Environment Setup

Copy the example environment file and configure your secrets:

```bash
cp .env.example .env.local
```

<details>
<summary><strong>Required Environment Variables</strong></summary>

```env
# Google Maps (Required for map features)
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here

# Backend API
NEXT_PUBLIC_API_URL=http://localhost:8000/api

# Django Settings (for backend)
DJANGO_SECRET_KEY=your-super-secret-key-change-in-production
DATABASE_URL=postgres://delectable:password@localhost:5432/delectable
REDIS_URL=redis://localhost:6379/0

# JWT (optional - defaults to DJANGO_SECRET_KEY)
JWT_SECRET_KEY=your-jwt-secret
```

</details>

> **Note**: Never commit `.env.local` to version control. It's already in `.gitignore`.

### 3. Frontend Setup

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

The app will be available at `http://localhost:3000`

### 4. Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run migrations
python manage.py migrate

# Seed sample data (optional)
python manage.py seed

# Start server
python manage.py runserver
```

The API will be available at `http://localhost:8000/api`

<br />

## Docker Setup

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

This starts:
- **Frontend** at `http://localhost:3000`
- **Backend API** at `http://localhost:8000`
- **PostgreSQL** at `localhost:5432`
- **Redis** at `localhost:6379`

<br />

## Getting a Google Maps API Key

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable these APIs:
   - Maps JavaScript API
   - Places API
   - Geocoding API
4. Go to **Credentials** → **Create Credentials** → **API Key**
5. (Recommended) Restrict the key to your domains
6. Add the key to your `.env.local`:
   ```env
   NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=AIzaSy...your-key-here
   ```

<br />

## Project Structure

```
delectable/
├── src/                       # Frontend source
│   ├── api/                   # API client & helpers
│   ├── components/            # Reusable UI components
│   ├── context/               # React context providers
│   ├── hooks/                 # Custom React hooks
│   ├── layouts/               # Page layouts
│   ├── pages/                 # Next.js pages
│   ├── theme/                 # MUI theme config
│   └── types/                 # TypeScript definitions
├── backend/                   # Django backend
│   ├── apps/                  # Django apps
│   │   ├── users/             # Auth & user profiles
│   │   ├── venues/            # Venue management
│   │   ├── reviews/           # Reviews & comments
│   │   ├── playlists/         # Playlist curation
│   │   ├── feed/              # Feed algorithms
│   │   ├── notifications/     # Real-time notifications
│   │   ├── gamification/      # XP, badges, streaks
│   │   ├── sharing/           # Social sharing & referrals
│   │   └── ml/                # ML models & recommendations
│   └── config/                # Django settings
├── docker/                    # Docker configurations
├── k8s/                       # Kubernetes manifests
└── .github/                   # CI/CD workflows
```

<br />

## Quick Start

```bash
# Backend (Terminal 1)
./run-backend.sh --seed     # Migrate + seed data + start on :8000

# Frontend (Terminal 2)
./run-frontend.sh            # Start Next.js on :3000

# iOS (requires Mac + Xcode)
npm run ios:setup            # First-time: init Capacitor + CocoaPods
npm run ios:build            # Build and open in Xcode
npm run ios:testflight       # Build + upload to TestFlight
```

## Running Tests

```bash
# E2E tests (Playwright — 17 tests across 7 specs)
npm run test:e2e

# E2E with UI inspector
npm run test:e2e:ui

# Backend tests
cd backend && python manage.py test

# Linting
npm run lint
```

<br />

## Deployment

<details>
<summary><strong>Kubernetes Deployment</strong></summary>

```bash
# Apply configurations
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/configmap.yaml
kubectl apply -f k8s/secrets.yaml
kubectl apply -f k8s/

# Check status
kubectl get pods -n delectable
```

</details>

<details>
<summary><strong>Manual Docker Deployment</strong></summary>

```bash
# Build images
docker build -f docker/Dockerfile.frontend -t delectable-frontend .
docker build -f docker/Dockerfile.backend -t delectable-backend ./backend

# Push to registry
docker push your-registry/delectable-frontend
docker push your-registry/delectable-backend
```

</details>

<br />

## Contributing

Contributions are what make the open source community amazing. Any contributions you make are **greatly appreciated**.

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

<br />

## License

Distributed under the MIT License. See `LICENSE` for more information.

<br />

## Acknowledgments

- [Next.js](https://nextjs.org/) — The React Framework
- [Material UI](https://mui.com/) — React UI Components
- [Django REST Framework](https://www.django-rest-framework.org/) — Web APIs for Django
- [React Query](https://tanstack.com/query) — Data Fetching & Caching
- [Shields.io](https://shields.io/) — Badges

---

<div align="center">

Made with care for food lovers everywhere

**[Back to Top](#delectable)**

</div>
