import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { League, LeagueFilters } from '../models/league.model';
import { ApiResponse } from '../models/api-response.model';

@Injectable({ providedIn: 'root' })
export class LeagueService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/leagues`;

  getLeagues(filters?: LeagueFilters): Observable<League[]> {
    let params = new HttpParams();
    if (filters?.search)  params = params.set('search', filters.search);
    if (filters?.country) params = params.set('country', filters.country);

    return this.http
      .get<ApiResponse<League[]>>(this.base, { params })
      .pipe(map((res) => res.data));
  }

  getLeague(id: number): Observable<League> {
    return this.http
      .get<ApiResponse<League>>(`${this.base}/${id}`)
      .pipe(map((res) => res.data));
  }
}
