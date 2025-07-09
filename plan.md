# AI-Powered Foodie Recommendation App: Plan

## Notes
- Project is based on the provided PRD and mockups.
- UI/UX should closely match the attached images.
- System-wide dark/light mode switching is required from the start.
- Milestone-based approach: must get user satisfaction before moving to the next milestone.

## Task List
- [x] Milestone 1: Front-End Foundations
  - [x] Initialize Next.js project with TypeScript
  - [x] Integrate global CSS resets & Material UI
  - [x] Configure Axios + React Query stubs
  - [x] Set up routing & layout (header, bottom tab bar, responsive layout)
  - [x] Implement core views (UI-only, no backend):
    - [x] Login/Signup (Auth0 stubs)
    - [x] Feed: review cards (rectangular, square photo, caption, comments, numeric rating)
    - [x] Playlist Detail: mock list, photo carousel, captions
    - [x] Map View: embed static Google Map with dummy markers
    - [x] Profile: avatar, stats, tabs (Reviews/Playlists/Map)
  - [x] Implement dark/light mode switching (system-wide)
  - [x] Match UI style to mockups (spacing, colors, fonts)
  - [x] UI/UX polish and bugfixes from user feedback:
    - [x] Fix dark/light mode toggle functionality
    - [x] Redesign review/profile cards (rectangular, square photo, caption, comments)
    - [x] Make header user icon route to /profile
    - [x] Add more review cards to feed & enable smooth scrolling
    - [x] Use numeric (not star) rating, no pill styling


## Current Goal
Set up Next.js project & base UI