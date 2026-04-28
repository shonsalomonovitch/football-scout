# 🖥️ Football Scout — Client

> An **Angular 20** single-page application with Server-Side Rendering (SSR) for the Football Scout platform. Browse live scores, leagues, teams, players, and fixtures — with scouting tools, radar chart comparisons, PDF exports, and football trivia games.

---

## 🛠️ Tech Stack

| | Technology |
|--|-----------|
| 🅰️ Framework | Angular 20 (Standalone Components) |
| 🚀 SSR | Angular Universal + Express |
| 📊 Charts | Chart.js (Radar chart) |
| 📄 PDF | jsPDF (scouting report export) |
| 🎨 Styling | CSS custom properties (design system) |
| 🧪 Testing | Karma + Jasmine |

---

## 📁 Project Structure

```
src/app/
├── 🔧 core/
│   ├── guards/          # authGuard, guestGuard
│   ├── interceptors/    # authInterceptor, errorInterceptor
│   ├── models/          # TypeScript interfaces for all domain objects
│   └── services/        # One service per backend resource
├── 🎨 layout/
│   └── shell/           # ShellComponent + NavComponent
├── ✨ features/
│   ├── auth/            # Login & Register pages
│   ├── home/            # Home dashboard + live ticker
│   ├── livescores/      # Live match centre
│   ├── leagues/         # League list & detail
│   ├── teams/           # Team list & detail
│   ├── players/         # Player search, detail & comparison
│   ├── fixtures/        # Fixture list & detail
│   ├── transfers/       # Transfer feed
│   ├── favorites/       # Saved favorites
│   └── games/           # Games hub (Who Are Ya, Bingo, Box2Box)
└── 🧩 shared/
    └── components/      # Reusable UI components
```

---

## 🗺️ Routes

```
/login, /register              🔒 Guest only
/ (Shell)
  /                            🏠 Home — live ticker, featured leagues, goal scene
  /livescores                  🔴 Live match centre (auto-polling every 12s)
  /leagues                     🏆 League list
  /leagues/:id                 🏆 League detail → Standings / Top Scorers tabs
  /teams                       🏟️ Team list
  /teams/:id                   🏟️ Team detail → Squad / Results / Upcoming / Coaches / Transfers tabs
  /players                     🧑‍⚽ Player search with debounced autocomplete
  /players/compare             ⚖️ Side-by-side radar chart comparison
  /players/:id                 🧑‍⚽ Player detail → Stats / Transfers / Notes tabs + PDF export
  /fixtures                    📅 Fixture list with filters
  /fixtures/:id                📅 Fixture detail with match events
  /transfers                   🔄 Global transfer feed
  /games                       🎮 Games hub
  /games/who-are-ya            🤔 Player guessing game
  /games/bingo                 🎱 Football bingo
  /games/box2box               ↔️ Football trivia
  /favorites                   ❤️ Auth required
```

---

## 🚀 Getting Started

### 1️⃣ Install dependencies

```bash
cd football-scout-client
npm install
```

### 2️⃣ Start development server

```bash
npm start
```

Open your browser at `http://localhost:4200` — the app reloads automatically on file changes.

> Make sure the backend is running at `http://localhost:3000` before starting the client.

---

## 📜 Scripts

| Command | Description |
|---------|-------------|
| `npm start` | 🔧 Dev server at localhost:4200 |
| `npm run build` | 📦 Production build |
| `npm run watch` | 👀 Dev build in watch mode |
| `npm test` | 🧪 Unit tests (Karma/Jasmine) |
| `npm run serve:ssr:football-scout-client` | 🚀 SSR production server |

---

## 🧩 Shared Components

| Component | Description |
|-----------|-------------|
| `LoadingComponent` | ⏳ Spinner for async states |
| `EmptyStateComponent` | 📭 Empty data placeholder |
| `ErrorStateComponent` | ❌ Error message display |
| `PageHeaderComponent` | 📰 Consistent page hero header |
| `FavoriteBtnComponent` | ⭐ Toggle favorite on any player/team |
| `RadarChartComponent` | 📊 Chart.js radar for player stat comparison |
| `PlayerStatsPanelComponent` | 📋 Full stats breakdown panel |
| `GoalSceneComponent` | 🥅 Animated SVG goal celebration (home page) |
| `BouncingDotsComponent` | 💬 Animated loading dots |

---

## 🔧 Core Services

| Service | Key methods |
|---------|-------------|
| `AuthService` | `login()`, `register()`, `logout()`, `me()` |
| `LeagueService` | `getLeagues(filters?)`, `getLeague(id)` |
| `TeamService` | `getTeams({seasonId})`, `getTeam(id)`, `getSquad(id)` |
| `PlayerService` | `searchPlayers({name})`, `getPlayer(id)` |
| `FixtureService` | `getFixtures(filters)`, `getFixture(id)`, `getHeadToHead(t1, t2)` |
| `LivescoreService` | `getAll()`, `getInPlay()`, `getLatest()` |
| `StandingService` | `getStandings(seasonId)`, `getLiveStandings(leagueId)` |
| `TopscoreService` | `getSeasonTopscorers(seasonId, type?)` |
| `TransferService` | `getLatestTransfers()`, `getTeamTransfers(id)`, `getPlayerTransfers(id)` |
| `FavoriteService` | CRUD for favorite players and teams |
| `NoteService` | CRUD for scouting notes by player |
| `AnalyticsService` | `comparePlayers(p1, p2, season)`, `getComparisonHistory()` |

---

## 🎨 Design System

Editorial sports-dashboard theme with CSS custom properties defined in `src/styles.css`.

| Token | Value | Usage |
|-------|-------|-------|
| `--color-bg` | `#111214` | Page background |
| `--color-surface` | `#18191d` | Cards & panels |
| `--color-accent` | `#16a34a` | Primary green accent |
| `--color-gold` | `#b45309` | Trophy / premium elements |
| `--color-danger` | `#dc2626` | Errors & red cards |
| `--font-display` | Barlow Condensed | Scores, hero titles, badges |
| `--font-family` | Inter | All body text |

---

## 🏗️ Key Patterns

- **🔐 Auth state** — Angular signals backed by `localStorage` (`fs_token`, `fs_user`), SSR-safe via `isPlatformBrowser()`
- **🔴 Live polling** — `interval(12000).pipe(startWith(0), switchMap(...))` with `OnDestroy` cleanup
- **🔍 Debounced search** — `Subject` + `debounceTime(300)` + `distinctUntilChanged()`
- **⚡ Parallel loads** — `forkJoin()` for multiple API calls on page init
- **📄 PDF export** — `jsPDF` imported dynamically (browser-only) to avoid SSR issues
- **🗺️ Route params as inputs** — `withComponentInputBinding()` enabled; `:id` bound directly as `@Input()`