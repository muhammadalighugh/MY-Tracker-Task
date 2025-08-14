import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  Moon, 
  Droplets, 
  Brain, 
  Plus, 
  BarChart3, 
  Calendar,
  Target,
  TrendingUp,
  Award,
  Clock,
  Heart
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { useNavigate } from 'react-router-dom';
import { useSidebar } from '../../context/SidebarContext';

const StatCard = ({ icon: Icon, title, current, goal, unit, color, progress }) => (
  <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 flex flex-col justify-between h-full">
    <div>
      <div className="flex items-center text-slate-500 mb-2">
        <Icon className="w-5 h-5 mr-2" style={{ color }} />
        <h3 className="font-semibold text-sm">{title}</h3>
      </div>
      <div className="flex items-baseline">
        <p className="text-3xl font-bold text-slate-800">{current}</p>
        <p className="text-sm text-slate-600 ml-1">/ {goal} {unit}</p>
      </div>
    </div>
    <div className="mt-3">
      <p className="text-lg font-bold text-right" style={{ color }}>{Math.round(progress)}%</p>
      <p className="text-xs text-slate-400 text-right">Complete</p>
      <div className="w-full bg-slate-200 rounded-full h-3">
        <div
          className="h-3 rounded-full"
          style={{ width: `${progress}%`, backgroundColor: color }}
        />
      </div>
    </div>
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

const DietTracker = () => {
  const { collapsed } = useSidebar();
  const [exerciseType, setExerciseType] = useState('');
  const [exerciseDuration, setExerciseDuration] = useState('');
  const [sleepHours, setSleepHours] = useState('');
  const [sleepQuality, setSleepQuality] = useState('');
  const [meditationDuration, setMeditationDuration] = useState('');
  const [waterIntake, setWaterIntake] = useState(0);
  const [healthData, setHealthData] = useState([]);
  const [viewPeriod, setViewPeriod] = useState('weekly');
  const [activeTab, setActiveTab] = useState('dashboard');
  const navigate = useNavigate();

  const goals = {
    water: 8,
    sleep: 8,
    exercise: 30,
    meditation: 15
  };

  const getTodayString = () => {
    return new Date().toISOString().split('T')[0];
  };

  useEffect(() => {
    const today = getTodayString();
    const todayData = healthData.find(d => d.date === today);
    if (!todayData) {
      const newEntry = {
        date: today,
        exercise: [],
        sleep: { hours: 0, quality: 0 },
        water: 0,
        meditation: 0
      };
      setHealthData(prev => [...prev, newEntry]);
    }
  }, []);

  const addExercise = () => {
    if (!exerciseType || !exerciseDuration) return;
    
    const today = getTodayString();
    setHealthData(prev => prev.map(day => 
      day.date === today 
        ? {
            ...day,
            exercise: [...day.exercise, {
              type: exerciseType,
              duration: parseInt(exerciseDuration),
              id: Date.now()
            }]
          }
        : day
    ));
    
    setExerciseType('');
    setExerciseDuration('');
  };

  const addSleep = () => {
    if (!sleepHours || !sleepQuality) return;
    
    const today = getTodayString();
    setHealthData(prev => prev.map(day => 
      day.date === today 
        ? {
            ...day,
            sleep: {
              hours: parseFloat(sleepHours),
              quality: parseInt(sleepQuality)
            }
          }
        : day
    ));
    
    setSleepHours('');
    setSleepQuality('');
  };

  const addWater = () => {
    const today = getTodayString();
    setHealthData(prev => prev.map(day => 
      day.date === today 
        ? { ...day, water: day.water + 1 }
        : day
    ));
    setWaterIntake(prev => prev + 1);
  };

  const addMeditation = () => {
    if (!meditationDuration) return;
    
    const today = getTodayString();
    setHealthData(prev => prev.map(day => 
      day.date === today 
        ? { ...day, meditation: day.meditation + parseInt(meditationDuration) }
        : day
    ));
    
    setMeditationDuration('');
  };

  const getTodayData = () => {
    const today = getTodayString();
    return healthData.find(d => d.date === today) || {
      date: today,
      exercise: [],
      sleep: { hours: 0, quality: 0 },
      water: 0,
      meditation: 0
    };
  };

  const getChartData = () => {
    const days = viewPeriod === 'weekly' ? 7 : viewPeriod === 'monthly' ? 30 : 365;
    const data = [];
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateString = date.toISOString().split('T')[0];
      
      const dayData = healthData.find(d => d.date === dateString);
      const totalExercise = dayData?.exercise.reduce((sum, ex) => sum + ex.duration, 0) || 0;
      
      data.push({
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        water: dayData?.water || 0,
        sleep: dayData?.sleep.hours || 0,
        exercise: totalExercise,
        meditation: dayData?.meditation || 0,
        sleepQuality: dayData?.sleep.quality || 0
      });
    }
    
    return data;
  };

  const todayData = getTodayData();
  const totalExerciseToday = todayData.exercise.reduce((sum, ex) => sum + ex.duration, 0);
  const getProgress = (current, goal) => Math.min((current / goal) * 100, 100);

  return (
    <div className={`min-h-screen bg-slate-50 transition-all duration-300 ${collapsed ? "lg:ml-20" : "lg:ml-64"}`}>
      <div className="p-6 md:p-8">
        <div className="flex flex-col md:flex-row justify-between md:items-center mb-8 gap-4">
          <h1 className="text-3xl font-bold text-slate-900">Health Tracker</h1>
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/')}
              className="px-4 py-2 text-sm font-semibold rounded-md flex items-center gap-2 bg-gray-800 text-white hover:bg-gray-900 transition-colors"
            >
              <Heart size={16} />
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
                icon={Droplets}
                title="Water Intake"
                current={todayData.water}
                goal={goals.water}
                unit="cups"
                color="#0d6efd"
                progress={getProgress(todayData.water, goals.water)}
              />
              <StatCard
                icon={Moon}
                title="Sleep"
                current={todayData.sleep.hours}
                goal={goals.sleep}
                unit="hours"
                color="#6f42c1"
                progress={getProgress(todayData.sleep.hours, goals.sleep)}
              />
              <StatCard
                icon={Activity}
                title="Exercise"
                current={totalExerciseToday}
                goal={goals.exercise}
                unit="min"
                color="#198754"
                progress={getProgress(totalExerciseToday, goals.exercise)}
              />
              <StatCard
                icon={Brain}
                title="Meditation"
                current={todayData.meditation}
                goal={goals.meditation}
                unit="min"
                color="#fd7e14"
                progress={getProgress(todayData.meditation, goals.meditation)}
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div>
                <InputCard icon={Activity} title="Log Exercise" color="#198754">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Exercise Type</label>
                      <input
                        type="text"
                        value={exerciseType}
                        onChange={(e) => setExerciseType(e.target.value)}
                        placeholder="e.g., Running, Weightlifting, Yoga"
                        className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Duration (minutes)</label>
                      <input
                        type="number"
                        value={exerciseDuration}
                        onChange={(e) => setExerciseDuration(e.target.value)}
                        placeholder="30"
                        className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                    <button
                      onClick={addExercise}
                      className="w-full flex items-center justify-center px-4 py-2.5 bg-green-600 text-white font-semibold rounded-md shadow hover:bg-green-700 transition-colors"
                    >
                      <Plus className="mr-2" size={16} />
                      Add Exercise
                    </button>
                    {todayData.exercise.length > 0 && (
                      <div className="mt-4">
                        <h4 className="text-sm font-semibold text-slate-800 mb-2">Today's Exercises:</h4>
                        {todayData.exercise.map((ex, idx) => (
                          <div key={idx} className="flex justify-between items-center p-3 mb-2 rounded-md bg-green-50">
                            <span className="font-medium text-slate-800">{ex.type}</span>
                            <span className="font-bold text-green-600">{ex.duration} min</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </InputCard>
              </div>
              <div>
                <InputCard icon={Moon} title="Log Sleep" color="#6f42c1">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Hours Slept</label>
                      <input
                        type="number"
                        step="0.5"
                        value={sleepHours}
                        onChange={(e) => setSleepHours(e.target.value)}
                        placeholder="8"
                        className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Sleep Quality (1-10)</label>
                      <input
                        type="number"
                        min="1"
                        max="10"
                        value={sleepQuality}
                        onChange={(e) => setSleepQuality(e.target.value)}
                        placeholder="8"
                        className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                    <button
                      onClick={addSleep}
                      className="w-full flex items-center justify-center px-4 py-2.5 bg-purple-600 text-white font-semibold rounded-md shadow hover:bg-purple-700 transition-colors"
                    >
                      <Plus className="mr-2" size={16} />
                      Log Sleep
                    </button>
                    {todayData.sleep.hours > 0 && (
                      <div className="mt-4 p-3 rounded-md bg-purple-50">
                        <div className="flex justify-between items-center">
                          <span className="font-medium text-slate-800">Last Sleep:</span>
                          <span className="font-bold text-purple-600">
                            {todayData.sleep.hours}h (Quality: {todayData.sleep.quality}/10)
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </InputCard>
              </div>
              <div>
                <InputCard icon={Droplets} title="Water Intake" color="#0d6efd">
                  <div className="text-center mb-4">
                    <div className="text-4xl font-bold text-slate-800">{todayData.water} / {goals.water}</div>
                    <div className="text-sm text-slate-600">Glasses consumed today</div>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-4 mb-4">
                    <div
                      className="h-4 rounded-full"
                      style={{ width: `${getProgress(todayData.water, goals.water)}%`, backgroundColor: '#0d6efd' }}
                    />
                  </div>
                  <button
                    onClick={addWater}
                    disabled={todayData.water >= goals.water}
                    className="w-full flex items-center justify-center px-4 py-2.5 bg-indigo-600 text-white font-semibold rounded-md shadow hover:bg-indigo-700 transition-colors disabled:bg-indigo-400 disabled:cursor-not-allowed"
                  >
                    <Plus className="mr-2" size={16} />
                    Add 1 Glass
                  </button>
                  {todayData.water >= goals.water && (
                    <div className="flex items-center justify-center text-green-600 font-semibold mt-3">
                      <Award className="mr-2" size={16} />
                      Goal Achieved!
                    </div>
                  )}
                </InputCard>
              </div>
              <div>
                <InputCard icon={Brain} title="Log Meditation" color="#fd7e14">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Duration (minutes)</label>
                      <input
                        type="number"
                        value={meditationDuration}
                        onChange={(e) => setMeditationDuration(e.target.value)}
                        placeholder="15"
                        className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                    <button
                      onClick={addMeditation}
                      className="w-full flex items-center justify-center px-4 py-2.5 bg-orange-600 text-white font-semibold rounded-md shadow hover:bg-orange-700 transition-colors"
                    >
                      <Plus className="mr-2" size={16} />
                      Add Meditation
                    </button>
                    {todayData.meditation > 0 && (
                      <div className="mt-4 p-3 rounded-md bg-orange-50">
                        <div className="flex justify-between items-center">
                          <span className="font-medium text-slate-800">Total Today:</span>
                          <span className="font-bold text-orange-600">{todayData.meditation} minutes</span>
                        </div>
                      </div>
                    )}
                  </div>
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
                Health Analytics
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
                  <Droplets className="mr-2" style={{ color: '#0d6efd' }} />
                  Water & Sleep Tracking
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
                        dataKey="water"
                        name="Water (cups)"
                        stroke="#0d6efd"
                        strokeWidth={3}
                        dot={{ fill: '#0d6efd', strokeWidth: 2, r: 6 }}
                      />
                      <Line
                        type="monotone"
                        dataKey="sleep"
                        name="Sleep (hours)"
                        stroke="#6f42c1"
                        strokeWidth={3}
                        dot={{ fill: '#6f42c1', strokeWidth: 2, r: 6 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center">
                  <Activity className="mr-2" style={{ color: '#198754' }} />
                  Exercise & Meditation
                </h3>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={getChartData()} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="date" stroke="#64748b" fontSize={12} />
                      <YAxis stroke="#64748b" fontSize={12} />
                      <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '0.5rem' }} />
                      <Bar dataKey="exercise" name="Exercise (min)" fill="#198754" />
                      <Bar dataKey="meditation" name="Meditation (min)" fill="#fd7e14" />
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
                  { label: 'Avg Water', value: (getChartData().reduce((sum, d) => sum + d.water, 0) / getChartData().length).toFixed(1), unit: 'cups', color: '#0d6efd' },
                  { label: 'Avg Sleep', value: (getChartData().reduce((sum, d) => sum + d.sleep, 0) / getChartData().length).toFixed(1), unit: 'hours', color: '#6f42c1' },
                  { label: 'Total Exercise', value: getChartData().reduce((sum, d) => sum + d.exercise, 0), unit: 'min', color: '#198754' },
                  { label: 'Total Meditation', value: getChartData().reduce((sum, d) => sum + d.meditation, 0), unit: 'min', color: '#fd7e14' }
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
      </div>
    </div>
  );
};

export default DietTracker;