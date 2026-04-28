# ⚽ Football Scout

> A full-stack football scouting and analytics platform. Browse live scores, leagues, teams, and players powered by the **Sportmonks API**. Scout players, write notes, compare stats, manage favorites, and play football trivia games — all in one app.

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| 🖥️ Frontend | Angular 20 (Standalone Components, SSR) |
| ⚙️ Backend | NestJS 11 (TypeScript) |
| 🗄️ Database | MySQL via Prisma ORM |
| 🔐 Auth | JWT (Passport.js) |
| 🌐 External API | Sportmonks v3 Football API |
| 📊 Charts | Chart.js (Radar chart) |
| 📄 PDF Export | jsPDF |

---

## 📁 Project Structure

```
football-scout/
├── 🗂️ football-scout-backend/   # NestJS REST API
└── 🗂️ football-scout-client/    # Angular 20 SPA with SSR
```

---

## ✨ Features

### 🔐 Authentication
- User registration and login with JWT
- Passwords hashed with bcrypt
- Protected routes via `JwtAuthGuard` on the backend
- Angular route guards (`authGuard`, `guestGuard`) on the frontend
- Auth state persisted in `localStorage` using Angular signals

### 🔴 Live Scores
- Real-time live match centre with auto-polling every 12 seconds
- Displays in-play matches, scores, teams, and match status
- Home page live ticker showing matches in progress

### 🏆 Leagues
- Browse all football leagues with search and country filter
- League detail page with tabbed views:
  - 📋 **Standings** — full league table with points, GD, form
  - 👟 **Top Scorers** — goals, assists, and cards leaderboards

### 🏟️ Teams
- Browse teams by season
- Team detail page with tabbed views:
  - 👥 **Squad** — full player roster
  - 📅 **Results** — recent match results
  - 🗓️ **Upcoming** — scheduled fixtures
  - 🧑‍💼 **Coaches** — coaching staff
  - 🔄 **Transfers** — team transfer history

### 🧑‍⚽ Players
- Debounced search autocomplete (300ms)
- Player detail page with tabbed views:
  - 📊 **Statistics** — full season stats panel
  - 🔄 **Transfers** — player transfer history
  - 📝 **Notes** — personal scouting notes (auth required)
- Export player scouting report as **PDF** (jsPDF)
- ⚖️ **Player Comparison** — side-by-side radar chart comparing two players across key stats

### 📅 Fixtures
- Browse fixtures with filters (date, date range, team)
- Fixture detail page with match events and stats
- Head-to-head fixture history between two teams

### 🔄 Transfers
- Global transfer feed with date-range filter
- Player and team-specific transfer history

### ❤️ Favorites
- Save favorite players and teams (auth required)
- Dedicated favorites page listing all saved items

### 📝 Scouting Notes
- Create, read, update, and delete personal notes on any player
- Notes stored per user in the database

### 📈 Analytics & Comparison History
- Compare two players across a selected season
- Radar chart visualization of key performance metrics
- Comparison history saved per user

### 🎮 Football Games Hub
- 🤔 **Who Are Ya?** — Player guessing game
- 🎱 **Bingo** — Football bingo card
- ↔️ **Box2Box** — Football trivia challenge

### 🎨 UI / UX
- Dark editorial sports-dashboard theme
- Responsive layout with animated page transitions
- Reusable components: loading spinner, empty state, error state, page header, favorite button
- Animated SVG goal scene on the home page
- Dark/light theme toggle

---

## ⚙️ Backend — NestJS API

### 🏗️ Architecture

All football data (leagues, teams, players, fixtures, standings, etc.) is fetched **live from Sportmonks** on every request. Nothing is cached to the database except user-owned records.

**🗄️ MySQL stores only:**
- `User` — registered accounts
- `FavoritePlayer` / `FavoriteTeam` — user favorites
- `PlayerNote` — scouting notes
- `ComparisonHistory` — player comparison records

### 📡 API Modules

| Module | Endpoint prefix | Description |
|--------|----------------|-------------|
| 🔐 Auth | `/api/auth` | Register, login |
| 🏆 Leagues | `/api/leagues` | List and detail |
| 🏟️ Teams | `/api/teams` | List, detail, squad |
| 🧑‍⚽ Players | `/api/players` | Search, detail |
| 📅 Fixtures | `/api/fixtures` | List, detail, H2H |
| 🔴 Live Scores | `/api/livescores` | In-play, latest |
| 📋 Standings | `/api/standings` | Season, live, round |
| 👟 Top Scorers | `/api/topscorers` | Goals, assists, cards |
| 🔄 Transfers | `/api/transfers` | Latest, by team/player |
| 🧑‍💼 Coaches | `/api/coaches` | By team or search |
| 🌍 Countries | `/api/countries` | List, detail |
| 📆 Seasons | `/api/seasons` | List, by team |
| 🔁 Rounds | `/api/rounds` | By season |
| 🏟️ Venues | `/api/venues` | By id or season |
| ❤️ Favorites | `/api/favorites` | CRUD (auth required) |
| 📝 Notes | `/api/notes` | CRUD (auth required) |
| 📊 Analytics | `/api/analytics` | Compare players, history |

### 🔧 Global Infrastructure

- **ResponseInterceptor** — wraps all responses: `{ success: true, data: ... }`
- **GlobalExceptionFilter** — normalizes errors: `{ statusCode, message, path, timestamp }`
- **ValidationPipe** — `whitelist: true`, `transform: true`
- **CacheModule** — 5-minute TTL in-memory cache
- **📖 Swagger** — API docs at `http://localhost:3000/api/docs`

---

## 🖥️ Frontend — Angular 20

### 🏗️ Architecture

- Standalone components — no NgModules
- All feature routes lazy-loaded with `loadComponent()`
- SSR via Angular Universal + Express
- Two HTTP interceptors: `authInterceptor` (attaches Bearer token), `errorInterceptor` (handles 401)

### 🗺️ Routing

```
/login, /register              🔒 Guest only
/ (Shell)
  /                            🏠 Home — live ticker, featured leagues, goal scene
  /livescores                  🔴 Live match centre (auto-polling)
  /leagues                     🏆 League list
  /leagues/:id                 🏆 League detail (Standings / Top Scorers)
  /teams                       🏟️ Team list
  /teams/:id                   🏟️ Team detail (Squad / Results / Upcoming / Coaches / Transfers)
  /players                     🧑‍⚽ Player search
  /players/compare             ⚖️ Player comparison with radar chart
  /players/:id                 🧑‍⚽ Player detail (Stats / Transfers / Notes) + PDF export
  /fixtures                    📅 Fixture list
  /fixtures/:id                📅 Fixture detail
  /transfers                   🔄 Transfer feed
  /games                       🎮 Games hub
  /games/who-are-ya            🤔 Who Are Ya? guessing game
  /games/bingo                 🎱 Football bingo
  /games/box2box               ↔️ Box2Box trivia
  /favorites                   ❤️ Auth required
```

### 🔄 State Management

No NgRx — components use Angular signals:
- `signal<T>()` for mutable state
- `computed()` for derived values
- `forkJoin()` for parallel API calls on load
- `interval()` + `switchMap()` for live polling
- `Subject` + `debounceTime(300)` for search

---

## 🚀 Getting Started

### 📋 Prerequisites

- Node.js 20+
- MySQL 8+
- A [Sportmonks](https://www.sportmonks.com/) API token

### 1️⃣ Clone the repo

```bash
git clone https://github.com/shonsalomonovitch/football-scout.git
cd football-scout
```

### 2️⃣ Set up the backend

```bash
cd football-scout-backend
npm install
cp .env.example .env
```

Edit `.env`:

```env
DATABASE_URL="mysql://root:password@localhost:3306/football_scout"
JWT_SECRET="your-secret-key"
JWT_EXPIRES_IN="7d"
SPORTMONKS_API_TOKEN="your-sportmonks-token"
SPORTMONKS_BASE_URL="https://api.sportmonks.com/v3/football"
PORT=3000
NODE_ENV=development
```

Run database migrations and start:

```bash
npm run prisma:migrate
npm run start:dev
```

- 🌐 Backend runs at `http://localhost:3000`
- 📖 Swagger docs at `http://localhost:3000/api/docs`

### 3️⃣ Set up the frontend

```bash
cd ../football-scout-client
npm install
npm start
```

- 🌐 Frontend runs at `http://localhost:4200`

---

## 📜 Available Scripts

### 🗂️ Backend (`football-scout-backend/`)

| Command | Description |
|---------|-------------|
| `npm run start:dev` | 🔧 Development server with watch mode |
| `npm run build` | 📦 Production build |
| `npm run start:prod` | 🚀 Run production build |
| `npm test` | 🧪 Run unit tests |
| `npm run test:cov` | 📊 Test coverage report |
| `npm run test:e2e` | 🔬 End-to-end tests |
| `npm run lint` | 🧹 ESLint with auto-fix |
| `npm run format` | ✨ Prettier |
| `npm run prisma:migrate` | 🗄️ Run DB migrations (dev) |
| `npm run prisma:migrate:deploy` | 🗄️ Run DB migrations (production) |
| `npm run prisma:generate` | ⚙️ Regenerate Prisma client |
| `npm run prisma:studio` | 🖥️ Open Prisma GUI |
| `npm run prisma:reset` | ⚠️ Drop + re-migrate (destructive) |

### 🗂️ Frontend (`football-scout-client/`)

| Command | Description |
|---------|-------------|
| `npm start` | 🔧 Dev server at localhost:4200 |
| `npm run build` | 📦 Production build |
| `npm run watch` | 👀 Dev build in watch mode |
| `npm test` | 🧪 Run unit tests (Karma/Jasmine) |
| `npm run serve:ssr:football-scout-client` | 🚀 SSR production server |

---

## 🗄️ Database Schema

```
👤 User
├── ⭐ FavoritePlayer  (apiPlayerId, playerName, photo, position, goals, rating)
├── ⭐ FavoriteTeam    (apiTeamId, teamName, leagueName, logo)
├── 📝 PlayerNote      (apiPlayerId, playerName, content)
└── 📊 ComparisonHistory (player1Id, player2Id, season)
```

> All football data (leagues, teams, players, fixtures) comes live from Sportmonks and is never persisted locally.

---

## 🔑 Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | ✅ | MySQL connection string |
| `JWT_SECRET` | ✅ | JWT signing secret |
| `JWT_EXPIRES_IN` | ➖ | Token TTL (default: `7d`) |
| `SPORTMONKS_API_TOKEN` | ✅ | Your Sportmonks API key |
| `SPORTMONKS_BASE_URL` | ➖ | Defaults to Sportmonks v3 football endpoint |
| `PORT` | ➖ | HTTP port (default: `3000`) |

---

## 📄 License

Private project — all rights reserved.