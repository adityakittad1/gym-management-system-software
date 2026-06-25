import { useState, useEffect } from 'react';
import {
  Zap, MessageCircle, Phone, Globe, Save, CheckCircle,
  AlertTriangle, Clock, Activity, Calendar, UserX, RefreshCw
} from 'lucide-react';
import { api } from '../services/api';
import { toast } from 'sonner';

export default function AutomationCenter() {
  const [config, setConfig] = useState<any>(null);
  const [logs, setLogs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'rules' | 'config' | 'logs'>('rules');
  const [testPhone, setTestPhone] = useState('');

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [cfg, logData] = await Promise.all([
        api.whatsapp.getConfig(),
        api.whatsapp.getLogs()
      ]);
      setConfig(cfg);
      setLogs(logData);
    } catch (err) {
      toast.error('Failed to load automation data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await api.whatsapp.saveConfig(config);
      toast.success('Automation settings saved');
    } catch (err) {
      toast.error('Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  const handleTest = async () => {
    if (!testPhone) return toast.error('Enter a phone number');
    try {
      await api.whatsapp.sendTest(testPhone, config.sendMethod);
      toast.success('Test message sent!');
      fetchData(); // refresh logs
    } catch (err: any) {
      toast.error(err.message || 'Failed to send test message');
    }
  };

  if (isLoading || !config) {
    return (
      <div style={{ padding: '40px 44px', maxWidth: '1200px', margin: '0 auto' }}>
        <div className="animate-pulse" style={{ height: '32px', width: '250px', background: '#151517', borderRadius: '10px', marginBottom: '40px' }} />
        <div className="animate-pulse" style={{ height: '400px', width: '100%', background: 'var(--background)', borderRadius: '20px' }} />
      </div>
    );
  }

  return (
    <div style={{ padding: '40px 44px', maxWidth: '1200px', margin: '0 auto' }}>
      
      {/* Header */}
      <div className="animate-fade-up" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '40px' }}>
        <div>
          <h1 style={{ fontFamily: "'Syne', sans-serif", fontSize: '28px', fontWeight: 800, color: 'var(--foreground)', letterSpacing: '-0.04em', margin: 0, display: 'flex', alignItems: 'center', gap: '12px' }}>
            Automation Center
            <span style={{ fontSize: '12px', fontWeight: 700, padding: '4px 10px', borderRadius: '20px', background: 'rgba(56,189,248,0.1)', color: '#38bdf8', letterSpacing: '0' }}>Active</span>
          </h1>
          <p style={{ color: '#3f3f46', fontSize: '14px', margin: '6px 0 0', fontWeight: 500 }}>
            Automate member communications and background tasks
          </p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: '32px' }} className="automation-layout">
        
        {/* Sidebar Nav */}
        <div className="animate-fade-up delay-100" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {[
            { id: 'rules', label: 'Automation Rules', icon: Zap },
            { id: 'config', label: 'Connection Setup', icon: Globe },
            { id: 'logs', label: 'Activity Logs', icon: Activity },
          ].map(tab => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px',
                  borderRadius: '12px', background: isActive ? '#18181b' : 'transparent',
                  border: 'none', color: isActive ? '#fafafa' : '#a1a1aa',
                  fontSize: '13px', fontWeight: 600, cursor: 'pointer', textAlign: 'left',
                  transition: 'all 0.2s', outline: 'none'
                }}
                onMouseEnter={e => { if (!isActive) e.currentTarget.style.color = '#fafafa'; }}
                onMouseLeave={e => { if (!isActive) e.currentTarget.style.color = '#a1a1aa'; }}
              >
                <tab.icon style={{ width: 16, height: 16, color: isActive ? '#38bdf8' : '#71717a' }} />
                {tab.label}
              </button>
            )
          })}
        </div>

        {/* Content Area */}
        <div className="animate-fade-up delay-200" style={{ background: 'var(--background)', border: '1px solid rgba(30,30,34,0.9)', borderRadius: '20px', padding: '32px' }}>
          
          {/* Rules Tab */}
          {activeTab === 'rules' && (
            <form onSubmit={handleSave}>
              <div style={{ marginBottom: '32px' }}>
                <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: '18px', fontWeight: 700, color: 'var(--foreground)', margin: '0 0 8px' }}>Smart Automations</h2>
                <p style={{ fontSize: '13px', color: 'var(--muted-foreground)', margin: 0 }}>Configure triggers for automatic message sending.</p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginBottom: '32px' }}>
                
                {/* Rule 1: Expiry */}
                <div style={{ border: '1px solid var(--border)', borderRadius: '16px', padding: '20px', display: 'flex', gap: '20px' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(251,191,36,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Calendar style={{ width: 18, height: 18, color: '#fbbf24' }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                      <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--foreground)', margin: 0 }}>Membership Expiry Reminder</h3>
                      <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                        <input type="checkbox" checked={Boolean(config.reminderEnabled)} onChange={e => setConfig({...config, reminderEnabled: e.target.checked})} style={{ display: 'none' }} />
                        <div style={{ width: '36px', height: '20px', background: config.reminderEnabled ? '#4ade80' : '#27272a', borderRadius: '10px', position: 'relative', transition: '0.2s' }}>
                          <div style={{ position: 'absolute', top: '2px', left: config.reminderEnabled ? '18px' : '2px', width: '16px', height: '16px', background: '#fff', borderRadius: '50%', transition: '0.2s' }} />
                        </div>
                      </label>
                    </div>
                    <p style={{ fontSize: '12px', color: 'var(--muted-foreground)', margin: '0 0 16px' }}>Send automatic reminders before a membership expires.</p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span style={{ fontSize: '13px', color: '#d4d4d8' }}>Trigger days before expiry:</span>
                      <input type="number" min="1" max="30" value={config.expiryReminderDays || 7} onChange={e => setConfig({...config, expiryReminderDays: Number(e.target.value)})} style={{ width: '60px', background: 'var(--background)', border: '1px solid var(--border)', borderRadius: '8px', padding: '6px 12px', color: 'var(--foreground)', fontSize: '13px', outline: 'none' }} />
                    </div>
                  </div>
                </div>

                {/* Rule 2: Inactive */}
                <div style={{ border: '1px solid var(--border)', borderRadius: '16px', padding: '20px', display: 'flex', gap: '20px' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(248,113,113,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <UserX style={{ width: 18, height: 18, color: '#f87171' }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                      <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--foreground)', margin: 0 }}>Inactive Member Recovery</h3>
                      <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                        <input type="checkbox" checked={Boolean(config.autoSend)} onChange={e => setConfig({...config, autoSend: e.target.checked})} style={{ display: 'none' }} />
                        <div style={{ width: '36px', height: '20px', background: config.autoSend ? '#4ade80' : '#27272a', borderRadius: '10px', position: 'relative', transition: '0.2s' }}>
                          <div style={{ position: 'absolute', top: '2px', left: config.autoSend ? '18px' : '2px', width: '16px', height: '16px', background: '#fff', borderRadius: '50%', transition: '0.2s' }} />
                        </div>
                      </label>
                    </div>
                    <p style={{ fontSize: '12px', color: 'var(--muted-foreground)', margin: '0 0 16px' }}>Send "We miss you" messages to members who haven't visited.</p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span style={{ fontSize: '13px', color: '#d4d4d8' }}>Trigger after absent days:</span>
                      <input type="number" min="1" max="60" value={config.lowAttendanceDays || 10} onChange={e => setConfig({...config, lowAttendanceDays: Number(e.target.value)})} style={{ width: '60px', background: 'var(--background)', border: '1px solid var(--border)', borderRadius: '8px', padding: '6px 12px', color: 'var(--foreground)', fontSize: '13px', outline: 'none' }} />
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#d4d4d8', marginBottom: '8px' }}>Global Message Template</label>
                <textarea
                  value={config.customMessage || ''}
                  onChange={e => setConfig({...config, customMessage: e.target.value})}
                  rows={4}
                  style={{ width: '100%', background: 'var(--background)', border: '1px solid var(--border)', borderRadius: '12px', padding: '12px 16px', color: 'var(--foreground)', fontSize: '13px', outline: 'none', resize: 'vertical' }}
                  placeholder="Dear {name}, your membership expires on {date}..."
                />
                <p style={{ fontSize: '11px', color: 'var(--muted-foreground)', margin: '8px 0 0' }}>Available variables: {'{name}, {date}, {days}, {plan}'}</p>
              </div>

              <div style={{ marginTop: '32px', display: 'flex', justifyContent: 'flex-end' }}>
                <button type="submit" disabled={isSaving} style={{ background: '#fafafa', color: '#09090b', border: 'none', padding: '12px 24px', borderRadius: '12px', fontSize: '13px', fontWeight: 600, cursor: isSaving ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {isSaving ? <RefreshCw style={{ width: 16, height: 16 }} className="animate-spin" /> : <Save style={{ width: 16, height: 16 }} />}
                  Save Rules
                </button>
              </div>
            </form>
          )}

          {/* Config Tab */}
          {activeTab === 'config' && (
            <form onSubmit={handleSave}>
              <div style={{ marginBottom: '32px' }}>
                <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: '18px', fontWeight: 700, color: 'var(--foreground)', margin: '0 0 8px' }}>API Connection Setup</h2>
                <p style={{ fontSize: '13px', color: 'var(--muted-foreground)', margin: 0 }}>Connect your WhatsApp Business or SMS gateway.</p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '32px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--muted-foreground)', marginBottom: '8px' }}>Delivery Channel</label>
                  <select value={config.sendMethod} onChange={e => setConfig({...config, sendMethod: e.target.value})} style={{ width: '100%', background: 'var(--background)', border: '1px solid var(--border)', borderRadius: '12px', padding: '12px 16px', color: 'var(--foreground)', fontSize: '14px', outline: 'none' }}>
                    <option value="whatsapp">WhatsApp Business API</option>
                    <option value="sms">SMS Gateway</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--muted-foreground)', marginBottom: '8px' }}>Provider</label>
                  <select value={config.provider} onChange={e => setConfig({...config, provider: e.target.value})} style={{ width: '100%', background: 'var(--background)', border: '1px solid var(--border)', borderRadius: '12px', padding: '12px 16px', color: 'var(--foreground)', fontSize: '14px', outline: 'none' }}>
                    <option value="twilio">Twilio</option>
                    <option value="meta">Meta Cloud API</option>
                    <option value="msg91">MSG91</option>
                  </select>
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--muted-foreground)', marginBottom: '8px' }}>API Key / Token</label>
                  <input type="password" value={config.apiKey} onChange={e => setConfig({...config, apiKey: e.target.value})} style={{ width: '100%', background: 'var(--background)', border: '1px solid var(--border)', borderRadius: '12px', padding: '12px 16px', color: 'var(--foreground)', fontSize: '14px', outline: 'none' }} placeholder="Enter API Key" />
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--muted-foreground)', marginBottom: '8px' }}>Sender Phone Number / ID</label>
                  <input type="text" value={config.phoneNumber} onChange={e => setConfig({...config, phoneNumber: e.target.value})} style={{ width: '100%', background: 'var(--background)', border: '1px solid var(--border)', borderRadius: '12px', padding: '12px 16px', color: 'var(--foreground)', fontSize: '14px', outline: 'none', fontFamily: "'JetBrains Mono', monospace" }} placeholder="+91..." />
                </div>
              </div>

              {/* Status */}
              <div style={{ background: 'var(--background)', border: '1px solid var(--border)', borderRadius: '12px', padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  {config.isConnected ? <CheckCircle style={{ color: '#4ade80', width: 20, height: 20 }} /> : <AlertTriangle style={{ color: '#f87171', width: 20, height: 20 }} />}
                  <div>
                    <h4 style={{ color: 'var(--foreground)', margin: 0, fontSize: '14px', fontWeight: 600 }}>Connection Status</h4>
                    <p style={{ color: 'var(--muted-foreground)', margin: '2px 0 0', fontSize: '12px' }}>{config.isConnected ? 'Connected to provider' : 'Not connected'}</p>
                  </div>
                </div>
                <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                  <input type="checkbox" checked={Boolean(config.isConnected)} onChange={e => setConfig({...config, isConnected: e.target.checked})} style={{ display: 'none' }} />
                  <div style={{ width: '44px', height: '24px', background: config.isConnected ? '#4ade80' : '#27272a', borderRadius: '12px', position: 'relative', transition: '0.2s' }}>
                    <div style={{ position: 'absolute', top: '2px', left: config.isConnected ? '22px' : '2px', width: '20px', height: '20px', background: '#fff', borderRadius: '50%', transition: '0.2s' }} />
                  </div>
                </label>
              </div>

              {/* Test Connection */}
              <div style={{ borderTop: '1px solid var(--border)', paddingTop: '32px', display: 'flex', gap: '16px', alignItems: 'flex-end' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--muted-foreground)', marginBottom: '8px' }}>Test Phone Number</label>
                  <input type="text" value={testPhone} onChange={e => setTestPhone(e.target.value)} style={{ width: '100%', background: 'var(--background)', border: '1px solid var(--border)', borderRadius: '12px', padding: '12px 16px', color: 'var(--foreground)', fontSize: '14px', outline: 'none' }} placeholder="+91..." />
                </div>
                <button type="button" onClick={handleTest} style={{ background: 'transparent', border: '1px solid var(--border)', color: 'var(--foreground)', padding: '12px 24px', borderRadius: '12px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>
                  Send Test Message
                </button>
                <button type="submit" disabled={isSaving} style={{ background: '#fafafa', color: '#09090b', border: 'none', padding: '12px 24px', borderRadius: '12px', fontSize: '13px', fontWeight: 600, cursor: isSaving ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {isSaving ? <RefreshCw style={{ width: 16, height: 16 }} className="animate-spin" /> : <Save style={{ width: 16, height: 16 }} />}
                  Save Config
                </button>
              </div>
            </form>
          )}

          {/* Logs Tab */}
          {activeTab === 'logs' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <div>
                  <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: '18px', fontWeight: 700, color: 'var(--foreground)', margin: '0 0 8px' }}>Activity Logs</h2>
                  <p style={{ fontSize: '13px', color: 'var(--muted-foreground)', margin: 0 }}>History of all automated messages sent.</p>
                </div>
                <button onClick={() => { api.whatsapp.clearLogs(); setLogs([]); toast.success('Logs cleared'); }} style={{ background: 'transparent', border: 'none', color: '#ef4444', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>
                  Clear All
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '500px', overflowY: 'auto', paddingRight: '8px' }}>
                {logs.length === 0 ? (
                  <div style={{ padding: '40px', textAlign: 'center', color: 'var(--muted-foreground)', fontSize: '13px' }}>No logs found</div>
                ) : logs.map((log: any) => (
                  <div key={log.id} style={{ padding: '16px', background: 'var(--background)', borderRadius: '12px', border: '1px solid var(--border)', display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: log.status === 'sent' ? 'rgba(74,222,128,0.1)' : 'rgba(248,113,113,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      {log.method === 'whatsapp' ? <MessageCircle style={{ width: 14, height: 14, color: log.status === 'sent' ? '#4ade80' : '#f87171' }} /> : <Phone style={{ width: 14, height: 14, color: log.status === 'sent' ? '#4ade80' : '#f87171' }} />}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--foreground)' }}>{log.memberName} <span style={{ color: 'var(--muted-foreground)', fontWeight: 400 }}>({log.phone})</span></span>
                        <span style={{ fontSize: '11px', color: 'var(--muted-foreground)' }}>{new Date(log.sentAt).toLocaleString()}</span>
                      </div>
                      <p style={{ fontSize: '12px', color: 'var(--muted-foreground)', margin: '0 0 8px', lineHeight: 1.4 }}>{log.message}</p>
                      <span style={{ display: 'inline-block', fontSize: '10px', fontWeight: 700, padding: '2px 8px', borderRadius: '12px', background: log.status === 'sent' ? 'rgba(74,222,128,0.1)' : 'rgba(248,113,113,0.1)', color: log.status === 'sent' ? '#4ade80' : '#f87171', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        {log.type} · {log.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>
      
      <style>{`
        @media (max-width: 768px) {
          .automation-layout { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}
