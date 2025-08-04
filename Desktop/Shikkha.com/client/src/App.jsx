import { Routes, Route, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import LoginSignup from './pages/LoginSignup';
import Blog from './pages/Blog';
import Messenger from './components/Messenger';
import ForgotPassword from './pages/ForgotPassword';


function App() {
  const location = useLocation();

  // Routes where navbar/footer should be hidden
  const dashboardRoutes = ['/dashboard/admin', '/dashboard/student', '/dashboard/educator'];

  const shouldHideLayout = dashboardRoutes.some(route =>
    location.pathname.startsWith(route)
  );

  return (
    <div className="min-h-screen flex flex-col">
      {/* Navbar */}
      {!shouldHideLayout && <Navbar />}

      {/* Main Routes */}
      <div className="flex-1">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<LoginSignup />} />
          <Route path="/blog" element={<Blog />} />
          <Route path="/messenger" element={<Messenger />} />
          <Route path="/forgot" element={<ForgotPassword />} />
        </Routes>
      </div>

      {/* Footer */}
      {!shouldHideLayout && <Footer />}
    </div>
  );
}

export default App;
