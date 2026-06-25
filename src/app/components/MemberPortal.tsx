import { useState, useEffect } from 'react';
import { 
  QrCode, 
  Calendar, 
  CreditCard, 
  CheckSquare, 
  Square, 
  LogOut, 
  TrendingUp, 
  Flame, 
  Download, 
  RefreshCw, 
  Award, 
  Activity, 
  CheckCircle2, 
  Clock, 
  ArrowRight,
  ShieldCheck
} from 'lucide-react';
import { api, User } from '../services/api';
import { toast } from 'sonner';

interface MemberPortalProps {
  user: User;
  onLogout: () => void;
}

export default function MemberPortal({ user, onLogout }: MemberPortalProps) {
  const [portalData, setPortalData] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'workouts' | 'diet' | 'payments' | 'attendance'>('workouts');
  const [isLoading, setIsLoading] = useState(true);
  const [completedExercises, setCompletedExercises] = useState<Record<string, boolean>>({});
  const [completedMeals, setCompletedMeals] = useState<Record<string, boolean>>({});
  const [showRenewalModal, setShowRenewalModal] = useState(false);
  
  // Renewal Form
  const [renewalPlan, setRenewalPlan] = useState('Monthly');
  const [renewalMethod, setRenewalMethod] = useState('UPI');

  const fetchPortalData = async () => {
    setIsLoading(true);
    try {
      // user.email contains phone number for member logins
      const data = await api.whatsapp.getLogs(); // just a sanity call
      const res = await api.members.getPortalData(user.email);
      setPortalData(res);
    } catch (err: any) {
      toast.error('Failed to load member portal data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPortalData();
  }, [user]);

  // Simulate Member Check-In using QR Code
  const handleQrCheckin = async () => {
    if (!portalData?.member) return;
    setIsLoading(true);
    try {
      // Find today's date in string format
      const today = new Date().toISOString().split('T')[0];
      
      // We will call the checkIn endpoint. First, get today's attendance sheet from server to find this member's row ID
      const todaySheet = await api.attendance.getToday();
      const myRecord = todaySheet.find(r => r.memberId === portalData.member.id);
      
      if (myRecord) {
        if (myRecord.status === 'present') {
          toast.warning('You are already checked in for today!');
        } else {
          await api.attendance.checkIn(myRecord.id);
          toast.success('🎉 Check-in successful! Welcome to TTZ.');
          fetchPortalData();
        }
      } else {
        // If no sheet record exists (e.g. member is expired or not registered today yet)
        toast.error('Could not find check-in sheet record for today.');
      }
    } catch (err) {
      toast.error('Check-in failed');
    } finally {
      setIsLoading(false);
    }
  };

  // Simulate membership renewal payment
  const handleRenewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!portalData?.member) return;

    let amount = 1200;
    if (renewalPlan === 'Quarterly') amount = 3000;
    if (renewalPlan === 'Annual') amount = 12000;

    setIsLoading(true);
    try {
      const res = await api.members.renew(portalData.member.id, {
        plan: renewalPlan,
        amount,
        method: renewalMethod
      });
      if (res.success) {
        toast.success(`🎉 Membership renewed successfully on the ${renewalPlan} plan!`);
        setShowRenewalModal(false);
        fetchPortalData();
      }
    } catch (err) {
      toast.error('Renewal failed');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleExercise = (exKey: string) => {
    setCompletedExercises(prev => ({ ...prev, [exKey]: !prev[exKey] }));
  };

  const toggleMeal = (mealKey: string) => {
    setCompletedMeals(prev => ({ ...prev, [mealKey]: !prev[mealKey] }));
  };

  // Calculate consistency percentage (present days / total tracked days)
  const getConsistency = () => {
    if (!portalData?.attendance || portalData.attendance.length === 0) return 0;
    const present = portalData.attendance.filter((a: any) => a.status === 'present').length;
    return Math.round((present / portalData.attendance.length) * 100);
  };

  if (isLoading && !portalData) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center flex-col gap-3">
        <RefreshCw className="w-8 h-8 text-amber-400 animate-spin" />
        <p className="text-zinc-500 text-sm">Loading Premium Member Workspace...</p>
      </div>
    );
  }

  const member = portalData?.member;
  const workout = portalData?.workout;
  const diet = portalData?.diet;
  const payments = portalData?.payments || [];
  const attendance = portalData?.attendance || [];
  const trainer = portalData?.trainer;

  // HSL Status Colors
  let daysStatusColor = 'from-emerald-400 to-teal-500';
  let daysBadgeBorder = 'border-emerald-500/20';
  let daysProgressPct = 100;
  if (member) {
    if (member.status === 'expired') {
      daysStatusColor = 'from-rose-500 to-red-600';
      daysBadgeBorder = 'border-rose-500/20';
      daysProgressPct = 0;
    } else if (member.status === 'expiring') {
      daysStatusColor = 'from-amber-400 to-yellow-500';
      daysBadgeBorder = 'border-amber-500/20';
      daysProgressPct = (member.daysRemaining / 15) * 100;
    } else {
      daysProgressPct = Math.min((member.daysRemaining / 365) * 100, 100);
    }
  }

  return (
    <div className="min-h-screen bg-black text-zinc-200 antialiased font-sans flex flex-col">
      
      {/* Portal Top Bar */}
      <header style={{
        background: 'rgba(9,9,11,0.95)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid var(--border)',
        height: '60px',
        padding: '0 24px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        position: 'sticky',
        top: 0,
        zIndex: 10,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '34px', height: '34px', borderRadius: '10px', background: 'linear-gradient(135deg, #fbbf24, #f59e0b)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 12px rgba(251,191,36,0.25)' }}>
            <span style={{ color: '#000', fontWeight: 800, fontSize: '12px' }}>TZ</span>
          </div>
          <div>
            <h1 style={{ fontFamily: "'Syne', sans-serif", color: 'var(--foreground)', fontWeight: 800, fontSize: '14px', letterSpacing: '-0.01em', margin: 0, lineHeight: 1.2 }}>Transformation Zone</h1>
            <p style={{ color: 'var(--muted-foreground)', fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.15em', margin: 0 }}>Member Lounge</p>
          </div>
        </div>

        <button
          onClick={onLogout}
          style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', borderRadius: '10px', background: 'var(--card)', border: '1px solid var(--border)', color: 'var(--muted-foreground)', fontSize: '12px', fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s ease' }}
          onMouseEnter={e => { e.currentTarget.style.color = '#f87171'; e.currentTarget.style.borderColor = 'rgba(248,113,113,0.3)'; }}
          onMouseLeave={e => { e.currentTarget.style.color = '#71717a'; e.currentTarget.style.borderColor = 'rgba(39,39,42,0.7)'; }}
        >
          <LogOut style={{ width: 13, height: 13 }} />
          <span>Logout</span>
        </button>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-5xl mx-auto p-4 sm:p-6 w-full space-y-6">
        
        {/* Welcome Block */}
        <div className="animate-fade-up" style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px' }}>
          <div>
            <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: '24px', fontWeight: 800, color: 'var(--foreground)', letterSpacing: '-0.02em', margin: 0, marginBottom: '6px' }}>
              Welcome back, <span style={{ color: '#fbbf24' }}>{member?.name || 'Athlete'}</span>!
            </h2>
            <p style={{ color: 'var(--muted-foreground)', fontSize: '13px', margin: 0 }}>Power through your workouts and hit your nutrition targets today.</p>
          </div>
          
          <button
            onClick={() => setShowRenewalModal(true)}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '9px 18px', borderRadius: '12px', background: 'linear-gradient(135deg, #fbbf24, #f59e0b)', border: 'none', color: '#000', fontSize: '12px', fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 16px rgba(251,191,36,0.25)', transition: 'all 0.2s ease' }}
            onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 8px 24px rgba(251,191,36,0.4)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
            onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 4px 16px rgba(251,191,36,0.25)'; e.currentTarget.style.transform = 'translateY(0)'; }}
          >
            <CreditCard style={{ width: 13, height: 13 }} /> Renew Membership
          </button>
        </div>

        {/* TOP METRICS GRID */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Card 1: Days Remaining Widget */}
          <div className="bg-zinc-950/70 border border-zinc-800/80 rounded-3xl p-5 flex items-center gap-5 relative overflow-hidden shadow-sm">
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-amber-400/5 to-transparent rounded-bl-full pointer-events-none" />
            <div className="relative w-16 h-16 flex items-center justify-center bg-zinc-900 border border-zinc-850 rounded-full">
              <TrendingUp className="w-7 h-7 text-amber-400" />
            </div>
            <div>
              <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-wider">Days Remaining</p>
              <h3 className="text-3xl font-black text-white mt-1">
                {member?.daysRemaining !== undefined && member.daysRemaining >= 0 ? member.daysRemaining : 0}
              </h3>
              <p className="text-[11px] text-zinc-400 mt-0.5">
                Expires on <span className="text-amber-400 font-semibold">{member?.expiryDate}</span>
              </p>
            </div>
          </div>

          {/* Card 2: Interactive Check-in QR Simulator */}
          <button
            onClick={handleQrCheckin}
            className="bg-zinc-950/70 hover:bg-zinc-900/60 border border-zinc-800 hover:border-amber-400/50 rounded-3xl p-5 flex items-center gap-5 text-left transition group relative shadow-sm"
          >
            <div className="relative w-16 h-16 flex items-center justify-center bg-zinc-900 border border-zinc-850 rounded-full group-hover:bg-amber-400 group-hover:text-black transition duration-300">
              <QrCode className="w-8 h-8 text-amber-400 group-hover:text-black" />
            </div>
            <div>
              <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-wider">Front Desk Check-in</p>
              <h3 className="text-lg font-bold text-white mt-1 group-hover:text-amber-400 transition">
                Tap to Scan QR
              </h3>
              <p className="text-[11px] text-zinc-400 mt-0.5">Simulate check-in barcode scanner</p>
            </div>
            <ArrowRight className="w-5 h-5 text-zinc-600 group-hover:text-amber-400 absolute right-5 top-1/2 -translate-y-1/2 transition group-hover:translate-x-1" />
          </button>

          {/* Card 3: Trainer Info */}
          <div className="bg-zinc-950/70 border border-zinc-800/80 rounded-3xl p-5 flex items-center gap-5 relative shadow-sm">
            <div className="relative w-16 h-16 flex items-center justify-center bg-zinc-900 border border-zinc-850 rounded-full">
              <Award className="w-8 h-8 text-amber-400" />
            </div>
            <div>
              <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-wider">Assigned Coach</p>
              <h3 className="text-sm font-bold text-white mt-1">
                {trainer ? trainer.name : 'Unassigned'}
              </h3>
              <p className="text-[11px] text-zinc-400 mt-0.5 truncate max-w-[170px]">
                {trainer ? trainer.specialty : 'Focus on general fitness'}
              </p>
            </div>
          </div>

        </div>

        {/* WORKSPACE TAB CONTROLLERS */}
        <div className="flex border-b border-zinc-800/80 pb-0">
          <button
            onClick={() => setActiveTab('workouts')}
            className={`px-5 py-3.5 text-xs font-bold uppercase tracking-wider border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'workouts'
                ? 'border-amber-400 text-amber-400'
                : 'border-transparent text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <Activity className="w-4 h-4" /> Workouts
          </button>
          <button
            onClick={() => setActiveTab('diet')}
            className={`px-5 py-3.5 text-xs font-bold uppercase tracking-wider border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'diet'
                ? 'border-amber-400 text-amber-400'
                : 'border-transparent text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <ShieldCheck className="w-4 h-4" /> Nutrition
          </button>
          <button
            onClick={() => setActiveTab('payments')}
            className={`px-5 py-3.5 text-xs font-bold uppercase tracking-wider border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'payments'
                ? 'border-amber-400 text-amber-400'
                : 'border-transparent text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <CreditCard className="w-4 h-4" /> Payments
          </button>
          <button
            onClick={() => setActiveTab('attendance')}
            className={`px-5 py-3.5 text-xs font-bold uppercase tracking-wider border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'attendance'
                ? 'border-amber-400 text-amber-400'
                : 'border-transparent text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <Calendar className="w-4 h-4" /> Attendance
          </button>
        </div>

        {/* WORKSPACE CONTENT AREA */}
        <div className="bg-zinc-950/70 border border-zinc-800/80 rounded-3xl p-6 min-h-[300px]">
          
          {/* WORKOUTS TAB */}
          {activeTab === 'workouts' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-white font-bold text-lg">{workout ? workout.title : 'General Conditioning Routine'}</h3>
                  <p className="text-zinc-500 text-xs mt-0.5">Check off exercises as you finish your workout set.</p>
                </div>
                <div className="flex items-center gap-1 bg-amber-400/10 text-amber-400 border border-amber-400/20 px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                  <Flame className="w-3.5 h-3.5 animate-pulse" /> Active split
                </div>
              </div>

              {workout && workout.schedule ? (
                <div className="space-y-6">
                  {Object.entries(workout.schedule).map(([day, exercises]: [string, any]) => (
                    <div key={day} className="bg-zinc-900/30 border border-zinc-800/60 rounded-2xl p-5 space-y-3">
                      <span className="text-amber-400 font-extrabold text-xs uppercase tracking-widest">{day}</span>
                      <div className="space-y-2 mt-2">
                        {exercises.map((ex: any, idx: number) => {
                          const key = `${day}-${idx}`;
                          const isDone = completedExercises[key];
                          return (
                            <button
                              key={idx}
                              onClick={() => toggleExercise(key)}
                              className={`w-full flex items-start gap-4 p-3.5 rounded-xl border text-left transition duration-150 ${
                                isDone
                                  ? 'bg-zinc-950/40 border-zinc-900 text-zinc-500 line-through'
                                  : 'bg-zinc-900/60 border-zinc-850 text-zinc-200 hover:border-zinc-700'
                              }`}
                            >
                              <div className="mt-0.5">
                                {isDone ? (
                                  <CheckSquare className="w-5 h-5 text-amber-400" />
                                ) : (
                                  <Square className="w-5 h-5 text-zinc-600" />
                                )}
                              </div>
                              <div className="flex-1">
                                <span className="font-bold text-sm block">{ex.name}</span>
                                <span className={`text-[11px] block mt-0.5 ${isDone ? 'text-zinc-600' : 'text-zinc-400'}`}>
                                  {ex.sets} sets x {ex.reps} reps
                                </span>
                                {ex.notes && (
                                  <p className={`text-[10px] mt-1 italic ${isDone ? 'text-zinc-700' : 'text-zinc-500'}`}>
                                    Notes: {ex.notes}
                                  </p>
                                )}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 bg-zinc-900/10 rounded-2xl border border-dashed border-zinc-800">
                  <Activity className="w-10 h-10 text-zinc-750 mx-auto mb-2" />
                  <p className="text-zinc-500 text-sm font-semibold">No assigned workout split.</p>
                  <p className="text-zinc-600 text-xs mt-1">Contact your assigned coach {trainer?.name} to write your plan.</p>
                </div>
              )}
            </div>
          )}

          {/* DIET TAB */}
          {activeTab === 'diet' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-white font-bold text-lg">{diet ? diet.title : 'Balanced Fitness Nutrition Plan'}</h3>
                <p className="text-zinc-500 text-xs mt-0.5">Check off meals to track your nutrition adherence.</p>
              </div>

              {diet && diet.schedule ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(diet.schedule).map(([meal, details]: [string, any]) => {
                    const isDone = completedMeals[meal];
                    return (
                      <div
                        key={meal}
                        onClick={() => toggleMeal(meal)}
                        className={`border rounded-2xl p-5 cursor-pointer transition duration-150 relative ${
                          isDone
                            ? 'bg-zinc-950/40 border-zinc-900 text-zinc-500'
                            : 'bg-zinc-900/40 border-zinc-850 hover:border-zinc-700 text-zinc-200'
                        }`}
                      >
                        <div className="flex justify-between items-start gap-4 mb-2">
                          <span className={`text-xs font-bold uppercase tracking-wider ${isDone ? 'text-zinc-600' : 'text-amber-400'}`}>
                            {meal}
                          </span>
                          {isDone ? (
                            <CheckSquare className="w-5 h-5 text-amber-400" />
                          ) : (
                            <Square className="w-5 h-5 text-zinc-750" />
                          )}
                        </div>
                        <p className={`text-xs leading-relaxed mt-2 ${isDone ? 'text-zinc-600 line-through' : 'text-zinc-300'}`}>
                          {details || 'Not specified'}
                        </p>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12 bg-zinc-900/10 rounded-2xl border border-dashed border-zinc-800">
                  <CheckSquare className="w-10 h-10 text-zinc-750 mx-auto mb-2" />
                  <p className="text-zinc-500 text-sm font-semibold">No assigned nutrition plan.</p>
                  <p className="text-zinc-600 text-xs mt-1">Contact your trainer to prescribe a custom macronutrient schedule.</p>
                </div>
              )}
            </div>
          )}

          {/* PAYMENTS TAB */}
          {activeTab === 'payments' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center pb-4 border-b border-zinc-850">
                <div>
                  <h3 className="text-white font-bold text-lg">Transaction receipts</h3>
                  <p className="text-zinc-500 text-xs mt-0.5">Download details for billing records.</p>
                </div>
              </div>

              {payments.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-zinc-850 text-zinc-500 text-xs font-bold uppercase tracking-wider">
                        <th className="py-3 px-4">Receipt ID</th>
                        <th className="py-3 px-4">Plan</th>
                        <th className="py-3 px-4">Payment Date</th>
                        <th className="py-3 px-4">Amount</th>
                        <th className="py-3 px-4">Method</th>
                        <th className="py-3 px-4 text-center">Receipt</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-850 text-sm">
                      {payments.map((p: any) => (
                        <tr key={p.id} className="hover:bg-zinc-900/30">
                          <td className="py-3 px-4 font-mono text-zinc-400">#TTZ-PAY-{p.id}</td>
                          <td className="py-3 px-4 text-white font-semibold">{p.plan}</td>
                          <td className="py-3 px-4 text-zinc-400">{p.date}</td>
                          <td className="py-3 px-4 text-amber-400 font-bold">₹{p.amount.toLocaleString()}</td>
                          <td className="py-3 px-4 text-zinc-400">{p.method}</td>
                          <td className="py-3 px-4 text-center">
                            <button
                              onClick={() => toast.success(`Simulating download of receipt #TTZ-PAY-${p.id}`)}
                              className="text-amber-400 hover:text-amber-300 p-1 hover:bg-zinc-900 rounded transition"
                              title="Download PDF"
                            >
                              <Download className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-zinc-500 text-xs">No billing logs found.</p>
                </div>
              )}
            </div>
          )}

          {/* ATTENDANCE TAB */}
          {activeTab === 'attendance' && (
            <div className="space-y-6">
              
              {/* Consistency stats */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-zinc-900/40 border border-zinc-850 rounded-2xl p-5 flex items-center justify-between">
                  <div>
                    <h4 className="text-zinc-500 text-xs font-bold uppercase tracking-wider">Attendance Rate</h4>
                    <span className="text-3xl font-black text-white mt-1 block">{getConsistency()}%</span>
                  </div>
                  <div className="w-12 h-12 bg-amber-400/10 text-amber-400 rounded-xl flex items-center justify-center border border-amber-400/20 font-extrabold text-sm">
                    {getConsistency() > 70 ? 'A+' : 'B'}
                  </div>
                </div>

                <div className="bg-zinc-900/40 border border-zinc-850 rounded-2xl p-5 flex items-center justify-between">
                  <div>
                    <h4 className="text-zinc-500 text-xs font-bold uppercase tracking-wider">Workout Streak</h4>
                    <span className="text-3xl font-black text-white mt-1 block flex items-center gap-1">
                      3 Days <Flame className="w-6 h-6 text-amber-400 fill-amber-400 animate-pulse" />
                    </span>
                  </div>
                  <p className="text-zinc-400 text-xs text-right leading-relaxed">
                    Keep checking in to grow your fitness streak flame!
                  </p>
                </div>
              </div>

              <div>
                <h4 className="text-white font-bold text-sm mb-3">Logs History</h4>
                {attendance.length > 0 ? (
                  <div className="space-y-2">
                    {attendance.map((a: any) => (
                      <div
                        key={a.id}
                        className="bg-zinc-900/30 border border-zinc-850 rounded-xl p-3.5 flex justify-between items-center"
                      >
                        <div className="flex items-center gap-2.5">
                          <div className={`w-2.5 h-2.5 rounded-full ${a.status === 'present' ? 'bg-emerald-400' : 'bg-zinc-700'}`} />
                          <span className="text-zinc-200 text-xs font-bold">{a.date}</span>
                        </div>
                        <div className="text-right">
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded ${
                            a.status === 'present' 
                              ? 'bg-emerald-950/40 text-emerald-400' 
                              : 'bg-zinc-900 text-zinc-500'
                          }`}>
                            {a.status === 'present' ? 'Present' : 'Absent'}
                          </span>
                          <span className="text-zinc-500 text-[11px] block mt-0.5 font-mono">
                            Check-in: {a.checkInTime}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-zinc-500 text-xs">No attendance calendar entries found.</p>
                )}
              </div>

            </div>
          )}

        </div>

      </main>

      {/* RENEWAL GATEWAY MODAL */}
      {showRenewalModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-6 w-full max-w-md shadow-2xl relative">
            <h3 className="text-white font-extrabold text-lg flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-amber-400" /> TTZ Checkout Gateway
            </h3>
            <p className="text-zinc-500 text-xs mt-1">Select a membership package below to process renewal simulation.</p>

            <form onSubmit={handleRenewSubmit} className="space-y-5 mt-5">
              
              {/* Plan Choice */}
              <div>
                <label className="block text-zinc-400 text-xs font-bold uppercase tracking-wider mb-2">
                  Membership Package
                </label>
                <div className="grid grid-cols-1 gap-2">
                  {[
                    { id: 'Monthly', name: 'Monthly Plan', price: '₹1,200/mo' },
                    { id: 'Quarterly', name: 'Quarterly Plan', price: '₹3,000 (Save 17%)' },
                    { id: 'Annual', name: 'Annual Plan', price: '₹12,000 (Save 17% + Premium Locker)' }
                  ].map((p) => (
                    <label
                      key={p.id}
                      className={`flex justify-between items-center p-3.5 border rounded-xl cursor-pointer transition ${
                        renewalPlan === p.id
                          ? 'border-amber-400 bg-amber-400/5 text-white'
                          : 'border-zinc-800 bg-zinc-900/30 text-zinc-400 hover:bg-zinc-900/60'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <input
                          type="radio"
                          name="renewal-plan"
                          checked={renewalPlan === p.id}
                          onChange={() => setRenewalPlan(p.id)}
                          className="accent-amber-400 w-4 h-4"
                        />
                        <span className="font-bold text-xs uppercase tracking-wider">{p.name}</span>
                      </div>
                      <span className="text-amber-400 font-bold text-xs">{p.price}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Payment Method */}
              <div>
                <label className="block text-zinc-400 text-xs font-bold uppercase tracking-wider mb-2">
                  Payment Mode
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {['UPI', 'Card', 'Cash'].map((method) => (
                    <button
                      key={method}
                      type="button"
                      onClick={() => setRenewalMethod(method)}
                      className={`py-2 text-xs font-bold uppercase tracking-wider border rounded-lg transition ${
                        renewalMethod === method
                          ? 'border-amber-400 bg-amber-400/5 text-amber-400'
                          : 'border-zinc-800 bg-zinc-900/30 text-zinc-500 hover:text-zinc-300'
                      }`}
                    >
                      {method}
                    </button>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-3 pt-3 border-t border-zinc-850">
                <button
                  type="button"
                  onClick={() => setShowRenewalModal(false)}
                  className="py-3 bg-zinc-900 border border-zinc-800 hover:bg-zinc-850 text-zinc-300 font-bold rounded-xl text-xs uppercase tracking-wider transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="py-3 bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-500 hover:to-yellow-600 text-black font-bold rounded-xl text-xs uppercase tracking-wider transition shadow-md shadow-amber-500/10"
                >
                  {isLoading ? 'Processing...' : 'Complete Payment'}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="py-6 border-t border-zinc-850 bg-zinc-950/30 text-center mt-auto">
        <p className="text-[10px] text-zinc-500 tracking-widest uppercase">The Transformation Zone (TTZ)</p>
        <p className="text-[9px] text-zinc-650 mt-1">Premium Black & Yellow Unisex Fitness Lounge</p>
      </footer>

    </div>
  );
}
