// routes/messageRoutes.js
import express from "express";
import Message from "../models/Message.js";
import { encryptText, decryptText } from "../utils/crypto.js";
import authMiddleware from "../middleware/authMiddleware.js";
import Student from "../models/Student.js";
import Educator from "../models/Educator.js";

const router = express.Router();

// Helper to safely decrypt legacy/plaintext messages
const safeDecrypt = (msg) => {
  try {
    if (msg?.iv && msg?.authTag) {
      return decryptText(msg.content, msg.iv, msg.authTag);
    }
    return msg?.content || '';
  } catch (e) {
    console.warn('[safeDecrypt] Fallback to plaintext due to error:', e?.message);
    return msg?.content || '';
  }
};

/**
 * Send a direct message
 */
router.post("/", authMiddleware, async (req, res) => {
  try {
    const { receiverId, content, messageType = "text" } = req.body;
    const senderId = req.user._id;
    const senderRole = req.user.role;

    if (!receiverId || !content) {
      return res.status(400).json({ error: "receiverId and content are required" });
    }

    // Find receiver to determine their role
    let receiver = null;
    let receiverModel = '';
    
    // Try to find receiver in all user models
    receiver = await Student.findById(receiverId);
    if (receiver) receiverModel = 'Student';
    
    if (!receiver) {
      receiver = await Educator.findById(receiverId);
      if (receiver) receiverModel = 'Educator';
    }

    if (!receiver) {
      return res.status(404).json({ error: 'Receiver not found' });
    }

    // Encrypt content
    const { cipherText, iv, authTag } = encryptText(content);

    // Create message with correct schema fields
    const message = new Message({ 
      senderModel: senderRole.charAt(0).toUpperCase() + senderRole.slice(1),
      receiverModel,
      senderId, 
      receiverId, 
      content: cipherText,
      iv,
      authTag,
      messageType,
      isDelivered: true,
      deliveredAt: new Date()
    });
    await message.save();

    // Build response with friendly participant names
    const obj = message.toObject();
    obj.content = content; // return plaintext to client

    // Sender from req.user (already resolved by authMiddleware)
    obj.senderId = {
      _id: senderId,
      username: req.user?.username || '',
      fullName: req.user?.fullName || '',
      role: req.user?.role || '',
      avatarUrl: req.user?.avatarUrl || ''
    };

    // Receiver info
    obj.receiverId = {
      _id: receiver._id,
      username: receiver.username || '',
      fullName: receiver.fullName || '',
      role: receiver.role || receiverModel.toLowerCase(),
      avatarUrl: receiver.avatarUrl || ''
    };

    res.status(201).json(obj);
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
      .lean();

    // Collect unique participant ids
    const ids = new Set();
    messages.forEach(m => { ids.add(String(m.senderId)); ids.add(String(m.receiverId)); });
    const idArr = [...ids];

    // Try resolving names from Student, then Educator
    const studs = await Student.find({ _id: { $in: idArr } }).select('fullName role email avatarUrl').lean();
    const studMap = new Map(studs.map(s => [String(s._id), s]));

    const missingIds = idArr.filter(id => !studMap.has(id));
    const edus = missingIds.length ? await Educator.find({ _id: { $in: missingIds } }).select('fullName role email avatarUrl').lean() : [];
    const eduMap = new Map(edus.map(e => [String(e._id), e]));

    const enrich = (id) => {
      const sid = String(id);
      if (studMap.has(sid)) {
        const s = studMap.get(sid);
        return { _id: s._id, username: '', fullName: s.fullName || '', role: s.role || 'student', avatarUrl: s.avatarUrl || '' };
      }
      if (eduMap.has(sid)) {
        const e = eduMap.get(sid);
        return { _id: e._id, username: '', fullName: e.fullName || '', role: e.role || 'educator', avatarUrl: e.avatarUrl || '' };
      }
      return { _id: id };
    };

    const out = messages.map(m => ({
      ...m,
      senderId: enrich(m.senderId),
      receiverId: enrich(m.receiverId),
      content: safeDecrypt(m)
    }));

    res.status(200).json(out);
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
    const userId = req.user._id.toString();

    const messages = await Message.find({
      $or: [{ senderId: userId }, { receiverId: userId }],
      isDeleted: false
    })
      .sort({ createdAt: -1 })
      .lean();

    const inboxMap = new Map();

    const toId = (v) => (v && typeof v === 'object' && v._id ? v._id.toString() : v?.toString?.());

    messages.forEach((msg) => {
      try {
        const senderIdStr = toId(msg.senderId);
        const receiverIdStr = toId(msg.receiverId);
        if (!senderIdStr || !receiverIdStr) return;

        const isIncoming = receiverIdStr === userId;
        const isOutgoing = senderIdStr === userId;
        if (!isIncoming && !isOutgoing) return;

        const otherUser = isOutgoing ? msg.receiverId : msg.senderId; // may be populated doc
        const otherId = isOutgoing ? receiverIdStr : senderIdStr;
        if (!otherId) return;

        const key = otherId;

        const base = inboxMap.get(key) || {
          user: otherUser && otherUser._id ? otherUser : { _id: otherId },
          lastMessage: { content: safeDecrypt(msg), createdAt: msg.createdAt },
          unreadCount: 0,
        };

        // unread count only increments for incoming, unread messages
        if (isIncoming && !msg.isRead) {
          base.unreadCount += 1;
        }

        // keep the latest message (messages are sorted desc by createdAt)
        if (!inboxMap.has(key)) {
          inboxMap.set(key, base);
        }
      } catch (e) {
        console.warn('Inbox map item skipped due to error:', e?.message);
      }
    });

    // Ensure each user has username or fullName by fetching from Student, then Educator
    const items = [...inboxMap.values()];
    const missingIds = items.map(it => it.user?._id?.toString()).filter(Boolean);
    if (missingIds.length > 0) {
      const studs = await Student.find({ _id: { $in: missingIds } }).select('fullName role email avatarUrl').lean();
      const studMap = new Map(studs.map(s => [s._id.toString(), s]));

      const stillMissing = missingIds.filter(id => !studMap.has(id));
      const edus = stillMissing.length ? await Educator.find({ _id: { $in: stillMissing } }).select('fullName role email avatarUrl').lean() : [];
      const eduMap = new Map(edus.map(e => [e._id.toString(), e]));

      items.forEach(it => {
        const id = it.user?._id?.toString();
        if (!id) return;
        if (studMap.has(id)) {
          const s = studMap.get(id);
          it.user = { _id: s._id, username: '', fullName: s.fullName || '', role: s.role || 'student', avatarUrl: s.avatarUrl || '' };
          return;
        }
        if (eduMap.has(id)) {
          const e = eduMap.get(id);
          it.user = { _id: e._id, username: '', fullName: e.fullName || '', role: e.role || 'educator', avatarUrl: e.avatarUrl || '' };
          return;
        }
      });
    }

    res.json(items);
  } catch (error) {
    console.error("Inbox error:", error);
    res.status(500).json({ message: "Error fetching inbox", error });
  }
});

/**
 * Search users for messaging
 */
router.get("/search", authMiddleware, async (req, res) => {
  try {
    const { query } = req.query;
    const currentUserId = req.user._id.toString();

    if (!query || query.trim().length < 2) {
      return res.json([]);
    }

    const searchRegex = new RegExp(query, 'i');
    const users = [];

    // Search in Students
    const students = await Student.find({
      _id: { $ne: currentUserId },
      $or: [
        { fullName: searchRegex },
        { username: searchRegex },
        { email: searchRegex }
      ]
    }, 'fullName username email avatarUrl').limit(10);

    users.push(...students.map(user => ({ ...user.toObject(), role: 'student' })));

    // Search in Educators
    const educators = await Educator.find({
      _id: { $ne: currentUserId },
      $or: [
        { fullName: searchRegex },
        { username: searchRegex },
        { email: searchRegex }
      ]
    }, 'fullName username email avatarUrl').limit(10);

    users.push(...educators.map(user => ({ ...user.toObject(), role: 'educator' })));

    res.json(users.slice(0, 20)); // Limit total results
  } catch (error) {
    console.error('Search users error:', error);
    res.status(500).json({ message: 'Failed to search users' });
  }
});

/**
 * Mark messages as read in a conversation
 */
router.post("/mark-read", authMiddleware, async (req, res) => {
  try {
    const { conversationUserId } = req.body;
    const currentUserId = req.user._id;

    if (!conversationUserId) {
      return res.status(400).json({ error: 'conversationUserId is required' });
    }

    // Mark all unread messages from the other user as read
    const result = await Message.updateMany(
      {
        senderId: conversationUserId,
        receiverId: currentUserId,
        isRead: false,
        isDeleted: false
      },
      {
        isRead: true,
        readAt: new Date()
      }
    );

    res.json({ 
      success: true, 
      messagesMarkedAsRead: result.modifiedCount 
    });
  } catch (error) {
    console.error('Mark messages as read error:', error);
    res.status(500).json({ error: 'Failed to mark messages as read' });
  }
});

/**
 * Get unread message count
 */
router.get("/unread-count", authMiddleware, async (req, res) => {
  try {
    const userId = req.user._id;
    
    const unreadCount = await Message.countDocuments({
      receiverId: userId,
      isRead: false,
      isDeleted: false
    });

    res.json({ unreadCount });
  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json({ message: 'Failed to get unread count' });
  }
});

export default router;
