import mongoose, { Document, Schema } from 'mongoose';
import type { IGame } from '../types/game';
import { DifficultyType, GameStatus } from '../types/game';

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
  problemId: {
    type: String,
    required: true
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
  result: {
    reason: {
      type: String,
      enum: ['forfeit', 'time_up', 'completed'],
      required: false
    },
    winner: {
      type: Schema.Types.ObjectId,
      ref: 'user',
      required: false
    },
    message: {
      type: String,
      required: false
    }
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