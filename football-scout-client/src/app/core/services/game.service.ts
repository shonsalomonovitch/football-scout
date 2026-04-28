import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';

export type MatchResult = 'correct' | 'wrong' | 'higher' | 'lower' | 'close-higher' | 'close-lower';

export interface WhoAreYaDaily { puzzleId: string; photo: string; }
export interface WhoAreYaSearchResult { id: number; displayName: string; photo: string; }

export interface WhoAreYaHints {
  nationality: { value: string; flag?: string;  match: MatchResult };
  league:      { value: string; logo?: string;  match: MatchResult };
  team:        { value: string; logo?: string;  match: MatchResult };
  position:    { value: string;                 match: MatchResult };
  age:         { value: number;                 match: MatchResult };
  shirtNumber: { value: number | null;          match: MatchResult | 'unknown' };
}

export interface WhoAreYaGuessResponse {
  correct: boolean;
  hints?: WhoAreYaHints;
  player?: { id: number; displayName: string; photo: string; position: string; nationality: string; team: string; teamLogo: string; };
}

export interface Box2BoxCriterion { type: string; label: string; value: string; image?: string; }
export interface Box2BoxPuzzle { puzzleId: string; rows: Box2BoxCriterion[]; cols: Box2BoxCriterion[]; }
export interface Box2BoxValidateResponse { valid: boolean; player?: { id: number; displayName: string; photo: string; }; }
export interface Box2BoxSearchResult { id: number; displayName: string; photo: string; }

export interface BingoCategory { id: number; label: string; type: string; value: string; image?: string; }
export interface BingoPlayer {
  id: number; displayName: string; photo: string;
  position: string; nationality: string; nationalityFlag?: string;
  team: string; teamLogo?: string;
  league: string; leagueLogo?: string;
  goals: number; assists: number; age: number;
}
export interface BingoDaily { puzzleId: string; categories: BingoCategory[]; players: BingoPlayer[]; }
export interface BingoValidateResponse { valid: boolean; }

@Injectable({ providedIn: 'root' })
export class GameService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/games`;

  // Who Are Ya
  getWhoAreYaDaily(): Observable<WhoAreYaDaily> {
    return this.http.get<ApiResponse<WhoAreYaDaily>>(`${this.base}/whoareya/daily`).pipe(map(r => r.data));
  }
  getWhoAreYaRandom(): Observable<WhoAreYaDaily> {
    return this.http.get<ApiResponse<WhoAreYaDaily>>(`${this.base}/whoareya/random`).pipe(map(r => r.data));
  }
searchPlayers(q: string): Observable<WhoAreYaSearchResult[]> {
    const params = new HttpParams().set('q', q);
    return this.http.get<ApiResponse<WhoAreYaSearchResult[]>>(`${environment.apiUrl}/games/search`, { params }).pipe(map(r => r.data));
  }

  searchWhoAreYa(q: string): Observable<WhoAreYaSearchResult[]> {
    return this.searchPlayers(q);
  }
  guessWhoAreYa(playerId: number, puzzleId: string, guessNumber: number): Observable<WhoAreYaGuessResponse> {
    return this.http.post<ApiResponse<WhoAreYaGuessResponse>>(`${this.base}/whoareya/guess`, { playerId, puzzleId, guessNumber }).pipe(map(r => r.data));
  }

  // Box2Box
  getBox2BoxDaily(): Observable<Box2BoxPuzzle> {
    return this.http.get<ApiResponse<Box2BoxPuzzle>>(`${this.base}/box2box/daily`).pipe(map(r => r.data));
  }
  getBox2BoxRandom(): Observable<Box2BoxPuzzle> {
    return this.http.get<ApiResponse<Box2BoxPuzzle>>(`${this.base}/box2box/random`).pipe(map(r => r.data));
  }
  validateBox2BoxCell(playerId: number, rowIndex: number, colIndex: number, puzzleId: string): Observable<Box2BoxValidateResponse> {
    return this.http.post<ApiResponse<Box2BoxValidateResponse>>(`${this.base}/box2box/validate`, { playerId, rowIndex, colIndex, puzzleId }).pipe(map(r => r.data));
  }
  searchBox2Box(q: string): Observable<Box2BoxSearchResult[]> {
    return this.searchPlayers(q);
  }

  // Bingo
  getBingoDaily(): Observable<BingoDaily> {
    return this.http.get<ApiResponse<BingoDaily>>(`${this.base}/bingo/daily`).pipe(map(r => r.data));
  }
  getBingoRandom(): Observable<BingoDaily> {
    return this.http.get<ApiResponse<BingoDaily>>(`${this.base}/bingo/random`).pipe(map(r => r.data));
  }
  validateBingoCell(playerId: number, categoryId: number, puzzleId: string): Observable<BingoValidateResponse> {
    return this.http.post<ApiResponse<BingoValidateResponse>>(`${this.base}/bingo/validate`, { playerId, categoryId, puzzleId }).pipe(map(r => r.data));
  }
  wildcardBingo(playerId: number, puzzleId: string): Observable<{ categoryIds: number[] }> {
    return this.http.post<ApiResponse<{ categoryIds: number[] }>>(`${this.base}/bingo/wildcard`, { playerId, puzzleId }).pipe(map(r => r.data));
  }
}
