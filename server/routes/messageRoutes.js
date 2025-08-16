// routes/messageRoutes.js
import express from "express";
import Message from "../models/Message.js";
import User from "../models/User.js";
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
    const senderId = req.user._id; // authMiddleware attaches full user doc; use _id

    if (!receiverId || !content) {
      return res.status(400).json({ error: "receiverId and content are required" });
    }

    // Encrypt content
    const { cipherText, iv, authTag } = encryptText(content);

    const message = new Message({ 
      senderId, 
      receiverId, 
      content: cipherText,
      iv,
      authTag,
      messageType 
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

    // Resolve receiver display fields
    let receiver = await User.findById(receiverId).select('username role avatarUrl');
    if (!receiver) {
      receiver = await Student.findById(receiverId).select('fullName role email avatarUrl');
      if (!receiver) {
        receiver = await Educator.findById(receiverId).select('fullName role email avatarUrl');
      }
    }
    if (receiver) {
      obj.receiverId = {
        _id: receiver._id,
        username: receiver.username || '',
        fullName: receiver.fullName || '',
        role: receiver.role || '',
        avatarUrl: receiver.avatarUrl || ''
      };
    } else {
      obj.receiverId = { _id: receiverId };
    }

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

    // Try resolving names from User, then Student, then Educator
    const users = await User.find({ _id: { $in: idArr } }).select('username role avatarUrl').lean();
    const userMap = new Map(users.map(u => [String(u._id), u]));

    const missingA = idArr.filter(id => !userMap.has(id));
    const studs = missingA.length ? await Student.find({ _id: { $in: missingA } }).select('fullName role email avatarUrl').lean() : [];
    const studMap = new Map(studs.map(s => [String(s._id), s]));

    const missingB = missingA.filter(id => !studMap.has(id));
    const edus = missingB.length ? await Educator.find({ _id: { $in: missingB } }).select('fullName role email avatarUrl').lean() : [];
    const eduMap = new Map(edus.map(e => [String(e._id), e]));

    const enrich = (id) => {
      const sid = String(id);
      if (userMap.has(sid)) {
        const u = userMap.get(sid);
        return { _id: u._id, username: u.username || '', fullName: '', role: u.role || '', avatarUrl: u.avatarUrl || '' };
      }
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
      .populate("senderId", "username role avatarUrl")
      .populate("receiverId", "username role avatarUrl")
      .sort({ createdAt: -1 });

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

    // Ensure each user has username or fullName by fetching from User, then Student, then Educator
    const items = [...inboxMap.values()];
    const missingIds = items.map(it => it.user?._id?.toString()).filter(Boolean);
    if (missingIds.length > 0) {
      const users = await User.find({ _id: { $in: missingIds } }).select('username role avatarUrl').lean();
      const userMap = new Map(users.map(u => [u._id.toString(), u]));

      const stillMissingA = missingIds.filter(id => !userMap.has(id));
      const studs = stillMissingA.length ? await Student.find({ _id: { $in: stillMissingA } }).select('fullName role email avatarUrl').lean() : [];
      const studMap = new Map(studs.map(s => [s._id.toString(), s]));

      const stillMissingB = stillMissingA.filter(id => !studMap.has(id));
      const edus = stillMissingB.length ? await Educator.find({ _id: { $in: stillMissingB } }).select('fullName role email avatarUrl').lean() : [];
      const eduMap = new Map(edus.map(e => [e._id.toString(), e]));

      items.forEach(it => {
        const id = it.user?._id?.toString();
        if (!id) return;
        if (userMap.has(id)) {
          const u = userMap.get(id);
          it.user = { _id: u._id, username: u.username || '', role: u.role || '', avatarUrl: u.avatarUrl || '' };
          return;
        }
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

export default router;
