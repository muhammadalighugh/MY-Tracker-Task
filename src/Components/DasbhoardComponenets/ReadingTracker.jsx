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
import { useSidebar } from '../../context/SidebarContext';
import { auth, db } from '../../firebase/firebase.config';
import { doc, collection, addDoc, getDocs, deleteDoc, updateDoc, onSnapshot, setDoc } from 'firebase/firestore';
import { useAuthState } from 'react-firebase-hooks/auth';
import { toast } from 'react-toastify';

// Error Boundary Component
class ReadingTrackerErrorBoundary extends React.Component {
  state = { hasError: false };

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error in ReadingTracker:', error, errorInfo);
    toast.error('An error occurred in the Reading Tracker. Please try again.');
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center min-h-screen p-4 bg-slate-50">
          <div className="w-full max-w-md p-6 text-center bg-white rounded-xl shadow-lg">
            <h2 className="mb-2 text-xl font-bold text-red-600">Something went wrong.</h2>
            <p className="text-slate-600">Please refresh the page or try again later.</p>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

const COLORS = ['#3B82F6', '#8B5CF6', '#10B981', '#F59E0B', '#EF4444', '#4F46E5'];

const StatCard = ({ icon: Icon, title, value, subValue, color }) => (
  <div className="flex flex-col justify-between h-full p-4 bg-white border border-slate-200 rounded-xl shadow-sm lg:p-6">
    <div>
      <div className="flex items-center mb-3 text-slate-500">
        <div className="flex items-center justify-center w-10 h-10 rounded-lg lg:w-12 lg:h-12" style={{ backgroundColor: `${color}15` }}>
          <Icon className="w-5 h-5 lg:w-6 lg:h-6" style={{ color }} />
        </div>
        <h3 className="ml-3 text-sm font-semibold lg:text-base">{title}</h3>
      </div>
      <p className="text-2xl font-bold lg:text-3xl xl:text-4xl text-slate-800">{value}</p>
    </div>
    {subValue && <p className="mt-2 text-xs text-slate-400 lg:text-sm">{subValue}</p>}
  </div>
);

const InputCard = ({ icon: Icon, title, children, color }) => (
  <div className="h-full bg-white border border-slate-200 rounded-xl shadow-sm">
    <div className="p-4 lg:p-6">
      <div className="flex items-center mb-4 lg:mb-6">
        <div className="flex items-center justify-center w-10 h-10 mr-3 rounded-lg lg:w-12 lg:h-12" style={{ backgroundColor: `${color}15` }}>
          <Icon className="w-5 h-5 lg:w-6 lg:h-6" style={{ color }} />
        </div>
        <h3 className="text-lg font-bold lg:text-xl text-slate-800">{title}</h3>
      </div>
      {children}
    </div>
  </div>
);

const ReadingTracker = () => {
  const { collapsed } = useSidebar();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [viewPeriod, setViewPeriod] = useState('weekly');
  const [showAddBookModal, setShowAddBookModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [books, setBooks] = useState([]);
  const [historicalData, setHistoricalData] = useState([]);
  const [dailyGoal, setDailyGoal] = useState(10);
  const [streak, setStreak] = useState(0);
  const [user, loading, error] = useAuthState(auth);

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

  // Fetch data from Firestore
  useEffect(() => {
    if (!user) return;

    const booksRef = collection(db, 'users', user.uid, 'books');
    const sessionsRef = collection(db, 'users', user.uid, 'readingSessions');
    const settingsRef = doc(db, 'users', user.uid, 'settings', 'userSettings');

    // Initialize settings document if it doesn't exist
    const initializeSettings = async () => {
      try {
        await setDoc(settingsRef, { dailyGoal: 10, streak: 0, lastGoalMet: null }, { merge: true });
      } catch (err) {
        console.error('Failed to initialize settings:', err);
        toast.error('Failed to initialize settings: ' + err.message);
      }
    };

    // Fetch books
    const unsubscribeBooks = onSnapshot(booksRef, (snapshot) => {
      const booksData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setBooks(booksData);
    }, (err) => {
      toast.error('Failed to fetch books: ' + err.message);
    });

    // Fetch reading sessions
    const unsubscribeSessions = onSnapshot(sessionsRef, (snapshot) => {
      const sessionsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setHistoricalData(sessionsData);
    }, (err) => {
      toast.error('Failed to fetch reading sessions: ' + err.message);
    });

    // Fetch settings
    const unsubscribeSettings = onSnapshot(settingsRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setDailyGoal(data.dailyGoal || 10);
        setStreak(data.streak || 0);
      } else {
        initializeSettings();
      }
    }, (err) => {
      toast.error('Failed to fetch settings: ' + err.message);
    });

    return () => {
      unsubscribeBooks();
      unsubscribeSessions();
      unsubscribeSettings();
    };
  }, [user]);

  // Handle loading and error states
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-100">
        <div className="w-12 h-12 border-t-2 border-b-2 border-indigo-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error) {
    toast.error('Authentication error: ' + error.message);
    return null; // ProtectedRoute should handle redirect
  }

  // Update streak based on daily goal
  useEffect(() => {
    if (!user || historicalData.length === 0) return;

    const checkStreak = async () => {
      try {
        const today = new Date().toISOString().split('T')[0];
        const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
        const todaySessions = historicalData.filter(s => s.date === today);
        const yesterdaySessions = historicalData.filter(s => s.date === yesterday);

        const todayPages = todaySessions.reduce((sum, s) => sum + s.pagesRead, 0);
        const yesterdayPages = yesterdaySessions.reduce((sum, s) => sum + s.pagesRead, 0);

        const settingsRef = doc(db, 'users', user.uid, 'settings', 'userSettings');
        if (todayPages >= dailyGoal) {
          await updateDoc(settingsRef, { streak: streak + 1, lastGoalMet: today });
          setStreak(streak + 1);
          toast.success(`Streak updated! Current streak: ${streak + 1} days`);
        } else if (yesterdayPages >= dailyGoal && todayPages < dailyGoal) {
          await updateDoc(settingsRef, { streak: 0, lastGoalMet: null });
          setStreak(0);
          toast.warn('Streak broken! Read more to start a new streak.');
        }
      } catch (err) {
        toast.error('Failed to update streak: ' + err.message);
      }
    };

    checkStreak();
  }, [historicalData, dailyGoal, user, streak]);

  const handleAddBook = async () => {
    if (!newBook.title || !newBook.author || !user) {
      toast.error('Please fill in title and author');
      return;
    }

    try {
      const book = {
        ...newBook,
        totalPages: parseInt(newBook.totalPages),
        currentPage: 0,
        status: 'not-started',
        addedDate: new Date().toISOString(),
        userId: user.uid
      };

      await addDoc(collection(db, 'users', user.uid, 'books'), book);
      setNewBook({ title: '', author: '', totalPages: '', genre: '', rating: 0 });
      setShowAddBookModal(false);
      toast.success('Book added successfully!');
    } catch (err) {
      toast.error('Failed to add book: ' + err.message);
    }
  };

  const handleLogReading = async () => {
    if (!readingSession.bookId || readingSession.pagesRead <= 0 || !user) {
      toast.error('Please select a book and enter pages read');
      return;
    }

    const book = books.find(b => b.id === readingSession.bookId);
    if (!book) {
      toast.error('Selected book not found');
      return;
    }

    try {
      const bookRef = doc(db, 'users', user.uid, 'books', readingSession.bookId);
      await updateDoc(bookRef, {
        currentPage: Math.min(book.currentPage + parseInt(readingSession.pagesRead), parseInt(book.totalPages)),
        status: book.currentPage + parseInt(readingSession.pagesRead) >= parseInt(book.totalPages) ? 'completed' : 'in-progress'
      });

      const session = {
        ...readingSession,
        bookTitle: book.title,
        pagesRead: parseInt(readingSession.pagesRead),
        duration: parseInt(readingSession.duration),
        userId: user.uid
      };

      await addDoc(collection(db, 'users', user.uid, 'readingSessions'), session);
      setReadingSession({
        bookId: '',
        pagesRead: 0,
        duration: 0,
        notes: '',
        date: new Date().toISOString().split('T')[0]
      });
      toast.success('Reading session logged successfully!');
    } catch (err) {
      toast.error('Failed to log reading session: ' + err.message);
    }
  };

  const handleDeleteData = async () => {
    if (!user) return;

    try {
      const booksRef = collection(db, 'users', user.uid, 'books');
      const booksSnapshot = await getDocs(booksRef);
      const deleteBooksPromises = booksSnapshot.docs.map(doc => deleteDoc(doc.ref));
      await Promise.all(deleteBooksPromises);

      const sessionsRef = collection(db, 'users', user.uid, 'readingSessions');
      const sessionsSnapshot = await getDocs(sessionsRef);
      const deleteSessionsPromises = sessionsSnapshot.docs.map(doc => deleteDoc(doc.ref));
      await Promise.all(deleteSessionsPromises);

      const settingsRef = doc(db, 'users', user.uid, 'settings', 'userSettings');
      await setDoc(settingsRef, { dailyGoal: 10, streak: 0, lastGoalMet: null });

      setShowDeleteConfirm(false);
      toast.success('All data deleted successfully!');
    } catch (err) {
      toast.error('Failed to delete data: ' + err.message);
    }
  };

  const handleSetDailyGoal = async (goal) => {
    if (!user || goal <= 0) {
      toast.error('Please enter a valid daily goal');
      return;
    }

    try {
      const settingsRef = doc(db, 'users', user.uid, 'settings', 'userSettings');
      await updateDoc(settingsRef, { dailyGoal: parseInt(goal) });
      setDailyGoal(parseInt(goal));
      toast.success(`Daily goal set to ${goal} pages!`);
    } catch (err) {
      toast.error('Failed to set daily goal: ' + err.message);
    }
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
      readingSessions: historicalData.length,
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
    <ReadingTrackerErrorBoundary>
      <div className={`min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 transition-all duration-300 ${collapsed ? 'ml-0 lg:ml-20' : 'ml-0 lg:ml-64'} max-w-full`}>
        <div className="p-4 lg:p-6 xl:p-8">
          {/* Header */}
          <div className="flex flex-col gap-4 mb-6 lg:flex-row lg:items-center lg:justify-between lg:mb-8">
            <h1 className="text-2xl font-bold lg:text-3xl xl:text-4xl text-slate-900">Book Tracker</h1>
            <div className="flex flex-col gap-2 lg:flex-row lg:items-center">
              <button
                onClick={() => setActiveTab('dashboard')}
                className={`flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-lg transition-all lg:justify-start ${activeTab === 'dashboard' ? 'bg-indigo-600 text-white shadow-md' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-300'}`}
              >
                <FaBookOpen className="w-4 h-4" />
                <span>Dashboard</span>
              </button>
              <button
                onClick={() => setActiveTab('log')}
                className={`flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-lg transition-all lg:justify-start ${activeTab === 'log' ? 'bg-indigo-600 text-white shadow-md' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-300'}`}
              >
                <FaRegStickyNote className="w-4 h-4" />
                <span>Log Session</span>
              </button>
              <button
                onClick={() => setActiveTab('analytics')}
                className={`flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-lg transition-all lg:justify-start ${activeTab === 'analytics' ? 'bg-indigo-600 text-white shadow-md' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-300'}`}
              >
                <FaChartLine className="w-4 h-4" />
                <span>Analytics</span>
              </button>
            </div>
          </div>

          {activeTab === 'dashboard' && (
            <div className="space-y-6 lg:space-y-8">
              {/* Stats Cards */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 lg:gap-6">
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
                <StatCard
                  icon={FaStar}
                  title="Current Streak"
                  value={`${stats.streak} days`}
                  subValue={`Goal: ${dailyGoal} pages/day`}
                  color="#EF4444"
                />
              </div>

              {/* Daily Goal Section */}
              <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-sm lg:p-6">
                <h3 className="flex items-center mb-4 text-lg font-bold lg:text-xl text-slate-800 lg:mb-6">
                  <div className="flex items-center justify-center w-10 h-10 mr-3 rounded-lg lg:w-12 lg:h-12 bg-blue-50">
                    <FaBook className="w-5 h-5 lg:w-6 lg:h-6 text-blue-600" />
                  </div>
                  Set Daily Goal
                </h3>
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
                  <div className="flex-1 lg:flex-none">
                    <input
                      type="number"
                      className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent lg:w-40"
                      value={dailyGoal}
                      onChange={(e) => setDailyGoal(e.target.value)}
                      min="1"
                      placeholder="Pages per day"
                    />
                  </div>
                  <button
                    onClick={() => handleSetDailyGoal(dailyGoal)}
                    className="px-6 py-2.5 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-colors"
                  >
                    Set Goal
                  </button>
                </div>
              </div>

              {/* Books Table */}
              <div className="bg-white border border-slate-200 rounded-xl shadow-sm">
                <div className="p-4 lg:p-6">
                  <div className="flex flex-col gap-4 mb-6 lg:flex-row lg:justify-between lg:items-center">
                    <h3 className="flex items-center text-lg font-bold lg:text-xl text-slate-800">
                      <div className="flex items-center justify-center w-10 h-10 mr-3 rounded-lg lg:w-12 lg:h-12 bg-blue-50">
                        <FaBook className="w-5 h-5 lg:w-6 lg:h-6 text-blue-600" />
                      </div>
                      My Books
                    </h3>
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
                      <div className="relative">
                        <FaSearch className="absolute w-4 h-4 transform -translate-y-1/2 left-3 top-1/2 text-slate-400" />
                        <input
                          type="text"
                          className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent lg:w-60"
                          placeholder="Search books..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                        />
                      </div>
                      <button
                        onClick={() => setShowAddBookModal(true)}
                        className="flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-colors"
                      >
                        <FaPlus className="w-4 h-4" />
                        Add Book
                      </button>
                    </div>
                  </div>

                  {/* Mobile Cards View */}
                  <div className="block lg:hidden">
                    <div className="space-y-4">
                      {filteredBooks.map(book => (
                        <div key={book.id} className="p-4 border border-slate-200 rounded-lg">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                              <h4 className="font-semibold text-slate-800">{book.title}</h4>
                              <p className="text-sm text-slate-600">{book.author}</p>
                              {book.genre && <p className="text-xs text-slate-500">{book.genre}</p>}
                            </div>
                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ml-2 ${
                              book.currentPage >= book.totalPages ? 'bg-green-100 text-green-600' :
                              book.currentPage > 0 ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'
                            }`}>
                              {book.currentPage >= book.totalPages ? 'Completed' :
                               book.currentPage > 0 ? 'In Progress' : 'Not Started'}
                            </span>
                          </div>
                          
                          <div className="mb-3">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs text-slate-600">Progress</span>
                              <span className="text-xs text-slate-600">{book.currentPage}/{book.totalPages} pages</span>
                            </div>
                            <div className="w-full bg-slate-200 rounded-full h-2">
                              <div
                                className="h-2 rounded-full bg-blue-600"
                                style={{ width: `${(book.currentPage / book.totalPages) * 100}%` }}
                              />
                            </div>
                          </div>
                          
                          <div className="flex items-center">
                            <span className="mr-2 text-xs text-slate-600">Rating:</span>
                            <div className="flex">
                              {[...Array(5)].map((_, i) => (
                                <FaStar 
                                  key={i} 
                                  className="w-3 h-3"
                                  color={i < book.rating ? '#F59E0B' : '#e4e5e9'} 
                                />
                              ))}
                            </div>
                          </div>
                        </div>
                      ))}
                      {filteredBooks.length === 0 && (
                        <div className="py-8 text-center text-slate-600">
                          No books found. Add your first book to get started!
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Desktop Table View */}
                  <div className="hidden lg:block">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left">
                        <thead className="text-sm text-slate-600 bg-slate-50">
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
                                <div className="w-full bg-slate-200 rounded-full h-4">
                                  <div
                                    className="h-4 rounded-full bg-blue-600 flex items-center"
                                    style={{ width: `${(book.currentPage / book.totalPages) * 100}%` }}
                                  >
                                    <span className="pl-2 text-xs font-medium text-white">
                                      {Math.round((book.currentPage / book.totalPages) * 100)}%
                                    </span>
                                  </div>
                                </div>
                                <p className="mt-1 text-xs text-slate-600">{book.currentPage}/{book.totalPages} pages</p>
                              </td>
                              <td className="p-3">
                                <div className="flex">
                                  {[...Array(5)].map((_, i) => (
                                    <FaStar 
                                      key={i} 
                                      className="w-4 h-4"
                                      color={i < book.rating ? '#F59E0B' : '#e4e5e9'} 
                                    />
                                  ))}
                                </div>
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
              </div>

              {/* Quick Stats */}
              <div>
                <InputCard icon={FaChartBar} title="Quick Stats" color="#10B981">
                  <div className="mb-6">
                    <h5 className="mb-4 text-base font-semibold lg:text-lg text-slate-800">Reading Distribution</h5>
                    <div className="h-64 lg:h-80">
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
                            labelLine={{ stroke: '#64748b', strokeWidth: 1 }}
                          >
                            {getPieChartData().map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip contentStyle={{ fontSize: '12px', padding: '8px', borderRadius: '0.5rem' }} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                  <button
                    className="flex items-center justify-center w-full gap-2 px-4 py-2.5 font-semibold text-red-600 transition-colors border border-red-300 rounded-lg hover:bg-red-50 hover:border-red-500"
                    onClick={() => setShowDeleteConfirm(true)}
                  >
                    <FaTrash className="w-4 h-4" />
                    Delete All Data
                  </button>
                </InputCard>
              </div>
            </div>
          )}

          {activeTab === 'log' && (
            <div className="space-y-6 lg:space-y-8">
              <InputCard icon={FaBookOpen} title="Log Reading Session" color="#8B5CF6">
                <div className="space-y-4 lg:space-y-6">
                  <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-6">
                    <div>
                      <label className="flex items-center mb-2 text-sm font-medium text-slate-700">
                        <FaCalendarAlt className="w-4 h-4 mr-2" />
                        Date
                      </label>
                      <input
                        type="date"
                        className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        value={readingSession.date}
                        onChange={(e) => setReadingSession({...readingSession, date: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="flex items-center mb-2 text-sm font-medium text-slate-700">
                        <FaBook className="w-4 h-4 mr-2" />
                        Book
                      </label>
                      <select
                        className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
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
                  <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-6">
                    <div>
                      <label className="flex items-center mb-2 text-sm font-medium text-slate-700">
                        <FaListOl className="w-4 h-4 mr-2" />
                        Pages Read
                      </label>
                      <input
                        type="number"
                        className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        value={readingSession.pagesRead}
                        onChange={(e) => setReadingSession({...readingSession, pagesRead: e.target.value})}
                        min="1"
                        placeholder="Enter pages read"
                      />
                    </div>
                    <div>
                      <label className="flex items-center mb-2 text-sm font-medium text-slate-700">
                        <FaClock className="w-4 h-4 mr-2" />
                        Duration (minutes)
                      </label>
                      <input
                        type="number"
                        className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        value={readingSession.duration}
                        onChange={(e) => setReadingSession({...readingSession, duration: e.target.value})}
                        min="1"
                        placeholder="Enter duration"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="flex items-center mb-2 text-sm font-medium text-slate-700">
                      <FaRegStickyNote className="w-4 h-4 mr-2" />
                      Notes
                    </label>
                    <textarea
                      className="w-full px-4 py-2.5 border border-slate-300 rounded-lg resize-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      rows="4"
                      value={readingSession.notes}
                      onChange={(e) => setReadingSession({...readingSession, notes: e.target.value})}
                      placeholder="Thoughts, reflections, or key takeaways..."
                    />
                  </div>
                  <button
                    className="flex items-center justify-center w-full gap-2 px-6 py-3 font-semibold text-white transition-colors bg-indigo-600 rounded-lg shadow hover:bg-indigo-700 disabled:bg-indigo-400 disabled:cursor-not-allowed"
                    onClick={handleLogReading}
                    disabled={!readingSession.bookId || !readingSession.pagesRead}
                  >
                    <FaSave className="w-4 h-4" />
                    Log Reading Session
                  </button>
                </div>
              </InputCard>
            </div>
          )}

          {activeTab === 'analytics' && (
            <div className="space-y-6 lg:space-y-8">
              {/* Analytics Header */}
              <div className="flex flex-col gap-4 p-4 bg-white border border-slate-200 rounded-xl shadow-sm lg:flex-row lg:justify-between lg:items-center lg:p-6">
                <h2 className="flex items-center text-lg font-bold lg:text-xl text-slate-800">
                  <div className="flex items-center justify-center w-10 h-10 mr-3 rounded-lg lg:w-12 lg:h-12 bg-blue-50">
                    <FaChartLine className="w-5 h-5 lg:w-6 lg:h-6 text-blue-600" />
                  </div>
                  Reading Analytics
                </h2>
                <div className="flex overflow-hidden bg-white border border-slate-300 rounded-lg">
                  {['daily', 'weekly', 'monthly'].map((period) => (
                    <button
                      key={period}
                      onClick={() => setViewPeriod(period)}
                      className={`px-4 py-2 text-sm font-medium transition-colors ${
                        viewPeriod === period 
                          ? 'bg-indigo-600 text-white' 
                          : 'text-slate-500 hover:bg-slate-50'
                      }`}
                    >
                      {period.charAt(0).toUpperCase() + period.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 lg:gap-8">
                {/* Chart */}
                <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-sm lg:col-span-2 lg:p-6">
                  <h3 className="flex items-center mb-4 text-base font-semibold lg:text-lg text-slate-800 lg:mb-6">
                    <FaChartLine className="w-4 h-4 mr-2 lg:w-5 lg:h-5" />
                    Reading Progress - {viewPeriod.charAt(0).toUpperCase() + viewPeriod.slice(1)}
                  </h3>
                  <div className="h-64 lg:h-80 xl:h-96">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={getChartData()} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis dataKey="name" stroke="#64748b" fontSize={12} />
                        <YAxis stroke="#64748b" fontSize={12} />
                        <Tooltip contentStyle={{ fontSize: '12px', padding: '8px', borderRadius: '0.5rem' }} />
                        <Line
                          type="monotone"
                          dataKey="pages"
                          name="Pages Read"
                          stroke="#3B82F6"
                          strokeWidth={3}
                          dot={{ fill: '#3B82F6', strokeWidth: 2, r: 5 }}
                          activeDot={{ r: 7, fill: '#3B82F6' }}
                        />
                        <Line
                          type="monotone"
                          dataKey="time"
                          name="Time (min)"
                          stroke="#10B981"
                          strokeWidth={3}
                          dot={{ fill: '#10B981', strokeWidth: 2, r: 5 }}
                          activeDot={{ r: 7, fill: '#10B981' }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Recent Sessions */}
                <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-sm lg:p-6">
                  <h3 className="flex items-center mb-4 text-base font-semibold lg:text-lg text-slate-800 lg:mb-6">
                    <FaBookmark className="w-4 h-4 mr-2 lg:w-5 lg:h-5" />
                    Recent Sessions
                  </h3>
                  <div className="space-y-3 max-h-64 lg:max-h-80 xl:max-h-96 overflow-y-auto">
                    {historicalData.slice(0, 10).map(session => (
                      <div key={session.id} className="p-3 rounded-lg bg-slate-50">
                        <div className="flex justify-between">
                          <div className="flex-1 min-w-0">
                            <h6 className="font-semibold truncate text-slate-800">{session.bookTitle}</h6>
                            <p className="text-xs text-slate-600">{new Date(session.date).toLocaleDateString()}</p>
                          </div>
                          <div className="ml-3 text-right">
                            <p className="font-semibold text-slate-800">{session.pagesRead} pages</p>
                            <p className="text-xs text-slate-600">{session.duration} min</p>
                          </div>
                        </div>
                        {session.notes && (
                          <p className="mt-2 text-xs text-slate-600 truncate">{session.notes}</p>
                        )}
                      </div>
                    ))}
                    {historicalData.length === 0 && (
                      <div className="py-8 text-center text-slate-600">
                        No reading sessions logged yet
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Summary Stats */}
              <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-sm lg:p-6">
                <h3 className="flex items-center mb-4 text-base font-semibold lg:text-lg text-slate-800 lg:mb-6">
                  <FaChartBar className="w-4 h-4 mr-2 lg:w-5 lg:h-5" />
                  {viewPeriod.charAt(0).toUpperCase() + viewPeriod.slice(1)} Summary
                </h3>
                <div className="grid grid-cols-2 gap-4 lg:grid-cols-4 lg:gap-6">
                  {[
                    { 
                      label: 'Avg Pages/Day', 
                      value: (getChartData().reduce((sum, d) => sum + d.pages, 0) / getChartData().length).toFixed(1), 
                      unit: 'pages', 
                      color: '#3B82F6' 
                    },
                    { 
                      label: 'Avg Time/Day', 
                      value: (getChartData().reduce((sum, d) => sum + d.time, 0) / getChartData().length).toFixed(1), 
                      unit: 'minutes', 
                      color: '#10B981' 
                    },
                    { 
                      label: 'Total Sessions', 
                      value: historicalData.length, 
                      unit: 'sessions', 
                      color: '#8B5CF6' 
                    },
                    { 
                      label: 'Pages/Minute', 
                      value: stats.totalPagesRead > 0 ? (stats.totalPagesRead / stats.totalReadingTime).toFixed(2) : '0', 
                      unit: 'ratio', 
                      color: '#F59E0B' 
                    }
                  ].map((stat, idx) => (
                    <div key={idx} className="text-center">
                      <div className="flex items-center justify-center w-12 h-12 mx-auto mb-2 rounded-lg lg:w-16 lg:h-16" style={{ backgroundColor: `${stat.color}15` }}>
                        <p className="text-xl font-bold lg:text-2xl xl:text-3xl" style={{ color: stat.color }}>
                          {stat.value}
                        </p>
                      </div>
                      <p className="text-xs font-medium lg:text-sm text-slate-600">{stat.label}</p>
                      <p className="text-xs text-slate-500">{stat.unit}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Add Book Modal */}
          {showAddBookModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
              <div className="w-full max-w-md max-h-[90vh] overflow-y-auto bg-white rounded-xl shadow-2xl">
                <div className="p-4 lg:p-6">
                  <div className="flex items-center justify-between mb-4 lg:mb-6">
                    <h2 className="text-lg font-bold lg:text-xl text-slate-900">Add New Book</h2>
                    <button
                      onClick={() => setShowAddBookModal(false)}
                      className="p-1 transition-colors hover:bg-slate-100 rounded-lg"
                    >
                      <FaTrash className="w-5 h-5" />
                    </button>
                  </div>
                  
                  <div className="space-y-4 lg:space-y-5">
                    <div>
                      <label className="block mb-2 text-sm font-medium text-slate-700">Title</label>
                      <input
                        type="text"
                        className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        value={newBook.title}
                        onChange={(e) => setNewBook({...newBook, title: e.target.value})}
                        placeholder="Enter book title"
                      />
                    </div>
                    <div>
                      <label className="block mb-2 text-sm font-medium text-slate-700">Author</label>
                      <input
                        type="text"
                        className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        value={newBook.author}
                        onChange={(e) => setNewBook({...newBook, author: e.target.value})}
                        placeholder="Enter author name"
                      />
                    </div>
                    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                      <div>
                        <label className="block mb-2 text-sm font-medium text-slate-700">Total Pages</label>
                        <input
                          type="number"
                          className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                          value={newBook.totalPages}
                          onChange={(e) => setNewBook({...newBook, totalPages: e.target.value})}
                          min="1"
                          placeholder="Enter total pages"
                        />
                      </div>
                      <div>
                        <label className="block mb-2 text-sm font-medium text-slate-700">Genre</label>
                        <input
                          type="text"
                          className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                          value={newBook.genre}
                          onChange={(e) => setNewBook({...newBook, genre: e.target.value})}
                          placeholder="Fiction, Science, etc."
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block mb-2 text-sm font-medium text-slate-700">Rating</label>
                      <div className="flex gap-1">
                        {[...Array(5)].map((_, i) => (
                          <FaStar 
                            key={i} 
                            className="w-6 h-6 cursor-pointer lg:w-7 lg:h-7"
                            color={i < newBook.rating ? '#F59E0B' : '#e4e5e9'} 
                            onClick={() => setNewBook({...newBook, rating: i + 1})}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-col gap-3 mt-6 lg:flex-row lg:justify-end lg:mt-8">
                    <button
                      onClick={() => setShowAddBookModal(false)}
                      className="px-4 py-2.5 bg-slate-100 text-slate-800 font-semibold rounded-lg hover:bg-slate-200 transition-colors lg:order-1"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleAddBook}
                      className="px-4 py-2.5 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-colors lg:order-2"
                    >
                      Add Book
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Delete Confirmation Modal */}
          {showDeleteConfirm && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
              <div className="w-full max-w-md bg-white rounded-xl shadow-2xl">
                <div className="p-4 lg:p-6">
                  <div className="flex items-center justify-between mb-4 lg:mb-6">
                    <h2 className="text-lg font-bold lg:text-xl text-slate-900">Confirm Deletion</h2>
                    <button
                      onClick={() => setShowDeleteConfirm(false)}
                      className="p-1 transition-colors hover:bg-slate-100 rounded-lg"
                    >
                      <FaTrash className="w-5 h-5" />
                    </button>
                  </div>
                  
                  <div className="mb-6 lg:mb-8">
                    <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full">
                      <FaTrash className="w-8 h-8 text-red-600" />
                    </div>
                    <p className="text-center text-slate-600">
                      Are you sure you want to delete ALL your book data? This action cannot be undone.
                    </p>
                  </div>
                  
                  <div className="flex flex-col gap-3 lg:flex-row lg:justify-end">
                    <button
                      onClick={() => setShowDeleteConfirm(false)}
                      className="px-4 py-2.5 bg-slate-100 text-slate-800 font-semibold rounded-lg hover:bg-slate-200 transition-colors lg:order-1"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleDeleteData}
                      className="px-4 py-2.5 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition-colors lg:order-2"
                    >
                      Delete All Data
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </ReadingTrackerErrorBoundary>
  );
};

export default ReadingTracker;