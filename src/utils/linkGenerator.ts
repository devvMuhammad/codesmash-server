import { randomBytes } from 'crypto';

const clientBaseUrl = process.env.CLIENT_BASE_URL;
if (!clientBaseUrl) {
  throw new Error("CLIENT_BASE_URL environment variable is not set");
}

export const generateUniqueCode = (length: number = 8): string => {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';

  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    result += characters[randomIndex];
  }

  return result;
};

export const generateInviteLink = (inviteCode: string, battleId: string, baseUrl?: string): string => {
  const base = baseUrl || clientBaseUrl;
  return `${base}/battle/${battleId}?inviteCode=${inviteCode}`;
};

export const generateSpectatorLink = (spectatorCode: string, baseUrl?: string): string => {
  const base = baseUrl || clientBaseUrl;
  return `${base}/spectate/${spectatorCode}`;
};