import { useState, useContext, useEffect } from 'react';
import Login from './components/Login';
import LandingPage from './components/LandingPage';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import DashboardHome from './components/DashboardHome';
import FarmerDashboard from './components/FarmerDashboard';
import OfficerDashboard from './components/OfficerDashboard';
import AnalyticsDashboard from './components/AnalyticsDashboard';
import Chatbot from './components/Chatbot';
import WeatherDashboard from './components/WeatherDashboard';
import BottomNav from './components/BottomNav';
import SettingsPage from './components/SettingsPage';
import AccountPage from './components/AccountPage';
import HelpPage from './components/HelpPage';
import { LanguageContext, LanguageProvider } from './context/LanguageContext.jsx';
import { WeatherProvider } from './context/WeatherContext';

import VerifyEmail from './components/VerifyEmail';

function AppContent() {
  const { lang, setLang } = useContext(LanguageContext);
  const [user, setUser] = useState(null); // { name, rollNo, role }
  const [showLogin, setShowLogin] = useState(false); // New state to toggle Login view
  const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard', 'prediction', 'weather', etc.
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isDesktopSidebarOpen, setIsDesktopSidebarOpen] = useState(true);

  // Simple routing for Verify Email
  if (window.location.pathname === '/verify') {
    return <VerifyEmail />;
  }

  // Check for existing session on mount
  useEffect(() => {
    // Scroll to top on tab change
    const mainEl = document.getElementById('main-scroll-container');
    if (mainEl) {
      mainEl.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [activeTab]);

  useEffect(() => {
    // USER REQUEST: Always redirect to Landing Page on refresh.
    // We intentionally DO NOT restore the session here.
    // const storedUser = localStorage.getItem('user');
    // if (storedUser) {
    //   try {
    //     setUser(JSON.parse(storedUser));
    //   } catch (e) {
    //     console.error("Failed to parse user session", e);
    //     localStorage.removeItem('user');
    //   }
    // }
  }, []);

  const handleLogin = (userData) => {
    setUser(userData);
    setShowLogin(false); // Explicitly hide login view
    setActiveTab('dashboard');
  };

  const handleLogout = () => {
    setUser(null);
    setShowLogin(false);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    setActiveTab('dashboard');
  };

  const handleToggleSidebar = () => {
    if (window.innerWidth < 768) {
      setIsMobileSidebarOpen(true);
    } else {
      setIsDesktopSidebarOpen(prev => !prev);
    }
  };

  // ROUTING LOGIC

  // 1. If not logged in & showLogin is FALSE -> Show Landing Page
  if (!user && !showLogin) {
    return <LandingPage onLoginClick={() => setShowLogin(true)} />;
  }

  // 2. If not logged in & showLogin is TRUE -> Show Login Page
  if (!user && showLogin) {
    return <Login onLogin={handleLogin} onBack={() => setShowLogin(false)} />;
  }

  // 3. User is logged in -> Show Dashboard (Main App)
  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardHome user={user} />;
      case 'prediction':
        return user.role === 'officer' ? <OfficerDashboard /> : <FarmerDashboard />;
      case 'weather':
        return <WeatherDashboard />;
      case 'analytics':
        return <AnalyticsDashboard />;
      case 'chat':
        return <Chatbot />;
      case 'settings':
        return <SettingsPage />;
      case 'account':
        return <AccountPage user={user} onUpdateUser={setUser} />;
      case 'help':
        return <HelpPage />;
      default:
        return <div className="p-10 text-center text-gray-500">Page not found</div>;
    }
  };

  return (
    <WeatherProvider>
      <div className="h-screen overflow-hidden bg-gray-50 flex font-sans relative">
        {/* Sidebar Navigation */}
        <Sidebar
          activeTab={activeTab}
          onTabChange={setActiveTab}
          onLogout={handleLogout}
          isMobileOpen={isMobileSidebarOpen}
          isDesktopOpen={isDesktopSidebarOpen}
          onCloseMobile={() => setIsMobileSidebarOpen(false)}
          userRole={user.role}
        />

        {/* Main Content Area */}
        <div className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${isDesktopSidebarOpen ? 'md:ml-64' : 'md:ml-0'} mb-16 md:mb-0`}>
          {/* Header — fixed on mobile so it never scrolls away */}
          <div className="fixed top-0 left-0 right-0 z-40 md:static md:z-auto">
            <Header
              user={user}
              onMenuClick={handleToggleSidebar}
              onProfileClick={() => setActiveTab('account')}
            />
          </div>

          {/* Spacer to push content below fixed header on mobile */}
          <div className="h-16 md:hidden shrink-0" />

          {/* Scrollable Content */}
          <main id="main-scroll-container" className="flex-1 overflow-y-auto flex flex-col min-h-0">
            <div className={`${activeTab === 'chat' || activeTab === 'weather' ? 'flex-1 flex flex-col min-h-0' : 'p-4 md:p-6 max-w-7xl mx-auto w-full'}`}>
              {renderContent()}
            </div>
          </main>
        </div>

        {/* Mobile Bottom Navigation */}
        <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
      </div>
    </WeatherProvider>
  );
}

export default function App() {
  return (
    <LanguageProvider>
      <AppContent />
    </LanguageProvider>
  );
}
