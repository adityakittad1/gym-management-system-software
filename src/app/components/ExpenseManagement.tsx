import { useState, useEffect } from 'react';
import {
  Wallet, Plus, Search, Filter, ArrowDownRight,
  MoreVertical, Edit2, Trash2, Tag, Calendar, FileText, CheckCircle
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer
} from 'recharts';
import { api, Expense } from '../services/api';
import { toast } from 'sonner';

const EXPENSE_CATEGORIES = [
  'Rent', 'Electricity', 'Water', 'Internet',
  'Trainer Salaries', 'Equipment', 'Maintenance', 'Marketing', 'Other'
];

export default function ExpenseManagement() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    category: 'Rent',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    notes: ''
  });

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [expData, sumData] = await Promise.all([
        api.expenses.list(),
        api.expenses.getSummary()
      ]);
      setExpenses(expData);
      setSummary(sumData);
    } catch (err) {
      toast.error('Failed to load expenses');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const dateObj = new Date(formData.date);
      const payload = {
        category: formData.category,
        amount: Number(formData.amount),
        month: dateObj.getMonth() + 1,
        year: dateObj.getFullYear(),
        notes: formData.notes
      };

      if ((formData as any).id) {
        await api.expenses.update((formData as any).id, payload);
        toast.success('Expense updated successfully');
      } else {
        await api.expenses.create(payload);
        toast.success('Expense logged successfully');
      }
      setShowAddModal(false);
      setFormData({ category: 'Rent', amount: '', date: new Date().toISOString().split('T')[0], notes: '' });
      fetchData();
    } catch (err) {
      toast.error('Failed to save expense');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this expense?')) return;
    try {
      await api.expenses.delete(id);
      toast.success('Expense deleted');
      fetchData();
    } catch (err) {
      toast.error('Failed to delete expense');
    }
  };

  const filteredExpenses = expenses.filter(e =>
    e.category.toLowerCase().includes(search.toLowerCase()) ||
    e.notes?.toLowerCase().includes(search.toLowerCase())
  );

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
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '20px' }}>
          <span style={{ color: payload[0].color, fontSize: '12px', fontWeight: 600 }}>Expenses</span>
          <span style={{ color: 'var(--foreground)', fontSize: '13px', fontWeight: 700, fontFamily: "'JetBrains Mono', monospace" }}>
            ₹{payload[0].value.toLocaleString()}
          </span>
        </div>
      </div>
    );
  };

  if (isLoading && !summary) {
    return (
      <div style={{ padding: '40px 44px', maxWidth: '1200px', margin: '0 auto' }}>
        <div className="animate-pulse" style={{ height: '32px', width: '250px', background: '#151517', borderRadius: '10px', marginBottom: '40px' }} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="animate-pulse" style={{ background: 'var(--background)', border: '1px solid rgba(30,30,34,0.9)', borderRadius: '20px', height: '140px' }} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '40px 44px', maxWidth: '1200px', margin: '0 auto' }}>
      
      {/* Header */}
      <div className="animate-fade-up" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '40px' }}>
        <div>
          <h1 style={{ fontFamily: "'Syne', sans-serif", fontSize: '28px', fontWeight: 800, color: 'var(--foreground)', letterSpacing: '-0.04em', margin: 0 }}>
            Expense Management
          </h1>
          <p style={{ color: '#3f3f46', fontSize: '14px', margin: '6px 0 0', fontWeight: 500 }}>
            Track and manage your gym's operational costs
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          style={{
            background: '#fafafa', color: '#09090b', border: 'none',
            padding: '12px 20px', borderRadius: '12px', fontSize: '13px', fontWeight: 600,
            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px',
            transition: 'all 0.2s',
          }}
          onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(250,250,250,0.15)'; }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; }}
        >
          <Plus style={{ width: 16, height: 16 }} /> Record Expense
        </button>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="animate-fade-up delay-100 expense-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '40px' }}>
          <div style={{ background: 'var(--background)', border: '1px solid rgba(30,30,34,0.9)', borderRadius: '20px', padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(248,113,113,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ArrowDownRight style={{ width: 16, height: 16, color: '#f87171' }} />
              </div>
              <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--muted-foreground)' }}>This Month's Expenses</span>
            </div>
            <div style={{ fontSize: '32px', fontWeight: 700, color: 'var(--foreground)', fontFamily: "'JetBrains Mono', monospace", letterSpacing: '-0.03em' }}>
              ₹{summary.totalExpenses.toLocaleString('en-IN')}
            </div>
          </div>
          
          <div style={{ background: 'var(--background)', border: '1px solid rgba(30,30,34,0.9)', borderRadius: '20px', padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(74,222,128,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Wallet style={{ width: 16, height: 16, color: '#4ade80' }} />
              </div>
              <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--muted-foreground)' }}>This Month's Revenue</span>
            </div>
            <div style={{ fontSize: '32px', fontWeight: 700, color: 'var(--foreground)', fontFamily: "'JetBrains Mono', monospace", letterSpacing: '-0.03em' }}>
              ₹{summary.totalRevenue.toLocaleString('en-IN')}
            </div>
          </div>

          <div style={{ background: 'var(--background)', border: '1px solid rgba(30,30,34,0.9)', borderRadius: '20px', padding: '24px', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 0, right: 0, width: '100px', height: '100px', background: summary.netProfit >= 0 ? '#4ade80' : '#f87171', opacity: 0.05, filter: 'blur(30px)' }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(251,191,36,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CheckCircle style={{ width: 16, height: 16, color: '#fbbf24' }} />
              </div>
              <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--muted-foreground)' }}>Net Profit</span>
            </div>
            <div style={{ fontSize: '32px', fontWeight: 700, color: summary.netProfit >= 0 ? '#4ade80' : '#f87171', fontFamily: "'JetBrains Mono', monospace", letterSpacing: '-0.03em' }}>
              ₹{summary.netProfit.toLocaleString('en-IN')}
            </div>
          </div>
        </div>
      )}

      {/* Content Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '24px' }} className="expense-content">
        
        {/* Left Col: Chart & Categories */}
        <div className="animate-fade-up delay-200" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Chart */}
          <div style={{ background: 'var(--background)', border: '1px solid rgba(30,30,34,0.9)', borderRadius: '20px', padding: '24px' }}>
            <h3 style={{ fontFamily: "'Syne', sans-serif", fontSize: '15px', fontWeight: 700, color: 'var(--foreground)', margin: '0 0 24px' }}>6-Month Trend</h3>
            {summary && summary.monthlyComparison && (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={summary.monthlyComparison.reverse()}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(30,30,34,0.8)" vertical={false} />
                  <XAxis dataKey="month" stroke="none" tick={{ fill: 'var(--muted)', fontSize: 11 }} />
                  <YAxis stroke="none" tick={{ fill: 'var(--muted)', fontSize: 11 }} width={40} tickFormatter={v => `₹${v/1000}k`} />
                  <Tooltip content={<PremiumTooltip />} cursor={{ fill: 'rgba(255,255,255,0.02)' }} />
                  <Bar dataKey="expenses" fill="#f87171" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Categories Breakdown */}
          <div style={{ background: 'var(--background)', border: '1px solid rgba(30,30,34,0.9)', borderRadius: '20px', padding: '24px' }}>
            <h3 style={{ fontFamily: "'Syne', sans-serif", fontSize: '15px', fontWeight: 700, color: 'var(--foreground)', margin: '0 0 20px' }}>Category Breakdown</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {summary?.monthlyExpenses?.map((c: any) => {
                const percent = Math.round((c.total / summary.totalExpenses) * 100);
                return (
                  <div key={c.category}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <span style={{ fontSize: '12px', color: 'var(--muted-foreground)', fontWeight: 600 }}>{c.category}</span>
                      <span style={{ fontSize: '12px', color: 'var(--foreground)', fontWeight: 700, fontFamily: "'JetBrains Mono', monospace" }}>
                        ₹{c.total.toLocaleString()} ({percent}%)
                      </span>
                    </div>
                    <div style={{ height: '6px', background: 'var(--card)', borderRadius: '3px', overflow: 'hidden' }}>
                      <div style={{ width: `${percent}%`, height: '100%', background: '#f87171', borderRadius: '3px' }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Col: Expense List */}
        <div className="animate-fade-up delay-300" style={{ background: 'var(--background)', border: '1px solid rgba(30,30,34,0.9)', borderRadius: '20px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '24px', borderBottom: '1px solid rgba(30,30,34,0.9)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontFamily: "'Syne', sans-serif", fontSize: '15px', fontWeight: 700, color: 'var(--foreground)', margin: 0 }}>Recent Expenses</h3>
            <div style={{ position: 'relative', width: '240px' }}>
              <Search style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', width: 14, height: 14, color: 'var(--muted-foreground)' }} />
              <input
                type="text"
                placeholder="Search expenses..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{
                  width: '100%', background: 'var(--background)', border: '1px solid var(--border)',
                  padding: '8px 12px 8px 36px', borderRadius: '10px', color: 'var(--foreground)',
                  fontSize: '13px', outline: 'none'
                }}
              />
            </div>
          </div>
          
          <div style={{ flex: 1, overflowY: 'auto', padding: '12px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={{ padding: '12px', textAlign: 'left', fontSize: '11px', fontWeight: 600, color: 'var(--muted-foreground)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Date & Category</th>
                  <th style={{ padding: '12px', textAlign: 'left', fontSize: '11px', fontWeight: 600, color: 'var(--muted-foreground)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Notes</th>
                  <th style={{ padding: '12px', textAlign: 'right', fontSize: '11px', fontWeight: 600, color: 'var(--muted-foreground)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Amount</th>
                  <th style={{ padding: '12px', textAlign: 'center', width: '50px' }}></th>
                </tr>
              </thead>
              <tbody>
                {filteredExpenses.map(expense => (
                  <tr key={expense.id} style={{ borderBottom: '1px solid rgba(30,30,34,0.5)' }}>
                    <td style={{ padding: '16px 12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'var(--card)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Tag style={{ width: 14, height: 14, color: 'var(--muted-foreground)' }} />
                        </div>
                        <div>
                          <p style={{ color: 'var(--foreground)', fontSize: '13px', fontWeight: 600, margin: 0 }}>{expense.category}</p>
                          <p style={{ color: 'var(--muted-foreground)', fontSize: '11px', margin: '4px 0 0' }}>
                            {new Date(expense.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '16px 12px' }}>
                      <p style={{ color: 'var(--muted-foreground)', fontSize: '13px', margin: 0 }}>{expense.notes || '-'}</p>
                    </td>
                    <td style={{ padding: '16px 12px', textAlign: 'right' }}>
                      <span style={{ color: 'var(--foreground)', fontSize: '14px', fontWeight: 700, fontFamily: "'JetBrains Mono', monospace" }}>
                        ₹{expense.amount.toLocaleString()}
                      </span>
                    </td>
                    <td style={{ padding: '16px 12px', textAlign: 'center' }}>
                      <button onClick={() => handleDelete(expense.id)} style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '6px', borderRadius: '6px' }} title="Delete">
                        <Trash2 style={{ width: 14, height: 14 }} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredExpenses.length === 0 && (
              <div style={{ padding: '40px', textAlign: 'center', color: 'var(--muted-foreground)', fontSize: '13px' }}>
                No expenses found
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(4px)' }} onClick={() => setShowAddModal(false)} />
          <div className="animate-scale-in" style={{
            position: 'relative', width: '100%', maxWidth: '440px', background: 'var(--background)',
            border: '1px solid var(--border)', borderRadius: '24px', padding: '32px',
            boxShadow: '0 24px 48px rgba(0,0,0,0.5)'
          }}>
            <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: '20px', fontWeight: 700, color: 'var(--foreground)', margin: '0 0 24px' }}>Record Expense</h2>
            <form onSubmit={handleAddSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--muted-foreground)', marginBottom: '8px' }}>Category</label>
                <select
                  required
                  value={formData.category}
                  onChange={e => setFormData({ ...formData, category: e.target.value })}
                  style={{ width: '100%', background: 'var(--background)', border: '1px solid var(--border)', padding: '12px 16px', borderRadius: '12px', color: 'var(--foreground)', fontSize: '14px', outline: 'none' }}
                >
                  {EXPENSE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--muted-foreground)', marginBottom: '8px' }}>Amount (₹)</label>
                  <input
                    type="number" required min="0" step="1"
                    value={formData.amount}
                    onChange={e => setFormData({ ...formData, amount: e.target.value })}
                    style={{ width: '100%', background: 'var(--background)', border: '1px solid var(--border)', padding: '12px 16px', borderRadius: '12px', color: 'var(--foreground)', fontSize: '14px', outline: 'none', fontFamily: "'JetBrains Mono', monospace" }}
                    placeholder="0"
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--muted-foreground)', marginBottom: '8px' }}>Date</label>
                  <input
                    type="date" required
                    value={formData.date}
                    onChange={e => setFormData({ ...formData, date: e.target.value })}
                    style={{ width: '100%', background: 'var(--background)', border: '1px solid var(--border)', padding: '12px 16px', borderRadius: '12px', color: 'var(--foreground)', fontSize: '14px', outline: 'none' }}
                  />
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--muted-foreground)', marginBottom: '8px' }}>Notes / Description</label>
                <input
                  type="text"
                  value={formData.notes}
                  onChange={e => setFormData({ ...formData, notes: e.target.value })}
                  style={{ width: '100%', background: 'var(--background)', border: '1px solid var(--border)', padding: '12px 16px', borderRadius: '12px', color: 'var(--foreground)', fontSize: '14px', outline: 'none' }}
                  placeholder="Optional details"
                />
              </div>
              <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                <button type="button" onClick={() => setShowAddModal(false)} style={{ flex: 1, padding: '14px', borderRadius: '12px', background: 'transparent', border: '1px solid var(--border)', color: 'var(--foreground)', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}>
                  Cancel
                </button>
                <button type="submit" style={{ flex: 1, padding: '14px', borderRadius: '12px', background: '#fafafa', border: 'none', color: '#09090b', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}>
                  Save Expense
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`
        @media (max-width: 1024px) {
          .expense-grid { grid-template-columns: 1fr !important; }
          .expense-content { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}
