# ⚙️ Football Scout — Backend

> A production-style **NestJS** REST API powering the Football Scout platform. Fetches live football data from Sportmonks, handles JWT authentication, and persists user-owned data (favorites, notes, comparisons) in MySQL via Prisma.

---

## 🛠️ Tech Stack

| | Technology |
|--|-----------|
| 🚀 Framework | NestJS 11 + TypeScript |
| 🗄️ Database | MySQL 8 via Prisma ORM |
| 🔐 Auth | JWT + Passport.js + bcrypt |
| 🌐 External API | Sportmonks v3 Football API |
| 📖 API Docs | Swagger UI |
| ⚡ Cache | In-memory (5-min TTL) |

---

## 📁 Project Structure

```
src/
├── 🔐 auth/             # JWT register, login, /me
├── 👤 users/            # User service (internal)
├── 🌐 api-football/     # Single HTTP gateway to Sportmonks
├── 🏆 leagues/          # Leagues search & detail
├── 🏟️ teams/            # Teams by season, detail, squad
├── 🧑‍⚽ players/          # Player search & statistics
├── 📅 fixtures/         # Match fixtures & details
├── 🔴 livescores/       # Live & in-play matches
├── 📋 standings/        # League / live / round standings
├── 👟 topscorers/       # Goals, assists, cards leaderboards
├── 🔄 transfers/        # Transfer feed & history
├── 🧑‍💼 coaches/          # Coaching staff
├── 🌍 countries/        # Country list & detail
├── 📆 seasons/          # Seasons list & by team
├── 🔁 rounds/           # Rounds by season
├── 🏟️ venues/           # Venue detail & by season
├── ❤️ favorites/        # Favorite players & teams (DB)
├── 📝 notes/            # Player scouting notes (DB)
├── 📊 analytics/        # Player comparison + history (DB)
├── 🎮 games/            # Football games endpoints
├── ⚙️ prisma/           # Prisma service
├── 🔧 config/           # ConfigModule loader
└── 🛡️ common/           # Global filter & response interceptor
```

---

## 🚀 Getting Started

### 1️⃣ Install dependencies

```bash
cd football-scout-backend
npm install
```

### 2️⃣ Configure environment

```bash
cp .env.example .env
```

Edit `.env`:

```env
DATABASE_URL="mysql://root:password@localhost:3306/football_scout"
JWT_SECRET="your-super-secret-jwt-key"
JWT_EXPIRES_IN="7d"
SPORTMONKS_API_TOKEN="your-sportmonks-api-token"
SPORTMONKS_BASE_URL="https://api.sportmonks.com/v3/football"
PORT=3000
NODE_ENV=development
```

### 3️⃣ Run database migrations

```bash
npm run prisma:migrate
```

### 4️⃣ Start the server

```bash
# 🔧 Development (watch mode)
npm run start:dev

# 🚀 Production
npm run build && npm run start:prod
```

### 5️⃣ Open Swagger docs

```
http://localhost:3000/api/docs
```

---

## 📡 REST Endpoints

All endpoints (except `/auth/register` and `/auth/login`) require a **JWT Bearer token**.

### 🔐 Auth
| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/auth/register` | Register a new user |
| `POST` | `/api/auth/login` | Login, returns JWT |
| `GET` | `/api/auth/me` | Get current user profile |

### 🏆 Leagues
| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/leagues` | Search leagues (name, country) |
| `GET` | `/api/leagues/:id` | Get league by ID |

### 🏟️ Teams
| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/teams?seasonId=` | Teams in a season |
| `GET` | `/api/teams/:id` | Team details |
| `GET` | `/api/teams/:id/squad` | Current squad |

### 🧑‍⚽ Players
| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/players/search?name=` | Search players by name |
| `GET` | `/api/players/:id` | Player stats |

### 📅 Fixtures
| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/fixtures` | List by date/team/range |
| `GET` | `/api/fixtures/:id` | Fixture details |
| `GET` | `/api/fixtures/h2h` | Head-to-head history |

### 🔴 Live Scores
| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/livescores` | All live matches |
| `GET` | `/api/livescores/inplay` | In-play only |
| `GET` | `/api/livescores/latest` | Latest scores |

### 📋 Standings
| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/standings?seasonId=` | Season standings |
| `GET` | `/api/standings/live?leagueId=` | Live standings |
| `GET` | `/api/standings/round?roundId=` | Round standings |

### 👟 Top Scorers
| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/topscorers?seasonId=` | Goals / assists / cards |

### 🔄 Transfers
| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/transfers/latest` | Latest transfers |
| `GET` | `/api/transfers/team/:id` | Team transfer history |
| `GET` | `/api/transfers/player/:id` | Player transfer history |

### ❤️ Favorites (DB — auth required)
| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/favorites/players` | List favorite players |
| `POST` | `/api/favorites/players` | Add favorite player |
| `DELETE` | `/api/favorites/players/:apiPlayerId` | Remove favorite player |
| `GET` | `/api/favorites/teams` | List favorite teams |
| `POST` | `/api/favorites/teams` | Add favorite team |
| `DELETE` | `/api/favorites/teams/:apiTeamId` | Remove favorite team |

### 📝 Notes (DB — auth required)
| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/notes` | List scouting notes |
| `POST` | `/api/notes` | Create note |
| `GET` | `/api/notes/:id` | Get note |
| `PATCH` | `/api/notes/:id` | Update note |
| `DELETE` | `/api/notes/:id` | Delete note |

### 📊 Analytics (DB — auth required)
| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/analytics/compare?player1Id=&player2Id=&season=` | Compare two players |
| `GET` | `/api/analytics/history` | Comparison history |

---

## 🗄️ Database Schema

```
👤 User
├── ⭐ FavoritePlayer  (apiPlayerId, playerName, photo, position, goals, rating)
├── ⭐ FavoriteTeam    (apiTeamId, teamName, leagueName, logo)
├── 📝 PlayerNote      (apiPlayerId, playerName, content)
└── 📊 ComparisonHistory (player1Id, player2Id, season)
```

> Football data (leagues, teams, players, fixtures) is fetched live from **Sportmonks** — never persisted locally.

---

## 📜 Scripts

| Command | Description |
|---------|-------------|
| `npm run start:dev` | 🔧 Dev server with watch mode |
| `npm run build` | 📦 Production build |
| `npm run start:prod` | 🚀 Run production build |
| `npm test` | 🧪 Unit tests |
| `npm run test:cov` | 📊 Coverage report |
| `npm run test:e2e` | 🔬 End-to-end tests |
| `npm run lint` | 🧹 ESLint with auto-fix |
| `npm run format` | ✨ Prettier |
| `npm run prisma:migrate` | 🗄️ Run migrations (dev) |
| `npm run prisma:migrate:deploy` | 🗄️ Run migrations (production) |
| `npm run prisma:generate` | ⚙️ Regenerate Prisma client |
| `npm run prisma:studio` | 🖥️ Open Prisma GUI |
| `npm run prisma:reset` | ⚠️ Drop + re-migrate (destructive) |

---

## 🏗️ Architecture Decisions

- 🌐 **Football data lives in Sportmonks**, not MySQL. The DB only stores user-owned data (favorites, notes, history).
- 🔁 **Single API gateway** — `ApiFootballService` is the only HTTP client for Sportmonks. All modules inject it.
- 📦 **Global response interceptor** wraps every response: `{ success: true, data: ... }`
- 🛡️ **Global exception filter** returns consistent error shapes: `{ statusCode, message, path, timestamp }`
- ⚡ **5-minute cache** registered globally via `CacheModule`
- 🔐 **JWT guard** protects all football endpoints — only authenticated users can query the API