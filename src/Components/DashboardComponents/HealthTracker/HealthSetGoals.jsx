import React, { useState } from 'react';
import { Crosshair, MessageSquare } from 'lucide-react';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../../../firebase/firebase.config';

const HealthSetGoals = ({ goals, setGoals, userId, isAuthenticated }) => {
  const [newGoals, setNewGoals] = useState(goals);
  const [error, setError] = useState('');

  const handleGoalChange = (key, value) => {
    const numValue = parseFloat(value);
    if (numValue < 0) {
      setError('Goals cannot be negative.');
      return;
    }
    setError('');
    setNewGoals(prev => ({ ...prev, [key]: numValue || 0 }));
  };

  const saveGoals = async () => {
    if (!isAuthenticated) {
      setError('Please sign in to save goals.');
      return;
    }
    if (Object.values(newGoals).some(val => val <= 0)) {
      setError('All goals must be greater than zero.');
      return;
    }
    try {
      await setDoc(doc(db, 'users', userId, 'settings', 'goals'), newGoals);
      setGoals(newGoals);
      alert('Goals saved successfully!');
    } catch (err) {
      console.error('Error saving goals:', err);
      setError('Failed to save goals: ' + err.message);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 text-center">
        <MessageSquare className="w-8 h-8 mx-auto mb-4 text-red-600" />
        <p className="text-red-600">Please sign in to set goals.</p>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 transition-all duration-300 hover:shadow-md">
      <div className="flex items-center mb-6">
        <Crosshair className="w-8 h-8 mr-3 text-indigo-600" />
        <h2 className="text-2xl font-bold text-slate-800">Set Your Goals</h2>
      </div>
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
          {error}
        </div>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { key: 'water', label: 'Water (cups)', color: '#0d6efd' },
          { key: 'sleep', label: 'Sleep (hours)', color: '#6f42c1' },
          { key: 'exercise', label: 'Exercise (min)', color: '#198754' },
          { key: 'meditation', label: 'Meditation (min)', color: '#fd7e14' },
        ].map(({ key, label, color }) => (
          <div key={key}>
            <label className="block text-sm font-medium text-slate-700 mb-1">{label}</label>
            <input
              type="number"
              value={newGoals[key] || ''}
              onChange={(e) => handleGoalChange(key, e.target.value)}
              placeholder="Enter goal"
              min="0"
              step={key === 'sleep' ? '0.5' : '1'}
              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              aria-label={`Set ${label} goal`}
            />
          </div>
        ))}
      </div>
      <button
        onClick={saveGoals}
        className="mt-6 w-full flex items-center justify-center px-4 py-2.5 bg-indigo-600 text-white font-semibold rounded-md shadow hover:bg-indigo-700 transition-colors duration-300"
        aria-label="Save health goals"
      >
        <Crosshair className="mr-2" size={16} />
        Save Goals
      </button>
    </div>
  );
};

export default HealthSetGoals;