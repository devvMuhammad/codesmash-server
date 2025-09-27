import mongoose, { Schema } from 'mongoose';
import type { IUser } from '../types/game';

const userSchema = new Schema<IUser>({
  name: {
    type: String,
    required: false
  },
  email: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  emailVerified: {
    type: Boolean,
    default: false
  },
  image: {
    type: String,
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
  timestamps: true,
  collection: 'user' // Explicitly set collection name to match Better-Auth
});

userSchema.pre('save', function (next) {
  this.updatedAt = new Date();
  next();
});

export const User = mongoose.model<IUser>('user', userSchema);
