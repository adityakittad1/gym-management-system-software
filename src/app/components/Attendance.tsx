import { useState, useEffect, useRef } from 'react';
import { Search, UserCheck, X, Activity, CheckCircle, Flame, Calendar as CalendarIcon, Clock } from 'lucide-react';
import { api, Member, AttendanceRecord } from '../services/api';
import { useStore } from '../store/useStore';
import { toast } from 'sonner';

export default function Attendance() {
  const members = useStore(state => state.members);
  const allAttendance = useStore(state => state.attendance);
  const isLoading = useStore(state => state.loading);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Filter attendance for today
  const todayDate = new Date().toISOString().split('T')[0];
  const attendance = allAttendance.filter(a => a.date === todayDate);

  useEffect(() => {
    // Auto-focus search on load
    if (inputRef.current) inputRef.current.focus();
  }, []);

  const filteredMembers = members.filter(m => 
    m.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    m.phone.includes(searchQuery)
  ).slice(0, 5); // Show top 5 matches for speed

  useEffect(() => {
    setSelectedIndex(0);
  }, [searchQuery]);

  const handleMarkAttendance = async (member: Member, status: 'present' | 'absent') => {
    try {
      const result = await api.attendance.markPresent(member.id);

      if (result.alreadyMarked) {
        toast.warning(`${member.name} is already marked present today.`);
        return;
      }

      toast.success(`✓ ${member.name} — Checked in at ${result.checkInTime}`);
      setSearchQuery('');
      if (inputRef.current) inputRef.current.focus();

      // Supabase Realtime will automatically sync the attendance list via the store
    } catch (err) {
      toast.error(`Failed to mark attendance for ${member.name}. Is the server running?`);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!searchQuery) return;
    
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev < filteredMembers.length - 1 ? prev + 1 : prev));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev > 0 ? prev - 1 : 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredMembers[selectedIndex]) {
        handleMarkAttendance(filteredMembers[selectedIndex], 'present');
      }
    }
  };

  const presentCount = attendance.filter((a) => a.status === 'present').length;
  const absentCount = attendance.filter((a) => a.status === 'absent').length;
  const attendanceRate = members.length > 0 ? Math.round((presentCount / members.length) * 100) : 0;

  if (isLoading && members.length === 0) {
    return (
      <div style={{ padding: '40px 44px', maxWidth: '1000px', margin: '0 auto' }}>
        <div className="animate-pulse" style={{ height: '32px', width: '250px', background: '#151517', borderRadius: '10px', marginBottom: '40px' }} />
        <div className="animate-pulse" style={{ height: '120px', width: '100%', background: 'var(--background)', borderRadius: '20px' }} />
      </div>
    );
  }

  return (
    <div style={{ padding: '40px 44px', maxWidth: '1000px', margin: '0 auto' }}>
      
      {/* Header */}
      <div className="animate-fade-up" style={{ marginBottom: '40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontFamily: "'Syne', sans-serif", fontSize: '28px', fontWeight: 800, color: 'var(--foreground)', letterSpacing: '-0.04em', margin: 0 }}>
            POS Attendance
          </h1>
          <p style={{ color: '#3f3f46', fontSize: '14px', margin: '6px 0 0', fontWeight: 500 }}>
            Type name or phone. Use arrow keys and Enter to mark present.
          </p>
        </div>
      </div>

      {/* POS Search Bar */}
      <div className="animate-fade-up delay-100" style={{ position: 'relative', marginBottom: '40px', zIndex: 10 }}>
        <div style={{ position: 'relative', width: '100%' }}>
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

        {/* Live Search Results */}
        {searchQuery && (
          <div style={{
            position: 'absolute', top: 'calc(100% + 12px)', left: 0, right: 0,
            background: 'var(--background)', border: '1px solid var(--border)',
            borderRadius: '20px', overflow: 'hidden', boxShadow: '0 24px 48px rgba(0,0,0,0.7)',
          }}>
            {filteredMembers.length === 0 ? (
              <div style={{ padding: '24px', textAlign: 'center', color: 'var(--muted-foreground)', fontSize: '14px' }}>No members found</div>
            ) : (
              filteredMembers.map((m, idx) => {
                const isSelected = idx === selectedIndex;
                const existing = attendance.find(a => a.memberId === m.id);
                const isPresent = existing?.status === 'present';

                return (
                  <div
                    key={m.id}
                    onClick={() => handleMarkAttendance(m, 'present')}
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
                          onClick={(e) => { e.stopPropagation(); handleMarkAttendance(m, 'present'); }}
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
      <div className="animate-fade-up delay-200" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '40px' }}>
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

      {/* Recent Check-ins */}
      <div className="animate-fade-up delay-300" style={{ background: 'var(--background)', border: '1px solid rgba(30,30,34,0.9)', borderRadius: '20px', overflow: 'hidden' }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(30,30,34,0.9)', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Clock style={{ width: 16, height: 16, color: 'var(--muted-foreground)' }} />
          <h3 style={{ fontFamily: "'Syne', sans-serif", fontSize: '15px', fontWeight: 700, color: 'var(--foreground)', margin: 0 }}>Recent Check-ins</h3>
        </div>
        <div style={{ padding: '12px' }}>
          {attendance.filter(a => a.status === 'present').slice(0, 10).map((record) => (
            <div key={record.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', borderBottom: '1px solid rgba(30,30,34,0.5)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'var(--card)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--foreground)', fontSize: '12px', fontWeight: 700 }}>
                  {record.memberName.charAt(0)}
                </div>
                <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--foreground)' }}>{record.memberName}</span>
              </div>
              <span style={{ fontSize: '12px', color: 'var(--muted-foreground)', fontFamily: "'JetBrains Mono', monospace" }}>{record.checkInTime}</span>
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
  );
}
