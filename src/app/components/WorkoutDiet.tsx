import { useState, useEffect } from 'react';
import { 
  Dumbbell, 
  Utensils, 
  User, 
  Plus, 
  Trash2, 
  Save, 
  Sparkles, 
  ClipboardList, 
  Check, 
  Flame,
  Search,
  Activity
} from 'lucide-react';
import { api, Member } from '../services/api';
import { toast } from 'sonner';

// Sample templates that coaches can copy from
const PRESET_WORKOUTS = [
  {
    title: 'Premium Lean Muscle Split',
    schedule: {
      'Monday': [
        { name: 'Bench Press', sets: 4, reps: '8-12', notes: 'Warm up, target RPE 8' },
        { name: 'Incline Dumbbell Press', sets: 3, reps: '10', notes: 'Upper chest focus' },
        { name: 'Tricep Pushdowns', sets: 4, reps: '12', notes: 'Slow negative release' }
      ],
      'Wednesday': [
        { name: 'Barbell Squats', sets: 4, reps: '8', notes: 'Form-focused, below parallel' },
        { name: 'Leg Press', sets: 3, reps: '12', notes: 'Focus on full range' },
        { name: 'Calf Raises', sets: 4, reps: '15', notes: 'Squeeze at peak' }
      ],
      'Friday': [
        { name: 'Deadlifts', sets: 4, reps: '5', notes: 'Brace core, solid stance' },
        { name: 'Pull-Ups', sets: 3, reps: 'Max', notes: 'Controlled release' },
        { name: 'Barbell Curls', sets: 3, reps: '10', notes: 'No hip swing' }
      ]
    }
  },
  {
    title: 'Fat Loss HIIT & Cardio',
    schedule: {
      'Tuesday': [
        { name: 'Treadmill Interval', sets: 1, reps: '20 mins', notes: '30s sprint / 30s walking' },
        { name: 'Burpees', sets: 3, reps: '15', notes: 'Explosive jump' }
      ],
      'Thursday': [
        { name: 'Kettlebell Swings', sets: 4, reps: '20', notes: 'Hip hinge power' },
        { name: 'Planks', sets: 3, reps: '60s', notes: 'Flat back, tight glutes' }
      ],
      'Saturday': [
        { name: 'Rowing Machine', sets: 1, reps: '15 mins', notes: 'Maintain high pace' },
        { name: 'Jumping Jacks', sets: 3, reps: '50', notes: 'Steady tempo' }
      ]
    }
  },
  {
    title: 'CrossFit WOD Elite',
    schedule: {
      'Monday': [
        { name: 'Clean & Jerk', sets: 5, reps: '3', notes: 'Power clean focus' },
        { name: 'Wall Balls', sets: 3, reps: '25', notes: '20lb ball target' }
      ],
      'Wednesday': [
        { name: 'Box Jumps', sets: 4, reps: '15', notes: 'Step down' },
        { name: 'Double Unders', sets: 3, reps: '50', notes: 'Speed rope' }
      ],
      'Friday': [
        { name: 'Toes to Bar', sets: 4, reps: '12', notes: 'Keep hollow body' },
        { name: 'Kettlebell Snatch', sets: 3, reps: '15', notes: 'Explosive drive' }
      ]
    }
  }
];

const PRESET_DIETS = [
  {
    title: 'High Protein Hypertrophy Diet',
    schedule: {
      'Breakfast': '4 Egg whites + 2 whole eggs, 50g Oats with almond milk, 1 Banana',
      'Lunch': '200g Grilled Chicken Breast, 150g Brown Rice, Broccoli & Spinach',
      'Snack': '1 Scoop Whey Protein, 30g Almonds, Apple',
      'Dinner': '150g Baked Salmon/Paneer, Sweet Potato, Mixed Salad'
    }
  },
  {
    title: 'Lean Shred Calorie Deficit Plan',
    schedule: {
      'Breakfast': 'Egg white omelet with spinach & tomatoes, green tea',
      'Lunch': 'Mixed greens salad with Tuna or Tofu, 100g Quinoa',
      'Snack': 'Greek yogurt with fresh berries',
      'Dinner': 'Grilled Paneer or Fish, stir-fried vegetables, asparagus'
    }
  },
  {
    title: 'Clean Bulk Surplus Plan',
    schedule: {
      'Breakfast': '3 Whole Eggs, 3 slices Whole Wheat Toast, Avocado, Peanut butter',
      'Lunch': '250g Lean Beef or Paneer curry, 200g Jasmine Rice, Dal',
      'Snack': 'Mass gainer shake or Oats shake with milk, peanut butter, honey',
      'Dinner': 'Chicken Breast, Pasta with olive oil, mixed bell peppers'
    }
  }
];

export default function WorkoutDiet() {
  const [members, setMembers] = useState<Member[]>([]);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [activeTab, setActiveTab] = useState<'workout' | 'diet'>('workout');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Active workout editor state
  const [workoutTitle, setWorkoutTitle] = useState('');
  const [workoutSchedule, setWorkoutSchedule] = useState<Record<string, Array<{ name: string; sets: number; reps: string; notes: string }>>>({});

  // Active diet editor state
  const [dietTitle, setDietTitle] = useState('');
  const [dietMeals, setDietMeals] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchMembers();
  }, []);

  const fetchMembers = async () => {
    setIsLoading(true);
    try {
      const data = await api.members.list();
      setMembers(data);
      if (data.length > 0 && !selectedMember) {
        handleSelectMember(data[0]);
      }
    } catch (err) {
      toast.error('Failed to load member profiles');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectMember = async (member: Member) => {
    setSelectedMember(member);
    setIsLoading(true);
    try {
      // Fetch workout
      const wData = await api.members.getWorkout(member.id);
      if (wData) {
        setWorkoutTitle(wData.title);
        setWorkoutSchedule(wData.schedule);
      } else {
        setWorkoutTitle('');
        setWorkoutSchedule({
          'Monday': [],
          'Wednesday': [],
          'Friday': []
        });
      }

      // Fetch diet
      const dData = await api.members.getDiet(member.id);
      if (dData) {
        setDietTitle(dData.title);
        setDietMeals(dData.schedule);
      } else {
        setDietTitle('');
        setDietMeals({
          'Breakfast': '',
          'Lunch': '',
          'Snack': '',
          'Dinner': ''
        });
      }
    } catch (err) {
      toast.error('Error loading member plans');
    } finally {
      setIsLoading(false);
    }
  };

  // Preset Applicators
  const applyWorkoutPreset = (preset: typeof PRESET_WORKOUTS[0]) => {
    setWorkoutTitle(preset.title);
    setWorkoutSchedule(JSON.parse(JSON.stringify(preset.schedule)));
    toast.success(`Preset "${preset.title}" loaded in editor`);
  };

  const applyDietPreset = (preset: typeof PRESET_DIETS[0]) => {
    setDietTitle(preset.title);
    setDietMeals(JSON.parse(JSON.stringify(preset.schedule)));
    toast.success(`Preset "${preset.title}" loaded in editor`);
  };

  // Workout Schedule Helpers
  const addExercise = (day: string) => {
    setWorkoutSchedule(prev => ({
      ...prev,
      [day]: [...(prev[day] || []), { name: '', sets: 3, reps: '10', notes: '' }]
    }));
  };

  const removeExercise = (day: string, idx: number) => {
    setWorkoutSchedule(prev => ({
      ...prev,
      [day]: prev[day].filter((_, i) => i !== idx)
    }));
  };

  const updateExercise = (day: string, idx: number, key: string, value: any) => {
    setWorkoutSchedule(prev => {
      const list = [...(prev[day] || [])];
      list[idx] = { ...list[idx], [key]: value };
      return { ...prev, [day]: list };
    });
  };

  const addDay = () => {
    const dayName = prompt('Enter Day Name (e.g. Tuesday, Saturday):');
    if (dayName && dayName.trim()) {
      const formatted = dayName.trim();
      setWorkoutSchedule(prev => ({
        ...prev,
        [formatted]: []
      }));
    }
  };

  const removeDay = (day: string) => {
    setWorkoutSchedule(prev => {
      const updated = { ...prev };
      delete updated[day];
      return updated;
    });
  };

  // Diet Helpers
  const updateMeal = (meal: string, value: string) => {
    setDietMeals(prev => ({
      ...prev,
      [meal]: value
    }));
  };

  const addMealType = () => {
    const mealName = prompt('Enter Meal Stage (e.g. Mid-Morning, Pre-Workout):');
    if (mealName && mealName.trim()) {
      const formatted = mealName.trim();
      setDietMeals(prev => ({
        ...prev,
        [formatted]: ''
      }));
    }
  };

  const removeMealType = (meal: string) => {
    setDietMeals(prev => {
      const updated = { ...prev };
      delete updated[meal];
      return updated;
    });
  };

  // Save Handlers
  const handleSaveWorkout = async () => {
    if (!selectedMember) return;
    if (!workoutTitle.trim()) {
      toast.error('Please specify a Workout Title');
      return;
    }
    
    setIsLoading(true);
    try {
      await api.members.saveWorkout(selectedMember.id, workoutTitle, workoutSchedule);
      toast.success(`Workout routine successfully assigned to ${selectedMember.name}`);
    } catch (err) {
      toast.error('Failed to save workout routine');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveDiet = async () => {
    if (!selectedMember) return;
    if (!dietTitle.trim()) {
      toast.error('Please specify a Diet Title');
      return;
    }

    setIsLoading(true);
    try {
      await api.members.saveDiet(selectedMember.id, dietTitle, dietMeals);
      toast.success(`Nutrition plan successfully assigned to ${selectedMember.name}`);
    } catch (err) {
      toast.error('Failed to save diet plan');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredMembers = members.filter(m => 
    m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.phone.includes(searchQuery)
  );

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      
      {/* Page Title */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-extrabold text-white tracking-tight">Routines & Prescriptions</h1>
            <span className="bg-amber-400/10 text-amber-400 text-xs px-2.5 py-1 rounded-full font-bold border border-amber-400/20 uppercase tracking-widest flex items-center gap-1">
              <Sparkles className="w-3 h-3" /> Coach Panel
            </span>
          </div>
          <p className="text-zinc-500 text-sm mt-1">Design customized workout circuits and macronutrient diets for gym members.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Member Selector list */}
        <div className="bg-zinc-950/70 border border-zinc-800/80 rounded-2xl p-4 flex flex-col h-[calc(100vh-180px)] min-h-[500px]">
          <h2 className="text-white font-bold text-base mb-3 px-1 flex items-center gap-2">
            <User className="w-4 h-4 text-amber-400" /> Select Member Profile
          </h2>
          
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input
              type="text"
              placeholder="Search members..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-zinc-900/60 border border-zinc-800/80 rounded-xl pl-9 pr-4 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-amber-400"
            />
          </div>

          <div className="flex-1 overflow-y-auto space-y-2 pr-1 scrollbar-thin scrollbar-thumb-zinc-900">
            {filteredMembers.map((m) => {
              const isSelected = selectedMember?.id === m.id;
              return (
                <button
                  key={m.id}
                  onClick={() => handleSelectMember(m)}
                  className={`w-full text-left p-3.5 rounded-xl border transition-all duration-200 ${
                    isSelected
                      ? 'bg-amber-400 border-transparent text-black font-bold shadow-md shadow-amber-500/10'
                      : 'bg-zinc-900/30 border-zinc-800/50 text-zinc-300 hover:bg-zinc-900/80'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-semibold truncate block max-w-[160px]">{m.name}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider ${
                      isSelected
                        ? 'bg-black/10 text-black'
                        : m.status === 'active'
                          ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-500/10'
                          : m.status === 'expiring'
                            ? 'bg-amber-950/40 text-amber-400 border border-amber-500/10'
                            : 'bg-rose-950/40 text-rose-400 border border-rose-500/10'
                    }`}>
                      {m.status}
                    </span>
                  </div>
                  <div className={`text-[11px] mt-1 ${isSelected ? 'text-black/60' : 'text-zinc-500'}`}>
                    Plan: {m.plan} • {m.phone}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Column: Routine/Diet Builder workspace */}
        <div className="lg:col-span-2 bg-zinc-950/70 border border-zinc-800/80 rounded-2xl p-6 flex flex-col h-[calc(100vh-180px)] min-h-[500px] overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-900">
          
          {selectedMember ? (
            <div className="space-y-6 flex-1 flex flex-col">
              
              {/* Profile Header */}
              <div className="bg-zinc-900/40 border border-zinc-800/60 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 bg-amber-400/10 text-amber-400 rounded-lg flex items-center justify-center font-bold text-lg border border-amber-400/20">
                    {selectedMember.name.substring(0,2).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-white font-bold text-base leading-tight">{selectedMember.name}</h3>
                    <p className="text-zinc-500 text-xs mt-0.5">Editing personalized routines</p>
                  </div>
                </div>

                {/* Workspace tab selectors */}
                <div className="flex bg-zinc-950 border border-zinc-800 rounded-xl p-1 max-w-xs self-start sm:self-center">
                  <button
                    onClick={() => setActiveTab('workout')}
                    className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all ${
                      activeTab === 'workout'
                        ? 'bg-amber-400 text-black shadow'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    <Dumbbell className="w-3.5 h-3.5" /> Workout
                  </button>
                  <button
                    onClick={() => setActiveTab('diet')}
                    className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all ${
                      activeTab === 'diet'
                        ? 'bg-amber-400 text-black shadow'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    <Utensils className="w-3.5 h-3.5" /> Diet Plan
                  </button>
                </div>
              </div>

              {/* WORKOUT TAB WORKSPACE */}
              {activeTab === 'workout' && (
                <div className="flex-1 flex flex-col space-y-6">
                  
                  {/* Preset suggestion list */}
                  <div>
                    <h4 className="text-zinc-400 text-xs font-bold uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <Flame className="w-3.5 h-3.5 text-amber-400" /> Apply Workout Presets
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                      {PRESET_WORKOUTS.map((preset) => (
                        <button
                          key={preset.title}
                          onClick={() => applyWorkoutPreset(preset)}
                          className="bg-zinc-900/30 border border-zinc-800 hover:border-amber-400/50 hover:bg-zinc-900/60 p-3 rounded-xl text-left text-xs font-medium text-zinc-300 hover:text-white transition duration-200"
                        >
                          <span className="font-bold text-amber-400 block mb-0.5">{preset.title}</span>
                          {Object.keys(preset.schedule).length} workout days split
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Program Title input */}
                  <div className="space-y-2">
                    <label className="text-zinc-300 text-xs font-bold uppercase tracking-wider block">
                      Routine Program Name
                    </label>
                    <input
                      type="text"
                      value={workoutTitle}
                      onChange={(e) => setWorkoutTitle(e.target.value)}
                      placeholder="e.g. Advanced Hypertrophy Split 4-Day"
                      className="w-full bg-zinc-900/40 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-amber-400"
                    />
                  </div>

                  {/* Day List */}
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h4 className="text-white text-sm font-bold flex items-center gap-2">
                        <ClipboardList className="w-4 h-4 text-amber-400" /> Exercises Schedule
                      </h4>
                      <button
                        onClick={addDay}
                        className="text-xs bg-zinc-900 border border-zinc-800 hover:border-amber-400 hover:text-white text-zinc-300 px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition"
                      >
                        <Plus className="w-3.5 h-3.5" /> Add Day
                      </button>
                    </div>

                    {Object.keys(workoutSchedule).length === 0 ? (
                      <div className="text-center py-8 bg-zinc-900/20 border border-dashed border-zinc-800 rounded-xl">
                        <Dumbbell className="w-8 h-8 text-zinc-600 mx-auto mb-2" />
                        <p className="text-zinc-500 text-xs">No split days set. Add a custom day or apply a preset template.</p>
                      </div>
                    ) : (
                      <div className="space-y-5">
                        {Object.entries(workoutSchedule).map(([day, exercises]) => (
                          <div key={day} className="bg-zinc-900/30 border border-zinc-800/80 rounded-xl p-4 space-y-3">
                            
                            <div className="flex justify-between items-center pb-2 border-b border-zinc-850">
                              <span className="text-white font-bold text-xs uppercase tracking-wider">{day}</span>
                              <button
                                onClick={() => removeDay(day)}
                                className="text-zinc-500 hover:text-red-400 p-1 transition"
                                title="Remove day split"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>

                            {/* Exercises in Day */}
                            <div className="space-y-2">
                              {exercises.map((ex, exIdx) => (
                                <div key={exIdx} className="grid grid-cols-1 md:grid-cols-4 gap-2 items-center bg-zinc-900/60 p-2.5 rounded-lg relative group">
                                  <div className="md:col-span-2">
                                    <input
                                      type="text"
                                      value={ex.name}
                                      onChange={(e) => updateExercise(day, exIdx, 'name', e.target.value)}
                                      placeholder="Exercise Name"
                                      className="w-full bg-zinc-950 border border-zinc-850 rounded-md px-2 py-1 text-xs text-white"
                                    />
                                  </div>
                                  <div>
                                    <input
                                      type="number"
                                      value={ex.sets}
                                      onChange={(e) => updateExercise(day, exIdx, 'sets', parseInt(e.target.value) || 0)}
                                      placeholder="Sets"
                                      className="w-full bg-zinc-950 border border-zinc-850 rounded-md px-2 py-1 text-xs text-white text-center"
                                    />
                                  </div>
                                  <div className="flex items-center gap-1.5">
                                    <input
                                      type="text"
                                      value={ex.reps}
                                      onChange={(e) => updateExercise(day, exIdx, 'reps', e.target.value)}
                                      placeholder="Reps / Secs"
                                      className="w-full bg-zinc-950 border border-zinc-850 rounded-md px-2 py-1 text-xs text-white text-center"
                                    />
                                    <button
                                      onClick={() => removeExercise(day, exIdx)}
                                      className="text-zinc-600 hover:text-red-400 p-0.5"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                  <div className="col-span-full mt-1.5">
                                    <input
                                      type="text"
                                      value={ex.notes}
                                      onChange={(e) => updateExercise(day, exIdx, 'notes', e.target.value)}
                                      placeholder="Coaching notes/tips (optional)"
                                      className="w-full bg-zinc-950 border border-zinc-850 rounded-md px-2.5 py-1 text-[11px] text-zinc-400"
                                    />
                                  </div>
                                </div>
                              ))}
                            </div>

                            <button
                              onClick={() => addExercise(day)}
                              className="text-[11px] text-amber-400 hover:text-amber-300 font-bold flex items-center gap-1 mt-1 transition"
                            >
                              <Plus className="w-3.5 h-3.5" /> Add Exercise Circuit
                            </button>

                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Save button */}
                  <div className="pt-4 border-t border-zinc-800 flex justify-end">
                    <button
                      onClick={handleSaveWorkout}
                      disabled={isLoading}
                      className="bg-amber-400 hover:bg-amber-500 text-black font-bold px-6 py-3 rounded-xl flex items-center gap-2 shadow-md transition disabled:opacity-50"
                    >
                      <Save className="w-4 h-4" /> Save Workout Routine
                    </button>
                  </div>

                </div>
              )}

              {/* DIET TAB WORKSPACE */}
              {activeTab === 'diet' && (
                <div className="flex-1 flex flex-col space-y-6">
                  
                  {/* Presets suggestions */}
                  <div>
                    <h4 className="text-zinc-400 text-xs font-bold uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <Flame className="w-3.5 h-3.5 text-amber-400" /> Apply Nutrition Presets
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                      {PRESET_DIETS.map((preset) => (
                        <button
                          key={preset.title}
                          onClick={() => applyDietPreset(preset)}
                          className="bg-zinc-900/30 border border-zinc-800 hover:border-amber-400/50 hover:bg-zinc-900/60 p-3 rounded-xl text-left text-xs font-medium text-zinc-300 hover:text-white transition duration-200"
                        >
                          <span className="font-bold text-amber-400 block mb-0.5">{preset.title}</span>
                          {Object.keys(preset.schedule).length} meal partitions
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Diet Plan name */}
                  <div className="space-y-2">
                    <label className="text-zinc-300 text-xs font-bold uppercase tracking-wider block">
                      Diet Plan Name
                    </label>
                    <input
                      type="text"
                      value={dietTitle}
                      onChange={(e) => setDietTitle(e.target.value)}
                      placeholder="e.g. High Protein Shredding Plan"
                      className="w-full bg-zinc-900/40 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-amber-400"
                    />
                  </div>

                  {/* Meals Schedule */}
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h4 className="text-white text-sm font-bold flex items-center gap-2">
                        <Utensils className="w-4 h-4 text-amber-400" /> Meal breakdown schedule
                      </h4>
                      <button
                        onClick={addMealType}
                        className="text-xs bg-zinc-900 border border-zinc-800 hover:border-amber-400 hover:text-white text-zinc-300 px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition"
                      >
                        <Plus className="w-3.5 h-3.5" /> Add Meal
                      </button>
                    </div>

                    {Object.keys(dietMeals).length === 0 ? (
                      <div className="text-center py-8 bg-zinc-900/20 border border-dashed border-zinc-800 rounded-xl">
                        <Utensils className="w-8 h-8 text-zinc-600 mx-auto mb-2" />
                        <p className="text-zinc-500 text-xs">No meals specified yet.</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {Object.entries(dietMeals).map(([meal, details]) => (
                          <div key={meal} className="bg-zinc-900/30 border border-zinc-800/80 rounded-xl p-4 flex flex-col gap-2 relative">
                            <div className="flex justify-between items-center pb-2 border-b border-zinc-850">
                              <span className="text-white font-bold text-xs uppercase tracking-wider">{meal}</span>
                              <button
                                onClick={() => removeMealType(meal)}
                                className="text-zinc-500 hover:text-red-400 p-1 transition"
                                title="Remove meal"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                            <textarea
                              rows={2}
                              value={details}
                              onChange={(e) => updateMeal(meal, e.target.value)}
                              placeholder={`Describe what the member should eat for ${meal}...`}
                              className="w-full bg-zinc-900/50 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-amber-400 resize-none"
                            />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Save button */}
                  <div className="pt-4 border-t border-zinc-800 flex justify-end">
                    <button
                      onClick={handleSaveDiet}
                      disabled={isLoading}
                      className="bg-amber-400 hover:bg-amber-500 text-black font-bold px-6 py-3 rounded-xl flex items-center gap-2 shadow-md transition disabled:opacity-50"
                    >
                      <Save className="w-4 h-4" /> Save Diet Plan
                    </button>
                  </div>

                </div>
              )}

            </div>
          ) : (
            <div className="text-center py-20 flex-1 flex flex-col justify-center items-center">
              <Activity className="w-12 h-12 text-zinc-700 mb-3 animate-pulse" />
              <h3 className="text-zinc-400 font-bold text-lg">No Member Selected</h3>
              <p className="text-zinc-600 text-sm max-w-xs mx-auto mt-1">Select a member profile from the sidebar panel to view and write plans.</p>
            </div>
          )}

        </div>

      </div>

    </div>
  );
}
