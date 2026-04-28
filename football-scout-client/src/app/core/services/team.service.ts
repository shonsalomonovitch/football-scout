import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { Team, TeamFilters, TeamSquad, TopTeam } from '../models/team.model';
import { Starting11 } from '../models/fixture.model';
import { ApiResponse } from '../models/api-response.model';

@Injectable({ providedIn: 'root' })
export class TeamService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/teams`;

  getTeams(filters: TeamFilters): Observable<Team[]> {
    const params = new HttpParams().set('seasonId', String(filters.seasonId));

    return this.http
      .get<ApiResponse<Team[]>>(this.base, { params })
      .pipe(map((res) => res.data));
  }

  getTeam(id: number): Observable<Team> {
    return this.http
      .get<ApiResponse<Team>>(`${this.base}/${id}`)
      .pipe(map((res) => res.data));
  }

  getSquad(id: number): Observable<TeamSquad> {
    return this.http
      .get<ApiResponse<TeamSquad>>(`${this.base}/${id}/squad`)
      .pipe(map((res) => res.data));
  }

  getSquadDetailed(id: number): Observable<TeamSquad> {
    return this.http
      .get<ApiResponse<TeamSquad>>(`${this.base}/${id}/squad/detailed`)
      .pipe(map((res) => res.data));
  }

  getStarting11(id: number): Observable<Starting11> {
    return this.http
      .get<ApiResponse<Starting11>>(`${this.base}/${id}/starting11`)
      .pipe(map((res) => res.data));
  }

  getTopTeams(): Observable<TopTeam[]> {
    return this.http
      .get<ApiResponse<TopTeam[]>>(`${this.base}/top`)
      .pipe(map((res) => res.data));
  }
}
