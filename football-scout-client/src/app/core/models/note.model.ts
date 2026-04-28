export interface Note {
  id: number;
  apiPlayerId: number;
  playerName: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateNotePayload {
  apiPlayerId: number;
  playerName: string;
  content: string;
}

export interface UpdateNotePayload {
  content: string;
}
