import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { Coach } from '../models/coach.model';
import { ApiResponse } from '../models/api-response.model';

@Injectable({ providedIn: 'root' })
export class CoachService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/coaches`;

  getCoaches(search?: string): Observable<Coach[]> {
    let params = new HttpParams();
    if (search) params = params.set('search', search);
    return this.http.get<ApiResponse<Coach[]>>(this.base, { params }).pipe(map(r => r.data));
  }

  getLatestCoaches(): Observable<Coach[]> {
    return this.http.get<ApiResponse<Coach[]>>(`${this.base}/latest`).pipe(map(r => r.data));
  }

  getTeamCoaches(teamId: number): Observable<Coach[]> {
    return this.http.get<ApiResponse<Coach[]>>(`${this.base}/teams/${teamId}`).pipe(map(r => r.data));
  }

  getCoach(id: number): Observable<Coach> {
    return this.http.get<ApiResponse<Coach>>(`${this.base}/${id}`).pipe(map(r => r.data));
  }
}
