import mongoose, { Schema, Document } from 'mongoose';

export interface IUser {
  id: string;
  name?: string;
  email: string;
  emailVerified?: boolean;
  image?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IUserDocument extends Omit<IUser, 'id'>, Document {
  id: string;
}

const userSchema = new Schema<IUserDocument>({
  id: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
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

export const User = mongoose.model<IUserDocument>('user', userSchema);
