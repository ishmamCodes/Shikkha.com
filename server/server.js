import cors from "cors";
import express from "express";
import mongoose from "mongoose";
import session from "express-session";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Routes
import userRoutes from "./routes/userRoutes.js";
import blogRoutes from "./routes/blogRoutes.js"; 
import messageRoutes from "./routes/messageRoutes.js";
import educatorsRouter from "./routes/educators.js";
import studentRoutes from "./routes/studentRoutes.js";
import videoRoutes from "./routes/videoRoutes.js";

const app = express();
const PORT = process.env.PORT || 4000;

// MongoDB URI
// Use MONGO_URI from environment, fallback to local MongoDB for development
const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/shikkha";

// Enhanced CORS configuration
const corsOptions = {
  // Reflect the request Origin (enables any localhost port like 5176 during dev)
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  optionsSuccessStatus: 200,
};
app.use(cors(corsOptions));

// Pre-flight requests
app.options(/.*/, cors(corsOptions));

// Ensure CORS headers always present and short-circuit OPTIONS
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin) {
    res.header('Access-Control-Allow-Origin', origin);
    res.header('Vary', 'Origin');
  }
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', corsOptions.methods.join(','));
  res.header('Access-Control-Allow-Headers', corsOptions.allowedHeaders.join(','));
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Session Middleware
app.use(session({
  secret: "shikkha_secret_key", // Replace with a strong secret in production
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false } // Set to true if HTTPS
}));

// Route Mounting
app.use("/api/auth", userRoutes);
app.use("/api/blogs", blogRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api", educatorsRouter);
app.use("/api/students", studentRoutes);
app.use("/api/videos", videoRoutes);
app.use('/uploads', express.static('uploads'));
app.use('/logo.jpg', express.static('client/public/logo.jpg'));

// Health Check Route
app.get("/", (req, res) => {
  res.send("Shikkha API is running!");
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ 
    success: false, 
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// MongoDB Connection and Server Start
mongoose.connect(MONGO_URI, {
  serverSelectionTimeoutMS: 10000,
  dbName: process.env.MONGO_DB || undefined,
})
.then(() => {
  console.log("✅ Connected to MongoDB");
  app.listen(PORT, () => {
    console.log(`🚀 Server running at http://localhost:${PORT}`);
  });
})
.catch((err) => {
  console.error("❌ MongoDB connection error:", err);
});
