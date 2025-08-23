import React, { useState, useEffect } from 'react';
import { 
  Dumbbell, 
  Clock, 
  Target, 
  BarChart3, 
  Calendar, 
  Plus, 
  TrendingUp, 
  Award, 
} from 'lucide-react';
import {FaFire} from 'react-icons/fa';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { useSidebar } from '../../context/SidebarContext';
import { AuthContext } from '../../context/AuthContext';
import { db } from '../../firebase/firebase.config';
import { collection, addDoc, onSnapshot, query, orderBy, doc, updateDoc, deleteDoc, getDocs } from 'firebase/firestore';
import { toast } from 'react-toastify';

const StatCard = ({ icon: Icon, title, value, subValue, color }) => (
  <div className="bg-white p-2 sm:p-3 md:p-4 rounded-lg shadow-sm border border-slate-200 flex flex-col justify-between h-full">
    <div>
      <div className="flex items-center text-slate-500 mb-1 sm:mb-2">
        <Icon className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 mr-1 sm:mr-2" style={{ color }} />
        <h3 className="font-semibold text-xs sm:text-sm md:text-base">{title}</h3>
      </div>
      <p className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-slate-800">{value}</p>
    </div>
    {subValue && <p className="text-xs sm:text-sm md:text-base text-slate-400 mt-1">{subValue}</p>}
  </div>
);

const InputCard = ({ icon: Icon, title, children, color }) => (
  <div className="bg-white rounded-lg shadow-sm border border-slate-200 h-full">
    <div className="p-2 sm:p-3 md:p-4">
      <div className="flex items-center mb-1 sm:mb-2 md:mb-3">
        <Icon className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 mr-1 sm:mr-2 md:mr-3" style={{ color }} />
        <h3 className="text-sm sm:text-base md:text-lg lg:text-xl font-bold text-slate-800">{title}</h3>
      </div>
      {children}
    </div>
  </div>
);

const WorkoutTracker = () => {
  const { collapsed } = useSidebar();
  const { user } = React.useContext(AuthContext);
  const [activeTab, setActiveTab] = useState('overview');
  const [viewPeriod, setViewPeriod] = useState('weekly');
  const [workouts, setWorkouts] = useState([]);
  const [newWorkout, setNewWorkout] = useState({
    type: '',
    duration: '',
    sets: '',
    reps: '',
    weight: '',
    date: new Date().toISOString().split('T')[0]
  });
  const [dailyGoal, setDailyGoal] = useState(30);
  const [newDailyGoal, setNewDailyGoal] = useState(30);
  const COLORS = ['#0d6efd', '#198754', '#6f42c1', '#fd7e14', '#dc3545', '#20c997'];

  useEffect(() => {
    if (user) {
      const userRef = doc(db, 'users', user.uid);
      const unsubscribeUser = onSnapshot(userRef, (snap) => {
        const data = snap.data();
        setDailyGoal(data?.dailyWorkoutGoal || 30);
        setNewDailyGoal(data?.dailyWorkoutGoal || 30);
      });

      const workoutsQuery = query(collection(db, `users/${user.uid}/workouts`), orderBy('date', 'desc'));
      const unsubscribeWorkouts = onSnapshot(workoutsQuery, (snapshot) => {
        setWorkouts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      });

      return () => {
        unsubscribeUser();
        unsubscribeWorkouts();
      };
    }
  }, [user]);

  const handleSetDailyGoal = async () => {
    if (newDailyGoal < 1) {
      toast.error('Daily goal must be at least 1 minute.');
      return;
    }
    try {
      await updateDoc(doc(db, 'users', user.uid), { dailyWorkoutGoal: newDailyGoal });
      toast.success('Daily goal updated successfully!');
    } catch (error) {
      toast.error('Failed to update daily goal.');
    }
  };

  const calculateStreak = () => {
    const dailySums = {};
    workouts.forEach(workout => {
      const day = workout.date.toDate().toISOString().split('T')[0];
      dailySums[day] = (dailySums[day] || 0) + workout.duration;
    });

    let streak = 0;
    let currentDay = new Date();
    while (true) {
      const dayStr = currentDay.toISOString().split('T')[0];
      if ((dailySums[dayStr] || 0) >= dailyGoal) {
        streak++;
      } else {
        break;
      }
      currentDay.setDate(currentDay.getDate() - 1);
    }
    return streak;
  };

  const handleAddWorkout = async () => {
    if (!newWorkout.type || !newWorkout.duration || !newWorkout.sets || !newWorkout.reps) {
      toast.error('Please fill all required fields.');
      return;
    }

    try {
      await addDoc(collection(db, `users/${user.uid}/workouts`), {
        type: newWorkout.type,
        duration: parseInt(newWorkout.duration),
        sets: parseInt(newWorkout.sets),
        reps: parseInt(newWorkout.reps),
        weight: parseInt(newWorkout.weight) || 0,
        date: new Date(newWorkout.date),
        calories: Math.round(parseInt(newWorkout.duration) * 7.5) // Rough estimate: 7.5 kcal/min
      });
      toast.success('Workout added successfully!');
      setNewWorkout({
        type: '',
        duration: '',
        sets: '',
        reps: '',
        weight: '',
        date: new Date().toISOString().split('T')[0]
      });
    } catch (error) {
      toast.error('Failed to add workout.');
    }
  };

  const getWorkoutStats = () => {
    const totalWorkouts = workouts.length;
    const totalDuration = workouts.reduce((sum, w) => sum + w.duration, 0);
    const totalCalories = workouts.reduce((sum, w) => sum + w.calories, 0);
    const avgSets = workouts.length > 0 ? (workouts.reduce((sum, w) => sum + w.sets, 0) / workouts.length).toFixed(1) : 0;
    const streak = calculateStreak();

    const today = new Date();
    const weekStart = new Date(today);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    const weeklyWorkouts = workouts.filter(w => w.date.toDate() >= weekStart).length;
    const weeklyProgress = Math.min((weeklyWorkouts / 4) * 100, 100); // Assuming goal of 4 workouts/week

    return {
      totalWorkouts,
      totalDuration,
      totalCalories,
      avgSets,
      weeklyWorkouts,
      weeklyProgress,
      streak
    };
  };

  const getChartData = () => {
    const days = viewPeriod === 'weekly' ? 7 : viewPeriod === 'monthly' ? 30 : 365;
    const data = [];

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateString = date.toISOString().split('T')[0];

      const dayWorkouts = workouts.filter(w => w.date.toDate().toISOString().split('T')[0] === dateString);
      const totalDuration = dayWorkouts.reduce((sum, w) => sum + w.duration, 0);
      const totalCalories = dayWorkouts.reduce((sum, w) => sum + w.calories, 0);

      data.push({
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        duration: totalDuration,
        calories: totalCalories,
        workouts: dayWorkouts.length
      });
    }

    return data;
  };

  const getBarChartData = () => {
    const exerciseTypes = {};
    workouts.forEach(w => {
      exerciseTypes[w.type] = (exerciseTypes[w.type] || 0) + w.duration;
    });

    return Object.entries(exerciseTypes).map(([type, duration], index) => ({
      name: type,
      duration,
      fill: COLORS[index % COLORS.length]
    }));
  };

  const stats = getWorkoutStats();

  const TABS = [
    { id: 'overview', label: 'Overview', icon: Target },
    { id: 'log', label: 'Log Workout', icon: Dumbbell },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <div className="space-y-2 sm:space-y-4 md:space-y-6 lg:space-y-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2 sm:gap-3 md:gap-4 lg:gap-6">
              <StatCard
                icon={Dumbbell}
                title="Total Workouts"
                value={stats.totalWorkouts}
                subValue={`${stats.weeklyWorkouts} this week`}
                color="#0d6efd"
              />
              <StatCard
                icon={Clock}
                title="Total Duration"
                value={`${Math.round(stats.totalDuration / 60)}h`}
                subValue={`${stats.totalDuration} minutes`}
                color="#198754"
              />
              <StatCard
                icon={Award}
                title="Calories Burned"
                value={`${Math.round(stats.totalCalories)} kcal`}
                subValue="Total"
                color="#6f42c1"
              />
              <StatCard
                icon={Target}
                title="Average Sets"
                value={stats.avgSets}
                subValue="Per workout"
                color="#fd7e14"
              />
              <StatCard
                icon={FaFire}
                title="Streak"
                value={stats.streak}
                subValue="days"
                color="#EF4444"
              />
            </div>

            <div className="bg-white p-2 sm:p-3 md:p-4 rounded-lg shadow-sm border border-slate-200">
              <h3 className="text-sm sm:text-base md:text-lg font-semibold text-slate-800 mb-1 sm:mb-2 md:mb-4">Set Daily Goal (minutes)</h3>
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
                <input
                  type="number"
                  className="w-full sm:w-32 px-2 sm:px-3 py-1 sm:py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500 text-sm sm:text-base"
                  value={newDailyGoal}
                  onChange={(e) => setNewDailyGoal(parseInt(e.target.value) || 0)}
                  min="1"
                />
                <button
                  onClick={handleSetDailyGoal}
                  className="w-full sm:w-auto px-2 sm:px-4 py-1 sm:py-2 bg-indigo-600 text-white font-semibold rounded-md hover:bg-indigo-700 text-sm sm:text-base"
                >
                  Update Goal
                </button>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-slate-200">
              <div className="p-2 sm:p-3 md:p-4">
                <h3 className="text-sm sm:text-base md:text-lg lg:text-xl font-bold text-slate-800 mb-1 sm:mb-2 md:mb-4 flex items-center">
                  <Dumbbell className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 mr-1 sm:mr-2 md:mr-3" style={{ color: '#0d6efd' }} />
                  Recent Workouts
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs sm:text-sm">
                    <thead className="bg-slate-50 text-slate-600">
                      <tr>
                        <th className="p-1 sm:p-2 md:p-3 font-semibold">Date</th>
                        <th className="p-1 sm:p-2 md:p-3 font-semibold">Type</th>
                        <th className="p-1 sm:p-2 md:p-3 font-semibold">Duration</th>
                        <th className="p-1 sm:p-2 md:p-3 font-semibold">Sets</th>
                        <th className="p-1 sm:p-2 md:p-3 font-semibold">Reps</th>
                        <th className="p-1 sm:p-2 md:p-3 font-semibold">Weight</th>
                        <th className="p-1 sm:p-2 md:p-3 font-semibold">Calories</th>
                      </tr>
                    </thead>
                    <tbody>
                      {workouts.slice(0, 5).map(workout => (
                        <tr key={workout.id} className="border-t border-slate-200">
                          <td className="p-1 sm:p-2 md:p-3">{workout.date.toDate().toLocaleDateString()}</td>
                          <td className="p-1 sm:p-2 md:p-3 font-medium text-slate-800">{workout.type}</td>
                          <td className="p-1 sm:p-2 md:p-3">{workout.duration} min</td>
                          <td className="p-1 sm:p-2 md:p-3">{workout.sets}</td>
                          <td className="p-1 sm:p-2 md:p-3">{workout.reps}</td>
                          <td className="p-1 sm:p-2 md:p-3">{workout.weight ? `${workout.weight} kg` : '-'}</td>
                          <td className="p-1 sm:p-2 md:p-3">{workout.calories} kcal</td>
                        </tr>
                      ))}
                      {workouts.length === 0 && (
                        <tr>
                          <td colSpan="7" className="p-2 sm:p-3 md:p-4 text-center text-slate-600">
                            No workouts logged. Add your first workout!
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        );
      case 'log':
        return (
          <div className="space-y-2 sm:space-y-4 md:space-y-6 lg:space-y-8">
            <InputCard icon={Dumbbell} title="Log Workout" color="#0d6efd">
              <div className="space-y-2 sm:space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4">
                  <div>
                    <label className="flex items-center text-xs sm:text-sm md:text-base font-medium text-slate-700 mb-1">
                      <Calendar className="mr-1 sm:mr-2" size={12} sm:size={16} />
                      Date
                    </label>
                    <input
                      type="date"
                      className="w-full px-2 sm:px-3 py-1 sm:py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500 text-xs sm:text-sm"
                      value={newWorkout.date}
                      onChange={(e) => setNewWorkout({ ...newWorkout, date: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="flex items-center text-xs sm:text-sm md:text-base font-medium text-slate-700 mb-1">
                      <Dumbbell className="mr-1 sm:mr-2" size={12} sm:size={16} />
                      Exercise Type
                    </label>
                    <input
                      type="text"
                      className="w-full px-2 sm:px-3 py-1 sm:py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500 text-xs sm:text-sm"
                      value={newWorkout.type}
                      onChange={(e) => setNewWorkout({ ...newWorkout, type: e.target.value })}
                      placeholder="e.g., Bench Press, Running, Yoga"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4">
                  <div>
                    <label className="flex items-center text-xs sm:text-sm md:text-base font-medium text-slate-700 mb-1">
                      <Clock className="mr-1 sm:mr-2" size={12} sm:size={16} />
                      Duration (min)
                    </label>
                    <input
                      type="number"
                      className="w-full px-2 sm:px-3 py-1 sm:py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500 text-xs sm:text-sm"
                      value={newWorkout.duration}
                      onChange={(e) => setNewWorkout({ ...newWorkout, duration: e.target.value })}
                      min="1"
                      placeholder="30"
                    />
                  </div>
                  <div>
                    <label className="flex items-center text-xs sm:text-sm md:text-base font-medium text-slate-700 mb-1">
                      <Target className="mr-1 sm:mr-2" size={12} sm:size={16} />
                      Sets
                    </label>
                    <input
                      type="number"
                      className="w-full px-2 sm:px-3 py-1 sm:py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500 text-xs sm:text-sm"
                      value={newWorkout.sets}
                      onChange={(e) => setNewWorkout({ ...newWorkout, sets: e.target.value })}
                      min="1"
                      placeholder="3"
                    />
                  </div>
                  <div>
                    <label className="flex items-center text-xs sm:text-sm md:text-base font-medium text-slate-700 mb-1">
                      <Target className="mr-1 sm:mr-2" size={12} sm:size={16} />
                      Reps
                    </label>
                    <input
                      type="number"
                      className="w-full px-2 sm:px-3 py-1 sm:py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500 text-xs sm:text-sm"
                      value={newWorkout.reps}
                      onChange={(e) => setNewWorkout({ ...newWorkout, reps: e.target.value })}
                      min="1"
                      placeholder="10"
                    />
                  </div>
                </div>
                <div>
                  <label className="flex items-center text-xs sm:text-sm md:text-base font-medium text-slate-700 mb-1">
                    <Dumbbell className="mr-1 sm:mr-2" size={12} sm:size={16} />
                    Weight (kg, optional)
                  </label>
                  <input
                    type="number"
                    className="w-full px-2 sm:px-3 py-1 sm:py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500 text-xs sm:text-sm"
                    value={newWorkout.weight}
                    onChange={(e) => setNewWorkout({ ...newWorkout, weight: e.target.value })}
                    min="0"
                    placeholder="50"
                  />
                </div>
                <button
                  className="w-full flex items-center justify-center px-2 sm:px-4 py-1 sm:py-2.5 bg-indigo-600 text-white font-semibold rounded-md shadow hover:bg-indigo-700 transition-colors disabled:bg-indigo-400 disabled:cursor-not-allowed text-xs sm:text-sm"
                  onClick={handleAddWorkout}
                  disabled={!newWorkout.type || !newWorkout.duration || !newWorkout.sets || !newWorkout.reps}
                >
                  <Plus className="mr-1 sm:mr-2" size={12} sm:size={16} />
                  Log Workout
                </button>
              </div>
            </InputCard>
          </div>
        );
      case 'analytics':
        return (
          <div className="space-y-2 sm:space-y-4 md:space-y-6 lg:space-y-8">
            <div className="bg-white p-2 sm:p-3 md:p-4 rounded-lg shadow-sm border border-slate-200 flex flex-col sm:flex-row justify-between sm:items-center gap-2 sm:gap-4">
              <h2 className="text-sm sm:text-base md:text-lg lg:text-xl font-bold text-slate-800 flex items-center">
                <TrendingUp className="mr-1 sm:mr-2 md:mr-3" style={{ color: '#0d6efd' }} />
                Workout Analytics
              </h2>
              <div className="flex-shrink-0 w-full sm:w-auto">
                <span className="relative z-0 inline-flex shadow-sm rounded-md w-full sm:w-auto">
                  {['weekly', 'monthly', 'yearly'].map((period, i) => (
                    <button
                      key={period}
                      onClick={() => setViewPeriod(period)}
                      className={`relative inline-flex items-center px-2 sm:px-3 py-1 sm:py-1.5 md:px-4 md:py-2 text-xs sm:text-sm md:text-base font-medium transition-colors ${i === 0 ? 'rounded-l-md' : ''} ${i === 2 ? 'rounded-r-md' : ''} ${viewPeriod === period ? 'z-10 bg-indigo-50 border-indigo-500 text-indigo-600' : 'bg-white border-slate-300 text-slate-500 hover:bg-slate-50'}`}
                    >
                      {period.charAt(0).toUpperCase() + period.slice(1)}
                    </button>
                  ))}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 sm:gap-3 md:gap-6 lg:gap-8">
              <div className="bg-white p-2 sm:p-3 md:p-4 rounded-lg shadow-sm border border-slate-200">
                <h3 className="text-sm sm:text-base md:text-lg font-semibold text-slate-800 mb-1 sm:mb-2 md:mb-4 flex items-center">
                  <TrendingUp className="mr-1 sm:mr-2" style={{ color: '#0d6efd' }} />
                  Workout Trends
                </h3>
                <div className="h-40 sm:h-56 md:h-64 lg:h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={getChartData()} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="date" stroke="#64748b" fontSize={10} sm:fontSize={12} />
                      <YAxis stroke="#64748b" fontSize={10} sm:fontSize={12} />
                      <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '0.5rem', fontSize: '10px',  }} />
                      <Line
                        type="monotone"
                        dataKey="duration"
                        name="Duration (min)"
                        stroke="#0d6efd"
                        strokeWidth={2}
                        dot={{ fill: '#0d6efd', strokeWidth: 1, r: 4 }}
                      />
                      <Line
                        type="monotone"
                        dataKey="calories"
                        name="Calories (kcal)"
                        stroke="#198754"
                        strokeWidth={2}
                        dot={{ fill: '#198754', strokeWidth: 1, r: 4 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div className="bg-white p-2 sm:p-3 md:p-4 rounded-lg shadow-sm border border-slate-200">
                <h3 className="text-sm sm:text-base md:text-lg font-semibold text-slate-800 mb-1 sm:mb-2 md:mb-4 flex items-center">
                  <BarChart3 className="mr-1 sm:mr-2" style={{ color: '#6f42c1' }} />
                  Exercise Distribution
                </h3>
                <div className="h-40 sm:h-56 md:h-64 lg:h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={getBarChartData()} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="name" stroke="#64748b" fontSize={10} sm:fontSize={12} />
                      <YAxis stroke="#64748b" fontSize={10} sm:fontSize={12} />
                      <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '0.5rem', fontSize: '10px',  }} />
                      <Bar dataKey="duration" name="Duration (min)" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            <div className="bg-white p-2 sm:p-3 md:p-4 rounded-lg shadow-sm border border-slate-200">
              <h3 className="text-sm sm:text-base md:text-lg font-semibold text-slate-800 mb-1 sm:mb-2 md:mb-4 flex items-center">
                <Award className="mr-1 sm:mr-2" style={{ color: '#6f42c1' }} />
                {viewPeriod.charAt(0).toUpperCase() + viewPeriod.slice(1)} Summary
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 md:gap-4">
                {[
                  { label: 'Total Workouts', value: stats.totalWorkouts, unit: 'sessions', color: '#0d6efd' },
                  { label: 'Avg Duration', value: (stats.totalDuration / (workouts.length || 1)).toFixed(1), unit: 'min', color: '#198754' },
                  { label: 'Total Calories', value: Math.round(stats.totalCalories), unit: 'kcal', color: '#6f42c1' },
                  { label: 'Avg Sets', value: stats.avgSets, unit: 'sets', color: '#fd7e14' }
                ].map((stat, idx) => (
                  <div key={idx} className="text-center">
                    <p className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold" style={{ color: stat.color }}>{stat.value}</p>
                    <p className="text-xs sm:text-sm md:text-base text-slate-600">{stat.label}</p>
                    <p className="text-xs sm:text-sm md:text-base text-slate-500">{stat.unit}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-slate-200">
              <div className="p-2 sm:p-3 md:p-4">
                <h3 className="text-sm sm:text-base md:text-lg lg:text-xl font-bold text-slate-800 mb-1 sm:mb-2 md:mb-5 flex items-center">
                  <Clock className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 mr-1 sm:mr-2 md:mr-3" style={{ color: '#0d6efd' }} />
                  Workout History
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs sm:text-sm">
                    <thead className="bg-slate-50 text-slate-600">
                      <tr>
                        <th className="p-1 sm:p-2 md:p-3 font-semibold">Date</th>
                        <th className="p-1 sm:p-2 md:p-3 font-semibold">Type</th>
                        <th className="p-1 sm:p-2 md:p-3 font-semibold">Duration</th>
                        <th className="p-1 sm:p-2 md:p-3 font-semibold">Sets</th>
                        <th className="p-1 sm:p-2 md:p-3 font-semibold">Reps</th>
                        <th className="p-1 sm:p-2 md:p-3 font-semibold">Weight</th>
                        <th className="p-1 sm:p-2 md:p-3 font-semibold">Calories</th>
                      </tr>
                    </thead>
                    <tbody>
                      {workouts.map(workout => (
                        <tr key={workout.id} className="border-t border-slate-200">
                          <td className="p-1 sm:p-2 md:p-3">{workout.date.toDate().toLocaleDateString()}</td>
                          <td className="p-1 sm:p-2 md:p-3 font-medium text-slate-800">{workout.type}</td>
                          <td className="p-1 sm:p-2 md:p-3">{workout.duration} min</td>
                          <td className="p-1 sm:p-2 md:p-3">{workout.sets}</td>
                          <td className="p-1 sm:p-2 md:p-3">{workout.reps}</td>
                          <td className="p-1 sm:p-2 md:p-3">{workout.weight ? `${workout.weight} kg` : '-'}</td>
                          <td className="p-1 sm:p-2 md:p-3">{workout.calories} kcal</td>
                        </tr>
                      ))}
                      {workouts.length === 0 && (
                        <tr>
                          <td colSpan="7" className="p-2 sm:p-3 md:p-4 text-center text-slate-600">
                            No workouts logged yet.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className={`min-h-screen bg-slate-50 transition-all duration-300 ${collapsed ? "lg:ml-20" : "lg:ml-64"}`}>
      <div className="p-2 sm:p-4 md:p-6 lg:p-8">
        {/* Tab Navigation */}
        <div className="mb-1 sm:mb-2 md:mb-2 relative">
          <div className="border-b border-slate-200 bg-white rounded-t-lg shadow-sm">
            <nav className="-mb-px flex overflow-x-auto px-2 sm:px-3 md:px-6 relative">
              {TABS.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-1 sm:gap-2 py-2 sm:py-3 md:py-4 px-1 sm:px-2 md:px-4 text-xs sm:text-sm md:text-base font-medium border-b-2 transition-colors duration-200 whitespace-nowrap ${
                      activeTab === tab.id
                        ? 'border-indigo-500 text-indigo-600'
                        : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    <Icon size={12} sm:size={14} md:size={16} />
                    <span className="hidden xs:inline">{tab.label}</span>
                    <span className="xs:hidden">{tab.label.split(' ')[0]}</span>
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        <div className="transition-all duration-300">
          {renderTabContent()}
        </div>
      </div>
    </div>
  );
};

export default WorkoutTracker;