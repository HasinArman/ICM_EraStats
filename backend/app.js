require("dotenv").config();
const express = require("express");
const connectDB = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(express.json());

app.use(cors({
    origin: process.env.CLIENT_URL,
    credentials: true
  }));


// Routes
app.use("/api/auth", authRoutes);

// Database Connection
connectDB();

// Start Server
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
