
export interface IGame {
  _id?: string;
  hostId: string;
  challengerId?: string;
  inviteCode: string;
  spectatorCode: string;
  status: GameStatus;
  difficulty: DifficultyType;
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

export enum DifficultyType {
  EASY = 'easy',
  MEDIUM = 'medium',
  HARD = 'hard'
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

export interface JoinGameRequest {
  gameId: string;
  userId: string;
  inviteCode: string;
}

export interface JoinGameResponse {
  success: boolean;
  role: 'host' | 'challenger' | 'spectator';
  message: string;
}