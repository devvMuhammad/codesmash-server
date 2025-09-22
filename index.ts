import dotenv from "dotenv";
import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import { auth } from "./auth";
import { toNodeHandler } from "better-auth/node";
import cors from "cors";
import { connectToDatabase } from "./src/config/database";
import gameRoutes from "./src/routes/gameRoutes";

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
const io = new Server(httpServer, { "path": "/ws" })

// setup cors
app.use(
  cors({
    origin: clientBaseUrl, // Replace with your frontend's origin
    methods: ["GET", "POST", "PUT", "DELETE"], // Specify allowed HTTP methods
    credentials: true, // Allow credentials (cookies, authorization headers, etc.)
  })
);
app.use(express.json());

// simple logger in middleware
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
})

// Connect to MongoDB
connectToDatabase().catch(console.error);

// better auth router for handling auth requests
app.all("/api/auth/*splat", toNodeHandler(auth));

// API routes
app.use("/api", gameRoutes);

io.on("connection", (socket) => {
  console.log(socket);
  socket.on("connection", (test) => {
    console.log("sheep")
  })
  // socket.on
})

app.get("/", (req, res) => {
  res.status(200).json({
    message: "sybau" + req.ip
  })
})

httpServer.listen(PORT, () => {
  console.log("listening to port", PORT);
})