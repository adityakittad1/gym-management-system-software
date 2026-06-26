import { useState, useEffect, useRef } from 'react';
import { io as socketIO, Socket } from 'socket.io-client';
import {
  Wifi, WifiOff, QrCode, Send, Clock, CheckCircle2, XCircle,
  RefreshCw, Edit3, Save, Eye, RotateCcw, Activity, Loader2,
  MessageCircle, Zap, Phone, AlertTriangle, User, Shield, Smartphone, Key
} from 'lucide-react';
import { api, Member, ReminderLog } from '../services/api';
import { toast } from 'sonner';
import { useStore } from '../store/useStore';
import { supabase } from '../services/supabase';
import { TABLES } from '../services/db-schema';
import { waTemplates, WATemplate, buildMemberVars } from '../services/wa-templates';

// ─── Types ────────────────────────────────────────────────────────────────────
interface WAStatus {
  status: 'disconnected' | 'qr_ready' | 'connecting' | 'connected' | 'auth_failure';
  phoneNumber: string | null;
  profileName: string | null;
  connectedAt: string | null;
  lastSync: string | null;
  sentToday: number;
  failedToday: number;
  hasQR: boolean;
  pairingCode?: string | null;
}

interface AutomationRule {
  id: string;
  label: string;
  days: number;
  enabled: boolean;
  color: string;
}

interface BulkProgress {
  total: number;
  sent: number;
  failed: number;
  running: boolean;
  done: boolean;
}

// ─── Constants ────────────────────────────────────────────────────────────────
const SOCKET_URL = import.meta.env.VITE_API_BASE_URL || 'https://gym-management-system-software-backend.onrender.com';

const previewTemplate = (templateKey: string, message: string, member?: Partial<Member>) => {
  const vars = buildMemberVars(
    { name: member?.name || 'Ravi Sharma', phone: member?.phone || '9876543210', plan: member?.plan || 'Monthly Pro', expiryDate: member?.expiryDate ? new Date(member.expiryDate).toLocaleDateString('en-IN') : '30 Jun 2026', daysRemaining: member?.daysRemaining ?? 3 },
    { gymName: 'TTZ Fitness', primaryPhone: '8668891406' },
    { amount: '1,500', invoice_number: 'INV-2026-001', receipt_number: 'REC-2026-001', renewal_date: new Date().toLocaleDateString('en-IN'), coach_name: 'Arjun Singh' }
  );
  return waTemplates.renderRaw(message, vars);
};

// ─── Status label helper ──────────────────────────────────────────────────────
function statusLabel(s: WAStatus['status']) {
  switch (s) {
    case 'connected': return { label: 'Connected', color: '#4ade80', bg: 'rgba(74,222,128,0.1)', border: 'rgba(74,222,128,0.25)' };
    case 'qr_ready': return { label: 'Scan QR Code', color: '#fbbf24', bg: 'rgba(251,191,36,0.1)', border: 'rgba(251,191,36,0.25)' };
    case 'connecting': return { label: 'Connecting…', color: '#38bdf8', bg: 'rgba(56,189,248,0.1)', border: 'rgba(56,189,248,0.25)' };
    case 'auth_failure': return { label: 'Auth Failed', color: '#f87171', bg: 'rgba(248,113,113,0.1)', border: 'rgba(248,113,113,0.25)' };
    default: return { label: 'Disconnected', color: 'var(--muted-foreground)', bg: 'rgba(113,113,122,0.1)', border: 'rgba(113,113,122,0.25)' };
  }
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function WhatsAppHub() {
  const socketRef = useRef<Socket | null>(null);
  const storeMembers = useStore(state => state.members);

  const [waStatus, setWaStatus] = useState<WAStatus>({
    status: 'disconnected', phoneNumber: null, profileName: null,
    connectedAt: null, lastSync: null, sentToday: 0, failedToday: 0, hasQR: false,
  });
  const [qrDataURL, setQrDataURL] = useState<string | null>(null);
  const [socketConnected, setSocketConnected] = useState(false);

  const [members, setMembers] = useState<Member[]>([]);
  const [logs, setLogs] = useState<ReminderLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'automation' | 'templates' | 'logs'>('overview');

  const allTemplates = waTemplates.getAll();
  const [selectedTemplateKey, setSelectedTemplateKey] = useState(allTemplates[0].key);
  const selectedTemplate = waTemplates.get(selectedTemplateKey) || allTemplates[0];
  const [templateMessage, setTemplateMessage] = useState(selectedTemplate.message);

  useEffect(() => {
    setTemplateMessage(selectedTemplate.message);
  }, [selectedTemplateKey]);
  const [rules, setRules] = useState<AutomationRule[]>([
    { id: 'r5', label: '5 Days Before Expiry', days: 5, enabled: true, color: '#fbbf24' },
    { id: 'r3', label: '3 Days Before Expiry', days: 3, enabled: true, color: '#fb923c' },
    { id: 'r1', label: '1 Day Before Expiry', days: 1, enabled: true, color: '#f87171' },
    { id: 'r0', label: 'On Expiry Day', days: 0, enabled: false, color: '#e879f9' },
  ]);

  const [bulkProgress, setBulkProgress] = useState<BulkProgress>({
    total: 0, sent: 0, failed: 0, running: false, done: false
  });
  const [sendingMembers, setSendingMembers] = useState<Record<number, 'sending' | 'sent' | 'failed'>>({});
  const [testModalOpen, setTestModalOpen] = useState(false);
  const [testPhone, setTestPhone] = useState('');
  const [testMessage, setTestMessage] = useState('Hello from TTZ Gym! This is a test message.');
  const [testStatus, setTestStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');
  const [testError, setTestError] = useState('');
  const [logFilter, setLogFilter] = useState<'all' | 'delivered' | 'failed'>('all');

  // ── Authentication flow state ──
  const [authMethod, setAuthMethod] = useState<'qr' | 'phone'>('qr');
  const [linkPhone, setLinkPhone] = useState('');
  const [requestingCode, setRequestingCode] = useState(false);

  // ── Socket.IO connection ───────────────────────────────────────────────────
  useEffect(() => {
    const mounted = { current: true };
    let socket: Socket | null = null;

    try {
      socket = socketIO(SOCKET_URL, {
        transports: ['polling', 'websocket'],
        timeout: 5000,
        reconnectionAttempts: 3,
        autoConnect: true,
      });
      socketRef.current = socket;

      socket.on('connect', () => {
        if (!mounted.current) return;
        setSocketConnected(true);

      });

      socket.on('connect_error', (err) => {
        if (!mounted.current) return;
        console.warn('[WA Hub] Socket connection failed (server may be offline):', err.message);
        setSocketConnected(false);
      });

      socket.on('disconnect', () => {
        if (!mounted.current) return;
        setSocketConnected(false);
      });

      socket.on('wa:status', (data: WAStatus) => {
        if (!mounted.current) return;
        setWaStatus(data);
        if (data.status === 'connected') {
          setQrDataURL(null);
          toast.success(`WhatsApp connected — ${data.profileName || data.phoneNumber}`);
        }
      });

      socket.on('wa:qr', ({ qrDataURL: dataUrl }: { qrDataURL: string }) => {
        if (!mounted.current) return;
        setQrDataURL(dataUrl);
        setWaStatus(prev => ({ ...prev, status: 'qr_ready' }));
      });

    } catch (err) {
      console.warn('[WA Hub] Failed to initialize socket:', err);
    }

    return () => {
      mounted.current = false;
      if (socket) {
        socket.disconnect();
        socket.removeAllListeners();
      }
    };
  }, []);

  // ── Fetch data ─────────────────────────────────────────────────────────────
  useEffect(() => {
    let mounted = true;
    const fetchLogs = async () => {
      try {
        setIsLoading(true);
        const logsData = await api.whatsapp.getLogs().catch(() => []);
        if (!mounted) return;
        setLogs(logsData);
      } finally {
        if (mounted) setIsLoading(false);
      }
    };
    fetchLogs();

    const channel = supabase
      .channel('public:whatsapp_logs:hub')
      .on('postgres_changes', { event: '*', schema: 'public', table: TABLES.whatsappLogs }, fetchLogs)
      .subscribe();

    return () => {
      mounted = false;
      supabase.removeChannel(channel);
    };
  }, []);

  // Fetch initial real status
  useEffect(() => {
    let mounted = true;
    fetch(`${SOCKET_URL}/api/whatsapp/real-status`)
      .then(res => res.json())
      .then(data => {
        if (mounted && data) {
          setWaStatus(data);
          if (data.status === 'qr_ready') setQrDataURL(data.qrDataURL || null); // Assuming backend sends qrDataURL or we rely on socket for new QR
        }
      })
      .catch(err => console.warn('[WA Hub] Failed to fetch real status:', err));
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    setMembers(storeMembers);
  }, [storeMembers]);

  // ── Derived state ──────────────────────────────────────────────────────────
  const isConnected = waStatus.status === 'connected';
  const isQRReady = waStatus.status === 'qr_ready';
  const isConnecting = waStatus.status === 'connecting';

  const expiringToday = members.filter(m => m.daysRemaining === 0);
  const expiring3 = members.filter(m => m.daysRemaining > 0 && m.daysRemaining <= 3);
  const expiring5 = members.filter(m => m.daysRemaining > 0 && m.daysRemaining <= 5);

  const eligibleMembers = members.filter(m =>
    m.daysRemaining !== null && m.daysRemaining <= 5 && m.daysRemaining >= -5
  );

  const filteredLogs = logs.filter(l => {
    if (logFilter === 'delivered') return l.status === 'sent';
    if (logFilter === 'failed') return l.status === 'failed';
    return true;
  });

  const st = statusLabel(waStatus.status);

  // ── Actions ────────────────────────────────────────────────────────────────
  const handleConnect = async () => {
    try {
      setWaStatus(prev => ({ ...prev, status: 'connecting' }));
      const res = await fetch(`${SOCKET_URL}/api/whatsapp/connect`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Unknown server error');
      
      toast.info('Starting WhatsApp session… QR code will appear shortly.');
    } catch (err: any) {
      console.error('WhatsApp Connect Error:', err);
      setWaStatus(prev => ({ ...prev, status: 'disconnected' }));
      toast.error(`Backend Error: ${err.message}`, { duration: 10000 });
    }
  };

  const handleDisconnect = async () => {
    try {
      await fetch(`${SOCKET_URL}/api/whatsapp/disconnect`, { method: 'POST' });
      setQrDataURL(null);
      toast.success('WhatsApp disconnected.');
    } catch {
      toast.error('Disconnect failed.');
    }
  };

  const handleClearSession = async () => {
    try {
      setQrDataURL(null);
      setWaStatus(prev => ({ ...prev, status: 'disconnected' }));
      const res = await fetch(`${SOCKET_URL}/api/whatsapp/clear-session`, { method: 'POST' });
      const data = await res.json();
      toast.success(data.message || 'Session cleared! Click Connect to get a fresh QR code.');
    } catch {
      toast.error('Failed to clear session. Please restart the server manually.');
    }
  };

  const handleReconnect = async () => {
    try {
      setQrDataURL(null);
      setWaStatus(prev => ({ ...prev, status: 'connecting' }));
      const res = await fetch(`${SOCKET_URL}/api/whatsapp/reconnect`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Unknown server error');
      toast.info('Reconnecting WhatsApp…');
    } catch (err: any) {
      console.error('WhatsApp Reconnect Error:', err);
      setWaStatus(prev => ({ ...prev, status: 'disconnected' }));
      toast.error(`Reconnect failed: ${err.message}`, { duration: 10000 });
    }
  };

  const handleRequestPairingCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!linkPhone) return;
    setRequestingCode(true);
    try {
      const res = await fetch(`${SOCKET_URL}/api/whatsapp/pairing-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: linkPhone }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to request code');
      toast.success('Pairing code generated!');
    } catch (err: any) {
      toast.error(`Error: ${err.message}`);
    } finally {
      setRequestingCode(false);
    }
  };

  // Send to a single member
  const handleSendToMember = async (member: Member) => {
    if (!isConnected) {
      toast.error('WhatsApp is not connected. Please connect first.');
      return;
    }
    setSendingMembers(prev => ({ ...prev, [member.id]: 'sending' }));
    try {
      const msg = previewTemplate(template, member);
      const res = await fetch(`${SOCKET_URL}/api/whatsapp/send-message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: member.phone, message: msg, memberId: member.id, memberName: member.name }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Server error');
      }
      setSendingMembers(prev => ({ ...prev, [member.id]: 'sent' }));
      toast.success(`Message sent to ${member.name}`);
      setTimeout(() => setSendingMembers(prev => { const n = { ...prev }; delete n[member.id]; return n; }), 3000);
    } catch (err: any) {
      setSendingMembers(prev => ({ ...prev, [member.id]: 'failed' }));
      toast.error(`Failed: ${err.message}`);
      setTimeout(() => setSendingMembers(prev => { const n = { ...prev }; delete n[member.id]; return n; }), 4000);
    }
    // Refresh logs
    api.whatsapp.getLogs().then(setLogs).catch(() => {});
  };

  // Bulk send to all eligible members
  const handleBulkSend = async () => {
    if (!isConnected) {
      toast.error('WhatsApp is not connected. Please connect first.');
      return;
    }
    if (eligibleMembers.length === 0) {
      toast.info('No members match the active reminder rules right now.');
      return;
    }
    setBulkProgress({ total: eligibleMembers.length, sent: 0, failed: 0, running: true, done: false });

    try {
      const result = await api.whatsapp.sendReminders('expiry');
      setBulkProgress({ total: eligibleMembers.length, sent: result.sent || 0, failed: result.failed || 0, running: false, done: true });
      toast.success(`Bulk send done: ${result.sent} delivered, ${result.failed} failed.`);
      api.whatsapp.getLogs().then(setLogs).catch(() => {});
    } catch {
      setBulkProgress(prev => ({ ...prev, running: false }));
      toast.error('Bulk send failed.');
    }
  };

  // Manual Test Send
  const handleSendTest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testPhone || !testMessage) return;
    setTestStatus('sending');
    setTestError('');
    try {
      const res = await fetch(`${SOCKET_URL}/api/whatsapp/send-message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: testPhone, message: testMessage, memberName: 'Test Message' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to send');
      setTestStatus('success');
      toast.success('Test message delivered successfully!');
      api.whatsapp.getLogs().then(setLogs).catch(() => {});
    } catch (err: any) {
      setTestStatus('error');
      setTestError(err.message);
      toast.error('Test message failed.');
    }
  };

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <div style={{ padding: '40px 44px', maxWidth: '1200px', margin: '0 auto' }}>

      {/* ── Header ── */}
      <div className="animate-fade-up" style={{ marginBottom: '40px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(74,222,128,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <MessageCircle style={{ width: 20, height: 20, color: '#4ade80' }} />
            </div>
            <h1 style={{ fontFamily: "'Syne', sans-serif", fontSize: '28px', fontWeight: 800, color: 'var(--foreground)', letterSpacing: '-0.04em', margin: 0 }}>
              WhatsApp Automation
            </h1>
            {/* Live status badge */}
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 14px', borderRadius: '100px', background: st.bg, border: `1px solid ${st.border}`, fontSize: '12px', fontWeight: 700, color: st.color }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: st.color, animation: (isConnected || isConnecting) ? 'pulse 2s infinite' : 'none' }} />
              {st.label}
            </span>
          </div>
          <p style={{ color: '#3f3f46', fontSize: '14px', margin: 0, fontWeight: 500 }}>
            Real WhatsApp automation — send reminders directly from TTZ to your members.
            {!socketConnected && <span style={{ color: '#f87171', marginLeft: '8px', fontSize: '12px' }}>⚠ Server offline</span>}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          {isConnected ? (
            <>
              <button onClick={handleReconnect} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', borderRadius: '12px', background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.2)', color: '#fbbf24', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}>
                <RefreshCw style={{ width: 14, height: 14 }} /> Reconnect
              </button>
              <button onClick={handleDisconnect} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', borderRadius: '12px', background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.2)', color: '#f87171', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}>
                <WifiOff style={{ width: 14, height: 14 }} /> Disconnect
              </button>
            </>
          ) : (
            <>
              <button onClick={handleConnect} disabled={isConnecting} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 24px', borderRadius: '12px', background: isConnecting ? '#27272a' : '#4ade80', border: 'none', color: isConnecting ? '#71717a' : '#000', fontSize: '13px', fontWeight: 700, cursor: isConnecting ? 'not-allowed' : 'pointer', boxShadow: isConnecting ? 'none' : '0 8px 24px rgba(74,222,128,0.25)' }}>
                {isConnecting ? <Loader2 style={{ width: 14, height: 14, animation: 'spin 1s linear infinite' }} /> : <QrCode style={{ width: 14, height: 14 }} />}
                {isConnecting ? 'Connecting…' : 'Connect WhatsApp'}
              </button>
              <button onClick={handleClearSession} title="Use if QR is stuck or session is expired" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', borderRadius: '12px', background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.2)', color: '#fbbf24', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}>
                <RefreshCw style={{ width: 12, height: 12 }} /> Clear Session
              </button>
            </>
          )}
        </div>
      </div>

      {/* ── Authentication Panel (shown when auth needed) ── */}
      {(isQRReady || isConnecting) && (
        <div className="animate-fade-up" style={{ background: 'var(--background)', border: '1px solid rgba(251,191,36,0.2)', borderRadius: '24px', overflow: 'hidden', marginBottom: '32px' }}>
          
          {/* Auth Method Tabs */}
          <div style={{ display: 'flex', borderBottom: '1px solid rgba(251,191,36,0.1)' }}>
            <button 
              onClick={() => setAuthMethod('qr')}
              style={{ flex: 1, padding: '16px', background: authMethod === 'qr' ? 'rgba(251,191,36,0.05)' : 'transparent', border: 'none', borderBottom: authMethod === 'qr' ? '2px solid #fbbf24' : '2px solid transparent', color: authMethod === 'qr' ? '#fbbf24' : '#71717a', fontSize: '14px', fontWeight: 800, cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
            >
              <QrCode style={{ width: 16, height: 16 }} /> Scan QR Code
            </button>
            <button 
              onClick={() => setAuthMethod('phone')}
              style={{ flex: 1, padding: '16px', background: authMethod === 'phone' ? 'rgba(251,191,36,0.05)' : 'transparent', border: 'none', borderBottom: authMethod === 'phone' ? '2px solid #fbbf24' : '2px solid transparent', color: authMethod === 'phone' ? '#fbbf24' : '#71717a', fontSize: '14px', fontWeight: 800, cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
            >
              <Smartphone style={{ width: 16, height: 16 }} /> Link with Phone Number
            </button>
          </div>

          <div style={{ padding: '40px', display: 'flex', gap: '48px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
            
            {/* METHOD 1: QR CODE */}
            {authMethod === 'qr' && (
              <>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
                  {qrDataURL ? (
                    <div style={{ background: '#ffffff', padding: '16px', borderRadius: '20px', boxShadow: '0 0 0 8px rgba(251,191,36,0.12)' }}>
                      <img src={qrDataURL} alt="WhatsApp QR Code" style={{ width: '220px', height: '220px', display: 'block' }} />
                    </div>
                  ) : (
                    <div style={{ width: '220px', height: '220px', background: 'var(--card)', borderRadius: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
                      <Loader2 style={{ width: 32, height: 32, color: '#fbbf24', animation: 'spin 1s linear infinite' }} />
                      <p style={{ color: 'var(--muted-foreground)', fontSize: '13px', margin: 0 }}>Generating QR…</p>
                    </div>
                  )}
                  <p style={{ fontSize: '12px', color: '#fbbf24', fontWeight: 600, margin: 0 }}>
                    {qrDataURL ? '⚡ QR is live — scan now' : 'Starting WhatsApp session…'}
                  </p>
                </div>

                <div style={{ flex: 1, minWidth: '280px' }}>
                  <h3 style={{ fontFamily: "'Syne', sans-serif", fontSize: '20px', fontWeight: 800, color: 'var(--foreground)', margin: '0 0 20px' }}>
                    Scan with your phone
                  </h3>
                  <ol style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    {[
                      'Open WhatsApp on your phone',
                      'Tap the three dots (⋮) → Linked Devices',
                      'Tap "Link a Device"',
                      'Point your camera at the QR code',
                    ].map((step, i) => (
                      <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
                        <span style={{ width: '24px', height: '24px', borderRadius: '50%', background: '#fbbf24', color: '#000', fontSize: '12px', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{i + 1}</span>
                        <span style={{ color: 'var(--muted-foreground)', fontSize: '14px', lineHeight: 1.5 }}>{step}</span>
                      </li>
                    ))}
                  </ol>
                  <div style={{ marginTop: '24px', padding: '14px 18px', background: 'rgba(56,189,248,0.06)', border: '1px solid rgba(56,189,248,0.15)', borderRadius: '12px', display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                    <Shield style={{ width: 16, height: 16, color: '#38bdf8', flexShrink: 0, marginTop: '2px' }} />
                    <p style={{ fontSize: '12px', color: 'var(--muted-foreground)', margin: 0, lineHeight: 1.6 }}>
                      Your session is stored locally and will auto-reconnect on server restart. The QR is generated fresh from your WhatsApp session.
                    </p>
                  </div>
                </div>
              </>
            )}

            {/* METHOD 2: PHONE NUMBER LINKING */}
            {authMethod === 'phone' && (
              <>
                <div style={{ flex: 1, minWidth: '300px' }}>
                  <h3 style={{ fontFamily: "'Syne', sans-serif", fontSize: '20px', fontWeight: 800, color: 'var(--foreground)', margin: '0 0 20px' }}>
                    Link with Phone Number
                  </h3>
                  
                  {!waStatus.pairingCode ? (
                    <form onSubmit={handleRequestPairingCode} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      <p style={{ color: 'var(--muted-foreground)', fontSize: '14px', margin: '0 0 8px', lineHeight: 1.5 }}>
                        Enter the phone number of the WhatsApp account you want to link. A unique 8-character code will be generated.
                      </p>
                      <input
                        type="text"
                        placeholder="e.g. 9876543210"
                        value={linkPhone}
                        onChange={e => setLinkPhone(e.target.value)}
                        style={{ width: '100%', background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '12px', padding: '14px 16px', color: 'var(--foreground)', fontSize: '15px', boxSizing: 'border-box', outline: 'none' }}
                        required
                      />
                      <button
                        type="submit"
                        disabled={requestingCode || !linkPhone}
                        style={{ padding: '14px', borderRadius: '12px', border: 'none', background: '#fbbf24', color: '#000', fontSize: '14px', fontWeight: 800, cursor: (requestingCode || !linkPhone) ? 'not-allowed' : 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}
                      >
                        {requestingCode ? <Loader2 style={{ width: 16, height: 16, animation: 'spin 1s linear infinite' }} /> : <Key style={{ width: 16, height: 16 }} />}
                        {requestingCode ? 'Generating Code...' : 'Generate Pairing Code'}
                      </button>
                    </form>
                  ) : (
                    <div className="animate-fade-up">
                      <div style={{ background: 'var(--card)', border: '1px solid rgba(251,191,36,0.3)', borderRadius: '16px', padding: '32px', textAlign: 'center', marginBottom: '24px' }}>
                        <p style={{ fontSize: '13px', color: 'var(--muted-foreground)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 12px' }}>Your Pairing Code</p>
                        <p style={{ fontSize: '42px', fontFamily: "'JetBrains Mono', monospace", fontWeight: 800, color: '#fbbf24', margin: 0, letterSpacing: '0.1em' }}>
                          {String(waStatus.pairingCode || '').slice(0, 4)}-{String(waStatus.pairingCode || '').slice(4)}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                <div style={{ flex: 1, minWidth: '280px' }}>
                  <h3 style={{ fontFamily: "'Syne', sans-serif", fontSize: '16px', fontWeight: 800, color: 'var(--muted-foreground)', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 20px' }}>
                    How to use the code
                  </h3>
                  <ol style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    {[
                      'Open WhatsApp on your phone',
                      'Tap the three dots (⋮) → Linked Devices',
                      'Tap "Link a Device"',
                      'Tap "Link with phone number instead" at the bottom',
                      'Enter the 8-character code displayed here'
                    ].map((step, i) => (
                      <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
                        <span style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'var(--muted)', color: 'var(--muted-foreground)', fontSize: '12px', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{i + 1}</span>
                        <span style={{ color: 'var(--muted-foreground)', fontSize: '14px', lineHeight: 1.5 }}>{step}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              </>
            )}

          </div>
        </div>
      )}

      {/* ── Connected Info Bar ── */}
      {isConnected && (
        <div className="animate-fade-up" style={{ background: 'rgba(74,222,128,0.05)', border: '1px solid rgba(74,222,128,0.15)', borderRadius: '16px', padding: '16px 24px', marginBottom: '32px', display: 'flex', alignItems: 'center', gap: '24px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#4ade80', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: 800, color: '#000' }}>
              {(waStatus.profileName || 'T').charAt(0)}
            </div>
            <div>
              <p style={{ fontSize: '14px', fontWeight: 700, color: 'var(--foreground)', margin: 0 }}>{waStatus.profileName || 'TTZ Gym'}</p>
              <p style={{ fontSize: '12px', color: '#4ade80', margin: 0, fontFamily: "'JetBrains Mono', monospace" }}>{waStatus.phoneNumber}</p>
            </div>
          </div>
          <div style={{ width: '1px', height: '32px', background: 'rgba(74,222,128,0.2)' }} />
          <div><p style={{ fontSize: '11px', color: 'var(--muted-foreground)', margin: '0 0 2px', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>Connected</p><p style={{ fontSize: '13px', color: 'var(--muted-foreground)', margin: 0 }}>{waStatus.connectedAt ? new Date(waStatus.connectedAt).toLocaleTimeString() : '—'}</p></div>
          <div><p style={{ fontSize: '11px', color: 'var(--muted-foreground)', margin: '0 0 2px', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>Sent Today</p><p style={{ fontSize: '13px', color: 'var(--foreground)', fontFamily: "'JetBrains Mono', monospace", fontWeight: 800, margin: 0 }}>{waStatus.sentToday}</p></div>
          <div><p style={{ fontSize: '11px', color: 'var(--muted-foreground)', margin: '0 0 2px', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>Failed Today</p><p style={{ fontSize: '13px', color: '#f87171', fontFamily: "'JetBrains Mono', monospace", fontWeight: 800, margin: 0 }}>{waStatus.failedToday}</p></div>
          <div style={{ marginLeft: 'auto' }}><p style={{ fontSize: '11px', color: 'var(--muted-foreground)', margin: '0 0 2px', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>Last Sync</p><p style={{ fontSize: '12px', color: 'var(--muted-foreground)', margin: 0 }}>{waStatus.lastSync ? new Date(waStatus.lastSync).toLocaleTimeString() : '—'}</p></div>
        </div>
      )}

      {/* ── Auth Failure Banner ── */}
      {waStatus.status === 'auth_failure' && (
        <div style={{ background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)', borderRadius: '16px', padding: '16px 24px', marginBottom: '32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <AlertTriangle style={{ width: 18, height: 18, color: '#f87171' }} />
            <div>
              <p style={{ fontSize: '14px', fontWeight: 700, color: '#f87171', margin: 0 }}>Session expired or authentication failed</p>
              <p style={{ fontSize: '12px', color: 'var(--muted-foreground)', margin: '2px 0 0' }}>Please reconnect by scanning a new QR code.</p>
            </div>
          </div>
          <button onClick={handleReconnect} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', borderRadius: '12px', background: '#f87171', border: 'none', color: '#000', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}>
            <RefreshCw style={{ width: 14, height: 14 }} /> Reconnect
          </button>
        </div>
      )}

      {/* ── Tabs ── */}
      <div className="animate-fade-up delay-100" style={{ display: 'flex', gap: '4px', marginBottom: '32px', borderBottom: '1px solid var(--border)', paddingBottom: '1px' }}>
        {[
          { id: 'overview', label: 'Overview', icon: Activity },
          { id: 'automation', label: 'Automation Rules', icon: Zap },
          { id: 'templates', label: 'Message Template', icon: Edit3 },
          { id: 'logs', label: 'Delivery Logs', icon: Clock },
        ].map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} style={{
            display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 20px',
            background: 'transparent', border: 'none', cursor: 'pointer',
            borderBottom: activeTab === tab.id ? '2px solid #fbbf24' : '2px solid transparent',
            color: activeTab === tab.id ? '#fafafa' : '#52525b',
            fontSize: '13px', fontWeight: 700, transition: 'color 0.2s', marginBottom: '-1px',
          }}>
            <tab.icon style={{ width: 14, height: 14 }} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* ══════════════════════════ OVERVIEW TAB ══════════════════════════ */}
      {activeTab === 'overview' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

          {/* Stats Row */}
          <div className="animate-fade-up" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
            {[
              { label: 'Expiring Today', count: expiringToday.length, color: '#f87171', members: expiringToday },
              { label: 'Expiring ≤ 3 Days', count: expiring3.length, color: '#fb923c', members: expiring3 },
              { label: 'Expiring ≤ 5 Days', count: expiring5.length, color: '#fbbf24', members: expiring5 },
            ].map((g, i) => (
              <div key={i} style={{ background: 'var(--background)', border: '1px solid rgba(30,30,34,0.9)', borderRadius: '20px', padding: '24px' }}>
                <p style={{ fontSize: '11px', fontWeight: 700, color: 'var(--muted-foreground)', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 6px' }}>{g.label}</p>
                <p style={{ fontSize: '36px', fontWeight: 800, color: g.color, margin: 0, fontFamily: "'JetBrains Mono', monospace" }}>{g.count}</p>
              </div>
            ))}
            
            {/* Quick Test Box */}
            <div style={{ background: 'linear-gradient(135deg, rgba(74,222,128,0.1) 0%, rgba(56,189,248,0.1) 100%)', border: '1px solid rgba(74,222,128,0.2)', borderRadius: '20px', padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'center', cursor: 'pointer', transition: 'transform 0.2s' }} onClick={() => setTestModalOpen(true)}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '12px', background: 'rgba(74,222,128,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Send style={{ width: 16, height: 16, color: '#4ade80' }} />
                </div>
                <div>
                  <p style={{ fontSize: '14px', fontWeight: 800, color: 'var(--foreground)', margin: '0 0 2px' }}>Connection Verification</p>
                  <p style={{ fontSize: '12px', color: 'var(--muted-foreground)', margin: 0 }}>Send a manual message</p>
                </div>
              </div>
            </div>
          </div>

          {/* Renewal Monitor Table */}
          <div className="animate-fade-up delay-100" style={{ background: 'var(--background)', border: '1px solid rgba(30,30,34,0.9)', borderRadius: '20px', overflow: 'hidden' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(30,30,34,0.9)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ fontFamily: "'Syne', sans-serif", fontSize: '16px', fontWeight: 700, color: 'var(--foreground)', margin: '0 0 4px' }}>Renewal Automation Monitor</h3>
                <p style={{ fontSize: '12px', color: 'var(--muted-foreground)', margin: 0 }}>{eligibleMembers.length} members with 5 days or less remaining (including recently expired)</p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                {bulkProgress.done && !bulkProgress.running && (
                  <span style={{ fontSize: '12px', fontWeight: 700, color: '#4ade80' }}>✓ {bulkProgress.sent} sent · {bulkProgress.failed} failed</span>
                )}
                {bulkProgress.running && (
                  <span style={{ fontSize: '12px', fontWeight: 600, color: '#fbbf24', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Loader2 style={{ width: 12, height: 12, animation: 'spin 1s linear infinite' }} />
                    Sending {bulkProgress.sent}/{bulkProgress.total}…
                  </span>
                )}
                <button
                  onClick={handleBulkSend}
                  disabled={bulkProgress.running || eligibleMembers.length === 0}
                  style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', borderRadius: '12px', background: (isConnected && eligibleMembers.length > 0) ? '#4ade80' : '#27272a', border: 'none', color: (isConnected && eligibleMembers.length > 0) ? '#000' : '#71717a', fontSize: '13px', fontWeight: 700, cursor: (isConnected && eligibleMembers.length > 0) ? 'pointer' : 'not-allowed' }}>
                  <Send style={{ width: 13, height: 13 }} />
                  Send All ({eligibleMembers.length})
                </button>
              </div>
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'var(--card)' }}>
                  {['Member', 'Phone', 'Plan', 'Expires In', 'Action'].map(h => (
                    <th key={h} style={{ padding: '12px 20px', textAlign: 'left', fontSize: '11px', fontWeight: 700, color: 'var(--muted-foreground)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {eligibleMembers.length === 0 ? (
                  <tr><td colSpan={5} style={{ padding: '48px', textAlign: 'center', color: '#3f3f46', fontSize: '13px' }}>No members match the active reminder rules right now.</td></tr>
                ) : eligibleMembers.map(m => {
                  const sendState = sendingMembers[m.id];
                  return (
                    <tr key={m.id} style={{ borderBottom: '1px solid rgba(30,30,34,0.5)' }}>
                      <td style={{ padding: '14px 20px', fontSize: '14px', fontWeight: 600, color: 'var(--foreground)' }}>{m.name}</td>
                      <td style={{ padding: '14px 20px', fontSize: '12px', color: 'var(--muted-foreground)', fontFamily: "'JetBrains Mono', monospace" }}>{m.phone}</td>
                      <td style={{ padding: '14px 20px', fontSize: '12px', color: 'var(--muted-foreground)' }}>{m.plan}</td>
                      <td style={{ padding: '14px 20px' }}>
                        <span style={{ fontSize: '12px', fontWeight: 700, color: m.daysRemaining <= 1 ? '#f87171' : m.daysRemaining <= 3 ? '#fb923c' : '#fbbf24' }}>
                          {m.daysRemaining === 0 ? 'Today' : `${m.daysRemaining} days`}
                        </span>
                      </td>
                      <td style={{ padding: '14px 20px' }}>
                        <button
                          onClick={() => handleSendToMember(m)}
                          disabled={sendState === 'sending'}
                          style={{
                            display: 'inline-flex', alignItems: 'center', gap: '6px',
                            padding: '8px 14px', borderRadius: '10px', border: 'none', cursor: sendState === 'sending' ? 'not-allowed' : 'pointer',
                            background: sendState === 'sent' ? 'rgba(74,222,128,0.1)' : sendState === 'failed' ? 'rgba(248,113,113,0.1)' : 'rgba(74,222,128,0.1)',
                            color: sendState === 'sent' ? '#4ade80' : sendState === 'failed' ? '#f87171' : '#4ade80',
                            fontSize: '12px', fontWeight: 700, transition: 'all 0.2s',
                          }}
                        >
                          {sendState === 'sending' && <Loader2 style={{ width: 12, height: 12, animation: 'spin 1s linear infinite' }} />}
                          {sendState === 'sent' && <CheckCircle2 style={{ width: 12, height: 12 }} />}
                          {sendState === 'failed' && <XCircle style={{ width: 12, height: 12 }} />}
                          {!sendState && <Send style={{ width: 12, height: 12 }} />}
                          {sendState === 'sending' ? 'Sending…' : sendState === 'sent' ? 'Delivered' : sendState === 'failed' ? 'Failed' : 'WhatsApp'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ══════════════════════════ AUTOMATION TAB ══════════════════════════ */}
      {activeTab === 'automation' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="animate-fade-up" style={{ background: 'var(--background)', border: '1px solid rgba(30,30,34,0.9)', borderRadius: '20px', overflow: 'hidden' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(30,30,34,0.9)' }}>
              <h3 style={{ fontFamily: "'Syne', sans-serif", fontSize: '16px', fontWeight: 700, color: 'var(--foreground)', margin: '0 0 4px' }}>Reminder Rules</h3>
              <p style={{ fontSize: '12px', color: 'var(--muted-foreground)', margin: 0 }}>Define when to trigger automatic reminders for expiring members</p>
            </div>
            <div style={{ padding: '8px' }}>
              {rules.map(rule => (
                <div key={rule.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 16px', borderRadius: '12px', margin: '4px 0', background: rule.enabled ? 'rgba(24,24,27,0.6)' : 'transparent', transition: 'background 0.2s' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: rule.enabled ? rule.color : '#3f3f46', transition: 'background 0.3s' }} />
                    <div>
                      <p style={{ fontSize: '14px', fontWeight: 700, color: rule.enabled ? '#fafafa' : '#52525b', margin: 0 }}>{rule.label}</p>
                      <p style={{ fontSize: '12px', color: 'var(--muted-foreground)', margin: '2px 0 0' }}>
                        {rule.days > 0 ? `Triggers when ${rule.days} day${rule.days > 1 ? 's' : ''} remain` : 'Triggers on the day membership expires'}
                        {' · '}
                        <span style={{ color: rule.enabled ? rule.color : '#3f3f46' }}>{members.filter(m => m.daysRemaining === rule.days).length} members today</span>
                      </p>
                    </div>
                  </div>
                  <button onClick={() => setRules(prev => prev.map(r => r.id === rule.id ? { ...r, enabled: !r.enabled } : r))} style={{ width: '48px', height: '26px', borderRadius: '100px', background: rule.enabled ? rule.color : '#27272a', border: 'none', cursor: 'pointer', position: 'relative', transition: 'background 0.3s', flexShrink: 0 }}>
                    <div style={{ position: 'absolute', top: '3px', left: rule.enabled ? '24px' : '3px', width: '20px', height: '20px', borderRadius: '50%', background: '#fff', transition: 'left 0.3s', boxShadow: '0 1px 3px rgba(0,0,0,0.4)' }} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="animate-fade-up delay-100" style={{ background: 'var(--background)', border: '1px solid rgba(30,30,34,0.9)', borderRadius: '20px', padding: '24px' }}>
            <h3 style={{ fontFamily: "'Syne', sans-serif", fontSize: '16px', fontWeight: 700, color: 'var(--foreground)', margin: '0 0 6px' }}>Daily Schedule</h3>
            <p style={{ fontSize: '12px', color: 'var(--muted-foreground)', margin: '0 0 20px' }}>Automation runs daily at the configured time</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--muted-foreground)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '8px' }}>Daily Send Time</label>
                <input type="time" defaultValue="09:00" style={{ width: '100%', background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '12px', padding: '12px 16px', color: 'var(--foreground)', fontSize: '15px', fontFamily: "'JetBrains Mono', monospace", outline: 'none', boxSizing: 'border-box' }} />
              </div>
            </div>
            <button onClick={() => toast.success('Schedule saved!')} style={{ marginTop: '20px', display: 'flex', alignItems: 'center', gap: '8px', background: '#fbbf24', border: 'none', color: '#000', padding: '12px 24px', borderRadius: '12px', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}>
              <Save style={{ width: 14, height: 14 }} /> Save Schedule
            </button>
          </div>
        </div>
      )}

      {/* ══════════════════════════ TEMPLATES TAB ══════════════════════════ */}
      {activeTab === 'templates' && (
        <div className="animate-fade-up" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
          
          <div style={{ background: 'var(--background)', border: '1px solid rgba(30,30,34,0.9)', borderRadius: '20px', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(30,30,34,0.9)' }}>
              <h3 style={{ fontFamily: "'Syne', sans-serif", fontSize: '16px', fontWeight: 700, color: 'var(--foreground)', margin: '0 0 12px' }}>Message Templates</h3>
              <select 
                value={selectedTemplateKey} 
                onChange={(e) => setSelectedTemplateKey(e.target.value)}
                style={{ width: '100%', background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '12px', padding: '12px 16px', color: 'var(--foreground)', fontSize: '14px', outline: 'none' }}
              >
                {Array.from(new Set(allTemplates.map(t => t.category))).map(cat => (
                  <optgroup key={cat} label={cat}>
                    {allTemplates.filter(t => t.category === cat).map(t => (
                      <option key={t.key} value={t.key}>{t.name}</option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>
            <div style={{ padding: '20px 24px', flex: 1 }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '16px' }}>
                {selectedTemplate.variables.map(v => (
                  <button key={v} onClick={() => setTemplateMessage(prev => prev + '{{' + v + '}}')} style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '8px', color: '#fbbf24', padding: '4px 10px', fontSize: '11px', fontFamily: "'JetBrains Mono', monospace", fontWeight: 600, cursor: 'pointer' }}>
                    {'{' + '{' + v + '}' + '}'}
                  </button>
                ))}
              </div>
              <textarea 
                value={templateMessage} 
                onChange={e => setTemplateMessage(e.target.value)} 
                rows={12} 
                style={{ width: '100%', background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '12px', padding: '16px', color: 'var(--foreground)', fontSize: '13px', fontFamily: "'JetBrains Mono', monospace", lineHeight: 1.7, resize: 'vertical', outline: 'none', boxSizing: 'border-box' }} 
              />
              <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
                <button onClick={() => { waTemplates.reset(selectedTemplateKey); setTemplateMessage(waTemplates.get(selectedTemplateKey)!.message); toast.success('Reset to default.'); }} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'transparent', border: '1px solid var(--border)', color: 'var(--muted-foreground)', padding: '10px 16px', borderRadius: '12px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>
                  <RotateCcw style={{ width: 13, height: 13 }} /> Reset
                </button>
                <button onClick={() => { waTemplates.save(selectedTemplateKey, { message: templateMessage }); toast.success('Template saved!'); }} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', background: '#fbbf24', border: 'none', color: '#000', padding: '10px', borderRadius: '12px', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}>
                  <Save style={{ width: 13, height: 13 }} /> Save Template
                </button>
              </div>
            </div>
          </div>

          {/* Live Preview */}
          <div style={{ background: 'var(--background)', border: '1px solid rgba(30,30,34,0.9)', borderRadius: '20px', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(30,30,34,0.9)' }}>
              <h3 style={{ fontFamily: "'Syne', sans-serif", fontSize: '16px', fontWeight: 700, color: 'var(--foreground)', margin: 0 }}>Live Preview</h3>
            </div>
            <div style={{ padding: '24px', flex: 1, background: '#0B141A' }}>
              <div style={{ maxWidth: '100%', margin: '0 auto' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px', padding: '12px 16px', background: '#202C33', borderRadius: '12px' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#4ade80', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', fontWeight: 800, color: '#000' }}>T</div>
                  <div>
                    <p style={{ fontSize: '15px', fontWeight: 700, color: '#E9EDEF', margin: 0 }}>TTZ Fitness</p>
                    <p style={{ fontSize: '12px', color: '#8696A0', margin: 0 }}>business account</p>
                  </div>
                </div>
                <div style={{ background: '#005C4B', borderRadius: '12px 12px 12px 2px', padding: '12px 14px', maxWidth: '90%', marginLeft: '12px', position: 'relative', boxShadow: '0 1px 2px rgba(0,0,0,0.3)' }}>
                  <p style={{ fontSize: '14.2px', color: '#E9EDEF', lineHeight: 1.4, margin: 0, whiteSpace: 'pre-wrap' }}>{previewTemplate(selectedTemplateKey, templateMessage)}</p>
                  <p style={{ fontSize: '11px', color: '#8696A0', margin: '4px 0 0', textAlign: 'right', display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '4px' }}>
                    {new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════ LOGS TAB ══════════════════════════ */}
      {activeTab === 'logs' && (
        <div className="animate-fade-up" style={{ background: 'var(--background)', border: '1px solid rgba(30,30,34,0.9)', borderRadius: '20px', overflow: 'hidden' }}>
          <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(30,30,34,0.9)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontFamily: "'Syne', sans-serif", fontSize: '16px', fontWeight: 700, color: 'var(--foreground)', margin: 0 }}>Delivery Logs</h3>
            <div style={{ display: 'flex', gap: '8px' }}>
              {(['all', 'delivered', 'failed'] as const).map(f => (
                <button key={f} onClick={() => setLogFilter(f)} style={{ padding: '8px 16px', borderRadius: '10px', border: 'none', cursor: 'pointer', background: logFilter === f ? '#fbbf24' : '#18181b', color: logFilter === f ? '#000' : '#71717a', fontSize: '12px', fontWeight: 700, textTransform: 'capitalize' }}>
                  {f === 'all' ? `All (${logs.length})` : f === 'delivered' ? `Delivered (${logs.filter(l => l.status === 'sent').length})` : `Failed (${logs.filter(l => l.status === 'failed').length})`}
                </button>
              ))}
            </div>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'var(--card)' }}>
                  {['Member', 'Phone', 'Type', 'Message Preview', 'Sent At', 'Status'].map(h => (
                    <th key={h} style={{ padding: '12px 20px', textAlign: 'left', fontSize: '11px', fontWeight: 700, color: 'var(--muted-foreground)', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredLogs.length === 0 ? (
                  <tr><td colSpan={6} style={{ padding: '60px', textAlign: 'center', color: '#3f3f46', fontSize: '13px' }}>No logs found for this filter.</td></tr>
                ) : filteredLogs.map(log => (
                  <tr key={log.id} style={{ borderBottom: '1px solid rgba(30,30,34,0.5)' }}>
                    <td style={{ padding: '14px 20px', fontSize: '14px', fontWeight: 600, color: 'var(--foreground)' }}>{log.memberName}</td>
                    <td style={{ padding: '14px 20px', fontSize: '12px', color: 'var(--muted-foreground)', fontFamily: "'JetBrains Mono', monospace" }}>{log.phone}</td>
                    <td style={{ padding: '14px 20px' }}>
                      <span style={{ fontSize: '11px', fontWeight: 700, padding: '3px 10px', borderRadius: '6px', background: 'rgba(251,191,36,0.1)', color: '#fbbf24', textTransform: 'uppercase' }}>{log.type}</span>
                    </td>
                    <td style={{ padding: '14px 20px', fontSize: '12px', color: 'var(--muted-foreground)', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{log.message}</td>
                    <td style={{ padding: '14px 20px', fontSize: '12px', color: 'var(--muted-foreground)', whiteSpace: 'nowrap', fontFamily: "'JetBrains Mono', monospace" }}>{log.sentAt}</td>
                    <td style={{ padding: '14px 20px' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '11px', fontWeight: 700, padding: '4px 12px', borderRadius: '8px', background: log.status === 'sent' ? 'rgba(74,222,128,0.1)' : 'rgba(248,113,113,0.1)', color: log.status === 'sent' ? '#4ade80' : '#f87171' }}>
                        {log.status === 'sent' ? <CheckCircle2 style={{ width: 12, height: 12 }} /> : <XCircle style={{ width: 12, height: 12 }} />}
                        {log.status === 'sent' ? 'Delivered' : 'Failed'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ══════════════════════════ TEST MODAL ══════════════════════════ */}
      {testModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div className="animate-fade-up" style={{ background: 'var(--background)', border: '1px solid rgba(251,191,36,0.3)', borderRadius: '24px', padding: '32px', width: '100%', maxWidth: '440px', boxShadow: '0 20px 40px rgba(0,0,0,0.5)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h3 style={{ fontFamily: "'Syne', sans-serif", fontSize: '20px', fontWeight: 800, color: 'var(--foreground)', margin: 0 }}>System Connection Verification</h3>
              <button onClick={() => setTestModalOpen(false)} style={{ background: 'transparent', border: 'none', color: 'var(--muted-foreground)', cursor: 'pointer' }}><XCircle style={{ width: 24, height: 24 }} /></button>
            </div>
            
            <form onSubmit={handleSendTest} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--muted-foreground)', marginBottom: '8px', display: 'block' }}>Recipient Phone Number</label>
                <input
                  type="text"
                  placeholder="e.g. 9876543210"
                  value={testPhone}
                  onChange={e => setTestPhone(e.target.value)}
                  style={{ width: '100%', background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '12px', padding: '14px 16px', color: 'var(--foreground)', fontSize: '14px', boxSizing: 'border-box', outline: 'none' }}
                  required
                />
              </div>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--muted-foreground)', marginBottom: '8px', display: 'block' }}>Message</label>
                <textarea
                  value={testMessage}
                  onChange={e => setTestMessage(e.target.value)}
                  rows={4}
                  style={{ width: '100%', background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '12px', padding: '14px 16px', color: 'var(--foreground)', fontSize: '14px', boxSizing: 'border-box', outline: 'none', resize: 'vertical' }}
                  required
                />
              </div>

              {testStatus === 'error' && (
                <div style={{ padding: '12px 16px', background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.2)', borderRadius: '12px', color: '#f87171', fontSize: '13px', display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                  <AlertTriangle style={{ width: 16, height: 16, flexShrink: 0, marginTop: '2px' }} />
                  <span style={{ lineHeight: 1.5 }}>{testError}</span>
                </div>
              )}

              {testStatus === 'success' && (
                <div style={{ padding: '12px 16px', background: 'rgba(74,222,128,0.1)', border: '1px solid rgba(74,222,128,0.2)', borderRadius: '12px', color: '#4ade80', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <CheckCircle2 style={{ width: 16, height: 16 }} /> Delivery confirmed!
                </div>
              )}

              <button
                type="submit"
                disabled={testStatus === 'sending' || !isConnected}
                style={{
                  marginTop: '8px', padding: '16px', borderRadius: '12px', border: 'none', fontSize: '14px', fontWeight: 800, cursor: (testStatus === 'sending' || !isConnected) ? 'not-allowed' : 'pointer',
                  background: testStatus === 'sending' ? '#27272a' : '#4ade80', color: testStatus === 'sending' ? '#71717a' : '#000',
                  display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px'
                }}
              >
                {testStatus === 'sending' ? <Loader2 style={{ width: 16, height: 16, animation: 'spin 1s linear infinite' }} /> : <Send style={{ width: 16, height: 16 }} />}
                {testStatus === 'sending' ? 'Sending...' : 'Send Verification Ping'}
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
