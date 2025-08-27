import React, { createContext, useState, useEffect, useContext } from 'react';

const UserContext = createContext(null);

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  const SERVER_ORIGIN = 'http://localhost:4000';
  const normalizeUser = (u) => {
    if (!u) return null;
    const avatar = u.avatarUrl;
    return {
      ...u,
      avatarUrl: avatar ? (avatar.startsWith('http') ? avatar : `${SERVER_ORIGIN}${avatar}`) : ''
    };
  };

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const parsed = JSON.parse(storedUser);
        setUser(normalizeUser(parsed));
      } catch (error) {
        console.error('Failed to parse user from localStorage', error);
        localStorage.removeItem('user');
      }
    }
  }, []);

  const updateUser = (newUser) => {
    if (newUser) {
      const normalized = normalizeUser(newUser);
      localStorage.setItem('user', JSON.stringify(normalized));
      setUser(normalized);
    } else {
      localStorage.removeItem('user');
      setUser(null);
    }
  };

  return (
    <UserContext.Provider value={{ user, updateUser }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};
