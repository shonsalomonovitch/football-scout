import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { Venue } from '../models/venue.model';
import { ApiResponse } from '../models/api-response.model';

@Injectable({ providedIn: 'root' })
export class VenueService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/venues`;

  getVenue(id: number): Observable<Venue> {
    return this.http.get<ApiResponse<Venue>>(`${this.base}/${id}`).pipe(map(r => r.data));
  }

  getSeasonVenues(seasonId: number): Observable<Venue[]> {
    return this.http.get<ApiResponse<Venue[]>>(`${this.base}/seasons/${seasonId}`).pipe(map(r => r.data));
  }

  searchVenues(name: string): Observable<Venue[]> {
    const params = new HttpParams().set('name', name);
    return this.http.get<ApiResponse<Venue[]>>(`${this.base}/search`, { params }).pipe(map(r => r.data));
  }
}
