require("dotenv").config();
const express = require("express");
const connectDB = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const analysisRoutes = require("./routes/analysisRoutes");
const chronicDisease = require("./routes/chronicDiseaseRoutes");
const allergyRoutes = require("./routes/allergyRoutes");
const cors = require("cors");

const app = express();

const PORT = process.env.PORT || 5000;

// Middleware
app.use(express.json());
app.use(cors());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/analysis", analysisRoutes);
app.use("/api/chronicdisease", chronicDisease);

app.use("/api/allergy", allergyRoutes);

// Database Connection
connectDB();

// Start Server
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
