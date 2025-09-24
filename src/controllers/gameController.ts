import { type Request, type Response } from 'express';
import { Game } from '../models/Game';
import { generateUniqueCode, generateInviteLink } from '../utils/linkGenerator';
import type { CreateGameRequest, CreateGameResponse } from '../types/game';
import mongoose from 'mongoose';

export const createGame = async (req: Request, res: Response): Promise<void> => {
  try {
    const { hostId, expiresAt, timeLimit, difficulty }: CreateGameRequest = req.body;

    const inviteCode = generateUniqueCode(8);
    const spectatorCode = generateUniqueCode(8);

    // find a problem for the desired difficulty but for now dummy
    const problemId = generateUniqueCode(8);

    const newGame = new Game({
      hostId,
      players: [],
      spectators: [],
      inviteCode,
      spectatorCode,
      problemId,
      expiresAt,
      timeLimit,
      difficulty
    })

    const savedGame = await newGame.save();
    const inviteLink = generateInviteLink(inviteCode!);

    const response: CreateGameResponse = {
      gameId: savedGame._id!.toString(),
      inviteLink,
      inviteCode: inviteCode!
    };

    res.status(201).json(response);
  } catch (error) {
    console.error('Error creating game:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getGameById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { gameId } = req.params;

    if (!gameId) {
      res.status(400).json({ error: 'Game ID is required' });
      return;
    }

    // Validate if gameId is a valid MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(gameId)) {
      res.status(400).json({ error: 'Invalid game ID format' });
      return;
    }

    const game = await Game.findById(gameId).lean();

    if (!game) {
      res.status(404).json({ error: 'Game not found' });
      return;
    }

    // TODO: Populate problem data when Problem model is implemented
    // For now, we'll return the game without problem details
    const gameData = {
      ...game,
      _id: game._id.toString(),
      // Add mock problem data for now - replace when Problem model exists
      problem: game.problemId ? {
        id: game.problemId,
        title: "Two Sum", // Mock data
        description: "Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.",
        difficulty: game.difficulty,
        examples: [{
          input: "nums = [2,7,11,15], target = 9",
          output: "[0,1]",
          explanation: "Because nums[0] + nums[1] == 9, we return [0, 1]."
        }],
        constraints: [
          "2 <= nums.length <= 10^4",
          "-10^9 <= nums[i] <= 10^9",
          "-10^9 <= target <= 10^9"
        ],
        functionSignature: "function twoSum(nums, target) {\n  // Your solution here\n}"
      } : undefined
    };

    res.status(200).json(gameData);
  } catch (error) {
    console.error('Error fetching game by ID:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

