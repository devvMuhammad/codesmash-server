import dotenv from "dotenv";
import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import { auth } from "./auth";
import { toNodeHandler } from "better-auth/node";
import cors from "cors";
import { connectToDatabase } from "./src/config/database";
import apiRoutes from "./src/routes/apiRoutes";
import { leaveGame, handleChallengerQuit, startBattle, markChallengerReady, forfeitGame } from "./src/controllers/gameController";
import { codeStorage } from "./src/services/codeStorage";
import { gameTimerService } from "./src/services/gameTimerQueue";
import redisClient from "./src/config/redis";
import type {
  SocketHandshakeAuth,
  CodeUpdatePayload,
  PlayerJoinedPayload,
  ChallengerQuitPayload,
  BattleStartedPayload,
  GameInProgressPayload,
  OpponentCodeUpdatePayload,
  GameFinishedPayload
} from "./src/types/socket";
// Import models to register them with Mongoose
import "./src/models/User";
import "./src/models/Game";
import "./src/models/Problem";

dotenv.config({ path: process.env.NODE_ENV === 'production' ? '.env.prod' : '.env.dev' });

const port = process.env.PORT;
if (!port) {
  throw new Error("PORT environment variable is not set");
}

const PORT = parseInt(port, 10);

const clientBaseUrl = process.env.CLIENT_BASE_URL;
if (!clientBaseUrl) {
  throw new Error("CLIENT_BASE_URL environment variable is not set");
}

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: clientBaseUrl,
  }
});

// Export io for use in controllers
export { io };

// setup cors
app.use(
  cors({
    origin: clientBaseUrl, // Replace with your frontend's origin
    methods: ["GET", "POST", "PUT", "DELETE"], // Specify allowed HTTP methods
    credentials: true, // Allow credentials (cookies, authorization headers, etc.)
  }),
);
app.use(express.json());

// simple logger in middleware
app.use((req, _, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

// Connect to MongoDB and initialize services
connectToDatabase()
  .then(async () => {
    console.log('Database connected, initializing services...');

    // Initialize game timer worker
    gameTimerService.initializeWorker(io);

    // Resume active game timers after server restart
    await gameTimerService.resumeActiveTimers(io);
  })
  .catch(console.error);

// better auth router for handling auth requests
app.all("/api/auth/*splat", toNodeHandler(auth));

// API routes
app.use("/api", apiRoutes);

io.on("connection", (socket) => {
  console.log("socket connected", socket.id);

  // Extract auth data from socket handshake with proper typing
  const { gameId, role, user } = socket.handshake.auth as SocketHandshakeAuth;


  if (gameId) {
    socket.join(gameId);
    console.log(`socket ${socket.id} joined room ${gameId}`);
  } else {
    console.log(`socket ${socket.id} connected without gameId`);
  }

  // don't send player notification for "spectator"
  if (role !== "spectator") {
    console.log(`emitting event player_joined to ${gameId}`)
    const payload: PlayerJoinedPayload = {
      role,
      user,
    };
    socket.to(gameId).emit("player_joined", payload);
  }

  // this is a special event for the challenger to quit the game BEFORE THE GAME STARTS
  socket.on("challenger_quit", async () => {
    console.log("challenger_quit event received", socket.id);

    if (role !== "challenger") {
      console.log(`User ${user.id} with role ${role} tried to quit as challenger - ignoring`);
      return;
    }

    const success = await handleChallengerQuit(gameId, user.id);

    if (success) {
      // Notify the host that challenger has quit
      const payload: ChallengerQuitPayload = {
        user,
      };
      socket.to(gameId).emit("challenger_quit", payload);

      console.log(`Challenger ${user.id} successfully quit game ${gameId}`);
    } else {
      console.log(`Failed to process challenger quit for user ${user.id} in game ${gameId}`);
    }
  });

  socket.on("start_battle", async () => {
    console.log("start_battle event received", socket.id);

    if (role !== "host") {
      console.log(`User ${user.id} with role ${role} tried to start battle - ignoring`);
      return;
    }

    const success = await startBattle(gameId, user.id);

    if (success) {
      // Notify the challenger that host has started the battle
      const payload: BattleStartedPayload = {
        user,
      };
      io.to(gameId).emit("battle_started", payload);

      console.log(`Host ${user.id} successfully started battle for game ${gameId}`);
    } else {
      console.log(`Failed to start battle for user ${user.id} in game ${gameId}`);
    }
  });

  socket.on("challenger_ready", async () => {
    console.log("challenger_ready event received", socket.id);

    if (role !== "challenger") {
      console.log(`User ${user.id} with role ${role} tried to mark ready - ignoring`);
      return;
    }

    const result = await markChallengerReady(gameId, user.id);

    if (result.success && result.game) {
      // Start the game timer
      await gameTimerService.startTimer(
        gameId,
        result.game.timeLimit,
        result.game.startedAt
      );

      // Notify both players that game is now in progress
      const payload: GameInProgressPayload = {
        user,
        startedAt: result.game.startedAt,
        timeLimit: result.game.timeLimit
      };
      io.to(gameId).emit("game_in_progress", payload);

      console.log(`Challenger ${user.id} marked ready - game ${gameId} is now in progress, timer started`);
    } else {
      console.log(`Failed to mark challenger ready for user ${user.id} in game ${gameId}`);
    }
  });

  socket.on("code_update", (data: CodeUpdatePayload) => {
    console.log("code_update event received", socket.id, "role:", role);

    if (role !== "host" && role !== "challenger") {
      console.log(`User ${user.id} with role ${role} tried to update code - ignoring`);
      return;
    }

    const { code } = data;

    // Update the player's code using the service
    codeStorage.updatePlayerCode(gameId, role, code);

    // Broadcast to opponent
    const payload: OpponentCodeUpdatePayload = { code, role };
    socket.to(gameId).emit("opponent_code_update", payload);
    console.log(`Code updated for ${role} in game ${gameId}, broadcasted to opponent`);
  });

  socket.on("forfeit_game", async () => {
    console.log("forfeit_game event received", socket.id, "role:", role);

    if (role !== "host" && role !== "challenger") {
      console.log(`User ${user.id} with role ${role} tried to forfeit - ignoring`);
      return;
    }

    const forfeitResult = await forfeitGame(gameId, user.id, role);

    if (forfeitResult.success && forfeitResult.result) {
      // Clear the game timer (game ended early via forfeit)
      await gameTimerService.clearTimer(gameId);

      // Notify both players that game has finished
      const payload: GameFinishedPayload = {
        result: forfeitResult.result,
        gameStatus: "completed"
      };
      io.to(gameId).emit("game_finished", payload);

      console.log(`User ${user.id} (${role}) successfully forfeited game ${gameId}, timer cleared`);
    } else {
      console.log(`Failed to forfeit game for user ${user.id} (${role}) in game ${gameId}`);
    }
  });

  socket.on("disconnect", async () => {
    console.log("socket disconnected", socket.id);


    await leaveGame(gameId, user?.id, role);

    socket.to(gameId).emit("player_disconnected", {
      role: role,
      user: user,
    });

    socket.leave(gameId);
    console.log(`socket ${socket.id} left room ${gameId}`);
  })
});

app.get("/", (req, res) => {
  res.status(200).json({
    message: "sybau" + req.ip,
  });
});

httpServer.listen(PORT, () => {
  console.log("listening to port", PORT);
});

// Graceful shutdown
const shutdown = async () => {
  console.log('\nShutting down gracefully...');

  // Close HTTP server
  httpServer.close(() => {
    console.log('HTTP server closed');
  });

  // Shutdown game timer service
  await gameTimerService.shutdown();

  // Close Redis connection
  redisClient.disconnect();
  console.log('Redis connection closed');

  console.log('Shutdown complete');
  process.exit(0);
};

// Handle shutdown signals
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
