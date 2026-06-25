import { useState, useEffect, useCallback } from 'react';
import {
  MessageCircle,
  Phone,
  Send,
  Settings2,
  CheckCircle2,
  XCircle,
  Clock,
  Zap,
  Bell,
  Calendar,
  CreditCard,
  Activity,
  Gift,
  Trash2,
  RefreshCw,
  Eye,
  EyeOff,
  Wifi,
  WifiOff,
  AlertTriangle,
  ChevronRight,
  Loader2,
} from 'lucide-react';
import { api, type WhatsAppConfig, type ReminderLog } from '../services/api';

// ─── Toast Component ───────────────────────────────────────────────────────────
function Toast({ message, type, onDone }: { message: string; type: 'success' | 'error' | 'info'; onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, 4000);
    return () => clearTimeout(t);
  }, [onDone]);

  const bg = type === 'success' ? 'bg-emerald-500' : type === 'error' ? 'bg-red-500' : 'bg-amber-400';
  const textC = type === 'info' ? 'text-black' : 'text-white';

  return (
    <div className={`fixed bottom-6 right-6 z-50 ${bg} ${textC} px-5 py-3.5 rounded-xl shadow-2xl flex items-center gap-3 max-w-sm animate-slide-up font-medium text-sm`}>
      {type === 'success' && <CheckCircle2 className="w-5 h-5 shrink-0" />}
      {type === 'error' && <XCircle className="w-5 h-5 shrink-0" />}
      {type === 'info' && <Bell className="w-5 h-5 shrink-0" />}
      <span>{message}</span>
    </div>
  );
}

// ─── Stat Card ─────────────────────────────────────────────────────────────────
function StatCard({ label, value, icon: Icon, color }: { label: string; value: string | number; icon: React.ElementType; color: string }) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 flex items-center gap-4">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
        <Icon className="w-6 h-6" />
      </div>
      <div>
        <p className="text-zinc-400 text-xs font-medium uppercase tracking-wide">{label}</p>
        <p className="text-white text-2xl font-bold mt-0.5">{value}</p>
      </div>
    </div>
  );
}

// ─── Send Trigger Button ───────────────────────────────────────────────────────
function ReminderTrigger({
  icon: Icon,
  label,
  description,
  type,
  color,
  onSend,
  loading,
}: {
  icon: React.ElementType;
  label: string;
  description: string;
  type: 'expiry' | 'payment' | 'attendance' | 'promo';
  color: string;
  onSend: (type: 'expiry' | 'payment' | 'attendance' | 'promo') => void;
  loading: string | null;
}) {
  const isLoading = loading === type;
  return (
    <div className={`bg-zinc-900 border border-zinc-800 rounded-2xl p-5 flex items-start gap-4 hover:border-zinc-600 transition-all group`}>
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
        <Icon className="w-6 h-6" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-white font-semibold text-sm">{label}</p>
        <p className="text-zinc-400 text-xs mt-1 leading-relaxed">{description}</p>
      </div>
      <button
        onClick={() => onSend(type)}
        disabled={isLoading}
        className="shrink-0 flex items-center gap-2 bg-amber-400 hover:bg-amber-300 text-black text-xs font-bold px-4 py-2.5 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
        {isLoading ? 'Sending…' : 'Send Now'}
      </button>
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────
export default function WhatsAppReminders() {
  const [config, setConfig] = useState<WhatsAppConfig>({
    apiKey: '',
    phoneNumber: '',
    provider: 'twilio',
    isConnected: 0,
    reminderEnabled: 1,
    expiryReminderDays: 7,
    lowAttendanceDays: 5,
    customMessage: 'Dear {name}, your TTZ Fitness membership expires on {date}. Renew now to continue your fitness journey! Call: 8668891406',
    sendMethod: 'whatsapp',
    autoSend: 0,
  });
  const [logs, setLogs] = useState<ReminderLog[]>([]);
  const [loadingConfig, setLoadingConfig] = useState(true);
  const [loadingLogs, setLoadingLogs] = useState(true);
  const [savingConfig, setSavingConfig] = useState(false);
  const [sendingType, setSendingType] = useState<string | null>(null);
  const [testPhone, setTestPhone] = useState('');
  const [sendingTest, setSendingTest] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [activeTab, setActiveTab] = useState<'connect' | 'automation' | 'logs'>('connect');

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
  };

  const fetchConfig = useCallback(async () => {
    try {
      const data = await api.whatsapp.getConfig();
      setConfig(data);
    } catch {
      showToast('Failed to load WhatsApp config', 'error');
    } finally {
      setLoadingConfig(false);
    }
  }, []);

  const fetchLogs = useCallback(async () => {
    setLoadingLogs(true);
    try {
      const data = await api.whatsapp.getLogs();
      setLogs(data);
    } catch {
      // ignore
    } finally {
      setLoadingLogs(false);
    }
  }, []);

  useEffect(() => {
    fetchConfig();
    fetchLogs();
  }, [fetchConfig, fetchLogs]);

  const handleSaveConfig = async () => {
    setSavingConfig(true);
    try {
      const res = await api.whatsapp.saveConfig(config);
      showToast(res.message, 'success');
      await fetchConfig();
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Failed to save config', 'error');
    } finally {
      setSavingConfig(false);
    }
  };

  const handleConnect = async () => {
    if (!config.apiKey || !config.phoneNumber) {
      showToast('Please fill in API Key and Phone Number first', 'error');
      return;
    }
    setSavingConfig(true);
    try {
      const updated = { ...config, isConnected: config.isConnected === 1 ? 0 : 1 };
      await api.whatsapp.saveConfig(updated);
      setConfig(updated);
      showToast(updated.isConnected === 1 ? '✅ WhatsApp API Connected!' : 'WhatsApp disconnected', updated.isConnected === 1 ? 'success' : 'info');
    } catch {
      showToast('Failed to update connection', 'error');
    } finally {
      setSavingConfig(false);
    }
  };

  const handleSendTest = async () => {
    if (!testPhone) {
      showToast('Enter a phone number for the verification ping', 'error');
      return;
    }
    setSendingTest(true);
    try {
      const res = await api.whatsapp.sendTest(testPhone, config.sendMethod);
      showToast(res.message, 'success');
      await fetchLogs();
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Verification ping failed', 'error');
    } finally {
      setSendingTest(false);
    }
  };

  const handleSendReminders = async (type: 'expiry' | 'payment' | 'attendance' | 'promo') => {
    setSendingType(type);
    try {
      const res = await api.whatsapp.sendReminders(type);
      showToast(res.message, 'success');
      await fetchLogs();
      setActiveTab('logs');
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Failed to send reminders', 'error');
    } finally {
      setSendingType(null);
    }
  };

  const handleClearLogs = async () => {
    try {
      await api.whatsapp.clearLogs();
      setLogs([]);
      showToast('Reminder logs cleared', 'info');
    } catch {
      showToast('Failed to clear logs', 'error');
    }
  };

  const connected = config.isConnected === 1;
  const totalSent = logs.length;
  const typeCount = (t: string) => logs.filter(l => l.type === t).length;

  if (loadingConfig) {
    return (
      <div className="flex-1 flex items-center justify-center h-full">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 text-amber-400 animate-spin" />
          <p className="text-zinc-400 text-sm">Loading WhatsApp settings…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container" style={{ padding: '28px', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Header */}
      <div className="animate-fade-up" style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'linear-gradient(135deg, #22c55e, #16a34a)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 16px rgba(34,197,94,0.25)' }}>
            <MessageCircle style={{ width: 20, height: 20, color: 'var(--foreground)' }} />
          </div>
          <div>
            <h1 style={{ fontFamily: "'Syne', sans-serif", fontSize: '26px', fontWeight: 800, color: 'var(--foreground)', letterSpacing: '-0.03em', margin: 0, marginBottom: '4px' }}>WhatsApp & SMS Hub</h1>
            <p style={{ color: 'var(--muted-foreground)', fontSize: '13px', margin: 0 }}>Automate member reminders via WhatsApp, SMS, or both</p>
          </div>
        </div>
        <div style={{
          display: 'flex', alignItems: 'center', gap: '8px',
          padding: '8px 16px', borderRadius: '20px',
          background: connected ? 'rgba(34,197,94,0.08)' : 'rgba(39,39,42,0.6)',
          border: `1px solid ${connected ? 'rgba(34,197,94,0.25)' : 'rgba(63,63,70,0.6)'}`,
          fontSize: '12px', fontWeight: 700,
          color: connected ? '#4ade80' : '#71717a',
        }}>
          {connected
            ? <><Wifi style={{ width: 14, height: 14 }} /><span className="animate-blink" style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#4ade80', display: 'inline-block' }} /> API Connected</>
            : <><WifiOff style={{ width: 14, height: 14 }} /> Not Connected</>}
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Sent" value={totalSent} icon={Send} color="bg-amber-400/20 text-amber-400" />
        <StatCard label="Expiry Alerts" value={typeCount('expiry')} icon={Calendar} color="bg-orange-500/20 text-orange-400" />
        <StatCard label="Payment Reminders" value={typeCount('payment')} icon={CreditCard} color="bg-blue-500/20 text-blue-400" />
        <StatCard label="Promos Sent" value={typeCount('promo')} icon={Gift} color="bg-purple-500/20 text-purple-400" />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-zinc-900 border border-zinc-800 rounded-xl p-1 w-fit">
        {(['connect', 'automation', 'logs'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-5 py-2 rounded-lg text-sm font-semibold capitalize transition-all ${
              activeTab === tab
                ? 'bg-amber-400 text-black'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            {tab === 'connect' ? 'API Setup' : tab === 'automation' ? 'Automation' : 'Logs'}
            {tab === 'logs' && logs.length > 0 && (
              <span className="ml-2 bg-amber-400 text-black text-xs font-bold px-1.5 py-0.5 rounded-full">
                {logs.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── Tab: API Setup ─────────────────────────────────────────────────────── */}
      {activeTab === 'connect' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Connection Card */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-500/20 rounded-xl flex items-center justify-center">
                  <MessageCircle className="w-5 h-5 text-green-400" />
                </div>
                <div>
                  <h2 className="text-white font-bold">WhatsApp API Connection</h2>
                  <p className="text-zinc-500 text-xs">Connect via Twilio or Meta Business API</p>
                </div>
              </div>
              <div className={`w-3 h-3 rounded-full ${connected ? 'bg-green-400 shadow-lg shadow-green-400/50 animate-pulse' : 'bg-zinc-600'}`} />
            </div>

            {/* Provider */}
            <div>
              <label className="text-zinc-400 text-xs font-medium block mb-2">Provider</label>
              <div className="flex gap-2">
                {['twilio', 'meta', 'wati'].map(p => (
                  <button
                    key={p}
                    onClick={() => setConfig(c => ({ ...c, provider: p }))}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-semibold capitalize border transition-all ${
                      config.provider === p
                        ? 'bg-amber-400 text-black border-amber-400'
                        : 'bg-zinc-800 text-zinc-400 border-zinc-700 hover:border-zinc-500'
                    }`}
                  >
                    {p === 'meta' ? 'Meta (WA Business)' : p.charAt(0).toUpperCase() + p.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* API Key */}
            <div>
              <label className="text-zinc-400 text-xs font-medium block mb-2">API Key / Auth Token</label>
              <div className="relative">
                <input
                  type={showApiKey ? 'text' : 'password'}
                  value={config.apiKey}
                  onChange={e => setConfig(c => ({ ...c, apiKey: e.target.value }))}
                  placeholder="Enter your API key or Auth Token…"
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white text-sm placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent pr-11"
                />
                <button
                  onClick={() => setShowApiKey(!showApiKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
                >
                  {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* WhatsApp Number */}
            <div>
              <label className="text-zinc-400 text-xs font-medium block mb-2">WhatsApp Business Number</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                <input
                  type="text"
                  value={config.phoneNumber}
                  onChange={e => setConfig(c => ({ ...c, phoneNumber: e.target.value }))}
                  placeholder="+91 9876543210"
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl pl-10 pr-4 py-3 text-white text-sm placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent"
                />
              </div>
            </div>

            {/* Send Method */}
            <div>
              <label className="text-zinc-400 text-xs font-medium block mb-2">Send Via</label>
              <div className="flex gap-2">
                {[
                  { val: 'whatsapp', label: '📱 WhatsApp' },
                  { val: 'sms', label: '💬 SMS' },
                  { val: 'both', label: '🔀 Both' },
                ].map(opt => (
                  <button
                    key={opt.val}
                    onClick={() => setConfig(c => ({ ...c, sendMethod: opt.val }))}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border transition-all ${
                      config.sendMethod === opt.val
                        ? 'bg-amber-400 text-black border-amber-400'
                        : 'bg-zinc-800 text-zinc-400 border-zinc-700 hover:border-zinc-500'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-1">
              <button
                onClick={handleConnect}
                disabled={savingConfig}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm transition-all disabled:opacity-50 ${
                  connected
                    ? 'bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30'
                    : 'bg-green-500 text-white hover:bg-green-400 shadow-lg shadow-green-500/20'
                }`}
              >
                {savingConfig ? <Loader2 className="w-4 h-4 animate-spin" /> : connected ? <WifiOff className="w-4 h-4" /> : <Wifi className="w-4 h-4" />}
                {connected ? 'Disconnect' : 'Connect API'}
              </button>
              <button
                onClick={handleSaveConfig}
                disabled={savingConfig}
                className="flex-1 flex items-center justify-center gap-2 py-3 bg-amber-400 text-black rounded-xl font-bold text-sm hover:bg-amber-300 transition-all disabled:opacity-50 shadow-lg shadow-amber-500/20"
              >
                {savingConfig ? <Loader2 className="w-4 h-4 animate-spin" /> : <Settings2 className="w-4 h-4" />}
                Save Settings
              </button>
            </div>
          </div>

          {/* Test Message Card */}
          <div className="space-y-5">
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-amber-400/20 rounded-xl flex items-center justify-center">
                  <Send className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <h2 className="text-white font-bold">Send Verification Ping</h2>
                  <p className="text-zinc-500 text-xs">Verify your connection is working</p>
                </div>
              </div>

              {!connected && (
                <div className="flex items-start gap-3 bg-amber-400/10 border border-amber-400/20 rounded-xl p-3">
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <p className="text-amber-400 text-xs">Connect your WhatsApp API first before sending verification pings</p>
                </div>
              )}

              <div>
                <label className="text-zinc-400 text-xs font-medium block mb-2">Verification Phone Number</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                  <input
                    type="text"
                    value={testPhone}
                    onChange={e => setTestPhone(e.target.value)}
                    placeholder="+91 9876543210"
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-xl pl-10 pr-4 py-3 text-white text-sm placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent"
                  />
                </div>
              </div>

              <button
                onClick={handleSendTest}
                disabled={sendingTest || !connected}
                className="w-full flex items-center justify-center gap-2 py-3 bg-green-500 text-white rounded-xl font-bold text-sm hover:bg-green-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-green-500/20"
              >
                {sendingTest ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                {sendingTest ? 'Sending Ping…' : 'Send Verification Ping'}
              </button>
            </div>

            {/* Integration Status */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
              <h3 className="text-white font-semibold text-sm mb-4">Integration Status</h3>
              <div className="space-y-3">
                {[
                  { label: 'API Key', ok: !!config.apiKey },
                  { label: 'Phone Number', ok: !!config.phoneNumber },
                  { label: 'Connection', ok: connected },
                  { label: 'Reminders Enabled', ok: config.reminderEnabled === 1 },
                ].map(item => (
                  <div key={item.label} className="flex items-center justify-between">
                    <span className="text-zinc-400 text-sm">{item.label}</span>
                    <div className={`flex items-center gap-1.5 text-xs font-semibold ${item.ok ? 'text-green-400' : 'text-zinc-500'}`}>
                      {item.ok ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                      {item.ok ? 'Ready' : 'Not Set'}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Tab: Automation ─────────────────────────────────────────────────────── */}
      {activeTab === 'automation' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Quick Send */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-white font-bold text-lg">Send Reminders Now</h2>
              <span className="text-zinc-500 text-xs">Sends to matching members instantly</span>
            </div>
            <ReminderTrigger
              icon={Calendar}
              label="Membership Expiry Reminders"
              description={`Send to members expiring within ${config.expiryReminderDays} days or already expired`}
              type="expiry"
              color="bg-orange-500/20 text-orange-400"
              onSend={handleSendReminders}
              loading={sendingType}
            />
            <ReminderTrigger
              icon={CreditCard}
              label="Pending Payment Reminders"
              description="Remind members with pending dues to clear their payments"
              type="payment"
              color="bg-blue-500/20 text-blue-400"
              onSend={handleSendReminders}
              loading={sendingType}
            />
            <ReminderTrigger
              icon={Activity}
              label="Low Attendance Wake-up"
              description="Message active members who haven't visited recently"
              type="attendance"
              color="bg-green-500/20 text-green-400"
              onSend={handleSendReminders}
              loading={sendingType}
            />
            <ReminderTrigger
              icon={Gift}
              label="Promotional Offers Blast"
              description="Send promotional or special offer messages to all members"
              type="promo"
              color="bg-purple-500/20 text-purple-400"
              onSend={handleSendReminders}
              loading={sendingType}
            />
          </div>

          {/* Right: Settings */}
          <div className="space-y-5">
            {/* Global Toggle */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 space-y-4">
              <h3 className="text-white font-bold text-sm">Automation Settings</h3>

              {/* Reminder Enabled */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white text-sm font-medium">Reminder System</p>
                  <p className="text-zinc-500 text-xs mt-0.5">Master on/off toggle</p>
                </div>
                <button
                  onClick={() => setConfig(c => ({ ...c, reminderEnabled: c.reminderEnabled === 1 ? 0 : 1 }))}
                  className={`relative w-12 h-6 rounded-full transition-colors ${config.reminderEnabled === 1 ? 'bg-amber-400' : 'bg-zinc-700'}`}
                >
                  <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${config.reminderEnabled === 1 ? 'left-7' : 'left-1'}`} />
                </button>
              </div>

              {/* Auto Send */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white text-sm font-medium">Auto-Send Daily</p>
                  <p className="text-zinc-500 text-xs mt-0.5">Send reminders automatically each day</p>
                </div>
                <button
                  onClick={() => setConfig(c => ({ ...c, autoSend: c.autoSend === 1 ? 0 : 1 }))}
                  className={`relative w-12 h-6 rounded-full transition-colors ${config.autoSend === 1 ? 'bg-amber-400' : 'bg-zinc-700'}`}
                >
                  <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${config.autoSend === 1 ? 'left-7' : 'left-1'}`} />
                </button>
              </div>

              {/* Expiry Days */}
              <div>
                <label className="text-zinc-400 text-xs font-medium block mb-2">
                  Expiry Alert Window: <span className="text-amber-400">{config.expiryReminderDays} days</span>
                </label>
                <input
                  type="range"
                  min={1}
                  max={30}
                  value={config.expiryReminderDays}
                  onChange={e => setConfig(c => ({ ...c, expiryReminderDays: Number(e.target.value) }))}
                  className="w-full accent-amber-400"
                />
                <div className="flex justify-between text-zinc-600 text-xs mt-1">
                  <span>1 day</span>
                  <span>30 days</span>
                </div>
              </div>

              <button
                onClick={handleSaveConfig}
                disabled={savingConfig}
                className="w-full flex items-center justify-center gap-2 py-2.5 bg-amber-400 text-black rounded-xl font-bold text-sm hover:bg-amber-300 transition-all disabled:opacity-50"
              >
                {savingConfig ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                Save Preferences
              </button>
            </div>

            {/* Message Template */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 space-y-3">
              <h3 className="text-white font-bold text-sm">Custom Message Template</h3>
              <p className="text-zinc-500 text-xs">Variables: {'{name}'}, {'{date}'}, {'{days}'}, {'{plan}'}</p>
              <textarea
                rows={5}
                value={config.customMessage}
                onChange={e => setConfig(c => ({ ...c, customMessage: e.target.value }))}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-xl p-3 text-white text-sm placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent resize-none leading-relaxed"
                placeholder="Dear {name}, your membership expires on {date}…"
              />
              <button
                onClick={handleSaveConfig}
                disabled={savingConfig}
                className="w-full flex items-center justify-center gap-2 py-2.5 bg-zinc-700 text-white rounded-xl font-semibold text-sm hover:bg-zinc-600 transition-all disabled:opacity-50"
              >
                {savingConfig ? <Loader2 className="w-4 h-4 animate-spin" /> : <ChevronRight className="w-4 h-4" />}
                Save Template
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Tab: Logs ──────────────────────────────────────────────────────────── */}
      {activeTab === 'logs' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-white font-bold text-lg">Reminder History</h2>
            <div className="flex gap-3">
              <button
                onClick={fetchLogs}
                className="flex items-center gap-2 px-4 py-2 bg-zinc-800 text-zinc-300 rounded-xl text-sm font-semibold hover:bg-zinc-700 transition-all border border-zinc-700"
              >
                <RefreshCw className="w-4 h-4" /> Refresh
              </button>
              {logs.length > 0 && (
                <button
                  onClick={handleClearLogs}
                  className="flex items-center gap-2 px-4 py-2 bg-red-500/20 text-red-400 rounded-xl text-sm font-semibold hover:bg-red-500/30 transition-all border border-red-500/30"
                >
                  <Trash2 className="w-4 h-4" /> Clear All
                </button>
              )}
            </div>
          </div>

          {loadingLogs ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 text-amber-400 animate-spin" />
            </div>
          ) : logs.length === 0 ? (
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-16 text-center">
              <MessageCircle className="w-12 h-12 text-zinc-700 mx-auto mb-4" />
              <p className="text-zinc-400 font-semibold">No reminders sent yet</p>
              <p className="text-zinc-600 text-sm mt-2">Send reminders from the Automation tab</p>
            </div>
          ) : (
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
              <div className="grid grid-cols-6 px-5 py-3 border-b border-zinc-800 text-xs font-semibold text-zinc-500 uppercase tracking-wide">
                <span className="col-span-1">Member</span>
                <span className="col-span-1">Phone</span>
                <span className="col-span-1">Type</span>
                <span className="col-span-1">Via</span>
                <span className="col-span-1">Status</span>
                <span className="col-span-1">Sent At</span>
              </div>
              <div className="divide-y divide-zinc-800 max-h-[480px] overflow-y-auto">
                {logs.map(log => (
                  <div key={log.id} className="grid grid-cols-6 px-5 py-3.5 items-center hover:bg-zinc-800/50 transition-colors group">
                    <span className="text-white text-sm font-medium truncate">{log.memberName}</span>
                    <span className="text-zinc-400 text-sm font-mono">{log.phone}</span>
                    <span>
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${
                        log.type === 'expiry' ? 'bg-orange-500/20 text-orange-400' :
                        log.type === 'payment' ? 'bg-blue-500/20 text-blue-400' :
                        log.type === 'attendance' ? 'bg-green-500/20 text-green-400' :
                        log.type === 'promo' ? 'bg-purple-500/20 text-purple-400' :
                        'bg-zinc-700 text-zinc-400'
                      }`}>
                        {log.type === 'expiry' && <Calendar className="w-3 h-3" />}
                        {log.type === 'payment' && <CreditCard className="w-3 h-3" />}
                        {log.type === 'attendance' && <Activity className="w-3 h-3" />}
                        {log.type === 'promo' && <Gift className="w-3 h-3" />}
                        {log.type === 'test' && <Zap className="w-3 h-3" />}
                        {log.type}
                      </span>
                    </span>
                    <span>
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                        log.method === 'whatsapp' ? 'bg-green-500/20 text-green-400' :
                        log.method === 'sms' ? 'bg-blue-500/20 text-blue-400' :
                        'bg-zinc-700 text-zinc-400'
                      }`}>
                        {log.method === 'whatsapp' ? '📱 WA' : log.method === 'sms' ? '💬 SMS' : log.method}
                      </span>
                    </span>
                    <span>
                      <span className={`flex items-center gap-1 text-xs font-semibold ${
                        log.status === 'sent' ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {log.status === 'sent' ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                        {log.status}
                      </span>
                    </span>
                    <span className="text-zinc-500 text-xs flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(log.sentAt).toLocaleString('en-IN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: 'short' })}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Toast */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onDone={() => setToast(null)}
        />
      )}

      <style>{`
        @keyframes slide-up {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .animate-slide-up { animation: slide-up 0.3s ease forwards; }
      `}</style>
    </div>
  );
}
