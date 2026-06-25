import { useState, useEffect } from 'react';
import { Dumbbell, Phone, Mail, Users, Calendar, Plus, Edit, Trash2, X, Star, Sparkles, Clock, Check } from 'lucide-react';
import { api, Trainer, Member } from '../services/api';
import { useStore } from '../store/useStore';
import { toast } from 'sonner';

export default function Trainers() {
  const trainers = useStore(state => state.trainers);
  const members = useStore(state => state.members);
  const isLoading = useStore(state => state.loading);

  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedTrainer, setSelectedTrainer] = useState<Trainer | null>(null);
  const [showMembersModal, setShowMembersModal] = useState(false);
  const [activeTrainerMembers, setActiveTrainerMembers] = useState<Member[]>([]);

  // Form states
  const [name, setName] = useState('');
  const [specialty, setSpecialty] = useState('Strength Training');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [experience, setExperience] = useState('5 Years');
  const [availability, setAvailability] = useState('Mon-Sat, 6 AM - 2 PM');
  const [assignedMembers, setAssignedMembers] = useState(0);

  // Data is loaded globally via useStore

  // Open Add Modal
  const openAdd = () => {
    setName('');
    setSpecialty('Strength Training');
    setPhone('');
    setEmail('');
    setExperience('5 Years');
    setAvailability('Mon-Sat, 6 AM - 2 PM');
    setAssignedMembers(0);
    setShowAddModal(true);
  };

  // Submit Add Trainer
  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !specialty || !phone || !email) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      await api.trainers.create({
        name,
        specialty,
        phone,
        email,
        experience,
        availability,
        assignedMembers
      });
      toast.success(`${name} registered successfully!`);
      setShowAddModal(false);
      // Store automatically updates
    } catch (err) {
      toast.error('Failed to add new trainer');
    }
  };

  // Open Edit Modal
  const openEdit = (trainer: Trainer) => {
    setSelectedTrainer(trainer);
    setName(trainer.name);
    setSpecialty(trainer.specialty);
    setPhone(trainer.phone);
    setEmail(trainer.email);
    setExperience(trainer.experience);
    setAvailability(trainer.availability);
    setAssignedMembers(trainer.assignedMembers);
    setShowEditModal(true);
  };

  // Submit Edit Trainer
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTrainer) return;

    try {
      await api.trainers.update(selectedTrainer.id, {
        name,
        specialty,
        phone,
        email,
        experience,
        availability,
        assignedMembers
      });
      toast.success(`Trainer profile updated successfully`);
      setShowEditModal(false);
      // Store automatically updates
    } catch (err) {
      toast.error('Failed to update trainer details');
    }
  };

  // Delete Trainer
  const handleDelete = async (id: number, name: string) => {
    if (window.confirm(`Are you sure you want to remove ${name} from trainers?`)) {
      try {
        await api.trainers.delete(id);
        toast.success(`Trainer removed successfully`);
        // Store automatically updates
      } catch (err) {
        toast.error('Failed to delete trainer');
      }
    }
  };

  const openAssignedMembersList = (trainer: Trainer) => {
    // Filter members assigned to this trainer ID
    const list = members.filter(m => m.trainerId === trainer.id);
    setSelectedTrainer(trainer);
    setActiveTrainerMembers(list);
    setShowMembersModal(true);
  };

  // Simulated rating score generator based on trainer ID
  const getRating = (id: number) => {
    const ratings: Record<number, number> = {
      1: 4.9,
      2: 4.8,
      3: 4.7,
      4: 4.9
    };
    return ratings[id] || 4.6;
  };

  return (
    <div className="page-container" style={{ padding: '28px', maxWidth: '1400px', margin: '0 auto' }}>
      
      {/* Header */}
      <div className="animate-fade-up" style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px', marginBottom: '24px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
            <h1 style={{ fontFamily: "'Syne', sans-serif", fontSize: '26px', fontWeight: 800, color: 'var(--foreground)', letterSpacing: '-0.03em', margin: 0 }}>Coaching Team</h1>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '3px 10px', borderRadius: '20px', background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.2)', fontSize: '10px', fontWeight: 700, color: '#fbbf24', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              <Sparkles style={{ width: 9, height: 9 }} /> Elite Coaches
            </span>
          </div>
          <p style={{ color: 'var(--muted-foreground)', fontSize: '13px', margin: 0 }}>Manage trainer profiles, specialty tags, client rosters, and ratings.</p>
        </div>
        <button
          onClick={openAdd}
          style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', borderRadius: '12px', background: 'linear-gradient(135deg, #fbbf24, #f59e0b)', border: 'none', color: '#000', fontSize: '13px', fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 16px rgba(251,191,36,0.25)', transition: 'all 0.2s ease' }}
          onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 8px 24px rgba(251,191,36,0.4)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
          onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 4px 16px rgba(251,191,36,0.25)'; e.currentTarget.style.transform = 'translateY(0)'; }}
        >
          <Plus style={{ width: 16, height: 16 }} /> Add Trainer
        </button>
      </div>

      {/* Overview Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        
        <div className="bg-zinc-950/70 border border-zinc-800/80 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3.5">
            <div className="w-10 h-10 bg-amber-400/10 rounded-xl flex items-center justify-center border border-amber-400/10">
              <Dumbbell className="w-5.5 h-5.5 text-amber-400" />
            </div>
            <span className="text-[10px] text-zinc-500 font-mono uppercase font-bold">Roster</span>
          </div>
          <p className="text-zinc-500 text-xs font-semibold uppercase tracking-wider mb-0.5">Total Coaches</p>
          <p className="text-white text-2xl font-black font-mono">{isLoading ? '...' : trainers.length}</p>
        </div>

        <div className="bg-zinc-950/70 border border-zinc-800/80 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3.5">
            <div className="w-10 h-10 bg-green-400/10 rounded-xl flex items-center justify-center border border-green-500/10">
              <Users className="w-5.5 h-5.5 text-green-400" />
            </div>
            <span className="text-[10px] text-zinc-500 font-mono uppercase font-bold">Assigned</span>
          </div>
          <p className="text-zinc-500 text-xs font-semibold uppercase tracking-wider mb-0.5">Assigned Members</p>
          <p className="text-green-400 text-2xl font-black font-mono">
            {isLoading ? '...' : members.filter(m => m.trainerId).length}
          </p>
        </div>

        <div className="bg-zinc-950/70 border border-zinc-800/80 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3.5">
            <div className="w-10 h-10 bg-blue-400/10 rounded-xl flex items-center justify-center border border-blue-500/10">
              <Calendar className="w-5.5 h-5.5 text-blue-400" />
            </div>
            <span className="text-[10px] text-zinc-500 font-mono uppercase font-bold">Shift</span>
          </div>
          <p className="text-zinc-500 text-xs font-semibold uppercase tracking-wider mb-0.5">Active Shifts Today</p>
          <p className="text-blue-400 text-2xl font-black font-mono">{isLoading ? '...' : trainers.length}</p>
        </div>

        <div className="bg-zinc-950/70 border border-zinc-800/80 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3.5">
            <div className="w-10 h-10 bg-amber-400/10 rounded-xl flex items-center justify-center border border-amber-400/10">
              <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
            </div>
            <span className="text-[10px] text-zinc-500 font-mono uppercase font-bold">Rating</span>
          </div>
          <p className="text-zinc-500 text-xs font-semibold uppercase tracking-wider mb-0.5">Avg Coach Rating</p>
          <p className="text-amber-400 text-2xl font-black font-mono">4.9 / 5.0</p>
        </div>

      </div>

      {/* Trainers Cards Grid */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-amber-400"></div>
          <p className="text-zinc-500 font-mono text-xs">Loading coach sheets...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {trainers.map((trainer) => {
            const countAssigned = members.filter(m => m.trainerId === trainer.id).length;
            const rating = getRating(trainer.id);
            return (
              <div key={trainer.id} className="bg-zinc-950/70 border border-zinc-800/80 rounded-3xl p-6 hover:border-amber-400/30 transition-all flex flex-col justify-between shadow-sm relative group">
                
                <div>
                  {/* Card Header */}
                  <div className="flex items-start justify-between mb-5">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 bg-gradient-to-br from-amber-400 to-yellow-500 rounded-full flex items-center justify-center shadow font-black text-black text-lg">
                        {trainer.name.substring(6, 8).toUpperCase() || 'CO'}
                      </div>
                      <div>
                        <h3 className="text-white text-lg font-bold tracking-tight">{trainer.name}</h3>
                        <span className="inline-block mt-0.5 bg-amber-400/10 text-amber-400 text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wider border border-amber-400/20">
                          {trainer.specialty}
                        </span>
                      </div>
                    </div>
                    
                    {/* Action buttons */}
                    <div className="flex items-center gap-1.5 opacity-60 group-hover:opacity-100 transition">
                      <button
                        onClick={() => openEdit(trainer)}
                        className="p-1.5 text-zinc-400 hover:text-blue-400 transition"
                        title="Edit profile"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(trainer.id, trainer.name)}
                        className="p-1.5 text-zinc-400 hover:text-red-400 transition"
                        title="Delete profile"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Rating Meter & Performance slider */}
                  <div className="bg-zinc-900/30 border border-zinc-850 rounded-2xl p-4.5 mb-5 flex items-center justify-between">
                    <div>
                      <span className="text-zinc-500 text-[10px] font-bold uppercase tracking-wider block">Trainer Rating</span>
                      <div className="flex items-center gap-1 mt-1">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star key={s} className="w-4 h-4 text-amber-400 fill-amber-400" />
                        ))}
                        <span className="text-white text-xs font-bold font-mono ml-1.5">{rating}</span>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <span className="text-zinc-500 text-[10px] font-bold uppercase tracking-wider block">Assigned Clients</span>
                      <button
                        onClick={() => openAssignedMembersList(trainer)}
                        className="text-amber-400 hover:underline font-bold text-xs mt-1 block flex items-center gap-1"
                      >
                        <Users className="w-3.5 h-3.5" /> {countAssigned} Members
                      </button>
                    </div>
                  </div>

                  {/* Info table details */}
                  <div className="space-y-3 mb-6 p-4 bg-zinc-900/40 rounded-2xl border border-zinc-850 font-mono text-xs">
                    <div className="flex justify-between">
                      <span className="text-zinc-500 uppercase font-bold tracking-wider">Experience</span>
                      <span className="text-white font-bold">{trainer.experience}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-500 uppercase font-bold tracking-wider">Availability</span>
                      <span className="text-white font-bold font-sans">{trainer.availability}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-500 uppercase font-bold tracking-wider">Phone</span>
                      <span className="text-zinc-300 font-bold">{trainer.phone}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-500 uppercase font-bold tracking-wider">Email</span>
                      <span className="text-zinc-300 font-bold font-sans">{trainer.email}</span>
                    </div>
                  </div>
                </div>

                {/* Card buttons */}
                <div className="flex gap-2 pt-2 border-t border-zinc-850">
                  <button
                    onClick={() => openAssignedMembersList(trainer)}
                    className="flex-1 bg-amber-400 hover:bg-amber-500 text-black font-bold py-2.5 rounded-xl text-xs uppercase tracking-wider transition shadow-md shadow-amber-500/10"
                  >
                    View Roster
                  </button>
                  <button
                    onClick={() => openEdit(trainer)}
                    className="flex-1 bg-zinc-900 border border-zinc-800 hover:bg-zinc-850 text-zinc-300 font-bold py-2.5 rounded-xl text-xs uppercase tracking-wider transition"
                  >
                    Edit Profile
                  </button>
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* --- ADD TRAINER MODAL --- */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-zinc-950 border border-zinc-800 w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl flex flex-col">
            <div className="p-6 border-b border-zinc-850 flex items-center justify-between">
              <h2 className="text-white text-lg font-bold flex items-center gap-2">
                <Plus className="w-5 h-5 text-amber-400" /> Add New Trainer
              </h2>
              <button onClick={() => setShowAddModal(false)} className="text-zinc-500 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleAddSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-zinc-400 text-xs font-bold uppercase tracking-wider mb-2">Trainer Full Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Coach Rajesh Patil"
                  className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-amber-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-zinc-400 text-xs font-bold uppercase tracking-wider mb-2">Specialty</label>
                  <select
                    value={specialty}
                    onChange={(e) => setSpecialty(e.target.value)}
                    className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-amber-400"
                  >
                    <option value="Strength Training">Strength Training</option>
                    <option value="Cardio & Weight Loss">Cardio & Weight Loss</option>
                    <option value="CrossFit & HIIT">CrossFit & HIIT</option>
                    <option value="Yoga & Flexibility">Yoga & Flexibility</option>
                  </select>
                </div>
                <div>
                  <label className="block text-zinc-400 text-xs font-bold uppercase tracking-wider mb-2">Experience Length</label>
                  <input
                    type="text"
                    required
                    value={experience}
                    onChange={(e) => setExperience(e.target.value)}
                    placeholder="8 Years"
                    className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-amber-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-zinc-400 text-xs font-bold uppercase tracking-wider mb-2">Phone</label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 9876543220"
                    className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white font-mono focus:outline-none focus:ring-1 focus:ring-amber-400"
                  />
                </div>
                <div>
                  <label className="block text-zinc-400 text-xs font-bold uppercase tracking-wider mb-2">Email</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="rajesh@ttz.fitness"
                    className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-amber-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-zinc-400 text-xs font-bold uppercase tracking-wider mb-2">Weekly Shift Availability</label>
                <input
                  type="text"
                  required
                  value={availability}
                  onChange={(e) => setAvailability(e.target.value)}
                  placeholder="Mon-Sat, 6 AM - 2 PM"
                  className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-amber-400"
                />
              </div>

              <div className="pt-4 border-t border-zinc-850 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4.5 py-2.5 bg-zinc-900 border border-zinc-800 text-zinc-300 font-bold rounded-xl text-xs uppercase tracking-wider hover:bg-zinc-850 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-amber-400 text-black font-bold rounded-xl text-xs uppercase tracking-wider hover:bg-amber-500 transition shadow-lg shadow-amber-500/10"
                >
                  Save Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- EDIT TRAINER MODAL --- */}
      {showEditModal && selectedTrainer && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-zinc-950 border border-zinc-800 w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl flex flex-col">
            <div className="p-6 border-b border-zinc-850 flex items-center justify-between">
              <h2 className="text-white text-lg font-bold flex items-center gap-2">
                <Edit className="w-5 h-5 text-blue-400" /> Edit Trainer Profile
              </h2>
              <button onClick={() => setShowEditModal(false)} className="text-zinc-500 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleEditSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-zinc-400 text-xs font-bold uppercase tracking-wider mb-2">Trainer Full Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-amber-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-zinc-400 text-xs font-bold uppercase tracking-wider mb-2">Specialty</label>
                  <select
                    value={specialty}
                    onChange={(e) => setSpecialty(e.target.value)}
                    className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-amber-400"
                  >
                    <option value="Strength Training">Strength Training</option>
                    <option value="Cardio & Weight Loss">Cardio & Weight Loss</option>
                    <option value="CrossFit & HIIT">CrossFit & HIIT</option>
                    <option value="Yoga & Flexibility">Yoga & Flexibility</option>
                  </select>
                </div>
                <div>
                  <label className="block text-zinc-400 text-xs font-bold uppercase tracking-wider mb-2">Experience Length</label>
                  <input
                    type="text"
                    required
                    value={experience}
                    onChange={(e) => setExperience(e.target.value)}
                    className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-amber-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-zinc-400 text-xs font-bold uppercase tracking-wider mb-2">Phone</label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white font-mono focus:outline-none focus:ring-1 focus:ring-amber-400"
                  />
                </div>
                <div>
                  <label className="block text-zinc-400 text-xs font-bold uppercase tracking-wider mb-2">Email</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-amber-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-zinc-400 text-xs font-bold uppercase tracking-wider mb-2">Weekly Shift Availability</label>
                <input
                  type="text"
                  required
                  value={availability}
                  onChange={(e) => setAvailability(e.target.value)}
                  className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-amber-400"
                />
              </div>

              <div className="pt-4 border-t border-zinc-850 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4.5 py-2.5 bg-zinc-900 border border-zinc-800 text-zinc-300 font-bold rounded-xl text-xs uppercase tracking-wider hover:bg-zinc-850 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-blue-500 text-white font-bold rounded-xl text-xs uppercase tracking-wider hover:bg-blue-600 transition shadow-lg shadow-blue-500/10"
                >
                  Update Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- CLIENT ROSTER OVERLAY MODAL --- */}
      {showMembersModal && selectedTrainer && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-zinc-950 border border-zinc-800 w-full max-w-md rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[75vh]">
            <div className="p-6 border-b border-zinc-850 flex items-center justify-between">
              <div>
                <h2 className="text-white text-lg font-bold leading-tight">{selectedTrainer.name}'s Client Roster</h2>
                <p className="text-zinc-500 text-xs mt-0.5">Assigned athletes list</p>
              </div>
              <button onClick={() => setShowMembersModal(false)} className="text-zinc-500 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto space-y-3.5 flex-1 scrollbar-thin scrollbar-thumb-zinc-900">
              {activeTrainerMembers.length === 0 ? (
                <div className="text-center py-10">
                  <p className="text-zinc-500 text-xs">No active gym members assigned to this coach.</p>
                </div>
              ) : (
                activeTrainerMembers.map((m) => (
                  <div key={m.id} className="bg-zinc-900/40 border border-zinc-850 rounded-xl p-3.5 flex justify-between items-center text-xs">
                    <div>
                      <span className="text-white font-bold block">{m.name}</span>
                      <span className="text-zinc-550 block mt-0.5 font-mono">{m.phone}</span>
                    </div>
                    <span className="inline-flex items-center px-2 py-0.5 rounded uppercase font-bold text-[9px] bg-amber-400/10 text-amber-400 border border-amber-400/20">
                      {m.plan}
                    </span>
                  </div>
                ))
              )}
            </div>

            <div className="p-6 border-t border-zinc-850 flex justify-end">
              <button
                type="button"
                onClick={() => setShowMembersModal(false)}
                className="px-6 py-2.5 bg-zinc-900 border border-zinc-800 text-zinc-300 font-bold rounded-xl text-xs uppercase tracking-wider hover:bg-zinc-850 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
