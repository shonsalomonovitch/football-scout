import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { Round } from '../models/round.model';
import { ApiResponse } from '../models/api-response.model';

@Injectable({ providedIn: 'root' })
export class RoundService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/rounds`;

  getSeasonRounds(seasonId: number): Observable<Round[]> {
    return this.http.get<ApiResponse<Round[]>>(`${this.base}/seasons/${seasonId}`).pipe(map(r => r.data));
  }

  getRound(id: number): Observable<Round> {
    return this.http.get<ApiResponse<Round>>(`${this.base}/${id}`).pipe(map(r => r.data));
  }

  searchRounds(name: string): Observable<Round[]> {
    const params = new HttpParams().set('name', name);
    return this.http.get<ApiResponse<Round[]>>(`${this.base}/search`, { params }).pipe(map(r => r.data));
  }
}
