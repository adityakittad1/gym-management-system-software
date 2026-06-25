import React, { useState } from 'react';
import { Lock, Mail, Phone, Shield, ArrowLeft, KeyRound, Users } from 'lucide-react';
import { api } from '../services/api';
import { toast } from 'sonner';

interface LoginProps {
  onLogin: (user: any) => void;
}

export default function Login({ onLogin }: LoginProps) {
  const [activeTab, setActiveTab] = useState<'staff' | 'member'>('staff');
  
  // Staff/Admin Credentials
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // Member Credentials
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [showOtpInput, setShowOtpInput] = useState(false);
  
  // Loading states
  const [isLoading, setIsLoading] = useState(false);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  
  // Forgot Password flow
  const [showForgotForm, setShowForgotForm] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSuccess, setForgotSuccess] = useState(false);

  // Submit Admin/Staff Login
  const handleStaffSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const response = await api.auth.login({ email, password });
      if (response.success) {
        toast.success(`Welcome back, ${response.user.name}!`);
        onLogin(response.user);
      } else {
        toast.error('Invalid email or password');
      }
    } catch (err: any) {
      toast.error(err.message || 'Login failed. Please make sure the backend is running.');
    } finally {
      setIsLoading(false);
    }
  };

  // Trigger Simulated OTP Send
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone) {
      toast.error('Please enter your registered phone number');
      return;
    }
    
    setIsSendingOtp(true);
    // Simulate API delay
    setTimeout(() => {
      setIsSendingOtp(false);
      setShowOtpInput(true);
      toast.success('🔑 Simulated OTP "1234" sent to ' + phone);
    }, 1000);
  };

  // Submit Member Portal Login
  const handleMemberSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp) {
      toast.error('Please enter the verification OTP');
      return;
    }
    
    setIsLoading(true);
    try {
      const response = await api.auth.memberLogin({ phone, otp });
      if (response.success) {
        toast.success(`Welcome back, ${response.user.name}!`);
        onLogin(response.user);
      } else {
        toast.error('Invalid OTP code. Use "1234" for testing.');
      }
    } catch (err: any) {
      toast.error(err.message || 'Verification failed. Make sure phone matches a seeded member (e.g. +91 9876543210).');
    } finally {
      setIsLoading(false);
    }
  };

  // Submit Forgot Password
  const handleForgotSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setForgotSuccess(true);
      toast.success('Simulation: Password reset link sent to ' + forgotEmail);
    }, 1200);
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--background)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', position: 'relative', overflow: 'hidden' }}>
      {/* Background Image */}
      <div
        style={{
          position: 'absolute', inset: 0,
          backgroundImage: 'url(https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1920&h=1080&fit=crop&auto=format)',
          backgroundSize: 'cover', backgroundPosition: 'center',
          opacity: 0.18,
        }}
      />

      {/* Dark gradient overlay */}
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, rgba(0,0,0,0.95), rgba(0,0,0,0.85) 50%, rgba(120,53,15,0.2))' }} />

      {/* Ambient Orbs */}
      <div className="ambient-orb-1" style={{ position: 'absolute', top: '-120px', left: '-120px', width: '480px', height: '480px', background: 'radial-gradient(circle, rgba(251,191,36,0.12), transparent 70%)', borderRadius: '50%', pointerEvents: 'none' }} />
      <div className="ambient-orb-2" style={{ position: 'absolute', bottom: '-120px', right: '-120px', width: '480px', height: '480px', background: 'radial-gradient(circle, rgba(245,158,11,0.08), transparent 70%)', borderRadius: '50%', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', top: '30%', right: '15%', width: '200px', height: '200px', background: 'radial-gradient(circle, rgba(251,191,36,0.06), transparent 70%)', borderRadius: '50%', pointerEvents: 'none' }} />

      {/* Card */}
      <div className="animate-scale-in" style={{ position: 'relative', zIndex: 10, width: '100%', maxWidth: '420px' }}>
        <div style={{
          background: 'rgba(11,11,13,0.88)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          border: '1px solid var(--border)',
          borderRadius: '24px',
          padding: '36px',
          boxShadow: '0 0 0 1px rgba(251,191,36,0.04), 0 40px 80px rgba(0,0,0,0.7)',
        }}>
          
          {/* Logo & Branding */}
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <div style={{ display: 'inline-block', position: 'relative', marginBottom: '12px' }}>
              <div style={{ width: '52px', height: '52px', borderRadius: '14px', background: 'linear-gradient(135deg, #fbbf24, #f59e0b)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px', boxShadow: '0 8px 24px rgba(251,191,36,0.3)' }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="#000"><path d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
              </div>
              <h1 style={{ fontFamily: "'Syne', sans-serif", fontSize: '32px', fontWeight: 800, background: 'linear-gradient(90deg, #fbbf24, #fde68a, #f59e0b)', WebkitBackgroundClip: 'text', backgroundClip: 'text', WebkitTextFillColor: 'transparent', letterSpacing: '-0.02em', margin: 0 }}>TTZ Fitness</h1>
              <div style={{ height: '2px', background: 'linear-gradient(90deg, transparent, #fbbf24, transparent)', borderRadius: '99px', marginTop: '6px' }} />
            </div>
            <p style={{ color: 'var(--muted-foreground)', fontSize: '11px', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', margin: 0 }}>Fitness · Focus · Future</p>
          </div>

          {/* FORGOT PASSWORD FORM */}
          {showForgotForm ? (
            <div className="space-y-6">
              <div className="flex items-center gap-2 mb-2">
                <button
                  onClick={() => {
                    setShowForgotForm(false);
                    setForgotSuccess(false);
                  }}
                  className="text-zinc-500 hover:text-white p-1 hover:bg-zinc-950 rounded-lg transition"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <h3 className="text-white text-lg font-bold">Reset Password</h3>
              </div>

              {!forgotSuccess ? (
                <form onSubmit={handleForgotSubmit} className="space-y-5">
                  <p className="text-zinc-400 text-sm leading-relaxed">
                    Enter your registered email address below. We'll send you a secure link to reset your account password.
                  </p>
                  <div>
                    <label className="block text-zinc-300 text-xs font-semibold uppercase tracking-wider mb-2">
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                      <input
                        type="email"
                        value={forgotEmail}
                        onChange={(e) => setForgotEmail(e.target.value)}
                        className="w-full bg-zinc-900/40 border border-zinc-800 rounded-xl pl-12 pr-4 py-3.5 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:border-transparent transition-all"
                        placeholder="coach.rajesh@ttz.fitness"
                        required
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-gradient-to-r from-amber-400 to-yellow-500 text-black font-bold py-3.5 rounded-xl hover:from-amber-500 hover:to-yellow-600 transition-all duration-300 shadow-lg shadow-amber-500/10 hover:shadow-amber-500/20 disabled:opacity-50"
                  >
                    {isLoading ? 'Sending Link...' : 'Send Reset Link'}
                  </button>
                </form>
              ) : (
                <div className="text-center py-6 space-y-4">
                  <div className="w-16 h-16 bg-amber-400/10 rounded-full flex items-center justify-center mx-auto border border-amber-400/30">
                    <Mail className="w-8 h-8 text-amber-400" />
                  </div>
                  <h4 className="text-white font-bold text-lg">Check Your Inbox</h4>
                  <p className="text-zinc-400 text-sm leading-relaxed max-w-sm mx-auto">
                    We've sent a simulated password recovery email to <span className="text-amber-400 font-semibold">{forgotEmail}</span>. Click the link inside to set up a new password.
                  </p>
                  <button
                    onClick={() => {
                      setShowForgotForm(false);
                      setForgotSuccess(false);
                    }}
                    className="mt-4 px-6 py-2.5 bg-zinc-900 text-zinc-300 hover:text-white rounded-xl border border-zinc-800 transition"
                  >
                    Back to Login
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              {/* TAB SELECTORS */}
              <div className="grid grid-cols-2 gap-2 bg-zinc-900/60 p-1.5 rounded-2xl mb-7 border border-zinc-800/40">
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('staff');
                    setShowOtpInput(false);
                  }}
                  className={`py-3 text-xs font-bold uppercase tracking-wider rounded-xl transition-all duration-200 flex items-center justify-center gap-2 ${
                    activeTab === 'staff'
                      ? 'bg-amber-400 text-black shadow-md shadow-amber-500/15'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  <Shield className="w-4 h-4" />
                  Staff / Admin
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('member');
                  }}
                  className={`py-3 text-xs font-bold uppercase tracking-wider rounded-xl transition-all duration-200 flex items-center justify-center gap-2 ${
                    activeTab === 'member'
                      ? 'bg-amber-400 text-black shadow-md shadow-amber-500/15'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  <Users className="w-4 h-4" />
                  Member Portal
                </button>
              </div>

              {/* ADMIN / STAFF EMAIL & PASSWORD LOGIN */}
              {activeTab === 'staff' && (
                <form onSubmit={handleStaffSubmit} className="space-y-5">
                  <div>
                    <label className="block text-zinc-300 text-xs font-semibold uppercase tracking-wider mb-2">
                      Admin Email
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full bg-zinc-900/40 border border-zinc-800 rounded-xl pl-12 pr-4 py-3.5 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:border-transparent transition-all"
                        placeholder="admin@ttz.com"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-zinc-300 text-xs font-semibold uppercase tracking-wider mb-2 flex justify-between items-center">
                      <span>Password</span>
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                      <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full bg-zinc-900/40 border border-zinc-800 rounded-xl pl-12 pr-4 py-3.5 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:border-transparent transition-all"
                        placeholder="••••••••"
                        required
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs font-semibold mt-1">
                    <label className="flex items-center text-zinc-400 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        className="mr-2 rounded border-zinc-800 bg-zinc-900 text-amber-400 focus:ring-0 focus:ring-offset-0 w-4 h-4"
                      />
                      Remember me
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowForgotForm(true)}
                      className="text-amber-400 hover:text-amber-300 transition-all uppercase tracking-wider text-[10px]"
                    >
                      Forgot password?
                    </button>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-gradient-to-r from-amber-400 to-yellow-500 text-black font-bold py-3.5 rounded-xl hover:from-amber-500 hover:to-yellow-600 transition-all duration-300 shadow-lg shadow-amber-500/10 hover:shadow-amber-500/25 disabled:opacity-50"
                  >
                    {isLoading ? 'Signing In...' : 'Access Workspace'}
                  </button>
                </form>
              )}

              {/* MEMBER MOBILE OTP LOGIN */}
              {activeTab === 'member' && (
                <div className="space-y-5">
                  {!showOtpInput ? (
                    <form onSubmit={handleSendOtp} className="space-y-5">
                      <p className="text-zinc-400 text-xs leading-relaxed">
                        Enter your registered phone number to receive a secure OTP code via SMS. Use seeded numbers like <span className="text-amber-400 font-semibold">+91 9876543210</span>.
                      </p>
                      <div>
                        <label className="block text-zinc-300 text-xs font-semibold uppercase tracking-wider mb-2">
                          Phone Number
                        </label>
                        <div className="relative">
                          <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                          <input
                            type="tel"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            className="w-full bg-zinc-900/40 border border-zinc-800 rounded-xl pl-12 pr-4 py-3.5 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:border-transparent transition-all"
                            placeholder="+91 9876543210"
                            required
                          />
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={isSendingOtp}
                        className="w-full bg-gradient-to-r from-amber-400 to-yellow-500 text-black font-bold py-3.5 rounded-xl hover:from-amber-500 hover:to-yellow-600 transition-all duration-300 shadow-lg shadow-amber-500/10 hover:shadow-amber-500/25 disabled:opacity-50"
                      >
                        {isSendingOtp ? 'Sending OTP Code...' : 'Get OTP Code'}
                      </button>
                    </form>
                  ) : (
                    <form onSubmit={handleMemberSubmit} className="space-y-5">
                      <div className="flex items-center justify-between">
                        <p className="text-zinc-400 text-xs leading-relaxed">
                          Enter the 4-digit code sent to your phone. Use <span className="text-amber-400 font-bold">1234</span>.
                        </p>
                        <button
                          type="button"
                          onClick={() => setShowOtpInput(false)}
                          className="text-[10px] uppercase tracking-wider text-amber-400 font-bold hover:text-amber-300 transition"
                        >
                          Change Phone
                        </button>
                      </div>

                      <div>
                        <label className="block text-zinc-300 text-xs font-semibold uppercase tracking-wider mb-2">
                          OTP Verification Code
                        </label>
                        <div className="relative">
                          <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                          <input
                            type="text"
                            maxLength={4}
                            value={otp}
                            onChange={(e) => setOtp(e.target.value)}
                            className="w-full bg-zinc-900/40 border border-zinc-800 rounded-xl pl-12 pr-4 py-3.5 text-center text-xl font-bold tracking-[0.5em] text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:border-transparent transition-all"
                            placeholder="••••"
                            required
                          />
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-gradient-to-r from-amber-400 to-yellow-500 text-black font-bold py-3.5 rounded-xl hover:from-amber-500 hover:to-yellow-600 transition-all duration-300 shadow-lg shadow-amber-500/10 hover:shadow-amber-500/25 disabled:opacity-50"
                      >
                        {isLoading ? 'Verifying OTP...' : 'Verify & Enter Portal'}
                      </button>
                    </form>
                  )}
                </div>
              )}
            </>
          )}

          {/* Enhanced Enterprise Rexora Footer */}
          <div className="absolute bottom-6 w-full text-center pointer-events-none px-4">
            <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-[0.2em] mb-1">
              Engineered & Developed by <span className="text-zinc-500">Rexora</span>
            </p>
            <p className="text-[9px] font-medium text-zinc-700 tracking-wider">
              Founder & Lead Developer — Aditya Kittad
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}
