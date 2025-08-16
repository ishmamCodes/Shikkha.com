// 📁 src/components/UserSearch.jsx
import React, { useState } from 'react';
import axios from 'axios';

const UserSearch = ({ onSelect }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);

  const search = async () => {
    try {
      const res = await axios.get(`http://localhost:4000/users/search?query=${query}`);
      setResults(res.data);
    } catch (err) {
      console.error('Search failed:', err);
    }
  };

  return (
    <div className="p-4">
      <input
        type="text"
        placeholder="Search name or phone"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="border p-2 mr-2"
      />
      <button onClick={search} className="bg-blue-600 text-white px-3 py-1 rounded">Search</button>

      <ul className="mt-3">
        {results.map((user) => (
          <li key={user._id}>
            <button onClick={() => onSelect(user)} className="text-left w-full text-blue-700 hover:underline">
              {user.name} ({user.phone})
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default UserSearch;
