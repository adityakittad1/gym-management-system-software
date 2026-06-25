import { useState, useEffect } from 'react';
import { api, Visitor } from '../services/api';
import { toast } from 'sonner';
import { Plus, Search, Users, Calendar, Phone, MoreVertical, Trash2 } from 'lucide-react';

export default function Visitors() {
  const [visitors, setVisitors] = useState<Visitor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState<Partial<Visitor>>({
    purpose: 'enquiry',
    interestedMembership: 'Monthly',
    trialDate: new Date().toISOString().split('T')[0]
  });

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const data = await api.visitors.list();
      setVisitors(data);
    } catch (err) {
      toast.error('Failed to load visitors');
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
      await api.visitors.create(formData as any);
      toast.success('Visitor registered successfully');
      setShowAddModal(false);
      setFormData({ purpose: 'enquiry', interestedMembership: 'Monthly', trialDate: new Date().toISOString().split('T')[0] });
      fetchData();
    } catch (err) {
      toast.error('Failed to register visitor');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Remove this visitor record?')) return;
    try {
      await api.visitors.delete(id);
      toast.success('Visitor removed');
      fetchData();
    } catch (err) {
      toast.error('Failed to remove visitor');
    }
  };

  const filteredVisitors = visitors.filter(v => 
    v.name.toLowerCase().includes(search.toLowerCase()) || 
    v.phone.includes(search)
  );

  if (isLoading) {
    return (
      <div style={{ padding: '40px 44px', maxWidth: '1400px', margin: '0 auto' }}>
        <div className="animate-pulse" style={{ height: '32px', width: '250px', background: '#151517', borderRadius: '10px', marginBottom: '40px' }} />
        <div className="animate-pulse" style={{ height: '500px', background: 'var(--background)', borderRadius: '20px' }} />
      </div>
    );
  }

  return (
    <div style={{ padding: '40px 44px', maxWidth: '1400px', margin: '0 auto' }}>
      
      {/* Header */}
      <div className="animate-fade-up" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontFamily: "'Syne', sans-serif", fontSize: '28px', fontWeight: 800, color: 'var(--foreground)', letterSpacing: '-0.04em', margin: 0 }}>
            Visitor Log
          </h1>
          <p style={{ color: '#3f3f46', fontSize: '14px', margin: '6px 0 0', fontWeight: 500 }}>
            Manage daily gym walk-ins and trial sessions
          </p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <div style={{ position: 'relative', width: '260px' }}>
            <Search style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', width: 14, height: 14, color: 'var(--muted-foreground)' }} />
            <input
              type="text" placeholder="Search visitors..." value={search} onChange={e => setSearch(e.target.value)}
              style={{ width: '100%', background: 'var(--card)', border: '1px solid var(--border)', padding: '10px 12px 10px 36px', borderRadius: '12px', color: 'var(--foreground)', fontSize: '13px', outline: 'none' }}
            />
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            style={{ background: '#fafafa', color: '#09090b', border: 'none', padding: '10px 20px', borderRadius: '12px', fontSize: '13px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.2s', boxShadow: '0 4px 16px rgba(250,250,250,0.1)' }}
          >
            <Plus style={{ width: 16, height: 16 }} /> New Walk-in
          </button>
        </div>
      </div>

      {/* Visitor List */}
      <div className="animate-fade-up delay-100" style={{ background: 'var(--background)', border: '1px solid var(--border)', borderRadius: '20px', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'var(--card)' }}>
                <th style={{ padding: '16px 24px', textAlign: 'left', fontSize: '11px', fontWeight: 600, color: 'var(--muted-foreground)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Visitor Details</th>
                <th style={{ padding: '16px 24px', textAlign: 'left', fontSize: '11px', fontWeight: 600, color: 'var(--muted-foreground)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Purpose</th>
                <th style={{ padding: '16px 24px', textAlign: 'left', fontSize: '11px', fontWeight: 600, color: 'var(--muted-foreground)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Date & Time</th>
                <th style={{ padding: '16px 24px', textAlign: 'right', fontSize: '11px', fontWeight: 600, color: 'var(--muted-foreground)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredVisitors.map(visitor => (
                <tr key={visitor.id} style={{ borderBottom: '1px solid rgba(30,30,34,0.5)' }}>
                  <td style={{ padding: '16px 24px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(96, 165, 250, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#60a5fa', fontWeight: 700, fontSize: '14px' }}>
                        {visitor.name.charAt(0)}
                      </div>
                      <div>
                        <p style={{ color: 'var(--foreground)', fontSize: '14px', fontWeight: 600, margin: '0 0 2px' }}>{visitor.name}</p>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--muted-foreground)', fontSize: '11px', fontFamily: "'JetBrains Mono', monospace" }}>
                          <Phone style={{ width: 10, height: 10 }} /> {visitor.phone}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '16px 24px' }}>
                    <span style={{ padding: '4px 10px', background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '11px', fontWeight: 600, color: 'var(--muted-foreground)', textTransform: 'capitalize' }}>
                      {visitor.purpose}
                    </span>
                    {visitor.purpose === 'trial' && visitor.interestedMembership && (
                      <p style={{ margin: '6px 0 0', fontSize: '11px', color: 'var(--muted)' }}>Interested in: {visitor.interestedMembership}</p>
                    )}
                  </td>
                  <td style={{ padding: '16px 24px' }}>
                    <p style={{ color: 'var(--foreground)', fontSize: '13px', fontWeight: 500, margin: '0 0 2px' }}>
                      {new Date(visitor.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                    <p style={{ color: 'var(--muted-foreground)', fontSize: '11px', margin: 0 }}>
                      {new Date(visitor.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </td>
                  <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                    <button onClick={() => handleDelete(visitor.id)} style={{ background: 'transparent', border: 'none', color: '#f87171', padding: '6px', cursor: 'pointer', borderRadius: '6px' }} title="Delete">
                      <Trash2 style={{ width: 16, height: 16 }} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredVisitors.length === 0 && (
            <div style={{ padding: '60px 20px', textAlign: 'center' }}>
              <Users style={{ width: 32, height: 32, color: 'var(--muted-foreground)', margin: '0 auto 12px' }} />
              <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--foreground)', margin: '0 0 4px' }}>No visitors found</h3>
              <p style={{ fontSize: '13px', color: 'var(--muted-foreground)', margin: 0 }}>No records match your current view.</p>
            </div>
          )}
        </div>
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(4px)' }} onClick={() => setShowAddModal(false)} />
          <div className="animate-scale-in" style={{ position: 'relative', width: '100%', maxWidth: '440px', background: 'var(--background)', border: '1px solid var(--border)', borderRadius: '24px', padding: '32px', boxShadow: '0 24px 48px rgba(0,0,0,0.5)' }}>
            <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: '20px', fontWeight: 700, color: 'var(--foreground)', margin: '0 0 24px' }}>Register Walk-in</h2>
            <form onSubmit={handleAddSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--muted-foreground)', marginBottom: '8px', textTransform: 'uppercase' }}>Full Name</label>
                <input required type="text" value={formData.name || ''} onChange={e => setFormData({ ...formData, name: e.target.value })} style={{ width: '100%', background: 'var(--card)', border: '1px solid var(--border)', padding: '12px 16px', borderRadius: '12px', color: 'var(--foreground)', fontSize: '13px', outline: 'none' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--muted-foreground)', marginBottom: '8px', textTransform: 'uppercase' }}>Phone Number</label>
                <input required type="tel" value={formData.phone || ''} onChange={e => setFormData({ ...formData, phone: e.target.value })} style={{ width: '100%', background: 'var(--card)', border: '1px solid var(--border)', padding: '12px 16px', borderRadius: '12px', color: 'var(--foreground)', fontSize: '13px', outline: 'none', fontFamily: "'JetBrains Mono', monospace" }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--muted-foreground)', marginBottom: '8px', textTransform: 'uppercase' }}>Purpose</label>
                  <select value={formData.purpose || 'enquiry'} onChange={e => setFormData({ ...formData, purpose: e.target.value })} style={{ width: '100%', background: 'var(--card)', border: '1px solid var(--border)', padding: '12px 16px', borderRadius: '12px', color: 'var(--foreground)', fontSize: '13px', outline: 'none' }}>
                    <option value="enquiry">General Enquiry</option>
                    <option value="trial">Trial Session</option>
                    <option value="meeting">Meeting</option>
                  </select>
                </div>
                {formData.purpose === 'trial' && (
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--muted-foreground)', marginBottom: '8px', textTransform: 'uppercase' }}>Interested In</label>
                    <select value={formData.interestedMembership || 'Monthly'} onChange={e => setFormData({ ...formData, interestedMembership: e.target.value })} style={{ width: '100%', background: 'var(--card)', border: '1px solid var(--border)', padding: '12px 16px', borderRadius: '12px', color: 'var(--foreground)', fontSize: '13px', outline: 'none' }}>
                      <option value="Monthly">Monthly Plan</option>
                      <option value="Quarterly">Quarterly Plan</option>
                      <option value="Annual">Annual Plan</option>
                    </select>
                  </div>
                )}
              </div>
              <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
                <button type="button" onClick={() => setShowAddModal(false)} style={{ flex: 1, padding: '14px', borderRadius: '12px', background: 'transparent', border: '1px solid var(--border)', color: 'var(--foreground)', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}>Cancel</button>
                <button type="submit" style={{ flex: 1, padding: '14px', borderRadius: '12px', background: '#fafafa', border: 'none', color: '#09090b', fontSize: '13px', fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 16px rgba(250,250,250,0.1)' }}>Save Record</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
