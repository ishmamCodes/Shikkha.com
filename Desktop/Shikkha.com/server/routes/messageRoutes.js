import express from 'express';
import mongoose from 'mongoose';
import { Message, Group } from '../models/Message.js';
import authMiddleware from '../middleware/authMiddleware.js';

const router = express.Router();

// Send private message
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { recipientId, text } = req.body;
    const senderId = req.user.id;

    if (!recipientId || !text) {
      return res.status(400).json({ error: 'Recipient and text are required' });
    }

    const message = new Message({
      senderId,
      recipientId,
      text
    });

    await message.save();
    res.status(201).json(message);
  } catch (error) {
    console.error('Message send error:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

// Get conversation between two users
router.get('/:userId1/:userId2', authMiddleware, async (req, res) => {
  try {
    const { userId1, userId2 } = req.params;
    
    const messages = await Message.find({
      $or: [
        { senderId: userId1, recipientId: userId2 },
        { senderId: userId2, recipientId: userId1 }
      ]
    })
    .sort({ timestamp: 1 })
    .populate('senderId', 'username')
    .populate('recipientId', 'username');

    res.status(200).json(messages);
  } catch (error) {
    console.error('Fetch messages error:', error);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

// Create group
router.post('/group/create', authMiddleware, async (req, res) => {
  try {
    const { groupName, members } = req.body;
    const creatorId = req.user.id;

    if (!groupName || !members || members.length < 1) {
      return res.status(400).json({ error: 'Group name and members are required' });
    }

    // Include creator in members
    const allMembers = [...new Set([...members, creatorId])];

    const group = new Group({
      groupName,
      members: allMembers
    });

    await group.save();
    res.status(201).json(group);
  } catch (error) {
    console.error('Group creation error:', error);
    res.status(500).json({ error: 'Failed to create group' });
  }
});

// Send group message
router.post('/group', authMiddleware, async (req, res) => {
  try {
    const { groupName, text } = req.body;
    const senderId = req.user.id;

    if (!groupName || !text) {
      return res.status(400).json({ error: 'Group name and text are required' });
    }

    const group = await Group.findOne({ groupName });
    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }

    if (!group.members.includes(senderId)) {
      return res.status(403).json({ error: 'Not a group member' });
    }

    const message = {
      senderId,
      text,
      timestamp: new Date()
    };

    group.messages.push(message);
    await group.save();

    res.status(201).json(message);
  } catch (error) {
    console.error('Group message send error:', error);
    res.status(500).json({ error: 'Failed to send group message' });
  }
});

// Get group messages
router.get('/group/:groupName', authMiddleware, async (req, res) => {
  try {
    const { groupName } = req.params;
    const userId = req.user.id;

    const group = await Group.findOne({ groupName })
      .populate('members', 'username')
      .populate('messages.senderId', 'username');

    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }

    if (!group.members.some(member => member._id.equals(userId))) {
      return res.status(403).json({ error: 'Not a group member' });
    }

    res.status(200).json(group.messages);
  } catch (error) {
    console.error('Fetch group messages error:', error);
    res.status(500).json({ error: 'Failed to fetch group messages' });
  }
});

export default router;