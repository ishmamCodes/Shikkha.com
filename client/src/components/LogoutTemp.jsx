import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const LogoutTemp = () => {
  const navigate = useNavigate();

  useEffect(() => {
    localStorage.clear(); // clear token, user, etc.
    navigate('/login');
  }, [navigate]);

  return null;
};

export default LogoutTemp;
