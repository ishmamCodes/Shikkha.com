// routes/messageRoutes.js
import express from "express";
import Message from "../models/Message.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

/**
 * Send a direct message
 */
router.post("/", authMiddleware, async (req, res) => {
  try {
    const { receiverId, content, messageType = "text" } = req.body;
    const senderId = req.user.id;

    if (!receiverId || !content) {
      return res.status(400).json({ error: "receiverId and content are required" });
    }

    const message = new Message({ 
      senderId, 
      receiverId, 
      content,
      messageType 
    });
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
 */
router.get("/conversation/:userId1/:userId2", authMiddleware, async (req, res) => {
  try {
    const { userId1, userId2 } = req.params;

    const messages = await Message.find({
      $or: [
        { senderId: userId1, receiverId: userId2 },
        { senderId: userId2, receiverId: userId1 },
      ],
      isDeleted: false
    })
      .sort({ createdAt: 1 })
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
    const userId = req.user.id;

    const messages = await Message.find({
      $or: [{ senderId: userId }, { receiverId: userId }],
      isDeleted: false
    })
      .populate("senderId", "username role")
      .populate("receiverId", "username role")
      .sort({ createdAt: -1 });

    const inboxMap = new Map();

    messages.forEach((msg) => {
      const otherUser =
        msg.senderId._id.toString() === userId ? msg.receiverId : msg.senderId;
      if (!otherUser) return;

      const key = otherUser._id.toString();

      if (!inboxMap.has(key)) {
        inboxMap.set(key, {
          user: otherUser,
          lastMessage: { content: msg.content, createdAt: msg.createdAt },
          unreadCount: msg.receiverId._id.toString() === userId && !msg.isRead ? 1 : 0,
        });
      } else if (
        msg.receiverId._id.toString() === userId &&
        !msg.isRead
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
