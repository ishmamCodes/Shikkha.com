import dotenv from "dotenv";
dotenv.config();
import cors from "cors";
import express from "express";
import mongoose from "mongoose";
import session from "express-session";

// Routes
import userRoutes from "./routes/userRoutes.js";
import blogRoutes from "./routes/blogRoutes.js"; 
import messageRoutes from "./routes/messageRoutes.js";
import educatorsRouter from "./routes/educators.js";
import videoRoutes from "./routes/videoRoutes.js";


const app = express();
const PORT = 4000;

// MongoDB URI (note: keep secure in production)
const MONGO_URI = "mongodb+srv://shikkha_admin:Shikkha123@cluster0.xrtd0cz.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

// Middleware Setup
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));


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
app.use("/api", educatorsRouter);
app.use("/api/messages", messageRoutes);
app.use('/api/users', userRoutes);
app.use("/api/videos", videoRoutes);
app.use('/uploads', express.static('uploads'));


// Health Check Route
app.get("/", (req, res) => {
  res.send("Shikkha API is running!");
});

// MongoDB Connection and Server Start
mongoose.connect(MONGO_URI)
.then(() => {
  console.log("✅ Connected to MongoDB");
  app.listen(PORT, () => {
    console.log(`🚀 Server running at http://localhost:${PORT}`);
  });
})
.catch((err) => {
  console.error("❌ MongoDB connection error:", err);
});
