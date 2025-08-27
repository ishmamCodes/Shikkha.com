import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from 'react-router-dom';

const Messenger = () => {
  const location = useLocation();
  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user"));
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [text, setText] = useState('');
  const [messages, setMessages] = useState([]);
  const [inbox, setInbox] = useState([]);
  const [toast, setToast] = useState({ show: false, type: 'success', text: '' });

  const showToast = (text, type = 'success') => {
    setToast({ show: true, type, text });
    setTimeout(() => setToast(t => ({ ...t, show: false })), 2500);
  };

  // Axios defaults
  axios.defaults.baseURL = 'https://shikkha-com.onrender.com';
  if (token) {
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete axios.defaults.headers.common['Authorization'];
  }
  axios.defaults.withCredentials = true;

  useEffect(() => {
    let interval;
    if (user && token && selectedUser) {
      fetchMessages();
      interval = setInterval(fetchMessages, 3000);
    }
    return () => clearInterval(interval);
  }, [selectedUser]);

  // Preselect user passed from navigation state (e.g., CoursesPage)
  useEffect(() => {
    const su = location.state?.selectedUser;
    if (su && (!selectedUser || selectedUser._id !== su._id)) {
      setSelectedUser(su);
    }
  }, [location.state]);

  // Load selectedUser from sessionStorage on mount if none provided
  useEffect(() => {
    if (!selectedUser) {
      const raw = sessionStorage.getItem('messenger_selected_user');
      if (raw) {
        try {
          const parsed = JSON.parse(raw);
          if (parsed && parsed._id) setSelectedUser(parsed);
        } catch {}
      }
    }
  }, []);

  // Persist selectedUser to sessionStorage so it survives refresh
  useEffect(() => {
    if (selectedUser && selectedUser._id) {
      sessionStorage.setItem('messenger_selected_user', JSON.stringify(selectedUser));
    }
  }, [selectedUser]);

  useEffect(() => {
    if (!user || !token) return; // avoid 401 spam when not logged in
    fetchInbox();
    const interval = setInterval(fetchInbox, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    try {
      const res = await axios.get(`/api/messages/search?query=${searchQuery}`);
      setSearchResults(res.data);
    } catch (error) {
      console.error("Search error:", error);
      setSearchResults([]);
    }
  };

  const fetchMessages = async () => {
    try {
      if (selectedUser && user && token) {
        const res = await axios.get(
          `/api/messages/conversation/${user._id}/${selectedUser._id}`
        );
        setMessages(res.data);
        
        // Mark messages as read when viewing conversation
        await markMessagesAsRead(selectedUser._id);
      }
    } catch (error) {
      console.error("Fetch messages error:", error);
    }
  };

  const fetchInbox = async () => {
    try {
      if (!user || !token) return;
      const res = await axios.get('/api/messages/inbox');
      setInbox(res.data || []);
      // Auto-select first conversation if none selected
      if ((!selectedUser || !selectedUser._id) && res.data && res.data.length > 0) {
        setSelectedUser(res.data[0].user);
      }
    } catch (error) {
      if (error?.response?.status === 401) {
        console.warn('Unauthorized: please log in to view inbox.');
        return;
      }
      console.error("Fetch inbox error:", error);
    }
  };
  
  const sendMessage = async () => {
    if (!text.trim() || !selectedUser || !user) {
      console.error("Missing fields", { text, selectedUser, user });
      return;
    }

    try {
      const payload = {
        receiverId: selectedUser._id,
        content: text.trim()
      };

      const res = await axios.post('/api/messages', payload);

      setText('');
      setMessages(prev => [...prev, res.data || {
        senderId: { _id: user._id, fullName: user.fullName },
        receiverId: { _id: selectedUser._id, fullName: selectedUser.fullName },
        content: text.trim(),
        createdAt: new Date().toISOString()
      }]);
      showToast('Message sent', 'success');
      // refresh inbox so the conversation appears/updates on the left
      fetchInbox();
    } catch (error) {
      console.error("Send message error:", error.response?.data || error.message);
      showToast(error?.response?.data?.error || 'Failed to send message', 'error');
    }
  };

  const markMessagesAsRead = async (conversationUserId) => {
    try {
      await axios.post('/api/messages/mark-read', {
        conversationUserId
      });
      // Refresh inbox to update unread counts
      fetchInbox();
    } catch (error) {
      console.error('Mark messages as read error:', error);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      sendMessage();
    }
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  const messageVariants = {
    hidden: { opacity: 0, x: -50 },
    show: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: 50 }
  };

  // Prefer username; then fullName; avoid showing email as a name
  const getDisplayName = (u) => {
    if (!u) return 'User';
    // u can be an object id or populated doc
    if (typeof u === 'object') {
      return u.username || u.fullName || 'User';
    }
    return 'User';
  };
  const toId = (v) => (v && typeof v === 'object' && v._id ? v._id : v);

  return (
    <div className="max-w-7xl mx-auto p-6 h-screen flex flex-col bg-gradient-to-br from-indigo-900 to-purple-800">
      <motion.h1 
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="text-3xl font-bold mb-6 bg-gradient-to-r from-white via-gray-100 to-white bg-clip-text text-transparent"
      >
        Messenger
      </motion.h1>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 flex-1">
        {/* Inbox */}
        <motion.div 
          initial={{ x: -50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl p-4 border-2 border-purple-100 overflow-hidden"
        >
          <h3 className="font-bold mb-4 text-lg text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-blue-600">
            Conversations
          </h3>
          {inbox.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-4 text-center"
            >
              <p className="text-purple-600">Start a new conversation!</p>
            </motion.div>
          )}
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="space-y-3 overflow-y-auto max-h-[70vh] pr-2"
          >
            {inbox.map((conv) => (
              <motion.div
                key={conv.user?._id}
                variants={itemVariants}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className={`p-3 rounded-xl cursor-pointer transition-all duration-200 ${
                  selectedUser?._id === conv.user?._id 
                    ? 'bg-gradient-to-r from-purple-100 to-blue-100 border-2 border-purple-200' 
                    : 'bg-white hover:bg-gradient-to-r hover:from-pink-50 hover:to-purple-50 border border-purple-50'
                }`}
                onClick={() => setSelectedUser(conv.user)}
              >
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full overflow-hidden bg-purple-100 flex items-center justify-center">
                      {conv.user?.avatarUrl ? (
                        <img src={conv.user.avatarUrl} alt="avatar" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-xs text-purple-600 font-semibold">
                          {(getDisplayName(conv.user)||'U').charAt(0)}
                        </span>
                      )}
                    </div>
                    <span className="font-medium text-purple-900">{getDisplayName(conv.user)}</span>
                  </div>
                  {conv.unreadCount > 0 && (
                    <motion.span 
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center shadow-md"
                    >
                      {conv.unreadCount}
                    </motion.span>
                  )}
                </div>
                <div className="text-sm text-purple-600 truncate mt-1">
                  {conv.lastMessage?.content || 'No messages yet'}
                </div>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>

        {/* Search */}
        <motion.div 
          initial={{ x: -50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl p-4 border-2 border-blue-100"
        >
          <div className="mb-4">
            <div className="flex shadow-lg">
              <input
                type="text"
                placeholder="Search users..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 border-2 border-r-0 border-purple-200 p-3 rounded-l-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all bg-white/80"
              />
              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleSearch}
                className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-4 py-3 rounded-r-xl shadow-lg"
              >
                Search
              </motion.button>
            </div>
          </div>

          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="space-y-3 overflow-y-auto max-h-[60vh] pr-2"
          >
            {searchResults.map((u) => (
              <motion.div
                key={u._id}
                variants={itemVariants}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className={`p-3 rounded-xl cursor-pointer transition-all ${
                  selectedUser?._id === u._id 
                    ? 'bg-gradient-to-r from-purple-100 to-blue-100 border-2 border-purple-200' 
                    : 'bg-white hover:bg-gradient-to-r hover:from-pink-50 hover:to-purple-50 border border-purple-50'
                }`}
                onClick={() => setSelectedUser(u)}
              >
                <div className="font-medium text-purple-900">{u.fullName}</div>
                <div className="text-sm text-purple-500">{u.role}</div>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>

        {/* Chat */}
        <motion.div 
          initial={{ x: 50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="md:col-span-2 bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border-2 border-purple-100 flex flex-col"
        >
          {selectedUser ? (
            <div className="h-full flex flex-col">
              <div className="border-b-2 border-purple-200 p-4 bg-gradient-to-r from-purple-600 to-blue-600 rounded-t-2xl">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full overflow-hidden bg-white/20 flex items-center justify-center">
                    {selectedUser?.avatarUrl ? (
                      <img src={selectedUser.avatarUrl} alt="avatar" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-sm text-white/90 font-semibold">
                        {(getDisplayName(selectedUser)||'U').charAt(0)}
                      </span>
                    )}
                  </div>
                  <h2 className="font-bold text-white text-xl">Chat with {getDisplayName(selectedUser)}</h2>
                </div>
              </div>

              <div className="flex-1 p-4 overflow-y-auto" style={{ maxHeight: '60vh' }}>
                {messages.length === 0 && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex items-center justify-center h-full bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-8"
                  >
                    <p className="text-purple-600">No messages yet. Start the conversation!</p>
                  </motion.div>
                )}
                <AnimatePresence>
                  {messages.map((msg, idx) => (
                    <motion.div
                      key={idx}
                      variants={messageVariants}
                      initial="hidden"
                      animate="show"
                      exit="exit"
                      transition={{ type: 'spring', stiffness: 300 }}
                      className={`mb-4 flex ${toId(msg.senderId) === user._id ? 'justify-start' : 'justify-end'}`}
                    >
                      <motion.div
                        whileHover={{ scale: 1.03 }}
                        className={`inline-block p-4 rounded-2xl max-w-xs md:max-w-md shadow-md ${
                          toId(msg.senderId) === user._id 
                            ? 'bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-bl-none' 
                            : 'bg-gradient-to-r from-gray-100 to-purple-50 rounded-br-none border border-purple-100'
                        }`}
                      >
                        <div className={`text-sm mb-1 ${
                          toId(msg.senderId) === user._id ? 'text-purple-100' : 'text-purple-700'
                        }`}>
                          {toId(msg.senderId) === user._id ? 'You' : getDisplayName(msg.senderId)}
                        </div>
                        <div className={toId(msg.senderId) === user._id ? 'text-white' : 'text-purple-900'}>
                          {msg.content}
                        </div>
                        <div className={`text-xs mt-1 flex items-center gap-2 ${
                          toId(msg.senderId) === user._id ? 'text-purple-200' : 'text-purple-500'
                        }`}>
                          <span>
                            {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          {toId(msg.senderId) === user._id && (
                            <span className="flex items-center gap-1">
                              {msg.isDelivered && (
                                <span className={`text-xs ${
                                  toId(msg.senderId) === user._id ? 'text-purple-200' : 'text-purple-500'
                                }`}>
                                  {msg.isRead ? '✓✓' : '✓'}
                                </span>
                              )}
                              {msg.isRead && (
                                <span className={`text-xs font-medium ${
                                  toId(msg.senderId) === user._id ? 'text-green-200' : 'text-green-600'
                                }`}>
                                  Seen
                                </span>
                              )}
                            </span>
                          )}
                        </div>
                      </motion.div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>

              <div className="border-t-2 border-purple-200 p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-b-2xl">
                <div className="flex shadow-lg">
                  <input
                    type="text"
                    placeholder="Type a message..."
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    onKeyPress={handleKeyPress}
                    className="flex-1 border-2 border-r-0 border-purple-200 p-3 rounded-l-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all bg-white"
                  />
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={sendMessage}
                    className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-3 rounded-r-xl shadow-lg"
                  >
                    Send
                  </motion.button>
                </div>
              </div>
            </div>
          ) : (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="h-full flex flex-col items-center justify-center p-8 text-center bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl"
            >
              <motion.div
                animate={{
                  scale: [1, 1.1, 1],
                  rotate: [0, 5, -5, 0]
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  repeatType: 'reverse'
                }}
                className="text-6xl mb-4 text-purple-400"
              >
                👋
              </motion.div>
              <h3 className="text-xl font-medium text-purple-700 mb-2">Select a user to start chatting</h3>
              <p className="text-purple-500">Find someone in your inbox or search for users</p>
            </motion.div>
          )}
        </motion.div>
      </div>

      {/* Toast */}
      <AnimatePresence>
        {toast.show && (
          <motion.div
            initial={{ opacity: 0, x: 50, y: -20 }}
            animate={{ opacity: 1, x: 0, y: 0 }}
            exit={{ opacity: 0, x: 50 }}
            className={`fixed top-5 right-5 z-[60] px-4 py-3 rounded-xl shadow-xl text-sm ${toast.type === 'error' ? 'bg-red-600 text-white' : 'bg-green-600 text-white'}`}
          >
            {toast.text}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Messenger;