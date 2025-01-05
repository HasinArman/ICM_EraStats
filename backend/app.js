require("dotenv").config();
const express = require("express");
const http = require("http"); // Required for Socket.IO to attach to the server
const socketIo = require("socket.io"); // Import Socket.IO
const connectDB = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const analysisRoutes = require("./routes/analysisRoutes");
const chronicDisease = require("./routes/chronicDiseaseRoutes");
const cors = require("cors");

const app = express();
const server = http.createServer(app); // Create HTTP server
const io = socketIo(server, {
  cors: {
    origin: 'https://cuddly-tribble-v944gvg6rxghx9v6-3000.app.github.dev', // your frontend's domain
    methods: ['GET', 'POST'],
    credentials: true, // Allow cookies to be sent with requests
  }
});

const PORT = process.env.PORT || 5000;

// Middleware
app.use(express.json());

app.use(cors());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/analysis", analysisRoutes);
app.use("/api/chronicdisease", chronicDisease);

// WebSocket connection handler
io.on("connection", (socket) => {
  console.log("New WebSocket connection");

  // Example: Handle incoming messages from the client
  socket.on("message", (data) => {
    console.log("Message received:", data);
  });

  // Handle client disconnect
  socket.on("disconnect", () => {
    console.log("User disconnected");
  });
});

// Database Connection
connectDB();

// Start Server
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
