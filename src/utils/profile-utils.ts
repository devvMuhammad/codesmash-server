import type { IUser, IGame } from '../types/game';

// Populated game type for profile queries
export interface PopulatedGame extends Omit<IGame, 'host' | 'challenger' | 'problem'> {
  host: IUser & { _id: { toString: () => string } };
  challenger?: IUser & { _id: { toString: () => string } };
  problem?: {
    _id: string;
    title: string;
    difficulty: 'easy' | 'medium' | 'hard';
  };
}

// Helper function to format time ago
export function formatTimeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d`;
  if (hours > 0) return `${hours}h`;
  if (minutes > 0) return `${minutes}m`;
  return 'just now';
}

// Helper function to format duration
export function formatDuration(startedAt: Date, completedAt: Date): string {
  const seconds = Math.floor((completedAt.getTime() - startedAt.getTime()) / 1000);
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}m ${remainingSeconds}s`;
}

// Calculate win/loss/draw statistics
export function calculateStats(completedGames: PopulatedGame[], userId: string) {
  const wins = completedGames.filter(g => g.result?.winner === userId).length;
  const losses = completedGames.filter(g => g.result?.winner && g.result.winner !== userId).length;
  const draws = completedGames.filter(g => !g.result?.winner).length;
  const totalBattles = completedGames.length;
  const winRate = totalBattles > 0 ? Math.round((wins / totalBattles) * 100 * 10) / 10 : 0;

  return { wins, losses, draws, totalBattles, winRate };
}

// Calculate difficulty breakdown
export function calculateDifficultyBreakdown(completedGames: PopulatedGame[], userId: string) {
  const difficultyBreakdown = {
    easy: { wins: 0, losses: 0, draws: 0, games: 0 },
    medium: { wins: 0, losses: 0, draws: 0, games: 0 },
    hard: { wins: 0, losses: 0, draws: 0, games: 0 }
  };

  completedGames.forEach(game => {
    const difficulty = game.difficulty;
    if (difficulty in difficultyBreakdown) {
      difficultyBreakdown[difficulty].games++;
      if (!game.result?.winner) {
        // Draw case - no winner
        difficultyBreakdown[difficulty].draws++;
      } else if (game.result.winner === userId) {
        // Win case
        difficultyBreakdown[difficulty].wins++;
      } else {
        // Loss case
        difficultyBreakdown[difficulty].losses++;
      }
    }
  });

  return difficultyBreakdown;
}

// Format recent battles for response
export function formatRecentBattles(completedGames: PopulatedGame[], userId: string) {
  return completedGames.slice(0, 10).map(game => {
    const isHost = game.host._id.toString() === userId;
    const opponent = isHost ? game.challenger : game.host;

    let result: 'win' | 'loss' | 'draw';
    if (!game.result?.winner) {
      result = 'draw';
    } else if (game.result.winner === userId) {
      result = 'win';
    } else {
      result = 'loss';
    }

    return {
      id: game._id?.toString() || '',
      opponent: {
        name: opponent?.name || 'Unknown',
        username: opponent?.username || 'unknown'
      },
      problem: {
        title: game.problem?.title || 'Unknown Problem',
        difficulty: game.problem?.difficulty || 'easy' as 'easy' | 'medium' | 'hard'
      },
      result,
      timeAgo: game.completedAt ? formatTimeAgo(game.completedAt) : 'Unknown',
      completedAt: game.completedAt ? game.completedAt.toISOString() : new Date().toISOString(),
      duration: (game.startedAt && game.completedAt)
        ? formatDuration(game.startedAt, game.completedAt)
        : '0m 0s',
      timeLimit: Math.round(game.timeLimit / 60) // Convert seconds to minutes
    };
  });
}

// Format member since date
export function formatMemberSince(createdAt: Date): string {
  return new Date(createdAt).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric'
  });
}
