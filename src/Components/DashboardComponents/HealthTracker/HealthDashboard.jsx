import React, { useState } from 'react';
import { Droplets, Moon, Activity, Brain, Award, MessageSquare, ChevronDown } from 'lucide-react';
const StatCard = ({ icon: Icon, title, current, goal, unit, color, progress }) => (
  <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 flex flex-col justify-between h-full transition-all duration-300 hover:shadow-md">
    <div>
      <div className="flex items-center text-slate-500 mb-2">
        <Icon className="w-5 h-5 mr-2" style={{ color }} />
        <h3 className="font-semibold text-sm">{title}</h3>
      </div>
      <div className="flex items-baseline">
        <p className="text-3xl font-bold text-slate-800">{current}</p>
        <p className="text-sm text-slate-600 ml-1">/ {goal} {unit}</p>
      </div>
    </div>
    <div className="mt-3">
      <p className="text-lg font-bold text-right" style={{ color }}>{Math.round(progress)}%</p>
      <p className="text-xs text-slate-400 text-right">Complete</p>
      <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden">
        <div
          className="h-3 rounded-full transition-all duration-500 ease-out"
          style={{ width: `${progress}%`, backgroundColor: color }}
        />
      </div>
    </div>
  </div>
);

const HealthDashboard = ({ todayData, goals, totalExerciseToday, getProgress, streaks, lastAIResponse }) => {
  const [openSections, setOpenSections] = useState({});

  const toggleSection = (index) => {
    setOpenSections((prev) => ({ ...prev, [`latest-${index}`]: !prev[`latest-${index}`] }));
  };

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          icon={Droplets}
          title="Water Intake"
          current={todayData.water}
          goal={goals.water}
          unit="cups"
          color="#0d6efd"
          progress={getProgress(todayData.water, goals.water)}
        />
        <StatCard
          icon={Moon}
          title="Sleep"
          current={todayData.sleep.hours}
          goal={goals.sleep}
          unit="hours"
          color="#6f42c1"
          progress={getProgress(todayData.sleep.hours, goals.sleep)}
        />
        <StatCard
          icon={Activity}
          title="Exercise"
          current={totalExerciseToday}
          goal={goals.exercise}
          unit="min"
          color="#198754"
          progress={getProgress(totalExerciseToday, goals.exercise)}
        />
        <StatCard
          icon={Brain}
          title="Meditation"
          current={todayData.meditation}
          goal={goals.meditation}
          unit="min"
          color="#fd7e14"
          progress={getProgress(todayData.meditation, goals.meditation)}
        />
      </div>
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 transition-all duration-300 hover:shadow-md">
        <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center">
          <Award className="mr-2" style={{ color: '#6f42c1' }} />
          Streaks
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="text-center p-4 rounded-lg bg-slate-50 transition-all hover:bg-slate-100">
            <p className="text-2xl font-bold text-indigo-600">{streaks.current}</p>
            <p className="text-sm text-slate-600">Current Streak (days)</p>
          </div>
          <div className="text-center p-4 rounded-lg bg-slate-50 transition-all hover:bg-slate-100">
            <p className="text-2xl font-bold text-indigo-600">{streaks.longest}</p>
            <p className="text-sm text-slate-600">Longest Streak (days)</p>
          </div>
        </div>
      </div>
      
    </div>
  );
};

export default HealthDashboard;