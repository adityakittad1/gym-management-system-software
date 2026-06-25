import { useState, useEffect } from 'react';
import { api, Lead } from '../services/api';
import { toast } from 'sonner';
import { Plus, Search, Filter, Phone, Mail, Clock, Calendar, CheckCircle, XCircle, Tag, MoreVertical } from 'lucide-react';

const STAGES = [
  { id: 'new', label: 'New Leads', color: '#60a5fa', bg: 'rgba(96, 165, 250, 0.1)' },
  { id: 'contacted', label: 'Contacted', color: '#fbbf24', bg: 'rgba(251, 191, 36, 0.1)' },
  { id: 'trial', label: 'Trial / Demo', color: '#a78bfa', bg: 'rgba(167, 139, 250, 0.1)' },
  { id: 'converted', label: 'Converted', color: '#4ade80', bg: 'rgba(74, 222, 128, 0.1)' },
  { id: 'lost', label: 'Lost', color: '#f87171', bg: 'rgba(248, 113, 113, 0.1)' }
];

export default function Leads() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState<Partial<Lead>>({
    source: 'walk_in',
    stage: 'new',
    interestedPlan: 'Monthly'
  });

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const data = await api.leads.list();
      setLeads(data);
    } catch (err) {
      toast.error('Failed to load leads');
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
      if (formData.id) {
        await api.leads.update(formData.id, formData as any);
        toast.success('Lead updated successfully');
      } else {
        await api.leads.create(formData as any);
        toast.success('Lead created successfully');
      }
      setShowAddModal(false);
      setFormData({ source: 'walk_in', stage: 'new', interestedPlan: 'Monthly' });
      fetchData();
    } catch (err) {
      toast.error('Failed to save lead');
    }
  };

  const updateStage = async (id: number, newStage: string) => {
    try {
      const lead = leads.find(l => l.id === id);
      if (!lead) return;
      await api.leads.update(id, { ...lead, stage: newStage as any });
      fetchData();
      if (newStage === 'converted') toast.success('Lead converted successfully! 🎉');
    } catch (err) {
      toast.error('Failed to update lead stage');
    }
  };

  const filteredLeads = leads.filter(l => 
    l.name.toLowerCase().includes(search.toLowerCase()) || 
    l.phone.includes(search)
  );

  if (isLoading) {
    return (
      <div style={{ padding: '40px 44px', maxWidth: '1400px', margin: '0 auto' }}>
        <div className="animate-pulse" style={{ height: '32px', width: '250px', background: '#151517', borderRadius: '10px', marginBottom: '40px' }} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '16px' }}>
          {Array.from({ length: 5 }).map((_, i) => <div key={i} className="animate-pulse" style={{ height: '500px', background: 'var(--background)', borderRadius: '20px' }} />)}
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '40px 44px', maxWidth: '1600px', margin: '0 auto', height: '100%', display: 'flex', flexDirection: 'column' }}>
      
      {/* Header */}
      <div className="animate-fade-up" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontFamily: "'Syne', sans-serif", fontSize: '28px', fontWeight: 800, color: 'var(--foreground)', letterSpacing: '-0.04em', margin: 0 }}>
            Lead Pipeline
          </h1>
          <p style={{ color: '#3f3f46', fontSize: '14px', margin: '6px 0 0', fontWeight: 500 }}>
            Track and convert prospective members
          </p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <div style={{ position: 'relative', width: '260px' }}>
            <Search style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', width: 14, height: 14, color: 'var(--muted-foreground)' }} />
            <input
              type="text" placeholder="Search leads..." value={search} onChange={e => setSearch(e.target.value)}
              style={{ width: '100%', background: 'var(--card)', border: '1px solid var(--border)', padding: '10px 12px 10px 36px', borderRadius: '12px', color: 'var(--foreground)', fontSize: '13px', outline: 'none' }}
            />
          </div>
          <button
            onClick={() => { setFormData({ source: 'walk_in', stage: 'new', interestedPlan: 'Monthly' }); setShowAddModal(true); }}
            style={{ background: '#fbbf24', color: '#000', border: 'none', padding: '10px 20px', borderRadius: '12px', fontSize: '13px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.2s', boxShadow: '0 4px 16px rgba(251,191,36,0.2)' }}
          >
            <Plus style={{ width: 16, height: 16 }} /> Add Lead
          </button>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="animate-fade-up delay-100" style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '16px', flex: 1, minHeight: 0 }}>
        {STAGES.map(stage => {
          const stageLeads = filteredLeads.filter(l => l.stage === stage.id);
          return (
            <div key={stage.id} style={{ background: 'var(--background)', border: '1px solid var(--border)', borderRadius: '20px', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(9,9,11,0.5)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: stage.color }} />
                  <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--foreground)' }}>{stage.label}</span>
                </div>
                <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--muted-foreground)', background: 'var(--card)', padding: '2px 8px', borderRadius: '10px' }}>
                  {stageLeads.length}
                </span>
              </div>
              
              <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px', overflowY: 'auto', flex: 1 }}>
                {stageLeads.map(lead => (
                  <div key={lead.id} style={{ background: 'var(--card)', border: '1px solid rgba(39,39,42,0.8)', borderRadius: '16px', padding: '16px', transition: 'all 0.2s', cursor: 'grab' }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(251,191,36,0.3)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(39,39,42,0.8)'; e.currentTarget.style.transform = 'none'; }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                      <div>
                        <h4 style={{ margin: '0 0 4px', fontSize: '14px', fontWeight: 600, color: 'var(--foreground)' }}>{lead.name}</h4>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--muted-foreground)', fontSize: '11px', fontFamily: "'JetBrains Mono', monospace" }}>
                          <Phone style={{ width: 10, height: 10 }} /> {lead.phone}
                        </div>
                      </div>
                      <button onClick={() => { setFormData(lead); setShowAddModal(true); }} style={{ background: 'transparent', border: 'none', color: 'var(--muted-foreground)', cursor: 'pointer', padding: 0 }}>
                        <MoreVertical style={{ width: 14, height: 14 }} />
                      </button>
                    </div>
                    
                    {lead.interestedPlan && (
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '4px 8px', background: 'rgba(250,250,250,0.05)', borderRadius: '6px', fontSize: '10px', fontWeight: 600, color: '#d4d4d8', marginBottom: '12px' }}>
                        <Tag style={{ width: 10, height: 10 }} /> {lead.interestedPlan}
                      </div>
                    )}
                    
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <select 
                        value={lead.stage}
                        onChange={(e) => updateStage(lead.id, e.target.value)}
                        style={{ flex: 1, background: 'var(--background)', border: '1px solid var(--border)', borderRadius: '8px', padding: '6px', fontSize: '11px', color: 'var(--foreground)', outline: 'none' }}
                      >
                        {STAGES.map(s => <option key={s.id} value={s.id}>Move to {s.label}</option>)}
                      </select>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(4px)' }} onClick={() => setShowAddModal(false)} />
          <div className="animate-scale-in" style={{ position: 'relative', width: '100%', maxWidth: '500px', background: 'var(--background)', border: '1px solid var(--border)', borderRadius: '24px', padding: '32px', boxShadow: '0 24px 48px rgba(0,0,0,0.5)' }}>
            <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: '20px', fontWeight: 700, color: 'var(--foreground)', margin: '0 0 24px' }}>{formData.id ? 'Edit Lead' : 'Add New Lead'}</h2>
            <form onSubmit={handleAddSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--muted-foreground)', marginBottom: '8px', textTransform: 'uppercase' }}>Full Name</label>
                  <input required type="text" value={formData.name || ''} onChange={e => setFormData({ ...formData, name: e.target.value })} style={{ width: '100%', background: 'var(--card)', border: '1px solid var(--border)', padding: '12px 16px', borderRadius: '12px', color: 'var(--foreground)', fontSize: '13px', outline: 'none' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--muted-foreground)', marginBottom: '8px', textTransform: 'uppercase' }}>Phone Number</label>
                  <input required type="tel" value={formData.phone || ''} onChange={e => setFormData({ ...formData, phone: e.target.value })} style={{ width: '100%', background: 'var(--card)', border: '1px solid var(--border)', padding: '12px 16px', borderRadius: '12px', color: 'var(--foreground)', fontSize: '13px', outline: 'none', fontFamily: "'JetBrains Mono', monospace" }} />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--muted-foreground)', marginBottom: '8px', textTransform: 'uppercase' }}>Source</label>
                  <select value={formData.source || 'walk_in'} onChange={e => setFormData({ ...formData, source: e.target.value })} style={{ width: '100%', background: 'var(--card)', border: '1px solid var(--border)', padding: '12px 16px', borderRadius: '12px', color: 'var(--foreground)', fontSize: '13px', outline: 'none' }}>
                    <option value="walk_in">Walk-in</option>
                    <option value="instagram">Instagram</option>
                    <option value="website">Website</option>
                    <option value="referral">Referral</option>
                    <option value="phone">Phone Enquiry</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--muted-foreground)', marginBottom: '8px', textTransform: 'uppercase' }}>Interested Plan</label>
                  <select value={formData.interestedPlan || 'Monthly'} onChange={e => setFormData({ ...formData, interestedPlan: e.target.value })} style={{ width: '100%', background: 'var(--card)', border: '1px solid var(--border)', padding: '12px 16px', borderRadius: '12px', color: 'var(--foreground)', fontSize: '13px', outline: 'none' }}>
                    <option value="Monthly">Monthly Plan</option>
                    <option value="Quarterly">Quarterly Plan</option>
                    <option value="Annual">Annual Plan</option>
                  </select>
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--muted-foreground)', marginBottom: '8px', textTransform: 'uppercase' }}>Notes</label>
                <textarea rows={3} value={formData.notes || ''} onChange={e => setFormData({ ...formData, notes: e.target.value })} style={{ width: '100%', background: 'var(--card)', border: '1px solid var(--border)', padding: '12px 16px', borderRadius: '12px', color: 'var(--foreground)', fontSize: '13px', outline: 'none', resize: 'none' }} placeholder="Additional context about this lead..." />
              </div>
              <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                <button type="button" onClick={() => setShowAddModal(false)} style={{ flex: 1, padding: '14px', borderRadius: '12px', background: 'transparent', border: '1px solid var(--border)', color: 'var(--foreground)', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}>Cancel</button>
                <button type="submit" style={{ flex: 1, padding: '14px', borderRadius: '12px', background: '#fbbf24', border: 'none', color: '#000', fontSize: '13px', fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 16px rgba(251,191,36,0.2)' }}>Save Lead</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
