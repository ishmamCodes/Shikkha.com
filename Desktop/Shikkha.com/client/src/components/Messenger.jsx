import React, { useState, useEffect } from 'react';
import axios from 'axios';

const Messenger = () => {
  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user"));
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [text, setText] = useState('');
  const [messages, setMessages] = useState([]);
  const [inbox, setInbox] = useState([]);

  // Axios defaults
  axios.defaults.baseURL = 'http://localhost:4000';
  axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  axios.defaults.withCredentials = true;

  useEffect(() => {
    let interval;
    if (user && selectedUser) {
      fetchMessages();
      interval = setInterval(fetchMessages, 3000);
    }
    return () => clearInterval(interval);
  }, [selectedUser]);

  useEffect(() => {
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
      const res = await axios.get(`/api/users/search?query=${searchQuery}`);
      setSearchResults(res.data);
    } catch (error) {
      console.error("Search error:", error);
      setSearchResults([]);
    }
  };

  const fetchMessages = async () => {
    try {
      if (selectedUser && user) {
        const res = await axios.get(
          `/api/messages/conversation/${user._id}/${selectedUser._id}`
        );
        setMessages(res.data);
      }
    } catch (error) {
      console.error("Fetch messages error:", error);
    }
  };

  const fetchInbox = async () => {
    try {
      const res = await axios.get('/api/messages/inbox');
      setInbox(res.data);
    } catch (error) {
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
        senderId: user._id,
        receiverId: selectedUser._id,
        text
      };
  
      console.log("🚀 Sending payload:", JSON.stringify(payload, null, 2));
  
      const res = await axios.post('/api/messages', payload);
  
      setText('');
      setMessages(prev => [...prev, res.data || {
        senderId: user._id,
        receiverId: selectedUser._id,
        text,
        timestamp: new Date()
      }]);
    } catch (error) {
      console.error("Send message error:", error.response?.data || error.message);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      sendMessage();
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Messenger</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        
        {/* Inbox */}
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="font-bold mb-4">Inbox</h3>
          {inbox.length === 0 && <p className="text-gray-500 text-sm">No conversations</p>}
          {inbox.map((conv) => (
            <div 
              key={conv._id}
              className={`p-3 rounded cursor-pointer hover:bg-gray-100 mb-2 ${
                selectedUser?._id === conv.user?._id ? 'bg-blue-50' : ''
              }`}
              onClick={() => {
                setSelectedUser(conv.user);
              }}
            >
              <div className="flex justify-between">
                <span className="font-medium">{conv.user?.username || 'Unknown'}</span>
                {conv.unreadCount > 0 && (
                  <span className="bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {conv.unreadCount}
                  </span>
                )}
              </div>
              <div className="text-sm text-gray-600 truncate">
                {conv.lastMessage?.text || 'No messages yet'}
              </div>
            </div>
          ))}
        </div>

        {/* Search */}
        <div className="bg-white rounded-lg shadow p-4">
          <div className="mb-4">
            <div className="flex">
              <input
                type="text"
                placeholder="Search users..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 border p-2 rounded-l"
              />
              <button 
                onClick={handleSearch}
                className="bg-blue-600 text-white px-4 py-2 rounded-r"
              >
                Search
              </button>
            </div>
          </div>

          <div className="space-y-2">
            {searchResults.map((u) => (
              <div
                key={u._id}
                className={`p-3 rounded cursor-pointer hover:bg-gray-100 ${selectedUser?._id === u._id ? 'bg-blue-50' : ''}`}
                onClick={() => {
                  setSelectedUser(u);
                }}
              >
                <div className="font-medium">{u.username}</div>
                <div className="text-sm text-gray-500">{u.role}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Chat */}
        <div className="md:col-span-2 bg-white rounded-lg shadow">
          {selectedUser ? (
            <div className="h-full flex flex-col">
              <div className="border-b p-4">
                <h2 className="font-bold">
                  Chat with {selectedUser?.username}
                </h2>
              </div>

              <div className="flex-1 p-4 overflow-y-auto" style={{ maxHeight: '60vh' }}>
                {messages.length === 0 && (
                  <p className="text-gray-400 text-sm">No messages yet.</p>
                )}
                {messages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`mb-4 ${msg.senderId?._id === user._id ? 'text-right' : 'text-left'}`}
                  >
                    <div className={`inline-block p-3 rounded-lg ${msg.senderId?._id === user._id ? 'bg-blue-100' : 'bg-gray-100'}`}>
                      <div className="text-sm text-gray-500 mb-1">
                        {msg.senderId?._id === user._id ? 'You' : msg.senderId?.username || 'Unknown'}
                      </div>
                      <div>{msg.text}</div>
                      <div className="text-xs text-gray-400 mt-1">
                        {new Date(msg.timestamp).toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t p-4">
                <div className="flex">
                  <input
                    type="text"
                    placeholder="Type a message..."
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    onKeyPress={handleKeyPress}
                    className="flex-1 border p-2 rounded-l"
                  />
                  <button
                    onClick={sendMessage}
                    className="bg-blue-600 text-white px-4 py-2 rounded-r"
                  >
                    Send
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center text-gray-500">
              Select a user to start chatting
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Messenger;