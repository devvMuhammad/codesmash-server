import { type Request, type Response } from 'express';
import { Game } from '../models/Game';

export const getUserChallenges = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;

    if (!userId) {
      res.status(400).json({ error: 'User ID is required' });
      return;
    }

    // Find all games hosted by this user, sorted by creation date (newest first)
    const challenges = await Game.find({ host: userId })
      .populate('host', 'name email image id')
      .populate('challenger', 'name email image id')
      .sort({ createdAt: -1 })
      .lean();

    res.status(200).json(challenges);
  } catch (error) {
    console.error('Error fetching user challenges:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};