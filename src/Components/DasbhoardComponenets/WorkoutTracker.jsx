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
  Trash2 
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { useNavigate } from 'react-router-dom';
import { useSidebar } from '../../context/SidebarContext';

const StatCard = ({ icon: Icon, title, value, subValue, color }) => (
  <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 flex flex-col justify-between h-full">
    <div>
      <div className="flex items-center text-slate-500 mb-2">
        <Icon className="w-5 h-5 mr-2" style={{ color }} />
        <h3 className="font-semibold text-sm">{title}</h3>
      </div>
      <p className="text-3xl font-bold text-slate-800">{value}</p>
    </div>
    {subValue && <p className="text-sm text-slate-400 mt-1">{subValue}</p>}
  </div>
);

const InputCard = ({ icon: Icon, title, children, color }) => (
  <div className="bg-white rounded-xl shadow-sm border border-slate-200 h-full">
    <div className="p-6">
      <div className="flex items-center mb-5">
        <Icon className="w-6 h-6 mr-3" style={{ color }} />
        <h3 className="text-xl font-bold text-slate-800">{title}</h3>
      </div>
      {children}
    </div>
  </div>
);

const WorkoutTracker = () => {
  const { collapsed } = useSidebar();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [viewPeriod, setViewPeriod] = useState('weekly');
  const [workouts, setWorkouts] = useState([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [saved, setSaved] = useState(false);
  const [newWorkout, setNewWorkout] = useState({
    type: '',
    duration: '',
    sets: '',
    reps: '',
    weight: '',
    date: new Date().toISOString().split('T')[0]
  });
  const navigate = useNavigate();

  const goals = {
    weeklyWorkouts: 4,
    weeklyDuration: 180 // minutes
  };

  useEffect(() => {
    const savedWorkouts = JSON.parse(localStorage.getItem('workout-tracker-data') || '[]');
    setWorkouts(savedWorkouts);
  }, []);

  const handleAddWorkout = () => {
    if (!newWorkout.type || !newWorkout.duration || !newWorkout.sets || !newWorkout.reps) return;

    const workout = {
      id: Date.now().toString(),
      type: newWorkout.type,
      duration: parseInt(newWorkout.duration),
      sets: parseInt(newWorkout.sets),
      reps: parseInt(newWorkout.reps),
      weight: parseInt(newWorkout.weight) || 0,
      date: newWorkout.date,
      calories: Math.round(parseInt(newWorkout.duration) * 7.5) // Rough estimate: 7.5 kcal/min
    };

    const updatedWorkouts = [...workouts, workout];
    setWorkouts(updatedWorkouts);
    localStorage.setItem('workout-tracker-data', JSON.stringify(updatedWorkouts));
    setNewWorkout({
      type: '',
      duration: '',
      sets: '',
      reps: '',
      weight: '',
      date: new Date().toISOString().split('T')[0]
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleDeleteData = () => {
    localStorage.removeItem('workout-tracker-data');
    setWorkouts([]);
    setShowDeleteConfirm(false);
  };

  const getWorkoutStats = () => {
    const totalWorkouts = workouts.length;
    const totalDuration = workouts.reduce((sum, w) => sum + w.duration, 0);
    const totalCalories = workouts.reduce((sum, w) => sum + w.calories, 0);
    const avgSets = workouts.length > 0 ? (workouts.reduce((sum, w) => sum + w.sets, 0) / workouts.length).toFixed(1) : 0;

    const today = new Date().toISOString().split('T')[0];
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    const weeklyWorkouts = workouts.filter(w => new Date(w.date) >= weekStart).length;

    return {
      totalWorkouts,
      totalDuration,
      totalCalories,
      avgSets,
      weeklyWorkouts,
      weeklyProgress: Math.min((weeklyWorkouts / goals.weeklyWorkouts) * 100, 100)
    };
  };

  const getChartData = () => {
    const days = viewPeriod === 'weekly' ? 7 : viewPeriod === 'monthly' ? 30 : 365;
    const data = [];

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateString = date.toISOString().split('T')[0];

      const dayWorkouts = workouts.filter(w => w.date === dateString);
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
      fill: ['#0d6efd', '#198754', '#6f42c1', '#fd7e14'][index % 4]
    }));
  };

  const stats = getWorkoutStats();

  return (
    <div className={`min-h-screen bg-slate-50 transition-all duration-300 ${collapsed ? "lg:ml-20" : "lg:ml-64"}`}>
      <div className="p-6 md:p-8">
        <div className="flex flex-col md:flex-row justify-between md:items-center mb-8 gap-4">
          <h1 className="text-3xl font-bold text-slate-900">Workout Tracker</h1>
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/')}
              className="px-4 py-2 text-sm font-semibold rounded-md flex items-center gap-2 bg-gray-800 text-white hover:bg-gray-900 transition-colors"
            >
              <Dumbbell size={16} />
              Home
            </button>
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`px-4 py-2 text-sm font-semibold rounded-md flex items-center gap-2 transition-colors ${activeTab === 'dashboard' ? 'bg-indigo-600 text-white shadow' : 'bg-white text-slate-600 hover:bg-slate-100 border'}`}
            >
              <Target size={16} />
              Dashboard
            </button>
            <button
              onClick={() => setActiveTab('analytics')}
              className={`px-4 py-2 text-sm font-semibold rounded-md flex items-center gap-2 transition-colors ${activeTab === 'analytics' ? 'bg-indigo-600 text-white shadow' : 'bg-white text-slate-600 hover:bg-slate-100 border'}`}
            >
              <BarChart3 size={16} />
              Analytics
            </button>
          </div>
        </div>

        {activeTab === 'dashboard' && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard
                icon={Dumbbell}
                title="Total Workouts"
                value={stats.totalWorkouts}
                subValue={`${stats.weeklyWorkouts}/${goals.weeklyWorkouts} this week`}
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
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200">
              <div className="p-6">
                <h3 className="text-xl font-bold text-slate-800 mb-5 flex items-center">
                  <Dumbbell className="w-6 h-6 mr-3" style={{ color: '#0d6efd' }} />
                  Recent Workouts
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50 text-sm text-slate-600">
                      <tr>
                        <th className="p-3 font-semibold">Date</th>
                        <th className="p-3 font-semibold">Type</th>
                        <th className="p-3 font-semibold">Duration</th>
                        <th className="p-3 font-semibold">Sets</th>
                        <th className="p-3 font-semibold">Reps</th>
                        <th className="p-3 font-semibold">Weight</th>
                        <th className="p-3 font-semibold">Calories</th>
                      </tr>
                    </thead>
                    <tbody>
                      {workouts.slice(0, 5).map(workout => (
                        <tr key={workout.id} className="border-t border-slate-200">
                          <td className="p-3">{workout.date}</td>
                          <td className="p-3 font-medium text-slate-800">{workout.type}</td>
                          <td className="p-3">{workout.duration} min</td>
                          <td className="p-3">{workout.sets}</td>
                          <td className="p-3">{workout.reps}</td>
                          <td className="p-3">{workout.weight ? `${workout.weight} kg` : '-'}</td>
                          <td className="p-3">{workout.calories} kcal</td>
                        </tr>
                      ))}
                      {workouts.length === 0 && (
                        <tr>
                          <td colSpan="7" className="p-4 text-center text-slate-600">
                            No workouts logged. Add your first workout to get started!
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2">
                <InputCard icon={Dumbbell} title="Log Workout" color="#0d6efd">
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="flex items-center text-sm font-medium text-slate-700 mb-1">
                          <Calendar className="mr-2" size={16} />
                          Date
                        </label>
                        <input
                          type="date"
                          className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500"
                          value={newWorkout.date}
                          onChange={(e) => setNewWorkout({ ...newWorkout, date: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="flex items-center text-sm font-medium text-slate-700 mb-1">
                          <Dumbbell className="mr-2" size={16} />
                          Exercise Type
                        </label>
                        <input
                          type="text"
                          className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500"
                          value={newWorkout.type}
                          onChange={(e) => setNewWorkout({ ...newWorkout, type: e.target.value })}
                          placeholder="e.g., Bench Press, Running, Yoga"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="flex items-center text-sm font-medium text-slate-700 mb-1">
                          <Clock className="mr-2" size={16} />
                          Duration (min)
                        </label>
                        <input
                          type="number"
                          className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500"
                          value={newWorkout.duration}
                          onChange={(e) => setNewWorkout({ ...newWorkout, duration: e.target.value })}
                          min="1"
                          placeholder="30"
                        />
                      </div>
                      <div>
                        <label className="flex items-center text-sm font-medium text-slate-700 mb-1">
                          <Target className="mr-2" size={16} />
                          Sets
                        </label>
                        <input
                          type="number"
                          className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500"
                          value={newWorkout.sets}
                          onChange={(e) => setNewWorkout({ ...newWorkout, sets: e.target.value })}
                          min="1"
                          placeholder="3"
                        />
                      </div>
                      <div>
                        <label className="flex items-center text-sm font-medium text-slate-700 mb-1">
                          <Target className="mr-2" size={16} />
                          Reps
                        </label>
                        <input
                          type="number"
                          className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500"
                          value={newWorkout.reps}
                          onChange={(e) => setNewWorkout({ ...newWorkout, reps: e.target.value })}
                          min="1"
                          placeholder="10"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="flex items-center text-sm font-medium text-slate-700 mb-1">
                        <Dumbbell className="mr-2" size={16} />
                        Weight (kg, optional)
                      </label>
                      <input
                        type="number"
                        className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500"
                        value={newWorkout.weight}
                        onChange={(e) => setNewWorkout({ ...newWorkout, weight: e.target.value })}
                        min="0"
                        placeholder="50"
                      />
                    </div>
                    <button
                      className="w-full flex items-center justify-center px-4 py-2.5 bg-indigo-600 text-white font-semibold rounded-md shadow hover:bg-indigo-700 transition-colors disabled:bg-indigo-400 disabled:cursor-not-allowed"
                      onClick={handleAddWorkout}
                      disabled={!newWorkout.type || !newWorkout.duration || !newWorkout.sets || !newWorkout.reps}
                    >
                      <Plus className="mr-2" size={16} />
                      Log Workout
                    </button>
                    {saved && (
                      <div className="flex items-center p-3 bg-emerald-50 text-emerald-700 rounded-md text-sm">
                        <Award size={16} className="mr-2" />
                        Workout saved successfully!
                      </div>
                    )}
                  </div>
                </InputCard>
              </div>
              <div>
                <InputCard icon={Award} title="Weekly Progress" color="#198754">
                  <div className="text-center mb-4">
                    <div className="text-4xl font-bold text-slate-800">{stats.weeklyWorkouts} / {goals.weeklyWorkouts}</div>
                    <div className="text-sm text-slate-600">Workouts this week</div>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-4 mb-4">
                    <div
                      className="h-4 rounded-full"
                      style={{ width: `${stats.weeklyProgress}%`, backgroundColor: '#198754' }}
                    />
                  </div>
                  <button
                    className="w-full flex items-center justify-center px-4 py-2 border border-red-300 text-red-600 font-semibold rounded-md hover:bg-red-50 hover:border-red-500 transition-colors"
                    onClick={() => setShowDeleteConfirm(true)}
                  >
                    <Trash2 className="mr-2" size={16} />
                    Delete All Data
                  </button>
                </InputCard>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="space-y-8">
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col md:flex-row justify-between md:items-center gap-4">
              <h2 className="text-xl font-bold text-slate-800 flex items-center">
                <TrendingUp className="mr-3" style={{ color: '#0d6efd' }} />
                Workout Analytics
              </h2>
              <div className="flex-shrink-0">
                <span className="relative z-0 inline-flex shadow-sm rounded-md">
                  {['weekly', 'monthly', 'yearly'].map((period, i) => (
                    <button
                      key={period}
                      onClick={() => setViewPeriod(period)}
                      className={`relative inline-flex items-center px-4 py-2 text-sm font-medium transition-colors ${i === 0 ? 'rounded-l-md' : ''} ${i === 2 ? 'rounded-r-md' : ''} ${viewPeriod === period ? 'z-10 bg-indigo-50 border-indigo-500 text-indigo-600' : 'bg-white border-slate-300 text-slate-500 hover:bg-slate-50'}`}
                    >
                      {period.charAt(0).toUpperCase() + period.slice(1)}
                    </button>
                  ))}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center">
                  <TrendingUp className="mr-2" style={{ color: '#0d6efd' }} />
                  Workout Trends
                </h3>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={getChartData()} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="date" stroke="#64748b" fontSize={12} />
                      <YAxis stroke="#64748b" fontSize={12} />
                      <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '0.5rem' }} />
                      <Line
                        type="monotone"
                        dataKey="duration"
                        name="Duration (min)"
                        stroke="#0d6efd"
                        strokeWidth={3}
                        dot={{ fill: '#0d6efd', strokeWidth: 2, r: 6 }}
                      />
                      <Line
                        type="monotone"
                        dataKey="calories"
                        name="Calories (kcal)"
                        stroke="#198754"
                        strokeWidth={3}
                        dot={{ fill: '#198754', strokeWidth: 2, r: 6 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center">
                  <BarChart3 className="mr-2" style={{ color: '#6f42c1' }} />
                  Exercise Distribution
                </h3>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={getBarChartData()} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="name" stroke="#64748b" fontSize={12} />
                      <YAxis stroke="#64748b" fontSize={12} />
                      <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '0.5rem' }} />
                      <Bar dataKey="duration" name="Duration (min)" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
              <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center">
                <Award className="mr-2" style={{ color: '#6f42c1' }} />
                {viewPeriod.charAt(0).toUpperCase() + viewPeriod.slice(1)} Summary
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { label: 'Total Workouts', value: stats.totalWorkouts, unit: 'sessions', color: '#0d6efd' },
                  { label: 'Avg Duration', value: (stats.totalDuration / (workouts.length || 1)).toFixed(1), unit: 'min', color: '#198754' },
                  { label: 'Total Calories', value: Math.round(stats.totalCalories), unit: 'kcal', color: '#6f42c1' },
                  { label: 'Avg Sets', value: stats.avgSets, unit: 'sets', color: '#fd7e14' }
                ].map((stat, idx) => (
                  <div key={idx} className="text-center">
                    <p className="text-2xl font-bold" style={{ color: stat.color }}>{stat.value}</p>
                    <p className="text-sm text-slate-600">{stat.label}</p>
                    <p className="text-xs text-slate-500">{stat.unit}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
            <div className="bg-white p-7 rounded-lg shadow-xl w-full max-w-md m-4">
              <h2 className="text-xl font-bold text-slate-900 mb-2">Confirm Deletion</h2>
              <p className="text-slate-600 mb-6">Are you sure you want to delete ALL workout data? This action cannot be undone.</p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-800 font-semibold rounded-md hover:bg-slate-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteData}
                  className="px-4 py-2 bg-red-600 text-white font-semibold rounded-md hover:bg-red-700 transition-colors"
                >
                  Delete All Data
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default WorkoutTracker;