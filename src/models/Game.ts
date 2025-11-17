import mongoose, { Document, Schema } from 'mongoose';
import type { IGame } from '../types/game';
import { DifficultyType, GameStatus, GameResultReason } from '../types/game';

export interface IGameDocument extends Omit<IGame, '_id'>, Document { }

const gameSchema = new Schema<IGameDocument>({
  host: {
    type: Schema.Types.ObjectId,
    ref: 'user',
    required: true
  },
  challenger: {
    type: Schema.Types.ObjectId,
    ref: 'user',
    required: false
  },
  inviteCode: {
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
  problem: {
    type: Schema.Types.ObjectId,
    ref: 'problem',
    required: false
  },
  difficulty: {
    type: String,
    enum: Object.values(DifficultyType),
    required: true
  },
  timeLimit: {
    type: Number,
    required: true
  },
  hostJoined: {
    type: Boolean,
    default: false
  },
  challengerJoined: {
    type: Boolean,
    default: false
  },
  hostCode: {
    type: String,
    required: false
  },
  challengerCode: {
    type: String,
    required: false
  },
  hostTestsPassed: {
    type: Number,
    default: 0,
    required: true
  },
  challengerTestsPassed: {
    type: Number,
    default: 0,
    required: true
  },
  result: {
    reason: {
      type: String,
      enum: Object.values(GameResultReason),
      required: false
    },
    winner: {
      type: String,
      required: false
    },
    message: {
      type: String,
      required: false
    }
  },
  startedAt: {
    type: Date,
    required: false
  },
  completedAt: {
    type: Date,
    required: false
  },
  createdAt: {
    type: Date,
    default: Date.now
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