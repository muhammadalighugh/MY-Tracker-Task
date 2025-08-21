import React, { useState, useEffect } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from 'recharts';
import {
  FaCode, FaLaptopCode, FaBook, FaClock, FaCalendarAlt,
  FaChartLine, FaChartBar, FaRegStickyNote, FaSave,
  FaCheckCircle, FaPlus, FaSearch, FaStar, FaExternalLinkAlt, FaCheck, FaFire
} from 'react-icons/fa';
import { useSidebar } from '../../context/SidebarContext';
import { AuthContext } from '../../context/AuthContext';
import { db } from '../../firebase/firebase.config';
import { collection, addDoc, updateDoc, doc, onSnapshot, query, orderBy, serverTimestamp, increment, getDoc } from 'firebase/firestore';
import { toast } from 'react-toastify';

const COLORS = ['#3B82F6', '#8B5CF6', '#10B981', '#F59E0B', '#EF4444', '#4F46E5'];

const StatCard = ({ icon: Icon, title, value, subValue, color }) => (
  <div className="bg-white p-3 sm:p-5 rounded-xl shadow-sm border border-slate-200 flex flex-col justify-between h-full">
    <div>
      <div className="flex items-center text-slate-500 mb-2">
        <Icon className="w-4 h-4 sm:w-5 sm:h-5 mr-2" style={{ color }} />
        <h3 className="font-semibold text-xs sm:text-sm">{title}</h3>
      </div>
      <p className="text-xl sm:text-3xl font-bold text-slate-800">{value}</p>
    </div>
    {subValue && <p className="text-xs sm:text-sm text-slate-400 mt-1">{subValue}</p>}
  </div>
);

const InputCard = ({ icon: Icon, title, children, color }) => (
  <div className="bg-white rounded-xl shadow-sm border border-slate-200 h-full">
    <div className="p-4 sm:p-6">
      <div className="flex items-center mb-3 sm:mb-5">
        <Icon className="w-5 h-5 sm:w-6 sm:h-6 mr-2 sm:mr-3" style={{ color }} />
        <h3 className="text-lg sm:text-xl font-bold text-slate-800">{title}</h3>
      </div>
      {children}
    </div>
  </div>
);

const CodingTracker = () => {
  const { collapsed } = useSidebar();
  const { user } = React.useContext(AuthContext);
  const [activeTab, setActiveTab] = useState('overview');
  const [viewPeriod, setViewPeriod] = useState('weekly');
  const [showAddTechModal, setShowAddTechModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [historicalData, setHistoricalData] = useState([]);
  const [technologies, setTechnologies] = useState([]);
  const [dailyGoal, setDailyGoal] = useState(60);
  const [newDailyGoal, setNewDailyGoal] = useState(60);

  const [newTech, setNewTech] = useState({
    name: '',
    category: '',
    resourceUrl: '',
    difficulty: 0,
    priority: 'medium',
    targetHours: 0,
  });

  const [learningSession, setLearningSession] = useState({
    techId: '',
    duration: 0,
    conceptsLearned: '',
    notes: '',
    date: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    if (user) {
      const userRef = doc(db, 'users', user.uid);
      const unsubscribeUser = onSnapshot(userRef, (snap) => {
        const data = snap.data();
        setDailyGoal(data?.dailyGoal || 60);
        setNewDailyGoal(data?.dailyGoal || 60);
      });

      const techQuery = query(collection(db, `users/${user.uid}/technologies`));
      const unsubscribeTech = onSnapshot(techQuery, (snapshot) => {
        setTechnologies(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      });

      const sessionsQuery = query(collection(db, `users/${user.uid}/coding_sessions`), orderBy('date', 'desc'));
      const unsubscribeSessions = onSnapshot(sessionsQuery, (snapshot) => {
        setHistoricalData(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      });

      return () => {
        unsubscribeUser();
        unsubscribeTech();
        unsubscribeSessions();
      };
    }
  }, [user]);

  const handleSetDailyGoal = async () => {
    if (newDailyGoal < 1) {
      toast.error('Daily goal must be at least 1 minute.');
      return;
    }
    try {
      await updateDoc(doc(db, 'users', user.uid), { dailyGoal: newDailyGoal });
      toast.success('Daily goal updated successfully!');
    } catch (error) {
      toast.error('Failed to update daily goal.');
    }
  };

  const calculateStreak = () => {
    const dailySums = {};
    historicalData.forEach(session => {
      const day = session.date.toDate().toISOString().split('T')[0];
      dailySums[day] = (dailySums[day] || 0) + session.duration;
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

  const handleAddTechnology = async () => {
    if (!newTech.name || newTech.targetHours <= 0) {
      toast.error('Please fill in name and target hours.');
      return;
    }

    try {
      await addDoc(collection(db, `users/${user.uid}/technologies`), {
        ...newTech,
        totalTime: 0,
        sessions: 0,
        addedDate: serverTimestamp(),
        lastPracticed: null,
        progress: 0,
        isCompleted: false,
      });
      toast.success('Technology added successfully!');
      setNewTech({ name: '', category: '', resourceUrl: '', difficulty: 0, priority: 'medium', targetHours: 0 });
      setShowAddTechModal(false);
    } catch (error) {
      toast.error('Failed to add technology.');
    }
  };

  const handleLogSession = async () => {
    if (!learningSession.techId || learningSession.duration <= 0) {
      toast.error('Please select technology and enter duration.');
      return;
    }

    try {
      const techRef = doc(db, `users/${user.uid}/technologies/${learningSession.techId}`);
      const techSnap = await getDoc(techRef);
      if (!techSnap.exists()) return;

      const techData = techSnap.data();
      const newTotalTime = techData.totalTime + parseInt(learningSession.duration);
      const newProgress = Math.min((newTotalTime / 60 / techData.targetHours) * 100, 100);

      await updateDoc(techRef, {
        totalTime: newTotalTime,
        sessions: increment(1),
        lastPracticed: new Date(learningSession.date),
        progress: newProgress,
      });

      await addDoc(collection(db, `users/${user.uid}/coding_sessions`), {
        ...learningSession,
        duration: parseInt(learningSession.duration),
        date: new Date(learningSession.date),
      });

      toast.success('Session logged successfully!');
      setLearningSession({
        techId: '',
        duration: 0,
        conceptsLearned: '',
        notes: '',
        date: new Date().toISOString().split('T')[0]
      });
    } catch (error) {
      toast.error('Failed to log session.');
    }
  };

  const handleMarkComplete = async (techId) => {
    try {
      await updateDoc(doc(db, `users/${user.uid}/technologies/${techId}`), { isCompleted: true });
      toast.success('Technology marked as complete!');
    } catch (error) {
      toast.error('Failed to mark as complete.');
    }
  };

  const getLearningStats = () => {
    const totalTech = technologies.length;
    const totalTime = technologies.reduce((sum, t) => sum + t.totalTime, 0);
    const completedTech = technologies.filter(t => t.isCompleted).length;
    const activeTech = technologies.filter(t => t.totalTime > 0 && !t.isCompleted).length;
    const streak = calculateStreak();

    return {
      totalTech,
      completedTech,
      activeTech,
      totalTime,
      totalHours: Math.round(totalTime / 60),
      totalSessions: historicalData.length,
      streak
    };
  };

  const getChartData = () => {
    const now = new Date();
    const data = [];

    if (viewPeriod === 'daily') {
      for (let i = 6; i >= 0; i--) {
        const day = new Date(now);
        day.setDate(day.getDate() - i);
        const dayStr = day.toISOString().split('T')[0];
        const daySessions = historicalData.filter(s => s.date.toDate().toISOString().split('T')[0] === dayStr);

        const learningTime = daySessions.reduce((sum, s) => sum + s.duration, 0);
        const techPracticed = [...new Set(daySessions.map(s => s.techId))].length;

        data.push({
          name: day.toLocaleDateString('en-US', { weekday: 'short' }),
          time: learningTime,
          tech: techPracticed,
          sessions: daySessions.length
        });
      }
    } else if (viewPeriod === 'weekly') {
      for (let i = 3; i >= 0; i--) {
        const weekStart = new Date(now);
        weekStart.setDate(weekStart.getDate() - (weekStart.getDay() + 7 * i));
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 6);

        const weekSessions = historicalData.filter(s => {
          const sessionDate = s.date.toDate();
          return sessionDate >= weekStart && sessionDate <= weekEnd;
        });

        const avgTime = weekSessions.length > 0 
          ? Math.round(weekSessions.reduce((sum, s) => sum + s.duration, 0) / weekSessions.length)
          : 0;

        const avgTech = weekSessions.length > 0
          ? Math.round([...new Set(weekSessions.map(s => s.techId))].length)
          : 0;

        data.push({
          name: `Week ${i + 1}`,
          time: avgTime,
          tech: avgTech,
          sessions: weekSessions.length
        });
      }
    } else if (viewPeriod === 'monthly') {
      for (let i = 5; i >= 0; i--) {
        const month = new Date(now);
        month.setMonth(month.getMonth() - i);

        const monthSessions = historicalData.filter(s => {
          const sessionDate = s.date.toDate();
          return sessionDate.getMonth() === month.getMonth() && 
                 sessionDate.getFullYear() === month.getFullYear();
        });

        const avgTime = monthSessions.length > 0
          ? Math.round(monthSessions.reduce((sum, s) => sum + s.duration, 0) / monthSessions.length)
          : 0;

        const avgTech = monthSessions.length > 0
          ? Math.round([...new Set(monthSessions.map(s => s.techId))].length)
          : 0;

        data.push({
          name: month.toLocaleDateString('en-US', { month: 'short' }),
          time: avgTime,
          tech: avgTech,
          sessions: monthSessions.length
        });
      }
    }

    return data;
  };

  const getPieChartData = () => {
    const categoryCount = {};
    technologies.forEach(tech => {
      categoryCount[tech.category] = (categoryCount[tech.category] || 0) + 1;
    });

    return Object.entries(categoryCount).map(([category, count]) => ({
      name: category || 'Uncategorized',
      value: count,
      color: COLORS[Object.keys(categoryCount).indexOf(category) % COLORS.length]
    }));
  };

  const stats = getLearningStats();
  const filteredTech = technologies.filter(tech => 
    tech.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tech.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const activeTech = filteredTech.filter(t => !t.isCompleted);
  const completedTech = filteredTech.filter(t => t.isCompleted);

  const TABS = [
    { id: 'overview', label: 'Overview', icon: FaChartBar },
    { id: 'technologies', label: 'Technologies', icon: FaCode },
    { id: 'log', label: 'Log Session', icon: FaLaptopCode },
    { id: 'analytics', label: 'Analytics', icon: FaChartLine },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <div className="space-y-6 md:space-y-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 md:gap-6">
              <StatCard
                icon={FaCode}
                title="Technologies"
                value={stats.totalTech}
                subValue={`${stats.activeTech} active`}
                color="#3B82F6"
              />
              <StatCard
                icon={FaClock}
                title="Total Time"
                value={`${stats.totalHours}h`}
                subValue={`${stats.totalTime} minutes`}
                color="#8B5CF6"
              />
              <StatCard
                icon={FaCheckCircle}
                title="Completed"
                value={stats.completedTech}
                subValue={`${stats.totalTech > 0 ? Math.round((stats.completedTech / stats.totalTech) * 100) : 0}%`}
                color="#10B981"
              />
              <StatCard
                icon={FaBook}
                title="Sessions"
                value={stats.totalSessions}
                subValue={`${stats.totalSessions > 0 ? Math.round(stats.totalTime / stats.totalSessions) : 0} min/session`}
                color="#F59E0B"
              />
              <StatCard
                icon={FaFire}
                title="Streak"
                value={stats.streak}
                subValue="days"
                color="#EF4444"
              />
            </div>
            <div className="bg-white p-4 md:p-6 rounded-xl shadow-sm border border-slate-200">
              <h3 className="text-lg font-semibold text-slate-800 mb-4">Set Daily Goal (minutes)</h3>
              <div className="flex gap-4">
                <input
                  type="number"
                  className="w-32 px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500"
                  value={newDailyGoal}
                  onChange={(e) => setNewDailyGoal(parseInt(e.target.value) || 0)}
                  min="1"
                />
                <button
                  onClick={handleSetDailyGoal}
                  className="px-4 py-2 bg-indigo-600 text-white font-semibold rounded-md hover:bg-indigo-700"
                >
                  Update Goal
                </button>
              </div>
            </div>
            <InputCard icon={FaChartBar} title="Technology Distribution" color="#10B981">
              <div className="h-64 md:h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={getPieChartData()}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={80}
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
            </InputCard>
          </div>
        );
      case 'technologies':
        return (
          <div className="space-y-6 md:space-y-8">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200">
              <div className="p-4 md:p-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 md:mb-5 gap-4">
                  <h3 className="text-lg md:text-xl font-bold text-slate-800 flex items-center">
                    <FaCode className="w-5 h-5 md:w-6 md:h-6 mr-2 md:mr-3" style={{ color: '#3B82F6' }} />
                    Active Technologies
                  </h3>
                  <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                    <div className="relative w-full sm:w-48 md:w-64">
                      <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500"
                        placeholder="Search technologies..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>
                    <button
                      onClick={() => setShowAddTechModal(true)}
                      className="px-4 py-2 bg-indigo-600 text-white font-semibold rounded-md flex items-center justify-center hover:bg-indigo-700 transition-colors"
                    >
                      <FaPlus className="mr-2" />
                      Add Technology
                    </button>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 text-slate-600">
                      <tr>
                        <th className="p-2 md:p-3 font-semibold">Technology</th>
                        <th className="p-2 md:p-3 font-semibold">Category</th>
                        <th className="p-2 md:p-3 font-semibold">Progress</th>
                        <th className="p-2 md:p-3 font-semibold">Time Spent</th>
                        <th className="p-2 md:p-3 font-semibold">Priority</th>
                        <th className="p-2 md:p-3 font-semibold">Last Practiced</th>
                        <th className="p-2 md:p-3 font-semibold">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {activeTech.map(tech => (
                        <tr key={tech.id} className="border-t border-slate-200">
                          <td className="p-2 md:p-3 font-medium text-slate-800">
                            {tech.name}
                            {tech.resourceUrl && (
                              <a href={tech.resourceUrl} target="_blank" rel="noopener noreferrer" className="ml-2 text-indigo-600 hover:text-indigo-800">
                                <FaExternalLinkAlt size={12} />
                              </a>
                            )}
                          </td>
                          <td className="p-2 md:p-3">{tech.category || '-'}</td>
                          <td className="p-2 md:p-3">
                            <div className="w-full bg-slate-200 rounded-full h-5">
                              <div
                                className="h-5 rounded-full"
                                style={{
                                  width: `${tech.progress}%`,
                                  backgroundColor:
                                    tech.progress >= 80 ? '#10B981' :
                                    tech.progress >= 50 ? '#3B82F6' : '#F59E0B'
                                }}
                              >
                                <span className="text-xs text-white font-medium pl-2">{tech.progress.toFixed(1)}%</span>
                              </div>
                            </div>
                          </td>
                          <td className="p-2 md:p-3">
                            {Math.floor(tech.totalTime / 60)}h {tech.totalTime % 60}m / {tech.targetHours}h
                          </td>
                          <td className="p-2 md:p-3">
                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                              tech.priority === 'high' ? 'bg-red-100 text-red-600' :
                              tech.priority === 'medium' ? 'bg-yellow-100 text-yellow-600' : 'bg-gray-100 text-gray-600'
                            }`}>
                              {tech.priority}
                            </span>
                          </td>
                          <td className="p-2 md:p-3">
                            {tech.lastPracticed ? tech.lastPracticed.toDate().toLocaleDateString() : 'Never'}
                          </td>
                          <td className="p-2 md:p-3">
                            <button
                              onClick={() => handleMarkComplete(tech.id)}
                              className="px-2 py-1 bg-green-500 text-white rounded-md text-xs hover:bg-green-600"
                            >
                              <FaCheck className="inline mr-1" /> Complete
                            </button>
                          </td>
                        </tr>
                      ))}
                      {activeTech.length === 0 && (
                        <tr>
                          <td colSpan="7" className="p-4 text-center text-slate-600">
                            No active technologies. Add your first technology!
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200">
              <div className="p-4 md:p-6">
                <h3 className="text-lg md:text-xl font-bold text-slate-800 mb-4 md:mb-5 flex items-center">
                  <FaCheckCircle className="w-5 h-5 md:w-6 md:h-6 mr-2 md:mr-3" style={{ color: '#10B981' }} />
                  Completed Technologies
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 text-slate-600">
                      <tr>
                        <th className="p-2 md:p-3 font-semibold">Technology</th>
                        <th className="p-2 md:p-3 font-semibold">Category</th>
                        <th className="p-2 md:p-3 font-semibold">Time Spent</th>
                        <th className="p-2 md:p-3 font-semibold">Completed On</th>
                      </tr>
                    </thead>
                    <tbody>
                      {completedTech.map(tech => (
                        <tr key={tech.id} className="border-t border-slate-200">
                          <td className="p-2 md:p-3 font-medium text-slate-800">
                            {tech.name}
                            {tech.resourceUrl && (
                              <a href={tech.resourceUrl} target="_blank" rel="noopener noreferrer" className="ml-2 text-indigo-600 hover:text-indigo-800">
                                <FaExternalLinkAlt size={12} />
                              </a>
                            )}
                          </td>
                          <td className="p-2 md:p-3">{tech.category || '-'}</td>
                          <td className="p-2 md:p-3">
                            {Math.floor(tech.totalTime / 60)}h {tech.totalTime % 60}m
                          </td>
                          <td className="p-2 md:p-3">
                            {tech.lastPracticed ? tech.lastPracticed.toDate().toLocaleDateString() : '-'}
                          </td>
                        </tr>
                      ))}
                      {completedTech.length === 0 && (
                        <tr>
                          <td colSpan="4" className="p-4 text-center text-slate-600">
                            No completed technologies yet.
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
          <div className="space-y-6 md:space-y-8">
            <InputCard icon={FaLaptopCode} title="Log Learning Session" color="#8B5CF6">
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
                      value={learningSession.date}
                      onChange={(e) => setLearningSession({...learningSession, date: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="flex items-center text-sm font-medium text-slate-700 mb-1">
                      <FaCode className="mr-2" />
                      Technology
                    </label>
                    <select
                      className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500"
                      value={learningSession.techId}
                      onChange={(e) => setLearningSession({...learningSession, techId: e.target.value})}
                    >
                      <option value="">Select a technology</option>
                      {technologies.filter(t => !t.isCompleted).map(tech => (
                        <option key={tech.id} value={tech.id}>
                          {tech.name} ({tech.category})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="flex items-center text-sm font-medium text-slate-700 mb-1">
                      <FaClock className="mr-2" />
                      Duration (minutes)
                    </label>
                    <input
                      type="number"
                      className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500"
                      value={learningSession.duration}
                      onChange={(e) => setLearningSession({...learningSession, duration: e.target.value})}
                      min="1"
                    />
                  </div>
                  <div>
                    <label className="flex items-center text-sm font-medium text-slate-700 mb-1">
                      <FaBook className="mr-2" />
                      Concepts Learned
                    </label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500"
                      value={learningSession.conceptsLearned}
                      onChange={(e) => setLearningSession({...learningSession, conceptsLearned: e.target.value})}
                      placeholder="What did you learn?"
                    />
                  </div>
                </div>
                <div>
                  <label className="flex items-center text-sm font-medium text-slate-700 mb-1">
                    <FaRegStickyNote className="mr-2" />
                    Notes
                  </label>
                  <textarea
                    className="w-full px-3 py-2 border border-slate-300 rounded-md resize-none focus:ring-2 focus:ring-indigo-500"
                    rows="3"
                    value={learningSession.notes}
                    onChange={(e) => setLearningSession({...learningSession, notes: e.target.value})}
                    placeholder="Key takeaways, challenges, or next steps..."
                  />
                </div>
                <button
                  className="w-full flex items-center justify-center px-4 py-2.5 bg-indigo-600 text-white font-semibold rounded-md shadow hover:bg-indigo-700 transition-colors disabled:bg-indigo-400 disabled:cursor-not-allowed"
                  onClick={handleLogSession}
                  disabled={!learningSession.techId || !learningSession.duration}
                >
                  <FaSave className="mr-2" />
                  Log Learning Session
                </button>
              </div>
            </InputCard>
          </div>
        );
      case 'analytics':
        return (
          <div className="space-y-6 md:space-y-8">
            <div className="bg-white p-3 md:p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col md:flex-row justify-between md:items-center gap-4">
              <h2 className="text-lg md:text-xl font-bold text-slate-800 flex items-center">
                <FaChartLine className="mr-2 md:mr-3" style={{ color: '#3B82F6' }} />
                Learning Analytics
              </h2>
              <div className="flex-shrink-0">
                <span className="relative z-0 inline-flex shadow-sm rounded-md">
                  {['daily', 'weekly', 'monthly'].map((period, i) => (
                    <button
                      key={period}
                      onClick={() => setViewPeriod(period)}
                      className={`relative inline-flex items-center px-3 py-1.5 md:px-4 md:py-2 text-sm font-medium transition-colors ${i === 0 ? 'rounded-l-md' : ''} ${i === 2 ? 'rounded-r-md' : ''} ${viewPeriod === period ? 'z-10 bg-indigo-50 border-indigo-500 text-indigo-600' : 'bg-white border-slate-300 text-slate-500 hover:bg-slate-50'}`}
                    >
                      {period.charAt(0).toUpperCase() + period.slice(1)}
                    </button>
                  ))}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
              <div className="lg:col-span-2 bg-white p-4 md:p-6 rounded-xl shadow-sm border border-slate-200">
                <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center">
                  <FaChartLine className="mr-2" />
                  Learning Progress - {viewPeriod.charAt(0).toUpperCase() + viewPeriod.slice(1)}
                </h3>
                <div className="h-64 md:h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={getChartData()} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="name" stroke="#64748b" fontSize={12} />
                      <YAxis stroke="#64748b" fontSize={12} />
                      <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '0.5rem' }} />
                      <Line
                        type="monotone"
                        dataKey="time"
                        name="Learning Time (min)"
                        stroke="#3B82F6"
                        strokeWidth={3}
                        dot={{ fill: '#3B82F6', strokeWidth: 2, r: 6 }}
                      />
                      <Line
                        type="monotone"
                        dataKey="tech"
                        name="Technologies"
                        stroke="#10B981"
                        strokeWidth={3}
                        dot={{ fill: '#10B981', strokeWidth: 2, r: 6 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div className="bg-white p-4 md:p-6 rounded-xl shadow-sm border border-slate-200">
                <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center">
                  <FaBook className="mr-2" />
                  Session History
                </h3>
                <div className="max-h-64 md:max-h-80 overflow-y-auto">
                  {historicalData.map(session => (
                    <div key={session.id} className="bg-slate-50 p-2 md:p-3 rounded-md mb-2">
                      <div className="flex flex-col md:flex-row justify-between">
                        <div>
                          <h6 className="font-semibold text-slate-800">{technologies.find(t => t.id === session.techId)?.name || 'Unknown'}</h6>
                          <p className="text-sm text-slate-600">{session.date.toDate().toLocaleDateString()}</p>
                        </div>
                        <div className="text-left md:text-right mt-2 md:mt-0">
                          <p className="font-semibold text-slate-800">{session.duration} minutes</p>
                          <p className="text-sm text-slate-600 truncate max-w-[150px] md:max-w-[200px]">
                            {session.conceptsLearned}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                  {historicalData.length === 0 && (
                    <div className="text-center py-4 text-slate-600">
                      No learning sessions logged yet
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-white p-4 md:p-6 rounded-xl shadow-sm border border-slate-200">
              <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center">
                <FaChartBar className="mr-2" />
                {viewPeriod.charAt(0).toUpperCase() + viewPeriod.slice(1)} Summary
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { label: 'Avg Time/Day', value: (getChartData().reduce((sum, d) => sum + d.time, 0) / getChartData().length).toFixed(1), unit: 'minutes', color: '#3B82F6' },
                  { label: 'Avg Tech/Day', value: (getChartData().reduce((sum, d) => sum + d.tech, 0) / getChartData().length).toFixed(1), unit: 'technologies', color: '#10B981' },
                  { label: 'Total Sessions', value: historicalData.length, unit: 'sessions', color: '#8B5CF6' },
                  { label: 'Completion Rate', value: stats.totalTech > 0 ? (stats.completedTech / stats.totalTech * 100).toFixed(1) : 0, unit: '% completed', color: '#F59E0B' }
                ].map((stat, idx) => (
                  <div key={idx} className="text-center">
                    <p className="text-xl md:text-2xl font-bold" style={{ color: stat.color }}>{stat.value}</p>
                    <p className="text-sm text-slate-600">{stat.label}</p>
                    <p className="text-xs text-slate-500">{stat.unit}</p>
                  </div>
                ))}
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
      <div className="p-4 md:p-6 lg:p-8">
        {/* Tab Navigation */}
        <div className="mb-2 md:mb-2 relative">
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
                    <Icon size={16} />
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

        {showAddTechModal && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
            <div className="bg-white p-5 md:p-7 rounded-lg shadow-xl w-full max-w-md m-4 overflow-y-auto max-h-[90vh]">
              <h2 className="text-lg md:text-xl font-bold text-slate-900 mb-4">Add New Technology</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Technology Name *</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500"
                    value={newTech.name}
                    onChange={(e) => setNewTech({...newTech, name: e.target.value})}
                    placeholder="e.g., React, Node.js"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500"
                      value={newTech.category}
                      onChange={(e) => setNewTech({...newTech, category: e.target.value})}
                      placeholder="e.g., Frontend"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Priority</label>
                    <select
                      className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500"
                      value={newTech.priority}
                      onChange={(e) => setNewTech({...newTech, priority: e.target.value})}
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Resource URL (optional)</label>
                  <input
                    type="url"
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500"
                    value={newTech.resourceUrl}
                    onChange={(e) => setNewTech({...newTech, resourceUrl: e.target.value})}
                    placeholder="https://docs.example.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Difficulty (1-5)</label>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map(star => (
                      <FaStar
                        key={star}
                        size={20}
                        color={star <= newTech.difficulty ? '#F59E0B' : '#e4e5e9'}
                        className="cursor-pointer"
                        onClick={() => setNewTech({...newTech, difficulty: star})}
                      />
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Target Hours to Master *</label>
                  <input
                    type="number"
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500"
                    value={newTech.targetHours}
                    onChange={(e) => setNewTech({...newTech, targetHours: parseInt(e.target.value) || 0})}
                    min="1"
                    placeholder="e.g., 50"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => setShowAddTechModal(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-800 font-semibold rounded-md hover:bg-slate-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddTechnology}
                  className="px-4 py-2 bg-indigo-600 text-white font-semibold rounded-md hover:bg-indigo-700 transition-colors"
                >
                  Add Technology
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CodingTracker;