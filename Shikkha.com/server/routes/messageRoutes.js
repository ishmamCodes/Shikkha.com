// routes/messageRoutes.js
import express from "express";
import { Message, Group } from "../models/Message.js";
import authMiddleware from "../middleware/authMiddleware.js";

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
 * Create a new group
 */
router.post("/group/create", authMiddleware, async (req, res) => {
  try {
    const { groupName, members } = req.body;
    const creatorId = req.user.id;

    if (!groupName || !members || members.length < 1) {
      return res.status(400).json({ error: "Group name and at least one member required" });
    }

    const allMembers = [...new Set([...members, creatorId])];
    const group = new Group({ groupName, members: allMembers });

    await group.save();
    res.status(201).json(group);
  } catch (error) {
    console.error("Group creation error:", error);
    res.status(500).json({ error: "Failed to create group" });
  }
});

/**
 * Send a group message
 */
router.post("/group", authMiddleware, async (req, res) => {
  try {
    const { groupName, text } = req.body;
    const senderId = req.user.id;

    if (!groupName || !text) {
      return res.status(400).json({ error: "Group name and text are required" });
    }

    const group = await Group.findOne({ groupName });
    if (!group) return res.status(404).json({ error: "Group not found" });

    if (!group.members.includes(senderId)) {
      return res.status(403).json({ error: "Not a group member" });
    }

    const message = { senderId, text, timestamp: new Date() };
    group.messages.push(message);

    await group.save();
    res.status(201).json(message);
  } catch (error) {
    console.error("Group message send error:", error);
    res.status(500).json({ error: "Failed to send group message" });
  }
});

/**
 * Get messages in a group
 */
router.get("/group/:groupName", authMiddleware, async (req, res) => {
  try {
    const { groupName } = req.params;
    const userId = req.user.id;

    const group = await Group.findOne({ groupName })
      .populate("members", "username")
      .populate("messages.senderId", "username");

    if (!group) return res.status(404).json({ error: "Group not found" });
    if (!group.members.some((m) => m._id.equals(userId))) {
      return res.status(403).json({ error: "Not a group member" });
    }

    res.status(200).json(group.messages);
  } catch (error) {
    console.error("Fetch group messages error:", error);
    res.status(500).json({ error: "Failed to fetch group messages" });
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
    })
      .populate("senderId", "username role")
      .populate("receiverId", "username role")
      .sort({ timestamp: -1 });

    const inboxMap = new Map();

    messages.forEach((msg) => {
      const otherUser =
        msg.senderId._id.toString() === userId ? msg.receiverId : msg.senderId;
      if (!otherUser) return;

      const key = otherUser._id.toString();

      if (!inboxMap.has(key)) {
        inboxMap.set(key, {
          user: otherUser,
          lastMessage: { text: msg.text, timestamp: msg.timestamp },
          unreadCount: msg.receiverId._id.toString() === userId && !msg.read ? 1 : 0,
        });
      } else if (
        msg.receiverId._id.toString() === userId &&
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
