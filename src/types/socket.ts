/**
 * Socket.IO handshake authentication types
 * These types match the client-side data sent during socket connection
 */

/**
 * User data from Better-Auth session
 * Matches the shape of Session["user"] from better-auth/react
 */
export interface SocketUser {
  id: string
  name: string
  email: string
  emailVerified: boolean
  image: string | null
  createdAt: Date
  updatedAt: Date
}

/**
 * Player role types in a game
 */
export type PlayerRole = 'host' | 'challenger' | 'spectator'

/**
 * Socket handshake authentication data
 * This is the data structure sent from the client during socket connection
 */
export interface SocketHandshakeAuth {
  gameId: string
  role: PlayerRole
  user: SocketUser
}

/**
 * Type for the socket.handshake.auth object
 */
export type SocketAuth = SocketHandshakeAuth

/**
 * WebSocket event payloads
 */
export interface PlayerJoinedPayload {
  role: PlayerRole
  user: SocketUser
}

export interface PlayerDisconnectedPayload {
  role: PlayerRole
  user: SocketUser
}

export interface ChallengerQuitPayload {
  user: SocketUser
}

export interface BattleStartedPayload {
  user: SocketUser
}

export interface GameInProgressPayload {
  user: SocketUser
  startedAt: Date
  timeLimit: number
}

export interface CodeUpdatePayload {
  code: string
}

export interface OpponentCodeUpdatePayload {
  code: string
  role: PlayerRole
}

export interface TestProgressUpdatePayload {
  role: PlayerRole
  passedTests: number
  totalTests: number
  previousPassed: number
  allTestsPassed: boolean
}

export interface GameFinishedPayload {
  result: {
    reason: 'completed' | 'forfeit' | 'time_up'
    winner?: string
    message: string
  }
  gameStatus: string
}

export interface GameTimeExpiredPayload {
  gameId: string
  result: {
    reason: 'time_up'
    winner?: string
    message: string
  }
  completedAt: Date
  status: string
}

export interface TimerSyncPayload {
  remaining: number
  serverTime: number
}