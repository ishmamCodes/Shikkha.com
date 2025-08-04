import React, { useState, useEffect } from 'react';
import axios from 'axios';

const Messenger = () => {
  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user"));
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [groupName, setGroupName] = useState('');
  const [groupMembers, setGroupMembers] = useState([]);
  const [isGroupChat, setIsGroupChat] = useState(false);
  const [text, setText] = useState('');
  const [messages, setMessages] = useState([]);

  // Configure axios defaults
  axios.defaults.baseURL = 'http://localhost:4000';
  axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  axios.defaults.withCredentials = true;

  useEffect(() => {
    let interval;
    if (user && (selectedUser || isGroupChat)) {
      fetchMessages();
      interval = setInterval(fetchMessages, 3000);
    }
    return () => clearInterval(interval);
  }, [selectedUser, isGroupChat]);

  const handleSearch = async () => {
    if (!searchQuery) return;
    try {
      const res = await axios.get(`/api/users/search?query=${searchQuery}`);
      setSearchResults(res.data);
    } catch (error) {
      console.error("Search error:", error);
      alert("Failed to search users");
    }
  };

  const fetchMessages = async () => {
    try {
      if (isGroupChat && groupName) {
        const res = await axios.get(`/api/messages/group/${groupName}`);
        setMessages(res.data);
      } else if (selectedUser) {
        const res = await axios.get(`/api/messages/${user._id}/${selectedUser._id}`);
        setMessages(res.data);
      }
    } catch (error) {
      console.error("Fetch messages error:", error);
    }
  };

  const sendMessage = async () => {
    if (!text || (!selectedUser && !isGroupChat) || !user) return;
    try {
      const payload = isGroupChat
        ? { senderId: user._id, groupName, text }
        : { senderId: user._id, recipientId: selectedUser._id, text };

      const url = isGroupChat ? '/api/messages/group' : '/api/messages';
      await axios.post(url, payload);
      setText('');
      fetchMessages();
    } catch (error) {
      console.error("Send message error:", error);
      alert("Failed to send message");
    }
  };

  const handleGroupCreate = async () => {
    if (!groupName || groupMembers.length < 2) {
      alert("Group name and at least 2 members required.");
      return;
    }
    try {
      await axios.post('/api/messages/group/create', {
        groupName,
        members: groupMembers.map(m => m._id)
      });
      setIsGroupChat(true);
      setSelectedUser(null);
      fetchMessages();
    } catch (error) {
      console.error("Create group error:", error);
      alert("Failed to create group");
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      sendMessage();
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Messenger</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left sidebar - Search and Users */}
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

          {/* Search results */}
          <div className="space-y-2">
            {searchResults.map((user) => (
              <div
                key={user._id}
                className={`p-3 rounded cursor-pointer hover:bg-gray-100 ${selectedUser?._id === user._id ? 'bg-blue-50' : ''}`}
                onClick={() => {
                  setSelectedUser(user);
                  setIsGroupChat(false);
                }}
              >
                <div className="font-medium">{user.username}</div>
                <div className="text-sm text-gray-500">{user.role}</div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setGroupMembers(prev => [...prev, user]);
                  }}
                  className="text-xs text-green-600 mt-1"
                >
                  Add to group
                </button>
              </div>
            ))}
          </div>

          {/* Group creation */}
          <div className="mt-6 border-t pt-4">
            <h3 className="font-medium mb-2">Create Group</h3>
            <input
              type="text"
              placeholder="Group name"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              className="w-full border p-2 rounded mb-2"
            />
            <div className="mb-2">
              <span className="text-sm">Members: </span>
              {groupMembers.map(m => (
                <span key={m._id} className="text-xs bg-gray-200 px-2 py-1 rounded mr-1">
                  {m.username}
                </span>
              ))}
            </div>
            <button
              onClick={handleGroupCreate}
              disabled={!groupName || groupMembers.length < 2}
              className={`w-full py-2 rounded ${!groupName || groupMembers.length < 2 ? 'bg-gray-300' : 'bg-green-600 text-white'}`}
            >
              Create Group
            </button>
          </div>
        </div>

        {/* Chat area */}
        <div className="md:col-span-2 bg-white rounded-lg shadow">
          {selectedUser || isGroupChat ? (
            <div className="h-full flex flex-col">
              {/* Chat header */}
              <div className="border-b p-4">
                <h2 className="font-bold">
                  {isGroupChat ? `Group: ${groupName}` : `Chat with ${selectedUser?.username}`}
                </h2>
              </div>

              {/* Messages */}
              <div className="flex-1 p-4 overflow-y-auto" style={{ maxHeight: '60vh' }}>
                {messages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`mb-4 ${msg.senderId === user._id ? 'text-right' : 'text-left'}`}
                  >
                    <div className={`inline-block p-3 rounded-lg ${msg.senderId === user._id ? 'bg-blue-100' : 'bg-gray-100'}`}>
                      <div className="text-sm text-gray-500 mb-1">
                        {msg.senderId === user._id ? 'You' : msg.sender?.username || 'Unknown'}
                      </div>
                      <div>{msg.text}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Message input */}
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
              Select a user or create a group to start chatting
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Messenger;