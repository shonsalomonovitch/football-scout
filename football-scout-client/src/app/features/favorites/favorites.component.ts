import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { FavoriteService } from '../../core/services/favorite.service';
import { NoteService } from '../../core/services/note.service';
import { FavoritePlayer, FavoriteTeam } from '../../core/models/favorite.model';
import { Note } from '../../core/models/note.model';
import { LoadingComponent } from '../../shared/components/loading/loading.component';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { ErrorStateComponent } from '../../shared/components/error-state/error-state.component';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';

@Component({
  selector: 'app-favorites',
  standalone: true,
  imports: [RouterLink, CommonModule, ReactiveFormsModule, LoadingComponent, EmptyStateComponent, ErrorStateComponent, PageHeaderComponent],
  templateUrl: './favorites.component.html',
  styleUrl: './favorites.component.css',
})
export class FavoritesComponent implements OnInit {
  private favoriteService = inject(FavoriteService);
  private noteService = inject(NoteService);
  private fb = inject(FormBuilder);

  activeTab = signal<'players' | 'teams' | 'notes'>('players');

  favPlayers = signal<FavoritePlayer[]>([]);
  favTeams = signal<FavoriteTeam[]>([]);
  notes = signal<Note[]>([]);

  loading = signal(false);
  error = signal('');

  editingNoteId = signal<number | null>(null);
  editForm = this.fb.group({ content: ['', [Validators.required, Validators.minLength(3)]] });

  ngOnInit(): void {
    this.loadAll();
  }

  loadAll(): void {
    this.loading.set(true);
    this.error.set('');

    this.favoriteService.getFavoritePlayers().subscribe({
      next: (data) => this.favPlayers.set(data ?? []),
      error: () => {},
    });

    this.favoriteService.getFavoriteTeams().subscribe({
      next: (data) => this.favTeams.set(data ?? []),
      error: () => {},
    });

    this.noteService.getNotes().subscribe({
      next: (data) => { this.notes.set(data ?? []); this.loading.set(false); },
      error: (err) => { this.error.set(err?.message || 'Failed to load data'); this.loading.set(false); },
    });
  }

  removePlayer(apiPlayerId: number): void {
    this.favoriteService.removeFavoritePlayer(apiPlayerId).subscribe({
      next: () => this.favPlayers.update(ps => ps.filter(p => p.apiPlayerId !== apiPlayerId)),
    });
  }

  removeTeam(apiTeamId: number): void {
    this.favoriteService.removeFavoriteTeam(apiTeamId).subscribe({
      next: () => this.favTeams.update(ts => ts.filter(t => t.apiTeamId !== apiTeamId)),
    });
  }

  startEdit(note: Note): void {
    this.editingNoteId.set(note.id);
    this.editForm.setValue({ content: note.content });
  }

  saveEdit(note: Note): void {
    if (this.editForm.invalid) return;
    this.noteService.updateNote(note.id, { content: this.editForm.value.content! }).subscribe({
      next: (updated) => {
        this.notes.update(ns => ns.map(n => n.id === updated.id ? updated : n));
        this.editingNoteId.set(null);
      },
    });
  }

  cancelEdit(): void {
    this.editingNoteId.set(null);
  }

  deleteNote(id: number): void {
    this.noteService.deleteNote(id).subscribe({
      next: () => this.notes.update(ns => ns.filter(n => n.id !== id)),
    });
  }

  setTab(tab: 'players' | 'teams' | 'notes'): void {
    this.activeTab.set(tab);
  }

  formatDate(d: string): string {
    return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  notePreview(content: string): string {
    return content.length > 100 ? content.slice(0, 100) + '…' : content;
  }

  initials(name: string): string {
    return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  }

  onImgError(e: Event): void {
    (e.target as HTMLImageElement).style.display = 'none';
  }
}
