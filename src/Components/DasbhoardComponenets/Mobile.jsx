import React, { useState, useEffect } from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell
} from 'recharts';
import { 
  FaMobileAlt, FaChartLine, FaUsers, FaFilm, FaBriefcase, 
  FaTools, FaGamepad, FaBullseye, FaSave, FaRegStickyNote, 
  FaChartBar, FaCalendarAlt, FaRegClock, FaHistory, FaCheckCircle 
} from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { useSidebar } from '../../context/SidebarContext';
import { auth, db } from '../../firebase/firebase.config';
import { useAuthState } from 'react-firebase-hooks/auth';
import { collection, addDoc, onSnapshot } from 'firebase/firestore';
import { toast } from 'react-toastify';

const COLORS = ['#3B82F6', '#8B5CF6', '#10B981', '#F59E0B', '#EF4444', '#4F46E5'];

const StatCard = ({ icon: Icon, title, value, subValue, color }) => (
  <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 flex flex-col justify-between h-full transition-all hover:shadow-md">
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
  <div className="bg-white rounded-xl shadow-sm border border-slate-200 h-full transition-all hover:shadow-md">
    <div className="p-6">
      <div className="flex items-center mb-5">
        <Icon className="w-6 h-6 mr-3" style={{ color }} />
        <h3 className="text-xl font-bold text-slate-800">{title}</h3>
      </div>
      {children}
    </div>
  </div>
);

const MobileTracker = () => {
  const { collapsed } = useSidebar();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [activeView, setActiveView] = useState('weekly');
  const [dailyGoal, setDailyGoal] = useState(60);
  const [totalUsage, setTotalUsage] = useState(0);
  const [notes, setNotes] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [saved, setSaved] = useState(false);
  const [historicalData, setHistoricalData] = useState([]);
  const [user, loading, error] = useAuthState(auth);
  const navigate = useNavigate();

  const [usage, setUsage] = useState({
    social: 0,
    entertainment: 0,
    productivity: 0,
    utilities: 0,
    games: 0
  });

  useEffect(() => {
    if (!user) return;

    const usageRef = collection(db, 'users', user.uid, 'mobileUsage');
    const unsubscribe = onSnapshot(usageRef, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setHistoricalData(data);
      const todayData = data.find(entry => entry.date === date);
      if (todayData) {
        setUsage(todayData.usage);
        setNotes(todayData.notes || '');
        setDailyGoal(todayData.dailyGoal || 60);
        setTotalUsage(todayData.totalUsage || 0);
      } else {
        setUsage({ social: 0, entertainment: 0, productivity: 0, utilities: 0, games: 0 });
        setNotes('');
        setTotalUsage(0);
      }
    }, (err) => {
      toast.error(`Failed to fetch usage data: ${err.message}`);
    });

    return () => unsubscribe();
  }, [user, date]);

  const handleChange = (category, value) => {
    const newValue = parseInt(value) || 0;
    if (newValue < 0) {
      toast.error('Usage cannot be negative.');
      return;
    }
    const newUsage = { ...usage, [category]: newValue };
    setUsage(newUsage);
    setTotalUsage(Object.values(newUsage).reduce((a, b) => a + b, 0));
    setSaved(false);
  };

  const handleSave = async () => {
    if (!user) {
      toast.error('You must be logged in to save data.');
      return;
    }

    if (totalUsage === 0) {
      toast.error('Please enter some usage data before saving.');
      return;
    }

    try {
      const newEntry = {
        date,
        usage,
        notes,
        totalUsage,
        dailyGoal,
        timestamp: new Date().toISOString(),
        userId: user.uid
      };

      await addDoc(collection(db, 'users', user.uid, 'mobileUsage'), newEntry);
      setSaved(true);
      toast.success('Usage data saved successfully!');
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      toast.error(`Failed to save usage data: ${err.message}`);
    }
  };

  const getProgressColor = () => {
    const ratio = totalUsage / dailyGoal;
    if (ratio <= 0.6) return '#10B981';
    if (ratio <= 1) return '#F59E0B';
    return '#EF4444';
  };

  const getChartData = () => {
    const now = new Date();
    const data = [];

    if (activeView === 'daily') {
      for (let i = 6; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        const dayData = historicalData.find(entry => entry.date === dateStr);

        data.push({
          name: date.toLocaleDateString('en-US', { weekday: 'short' }),
          usage: dayData ? dayData.totalUsage : 0,
          goal: dayData ? dayData.dailyGoal : dailyGoal
        });
      }
    } else if (activeView === 'weekly') {
      for (let i = 3; i >= 0; i--) {
        const weekStart = new Date(now);
        weekStart.setDate(weekStart.getDate() - (weekStart.getDay() + 7 * i));
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 6);

        const weekData = historicalData.filter(entry => {
          const entryDate = new Date(entry.date);
          return entryDate >= weekStart && entryDate <= weekEnd;
        });

        const avgUsage = weekData.length > 0
          ? Math.round(weekData.reduce((sum, entry) => sum + entry.totalUsage, 0) / weekData.length)
          : 0;

        data.push({
          name: `Week ${i + 1}`,
          usage: avgUsage,
          goal: dailyGoal
        });
      }
    } else if (activeView === 'monthly') {
      for (let i = 5; i >= 0; i--) {
        const month = new Date(now);
        month.setMonth(month.getMonth() - i);

        const monthData = historicalData.filter(entry => {
          const entryDate = new Date(entry.date);
          return entryDate.getMonth() === month.getMonth() &&
            entryDate.getFullYear() === month.getFullYear();
        });

        const avgUsage = monthData.length > 0
          ? Math.round(monthData.reduce((sum, entry) => sum + entry.totalUsage, 0) / monthData.length)
          : 0;

        data.push({
          name: month.toLocaleDateString('en-US', { month: 'short' }),
          usage: avgUsage,
          goal: dailyGoal
        });
      }
    }

    return data;
  };

  const getPieChartData = () => {
    return Object.entries(usage).map(([key, value], index) => ({
      name: key.charAt(0).toUpperCase() + key.slice(1),
      value: value,
      color: COLORS[index % COLORS.length]
    }));
  };

  const getStats = () => {
    const thisWeekData = historicalData.filter(entry => {
      const entryDate = new Date(entry.date);
      const now = new Date();
      const weekStart = new Date(now.setDate(now.getDate() - now.getDay()));
      return entryDate >= weekStart;
    });

    const avgThisWeek = thisWeekData.length > 0
      ? Math.round(thisWeekData.reduce((sum, entry) => sum + entry.totalUsage, 0) / thisWeekData.length)
      : 0;

    const totalThisWeek = thisWeekData.reduce((sum, entry) => sum + entry.totalUsage, 0);

    return {
      today: totalUsage,
      avgWeek: avgThisWeek,
      totalWeek: totalThisWeek,
      streak: calculateStreak()
    };
  };

  const calculateStreak = () => {
    let streak = 0;
    const sortedData = [...historicalData].sort((a, b) => new Date(b.date) - new Date(a.date));

    for (const entry of sortedData) {
      if (entry.totalUsage <= entry.dailyGoal) {
        streak++;
      } else {
        break; // Streak breaks if usage exceeds goal
      }
    }
    return streak;
  };

  const stats = getStats();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error) {
    toast.error(`Authentication error: ${error.message}`);
    return null;
  }

  return (
    <div className={`min-h-screen bg-slate-50 transition-all duration-300 ${collapsed ? 'lg:ml-20' : 'lg:ml-64'}`}>
      <div className="p-3 md:p-4 max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between md:items-center mb-8 gap-4">
          <div className="flex items-center gap-3 flex-wrap">
           
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`px-4 py-2 text-sm font-semibold rounded-md flex items-center gap-2 transition-colors ${activeTab === 'dashboard' ? 'bg-indigo-600 text-white shadow' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-300'}`}
            >
              <FaBullseye size={16} />
              Dashboard
            </button>
            <button
              onClick={() => setActiveTab('analytics')}
              className={`px-4 py-2 text-sm font-semibold rounded-md flex items-center gap-2 transition-colors ${activeTab === 'analytics' ? 'bg-indigo-600 text-white shadow' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-300'}`}
            >
              <FaChartBar size={16} />
              Analytics
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`px-4 py-2 text-sm font-semibold rounded-md flex items-center gap-2 transition-colors ${activeTab === 'history' ? 'bg-indigo-600 text-white shadow' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-300'}`}
            >
              <FaHistory size={16} />
              History
            </button>
          </div>
        </div>

        {activeTab === 'dashboard' && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard
                icon={FaRegClock}
                title="Today's Usage"
                value={`${totalUsage} min`}
                subValue={`${Math.round(totalUsage/60)}h ${totalUsage%60}m`}
                color="#3B82F6"
              />
              <StatCard
                icon={FaBullseye}
                title="Daily Goal"
                value={`${dailyGoal} min`}
                subValue={`${Math.round(dailyGoal/60)}h`}
                color="#8B5CF6"
              />
              <StatCard
                icon={FaChartLine}
                title="Progress"
                value={`${Math.round((totalUsage / dailyGoal) * 100)}%`}
                subValue={totalUsage > dailyGoal ? 'Over limit' : 'On track'}
                color={getProgressColor()}
              />
              <StatCard
                icon={FaCheckCircle}
                title="Goal Streak"
                value={stats.streak}
                subValue="Days meeting goal"
                color="#10B981"
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2">
                <InputCard icon={FaRegClock} title="Today's Usage Entry" color="#3B82F6">
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="flex items-center text-sm font-medium text-slate-700 mb-1">
                          <FaCalendarAlt className="mr-2" />
                          Date
                        </label>
                        <input
                          type="date"
                          className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500 text-sm"
                          value={date}
                          onChange={(e) => setDate(e.target.value)}
                          max={new Date().toISOString().split('T')[0]}
                        />
                      </div>
                      <div>
                        <label className="flex items-center text-sm font-medium text-slate-700 mb-1">
                          <FaBullseye className="mr-2" />
                          Daily Goal (minutes)
                        </label>
                        <input
                          type="number"
                          className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500 text-sm"
                          value={dailyGoal}
                          onChange={(e) => setDailyGoal(Math.max(30, parseInt(e.target.value) || 30))}
                          min="30"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                      {Object.entries(usage).map(([category, value]) => (
                        <div key={category}>
                          <label className="flex items-center text-sm font-medium text-slate-700 mb-1">
                            {category === 'social' && <FaUsers className="mr-2" />}
                            {category === 'entertainment' && <FaFilm className="mr-2" />}
                            {category === 'productivity' && <FaBriefcase className="mr-2" />}
                            {category === 'utilities' && <FaTools className="mr-2" />}
                            {category === 'games' && <FaGamepad className="mr-2" />}
                            {category.charAt(0).toUpperCase() + category.slice(1)}
                          </label>
                          <input
                            type="number"
                            className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500 text-sm"
                            value={value}
                            onChange={(e) => handleChange(category, e.target.value)}
                            min="0"
                          />
                        </div>
                      ))}
                    </div>
                    <div>
                      <label className="flex items-center text-sm font-medium text-slate-700 mb-1">
                        <FaChartBar className="mr-2" />
                        Total Screen Time Progress
                      </label>
                      <div className="w-full bg-slate-200 rounded-full h-5">
                        <div
                          className="h-5 rounded-full flex items-center text-xs text-white font-medium pl-2"
                          style={{
                            width: `${Math.min((totalUsage / dailyGoal) * 100, 100)}%`,
                            backgroundColor: getProgressColor()
                          }}
                        >
                          {totalUsage} / {dailyGoal} min ({Math.round((totalUsage / dailyGoal) * 100)}%)
                        </div>
                      </div>
                      {totalUsage > dailyGoal && (
                        <div className="text-red-600 mt-2 font-semibold text-sm">
                          ⚠️ Exceeded daily screen time goal by {totalUsage - dailyGoal} minutes!
                        </div>
                      )}
                    </div>
                  </div>
                </InputCard>
              </div>
              <div>
                <InputCard icon={FaRegStickyNote} title="Daily Reflection" color="#8B5CF6">
                  <div className="space-y-4">
                    <textarea
                      className="w-full px-3 py-2 border border-slate-300 rounded-md resize-none focus:ring-2 focus:ring-indigo-500 text-sm"
                      rows="8"
                      placeholder="Reflect on your screen time today. Any insights or goals for tomorrow?"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                    />
                    <button
                      className="w-full flex items-center justify-center px-4 py-2.5 bg-indigo-600 text-white font-semibold rounded-md shadow hover:bg-indigo-700 transition-colors disabled:bg-indigo-400 disabled:cursor-not-allowed"
                      onClick={handleSave}
                      disabled={totalUsage === 0}
                    >
                      <FaSave className="mr-2" />
                      Save Today's Data
                    </button>
                    {saved && (
                      <div className="flex items-center p-3 bg-emerald-50 text-emerald-700 rounded-md text-sm">
                        <FaCheckCircle size={16} className="mr-2" />
                        Successfully saved your usage data!
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
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col md:flex-row justify-between md:items-center gap-4">
              <h2 className="text-xl font-bold text-slate-800 flex items-center">
                <FaChartLine className="mr-3" style={{ color: '#3B82F6' }} />
                Usage Analytics
              </h2>
              <div className="flex-shrink-0">
                <span className="relative z-0 inline-flex shadow-sm rounded-md">
                  {['daily', 'weekly', 'monthly'].map((period, i) => (
                    <button
                      key={period}
                      onClick={() => setActiveView(period)}
                      className={`relative inline-flex items-center px-4 py-2 text-sm font-medium transition-colors ${i === 0 ? 'rounded-l-md' : ''} ${i === 2 ? 'rounded-r-md' : ''} ${activeView === period ? 'z-10 bg-indigo-50 border-indigo-500 text-indigo-600' : 'bg-white border-slate-300 text-slate-500 hover:bg-slate-50'}`}
                    >
                      {period.charAt(0).toUpperCase() + period.slice(1)}
                    </button>
                  ))}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center">
                  <FaChartLine className="mr-2" />
                  Usage Trends - {activeView.charAt(0).toUpperCase() + activeView.slice(1)}
                </h3>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={getChartData()} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="name" stroke="#64748b" fontSize={12} />
                      <YAxis stroke="#64748b" fontSize={12} />
                      <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '0.5rem' }} formatter={(value) => `${value} min`} />
                      <Line
                        type="monotone"
                        dataKey="usage"
                        name="Usage (min)"
                        stroke="#3B82F6"
                        strokeWidth={3}
                        dot={{ fill: '#3B82F6', strokeWidth: 2, r: 6 }}
                      />
                      <Line
                        type="monotone"
                        dataKey="goal"
                        name="Goal (min)"
                        stroke="#8B5CF6"
                        strokeWidth={2}
                        strokeDasharray="5 5"
                        dot={{ fill: '#8B5CF6', strokeWidth: 2, r: 4 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center">
                  <FaBullseye className="mr-2" />
                  Today's Usage Breakdown
                </h3>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={getPieChartData()}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {getPieChartData().map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => `${value} min`} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
              <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center">
                <FaChartBar className="mr-2" />
                {activeView.charAt(0).toUpperCase() + activeView.slice(1)} Summary
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { label: 'Avg Usage', value: (getChartData().reduce((sum, d) => sum + d.usage, 0) / getChartData().length).toFixed(1), unit: 'min', color: '#3B82F6' },
                  { label: 'Goal Met', value: getChartData().filter(d => d.usage <= d.goal).length, unit: 'times', color: '#10B981' },
                  { label: 'Max Usage', value: Math.max(...getChartData().map(d => d.usage), 0), unit: 'min', color: '#EF4444' },
                  { label: 'Min Usage', value: Math.min(...getChartData().map(d => d.usage, 0)), unit: 'min', color: '#F59E0B' }
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

        {activeTab === 'history' && (
          <div className="space-y-8">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
              <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center">
                <FaHistory className="mr-3" style={{ color: '#3B82F6' }} />
                Usage History
              </h2>
              <div className="block md:hidden text-center p-8 border-2 border-dashed rounded-lg bg-slate-50 text-slate-600">
                <svg className="mx-auto mb-4 h-12 w-12 text-slate-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-1.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25A2.25 2.25 0 015.25 3h13.5A2.25 2.25 0 0121 5.25z" />
                </svg>
                <h3 className="font-bold text-slate-800">This View is for Desktop</h3>
                <p className="text-sm mt-1">
                  To see your detailed usage history, please switch to a larger screen.
                </p>
              </div>
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full min-w-[800px] text-left text-sm">
                  <thead className="bg-slate-50 text-slate-600">
                    <tr>
                      <th className="p-4 font-semibold">Date</th>
                      <th className="p-4 font-semibold">Total Usage</th>
                      <th className="p-4 font-semibold">Daily Goal</th>
                      <th className="p-4 font-semibold">Status</th>
                      <th className="p-4 font-semibold">Social</th>
                      <th className="p-4 font-semibold">Entertainment</th>
                      <th className="p-4 font-semibold">Productivity</th>
                      <th className="p-4 font-semibold">Utilities</th>
                      <th className="p-4 font-semibold">Games</th>
                      <th className="p-4 font-semibold">Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {historicalData.sort((a, b) => new Date(b.date) - new Date(a.date)).map((entry, index) => (
                      <tr key={index} className="border-t border-slate-200 hover:bg-slate-50">
                        <td className="p-4 whitespace-nowrap">{entry.date}</td>
                        <td className="p-4 font-medium">{entry.totalUsage} min</td>
                        <td className="p-4">{entry.dailyGoal} min</td>
                        <td className="p-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${entry.totalUsage <= entry.dailyGoal ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                            {entry.totalUsage <= entry.dailyGoal ? 'Met Goal' : 'Over Goal'}
                          </span>
                        </td>
                        <td className="p-4">{entry.usage.social} min</td>
                        <td className="p-4">{entry.usage.entertainment} min</td>
                        <td className="p-4">{entry.usage.productivity} min</td>
                        <td className="p-4">{entry.usage.utilities} min</td>
                        <td className="p-4">{entry.usage.games} min</td>
                        <td className="p-4">{entry.notes || '-'}</td>
                      </tr>
                    ))}
                    {historicalData.length === 0 && (
                      <tr>
                        <td colSpan="10" className="p-4 text-center text-slate-600">
                          No usage data available. Start tracking your mobile usage on the Dashboard tab!
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MobileTracker;