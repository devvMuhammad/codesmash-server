type DifficultyType = "easy" | "medium" | "hard";

export interface IGame {
  _id?: string;
  hostId: string;
  players: string[];
  spectators: string[];
  inviteCode: string;
  spectatorCode: string;
  status: GameStatus;
  problemId: string;
  createdAt: Date;
  updatedAt?: Date;
  expiresAt: Date;
  timeLimit: number;
}

export enum GameStatus {
  WAITING = 'waiting',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled'
}

export interface CreateGameRequest {
  hostId: string;
  expiresAt: Date;
  timeLimit: number;
  difficulty: DifficultyType;
}

export interface CreateGameResponse {
  gameId: string;
  inviteLink: string;
  inviteCode: string;
}