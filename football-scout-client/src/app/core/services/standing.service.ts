import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { StandingEntry } from '../models/standing.model';
import { ApiResponse } from '../models/api-response.model';

@Injectable({ providedIn: 'root' })
export class StandingService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/standings`;

  getStandings(seasonId: number): Observable<StandingEntry[]> {
    const params = new HttpParams().set('seasonId', String(seasonId));
    return this.http.get<ApiResponse<StandingEntry[]>>(this.base, { params }).pipe(map(r => r.data));
  }

  getLiveStandings(leagueId: number): Observable<StandingEntry[]> {
    return this.http
      .get<ApiResponse<StandingEntry[]>>(`${this.base}/live/leagues/${leagueId}`)
      .pipe(map(r => r.data ?? []));
  }

  getRoundStandings(roundId: number): Observable<StandingEntry[]> {
    return this.http
      .get<ApiResponse<StandingEntry[]>>(`${this.base}/rounds/${roundId}`)
      .pipe(map(r => r.data ?? []));
  }
}
