import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { PlayerComparison, ComparisonHistory } from '../models/analytics.model';
import { ApiResponse } from '../models/api-response.model';

@Injectable({ providedIn: 'root' })
export class AnalyticsService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/analytics`;

  comparePlayers(
    player1Id: number,
    player2Id: number,
    season: number
  ): Observable<PlayerComparison> {
    const params = new HttpParams()
      .set('player1Id', String(player1Id))
      .set('player2Id', String(player2Id))
      .set('season', String(season));

    return this.http
      .get<ApiResponse<PlayerComparison>>(`${this.base}/compare`, { params })
      .pipe(map((res) => res.data));
  }

  getComparisonHistory(): Observable<ComparisonHistory[]> {
    return this.http
      .get<ApiResponse<ComparisonHistory[]>>(`${this.base}/history`)
      .pipe(map((res) => res.data));
  }
}
