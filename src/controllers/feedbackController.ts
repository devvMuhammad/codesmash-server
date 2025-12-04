import { type Request, type Response } from 'express';
import { Feedback } from '../models/Feedback';

export interface CreateFeedbackRequest {
  name: string;
  email: string;
  message: string;
}

export interface CreateFeedbackResponse {
  success: boolean;
  message: string;
  feedbackId?: string;
}

export const createFeedback = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, message }: CreateFeedbackRequest = req.body;

    // Validate required fields
    if (!name || !email || !message) {
      res.status(400).json({
        success: false,
        message: 'All fields (name, email, message) are required'
      });
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      res.status(400).json({
        success: false,
        message: 'Invalid email format'
      });
      return;
    }

    // Create new feedback document
    const newFeedback = new Feedback({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      message: message.trim()
    });

    const savedFeedback = await newFeedback.save();

    const response: CreateFeedbackResponse = {
      success: true,
      message: 'Thank you for your feedback! We will get back to you soon.',
      feedbackId: savedFeedback._id!.toString()
    };

    res.status(201).json(response);
  } catch (error) {
    console.error('Error creating feedback:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error. Please try again later.'
    });
  }
};
