import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Smile, Brain, Clock, ChevronDown, } from 'lucide-react';
import { collection, addDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../../../firebase/firebase.config';

const MentalHealth = ({ userId, isAuthenticated }) => {
  const [mood, setMood] = useState('');
  const [stressLevel, setStressLevel] = useState(5);
  const [notes, setNotes] = useState('');
  const [moodLogs, setMoodLogs] = useState([]);
  const [aiSuggestions, setAiSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [visibleLogs, setVisibleLogs] = useState(10);

  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

  useEffect(() => {
    if (!userId || !isAuthenticated) return;

    const unsubscribe = onSnapshot(
      collection(db, 'users', userId, 'mentalHealth'),
      (snapshot) => {
        const logs = snapshot.docs
          .map((doc) => ({ id: doc.id, ...doc.data() }))
          .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        setMoodLogs(logs);
      },
      (err) => {
        console.error('Mood Logs Snapshot Error:', err);
        setError('Failed to load mood history: ' + err.message);
      }
    );

    return () => unsubscribe();
  }, [userId, isAuthenticated]);

  const logMood = useCallback(async () => {
    if (!isAuthenticated) {
      setError('Authentication required to log mood.');
      return;
    }
    if (!mood) {
      setError('Please select a mood.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await addDoc(collection(db, 'users', userId, 'mentalHealth'), {
        mood,
        stressLevel,
        notes,
        timestamp: new Date().toISOString(),
      });

      // AI suggestion via Gemini API
      if (apiKey) {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{
                parts: [{
                  text: `Based on a mood of "${mood}" and stress level ${stressLevel}/10, provide 2-3 concise, actionable mental health coping strategies in bullet points.`
                }]
              }],
              generationConfig: { temperature: 0.7, maxOutputTokens: 150 },
            }),
          }
        );

        if (!response.ok) throw new Error('Failed to fetch AI suggestions');
        const data = await response.json();
        const suggestions = data.candidates?.[0]?.content?.parts?.[0]?.text || 'No suggestions available.';
        setAiSuggestions(suggestions.split('\n').filter(s => s.trim()));
      }

      setMood('');
      setStressLevel(5);
      setNotes('');
    } catch (err) {
      console.error('Mood Log Error:', err);
      setError('Failed to log mood: ' + err.message);
    } finally {
      setLoading(false);
    }
  }, [mood, stressLevel, notes, userId, isAuthenticated, apiKey]);

  const memoizedLogs = useMemo(() => moodLogs.slice(0, visibleLogs), [moodLogs, visibleLogs]);

  if (!isAuthenticated) {
    return (
      <div className="bg-gradient-to-br from-red-50 to-pink-50 p-6 md:p-8 rounded-2xl shadow-sm border border-red-100 text-center">
        <div className="bg-white p-6 rounded-xl shadow-sm">
          <Smile className="w-12 h-12 mx-auto mb-4 text-red-500" />
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Authentication Required</h3>
          <p className="text-gray-600">Please sign in to track your mental health.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 rounded-2xl shadow-lg border border-indigo-100 transition-all duration-500 hover:shadow-xl">
      <div className="flex items-center mb-6">
        <div className="bg-gradient-to-r from-indigo-500 to-purple-500 p-2 rounded-lg shadow-sm">
          <Brain className="w-6 h-6 text-white" />
        </div>
        <h2 className="text-2xl md:text-3xl font-bold text-gray-800 ml-3">Mental Health Tracker</h2>
      </div>

      <div className="space-y-6 md:grid md:grid-cols-2 md:gap-6 md:space-y-0">
        {/* Mood Logging */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h3 className="text-xl font-semibold mb-4 flex items-center">
            <Smile className="w-5 h-5 mr-2 text-indigo-600" /> Log Your Mood
          </h3>
          <select
            value={mood}
            onChange={(e) => setMood(e.target.value)}
            className="w-full p-2 border rounded-md mb-4 text-gray-700"
            aria-label="Select your mood"
          >
            <option value="">Select Mood</option>
            <option value="Happy">Happy</option>
            <option value="Stressed">Stressed</option>
            <option value="Anxious">Anxious</option>
            <option value="Calm">Calm</option>
            <option value="Sad">Sad</option>
          </select>
          <label className="block mb-2 text-sm font-medium text-gray-700">Stress Level (1-10)</label>
          <input
            type="range"
            min="1"
            max="10"
            value={stressLevel}
            onChange={(e) => setStressLevel(+e.target.value)}
            className="w-full mb-4"
            aria-label="Stress level"
          />
          <p className="text-center text-gray-600 mb-4">{stressLevel}/10</p>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add any notes (optional)"
            className="w-full p-2 border rounded-md mb-4 resize-none h-24"
            aria-label="Mood notes"
          />
          <button
            onClick={logMood}
            disabled={loading}
            className="w-full p-3 bg-indigo-600 text-white rounded-md font-semibold hover:bg-indigo-700 transition-all duration-300 disabled:opacity-50"
            aria-label="Log mood"
          >
            {loading ? 'Logging...' : 'Log Mood'}
          </button>
        </div>

        {/* AI Suggestions */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h3 className="text-xl font-semibold mb-4 flex items-center">
            <Brain className="w-5 h-5 mr-2 text-purple-600" /> AI Coping Strategies
          </h3>
          {aiSuggestions.length > 0 ? (
            <ul className="space-y-2">
              {aiSuggestions.map((sug, idx) => (
                <li key={idx} className="p-2 bg-gray-50 rounded-md text-gray-700">{sug}</li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-600">Log a mood to receive personalized coping strategies.</p>
          )}
        </div>

        {/* Mood History */}
        <div className="col-span-2 bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h3 className="text-xl font-semibold mb-4 flex items-center">
            <Clock className="w-5 h-5 mr-2 text-green-600" /> Mood History
          </h3>
          {memoizedLogs.length === 0 ? (
            <p className="text-gray-600">No mood logs yet. Start logging above!</p>
          ) : (
            <div className="space-y-3 max-h-64 overflow-auto">
              {memoizedLogs.map((log, idx) => (
                <div key={idx} className="p-3 bg-gray-50 rounded-md border border-gray-100 flex flex-col sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center">
                    <Smile className="w-4 h-4 mr-2 text-indigo-600" />
                    <span className="font-medium">{log.mood}</span>
                    <span className="ml-2 text-gray-600">Stress: {log.stressLevel}/10</span>
                  </div>
                  <div className="text-sm text-gray-500 mt-1 sm:mt-0">
                    {new Date(log.timestamp).toLocaleString('en-US', {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                    {log.notes && <p className="mt-1 text-gray-600">{log.notes}</p>}
                  </div>
                </div>
              ))}
            </div>
          )}
          {visibleLogs < moodLogs.length && (
            <button
              onClick={() => setVisibleLogs((prev) => prev + 10)}
              className="mt-4 w-full p-2 bg-indigo-600 text-white rounded-md font-semibold hover:bg-indigo-700 transition-all duration-300"
            >
              Load More
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="mt-6 p-4 bg-red-50 border-l-4 border-red-400 rounded-lg flex items-start">
          <svg className="w-5 h-5 text-red-400 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
          <div className="ml-3">
            <p className="text-red-700 font-medium">Error</p>
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default MentalHealth;