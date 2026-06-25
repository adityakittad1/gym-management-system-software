import { useState, useEffect } from 'react';
import {
  TrendingUp, Users, UserCheck, UserX, RefreshCw,
  BarChart3, DollarSign, Target, Clock, Activity,
  ArrowUpRight, ArrowDownRight
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';
import { api, InsightsData } from '../services/api';
import { useRealtimeAnalytics } from '../hooks/useRealtimeAnalytics';

const PLAN_COLORS: Record<string, string> = {
  Monthly: '#fbbf24',
  Quarterly: '#4ade80',
  Annual: '#60a5fa',
};

const PremiumTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: 'var(--background)',
      border: '1px solid var(--border)',
      borderRadius: '14px',
      padding: '14px 18px',
      boxShadow: '0 12px 40px rgba(0,0,0,0.7)',
    }}>
      <p style={{ color: 'var(--muted-foreground)', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '8px' }}>{label}</p>
      {payload.map((entry: any) => (
        <div key={entry.name} style={{ display: 'flex', justifyContent: 'space-between', gap: '20px', marginBottom: '4px' }}>
          <span style={{ color: entry.color, fontSize: '12px', fontWeight: 600 }}>{entry.name}</span>
          <span style={{ color: 'var(--foreground)', fontSize: '13px', fontWeight: 700, fontFamily: "'JetBrains Mono', monospace" }}>
            {typeof entry.value === 'number' && entry.value > 100 ? `₹${entry.value.toLocaleString()}` : entry.value}
          </span>
        </div>
      ))}
    </div>
  );
};

interface MetricCardProps {
  label: string;
  value: string | number;
  icon: React.ElementType;
  color: string;
  suffix?: string;
  trend?: { value: string; up: boolean };
  delay?: number;
}

function MetricCard({ label, value, icon: Icon, color, suffix, trend, delay = 0 }: MetricCardProps) {
  return (
    <div className="animate-fade-up" style={{
      animationDelay: `${delay}ms`,
      opacity: 0,
      background: 'var(--background)',
      border: '1px solid rgba(30,30,34,0.9)',
      borderRadius: '20px',
      padding: '24px',
      position: 'relative',
      overflow: 'hidden',
    }}>
      <div style={{
        position: 'absolute', top: '-20px', right: '-20px',
        width: '80px', height: '80px', borderRadius: '50%',
        background: color, opacity: 0.03, filter: 'blur(25px)', pointerEvents: 'none',
      }} />
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
        <div style={{
          width: '36px', height: '36px', borderRadius: '10px',
          background: `${color}10`, display: 'flex', alignItems: 'center', justifyContent: 'center',
          border: `1px solid ${color}15`,
        }}>
          <Icon style={{ width: 16, height: 16, color }} />
        </div>
        <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--muted-foreground)' }}>{label}</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
        <span style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: '28px', fontWeight: 700, color: 'var(--foreground)',
          letterSpacing: '-0.03em', lineHeight: 1,
        }}>
          {value}
        </span>
        {suffix && <span style={{ fontSize: '14px', color: 'var(--muted-foreground)', fontWeight: 600 }}>{suffix}</span>}
      </div>
      {trend && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: '4px', marginTop: '8px',
          fontSize: '11px', fontWeight: 600,
          color: trend.up ? '#4ade80' : '#f87171',
        }}>
          {trend.up ? <ArrowUpRight style={{ width: 12, height: 12 }} /> : <ArrowDownRight style={{ width: 12, height: 12 }} />}
          {trend.value}
        </div>
      )}
    </div>
  );
}

export default function BusinessInsights() {
  const { data, isLoading } = useRealtimeAnalytics(api.analytics.getInsights, null);

  if (isLoading || !data) {
    return (
      <div style={{ padding: '40px 44px', maxWidth: '1200px', margin: '0 auto' }}>
        <div className="animate-pulse" style={{ height: '32px', width: '250px', background: '#151517', borderRadius: '10px', marginBottom: '40px' }} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="animate-pulse" style={{ background: 'var(--background)', border: '1px solid rgba(30,30,34,0.9)', borderRadius: '20px', height: '120px' }} />
          ))}
        </div>
      </div>
    );
  }

  const pieData = data.topPlans.map(p => ({
    name: p.plan,
    value: p.count,
    color: PLAN_COLORS[p.plan] || '#71717a',
  }));

  const revChart = data.revenueTrend.map(r => ({
    month: r.month.split('-')[1] ? new Date(r.month + '-01').toLocaleString('en-IN', { month: 'short' }) : r.month,
    Revenue: r.revenue,
  }));

  return (
    <div style={{ padding: '40px 44px', maxWidth: '1200px', margin: '0 auto' }}>

      {/* Header */}
      <div className="animate-fade-up" style={{ marginBottom: '40px' }}>
        <h1 style={{
          fontFamily: "'Syne', sans-serif", fontSize: '28px', fontWeight: 800,
          color: 'var(--foreground)', letterSpacing: '-0.04em', margin: 0,
        }}>
          Business Insights
        </h1>
        <p style={{ color: '#3f3f46', fontSize: '14px', margin: '6px 0 0', fontWeight: 500 }}>
          Understand your gym's performance at a glance
        </p>
      </div>

      {/* Metric Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '32px' }}
        className="insights-grid">
        <MetricCard label="Retention Rate" value={`${data.retentionRate}%`} icon={UserCheck} color="#4ade80" trend={{ value: 'Healthy', up: true }} delay={0} />
        <MetricCard label="Renewal Rate" value={`${data.renewalRate}%`} icon={RefreshCw} color="#fbbf24" delay={60} />
        <MetricCard label="Inactive Members" value={data.inactiveMembers} icon={UserX} color="#f87171" suffix="members" delay={120} />
        <MetricCard label="Expected Income" value={`₹${data.expectedMonthlyIncome.toLocaleString('en-IN')}`} icon={DollarSign} color="#60a5fa" suffix="/month" delay={180} />
        <MetricCard label="Total Members" value={data.totalMembers} icon={Users} color="#a78bfa" delay={240} />
        <MetricCard label="Active Members" value={data.activeMembers} icon={UserCheck} color="#4ade80" delay={300} />
        <MetricCard label="Expiring Soon" value={data.expiringMembers} icon={Clock} color="#fb923c" delay={360} />
        <MetricCard label="Expired" value={data.expiredMembers} icon={UserX} color="#f87171" delay={420} />
      </div>

      {/* Charts Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '16px' }} className="insights-charts">

        {/* Revenue Trend */}
        <div className="animate-fade-up delay-500" style={{
          background: 'var(--background)', border: '1px solid rgba(30,30,34,0.9)',
          borderRadius: '20px', padding: '28px', opacity: 0,
        }}>
          <div style={{ marginBottom: '24px' }}>
            <h3 style={{ fontFamily: "'Syne', sans-serif", fontSize: '15px', fontWeight: 700, color: 'var(--foreground)', margin: 0 }}>Revenue Trend</h3>
            <p style={{ fontSize: '12px', color: '#3f3f46', margin: '4px 0 0' }}>Monthly collections over time</p>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={revChart} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id="insRevGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#fbbf24" stopOpacity={0.2} />
                  <stop offset="100%" stopColor="#fbbf24" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(30,30,34,0.8)" vertical={false} />
              <XAxis dataKey="month" stroke="none" tick={{ fill: 'var(--muted)', fontSize: 11, fontWeight: 600 }} axisLine={false} tickLine={false} />
              <YAxis stroke="none" tick={{ fill: 'var(--muted)', fontSize: 11 }} axisLine={false} tickLine={false} width={48} tickFormatter={v => `₹${v/1000}k`} />
              <Tooltip content={<PremiumTooltip />} />
              <Area type="monotone" dataKey="Revenue" stroke="#fbbf24" strokeWidth={2} fill="url(#insRevGrad)" dot={false} activeDot={{ r: 4, fill: '#fbbf24', strokeWidth: 0 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Top Plans */}
        <div className="animate-fade-up delay-600" style={{
          background: 'var(--background)', border: '1px solid rgba(30,30,34,0.9)',
          borderRadius: '20px', padding: '28px', opacity: 0,
        }}>
          <div style={{ marginBottom: '24px' }}>
            <h3 style={{ fontFamily: "'Syne', sans-serif", fontSize: '15px', fontWeight: 700, color: 'var(--foreground)', margin: 0 }}>Membership Plans</h3>
            <p style={{ fontSize: '12px', color: '#3f3f46', margin: '4px 0 0' }}>Distribution by plan type</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
            <ResponsiveContainer width={140} height={140}>
              <PieChart>
                <Pie data={pieData} innerRadius={40} outerRadius={65} paddingAngle={3} dataKey="value" strokeWidth={0}>
                  {pieData.map((entry, idx) => (
                    <Cell key={idx} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', flex: 1 }}>
              {pieData.map(p => (
                <div key={p.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: p.color, display: 'inline-block' }} />
                    <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--muted-foreground)' }}>{p.name}</span>
                  </div>
                  <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--foreground)', fontFamily: "'JetBrains Mono', monospace" }}>{p.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 1024px) {
          .insights-grid { grid-template-columns: repeat(2, 1fr) !important; }
          .insights-charts { grid-template-columns: 1fr !important; }
        }
        @media (max-width: 640px) {
          .insights-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}
