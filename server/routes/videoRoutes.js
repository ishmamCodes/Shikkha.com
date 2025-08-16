import express from "express";
import { uploadVideo, getVideos } from "../controllers/videoController.js";
import authMiddleware, { authorizeRole } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", getVideos);
router.post("/", authMiddleware, authorizeRole(["educator"]), uploadVideo);

export default router;
