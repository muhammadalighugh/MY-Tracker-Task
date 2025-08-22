import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import {
  FaMobileAlt, FaChartLine, FaUsers, FaFilm, FaBriefcase, FaTools,
  FaGamepad, FaBullseye, FaSave, FaRegStickyNote, FaChartBar,
  FaCalendarAlt, FaRegClock, FaHistory, FaCheckCircle
} from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { useSidebar } from '../../context/SidebarContext';
import { auth, db } from '../../firebase/firebase.config';
import { useAuthState } from 'react-firebase-hooks/auth';
import { collection, addDoc, onSnapshot, query, orderBy, limit } from 'firebase/firestore';
import { toast } from 'react-toastify';

// --- Skeleton Components (Moved to Top) ---
const StatCardSkeleton = () => (
  <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 h-[110px] animate-pulse">
    <div className="h-4 bg-slate-200 rounded w-3/4 mb-4"></div>
    <div className="h-8 bg-slate-200 rounded w-1/2 mb-2"></div>
    <div className="h-3 bg-slate-200 rounded w-1/3"></div>
  </div>
);

const InputCardSkeleton = () => (
  <div className="bg-white rounded-xl shadow-sm border border-slate-200 h-full animate-pulse p-6">
    <div className="h-6 bg-slate-200 rounded w-1/3 mb-6"></div>
    <div className="space-y-4">
      <div className="h-4 bg-slate-200 rounded w-full"></div>
      <div className="h-4 bg-slate-200 rounded w-full"></div>
      <div className="h-4 bg-slate-200 rounded w-3/4"></div>
      <div className="h-8 bg-slate-200 rounded w-1/2"></div>
    </div>
  </div>
);

const ChartSkeleton = () => (
  <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 h-[320px] animate-pulse">
    <div className="h-6 bg-slate-200 rounded w-1/3 mb-6"></div>
    <div className="h-full bg-slate-100 rounded"></div>
  </div>
);

const TableSkeleton = () => (
  <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 animate-pulse">
    <div className="h-6 bg-slate-200 rounded w-1/3 mb-6"></div>
    <div className="space-y-3">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="h-4 bg-slate-200 rounded w-full"></div>
      ))}
    </div>
  </div>
);

// --- Composite Skeleton Components ---
const DashboardSkeleton = () => (
  <>
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {[...Array(4)].map((_, i) => (
        <StatCardSkeleton key={i} />
      ))}
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2">
        <InputCardSkeleton />
      </div>
      <div>
        <InputCardSkeleton />
      </div>
    </div>
  </>
);

const AnalyticsSkeleton = () => (
  <div className="space-y-8">
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 animate-pulse">
      <div className="h-6 bg-slate-200 rounded w-1/3 mb-4"></div>
      <div className="flex gap-2">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-8 bg-slate-200 rounded w-20"></div>
        ))}
      </div>
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2">
        <ChartSkeleton />
      </div>
      <div>
        <ChartSkeleton />
      </div>
    </div>
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 animate-pulse">
      <div className="h-6 bg-slate-200 rounded w-1/3 mb-6"></div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="text-center">
            <div className="h-8 bg-slate-200 rounded w-3/4 mb-2 mx-auto"></div>
            <div className="h-3 bg-slate-200 rounded w-1/2 mx-auto"></div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

const HistorySkeleton = () => (
  <div className="space-y-8">
    <TableSkeleton />
  </div>
);

// --- Constants ---
const COLORS = ['#3B82F6', '#8B5CF6', '#10B981', '#F59E0B', '#EF4444', '#4F46E5'];
const CATEGORIES = {
  social: { icon: FaUsers, label: "Social" },
  entertainment: { icon: FaFilm, label: "Entertainment" },
  productivity: { icon: FaBriefcase, label: "Productivity" },
  utilities: { icon: FaTools, label: "Utilities" },
  games: { icon: FaGamepad, label: "Games" }
};
const DEFAULT_USAGE = {
  social: 0,
  entertainment: 0,
  productivity: 0,
  utilities: 0,
  games: 0
};
const DEFAULT_DAILY_GOAL = 60;
const VIEW_OPTIONS = ['daily', 'weekly', 'monthly'];
const PAGE_SIZE = 20;

// --- Helper Components ---
const StatCard = React.memo(({ icon: Icon, title, value, subValue, color }) => (
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
));

const CategoryInput = React.memo(({ category, icon: Icon, value, onChange }) => (
  <div>
    <label className="flex items-center text-sm font-medium text-slate-700 mb-1">
      <Icon className="mr-2" />
      {CATEGORIES[category].label}
    </label>
    <input
      type="number"
      className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500 text-sm"
      value={value}
      onChange={(e) => onChange(category, e.target.value)}
      min="0"
    />
  </div>
));

const ProgressBar = React.memo(({ totalUsage, dailyGoal }) => {
  const progress = Math.min((totalUsage / dailyGoal) * 100, 100);
  const color = progress <= 60 ? '#10B981' : progress <= 100 ? '#F59E0B' : '#EF4444';

  return (
    <div>
      <label className="flex items-center text-sm font-medium text-slate-700 mb-1">
        <FaChartBar className="mr-2" />
        Total Screen Time Progress
      </label>
      <div className="w-full bg-slate-200 rounded-full h-5">
        <div
          className="h-5 rounded-full flex items-center text-xs text-white font-medium pl-2"
          style={{
            width: `${progress}%`,
            backgroundColor: color
          }}
        >
          {totalUsage} / {dailyGoal} min ({Math.round(progress)}%)
        </div>
      </div>
      {totalUsage > dailyGoal && (
        <div className="text-red-600 mt-2 font-semibold text-sm">
          ⚠️ Exceeded daily screen time goal by {totalUsage - dailyGoal} minutes!
        </div>
      )}
    </div>
  );
});

// --- Main Component ---
const MobileTracker = () => {
  const { collapsed } = useSidebar();
  const [user, loading, authLoading, error, authError] = useAuthState(auth);
  const navigate = useNavigate();

  // --- State ---
  const [activeTab, setActiveTab] = useState('dashboard');
  const [activeView, setActiveView] = useState('weekly');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [dailyGoal, setDailyGoal] = useState(DEFAULT_DAILY_GOAL);
  const [usage, setUsage] = useState(DEFAULT_USAGE);
  const [notes, setNotes] = useState('');
  const [saved, setSaved] = useState(false);
  const [historicalData, setHistoricalData] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

  // --- Derived Data (Memoized) ---
  const totalUsage = useMemo(
    () => Object.values(usage).reduce((a, b) => a + b, 0),
    [usage]
  );

  const stats = useMemo(() => {
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
      streak: calculateStreak(historicalData)
    };
  }, [historicalData, totalUsage]);

  const chartData = useMemo(() => getChartData(historicalData, activeView, dailyGoal), [historicalData, activeView, dailyGoal]);
  const pieChartData = useMemo(() => getPieChartData(usage), [usage]);

  // Paginated data for history table
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * PAGE_SIZE;
    return historicalData.slice(startIndex, startIndex + PAGE_SIZE);
  }, [historicalData, currentPage]);

  const totalPages = useMemo(() =>
    Math.ceil(historicalData.length / PAGE_SIZE),
    [historicalData.length]
  );

  // --- Firestore ---
  useEffect(() => {
    if (!user) {
      setDataLoading(false);
      return;
    }

    setDataLoading(true);
    const usageRef = collection(db, 'users', user.uid, 'mobileUsage');
    const q = query(usageRef, orderBy('timestamp', 'desc'), limit(100));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setHistoricalData(data);

      const todayData = data.find(entry => entry.date === date);
      if (todayData) {
        setUsage(todayData.usage || DEFAULT_USAGE);
        setNotes(todayData.notes || '');
        setDailyGoal(todayData.dailyGoal || DEFAULT_DAILY_GOAL);
      } else {
        setUsage(DEFAULT_USAGE);
        setNotes('');
      }
      setDataLoading(false);
    }, (err) => {
      console.error("Firestore error:", err);
      toast.error(`Failed to load data: ${err.message}`);
      setDataLoading(false);
    });

    return () => unsubscribe();
  }, [user, date]);

  // --- Handlers ---
  const handleChange = useCallback((category, value) => {
    const newValue = Math.max(0, parseInt(value) || 0);
    setUsage(prev => ({
      ...prev,
      [category]: newValue
    }));
  }, []);

  const debouncedSave = useCallback(debounce(async (data) => {
    if (!user) {
      toast.error('You must be logged in to save data.');
      return;
    }

    if (totalUsage === 0) {
      toast.error('Please enter some usage data before saving.');
      return;
    }

    setIsSaving(true);
    try {
      await addDoc(collection(db, 'users', user.uid, 'mobileUsage'), data);
      toast.success('Usage data saved successfully!');
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      toast.error(`Failed to save usage data: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  }, 1000), [user, totalUsage]);

  const handleSave = useCallback(() => {
    const newEntry = {
      date,
      usage,
      notes,
      totalUsage,
      dailyGoal,
      timestamp: new Date().toISOString(),
      userId: user.uid
    };
    debouncedSave(newEntry);
  }, [date, usage, notes, totalUsage, dailyGoal, user, debouncedSave]);

  // --- Error Handling ---
  if (authError) {
    toast.error(`Authentication error: ${authError.message}`);
    return null;
  }

  // --- Render ---
  return (
    <div className={`min-h-screen bg-slate-50 transition-all duration-300 ${collapsed ? 'lg:ml-20' : 'lg:ml-64'}`}>
      <div className="p-3 md:p-4 max-w-7xl mx-auto">
        {/* Tabs */}
        <div className="flex flex-col md:flex-row justify-between md:items-center mb-8 gap-4">
          <div className="flex items-center gap-3 flex-wrap">
            {['dashboard', 'analytics', 'history'].map(tab => (
              <button
                key={tab}
                onClick={() => {
                  setActiveTab(tab);
                  setCurrentPage(1);
                }}
                className={`px-4 py-2 text-sm font-semibold rounded-md flex items-center gap-2 transition-colors ${
                  activeTab === tab
                    ? 'bg-indigo-600 text-white shadow'
                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-300'
                }`}
              >
                {tab === 'dashboard' && <FaBullseye size={16} />}
                {tab === 'analytics' && <FaChartBar size={16} />}
                {tab === 'history' && <FaHistory size={16} />}
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Loading State */}
        {authLoading || dataLoading ? (
          <>
            {activeTab === 'dashboard' && <DashboardSkeleton />}
            {activeTab === 'analytics' && <AnalyticsSkeleton />}
            {activeTab === 'history' && <HistorySkeleton />}
          </>
        ) : (
          <>
            {/* Dashboard Tab */}
            {activeTab === 'dashboard' && (
              <DashboardTab
                usage={usage}
                totalUsage={totalUsage}
                dailyGoal={dailyGoal}
                notes={notes}
                saved={saved}
                stats={stats}
                date={date}
                isSaving={isSaving}
                onDateChange={setDate}
                onGoalChange={setDailyGoal}
                onUsageChange={handleChange}
                onNotesChange={setNotes}
                onSave={handleSave}
              />
            )}

            {/* Analytics Tab */}
            {activeTab === 'analytics' && (
              <AnalyticsTab
                activeView={activeView}
                chartData={chartData}
                pieChartData={pieChartData}
                dailyGoal={dailyGoal}
                onViewChange={setActiveView}
              />
            )}

            {/* History Tab */}
            {activeTab === 'history' && (
              <HistoryTab
                historicalData={paginatedData}
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
                totalItems={historicalData.length}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
};

// --- Sub-Components ---
const DashboardTab = React.memo(({
  usage, totalUsage, dailyGoal, notes, saved,
  stats, date, isSaving, onDateChange, onGoalChange,
  onUsageChange, onNotesChange, onSave
}) => {
  const progressColor = totalUsage <= dailyGoal * 0.6 ? '#10B981' :
                       totalUsage <= dailyGoal ? '#F59E0B' : '#EF4444';

  return (
    <div className="space-y-8">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          icon={FaRegClock}
          title="Today's Usage"
          value={`${totalUsage} min`}
          subValue={`${Math.floor(totalUsage/60)}h ${totalUsage%60}m`}
          color="#3B82F6"
        />
        <StatCard
          icon={FaBullseye}
          title="Daily Goal"
          value={`${dailyGoal} min`}
          subValue={`${Math.floor(dailyGoal/60)}h`}
          color="#8B5CF6"
        />
        <StatCard
          icon={FaChartLine}
          title="Progress"
          value={`${Math.round((totalUsage / dailyGoal) * 100)}%`}
          subValue={totalUsage > dailyGoal ? 'Over limit' : 'On track'}
          color={progressColor}
        />
        <StatCard
          icon={FaCheckCircle}
          title="Goal Streak"
          value={stats.streak}
          subValue="Days meeting goal"
          color="#10B981"
        />
      </div>

      {/* Input Forms */}
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
                    onChange={(e) => onDateChange(e.target.value)}
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
                    onChange={(e) => onGoalChange(Math.max(30, parseInt(e.target.value) || 30))}
                    min="30"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {Object.entries(usage).map(([category, value]) => (
                  <CategoryInput
                    key={category}
                    category={category}
                    icon={CATEGORIES[category].icon}
                    value={value}
                    onChange={onUsageChange}
                  />
                ))}
              </div>

              <ProgressBar totalUsage={totalUsage} dailyGoal={dailyGoal} />
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
                onChange={(e) => onNotesChange(e.target.value)}
              />
              <button
                className="w-full flex items-center justify-center px-4 py-2.5 bg-indigo-600 text-white font-semibold rounded-md shadow hover:bg-indigo-700 transition-colors disabled:bg-indigo-400 disabled:cursor-not-allowed"
                onClick={onSave}
                disabled={totalUsage === 0 || isSaving}
              >
                <FaSave className="mr-2" />
                {isSaving ? 'Saving...' : 'Save Today\'s Data'}
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
  );
});

const InputCard = React.memo(({ icon: Icon, title, children, color }) => (
  <div className="bg-white rounded-xl shadow-sm border border-slate-200 h-full transition-all hover:shadow-md">
    <div className="p-6">
      <div className="flex items-center mb-5">
        <Icon className="w-6 h-6 mr-3" style={{ color }} />
        <h3 className="text-xl font-bold text-slate-800">{title}</h3>
      </div>
      {children}
    </div>
  </div>
));

const AnalyticsTab = React.memo(({ activeView, chartData, pieChartData, dailyGoal, onViewChange }) => (
  <div className="space-y-8">
    {/* View Selector */}
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col md:flex-row justify-between md:items-center gap-4">
      <h2 className="text-xl font-bold text-slate-800 flex items-center">
        <FaChartLine className="mr-3" style={{ color: '#3B82F6' }} />
        Usage Analytics
      </h2>
      <div className="flex-shrink-0">
        <span className="relative z-0 inline-flex shadow-sm rounded-md">
          {VIEW_OPTIONS.map((period, i) => (
            <button
              key={period}
              onClick={() => onViewChange(period)}
              className={`relative inline-flex items-center px-4 py-2 text-sm font-medium transition-colors ${
                i === 0 ? 'rounded-l-md' : ''
              } ${
                i === VIEW_OPTIONS.length - 1 ? 'rounded-r-md' : ''
              } ${
                activeView === period
                  ? 'z-10 bg-indigo-50 border-indigo-500 text-indigo-600'
                  : 'bg-white border-slate-300 text-slate-500 hover:bg-slate-50'
              }`}
            >
              {period.charAt(0).toUpperCase() + period.slice(1)}
            </button>
          ))}
        </span>
      </div>
    </div>

    {/* Charts */}
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center">
          <FaChartLine className="mr-2" />
          Usage Trends - {activeView.charAt(0).toUpperCase() + activeView.slice(1)}
        </h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="name" stroke="#64748b" fontSize={12} />
              <YAxis stroke="#64748b" fontSize={12} />
              <Tooltip
                contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '0.5rem' }}
                formatter={(value) => `${value} min`}
              />
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
                data={pieChartData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={5}
                dataKey="value"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              >
                {pieChartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => `${value} min`} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>

    {/* Summary Stats */}
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
      <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center">
        <FaChartBar className="mr-2" />
        {activeView.charAt(0).toUpperCase() + activeView.slice(1)} Summary
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: 'Avg Usage',
            value: (chartData.reduce((sum, d) => sum + d.usage, 0) / chartData.length).toFixed(1),
            unit: 'min',
            color: '#3B82F6'
          },
          {
            label: 'Goal Met',
            value: chartData.filter(d => d.usage <= dailyGoal).length,
            unit: 'times',
            color: '#10B981'
          },
          {
            label: 'Max Usage',
            value: Math.max(...chartData.map(d => d.usage), 0),
            unit: 'min',
            color: '#EF4444'
          },
          {
            label: 'Min Usage',
            value: Math.min(...chartData.map(d => d.usage), chartData.length > 0 ? chartData[0].usage : 0),
            unit: 'min',
            color: '#F59E0B'
          }
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
));

const HistoryTab = React.memo(({ historicalData, currentPage, totalPages, onPageChange, totalItems }) => {
  return (
    <div className="space-y-8">
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center">
          <FaHistory className="mr-3" style={{ color: '#3B82F6' }} />
          Usage History
        </h2>

        {/* Mobile View */}
        <div className="block md:hidden text-center p-8 border-2 border-dashed rounded-lg bg-slate-50 text-slate-600">
          <svg className="mx-auto mb-4 h-12 w-12 text-slate-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-1.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25A2.25 2.25 0 015.25 3h13.5A2.25 2.25 0 0121 5.25z" />
          </svg>
          <h3 className="font-bold text-slate-800">This View is for Desktop</h3>
          <p className="text-sm mt-1">
            To see your detailed usage history, please switch to a larger screen.
          </p>
        </div>

        {/* Desktop View */}
        <div className="hidden md:block">
          {totalItems === 0 ? (
            <div className="p-8 text-center text-slate-600 bg-slate-50 rounded-lg">
              <p>No usage data available. Start tracking your mobile usage on the Dashboard tab!</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[800px] text-left text-sm">
                  <thead className="bg-slate-50 text-slate-600">
                    <tr>
                      <th className="p-4 font-semibold">Date</th>
                      <th className="p-4 font-semibold">Total Usage</th>
                      <th className="p-4 font-semibold">Daily Goal</th>
                      <th className="p-4 font-semibold">Status</th>
                      {Object.keys(DEFAULT_USAGE).map(key => (
                        <th key={key} className="p-4 font-semibold">{CATEGORIES[key].label}</th>
                      ))}
                      <th className="p-4 font-semibold">Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {historicalData.map((entry, index) => (
                      <tr key={index} className="border-t border-slate-200 hover:bg-slate-50">
                        <td className="p-4 whitespace-nowrap">{entry.date}</td>
                        <td className="p-4 font-medium">{entry.totalUsage} min</td>
                        <td className="p-4">{entry.dailyGoal} min</td>
                        <td className="p-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                            entry.totalUsage <= entry.dailyGoal ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                          }`}>
                            {entry.totalUsage <= entry.dailyGoal ? 'Met Goal' : 'Over Goal'}
                          </span>
                        </td>
                        {Object.keys(DEFAULT_USAGE).map(key => (
                          <td key={key} className="p-4">{entry.usage[key]} min</td>
                        ))}
                        <td className="p-4 max-w-xs truncate" title={entry.notes || '-'}>
                          {entry.notes || '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center mt-6">
                  <nav className="inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                    <button
                      onClick={() => onPageChange(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                      className="px-3 py-2 ml-0 leading-tight text-slate-500 bg-white border border-slate-300 rounded-l-lg hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }
                      return pageNum <= totalPages ? (
                        <button
                          key={pageNum}
                          onClick={() => onPageChange(pageNum)}
                          className={`px-3 py-2 leading-tight ${
                            currentPage === pageNum
                              ? 'text-indigo-600 border-indigo-300 bg-indigo-50'
                              : 'text-slate-500 bg-white border-slate-300 hover:bg-slate-100'
                          } border`}
                        >
                          {pageNum}
                        </button>
                      ) : null;
                    })}
                    <button
                      onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
                      disabled={currentPage === totalPages}
                      className="px-3 py-2 leading-tight text-slate-500 bg-white border border-slate-300 rounded-r-lg hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </nav>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
});

// --- Helper Functions ---
const calculateStreak = (data) => {
  let streak = 0;
  const sortedData = [...data].sort((a, b) => new Date(b.date) - new Date(a.date));
  for (const entry of sortedData) {
    if (entry.totalUsage <= entry.dailyGoal) {
      streak++;
    } else {
      break;
    }
  }
  return streak;
};

const getChartData = (historicalData, activeView, dailyGoal) => {
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

const getPieChartData = (usage) => {
  return Object.entries(usage).map(([key, value], index) => ({
    name: CATEGORIES[key].label,
    value: value,
    color: COLORS[index % COLORS.length]
  }));
};

const debounce = (func, delay) => {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
};

export default MobileTracker;
