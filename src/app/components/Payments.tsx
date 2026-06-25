import { useState, useEffect } from 'react';
import {
  CreditCard, Search, Download, CheckCircle, Clock, FileText, IndianRupee,
  TrendingUp, ArrowUpRight, Plus, Filter, MoreVertical, X
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { api, Payment, Member } from '../services/api';
import { useStore } from '../store/useStore';
import { toast } from 'sonner';

interface PaymentsProps {
  onPageChange?: (page: string) => void;
}

export default function Payments({ onPageChange }: PaymentsProps) {
  const payments = useStore(state => state.payments);
  const members = useStore(state => state.members);
  const isLoading = useStore(state => state.loading);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'paid' | 'pending'>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    memberId: '', amount: '', plan: 'Monthly', method: 'UPI', status: 'paid', date: new Date().toISOString().split('T')[0]
  });

  // Payments are loaded via global store. No manual fetch needed here.

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const member = members.find(m => m.id === Number(formData.memberId));
      if (!member) return toast.error('Please select a member');
      
      await api.payments.create({
        memberName: member.name,
        memberId: member.id,
        amount: Number(formData.amount),
        plan: formData.plan,
        method: formData.method,
        status: formData.status as any,
        date: formData.date
      });
      toast.success('Payment recorded successfully');
      setShowAddModal(false);
      // Store automatically syncs via Supabase Realtime
    } catch (err) {
      toast.error('Failed to record payment');
    }
  };

  const handleDownloadInvoice = (payment: Payment) => {
    // Generate a simple printable invoice
    const invoiceWindow = window.open('', '_blank');
    if (!invoiceWindow) return;
    
    invoiceWindow.document.write(`
      <html>
      <head>
        <title>Invoice #${payment.id}</title>
        <style>
          body { font-family: 'Inter', sans-serif; padding: 40px; color: #18181b; }
          .header { display: flex; justify-content: space-between; border-bottom: 2px solid #e4e4e7; padding-bottom: 20px; margin-bottom: 40px; }
          .title { font-size: 32px; font-weight: 800; margin: 0; color: #09090b; }
          .meta { color: #71717a; font-size: 14px; }
          .details { margin-bottom: 40px; }
          .table { width: 100%; border-collapse: collapse; margin-bottom: 40px; }
          .table th { background: #f4f4f5; padding: 12px; text-align: left; font-size: 12px; text-transform: uppercase; color: #52525b; }
          .table td { padding: 16px 12px; border-bottom: 1px solid #e4e4e7; }
          .total { text-align: right; font-size: 24px; font-weight: 700; color: #09090b; }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <h1 class="title">INVOICE</h1>
            <p class="meta">Receipt #${payment.id}<br>Date: ${new Date(payment.date).toLocaleDateString()}</p>
          </div>
          <div style="text-align: right;">
            <h2 style="margin: 0;">TTZ Fitness</h2>
            <p class="meta">123 Fitness Street<br>Contact: 8668891406</p>
          </div>
        </div>
        <div class="details">
          <p class="meta" style="margin: 0 0 4px;">Bill To:</p>
          <h3 style="margin: 0; font-size: 18px;">${payment.memberName}</h3>
        </div>
        <table class="table">
          <thead>
            <tr>
              <th>Description</th>
              <th>Plan</th>
              <th>Method</th>
              <th style="text-align: right;">Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Gym Membership Subscription</td>
              <td>${payment.plan}</td>
              <td>${payment.method}</td>
              <td style="text-align: right; font-weight: 600;">₹${payment.amount.toLocaleString()}</td>
            </tr>
          </tbody>
        </table>
        <div class="total">
          Total: ₹${payment.amount.toLocaleString()}
        </div>
        <div style="margin-top: 80px; text-align: center; color: #71717a; font-size: 12px;">
          Thank you for choosing TTZ Fitness!
        </div>
        <script>window.print();</script>
      </body>
      </html>
    `);
    invoiceWindow.document.close();
  };

  const filteredPayments = payments.filter(p => {
    const matchSearch = p.memberName.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === 'all' ? true : p.status === filter;
    return matchSearch && matchFilter;
  });

  // Analytics
  const today = new Date();
  const currentMonth = today.toISOString().slice(0, 7); // YYYY-MM
  const monthlyCollections = payments.filter(p => p.status === 'paid' && p.date.startsWith(currentMonth)).reduce((sum, p) => sum + p.amount, 0);
  const pendingCollections = payments.filter(p => p.status === 'pending').reduce((sum, p) => sum + p.amount, 0);
  const pendingCount = payments.filter(p => p.status === 'pending').length;
  
  // Group by month for chart
  const revByMonth: Record<string, number> = {};
  payments.filter(p => p.status === 'paid').forEach(p => {
    const m = p.date.slice(0, 7);
    revByMonth[m] = (revByMonth[m] || 0) + p.amount;
  });
  const chartData = Object.entries(revByMonth)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .slice(-6)
    .map(([m, val]) => {
      const d = new Date(m + '-01');
      return { month: d.toLocaleString('en-IN', { month: 'short' }), Revenue: val };
    });

  const PremiumTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
      <div style={{ background: 'var(--background)', border: '1px solid var(--border)', borderRadius: '14px', padding: '14px 18px', boxShadow: '0 12px 40px rgba(0,0,0,0.7)' }}>
        <p style={{ color: 'var(--muted-foreground)', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '8px' }}>{label}</p>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '20px' }}>
          <span style={{ color: payload[0].color, fontSize: '12px', fontWeight: 600 }}>Revenue</span>
          <span style={{ color: 'var(--foreground)', fontSize: '13px', fontWeight: 700, fontFamily: "'JetBrains Mono', monospace" }}>₹{payload[0].value.toLocaleString()}</span>
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div style={{ padding: '40px 44px', maxWidth: '1200px', margin: '0 auto' }}>
        <div className="animate-pulse" style={{ height: '32px', width: '250px', background: '#151517', borderRadius: '10px', marginBottom: '40px' }} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '40px' }}>
          {Array.from({ length: 3 }).map((_, i) => <div key={i} className="animate-pulse" style={{ height: '120px', background: 'var(--background)', borderRadius: '20px' }} />)}
        </div>
        <div className="animate-pulse" style={{ height: '400px', background: 'var(--background)', borderRadius: '20px' }} />
      </div>
    );
  }

  return (
    <div style={{ padding: '40px 44px', maxWidth: '1200px', margin: '0 auto' }}>
      
      {/* Header */}
      <div className="animate-fade-up" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '40px' }}>
        <div>
          <h1 style={{ fontFamily: "'Syne', sans-serif", fontSize: '28px', fontWeight: 800, color: 'var(--foreground)', letterSpacing: '-0.04em', margin: 0 }}>
            Payments & Billing
          </h1>
          <p style={{ color: '#3f3f46', fontSize: '14px', margin: '6px 0 0', fontWeight: 500 }}>
            Manage invoices, collections, and revenue history
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          style={{ background: '#fafafa', color: '#09090b', border: 'none', padding: '12px 20px', borderRadius: '12px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.2s' }}
          onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(250,250,250,0.15)'; }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; }}
        >
          <Plus style={{ width: 16, height: 16 }} /> Record Payment
        </button>
      </div>

      {/* KPI Cards */}
      <div className="animate-fade-up delay-100" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '24px' }}>
        <div style={{ background: 'var(--background)', border: '1px solid rgba(30,30,34,0.9)', borderRadius: '20px', padding: '24px', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 0, right: 0, width: '100px', height: '100px', background: '#fbbf24', opacity: 0.05, filter: 'blur(30px)' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(251,191,36,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <IndianRupee style={{ width: 16, height: 16, color: '#fbbf24' }} />
            </div>
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--muted-foreground)' }}>Monthly Collections</span>
          </div>
          <div style={{ fontSize: '32px', fontWeight: 700, color: 'var(--foreground)', fontFamily: "'JetBrains Mono', monospace", letterSpacing: '-0.03em' }}>
            ₹{monthlyCollections.toLocaleString('en-IN')}
          </div>
        </div>

        <div style={{ background: 'var(--background)', border: '1px solid rgba(30,30,34,0.9)', borderRadius: '20px', padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(248,113,113,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Clock style={{ width: 16, height: 16, color: '#f87171' }} />
            </div>
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--muted-foreground)' }}>Pending Collections</span>
          </div>
          <div style={{ fontSize: '32px', fontWeight: 700, color: 'var(--foreground)', fontFamily: "'JetBrains Mono', monospace", letterSpacing: '-0.03em' }}>
            ₹{pendingCollections.toLocaleString('en-IN')}
          </div>
          {pendingCount > 0 && <p style={{ fontSize: '11px', color: '#f87171', margin: '4px 0 0', fontWeight: 600 }}>from {pendingCount} invoices</p>}
        </div>

        {/* Revenue Trend Chart embedded in KPI */}
        <div style={{ background: 'var(--background)', border: '1px solid rgba(30,30,34,0.9)', borderRadius: '20px', padding: '24px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
            <TrendingUp style={{ width: 14, height: 14, color: 'var(--muted-foreground)' }} />
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--muted-foreground)' }}>Revenue Timeline (6mo)</span>
          </div>
          <div style={{ flex: 1, minHeight: '60px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="payRevGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#fbbf24" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#fbbf24" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Tooltip content={<PremiumTooltip />} />
                <Area type="monotone" dataKey="Revenue" stroke="#fbbf24" strokeWidth={2} fill="url(#payRevGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Main Table Area */}
      <div className="animate-fade-up delay-200" style={{ background: 'var(--background)', border: '1px solid rgba(30,30,34,0.9)', borderRadius: '20px', display: 'flex', flexDirection: 'column', minHeight: '500px' }}>
        
        {/* Toolbar */}
        <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(30,30,34,0.9)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', width: '300px', flexShrink: 0 }}>
            <Search style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', width: 14, height: 14, color: 'var(--muted-foreground)' }} />
            <input
              type="text" placeholder="Search members..."
              value={search} onChange={e => setSearch(e.target.value)}
              style={{ width: '100%', background: 'var(--background)', border: '1px solid var(--border)', padding: '10px 12px 10px 36px', borderRadius: '12px', color: 'var(--foreground)', fontSize: '13px', outline: 'none' }}
            />
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            {(['all', 'paid', 'pending'] as const).map(f => (
              <button
                key={f} onClick={() => setFilter(f)}
                style={{
                  background: filter === f ? 'rgba(250,250,250,0.1)' : 'transparent',
                  border: filter === f ? '1px solid rgba(250,250,250,0.2)' : '1px solid rgba(63,63,70,0.5)',
                  color: filter === f ? '#fafafa' : '#a1a1aa',
                  padding: '8px 16px', borderRadius: '10px', fontSize: '12px', fontWeight: 600,
                  cursor: 'pointer', transition: 'all 0.2s', textTransform: 'capitalize'
                }}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'var(--card)' }}>
                <th style={{ padding: '16px 24px', textAlign: 'left', fontSize: '11px', fontWeight: 600, color: 'var(--muted-foreground)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>ID / Date</th>
                <th style={{ padding: '16px 24px', textAlign: 'left', fontSize: '11px', fontWeight: 600, color: 'var(--muted-foreground)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Member</th>
                <th style={{ padding: '16px 24px', textAlign: 'left', fontSize: '11px', fontWeight: 600, color: 'var(--muted-foreground)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Details</th>
                <th style={{ padding: '16px 24px', textAlign: 'left', fontSize: '11px', fontWeight: 600, color: 'var(--muted-foreground)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Amount</th>
                <th style={{ padding: '16px 24px', textAlign: 'left', fontSize: '11px', fontWeight: 600, color: 'var(--muted-foreground)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Status</th>
                <th style={{ padding: '16px 24px', textAlign: 'right', fontSize: '11px', fontWeight: 600, color: 'var(--muted-foreground)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredPayments.map(payment => (
                <tr key={payment.id} style={{ borderBottom: '1px solid rgba(30,30,34,0.5)' }}>
                  <td style={{ padding: '16px 24px' }}>
                    <div style={{ color: 'var(--foreground)', fontSize: '13px', fontWeight: 600, fontFamily: "'JetBrains Mono', monospace" }}>#{payment.id.toString().padStart(4, '0')}</div>
                    <div style={{ color: 'var(--muted-foreground)', fontSize: '11px', marginTop: '4px' }}>{new Date(payment.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
                  </td>
                  <td style={{ padding: '16px 24px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 700, color: 'var(--foreground)' }}>
                        {payment.memberName.charAt(0)}
                      </div>
                      <span style={{ color: 'var(--foreground)', fontSize: '13px', fontWeight: 600 }}>{payment.memberName}</span>
                    </div>
                  </td>
                  <td style={{ padding: '16px 24px' }}>
                    <div style={{ color: '#d4d4d8', fontSize: '13px' }}>{payment.plan}</div>
                    <div style={{ color: 'var(--muted-foreground)', fontSize: '11px', marginTop: '4px' }}>Via {payment.method}</div>
                  </td>
                  <td style={{ padding: '16px 24px' }}>
                    <span style={{ color: 'var(--foreground)', fontSize: '14px', fontWeight: 700, fontFamily: "'JetBrains Mono', monospace" }}>
                      ₹{payment.amount.toLocaleString('en-IN')}
                    </span>
                  </td>
                  <td style={{ padding: '16px 24px' }}>
                    {payment.status === 'paid' ? (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '4px 10px', borderRadius: '20px', background: 'rgba(74,222,128,0.1)', color: '#4ade80', fontSize: '11px', fontWeight: 700, letterSpacing: '0.02em', textTransform: 'uppercase' }}>
                        <CheckCircle style={{ width: 10, height: 10 }} /> Paid
                      </span>
                    ) : (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '4px 10px', borderRadius: '20px', background: 'rgba(248,113,113,0.1)', color: '#f87171', fontSize: '11px', fontWeight: 700, letterSpacing: '0.02em', textTransform: 'uppercase' }}>
                        <Clock style={{ width: 10, height: 10 }} /> Pending
                      </span>
                    )}
                  </td>
                  <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                    <button
                      onClick={() => handleDownloadInvoice(payment)}
                      style={{ background: 'var(--card)', border: '1px solid var(--border)', color: 'var(--foreground)', padding: '6px 12px', borderRadius: '8px', fontSize: '11px', fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px', transition: 'all 0.2s' }}
                      onMouseEnter={e => { e.currentTarget.style.background = 'rgba(63,63,70,0.8)'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'rgba(39,39,42,0.5)'; }}
                    >
                      <Download style={{ width: 12, height: 12 }} /> Invoice
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredPayments.length === 0 && (
            <div style={{ padding: '80px 20px', textAlign: 'center' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'var(--card)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                <FileText style={{ width: 20, height: 20, color: 'var(--muted-foreground)' }} />
              </div>
              <h3 style={{ fontSize: '15px', color: 'var(--foreground)', margin: '0 0 4px', fontWeight: 600 }}>No payments found</h3>
              <p style={{ fontSize: '13px', color: 'var(--muted-foreground)', margin: 0 }}>Try adjusting your search or filters.</p>
            </div>
          )}
        </div>
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(4px)' }} onClick={() => setShowAddModal(false)} />
          <div className="animate-scale-in" style={{ position: 'relative', width: '100%', maxWidth: '440px', background: 'var(--background)', border: '1px solid var(--border)', borderRadius: '24px', padding: '32px', boxShadow: '0 24px 48px rgba(0,0,0,0.5)' }}>
            <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: '20px', fontWeight: 700, color: 'var(--foreground)', margin: '0 0 24px' }}>Record Payment</h2>
            <form onSubmit={handleAddSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--muted-foreground)', marginBottom: '8px' }}>Member</label>
                <select required value={formData.memberId} onChange={e => setFormData({ ...formData, memberId: e.target.value })} style={{ width: '100%', background: 'var(--background)', border: '1px solid var(--border)', padding: '12px 16px', borderRadius: '12px', color: 'var(--foreground)', fontSize: '14px', outline: 'none' }}>
                  <option value="">Select Member...</option>
                  {members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                </select>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--muted-foreground)', marginBottom: '8px' }}>Amount (₹)</label>
                  <input type="number" required min="0" value={formData.amount} onChange={e => setFormData({ ...formData, amount: e.target.value })} style={{ width: '100%', background: 'var(--background)', border: '1px solid var(--border)', padding: '12px 16px', borderRadius: '12px', color: 'var(--foreground)', fontSize: '14px', outline: 'none', fontFamily: "'JetBrains Mono', monospace" }} placeholder="0" />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--muted-foreground)', marginBottom: '8px' }}>Date</label>
                  <input type="date" required value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })} style={{ width: '100%', background: 'var(--background)', border: '1px solid var(--border)', padding: '12px 16px', borderRadius: '12px', color: 'var(--foreground)', fontSize: '14px', outline: 'none' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--muted-foreground)', marginBottom: '8px' }}>Plan</label>
                  <select value={formData.plan} onChange={e => setFormData({ ...formData, plan: e.target.value })} style={{ width: '100%', background: 'var(--background)', border: '1px solid var(--border)', padding: '12px 16px', borderRadius: '12px', color: 'var(--foreground)', fontSize: '14px', outline: 'none' }}>
                    <option value="Monthly">Monthly</option>
                    <option value="Quarterly">Quarterly</option>
                    <option value="Annual">Annual</option>
                    <option value="Drop-in">Drop-in</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--muted-foreground)', marginBottom: '8px' }}>Method</label>
                  <select value={formData.method} onChange={e => setFormData({ ...formData, method: e.target.value })} style={{ width: '100%', background: 'var(--background)', border: '1px solid var(--border)', padding: '12px 16px', borderRadius: '12px', color: 'var(--foreground)', fontSize: '14px', outline: 'none' }}>
                    <option value="UPI">UPI</option>
                    <option value="Cash">Cash</option>
                    <option value="Card">Card</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                  </select>
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--muted-foreground)', marginBottom: '8px' }}>Status</label>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <label style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '8px', padding: '12px', borderRadius: '12px', border: formData.status === 'paid' ? '1px solid #4ade80' : '1px solid rgba(63,63,70,0.5)', background: formData.status === 'paid' ? 'rgba(74,222,128,0.1)' : '#111113', cursor: 'pointer' }}>
                    <input type="radio" name="status" value="paid" checked={formData.status === 'paid'} onChange={() => setFormData({ ...formData, status: 'paid' })} style={{ display: 'none' }} />
                    <CheckCircle style={{ width: 14, height: 14, color: formData.status === 'paid' ? '#4ade80' : '#71717a' }} />
                    <span style={{ fontSize: '13px', color: formData.status === 'paid' ? '#4ade80' : '#fafafa', fontWeight: 600 }}>Paid</span>
                  </label>
                  <label style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '8px', padding: '12px', borderRadius: '12px', border: formData.status === 'pending' ? '1px solid #f87171' : '1px solid rgba(63,63,70,0.5)', background: formData.status === 'pending' ? 'rgba(248,113,113,0.1)' : '#111113', cursor: 'pointer' }}>
                    <input type="radio" name="status" value="pending" checked={formData.status === 'pending'} onChange={() => setFormData({ ...formData, status: 'pending' })} style={{ display: 'none' }} />
                    <Clock style={{ width: 14, height: 14, color: formData.status === 'pending' ? '#f87171' : '#71717a' }} />
                    <span style={{ fontSize: '13px', color: formData.status === 'pending' ? '#f87171' : '#fafafa', fontWeight: 600 }}>Pending</span>
                  </label>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                <button type="button" onClick={() => setShowAddModal(false)} style={{ flex: 1, padding: '14px', borderRadius: '12px', background: 'transparent', border: '1px solid var(--border)', color: 'var(--foreground)', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}>
                  Cancel
                </button>
                <button type="submit" style={{ flex: 1, padding: '14px', borderRadius: '12px', background: '#fafafa', border: 'none', color: '#09090b', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}>
                  Save Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
