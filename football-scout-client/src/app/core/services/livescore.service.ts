import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { Livescore } from '../models/livescore.model';
import { ApiResponse } from '../models/api-response.model';

@Injectable({ providedIn: 'root' })
export class LivescoreService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/livescores`;

  getAll(): Observable<Livescore[]> {
    return this.http.get<ApiResponse<Livescore[]>>(this.base).pipe(map(r => r.data ?? []));
  }

  getInPlay(): Observable<Livescore[]> {
    return this.http.get<ApiResponse<Livescore[]>>(`${this.base}/inplay`).pipe(map(r => r.data ?? []));
  }

  getLatest(): Observable<Livescore[]> {
    return this.http.get<ApiResponse<Livescore[]>>(`${this.base}/latest`).pipe(map(r => r.data ?? []));
  }
}
