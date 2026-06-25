import { useState } from 'react';
import {
  LayoutDashboard, Users, CreditCard, ClipboardCheck, Dumbbell,
  BarChart3, Settings, Zap, LogOut, Award, ChevronLeft, ChevronRight,
  Wallet, PieChart, Users2, ShieldAlert, Database, Search, Bell, MessageCircle
} from 'lucide-react';

interface SidebarProps {
  currentPage: string;
  onPageChange: (page: string) => void;
  onLogout: () => void;
  userRole?: string;
  userName?: string;
}

const menuGroups = [
  {
    title: 'Operations',
    items: [
      { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['Super Admin', 'Staff'], color: '#fbbf24' },
      { id: 'renewals', label: 'Renewal Center', icon: CreditCard, roles: ['Super Admin', 'Staff'], color: '#fb923c' },
      { id: 'members', label: 'Members CRM', icon: Users, roles: ['Super Admin', 'Trainer', 'Staff'], color: '#60a5fa' },
      { id: 'attendance', label: 'Attendance', icon: ClipboardCheck, roles: ['Super Admin', 'Trainer', 'Staff'], color: '#fb923c' },
      { id: 'routines', label: 'Workouts & Diets', icon: Dumbbell, roles: ['Super Admin', 'Trainer'], color: '#a78bfa' },
      { id: 'trainers', label: 'Coaches', icon: Award, roles: ['Super Admin'], color: '#f472b6' },
    ]
  },
  {
    title: 'Business',
    items: [
      { id: 'leads', label: 'Lead Pipeline', icon: Users2, roles: ['Super Admin', 'Staff'], color: '#f43f5e' },
      { id: 'payments', label: 'Payments', icon: CreditCard, roles: ['Super Admin', 'Staff'], color: '#34d399' },
      { id: 'expenses', label: 'Expenses', icon: Wallet, roles: ['Super Admin'], color: '#f87171' },
      { id: 'insights', label: 'Business Insights', icon: PieChart, roles: ['Super Admin'], color: '#22d3ee' },
    ]
  },
  {
    title: 'System',
    items: [
      { id: 'whatsapp-hub', label: 'WhatsApp Hub', icon: MessageCircle, roles: ['Super Admin', 'Staff'], color: '#4ade80' },
      { id: 'automation', label: 'Automation', icon: Zap, roles: ['Super Admin'], color: '#38bdf8' },
      { id: 'visitors', label: 'Visitor Log', icon: ShieldAlert, roles: ['Super Admin', 'Staff'], color: '#fbbf24' },
      { id: 'backup', label: 'Backups', icon: Database, roles: ['Super Admin'], color: '#a3e635' },
      { id: 'settings', label: 'Settings', icon: Settings, roles: ['Super Admin', 'Trainer', 'Staff'], color: '#94a3b8' },
    ]
  }
];

export default function Sidebar({ currentPage, onPageChange, onLogout, userRole = 'Super Admin', userName = 'Admin' }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const initials = userName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  return (
    <aside
      style={{
        width: isCollapsed ? '68px' : '232px',
        background: '#0a0a0a',
        borderRight: '1px solid rgba(24,24,27,0.9)',
        transition: 'width 0.3s cubic-bezier(0.23,1,0.32,1)',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        zIndex: 20,
        flexShrink: 0,
      }}
    >
      {/* Brand */}
      <div style={{ height: '68px', display: 'flex', alignItems: 'center', padding: isCollapsed ? '0' : '0 20px', justifyContent: isCollapsed ? 'center' : 'flex-start', borderBottom: '1px solid rgba(24,24,27,0.5)', overflow: 'hidden' }}>
        <div style={{ width: '30px', height: '30px', background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Zap style={{ width: 16, height: 16, color: '#000', fill: '#000' }} />
        </div>
        <div style={{ marginLeft: '12px', opacity: isCollapsed ? 0 : 1, transition: 'opacity 0.2s', width: isCollapsed ? 0 : 'auto', whiteSpace: 'nowrap' }}>
          <h1 style={{ fontFamily: "'Syne', sans-serif", fontSize: '15px', fontWeight: 800, color: 'var(--foreground)', margin: 0, letterSpacing: '-0.02em' }}>TTZ FITNESS</h1>
          <p style={{ fontSize: '10px', color: 'var(--muted-foreground)', margin: '0', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>Management OS</p>
        </div>
      </div>

      {/* Nav Items */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 12px' }} className="custom-scrollbar">
        {menuGroups.map((group, gIdx) => {
          const filteredItems = group.items.filter(item => item.roles.includes(userRole) || userRole === 'Super Admin');
          if (filteredItems.length === 0) return null;

          return (
            <div key={gIdx} style={{ marginBottom: '24px' }}>
              {!isCollapsed && (
                <div style={{ padding: '0 10px', marginBottom: '8px', fontSize: '10px', fontWeight: 700, color: 'var(--muted-foreground)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  {group.title}
                </div>
              )}
              {filteredItems.map(item => {
                const isActive = currentPage === item.id || (currentPage === 'member-profile' && item.id === 'members');
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => onPageChange(item.id)}
                    title={isCollapsed ? item.label : undefined}
                    style={{
                      width: '100%',
                      display: 'flex', alignItems: 'center',
                      justifyContent: isCollapsed ? 'center' : 'flex-start',
                      padding: isCollapsed ? '10px 0' : '10px 12px',
                      marginBottom: '4px', borderRadius: '10px',
                      background: isActive ? 'rgba(250,250,250,0.06)' : 'transparent',
                      border: 'none', color: isActive ? '#fafafa' : '#71717a',
                      cursor: 'pointer', transition: 'all 0.2s', outline: 'none'
                    }}
                    onMouseEnter={e => {
                      if (!isActive) { e.currentTarget.style.color = '#fafafa'; e.currentTarget.style.background = 'rgba(250,250,250,0.03)'; }
                    }}
                    onMouseLeave={e => {
                      if (!isActive) { e.currentTarget.style.color = '#71717a'; e.currentTarget.style.background = 'transparent'; }
                    }}
                  >
                    <div style={{ position: 'relative' }}>
                      <Icon style={{ width: 18, height: 18, color: isActive ? item.color : 'inherit', transition: 'color 0.2s' }} />
                      {isActive && (
                        <div style={{ position: 'absolute', top: '50%', left: '50%', width: '100%', height: '100%', transform: 'translate(-50%, -50%)', background: item.color, filter: 'blur(10px)', opacity: 0.2, borderRadius: '50%' }} />
                      )}
                    </div>
                    {!isCollapsed && <span style={{ marginLeft: '12px', fontSize: '13px', fontWeight: isActive ? 600 : 500, whiteSpace: 'nowrap' }}>{item.label}</span>}
                  </button>
                );
              })}
            </div>
          );
        })}
      </div>

      {/* Footer Profile */}
      <div style={{ padding: '16px 12px', borderTop: '1px solid rgba(24,24,27,0.5)', background: '#0a0a0a' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: isCollapsed ? 'center' : 'space-between', padding: isCollapsed ? '8px 0' : '8px 10px', borderRadius: '10px', background: 'var(--card)', border: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'var(--card)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 700, color: 'var(--foreground)', flexShrink: 0 }}>
              {initials}
            </div>
            {!isCollapsed && (
              <div style={{ overflow: 'hidden' }}>
                <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--foreground)', margin: 0, whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>{userName}</p>
                <p style={{ fontSize: '10px', color: 'var(--muted-foreground)', margin: '2px 0 0', fontWeight: 500 }}>{userRole}</p>
              </div>
            )}
          </div>
          {!isCollapsed && (
            <button onClick={onLogout} style={{ background: 'transparent', border: 'none', color: 'var(--muted-foreground)', cursor: 'pointer', padding: '6px', borderRadius: '6px' }} title="Logout">
              <LogOut style={{ width: 14, height: 14 }} />
            </button>
          )}
        </div>
      </div>

      {/* Collapse Toggle */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        style={{ position: 'absolute', top: '24px', right: '-12px', width: '24px', height: '24px', borderRadius: '50%', background: 'var(--card)', border: '1px solid var(--border)', color: 'var(--muted-foreground)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 30, boxShadow: '0 4px 12px rgba(0,0,0,0.5)' }}
      >
        {isCollapsed ? <ChevronRight style={{ width: 12, height: 12 }} /> : <ChevronLeft style={{ width: 12, height: 12 }} />}
      </button>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #27272a; border-radius: 4px; }
        .custom-scrollbar:hover::-webkit-scrollbar-thumb { background: #3f3f46; }
      `}</style>
    </aside>
  );
}
