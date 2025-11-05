import { model, Schema, Document } from "mongoose";
import type { IProblem } from "../types/problem";

export interface IProblemDocument extends Omit<IProblem, '_id'>, Document { }

const problemSchema = new Schema<IProblemDocument>({
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  difficulty: {
    type: String,
    required: true
  },
  testCases: {
    type: String,
    required: true,
  },
  initialCodes: {
    python: {
      type: String,
      required: true
    },
    javascript: {
      type: String,
      required: true
    },
    java: {
      type: String,
      required: true
    },
    cpp: {
      type: String,
      required: true,
    }
  },
  correctOutput: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
})

problemSchema.pre('save', function (next) {
  this.updatedAt = new Date();
  next();
});

export const Problem = model<IProblemDocument>('problem', problemSchema)