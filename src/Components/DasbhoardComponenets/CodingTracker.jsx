import React, { useState, useEffect } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from 'recharts';
import {
  FaCode, FaLaptopCode, FaBook, FaClock, FaCalendarAlt,
  FaChartLine, FaChartBar, FaRegStickyNote, FaSave, FaTrash,
  FaCheckCircle, FaPlus, FaSearch, FaStar, FaExternalLinkAlt
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

const CodingTracker = () => {
  const { collapsed } = useSidebar();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [viewPeriod, setViewPeriod] = useState('weekly');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [saved, setSaved] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showAddTechModal, setShowAddTechModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [historicalData, setHistoricalData] = useState([]);
  const navigate = useNavigate();

  const [newTech, setNewTech] = useState({
    name: '',
    category: '',
    resourceUrl: '',
    difficulty: 0,
    priority: 'medium'
  });

  const [learningSession, setLearningSession] = useState({
    techId: '',
    duration: 0,
    conceptsLearned: '',
    notes: '',
    date: new Date().toISOString().split('T')[0]
  });

  const [technologies, setTechnologies] = useState([]);

  useEffect(() => {
    const savedTech = JSON.parse(localStorage.getItem('coding-tech-list') || '[]');
    const savedHistory = JSON.parse(localStorage.getItem('coding-session-history') || '[]');
    
    setTechnologies(savedTech);
    setHistoricalData(savedHistory);
  }, []);

  const handleAddTechnology = () => {
    if (!newTech.name) return;
    
    const tech = {
      ...newTech,
      id: Date.now().toString(),
      totalTime: 0,
      sessions: 0,
      addedDate: new Date().toISOString(),
      lastPracticed: '',
      mastery: 0
    };

    const updatedTech = [...technologies, tech];
    setTechnologies(updatedTech);
    localStorage.setItem('coding-tech-list', JSON.stringify(updatedTech));
    setNewTech({ name: '', category: '', resourceUrl: '', difficulty: 0, priority: 'medium' });
    setShowAddTechModal(false);
  };

  const handleLogSession = () => {
    if (!learningSession.techId || learningSession.duration <= 0) return;

    const tech = technologies.find(t => t.id === learningSession.techId);
    if (!tech) return;

    const updatedTech = technologies.map(t => 
      t.id === learningSession.techId 
        ? { 
            ...t, 
            totalTime: t.totalTime + parseInt(learningSession.duration),
            sessions: t.sessions + 1,
            lastPracticed: date,
            mastery: Math.min(t.mastery + (parseInt(learningSession.duration) / 60), 100)
          }
        : t
    );

    const session = {
      ...learningSession,
      id: Date.now().toString(),
      techName: tech.name,
      duration: parseInt(learningSession.duration),
      date: date
    };

    const updatedHistory = [...historicalData, session];
    
    setTechnologies(updatedTech);
    setHistoricalData(updatedHistory);
    localStorage.setItem('coding-tech-list', JSON.stringify(updatedTech));
    localStorage.setItem('coding-session-history', JSON.stringify(updatedHistory));
    
    setLearningSession({
      techId: '',
      duration: 0,
      conceptsLearned: '',
      notes: '',
      date: new Date().toISOString().split('T')[0]
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleDeleteData = () => {
    localStorage.removeItem('coding-tech-list');
    localStorage.removeItem('coding-session-history');
    setTechnologies([]);
    setHistoricalData([]);
    setShowDeleteConfirm(false);
  };

  const getLearningStats = () => {
    const totalTech = technologies.length;
    const totalTime = technologies.reduce((sum, t) => sum + t.totalTime, 0);
    const masteredTech = technologies.filter(t => t.mastery >= 80).length;
    const activeTech = technologies.filter(t => t.totalTime > 0).length;

    return {
      totalTech,
      masteredTech,
      activeTech,
      totalTime,
      totalHours: Math.round(totalTime / 60),
      totalSessions: historicalData.length
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
        const daySessions = historicalData.filter(s => s.date === dayStr);

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
          const sessionDate = new Date(s.date);
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
          const sessionDate = new Date(s.date);
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

  return (
    <div className={`min-h-screen bg-slate-50 transition-all duration-300 ${collapsed ? "lg:ml-20" : "lg:ml-64"}`}>
      <div className="p-6 md:p-8">
        <div className="flex flex-col md:flex-row justify-between md:items-center mb-8 gap-4">
          <h1 className="text-3xl font-bold text-slate-900">Coding Tracker</h1>
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/')}
              className="px-4 py-2 text-sm font-semibold rounded-md flex items-center gap-2 bg-gray-800 text-white hover:bg-gray-900 transition-colors"
            >
              <FaCode size={16} /> Home
            </button>
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`px-4 py-2 text-sm font-semibold rounded-md flex items-center gap-2 transition-colors ${activeTab === 'dashboard' ? 'bg-indigo-600 text-white shadow' : 'bg-white text-slate-600 hover:bg-slate-100 border'}`}
            >
              <FaLaptopCode size={16} /> Dashboard
            </button>
            <button
              onClick={() => setActiveTab('analytics')}
              className={`px-4 py-2 text-sm font-semibold rounded-md flex items-center gap-2 transition-colors ${activeTab === 'analytics' ? 'bg-indigo-600 text-white shadow' : 'bg-white text-slate-600 hover:bg-slate-100 border'}`}
            >
              <FaChartLine size={16} /> Analytics
            </button>
          </div>
        </div>

        {activeTab === 'dashboard' && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
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
                title="Mastered"
                value={stats.masteredTech}
                subValue={`${stats.totalTech > 0 ? Math.round((stats.masteredTech / stats.totalTech) * 100) : 0}%`}
                color="#10B981"
              />
              <StatCard
                icon={FaBook}
                title="Sessions"
                value={stats.totalSessions}
                subValue={`${stats.totalSessions > 0 ? Math.round(stats.totalTime / stats.totalSessions) : 0} min/session`}
                color="#F59E0B"
              />
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200">
              <div className="p-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-5 gap-4">
                  <h3 className="text-xl font-bold text-slate-800 flex items-center">
                    <FaCode className="w-6 h-6 mr-3" style={{ color: '#3B82F6' }} />
                    My Technologies
                  </h3>
                  <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                    <div className="relative w-full sm:w-64">
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
                  <table className="w-full text-left">
                    <thead className="bg-slate-50 text-sm text-slate-600">
                      <tr>
                        <th className="p-3 font-semibold">Technology</th>
                        <th className="p-3 font-semibold">Category</th>
                        <th className="p-3 font-semibold">Mastery</th>
                        <th className="p-3 font-semibold">Time Spent</th>
                        <th className="p-3 font-semibold">Priority</th>
                        <th className="p-3 font-semibold">Last Practiced</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredTech.map(tech => (
                        <tr key={tech.id} className="border-t border-slate-200">
                          <td className="p-3 font-medium text-slate-800">
                            {tech.name}
                            {tech.resourceUrl && (
                              <a href={tech.resourceUrl} target="_blank" rel="noopener noreferrer" className="ml-2 text-indigo-600 hover:text-indigo-800">
                                <FaExternalLinkAlt size={12} />
                              </a>
                            )}
                          </td>
                          <td className="p-3">{tech.category || '-'}</td>
                          <td className="p-3">
                            <div className="w-full bg-slate-200 rounded-full h-5">
                              <div
                                className="h-5 rounded-full"
                                style={{
                                  width: `${tech.mastery}%`,
                                  backgroundColor:
                                    tech.mastery >= 80 ? '#10B981' :
                                    tech.mastery >= 50 ? '#3B82F6' : '#F59E0B'
                                }}
                              >
                                <span className="text-xs text-white font-medium pl-2">{tech.mastery}%</span>
                              </div>
                            </div>
                          </td>
                          <td className="p-3">
                            {Math.floor(tech.totalTime / 60)}h {tech.totalTime % 60}m
                          </td>
                          <td className="p-3">
                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                              tech.priority === 'high' ? 'bg-red-100 text-red-600' :
                              tech.priority === 'medium' ? 'bg-yellow-100 text-yellow-600' : 'bg-gray-100 text-gray-600'
                            }`}>
                              {tech.priority}
                            </span>
                          </td>
                          <td className="p-3">
                            {tech.lastPracticed ? new Date(tech.lastPracticed).toLocaleDateString() : 'Never'}
                          </td>
                        </tr>
                      ))}
                      {filteredTech.length === 0 && (
                        <tr>
                          <td colSpan="6" className="p-4 text-center text-slate-600">
                            No technologies found. Add your first technology to get started!
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
                          {technologies.map(tech => (
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
                    {saved && (
                      <div className="flex items-center p-3 bg-emerald-50 text-emerald-700 rounded-md text-sm">
                        <FaCheckCircle size={16} className="mr-2" />
                        Successfully saved!
                      </div>
                    )}
                  </div>
                </InputCard>
              </div>
              <div>
                <InputCard icon={FaChartBar} title="Quick Stats" color="#10B981">
                  <div className="mb-4">
                    <h5 className="text-lg font-semibold text-slate-800 mb-4">Technology Distribution</h5>
                    <div className="h-64">
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
                  </div>
                  <button
                    className="w-full flex items-center justify-center px-4 py-2 border border-red-300 text-red-600 font-semibold rounded-md hover:bg-red-50 hover:border-red-500 transition-colors"
                    onClick={() => setShowDeleteConfirm(true)}
                  >
                    <FaTrash className="mr-2" />
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
                <FaChartLine className="mr-3" style={{ color: '#3B82F6' }} />
                Learning Analytics
              </h2>
              <div className="flex-shrink-0">
                <span className="relative z-0 inline-flex shadow-sm rounded-md">
                  {['daily', 'weekly', 'monthly'].map((period, i) => (
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

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center">
                  <FaChartLine className="mr-2" />
                  Learning Progress - {viewPeriod.charAt(0).toUpperCase() + viewPeriod.slice(1)}
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
              <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center">
                  <FaBook className="mr-2" />
                  Recent Sessions
                </h3>
                <div className="max-h-80 overflow-y-auto">
                  {historicalData.slice(0, 5).map(session => (
                    <div key={session.id} className="bg-slate-50 p-3 rounded-md mb-2">
                      <div className="flex justify-between">
                        <div>
                          <h6 className="font-semibold text-slate-800">{session.techName}</h6>
                          <p className="text-sm text-slate-600">{session.date}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-slate-800">{session.duration} minutes</p>
                          <p className="text-sm text-slate-600 truncate" style={{ maxWidth: '150px' }}>
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

            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
              <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center">
                <FaChartBar className="mr-2" />
                {viewPeriod.charAt(0).toUpperCase() + viewPeriod.slice(1)} Summary
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { label: 'Avg Time/Day', value: (getChartData().reduce((sum, d) => sum + d.time, 0) / getChartData().length).toFixed(1), unit: 'minutes', color: '#3B82F6' },
                  { label: 'Avg Tech/Day', value: (getChartData().reduce((sum, d) => sum + d.tech, 0) / getChartData().length).toFixed(1), unit: 'technologies', color: '#10B981' },
                  { label: 'Total Sessions', value: historicalData.length, unit: 'sessions', color: '#8B5CF6' },
                  { label: 'Mastery Rate', value: stats.totalTime > 0 ? (stats.masteredTech / stats.totalTech * 100).toFixed(1) : 0, unit: '% mastered', color: '#F59E0B' }
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

        {showAddTechModal && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
            <div className="bg-white p-7 rounded-lg shadow-xl w-full max-w-md m-4">
              <h2 className="text-xl font-bold text-slate-900 mb-2">Add New Technology</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Technology Name</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500"
                    value={newTech.name}
                    onChange={(e) => setNewTech({...newTech, name: e.target.value})}
                    placeholder="e.g., React, Node.js, Python"
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
                      placeholder="e.g., Frontend, Backend, Database"
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
                    placeholder="https://"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Difficulty (1-5)</label>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map(star => (
                      <FaStar
                        key={star}
                        color={star <= newTech.difficulty ? '#F59E0B' : '#e4e5e9'}
                        className="cursor-pointer"
                        onClick={() => setNewTech({...newTech, difficulty: star})}
                      />
                    ))}
                  </div>
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

        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
            <div className="bg-white p-7 rounded-lg shadow-xl w-full max-w-md m-4">
              <h2 className="text-xl font-bold text-slate-900 mb-2">Confirm Deletion</h2>
              <p className="text-slate-600 mb-6">Are you sure you want to delete ALL your coding learning data? This action cannot be undone.</p>
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

export default CodingTracker;