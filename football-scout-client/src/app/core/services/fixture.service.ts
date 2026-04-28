import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { Fixture, FixtureFilters, FixtureLineup } from '../models/fixture.model';
import { ApiResponse } from '../models/api-response.model';

@Injectable({ providedIn: 'root' })
export class FixtureService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/fixtures`;

  getFixtures(filters: FixtureFilters = {}): Observable<Fixture[]> {
    let params = new HttpParams();
    if (filters.date) params = params.set('date', filters.date);
    if (filters.from) params = params.set('from', filters.from);
    if (filters.to)   params = params.set('to', filters.to);
    if (filters.team) params = params.set('team', String(filters.team));

    return this.http
      .get<ApiResponse<Fixture[]>>(this.base, { params })
      .pipe(map(r => r.data ?? []));
  }

  getFixture(id: number): Observable<Fixture> {
    return this.http
      .get<ApiResponse<Fixture>>(`${this.base}/${id}`)
      .pipe(map(r => r.data));
  }

  getLineups(fixtureId: number): Observable<FixtureLineup[]> {
    return this.http
      .get<ApiResponse<FixtureLineup[]>>(`${this.base}/${fixtureId}/lineups`)
      .pipe(map(r => r.data ?? []));
  }

  getHeadToHead(team1Id: number, team2Id: number): Observable<Fixture[]> {
    return this.http
      .get<ApiResponse<Fixture[]>>(`${this.base}/head-to-head/${team1Id}/${team2Id}`)
      .pipe(map(r => r.data ?? []));
  }
}
