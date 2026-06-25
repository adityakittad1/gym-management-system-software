import React, { useState, useEffect } from 'react';
import { Building2, Phone, Mail, MapPin, Bell, Palette, Shield, Save, KeyRound, Sparkles, Sliders } from 'lucide-react';
import { api } from '../services/api';
import { toast } from 'sonner';

export default function Settings() {
  const [gymName, setGymName] = useState('');
  const [tagline, setTagline] = useState('');
  const [gymType, setGymType] = useState('');
  const [primaryPhone, setPrimaryPhone] = useState('');
  const [secondaryPhone, setSecondaryPhone] = useState('');
  const [email, setEmail] = useState('');
  const [instagram, setInstagram] = useState('');
  const [address, setAddress] = useState('');
  const [openingTime, setOpeningTime] = useState('');
  const [closingTime, setClosingTime] = useState('');
  
  // Preferences
  const [expiryAlerts, setExpiryAlerts] = useState(true);
  const [paymentReminders, setPaymentReminders] = useState(true);
  const [newMemberAlerts, setNewMemberAlerts] = useState(true);
  
  // Integration details (Twilio API Webhooks)
  const [twilioSid, setTwilioSid] = useState('AC875d9fb5a2ee092f6b8df81552a23e');
  const [twilioToken, setTwilioToken] = useState('••••••••••••••••••••••••••••••••');
  const [twilioPhone, setTwilioPhone] = useState('+18668891406');
  const [webhookUrl, setWebhookUrl] = useState('https://api.ttz.fitness/v1/webhooks/whatsapp');

  // Branding Customization
  const [brandColor, setBrandColor] = useState('amber');
  const [logoUrl, setLogoUrl] = useState('https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=100');

  const [isLoading, setIsLoading] = useState(true);

  const fetchSettings = async () => {
    try {
      setIsLoading(true);
      const data = await api.settings.get();
      setGymName(data.gymName || '');
      setTagline(data.tagline || '');
      setGymType(data.gymType || '');
      setPrimaryPhone(data.primaryPhone || '');
      setSecondaryPhone(data.secondaryPhone || '');
      setEmail(data.email || '');
      setInstagram(data.instagram || '');
      setAddress(data.address || '');
      setOpeningTime(data.openingTime || '05:00');
      setClosingTime(data.closingTime || '23:00');
      setExpiryAlerts(data.expiryAlerts === 'true');
      setPaymentReminders(data.paymentReminders === 'true');
      setNewMemberAlerts(data.newMemberAlerts === 'true');
      
      // Load custom integration keys if saved in key-values
      if (data.twilioSid) setTwilioSid(data.twilioSid);
      if (data.twilioPhone) setTwilioPhone(data.twilioPhone);
      if (data.webhookUrl) setWebhookUrl(data.webhookUrl);
      if (data.brandColor) setBrandColor(data.brandColor);
    } catch (err: any) {
      toast.error('Failed to load system preferences');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.settings.save({
        gymName,
        tagline,
        gymType,
        primaryPhone,
        secondaryPhone,
        email,
        instagram,
        address,
        openingTime,
        closingTime,
        expiryAlerts: String(expiryAlerts),
        paymentReminders: String(paymentReminders),
        newMemberAlerts: String(newMemberAlerts),
        twilioSid,
        twilioPhone,
        webhookUrl,
        brandColor
      });
      toast.success('Gym settings saved successfully!');
    } catch (err) {
      toast.error('Failed to update system preferences');
    }
  };

  const handleTestWebhook = () => {
    toast.success('Simulated test webhook dispatch successful! (HTTP 200 OK)');
  };

  return (
    <div className="page-container" style={{ padding: '28px', maxWidth: '1400px', margin: '0 auto' }}>
      
      {/* Header */}
      <div className="animate-fade-up" style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
          <h1 style={{ fontFamily: "'Syne', sans-serif", fontSize: '26px', fontWeight: 800, color: 'var(--foreground)', letterSpacing: '-0.03em', margin: 0 }}>System Settings</h1>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '3px 10px', borderRadius: '20px', background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.2)', fontSize: '10px', fontWeight: 700, color: '#fbbf24', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            <Sparkles style={{ width: 9, height: 9 }} /> Preferences
          </span>
        </div>
        <p style={{ color: 'var(--muted-foreground)', fontSize: '13px', margin: 0 }}>Configure brand styling, Twilio API webhooks, hours, and notifications.</p>
      </div>

      {isLoading ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '60px', gap: '12px' }}>
          <div style={{ width: '32px', height: '32px', border: '2px solid rgba(251,191,36,0.2)', borderTopColor: '#fbbf24', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
          <p style={{ color: 'var(--muted-foreground)', fontSize: '12px', fontFamily: "'JetBrains Mono',monospace" }}>Loading preferences...</p>
        </div>
      ) : (
        <form onSubmit={handleSave} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Left and Middle Columns */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Gym Profile Info */}
              <div className="bg-zinc-950/70 border border-zinc-800/80 rounded-2xl p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-amber-400/10 rounded-xl flex items-center justify-center border border-amber-400/10">
                    <Building2 className="w-5 h-5 text-amber-400" />
                  </div>
                  <h2 className="text-white text-base font-bold">Gym Profile Details</h2>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-zinc-400 text-xs font-bold uppercase tracking-wider mb-2">Gym Name</label>
                      <input
                        type="text"
                        required
                        value={gymName}
                        onChange={(e) => setGymName(e.target.value)}
                        className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-amber-400"
                      />
                    </div>

                    <div>
                      <label className="block text-zinc-400 text-xs font-bold uppercase tracking-wider mb-2">Gym Type Descriptor</label>
                      <input
                        type="text"
                        value={gymType}
                        onChange={(e) => setGymType(e.target.value)}
                        className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-amber-400"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-zinc-400 text-xs font-bold uppercase tracking-wider mb-2">Branding Tagline</label>
                    <input
                      type="text"
                      value={tagline}
                      onChange={(e) => setTagline(e.target.value)}
                      className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-amber-400"
                    />
                  </div>
                </div>
              </div>

              {/* Twilio & Webhook Integrations */}
              <div className="bg-zinc-950/70 border border-zinc-800/80 rounded-2xl p-6 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-amber-400/10 rounded-xl flex items-center justify-center border border-amber-400/10">
                      <KeyRound className="w-5 h-5 text-amber-400" />
                    </div>
                    <h2 className="text-white text-base font-bold">API Integrations</h2>
                  </div>
                  <button
                    type="button"
                    onClick={handleTestWebhook}
                    className="text-[10px] bg-zinc-900 border border-zinc-800 text-zinc-400 font-bold uppercase tracking-wider px-2.5 py-1.5 rounded-lg hover:text-white hover:border-zinc-700"
                  >
                    Test Webhook
                  </button>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-zinc-400 text-xs font-bold uppercase tracking-wider mb-2">Twilio Account SID</label>
                      <input
                        type="text"
                        value={twilioSid}
                        onChange={(e) => setTwilioSid(e.target.value)}
                        className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white font-mono focus:outline-none focus:ring-1 focus:ring-amber-400"
                      />
                    </div>
                    <div>
                      <label className="block text-zinc-400 text-xs font-bold uppercase tracking-wider mb-2">Twilio Auth Token</label>
                      <input
                        type="password"
                        value={twilioToken}
                        onChange={(e) => setTwilioToken(e.target.value)}
                        className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white font-mono focus:outline-none focus:ring-1 focus:ring-amber-400"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-zinc-400 text-xs font-bold uppercase tracking-wider mb-2">Twilio Sender Number</label>
                      <input
                        type="text"
                        value={twilioPhone}
                        onChange={(e) => setTwilioPhone(e.target.value)}
                        className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white font-mono focus:outline-none focus:ring-1 focus:ring-amber-400"
                      />
                    </div>
                    <div>
                      <label className="block text-zinc-400 text-xs font-bold uppercase tracking-wider mb-2">Webhook Target Endpoint</label>
                      <input
                        type="text"
                        value={webhookUrl}
                        onChange={(e) => setWebhookUrl(e.target.value)}
                        className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white font-mono focus:outline-none focus:ring-1 focus:ring-amber-400"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Contact and address details */}
              <div className="bg-zinc-950/70 border border-zinc-800/80 rounded-2xl p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-amber-400/10 rounded-xl flex items-center justify-center border border-amber-400/10">
                    <MapPin className="w-5 h-5 text-amber-400" />
                  </div>
                  <h2 className="text-white text-base font-bold">Contact & Address</h2>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-zinc-400 text-xs font-bold uppercase tracking-wider mb-2">Primary Phone</label>
                      <input
                        type="tel"
                        required
                        value={primaryPhone}
                        onChange={(e) => setPrimaryPhone(e.target.value)}
                        className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white font-mono focus:outline-none focus:ring-1 focus:ring-amber-400"
                      />
                    </div>
                    <div>
                      <label className="block text-zinc-400 text-xs font-bold uppercase tracking-wider mb-2">Secondary Phone</label>
                      <input
                        type="tel"
                        value={secondaryPhone}
                        onChange={(e) => setSecondaryPhone(e.target.value)}
                        className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white font-mono focus:outline-none focus:ring-1 focus:ring-amber-400"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-zinc-400 text-xs font-bold uppercase tracking-wider mb-2">Email Address</label>
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-amber-400"
                      />
                    </div>
                    <div>
                      <label className="block text-zinc-400 text-xs font-bold uppercase tracking-wider mb-2">Instagram Handle</label>
                      <input
                        type="text"
                        value={instagram}
                        onChange={(e) => setInstagram(e.target.value)}
                        className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-amber-400"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-zinc-400 text-xs font-bold uppercase tracking-wider mb-2">Location Address</label>
                    <textarea
                      rows={2}
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-amber-400 resize-none"
                    />
                  </div>
                </div>
              </div>

            </div>

            {/* Right Column Preferences */}
            <div className="space-y-6">
              
              {/* Branding Customizations */}
              <div className="bg-zinc-950/70 border border-zinc-800/80 rounded-2xl p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-amber-400/10 rounded-xl flex items-center justify-center border border-amber-400/10">
                    <Palette className="w-5 h-5 text-amber-400" />
                  </div>
                  <h2 className="text-white text-base font-bold">Brand Aesthetics</h2>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-zinc-400 text-xs font-bold uppercase tracking-wider mb-2">Primary Highlight Color</label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { id: 'amber', name: 'Amber', class: 'bg-amber-400' },
                        { id: 'yellow', name: 'Yellow', class: 'bg-yellow-500' },
                        { id: 'orange', name: 'Orange', class: 'bg-orange-500' }
                      ].map(color => (
                        <button
                          key={color.id}
                          type="button"
                          onClick={() => setBrandColor(color.id)}
                          className={`py-2 px-3 text-xs rounded-xl font-bold transition flex items-center gap-1.5 border justify-center ${
                            brandColor === color.id
                              ? 'border-amber-400 bg-amber-400/5 text-amber-400 font-extrabold'
                              : 'border-zinc-800 bg-zinc-900/20 text-zinc-500'
                          }`}
                        >
                          <span className={`w-2.5 h-2.5 rounded-full ${color.class}`} /> {color.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-zinc-400 text-xs font-bold uppercase tracking-wider mb-2">Upload Brand Logo</label>
                    <div className="flex items-center gap-3 bg-zinc-900/40 border border-zinc-850 p-3 rounded-2xl">
                      <img src={logoUrl} alt="Gym Logo" className="w-11 h-11 object-cover rounded-xl border border-zinc-800" />
                      <button
                        type="button"
                        onClick={() => {
                          const url = prompt('Enter Logo Image URL:');
                          if (url) setLogoUrl(url);
                        }}
                        className="text-[10px] bg-zinc-950 border border-zinc-800 text-zinc-400 hover:text-white px-2.5 py-1.5 rounded-xl font-bold uppercase tracking-wider"
                      >
                        Choose URL
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Notification Toggles */}
              <div className="bg-zinc-950/70 border border-zinc-800/80 rounded-2xl p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-amber-400/10 rounded-xl flex items-center justify-center border border-amber-400/10">
                    <Bell className="w-5 h-5 text-amber-400" />
                  </div>
                  <h2 className="text-white text-base font-bold">Preferences</h2>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white text-xs font-bold">Membership Expiries</p>
                      <p className="text-zinc-500 text-[10px] mt-0.5">Alert 5 days before expiry</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={expiryAlerts}
                        onChange={(e) => setExpiryAlerts(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-10 h-5.5 bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-4.5 after:w-4.5 after:transition-all peer-checked:bg-amber-400"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white text-xs font-bold">Payment Reminders</p>
                      <p className="text-zinc-500 text-[10px] mt-0.5">Notify outstanding invoices</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={paymentReminders}
                        onChange={(e) => setPaymentReminders(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-10 h-5.5 bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-4.5 after:w-4.5 after:transition-all peer-checked:bg-amber-400"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white text-xs font-bold">New Member Alerts</p>
                      <p className="text-zinc-500 text-[10px] mt-0.5">Notify on registrations</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={newMemberAlerts}
                        onChange={(e) => setNewMemberAlerts(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-10 h-5.5 bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-4.5 after:w-4.5 after:transition-all peer-checked:bg-amber-400"></div>
                    </label>
                  </div>
                </div>
              </div>

              {/* Hours of Operation */}
              <div className="bg-zinc-950/70 border border-zinc-800/80 rounded-2xl p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-amber-400/10 rounded-xl flex items-center justify-center border border-amber-400/10">
                    <Sliders className="w-5 h-5 text-amber-400" />
                  </div>
                  <h2 className="text-white text-base font-bold">Business Hours</h2>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-zinc-400 text-[10px] font-bold uppercase tracking-wider mb-2">Opening Shift</label>
                    <input
                      type="time"
                      value={openingTime}
                      onChange={(e) => setOpeningTime(e.target.value)}
                      className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl px-4 py-2 text-xs text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-zinc-400 text-[10px] font-bold uppercase tracking-wider mb-2">Closing Shift</label>
                    <input
                      type="time"
                      value={closingTime}
                      onChange={(e) => setClosingTime(e.target.value)}
                      className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl px-4 py-2 text-xs text-white font-mono"
                    />
                  </div>
                </div>
              </div>

            </div>

          </div>

          {/* Form Actions footer */}
          <div className="flex justify-end pt-4 border-t border-zinc-850">
            <button
              type="submit"
              className="bg-amber-400 hover:bg-amber-500 text-black font-bold px-8 py-3.5 rounded-xl shadow-lg shadow-amber-500/10 transition flex items-center gap-2 text-xs uppercase tracking-wider"
            >
              <Save className="w-4 h-4" /> Save System Settings
            </button>
          </div>

        </form>
      )}

    </div>
  );
}
