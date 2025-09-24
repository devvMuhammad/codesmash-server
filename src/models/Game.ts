import mongoose, { Document, Schema } from 'mongoose';
import type { IGame } from '../types/game';
import { DifficultyType, GameStatus } from '../types/game';

export interface IGameDocument extends Omit<IGame, '_id'>, Document { }

const gameSchema = new Schema<IGameDocument>({
  hostId: {
    type: String,
    required: true
  },
  players: [{
    type: String,
    default: []
  }],
  spectators: [{
    type: String,
    default: []
  }],
  inviteCode: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  spectatorCode: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  status: {
    type: String,
    enum: Object.values(GameStatus),
    default: GameStatus.WAITING
  },
  problemId: {
    type: "string",
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  expiresAt: {
    type: Date,
    required: true
  },
  timeLimit: {
    type: Number,
    required: true
  },
  difficulty: {
    type: String,
    enum: Object.values(DifficultyType),
    required: true
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

gameSchema.pre('save', function (next) {
  this.updatedAt = new Date();
  next();
});

export const Game = mongoose.model<IGameDocument>('Game', gameSchema);