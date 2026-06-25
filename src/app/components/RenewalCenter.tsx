import { useState, useEffect } from 'react';
import {
  AlertTriangle, Phone, MessageCircle, RefreshCw, ChevronRight,
  Clock, Search, Calendar, CreditCard, ShieldAlert, FileText, CheckCircle
} from 'lucide-react';
import { api, Member, Payment } from '../services/api';
import { useStore } from '../store/useStore';
import { toast } from 'sonner';

export default function RenewalCenter() {
  const members = useStore(state => state.members);
  const payments = useStore(state => state.payments);
  const isLoading = useStore(state => state.loading);
  const [activeTab, setActiveTab] = useState<'expiring_today' | 'expiring_soon' | 'expired' | 'pending'>('expiring_today');

  // Data loaded globally via useStore

  const handleWhatsApp = async (phone: string, name: string) => {
    try {
      // Trigger whatsapp workflow
      await api.whatsapp.sendTest(phone, 'whatsapp');
      toast.success(`Reminder sent to ${name}`);
    } catch {
      toast.error('Failed to send reminder');
    }
  };

  const handleCall = (phone: string) => {
    window.open(`tel:${phone}`, '_self');
  };

  // Derived Data
  const expiringToday = members.filter(m => m.daysRemaining === 0 && m.status !== 'expired');
  const expiringSoon = members.filter(m => m.daysRemaining > 0 && m.daysRemaining <= 5);
  const expired = members.filter(m => m.status === 'expired');
  const pendingPayments = payments.filter(p => p.status === 'pending');

  const getFilteredData = () => {
    switch (activeTab) {
      case 'expiring_today': return expiringToday;
      case 'expiring_soon': return expiringSoon;
      case 'expired': return expired;
      case 'pending': return pendingPayments;
      default: return [];
    }
  };

  if (isLoading) {
    return (
      <div style={{ padding: '40px 44px', maxWidth: '1200px', margin: '0 auto' }}>
        <div className="animate-pulse" style={{ height: '32px', width: '250px', background: '#151517', borderRadius: '10px', marginBottom: '40px' }} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '32px' }}>
          {Array.from({ length: 4 }).map((_, i) => <div key={i} className="animate-pulse" style={{ height: '120px', background: 'var(--background)', borderRadius: '20px' }} />)}
        </div>
        <div className="animate-pulse" style={{ height: '400px', background: 'var(--background)', borderRadius: '20px' }} />
      </div>
    );
  }

  return (
    <div style={{ padding: '40px 44px', maxWidth: '1200px', margin: '0 auto' }}>
      
      {/* Header */}
      <div className="animate-fade-up" style={{ marginBottom: '40px' }}>
        <h1 style={{ fontFamily: "'Syne', sans-serif", fontSize: '28px', fontWeight: 800, color: 'var(--foreground)', letterSpacing: '-0.04em', margin: 0 }}>
          Membership Renewal Center
        </h1>
        <p style={{ color: '#3f3f46', fontSize: '14px', margin: '6px 0 0', fontWeight: 500 }}>
          Monitor expiries and pending collections requiring immediate action.
        </p>
      </div>

      {/* Overview Cards */}
      <div className="animate-fade-up delay-100" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '32px' }}>
        
        <button onClick={() => setActiveTab('expiring_today')} style={{ background: activeTab === 'expiring_today' ? '#18181b' : '#0d0d0f', border: activeTab === 'expiring_today' ? '1px solid #fbbf24' : '1px solid rgba(30,30,34,0.9)', borderRadius: '20px', padding: '24px', textAlign: 'left', cursor: 'pointer', transition: 'all 0.2s', position: 'relative', overflow: 'hidden' }}>
          {activeTab === 'expiring_today' && <div style={{ position: 'absolute', top: 0, right: 0, width: '100px', height: '100px', background: '#fbbf24', opacity: 0.05, filter: 'blur(30px)' }} />}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(251,191,36,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <AlertTriangle style={{ width: 16, height: 16, color: '#fbbf24' }} />
            </div>
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--muted-foreground)' }}>Expiring Today</span>
          </div>
          <div style={{ fontSize: '32px', fontWeight: 700, color: 'var(--foreground)', fontFamily: "'JetBrains Mono', monospace", letterSpacing: '-0.03em' }}>
            {expiringToday.length}
          </div>
        </button>

        <button onClick={() => setActiveTab('expiring_soon')} style={{ background: activeTab === 'expiring_soon' ? '#18181b' : '#0d0d0f', border: activeTab === 'expiring_soon' ? '1px solid #fb923c' : '1px solid rgba(30,30,34,0.9)', borderRadius: '20px', padding: '24px', textAlign: 'left', cursor: 'pointer', transition: 'all 0.2s', position: 'relative', overflow: 'hidden' }}>
          {activeTab === 'expiring_soon' && <div style={{ position: 'absolute', top: 0, right: 0, width: '100px', height: '100px', background: '#fb923c', opacity: 0.05, filter: 'blur(30px)' }} />}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(251,146,60,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Clock style={{ width: 16, height: 16, color: '#fb923c' }} />
            </div>
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--muted-foreground)' }}>Expiring ≤ 5 Days</span>
          </div>
          <div style={{ fontSize: '32px', fontWeight: 700, color: 'var(--foreground)', fontFamily: "'JetBrains Mono', monospace", letterSpacing: '-0.03em' }}>
            {expiringSoon.length}
          </div>
        </button>

        <button onClick={() => setActiveTab('expired')} style={{ background: activeTab === 'expired' ? '#18181b' : '#0d0d0f', border: activeTab === 'expired' ? '1px solid #f87171' : '1px solid rgba(30,30,34,0.9)', borderRadius: '20px', padding: '24px', textAlign: 'left', cursor: 'pointer', transition: 'all 0.2s', position: 'relative', overflow: 'hidden' }}>
          {activeTab === 'expired' && <div style={{ position: 'absolute', top: 0, right: 0, width: '100px', height: '100px', background: '#f87171', opacity: 0.05, filter: 'blur(30px)' }} />}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(248,113,113,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ShieldAlert style={{ width: 16, height: 16, color: '#f87171' }} />
            </div>
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--muted-foreground)' }}>Expired</span>
          </div>
          <div style={{ fontSize: '32px', fontWeight: 700, color: 'var(--foreground)', fontFamily: "'JetBrains Mono', monospace", letterSpacing: '-0.03em' }}>
            {expired.length}
          </div>
        </button>

        <button onClick={() => setActiveTab('pending')} style={{ background: activeTab === 'pending' ? '#18181b' : '#0d0d0f', border: activeTab === 'pending' ? '1px solid #f87171' : '1px solid rgba(30,30,34,0.9)', borderRadius: '20px', padding: '24px', textAlign: 'left', cursor: 'pointer', transition: 'all 0.2s', position: 'relative', overflow: 'hidden' }}>
          {activeTab === 'pending' && <div style={{ position: 'absolute', top: 0, right: 0, width: '100px', height: '100px', background: '#f87171', opacity: 0.05, filter: 'blur(30px)' }} />}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(248,113,113,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CreditCard style={{ width: 16, height: 16, color: '#f87171' }} />
            </div>
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--muted-foreground)' }}>Pending Payments</span>
          </div>
          <div style={{ fontSize: '32px', fontWeight: 700, color: 'var(--foreground)', fontFamily: "'JetBrains Mono', monospace", letterSpacing: '-0.03em' }}>
            {pendingPayments.length}
          </div>
        </button>
      </div>

      {/* Data Table */}
      <div className="animate-fade-up delay-200" style={{ background: 'var(--background)', border: '1px solid rgba(30,30,34,0.9)', borderRadius: '20px', overflow: 'hidden' }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(30,30,34,0.9)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ fontFamily: "'Syne', sans-serif", fontSize: '16px', fontWeight: 700, color: 'var(--foreground)', margin: 0, textTransform: 'capitalize' }}>
            {activeTab.replace('_', ' ')}
          </h3>
          {activeTab !== 'pending' && (
            <button style={{ background: 'rgba(56,189,248,0.1)', color: '#38bdf8', border: 'none', padding: '8px 16px', borderRadius: '10px', fontSize: '12px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <MessageCircle style={{ width: 14, height: 14 }} /> Bulk WhatsApp Reminder
            </button>
          )}
        </div>
        
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'var(--card)' }}>
                <th style={{ padding: '16px 24px', textAlign: 'left', fontSize: '11px', fontWeight: 600, color: 'var(--muted-foreground)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Member Details</th>
                <th style={{ padding: '16px 24px', textAlign: 'left', fontSize: '11px', fontWeight: 600, color: 'var(--muted-foreground)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Plan & Status</th>
                <th style={{ padding: '16px 24px', textAlign: 'left', fontSize: '11px', fontWeight: 600, color: 'var(--muted-foreground)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{activeTab === 'pending' ? 'Amount Due' : 'Days Remaining'}</th>
                <th style={{ padding: '16px 24px', textAlign: 'right', fontSize: '11px', fontWeight: 600, color: 'var(--muted-foreground)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Quick Actions</th>
              </tr>
            </thead>
            <tbody>
              {getFilteredData().length === 0 ? (
                <tr>
                  <td colSpan={4} style={{ padding: '80px 20px', textAlign: 'center' }}>
                    <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'var(--card)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                      <CheckCircle style={{ width: 20, height: 20, color: '#4ade80' }} />
                    </div>
                    <h3 style={{ fontSize: '15px', color: 'var(--foreground)', margin: '0 0 4px', fontWeight: 600 }}>All Clear</h3>
                    <p style={{ fontSize: '13px', color: 'var(--muted-foreground)', margin: 0 }}>No items require attention in this section.</p>
                  </td>
                </tr>
              ) : getFilteredData().map((item: any) => (
                <tr key={item.id} style={{ borderBottom: '1px solid rgba(30,30,34,0.5)' }}>
                  <td style={{ padding: '16px 24px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: 700, color: 'var(--foreground)', flexShrink: 0 }}>
                        {item.name ? item.name.charAt(0) : item.memberName.charAt(0)}
                      </div>
                      <div>
                        <span style={{ color: 'var(--foreground)', fontSize: '14px', fontWeight: 600, display: 'block' }}>{item.name || item.memberName}</span>
                        <span style={{ color: 'var(--muted-foreground)', fontSize: '12px', fontFamily: "'JetBrains Mono', monospace" }}>{item.phone || '-'}</span>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '16px 24px' }}>
                    <div style={{ color: '#d4d4d8', fontSize: '13px', fontWeight: 500 }}>{item.plan}</div>
                    {activeTab !== 'pending' && (
                      <div style={{ color: 'var(--muted-foreground)', fontSize: '11px', marginTop: '4px' }}>
                        Exp: {new Date(item.expiryDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                      </div>
                    )}
                  </td>
                  <td style={{ padding: '16px 24px' }}>
                    {activeTab === 'pending' ? (
                      <span style={{ color: '#f87171', fontSize: '15px', fontWeight: 700, fontFamily: "'JetBrains Mono', monospace" }}>
                        ₹{item.amount.toLocaleString()}
                      </span>
                    ) : (
                      <span style={{ 
                        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                        minWidth: '28px', height: '28px', padding: '0 8px', borderRadius: '8px',
                        background: item.daysRemaining <= 0 ? 'rgba(248,113,113,0.1)' : 'rgba(251,191,36,0.1)',
                        color: item.daysRemaining <= 0 ? '#f87171' : '#fbbf24',
                        fontSize: '13px', fontWeight: 700, fontFamily: "'JetBrains Mono', monospace"
                      }}>
                        {item.daysRemaining}
                      </span>
                    )}
                  </td>
                  <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px' }}>
                      <button onClick={() => handleWhatsApp(item.phone || '', item.name || item.memberName)} style={{ background: 'rgba(74,222,128,0.1)', border: 'none', color: '#4ade80', width: '32px', height: '32px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s' }} title="WhatsApp Reminder">
                        <MessageCircle style={{ width: 14, height: 14 }} />
                      </button>
                      <button onClick={() => handleCall(item.phone || '')} style={{ background: 'rgba(56,189,248,0.1)', border: 'none', color: '#38bdf8', width: '32px', height: '32px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s' }} title="Call">
                        <Phone style={{ width: 14, height: 14 }} />
                      </button>
                      <button style={{ background: '#fafafa', border: 'none', color: '#09090b', padding: '0 12px', height: '32px', borderRadius: '8px', fontSize: '12px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', transition: 'all 0.2s' }}>
                        <RefreshCw style={{ width: 12, height: 12 }} /> Renew
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
