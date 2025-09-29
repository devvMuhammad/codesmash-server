interface GameCodeData {
  hostCode: string;
  challengerCode: string;
  lastUpdated: Date;
}

class CodeStorageService {
  private gameCodeStorage = new Map<string, GameCodeData>();

  updatePlayerCode(gameId: string, role: 'host' | 'challenger', code: string): void {
    const gameCode = this.gameCodeStorage.get(gameId) || {
      hostCode: "",
      challengerCode: "",
      lastUpdated: new Date()
    };

    if (role === "host") {
      gameCode.hostCode = code;
    } else if (role === "challenger") {
      gameCode.challengerCode = code;
    }

    gameCode.lastUpdated = new Date();
    this.gameCodeStorage.set(gameId, gameCode);
  }

  getGameCodes(gameId: string): { hostCode: string; challengerCode: string } | null {
    const gameCode = this.gameCodeStorage.get(gameId);
    if (!gameCode) return null;

    return {
      hostCode: gameCode.hostCode,
      challengerCode: gameCode.challengerCode
    };
  }

  initializeGameCodes(gameId: string, starterCode: string): void {
    if (!this.gameCodeStorage.has(gameId)) {
      this.gameCodeStorage.set(gameId, {
        hostCode: starterCode,
        challengerCode: starterCode,
        lastUpdated: new Date()
      });
    }
  }

  cleanupGameCodes(gameId: string): void {
    this.gameCodeStorage.delete(gameId);
  }

  getAllGames(): string[] {
    return Array.from(this.gameCodeStorage.keys());
  }
}

// Export singleton instance
export const codeStorage = new CodeStorageService();