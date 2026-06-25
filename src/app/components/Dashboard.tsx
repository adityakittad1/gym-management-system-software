import { useState, useEffect, useRef } from 'react';
import {
  Users, UserCheck, UserX, Calendar, TrendingUp, TrendingDown,
  UserPlus, CreditCard, RefreshCw, ClipboardCheck,
  AlertTriangle, Send, Dumbbell, ArrowUpRight, Activity,
  Zap, Clock, Eye, CheckCircle, Bell, X, ChevronRight,
  DollarSign, UserMinus
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer
} from 'recharts';
import { api, ActivityRecord, DashboardStats, ChartData, Member, Payment, ActionItem } from '../services/api';
import { useStore } from '../store/useStore';
import { toast } from 'sonner';

interface DashboardProps {
  onPageChange?: (page: string) => void;
  onFilterChange?: (filter: 'all' | 'active' | 'expiring' | 'expired') => void;
}

/* ---- Count-Up Hook ---- */
function useCountUp(target: number, duration = 1200) {
  const [count, setCount] = useState(0);
  const frameRef = useRef<number>();
  useEffect(() => {
    const start = performance.now();
    const animate = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(eased * target));
      if (progress < 1) frameRef.current = requestAnimationFrame(animate);
    };
    frameRef.current = requestAnimationFrame(animate);
    return () => { if (frameRef.current) cancelAnimationFrame(frameRef.current); };
  }, [target, duration]);
  return count;
}

/* ---- Premium Tooltip ---- */
const PremiumTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: 'var(--background)',
      border: '1px solid var(--border)',
      borderRadius: '14px',
      padding: '14px 18px',
      boxShadow: '0 12px 40px rgba(0,0,0,0.7)',
      minWidth: '150px',
    }}>
      <p style={{ color: 'var(--muted-foreground)', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '10px' }}>{label}</p>
      {payload.map((entry: any) => (
        <div key={entry.name} style={{ display: 'flex', justifyContent: 'space-between', gap: '20px', alignItems: 'center', marginBottom: '4px' }}>
          <span style={{ color: entry.color, fontSize: '12px', fontWeight: 600 }}>{entry.name}</span>
          <span style={{ color: 'var(--foreground)', fontSize: '13px', fontWeight: 700, fontFamily: "'JetBrains Mono', monospace" }}>
            {entry.name.toLowerCase().includes('revenue') || entry.name.toLowerCase().includes('expense')
              ? `₹${entry.value.toLocaleString()}`
              : entry.value}
          </span>
        </div>
      ))}
    </div>
  );
};

/* ---- KPI Card ---- */
interface KPIProps {
  label: string;
  value: number;
  prefix?: string;
  suffix?: string;
  icon: React.ElementType;
  color: string;
  subtitle?: string;
  onClick?: () => void;
  delay?: number;
}

function KPICard({ label, value, prefix = '', suffix = '', icon: Icon, color, subtitle, onClick, delay = 0 }: KPIProps) {
  const count = useCountUp(value);
  const isRevenue = prefix === '₹';
  const displayValue = isRevenue ? `₹${value.toLocaleString('en-IN')}` : `${count.toLocaleString()}${suffix}`;

  return (
    <div
      onClick={onClick}
      className="animate-fade-up"
      style={{
        animationDelay: `${delay}ms`,
        opacity: 0,
        background: 'var(--background)',
        border: '1px solid rgba(30,30,34,0.9)',
        borderRadius: '20px',
        padding: '28px 24px',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'all 0.3s cubic-bezier(0.23,1,0.32,1)',
        position: 'relative',
        overflow: 'hidden',
        minHeight: '140px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
      }}
      onMouseEnter={e => {
        if (onClick) {
          e.currentTarget.style.transform = 'translateY(-4px)';
          e.currentTarget.style.borderColor = color + '30';
          e.currentTarget.style.boxShadow = `0 16px 48px rgba(0,0,0,0.5), 0 0 0 1px ${color}15`;
        }
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.borderColor = 'rgba(30,30,34,0.9)';
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      {/* Ambient glow */}
      <div style={{
        position: 'absolute',
        top: '-30px',
        right: '-30px',
        width: '100px',
        height: '100px',
        borderRadius: '50%',
        background: color,
        opacity: 0.03,
        filter: 'blur(30px)',
        pointerEvents: 'none',
      }} />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{
          width: '44px',
          height: '44px',
          borderRadius: '14px',
          background: `${color}10`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: `1px solid ${color}15`,
        }}>
          <Icon style={{ width: 20, height: 20, color }} />
        </div>
        {onClick && (
          <ArrowUpRight style={{ width: 16, height: 16, color: '#3f3f46', transition: 'color 0.2s' }} />
        )}
      </div>

      <div style={{ marginTop: '20px' }}>
        <p style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: isRevenue ? '22px' : '32px',
          fontWeight: 700,
          color: 'var(--foreground)',
          letterSpacing: '-0.03em',
          lineHeight: 1,
          margin: 0,
        }}>
          {displayValue}
        </p>
        <p style={{ color: 'var(--muted-foreground)', fontSize: '12px', fontWeight: 600, margin: '8px 0 0', letterSpacing: '-0.01em' }}>
          {label}
        </p>
        {subtitle && (
          <p style={{ color: '#3f3f46', fontSize: '11px', fontWeight: 500, margin: '4px 0 0' }}>
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
}

/* ---- Action Card ---- */
interface ActionCardProps {
  action: ActionItem;
  onView: () => void;
  onResolve: () => void;
  onRemind: () => void;
  onDismiss: () => void;
  delay?: number;
}

function ActionCard({ action, onView, onResolve, onRemind, onDismiss, delay = 0 }: ActionCardProps) {
  const iconMap: Record<string, React.ElementType> = {
    'calendar': Calendar,
    'credit-card': CreditCard,
    'user-x': UserMinus,
    'refresh-cw': RefreshCw,
    'clipboard-check': ClipboardCheck,
  };
  const colorMap: Record<string, string> = {
    high: '#fbbf24',
    medium: '#fb923c',
    low: '#60a5fa',
  };

  const Icon = iconMap[action.icon] || AlertTriangle;
  const accentColor = colorMap[action.priority];

  const btnStyle = (color: string): React.CSSProperties => ({
    display: 'flex',
    alignItems: 'center',
    gap: '5px',
    padding: '7px 14px',
    borderRadius: '10px',
    background: `${color}08`,
    border: `1px solid ${color}20`,
    color: color,
    fontSize: '11px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    outline: 'none',
    letterSpacing: '-0.01em',
  });

  return (
    <div
      className="animate-fade-up"
      style={{
        animationDelay: `${delay}ms`,
        opacity: 0,
        background: 'var(--background)',
        border: '1px solid rgba(30,30,34,0.9)',
        borderRadius: '18px',
        padding: '24px',
        transition: 'all 0.25s cubic-bezier(0.23,1,0.32,1)',
        position: 'relative',
        overflow: 'hidden',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = `${accentColor}25`;
        e.currentTarget.style.boxShadow = `0 8px 32px rgba(0,0,0,0.3)`;
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = 'rgba(30,30,34,0.9)';
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      {/* Priority indicator line */}
      <div style={{
        position: 'absolute',
        left: 0,
        top: '16px',
        bottom: '16px',
        width: '3px',
        borderRadius: '0 3px 3px 0',
        background: accentColor,
        opacity: 0.7,
      }} />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
        <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start', flex: 1 }}>
          <div style={{
            width: '40px',
            height: '40px',
            minWidth: '40px',
            borderRadius: '12px',
            background: `${accentColor}10`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: `1px solid ${accentColor}15`,
          }}>
            <Icon style={{ width: 18, height: 18, color: accentColor }} />
          </div>
          <div>
            <h4 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--foreground)', margin: 0, lineHeight: 1.3, letterSpacing: '-0.01em' }}>
              {action.title}
            </h4>
            <p style={{ fontSize: '12px', color: 'var(--muted-foreground)', margin: '4px 0 0', lineHeight: 1.4 }}>
              {action.description}
            </p>
          </div>
        </div>
        <button
          onClick={onDismiss}
          style={{
            background: 'transparent',
            border: 'none',
            color: '#3f3f46',
            cursor: 'pointer',
            padding: '4px',
            borderRadius: '8px',
            transition: 'all 0.15s ease',
            flexShrink: 0,
          }}
          onMouseEnter={e => { e.currentTarget.style.color = '#71717a'; e.currentTarget.style.background = 'rgba(39,39,42,0.3)'; }}
          onMouseLeave={e => { e.currentTarget.style.color = '#3f3f46'; e.currentTarget.style.background = 'transparent'; }}
          title="Dismiss"
        >
          <X style={{ width: 14, height: 14 }} />
        </button>
      </div>

      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        <button
          onClick={onView}
          style={btnStyle('#60a5fa')}
          onMouseEnter={e => { e.currentTarget.style.background = '#60a5fa15'; e.currentTarget.style.borderColor = '#60a5fa40'; }}
          onMouseLeave={e => { e.currentTarget.style.background = '#60a5fa08'; e.currentTarget.style.borderColor = '#60a5fa20'; }}
        >
          <Eye style={{ width: 12, height: 12 }} /> View
        </button>
        <button
          onClick={onResolve}
          style={btnStyle('#4ade80')}
          onMouseEnter={e => { e.currentTarget.style.background = '#4ade8015'; e.currentTarget.style.borderColor = '#4ade8040'; }}
          onMouseLeave={e => { e.currentTarget.style.background = '#4ade8008'; e.currentTarget.style.borderColor = '#4ade8020'; }}
        >
          <CheckCircle style={{ width: 12, height: 12 }} /> Resolve
        </button>
        <button
          onClick={onRemind}
          style={btnStyle('#fbbf24')}
          onMouseEnter={e => { e.currentTarget.style.background = '#fbbf2415'; e.currentTarget.style.borderColor = '#fbbf2440'; }}
          onMouseLeave={e => { e.currentTarget.style.background = '#fbbf2408'; e.currentTarget.style.borderColor = '#fbbf2420'; }}
        >
          <Bell style={{ width: 12, height: 12 }} /> Remind
        </button>
      </div>
    </div>
  );
}

/* ---- FALLBACK DATA ---- */
const FALLBACK_STATS: DashboardStats = {
  totalMembers: 178, activeMembers: 165, expiredMembers: 13, expiringSoon: 11,
  monthlyRevenue: 67000, pendingPayments: 2, attendanceToday: 6, totalTrainers: 4
};
const FALLBACK_CHARTS: ChartData = {
  revenueData: [
    { month: 'Jan', revenue: 45000, expenses: 18000 },
    { month: 'Feb', revenue: 52000, expenses: 19000 },
    { month: 'Mar', revenue: 48000, expenses: 17500 },
    { month: 'Apr', revenue: 61000, expenses: 20000 },
    { month: 'May', revenue: 55000, expenses: 18500 },
    { month: 'Jun', revenue: 67000, expenses: 21000 },
  ],
  membershipData: [
    { month: 'Jan', members: 120 }, { month: 'Feb', members: 135 },
    { month: 'Mar', members: 142 }, { month: 'Apr', members: 158 },
    { month: 'May', members: 165 }, { month: 'Jun', members: 178 },
  ],
  weeklyStats: [
    { day: 'Mon', count: 85 }, { day: 'Tue', count: 92 }, { day: 'Wed', count: 88 },
    { day: 'Thu', count: 95 }, { day: 'Fri', count: 78 }, { day: 'Sat', count: 102 }, { day: 'Sun', count: 68 },
  ],
  attendanceTrend: [
    { week: 'Week 1', attendance: 420 }, { week: 'Week 2', attendance: 485 },
    { week: 'Week 3', attendance: 510 }, { week: 'Week 4', attendance: 495 },
  ],
};

const FALLBACK_ACTIONS: ActionItem[] = [
  { id: 1, type: 'expiry', priority: 'high', title: '3 memberships expire in 5 days', description: 'Amit Kumar, Priya Patel, Arjun Mehta', count: 3, icon: 'calendar' },
  { id: 2, type: 'payment', priority: 'high', title: '₹2,400 pending collection', description: '2 invoices require payment', count: 2, amount: 2400, icon: 'credit-card' },
  { id: 3, type: 'inactive', priority: 'medium', title: '4 members have not visited in 10 days', description: 'Vikram Singh, Amit Kumar +2 more', count: 4, icon: 'user-x' },
  { id: 4, type: 'renewal', priority: 'medium', title: '1 expired membership needs renewal', description: 'Vikram Singh', count: 1, icon: 'refresh-cw' },
];

/* ---- SKELETON ---- */
function DashboardSkeleton() {
  return (
    <div style={{ padding: '40px', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Greeting skeleton */}
      <div style={{ marginBottom: '48px' }}>
        <div className="animate-pulse" style={{ height: '36px', width: '320px', background: '#151517', borderRadius: '10px', marginBottom: '12px' }} />
        <div className="animate-pulse" style={{ height: '16px', width: '240px', background: '#151517', borderRadius: '8px' }} />
      </div>
      {/* KPI skeletons */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '48px' }}>
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="animate-pulse" style={{ background: 'var(--background)', border: '1px solid rgba(30,30,34,0.9)', borderRadius: '20px', padding: '28px', height: '140px' }} />
        ))}
      </div>
      {/* Action skeletons */}
      <div style={{ marginBottom: '24px' }}>
        <div className="animate-pulse" style={{ height: '20px', width: '180px', background: '#151517', borderRadius: '8px', marginBottom: '20px' }} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="animate-pulse" style={{ background: 'var(--background)', border: '1px solid rgba(30,30,34,0.9)', borderRadius: '18px', padding: '24px', height: '100px' }} />
          ))}
        </div>
      </div>
    </div>
  );
}

/* ---- ACTIVITY ICON ---- */
function activityMeta(type: string): { icon: React.ElementType; color: string; bg: string } {
  switch (type) {
    case 'new_member': return { icon: UserPlus, color: '#60a5fa', bg: 'rgba(96,165,250,0.08)' };
    case 'payment': return { icon: CreditCard, color: '#4ade80', bg: 'rgba(74,222,128,0.08)' };
    case 'renewal': return { icon: RefreshCw, color: '#fbbf24', bg: 'rgba(251,191,36,0.08)' };
    case 'attendance': return { icon: ClipboardCheck, color: '#fb923c', bg: 'rgba(251,146,60,0.08)' };
    default: return { icon: Activity, color: '#a78bfa', bg: 'rgba(167,139,250,0.08)' };
  }
}

/* ============================================================
   MAIN COMPONENT
   ============================================================ */
export default function Dashboard({ onPageChange, onFilterChange }: DashboardProps) {
  const storeLoading = useStore(state => state.loading);
  const getDashboardStats = useStore(state => state.getDashboardStats);
  const getDashboardActions = useStore(state => state.getDashboardActions);
  const getDashboardCharts = useStore(state => state.getDashboardCharts);
  const activities = useStore(state => state.activities);
  
  const stats = getDashboardStats();
  const actions = getDashboardActions();
  const charts = getDashboardCharts();
  
  const [isSendingReminders, setIsSendingReminders] = useState(false);
  const [dismissedActions, setDismissedActions] = useState<number[]>([]);
  const [now, setNow] = useState(new Date());
  const [ownerName, setOwnerName] = useState('Admin');

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60000); // update every minute
    return () => clearInterval(timer);
  }, []);

  // Get owner name from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('ttz_user');
      if (saved) {
        const u = JSON.parse(saved);
        if (u?.name) setOwnerName(u.name.split(' ')[0]); // First name only
      }
    } catch { }
  }, []);

  // Data is loaded via global store and computed synchronously

  const handleActionView = (action: ActionItem) => {
    switch (action.type) {
      case 'expiry':
        onFilterChange?.('expiring');
        onPageChange?.('members');
        break;
      case 'payment':
        onPageChange?.('payments');
        break;
      case 'inactive':
        onFilterChange?.('active');
        onPageChange?.('members');
        break;
      case 'renewal':
        onFilterChange?.('expired');
        onPageChange?.('members');
        break;
      case 'attendance':
        onPageChange?.('attendance');
        break;
    }
  };

  const handleActionResolve = (action: ActionItem) => {
    handleActionView(action);
  };

  const handleActionRemind = async (action: ActionItem) => {
    setIsSendingReminders(true);
    try {
      if (action.type === 'expiry') {
        const res = await api.whatsapp.sendReminders('expiry');
        toast.success(res.message || 'Expiry reminders sent!');
      } else if (action.type === 'payment') {
        const res = await api.whatsapp.sendReminders('payment');
        toast.success(res.message || 'Payment reminders sent!');
      } else if (action.type === 'inactive') {
        const res = await api.whatsapp.sendReminders('attendance');
        toast.success(res.message || 'Attendance reminders sent!');
      } else {
        toast.success('Reminder sent successfully');
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to send reminder');
    } finally {
      setIsSendingReminders(false);
    }
  };

  const handleActionDismiss = (actionId: number) => {
    setDismissedActions(prev => [...prev, actionId]);
  };

  if (storeLoading || !stats || !charts) return <DashboardSkeleton />;

  const hour = now.getHours();
  const greeting = hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening';
  const dateStr = now.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  const visibleActions = actions.filter(a => !dismissedActions.includes(a.id));

  // Calculate today's revenue from stats
  const pendingTotal = stats.pendingPayments;

  return (
    <div style={{ padding: '40px 44px', maxWidth: '1200px', margin: '0 auto' }}>

      {/* ── GREETING ── */}
      <div className="animate-fade-up" style={{ marginBottom: '48px' }}>
        <h1 style={{
          fontFamily: "'Syne', sans-serif",
          fontSize: '32px',
          fontWeight: 800,
          color: 'var(--foreground)',
          letterSpacing: '-0.04em',
          lineHeight: 1.2,
          margin: 0,
        }}>
          {greeting}, {ownerName} <span style={{ fontSize: '28px' }}>👋</span>
        </h1>
        <p style={{
          color: '#3f3f46',
          fontSize: '14px',
          fontWeight: 500,
          margin: '8px 0 0',
          letterSpacing: '-0.01em',
        }}>
          {dateStr} · Here's what needs your attention today
        </p>
      </div>

      {/* ── TODAY'S BUSINESS OVERVIEW ── */}
      <div style={{ marginBottom: '48px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px' }}>
          <h2 style={{
            fontFamily: "'Syne', sans-serif",
            fontSize: '16px',
            fontWeight: 700,
            color: 'var(--muted-foreground)',
            margin: 0,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
          }}>
            Today's Overview
          </h2>
          <div style={{
            height: '1px',
            flex: 1,
            background: 'linear-gradient(90deg, rgba(63,63,70,0.4), transparent)',
          }} />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}
          className="kpi-grid">
          <KPICard
            label="Monthly Revenue"
            value={stats.monthlyRevenue}
            prefix="₹"
            icon={DollarSign}
            color="#fbbf24"
            subtitle="Total collections this month"
            onClick={() => onPageChange?.('payments')}
            delay={0}
          />
          <KPICard
            label="Today's Attendance"
            value={stats.attendanceToday}
            icon={ClipboardCheck}
            color="#60a5fa"
            subtitle={`of ${stats.activeMembers} active members`}
            onClick={() => onPageChange?.('attendance')}
            delay={60}
          />
          <KPICard
            label="Pending Collections"
            value={pendingTotal}
            icon={CreditCard}
            color="#fb923c"
            subtitle={pendingTotal > 0 ? 'Requires follow-up' : 'All clear'}
            onClick={() => onPageChange?.('payments')}
            delay={120}
          />
          <KPICard
            label="Expiring Soon"
            value={stats.expiringSoon}
            icon={Calendar}
            color="#f87171"
            subtitle="Memberships need renewal"
            onClick={() => { onFilterChange?.('expiring'); onPageChange?.('members'); }}
            delay={180}
          />
          <KPICard
            label="Active Members"
            value={stats.activeMembers}
            suffix={` / ${stats.totalMembers}`}
            icon={Users}
            color="#4ade80"
            subtitle={`${Math.round((stats.activeMembers / (stats.totalMembers || 1)) * 100)}% retention rate`}
            onClick={() => { onFilterChange?.('all'); onPageChange?.('members'); }}
            delay={240}
          />
          <KPICard
            label="Active Trainers"
            value={stats.totalTrainers}
            icon={Dumbbell}
            color="#a78bfa"
            subtitle="Coaching staff on roster"
            onClick={() => onPageChange?.('trainers')}
            delay={300}
          />
        </div>
      </div>

      {/* ── ACTION CENTER ── */}
      {visibleActions.length > 0 && (
        <div style={{ marginBottom: '48px' }} className="animate-fade-up delay-300">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Zap style={{ width: 16, height: 16, color: '#fbbf24' }} />
              <h2 style={{
                fontFamily: "'Syne', sans-serif",
                fontSize: '16px',
                fontWeight: 700,
                color: 'var(--muted-foreground)',
                margin: 0,
                textTransform: 'uppercase'
              }}>
                Action Center
              </h2>
            </div>
            <span style={{
              padding: '3px 10px',
              borderRadius: '20px',
              background: 'rgba(251,191,36,0.08)',
              border: '1px solid rgba(251,191,36,0.15)',
              fontSize: '11px',
              fontWeight: 700,
              color: '#fbbf24',
            }}>
              {visibleActions.length} pending
            </span>
            <div style={{
              height: '1px',
              flex: 1,
              background: 'linear-gradient(90deg, rgba(63,63,70,0.4), transparent)',
            }} />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {visibleActions.map((action, idx) => (
              <ActionCard
                key={action.id}
                action={action}
                onView={() => handleActionView(action)}
                onResolve={() => handleActionResolve(action)}
                onRemind={() => handleActionRemind(action)}
                onDismiss={() => handleActionDismiss(action.id)}
                delay={400 + idx * 80}
              />
            ))}
          </div>
        </div>
      )}

      {/* ── BOTTOM SECTION: Revenue Chart + Recent Activity ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '16px' }}
        className="bottom-grid">

        {/* Revenue Sparkline */}
        <div className="animate-fade-up delay-500" style={{
          background: 'var(--background)',
          border: '1px solid rgba(30,30,34,0.9)',
          borderRadius: '20px',
          padding: '28px',
          opacity: 0,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
            <div>
              <h3 style={{ fontFamily: "'Syne', sans-serif", fontSize: '15px', fontWeight: 700, color: 'var(--foreground)', margin: 0, letterSpacing: '-0.01em' }}>
                Revenue Trend
              </h3>
              <p style={{ fontSize: '12px', color: '#3f3f46', margin: '4px 0 0', fontWeight: 500 }}>6-month overview</p>
            </div>
            <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: 'var(--muted-foreground)', fontWeight: 600 }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#fbbf24', display: 'inline-block' }} />Revenue
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: 'var(--muted-foreground)', fontWeight: 600 }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#f87171', display: 'inline-block', opacity: 0.6 }} />Expenses
              </span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={charts.revenueData} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#fbbf24" stopOpacity={0.2} />
                  <stop offset="100%" stopColor="#fbbf24" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="expGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f87171" stopOpacity={0.1} />
                  <stop offset="100%" stopColor="#f87171" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(30,30,34,0.8)" vertical={false} />
              <XAxis dataKey="month" stroke="none" tick={{ fill: 'var(--muted)', fontSize: 11, fontWeight: 600 }} axisLine={false} tickLine={false} />
              <YAxis stroke="none" tick={{ fill: 'var(--muted)', fontSize: 11 }} axisLine={false} tickLine={false} width={48} tickFormatter={v => `₹${v / 1000}k`} />
              <Tooltip content={<PremiumTooltip />} />
              <Area type="monotone" dataKey="revenue" name="Revenue" stroke="#fbbf24" strokeWidth={2} fill="url(#revGrad)" dot={false} activeDot={{ r: 4, fill: '#fbbf24', strokeWidth: 0 }} />
              <Area type="monotone" dataKey="expenses" name="Expenses" stroke="#f87171" strokeWidth={1.5} fill="url(#expGrad)" strokeDasharray="4 3" dot={false} activeDot={{ r: 3, fill: '#f87171', strokeWidth: 0 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Recent Activity */}
        <div className="animate-fade-up delay-600" style={{
          background: 'var(--background)',
          border: '1px solid rgba(30,30,34,0.9)',
          borderRadius: '20px',
          padding: '28px',
          opacity: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '10px',
                background: 'rgba(96,165,250,0.08)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid rgba(96,165,250,0.12)',
              }}>
                <Activity style={{ width: 15, height: 15, color: '#60a5fa' }} />
              </div>
              <div>
                <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--foreground)', margin: 0, fontFamily: "'Syne', sans-serif", letterSpacing: '-0.01em' }}>Recent Activity</h3>
                <p style={{ fontSize: '11px', color: '#3f3f46', margin: '2px 0 0', fontWeight: 500 }}>Live updates</p>
              </div>
            </div>
            <span style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: '#4ade80',
            }} className="animate-blink" />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            {activities.slice(0, 6).map((activity, idx) => {
              const { icon: Icon, color, bg } = activityMeta(activity.type);
              return (
                <div key={activity.id} style={{
                  display: 'flex',
                  gap: '12px',
                  alignItems: 'flex-start',
                  padding: '10px 0',
                  borderBottom: idx < 5 ? '1px solid rgba(24,24,27,0.6)' : 'none',
                }}>
                  <div style={{
                    width: '30px',
                    height: '30px',
                    minWidth: '30px',
                    borderRadius: '9px',
                    background: bg,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: `1px solid ${color}12`,
                  }}>
                    <Icon style={{ width: 13, height: 13, color }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: '12px', color: '#d4d4d8', margin: 0, lineHeight: 1.5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      <span style={{ fontWeight: 700, color: 'var(--foreground)' }}>{activity.name}</span> {activity.action}
                    </p>
                    <p style={{ fontSize: '10px', color: '#3f3f46', margin: '2px 0 0', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 500 }}>
                      <Clock style={{ width: 9, height: 9 }} /> {activity.time}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── QUICK ACTIONS ── */}
      <div className="animate-fade-up delay-700" style={{
        marginTop: '16px',
        background: 'var(--background)',
        border: '1px solid rgba(30,30,34,0.9)',
        borderRadius: '20px',
        padding: '24px 28px',
        opacity: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '18px' }}>
          <Zap style={{ width: 14, height: 14, color: '#fbbf24' }} />
          <h3 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--muted-foreground)', margin: 0, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Quick Actions</h3>
        </div>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          {[
            { label: 'Add Member', icon: UserPlus, page: 'members', color: '#60a5fa' },
            { label: 'Record Payment', icon: CreditCard, page: 'payments', color: '#4ade80' },
            { label: 'Renew Plan', icon: RefreshCw, page: 'members', color: '#fbbf24' },
            { label: 'Mark Attendance', icon: ClipboardCheck, page: 'attendance', color: '#fb923c' },
            { label: 'Send Reminders', icon: Send, page: 'whatsapp', color: '#4ade80' },
          ].map(({ label, icon: Icon, page, color }) => (
            <button
              key={label}
              onClick={() => onPageChange?.(page)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 18px',
                borderRadius: '12px',
                background: 'var(--card)',
                border: '1px solid rgba(30,30,34,0.9)',
                color: 'var(--muted-foreground)',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                outline: 'none',
                letterSpacing: '-0.01em',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = 'rgba(39,39,42,0.6)';
                e.currentTarget.style.borderColor = color + '30';
                e.currentTarget.style.color = '#fafafa';
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = 'rgba(24,24,27,0.5)';
                e.currentTarget.style.borderColor = 'rgba(30,30,34,0.9)';
                e.currentTarget.style.color = '#71717a';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <Icon style={{ width: 14, height: 14, color }} />
              {label}
            </button>
          ))}
        </div>
      </div>

      <style>{`
        @media (max-width: 1024px) {
          .kpi-grid { grid-template-columns: repeat(2, 1fr) !important; }
          .bottom-grid { grid-template-columns: 1fr !important; }
        }
        @media (max-width: 640px) {
          .kpi-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}
