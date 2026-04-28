import { Injectable } from '@nestjs/common';
import { ApiFootballService } from '../api-football/api-football.service';

export interface PoolPlayer {
  id: number;
  displayName: string;
  name: string;
  photo: string;
  position: { id: number; name: string } | null;
  nationality: { id: number; name: string; image_path: string } | null;
  team: { id: number; name: string; logo: string } | null;
  leagueId: number;
  leagueName: string;
  leagueLogo: string | null;
  goals: number;
  assists: number;
  age: number;
  trophies: Array<{ id: number; name: string; image_path: string | null }>;
}

export interface Criterion {
  type: 'league' | 'nationality' | 'position' | 'goals' | 'assists' | 'team' | 'age_group' | 'continent' | 'played_with' | 'trophy' | 'manager';
  label: string;
  value: string; // for manager: "{managerId}:{teamId}"
  image: string | null;
}

// Country → continent mapping
const CONTINENT_MAP: Record<string, string> = {
  France: 'Europe', Spain: 'Europe', England: 'Europe', Germany: 'Europe',
  Italy: 'Europe', Portugal: 'Europe', Netherlands: 'Europe', Belgium: 'Europe',
  Croatia: 'Europe', Denmark: 'Europe', Switzerland: 'Europe', Austria: 'Europe',
  Serbia: 'Europe', Poland: 'Europe', Sweden: 'Europe', Norway: 'Europe',
  Scotland: 'Europe', Wales: 'Europe', Turkey: 'Europe', Greece: 'Europe',
  Ukraine: 'Europe', 'Czech Republic': 'Europe', Slovakia: 'Europe', Hungary: 'Europe',
  Albania: 'Europe', Kosovo: 'Europe', 'Bosnia And Herzegovina': 'Europe',
  'North Macedonia': 'Europe', Montenegro: 'Europe', Slovenia: 'Europe',
  Brazil: 'South America', Argentina: 'South America', Colombia: 'South America',
  Uruguay: 'South America', Chile: 'South America', Peru: 'South America',
  Ecuador: 'South America', Venezuela: 'South America', Paraguay: 'South America',
  Bolivia: 'South America',
  Nigeria: 'Africa', Senegal: 'Africa', Morocco: 'Africa', "Ivory Coast": 'Africa',
  Ghana: 'Africa', Cameroon: 'Africa', Egypt: 'Africa', Algeria: 'Africa',
  Tunisia: 'Africa', Mali: 'Africa', Guinea: 'Africa', Gabon: 'Africa',
  'Democratic Republic Of Congo': 'Africa', 'South Africa': 'Africa',
  Mexico: 'North America', 'United States': 'North America', Jamaica: 'North America',
  Japan: 'Asia', 'South Korea': 'Asia', 'Saudi Arabia': 'Asia', Australia: 'Asia',
};

const LEAGUE_IDS = [8, 564, 82, 384, 301];
const LEAGUE_NAMES: Record<number, string> = {
  8: 'Premier League',
  564: 'La Liga',
  82: 'Bundesliga',
  384: 'Serie A',
  301: 'Ligue 1',
};

const CACHE_TTL_MS = 30 * 60 * 1000;

function seededRandom(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = Math.imul(s, 1664525) + 1013904223;
    return (s >>> 0) / 0xffffffff;
  };
}

function dateSeed(): number {
  const d = new Date();
  return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
}

function getPuzzleId(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function puzzleIdToSeed(puzzleId: string): number {
  // Random puzzleId format: "r-<seed>"
  if (puzzleId.startsWith('r-')) return parseInt(puzzleId.slice(2), 10);
  // Daily puzzleId format: "YYYY-MM-DD"
  const [y, m, day] = puzzleId.split('-').map(Number);
  return y * 10000 + m * 100 + day;
}

interface RawTrophy {
  id: number;
  name: string;
  image_path: string | null;
}

interface RawScorerEntry {
  player_id: number;
  total: number;
  type?: { developer_name: string };
  participant?: { id: number; name: string; image_path: string };
  player?: {
    id: number;
    name: string;
    display_name: string;
    image_path: string;
    date_of_birth: string;
    nationality?: { id: number; name: string; image_path: string };
    position?: { id: number; name: string };
    trophies?: RawTrophy[];
  };
}

@Injectable()
export class GamesService {
  private poolCache: { data: PoolPlayer[]; expiresAt: number } | null = null;
  // teamId → current coach — refreshed whenever pool is refreshed
  private managerByTeamId = new Map<number, { id: number; name: string; photo: string | null }>();

  constructor(private readonly apiFootball: ApiFootballService) {}

  // ─── Player Pool ───────────────────────────────────────────────────────────

  async getPool(): Promise<PoolPlayer[]> {
    if (this.poolCache && this.poolCache.expiresAt > Date.now()) {
      return this.poolCache.data;
    }

    const leagues = await Promise.all(
      LEAGUE_IDS.map((lid) =>
        this.apiFootball
          .get<{ image_path?: string; seasons?: Array<{ id: number; is_current: boolean }> }>(
            `leagues/${lid}`,
            { include: 'seasons' },
          )
          .catch(() => null),
      ),
    );

    const leagueSeasons = LEAGUE_IDS.map((lid, i) => ({
      leagueId: lid,
      leagueLogo: leagues[i]?.image_path ?? null,
      seasonId: (leagues[i]?.seasons ?? []).find((s) => s.is_current)?.id,
    })).filter((ls) => ls.seasonId) as Array<{ leagueId: number; leagueLogo: string | null; seasonId: number }>;

    const scorerGroups = await Promise.all(
      leagueSeasons.map(({ seasonId }) =>
        this.apiFootball
          .getAll(`topscorers/seasons/${seasonId}`, {
            include: 'player.nationality;player.position;player.trophies;participant;type',
          })
          .catch(() => []),
      ),
    );

    const playerMap = new Map<number, PoolPlayer>();

    scorerGroups.forEach((group, i) => {
      const { leagueId, leagueLogo } = leagueSeasons[i];
      const leagueName = LEAGUE_NAMES[leagueId];

      for (const entry of group as RawScorerEntry[]) {
        if (!entry.player) continue;
        const p = entry.player;
        const devName = entry.type?.developer_name;

        let existing = playerMap.get(entry.player_id);
        if (!existing) {
          const dob = p.date_of_birth ? new Date(p.date_of_birth) : null;
          const age = dob
            ? Math.floor((Date.now() - dob.getTime()) / (365.25 * 24 * 60 * 60 * 1000))
            : 0;

          existing = {
            id: p.id,
            displayName: p.display_name ?? p.name,
            name: p.name,
            photo: p.image_path,
            position: p.position ?? null,
            nationality: p.nationality ?? null,
            team: entry.participant
              ? {
                  id: entry.participant.id,
                  name: entry.participant.name,
                  logo: entry.participant.image_path,
                }
              : null,
            leagueId,
            leagueName,
            leagueLogo,
            goals: 0,
            assists: 0,
            age,
            trophies: (p.trophies ?? []).map((t) => ({
              id: t.id,
              name: t.name,
              image_path: t.image_path ?? null,
            })),
          };
          playerMap.set(entry.player_id, existing);
        }

        if (devName === 'GOAL_TOPSCORER') existing.goals = Math.max(existing.goals, entry.total);
        if (devName === 'ASSIST_TOPSCORER') existing.assists = Math.max(existing.assists, entry.total);
      }
    });

    // Enrich pool with squad players so goalkeepers/defenders appear in pool
    const teamIds = [
      ...new Set(
        [...playerMap.values()].map((p) => p.team?.id).filter(Boolean) as number[],
      ),
    ];

    // Fetch current coach for each team (used for "Managed by X" criterion)
    const coachResults = await Promise.all(
      teamIds.map((tid) =>
        this.apiFootball
          .get<Array<{ id: number; name: string; image_path: string }>>('coaches', {
            filters: `teamIds:${tid}`,
          })
          .catch(() => null),
      ),
    );
    this.managerByTeamId.clear();
    coachResults.forEach((coaches, i) => {
      if (coaches?.length) {
        const c = coaches[0];
        this.managerByTeamId.set(teamIds[i], {
          id: c.id,
          name: c.name,
          photo: c.image_path ?? null,
        });
      }
    });

    interface RawSquadEntry {
      player_id: number;
      player?: {
        id: number;
        name: string;
        display_name: string;
        image_path: string;
        date_of_birth: string;
        nationality?: { id: number; name: string; image_path: string };
        position?: { id: number; name: string };
        trophies?: RawTrophy[];
      };
    }

    const squads = await Promise.all(
      teamIds.map((tid) =>
        this.apiFootball
          .get<RawSquadEntry[]>(`squads/teams/${tid}`, {
            include: 'player.nationality;player.position;player.trophies',
          })
          .catch(() => [] as RawSquadEntry[]),
      ),
    );

    // Build teamId → league/team info for enriched players
    const teamToMeta = new Map<
      number,
      { leagueId: number; leagueName: string; leagueLogo: string | null; team: PoolPlayer['team'] }
    >();
    for (const p of playerMap.values()) {
      if (p.team) {
        teamToMeta.set(p.team.id, {
          leagueId: p.leagueId,
          leagueName: p.leagueName,
          leagueLogo: p.leagueLogo,
          team: p.team,
        });
      }
    }

    squads.forEach((squad, i) => {
      const teamId = teamIds[i];
      const meta = teamToMeta.get(teamId);
      if (!meta) return;

      for (const entry of squad as RawSquadEntry[]) {
        if (playerMap.has(entry.player_id) || !entry.player) continue;
        const p = entry.player;
        const dob = p.date_of_birth ? new Date(p.date_of_birth) : null;
        const age = dob
          ? Math.floor((Date.now() - dob.getTime()) / (365.25 * 24 * 60 * 60 * 1000))
          : 0;

        playerMap.set(entry.player_id, {
          id: p.id,
          displayName: p.display_name ?? p.name,
          name: p.name,
          photo: p.image_path,
          position: p.position ?? null,
          nationality: p.nationality ?? null,
          team: meta.team,
          leagueId: meta.leagueId,
          leagueName: meta.leagueName,
          leagueLogo: meta.leagueLogo,
          goals: 0,
          assists: 0,
          age,
          trophies: (p.trophies ?? []).map((t) => ({
            id: t.id,
            name: t.name,
            image_path: t.image_path ?? null,
          })),
        });
      }
    });

    // ── Curate: keep only top 3 teams per league ──────────────────────────────
    // Score each team by combined goals+assists of their players in the map.
    // This picks the best clubs (Man City, Arsenal, Real Madrid…) automatically.
    const TEAMS_PER_LEAGUE = 3;
    const teamScores = new Map<number, { leagueId: number; score: number }>();
    for (const p of playerMap.values()) {
      if (!p.team) continue;
      const existing = teamScores.get(p.team.id);
      if (existing) {
        existing.score += p.goals + p.assists;
      } else {
        teamScores.set(p.team.id, { leagueId: p.leagueId, score: p.goals + p.assists });
      }
    }

    // Top N teams per league
    const featuredTeamIds = new Set<number>();
    const byLeague = new Map<number, Array<{ teamId: number; score: number }>>();
    for (const [teamId, { leagueId, score }] of teamScores) {
      const arr = byLeague.get(leagueId) ?? [];
      arr.push({ teamId, score });
      byLeague.set(leagueId, arr);
    }
    for (const teams of byLeague.values()) {
      teams
        .sort((a, b) => b.score - a.score)
        .slice(0, TEAMS_PER_LEAGUE)
        .forEach((t) => featuredTeamIds.add(t.teamId));
    }

    // Build pool: players on featured teams + any top-30 individual scorers
    const top30Ids = new Set(
      [...playerMap.values()]
        .sort((a, b) => b.goals + b.assists - (a.goals + a.assists))
        .slice(0, 30)
        .map((p) => p.id),
    );

    const pool = [...playerMap.values()]
      .filter((p) => (p.team && featuredTeamIds.has(p.team.id)) || top30Ids.has(p.id))
      .sort((a, b) => b.goals + b.assists - (a.goals + a.assists));

    this.poolCache = { data: pool, expiresAt: Date.now() + CACHE_TTL_MS };
    return pool;
  }

  // ─── Search ────────────────────────────────────────────────────────────────

  async searchPool(q: string): Promise<Pick<PoolPlayer, 'id' | 'displayName' | 'photo'>[]> {
    if (!q || q.length < 2) return [];
    const pool = await this.getPool();
    const lower = q.toLowerCase();
    return pool
      .filter(
        (p) =>
          p.displayName.toLowerCase().includes(lower) ||
          p.name.toLowerCase().includes(lower),
      )
      .slice(0, 10)
      .map((p) => ({ id: p.id, displayName: p.displayName, photo: p.photo }));
  }

  // ─── Who Are Ya? ───────────────────────────────────────────────────────────

  async getWhoareyaDaily() {
    const pool = await this.getPool();
    const rand = seededRandom(dateSeed());
    const player = pool[Math.floor(rand() * pool.length)];
    return { puzzleId: getPuzzleId(), photo: player.photo };
  }

  async getWhoareyaRandom() {
    const pool = await this.getPool();
    const seed = Date.now();
    const rand = seededRandom(seed);
    const player = pool[Math.floor(rand() * pool.length)];
    return { puzzleId: `r-${seed}`, photo: player.photo };
  }

  async guessWhoareya(playerId: number, puzzleId: string, guessNumber: number) {
    const pool = await this.getPool();
    const rand = seededRandom(puzzleIdToSeed(puzzleId));
    const answer = pool[Math.floor(rand() * pool.length)];

    const guessed = pool.find((p) => p.id === playerId);
    const correct = playerId === answer.id;
    const isLastGuess = guessNumber >= 8;

    // Fetch shirt numbers for both guessed and answer players in parallel
    const fetchShirtNumber = async (player: PoolPlayer) => {
      if (!player.team?.id) return null;
      const squad = await this.apiFootball
        .get<Array<{ player_id: number; jersey_number: number | null }>>(
          `squads/teams/${player.team.id}`,
        )
        .catch(() => null);
      return squad?.find((e) => e.player_id === player.id)?.jersey_number ?? null;
    };

    const [guessedShirt, answerShirt] = await Promise.all([
      guessed ? fetchShirtNumber(guessed) : Promise.resolve(null),
      fetchShirtNumber(answer),
    ]);

    const numericMatch = (
      guessedVal: number | null,
      answerVal: number | null,
    ): 'correct' | 'higher' | 'lower' | 'close-higher' | 'close-lower' | 'unknown' => {
      if (guessedVal === null || answerVal === null) return 'unknown';
      if (guessedVal === answerVal) return 'correct';
      const diff = answerVal - guessedVal;
      if (diff >= 1 && diff <= 3) return 'close-higher';
      if (diff <= -1 && diff >= -3) return 'close-lower';
      return diff > 0 ? 'higher' : 'lower';
    };

    const hints = guessed
      ? {
          nationality: {
            value: guessed.nationality?.name ?? null,
            flag: guessed.nationality?.image_path ?? null,
            match: guessed.nationality?.name === answer.nationality?.name ? 'correct' : 'wrong',
          },
          league: {
            value: guessed.leagueName,
            logo: guessed.leagueLogo,
            match: guessed.leagueId === answer.leagueId ? 'correct' : 'wrong',
          },
          team: {
            value: guessed.team?.name ?? null,
            logo: guessed.team?.logo ?? null,
            match: guessed.team?.id === answer.team?.id ? 'correct' : 'wrong',
          },
          position: {
            value: guessed.position?.name ?? null,
            match: guessed.position?.id === answer.position?.id ? 'correct' : 'wrong',
          },
          age: {
            value: guessed.age,
            match: numericMatch(guessed.age, answer.age),
          },
          shirtNumber: {
            value: guessedShirt,
            match: numericMatch(guessedShirt, answerShirt),
          },
        }
      : null;

    return {
      correct,
      hints,
      player: correct || isLastGuess ? answer : null,
    };
  }

  // ─── Box2Box ───────────────────────────────────────────────────────────────

  async getBox2boxDaily() {
    const pool = await this.getPool();
    const rand = seededRandom(dateSeed() + 1);
    const { rows, cols } = this.pickGrid(pool, rand);
    return { puzzleId: getPuzzleId(), rows, cols };
  }

  async getBox2boxRandom() {
    const pool = await this.getPool();
    const seed = Date.now();
    const rand = seededRandom(seed + 1);
    const { rows, cols } = this.pickGrid(pool, rand);
    return { puzzleId: `r-${seed}`, rows, cols };
  }

  async validateBox2box(
    playerId: number,
    rowIndex: number,
    colIndex: number,
    puzzleId: string,
  ) {
    const pool = await this.getPool();
    const seed = puzzleIdToSeed(puzzleId);
    const rand = seededRandom(seed + 1);
    const { rows, cols } = this.pickGrid(pool, rand);

    const player = pool.find((p) => p.id === playerId);
    const row = rows[rowIndex];
    const col = cols[colIndex];

    // Check a single criterion — uses pool data first, then career history for club criteria
    const checkOne = async (criterion: Criterion): Promise<boolean> => {
      if (player && this.matchesCriterion(player, criterion)) return true;

      // Retro support: for team/manager, check if the player ever played for that club
      if (criterion.type === 'team' || criterion.type === 'manager') {
        const teamId =
          criterion.type === 'team'
            ? parseInt(criterion.value)
            : parseInt(criterion.value.split(':')[1]);
        return this.playerEverPlayedForTeam(playerId, teamId);
      }

      return false;
    };

    const [rowOk, colOk] = await Promise.all([checkOne(row), checkOne(col)]);
    const valid = rowOk && colOk;

    return { valid, player: valid ? player : undefined };
  }

  // Fetch player's full career stats and check if any season was spent at teamId
  private async playerEverPlayedForTeam(playerId: number, teamId: number): Promise<boolean> {
    const data = await this.apiFootball
      .get<{ statistics?: Array<{ team_id: number }> }>(`players/${playerId}`, {
        include: 'statistics',
      })
      .catch(() => null);

    return (data?.statistics ?? []).some((s) => s.team_id === teamId);
  }

  // ─── Football Bingo ────────────────────────────────────────────────────────

  async getBingoDaily() {
    return this.buildBingo(dateSeed() + 2, getPuzzleId());
  }

  async getBingoRandom() {
    const seed = Date.now();
    return this.buildBingo(seed + 2, `r-${seed}`);
  }

  // seed   → category shuffle
  // seed+1 → player shuffle
  private getBingoCategories(pool: PoolPlayer[], seed: number): Array<Criterion & { id: number }> {
    const rand = seededRandom(seed);
    const allCategories = this.buildCriteria(pool);
    const shuffledCats = this.shuffle(allCategories, rand).slice(0, 16);
    return shuffledCats.map((c, i) => ({ id: i + 1, ...c }));
  }

  private buildBingo(seed: number, puzzleId: string) {
    return this.getPool().then((pool) => {
      const categories = this.getBingoCategories(pool, seed);
      const playerRand = seededRandom(seed + 1);

      // For each category guarantee at least one matching player on the card
      const cardMap = new Map<number, PoolPlayer>();
      for (const cat of categories) {
        const matching = pool.filter((p) => this.matchesCriterion(p, cat));
        if (!matching.length) continue;
        const pick = matching[Math.floor(playerRand() * matching.length)];
        cardMap.set(pick.id, pick);
      }

      // Fill remaining slots up to 25 from a shuffled pool
      const shuffledPool = this.shuffle(pool, playerRand);
      for (const p of shuffledPool) {
        if (cardMap.size >= 25) break;
        if (!cardMap.has(p.id)) cardMap.set(p.id, p);
      }

      // Shuffle the final 25 so guaranteed players aren't always first
      const players = this.shuffle([...cardMap.values()], playerRand)
        .slice(0, 25)
        .map((p) => ({
          id: p.id,
          displayName: p.displayName,
          photo: p.photo,
          position: p.position?.name ?? null,
          nationality: p.nationality?.name ?? null,
          nationalityFlag: p.nationality?.image_path ?? null,
          team: p.team?.name ?? null,
          teamLogo: p.team?.logo ?? null,
          league: p.leagueName,
          leagueLogo: p.leagueLogo,
          goals: p.goals,
          assists: p.assists,
          age: p.age,
        }));

      return { puzzleId, categories, players };
    });
  }

  async wildcardBingo(playerId: number, puzzleId: string) {
    const pool = await this.getPool();
    const seed = puzzleIdToSeed(puzzleId) + 2;
    const categories = this.getBingoCategories(pool, seed);

    const player = pool.find((p) => p.id === playerId);
    if (!player) return { categoryIds: [] };

    const categoryIds = categories
      .filter((c) => this.matchesCriterion(player, c))
      .map((c) => c.id);

    return { categoryIds };
  }

  async validateBingo(playerId: number, categoryId: number, puzzleId: string) {
    const pool = await this.getPool();
    const seed = puzzleIdToSeed(puzzleId) + 2;
    const categories = this.getBingoCategories(pool, seed);

    const category = categories.find((c) => c.id === categoryId);
    if (!category) return { valid: false };

    const player = pool.find((p) => p.id === playerId);
    if (!player) return { valid: false };

    return { valid: this.matchesCriterion(player, category) };
  }

  // ─── Private helpers ───────────────────────────────────────────────────────

  private buildCriteria(pool: PoolPlayer[]): Criterion[] {
    const criteria: Criterion[] = [];

    // 1. Leagues — logo ✓
    for (const [lid, lname] of Object.entries(LEAGUE_NAMES)) {
      const leagueId = parseInt(lid);
      const players = pool.filter((p) => p.leagueId === leagueId);
      if (players.length >= 3) {
        criteria.push({ type: 'league', label: lname, value: lid, image: players[0].leagueLogo ?? null });
      }
    }

    // 2. Positions — no image
    for (const pos of [
      { id: 24, name: 'Goalkeeper' }, { id: 25, name: 'Defender' },
      { id: 26, name: 'Midfielder' }, { id: 27, name: 'Attacker' },
    ]) {
      if (pool.filter((p) => p.position?.id === pos.id).length >= 3) {
        criteria.push({ type: 'position', label: pos.name, value: String(pos.id), image: null });
      }
    }

    // 3. Goals thresholds — no image
    for (const g of [5, 10, 15, 20]) {
      if (pool.filter((p) => p.goals >= g).length >= 3) {
        criteria.push({ type: 'goals', label: `${g}+ Goals`, value: String(g), image: null });
      }
    }

    // 4. Assists thresholds — no image
    for (const a of [3, 5, 8, 10]) {
      if (pool.filter((p) => p.assists >= a).length >= 3) {
        criteria.push({ type: 'assists', label: `${a}+ Assists`, value: String(a), image: null });
      }
    }

    // 5. Nationalities — flag ✓
    const natMap = new Map<string, { count: number; flag: string | null }>();
    for (const p of pool) {
      if (p.nationality?.name) {
        const existing = natMap.get(p.nationality.name);
        natMap.set(p.nationality.name, {
          count: (existing?.count ?? 0) + 1,
          flag: existing?.flag ?? p.nationality.image_path ?? null,
        });
      }
    }
    for (const [nat, { count, flag }] of natMap) {
      if (count >= 3) criteria.push({ type: 'nationality', label: nat, value: nat, image: flag });
    }

    // 6. Current team — team logo ✓ (only teams with 3+ players in pool)
    const teamMap = new Map<number, { count: number; name: string; logo: string | null }>();
    for (const p of pool) {
      if (p.team) {
        const existing = teamMap.get(p.team.id);
        teamMap.set(p.team.id, {
          count: (existing?.count ?? 0) + 1,
          name: p.team.name,
          logo: p.team.logo ?? null,
        });
      }
    }
    for (const [tid, { count, name, logo }] of teamMap) {
      if (count >= 3) {
        criteria.push({ type: 'team', label: name, value: String(tid), image: logo });
      }
    }

    // 7. Age groups — no image
    const ageGroups = [
      { label: 'Under 23', value: 'u23' },
      { label: 'Under 26', value: 'u26' },
      { label: 'Over 28', value: 'o28' },
      { label: 'Over 31', value: 'o31' },
    ];
    for (const group of ageGroups) {
      if (pool.filter((p) => this.matchesAgeGroup(p.age, group.value)).length >= 3) {
        criteria.push({ type: 'age_group', label: group.label, value: group.value, image: null });
      }
    }

    // 8. Continent — flag of most common nationality from that continent ✓
    const continentMap = new Map<string, { count: number; flag: string | null }>();
    for (const p of pool) {
      const continent = p.nationality?.name ? CONTINENT_MAP[p.nationality.name] : undefined;
      if (continent) {
        const existing = continentMap.get(continent);
        continentMap.set(continent, {
          count: (existing?.count ?? 0) + 1,
          flag: existing?.flag ?? p.nationality?.image_path ?? null,
        });
      }
    }
    for (const [continent, { count, flag }] of continentMap) {
      if (count >= 4) {
        criteria.push({ type: 'continent', label: `${continent}n`, value: continent, image: flag });
      }
    }

    // 9. "Played with" — top players who have 3+ teammates in pool → player photo ✓
    const byTeam = new Map<number, PoolPlayer[]>();
    for (const p of pool) {
      if (p.team) {
        const arr = byTeam.get(p.team.id) ?? [];
        arr.push(p);
        byTeam.set(p.team.id, arr);
      }
    }
    const topPlayers = [...pool]
      .sort((a, b) => b.goals + b.assists - (a.goals + a.assists))
      .slice(0, 30);

    for (const star of topPlayers) {
      if (!star.team) continue;
      const teammates = (byTeam.get(star.team.id) ?? []).filter((p) => p.id !== star.id);
      if (teammates.length >= 2) {
        criteria.push({
          type: 'played_with',
          label: `Plays with ${star.displayName}`,
          value: `${star.team.id}:${star.id}`,
          image: star.photo,
        });
      }
    }

    return criteria;
  }

  private buildBox2boxCriteria(pool: PoolPlayer[]): Criterion[] {
    const criteria: Criterion[] = [];

    // 1. Leagues — logo ✓
    for (const [lid, lname] of Object.entries(LEAGUE_NAMES)) {
      const leagueId = parseInt(lid);
      const players = pool.filter((p) => p.leagueId === leagueId);
      if (players.length >= 3) {
        criteria.push({ type: 'league', label: lname, value: lid, image: players[0].leagueLogo ?? null });
      }
    }

    // 2. Nationalities — flag ✓
    const natMap = new Map<string, { count: number; flag: string | null }>();
    for (const p of pool) {
      if (p.nationality?.name) {
        const existing = natMap.get(p.nationality.name);
        natMap.set(p.nationality.name, {
          count: (existing?.count ?? 0) + 1,
          flag: existing?.flag ?? p.nationality.image_path ?? null,
        });
      }
    }
    for (const [nat, { count, flag }] of natMap) {
      if (count >= 4) criteria.push({ type: 'nationality', label: nat, value: nat, image: flag });
    }

    // 3. Clubs (played for) — team logo ✓
    const teamMap = new Map<number, { count: number; name: string; logo: string | null }>();
    for (const p of pool) {
      if (p.team) {
        const existing = teamMap.get(p.team.id);
        teamMap.set(p.team.id, {
          count: (existing?.count ?? 0) + 1,
          name: p.team.name,
          logo: p.team.logo ?? null,
        });
      }
    }
    for (const [tid, { count, name, logo }] of teamMap) {
      if (count >= 5) {
        criteria.push({ type: 'team', label: name, value: String(tid), image: logo });
      }
    }

    // 4. Trophies — trophy image ✓
    const trophyMap = new Map<number, { count: number; name: string; image: string | null }>();
    for (const p of pool) {
      for (const t of p.trophies ?? []) {
        const existing = trophyMap.get(t.id);
        trophyMap.set(t.id, {
          count: (existing?.count ?? 0) + 1,
          name: t.name,
          image: existing?.image ?? t.image_path ?? null,
        });
      }
    }
    for (const [tid, { count, name, image }] of trophyMap) {
      if (count >= 4) {
        criteria.push({ type: 'trophy', label: name, value: String(tid), image });
      }
    }

    // 5. Continent — flag ✓
    const continentMap = new Map<string, { count: number; flag: string | null }>();
    for (const p of pool) {
      const continent = p.nationality?.name ? CONTINENT_MAP[p.nationality.name] : undefined;
      if (continent) {
        const existing = continentMap.get(continent);
        continentMap.set(continent, {
          count: (existing?.count ?? 0) + 1,
          flag: existing?.flag ?? p.nationality?.image_path ?? null,
        });
      }
    }
    for (const [continent, { count, flag }] of continentMap) {
      if (count >= 6) {
        criteria.push({ type: 'continent', label: `${continent}n`, value: continent, image: flag });
      }
    }

    // 6. Managed by — only the world's most recognizable coaches ✓
    // Whitelist: partial name match (case-insensitive) against Sportmonks coach names
    const TOP_COACHES = ['guardiola', 'ancelotti', 'arteta', 'simeone', 'luis enrique'];
    const isFeaturedCoach = (name: string) => {
      const lower = name.toLowerCase();
      return TOP_COACHES.some((c) => lower.includes(c));
    };

    const managerTeamCounts = new Map<number, number>();
    for (const p of pool) {
      if (p.team && this.managerByTeamId.has(p.team.id)) {
        managerTeamCounts.set(p.team.id, (managerTeamCounts.get(p.team.id) ?? 0) + 1);
      }
    }
    for (const [teamId, count] of managerTeamCounts) {
      if (count >= 5) {
        const mgr = this.managerByTeamId.get(teamId)!;
        if (!isFeaturedCoach(mgr.name)) continue;
        criteria.push({
          type: 'manager',
          label: `Managed by ${mgr.name}`,
          value: `${mgr.id}:${teamId}`,
          image: mgr.photo,
        });
      }
    }

    // 7. "Played with" (teammate) — player photo ✓
    const byTeam = new Map<number, PoolPlayer[]>();
    for (const p of pool) {
      if (p.team) {
        const arr = byTeam.get(p.team.id) ?? [];
        arr.push(p);
        byTeam.set(p.team.id, arr);
      }
    }
    const topPlayers = [...pool]
      .sort((a, b) => b.goals + b.assists - (a.goals + a.assists))
      .slice(0, 30);

    for (const star of topPlayers) {
      if (!star.team) continue;
      const teammates = (byTeam.get(star.team.id) ?? []).filter((p) => p.id !== star.id);
      if (teammates.length >= 4) {
        criteria.push({
          type: 'played_with',
          label: `Plays with ${star.displayName}`,
          value: `${star.team.id}:${star.id}`,
          image: star.photo,
        });
      }
    }

    return criteria;
  }

  // Proper Fisher-Yates shuffle — unbiased unlike Array.sort(() => rand())
  private shuffle<T>(arr: T[], rand: () => number): T[] {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(rand() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  private pickGrid(pool: PoolPlayer[], rand: () => number): { rows: Criterion[]; cols: Criterion[] } {
    const all = this.buildBox2boxCriteria(pool);
    const n = all.length;

    // ── Step 1: Pre-compute pairwise compatibility ───────────────────────────
    // compat[i][j] = true means at least 1 pool player satisfies both criteria i and j.
    // This is the ground truth — no assumptions about types needed.
    const compat: boolean[][] = Array.from({ length: n }, () => new Array(n).fill(false));
    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        const ok = pool.some(
          (p) => this.matchesCriterion(p, all[i]) && this.matchesCriterion(p, all[j]),
        );
        compat[i][j] = compat[j][i] = ok;
      }
    }

    // ── Step 2: Greedy grid search with diversity ────────────────────────────
    // Find 3 rows and 3 cols where every (row_i, col_j) pair is compatible.
    // We want type diversity: prefer rows/cols that aren't all the same type.
    const shuffled = this.shuffle([...Array(n).keys()], rand);

    // Score: prefer criteria that are compatible with many others (more flexible)
    const compatCount = shuffled.map((i) => compat[i].filter(Boolean).length);

    // Sort shuffled by compatibility count descending so we try versatile criteria first
    shuffled.sort((a, b) => compatCount[b] - compatCount[a]);

    const MAX_TRIES = 60;
    let tries = 0;

    for (let ai = 0; ai < n && tries < MAX_TRIES; ai++) {
      const ri = shuffled[ai];

      for (let bi = ai + 1; bi < n && tries < MAX_TRIES; bi++) {
        const rj = shuffled[bi];

        for (let ci = bi + 1; ci < n && tries < MAX_TRIES; ci++) {
          const rk = shuffled[ci];
          tries++;

          // Collect col indices compatible with ALL 3 rows
          const validColIdxs: number[] = [];
          for (let l = 0; l < n; l++) {
            if (l === ri || l === rj || l === rk) continue;
            if (compat[ri][l] && compat[rj][l] && compat[rk][l]) {
              validColIdxs.push(l);
            }
          }
          if (validColIdxs.length < 3) continue;

          // Pick 3 cols with type diversity (at most 2 of the same type)
          const shuffledColIdxs = this.shuffle(validColIdxs, rand);
          const colTypeCounts = new Map<string, number>();
          const cols: Criterion[] = [];
          for (const l of shuffledColIdxs) {
            if (cols.length >= 3) break;
            const cnt = colTypeCounts.get(all[l].type) ?? 0;
            if (cnt < 2) {
              cols.push(all[l]);
              colTypeCounts.set(all[l].type, cnt + 1);
            }
          }
          if (cols.length < 3) continue;

          const rows = [all[ri], all[rj], all[rk]];

          // Prefer at least 2 different row types for variety
          const rowTypeCount = new Set(rows.map((r) => r.type)).size;
          if (rowTypeCount < 2 && tries < MAX_TRIES / 2) continue; // keep trying early on

          return { rows, cols };
        }
      }
    }

    // ── Fallback: guaranteed valid (leagues × nationalities) ─────────────────
    const leagues      = this.shuffle(all.filter((c) => c.type === 'league'), rand).slice(0, 3);
    const nationalities = this.shuffle(all.filter((c) => c.type === 'nationality'), rand).slice(0, 3);
    return { rows: leagues, cols: nationalities };
  }

  private matchesAgeGroup(age: number, value: string): boolean {
    if (value === 'u23') return age < 23;
    if (value === 'u26') return age < 26;
    if (value === 'o28') return age >= 28;
    if (value === 'o31') return age >= 31;
    return false;
  }

  private matchesCriterion(player: PoolPlayer, criterion: Criterion): boolean {
    switch (criterion.type) {
      case 'league':
        return player.leagueId === parseInt(criterion.value);
      case 'nationality':
        return player.nationality?.name === criterion.value;
      case 'position':
        return player.position?.id === parseInt(criterion.value);
      case 'goals':
        return player.goals >= parseInt(criterion.value);
      case 'assists':
        return player.assists >= parseInt(criterion.value);
      case 'team':
        return player.team?.id === parseInt(criterion.value);
      case 'age_group':
        return this.matchesAgeGroup(player.age, criterion.value);
      case 'continent':
        return (player.nationality?.name ? CONTINENT_MAP[player.nationality.name] : undefined) === criterion.value;
      case 'played_with': {
        const [teamId, starId] = criterion.value.split(':').map(Number);
        return player.team?.id === teamId && player.id !== starId;
      }
      case 'trophy':
        return (player.trophies ?? []).some((t) => t.id === parseInt(criterion.value));
      case 'manager': {
        // value: "{managerId}:{teamId}" — player must be on that team
        const teamId = parseInt(criterion.value.split(':')[1]);
        return player.team?.id === teamId;
      }
      default:
        return false;
    }
  }
}
