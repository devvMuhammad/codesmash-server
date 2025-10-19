import { Game } from '../models/Game';

export type PlayerRolesType = 'host' | 'challenger' | 'spectator';

/**
 * Get user's role in a game by checking game document
 * @param gameId - Game ID to check
 * @param userId - User ID to check role for
 * @returns 'host', 'challenger', 'spectator', or null if game not found
 */
export const getUserRoleInGame = async (
  gameId: string,
  userId: string
): Promise<PlayerRolesType | null> => {
  const game = await Game.findById(gameId).lean();

  if (!game) {
    return null;
  }

  // host and challenger are ObjectIds, need to convert to string for comparison
  const hostId = game.host.toString();
  const challengerId = game.challenger?.toString();

  if (hostId === userId) {
    return 'host';
  }

  if (challengerId === userId) {
    return 'challenger';
  }

  return 'spectator';
};
