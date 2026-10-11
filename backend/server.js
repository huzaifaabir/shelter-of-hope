const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
require("dotenv").config();

const connectDB = require("./config/db");
const { notFound, errorHandler } = require("./middleware/errors");

const app = express();
app.set("trust proxy", 1);

app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));

const origins = (process.env.CLIENT_ORIGIN || "http://localhost:5173")
  .split(",")
  .map((s) => s.trim());

app.use(cors({ origin: origins }));
app.use(express.json({ limit: "200kb" }));

app.use(
  "/api",
  rateLimit({
    windowMs: 60 * 1000,
    limit: 300,
    standardHeaders: true,
    legacyHeaders: false,
  })
);

app.get("/", (req, res) => {
  res.json({ message: "Shelter of Hope API is running" });
});

app.get("/api/health", (req, res) => {
  const mongoose = require("mongoose");

  const projectId = !!process.env.FIREBASE_PROJECT_ID;
  const clientEmail = !!process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = !!process.env.FIREBASE_PRIVATE_KEY;
  const serviceAccountJson = !!process.env.FIREBASE_SERVICE_ACCOUNT_JSON;

  const firebaseConfigured =
    serviceAccountJson || (projectId && clientEmail && privateKey);

  console.log("Firebase env check:", {
    projectId,
    clientEmail,
    privateKey,
    serviceAccountJson,
    firebaseConfigured,
  });

  const databaseConnected = mongoose.connection.readyState === 1;

  res.status(databaseConnected ? 200 : 503).json({
    ok: databaseConnected,
    database: databaseConnected ? "connected" : "disconnected",
    firebaseConfigured,
  });
});

app.use("/api/me", require("./routes/me"));
app.use("/api/donors", require("./routes/donors"));
app.use("/api/team-members", require("./routes/teamMembers"));
app.use("/api/media", require("./routes/media"));
app.use("/api/missing-children", require("./routes/missing"));
app.use("/api/reports", require("./routes/reports"));
app.use("/api/admin", require("./routes/admin"));
app.use("/api", require("./routes/content"));

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

if (require.main === module) {
  connectDB().then(() => {
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  });
}

module.exports = app;