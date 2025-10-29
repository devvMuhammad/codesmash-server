import { type Request, type Response } from 'express';
import mongoose from 'mongoose';
import { Game } from '../models/Game';
import { User } from '../models/User';
import { GameStatus } from '../types/game';
import {
  calculateStats,
  calculateDifficultyBreakdown,
  formatRecentBattles,
  formatMemberSince,
  type PopulatedGame
} from '../utils/profile-utils';

export const getUserProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;

    if (!userId) {
      res.status(400).json({ error: 'User ID is required' });
      return;
    }

    // Validate MongoDB ObjectId format
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    // Fetch user
    const user = await User.findById(userId).lean();
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    // Get all completed games for this user
    const completedGames = await Game.find({
      $or: [{ host: userId }, { challenger: userId }],
      status: GameStatus.COMPLETED
    })
      .populate('host', 'name username image')
      .populate('challenger', 'name username image')
      .populate('problem', 'title difficulty')
      .sort({ completedAt: -1 })
      .lean() as unknown as PopulatedGame[];

    // Calculate stats
    const { wins, losses, draws, totalBattles, winRate } = calculateStats(completedGames, userId);
    const globalRank = (await User.countDocuments({ aura: { $gt: user.aura || 1000 } })) + 1;

    // Calculate difficulty breakdown
    const difficultyBreakdown = calculateDifficultyBreakdown(completedGames, userId);

    // Format recent battles
    const recentBattles = formatRecentBattles(completedGames, userId);

    // Build response
    const profileData = {
      user: {
        id: user._id.toString(),
        name: user.name,
        username: user.username,
        avatar: user.image,
        memberSince: formatMemberSince(user.createdAt),
        aura: user.aura
      },
      stats: {
        globalRank,
        aura: user.aura,
        winRate,
        totalBattles,
        totalHoursPlayed: 12.5, // HARDCODED for now
        wins,
        losses,
        draws
      },
      difficulty: difficultyBreakdown,
      recentBattles
    };

    res.status(200).json(profileData);
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

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
      .select('_id name username image aura')
      .sort({ aura: -1 })
      .limit(100)
      .lean();

    res.status(200).json(leaderboard);
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};