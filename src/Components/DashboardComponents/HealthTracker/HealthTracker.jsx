import React, { useState, useEffect, useMemo } from 'react';
import { useSidebar } from '../../../context/SidebarContext';
import { collection, doc, setDoc, onSnapshot, getDoc } from 'firebase/firestore';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { db } from '../../../firebase/firebase.config';
import { Navigate } from 'react-router-dom';
import HealthNavbar from './HealthNavbar';
import HealthDashboard from './HealthDashboard';
import HealthLogActivities from './HealthLogActivities';
import HealthAnalytics from './HealthAnalytics';
import HealthAIAssistant from './HealthAIAssistant';
import HealthSetGoals from './HealthSetGoals';
import MentalHealth from './MentalHealth';
import Nutrition from './Nutrition';

const HealthTracker = () => {
  const { sidebarOpen, collapsed } = useSidebar();
  const [healthData, setHealthData] = useState([]);
  const [goals, setGoals] = useState({
    water: 8,
    sleep: 8,
    exercise: 30,
    meditation: 15,
  });
  const [streaks, setStreaks] = useState({ current: 0, longest: 0 });
  const [lastAIResponse, setLastAIResponse] = useState(null);
  const [viewPeriod, setViewPeriod] = useState('weekly');
  const [activeTab, setActiveTab] = useState('dashboard');
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [logFilter, setLogFilter] = useState('all');
  const [loading, setLoading] = useState({ exercise: false, sleep: false, water: false, meditation: false });
  const [error, setError] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(null);
  const [userId, setUserId] = useState(null);
  const [exerciseType, setExerciseType] = useState('');
  const [exerciseDuration, setExerciseDuration] = useState('');
  const [sleepHours, setSleepHours] = useState('');
  const [sleepQuality, setSleepQuality] = useState('');
  const [meditationDuration, setMeditationDuration] = useState('');

  const auth = getAuth();

  const getTodayString = () => new Date().toISOString().split('T')[0];

  const getProgress = (current, goal) => Math.min((current / goal) * 100, 100);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setIsAuthenticated(true);
        setUserId(user.uid);
      } else {
        setIsAuthenticated(false);
        setUserId(null);
        setError('Please sign in to access health tracking features.');
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!isAuthenticated || !userId) return;

    const unsubscribeHealthData = onSnapshot(collection(db, 'users', userId, 'healthData'), (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setHealthData(data);
    }, (err) => {
      console.error('Health Data Snapshot Error:', err);
      setError('Failed to load health data: ' + err.message);
    });

    const fetchGoals = async () => {
      try {
        const goalsDoc = await getDoc(doc(db, 'users', userId, 'settings', 'goals'));
        if (goalsDoc.exists()) {
          setGoals(goalsDoc.data());
        }
      } catch (err) {
        console.error('Error fetching goals:', err);
        setError('Failed to load goals: ' + err.message);
      }
    };
    fetchGoals();

    const fetchStreaks = async () => {
      try {
        const streaksDoc = await getDoc(doc(db, 'users', userId, 'settings', 'streaks'));
        if (streaksDoc.exists()) {
          setStreaks(streaksDoc.data());
        }
      } catch (err) {
        console.error('Error fetching streaks:', err);
        setError('Failed to load streaks: ' + err.message);
      }
    };
    fetchStreaks();

    const unsubscribeAIResponse = onSnapshot(
      collection(db, 'users', userId, 'aiResponses'),
      (snapshot) => {
        const responses = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        const latestResponse = responses.sort(
          (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
        )[0];
        setLastAIResponse(latestResponse);
      },
      (err) => {
        console.error('AI Response Snapshot Error:', err);
        setError('Failed to load AI responses: ' + err.message);
      }
    );

    return () => {
      unsubscribeHealthData();
      unsubscribeAIResponse();
    };
  }, [isAuthenticated, userId]);

  useEffect(() => {
    if (!isAuthenticated || !userId) return;

    const today = getTodayString();
    const todayData = healthData.find(d => d.date === today);
    if (!todayData) {
      try {
        setDoc(doc(db, 'users', userId, 'healthData', today), {
          date: today,
          exercise: [],
          sleep: { hours: 0, quality: 0 },
          water: 0,
          waterLogs: [],
          meditation: 0,
          meditationLogs: [],
        }, { merge: true });
      } catch (err) {
        console.error('Error initializing today’s data:', err);
        setError('Failed to initialize data: ' + err.message);
      }
    }
  }, [healthData, isAuthenticated, userId]);

  useEffect(() => {
    if (!isAuthenticated || !userId) return;

    const checkStreaks = async () => {
      const today = getTodayString();
      const todayData = healthData.find(d => d.date === today);
      if (!todayData) return;

      const totalExercise = todayData.exercise.reduce((sum, ex) => sum + (ex.duration || 0), 0);
      const allGoalsMet =
        todayData.water >= goals.water &&
        todayData.sleep.hours >= goals.sleep &&
        totalExercise >= goals.exercise &&
        todayData.meditation >= goals.meditation;

      if (allGoalsMet) {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];
        const yesterdayData = healthData.find(d => d.date === yesterdayStr);
        const yesterdayGoalsMet = yesterdayData &&
          yesterdayData.water >= goals.water &&
          yesterdayData.sleep.hours >= goals.sleep &&
          yesterdayData.exercise.reduce((sum, ex) => sum + (ex.duration || 0), 0) >= goals.exercise &&
          yesterdayData.meditation >= goals.meditation;

        const newStreaks = {
          current: yesterdayGoalsMet ? streaks.current + 1 : 1,
          longest: Math.max(streaks.longest, yesterdayGoalsMet ? streaks.current + 1 : 1),
        };
        setStreaks(newStreaks);
        try {
          await setDoc(doc(db, 'users', userId, 'settings', 'streaks'), newStreaks);
        } catch (err) {
          console.error('Error updating streaks:', err);
          setError('Failed to update streaks: ' + err.message);
        }
      } else if (streaks.current > 0) {
        const newStreaks = { ...streaks, current: 0 };
        setStreaks(newStreaks);
        try {
          await setDoc(doc(db, 'users', userId, 'settings', 'streaks'), newStreaks);
        } catch (err) {
          console.error('Error resetting streaks:', err);
          setError('Failed to reset streaks: ' + err.message);
        }
      }
    };
    checkStreaks();
  }, [healthData, goals, streaks, isAuthenticated, userId]);

  const addExercise = async () => {
    if (!isAuthenticated) {
      setError('Please sign in to log exercise.');
      return;
    }
    if (!exerciseType || !exerciseDuration || exerciseDuration <= 0) {
      setError('Please enter valid exercise type and duration.');
      return;
    }
    setLoading(prev => ({ ...prev, exercise: true }));
    try {
      const today = getTodayString();
      const todayData = healthData.find(d => d.date === today) || {
        date: today,
        exercise: [],
        sleep: { hours: 0, quality: 0 },
        water: 0,
        waterLogs: [],
        meditation: 0,
        meditationLogs: [],
      };
      const newExercise = {
        type: exerciseType,
        duration: parseInt(exerciseDuration),
        id: Date.now(),
        timestamp: new Date().toISOString(),
      };
      await setDoc(doc(db, 'users', userId, 'healthData', today), {
        ...todayData,
        exercise: [...todayData.exercise, newExercise],
      }, { merge: true });
      setExerciseType('');
      setExerciseDuration('');
      setError('');
    } catch (err) {
      console.error('Error adding exercise:', err);
      setError('Failed to log exercise: ' + err.message);
    } finally {
      setLoading(prev => ({ ...prev, exercise: false }));
    }
  };

  const addSleep = async () => {
    if (!isAuthenticated) {
      setError('Please sign in to log sleep.');
      return;
    }
    if (!sleepHours || !sleepQuality || sleepHours <= 0 || sleepQuality < 1 || sleepQuality > 10) {
      setError('Please enter valid sleep hours (0-24) and quality (1-10).');
      return;
    }
    setLoading(prev => ({ ...prev, sleep: true }));
    try {
      const today = getTodayString();
      const todayData = healthData.find(d => d.date === today) || {
        date: today,
        exercise: [],
        sleep: { hours: 0, quality: 0 },
        water: 0,
        waterLogs: [],
        meditation: 0,
        meditationLogs: [],
      };
      await setDoc(doc(db, 'users', userId, 'healthData', today), {
        ...todayData,
        sleep: {
          hours: parseFloat(sleepHours),
          quality: parseInt(sleepQuality),
          timestamp: new Date().toISOString(),
        },
      }, { merge: true });
      setSleepHours('');
      setSleepQuality('');
      setError('');
    } catch (err) {
      console.error('Error adding sleep:', err);
      setError('Failed to log sleep: ' + err.message);
    } finally {
      setLoading(prev => ({ ...prev, sleep: false }));
    }
  };

  const addWater = async () => {
    if (!isAuthenticated) {
      setError('Please sign in to log water intake.');
      return;
    }
    setLoading(prev => ({ ...prev, water: true }));
    try {
      const today = getTodayString();
      const todayData = healthData.find(d => d.date === today) || {
        date: today,
        exercise: [],
        sleep: { hours: 0, quality: 0 },
        water: 0,
        waterLogs: [],
        meditation: 0,
        meditationLogs: [],
      };
      await setDoc(doc(db, 'users', userId, 'healthData', today), {
        ...todayData,
        water: todayData.water + 1,
        waterLogs: [...(todayData.waterLogs || []), { timestamp: new Date().toISOString() }],
      }, { merge: true });
      setError('');
    } catch (err) {
      console.error('Error adding water:', err);
      setError('Failed to log water: ' + err.message);
    } finally {
      setLoading(prev => ({ ...prev, water: false }));
    }
  };

  const addMeditation = async () => {
    if (!isAuthenticated) {
      setError('Please sign in to log meditation.');
      return;
    }
    if (!meditationDuration || meditationDuration <= 0) {
      setError('Please enter valid meditation duration.');
      return;
    }
    setLoading(prev => ({ ...prev, meditation: true }));
    try {
      const today = getTodayString();
      const todayData = healthData.find(d => d.date === today) || {
        date: today,
        exercise: [],
        sleep: { hours: 0, quality: 0 },
        water: 0,
        waterLogs: [],
        meditation: 0,
        meditationLogs: [],
      };
      const duration = parseInt(meditationDuration);
      await setDoc(doc(db, 'users', userId, 'healthData', today), {
        ...todayData,
        meditation: todayData.meditation + duration,
        meditationLogs: [...(todayData.meditationLogs || []), { duration, timestamp: new Date().toISOString() }],
      }, { merge: true });
      setMeditationDuration('');
      setError('');
    } catch (err) {
      console.error('Error adding meditation:', err);
      setError('Failed to log meditation: ' + err.message);
    } finally {
      setLoading(prev => ({ ...prev, meditation: false }));
    }
  };

  const getTodayData = () => {
    const today = getTodayString();
    return healthData.find(d => d.date === today) || {
      date: today,
      exercise: [],
      sleep: { hours: 0, quality: 0 },
      water: 0,
      waterLogs: [],
      meditation: 0,
      meditationLogs: [],
    };
  };

  const getChartData = useMemo(() => {
    const days = viewPeriod === 'weekly' ? 7 : viewPeriod === 'monthly' ? 30 : 365;
    const data = [];
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateString = date.toISOString().split('T')[0];
      const dayData = healthData.find(d => d.date === dateString);
      const totalExercise = dayData?.exercise.reduce((sum, ex) => sum + (ex.duration || 0), 0) || 0;
      data.push({
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        water: dayData?.water || 0,
        sleep: dayData?.sleep.hours || 0,
        exercise: totalExercise,
        meditation: dayData?.meditation || 0,
        sleepQuality: dayData?.sleep.quality || 0,
      });
    }
    return data;
  }, [healthData, viewPeriod]);

  const getLogData = useMemo(() => {
    const logs = [];
    healthData.forEach(day => {
      if (day.exercise?.length > 0) {
        day.exercise.forEach(ex => {
          logs.push({
            type: 'exercise',
            description: `${ex.type} (${ex.duration} min)`,
            timestamp: ex.timestamp,
            date: day.date,
          });
        });
      }
      if (day.sleep?.hours > 0) {
        logs.push({
          type: 'sleep',
          description: `${day.sleep.hours}h (Quality: ${day.sleep.quality}/10)`,
          timestamp: day.sleep.timestamp,
          date: day.date,
        });
      }
      if (day.waterLogs?.length > 0) {
        day.waterLogs.forEach(water => {
          logs.push({
            type: 'water',
            description: '1 glass of water',
            timestamp: water.timestamp,
            date: day.date,
          });
        });
      }
      if (day.meditationLogs?.length > 0) {
        day.meditationLogs.forEach(med => {
          logs.push({
            type: 'meditation',
            description: `${med.duration} min`,
            timestamp: med.timestamp,
            date: day.date,
          });
        });
      }
    });
    return logs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  }, [healthData]);

  const renderTabContent = () => {
    if (!isAuthenticated) {
      return <Navigate to="/login" replace />;
    }

    const todayData = getTodayData();
    const totalExerciseToday = todayData.exercise.reduce((sum, ex) => sum + (ex.duration || 0), 0);
    const logData = getLogData;

    if (activeTab === 'dashboard') {
      return (
        <HealthDashboard
          todayData={todayData}
          goals={goals}
          totalExerciseToday={totalExerciseToday}
          getProgress={getProgress}
          streaks={streaks}
          lastAIResponse={lastAIResponse}
        />
      );
    } else if (activeTab === 'log' || activeTab === 'history') {
      return (
        <HealthLogActivities
          tabType={activeTab}
          error={error}
          setError={setError}
          loading={loading}
          setLoading={setLoading}
          exerciseType={exerciseType}
          setExerciseType={setExerciseType}
          exerciseDuration={exerciseDuration}
          setExerciseDuration={setExerciseDuration}
          addExercise={addExercise}
          sleepHours={sleepHours}
          setSleepHours={setSleepHours}
          sleepQuality={sleepQuality}
          setSleepQuality={setSleepQuality}
          addSleep={addSleep}
          todayData={todayData}
          goals={goals}
          addWater={addWater}
          meditationDuration={meditationDuration}
          setMeditationDuration={setMeditationDuration}
          addMeditation={addMeditation}
          logFilter={logFilter}
          setLogFilter={setLogFilter}
          logData={logData}
        />
      );
    } else if (activeTab === 'analytics') {
      return (
        <HealthAnalytics
          viewPeriod={viewPeriod}
          setViewPeriod={setViewPeriod}
          getChartData={getChartData}
        />
      );
    } else if (activeTab === 'ai') {
      return (
        <HealthAIAssistant
          healthData={healthData}
          goals={goals}
          userId={userId}
          isAuthenticated={isAuthenticated}
        />
      );
    } else if (activeTab === 'goals') {
      return (
        <HealthSetGoals
          goals={goals}
          setGoals={setGoals}
          userId={userId}
          isAuthenticated={isAuthenticated}
        />
      );
    } else if (activeTab === 'MentalHealth') {
      return (
        <MentalHealth
          userId={userId}
          isAuthenticated={isAuthenticated}
        />
      );
    } else if (activeTab === 'Nutrition') {
      return (
        <Nutrition
          userId={userId}
          isAuthenticated={isAuthenticated}
        />
      );
    }
    return null;
  };

  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100">
        <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-200 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className={`min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 transition-all duration-300 ${collapsed ? 'lg:ml-20' : 'lg:ml-64'} ${sidebarOpen ? 'ml-64' : 'ml-0'} sm:ml-0`}>
      {error && (
        <div className="max-w-7xl mx-auto p-2 sm:p-6 lg:p-4">
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center">
            <MessageSquare className="w-5 h-5 mr-2 text-red-600" />
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        </div>
      )}
      <div className="max-w-7xl mx-auto p-2 pt-0 sm:p-6 lg:p-4">
        <HealthNavbar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          mobileNavOpen={mobileNavOpen}
          setMobileNavOpen={setMobileNavOpen}
        />
        <div className="transition-all duration-300">{renderTabContent()}</div>
      </div>
    </div>
  );
};

export default HealthTracker;