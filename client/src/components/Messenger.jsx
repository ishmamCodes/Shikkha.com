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
  axios.defaults.baseURL = 'http://localhost:4000';
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
 <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4 md:p-8">
  <div className="max-w-7xl mx-auto">
    {/* Header */}
    <motion.div 
      initial={{ y: -50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="flex items-center justify-center mb-8"
    >
      <div className="flex items-center">
        <div className="w-12 h-12 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 flex items-center justify-center mr-3 shadow-lg">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
        </div>
        <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-indigo-300">Neural Messenger</h1>
      </div>
    </motion.div>
    
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      {/* Inbox */}
      <motion.div 
        initial={{ x: -50, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="bg-black/20 backdrop-blur-md rounded-2xl shadow-2xl p-4 border border-white/10 overflow-hidden"
      >
        <h3 className="font-bold mb-4 text-lg text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-300">
          Conversations
        </h3>
        {inbox.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-slate-800/30 rounded-xl p-4 text-center border border-white/5"
          >
            <p className="text-purple-300/70">Start a new conversation!</p>
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
                  ? 'bg-gradient-to-r from-purple-600/20 to-indigo-600/20 border border-purple-500/30' 
                  : 'bg-slate-800/20 hover:bg-gradient-to-r hover:from-purple-600/10 hover:to-indigo-600/10 border border-white/5'
              }`}
              onClick={() => setSelectedUser(conv.user)}
            >
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full overflow-hidden bg-gradient-to-r from-purple-600 to-indigo-600 flex items-center justify-center shadow-lg">
                    {conv.user?.avatarUrl ? (
                      <img src={conv.user.avatarUrl} alt="avatar" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-xs text-white font-semibold">
                        {(getDisplayName(conv.user)||'U').charAt(0)}
                      </span>
                    )}
                  </div>
                  <span className="font-medium text-slate-200">{getDisplayName(conv.user)}</span>
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
              <div className="text-sm text-purple-300/70 truncate mt-1">
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
        className="bg-black/20 backdrop-blur-md rounded-2xl shadow-2xl p-4 border border-white/10"
      >
        <div className="mb-4">
          <div className="flex shadow-lg">
            <input
              type="text"
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 bg-slate-800/40 border-2 border-r-0 border-slate-700/50 p-3 rounded-l-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-transparent"
            />
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleSearch}
              className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-4 py-3 rounded-r-xl shadow-lg"
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
                  ? 'bg-gradient-to-r from-purple-600/20 to-indigo-600/20 border border-purple-500/30' 
                  : 'bg-slate-800/20 hover:bg-gradient-to-r hover:from-purple-600/10 hover:to-indigo-600/10 border border-white/5'
              }`}
              onClick={() => setSelectedUser(u)}
            >
              <div className="font-medium text-slate-200">{u.fullName}</div>
              <div className="text-sm text-purple-300/70">{u.role}</div>
            </motion.div>
          ))}
        </motion.div>
      </motion.div>

      {/* Chat */}
      <motion.div 
        initial={{ x: 50, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.4 }}
        className="md:col-span-2 bg-black/20 backdrop-blur-md rounded-2xl shadow-2xl border border-white/10 flex flex-col"
      >
        {selectedUser ? (
          <div className="h-full flex flex-col">
            <div className="border-b border-white/10 p-4 bg-gradient-to-r from-purple-900/30 to-indigo-900/30 rounded-t-2xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full overflow-hidden bg-gradient-to-r from-purple-600 to-indigo-600 flex items-center justify-center shadow-lg">
                  {selectedUser?.avatarUrl ? (
                    <img src={selectedUser.avatarUrl} alt="avatar" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-sm text-white font-semibold">
                      {(getDisplayName(selectedUser)||'U').charAt(0)}
                    </span>
                  )}
                </div>
                <h2 className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-300 to-indigo-300 text-xl">
                  Chat with {getDisplayName(selectedUser)}
                </h2>
              </div>
            </div>

            <div className="flex-1 p-4 overflow-y-auto bg-slate-900/20" style={{ maxHeight: '60vh' }}>
              {messages.length === 0 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-center justify-center h-full bg-slate-800/30 rounded-xl p-8 border border-white/5"
                >
                  <p className="text-purple-300/70">No messages yet. Start the conversation!</p>
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
                    className={`mb-4 flex ${toId(msg.senderId) === user._id ? 'justify-end' : 'justify-start'}`}
                  >
                    <motion.div
                      whileHover={{ scale: 1.03 }}
                      className={`inline-block p-4 rounded-2xl max-w-xs md:max-w-md shadow-md ${
                        toId(msg.senderId) === user._id 
                          ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-br-none' 
                          : 'bg-slate-800/40 text-slate-200 rounded-bl-none border border-slate-700/50'
                      }`}
                    >
                      <div className={`text-sm mb-1 ${
                        toId(msg.senderId) === user._id ? 'text-purple-200' : 'text-purple-300/70'
                      }`}>
                        {toId(msg.senderId) === user._id ? 'You' : getDisplayName(msg.senderId)}
                      </div>
                      <div className={toId(msg.senderId) === user._id ? 'text-white' : 'text-slate-200'}>
                        {msg.content}
                      </div>
                      <div className={`text-xs mt-1 flex items-center gap-2 ${
                        toId(msg.senderId) === user._id ? 'text-purple-200/70' : 'text-purple-300/50'
                      }`}>
                        <span>
                          {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        {toId(msg.senderId) === user._id && (
                          <span className="flex items-center gap-1">
                            {msg.isDelivered && (
                              <span className={`text-xs ${
                                toId(msg.senderId) === user._id ? 'text-purple-200/70' : 'text-purple-300/50'
                              }`}>
                                {msg.isRead ? '✓✓' : '✓'}
                              </span>
                            )}
                            {msg.isRead && (
                              <span className={`text-xs font-medium ${
                                toId(msg.senderId) === user._id ? 'text-green-200/70' : 'text-green-300/70'
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

            <div className="border-t border-white/10 p-4 bg-gradient-to-r from-slate-900/30 to-purple-900/20 rounded-b-2xl">
              <div className="flex shadow-lg">
                <input
                  type="text"
                  placeholder="Type a message..."
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="flex-1 bg-slate-800/40 border-2 border-r-0 border-slate-700/50 p-3 rounded-l-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-transparent"
                />
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={sendMessage}
                  className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-6 py-3 rounded-r-xl shadow-lg"
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
            className="h-full flex flex-col items-center justify-center p-8 text-center bg-slate-800/30 rounded-2xl border border-white/5"
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
            <h3 className="text-xl font-medium text-transparent bg-clip-text bg-gradient-to-r from-purple-300 to-indigo-300 mb-2">
              Select a user to start chatting
            </h3>
            <p className="text-purple-300/70">Find someone in your inbox or search for users</p>
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
          className={`fixed top-5 right-5 z-[60] px-4 py-3 rounded-xl shadow-xl text-sm ${toast.type === 'error' ? 'bg-red-600/90 text-white' : 'bg-green-600/90 text-white'} backdrop-blur-md border border-white/10`}
        >
          {toast.text}
        </motion.div>
      )}
    </AnimatePresence>
  </div>
</div>
  );
};

export default Messenger;