import React, { useRef, useEffect, useState, createContext, useContext } from 'react';
import { BrowserRouter, Routes, Route, useLocation, useNavigate, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './lib/auth';
import { MemberProvider, useMember } from './lib/memberAuth';
import { authAPI, publicAPI } from './lib/api';
import { Toaster } from 'sonner';
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import LoginModal from './components/LoginModal';
import HomePage from './pages/HomePage';
import NewsPage from './pages/NewsPage';
import NewsDetailPage from './pages/NewsDetailPage';
import ReadingListPage from './pages/ReadingListPage';
import GalleryPage from './pages/GalleryPage';
import MapDetailPage from './pages/MapDetailPage';
import CheckoutSuccess from './pages/CheckoutSuccess';
import FeaturedProjectsPage from './pages/FeaturedProjectsPage';
import ConferencesPage, { RecommendedSitesPage } from './pages/MapTypePage';
import DynamicPage from './pages/DynamicPage';
import ServiceDetailPage from './pages/ServiceDetailPage';
import LayoutSubGallery from './components/layouts/LayoutSubGallery';
import AdminLayout from './pages/admin/AdminLayout';
import AdminDashboard from './pages/admin/Dashboard';
import HeroManager from './pages/admin/HeroManager';
import HeroSlideForm from './pages/admin/HeroSlideForm';
import AboutManager from './pages/admin/AboutManager';
import ServicesManager from './pages/admin/ServicesManager';
import BlogManager from './pages/admin/BlogManager';
import BooksManager from './pages/admin/BooksManager';
import MapsManager from './pages/admin/MapsManager';
import GalleryManager from './pages/admin/GalleryManager';
import GalleryAlbumsManager from './pages/admin/GalleryAlbumsManager';
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
import MembersManager from './pages/admin/MembersManager';
import MemberLevelsManager from './pages/admin/MemberLevelsManager';
import MemberTypesManager from './pages/admin/MemberTypesManager';
import MembershipSettingsManager from './pages/admin/MembershipSettingsManager';
import BackupManager from './pages/admin/BackupManager';
import ContactSettingsManager from './pages/admin/ContactSettingsManager';
import LandingContentManager from './pages/admin/LandingContentManager';
import LandingSubscribersManager from './pages/admin/LandingSubscribersManager';
import LandingContactsManager from './pages/admin/LandingContactsManager';
import AdminLoginPage from './pages/admin/AdminLoginPage';
// Membership / My Account
import MemberLogin from './pages/myaccount/MemberLogin';
import MemberRegister from './pages/myaccount/MemberRegister';
import MyAccountLayout from './pages/myaccount/MyAccountLayout';
import MembershipProfile from './pages/myaccount/MembershipProfile';
import MentorshipProfile from './pages/myaccount/MentorshipProfile';
import MySponsor from './pages/myaccount/MySponsor';
import InviteCode from './pages/myaccount/InviteCode';
import MyCommunity from './pages/myaccount/MyCommunity';
import MyEbank from './pages/myaccount/MyEbank';
import PortfolioList from './pages/myaccount/PortfolioList';
import PortfolioDetail from './pages/myaccount/PortfolioDetail';
import PortfolioForm from './pages/myaccount/PortfolioForm';

import LandingPage from './pages/LandingPage';

import { injectThemeColors } from './lib/themeColors';

// Global settings context for colors and theme
export const SettingsContext = createContext({});
export const useSettings = () => useContext(SettingsContext);

export const ThemeContext = createContext('default');
export const useTheme = () => useContext(ThemeContext);

function SettingsProvider({ children }) {
  const [settings, setSettings] = useState({});
  useEffect(() => {
    publicAPI.getSettings().then(r => setSettings(r.data || {})).catch(() => {});
  }, []);

  // Apply CSS variables from theme_colors (new) and colors (legacy)
  useEffect(() => {
    const themeColors = settings.theme_colors || {};
    // Migrate legacy colors.* into website group if theme_colors.website is empty
    if (!themeColors.website && settings.colors) {
      themeColors.website = settings.colors;
    }
    injectThemeColors(themeColors);
  }, [settings.theme_colors, settings.colors]);

  // Dynamic favicon
  useEffect(() => {
    const faviconUrl = settings.favicon;
    if (!faviconUrl) return;
    const src = faviconUrl.startsWith('/api') ? `${process.env.REACT_APP_BACKEND_URL}${faviconUrl}` : faviconUrl;
    let link = document.querySelector("link[rel~='icon']");
    if (!link) {
      link = document.createElement('link');
      link.rel = 'icon';
      document.head.appendChild(link);
    }
    link.href = src;
  }, [settings.favicon]);

  // Dynamic page title from tagline
  useEffect(() => {
    if (settings.tagline) {
      document.title = settings.tagline;
    } else if (settings.brand_name) {
      document.title = settings.brand_name;
    }
  }, [settings.tagline, settings.brand_name]);

  const activeTheme = settings.active_theme || 'default';

  return (
    <SettingsContext.Provider value={settings}>
      <ThemeContext.Provider value={activeTheme}>
        {children}
      </ThemeContext.Provider>
    </SettingsContext.Provider>
  );
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
  if (!user || user.role !== 'admin') return <Navigate to="/admin/login" replace />;
  return children;
}

function PageProtectedRoute({ children }) {
  const { user, loading: authLoading } = useAuth();
  const { member, loading: memberLoading } = useMember();
  const location = useLocation();
  const [pageData, setPageData] = useState(null);
  const [checking, setChecking] = useState(true);
  const [showLogin, setShowLogin] = useState(false);

  useEffect(() => {
    publicAPI.getNavPages().then(r => {
      const pages = r.data || [];
      const path = location.pathname;
      const found = pages.find(p => p.url === path || `/page/${p.id}` === path);
      setPageData(found || null);
      setChecking(false);
    }).catch(() => setChecking(false));
  }, [location.pathname]);

  if (checking || authLoading || memberLoading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin w-8 h-8 border-2 border-[var(--color-accent,#0D9488)] border-t-transparent rounded-full"></div></div>;

  // If page requires login
  if (pageData?.login_required) {
    // Admin bypasses all restrictions
    if (user?.role === 'admin') return children;

    // If member is logged in, check their type's allowed_pages
    if (member) {
      const allowedPages = member._member_type?.allowed_pages || [];
      const pageId = pageData.id;
      if (allowedPages.length > 0 && !allowedPages.includes(pageId)) {
        return (
          <div className="min-h-screen flex items-center justify-center bg-slate-50">
            <div className="text-center max-w-md mx-auto px-6">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--color-primary, #1a2332)' }}>
                <span className="text-white text-2xl" style={{ fontFamily: 'Playfair Display, serif' }}>L</span>
              </div>
              <h2 className="text-xl font-bold mb-2" style={{ color: 'var(--color-heading, #1a2332)', fontFamily: 'Playfair Display, serif' }}>Access Restricted</h2>
              <p className="text-slate-500 text-sm mb-6">Your membership type does not include access to this page.</p>
            </div>
          </div>
        );
      }
      return children;
    }

    // Not logged in at all — show login prompt
    if (!user && !member) {
      return (
        <>
          <div className="min-h-screen flex items-center justify-center bg-slate-50">
            <div className="text-center max-w-md mx-auto px-6">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--color-primary, #1a2332)' }}>
                <span className="text-white text-2xl" style={{ fontFamily: 'Playfair Display, serif' }}>L</span>
              </div>
              <h2 className="text-xl font-bold mb-2" style={{ color: 'var(--color-heading, #1a2332)', fontFamily: 'Playfair Display, serif' }}>Login Required</h2>
              <p className="text-slate-500 text-sm mb-6">You need to be logged in to access this page.</p>
              <button onClick={() => setShowLogin(true)} className="px-6 py-2.5 rounded-sm text-sm font-medium" style={{ backgroundColor: 'var(--color-button-bg, #1a2332)', color: 'var(--color-button-text, #fff)' }} data-testid="page-login-btn">
                Login to Continue
              </button>
            </div>
          </div>
          <LoginModal open={showLogin} onClose={() => setShowLogin(false)} />
        </>
      );
    }
  }

  return children;
}

function MemberRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center bg-[#0d0f14]"><div className="animate-spin w-8 h-8 border-2 border-[#c9a84c] border-t-transparent rounded-full" /></div>;
  if (!user) return <Navigate to="/my-account/login" replace />;
  return children;
}

// Maps system page URLs to their hero page identifiers
const SYSTEM_PAGE_MAP = {
  '/news': 'news',
  '/gallery': 'gallery',
  '/reading-list': 'reading-list',
};

function SystemPageHero() {
  const location = useLocation();
  const [heroSlides, setHeroSlides] = useState([]);
  const pageId = SYSTEM_PAGE_MAP[location.pathname];

  useEffect(() => {
    if (!pageId) { setHeroSlides([]); return; }
    publicAPI.getHeroSlides(pageId).then(r => setHeroSlides(r.data || [])).catch(() => setHeroSlides([]));
  }, [pageId]);

  if (heroSlides.length === 0) return null;

  // Lazy-load HeroSection to avoid circular import issues
  const HeroSection = require('./components/HeroSection').default;
  return <HeroSection slides={heroSlides} />;
}

function ScrollToTop() {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    if (hash) {
      const id = hash.substring(1);
      const tryScroll = (attempts) => {
        const el = document.getElementById(id);
        if (el) { el.scrollIntoView({ behavior: 'smooth' }); }
        else if (attempts > 0) { setTimeout(() => tryScroll(attempts - 1), 200); }
      };
      setTimeout(() => tryScroll(5), 100);
    } else {
      window.scrollTo(0, 0);
    }
  }, [pathname, hash]);
  return null;
}

function useLandingActive(settings) {
  const [active, setActive] = useState(false);
  useEffect(() => {
    if (!settings.landing_page_enabled) { setActive(false); return; }
    const check = () => {
      if (!settings.landing_page_launch_date) { setActive(true); return; }
      const launch = new Date(settings.landing_page_launch_date).getTime();
      setActive(Date.now() < launch);
    };
    check();
    const id = setInterval(check, 1000);
    return () => clearInterval(id);
  }, [settings.landing_page_enabled, settings.landing_page_launch_date]);
  return active;
}

function AppRouter() {
  const location = useLocation();
  const settings = useSettings();
  const landingActive = useLandingActive(settings);

  if (location.hash?.includes('session_id=')) return <AuthCallback />;

  const isMemberArea = location.pathname.startsWith('/my-account');
  const isAdmin = location.pathname.startsWith('/admin');

  if (isMemberArea) {
    return (
      <Routes>
        <Route path="/my-account/login" element={<MemberLogin />} />
        <Route path="/my-account/register" element={<MemberRegister />} />
        <Route path="/my-account" element={<MemberRoute><MyAccountLayout /></MemberRoute>}>
          <Route index element={<Navigate to="/my-account/membership-profile" replace />} />
          <Route path="membership-profile" element={<MembershipProfile />} />
          <Route path="mentorship-profile" element={<MentorshipProfile />} />
          <Route path="my-sponsor" element={<MySponsor />} />
          <Route path="invite-code" element={<InviteCode />} />
          <Route path="ebank" element={<MyEbank />} />
          <Route path="my-community" element={<MyCommunity />} />
          <Route path="portfolios" element={<PortfolioList />} />
          <Route path="portfolios/new" element={<PortfolioForm />} />
          <Route path="portfolios/:id" element={<PortfolioDetail />} />
          <Route path="portfolios/:id/edit" element={<PortfolioForm />} />
        </Route>
      </Routes>
    );
  }

  // Landing page takes over all non-admin, non-my-account routes
  if (landingActive && !isAdmin) {
    return (
      <Routes>
        <Route path="/admin" element={<ProtectedRoute><AdminLayout /></ProtectedRoute>}>
          <Route index element={<AdminDashboard />} />
          <Route path="hero" element={<HeroManager />} />
          <Route path="hero/add" element={<HeroSlideForm />} />
          <Route path="hero/edit/:id" element={<HeroSlideForm />} />
          <Route path="about" element={<AboutManager />} />
          <Route path="services" element={<ServicesManager />} />
          <Route path="blog" element={<BlogManager />} />
          <Route path="books" element={<BooksManager />} />
          <Route path="maps" element={<MapsManager />} />
          <Route path="gallery" element={<GalleryManager />} />
          <Route path="gallery-albums" element={<GalleryAlbumsManager />} />
          <Route path="portfolio" element={<PortfolioManager />} />
          <Route path="testimonials" element={<TestimonialsManager />} />
          <Route path="contacts" element={<ContactsManager />} />
          <Route path="contact-settings" element={<ContactSettingsManager />} />
          <Route path="purchases" element={<PurchasesManager />} />
          <Route path="settings" element={<SettingsManager />} />
          <Route path="pages" element={<PagesManager />} />
          <Route path="users" element={<UsersManager />} />
          <Route path="members" element={<MembersManager />} />
          <Route path="member-levels" element={<MemberLevelsManager />} />
          <Route path="member-types" element={<MemberTypesManager />} />
          <Route path="membership-settings" element={<MembershipSettingsManager />} />
          <Route path="analytics" element={<AnalyticsDashboard />} />
          <Route path="seo" element={<SeoManager />} />
          <Route path="backup" element={<BackupManager />} />
          <Route path="section-order" element={<SectionOrderManager />} />
          <Route path="landing-content" element={<LandingContentManager />} />
          <Route path="landing-subscribers" element={<LandingSubscribersManager />} />
          <Route path="landing-contacts" element={<LandingContactsManager />} />
        </Route>
        <Route path="/admin/login" element={<AdminLoginPage />} />
        <Route path="*" element={<LandingPage />} />
      </Routes>
    );
  }

  return (
    <>
      <ScrollToTop />
      <Navbar />
      <SystemPageHero />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/news" element={<NewsPage />} />
        <Route path="/news/:slug" element={<NewsDetailPage />} />
        <Route path="/reading-list" element={<ReadingListPage />} />
        <Route path="/gallery" element={<GalleryPage />} />
        <Route path="/map/:slug" element={<MapDetailPage />} />
        <Route path="/service/:serviceId" element={<ServiceDetailPage />} />
        <Route path="/featured-projects" element={<FeaturedProjectsPage />} />
        <Route path="/conferences" element={<ConferencesPage />} />
        <Route path="/recommended_sites" element={<RecommendedSitesPage />} />
        <Route path="/album/:albumId" element={<LayoutSubGallery />} />
        <Route path="/terms" element={<PageProtectedRoute><DynamicPage /></PageProtectedRoute>} />
        <Route path="/privacy" element={<PageProtectedRoute><DynamicPage /></PageProtectedRoute>} />
        <Route path="/checkout/success" element={<CheckoutSuccess />} />
        <Route path="/page/:pageId" element={<PageProtectedRoute><DynamicPage /></PageProtectedRoute>} />
        <Route path="/admin/login" element={<AdminLoginPage />} />
        <Route path="/admin" element={<ProtectedRoute><AdminLayout /></ProtectedRoute>}>
          <Route index element={<AdminDashboard />} />
          <Route path="hero" element={<HeroManager />} />
          <Route path="hero/add" element={<HeroSlideForm />} />
          <Route path="hero/edit/:id" element={<HeroSlideForm />} />
          <Route path="about" element={<AboutManager />} />
          <Route path="services" element={<ServicesManager />} />
          <Route path="blog" element={<BlogManager />} />
          <Route path="books" element={<BooksManager />} />
          <Route path="maps" element={<MapsManager />} />
          <Route path="gallery" element={<GalleryManager />} />
          <Route path="gallery-albums" element={<GalleryAlbumsManager />} />
          <Route path="portfolio" element={<PortfolioManager />} />
          <Route path="testimonials" element={<TestimonialsManager />} />
          <Route path="contacts" element={<ContactsManager />} />
          <Route path="contact-settings" element={<ContactSettingsManager />} />
          <Route path="purchases" element={<PurchasesManager />} />
          <Route path="settings" element={<SettingsManager />} />
          <Route path="pages" element={<PagesManager />} />
          <Route path="users" element={<UsersManager />} />
          <Route path="members" element={<MembersManager />} />
          <Route path="member-levels" element={<MemberLevelsManager />} />
          <Route path="member-types" element={<MemberTypesManager />} />
          <Route path="membership-settings" element={<MembershipSettingsManager />} />
          <Route path="analytics" element={<AnalyticsDashboard />} />
          <Route path="seo" element={<SeoManager />} />
          <Route path="backup" element={<BackupManager />} />
          <Route path="section-order" element={<SectionOrderManager />} />
          <Route path="landing-content" element={<LandingContentManager />} />
          <Route path="landing-subscribers" element={<LandingSubscribersManager />} />
          <Route path="landing-contacts" element={<LandingContactsManager />} />
        </Route>
        {/* Catch-all: custom page URLs like /kls */}
        <Route path="*" element={<PageProtectedRoute><DynamicPage /></PageProtectedRoute>} />
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
          <MemberProvider>
            <AppRouter />
            <Toaster position="top-right" richColors />
          </MemberProvider>
        </SettingsProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
