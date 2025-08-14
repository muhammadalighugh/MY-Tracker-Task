import React, { useState, useEffect } from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell
} from 'recharts';
import { 
  FaMobileAlt, FaChartLine, FaUsers, FaFilm, FaBriefcase, 
  FaTools, FaGamepad, FaBullseye, FaSave, FaRegStickyNote, 
  FaChartBar, FaCalendarAlt, FaRegClock, FaTrash, FaCheckCircle 
} from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { useSidebar } from '../../context/SidebarContext';

const COLORS = ['#3B82F6', '#8B5CF6', '#10B981', '#F59E0B', '#EF4444', '#4F46E5'];

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
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const navigate = useNavigate();

  const [usage, setUsage] = useState({
    social: 0,
    entertainment: 0,
    productivity: 0,
    utilities: 0,
    games: 0
  });

  useEffect(() => {
    const savedData = JSON.parse(localStorage.getItem('mobile-usage-data') || '[]');
    setHistoricalData(savedData);

    const todayData = savedData.find(entry => entry.date === date);
    if (todayData) {
      setUsage(todayData.usage);
      setNotes(todayData.notes);
      setDailyGoal(todayData.dailyGoal);
      setTotalUsage(todayData.totalUsage);
    }
  }, [date]);

  const handleChange = (category, value) => {
    const newUsage = { ...usage, [category]: parseInt(value) || 0 };
    setUsage(newUsage);
    setTotalUsage(Object.values(newUsage).reduce((a, b) => a + b, 0));
    setSaved(false);
  };

  const handleSave = () => {
    const newEntry = {
      date,
      usage,
      notes,
      totalUsage,
      dailyGoal,
      timestamp: new Date().toISOString()
    };

    const updatedHistory = historicalData.filter(entry => entry.date !== date);
    updatedHistory.push(newEntry);
    updatedHistory.sort((a, b) => new Date(b.date) - new Date(a.date));

    setHistoricalData(updatedHistory);
    localStorage.setItem('mobile-usage-data', JSON.stringify(updatedHistory));
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleDeleteData = () => {
    localStorage.removeItem('mobile-usage-data');
    setHistoricalData([]);
    setUsage({ social: 0, entertainment: 0, productivity: 0, utilities: 0, games: 0 });
    setTotalUsage(0);
    setNotes('');
    setShowDeleteConfirm(false);
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
    return Object.entries(usage).map(([key, value]) => ({
      name: key.charAt(0).toUpperCase() + key.slice(1),
      value: value,
      color: COLORS[Object.keys(usage).indexOf(key)]
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
        break;
      }
    }
    return streak;
  };

  const stats = getStats();

  return (
    <div className={`min-h-screen bg-slate-50 transition-all duration-300 ${collapsed ? "lg:ml-20" : "lg:ml-64"}`}>
      <div className="p-6 md:p-8">
        <div className="flex flex-col md:flex-row justify-between md:items-center mb-8 gap-4">
          <h1 className="text-3xl font-bold text-slate-900">Mobile Tracker</h1>
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/')}
              className="px-4 py-2 text-sm font-semibold rounded-md flex items-center gap-2 bg-gray-800 text-white hover:bg-gray-900 transition-colors"
            >
              <FaMobileAlt size={16} />
              Home
            </button>
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`px-4 py-2 text-sm font-semibold rounded-md flex items-center gap-2 transition-colors ${activeTab === 'dashboard' ? 'bg-indigo-600 text-white shadow' : 'bg-white text-slate-600 hover:bg-slate-100 border'}`}
            >
              <FaBullseye size={16} />
              Dashboard
            </button>
            <button
              onClick={() => setActiveTab('analytics')}
              className={`px-4 py-2 text-sm font-semibold rounded-md flex items-center gap-2 transition-colors ${activeTab === 'analytics' ? 'bg-indigo-600 text-white shadow' : 'bg-white text-slate-600 hover:bg-slate-100 border'}`}
            >
              <FaChartBar size={16} />
              Analytics
            </button>
          </div>
        </div>

        {activeTab === 'dashboard' && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard
                icon={FaRegClock}
                title="Total Usage"
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
                title="Day Streak"
                value={calculateStreak()}
                subValue="Days under limit"
                color="#10B981"
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2">
                <InputCard icon={FaRegClock} title="Today's Usage Entry" color="#3B82F6">
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="flex items-center text-sm font-medium text-slate-700 mb-1">
                          <FaCalendarAlt className="mr-2" />
                          Date
                        </label>
                        <input
                          type="date"
                          className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500"
                          value={date}
                          onChange={(e) => setDate(e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="flex items-center text-sm font-medium text-slate-700 mb-1">
                          <FaBullseye className="mr-2" />
                          Daily Goal (minutes)
                        </label>
                        <input
                          type="number"
                          className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500"
                          value={dailyGoal}
                          onChange={(e) => setDailyGoal(parseInt(e.target.value) || 0)}
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
                            className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500"
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
                        <div className="text-red-600 mt-2 font-semibold">
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
                      className="w-full px-3 py-2 border border-slate-300 rounded-md resize-none focus:ring-2 focus:ring-indigo-500"
                      rows="8"
                      placeholder="How did you use your screen time today? Any insights or goals for tomorrow?"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                    />
                    <button
                      className="w-full flex items-center justify-center px-4 py-2.5 bg-indigo-600 text-white font-semibold rounded-md shadow hover:bg-indigo-700 transition-colors"
                      onClick={handleSave}
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
                    <button
                      className="w-full flex items-center justify-center px-4 py-2 border border-red-300 text-red-600 font-semibold rounded-md hover:bg-red-50 hover:border-red-500 transition-colors"
                      onClick={() => setShowDeleteConfirm(true)}
                    >
                      <FaTrash className="mr-2" />
                      Delete All Data
                    </button>
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
                    <LineChart data={getChartData()} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="name" stroke="#64748b" fontSize={12} />
                      <YAxis stroke="#64748b" fontSize={12} />
                      <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '0.5rem' }} />
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
                  Today's Breakdown
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
                      <Tooltip />
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
                  { label: 'Max Usage', value: Math.max(...getChartData().map(d => d.usage)), unit: 'min', color: '#EF4444' },
                  { label: 'Min Usage', value: Math.min(...getChartData().map(d => d.usage)), unit: 'min', color: '#F59E0B' }
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
              <p className="text-slate-600 mb-6">Are you sure you want to delete ALL your mobile usage data? This action cannot be undone.</p>
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

export default MobileTracker;