const express = require("express");
const dotenv = require("dotenv");
const helmet = require("helmet");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
const connectDB = require("./config/database");

// Load environment variables
dotenv.config();

// Connect to MongoDB
connectDB();

const app = express();

app.set("trust proxy", 1);

// Security: Helmet
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);

// ---- CORS ----
if (process.env.NODE_ENV === "development") {
  app.use(cors());
} else {
  const allowedOrigins = [process.env.FRONTEND_URL].filter(Boolean);

  app.use(
    cors({
      origin(origin, callback) {
        if (!origin) return callback(null, true);
        if (allowedOrigins.includes(origin)) return callback(null, true);
        callback(new Error("Not allowed by CORS"));
      },
      credentials: true,
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
    })
  );
}

// Body parsing
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// ---- Rate Limiting ----
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || "900000", 10),
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || "100", 10),
  standardHeaders: true,
  legacyHeaders: false,
});
app.use("/api", limiter);

// ---- Logging ----
app.use((req, res, next) => {
  console.log(
    `[${new Date().toISOString()}] ${req.method} ${req.originalUrl} - IP: ${req.ip}`
  );
  next();
});

// ---- Health Check ----
app.get("/api/health", (req, res) => {
  res.status(200).json({
    ok: true,
    status: "OK",
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV || "development",
  });
});

// ---- API Routes ----
app.use("/api/auth", require("./routes/auth"));
app.use("/api/users", require("./routes/users"));
app.use("/api/media", require("./routes/media"));
app.use("/api/projects", require("./routes/projects"));
app.use("/api/feedback", require("./routes/feedback"));

// ---- 404 ----
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

// ---- Global Error Handler ----
app.use((err, req, res, next) => {
  console.error("🔥 Error global:", err);

  const statusCode = err.statusCode || 500;
  const message = err.message || "Server Error";

  res.status(statusCode).json({
    success: false,
    message,
  });
});

// ---- Start Server ----
const PORT = process.env.PORT || 5001;

app.listen(PORT, () => {
  console.log(
    `Backend running on port ${PORT} (NODE_ENV=${process.env.NODE_ENV || "development"})`
  );
});

module.exports = app;
