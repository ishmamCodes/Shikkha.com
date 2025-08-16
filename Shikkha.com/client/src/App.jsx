import { Routes, Route, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import LoginSignup from './pages/LoginSignup';
import Blog from './pages/Blog';
import VideoList from "./pages/VideoList";
import VideoUpload from "./pages/VideoUpload";
import Messenger from './components/Messenger';
import ForgotPassword from './pages/ForgotPassword';
import EducatorDashboard from './features/educator/pages/EducatorDashboard.jsx';

function App() {
  const location = useLocation();
  const userToken = localStorage.getItem("token");

  // Routes where navbar/footer should be hidden
  const dashboardRoutes = [
    '/dashboard/admin',
    '/login', '/forgot'
  ];

  const shouldHideLayout = dashboardRoutes.some(route =>
    location.pathname.startsWith(route)
  );

  return (
    <div className="min-h-screen flex flex-col">
      <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
      {/* Navbar */}
      {!shouldHideLayout && <Navbar />}

      {/* Main Routes */}
      <div className="flex-1">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<LoginSignup />} />
          <Route path="/blog" element={<Blog />} />
          <Route path="/messenger" element={<Messenger />} />
          <Route path="/videos" element={<VideoList />} />
          <Route path="/videos/upload" element={<VideoUpload token={userToken} />} />
          <Route path="/forgot" element={<ForgotPassword />} />
          <Route path="/dashboard/educator/*" element={<EducatorDashboard />} />
        </Routes>
      </div>

      {/* Footer */}
      {!shouldHideLayout && <Footer />}
    </div>
  );
}

export default App;
