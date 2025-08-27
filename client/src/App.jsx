import { Routes, Route, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import LoginSignup from './pages/LoginSignup';
import Blog from './pages/Blog';
import Messenger from './components/Messenger';
import ForgotPassword from './pages/ForgotPassword';
import EducatorDashboard from './features/educator/pages/EducatorDashboard.jsx';
import StudentDashboard from './features/student/pages/StudentDashboard.jsx';
import AdminDashboard from './features/admin/pages/AdminDashboard.jsx';
import ProtectedAdminRoute from './features/admin/components/ProtectedAdminRoute.jsx';
import CoursesPage from './pages/CoursesPage.jsx';
import CourseDetailsPage from './features/catalog/pages/CourseDetailsPage.jsx';
import BooksPage from './features/marketplace/pages/BooksPage.jsx';
import BookDetailsPage from './features/marketplace/pages/BookDetailsPage.jsx';
import CartPage from './features/marketplace/pages/CartPage.jsx';
import ProtectedRoute from './components/ProtectedRoute';
import VideoList from './pages/VideoList.jsx';
import VideoUpload from './pages/VideoUpload.jsx';
import PaymentSuccess from './pages/PaymentSuccess.jsx';
import PaymentCancel from './pages/PaymentCancel.jsx';
import { Toaster } from 'react-hot-toast';
import Instructors from './pages/Instructors.jsx';

function App() {
  const location = useLocation();

  // Routes where navbar/footer should be hidden
  // Keep all dashboards (student, educator, admin) inside global layout
  const dashboardRoutes = ['/login'];

  const shouldHideLayout = dashboardRoutes.some(route =>
    location.pathname.startsWith(route)
  );

  return (
    <div className="min-h-screen flex flex-col">
      {/* Navbar */}
      {!shouldHideLayout && <Navbar />}
      {/* Global Toaster */}
      <Toaster position="top-right" />

      {/* Main Routes */}
      <div className="flex-1">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<LoginSignup />} />
          <Route path="/blog" element={<Blog />} />
          <Route path="/messenger" element={<ProtectedRoute><Messenger /></ProtectedRoute>} />
          <Route path="/forgot" element={<ForgotPassword />} />
          <Route path="/dashboard/educator/*" element={<ProtectedRoute><EducatorDashboard /></ProtectedRoute>} />
          <Route path="/dashboard/student/*" element={<ProtectedRoute><StudentDashboard /></ProtectedRoute>} />

          {/* Admin Routes */}
          <Route path="/admin/dashboard/*" element={<ProtectedAdminRoute><AdminDashboard /></ProtectedAdminRoute>} />

          {/* Catalog Routes */}
          <Route path="/courses" element={<CoursesPage />} />
          <Route path="/courses/:id" element={<CourseDetailsPage />} />

          {/* Marketplace Routes */}
          <Route path="/library" element={<ProtectedRoute><BooksPage /></ProtectedRoute>} />
          <Route path="/library/:id" element={<ProtectedRoute><BookDetailsPage /></ProtectedRoute>} />
          <Route path="/cart" element={<ProtectedRoute><CartPage /></ProtectedRoute>} />
          
          {/* Video Routes */}
          <Route path="/videos" element={<VideoList />} />
          <Route path="/instructors" element={<Instructors />} />
          <Route path="/videos/upload" element={<ProtectedRoute><VideoUpload /></ProtectedRoute>} />
          
          {/* Payment Routes */}
          <Route path="/payment-success" element={<PaymentSuccess />} />
          <Route path="/payment-cancel" element={<PaymentCancel />} />
        </Routes>
      </div>

      {/* Footer */}
      {!shouldHideLayout && <Footer />}
    </div>
  );
}

export default App;
