import React, { useState, useEffect, useCallback } from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell
} from 'recharts';
import { 
  HeartHandshake, BookOpen, Clock, Calendar, TrendingUp, BarChart2, 
  Save, Trash2, CheckCircle, Flame, StickyNote, History
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useSidebar } from '../../context/SidebarContext';

const COLORS = {
  prayer: '#4f46e5',
  jamaah: '#8b5cf6',
  quran: '#10b981',
  streak: '#f59e0b',
  goal: '#64748b',
  danger: '#ef4444'
};

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

const PrayerTracker = () => {
  const { collapsed } = useSidebar(); // Added to access sidebar state
  const [activeTab, setActiveTab] = useState('dashboard');
  const [viewPeriod, setViewPeriod] = useState('weekly');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [saved, setSaved] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [historicalData, setHistoricalData] = useState([]);
  const navigate = useNavigate();

  const [prayers, setPrayers] = useState({
    fajr: { prayed: false, time: '', jamaah: false },
    dhuhr: { prayed: false, time: '', jamaah: false },
    asr: { prayed: false, time: '', jamaah: false },
    maghrib: { prayed: false, time: '', jamaah: false },
    isha: { prayed: false, time: '', jamaah: false }
  });

  const [quran, setQuran] = useState({
    duration: 0, pages: 0, juz: '', notes: ''
  });

  useEffect(() => {
    const savedData = JSON.parse(localStorage.getItem('prayer-tracker-data') || '[]');
    setHistoricalData(savedData);
    const todayData = savedData.find(entry => entry.date === date);
    if (todayData) {
      setPrayers(todayData.prayers || { fajr: { prayed: false, time: '', jamaah: false }, dhuhr: { prayed: false, time: '', jamaah: false }, asr: { prayed: false, time: '', jamaah: false }, maghrib: { prayed: false, time: '', jamaah: false }, isha: { prayed: false, time: '', jamaah: false } });
      setQuran(todayData.quran || { duration: 0, pages: 0, juz: '', notes: '' });
    } else {
      setPrayers({ fajr: { prayed: false, time: '', jamaah: false }, dhuhr: { prayed: false, time: '', jamaah: false }, asr: { prayed: false, time: '', jamaah: false }, maghrib: { prayed: false, time: '', jamaah: false }, isha: { prayed: false, time: '', jamaah: false } });
      setQuran({ duration: 0, pages: 0, juz: '', notes: '' });
    }
  }, [date]);

  const handlePrayerChange = (prayer, field, value) => {
    setPrayers(prev => ({ ...prev, [prayer]: { ...prev[prayer], [field]: field === 'time' ? value : !prev[prayer][field] } }));
    setSaved(false);
  };

  const handleQuranChange = (field, value) => {
    setQuran(prev => ({ ...prev, [field]: field === 'duration' || field === 'pages' ? parseInt(value) || 0 : value }));
    setSaved(false);
  };

  const handleSave = () => {
    const newEntry = { date, prayers, quran, timestamp: new Date().toISOString() };
    const updatedHistory = historicalData.filter(entry => entry.date !== date);
    updatedHistory.push(newEntry);
    updatedHistory.sort((a, b) => new Date(b.date) - new Date(a.date));
    setHistoricalData(updatedHistory);
    localStorage.setItem('prayer-tracker-data', JSON.stringify(updatedHistory));
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleDeleteData = () => {
    localStorage.removeItem('prayer-tracker-data');
    setHistoricalData([]);
    setPrayers({ fajr: { prayed: false, time: '', jamaah: false }, dhuhr: { prayed: false, time: '', jamaah: false }, asr: { prayed: false, time: '', jamaah: false }, maghrib: { prayed: false, time: '', jamaah: false }, isha: { prayed: false, time: '', jamaah: false } });
    setQuran({ duration: 0, pages: 0, juz: '', notes: '' });
    setShowDeleteConfirm(false);
  };
  
  const getPrayerStats = useCallback(() => {
    const prayedCount = Object.values(prayers).filter(p => p.prayed).length;
    const jamaahCount = Object.values(prayers).filter(p => p.jamaah).length;
    return { prayedCount, jamaahCount, total: 5 };
  }, [prayers]);

  const getStreak = useCallback(() => {
    let streak = 0;
    const sortedData = [...historicalData].sort((a, b) => new Date(b.date) - new Date(a.date));
    for (const entry of sortedData) {
      if (Object.values(entry.prayers).filter(p => p.prayed).length >= 5) streak++;
      else break;
    }
    return streak;
  }, [historicalData]);

  const getChartData = useCallback(() => {
    const now = new Date();
    const data = [];
    if (viewPeriod === 'daily') {
      for (let i = 6; i >= 0; i--) {
        const day = new Date(now); day.setDate(day.getDate() - i);
        const dayStr = day.toISOString().split('T')[0];
        const dayData = historicalData.find(entry => entry.date === dayStr);
        data.push({ name: day.toLocaleDateString('en-US', { weekday: 'short' }), prayers: dayData ? Object.values(dayData.prayers).filter(p => p.prayed).length : 0, quran: dayData?.quran?.duration || 0, goal: 5 });
      }
    } else if (viewPeriod === 'weekly') {
      for (let i = 3; i >= 0; i--) {
        const weekStart = new Date(now); weekStart.setDate(weekStart.getDate() - (weekStart.getDay() + 7 * i));
        const weekEnd = new Date(weekStart); weekEnd.setDate(weekEnd.getDate() + 6);
        const weekData = historicalData.filter(entry => new Date(entry.date) >= weekStart && new Date(entry.date) <= weekEnd);
        data.push({ name: `Week ${4-i}`, prayers: weekData.length > 0 ? Math.round(weekData.reduce((sum, entry) => sum + Object.values(entry.prayers).filter(p => p.prayed).length, 0) / weekData.length * 10) / 10 : 0, quran: weekData.length > 0 ? Math.round(weekData.reduce((sum, entry) => sum + (entry.quran?.duration || 0), 0) / weekData.length) : 0, goal: 5 });
      }
    } else if (viewPeriod === 'monthly') {
      for (let i = 5; i >= 0; i--) {
        const month = new Date(now); month.setMonth(month.getMonth() - i);
        const monthData = historicalData.filter(entry => new Date(entry.date).getMonth() === month.getMonth() && new Date(entry.date).getFullYear() === month.getFullYear());
        data.push({ name: month.toLocaleDateString('en-US', { month: 'short' }), prayers: monthData.length > 0 ? Math.round(monthData.reduce((sum, entry) => sum + Object.values(entry.prayers).filter(p => p.prayed).length, 0) / monthData.length * 10) / 10 : 0, quran: monthData.length > 0 ? Math.round(monthData.reduce((sum, entry) => sum + (entry.quran?.duration || 0), 0) / monthData.length) : 0, goal: 5 });
      }
    }
    return data;
  }, [viewPeriod, historicalData]);

  const getPieChartData = useCallback(() => {
    return Object.entries(prayers)
      .filter(([, p]) => p.prayed)
      .map(([name, prayer]) => ({ name: name.charAt(0).toUpperCase() + name.slice(1), value: 1, color: prayer.jamaah ? COLORS.jamaah : COLORS.prayer }));
  }, [prayers]);
  
  const stats = getPrayerStats();
  const streak = getStreak();
  const chartData = getChartData();
  const pieData = getPieChartData();

  return (
    <div className={`min-h-screen bg-slate-50 transition-all duration-300 ${collapsed ? "lg:ml-20" : "lg:ml-64"}`}>
      <div className="p-6 md:p-8">
        <div className="flex flex-col md:flex-row justify-between md:items-center mb-8 gap-4">
          <h1 className="text-3xl font-bold text-slate-900">Prayer & Quran Tracker</h1>
          <div className="flex items-center gap-2">
            <button onClick={() => setActiveTab('dashboard')} className={`px-4 py-2 text-sm font-semibold rounded-md flex items-center gap-2 transition-colors ${activeTab === 'dashboard' ? 'bg-indigo-600 text-white shadow' : 'bg-white text-slate-600 hover:bg-slate-100 border'}`}>
              <HeartHandshake size={16} /> Dashboard
            </button>
            <button onClick={() => setActiveTab('analytics')} className={`px-4 py-2 text-sm font-semibold rounded-md flex items-center gap-2 transition-colors ${activeTab === 'analytics' ? 'bg-indigo-600 text-white shadow' : 'bg-white text-slate-600 hover:bg-slate-100 border'}`}>
              <TrendingUp size={16} /> Analytics
            </button>
          </div>
        </div>

        {activeTab === 'dashboard' && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard icon={HeartHandshake} title="Prayers Completed" value={`${stats.prayedCount}/${stats.total}`} subValue={`${Math.round((stats.prayedCount / stats.total) * 100)}% complete`} color={COLORS.prayer} />
              <StatCard icon={HeartHandshake} title="In Jama'ah" value={stats.jamaahCount} subValue={`${Math.round((stats.jamaahCount / stats.prayedCount) * 100 || 0)}% of prayed`} color={COLORS.jamaah} />
              <StatCard icon={BookOpen} title="Quran Recitation" value={`${quran.duration} min`} subValue={`${quran.pages} pages`} color={COLORS.quran} />
              <StatCard icon={Flame} title="Perfect Day Streak" value={streak} subValue="Days with all prayers" color={COLORS.streak} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2">
                <InputCard icon={HeartHandshake} title="Log Today's Prayers" color={COLORS.prayer}>
                  <div className="mb-6">
                    <label htmlFor="date-input" className="block text-sm font-medium text-slate-700 mb-1">Date</label>
                    <input id="date-input" type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full max-w-xs px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500"/>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead className="bg-slate-50 text-sm text-slate-600">
                        <tr>
                          <th className="p-3 font-semibold">Prayer</th>
                          <th className="p-3 font-semibold">Prayed</th>
                          <th className="p-3 font-semibold">Time</th>
                          <th className="p-3 font-semibold">Jama'ah</th>
                        </tr>
                      </thead>
                      <tbody>
                        {Object.entries(prayers).map(([prayer, data]) => (
                          <tr key={prayer} className="border-t border-slate-200">
                            <td className="p-3 font-medium text-slate-800 capitalize">{prayer}</td>
                            <td className="p-3">
                              <label className="relative inline-flex items-center cursor-pointer">
                                <input type="checkbox" checked={data.prayed} onChange={() => handlePrayerChange(prayer, 'prayed')} className="sr-only peer" />
                                <div className="w-11 h-6 bg-slate-200 rounded-full peer peer-focus:ring-2 peer-focus:ring-indigo-300 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                              </label>
                            </td>
                            <td className="p-3">
                              <input type="time" value={data.time} onChange={(e) => handlePrayerChange(prayer, 'time', e.target.value)} disabled={!data.prayed} className="w-full px-2 py-1 border border-slate-300 rounded-md disabled:bg-slate-100 disabled:cursor-not-allowed"/>
                            </td>
                            <td className="p-3">
                              <label className="relative inline-flex items-center cursor-pointer">
                                  <input type="checkbox" checked={data.jamaah} onChange={() => handlePrayerChange(prayer, 'jamaah')} disabled={!data.prayed} className="sr-only peer"/>
                                  <div className="w-11 h-6 bg-slate-200 rounded-full peer peer-focus:ring-2 peer-focus:ring-purple-300 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600 peer-disabled:cursor-not-allowed peer-disabled:opacity-50"></div>
                              </label>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </InputCard>
              </div>
              
              <div>
                <InputCard icon={BookOpen} title="Log Quran Recitation" color={COLORS.quran}>
                  <div className="space-y-4">
                    <div>
                      <label htmlFor="quran-duration" className="flex items-center text-sm font-medium text-slate-700 mb-1"><Clock size={14} className="mr-2"/>Duration (minutes)</label>
                      <input id="quran-duration" type="number" min="0" value={quran.duration} onChange={(e) => handleQuranChange('duration', e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-md"/>
                    </div>
                    <div>
                      <label htmlFor="quran-pages" className="flex items-center text-sm font-medium text-slate-700 mb-1"><BookOpen size={14} className="mr-2"/>Pages Read</label>
                      <input id="quran-pages" type="number" min="0" value={quran.pages} onChange={(e) => handleQuranChange('pages', e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-md"/>
                    </div>
                    <div>
                      <label htmlFor="quran-juz" className="flex items-center text-sm font-medium text-slate-700 mb-1"><History size={14} className="mr-2"/>Juz / Hizb</label>
                      <input id="quran-juz" type="text" placeholder="e.g., Juz 1, Hizb 2" value={quran.juz} onChange={(e) => handleQuranChange('juz', e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-md"/>
                    </div>
                    <div>
                      <label htmlFor="quran-notes" className="flex items-center text-sm font-medium text-slate-700 mb-1"><StickyNote size={14} className="mr-2"/>Notes</label>
                      <textarea id="quran-notes" rows="4" placeholder="Reflections or memorization progress..." value={quran.notes} onChange={(e) => handleQuranChange('notes', e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-md resize-none"/>
                    </div>
                    <div className="pt-2 space-y-3">
                      <button onClick={handleSave} className="w-full flex items-center justify-center px-4 py-2.5 bg-indigo-600 text-white font-semibold rounded-md shadow hover:bg-indigo-700 transition-colors">
                        <Save size={16} className="mr-2" /> Save Today's Data
                      </button>
                      {saved && <div className="flex items-center p-3 bg-emerald-50 text-emerald-700 rounded-md text-sm"><CheckCircle size={16} className="mr-2"/>Successfully saved!</div>}
                      <button onClick={() => setShowDeleteConfirm(true)} className="w-full flex items-center justify-center px-4 py-2 border border-red-300 text-red-600 font-semibold rounded-md hover:bg-red-50 hover:border-red-500 transition-colors">
                        <Trash2 size={16} className="mr-2" /> Delete All Data
                      </button>
                    </div>
                  </div>
                </InputCard>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="space-y-8">
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col md:flex-row justify-between md:items-center gap-4">
              <h2 className="text-xl font-bold text-slate-800 flex items-center"><TrendingUp className="mr-3 text-indigo-500" />Analytics</h2>
              <div className="flex-shrink-0">
                <span className="relative z-0 inline-flex shadow-sm rounded-md">
                  {['daily', 'weekly', 'monthly'].map((period, i) => (
                    <button key={period} onClick={() => setViewPeriod(period)} type="button" className={`relative inline-flex items-center px-4 py-2 text-sm font-medium transition-colors ${i === 0 ? 'rounded-l-md' : ''} ${i === 2 ? 'rounded-r-md' : ''} ${viewPeriod === period ? 'z-10 bg-indigo-50 border-indigo-500 text-indigo-600' : 'bg-white border-slate-300 text-slate-500 hover:bg-slate-50'}`}>
                      {period.charAt(0).toUpperCase() + period.slice(1)}
                    </button>
                  ))}
                </span>
              </div>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                <h3 className="text-lg font-semibold text-slate-800 mb-4">Prayer & Quran Trends</h3>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="name" stroke="#64748b" fontSize={12} />
                      <YAxis stroke="#64748b" fontSize={12} />
                      <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '0.5rem' }} />
                      <Line type="monotone" dataKey="prayers" name="Avg. Prayers" stroke={COLORS.prayer} strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                      <Line type="monotone" dataKey="quran" name="Avg. Quran (min)" stroke={COLORS.quran} strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                      <Line type="monotone" dataKey="goal" name="Goal" stroke={COLORS.goal} strokeWidth={2} strokeDasharray="5 5" dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                <h3 className="text-lg font-semibold text-slate-800 mb-4">Today's Prayer Status</h3>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={3} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                        {pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="flex justify-center items-center gap-4 text-xs mt-2">
                    <div className="flex items-center"><span className="w-3 h-3 rounded-sm mr-2" style={{backgroundColor: COLORS.prayer}}></span>Prayed</div>
                    <div className="flex items-center"><span className="w-3 h-3 rounded-sm mr-2" style={{backgroundColor: COLORS.jamaah}}></span>In Jama'ah</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
            <div className="bg-white p-7 rounded-lg shadow-xl w-full max-w-md m-4">
              <h2 className="text-xl font-bold text-slate-900 mb-2">Confirm Deletion</h2>
              <p className="text-slate-600 mb-6">Are you sure you want to delete ALL your prayer data? This action cannot be undone.</p>
              <div className="flex justify-end gap-3">
                <button onClick={() => setShowDeleteConfirm(false)} className="px-4 py-2 bg-slate-100 text-slate-800 font-semibold rounded-md hover:bg-slate-200">Cancel</button>
                <button onClick={handleDeleteData} className="px-4 py-2 bg-red-600 text-white font-semibold rounded-md hover:bg-red-700">Delete All Data</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PrayerTracker;