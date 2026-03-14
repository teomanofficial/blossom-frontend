# Frontend — Claude Code Guide

React 19 + Vite 6 SPA communicating with the Express backend.

**Port:** 5173 (dev) | served via nginx (production)
**Entry point:** `src/main.tsx`
**Build output:** `dist/`

## Directory Map

```
src/
├── main.tsx                    # Vite entry, wraps App in providers
├── App.tsx                     # react-router-dom v7 route definitions
├── index.css                   # Global Tailwind base styles
├── context/
│   ├── AuthContext.tsx         # Auth state, user profile, billing plan
│   └── ImpersonationContext.tsx # Admin impersonation of other users
├── lib/
│   ├── api.ts                  # Fetch wrapper around /api/* endpoints
│   ├── supabase.ts             # Supabase browser client
│   ├── socket.ts               # Socket.IO client singleton
│   └── media.ts                # Media URL helpers
├── components/                 # Shared UI components
└── pages/                      # One file per route
```

## Routing

All routes defined in `App.tsx` using react-router-dom v7. Protected routes wrap children with `<ProtectedRoute>`.

```
/                         Landing.tsx
/login                    Login.tsx
/signup                   Signup.tsx
/dashboard                Dashboard.tsx           [protected]
/videos                   Videos.tsx              [protected]
/influencers              Influencers.tsx          [protected]
/influencers/:id          InfluencerDetail.tsx     [protected]
/hooks                    Hooks.tsx                [protected]
/hooks/:id                HookDetail.tsx           [protected]
/tactics                  Tactics.tsx              [protected]
/tactics/:id              TacticDetail.tsx         [protected]
/formats                  Formats.tsx              [protected]
/formats/:id              FormatDetail.tsx         [protected]
/content-analysis         ContentAnalysis.tsx      [protected]
/content-management       ContentManagement.tsx    [protected]
/content-analytics        ContentAnalyticsDashboard.tsx [protected]
/discovery                Discovery.tsx            [protected]
/suggestions              Suggestions.tsx          [protected]
/trends                   Trends.tsx               [protected]
/trending/*               TrendingFormats/Hooks/Contents/Songs/Posts
/platforms                Platforms.tsx            [protected]
/account                  Account.tsx              [protected]
/account/profile          AccountProfile.tsx
/account/billing          AccountBilling.tsx
/account/api-keys         AccountApiKeys.tsx       [platin/admin only]
/account/organization     AccountOrganization.tsx
/account/security         AccountSecurity.tsx
/admin/*                  Users, Categories, Onboarding... [admin only]
```

## Auth Context

`useAuth()` hook from `AuthContext.tsx` provides:

```typescript
const {
  user,           // Supabase User | null
  profile,        // profiles table row (role, plan, org_id)
  session,        // Supabase Session
  signIn,
  signUp,
  signOut,
  loading,
} = useAuth();
```

**Plan/role checks:**
```typescript
profile.role === 'admin'
profile.plan === 'platin'
```

## API Client

All backend calls go through `lib/api.ts`:

```typescript
import { api } from '../lib/api';

// Authenticated (adds Authorization: Bearer <jwt>)
const data = await api.get('/analysis/videos');
const result = await api.post('/analysis/videos', { url });

// The wrapper handles:
// - Attaching Supabase session token
// - JSON serialization
// - Error normalization
```

Never use raw `fetch` for backend calls — always use `lib/api.ts`.

## Socket.IO (Real-time)

```typescript
import { socket } from '../lib/socket';

// Subscribe to influencer progress
socket.emit('join', `influencer:${id}`);
socket.on('progress', (data) => { ... });

// Cleanup
socket.emit('leave', `influencer:${id}`);
```

Progress components that use sockets:
- `FetchContentProgress.tsx` — video fetch jobs
- `InfluencerAnalyzeProgress.tsx` — influencer analysis jobs

## Key Components

| Component | Purpose |
|---|---|
| `DashboardLayout.tsx` | Shell: sidebar nav + top bar |
| `Navbar.tsx` | Top navigation bar |
| `MobileDrawer.tsx` | Mobile hamburger menu |
| `ProtectedRoute.tsx` | Redirects unauthenticated users to /login |
| `SearchOverlay.tsx` | Cmd+K global search |
| `VideoStoryCarousel.tsx` | Swipeable video card grid |
| `FineTunePanel.tsx` | UI for AI model fine-tuning |
| `CardSkeleton.tsx` | Loading placeholder |

### Chart Components (`components/charts/`)

| Component | Usage |
|---|---|
| `CreatorScoreGauge.tsx` | Circular score meter |
| `BestTimesHeatmap.tsx` | Post-time heatmap grid |
| `FollowerGrowthChart.tsx` | Area chart (recharts) |
| `EngagementChart.tsx` | Bar chart (recharts) |
| `MetricsCard.tsx` | KPI card |

## Pages

### Content Analysis (`pages/ContentAnalysis.tsx`)

Largest page (~172KB). Multi-step workflow:
1. User pastes URL or uploads video
2. Fetch → analyze pipeline runs (progress via Socket.IO)
3. Results: hook/format/tactic classification, virality scores, improvements

### Account API Keys (`pages/AccountApiKeys.tsx`)

Visible only to `platin` and `admin` plan users. Calls `/api/api-keys` endpoints. Displays key once on creation (`blsm_...` prefix).

### Admin Pages

`Users.tsx`, `Categories.tsx`, `OnboardingManagement.tsx`, `SupportManagement.tsx` — only accessible when `profile.role === 'admin'`.

## Environment Variables

```bash
VITE_API_URL=http://localhost:3001
VITE_SUPABASE_URL=https://<project>.supabase.co
VITE_SUPABASE_ANON_KEY=<anon-key>
VITE_PADDLE_CLIENT_TOKEN=<token>
VITE_PADDLE_ENVIRONMENT=sandbox  # or production
```

## Build & Proxy

`vite.config.ts` proxies `/api` and `/media` to `http://localhost:3001` in dev — no CORS issues locally.

```bash
npm run build    # outputs dist/
npm run preview  # serve dist/ locally
```

## Styling

Tailwind CSS utility classes. No CSS modules. Custom theme extensions in `tailwind.config.js`. Global styles (fonts, resets) in `index.css`.

## TypeScript

Strict mode enabled. Vite auto-generates `vite-env.d.ts` for `import.meta.env` types. Component props should always be explicitly typed (no `any`).
