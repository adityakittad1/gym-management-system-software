import { useState, useEffect } from 'react';
import { Bell, Search, ChevronRight, Zap } from 'lucide-react';
import { Toaster } from 'sonner';
import { api, User } from './services/api';
import { useStore } from './store/useStore';
import { useTheme } from 'next-themes';
import { Moon, Sun, Monitor } from 'lucide-react';
import Login from './components/Login';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import Members from './components/Members';
import Payments from './components/Payments';
import Attendance from './components/Attendance';
import Trainers from './components/Trainers';
import Reports from './components/Reports';
import Settings from './components/Settings';
import NotificationsPanel from './components/Notifications';
import WhatsAppReminders from './components/WhatsAppReminders';
import WorkoutDiet from './components/WorkoutDiet';
import MemberPortal from './components/MemberPortal';
import AutomationCenter from './components/AutomationCenter';
import BusinessInsights from './components/BusinessInsights';
import ExpenseManagement from './components/ExpenseManagement';
import Leads from './components/Leads';
import Visitors from './components/Visitors';
import BackupCenter from './components/BackupCenter';
import MemberProfile from './components/MemberProfile'; // for future use
import RenewalCenter from './components/RenewalCenter';
import WhatsAppHub from './components/WhatsAppHub';
import ErrorBoundary from './components/ErrorBoundary';

const PAGE_LABELS: Record<string, string> = {
  dashboard: 'Dashboard',
  members: 'Members',
  routines: 'Workouts & Diets',
  payments: 'Payments',
  attendance: 'Attendance',
  trainers: 'Trainers',
  reports: 'Reports',
  settings: 'Settings',
  automation: 'Automation Center',
  insights: 'Business Insights',
  expenses: 'Expense Management',
  leads: 'Lead Pipeline',
  visitors: 'Visitor Log',
  backup: 'Backup Center',
  renewals: 'Renewal Center',
  'whatsapp-hub': 'WhatsApp Automation'
};

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentPage, setCurrentPage] = useState('dashboard');

  const [showNotifications, setShowNotifications] = useState(false);
  const [membersFilter, setMembersFilter] = useState<'all' | 'active' | 'expiring' | 'expired'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [pageKey, setPageKey] = useState(0); // forces re-mount animation
  const { theme, setTheme, systemTheme } = useTheme();

  const fetchInitialData = useStore(state => state.fetchInitialData);
  const notifications = useStore(state => state.notifications);
  const unreadCount = notifications.filter((n) => n.isRead === 0).length;

  useEffect(() => {
    // Check real Supabase session on load
    api.auth.getSession().then((res) => {
      if (res.success && res.user) {
        setCurrentUser(res.user);
        setIsLoggedIn(true);
        setCurrentPage(res.user.role === 'Member' ? 'member-portal' : 'dashboard');
      } else {
        handleLogout();
      }
    }).catch(() => handleLogout());
  }, []);

  useEffect(() => {
    if (isLoggedIn && currentUser?.role !== 'Member') {
      fetchInitialData();
    }
  }, [isLoggedIn, currentUser, fetchInitialData]);

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    setIsLoggedIn(true);
    if (user.role === 'Member') {
      setCurrentPage('member-portal');
    } else if (user.role === 'Trainer') {
      setCurrentPage('members');
    } else {
      setCurrentPage('dashboard');
    }
  };

  const handleLogout = async () => {
    try {
      await api.auth.logout();
    } catch { /* ignore */ }
    setCurrentUser(null);
    setIsLoggedIn(false);
    setCurrentPage('dashboard');
  };

  const handlePageChange = (page: string) => {
    setCurrentPage(page);
    setPageKey(k => k + 1);
    if (page === 'members') setMembersFilter('all');
    setSearchQuery('');
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard': return <Dashboard onPageChange={handlePageChange} onFilterChange={setMembersFilter} />;
      case 'members': return <Members defaultFilter={membersFilter} setDefaultFilter={setMembersFilter} searchQuery={searchQuery} />;
      case 'routines': return <WorkoutDiet />;
      case 'payments': return <Payments />;
      case 'attendance': return <Attendance />;
      case 'trainers': return <Trainers />;
      case 'reports': return <Reports />;
      case 'settings': return <Settings />;
      case 'automation': return <AutomationCenter />;
      case 'insights': return <BusinessInsights />;
      case 'expenses': return <ExpenseManagement />;
      case 'leads': return <Leads />;
      case 'visitors': return <Visitors />;
      case 'backup': return <BackupCenter />;
      case 'renewals': return <RenewalCenter />;
      case 'whatsapp-hub': return (
        <ErrorBoundary fallbackTitle="WhatsApp Hub Error">
          <WhatsAppHub />
        </ErrorBoundary>
      );
      case 'member-profile': return <MemberProfile onBack={() => handlePageChange('members')} />;
      default: return <Dashboard onPageChange={handlePageChange} onFilterChange={setMembersFilter} />;
    }
  };

  if (!isLoggedIn || !currentUser) {
    return (
      <>
        <Toaster
          theme={theme === 'dark' ? 'dark' : 'light'}
          position="top-right"
          toastOptions={{
            style: {
              background: 'var(--background)',
              border: '1px solid var(--border)',
              color: 'var(--foreground)',
              borderRadius: '12px',
              fontSize: '13px',
              fontWeight: '500',
            },
          }}
        />
        <Login onLogin={handleLogin} />
      </>
    );
  }

  if (currentUser.role === 'Member') {
    return (
      <>
        <Toaster theme={theme === 'dark' ? 'dark' : 'light'} position="top-right" toastOptions={{ style: { background: 'var(--background)', border: '1px solid var(--border)', color: 'var(--foreground)', borderRadius: '12px' } }} />
        <MemberPortal user={currentUser} onLogout={handleLogout} />
      </>
    );
  }

  const initials = currentUser.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  return (
    <div className="h-screen w-screen flex overflow-hidden font-sans antialiased text-zinc-200"
      style={{ background: 'var(--background)' }}>

      <Toaster
        theme={theme === 'dark' ? 'dark' : 'light'}
        position="top-right"
        toastOptions={{
          style: {
            background: 'var(--background)',
            border: '1px solid var(--border)',
            color: 'var(--foreground)',
            borderRadius: '12px',
            fontSize: '13px',
            fontWeight: '500',
          },
        }}
      />

      {/* Sidebar */}
      <Sidebar
        currentPage={currentPage}
        onPageChange={handlePageChange}
        onLogout={handleLogout}
        userRole={currentUser.role}
        userName={currentUser.name}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        
        {/* Premium Navbar */}
        <header className="h-[60px] flex-shrink-0 flex items-center justify-between px-6 z-10 relative"
          style={{
            background: 'var(--header-bg)',
            backdropFilter: 'blur(20px)',
            borderBottom: '1px solid var(--border)',
          }}>
          
          {/* Breadcrumb + Page Title */}
          <div className="flex items-center gap-2 text-xs text-zinc-500 font-medium select-none">
            <span className="text-zinc-600">TTZ</span>
            <ChevronRight className="w-3 h-3 text-zinc-700" />
            <span className="text-zinc-300 font-semibold">{PAGE_LABELS[currentPage] || 'Dashboard'}</span>
          </div>

          {/* Center: Global Search */}
          <div className="absolute left-1/2 -translate-x-1/2 w-full max-w-sm px-4">
            <div className="relative group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600 group-focus-within:text-amber-400 transition-colors duration-200" />
              <input
                type="text"
                placeholder="Search members, plans..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full text-sm pl-9 pr-4 py-2 rounded-xl transition-all duration-200 font-medium"
                style={{
                  background: 'var(--card)',
                  border: '1px solid var(--border)',
                  color: '#e4e4e7',
                  outline: 'none',
                }}
                onFocus={e => {
                  e.currentTarget.style.borderColor = 'rgba(251,191,36,0.4)';
                  e.currentTarget.style.boxShadow = '0 0 0 3px rgba(251,191,36,0.08)';
                  e.currentTarget.style.background = 'rgba(17,17,19,1)';
                }}
                onBlur={e => {
                  e.currentTarget.style.borderColor = 'rgba(39,39,42,0.8)';
                  e.currentTarget.style.boxShadow = 'none';
                  e.currentTarget.style.background = 'rgba(24,24,27,0.8)';
                }}
              />
            </div>
          </div>

          {/* Right: Notifications + Profile */}
          <div className="flex items-center gap-3">
            
            {/* Theme Toggle */}
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="relative w-9 h-9 flex items-center justify-center rounded-xl transition-all duration-200"
              style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(251,191,36,0.3)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; }}
              title="Toggle Theme"
            >
              {theme === 'dark' ? <Moon className="w-4 h-4 text-zinc-400" /> : <Sun className="w-4 h-4 text-zinc-600" />}
            </button>

            {/* Notification Bell */}
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative w-9 h-9 flex items-center justify-center rounded-xl transition-all duration-200"
              style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(251,191,36,0.3)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; }}
              title="Notifications"
            >
              <Bell className="w-4 h-4 text-zinc-400" />
              {unreadCount > 0 && (
                <>
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-amber-400 rounded-full" />
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-amber-400 rounded-full animate-ping opacity-75" />
                </>
              )}
            </button>

            {/* Live Indicator */}
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest text-emerald-400"
              style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.15)' }}>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-blink" />
              Live
            </div>

            {/* Profile */}
            <div className="flex items-center gap-2.5 pl-3 select-none"
              style={{ borderLeft: '1px solid rgba(39,39,42,0.6)' }}>
              <div className="text-right hidden sm:block">
                <p className="text-white text-xs font-bold leading-tight">{currentUser.name}</p>
                <p className="text-amber-400 text-[9px] font-bold uppercase tracking-widest leading-tight mt-0.5">
                  {currentUser.role}
                </p>
              </div>
              <div className="w-8 h-8 rounded-xl flex items-center justify-center text-black text-xs font-extrabold uppercase flex-shrink-0"
                style={{
                  background: 'linear-gradient(135deg, #fbbf24, #f59e0b)',
                  boxShadow: '0 2px 12px rgba(251,191,36,0.25)',
                }}>
                {initials}
              </div>
            </div>
          </div>
        </header>

        {/* Page Content with fade animation */}
        <div className="flex-1 overflow-y-auto" style={{ background: 'var(--background)' }}>
          <div key={pageKey} className="page-container min-h-full">
            {renderPage()}
          </div>
        </div>
      </div>

      {/* Notifications Panel */}
      <NotificationsPanel
        isOpen={showNotifications}
        onClose={() => setShowNotifications(false)}
      />
    </div>
  );
}
