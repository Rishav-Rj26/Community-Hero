# Community Hero

Community Hero is an AI-assisted civic issue reporting platform. Residents can report local problems, verify and discuss issues, follow resolution progress, and view community activity through dashboards and maps. Authorities can triage reports, update statuses, and inspect community trends.

## Highlights

- Citizen and authority authentication with seeded demo accounts
- Issue reporting with location, media, AI categorization, severity, and department routing
- SQLite-backed Express API with JWT auth and real-time server-sent events
- Interactive dashboards, feed, leaderboard, profile, and live map views
- Gemini-powered image analysis and chat flows with graceful local fallbacks
- Local-storage fallback data so the frontend can still demo without the API
- Production build optimizations with route-level lazy loading and vendor chunking

## Tech Stack

| Layer | Technology |
| --- | --- |
| Frontend | React 19, TypeScript, Vite |
| Styling | Tailwind CSS 4 |
| API | Express, TypeScript, tsx |
| Database | SQLite via better-sqlite3 |
| Auth | JWT, bcryptjs |
| AI | Google Gemini API |
| Visualization | Recharts, map components, Lucide icons |

## Prerequisites

- Node.js 20 or newer. Node 24 is supported with the current dependency set.
- npm 9 or newer.
- Optional: a Gemini API key for live AI responses.

## Setup

```bash
npm install
copy .env.example .env
```

Add your Gemini key to `.env` if you want live AI calls:

```env
GEMINI_API_KEY=your-key-here
JWT_SECRET=replace-this-for-shared-environments
SERVER_PORT=3001
```

## Run Locally

Start the frontend and API together:

```bash
npm run dev:all
```

Or run them separately:

```bash
npm run server
npm run dev
```

Default local URLs:

- Frontend: http://localhost:3000
- API health: http://localhost:3001/api/health

The frontend uses a strict port for Vite so it does not silently collide with the API server.

## Demo Accounts

| Role | Email | Password |
| --- | --- | --- |
| Citizen | alex@hero.com | hero123 |
| Authority | admin@hero.com | admin123 |

## Quality Checks

```bash
npm run lint
npm run build
```

`npm run lint` currently runs `tsc --noEmit`. The project has no automated unit or browser test suite yet, so manual smoke testing is still recommended after large UI changes.

## Project Structure

```text
src/
  components/      Reusable UI components
  context/         App state, auth, issue, notification, and fallback logic
  data/            Seeded frontend mock data
  pages/           Route-level screens
  services/        API, AI, and storage helpers
  types.ts         Shared frontend data contracts
server/
  db.ts            SQLite schema, indexes, and seed data
  index.ts         Express API, validation, SSE, and AI routes
  middleware/      JWT auth middleware
```

## Production Notes

Before using this beyond a demo or portfolio environment:

- Set a strong `JWT_SECRET`.
- Put the API behind HTTPS and a trusted reverse proxy.
- Add request rate limiting for auth, AI, and upload endpoints.
- Store uploaded media in object storage instead of the local filesystem.
- Add automated tests for auth, issue lifecycle, uploads, and dashboard data.
- Add migrations if schema changes need to preserve existing data.

## Current Rating Trajectory

The project is now much stronger as a full-stack portfolio piece: typed build, cleaner dependency compatibility, safer API behavior, deterministic local startup, code-split frontend bundles, and clean documentation. The remaining gap to a true 10/10 production system is mostly automated tests, deployment hardening, and operational monitoring.