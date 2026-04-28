import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { Note, CreateNotePayload, UpdateNotePayload } from '../models/note.model';
import { ApiResponse } from '../models/api-response.model';

@Injectable({ providedIn: 'root' })
export class NoteService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/notes`;

  getNotes(): Observable<Note[]> {
    return this.http
      .get<ApiResponse<Note[]>>(this.base)
      .pipe(map((res) => res.data));
  }

  getNote(id: number): Observable<Note> {
    return this.http
      .get<ApiResponse<Note>>(`${this.base}/${id}`)
      .pipe(map((res) => res.data));
  }

  createNote(payload: CreateNotePayload): Observable<Note> {
    return this.http
      .post<ApiResponse<Note>>(this.base, payload)
      .pipe(map((res) => res.data));
  }

  updateNote(id: number, payload: UpdateNotePayload): Observable<Note> {
    return this.http
      .patch<ApiResponse<Note>>(`${this.base}/${id}`, payload)
      .pipe(map((res) => res.data));
  }

  deleteNote(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }
}
