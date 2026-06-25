import { useState, useEffect, useRef, useMemo } from 'react';
import { Search, UserCheck, X, Activity, CheckCircle, Clock, Calendar as CalendarIcon, Download, FileText, Printer, FileSpreadsheet, List, User } from 'lucide-react';
import { api, Member, AttendanceRecord } from '../services/api';
import { useStore } from '../store/useStore';
import { toast } from 'sonner';
import { exportToExcel, exportToCSV, exportToPDF, printAttendanceRegister } from '../utils/exportUtils';
import { format, subDays, startOfMonth, subMonths, endOfMonth } from 'date-fns';

export default function Attendance() {
  const [activeTab, setActiveTab] = useState<'pos' | 'register'>('pos');
  const members = useStore(state => state.members);
  const trainers = useStore(state => state.trainers);
  const allAttendance = useStore(state => state.attendance);
  const settings = useStore(state => state.settings);
  const isLoading = useStore(state => state.loading);

  // ---------- POS Check-in State ----------
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const todayDate = new Date().toISOString().split('T')[0];
  const attendanceToday = allAttendance.filter(a => a.date === todayDate);

  useEffect(() => {
    if (activeTab === 'pos' && inputRef.current) inputRef.current.focus();
  }, [activeTab]);

  const filteredMembers = members.filter(m => 
    m.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    m.phone.includes(searchQuery)
  ).slice(0, 5);

  useEffect(() => { setSelectedIndex(0); }, [searchQuery]);

  const handleMarkAttendance = async (member: Member) => {
    try {
      const result = await api.attendance.markPresent(member.id);
      if (result.alreadyMarked) {
        toast.warning(`${member.name} is already marked present today.`);
        return;
      }
      toast.success(`✓ ${member.name} — Checked in at ${format(new Date(result.checkInTime), 'hh:mm a')}`);
      setSearchQuery('');
      if (inputRef.current) inputRef.current.focus();
    } catch (err: any) {
      toast.error(`Failed: ${err.message}`);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!searchQuery) return;
    if (e.key === 'ArrowDown') { e.preventDefault(); setSelectedIndex(prev => (prev < filteredMembers.length - 1 ? prev + 1 : prev)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setSelectedIndex(prev => (prev > 0 ? prev - 1 : 0)); }
    else if (e.key === 'Enter') { e.preventDefault(); if (filteredMembers[selectedIndex]) handleMarkAttendance(filteredMembers[selectedIndex]); }
  };

  const presentCount = attendanceToday.filter((a) => a.status === 'present').length;
  const attendanceRate = members.length > 0 ? Math.round((presentCount / members.length) * 100) : 0;

  // ---------- Register State ----------
  const [registerData, setRegisterData] = useState<AttendanceRecord[]>([]);
  const [isRegisterLoading, setIsRegisterLoading] = useState(false);
  const [dateFilter, setDateFilter] = useState('today');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchFilter, setSearchFilter] = useState('');

  const fetchRegister = async () => {
    try {
      setIsRegisterLoading(true);
      let start = '';
      let end = '';
      const today = new Date();
      
      if (dateFilter === 'today') { start = format(today, 'yyyy-MM-dd'); end = start; }
      else if (dateFilter === 'yesterday') { start = format(subDays(today, 1), 'yyyy-MM-dd'); end = start; }
      else if (dateFilter === 'last7') { start = format(subDays(today, 6), 'yyyy-MM-dd'); end = format(today, 'yyyy-MM-dd'); }
      else if (dateFilter === 'last30') { start = format(subDays(today, 29), 'yyyy-MM-dd'); end = format(today, 'yyyy-MM-dd'); }
      else if (dateFilter === 'thisMonth') { start = format(startOfMonth(today), 'yyyy-MM-dd'); end = format(today, 'yyyy-MM-dd'); }
      else if (dateFilter === 'lastMonth') { 
        const lastM = subMonths(today, 1);
        start = format(startOfMonth(lastM), 'yyyy-MM-dd'); 
        end = format(endOfMonth(lastM), 'yyyy-MM-dd'); 
      }
      else if (dateFilter === 'custom') { start = customStart; end = customEnd; }
      
      if (dateFilter === 'custom' && (!start || !end)) return; // Wait for both
      
      const data = await api.attendance.list(start && end ? { startDate: start, endDate: end } : undefined);
      
      // Enrich with Member Plan and Coach
      const enriched = data.map(record => {
        const m = members.find(x => String(x.id) === String(record.memberId));
        const coach = m?.trainerId ? trainers.find(t => t.id === m.trainerId)?.name : 'None';
        return { ...record, plan: m?.plan || '-', coach: coach || '-' };
      });
      setRegisterData(enriched);
    } catch (err: any) {
      toast.error('Failed to load register: ' + err.message);
    } finally {
      setIsRegisterLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'register') {
      if (dateFilter === 'custom' && (!customStart || !customEnd)) return;
      fetchRegister();
    }
  }, [activeTab, dateFilter, customStart, customEnd, members, trainers]);

  const handleCheckout = async (id: string | number) => {
    try {
      await api.attendance.checkOut(id);
      toast.success('Marked check-out successfully!');
      fetchRegister();
      useStore.getState().fetchInitialData();
    } catch(err:any) {
      toast.error('Failed to checkout');
    }
  };

  const filteredRegister = useMemo(() => {
    return registerData.filter(r => {
      if (statusFilter !== 'all' && r.status !== statusFilter) return false;
      if (searchFilter) {
        const q = searchFilter.toLowerCase();
        const matchName = r.memberName?.toLowerCase().includes(q);
        const matchPhone = r.memberPhone?.includes(q);
        const matchId = String(r.memberId).includes(q);
        if (!matchName && !matchPhone && !matchId) return false;
      }
      return true;
    });
  }, [registerData, statusFilter, searchFilter]);

  const getExportMeta = () => ({
    title: 'Attendance Register',
    period: dateFilter === 'custom' ? `${customStart} to ${customEnd}` : dateFilter.toUpperCase(),
    generatedBy: 'Admin User',
    totalRecords: filteredRegister.length,
    totalPresent: filteredRegister.filter(r => r.status === 'present').length,
    totalAbsent: filteredRegister.filter(r => r.status === 'absent').length,
    gymName: settings?.gymName,
    gymPhone: settings?.primaryPhone,
    gymAddress: settings?.address
  });

  const doExportExcel = () => exportToExcel(filteredRegister, `Attendance_${format(new Date(), 'yyyy-MM-dd')}`, getExportMeta());
  const doExportCSV = () => exportToCSV(filteredRegister, `Attendance_${format(new Date(), 'yyyy-MM-dd')}`);
  const doExportPDF = () => exportToPDF(filteredRegister, `Attendance_${format(new Date(), 'yyyy-MM-dd')}`, getExportMeta());
  const doPrint = () => { setTimeout(() => printAttendanceRegister(), 100); };

  if (isLoading && members.length === 0) {
    return (
      <div style={{ padding: '40px 44px', maxWidth: '1200px', margin: '0 auto' }}>
        <div className="animate-pulse" style={{ height: '32px', width: '250px', background: '#151517', borderRadius: '10px', marginBottom: '40px' }} />
      </div>
    );
  }

  return (
    <div className="print-hide" style={{ padding: '40px 44px', maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
      
      {/* Header & Tabs */}
      <div className="animate-fade-up" style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontFamily: "'Syne', sans-serif", fontSize: '28px', fontWeight: 800, color: 'var(--foreground)', letterSpacing: '-0.04em', margin: 0 }}>
            Attendance
          </h1>
          <p style={{ color: '#3f3f46', fontSize: '14px', margin: '6px 0 0', fontWeight: 500 }}>
            Manage daily check-ins and attendance records
          </p>
        </div>
        
        <div style={{ display: 'flex', background: 'var(--card)', padding: '6px', borderRadius: '16px', border: '1px solid var(--border)' }}>
          <button
            onClick={() => setActiveTab('pos')}
            style={{ padding: '8px 24px', borderRadius: '12px', fontSize: '14px', fontWeight: 700, border: 'none', cursor: 'pointer', transition: 'all 0.2s',
              background: activeTab === 'pos' ? 'var(--foreground)' : 'transparent',
              color: activeTab === 'pos' ? 'var(--background)' : 'var(--muted-foreground)'
            }}
          >
            POS Check-in
          </button>
          <button
            onClick={() => setActiveTab('register')}
            style={{ padding: '8px 24px', borderRadius: '12px', fontSize: '14px', fontWeight: 700, border: 'none', cursor: 'pointer', transition: 'all 0.2s',
              background: activeTab === 'register' ? 'var(--foreground)' : 'transparent',
              color: activeTab === 'register' ? 'var(--background)' : 'var(--muted-foreground)'
            }}
          >
            Register & Exports
          </button>
        </div>
      </div>

      {activeTab === 'pos' && (
        <div className="animate-fade-in">
          {/* POS Search Bar */}
          <div style={{ position: 'relative', marginBottom: '40px', zIndex: 10 }}>
            <div style={{ position: 'relative', width: '100%', maxWidth: '800px', margin: '0 auto' }}>
              <Search style={{ position: 'absolute', left: 24, top: '50%', transform: 'translateY(-50%)', width: 28, height: 28, color: '#fbbf24' }} />
              <input
                ref={inputRef}
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Search member by name or phone..."
                style={{
                  width: '100%', background: 'var(--background)', border: '2px solid rgba(251,191,36,0.3)',
                  padding: '24px 24px 24px 68px', borderRadius: '24px', color: 'var(--foreground)',
                  fontSize: '20px', fontWeight: 600, outline: 'none', boxShadow: '0 24px 48px rgba(0,0,0,0.5)',
                  transition: 'border-color 0.2s'
                }}
                onFocus={e => e.target.style.borderColor = '#fbbf24'}
                onBlur={e => e.target.style.borderColor = 'rgba(251,191,36,0.3)'}
              />
            </div>

            {searchQuery && (
              <div style={{
                position: 'absolute', top: 'calc(100% + 12px)', left: '50%', transform: 'translateX(-50%)', width: '100%', maxWidth: '800px',
                background: 'var(--background)', border: '1px solid var(--border)',
                borderRadius: '20px', overflow: 'hidden', boxShadow: '0 24px 48px rgba(0,0,0,0.7)',
              }}>
                {filteredMembers.length === 0 ? (
                  <div style={{ padding: '24px', textAlign: 'center', color: 'var(--muted-foreground)', fontSize: '14px' }}>No members found</div>
                ) : (
                  filteredMembers.map((m, idx) => {
                    const isSelected = idx === selectedIndex;
                    const existing = attendanceToday.find(a => String(a.memberId) === String(m.id));
                    const isPresent = existing?.status === 'present';
                    return (
                      <div
                        key={m.id}
                        onClick={() => handleMarkAttendance(m)}
                        style={{
                          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                          padding: '16px 24px', cursor: 'pointer',
                          background: isSelected ? 'rgba(251,191,36,0.1)' : 'transparent',
                          borderBottom: '1px solid rgba(30,30,34,0.5)',
                          transition: 'background 0.1s'
                        }}
                        onMouseEnter={() => setSelectedIndex(idx)}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                          <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'var(--muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', fontWeight: 700, color: 'var(--foreground)' }}>
                            {m.name.charAt(0)}
                          </div>
                          <div>
                            <span style={{ fontSize: '16px', fontWeight: 700, color: 'var(--foreground)', display: 'block' }}>{m.name}</span>
                            <div style={{ display: 'flex', gap: '12px', marginTop: '4px' }}>
                              <span style={{ fontSize: '12px', color: 'var(--muted-foreground)', fontFamily: "'JetBrains Mono', monospace" }}>{m.phone}</span>
                              <span style={{ fontSize: '12px', color: m.daysRemaining > 0 ? '#4ade80' : '#f87171', fontWeight: 600 }}>{m.daysRemaining > 0 ? 'Active' : 'Expired'}</span>
                            </div>
                          </div>
                        </div>
                        
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          {isPresent ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(74,222,128,0.1)', color: '#4ade80', padding: '8px 16px', borderRadius: '12px', fontSize: '13px', fontWeight: 700 }}>
                              <CheckCircle style={{ width: 16, height: 16 }} /> Marked
                            </div>
                          ) : (
                            <button
                              onClick={(e) => { e.stopPropagation(); handleMarkAttendance(m); }}
                              style={{ background: isSelected ? '#fbbf24' : '#fafafa', border: 'none', color: '#09090b', padding: '10px 20px', borderRadius: '12px', fontSize: '13px', fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: '6px' }}
                            >
                              <UserCheck style={{ width: 16, height: 16 }} /> Present
                              {isSelected && <span style={{ opacity: 0.5, fontSize: '10px', marginLeft: '4px' }}>[ENTER]</span>}
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </div>

          {/* Today's Dashboard Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '40px', maxWidth: '800px', margin: '0 auto 40px' }}>
            <div style={{ background: 'var(--background)', border: '1px solid rgba(30,30,34,0.9)', borderRadius: '20px', padding: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(74,222,128,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <UserCheck style={{ width: 16, height: 16, color: '#4ade80' }} />
                </div>
                <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--muted-foreground)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Present Today</span>
              </div>
              <div style={{ fontSize: '36px', fontWeight: 800, color: 'var(--foreground)', fontFamily: "'JetBrains Mono', monospace", letterSpacing: '-0.03em' }}>
                {presentCount}
              </div>
            </div>

            <div style={{ background: 'var(--background)', border: '1px solid rgba(30,30,34,0.9)', borderRadius: '20px', padding: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(248,113,113,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <X style={{ width: 16, height: 16, color: '#f87171' }} />
                </div>
                <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--muted-foreground)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Absent / Pending</span>
              </div>
              <div style={{ fontSize: '36px', fontWeight: 800, color: 'var(--foreground)', fontFamily: "'JetBrains Mono', monospace", letterSpacing: '-0.03em' }}>
                {members.length - presentCount}
              </div>
            </div>

            <div style={{ background: 'var(--background)', border: '1px solid rgba(30,30,34,0.9)', borderRadius: '20px', padding: '24px', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: 0, right: 0, width: '100px', height: '100px', background: '#fbbf24', opacity: 0.05, filter: 'blur(30px)' }} />
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(251,191,36,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Activity style={{ width: 16, height: 16, color: '#fbbf24' }} />
                </div>
                <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--muted-foreground)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Daily Rate</span>
              </div>
              <div style={{ fontSize: '36px', fontWeight: 800, color: 'var(--foreground)', fontFamily: "'JetBrains Mono', monospace", letterSpacing: '-0.03em' }}>
                {attendanceRate}%
              </div>
            </div>
          </div>

          <div style={{ background: 'var(--background)', border: '1px solid rgba(30,30,34,0.9)', borderRadius: '20px', overflow: 'hidden', maxWidth: '800px', margin: '0 auto' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(30,30,34,0.9)', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Clock style={{ width: 16, height: 16, color: 'var(--muted-foreground)' }} />
              <h3 style={{ fontFamily: "'Syne', sans-serif", fontSize: '15px', fontWeight: 700, color: 'var(--foreground)', margin: 0 }}>Recent Check-ins Today</h3>
            </div>
            <div style={{ padding: '12px' }}>
              {attendanceToday.filter(a => a.status === 'present').slice(0, 10).map((record) => (
                <div key={record.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', borderBottom: '1px solid rgba(30,30,34,0.5)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'var(--card)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--foreground)', fontSize: '12px', fontWeight: 700 }}>
                      {record.memberName.charAt(0)}
                    </div>
                    <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--foreground)' }}>{record.memberName}</span>
                  </div>
                  <span style={{ fontSize: '12px', color: 'var(--muted-foreground)', fontFamily: "'JetBrains Mono', monospace" }}>
                    {record.checkInTime ? format(new Date(record.checkInTime), 'hh:mm a') : '-'}
                  </span>
                </div>
              ))}
              {presentCount === 0 && (
                <div style={{ padding: '40px', textAlign: 'center', color: 'var(--muted-foreground)', fontSize: '13px' }}>
                  No check-ins yet today.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'register' && (
        <div className="animate-fade-in space-y-6">
          {/* Controls */}
          <div className="flex flex-col md:flex-row gap-4 items-end justify-between glass-card p-6 rounded-3xl">
            <div className="flex flex-wrap gap-4 w-full md:w-auto">
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Date Period</label>
                <select 
                  value={dateFilter} 
                  onChange={e => setDateFilter(e.target.value)}
                  className="bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-amber-400"
                >
                  <option value="today">Today</option>
                  <option value="yesterday">Yesterday</option>
                  <option value="last7">Last 7 Days</option>
                  <option value="last30">Last 30 Days</option>
                  <option value="thisMonth">This Month</option>
                  <option value="lastMonth">Last Month</option>
                  <option value="custom">Custom Range</option>
                </select>
              </div>

              {dateFilter === 'custom' && (
                <>
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Start Date</label>
                    <input type="date" value={customStart} onChange={e => setCustomStart(e.target.value)} className="bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-amber-400" />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">End Date</label>
                    <input type="date" value={customEnd} onChange={e => setCustomEnd(e.target.value)} className="bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-amber-400" />
                  </div>
                </>
              )}

              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Status</label>
                <select 
                  value={statusFilter} 
                  onChange={e => setStatusFilter(e.target.value)}
                  className="bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-amber-400"
                >
                  <option value="all">All</option>
                  <option value="present">Present</option>
                  <option value="absent">Absent</option>
                  <option value="late">Late</option>
                </select>
              </div>

              <div className="flex flex-col gap-2 flex-1 min-w-[200px]">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Search</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                  <input 
                    type="text" 
                    placeholder="Search name, phone, ID..."
                    value={searchFilter}
                    onChange={e => setSearchFilter(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white outline-none focus:border-amber-400" 
                  />
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 md:ml-auto">
              <button onClick={doExportExcel} className="flex items-center gap-2 px-4 py-2.5 bg-green-500/10 text-green-500 border border-green-500/20 rounded-xl hover:bg-green-500/20 transition-all text-sm font-bold">
                <FileSpreadsheet className="w-4 h-4" /> Excel
              </button>
              <button onClick={doExportCSV} className="flex items-center gap-2 px-4 py-2.5 bg-blue-500/10 text-blue-500 border border-blue-500/20 rounded-xl hover:bg-blue-500/20 transition-all text-sm font-bold">
                <FileText className="w-4 h-4" /> CSV
              </button>
              <button onClick={doExportPDF} className="flex items-center gap-2 px-4 py-2.5 bg-red-500/10 text-red-500 border border-red-500/20 rounded-xl hover:bg-red-500/20 transition-all text-sm font-bold">
                <Download className="w-4 h-4" /> PDF
              </button>
              <button onClick={doPrint} className="flex items-center gap-2 px-4 py-2.5 bg-zinc-800 text-white border border-zinc-700 rounded-xl hover:bg-zinc-700 transition-all text-sm font-bold">
                <Printer className="w-4 h-4" /> Print
              </button>
            </div>
          </div>

          {/* Stats Summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-2xl">
              <div className="text-zinc-500 text-xs font-bold uppercase mb-1">Total Records</div>
              <div className="text-2xl font-bold text-white font-mono">{filteredRegister.length}</div>
            </div>
            <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-2xl">
              <div className="text-zinc-500 text-xs font-bold uppercase mb-1">Total Present</div>
              <div className="text-2xl font-bold text-green-400 font-mono">{filteredRegister.filter(r => r.status === 'present').length}</div>
            </div>
            <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-2xl">
              <div className="text-zinc-500 text-xs font-bold uppercase mb-1">Total Absent</div>
              <div className="text-2xl font-bold text-red-400 font-mono">{filteredRegister.filter(r => r.status === 'absent').length}</div>
            </div>
            <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-2xl">
              <div className="text-zinc-500 text-xs font-bold uppercase mb-1">Avg Attendance</div>
              <div className="text-2xl font-bold text-amber-400 font-mono">
                {filteredRegister.length > 0 ? Math.round((filteredRegister.filter(r => r.status === 'present').length / filteredRegister.length) * 100) : 0}%
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="bg-zinc-950 border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse table-premium min-w-[1000px]">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Member ID</th>
                    <th>Name</th>
                    <th>Phone</th>
                    <th>Plan / Coach</th>
                    <th>Check-in</th>
                    <th>Check-out</th>
                    <th>Status</th>
                    <th className="text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {isRegisterLoading ? (
                    <tr><td colSpan={9} className="p-8 text-center text-zinc-500">Loading register...</td></tr>
                  ) : filteredRegister.length === 0 ? (
                    <tr><td colSpan={9} className="p-8 text-center text-zinc-500">No attendance records found for this filter.</td></tr>
                  ) : (
                    filteredRegister.map(r => (
                      <tr key={r.id}>
                        <td className="p-4 border-b border-zinc-800">
                          <span className="text-zinc-300 font-mono text-sm">{r.date ? format(new Date(r.date), 'dd MMM yyyy') : '-'}</span>
                        </td>
                        <td className="p-4 border-b border-zinc-800 text-xs text-zinc-500 font-mono">
                          #{String(r.memberId).slice(0, 8)}
                        </td>
                        <td className="p-4 border-b border-zinc-800">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center text-xs font-bold text-white">
                              {r.memberName?.charAt(0) || 'U'}
                            </div>
                            <span className="text-sm font-bold text-zinc-200">{r.memberName || '-'}</span>
                          </div>
                        </td>
                        <td className="p-4 border-b border-zinc-800 text-sm text-zinc-400 font-mono">
                          {r.memberPhone || '-'}
                        </td>
                        <td className="p-4 border-b border-zinc-800">
                          <div className="text-sm text-zinc-300">{r.plan || '-'}</div>
                          <div className="text-xs text-zinc-500">{r.coach || '-'}</div>
                        </td>
                        <td className="p-4 border-b border-zinc-800 text-sm text-zinc-300 font-mono">
                          {r.checkInTime ? format(new Date(r.checkInTime), 'hh:mm a') : '-'}
                        </td>
                        <td className="p-4 border-b border-zinc-800 text-sm text-zinc-300 font-mono">
                          {r.checkOutTime ? format(new Date(r.checkOutTime), 'hh:mm a') : '-'}
                        </td>
                        <td className="p-4 border-b border-zinc-800">
                          <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                            r.status === 'present' ? 'bg-green-500/10 text-green-500 border-green-500/20' :
                            r.status === 'absent' ? 'bg-red-500/10 text-red-500 border-red-500/20' :
                            'bg-zinc-800 text-zinc-400 border-zinc-700'
                          }`}>
                            {r.status || 'unknown'}
                          </span>
                        </td>
                        <td className="p-4 border-b border-zinc-800 text-right">
                          {r.status === 'present' && !r.checkOutTime && (
                            <button
                              onClick={() => handleCheckout(r.id)}
                              className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-bold rounded-lg transition-colors border border-zinc-700"
                            >
                              Check Out
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Invisible Print Layout */}
      <div className="print-only">
        <div style={{ textAlign: 'center', marginBottom: 30 }}>
          <h1 style={{ fontSize: 24, margin: 0 }}>{settings?.gymName || 'TTZ Gym'}</h1>
          <p style={{ margin: '4px 0', fontSize: 12 }}>{settings?.address}</p>
          <p style={{ margin: '4px 0', fontSize: 12 }}>Phone: {settings?.primaryPhone}</p>
          <h2 style={{ fontSize: 18, marginTop: 20 }}>Attendance Register</h2>
          <p style={{ fontSize: 12 }}>Period: {dateFilter === 'custom' ? `${customStart} to ${customEnd}` : dateFilter.toUpperCase()}</p>
        </div>
        <table className="print-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Check-in</th>
              <th>Check-out</th>
              <th>Member Name</th>
              <th>Phone</th>
              <th>Plan</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {filteredRegister.map(r => (
              <tr key={r.id}>
                <td>{r.date ? format(new Date(r.date), 'dd MMM yyyy') : '-'}</td>
                <td>{r.checkInTime ? format(new Date(r.checkInTime), 'hh:mm a') : '-'}</td>
                <td>{r.checkOutTime ? format(new Date(r.checkOutTime), 'hh:mm a') : '-'}</td>
                <td>{r.memberName}</td>
                <td>{r.memberPhone}</td>
                <td>{r.plan}</td>
                <td>{(r.status || '').toUpperCase()}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div style={{ marginTop: 30, fontSize: 10, textAlign: 'center', color: '#666' }}>
          Generated on {format(new Date(), 'dd MMM yyyy hh:mm a')}
        </div>
      </div>

    </div>
  );
}
