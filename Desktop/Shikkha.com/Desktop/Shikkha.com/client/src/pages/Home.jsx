import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const Home = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user'));

    if (user?.role) {
      switch (user.role) {
        case 'admin':
          navigate('/');
          break;
        case 'educator':
          navigate('/');
          break;
        case 'student':
          navigate('/');
          break;
        default:
          navigate('/login');
      }
    } else {
      navigate('/login');
    }
  }, [navigate]);

  return <div className="text-center mt-10">Dashboard or Home Page Yet Not Implemented...</div>;
};

export default Home;
