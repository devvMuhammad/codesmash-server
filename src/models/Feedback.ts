import mongoose, { Document, Schema } from 'mongoose';

export interface IFeedback {
  _id?: string;
  name: string;
  email: string;
  message: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IFeedbackDocument extends Omit<IFeedback, '_id'>, Document {}

const feedbackSchema = new Schema<IFeedbackDocument>({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true
  },
  message: {
    type: String,
    required: true,
    trim: true
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

feedbackSchema.pre('save', function (next) {
  this.updatedAt = new Date();
  next();
});

export const Feedback = mongoose.model<IFeedbackDocument>('Feedback', feedbackSchema);
