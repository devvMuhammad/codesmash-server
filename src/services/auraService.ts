import { User } from '../models/User';

/**
 * AURA Point Values (Small & Balanced)
 */
export const AURA_VALUES = {
  WIN_MATCH: 3,           // Award for winning a match
  LOSE_MATCH: -1,         // Penalty for losing a match
  FORFEIT_MATCH: -2,      // Penalty for forfeiting (worse than losing)
  PASS_TEST_CASE: 1,      // Award per newly passed test case
  DRAW: 0                 // No points for draw
} as const;

/**
 * AURA Service
 * Manages user AURA points with simple add/deduct operations
 */
class AuraService {
  /**
   * Add AURA points to a user
   * @param userId - User ID to award points to
   * @param amount - Number of points to add (should be positive)
   * @param reason - Reason for the award (for logging)
   */
  async addAura(userId: string, amount: number, reason: string): Promise<boolean> {
    try {
      if (amount <= 0) {
        console.warn(`[AURA] Attempted to add non-positive amount (${amount}) to user ${userId}`);
        return false;
      }

      const user = await User.findById(userId);
      if (!user) {
        console.error(`[AURA] User ${userId} not found - cannot add ${amount} points`);
        return false;
      }

      const previousAura = user.aura || 0;
      user.aura = previousAura + amount;
      await user.save();

      console.log(`[AURA] ✅ ${userId}: ${previousAura} → ${user.aura} (+${amount}) - ${reason}`);
      return true;
    } catch (error) {
      console.error(`[AURA] Error adding aura to user ${userId}:`, error);
      return false;
    }
  }

  /**
   * Deduct AURA points from a user
   * @param userId - User ID to deduct points from
   * @param amount - Number of points to deduct (should be positive)
   * @param reason - Reason for the deduction (for logging)
   */
  async deductAura(userId: string, amount: number, reason: string): Promise<boolean> {
    try {
      if (amount <= 0) {
        console.warn(`[AURA] Attempted to deduct non-positive amount (${amount}) from user ${userId}`);
        return false;
      }

      const user = await User.findById(userId);
      if (!user) {
        console.error(`[AURA] User ${userId} not found - cannot deduct ${amount} points`);
        return false;
      }

      const previousAura = user.aura || 0;
      // Allow negative aura (user can go into debt)
      user.aura = previousAura - amount;
      await user.save();

      console.log(`[AURA] ⬇️  ${userId}: ${previousAura} → ${user.aura} (-${amount}) - ${reason}`);
      return true;
    } catch (error) {
      console.error(`[AURA] Error deducting aura from user ${userId}:`, error);
      return false;
    }
  }

  /**
   * Update AURA points (generic method for positive or negative delta)
   * @param userId - User ID to update
   * @param delta - Points to add (positive) or deduct (negative)
   * @param reason - Reason for the update (for logging)
   */
  async updateAura(userId: string, delta: number, reason: string): Promise<boolean> {
    if (delta === 0) {
      console.log(`[AURA] No change for user ${userId} - delta is 0`);
      return true;
    }

    if (delta > 0) {
      return this.addAura(userId, delta, reason);
    } else {
      return this.deductAura(userId, Math.abs(delta), reason);
    }
  }

  /**
   * Handle match completion aura updates for both players
   * @param winnerId - User ID of the winner
   * @param loserId - User ID of the loser
   * @param reason - Match completion reason (for logging)
   */
  async handleMatchCompletion(winnerId: string, loserId: string, reason: string): Promise<void> {
    try {
      console.log(`[AURA] Match completed - Winner: ${winnerId}, Loser: ${loserId}`);

      // Award winner
      await this.addAura(winnerId, AURA_VALUES.WIN_MATCH, `Won match: ${reason}`);

      // Deduct from loser
      await this.deductAura(loserId, Math.abs(AURA_VALUES.LOSE_MATCH), `Lost match: ${reason}`);
    } catch (error) {
      console.error('[AURA] Error handling match completion:', error);
      // Don't throw - aura updates should not block game completion
    }
  }

  /**
   * Handle forfeit aura updates
   * @param forfeiterId - User ID who forfeited
   * @param winnerId - User ID who won by forfeit
   */
  async handleForfeit(forfeiterId: string, winnerId: string): Promise<void> {
    try {
      console.log(`[AURA] Forfeit - Forfeiter: ${forfeiterId}, Winner: ${winnerId}`);

      // Penalty for forfeiting
      await this.deductAura(forfeiterId, Math.abs(AURA_VALUES.FORFEIT_MATCH), 'Forfeited match');

      // Award opponent who won by forfeit
      await this.addAura(winnerId, AURA_VALUES.WIN_MATCH, 'Won by opponent forfeit');
    } catch (error) {
      console.error('[AURA] Error handling forfeit:', error);
      // Don't throw - aura updates should not block game completion
    }
  }

  /**
   * Handle test progress improvement
   * @param userId - User ID who improved
   * @param newlyPassedTests - Number of newly passed tests (not total)
   */
  async handleTestProgress(userId: string, newlyPassedTests: number): Promise<void> {
    try {
      if (newlyPassedTests <= 0) {
        return; // No progress, no aura
      }

      const auraGain = newlyPassedTests * AURA_VALUES.PASS_TEST_CASE;
      await this.addAura(
        userId,
        auraGain,
        `Passed ${newlyPassedTests} new test case(s)`
      );
    } catch (error) {
      console.error('[AURA] Error handling test progress:', error);
      // Don't throw - aura updates should not block game progress
    }
  }
}

// Export singleton instance
export const auraService = new AuraService();
