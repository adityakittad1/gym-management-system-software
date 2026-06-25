import { AlertCircle, Bell, X, CheckCheck, Clock, CreditCard, UserPlus } from 'lucide-react';
import { useState, useEffect } from 'react';
import { api, NotificationRecord } from '../services/api';
import { toast } from 'sonner';

interface NotificationsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

function getNotificationMeta(title: string): {
  icon: React.ElementType;
  color: string;
  bg: string;
  border: string;
} {
  const t = title.toLowerCase();
  if (t.includes('expir')) return { icon: Clock, color: '#fb923c', bg: 'rgba(251,146,60,0.1)', border: 'rgba(251,146,60,0.2)' };
  if (t.includes('payment') || t.includes('due') || t.includes('pay'))
    return { icon: CreditCard, color: '#f87171', bg: 'rgba(248,113,113,0.1)', border: 'rgba(248,113,113,0.2)' };
  if (t.includes('new') || t.includes('join') || t.includes('welcome'))
    return { icon: UserPlus, color: '#4ade80', bg: 'rgba(74,222,128,0.1)', border: 'rgba(74,222,128,0.2)' };
  return { icon: Bell, color: '#fbbf24', bg: 'rgba(251,191,36,0.1)', border: 'rgba(251,191,36,0.2)' };
}

export default function NotificationsPanel({ isOpen, onClose }: NotificationsPanelProps) {
  const [notifications, setNotifications] = useState<NotificationRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchNotifications = async () => {
    setIsLoading(true);
    try {
      const data = await api.notifications.list();
      setNotifications(data.filter(n => n.isRead === 0));
    } catch (err: any) {
      console.error('Failed to load notifications:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) fetchNotifications();
  }, [isOpen]);

  const removeNotification = async (id: number) => {
    try {
      await api.notifications.markRead(id);
      setNotifications(notifications.filter(n => n.id !== id));
    } catch {
      toast.error('Failed to dismiss');
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.notifications.clearAll();
      setNotifications([]);
      toast.success('All notifications cleared');
    } catch {
      toast.error('Failed to clear notifications');
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,0.6)',
          backdropFilter: 'blur(4px)',
          zIndex: 40,
        }}
      />

      {/* Slide-in Panel */}
      <div
        className="animate-slide-right"
        style={{
          position: 'fixed',
          right: 0,
          top: 0,
          height: '100%',
          width: '100%',
          maxWidth: '380px',
          background: 'rgba(10,10,12,0.97)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderLeft: '1px solid rgba(39,39,42,0.8)',
          zIndex: 50,
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '-8px 0 40px rgba(0,0,0,0.6)',
        }}
      >
        {/* Header */}
        <div style={{
          padding: '20px 20px 16px',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: 'rgba(251,191,36,0.1)',
              border: '1px solid rgba(251,191,36,0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <Bell style={{ width: 16, height: 16, color: '#fbbf24' }} />
            </div>
            <div>
              <h2 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--foreground)', margin: 0 }}>Notifications</h2>
              <p style={{ fontSize: '11px', color: 'var(--muted-foreground)', margin: 0, marginTop: '1px' }}>
                {notifications.length > 0 ? `${notifications.length} unread` : 'All caught up'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              border: 'none',
              background: 'var(--card)',
              color: 'var(--muted-foreground)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(63,63,70,0.8)'; e.currentTarget.style.color = '#fff'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(39,39,42,0.6)'; e.currentTarget.style.color = '#71717a'; }}
          >
            <X style={{ width: 14, height: 14 }} />
          </button>
        </div>

        {/* Notifications List */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '12px' }}>
          {isLoading ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '12px' }}>
              <div style={{ width: '28px', height: '28px', border: '2px solid rgba(251,191,36,0.2)', borderTopColor: '#fbbf24', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
              <span style={{ color: 'var(--muted-foreground)', fontSize: '12px' }}>Loading...</span>
            </div>
          ) : notifications.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', textAlign: 'center', padding: '32px' }}>
              <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: 'var(--card)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
                <CheckCheck style={{ width: 24, height: 24, color: '#4ade80' }} />
              </div>
              <p style={{ color: 'var(--muted-foreground)', fontSize: '13px', fontWeight: 600, margin: 0 }}>All caught up!</p>
              <p style={{ color: '#3f3f46', fontSize: '11px', margin: '4px 0 0' }}>No new notifications</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {notifications.map((notification, idx) => {
                const { icon: Icon, color, bg, border } = getNotificationMeta(notification.title);
                return (
                  <div
                    key={notification.id}
                    className="animate-fade-up"
                    style={{
                      animationDelay: `${idx * 50}ms`,
                      opacity: 0,
                      padding: '14px',
                      borderRadius: '12px',
                      background: bg,
                      border: `1px solid ${border}`,
                      position: 'relative',
                    }}
                  >
                    <button
                      onClick={() => removeNotification(notification.id)}
                      style={{
                        position: 'absolute',
                        top: '10px',
                        right: '10px',
                        width: '24px',
                        height: '24px',
                        borderRadius: '6px',
                        border: 'none',
                        background: 'var(--card)',
                        color: 'var(--muted-foreground)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                      onMouseEnter={e => { e.currentTarget.style.background = 'rgba(63,63,70,0.8)'; e.currentTarget.style.color = '#fff'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'rgba(39,39,42,0.5)'; e.currentTarget.style.color = '#71717a'; }}
                    >
                      <X style={{ width: 11, height: 11 }} />
                    </button>

                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', paddingRight: '28px' }}>
                      <div style={{
                        width: '32px', height: '32px', minWidth: '32px',
                        borderRadius: '8px',
                        background: 'rgba(0,0,0,0.2)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        flexShrink: 0,
                      }}>
                        <Icon style={{ width: 15, height: 15, color }} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <h3 style={{ fontSize: '12px', fontWeight: 700, color: 'var(--foreground)', margin: 0, marginBottom: '3px', lineHeight: 1.3 }}>
                          {notification.title}
                        </h3>
                        <p style={{ fontSize: '11px', color: 'var(--muted-foreground)', margin: 0, lineHeight: 1.4 }}>
                          {notification.message}
                        </p>
                        <p style={{ fontSize: '10px', color: 'var(--muted-foreground)', margin: '6px 0 0', fontFamily: "'JetBrains Mono', monospace" }}>
                          {notification.time}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: '12px', borderTop: '1px solid var(--border)', flexShrink: 0 }}>
          <button
            onClick={markAllAsRead}
            disabled={notifications.length === 0}
            style={{
              width: '100%',
              padding: '10px',
              borderRadius: '10px',
              border: '1px solid var(--border)',
              background: 'var(--card)',
              color: notifications.length === 0 ? '#3f3f46' : '#a1a1aa',
              fontSize: '12px',
              fontWeight: 600,
              cursor: notifications.length === 0 ? 'not-allowed' : 'pointer',
              transition: 'all 0.15s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
            }}
            onMouseEnter={e => { if (notifications.length > 0) { e.currentTarget.style.background = 'rgba(39,39,42,0.8)'; e.currentTarget.style.color = '#fafafa'; } }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(24,24,27,0.8)'; e.currentTarget.style.color = notifications.length === 0 ? '#3f3f46' : '#a1a1aa'; }}
          >
            <CheckCheck style={{ width: 13, height: 13 }} />
            Mark All as Read
          </button>
        </div>

        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </>
  );
}
