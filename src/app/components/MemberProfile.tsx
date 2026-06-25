import { useState } from 'react';
import { 
  ArrowLeft, Phone, MessageCircle, FileText, Printer, Calendar, 
  Clock, Activity, CreditCard, Camera, Settings, Download, MoreVertical
} from 'lucide-react';
import { Member } from '../services/api';
import { toast } from 'sonner';

interface MemberProfileProps {
  memberId?: number;
  onBack: () => void;
}

export default function MemberProfile({ memberId, onBack }: MemberProfileProps) {
  // In a real app, fetch member by ID. For now, we mock.
  const [activeTab, setActiveTab] = useState<'overview' | 'timeline' | 'attendance' | 'finances'>('overview');

  const handleAction = (action: string) => {
    toast.success(`${action} initiated for member.`);
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
        <div className="animate-fade-up delay-100" style={{ display: 'flex', flexDirection: 'col', gap: '24px' }}>
          
          <div style={{ background: 'var(--background)', border: '1px solid rgba(30,30,34,0.9)', borderRadius: '24px', padding: '32px', textAlign: 'center', width: '100%' }}>
            <div style={{ width: '120px', height: '120px', borderRadius: '50%', background: 'var(--muted)', margin: '0 auto 24px', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
              <span style={{ fontSize: '40px', fontWeight: 800, color: 'var(--foreground)' }}>A</span>
              <button style={{ position: 'absolute', bottom: 0, right: 0, background: '#fbbf24', border: 'none', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                <Camera style={{ width: 16, height: 16, color: '#000' }} />
              </button>
            </div>
            <h2 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--foreground)', margin: '0 0 8px' }}>Aditya Kittad</h2>
            <p style={{ fontSize: '14px', color: 'var(--muted-foreground)', margin: '0 0 24px', fontFamily: "'JetBrains Mono', monospace" }}>+91 8668891406</p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', background: 'var(--card)', borderRadius: '12px' }}>
                <span style={{ color: 'var(--muted-foreground)', fontSize: '12px', fontWeight: 600 }}>Status</span>
                <span style={{ color: '#4ade80', fontSize: '12px', fontWeight: 700 }}>Active (45 Days Left)</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', background: 'var(--card)', borderRadius: '12px' }}>
                <span style={{ color: 'var(--muted-foreground)', fontSize: '12px', fontWeight: 600 }}>Plan</span>
                <span style={{ color: 'var(--foreground)', fontSize: '12px', fontWeight: 700 }}>Annual Pro</span>
              </div>
            </div>
          </div>

          <div style={{ background: 'var(--background)', border: '1px solid rgba(30,30,34,0.9)', borderRadius: '24px', padding: '24px', width: '100%' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--foreground)', margin: '0 0 20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FileText style={{ width: 16, height: 16, color: '#fbbf24' }} /> Reports & Docs
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <button onClick={() => handleAction('Download Profile PDF')} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', background: 'transparent', border: '1px solid var(--border)', borderRadius: '12px', color: 'var(--foreground)', fontSize: '13px', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }} className="hover:bg-zinc-900">
                <Printer style={{ width: 16, height: 16 }} /> Print Full Profile
              </button>
              <button onClick={() => handleAction('Download Receipt')} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', background: 'transparent', border: '1px solid var(--border)', borderRadius: '12px', color: 'var(--foreground)', fontSize: '13px', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }} className="hover:bg-zinc-900">
                <Download style={{ width: 16, height: 16 }} /> Latest Invoice PDF
              </button>
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
                  <Activity style={{ width: 16, height: 16, color: '#fbbf24' }} /> Workout Plan
                </h3>
                <p style={{ fontSize: '13px', color: 'var(--muted-foreground)', lineHeight: 1.6 }}>Assigned: Hypertrophy Split V2<br />Goal: Gain Muscle<br />Trainer: Coach Rajesh</p>
              </div>
              <div style={{ background: 'var(--background)', border: '1px solid rgba(30,30,34,0.9)', borderRadius: '24px', padding: '24px' }}>
                <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--foreground)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Activity style={{ width: 16, height: 16, color: '#fbbf24' }} /> Diet Plan
                </h3>
                <p style={{ fontSize: '13px', color: 'var(--muted-foreground)', lineHeight: 1.6 }}>Assigned: 3000 kcal Bulking<br />Allergies: None</p>
              </div>
              <div style={{ gridColumn: '1 / -1', background: 'var(--background)', border: '1px solid rgba(30,30,34,0.9)', borderRadius: '24px', padding: '24px' }}>
                <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--foreground)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Camera style={{ width: 16, height: 16, color: '#fbbf24' }} /> Transformation Progress
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
                  <div style={{ background: 'var(--card)', height: '160px', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted-foreground)', fontSize: '12px' }}>Day 1</div>
                  <div style={{ background: 'var(--card)', height: '160px', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted-foreground)', fontSize: '12px' }}>Day 30</div>
                  <button style={{ background: 'rgba(251,191,36,0.05)', border: '1px dashed rgba(251,191,36,0.3)', height: '160px', borderRadius: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#fbbf24', fontSize: '12px', cursor: 'pointer' }}>
                    <Camera style={{ width: 24, height: 24, marginBottom: '8px' }} />
                    Add Photo
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'timeline' && (
            <div style={{ background: 'var(--background)', border: '1px solid rgba(30,30,34,0.9)', borderRadius: '24px', padding: '32px' }}>
              <div style={{ borderLeft: '2px solid rgba(63,63,70,0.5)', paddingLeft: '24px', display: 'flex', flexDirection: 'column', gap: '32px' }}>
                <div style={{ position: 'relative' }}>
                  <div style={{ position: 'absolute', left: '-31px', top: '2px', width: '12px', height: '12px', borderRadius: '50%', background: '#fbbf24', border: '2px solid #0d0d0f' }} />
                  <span style={{ fontSize: '12px', color: 'var(--muted-foreground)', fontFamily: "'JetBrains Mono', monospace" }}>Today, 10:45 AM</span>
                  <h4 style={{ fontSize: '14px', color: 'var(--foreground)', margin: '4px 0 2px', fontWeight: 700 }}>Attended Gym</h4>
                  <p style={{ fontSize: '13px', color: 'var(--muted-foreground)', margin: 0 }}>Scanned at front desk</p>
                </div>
                <div style={{ position: 'relative' }}>
                  <div style={{ position: 'absolute', left: '-31px', top: '2px', width: '12px', height: '12px', borderRadius: '50%', background: '#4ade80', border: '2px solid #0d0d0f' }} />
                  <span style={{ fontSize: '12px', color: 'var(--muted-foreground)', fontFamily: "'JetBrains Mono', monospace" }}>May 1, 2026</span>
                  <h4 style={{ fontSize: '14px', color: 'var(--foreground)', margin: '4px 0 2px', fontWeight: 700 }}>Membership Renewed</h4>
                  <p style={{ fontSize: '13px', color: 'var(--muted-foreground)', margin: 0 }}>Annual Pro plan purchased (₹15,000)</p>
                </div>
                <div style={{ position: 'relative' }}>
                  <div style={{ position: 'absolute', left: '-31px', top: '2px', width: '12px', height: '12px', borderRadius: '50%', background: '#38bdf8', border: '2px solid #0d0d0f' }} />
                  <span style={{ fontSize: '12px', color: 'var(--muted-foreground)', fontFamily: "'JetBrains Mono', monospace" }}>Apr 28, 2026</span>
                  <h4 style={{ fontSize: '14px', color: 'var(--foreground)', margin: '4px 0 2px', fontWeight: 700 }}>WhatsApp Reminder Sent</h4>
                  <p style={{ fontSize: '13px', color: 'var(--muted-foreground)', margin: 0 }}>Automated expiry reminder</p>
                </div>
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
}
