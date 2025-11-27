import { Queue, Worker, Job } from 'bullmq';
import type { Server } from 'socket.io';
import { Game } from '../models/Game';
import { GameStatus, GameResultReason } from '../types/game';
import { redisConnection } from '../config/redis';
import { auraService } from './auraService';


const QUEUE_NAME = 'game-timers';

// Job data interface
interface GameTimerJobData {
  gameId: string;
  timeLimit: number;
  startedAt: Date;
}

// Create the game timer queue
export const gameTimerQueue = new Queue<GameTimerJobData>(QUEUE_NAME, {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3, // Retry 3 times if job fails
    backoff: {
      type: 'exponential',
      delay: 1000 // Start with 1 second delay
    },
    removeOnComplete: true, // Clean up completed jobs
    removeOnFail: false // Keep failed jobs for debugging
  }
});

console.log('Game timer queue initialized');

/**
 * Game Timer Service using BullMQ
 * Handles precise game time expiration with Redis-backed job queue
 */
class GameTimerService {
  private worker: Worker<GameTimerJobData> | null = null;
  private io: Server | null = null;

  /**
   * Initialize the worker to process timer expiration jobs
   * Must be called on server startup
   * fills the private variables i.e io and worker
   */
  initializeWorker(io: Server) {
    this.io = io;

    this.worker = new Worker<GameTimerJobData>(
      QUEUE_NAME,
      async (job: Job<GameTimerJobData>) => {
        await this.handleTimeExpired(job.data);
      },
      {
        connection: redisConnection,
        concurrency: 10 // Process up to 10 jobs concurrently
      }
    );

    // Worker event handlers
    this.worker.on('completed', (job) => {
      console.log(`[Timer] Job ${job.id} completed for game ${job.data.gameId}`);
    });

    this.worker.on('failed', (job, err) => {
      console.error(`[Timer] Job ${job?.id} failed for game ${job?.data.gameId}:`, err);
    });

    this.worker.on('error', (err) => {
      console.error('[Timer] Worker error:', err);
    });

    console.log('Game timer worker started');
  }

  /**
   * Start a timer for a specific game
   * Schedules a delayed job to expire the game
   * job id is expire-${gameId}
   */
  async startTimer(gameId: string, durationSeconds: number, startedAt: Date) {
    try {
      // Clear any existing timer for this game first
      await this.clearTimer(gameId);

      const delayMs = durationSeconds * 1000;

      console.log(`[Timer] Starting ${durationSeconds}s timer for game ${gameId}`);

      // Add delayed job to queue
      await gameTimerQueue.add(
        `expire-${gameId}`,
        {
          gameId,
          timeLimit: durationSeconds,
          startedAt
        },
        {
          delay: delayMs,
          jobId: `timer-${gameId}` // Unique job ID per game
        }
      );

      console.log(`[Timer] Timer scheduled for game ${gameId} (expires in ${durationSeconds}s): ${new Date()}`);
    } catch (error) {
      console.error(`[Timer] Error starting timer for game ${gameId}:`, error);
      throw error;
    }
  }

  /**
   * Clear a timer for a game (when game ends early)
   */
  async clearTimer(gameId: string) {
    try {
      const jobId = `timer-${gameId}`;
      const job = await gameTimerQueue.getJob(jobId);

      if (job) {
        await job.remove();
        console.log(`[Timer] Cleared timer for game ${gameId}`);
        return true;
      }

      return false;
    } catch (error) {
      console.error(`[Timer] Error clearing timer for game ${gameId}:`, error);
      return false;
    }
  }

  /**
   * Resume active timers after server restart
   * Reschedules timers for all in-progress games
   */
  async resumeActiveTimers(io: Server) {
    try {
      console.log('[Timer] Resuming active game timers...');

      const activeGames = await Game.find({
        status: GameStatus.IN_PROGRESS,
        startedAt: { $exists: true }
      }).lean();

      console.log(`[Timer] Found ${activeGames.length} active games`);

      for (const game of activeGames) {
        if (!game.startedAt) continue;

        const elapsed = (Date.now() - new Date(game.startedAt).getTime()) / 1000;
        const remaining = game.timeLimit - elapsed;

        if (remaining <= 0) {
          // Already expired, end immediately
          console.log(`[Timer] Game ${game._id} already expired, ending now`);
          await this.handleTimeExpired({
            gameId: game._id!.toString(),
            timeLimit: game.timeLimit,
            startedAt: game.startedAt
          });
        } else {
          // Resume timer with remaining time
          console.log(`[Timer] Resuming game ${game._id} with ${Math.floor(remaining)}s remaining`);
          await this.startTimer(game._id!.toString(), remaining, game.startedAt);
        }
      }

      console.log('[Timer] Active timers resumed');
    } catch (error) {
      console.error('[Timer] Error resuming active timers:', error);
    }
  }

  /**
   * Handle time expiration - update DB and notify clients
   * Determines winner based on number of test cases passed
   */
  private async handleTimeExpired(data: GameTimerJobData) {
    const { gameId } = data;

    try {
      console.log(`[Timer] Time expired for game ${gameId}: ${new Date()}`);

      // Get game with test progress
      const currentGame = await Game.findById(gameId);
      if (!currentGame) {
        console.error(`[Timer] Game ${gameId} not found when handling expiration`);
        return;
      }

      // Determine winner based on tests passed
      const hostTestsPassed = currentGame.hostTestsPassed || 0;
      const challengerTestsPassed = currentGame.challengerTestsPassed || 0;

      let winner: string | undefined;
      let message: string;

      if (hostTestsPassed > challengerTestsPassed) {
        // Host wins
        winner = currentGame.host as string;
        message = `Time's up! Host won by passing ${hostTestsPassed} test cases vs ${challengerTestsPassed}.`;
      } else if (challengerTestsPassed > hostTestsPassed) {
        // Challenger wins
        winner = currentGame.challenger as string;
        message = `Time's up! Challenger won by passing ${challengerTestsPassed} test cases vs ${hostTestsPassed}.`;
      } else {
        // Draw (same number of tests passed)
        winner = undefined;
        message = `Time's up! It's a draw - both players passed ${hostTestsPassed} test cases.`;
      }

      // Award AURA based on time expiration result
      const hostId = currentGame.host.toString();
      const challengerId = currentGame.challenger?.toString();

      if (winner && challengerId) {
        // There's a winner - award winner and penalize loser
        const loserId = winner === hostId ? challengerId : hostId;
        await auraService.handleMatchCompletion(winner, loserId, 'Time expired');
      }
      // If draw (winner === undefined), no aura changes (DRAW = 0 points)

      // Update game in database
      const game = await Game.findByIdAndUpdate(
        gameId,
        {
          status: GameStatus.COMPLETED,
          completedAt: new Date(),
          result: {
            reason: GameResultReason.TIME_UP,
            winner,
            message
          }
        },
        { new: true }
      ).populate('host challenger', 'name email image');

      if (!game) {
        console.error(`[Timer] Game ${gameId} not found after update`);
        return;
      }

      // Notify all players in the room via WebSocket
      if (this.io) {
        this.io.to(gameId).emit('game_time_expired', {
          gameId,
          result: game.result,
          completedAt: game.completedAt,
          status: GameStatus.COMPLETED
        });

        console.log(`[Timer] Game ${gameId} ended due to time expiration - Winner: ${winner || 'Draw'}`);
      } else {
        console.error('[Timer] Socket.IO instance not available');
      }
    } catch (error) {
      console.error(`[Timer] Error handling time expiration for game ${gameId}:`, error);
      throw error; // Re-throw to trigger BullMQ retry
    }
  }

  /**
   * Get queue stats and metrics
   */
  async getQueueStats() {
    try {
      const [waiting, active, completed, failed, delayed] = await Promise.all([
        gameTimerQueue.getWaitingCount(),
        gameTimerQueue.getActiveCount(),
        gameTimerQueue.getCompletedCount(),
        gameTimerQueue.getFailedCount(),
        gameTimerQueue.getDelayedCount()
      ]);

      return {
        waiting,
        active,
        completed,
        failed,
        delayed,
        total: waiting + active + delayed
      };
    } catch (error) {
      console.error('[Timer] Error getting queue stats:', error);
      return null;
    }
  }

  /**
   * Clean up resources on shutdown
   */
  async shutdown() {
    console.log('[Timer] Shutting down game timer service...');

    if (this.worker) {
      await this.worker.close();
    }

    await gameTimerQueue.close();
    console.log('[Timer] Game timer service shutdown complete');
  }
}

// Export singleton instance
export const gameTimerService = new GameTimerService();
