import dotenv from "dotenv";
import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import { auth } from "./auth";
import { toNodeHandler } from "better-auth/node";
import cors from "cors";
import { connectToDatabase } from "./src/config/database";
import apiRoutes from "./src/routes/apiRoutes";
import { leaveGame, handleChallengerQuit } from "./src/controllers/gameController";
// Import models to register them with Mongoose
import "./src/models/User";
import "./src/models/Game";

dotenv.config();

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
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

// Connect to MongoDB
connectToDatabase().catch(console.error);

// better auth router for handling auth requests
app.all("/api/auth/*splat", toNodeHandler(auth));

// API routes
app.use("/api", apiRoutes);

io.on("connection", (socket) => {
  console.log("socket connected", socket.id);


  // Extract gameId from auth data and join the room
  const gameId = socket.handshake.auth.gameId;
  const role = socket.handshake.auth.role;
  const user = socket.handshake.auth.user;

  if (gameId) {
    socket.join(gameId);
    console.log(`socket ${socket.id} joined room ${gameId}`);
  } else {
    console.log(`socket ${socket.id} connected without gameId`);
  }

  // don't send player notification for "spectator"
  if (role !== "spectator") {
    console.log(`emitting event player_joined to ${gameId}`)
    socket.to(gameId).emit("player_joined", {
      role: role,
      user: user,
    });
  }

  socket.on("challenger_quit", async () => {
    console.log("challenger_quit event received", socket.id);

    if (role !== "challenger") {
      console.log(`User ${user.id} with role ${role} tried to quit as challenger - ignoring`);
      return;
    }

    const success = await handleChallengerQuit(gameId, user.id);

    if (success) {
      // Notify the host that challenger has quit
      socket.to(gameId).emit("challenger_quit", {
        user: user,
      });

      console.log(`Challenger ${user.id} successfully quit game ${gameId}`);
    } else {
      console.log(`Failed to process challenger quit for user ${user.id} in game ${gameId}`);
    }
  });

  socket.on("disconnect", async () => {
    console.log("socket disconnected", socket.id);


    await leaveGame(gameId, user.id, role);

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
