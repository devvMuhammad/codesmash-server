# CLAUDE.md - CodeSmash Server

This file provides guidance to Claude Code when working with the CodeSmash backend server.

## Server Overview

CodeSmash server is an **Express.js application** with **Socket.IO** for real-time features, using **MongoDB** with **Mongoose ODM** and **Better-Auth** for authentication.

**Runtime**: Bun (preferred over Node.js)
**Port**: 3001 (default)
**Database**: MongoDB with Mongoose ODM
**Authentication**: Better-Auth
**Real-time**: Socket.IO

## Development Commands (Bun)

Default to using Bun instead of Node.js for Server Side:

- `bun dev` - Start development server with hot reload
- `bun start` - Start production server
- `bun install` - Install dependencies
- `bun test` - Run tests
- `bun run <script>` - Run package.json scripts

## API Documentation

### Base URL Structure
```
http://localhost:3001/api/
```

### Authentication Endpoints
**Handled by Better-Auth** at `/api/auth/*`
- Session management
- User registration/login
- OAuth providers (Google, etc.)

### Game Endpoints

#### Create Game
```http
POST /api/games
Content-Type: application/json
```

**Request Body**:
```typescript
{
  hostId: string        // User ID of game creator
  difficulty: "easy" | "medium" | "hard"
  timeLimit: number     // In seconds
  expiresAt: Date       // When game invitation expires
}
```

**Response** (201 Created):
```typescript
{
  gameId: string        // MongoDB ObjectId as string
  inviteLink: string    // Full URL for joining game
  inviteCode: string    // Short code for joining game
}
```

**Error Responses**:
- `400 Bad Request` - Invalid request body
- `500 Internal Server Error` - Database/server error

#### Get Game Details
```http
GET /api/games/:gameId
```

**Parameters**:
- `gameId` - MongoDB ObjectId string

**Response** (200 OK):
```typescript
{
  _id: string
  hostId: string
  players: string[]           // Array of user IDs
  spectators: string[]        // Array of user IDs
  inviteCode: string
  spectatorCode: string
  status: "waiting" | "in_progress" | "completed" | "cancelled"
  problemId: string
  problem?: {                 // Populated problem data (currently mocked)
    id: string
    title: string
    description: string
    difficulty: "easy" | "medium" | "hard"
    examples: Array<{
      input: string
      output: string
      explanation?: string
    }>
    constraints: string[]
    functionSignature: string
  }
  createdAt: string           // ISO date string
  updatedAt: string           // ISO date string
  expiresAt: string           // ISO date string
  timeLimit: number           // In seconds
  difficulty: "easy" | "medium" | "hard"
  startedAt?: string          // ISO date string (when game started)
  completedAt?: string        // ISO date string (when game ended)
}
```

**Error Responses**:
- `400 Bad Request` - Invalid gameId format
- `404 Not Found` - Game not found
- `500 Internal Server Error` - Database/server error

#### Get Live Battles
```http
GET /api/games/live
```

**Description**: Fetches ongoing battles (games with `status=IN_PROGRESS`), limited to 20 most recent.

**Response** (200 OK):
```typescript
Array<{
  _id: string
  host: {
    _id: string
    name?: string
    email?: string
    image?: string
  }
  challenger: {
    _id: string
    name?: string
    email?: string
    image?: string
  }
  problem: {
    _id: string
    title: string
    difficulty: "easy" | "medium" | "hard"
  }
  status: "in_progress"
  timeLimit: number              // In seconds
  difficulty: "easy" | "medium" | "hard"
  startedAt?: string             // ISO date string
  remainingSeconds: number       // Calculated remaining time
  createdAt: string              // ISO date string
  updatedAt: string              // ISO date string
}>
```

**How It Works**:
1. Queries database for games with `status=IN_PROGRESS`
2. Populates `host`, `challenger`, and `problem` fields
3. Sorts by `startedAt` descending (newest first)
4. Limits to 20 results
5. Calculates `remainingSeconds` for each game based on `timeLimit` and `startedAt`

**Error Responses**:
- `500 Internal Server Error` - Database/server error

#### Get Open Challenges
```http
GET /api/games/open
```

**Description**: Fetches open challenges (games with `status=WAITING` and no challenger), limited to 20 most recent.

**Response** (200 OK):
```typescript
Array<{
  _id: string
  host: {
    _id: string
    name?: string
    email?: string
    image?: string
  }
  problem?: {
    _id: string
    title: string
    difficulty: "easy" | "medium" | "hard"
  }
  inviteCode: string
  status: "waiting"
  timeLimit: number              // In seconds
  difficulty: "easy" | "medium" | "hard"
  createdAt: string              // ISO date string
  updatedAt: string              // ISO date string
}>
```

**How It Works**:
1. Queries database for games with `status=WAITING` and no `challenger`
2. Populates `host` and `problem` fields
3. Sorts by `createdAt` descending (newest first)
4. Limits to 20 results

**Error Responses**:
- `500 Internal Server Error` - Database/server error

### User Endpoints

#### Get User Challenges
```http
GET /api/users/:userId/challenges
```

**Parameters**:
- `userId` - User ID string

**Response** (200 OK):
```typescript
Array<{
  _id: string
  hostId: string
  players: string[]
  spectators: string[]
  inviteCode: string
  spectatorCode: string
  status: "waiting" | "in_progress" | "completed" | "cancelled"
  problemId: string
  createdAt: string
  updatedAt: string
  expiresAt: string
  timeLimit: number
  difficulty: "easy" | "medium" | "hard"
}>
```

**Error Responses**:
- `400 Bad Request` - Missing userId
- `500 Internal Server Error` - Database/server error

### Problem Endpoints

#### Submit Code for Problem
```http
POST /api/problems/:problemId/submit
Content-Type: application/json
```

**Parameters**:
- `problemId` - MongoDB ObjectId string

**Request Body**:
```typescript
{
  code: string                    // User's submitted code
  language: "javascript" | "python" | "java" | "cpp"
  userId: string                  // User ID who is submitting
  gameId?: string                 // Optional game context
}
```

**Response** (200 OK):
```typescript
{
  success: boolean
  totalTests: number              // Total number of test cases
  passedTests: number             // Number of passed test cases
  failedTests: number             // Number of failed test cases
  executionTime: string           // Execution time (e.g., "0.024")
  memory: number                  // Memory used in KB
  testResults: [
    {
      testCase: number            // Test case number (1-indexed)
      input: string               // Test case input description
      expected: string            // Expected output
      actual: string              // Actual output from user code
      status: "PASS" | "FAIL" | "ERROR"
      error?: string              // Error message if status is ERROR
    }
  ]
  allTestsPassed: boolean         // True if all tests passed
  compileError?: string           // Compilation error if any
  runtimeError?: string           // Runtime error if any
}
```

**How It Works**:
1. User submits code with selected language
2. Server fetches problem from database (with testCases and correctOutput)
3. Code is executed via Judge0 API with testCases as stdin (HackerRank style)
4. User's code reads from stdin, processes, and writes to stdout line by line
5. Server compares stdout with correctOutput line by line
6. Returns detailed test results with pass/fail status for each test case

**Judge0 Integration**:
- Uses Judge0 CE via RapidAPI
- Submission with `wait=true` for immediate results
- Language IDs: JavaScript (63), Python (71), Java (62), C++ (54)
- Test cases provided as stdin, output compared line by line

**Error Responses**:
- `400 Bad Request` - Missing required fields or invalid problemId/language
- `404 Not Found` - Problem not found
- `500 Internal Server Error` - Database/Judge0 API error

#### Run Code with Sample Test Cases
```http
POST /api/problems/:problemId/run
Content-Type: application/json
```

**Parameters**:
- `problemId` - MongoDB ObjectId string

**Request Body**:
```typescript
{
  code: string                    // User's code to run
  language: "javascript" | "python" | "java" | "cpp"
  gameId?: string                 // Optional game context
}
```

**Response** (200 OK):
```typescript
{
  success: boolean                // True if all sample tests passed
  stdout: string                  // Full stdout output from code execution
  sampleTestResults: [
    {
      testCase: number            // Sample test case number (1-indexed)
      input: string               // Sample test input description
      expectedOutput: string      // Expected output for this sample
      actualOutput: string        // Actual output from user code
      passed: boolean             // True if this sample test passed
    }
  ]
  executionTime: string           // Execution time (e.g., "0.024")
  memory: number                  // Memory used in KB
  compileError?: string           // Compilation error if any
  runtimeError?: string           // Runtime error if any
  statusDescription?: string      // Human-readable status description
}
```

**How It Works**:
1. User runs code with selected language for quick testing
2. Server fetches problem from database (with sampleTestCases and sampleTestCasesOutput)
3. Code is executed via Judge0 API with **sample** testCases only (faster than full submit)
4. User's code reads from stdin, processes, and writes to stdout
5. Server compares stdout with sampleTestCasesOutput line by line
6. Returns full stdout + sample test results for debugging

**Key Differences from /submit**:
- Uses `sampleTestCases` (2-3 tests) instead of full `testCases` (10-20+ tests)
- Returns full stdout for debugging
- Faster execution (fewer test cases)
- Does NOT update game state or determine winner
- Intended for testing/debugging before final submission

**Error Responses**:
- `400 Bad Request` - Missing required fields or invalid problemId/language
- `404 Not Found` - Problem not found
- `500 Internal Server Error` - Database/Judge0 API error

## WebSocket Events (Socket.IO)

### Connection
```typescript
// Client connects with gameId in auth
const socket = io('http://localhost:3001', {
  auth: { gameId: 'game_id_here' }
})
```

**Server Behavior**:
- Automatically joins client to game room based on `gameId` in handshake auth
- Logs connection and room joining

### Planned Events (To Be Implemented)
```typescript
// Game state events
'game:player-joined'     // Player joins game
'game:player-left'       // Player leaves game
'game:state-changed'     // Game status change

// Code collaboration events
'code:change'            // Real-time code changes
'code:cursor-move'       // Cursor position updates
'code:typing-start'      // Typing indicator start
'code:typing-stop'       // Typing indicator stop

// Game action events
'game:submit-solution'   // Player submits code
'game:run-code'         // Player runs/tests code
'game:quit'          // Player forfeits game
```

## Project Structure

```
server/
├── index.ts                 # Main server entry point
├── auth.ts                  # Better-Auth configuration
├── package.json             # Dependencies and scripts
├── scripts/
│   └── seedTwoSum.ts       # Seed script for Two Sum problem
├── src/
│   ├── config/
│   │   └── database.ts      # MongoDB connection setup
│   ├── controllers/         # Business logic
│   │   ├── gameController.ts    # Game CRUD operations
│   │   ├── userController.ts    # User operations
│   │   └── problemController.ts # Problem submission and testing
│   ├── models/             # Mongoose schemas
│   │   ├── Game.ts         # Game model definition
│   │   └── Problem.ts      # Problem model definition
│   ├── routes/             # Express route definitions
│   │   ├── apiRoutes.ts    # Main API router
│   │   ├── gameRoutes.ts   # Game-specific routes
│   │   ├── userRoutes.ts   # User-specific routes
│   │   └── problemRoutes.ts # Problem-specific routes
│   ├── services/           # External service integrations
│   │   ├── codeStorage.ts  # In-memory code storage
│   │   └── judge0Service.ts # Judge0 API integration
│   ├── types/              # TypeScript type definitions
│   │   ├── game.ts         # Game-related interfaces and enums
│   │   └── problem.ts      # Problem-related interfaces and enums
│   └── utils/              # Helper functions
│       └── linkGenerator.ts # Invite link/code generation
└── CLAUDE.md               # This file
```

## Database Schema (MongoDB + Mongoose)

### Game Collection
```typescript
{
  _id: ObjectId                    // Auto-generated MongoDB ID
  hostId: String (required)        # User ID who created the game
  players: [String]                # Array of user IDs in game
  spectators: [String]             # Array of user IDs watching
  inviteCode: String (required, unique)     # 8-char invite code
  spectatorCode: String (required, unique)  # 8-char spectator code
  status: String (enum)            # waiting|in_progress|completed|cancelled
  problemId: String (required)     # Reference to problem (currently mock)
  createdAt: Date (auto)           # Creation timestamp
  updatedAt: Date (auto)           # Last update timestamp
  expiresAt: Date (required)       # When invite expires
  timeLimit: Number (required)     # Game duration in seconds
  difficulty: String (enum)        # easy|medium|hard
  startedAt: Date (optional)       # When game began
  completedAt: Date (optional)     # When game ended
}
```

**Indexes**:
- `inviteCode` - Unique index for fast lookups
- `spectatorCode` - Unique index for fast lookups
- `hostId` - Index for user challenge queries

### Problem Collection
```typescript
{
  _id: ObjectId                    // Auto-generated MongoDB ID
  title: String (required)         // Problem title (e.g., "Two Sum")
  description: String (required)   // Full problem description with examples
  difficulty: String (enum)        // easy|medium|hard
  testCases: String (required)     // All test cases in line-by-line format (stdin)
  correctOutput: String (required) // Expected outputs for all tests line by line
  sampleTestCases: String (required, default: "")     // Sample test cases (2-3) for quick testing
  sampleTestCasesOutput: String (required, default: "") // Expected outputs for sample tests
  initialCodes: {                  // Starter code for each language
    python: String (required)      // Python starter code (HackerRank style)
    javascript: String (required)  // JavaScript starter code
    java: String (required)        // Java starter code
    cpp: String (required)         // C++ starter code
  }
  createdAt: Date (auto)           // Creation timestamp
  updatedAt: Date (auto)           // Last update timestamp
}
```

**Test Case Format** (HackerRank style):
```
4              # First line: array length
2 7 11 15      # Second line: array elements
9              # Third line: target
3              # Next test case starts...
3 2 4
6
```

**Expected Output Format** (line by line):
```
0 1            # Output for test case 1
1 2            # Output for test case 2
0 1            # Output for test case 3
```

**Indexes**:
- `title` - Index for problem lookups

## Environment Configuration

```env
# Server Configuration
PORT=3001
CLIENT_BASE_URL=http://localhost:3000

# Database
MONGODB_URI=mongodb://localhost:27017/codesmash

# Authentication (Better-Auth)
BETTER_AUTH_SECRET=your-secret-key-here
GOOGLE_CLIENT_ID=your-google-oauth-id
GOOGLE_CLIENT_SECRET=your-google-oauth-secret

# Judge0 API (for code execution)
JUDGE0_URL=https://judge0-ce.p.rapidapi.com
RAPIDAPI_KEY=your-rapidapi-key-here
RAPIDAPI_HOST=judge0-ce.p.rapidapi.com

# Redis Configuration (for game timers and job queues)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=  # Optional - only if Redis requires authentication
```

## Game Timer System (BullMQ + Redis)

### Overview

The game timer system uses **BullMQ** (modern job queue) with **Redis** for precise, distributed game time expiration. When a game starts, a delayed job is scheduled to automatically end the game when the time limit is reached.

### Architecture Components

1. **Redis**: Persistent job queue storage
2. **BullMQ Queue**: Manages delayed timer jobs
3. **BullMQ Worker**: Processes expired game jobs
4. **Game Timer Service**: High-level API for timer management

### File Structure

```
src/
├── config/
│   └── redis.ts              # Redis connection configuration
├── services/
│   └── gameTimerQueue.ts     # BullMQ queue and worker implementation
└── controllers/
    └── gameController.ts     # Updated with startedAt/completedAt fields
```

### Timer Service API

```typescript
// src/services/gameTimerQueue.ts

class GameTimerService {
  // Initialize worker (called on server startup)
  initializeWorker(io: Server): void

  // Start a timer for a game
  async startTimer(gameId: string, durationSeconds: number, startedAt: Date): Promise<void>

  // Clear a timer (game ended early)
  async clearTimer(gameId: string): Promise<boolean>

  // Resume active timers after server restart
  async resumeActiveTimers(io: Server): Promise<void>

  // Get remaining time for a game
  async getRemainingTime(gameId: string): Promise<number>

  // Get queue statistics
  async getQueueStats(): Promise<QueueStats>

  // Shutdown (cleanup on server shutdown)
  async shutdown(): Promise<void>
}
```

### Timer Lifecycle

```
1. Game Created (status: waiting)
   └─ timeLimit stored in database (e.g., 1800 seconds)

2. Host Starts Battle (status: ready_to_start)
   └─ No timer yet (waiting for challenger)

3. Challenger Ready (status: in_progress)
   ├─ startedAt = new Date()
   ├─ gameTimerService.startTimer(gameId, timeLimit, startedAt)
   └─ BullMQ job scheduled with delay = timeLimit * 1000

4A. Time Expires (status: completed)
   ├─ Worker processes expired job
   ├─ Update DB: status=completed, result.reason=TIME_UP
   ├─ Emit 'game_time_expired' to clients
   └─ Remove job from queue

4B. Player Forfeits (status: completed)
   ├─ gameTimerService.clearTimer(gameId)
   ├─ Job removed from queue
   └─ Game ends immediately

4C. Player Submits Solution (status: completed)
   ├─ gameTimerService.clearTimer(gameId)
   ├─ Job removed from queue
   └─ Winner determined by test results
```

### WebSocket Integration

#### New Events

**Server → Client:**
```typescript
"game_time_expired" {
  gameId: string
  result: {
    reason: "time_up"
    winner: string
    message: string
  }
  completedAt: Date
  status: "completed"
}

"timer_sync" {  // Response to request_time_remaining
  remaining: number    // Seconds remaining
  serverTime: number   // Server timestamp for drift calculation
}
```

**Client → Server:**
```typescript
"request_time_remaining"  // Client requests current time remaining
```

#### Event Handlers (index.ts)

```typescript
// When challenger marks ready - start timer
socket.on("challenger_ready", async () => {
  const result = await markChallengerReady(gameId, user.id);
  if (result.success && result.game) {
    // Start timer
    await gameTimerService.startTimer(
      gameId,
      result.game.timeLimit,
      result.game.startedAt
    );

    io.to(gameId).emit("game_in_progress", {
      user,
      startedAt: result.game.startedAt,
      timeLimit: result.game.timeLimit
    });
  }
});

// When player forfeits - clear timer
socket.on("forfeit_game", async () => {
  const forfeitResult = await forfeitGame(gameId, user.id, role);
  if (forfeitResult.success) {
    // Clear timer (game ended early)
    await gameTimerService.clearTimer(gameId);

    io.to(gameId).emit("game_finished", {
      result: forfeitResult.result,
      gameStatus: "completed"
    });
  }
});

// Client requests time sync (optional, prevents drift)
socket.on("request_time_remaining", async () => {
  const remaining = await gameTimerService.getRemainingTime(gameId);
  socket.emit("timer_sync", {
    remaining,
    serverTime: Date.now()
  });
});
```

### Server Startup Integration

```typescript
// index.ts

import { gameTimerService } from './src/services/gameTimerQueue';
import redisClient from './src/config/redis';

// After database connection
connectToDatabase()
  .then(async () => {
    // Initialize BullMQ worker
    gameTimerService.initializeWorker(io);

    // Resume active timers after server restart
    await gameTimerService.resumeActiveTimers(io);
  })
  .catch(console.error);

// Graceful shutdown
const shutdown = async () => {
  httpServer.close();
  await gameTimerService.shutdown();  // Close worker and queue
  redisClient.disconnect();           // Close Redis connection
  process.exit(0);
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
```

### Database Schema Updates

```typescript
// Game model now includes timer fields
{
  startedAt: Date (optional)    // When game moved to IN_PROGRESS
  completedAt: Date (optional)  // When game ended (time_up, forfeit, or completed)
}
```

### BullMQ Configuration

```typescript
// Queue options
{
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3,              // Retry 3 times on failure
    backoff: {
      type: 'exponential',
      delay: 1000
    },
    removeOnComplete: true,   // Clean up completed jobs
    removeOnFail: false       // Keep failed jobs for debugging
  }
}

// Worker options
{
  connection: redisConnection,
  concurrency: 10  // Process up to 10 jobs concurrently
}
```

### Server Restart Resilience

When the server restarts, `resumeActiveTimers()` automatically:

1. Queries database for all games with `status=IN_PROGRESS` and `startedAt` exists
2. Calculates remaining time: `timeLimit - (now - startedAt)`
3. If remaining > 0: Reschedule job with remaining time
4. If remaining <= 0: End game immediately

This ensures **zero timer loss** even during server restarts or crashes.

### Performance Characteristics

- **Memory**: ~120 bytes per active timer
- **CPU**: O(log n) for queue operations (min-heap)
- **Scalability**: Supports 10k+ concurrent games on single server
- **Precision**: ±1 second accuracy (configurable)
- **Persistence**: All jobs survive server restarts (stored in Redis)

### Error Handling

- **Redis Connection Failure**: Worker will retry with exponential backoff
- **Job Processing Failure**: Automatic retry (3 attempts with backoff)
- **Database Update Failure**: Job marked as failed, kept for debugging
- **WebSocket Emit Failure**: Logged but does not block job completion

### Development vs Production

**Development (local):**
- Redis running on localhost:6379
- Single server instance
- No password required

**Production (recommended):**
- Managed Redis (AWS ElastiCache, Redis Cloud, etc.)
- Multiple server instances sharing same Redis
- Enable Redis password authentication
- Use Redis Sentinel for high availability

### Multi-Server Scaling (Future)

BullMQ's architecture supports horizontal scaling:

```
          ┌─────────────┐
          │    Redis    │  (shared job queue)
          └─────────────┘
               │
     ┌─────────┼─────────┐
     │         │         │
┌────▼───┐ ┌──▼────┐ ┌──▼────┐
│Server 1│ │Server 2│ │Server 3│
│Worker 1│ │Worker 2│ │Worker 3│
└────────┘ └────────┘ └────────┘
```

All workers pull from the same Redis queue, ensuring:
- Only one worker processes each job
- Timers survive individual server crashes
- Load distributed across workers

## Client Integration

### Frontend Connection
The **Next.js client** at `../client/` integrates with this server via:

1. **HTTP API Calls**: Server Components fetch initial data
2. **WebSocket Connection**: Client Components for real-time features
3. **Type Safety**: Shared TypeScript interfaces and Zod validation

### API Client Functions (in client)
```typescript
// client/lib/api/game.ts
async function getGameById(gameId: string): Promise<GameData>
async function createGame(data: CreateGameFormData): Promise<CreateGameResponse>
async function getUserChallenges(userId: string): Promise<UserChallenge[]>
```

## Development Workflow

### Adding New API Endpoints

1. **Create Controller Function**
   ```typescript
   // src/controllers/gameController.ts
   export const newEndpoint = async (req: Request, res: Response) => {
     // Implementation
   }
   ```

2. **Add Route**
   ```typescript
   // src/routes/gameRoutes.ts
   router.get('/new-endpoint', newEndpoint)
   ```

3. **Update Types**
   ```typescript
   // src/types/game.ts
   export interface NewEndpointResponse {
     // Response interface
   }
   ```

4. **Update Documentation**
   - Update this file (server/CLAUDE.md)
   - Update main project docs (../CLAUDE.md)
   - Update client docs (../client/CLAUDE.md)

### Adding WebSocket Events

1. **Add Event Handler**
   ```typescript
   // index.ts - in io.on('connection') handler
   socket.on('new-event', (data) => {
     // Handle event
     socket.to(gameId).emit('response-event', response)
   })
   ```

2. **Update Client Context**
   ```typescript
   // ../client/context/websocket-context.tsx
   // Add event handling
   ```

## Error Handling

### HTTP Errors
- **400 Bad Request** - Invalid input, malformed requests
- **404 Not Found** - Resource not found (game, user)
- **500 Internal Server Error** - Database errors, unexpected failures

### WebSocket Errors
- Connection failures handled by Socket.IO automatic reconnection
- Invalid gameId results in connection without room joining

## Security Considerations

### API Security
- **CORS**: Restricted to CLIENT_BASE_URL origin only
- **Input Validation**: MongoDB ObjectId validation for route parameters
- **Authentication**: Better-Auth handles session management
- **Data Sanitization**: Mongoose schema validation

### WebSocket Security
- **Room Isolation**: Users only join rooms they have access to
- **Auth Validation**: gameId verified in WebSocket handshake
- **Rate Limiting**: To be implemented for WebSocket events

## Performance Optimizations

### Database
- **Lean Queries**: Using `.lean()` for read-only operations
- **Indexes**: Proper indexing on frequently queried fields
- **Connection Pooling**: Mongoose handles MongoDB connection pool

### Server
- **Express Middleware**: Minimal middleware stack for performance
- **JSON Parsing**: Limited to necessary routes only
- **Logging**: Simple console logging (to be enhanced with structured logging)

---

## Documentation Update Rule

**MANDATORY**: After any server changes, update documentation in this sequence:

1. **This file** (`server/CLAUDE.md`) - Server-specific details
2. **Main docs** (`../CLAUDE.md`) - Overall architecture changes
3. **Client docs** (`../client/CLAUDE.md`) - Integration impact

**Required for**:
- New API endpoints or route modifications
- Database schema changes
- WebSocket event additions/changes
- Authentication flow changes
- Environment variable changes
- Error response format changes