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
  testCases: String (required)     // Test cases in line-by-line format (stdin)
  correctOutput: String (required) // Expected outputs line by line
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
```

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