import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { Transfer, TransferFilters } from '../models/transfer.model';
import { ApiResponse } from '../models/api-response.model';

@Injectable({ providedIn: 'root' })
export class TransferService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/transfers`;

  getLatestTransfers(): Observable<Transfer[]> {
    return this.http.get<ApiResponse<Transfer[]>>(this.base).pipe(map(r => r.data ?? []));
  }

  getTransfersBetween(filters: TransferFilters): Observable<Transfer[]> {
    let params = new HttpParams();
    if (filters.from) params = params.set('from', filters.from);
    if (filters.to) params = params.set('to', filters.to);
    return this.http.get<ApiResponse<Transfer[]>>(`${this.base}/between`, { params }).pipe(map(r => r.data ?? []));
  }

  getTeamTransfers(teamId: number): Observable<Transfer[]> {
    return this.http.get<ApiResponse<Transfer[]>>(`${this.base}/teams/${teamId}`).pipe(map(r => r.data ?? []));
  }

  getPlayerTransfers(playerId: number): Observable<Transfer[]> {
    return this.http.get<ApiResponse<Transfer[]>>(`${this.base}/players/${playerId}`).pipe(map(r => r.data ?? []));
  }

  getTransfer(id: number): Observable<Transfer> {
    return this.http.get<ApiResponse<Transfer>>(`${this.base}/${id}`).pipe(map(r => r.data));
  }
}
