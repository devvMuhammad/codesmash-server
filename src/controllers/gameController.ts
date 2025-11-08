import { type Request, type Response } from 'express';
import { Game } from '../models/Game';
import { generateUniqueCode, generateInviteLink } from '../utils/linkGenerator';
import { type CreateGameRequest, type CreateGameResponse, type JoinGameRequest, type JoinGameResponse, GameStatus, type GameResult, GameResultReason } from '../types/game';
import mongoose from 'mongoose';
import { codeStorage } from '../services/codeStorage';
import { Problem } from '../models/Problem';
import type { IProblem } from '../types/problem';
import { auraService } from '../services/auraService';

export const createGame = async (req: Request, res: Response): Promise<void> => {
  try {
    const { host, timeLimit, difficulty }: CreateGameRequest = req.body;

    const inviteCode = generateUniqueCode(8);

    // find a problem for the desired difficulty but for now dummy
    const problemIds = await Problem.find({ difficulty }, { _id: 1 })
    const problemId = problemIds[Math.floor(Math.random() * problemIds.length)]!._id as string;

    const newGame = new Game({
      host: new mongoose.Types.ObjectId(host),
      inviteCode,
      problem: new mongoose.Types.ObjectId(problemId),
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
      .populate('problem')
      .lean();

    if (!game) {
      res.status(404).json({ error: 'Game not found' });
      return;
    }

    // Get codes from in-memory storage with fallback to database
    const memoryCode = codeStorage.getGameCodes(gameId);
    const problem = game.problem as IProblem
    const codes = memoryCode || {
      hostCode: game.hostCode || "",
      challengerCode: game.challengerCode || ""
    };

    // Calculate totalTestCases from correctOutput
    const totalTestCases = problem.correctOutput ? problem.correctOutput.trim().split('\n').length : 0;

    // Calculate timeRemaining if game is in progress
    let timeRemaining = game.timeLimit; // Default to full time limit
    if (game.startedAt && game.status === GameStatus.IN_PROGRESS) {
      const startedAt = new Date(game.startedAt).getTime();
      const elapsedSeconds = Math.floor((Date.now() - startedAt) / 1000);
      timeRemaining = Math.max(0, game.timeLimit - elapsedSeconds);
    }

    const gameData = {
      ...game,
      _id: game._id.toString(),
      hostId: typeof game.host === 'object' ? game.host._id?.toString() : game.host,
      challengerId: typeof game.challenger === 'object' ? game.challenger._id?.toString() : game.challenger,
      hostCode: codes.hostCode,
      challengerCode: codes.challengerCode,
      problem: {
        ...problem,
        totalTestCases
      },
      timeRemaining
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

    if (!gameId) {
      res.status(400).json({
        success: false,
        role: 'spectator',
        message: 'Missing required fields'
      });
      return;
    }

    if (!userId) {
      res.status(400).json({
        success: false,
        role: 'spectator',
        message: 'You have joined as a spectator'
      });
      return;
    }

    const game = await Game.findById(gameId);

    if (!game) {
      res.status(404).json({
        success: false,
        role: undefined,
        message: 'Game not found'
      });
      return;
    }

    // if game is finished, return
    if (game.status === GameStatus.COMPLETED) {
      let userRole = undefined;
      if (game.host.toString() === userId) {
        userRole = 'host';
      } else if (game.challenger?.toString() === userId) {
        userRole = 'challenger';
      } else {
        userRole = 'spectator';
      }

      res.status(200).json({
        success: true,
        role: userRole,
        message: 'Game is finished'
      });
      return;
    }

    // Check if user is the host
    if (game.host.toString() === userId) {
      console.log("game.host.toString()", game.host.toString(), userId)

      console.log("join host game")
      if (!game.hostJoined) {
        game.hostJoined = true;
        await game.save();
      }
      console.log("higaya ahiahuhs")

      const response: JoinGameResponse = {
        success: true,
        role: 'host',
        message: 'Host has joined the game',
      };
      res.status(200).json(response);
      return;
    }

    // Check if user is already the challenger
    if (game.challenger?.toString() === userId) {
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

    // check if invite code is present
    if (!inviteCode) {
      res.status(400).json({
        success: false,
        role: 'spectator',
        message: 'Invite code is required'
      });
      return;
    }

    // Check if invite code is valid
    if (game.inviteCode === inviteCode) {
      // Check if there's already a challenger
      if (game.challenger) {

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
      // save id in the challenge
      game.challenger = userId;
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

export const leaveGame = async (gameId: string, userId: string, role: string): Promise<void> => {
  try {
    if (!gameId || !userId || !role) {
      return;
    }

    // skip spectator role
    if (role !== 'host' && role !== 'challenger') {
      console.log(`User ${userId} with role '${role}' left game ${gameId} - no action needed`);
      return;
    }

    const game = await Game.findById(gameId);
    if (!game) {
      console.error(`Game ${gameId} not found when user ${userId} tried to leave`);
      return;
    }

    if (role === 'host' && game.host.toString() === userId) {
      if (game.hostJoined) {
        game.hostJoined = false;
        console.log(`Host ${userId} left game ${gameId}`);
      }
    }

    if (role === 'challenger' && game.challenger?.toString() === userId) {
      if (game.challengerJoined) {
        game.challengerJoined = false;
        console.log(`Challenger ${userId} left game ${gameId}`);
      }
    }

    await game.save();

  } catch (error) {
    console.error('Error in leaveGame:', error);
  }
};

export const handleChallengerQuit = async (gameId: string, userId: string): Promise<boolean> => {
  try {
    if (!gameId || !userId) {
      console.error('Missing gameId or userId for challenger quit');
      return false;
    }

    const game = await Game.findById(gameId);
    if (!game) {
      console.error(`Game ${gameId} not found when challenger ${userId} tried to quit`);
      return false;
    }

    // Verify user is actually the challenger
    if (!game.challenger || game.challenger.toString() !== userId) {
      console.error(`User ${userId} is not the challenger for game ${gameId}`);
      return false;
    }

    // Remove challenger from game
    game.challenger = undefined;
    game.challengerJoined = false;

    await game.save();
    console.log(`Challenger ${userId} quit game ${gameId} - game reset to waiting for challenger`);

    return true;

  } catch (error) {
    console.error('Error in handleChallengerQuit:', error);
    return false;
  }
};

export const startBattle = async (gameId: string, userId: string): Promise<boolean> => {
  try {
    if (!gameId || !userId) {
      console.error('Missing gameId or userId for start battle');
      return false;
    }

    const game = await Game.findById(gameId);
    if (!game) {
      console.error(`Game ${gameId} not found when host ${userId} tried to start battle`);
      return false;
    }

    // Verify user is the host
    if (game.host.toString() !== userId) {
      console.error(`User ${userId} is not the host for game ${gameId}`);
      return false;
    }

    // Verify game is in waiting state
    if (game.status !== GameStatus.WAITING) {
      console.error(`Game ${gameId} is not in waiting state (current: ${game.status})`);
      return false;
    }

    // Verify both players have joined
    if (!game.hostJoined || !game.challengerJoined) {
      console.error(`Both players must be joined to start battle. Host: ${game.hostJoined}, Challenger: ${game.challengerJoined}`);
      return false;
    }

    // Update game status to ready_to_start
    game.status = GameStatus.READY_TO_START;
    await game.save();

    console.log(`Host ${userId} started battle for game ${gameId} - status updated to ready_to_start`);
    return true;

  } catch (error) {
    console.error('Error in startBattle:', error);
    return false;
  }
};

export const markChallengerReady = async (gameId: string, userId: string): Promise<{ success: boolean; game?: any }> => {
  try {
    if (!gameId || !userId) {
      console.error('Missing gameId or userId for challenger ready');
      return { success: false };
    }

    const game = await Game.findById(gameId);
    if (!game) {
      console.error(`Game ${gameId} not found when challenger ${userId} tried to mark ready`);
      return { success: false };
    }

    // Verify user is the challenger
    if (!game.challenger || game.challenger.toString() !== userId) {
      console.error(`User ${userId} is not the challenger for game ${gameId}`);
      return { success: false };
    }

    // Verify game is in ready_to_start state
    if (game.status !== GameStatus.READY_TO_START) {
      console.error(`Game ${gameId} is not in ready_to_start state (current: ${game.status})`);
      return { success: false };
    }

    // Update game status to in_progress and set startedAt timestamp
    game.status = GameStatus.IN_PROGRESS;
    game.startedAt = new Date();
    await game.save();

    console.log(`Challenger ${userId} marked ready for game ${gameId} - status updated to in_progress, timer started`);
    return { success: true, game };

  } catch (error) {
    console.error('Error in markChallengerReady:', error);
    return { success: false };
  }
};

export const forfeitGame = async (gameId: string, userId: string, role: string): Promise<{ success: boolean; result?: GameResult }> => {
  try {
    if (!gameId || !userId || !role) {
      console.error('Missing gameId, userId, or role for forfeit game');
      return { success: false };
    }

    const game = await Game.findById(gameId);
    if (!game) {
      console.error(`Game ${gameId} not found when user ${userId} tried to forfeit`);
      return { success: false };
    }

    // Verify game is in progress
    if (game.status !== GameStatus.IN_PROGRESS) {
      console.error(`Game ${gameId} is not in progress (current: ${game.status}) - cannot forfeit`);
      return { success: false };
    }

    // Verify user is either host or challenger
    const isHost = game.host.toString() === userId;
    const isChallenger = game.challenger?.toString() === userId;

    if (!isHost && !isChallenger) {
      console.error(`User ${userId} is not a participant in game ${gameId}`);
      return { success: false };
    }

    // Verify role matches user position
    if ((role === 'host' && !isHost) || (role === 'challenger' && !isChallenger)) {
      console.error(`User ${userId} role mismatch - claimed ${role} but is ${isHost ? 'host' : 'challenger'}`);
      return { success: false };
    }

    // Determine winner (the player who didn't forfeit)
    const winnerId = isHost ? game.challenger?.toString() : game.host.toString();
    const forfeiterName = role === 'host' ? 'Host' : 'Challenger';
    const winnerName = role === 'host' ? 'Challenger' : 'Host';

    // Create result object
    const gameResult: GameResult = {
      reason: GameResultReason.FORFEIT,
      winner: winnerId || '',
      message: `${forfeiterName} forfeited the game. ${winnerName} wins by forfeit!`
    };

    // Update game status, result, and completion timestamp
    game.status = GameStatus.COMPLETED;
    game.result = gameResult;
    game.completedAt = new Date();
    await game.save();

    // Award AURA for forfeit (penalty for forfeiter, reward for winner)
    if (winnerId) {
      await auraService.handleForfeit(userId, winnerId);
    }

    console.log(`User ${userId} (${role}) forfeited game ${gameId} - winner: ${winnerId}`);
    return { success: true, result: gameResult };

  } catch (error) {
    console.error('Error in forfeitGame:', error);
    return { success: false };
  }
};

export const getLiveBattles = async (req: Request, res: Response): Promise<void> => {
  try {
    const games = await Game.find({
      $or: [
        { status: GameStatus.IN_PROGRESS },
        { status: GameStatus.READY_TO_START }
      ]
    })
      .populate('host', 'name email image id')
      .populate('challenger', 'name email image id')
      .populate('problem', 'title difficulty')
      .sort({ startedAt: -1 })
      .limit(20)
      .lean();

    // Calculate remaining time for each game
    const liveBattles = games.map(game => {
      const startedAt = game.startedAt ? new Date(game.startedAt).getTime() : Date.now();
      const timeLimit = game.timeLimit || 0;
      const elapsedSeconds = Math.floor((Date.now() - startedAt) / 1000);
      const remainingSeconds = Math.max(0, timeLimit - elapsedSeconds);

      return {
        ...game,
        _id: game._id.toString(),
        remainingSeconds
      };
    });

    res.status(200).json(liveBattles);
  } catch (error) {
    console.error('Error fetching live battles:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getOpenChallenges = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.query as { userId: string | undefined };

    const games = await Game.find({
      status: GameStatus.WAITING,
      challenger: { $exists: false },
      host: { $ne: userId }
    })
      .populate('host', 'name email image id')
      .populate('problem', 'title difficulty')
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();

    const openChallenges = games.map(game => ({
      ...game,
      _id: game._id.toString()
    }));

    console.log("open", openChallenges)

    res.status(200).json(openChallenges);
  } catch (error) {
    console.error('Error fetching open challenges:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

