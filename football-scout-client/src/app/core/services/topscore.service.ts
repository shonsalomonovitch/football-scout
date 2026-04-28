import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { Topscorer } from '../models/topscore.model';
import { ApiResponse } from '../models/api-response.model';

@Injectable({ providedIn: 'root' })
export class TopscoreService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/topscorers`;

  getSeasonTopscorers(seasonId: number, type: 'goals' | 'assists' | 'yellowcards' | 'redcards' = 'goals'): Observable<Topscorer[]> {
    return this.http
      .get<ApiResponse<Topscorer[]>>(`${this.base}/seasons/${seasonId}/${type}`)
      .pipe(map(r => r.data ?? []));
  }

  getStageTopscorers(stageId: number, type: 'goals' | 'assists' | 'yellowcards' | 'redcards' = 'goals'): Observable<Topscorer[]> {
    return this.http
      .get<ApiResponse<Topscorer[]>>(`${this.base}/stages/${stageId}/${type}`)
      .pipe(map(r => r.data ?? []));
  }
}
