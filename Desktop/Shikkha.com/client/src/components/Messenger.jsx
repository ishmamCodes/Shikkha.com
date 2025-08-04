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
  const [inbox, setInbox] = useState([]);

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

  useEffect(() => {
    fetchInbox();
    const interval = setInterval(fetchInbox, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return setSearchResults([]);
    try {
      const res = await axios.get(`/api/users/search?query=${searchQuery}`);
      setSearchResults(res.data);
    } catch {
      setSearchResults([]);
    }
  };

  const fetchMessages = async () => {
    try {
      if (isGroupChat && groupName) {
        const res = await axios.get(`/api/messages/group/${groupName}`);
        setMessages(res.data);
      } else if (selectedUser && user) {
        const res = await axios.get(`/api/messages/conversation/${user._id}/${selectedUser._id}`);
        setMessages(res.data);
      }
    } catch {}
  };

  const fetchInbox = async () => {
    try {
      const res = await axios.get('/api/messages/inbox');
      setInbox(res.data);
    } catch {}
  };

  const sendMessage = async () => {
    if (!text.trim() || (!selectedUser && !isGroupChat)) return;
    try {
      const payload = isGroupChat
        ? { senderId: user._id, groupName, text }
        : { senderId: user._id, receiverId: selectedUser._id, text };

      const url = isGroupChat ? '/api/messages/group' : '/api/messages';
      const res = await axios.post(url, payload);

      setText('');
      setMessages(prev => [...prev, res.data]);
    } catch {}
  };

  const handleGroupCreate = async () => {
    if (!groupName || groupMembers.length < 2) {
      return alert("Group name and at least 2 members required.");
    }
    try {
      await axios.post('/api/messages/group/create', {
        groupName,
        members: groupMembers.map(m => m._id),
      });
      setIsGroupChat(true);
      setSelectedUser(null);
      fetchMessages();
    } catch {
      alert("Failed to create group");
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
          {inbox.map((conv, i) => (
            <div 
              key={i}
              className={`p-3 rounded cursor-pointer hover:bg-gray-100 mb-2 ${
                selectedUser?._id === conv.user?._id ? 'bg-blue-50' : ''
              }`}
              onClick={() => {
                setSelectedUser(conv.user);
                setIsGroupChat(false);
              }}
            >
              <div className="flex justify-between">
                <span>{conv.user?.username}</span>
                {conv.unreadCount > 0 && (
                  <span className="bg-red-500 text-white text-xs rounded-full px-2">
                    {conv.unreadCount}
                  </span>
                )}
              </div>
              <div className="text-sm text-gray-600 truncate">
                {conv.lastMessage?.text}
              </div>
            </div>
          ))}
        </div>

        {/* Search + Groups */}
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex mb-4">
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

          {searchResults.map((u) => (
            <div
              key={u._id}
              className="p-3 rounded cursor-pointer hover:bg-gray-100"
              onClick={() => {
                setSelectedUser(u);
                setIsGroupChat(false);
              }}
            >
              <div>{u.username}</div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (!groupMembers.some(m => m._id === u._id)) {
                    setGroupMembers(prev => [...prev, u]);
                  }
                }}
                className="text-xs text-green-600 mt-1"
              >
                Add to group
              </button>
            </div>
          ))}

          <div className="mt-6 border-t pt-4">
            <h3 className="font-medium mb-2">Create Group</h3>
            <input
              type="text"
              placeholder="Group name"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              className="w-full border p-2 rounded mb-2"
            />
            <div className="mb-2 text-sm">
              Members: {groupMembers.map(m => <span key={m._id} className="mr-1">{m.username}</span>)}
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

        {/* Chat */}
        <div className="md:col-span-2 bg-white rounded-lg shadow flex flex-col">
          {(selectedUser || isGroupChat) ? (
            <>
              <div className="border-b p-4">
                <h2 className="font-bold">
                  {isGroupChat ? `Group: ${groupName}` : `Chat with ${selectedUser?.username}`}
                </h2>
              </div>

              <div className="flex-1 p-4 overflow-y-auto" style={{ maxHeight: '60vh' }}>
                {messages.length === 0 && <p className="text-gray-400">No messages yet.</p>}
                {messages.map((msg, idx) => (
                  <div key={idx} className={`mb-4 ${msg.senderId?._id === user._id ? 'text-right' : 'text-left'}`}>
                    <div className={`inline-block p-3 rounded-lg ${msg.senderId?._id === user._id ? 'bg-blue-100' : 'bg-gray-100'}`}>
                      <div className="text-sm text-gray-500">{msg.senderId?._id === user._id ? 'You' : msg.senderId?.username}</div>
                      <div>{msg.text}</div>
                      <div className="text-xs text-gray-400">{new Date(msg.timestamp).toLocaleTimeString()}</div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t p-4 flex">
                <input
                  type="text"
                  placeholder="Type a message..."
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                  className="flex-1 border p-2 rounded-l"
                />
                <button onClick={sendMessage} className="bg-blue-600 text-white px-4 py-2 rounded-r">
                  Send
                </button>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-500">
              Select a user or create a group to start chatting
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Messenger;
