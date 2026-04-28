import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { Season } from '../models/season.model';
import { ApiResponse } from '../models/api-response.model';

@Injectable({ providedIn: 'root' })
export class SeasonService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/seasons`;

  getSeasons(search?: string): Observable<Season[]> {
    let params = new HttpParams();
    if (search) params = params.set('search', search);
    return this.http.get<ApiResponse<Season[]>>(this.base, { params }).pipe(map(r => r.data));
  }

  getSeason(id: number): Observable<Season> {
    return this.http.get<ApiResponse<Season>>(`${this.base}/${id}`).pipe(map(r => r.data));
  }

  getTeamSeasons(teamId: number): Observable<Season[]> {
    return this.http.get<ApiResponse<Season[]>>(`${this.base}/teams/${teamId}`).pipe(map(r => r.data));
  }
}
