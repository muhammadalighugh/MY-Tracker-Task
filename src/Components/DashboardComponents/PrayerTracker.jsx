import React, { useState, useEffect, useCallback } from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell
} from 'recharts';
import { 
  HeartHandshake, BookOpen, TrendingUp, 
  Save, Trash2, CheckCircle, Flame, StickyNote, History, Clock
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useSidebar } from '../../context/SidebarContext';
import { collection, addDoc, getDocs, updateDoc, doc, deleteDoc, query, orderBy } from 'firebase/firestore';
import { db, auth } from '../../firebase/firebase.config';
import { useAuthState } from 'react-firebase-hooks/auth';
import { toast } from 'react-toastify';

const COLORS = {
  prayer: '#4f46e5',
  jamaah: '#8b5cf6',
  quran: '#10b981',
  streak: '#f59e0b',
  goal: '#64748b',
  danger: '#ef4444'
};

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

const PrayerTracker = () => {
  const { collapsed } = useSidebar();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [viewPeriod, setViewPeriod] = useState('weekly');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [saved, setSaved] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const [prayerData, setPrayerData] = useState([]);
  const [quranData, setQuranData] = useState([]);
  const [user, loading, error] = useAuthState(auth);
  const navigate = useNavigate();

  const [prayers, setPrayers] = useState({
    fajr: { prayed: false, jamaah: false },
    dhuhr: { prayed: false, jamaah: false },
    asr: { prayed: false, jamaah: false },
    maghrib: { prayed: false, jamaah: false },
    isha: { prayed: false, jamaah: false }
  });

  const [quran, setQuran] = useState({
    duration: 0,
    pages: 0,
    juz: '',
    notes: ''
  });

  useEffect(() => {
    if (loading || !user) return;
    const fetchData = async () => {
      try {
        const prayerCollection = collection(db, 'users', user.uid, 'prayerData');
        const prayerQuery = query(prayerCollection, orderBy('date', 'desc'));
        const prayerSnapshot = await getDocs(prayerQuery);
        const prayerData = prayerSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setPrayerData(prayerData);

        const quranCollection = collection(db, 'users', user.uid, 'quranData');
        const quranQuery = query(quranCollection, orderBy('date', 'desc'));
        const quranSnapshot = await getDocs(quranQuery);
        const quranData = quranSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setQuranData(quranData);

        const todayPrayer = prayerData.find(entry => entry.date === date);
        setPrayers(todayPrayer?.prayers || {
          fajr: { prayed: false, jamaah: false },
          dhuhr: { prayed: false, jamaah: false },
          asr: { prayed: false, jamaah: false },
          maghrib: { prayed: false, jamaah: false },
          isha: { prayed: false, jamaah: false }
        });

        const todayQuran = quranData.find(entry => entry.date === date);
        setQuran(todayQuran || { duration: 0, pages: 0, juz: '', notes: '' });
      } catch (err) {
        console.error('Error fetching data:', err);
        toast.error('Failed to load data. Please try again.');
      }
    };
    fetchData();
  }, [date, user, loading]);

  useEffect(() => {
    if (error) {
      toast.error('Authentication error: ' + error.message);
      navigate('/signin');
    }
    if (!loading && !user) {
      toast.error('Please sign in to access the tracker');
      navigate('/signin');
    }
  }, [user, loading, error, navigate]);

  const handlePrayerChange = (prayer, field) => {
    setPrayers(prev => ({ ...prev, [prayer]: { ...prev[prayer], [field]: !prev[prayer][field] } }));
    setSaved(false);
  };

  const handleQuranChange = (field, value) => {
    setQuran(prev => ({ ...prev, [field]: field === 'duration' || field === 'pages' ? parseInt(value) || 0 : value }));
    setSaved(false);
  };

  const handleSave = async () => {
    if (!user) {
      toast.error('Please sign in to save data');
      return;
    }
    try {
      const prayerCollection = collection(db, 'users', user.uid, 'prayerData');
      const quranCollection = collection(db, 'users', user.uid, 'quranData');
      const prayerEntry = { date, prayers, timestamp: new Date().toISOString() };
      const quranEntry = { date, ...quran, timestamp: new Date().toISOString() };

      const existingPrayer = prayerData.find(entry => entry.date === date);
      if (existingPrayer) {
        await updateDoc(doc(db, 'users', user.uid, 'prayerData', existingPrayer.id), prayerEntry);
      } else {
        await addDoc(prayerCollection, prayerEntry);
      }

      const existingQuran = quranData.find(entry => entry.date === date);
      if (existingQuran) {
        await updateDoc(doc(db, 'users', user.uid, 'quranData', existingQuran.id), quranEntry);
      } else {
        await addDoc(quranCollection, quranEntry);
      }

      const prayerSnapshot = await getDocs(query(prayerCollection, orderBy('date', 'desc')));
      const quranSnapshot = await getDocs(query(quranCollection, orderBy('date', 'desc')));
      setPrayerData(prayerSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setQuranData(quranSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
      toast.success('Data saved successfully');
    } catch (err) {
      console.error('Error saving data:', err);
      toast.error('Failed to save data. Please try again.');
    }
  };

  const handleDeleteData = async (type, docId) => {
    if (!user) return;
    try {
      if (type === 'prayer') {
        await deleteDoc(doc(db, 'users', user.uid, 'prayerData', docId));
        setPrayerData(prev => prev.filter(entry => entry.id !== docId));
      } else if (type === 'quran') {
        await deleteDoc(doc(db, 'users', user.uid, 'quranData', docId));
        setQuranData(prev => prev.filter(entry => entry.id !== docId));
      }
      setShowDeleteConfirm(null);
      toast.success(`${type.charAt(0).toUpperCase() + type.slice(1)} entry deleted successfully`);
    } catch (err) {
      console.error('Error deleting data:', err);
      toast.error('Failed to delete entry. Please try again.');
    }
  };

  const getPrayerStats = useCallback(() => {
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(weekStart.getDate() - 6);
    const weekPrayerData = prayerData.filter(entry => new Date(entry.date) >= weekStart);
    const totalPrayers = weekPrayerData.reduce((sum, entry) => sum + Object.values(entry.prayers).filter(p => p.prayed).length, 0);
    const avgPrayers = weekPrayerData.length > 0 ? (totalPrayers / weekPrayerData.length).toFixed(1) : 0;
    const totalJamaah = weekPrayerData.reduce((sum, entry) => sum + Object.values(entry.prayers).filter(p => p.jamaah).length, 0);
    const avgJamaah = weekPrayerData.length > 0 ? (totalJamaah / weekPrayerData.length).toFixed(1) : 0;
    const jamaahPercent = totalPrayers > 0 ? Math.round((totalJamaah / totalPrayers) * 100) : 0;
    const totalPrayerDays = weekPrayerData.length;
    return { avgPrayers, avgJamaah, jamaahPercent, totalPrayerDays };
  }, [prayerData]);

  const getQuranStats = useCallback(() => {
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(weekStart.getDate() - 6);
    const weekQuranData = quranData.filter(entry => new Date(entry.date) >= weekStart);
    const totalDuration = weekQuranData.reduce((sum, entry) => sum + (entry.duration || 0), 0);
    const avgDuration = weekQuranData.length > 0 ? Math.round(totalDuration / weekQuranData.length) : 0;
    const totalPages = weekQuranData.reduce((sum, entry) => sum + (entry.pages || 0), 0);
    const totalQuranDays = weekQuranData.length;
    return { avgDuration, totalPages, totalQuranDays };
  }, [quranData]);

  const getStreak = useCallback(() => {
    let streak = 0;
    const sortedData = [...prayerData].sort((a, b) => new Date(b.date) - new Date(a.date));
    for (const entry of sortedData) {
      if (Object.values(entry.prayers).filter(p => p.prayed).length === 5) streak++;
      else break;
    }
    return streak;
  }, [prayerData]);

  const getChartData = useCallback(() => {
    const now = new Date();
    const data = [];
    if (viewPeriod === 'daily') {
      for (let i = 6; i >= 0; i--) {
        const day = new Date(now); day.setDate(day.getDate() - i);
        const dayStr = day.toISOString().split('T')[0];
        const dayPrayer = prayerData.find(entry => entry.date === dayStr);
        const dayQuran = quranData.find(entry => entry.date === dayStr);
        data.push({
          name: day.toLocaleDateString('en-US', { weekday: 'short' }),
          prayers: dayPrayer ? Object.values(dayPrayer.prayers).filter(p => p.prayed).length : 0,
          jamaah: dayPrayer ? Object.values(dayPrayer.prayers).filter(p => p.jamaah).length : 0,
          quran: dayQuran ? dayQuran.duration : 0,
          goal: 5
        });
      }
    } else if (viewPeriod === 'weekly') {
      for (let i = 3; i >= 0; i--) {
        const weekStart = new Date(now); weekStart.setDate(weekStart.getDate() - (weekStart.getDay() + 7 * i));
        const weekEnd = new Date(weekStart); weekEnd.setDate(weekEnd.getDate() + 6);
        const weekPrayerData = prayerData.filter(entry => new Date(entry.date) >= weekStart && new Date(entry.date) <= weekEnd);
        const weekQuranData = quranData.filter(entry => new Date(entry.date) >= weekStart && new Date(entry.date) <= weekEnd);
        data.push({
          name: `Week ${4-i}`,
          prayers: weekPrayerData.length > 0 ? (weekPrayerData.reduce((sum, entry) => sum + Object.values(entry.prayers).filter(p => p.prayed).length, 0) / weekPrayerData.length).toFixed(1) : 0,
          jamaah: weekPrayerData.length > 0 ? (weekPrayerData.reduce((sum, entry) => sum + Object.values(entry.prayers).filter(p => p.jamaah).length, 0) / weekPrayerData.length).toFixed(1) : 0,
          quran: weekQuranData.length > 0 ? Math.round(weekQuranData.reduce((sum, entry) => sum + (entry.duration || 0), 0) / weekQuranData.length) : 0,
          goal: 5
        });
      }
    } else if (viewPeriod === 'monthly') {
      for (let i = 5; i >= 0; i--) {
        const month = new Date(now); month.setMonth(month.getMonth() - i);
        const monthPrayerData = prayerData.filter(entry => new Date(entry.date).getMonth() === month.getMonth() && new Date(entry.date).getFullYear() === month.getFullYear());
        const monthQuranData = quranData.filter(entry => new Date(entry.date).getMonth() === month.getMonth() && new Date(entry.date).getFullYear() === month.getFullYear());
        data.push({
          name: month.toLocaleDateString('en-US', { month: 'short' }),
          prayers: monthPrayerData.length > 0 ? (monthPrayerData.reduce((sum, entry) => sum + Object.values(entry.prayers).filter(p => p.prayed).length, 0) / monthPrayerData.length).toFixed(1) : 0,
          jamaah: monthPrayerData.length > 0 ? (monthPrayerData.reduce((sum, entry) => sum + Object.values(entry.prayers).filter(p => p.jamaah).length, 0) / monthPrayerData.length).toFixed(1) : 0,
          quran: monthQuranData.length > 0 ? Math.round(monthQuranData.reduce((sum, entry) => sum + (entry.duration || 0), 0) / monthQuranData.length) : 0,
          goal: 5
        });
      }
    }
    return data;
  }, [viewPeriod, prayerData, quranData]);

  const getPieChartData = useCallback(() => {
    return Object.entries(prayers)
      .filter(([, p]) => p.prayed)
      .map(([name, prayer]) => ({
        name: name.charAt(0).toUpperCase() + name.slice(1),
        value: 1,
        color: prayer.jamaah ? COLORS.jamaah : COLORS.prayer
      }));
  }, [prayers]);

  const prayerStats = getPrayerStats();
  const quranStats = getQuranStats();
  const streak = getStreak();
  const chartData = getChartData();
  const pieData = getPieChartData();

  const isDateInPreviousWeek = (selectedDate) => {
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(weekStart.getDate() - 6);
    const selected = new Date(selectedDate);
    return selected >= weekStart && selected <= now;
  };

  useEffect(() => {
    if (!isDateInPreviousWeek(date)) {
      const today = new Date().toISOString().split('T')[0];
      setDate(today);
      toast.info('You can only log data for the previous week. Reset to today.');
    }
  }, [date]);

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center bg-slate-50 ${collapsed ? "lg:ml-20" : "lg:ml-64"}`}>
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  const TABS = [
    { id: "dashboard", label: "Dashboard", icon: HeartHandshake },
    { id: "analytics", label: "Analytics", icon: TrendingUp },
    { id: "history", label: "History", icon: History }
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <div className="space-y-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard icon={HeartHandshake} title="Avg Prayers/Day" value={prayerStats.avgPrayers} subValue={`Logged ${prayerStats.totalPrayerDays} days`} color={COLORS.prayer} />
              <StatCard icon={HeartHandshake} title="Avg Jama'ah/Day" value={prayerStats.avgJamaah} subValue={`${prayerStats.jamaahPercent}% of prayed`} color={COLORS.jamaah} />
              <StatCard icon={BookOpen} title="Avg Quran (min)/Day" value={quranStats.avgDuration} subValue={`Total pages: ${quranStats.totalPages}`} color={COLORS.quran} />
              <StatCard icon={Flame} title="Perfect Day Streak" value={streak} subValue="Days with all prayers" color={COLORS.streak} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2">
                <InputCard icon={HeartHandshake} title="Log Prayers" color={COLORS.prayer}>
                  <div className="mb-6">
                    <label htmlFor="date-input" className="block text-sm font-medium text-slate-700 mb-1">Date</label>
                    <input
                      id="date-input"
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      min={new Date(new Date().setDate(new Date().getDate() - 6)).toISOString().split('T')[0]}
                      max={new Date().toISOString().split('T')[0]}
                      className="w-full max-w-xs px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500 sm:max-w-sm md:max-w-md"
                    />
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead className="bg-slate-50 text-sm text-slate-600">
                        <tr>
                          <th className="p-3 font-semibold">Prayer</th>
                          <th className="p-3 font-semibold">Prayed</th>
                          <th className="p-3 font-semibold">Jama'ah</th>
                        </tr>
                      </thead>
                      <tbody>
                        {Object.entries(prayers).map(([prayer, data]) => (
                          <tr key={prayer} className="border-t border-slate-200">
                            <td className="p-3 font-medium text-slate-800 capitalize">{prayer}</td>
                            <td className="p-3">
                              <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={data.prayed}
                                  onChange={() => handlePrayerChange(prayer, 'prayed')}
                                  className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-slate-200 rounded-full peer peer-focus:ring-2 peer-focus:ring-indigo-300 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                              </label>
                            </td>
                            <td className="p-3">
                              <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={data.jamaah}
                                  onChange={() => handlePrayerChange(prayer, 'jamaah')}
                                  disabled={!data.prayed}
                                  className="sr-only peer"
                                />
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
                      <input
                        id="quran-duration"
                        type="number"
                        min="0"
                        value={quran.duration}
                        onChange={(e) => handleQuranChange('duration', e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                    <div>
                      <label htmlFor="quran-pages" className="flex items-center text-sm font-medium text-slate-700 mb-1"><BookOpen size={14} className="mr-2"/>Pages Read</label>
                      <input
                        id="quran-pages"
                        type="number"
                        min="0"
                        value={quran.pages}
                        onChange={(e) => handleQuranChange('pages', e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                    <div>
                      <label htmlFor="quran-juz" className="flex items-center text-sm font-medium text-slate-700 mb-1"><History size={14} className="mr-2"/>Juz / Hizb</label>
                      <input
                        id="quran-juz"
                        type="text"
                        placeholder="e.g., Juz 1, Hizb 2"
                        value={quran.juz}
                        onChange={(e) => handleQuranChange('juz', e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                    <div>
                      <label htmlFor="quran-notes" className="flex items-center text-sm font-medium text-slate-700 mb-1"><StickyNote size={14} className="mr-2"/>Notes</label>
                      <textarea
                        id="quran-notes"
                        rows="4"
                        placeholder="Reflections or memorization progress..."
                        value={quran.notes}
                        onChange={(e) => handleQuranChange('notes', e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-md resize-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                    <div className="pt-2 space-y-3">
                      <button
                        onClick={handleSave}
                        className="w-full flex items-center justify-center px-4 py-2.5 bg-indigo-600 text-white font-semibold rounded-md shadow hover:bg-indigo-700 transition-colors"
                      >
                        <Save size={16} className="mr-2" /> Save Data
                      </button>
                      {saved && (
                        <div className="flex items-center p-3 bg-emerald-50 text-emerald-700 rounded-md text-sm">
                          <CheckCircle size={16} className="mr-2"/>Successfully saved!
                        </div>
                      )}
                    </div>
                  </div>
                </InputCard>
              </div>
            </div>
          </div>
        );
      case 'analytics':
        return (
          <div className="space-y-8">
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col md:flex-row justify-between md:items-center gap-4">
              <h2 className="text-xl font-bold text-slate-800 flex items-center"><TrendingUp className="mr-3 text-indigo-500" />Analytics</h2>
              <div className="flex-shrink-0">
                <span className="relative z-0 inline-flex shadow-sm rounded-md">
                  {['daily', 'weekly', 'monthly'].map((period, i) => (
                    <button
                      key={period}
                      onClick={() => setViewPeriod(period)}
                      type="button"
                      className={`relative inline-flex items-center px-4 py-2 text-sm font-medium transition-colors ${i === 0 ? 'rounded-l-md' : ''} ${i === 2 ? 'rounded-r-md' : ''} ${viewPeriod === period ? 'z-10 bg-indigo-50 border-indigo-500 text-indigo-600' : 'bg-white border-slate-300 text-slate-500 hover:bg-slate-50'}`}
                    >
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
                      <Line type="monotone" dataKey="jamaah" name="Avg. Jama'ah" stroke={COLORS.jamaah} strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
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
                      <Pie
                        data={pieData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={3}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
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
        );
      case 'history':
        return (
          <div className="space-y-8">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
              <h3 className="text-lg font-semibold text-slate-800 mb-4">History</h3>
              <div className="space-y-4">
                {[...prayerData, ...quranData].sort((a, b) => new Date(b.date) - new Date(a.date)).map(entry => (
                  <div key={`${entry.id}-${entry.prayers ? 'prayer' : 'quran'}`} className="p-4 bg-slate-50 rounded-md flex justify-between items-center">
                    <div>
                      <p className="font-medium">{entry.date}</p>
                      <p className="text-sm text-slate-600">
                        {entry.prayers
                          ? `Prayers: ${Object.values(entry.prayers).filter(p => p.prayed).length}/5, Jama'ah: ${Object.values(entry.prayers).filter(p => p.jamaah).length}`
                          : `Quran: ${entry.duration} min, ${entry.pages} pages${entry.juz ? `, ${entry.juz}` : ''}${entry.notes ? `, Notes: ${entry.notes.substring(0, 50)}${entry.notes.length > 50 ? '...' : ''}` : ''}`}
                      </p>
                    </div>
                    <button
                      onClick={() => setShowDeleteConfirm({ type: entry.prayers ? 'prayer' : 'quran', id: entry.id })}
                      className="text-red-500 hover:text-red-700 transition-colors"
                    >
                      <Trash2 size={20} />
                    </button>
                  </div>
                ))}
                {prayerData.length === 0 && quranData.length === 0 && <p className="text-slate-600">No historical data</p>}
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
      <div className="p-6 md:p-8">
        {/* Tab Navigation */}
        <div className="mb-4 md:mb-2 relative">
          <div className="border-b border-slate-200 bg-white rounded-t-xl shadow-sm">
            <nav className="-mb-px flex overflow-x-auto px-3 md:px-6 relative">
              {TABS.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 py-3 md:py-4 px-2 md:px-4 text-xs md:text-sm font-medium border-b-2 transition-colors duration-200 whitespace-nowrap ${
                      activeTab === tab.id
                        ? 'border-indigo-500 text-indigo-600'
                        : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
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

        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
            <div className="bg-white p-7 rounded-lg shadow-xl w-full max-w-md m-4">
              <h2 className="text-xl font-bold text-slate-900 mb-2">Confirm Deletion</h2>
              <p className="text-slate-600 mb-6">Are you sure you want to delete this {showDeleteConfirm.type} entry? This action cannot be undone.</p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(null)}
                  className="px-4 py-2 bg-slate-100 text-slate-800 font-semibold rounded-md hover:bg-slate-200"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDeleteData(showDeleteConfirm.type, showDeleteConfirm.id)}
                  className="px-4 py-2 bg-red-600 text-white font-semibold rounded-md hover:bg-red-700"
                >
                  Delete Entry
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PrayerTracker;