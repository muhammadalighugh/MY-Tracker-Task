import React, { useState, useEffect } from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell
} from 'recharts';
import { 
  FaBook, FaBookOpen, FaBookmark, FaCalendarAlt, FaChartLine, 
  FaChartBar, FaRegStickyNote, FaSave, FaTrash, FaCheckCircle,
  FaSearch, FaPlus, FaStar, FaClock, FaListOl
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

const ReadingTracker = () => {
  const { collapsed } = useSidebar();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [viewPeriod, setViewPeriod] = useState('weekly');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [saved, setSaved] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showAddBookModal, setShowAddBookModal] = useState(false);
  const [historicalData, setHistoricalData] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  const [newBook, setNewBook] = useState({
    title: '',
    author: '',
    totalPages: '',
    genre: '',
    rating: 0
  });

  const [readingSession, setReadingSession] = useState({
    bookId: '',
    pagesRead: 0,
    duration: 0,
    notes: '',
    date: new Date().toISOString().split('T')[0]
  });

  const [books, setBooks] = useState([]);

  useEffect(() => {
    const savedBooks = JSON.parse(localStorage.getItem('book-study-books') || '[]');
    const savedHistory = JSON.parse(localStorage.getItem('book-study-history') || '[]');
    
    setBooks(savedBooks);
    setHistoricalData(savedHistory);
  }, []);

  const handleAddBook = () => {
    if (!newBook.title || !newBook.author) return;
    
    const book = {
      ...newBook,
      id: Date.now().toString(),
      currentPage: 0,
      status: 'not-started',
      addedDate: new Date().toISOString()
    };

    const updatedBooks = [...books, book];
    setBooks(updatedBooks);
    localStorage.setItem('book-study-books', JSON.stringify(updatedBooks));
    setNewBook({ title: '', author: '', totalPages: '', genre: '', rating: 0 });
    setShowAddBookModal(false);
  };

  const handleLogReading = () => {
    if (!readingSession.bookId || readingSession.pagesRead <= 0) return;

    const book = books.find(b => b.id === readingSession.bookId);
    if (!book) return;

    const updatedBooks = books.map(b => 
      b.id === readingSession.bookId 
        ? { ...b, currentPage: Math.min(b.currentPage + parseInt(readingSession.pagesRead), parseInt(b.totalPages)) }
        : b
    );

    const session = {
      ...readingSession,
      id: Date.now().toString(),
      bookTitle: book.title,
      pagesRead: parseInt(readingSession.pagesRead),
      duration: parseInt(readingSession.duration)
    };

    const updatedHistory = [...historicalData, session];
    
    setBooks(updatedBooks);
    setHistoricalData(updatedHistory);
    localStorage.setItem('book-study-books', JSON.stringify(updatedBooks));
    localStorage.setItem('book-study-history', JSON.stringify(updatedHistory));
    
    setReadingSession({
      bookId: '',
      pagesRead: 0,
      duration: 0,
      notes: '',
      date: new Date().toISOString().split('T')[0]
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleDeleteData = () => {
    localStorage.removeItem('book-study-books');
    localStorage.removeItem('book-study-history');
    setBooks([]);
    setHistoricalData([]);
    setShowDeleteConfirm(false);
  };

  const getReadingStats = () => {
    const totalBooks = books.length;
    const completedBooks = books.filter(b => b.currentPage >= b.totalPages).length;
    const totalPagesRead = books.reduce((sum, b) => sum + b.currentPage, 0);
    const totalReadingTime = historicalData.reduce((sum, s) => sum + s.duration, 0);

    return {
      totalBooks,
      completedBooks,
      totalPagesRead,
      totalReadingTime,
      readingSessions: historicalData.length
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

        const pagesRead = daySessions.reduce((sum, s) => sum + s.pagesRead, 0);
        const readingTime = daySessions.reduce((sum, s) => sum + s.duration, 0);

        data.push({
          name: day.toLocaleDateString('en-US', { weekday: 'short' }),
          pages: pagesRead,
          time: readingTime,
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

        const avgPages = weekSessions.length > 0 
          ? Math.round(weekSessions.reduce((sum, s) => sum + s.pagesRead, 0) / weekSessions.length)
          : 0;

        const avgTime = weekSessions.length > 0
          ? Math.round(weekSessions.reduce((sum, s) => sum + s.duration, 0) / weekSessions.length)
          : 0;

        data.push({
          name: `Week ${i + 1}`,
          pages: avgPages,
          time: avgTime,
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

        const avgPages = monthSessions.length > 0
          ? Math.round(monthSessions.reduce((sum, s) => sum + s.pagesRead, 0) / monthSessions.length)
          : 0;

        const avgTime = monthSessions.length > 0
          ? Math.round(monthSessions.reduce((sum, s) => sum + s.duration, 0) / monthSessions.length)
          : 0;

        data.push({
          name: month.toLocaleDateString('en-US', { month: 'short' }),
          pages: avgPages,
          time: avgTime,
          sessions: monthSessions.length
        });
      }
    }

    return data;
  };

  const getPieChartData = () => {
    const genreCount = {};
    books.forEach(book => {
      genreCount[book.genre] = (genreCount[book.genre] || 0) + 1;
    });

    return Object.entries(genreCount).map(([genre, count]) => ({
      name: genre || 'Uncategorized',
      value: count,
      color: COLORS[Object.keys(genreCount).indexOf(genre) % COLORS.length]
    }));
  };

  const stats = getReadingStats();
  const filteredBooks = books.filter(book => 
    book.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    book.author.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className={`min-h-screen bg-slate-50 transition-all duration-300 ${collapsed ? "lg:ml-20" : "lg:ml-64"}`}>
      <div className="p-6 md:p-8">
        <div className="flex flex-col md:flex-row justify-between md:items-center mb-8 gap-4">
          <h1 className="text-3xl font-bold text-slate-900">Book Tracker</h1>
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/')}
              className="px-4 py-2 text-sm font-semibold rounded-md flex items-center gap-2 bg-gray-800 text-white hover:bg-gray-900 transition-colors"
            >
              <FaBook size={16} />
              Home
            </button>
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`px-4 py-2 text-sm font-semibold rounded-md flex items-center gap-2 transition-colors ${activeTab === 'dashboard' ? 'bg-indigo-600 text-white shadow' : 'bg-white text-slate-600 hover:bg-slate-100 border'}`}
            >
              <FaBookOpen size={16} />
              Dashboard
            </button>
            <button
              onClick={() => setActiveTab('analytics')}
              className={`px-4 py-2 text-sm font-semibold rounded-md flex items-center gap-2 transition-colors ${activeTab === 'analytics' ? 'bg-indigo-600 text-white shadow' : 'bg-white text-slate-600 hover:bg-slate-100 border'}`}
            >
              <FaChartLine size={16} />
              Analytics
            </button>
          </div>
        </div>

        {activeTab === 'dashboard' && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard
                icon={FaBook}
                title="Total Books"
                value={stats.totalBooks}
                subValue={`${stats.completedBooks} completed`}
                color="#3B82F6"
              />
              <StatCard
                icon={FaListOl}
                title="Pages Read"
                value={stats.totalPagesRead}
                subValue={`${Math.round(stats.totalPagesRead / 300)} books equivalent`}
                color="#8B5CF6"
              />
              <StatCard
                icon={FaClock}
                title="Reading Time"
                value={`${Math.round(stats.totalReadingTime / 60)}h`}
                subValue={`${stats.totalReadingTime} minutes`}
                color="#10B981"
              />
              <StatCard
                icon={FaCheckCircle}
                title="Reading Sessions"
                value={stats.readingSessions}
                subValue={`${stats.readingSessions > 0 ? Math.round(stats.totalPagesRead / stats.readingSessions) : 0} pages/session`}
                color="#F59E0B"
              />
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200">
              <div className="p-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-5 gap-4">
                  <h3 className="text-xl font-bold text-slate-800 flex items-center">
                    <FaBook className="w-6 h-6 mr-3" style={{ color: '#3B82F6' }} />
                    My Books
                  </h3>
                  <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                    <div className="relative w-full sm:w-64">
                      <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500"
                        placeholder="Search books..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>
                    <button
                      onClick={() => setShowAddBookModal(true)}
                      className="px-4 py-2 bg-indigo-600 text-white font-semibold rounded-md flex items-center justify-center hover:bg-indigo-700 transition-colors"
                    >
                      <FaPlus className="mr-2" />
                      Add Book
                    </button>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50 text-sm text-slate-600">
                      <tr>
                        <th className="p-3 font-semibold">Title</th>
                        <th className="p-3 font-semibold">Author</th>
                        <th className="p-3 font-semibold">Genre</th>
                        <th className="p-3 font-semibold">Progress</th>
                        <th className="p-3 font-semibold">Rating</th>
                        <th className="p-3 font-semibold">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredBooks.map(book => (
                        <tr key={book.id} className="border-t border-slate-200">
                          <td className="p-3 font-medium text-slate-800">{book.title}</td>
                          <td className="p-3">{book.author}</td>
                          <td className="p-3">{book.genre || '-'}</td>
                          <td className="p-3">
                            <div className="w-full bg-slate-200 rounded-full h-5">
                              <div
                                className="h-5 rounded-full"
                                style={{
                                  width: `${(book.currentPage / book.totalPages) * 100}%`,
                                  backgroundColor: '#3B82F6'
                                }}
                              >
                                <span className="text-xs text-white font-medium pl-2">
                                  {Math.round((book.currentPage / book.totalPages) * 100)}%
                                </span>
                              </div>
                            </div>
                            <p className="text-sm text-slate-600 mt-1">{book.currentPage}/{book.totalPages} pages</p>
                          </td>
                          <td className="p-3">
                            {[...Array(5)].map((_, i) => (
                              <FaStar 
                                key={i} 
                                color={i < book.rating ? '#F59E0B' : '#e4e5e9'} 
                              />
                            ))}
                          </td>
                          <td className="p-3">
                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                              book.currentPage >= book.totalPages ? 'bg-green-100 text-green-600' :
                              book.currentPage > 0 ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'
                            }`}>
                              {book.currentPage >= book.totalPages ? 'Completed' :
                               book.currentPage > 0 ? 'In Progress' : 'Not Started'}
                            </span>
                          </td>
                        </tr>
                      ))}
                      {filteredBooks.length === 0 && (
                        <tr>
                          <td colSpan="6" className="p-4 text-center text-slate-600">
                            No books found. Add your first book to get started!
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
                <InputCard icon={FaBookOpen} title="Log Reading Session" color="#8B5CF6">
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
                          value={readingSession.date}
                          onChange={(e) => setReadingSession({...readingSession, date: e.target.value})}
                        />
                      </div>
                      <div>
                        <label className="flex items-center text-sm font-medium text-slate-700 mb-1">
                          <FaBook className="mr-2" />
                          Book
                        </label>
                        <select
                          className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500"
                          value={readingSession.bookId}
                          onChange={(e) => setReadingSession({...readingSession, bookId: e.target.value})}
                        >
                          <option value="">Select a book</option>
                          {books.map(book => (
                            <option key={book.id} value={book.id}>
                              {book.title} by {book.author}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="flex items-center text-sm font-medium text-slate-700 mb-1">
                          <FaListOl className="mr-2" />
                          Pages Read
                        </label>
                        <input
                          type="number"
                          className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500"
                          value={readingSession.pagesRead}
                          onChange={(e) => setReadingSession({...readingSession, pagesRead: e.target.value})}
                          min="1"
                        />
                      </div>
                      <div>
                        <label className="flex items-center text-sm font-medium text-slate-700 mb-1">
                          <FaClock className="mr-2" />
                          Duration (minutes)
                        </label>
                        <input
                          type="number"
                          className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500"
                          value={readingSession.duration}
                          onChange={(e) => setReadingSession({...readingSession, duration: e.target.value})}
                          min="1"
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
                        value={readingSession.notes}
                        onChange={(e) => setReadingSession({...readingSession, notes: e.target.value})}
                        placeholder="Thoughts, reflections, or key takeaways..."
                      />
                    </div>
                    <button
                      className="w-full flex items-center justify-center px-4 py-2.5 bg-indigo-600 text-white font-semibold rounded-md shadow hover:bg-indigo-700 transition-colors disabled:bg-indigo-400 disabled:cursor-not-allowed"
                      onClick={handleLogReading}
                      disabled={!readingSession.bookId || !readingSession.pagesRead}
                    >
                      <FaSave className="mr-2" />
                      Log Reading Session
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
                    <h5 className="text-lg font-semibold text-slate-800 mb-4">Reading Distribution</h5>
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
                Reading Analytics
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
                  Reading Progress - {viewPeriod.charAt(0).toUpperCase() + viewPeriod.slice(1)}
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
                        dataKey="pages"
                        name="Pages Read"
                        stroke="#3B82F6"
                        strokeWidth={3}
                        dot={{ fill: '#3B82F6', strokeWidth: 2, r: 6 }}
                      />
                      <Line
                        type="monotone"
                        dataKey="time"
                        name="Time (min)"
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
                  <FaBookmark className="mr-2" />
                  Recent Sessions
                </h3>
                <div className="max-h-80 overflow-y-auto">
                  {historicalData.slice(0, 5).map(session => (
                    <div key={session.id} className="bg-slate-50 p-3 rounded-md mb-2">
                      <div className="flex justify-between">
                        <div>
                          <h6 className="font-semibold text-slate-800">{session.bookTitle}</h6>
                          <p className="text-sm text-slate-600">{session.date}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-slate-800">{session.pagesRead} pages</p>
                          <p className="text-sm text-slate-600">{session.duration} minutes</p>
                        </div>
                      </div>
                    </div>
                  ))}
                  {historicalData.length === 0 && (
                    <div className="text-center py-4 text-slate-600">
                      No reading sessions logged yet
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
                  { label: 'Avg Pages/Day', value: (getChartData().reduce((sum, d) => sum + d.pages, 0) / getChartData().length).toFixed(1), unit: 'pages', color: '#3B82F6' },
                  { label: 'Avg Time/Day', value: (getChartData().reduce((sum, d) => sum + d.time, 0) / getChartData().length).toFixed(1), unit: 'minutes', color: '#10B981' },
                  { label: 'Total Sessions', value: historicalData.length, unit: 'sessions', color: '#8B5CF6' },
                  { label: 'Pages/Minute', value: stats.totalPagesRead > 0 ? (stats.totalPagesRead / stats.totalReadingTime).toFixed(2) : 0, unit: 'ratio', color: '#F59E0B' }
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

        {showAddBookModal && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
            <div className="bg-white p-7 rounded-lg shadow-xl w-full max-w-md m-4">
              <h2 className="text-xl font-bold text-slate-900 mb-2">Add New Book</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Title</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500"
                    value={newBook.title}
                    onChange={(e) => setNewBook({...newBook, title: e.target.value})}
                    placeholder="Enter book title"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Author</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500"
                    value={newBook.author}
                    onChange={(e) => setNewBook({...newBook, author: e.target.value})}
                    placeholder="Enter author name"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Total Pages</label>
                    <input
                      type="number"
                      className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500"
                      value={newBook.totalPages}
                      onChange={(e) => setNewBook({...newBook, totalPages: e.target.value})}
                      min="1"
                      placeholder="Enter total pages"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Genre</label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500"
                      value={newBook.genre}
                      onChange={(e) => setNewBook({...newBook, genre: e.target.value})}
                      placeholder="Fiction, Science, etc."
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Rating</label>
                  <div className="flex gap-1">
                    {[...Array(5)].map((_, i) => (
                      <FaStar 
                        key={i} 
                        color={i < newBook.rating ? '#F59E0B' : '#e4e5e9'} 
                        className="cursor-pointer"
                        onClick={() => setNewBook({...newBook, rating: i + 1})}
                      />
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => setShowAddBookModal(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-800 font-semibold rounded-md hover:bg-slate-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddBook}
                  className="px-4 py-2 bg-indigo-600 text-white font-semibold rounded-md hover:bg-indigo-700 transition-colors"
                >
                  Add Book
                </button>
              </div>
            </div>
          </div>
        )}

        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
            <div className="bg-white p-7 rounded-lg shadow-xl w-full max-w-md m-4">
              <h2 className="text-xl font-bold text-slate-900 mb-2">Confirm Deletion</h2>
              <p className="text-slate-600 mb-6">Are you sure you want to delete ALL your book data? This action cannot be undone.</p>
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

export default ReadingTracker;