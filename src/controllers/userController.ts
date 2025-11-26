import { type Request, type Response } from 'express';
import { Game } from '../models/Game';
import { User } from '../models/User';

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

export const getLeaderboard = async (req: Request, res: Response): Promise<void> => {
  try {
    // Fetch top 100 users sorted by aura points (descending)
    const leaderboard = await User.find()
      .select('_id name email image aura')
      .sort({ aura: -1 })
      .limit(100)
      .lean();

    res.status(200).json(leaderboard);
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};