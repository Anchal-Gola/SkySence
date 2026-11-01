
import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import connectDB from "./config/db.js";
import weatherRoutes from "./src/routes/weatherRoutes.js";
import favoriteRoutes from "./src/routes/favoriteRoutes.js";

dotenv.config();

const app = express();

app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
  })
);

app.use(express.json({ limit: "10kb" }));

// Backend health check
app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "SkySense Backend is running!",
  });
});

// API routes
app.use("/api/weather", weatherRoutes);
app.use("/api/favorites", favoriteRoutes);

// Handle unknown routes
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "API route not found.",
  });
});

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDB();

    app.listen(PORT, () => {
      console.log(`SkySense server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Server startup failed:", error.message);
    process.exit(1);
  }
};

startServer();
