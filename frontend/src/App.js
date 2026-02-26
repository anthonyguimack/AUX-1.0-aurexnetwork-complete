import React, { useRef, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation, useNavigate, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './lib/auth';
import { authAPI } from './lib/api';
import { Toaster } from 'sonner';
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import HomePage from './pages/HomePage';
import NewsPage from './pages/NewsPage';
import NewsDetailPage from './pages/NewsDetailPage';
import ReadingListPage from './pages/ReadingListPage';
import GalleryPage from './pages/GalleryPage';
import MapDetailPage from './pages/MapDetailPage';
import TermsPage from './pages/TermsPage';
import PrivacyPage from './pages/PrivacyPage';
import CheckoutSuccess from './pages/CheckoutSuccess';
import AdminLayout from './pages/admin/AdminLayout';
import AdminDashboard from './pages/admin/Dashboard';
import HeroManager from './pages/admin/HeroManager';
import AboutManager from './pages/admin/AboutManager';
import ServicesManager from './pages/admin/ServicesManager';
import BlogManager from './pages/admin/BlogManager';
import BooksManager from './pages/admin/BooksManager';
import MapsManager from './pages/admin/MapsManager';
import GalleryManager from './pages/admin/GalleryManager';
import PortfolioManager from './pages/admin/PortfolioManager';
import TestimonialsManager from './pages/admin/TestimonialsManager';
import ContactsManager from './pages/admin/ContactsManager';
import PurchasesManager from './pages/admin/PurchasesManager';
import SettingsManager from './pages/admin/SettingsManager';

function AuthCallback() {
  const hasProcessed = useRef(false);
  const navigate = useNavigate();
  const { setUserData } = useAuth();

  useEffect(() => {
    if (hasProcessed.current) return;
    hasProcessed.current = true;
    const hash = window.location.hash;
    const sessionId = new URLSearchParams(hash.substring(1)).get('session_id');
    if (!sessionId) { navigate('/'); return; }
    (async () => {
      try {
        const res = await authAPI.exchangeSession(sessionId);
        setUserData(res.data);
        navigate('/', { replace: true });
      } catch {
        navigate('/', { replace: true });
      }
    })();
  }, [navigate, setUserData]);

  return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin w-8 h-8 border-2 border-[#0D9488] border-t-transparent rounded-full"></div></div>;
}

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin w-8 h-8 border-2 border-[#0D9488] border-t-transparent rounded-full"></div></div>;
  if (!user || user.role !== 'admin') return <Navigate to="/" replace />;
  return children;
}

function AppRouter() {
  const location = useLocation();
  // Check URL fragment for session_id synchronously before routes render
  if (location.hash?.includes('session_id=')) {
    return <AuthCallback />;
  }
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/news" element={<NewsPage />} />
        <Route path="/news/:slug" element={<NewsDetailPage />} />
        <Route path="/reading-list" element={<ReadingListPage />} />
        <Route path="/gallery" element={<GalleryPage />} />
        <Route path="/map/:slug" element={<MapDetailPage />} />
        <Route path="/terms" element={<TermsPage />} />
        <Route path="/privacy" element={<PrivacyPage />} />
        <Route path="/checkout/success" element={<CheckoutSuccess />} />
        <Route path="/admin" element={<ProtectedRoute><AdminLayout /></ProtectedRoute>}>
          <Route index element={<AdminDashboard />} />
          <Route path="hero" element={<HeroManager />} />
          <Route path="about" element={<AboutManager />} />
          <Route path="services" element={<ServicesManager />} />
          <Route path="blog" element={<BlogManager />} />
          <Route path="books" element={<BooksManager />} />
          <Route path="maps" element={<MapsManager />} />
          <Route path="gallery" element={<GalleryManager />} />
          <Route path="portfolio" element={<PortfolioManager />} />
          <Route path="testimonials" element={<TestimonialsManager />} />
          <Route path="contacts" element={<ContactsManager />} />
          <Route path="purchases" element={<PurchasesManager />} />
          <Route path="settings" element={<SettingsManager />} />
        </Route>
      </Routes>
      <Footer />
    </>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRouter />
        <Toaster position="top-right" richColors />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
