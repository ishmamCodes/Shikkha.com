import Message from '../models/Message.js';
import Student from '../models/Student.js';
import Educator from '../models/Educator.js';
import Admin from '../models/Admin.js';
import crypto from 'crypto';

// Encryption key - in production, use environment variable
const ENCRYPTION_KEY = process.env.MESSAGE_ENCRYPTION_KEY || crypto.randomBytes(32);

// Encrypt message content
const encryptMessage = (text) => {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipher('aes-256-gcm', ENCRYPTION_KEY);
  cipher.setAAD(Buffer.from('message'));
  
  let encrypted = cipher.update(text, 'utf8', 'base64');
  encrypted += cipher.final('base64');
  
  const authTag = cipher.getAuthTag();
  
  return {
    content: encrypted,
    iv: iv.toString('base64'),
    authTag: authTag.toString('base64')
  };
};

// Decrypt message content
const decryptMessage = (encryptedData) => {
  try {
    const decipher = crypto.createDecipher('aes-256-gcm', ENCRYPTION_KEY);
    decipher.setAAD(Buffer.from('message'));
    decipher.setAuthTag(Buffer.from(encryptedData.authTag, 'base64'));
    
    let decrypted = decipher.update(encryptedData.content, 'base64', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    console.error('Decryption error:', error);
    return '[Encrypted Message]';
  }
};

// Get user model based on role
const getUserModel = (role) => {
  switch (role.toLowerCase()) {
    case 'student': return Student;
    case 'educator': return Educator;
    case 'admin': return Admin;
    default: return Student;
  }
};

// Send a message
export const sendMessage = async (req, res) => {
  try {
    const { receiverId, text, messageType = 'text' } = req.body;
    const senderId = req.user.id;
    const senderRole = req.user.role;

    if (!receiverId || !text) {
      return res.status(400).json({ message: 'Receiver ID and text are required' });
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
      receiver = await Admin.findById(receiverId);
      if (receiver) receiverModel = 'Admin';
    }

    if (!receiver) {
      return res.status(404).json({ message: 'Receiver not found' });
    }

    // Encrypt message
    const encryptedData = encryptMessage(text);

    // Create message
    const message = new Message({
      senderModel: senderRole.charAt(0).toUpperCase() + senderRole.slice(1),
      receiverModel,
      senderId,
      receiverId,
      content: encryptedData.content,
      iv: encryptedData.iv,
      authTag: encryptedData.authTag,
      messageType
    });

    await message.save();

    // Populate sender and receiver info for response
    await message.populate([
      { path: 'senderId', select: 'fullName username email' },
      { path: 'receiverId', select: 'fullName username email' }
    ]);

    // Return decrypted message for immediate display
    const responseMessage = {
      ...message.toObject(),
      content: text // Return original text for sender
    };

    res.status(201).json(responseMessage);
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ message: 'Failed to send message' });
  }
};

// Get conversation between two users
export const getConversation = async (req, res) => {
  try {
    const { userId1, userId2 } = req.params;
    const currentUserId = req.user.id;

    // Ensure current user is part of the conversation
    if (currentUserId !== userId1 && currentUserId !== userId2) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const messages = await Message.find({
      $or: [
        { senderId: userId1, receiverId: userId2 },
        { senderId: userId2, receiverId: userId1 }
      ],
      isDeleted: false
    })
    .populate('senderId', 'fullName username email')
    .populate('receiverId', 'fullName username email')
    .sort({ createdAt: 1 });

    // Decrypt messages
    const decryptedMessages = messages.map(msg => {
      const decryptedContent = decryptMessage({
        content: msg.content,
        iv: msg.iv,
        authTag: msg.authTag
      });
      
      return {
        ...msg.toObject(),
        content: decryptedContent
      };
    });

    // Mark messages as read if current user is receiver
    await Message.updateMany(
      { 
        senderId: { $ne: currentUserId },
        receiverId: currentUserId,
        $or: [
          { senderId: userId1, receiverId: userId2 },
          { senderId: userId2, receiverId: userId1 }
        ],
        isRead: false 
      },
      { 
        isRead: true, 
        readAt: new Date() 
      }
    );

    res.json(decryptedMessages);
  } catch (error) {
    console.error('Get conversation error:', error);
    res.status(500).json({ message: 'Failed to fetch conversation' });
  }
};

// Get user's inbox (list of conversations)
export const getInbox = async (req, res) => {
  try {
    const userId = req.user.id;

    // Get all messages where user is sender or receiver
    const messages = await Message.aggregate([
      {
        $match: {
          $or: [
            { senderId: userId },
            { receiverId: userId }
          ],
          isDeleted: false
        }
      },
      {
        $sort: { createdAt: -1 }
      },
      {
        $group: {
          _id: {
            $cond: [
              { $eq: ['$senderId', userId] },
              '$receiverId',
              '$senderId'
            ]
          },
          lastMessage: { $first: '$$ROOT' },
          unreadCount: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ['$receiverId', userId] },
                    { $eq: ['$isRead', false] }
                  ]
                },
                1,
                0
              ]
            }
          }
        }
      },
      {
        $sort: { 'lastMessage.createdAt': -1 }
      }
    ]);

    // Populate user details
    const conversations = [];
    for (const conv of messages) {
      const otherUserId = conv._id;
      
      // Find the other user in all models
      let otherUser = await Student.findById(otherUserId, 'fullName username email');
      if (!otherUser) {
        otherUser = await Educator.findById(otherUserId, 'fullName username email');
      }
      if (!otherUser) {
        otherUser = await Admin.findById(otherUserId, 'fullName username email');
      }

      if (otherUser) {
        // Decrypt last message
        const decryptedContent = decryptMessage({
          content: conv.lastMessage.content,
          iv: conv.lastMessage.iv,
          authTag: conv.lastMessage.authTag
        });

        conversations.push({
          _id: conv._id,
          user: otherUser,
          lastMessage: {
            ...conv.lastMessage,
            content: decryptedContent
          },
          unreadCount: conv.unreadCount
        });
      }
    }

    res.json(conversations);
  } catch (error) {
    console.error('Get inbox error:', error);
    res.status(500).json({ message: 'Failed to fetch inbox' });
  }
};

// Search users for messaging
export const searchUsers = async (req, res) => {
  try {
    const { query } = req.query;
    const currentUserId = req.user.id;

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
    }, 'fullName username email').limit(10);

    users.push(...students.map(user => ({ ...user.toObject(), role: 'student' })));

    // Search in Educators
    const educators = await Educator.find({
      _id: { $ne: currentUserId },
      $or: [
        { fullName: searchRegex },
        { username: searchRegex },
        { email: searchRegex }
      ]
    }, 'fullName username email').limit(10);

    users.push(...educators.map(user => ({ ...user.toObject(), role: 'educator' })));

    // Search in Admins (if current user is admin)
    if (req.user.role === 'admin') {
      const admins = await Admin.find({
        _id: { $ne: currentUserId },
        $or: [
          { fullName: searchRegex },
          { username: searchRegex },
          { email: searchRegex }
        ]
      }, 'fullName username email').limit(10);

      users.push(...admins.map(user => ({ ...user.toObject(), role: 'admin' })));
    }

    res.json(users.slice(0, 20)); // Limit total results
  } catch (error) {
    console.error('Search users error:', error);
    res.status(500).json({ message: 'Failed to search users' });
  }
};

// Get unread message count
export const getUnreadCount = async (req, res) => {
  try {
    const userId = req.user.id;
    
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
};
