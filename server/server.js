import cors from "cors";
import express from "express";
import mongoose from "mongoose";
import session from "express-session";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config();

// Routes
import authRoutes from "./routes/authRoutes.js";
import blogRoutes from "./routes/blogRoutes.js"; 
import messageRoutes from "./routes/messageRoutes.js";
import educatorsRouter from "./routes/educators.js";
import studentRoutes from "./routes/studentRoutes.js";
import videoRoutes from "./routes/videoRoutes.js";
import courseRoutes from "./routes/courseRoutes.js";
import instructorRoutes from "./routes/instructorRoutes.js";
import marketplaceRoutes from "./routes/marketplace/index.js";
import appointmentRoutes from "./routes/appointments.js";
import examRoutes from "./routes/exams.js";
import evaluationRoutes from "./routes/evaluations.js";
import paymentRoutes from "./routes/payments.js";
import adminRoutes from "./routes/admin.js";
import materialRoutes from "./routes/materials.js";

const app = express();
const PORT = process.env.PORT || 4000;

// MongoDB URI
// Use MONGO_URI from environment, fallback to local MongoDB for development
const MONGO_URI = process.env.MONGO_URI || "mongodb+srv://shikkha_admin:Shikkha123@cluster0.xrtd0cz.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

// Enhanced CORS configuration
const corsOptions = {
  // Reflect the request Origin (enables any localhost port like 5176 during dev)
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
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

// Stripe webhook endpoint needs raw body, so add it before JSON parsing
app.use('/api/payments/stripe/webhook', express.raw({type: 'application/json'}));

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Session Middleware
app.use(session({
  secret: "shikkha.com_470_project", // Replace with a strong secret in production
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false } // Set to true if HTTPS
}));

// Route Mounting
app.use("/api/auth", authRoutes);
app.use("/api/blogs", blogRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api", educatorsRouter);
app.use("/api/students", studentRoutes);
app.use("/api/videos", videoRoutes);
app.use("/api/courses", courseRoutes);
app.use("/api/instructors", instructorRoutes);
app.use("/api/marketplace", marketplaceRoutes);
app.use("/api/appointments", appointmentRoutes);
app.use("/api/exams", examRoutes);
app.use("/api/evaluations", evaluationRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/materials", materialRoutes);
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
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

// One-time DB index fix routine at startup
async function fixIndexesAtStartup() {
  try {
    const db = mongoose.connection.db;
    const educators = db.collection('educators');
    const students = db.collection('students');

    // Educators: drop stale user_1 index if present
    const eduIndexes = await educators.listIndexes().toArray();
    if (eduIndexes.some(i => i.name === 'user_1')) {
      await educators.dropIndex('user_1');
      console.log('🗑️ Dropped educators.user_1 index');
    }
    // Educators: drop legacy username_1 index if present
    if (eduIndexes.some(i => i.name === 'username_1')) {
      await educators.dropIndex('username_1');
      console.log('🗑️ Dropped educators.username_1 index');
    }
    // Remove any legacy 'user' field
    const eduUnset = await educators.updateMany({ user: { $exists: true } }, { $unset: { user: 1 } });
    if (eduUnset.modifiedCount) console.log(`🧹 Educators: removed 'user' from ${eduUnset.modifiedCount} docs`);
    // Remove any legacy 'username' field
    const eduUnsetUsername = await educators.updateMany({ username: { $exists: true } }, { $unset: { username: 1 } });
    if (eduUnsetUsername.modifiedCount) console.log(`🧹 Educators: removed 'username' from ${eduUnsetUsername.modifiedCount} docs`);
    // Ensure unique email index for educators
    const eduEmailIdx = eduIndexes.find(i => i.name === 'email_1');
    if (!eduEmailIdx) {
      await educators.createIndex({ email: 1 }, { unique: true, name: 'email_1' });
    } else if (!eduEmailIdx.unique) {
      // Drop non-unique index and recreate as unique
      await educators.dropIndex('email_1');
      await educators.createIndex({ email: 1 }, { unique: true, name: 'email_1' });
      console.log('🔁 Recreated educators.email_1 as unique');
    }

    // Students: ensure unique email index (matches schema requirement)
    const stuIndexes = await students.listIndexes().toArray();
    // Drop legacy username index if present
    if (stuIndexes.some(i => i.name === 'username_1')) {
      await students.dropIndex('username_1');
      console.log('🗑️ Dropped students.username_1 index');
    }
    // Remove legacy 'user' field
    const stuUnset = await students.updateMany({ user: { $exists: true } }, { $unset: { user: 1 } });
    if (stuUnset.modifiedCount) console.log(`🧹 Students: removed 'user' from ${stuUnset.modifiedCount} docs`);
    // Remove legacy 'username' field
    const stuUnsetUsername = await students.updateMany({ username: { $exists: true } }, { $unset: { username: 1 } });
    if (stuUnsetUsername.modifiedCount) console.log(`🧹 Students: removed 'username' from ${stuUnsetUsername.modifiedCount} docs`);
    // Ensure unique email index for students
    const stuEmailIdx = stuIndexes.find(i => i.name === 'email_1');
    if (!stuEmailIdx) {
      await students.createIndex({ email: 1 }, { unique: true, name: 'email_1' });
    } else if (!stuEmailIdx.unique) {
      await students.dropIndex('email_1');
      await students.createIndex({ email: 1 }, { unique: true, name: 'email_1' });
      console.log('🔁 Recreated students.email_1 as unique');
    }

    console.log('✅ Startup DB index check complete');
  } catch (e) {
    console.warn('⚠️ Startup index fix skipped/failed:', e?.message || e);
  }
}

// MongoDB Connection and Server Start
mongoose.connect(MONGO_URI, {
  serverSelectionTimeoutMS: 10000,
  dbName: process.env.MONGO_DB || undefined,
})
.then(async () => {
  console.log("✅ Connected to MongoDB");
  await fixIndexesAtStartup();
  app.listen(PORT, () => {
    console.log(`🚀 Server running at http://localhost:${PORT}`);
  });
})
.catch((err) => {
  console.error("❌ MongoDB connection error:", err);
});
