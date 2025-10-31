
export interface IUser {
  _id: string;
  name?: string;
  email: string;
  emailVerified?: boolean;
  image?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IGame {
  _id?: string;
  host: string | IUser;
  challenger?: string | IUser;
  inviteCode: string;
  status: GameStatus;
  difficulty: DifficultyType;
  problemId: string;
  timeLimit: number;
  hostJoined: boolean;
  challengerJoined: boolean;
  hostCode: string;
  challengerCode: string;
  createdAt: Date;
  updatedAt: Date;
}

export enum GameStatus {
  WAITING = 'waiting',
  READY_TO_START = 'ready_to_start',
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
  host: string;
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