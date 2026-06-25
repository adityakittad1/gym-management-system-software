import { useState, useEffect } from 'react';
import { 
  Search, 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  RefreshCw, 
  X, 
  Calendar as CalendarIcon, 
  Info, 
  Send, 
  Dumbbell, 
  Utensils, 
  Calendar, 
  CreditCard, 
  Award, 
  Sparkles,
  Scale,
  Camera
} from 'lucide-react';
import { api, Member, Trainer, Payment, AttendanceRecord } from '../services/api';
import { useStore } from '../store/useStore';
import { toast } from 'sonner';

interface MembersProps {
  defaultFilter?: 'all' | 'active' | 'expiring' | 'expired';
  setDefaultFilter?: (filter: 'all' | 'active' | 'expiring' | 'expired') => void;
  searchQuery?: string;
}

export default function Members({ defaultFilter = 'all', setDefaultFilter, searchQuery = '' }: MembersProps) {
  const members = useStore(state => state.members);
  const trainers = useStore(state => state.trainers);
  const isLoading = useStore(state => state.loading);
  
  const [filter, setFilter] = useState<'all' | 'active' | 'expiring' | 'expired'>(defaultFilter);
  const [localSearch, setLocalSearch] = useState('');

  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showRenewModal, setShowRenewModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  
  // Member modal tab
  const [modalTab, setModalTab] = useState<'general' | 'workout' | 'diet' | 'attendance' | 'payments' | 'progress'>('general');

  // Member subdata state for tabs
  const [assignedWorkout, setAssignedWorkout] = useState<any>(null);
  const [assignedDiet, setAssignedDiet] = useState<any>(null);
  const [paymentHistory, setPaymentHistory] = useState<Payment[]>([]);
  const [attendanceHistory, setAttendanceHistory] = useState<AttendanceRecord[]>([]);

  // Form states
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [plan, setPlan] = useState('Monthly');
  const [joinDate, setJoinDate] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [trainerId, setTrainerId] = useState<number | undefined>(undefined);
  const [weight, setWeight] = useState<number | undefined>(undefined);
  const [targetWeight, setTargetWeight] = useState<number | undefined>(undefined);
  const [height, setHeight] = useState<number | undefined>(undefined);
  const [bodyFat, setBodyFat] = useState<number | undefined>(undefined);
  const [beforeImage, setBeforeImage] = useState('');
  const [afterImage, setAfterImage] = useState('');

  // Renewal form states
  const [renewPlan, setRenewPlan] = useState('Monthly');
  const [renewAmount, setRenewAmount] = useState(1200);
  const [renewMethod, setRenewMethod] = useState('UPI');

  // Admission payment states
  const [admissionAmount, setAdmissionAmount] = useState(1200);
  const [admissionDiscount, setAdmissionDiscount] = useState(0);
  const [admissionMethod, setAdmissionMethod] = useState('UPI');
  const [admissionStatus, setAdmissionStatus] = useState('paid');

  useEffect(() => {
    setFilter(defaultFilter);
  }, [defaultFilter]);

  const handleFilterClick = (newFilter: 'all' | 'active' | 'expiring' | 'expired') => {
    setFilter(newFilter);
    setDefaultFilter?.(newFilter);
  };

  // Members are loaded globally via useStore, no need to fetch here
  // except for subdata which is handled below.

  // Expiry date auto-calculator
  const calculateExpiry = (startDateStr: string, selectedPlan: string) => {
    if (!startDateStr) return '';
    // Parse as local date by appending T00:00:00 — prevents UTC-midnight timezone shift
    const start = new Date(startDateStr + 'T00:00:00');
    if (isNaN(start.getTime())) return '';

    if (selectedPlan === 'Monthly') {
      start.setMonth(start.getMonth() + 1);
    } else if (selectedPlan === 'Quarterly') {
      start.setMonth(start.getMonth() + 3);
    } else if (selectedPlan === 'Annual') {
      start.setFullYear(start.getFullYear() + 1);
    }
    // Format as local YYYY-MM-DD (not UTC)
    const y = start.getFullYear();
    const mo = String(start.getMonth() + 1).padStart(2, '0');
    const d = String(start.getDate()).padStart(2, '0');
    return `${y}-${mo}-${d}`;
  };

  // Sync expiry date when plan or join date changes
  useEffect(() => {
    if (joinDate) {
      const calculated = calculateExpiry(joinDate, plan);
      setExpiryDate(calculated);
    }
  }, [joinDate, plan]);

  // Sync admission amount when plan changes
  useEffect(() => {
    if (plan === 'Monthly') setAdmissionAmount(1200);
    else if (plan === 'Quarterly') setAdmissionAmount(3000);
    else if (plan === 'Annual') setAdmissionAmount(12000);
  }, [plan]);

  // Sync renewal pre-filled amounts
  useEffect(() => {
    if (renewPlan === 'Monthly') setRenewAmount(1200);
    else if (renewPlan === 'Quarterly') setRenewAmount(3000);
    else if (renewPlan === 'Annual') setRenewAmount(12000);
  }, [renewPlan]);

  // Fetch Member Subdata on modal load
  const loadMemberSubdata = async (member: Member) => {
    try {
      const [w, d, pList, aList] = await Promise.all([
        api.members.getWorkout(member.id),
        api.members.getDiet(member.id),
        api.payments.list(),
        api.members.getAttendanceHistory(member.id)
      ]);
      setAssignedWorkout(w);
      setAssignedDiet(d);
      setPaymentHistory(pList.filter(p => p.memberId === member.id));
      setAttendanceHistory(aList);
    } catch (e) {
      console.warn('Failed to load subdata for member tabs');
    }
  };

  // Open details modal
  const openView = (member: Member) => {
    setSelectedMember(member);
    setModalTab('general');
    loadMemberSubdata(member);
    setShowViewModal(true);
  };

  // Handle open Add Modal
  const openAdd = () => {
    setName('');
    setPhone('');
    setPlan('Monthly');
    const today = new Date().toISOString().split('T')[0];
    setJoinDate(today);
    setTrainerId(trainers[0]?.id);
    setWeight(75);
    setTargetWeight(70);
    setHeight(175);
    setBodyFat(18);
    setBeforeImage('https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=500');
    setAfterImage('https://images.unsplash.com/photo-1483721310020-03333e577078?w=500');
    setAdmissionAmount(1200);
    setAdmissionDiscount(0);
    setAdmissionMethod('UPI');
    setAdmissionStatus('paid');
    setShowAddModal(true);
  };

  // Handle Add Submit
  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone || !plan || !joinDate || !expiryDate) {
      toast.error('Please fill in all mandatory fields');
      return;
    }

    try {
      const memberData = {
        name, phone, plan, joinDate, expiryDate,
        trainerId, weight, targetWeight, height, bodyFat, beforeImage, afterImage 
      };
      
      const paymentData = {
        amount: admissionAmount,
        discount: admissionDiscount,
        finalAmount: admissionAmount - admissionDiscount,
        plan,
        method: admissionMethod,
        status: admissionStatus,
        date: joinDate,
        invoiceNumber: `TTZ-${new Date().getFullYear()}-${Date.now().toString().slice(-6)}`,
        receiptNumber: `RCP-${Date.now().toString().slice(-8)}`,
      };

      await api.members.admit({ memberData, paymentData });
      toast.success(`${name} registered successfully!`);
      setShowAddModal(false);
      // Supabase Realtime will automatically update the store
    } catch (err: any) {
      toast.error(err.message || 'Failed to register member');
    }
  };

  // Handle open Edit Modal
  const openEdit = (member: Member) => {
    setSelectedMember(member);
    setName(member.name);
    setPhone(member.phone);
    setPlan(member.plan);
    setJoinDate(member.joinDate);
    setExpiryDate(member.expiryDate);
    setTrainerId(member.trainerId);
    setWeight(member.weight);
    setTargetWeight(member.targetWeight);
    setHeight(member.height);
    setBodyFat(member.bodyFat);
    setBeforeImage(member.beforeImage || 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=500');
    setAfterImage(member.afterImage || 'https://images.unsplash.com/photo-1483721310020-03333e577078?w=500');
    setShowEditModal(true);
  };

  // Handle Edit Submit
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMember) return;

    try {
      await api.members.update(selectedMember.id, { 
        name, phone, plan, joinDate, expiryDate,
        trainerId, weight, targetWeight, height, bodyFat, beforeImage, afterImage 
      });
      toast.success(`${name} updated successfully!`);
      setShowEditModal(false);
    } catch (err: any) {
      toast.error(err.message || 'Failed to update member');
    }
  };

  // Send fee reminder simulation via WhatsApp
  const handleSendReminder = async (member: Member) => {
    try {
      await api.whatsapp.sendReminders('expiry', member.id);
      toast.success(`Fee reminder sent to ${member.name} successfully! check WhatsApp Logs.`);
    } catch (e) {
      toast.error('Failed to deliver reminder');
    }
  };

  // Handle open Renew Modal
  const openRenew = (member: Member) => {
    setSelectedMember(member);
    setRenewPlan('Monthly');
    setRenewAmount(1200);
    setRenewMethod('UPI');
    setShowRenewModal(true);
  };

  // Handle Renew Submit
  const handleRenewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMember) return;

    try {
      await api.members.renew(selectedMember.id, {
        plan: renewPlan,
        amount: renewAmount,
        method: renewMethod
      });
      toast.success(`Membership for ${selectedMember.name} renewed successfully!`);
      setShowRenewModal(false);
    } catch (err: any) {
      toast.error('Failed to renew membership');
    }
  };

  // Handle Delete Member
  const handleDelete = async (id: number, name: string) => {
    if (window.confirm(`Are you sure you want to cancel and delete ${name}?`)) {
      try {
        await api.members.delete(id);
        toast.success(`${name} removed successfully`);
      } catch (err: any) {
        toast.error('Failed to delete member');
      }
    }
  };

  const getStatusBadge = (status: string, days: number) => {
    if (status === 'active') {
      return (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-green-400/10 text-green-400 border border-green-400/20">
          Active • {days}d left
        </span>
      );
    } else if (status === 'expiring') {
      return (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-orange-400/10 text-orange-400 border border-orange-400/20">
          Expiring • {days}d left
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-red-400/10 text-red-400 border border-red-400/20">
          Expired • {Math.abs(days)}d ago
        </span>
      );
    }
  };

  const activeSearch = searchQuery || localSearch;

  const filteredMembers = members.filter((member) => {
    const matchesFilter = filter === 'all' || member.status === filter;
    const matchesSearch = member.name.toLowerCase().includes(activeSearch.toLowerCase()) ||
                          member.phone.includes(activeSearch);
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="page-container" style={{ padding: '28px', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Header */}
      <div className="animate-fade-up" style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontFamily: "'Syne', sans-serif", fontSize: '26px', fontWeight: 800, color: 'var(--foreground)', letterSpacing: '-0.03em', margin: 0, marginBottom: '6px' }}>Member Management</h1>
          <p style={{ color: 'var(--muted-foreground)', fontSize: '13px', margin: 0 }}>Manage rosters, plans, transformations, and fitness profiles.</p>
        </div>
        <button
          onClick={openAdd}
          style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', borderRadius: '12px', background: 'linear-gradient(135deg, #fbbf24, #f59e0b)', border: 'none', color: '#000', fontSize: '13px', fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 16px rgba(251,191,36,0.25)', transition: 'all 0.2s ease' }}
          onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 8px 24px rgba(251,191,36,0.4)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
          onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 4px 16px rgba(251,191,36,0.25)'; e.currentTarget.style.transform = 'translateY(0)'; }}
        >
          <Plus style={{ width: 16, height: 16 }} />
          Add Member
        </button>
      </div>

      {/* Filters and Search */}
      <div className="animate-fade-up delay-100" style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginBottom: '20px', alignItems: 'center' }}>
        {/* Search */}
        {!searchQuery && (
          <div style={{ flex: 1, minWidth: '200px' }}>
            <div style={{ position: 'relative' }}>
              <Search style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', width: 15, height: 15, color: 'var(--muted-foreground)' }} />
              <input
                type="text"
                value={localSearch}
                onChange={(e) => setLocalSearch(e.target.value)}
                placeholder="Search members by name or phone..."
                style={{ width: '100%', background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '10px', paddingLeft: '36px', paddingRight: '16px', paddingTop: '9px', paddingBottom: '9px', fontSize: '13px', color: '#e4e4e7', outline: 'none', boxSizing: 'border-box' }}
                onFocus={e => { e.currentTarget.style.borderColor = 'rgba(251,191,36,0.4)'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(251,191,36,0.08)'; }}
                onBlur={e => { e.currentTarget.style.borderColor = 'rgba(39,39,42,0.8)'; e.currentTarget.style.boxShadow = 'none'; }}
              />
            </div>
          </div>
        )}

        {/* Filter Pills */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {[
            { id: 'all', label: 'All', count: members.length, activeColor: '#fbbf24' },
            { id: 'active', label: 'Active', count: members.filter(m => m.status === 'active').length, activeColor: '#4ade80' },
            { id: 'expiring', label: 'Expiring', count: members.filter(m => m.status === 'expiring').length, activeColor: '#fb923c' },
            { id: 'expired', label: 'Expired', count: members.filter(m => m.status === 'expired').length, activeColor: '#f87171' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleFilterClick(tab.id as any)}
              style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                padding: '7px 14px', borderRadius: '20px', border: 'none', cursor: 'pointer',
                fontSize: '12px', fontWeight: 700, transition: 'all 0.18s ease',
                background: filter === tab.id ? tab.activeColor : 'rgba(24,24,27,0.7)',
                color: filter === tab.id ? '#000' : '#71717a',
                outline: 'none',
              }}
            >
              {tab.label}
              <span style={{ fontSize: '10px', fontWeight: 800, padding: '1px 6px', borderRadius: '10px', background: filter === tab.id ? 'rgba(0,0,0,0.15)' : 'rgba(39,39,42,0.8)', color: filter === tab.id ? '#000' : '#52525b' }}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Members Table */}
      <div className="animate-fade-up delay-200" style={{ background: 'linear-gradient(135deg, #111113 0%, #0d0d0f 100%)', border: '1px solid var(--border)', borderRadius: '16px', overflow: 'hidden' }}>
        {isLoading ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px', gap: '16px' }}>
            <div style={{ width: '36px', height: '36px', border: '2px solid rgba(251,191,36,0.2)', borderTopColor: '#fbbf24', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
            <p style={{ color: 'var(--muted-foreground)', fontSize: '12px', fontFamily: "'JetBrains Mono', monospace" }}>Loading member database...</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'rgba(9,9,11,0.95)', borderBottom: '1px solid var(--border)' }}>
                  {['Member', 'Phone', 'Plan', 'Joined', 'Expires', 'Status', ''].map(h => (
                    <th key={h} style={{ padding: '14px 20px', textAlign: h === '' ? 'right' : 'left', fontSize: '10px', fontWeight: 700, color: 'var(--muted-foreground)', textTransform: 'uppercase', letterSpacing: '0.1em', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredMembers.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ padding: '48px', textAlign: 'center', color: 'var(--muted-foreground)', fontSize: '13px' }}>
                      No members match your filters.
                    </td>
                  </tr>
                ) : (
                  filteredMembers.map((member, idx) => (
                    <tr
                      key={member.id}
                      style={{ borderBottom: '1px solid rgba(24,24,27,0.8)', transition: 'background 0.15s ease', background: idx % 2 === 1 ? 'rgba(17,17,19,0.3)' : 'transparent' }}
                      onMouseEnter={e => { e.currentTarget.style.background = 'rgba(39,39,42,0.25)'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = idx % 2 === 1 ? 'rgba(17,17,19,0.3)' : 'transparent'; }}
                    >
                      <td style={{ padding: '14px 20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{ width: '32px', height: '32px', minWidth: '32px', borderRadius: '8px', background: 'linear-gradient(135deg, #fbbf24, #f59e0b)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 800, color: '#000' }}>
                            {member.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0,2)}
                          </div>
                          <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--foreground)' }}>{member.name}</span>
                        </div>
                      </td>
                      <td style={{ padding: '14px 20px', fontFamily: "'JetBrains Mono', monospace", fontSize: '11px', color: 'var(--muted-foreground)' }}>{member.phone}</td>
                      <td style={{ padding: '14px 20px' }}>
                        <span style={{ fontSize: '10px', fontWeight: 700, padding: '3px 8px', borderRadius: '6px', background: 'rgba(251,191,36,0.1)', color: '#fbbf24', border: '1px solid rgba(251,191,36,0.2)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                          {member.plan}
                        </span>
                      </td>
                      <td style={{ padding: '14px 20px', fontFamily: "'JetBrains Mono', monospace", fontSize: '11px', color: 'var(--muted-foreground)' }}>{member.joinDate}</td>
                      <td style={{ padding: '14px 20px', fontFamily: "'JetBrains Mono', monospace", fontSize: '11px', color: 'var(--muted-foreground)' }}>{member.expiryDate}</td>
                      <td style={{ padding: '14px 20px' }}>{getStatusBadge(member.status, member.daysRemaining)}</td>
                      <td style={{ padding: '14px 20px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '4px' }}>
                          {[
                            { action: () => openView(member), icon: Eye, title: 'View Profile', hoverColor: '#fbbf24' },
                            { action: () => handleSendReminder(member), icon: Send, title: 'Send Reminder', hoverColor: '#fbbf24' },
                            { action: () => openEdit(member), icon: Edit, title: 'Edit Member', hoverColor: '#60a5fa' },
                            { action: () => openRenew(member), icon: RefreshCw, title: 'Renew Plan', hoverColor: '#4ade80' },
                            { action: () => handleDelete(member.id, member.name), icon: Trash2, title: 'Delete', hoverColor: '#f87171' },
                          ].map(({ action, icon: Icon, title, hoverColor }) => (
                            <button key={title} onClick={action} title={title}
                              style={{ width: '30px', height: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '8px', border: 'none', background: 'transparent', cursor: 'pointer', transition: 'all 0.15s ease', color: 'var(--muted-foreground)' }}
                              onMouseEnter={e => { e.currentTarget.style.background = hoverColor + '15'; e.currentTarget.style.color = hoverColor; }}
                              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#52525b'; }}
                            >
                              <Icon style={{ width: 14, height: 14 }} />
                            </button>
                          ))}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      {/* --- ADD MEMBER MODAL --- */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 z-50">
          <div className="bg-zinc-950 border border-zinc-800 w-full max-w-lg max-h-[95vh] rounded-3xl overflow-hidden shadow-2xl flex flex-col">
            <div className="p-6 border-b border-zinc-850 flex items-center justify-between">
              <h2 className="text-white text-lg font-bold flex items-center gap-2">
                <Plus className="w-5 h-5 text-amber-400" /> Add Gym Member
              </h2>
              <button onClick={() => setShowAddModal(false)} className="text-zinc-500 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleAddSubmit} className="p-6 space-y-4 overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-900 flex-1">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-zinc-400 text-xs font-bold uppercase tracking-wider mb-2">Member Name</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Rahul Sharma"
                    className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-amber-400"
                  />
                </div>
                <div>
                  <label className="block text-zinc-400 text-xs font-bold uppercase tracking-wider mb-2">Phone Number</label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 9876543210"
                    className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white font-mono focus:outline-none focus:ring-1 focus:ring-amber-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-zinc-400 text-xs font-bold uppercase tracking-wider mb-2">Plan Option</label>
                  <select
                    value={plan}
                    onChange={(e) => setPlan(e.target.value)}
                    className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-amber-400"
                  >
                    <option value="Monthly">Monthly Plan</option>
                    <option value="Quarterly">Quarterly Plan</option>
                    <option value="Annual">Annual Plan</option>
                  </select>
                </div>
                <div>
                  <label className="block text-zinc-400 text-xs font-bold uppercase tracking-wider mb-2">Join Date</label>
                  <input
                    type="date"
                    required
                    value={joinDate}
                    onChange={(e) => setJoinDate(e.target.value)}
                    className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white font-mono focus:outline-none focus:ring-1 focus:ring-amber-400"
                  />
                </div>
                <div>
                  <label className="block text-zinc-400 text-xs font-bold uppercase tracking-wider mb-2">Assigned Coach</label>
                  <select
                    value={trainerId}
                    onChange={(e) => setTrainerId(Number(e.target.value))}
                    className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-amber-400"
                  >
                    <option value="">No Coach</option>
                    {trainers.map(t => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Progress metrics */}
              <div className="border-t border-zinc-850 pt-4">
                <span className="text-amber-400 font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 mb-3">
                  <Scale className="w-4 h-4" /> Body metrics configuration
                </span>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-zinc-400 text-[10px] font-bold uppercase tracking-wider mb-1.5">Weight (kg)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={weight || ''}
                      onChange={(e) => setWeight(Number(e.target.value))}
                      className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-zinc-400 text-[10px] font-bold uppercase tracking-wider mb-1.5">Target Weight</label>
                    <input
                      type="number"
                      step="0.1"
                      value={targetWeight || ''}
                      onChange={(e) => setTargetWeight(Number(e.target.value))}
                      className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-zinc-400 text-[10px] font-bold uppercase tracking-wider mb-1.5">Height (cm)</label>
                    <input
                      type="number"
                      value={height || ''}
                      onChange={(e) => setHeight(Number(e.target.value))}
                      className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-zinc-400 text-[10px] font-bold uppercase tracking-wider mb-1.5">Body Fat (%)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={bodyFat || ''}
                      onChange={(e) => setBodyFat(Number(e.target.value))}
                      className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white"
                    />
                  </div>
                </div>
              </div>

              {/* Payment configuration */}
              <div className="border-t border-zinc-850 pt-4">
                <span className="text-amber-400 font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 mb-3">
                  <CreditCard className="w-4 h-4" /> Initial Payment
                </span>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-zinc-400 text-[10px] font-bold uppercase tracking-wider mb-1.5">Amount (₹)</label>
                    <input
                      type="number"
                      value={admissionAmount}
                      onChange={(e) => setAdmissionAmount(Number(e.target.value))}
                      className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-zinc-400 text-[10px] font-bold uppercase tracking-wider mb-1.5">Discount (₹)</label>
                    <input
                      type="number"
                      value={admissionDiscount}
                      onChange={(e) => setAdmissionDiscount(Number(e.target.value))}
                      className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-zinc-400 text-[10px] font-bold uppercase tracking-wider mb-1.5">Method</label>
                    <select
                      value={admissionMethod}
                      onChange={(e) => setAdmissionMethod(e.target.value)}
                      className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-amber-400"
                    >
                      <option value="UPI">UPI</option>
                      <option value="Cash">Cash</option>
                      <option value="Card">Card</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-zinc-400 text-[10px] font-bold uppercase tracking-wider mb-1.5">Status</label>
                    <select
                      value={admissionStatus}
                      onChange={(e) => setAdmissionStatus(e.target.value)}
                      className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-amber-400"
                    >
                      <option value="paid">Paid Full</option>
                      <option value="pending">Pending</option>
                      <option value="partial">Partial</option>
                    </select>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-zinc-550 text-[10px] font-mono uppercase">Calculated Expiry Date</label>
                <div className="mt-1.5 p-3 bg-zinc-900/30 rounded-xl border border-zinc-800 text-amber-400 font-mono text-xs flex items-center gap-2">
                  <CalendarIcon className="w-4 h-4 text-zinc-400" />
                  {expiryDate || 'N/A'}
                </div>
              </div>

              <div className="pt-4 border-t border-zinc-850 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4.5 py-2.5 bg-zinc-900 border border-zinc-800 text-zinc-300 font-bold rounded-xl text-xs uppercase tracking-wider hover:bg-zinc-850 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-amber-400 text-black font-bold rounded-xl text-xs uppercase tracking-wider hover:bg-amber-500 transition shadow-lg shadow-amber-500/10"
                >
                  Save Member
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- EDIT MEMBER MODAL --- */}
      {showEditModal && selectedMember && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-zinc-950 border border-zinc-800 w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl flex flex-col">
            <div className="p-6 border-b border-zinc-850 flex items-center justify-between">
              <h2 className="text-white text-lg font-bold flex items-center gap-2">
                <Edit className="w-5 h-5 text-blue-400" /> Edit Member Profile
              </h2>
              <button onClick={() => setShowEditModal(false)} className="text-zinc-500 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleEditSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-900">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-zinc-400 text-xs font-bold uppercase tracking-wider mb-2">Member Name</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-amber-400"
                  />
                </div>
                <div>
                  <label className="block text-zinc-400 text-xs font-bold uppercase tracking-wider mb-2">Phone Number</label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white font-mono focus:outline-none focus:ring-1 focus:ring-amber-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-zinc-400 text-xs font-bold uppercase tracking-wider mb-2">Plan Option</label>
                  <select
                    value={plan}
                    onChange={(e) => setPlan(e.target.value)}
                    className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-amber-400"
                  >
                    <option value="Monthly">Monthly Plan</option>
                    <option value="Quarterly">Quarterly Plan</option>
                    <option value="Annual">Annual Plan</option>
                  </select>
                </div>
                <div>
                  <label className="block text-zinc-400 text-xs font-bold uppercase tracking-wider mb-2">Join Date</label>
                  <input
                    type="date"
                    required
                    value={joinDate}
                    onChange={(e) => setJoinDate(e.target.value)}
                    className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white font-mono focus:outline-none focus:ring-1 focus:ring-amber-400"
                  />
                </div>
                <div>
                  <label className="block text-zinc-400 text-xs font-bold uppercase tracking-wider mb-2">Assigned Coach</label>
                  <select
                    value={trainerId}
                    onChange={(e) => setTrainerId(Number(e.target.value))}
                    className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-amber-400"
                  >
                    <option value="">No Coach</option>
                    {trainers.map(t => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Progress metrics */}
              <div className="border-t border-zinc-850 pt-4">
                <span className="text-amber-400 font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 mb-3">
                  <Scale className="w-4 h-4" /> Body metrics configuration
                </span>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-zinc-400 text-[10px] font-bold uppercase tracking-wider mb-1.5">Weight (kg)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={weight || ''}
                      onChange={(e) => setWeight(Number(e.target.value))}
                      className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-zinc-400 text-[10px] font-bold uppercase tracking-wider mb-1.5">Target Weight</label>
                    <input
                      type="number"
                      step="0.1"
                      value={targetWeight || ''}
                      onChange={(e) => setTargetWeight(Number(e.target.value))}
                      className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-zinc-400 text-[10px] font-bold uppercase tracking-wider mb-1.5">Height (cm)</label>
                    <input
                      type="number"
                      value={height || ''}
                      onChange={(e) => setHeight(Number(e.target.value))}
                      className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-zinc-400 text-[10px] font-bold uppercase tracking-wider mb-1.5">Body Fat (%)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={bodyFat || ''}
                      onChange={(e) => setBodyFat(Number(e.target.value))}
                      className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-zinc-400 text-xs font-bold uppercase tracking-wider mb-2">Calculated Expiry Date</label>
                <input
                  type="date"
                  required
                  value={expiryDate}
                  onChange={(e) => setExpiryDate(e.target.value)}
                  className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-amber-400 font-mono focus:outline-none focus:ring-1 focus:ring-amber-400"
                />
              </div>

              <div className="pt-4 border-t border-zinc-850 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4.5 py-2.5 bg-zinc-900 border border-zinc-800 text-zinc-300 font-bold rounded-xl text-xs uppercase tracking-wider hover:bg-zinc-850 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-blue-500 text-white font-bold rounded-xl text-xs uppercase tracking-wider hover:bg-blue-600 transition shadow-lg shadow-blue-500/10"
                >
                  Update Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- RENEW MEMBERSHIP MODAL --- */}
      {showRenewModal && selectedMember && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-zinc-950 border border-zinc-800 w-full max-w-md rounded-3xl overflow-hidden shadow-2xl flex flex-col">
            <div className="p-6 border-b border-zinc-850 flex items-center justify-between">
              <h2 className="text-white text-lg font-bold flex items-center gap-2">
                <RefreshCw className="w-5 h-5 text-green-400 animate-spin-slow" /> Renew Membership
              </h2>
              <button onClick={() => setShowRenewModal(false)} className="text-zinc-500 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleRenewSubmit} className="p-6 space-y-4">
              <div className="p-3.5 bg-green-500/5 border border-green-500/15 rounded-xl flex items-start gap-3">
                <Info className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                <p className="text-zinc-400 text-xs leading-relaxed">
                  Renewing membership for <span className="font-bold text-white">{selectedMember.name}</span>. This will set their active join date to today and register a transaction receipt.
                </p>
              </div>
              <div>
                <label className="block text-zinc-400 text-xs font-bold uppercase tracking-wider mb-2">Renewal Plan</label>
                <select
                  value={renewPlan}
                  onChange={(e) => setRenewPlan(e.target.value)}
                  className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-amber-400"
                >
                  <option value="Monthly">Monthly Plan</option>
                  <option value="Quarterly">Quarterly Plan</option>
                  <option value="Annual">Annual Plan</option>
                </select>
              </div>
              <div>
                <label className="block text-zinc-400 text-xs font-bold uppercase tracking-wider mb-2">Renewal Fee (₹)</label>
                <input
                  type="number"
                  required
                  value={renewAmount}
                  onChange={(e) => setRenewAmount(Number(e.target.value))}
                  className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white font-mono focus:outline-none focus:ring-1 focus:ring-amber-400"
                />
              </div>
              <div>
                <label className="block text-zinc-400 text-xs font-bold uppercase tracking-wider mb-2">Payment Method</label>
                <select
                  value={renewMethod}
                  onChange={(e) => setRenewMethod(e.target.value)}
                  className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-amber-400"
                >
                  <option value="UPI">UPI</option>
                  <option value="Cash">Cash</option>
                  <option value="Card">Credit/Debit Card</option>
                </select>
              </div>

              <div className="pt-4 border-t border-zinc-850 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowRenewModal(false)}
                  className="px-4.5 py-2.5 bg-zinc-900 border border-zinc-800 text-zinc-300 font-bold rounded-xl text-xs uppercase tracking-wider hover:bg-zinc-850 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-green-500 text-black font-bold rounded-xl text-xs uppercase tracking-wider hover:bg-green-600 transition shadow-lg shadow-green-500/10"
                >
                  Process Renewal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MULTI-TAB VIEW DETAILS MODAL --- */}
      {showViewModal && selectedMember && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-zinc-950 border border-zinc-800 w-full max-w-2xl rounded-3xl overflow-hidden shadow-2xl flex flex-col h-[85vh] max-h-[700px]">
            
            {/* Header */}
            <div className="p-6 border-b border-zinc-850 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-amber-400/10 rounded-xl flex items-center justify-center text-amber-400 text-xl font-bold border border-amber-400/25 uppercase">
                  {selectedMember.name.substring(0, 2)}
                </div>
                <div>
                  <h2 className="text-white text-lg font-bold leading-tight">{selectedMember.name}</h2>
                  <p className="text-zinc-500 font-mono text-xs">{selectedMember.phone}</p>
                </div>
              </div>
              <button onClick={() => setShowViewModal(false)} className="text-zinc-500 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Tabs Bar */}
            <div className="flex border-b border-zinc-850 px-6 overflow-x-auto bg-zinc-950/40">
              {[
                { id: 'general', label: 'General Info' },
                { id: 'workout', label: 'Workout Plan' },
                { id: 'diet', label: 'Diet Meal' },
                { id: 'attendance', label: 'Attendance' },
                { id: 'payments', label: 'Payments' },
                { id: 'progress', label: 'Transformations' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setModalTab(tab.id as any)}
                  className={`px-4 py-3.5 text-xs font-bold uppercase tracking-wider border-b-2 transition whitespace-nowrap ${
                    modalTab === tab.id
                      ? 'border-amber-400 text-amber-400'
                      : 'border-transparent text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Modal Tab Workspace */}
            <div className="flex-1 overflow-y-auto p-6 bg-black/20">
              
              {/* General Info Tab */}
              {modalTab === 'general' && (
                <div className="grid grid-cols-2 gap-6 text-sm font-mono leading-relaxed">
                  <div>
                    <span className="text-zinc-500 text-[10px] font-bold uppercase tracking-wider block">Membership Plan</span>
                    <span className="text-white font-bold text-sm block mt-0.5">{selectedMember.plan}</span>
                  </div>
                  <div>
                    <span className="text-zinc-500 text-[10px] font-bold uppercase tracking-wider block">Status Badge</span>
                    <div className="mt-1">{getStatusBadge(selectedMember.status, selectedMember.daysRemaining)}</div>
                  </div>
                  <div>
                    <span className="text-zinc-500 text-[10px] font-bold uppercase tracking-wider block">Activation Date</span>
                    <span className="text-white block mt-0.5">{selectedMember.joinDate}</span>
                  </div>
                  <div>
                    <span className="text-zinc-500 text-[10px] font-bold uppercase tracking-wider block">Termination Expiry</span>
                    <span className="text-white block mt-0.5">{selectedMember.expiryDate}</span>
                  </div>
                  <div className="col-span-2 border-t border-zinc-850 pt-4 grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-zinc-500 text-[10px] font-bold uppercase tracking-wider block">Current Weight</span>
                      <span className="text-amber-400 font-extrabold text-base block mt-0.5">{selectedMember.weight || '75'} kg</span>
                    </div>
                    <div>
                      <span className="text-zinc-500 text-[10px] font-bold uppercase tracking-wider block">Target Weight</span>
                      <span className="text-white font-extrabold text-base block mt-0.5">{selectedMember.targetWeight || '70'} kg</span>
                    </div>
                    <div>
                      <span className="text-zinc-500 text-[10px] font-bold uppercase tracking-wider block">Height</span>
                      <span className="text-white font-extrabold text-base block mt-0.5">{selectedMember.height || '175'} cm</span>
                    </div>
                    <div>
                      <span className="text-zinc-500 text-[10px] font-bold uppercase tracking-wider block">Body Fat Ratio</span>
                      <span className="text-white font-extrabold text-base block mt-0.5">{selectedMember.bodyFat || '18'} %</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Workout Tab */}
              {modalTab === 'workout' && (
                <div className="space-y-4">
                  {assignedWorkout ? (
                    <div>
                      <h4 className="text-amber-400 font-bold text-sm mb-3 uppercase tracking-wider">{assignedWorkout.title}</h4>
                      <div className="space-y-4">
                        {Object.entries(assignedWorkout.schedule || {}).map(([day, exercises]: [string, any]) => (
                          <div key={day} className="bg-zinc-900/40 border border-zinc-850 p-4 rounded-xl space-y-2">
                            <span className="text-white font-bold text-xs uppercase tracking-widest">{day}</span>
                            <div className="divide-y divide-zinc-850">
                              {exercises.map((ex: any, idx: number) => (
                                <div key={idx} className="py-2 flex justify-between text-xs">
                                  <div>
                                    <span className="text-zinc-200 font-bold">{ex.name}</span>
                                    {ex.notes && <p className="text-[10px] text-zinc-500 italic mt-0.5">Notes: {ex.notes}</p>}
                                  </div>
                                  <span className="text-amber-400 font-mono font-bold">{ex.sets}x{ex.reps}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <p className="text-zinc-500 text-xs text-center py-6">No custom workout splits assigned yet.</p>
                  )}
                </div>
              )}

              {/* Diet Tab */}
              {modalTab === 'diet' && (
                <div className="space-y-4">
                  {assignedDiet ? (
                    <div>
                      <h4 className="text-amber-400 font-bold text-sm mb-3 uppercase tracking-wider">{assignedDiet.title}</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {Object.entries(assignedDiet.schedule || {}).map(([meal, details]: [string, any]) => (
                          <div key={meal} className="bg-zinc-900/40 border border-zinc-850 p-4 rounded-xl">
                            <span className="text-white font-bold text-xs uppercase tracking-wider">{meal}</span>
                            <p className="text-zinc-400 text-xs mt-2 leading-relaxed">{details}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <p className="text-zinc-500 text-xs text-center py-6">No custom nutrition meal charts prescribed yet.</p>
                  )}
                </div>
              )}

              {/* Attendance Tab */}
              {modalTab === 'attendance' && (
                <div className="space-y-2.5">
                  <span className="text-white font-bold text-xs uppercase tracking-wider block mb-2">Check-in Log History</span>
                  {attendanceHistory.length > 0 ? (
                    attendanceHistory.map((a) => (
                      <div key={a.id} className="bg-zinc-900/40 border border-zinc-850 p-3 rounded-xl flex justify-between items-center text-xs">
                        <span className="text-zinc-350 font-bold">{a.date}</span>
                        <span className="text-zinc-500 font-mono">Time: {a.checkInTime}</span>
                        <span className="bg-emerald-950/40 text-emerald-400 px-2 py-0.5 rounded uppercase font-semibold tracking-wider text-[10px]">
                          {a.status}
                        </span>
                      </div>
                    ))
                  ) : (
                    <p className="text-zinc-500 text-xs text-center py-6">No attendance records found.</p>
                  )}
                </div>
              )}

              {/* Payments Tab */}
              {modalTab === 'payments' && (
                <div className="space-y-2.5">
                  <span className="text-white font-bold text-xs uppercase tracking-wider block mb-2">Transaction History</span>
                  {paymentHistory.length > 0 ? (
                    paymentHistory.map((p) => (
                      <div key={p.id} className="bg-zinc-900/40 border border-zinc-850 p-3 rounded-xl flex justify-between items-center text-xs">
                        <div>
                          <span className="text-white font-bold block">{p.plan} Package</span>
                          <span className="text-zinc-500 text-[10px] block mt-0.5">Date: {p.date} • Mode: {p.method}</span>
                        </div>
                        <span className="text-amber-400 font-black">₹{p.amount.toLocaleString()}</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-zinc-500 text-xs text-center py-6">No payments logs found.</p>
                  )}
                </div>
              )}

              {/* Transformations Tab */}
              {modalTab === 'progress' && (
                <div className="space-y-5">
                  <div className="flex justify-between items-center">
                    <span className="text-white font-bold text-xs uppercase tracking-wider">Before & After Photo Gallery</span>
                    <button
                      onClick={() => toast.success('Simulated photo upload triggered!')}
                      className="text-[10px] bg-zinc-900 border border-zinc-800 text-amber-400 font-bold uppercase tracking-wider px-2.5 py-1.5 rounded-lg flex items-center gap-1 hover:border-amber-400"
                    >
                      <Camera className="w-3.5 h-3.5" /> Upload Photo
                    </button>
                  </div>
                  
                  {/* Photo Cards Grid */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-zinc-900/40 border border-zinc-850 rounded-2xl overflow-hidden p-2 text-center">
                      <img
                        src={selectedMember.beforeImage || 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=400'}
                        alt="Before fitness journey"
                        className="w-full h-40 object-cover rounded-xl border border-zinc-800"
                      />
                      <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold mt-2 block">Day 1 Routine</span>
                    </div>

                    <div className="bg-zinc-900/40 border border-zinc-850 rounded-2xl overflow-hidden p-2 text-center">
                      <img
                        src={selectedMember.afterImage || 'https://images.unsplash.com/photo-1483721310020-03333e577078?w=400'}
                        alt="After fitness journey"
                        className="w-full h-40 object-cover rounded-xl border border-zinc-800"
                      />
                      <span className="text-[10px] text-amber-400 uppercase tracking-widest font-bold mt-2 block">Goal Transformation</span>
                    </div>
                  </div>
                </div>
              )}

            </div>

            {/* Footer */}
            <div className="p-6 border-t border-zinc-850 flex justify-end">
              <button
                type="button"
                onClick={() => setShowViewModal(false)}
                className="px-6 py-2.5 bg-zinc-900 border border-zinc-800 text-zinc-300 font-bold rounded-xl text-xs uppercase tracking-wider hover:bg-zinc-850 transition"
              >
                Close
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
