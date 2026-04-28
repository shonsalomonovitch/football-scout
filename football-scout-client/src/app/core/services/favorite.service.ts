import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import {
  FavoritePlayer,
  FavoriteTeam,
  AddFavoritePlayerPayload,
  AddFavoriteTeamPayload,
} from '../models/favorite.model';
import { ApiResponse } from '../models/api-response.model';

@Injectable({ providedIn: 'root' })
export class FavoriteService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/favorites`;

  getFavoritePlayers(): Observable<FavoritePlayer[]> {
    return this.http
      .get<ApiResponse<FavoritePlayer[]>>(`${this.base}/players`)
      .pipe(map((res) => res.data));
  }

  addFavoritePlayer(payload: AddFavoritePlayerPayload): Observable<FavoritePlayer> {
    return this.http
      .post<ApiResponse<FavoritePlayer>>(`${this.base}/players`, payload)
      .pipe(map((res) => res.data));
  }

  removeFavoritePlayer(apiPlayerId: number): Observable<void> {
    return this.http
      .delete<void>(`${this.base}/players/${apiPlayerId}`);
  }

  getFavoriteTeams(): Observable<FavoriteTeam[]> {
    return this.http
      .get<ApiResponse<FavoriteTeam[]>>(`${this.base}/teams`)
      .pipe(map((res) => res.data));
  }

  addFavoriteTeam(payload: AddFavoriteTeamPayload): Observable<FavoriteTeam> {
    return this.http
      .post<ApiResponse<FavoriteTeam>>(`${this.base}/teams`, payload)
      .pipe(map((res) => res.data));
  }

  removeFavoriteTeam(apiTeamId: number): Observable<void> {
    return this.http
      .delete<void>(`${this.base}/teams/${apiTeamId}`);
  }
}
