import { type Request, type Response } from 'express';
import { Game } from '../models/Game';
import { generateUniqueCode, generateInviteLink } from '../utils/linkGenerator';
import type { CreateGameRequest, CreateGameResponse } from '../types/game';

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