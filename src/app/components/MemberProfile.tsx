import { useState, useEffect } from 'react';
import { 
  ArrowLeft, Phone, MessageCircle, FileText, Printer, Calendar, 
  Clock, Activity, CreditCard, Camera, Download, CalendarCheck, FileSpreadsheet
} from 'lucide-react';
import { api, Member, AttendanceRecord } from '../services/api';
import { useStore } from '../store/useStore';
import { toast } from 'sonner';
import { exportToExcel, exportToPDF } from '../utils/exportUtils';
import { format } from 'date-fns';

interface MemberProfileProps {
  memberId?: number;
  onBack: () => void;
}

export default function MemberProfile({ memberId, onBack }: MemberProfileProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'timeline' | 'attendance' | 'finances'>('overview');
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const members = useStore(state => state.members);
  const settings = useStore(state => state.settings);
  
  const member = members.find(m => m.id === memberId);

  useEffect(() => {
    if (memberId && activeTab === 'attendance') {
      api.attendance.list({ memberId }).then(data => {
        setAttendance(data);
      }).catch(err => toast.error('Failed to load attendance history'));
    }
  }, [memberId, activeTab]);

  if (!member) return null;

  const handleAction = (action: string) => {
    toast.success(`${action} initiated for ${member.name}.`);
  };

  const handleExportExcel = () => {
    const meta = {
      title: `${member.name} - Attendance History`,
      period: 'All Time',
      generatedBy: 'Admin User',
      totalRecords: attendance.length,
      totalPresent: attendance.filter(a => a.status === 'present').length,
      totalAbsent: attendance.filter(a => a.status === 'absent').length,
      gymName: settings?.gymName
    };
    exportToExcel(attendance, `${member.name}_Attendance`, meta);
  };

  const handleExportPDF = () => {
    const meta = {
      title: `${member.name} - Attendance History`,
      period: 'All Time',
      generatedBy: 'Admin User',
      totalRecords: attendance.length,
      totalPresent: attendance.filter(a => a.status === 'present').length,
      totalAbsent: attendance.filter(a => a.status === 'absent').length,
      gymName: settings?.gymName
    };
    exportToPDF(attendance, `${member.name}_Attendance`, meta);
  };

  return (
    <div style={{ padding: '40px 44px', maxWidth: '1400px', margin: '0 auto' }}>
      
      {/* Back & Actions Header */}
      <div className="animate-fade-up" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <button onClick={onBack} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'transparent', border: 'none', color: 'var(--muted-foreground)', fontSize: '14px', fontWeight: 600, cursor: 'pointer', transition: 'color 0.2s' }} className="hover:text-white">
          <ArrowLeft style={{ width: 16, height: 16 }} /> Back to CRM
        </button>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button onClick={() => handleAction('WhatsApp')} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', borderRadius: '12px', background: 'rgba(74,222,128,0.1)', border: 'none', color: '#4ade80', fontSize: '13px', fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s' }} className="hover:bg-green-400/20">
            <MessageCircle style={{ width: 16, height: 16 }} /> WhatsApp
          </button>
          <button onClick={() => handleAction('Call')} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', borderRadius: '12px', background: 'rgba(56,189,248,0.1)', border: 'none', color: '#38bdf8', fontSize: '13px', fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s' }} className="hover:bg-sky-400/20">
            <Phone style={{ width: 16, height: 16 }} /> Call
          </button>
          <button onClick={() => handleAction('Renew')} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', borderRadius: '12px', background: '#fbbf24', border: 'none', color: '#000', fontSize: '13px', fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s' }} className="hover:brightness-110">
            <CreditCard style={{ width: 16, height: 16 }} /> Renew
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '350px 1fr', gap: '32px' }}>
        
        {/* Left Column: Identity & Contact */}
        <div className="animate-fade-up delay-100" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          <div style={{ background: 'var(--background)', border: '1px solid rgba(30,30,34,0.9)', borderRadius: '24px', padding: '32px', textAlign: 'center', width: '100%' }}>
            <div style={{ width: '120px', height: '120px', borderRadius: '50%', background: 'var(--muted)', margin: '0 auto 24px', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
              <span style={{ fontSize: '40px', fontWeight: 800, color: 'var(--foreground)' }}>{member.name.charAt(0)}</span>
            </div>
            <h2 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--foreground)', margin: '0 0 8px' }}>{member.name}</h2>
            <p style={{ fontSize: '14px', color: 'var(--muted-foreground)', margin: '0 0 24px', fontFamily: "'JetBrains Mono', monospace" }}>{member.phone}</p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', background: 'var(--card)', borderRadius: '12px' }}>
                <span style={{ color: 'var(--muted-foreground)', fontSize: '12px', fontWeight: 600 }}>Status</span>
                <span style={{ color: member.daysRemaining > 0 ? '#4ade80' : '#f87171', fontSize: '12px', fontWeight: 700 }}>
                  {member.daysRemaining > 0 ? `Active (${member.daysRemaining} Days)` : 'Expired'}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', background: 'var(--card)', borderRadius: '12px' }}>
                <span style={{ color: 'var(--muted-foreground)', fontSize: '12px', fontWeight: 600 }}>Plan</span>
                <span style={{ color: 'var(--foreground)', fontSize: '12px', fontWeight: 700 }}>{member.plan}</span>
              </div>
            </div>
          </div>

        </div>

        {/* Right Column: Tabbed Content */}
        <div className="animate-fade-up delay-200">
          <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', borderBottom: '1px solid var(--border)', paddingBottom: '16px' }}>
            {['overview', 'timeline', 'attendance', 'finances'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as any)}
                style={{
                  padding: '10px 20px', borderRadius: '12px', border: 'none', cursor: 'pointer',
                  background: activeTab === tab ? '#fafafa' : 'transparent',
                  color: activeTab === tab ? '#09090b' : '#a1a1aa',
                  fontSize: '13px', fontWeight: 700, textTransform: 'capitalize', transition: 'all 0.2s'
                }}
              >
                {tab}
              </button>
            ))}
          </div>

          {activeTab === 'overview' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
              <div style={{ background: 'var(--background)', border: '1px solid rgba(30,30,34,0.9)', borderRadius: '24px', padding: '24px' }}>
                <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--foreground)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Activity style={{ width: 16, height: 16, color: '#fbbf24' }} /> Details
                </h3>
                <p style={{ fontSize: '13px', color: 'var(--muted-foreground)', lineHeight: 1.6 }}>Join Date: {format(new Date(member.joinDate), 'dd MMM yyyy')}<br />Expiry: {format(new Date(member.expiryDate), 'dd MMM yyyy')}</p>
              </div>
            </div>
          )}

          {activeTab === 'attendance' && (
            <div className="space-y-6">
              <div className="flex gap-4 mb-4">
                <button onClick={handleExportExcel} className="flex items-center gap-2 px-4 py-2 bg-green-500/10 text-green-500 border border-green-500/20 rounded-xl hover:bg-green-500/20 text-sm font-bold">
                  <FileSpreadsheet className="w-4 h-4" /> Export Excel
                </button>
                <button onClick={handleExportPDF} className="flex items-center gap-2 px-4 py-2 bg-red-500/10 text-red-500 border border-red-500/20 rounded-xl hover:bg-red-500/20 text-sm font-bold">
                  <Download className="w-4 h-4" /> Export PDF
                </button>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-2xl">
                  <div className="text-zinc-500 text-xs font-bold uppercase mb-1">Total Visits</div>
                  <div className="text-2xl font-bold text-white font-mono">{attendance.filter(a => a.status === 'present').length}</div>
                </div>
                <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-2xl">
                  <div className="text-zinc-500 text-xs font-bold uppercase mb-1">Missed Days</div>
                  <div className="text-2xl font-bold text-red-400 font-mono">{attendance.filter(a => a.status === 'absent').length}</div>
                </div>
              </div>

              <div className="bg-zinc-950 border border-zinc-800 rounded-2xl overflow-hidden shadow-xl mt-6">
                <table className="w-full text-left border-collapse table-premium">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Check-in</th>
                      <th>Check-out</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {attendance.length === 0 ? (
                      <tr><td colSpan={4} className="p-8 text-center text-zinc-500">No attendance records found.</td></tr>
                    ) : (
                      attendance.map(r => (
                        <tr key={r.id}>
                          <td className="p-4 border-b border-zinc-800 text-sm font-mono text-zinc-300">
                            {r.date ? format(new Date(r.date), 'dd MMM yyyy') : '-'}
                          </td>
                          <td className="p-4 border-b border-zinc-800 text-sm font-mono text-zinc-300">
                            {r.checkInTime ? format(new Date(r.checkInTime), 'hh:mm a') : '-'}
                          </td>
                          <td className="p-4 border-b border-zinc-800 text-sm font-mono text-zinc-300">
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
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'timeline' && (
            <div style={{ background: 'var(--background)', border: '1px solid rgba(30,30,34,0.9)', borderRadius: '24px', padding: '32px' }}>
              <p className="text-zinc-500 text-sm">Timeline functionality coming soon...</p>
            </div>
          )}

          {activeTab === 'finances' && (
            <div style={{ background: 'var(--background)', border: '1px solid rgba(30,30,34,0.9)', borderRadius: '24px', padding: '32px' }}>
              <p className="text-zinc-500 text-sm">Financial history coming soon...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
