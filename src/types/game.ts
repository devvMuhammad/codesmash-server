import type { IProblem } from "./problem";

export interface IUser {
  _id: string;
  name?: string;
  email: string;
  emailVerified?: boolean;
  image?: string;
  createdAt: Date;
  updatedAt: Date;
}

export enum GameResultReason {
  FORFEIT = 'forfeit',
  TIME_UP = 'time_up',
  COMPLETED = 'completed'
}

export interface GameResult {
  reason: GameResultReason;
  winner: string; // userId of winner
  message: string; // comprehensive result message
}

export interface IGame {
  _id?: string;
  host: string | IUser;
  challenger?: string | IUser;
  inviteCode: string;
  status: GameStatus;
  difficulty: DifficultyType;
  problem: IProblem;
  timeLimit: number;
  hostJoined: boolean;
  challengerJoined: boolean;
  hostCode: string;
  challengerCode: string;
  result?: GameResult;
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