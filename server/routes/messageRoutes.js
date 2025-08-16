// routes/messageRoutes.js
import express from "express";
import { Message} from "../models/Message.js";
import authMiddleware from "../middleware/authMiddleware.js";
import mongoose from "mongoose";

const router = express.Router();

/**
 * Send a direct message
 */
router.post("/", authMiddleware, async (req, res) => {
  try {
    const { senderId, receiverId, text } = req.body;

    if (!receiverId || !text || !senderId) {
      return res.status(400).json({ error: "senderId, receiverId, and text are required" });
    }

    const message = new Message({ senderId, receiverId, text });
    await message.save();

    const populatedMsg = await Message.findById(message._id)
      .populate("senderId", "username")
      .populate("receiverId", "username");

    res.status(201).json(populatedMsg);
  } catch (error) {
    console.error("Message send error:", error);
    res.status(500).json({ error: "Failed to send message" });
  }
});

/**
 * Get conversation between two users
 * Consider adding pagination (limit, skip) for scalability
 */
router.get("/conversation/:userId1/:userId2", authMiddleware, async (req, res) => {
  try {
    const { userId1, userId2 } = req.params;

    const messages = await Message.find({
      $or: [
        { senderId: userId1, receiverId: userId2 },
        { senderId: userId2, receiverId: userId1 },
      ],
    })
      .sort({ timestamp: 1 })
      .populate("senderId", "username")
      .populate("receiverId", "username");

    res.status(200).json(messages);
  } catch (error) {
    console.error("Fetch messages error:", error);
    res.status(500).json({ error: "Failed to fetch messages" });
  }
});


/**
 * Get inbox: last message per conversation
 */
router.get("/inbox", authMiddleware, async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id;

    if (!userId) {
      return res.status(401).json({ error: "User not authenticated" });
    }

    const messages = await Message.find({
      $or: [{ senderId: userId }, { receiverId: userId }],
    })
      .populate("senderId", "username role")
      .populate("receiverId", "username role")
      .sort({ timestamp: -1 });

    const inboxMap = new Map();

    messages.forEach((msg) => {
      const otherUser =
        msg.senderId._id.toString() === userId.toString() ? msg.receiverId : msg.senderId;
      if (!otherUser) return;

      const key = otherUser._id.toString();

      if (!inboxMap.has(key)) {
        inboxMap.set(key, {
          user: otherUser,
          lastMessage: { text: msg.text, timestamp: msg.timestamp },
          unreadCount: msg.receiverId._id.toString() === userId.toString() && !msg.read ? 1 : 0,
        });
      } else if (
        msg.receiverId._id.toString() === userId.toString() &&
        !msg.read
      ) {
        inboxMap.get(key).unreadCount += 1;
      }
    });

    res.json([...inboxMap.values()]);
  } catch (error) {
    console.error("Inbox error:", error);
    res.status(500).json({ message: "Error fetching inbox", error });
  }
});

export default router;
