import React, { useRef, useEffect, useState, createContext, useContext } from 'react';
import { BrowserRouter, Routes, Route, useLocation, useNavigate, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './lib/auth';
import { authAPI, publicAPI } from './lib/api';
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
import DynamicPage from './pages/DynamicPage';
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
import PagesManager from './pages/admin/PagesManager';
import UsersManager from './pages/admin/UsersManager';
import AnalyticsDashboard from './pages/admin/AnalyticsDashboard';
import SeoManager from './pages/admin/SeoManager';
import SectionOrderManager from './pages/admin/SectionOrderManager';

// Global settings context for colors
export const SettingsContext = createContext({});
export const useSettings = () => useContext(SettingsContext);

function SettingsProvider({ children }) {
  const [settings, setSettings] = useState({});
  useEffect(() => {
    publicAPI.getSettings().then(r => setSettings(r.data || {})).catch(() => {});
  }, []);

  // Apply CSS variables from settings colors
  useEffect(() => {
    const colors = settings.colors || {};
    const root = document.documentElement;
    if (colors.primary) root.style.setProperty('--color-primary', colors.primary);
    if (colors.accent) root.style.setProperty('--color-accent', colors.accent);
    if (colors.button_bg) root.style.setProperty('--color-button-bg', colors.button_bg);
    if (colors.button_text) root.style.setProperty('--color-button-text', colors.button_text);
    if (colors.link_color) root.style.setProperty('--color-link', colors.link_color);
    if (colors.tab_active_bg) root.style.setProperty('--color-tab-active-bg', colors.tab_active_bg);
    if (colors.tab_active_text) root.style.setProperty('--color-tab-active-text', colors.tab_active_text);
    if (colors.icon_color) root.style.setProperty('--color-icon', colors.icon_color);
    if (colors.heading_color) root.style.setProperty('--color-heading', colors.heading_color);
    if (colors.body_text) root.style.setProperty('--color-body-text', colors.body_text);
    if (colors.footer_bg) root.style.setProperty('--color-footer-bg', colors.footer_bg);
    if (colors.footer_text) root.style.setProperty('--color-footer-text', colors.footer_text);
  }, [settings.colors]);

  return <SettingsContext.Provider value={settings}>{children}</SettingsContext.Provider>;
}

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
      } catch { navigate('/', { replace: true }); }
    })();
  }, [navigate, setUserData]);
  return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin w-8 h-8 border-2 border-[var(--color-accent,#0D9488)] border-t-transparent rounded-full"></div></div>;
}

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin w-8 h-8 border-2 border-[var(--color-accent,#0D9488)] border-t-transparent rounded-full"></div></div>;
  if (!user || user.role !== 'admin') return <Navigate to="/" replace />;
  return children;
}

function AppRouter() {
  const location = useLocation();
  if (location.hash?.includes('session_id=')) return <AuthCallback />;
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
        <Route path="/page/:pageId" element={<DynamicPage />} />
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
          <Route path="pages" element={<PagesManager />} />
          <Route path="users" element={<UsersManager />} />
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
        <SettingsProvider>
          <AppRouter />
          <Toaster position="top-right" richColors />
        </SettingsProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
