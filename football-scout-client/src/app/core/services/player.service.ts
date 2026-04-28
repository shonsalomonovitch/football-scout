import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { Player, PlayerSearchFilters, PlayerSearchMeta, PlayerLeague, PlayerTeam, TopPlayer } from '../models/player.model';
import { ApiResponse } from '../models/api-response.model';

interface PlayerSearchApiResponse {
  success: boolean;
  data: {
    data: Player[];
    meta: PlayerSearchMeta;
  };
}

@Injectable({ providedIn: 'root' })
export class PlayerService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/players`;

  searchPlayers(filters: PlayerSearchFilters): Observable<{ data: Player[]; meta: PlayerSearchMeta }> {
    let params = new HttpParams();
    if (filters.name)                     params = params.set('name',     filters.name);
    if (filters.position && filters.position !== 'ALL') params = params.set('position', filters.position);
    if (filters.teamId)                   params = params.set('teamId',   String(filters.teamId));
    if (filters.leagueId)                 params = params.set('leagueId', String(filters.leagueId));
    if (filters.sort)                     params = params.set('sort',     filters.sort);
    if (filters.order)                    params = params.set('order',    filters.order);
    if (filters.limit)                    params = params.set('limit',    String(filters.limit));
    if (filters.page)                     params = params.set('page',     String(filters.page));

    return this.http
      .get<PlayerSearchApiResponse>(`${this.base}/search`, { params })
      .pipe(map((res) => ({ data: res.data?.data ?? [], meta: res.data?.meta ?? { page: 1, limit: 20, total: 0 } })));
  }

  getPlayerLeagues(): Observable<PlayerLeague[]> {
    return this.http
      .get<ApiResponse<PlayerLeague[]>>(`${this.base}/leagues`)
      .pipe(map((res) => res.data ?? []));
  }

  getPlayerTeams(leagueId?: number): Observable<PlayerTeam[]> {
    let params = new HttpParams();
    if (leagueId) params = params.set('leagueId', String(leagueId));
    return this.http
      .get<ApiResponse<PlayerTeam[]>>(`${this.base}/teams`, { params })
      .pipe(map((res) => res.data ?? []));
  }

  getPlayer(id: number): Observable<Player> {
    return this.http
      .get<ApiResponse<Player>>(`${this.base}/${id}`)
      .pipe(map((res) => res.data));
  }

  getSimilarPlayers(id: number): Observable<Player[]> {
    return this.http
      .get<ApiResponse<Player[]>>(`${this.base}/${id}/similar`)
      .pipe(map((res) => res.data));
  }

  getTopPlayers(): Observable<TopPlayer[]> {
    return this.http
      .get<ApiResponse<TopPlayer[]>>(`${this.base}/top`)
      .pipe(map((res) => res.data));
  }
}
