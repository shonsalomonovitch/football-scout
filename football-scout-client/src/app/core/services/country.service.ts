import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { Country } from '../models/country.model';
import { ApiResponse } from '../models/api-response.model';

@Injectable({ providedIn: 'root' })
export class CountryService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/countries`;

  getCountries(search?: string): Observable<Country[]> {
    let params = new HttpParams();
    if (search) params = params.set('search', search);
    return this.http.get<ApiResponse<Country[]>>(this.base, { params }).pipe(map(r => r.data));
  }

  getCountry(id: number): Observable<Country> {
    return this.http.get<ApiResponse<Country>>(`${this.base}/${id}`).pipe(map(r => r.data));
  }
}
