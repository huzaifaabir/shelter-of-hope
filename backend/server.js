
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
require("dotenv").config();

const connectDB = require("./config/db");
const { notFound, errorHandler } = require("./middleware/errors");

const app = express();

app.set("trust proxy", 1);

// Security headers
app.use(
  helmet({
    crossOriginResourcePolicy: {
      policy: "cross-origin",
    },
  })
);

// Allowed frontend origins
const origins = (
  process.env.CLIENT_ORIGIN || "http://localhost:5173"
)
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: origins,
  })
);

// Request body parsing
app.use(express.json({ limit: "200kb" }));

// API rate limiting
app.use(
  "/api",
  rateLimit({
    windowMs: 60 * 1000,
    limit: 300,
    standardHeaders: true,
    legacyHeaders: false,
  })
);

// API root
app.get("/", (req, res) => {
  res.json({
    ok: true,
    message: "Shelter of Hope API is running",
  });
});

// Health check
app.get("/api/health", (req, res) => {
  const mongoose = require("mongoose");

  const projectId = Boolean(process.env.FIREBASE_PROJECT_ID);
  const clientEmail = Boolean(process.env.FIREBASE_CLIENT_EMAIL);
  const privateKey = Boolean(process.env.FIREBASE_PRIVATE_KEY);
  const serviceAccountJson = Boolean(
    process.env.FIREBASE_SERVICE_ACCOUNT_JSON
  );

  const firebaseConfigured =
    serviceAccountJson ||
    (projectId && clientEmail && privateKey);

  const databaseConnected =
    mongoose.connection.readyState === 1;

  res.status(databaseConnected ? 200 : 503).json({
    ok: databaseConnected,
    database: databaseConnected
      ? "connected"
      : "disconnected",
    firebaseConfigured,
  });
});

// General API routes
app.use("/api/me", require("./routes/me"));
app.use("/api/donors", require("./routes/donors"));
app.use("/api/team-members", require("./routes/teamMembers"));
app.use("/api/media", require("./routes/media"));

// Missing persons API
// Keep both prefixes compatible with existing frontend code.
const missingRouter = require("./routes/missing");

app.use("/api/missing-children", missingRouter);
app.use("/api/missing", missingRouter);

// Other API routes
app.use("/api/reports", require("./routes/reports"));
app.use("/api/admin", require("./routes/admin"));
app.use("/api", require("./routes/content"));

// 404 and error handling
app.use(notFound);
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 5000;

if (require.main === module) {
  connectDB()
    .then(() => {
      app.listen(PORT, () => {
        console.log(
          `Server running on http://localhost:${PORT}`
        );
      });
    })
    .catch((error) => {
      console.error("Failed to start server:", error);
      process.exit(1);
    });
}

module.exports = app;
