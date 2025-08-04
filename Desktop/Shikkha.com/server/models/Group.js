// routes/groupRoutes.js
import express from 'express';
import mongoose from 'mongoose';
import Group from '../models/Group.js';
import authMiddleware from '../middleware/authMiddleware.js';

const router = express.Router();

// Create a new group
router.post('/', authMiddleware, async (req, res) => {
  const { name, members } = req.body;
  const creatorId = req.user.id;

  if (!name || !members || members.length < 1) {
    return res.status(400).json({ 
      error: 'Group name and at least one member are required' 
    });
  }

  try {
    // Ensure creator is included in members
    const allMembers = [...new Set([...members, creatorId])];
    
    // Validate all members exist
    const users = await mongoose.model('User').find({
      _id: { $in: allMembers }
    }).select('_id');
    
    if (users.length !== allMembers.length) {
      return res.status(400).json({ error: 'One or more members not found' });
    }

    const group = new Group({ 
      name,
      members: allMembers,
      createdBy: creatorId,
      admins: [creatorId] // Creator is automatically an admin
    });

    await group.save();
    
    // Populate members info
    const populatedGroup = await Group.findById(group._id)
      .populate('members', 'username')
      .populate('createdBy', 'username')
      .populate('admins', 'username');

    res.status(201).json(populatedGroup);
  } catch (error) {
    console.error('Group creation error:', error);
    res.status(500).json({ error: 'Failed to create group' });
  }
});

// Get all groups for current user
router.get('/my-groups', authMiddleware, async (req, res) => {
  try {
    const groups = await Group.find({ 
      members: req.user.id 
    })
    .populate('members', 'username')
    .populate('createdBy', 'username')
    .populate('admins', 'username')
    .sort({ updatedAt: -1 });

    res.status(200).json(groups);
  } catch (error) {
    console.error('Error fetching groups:', error);
    res.status(500).json({ error: 'Failed to fetch groups' });
  }
});

// Get group details by ID
router.get('/:groupId', authMiddleware, async (req, res) => {
  try {
    const group = await Group.findById(req.params.groupId)
      .populate('members', 'username')
      .populate('createdBy', 'username')
      .populate('admins', 'username')
      .populate({
        path: 'messages.sender',
        select: 'username'
      });

    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }

    // Check if user is member
    if (!group.members.some(member => member._id.equals(req.user.id))) {
      return res.status(403).json({ error: 'Not a member of this group' });
    }

    res.status(200).json(group);
  } catch (error) {
    console.error('Error fetching group:', error);
    res.status(500).json({ error: 'Failed to fetch group' });
  }
});

// Send message to group
router.post('/:groupId/messages', authMiddleware, async (req, res) => {
  const { text } = req.body;
  const { groupId } = req.params;
  const senderId = req.user.id;

  if (!text) {
    return res.status(400).json({ error: 'Message text is required' });
  }

  try {
    const group = await Group.findById(groupId);

    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }

    // Check if user is member
    if (!group.members.includes(senderId)) {
      return res.status(403).json({ error: 'Not a member of this group' });
    }

    // Add message to group
    group.messages.push({
      sender: senderId,
      text
    });

    // Update last activity timestamp
    group.updatedAt = new Date();

    await group.save();
    
    // Populate sender info
    const lastMessage = group.messages[group.messages.length - 1];
    const populatedMessage = await Group.populate(lastMessage, {
      path: 'sender',
      select: 'username'
    });

    res.status(201).json(populatedMessage);
  } catch (error) {
    console.error('Error sending group message:', error);
    res.status(500).json({ error: 'Failed to send group message' });
  }
});

// Add members to group (admin only)
router.post('/:groupId/members', authMiddleware, async (req, res) => {
  const { members } = req.body;
  const { groupId } = req.params;
  const userId = req.user.id;

  if (!members || members.length === 0) {
    return res.status(400).json({ error: 'Members list is required' });
  }

  try {
    const group = await Group.findById(groupId);

    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }

    // Check if user is admin
    if (!group.admins.includes(userId)) {
      return res.status(403).json({ error: 'Only admins can add members' });
    }

    // Validate new members exist
    const existingUsers = await mongoose.model('User').find({
      _id: { $in: members }
    }).select('_id');

    if (existingUsers.length !== members.length) {
      return res.status(400).json({ error: 'One or more users not found' });
    }

    // Add new members (avoid duplicates)
    const currentMembers = group.members.map(m => m.toString());
    const newMembers = members.filter(m => !currentMembers.includes(m));
    
    if (newMembers.length === 0) {
      return res.status(400).json({ error: 'All users are already members' });
    }

    group.members = [...group.members, ...newMembers];
    group.updatedAt = new Date();

    await group.save();

    // Populate new members info
    const populatedGroup = await Group.findById(group._id)
      .populate('members', 'username');

    res.status(200).json(populatedGroup);
  } catch (error) {
    console.error('Error adding members:', error);
    res.status(500).json({ error: 'Failed to add members' });
  }
});

export default router;