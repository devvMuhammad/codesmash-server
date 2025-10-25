import { type Request, type Response } from 'express';
import { Game } from '../models/Game';
import { User } from '../models/User'; // Import User model for population
import { generateUniqueCode, generateInviteLink } from '../utils/linkGenerator';
import type { CreateGameRequest, CreateGameResponse, IGame, JoinGameRequest, JoinGameResponse } from '../types/game';
import mongoose from 'mongoose';
import { mockProblem } from '../mock/problem';

export const createGame = async (req: Request, res: Response): Promise<void> => {
  try {
    const { host, timeLimit, difficulty }: CreateGameRequest = req.body;

    const inviteCode = generateUniqueCode(8);

    // find a problem for the desired difficulty but for now dummy
    const problemId = generateUniqueCode(8);

    const newGame = new Game({
      host: new mongoose.Types.ObjectId(host),
      inviteCode,
      problemId,
      timeLimit,
      difficulty,
      hostJoined: false,
      challengerJoined: false,
      hostCode: "",
      challengerCode: ""
    })

    const savedGame = await newGame.save();
    const inviteLink = generateInviteLink(inviteCode!, savedGame._id!.toString());

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

    const game = await Game.findById(gameId)
      .populate('host', 'name email image id')
      .populate('challenger', 'name email image id')
      .lean();

    console.log("ID SHYT", game?.id, game?.host)
    console.log("GAME SHYT HAHA", game)


    if (!game) {
      res.status(404).json({ error: 'Game not found' });
      return;
    }

    const gameData = {
      ...game,
      _id: game._id.toString(),
      hostId: typeof game.host === 'object' ? game.host._id?.toString() : game.host,
      challengerId: typeof game.challenger === 'object' ? game.challenger._id?.toString() : game.challenger,
      problem: mockProblem
    };

    res.status(200).json(gameData);
  } catch (error) {
    console.error('Error fetching game by ID:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const joinGame = async (req: Request, res: Response): Promise<void> => {
  try {
    const { gameId, userId, inviteCode }: JoinGameRequest = req.body;

    if (!gameId || !userId || !inviteCode) {
      res.status(400).json({
        success: false,
        role: 'spectator',
        message: 'Missing required fields'
      });
      return;
    }

    const game = await Game.findById(gameId);


    if (!game) {
      res.status(404).json({
        success: false,
        role: 'spectator',
        message: 'Game not found'
      });
      return;
    }

    // Check if user is the host
    if (game.host.toString() === userId) {

      game.hostJoined = true;
      await game.save();

      const response: JoinGameResponse = {
        success: true,
        role: 'host',
        message: 'Host has joined the game',
      };
      res.status(200).json(response);
      return;
    }

    // Check if invite code is valid
    if (game.inviteCode === inviteCode) {
      // Check if there's already a challenger
      if (game.challenger) {

        // check if the existing challenger is the same as the current user
        if (game.challenger.toString() === userId) {
          // Update challenger joined status if not already set
          if (!game.challengerJoined) {
            game.challengerJoined = true;
            await game.save();
          }

          const response: JoinGameResponse = {
            success: true,
            role: 'challenger',
            message: 'You are already a challenger in this game.'
          };
          res.status(200).json(response);
          return;
        }

        const response: JoinGameResponse = {
          success: false,
          role: 'spectator',
          message: 'Someone has already joined as challenger. You can spectate instead.'
        };
        res.status(200).json(response);
        return;
      }

      // Join as challenger
      game.challengerJoined = true;
      await game.save();

      const response: JoinGameResponse = {
        success: true,
        role: 'challenger',
        message: 'Successfully joined as challenger',
      };
      res.status(200).json(response);
      return;
    }

    // Invalid invite code - join as spectator (we don't track spectators)
    const response: JoinGameResponse = {
      success: true,
      role: 'spectator',
      message: 'Joined as spectator'
    };
    res.status(200).json(response);

  } catch (error) {
    console.error('Error joining game:', error);
    res.status(500).json({
      success: false,
      role: 'spectator',
      message: 'Internal server error'
    });
  }
};

