import React, { useState } from 'react';
import { Activity, Moon, Droplets, Brain, Plus, History, MessageSquare,Award  } from 'lucide-react';

const InputCard = ({ icon: Icon, title, children, color }) => (
  <div className="bg-white rounded-xl shadow-sm border border-slate-200 h-full transition-all duration-300 hover:shadow-md">
    <div className="p-6">
      <div className="flex items-center mb-5">
        <Icon className="w-6 h-6 mr-3" style={{ color }} />
        <h3 className="text-xl font-bold text-slate-800">{title}</h3>
      </div>
      {children}
    </div>
  </div>
);

const LOG_FILTERS = [
  { id: 'all', label: 'All', icon: null },
  { id: 'exercise', label: 'Exercise', icon: Activity },
  { id: 'sleep', label: 'Sleep', icon: Moon },
  { id: 'water', label: 'Water', icon: Droplets },
  { id: 'meditation', label: 'Meditation', icon: Brain },
];

const HealthLogActivities = ({
  tabType,
  error,
  setError,
  loading,
  setLoading,
  exerciseType,
  setExerciseType,
  exerciseDuration,
  setExerciseDuration,
  addExercise,
  sleepHours,
  setSleepHours,
  sleepQuality,
  setSleepQuality,
  addSleep,
  todayData,
  goals,
  addWater,
  meditationDuration,
  setMeditationDuration,
  addMeditation,
  logFilter,
  setLogFilter,
  logData
}) => {
  const [visibleLogs, setVisibleLogs] = useState(20); // Initial limit of 20 logs
  const logsPerPage = 10; // Load 10 more logs each time

  const getProgress = (current, goal) => Math.min((current / goal) * 100, 100);

  const loadMoreLogs = () => {
    setVisibleLogs((prev) => prev + logsPerPage);
  };

  if (tabType === 'log') {
    return (
      <div className="space-y-8">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center">
            <MessageSquare className="w-5 h-5 mr-2 text-red-600" />
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {logFilter === 'all' || logFilter === 'exercise' ? (
            <InputCard icon={Activity} title="Log Exercise" color="#198754">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Exercise Type</label>
                  <input
                    type="text"
                    value={exerciseType}
                    onChange={(e) => setExerciseType(e.target.value)}
                    placeholder="e.g., Running, Weightlifting, Yoga"
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                    aria-label="Exercise type"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Duration (minutes)</label>
                  <input
                    type="number"
                    value={exerciseDuration}
                    onChange={(e) => setExerciseDuration(e.target.value)}
                    placeholder="30"
                    min="0"
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                    aria-label="Exercise duration in minutes"
                  />
                </div>
                <button
                  onClick={addExercise}
                  disabled={loading.exercise || !exerciseType || !exerciseDuration || exerciseDuration <= 0}
                  className="w-full flex items-center justify-center px-4 py-2.5 bg-green-600 text-white font-semibold rounded-md shadow hover:bg-green-700 transition-colors duration-300 disabled:bg-green-400 disabled:cursor-not-allowed"
                  aria-label="Add exercise"
                >
                  {loading.exercise ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Adding...
                    </>
                  ) : (
                    <>
                      <Plus className="mr-2" size={16} />
                      Add Exercise
                    </>
                  )}
                </button>
              </div>
            </InputCard>
          ) : null}
          {logFilter === 'all' || logFilter === 'sleep' ? (
            <InputCard icon={Moon} title="Log Sleep" color="#6f42c1">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Hours Slept</label>
                  <input
                    type="number"
                    step="0.5"
                    value={sleepHours}
                    onChange={(e) => setSleepHours(e.target.value)}
                    placeholder="8"
                    min="0"
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                    aria-label="Hours slept"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Sleep Quality (1-10)</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={sleepQuality}
                    onChange={(e) => setSleepQuality(e.target.value)}
                    placeholder="8"
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                    aria-label="Sleep quality rating"
                  />
                </div>
                <button
                  onClick={addSleep}
                  disabled={loading.sleep || !sleepHours || !sleepQuality || sleepHours <= 0 || sleepQuality < 1 || sleepQuality > 10}
                  className="w-full flex items-center justify-center px-4 py-2.5 bg-purple-600 text-white font-semibold rounded-md shadow hover:bg-purple-700 transition-colors duration-300 disabled:bg-purple-400 disabled:cursor-not-allowed"
                  aria-label="Log sleep"
                >
                  {loading.sleep ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Logging...
                    </>
                  ) : (
                    <>
                      <Plus className="mr-2" size={16} />
                      Log Sleep
                    </>
                  )}
                </button>
              </div>
            </InputCard>
          ) : null}
          {logFilter === 'all' || logFilter === 'water' ? (
            <InputCard icon={Droplets} title="Water Intake" color="#0d6efd">
              <div className="text-center mb-4">
                <div className="text-4xl font-bold text-slate-800">{todayData.water} / {goals.water}</div>
                <div className="text-sm text-slate-600">Glasses consumed today</div>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-4 mb-4 overflow-hidden">
                <div
                  className="h-4 rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${getProgress(todayData.water, goals.water)}%`, backgroundColor: '#0d6efd' }}
                />
              </div>
              <button
                onClick={addWater}
                disabled={loading.water || todayData.water >= goals.water}
                className="w-full flex items-center justify-center px-4 py-2.5 bg-indigo-600 text-white font-semibold rounded-md shadow hover:bg-indigo-700 transition-colors duration-300 disabled:bg-indigo-400 disabled:cursor-not-allowed"
                aria-label="Add one glass of water"
              >
                {loading.water ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Adding...
                  </>
                ) : (
                  <>
                    <Plus className="mr-2" size={16} />
                    Add 1 Glass
                  </>
                )}
              </button>
              {todayData.water >= goals.water && (
                <div className="flex items-center justify-center text-green-600 font-semibold mt-3">
                  <Award className="mr-2" size={16} />
                  Goal Achieved!
                </div>
              )}
            </InputCard>
          ) : null}
          {logFilter === 'all' || logFilter === 'meditation' ? (
            <InputCard icon={Brain} title="Log Meditation" color="#fd7e14">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Duration (minutes)</label>
                  <input
                    type="number"
                    value={meditationDuration}
                    onChange={(e) => setMeditationDuration(e.target.value)}
                    placeholder="15"
                    min="0"
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                    aria-label="Meditation duration in minutes"
                  />
                </div>
                <button
                  onClick={addMeditation}
                  disabled={loading.meditation || !meditationDuration || meditationDuration <= 0}
                  className="w-full flex items-center justify-center px-4 py-2.5 bg-orange-600 text-white font-semibold rounded-md shadow hover:bg-orange-700 transition-colors duration-300 disabled:bg-orange-400 disabled:cursor-not-allowed"
                  aria-label="Add meditation"
                >
                  {loading.meditation ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Adding...
                    </>
                  ) : (
                    <>
                      <Plus className="mr-2" size={16} />
                      Add Meditation
                    </>
                  )}
                </button>
              </div>
            </InputCard>
          ) : null}
        </div>
      </div>
    );
  } else if (tabType === 'history') {
    const filteredLogs = logData.filter((log) => logFilter === 'all' || log.type === logFilter);

    return (
      <div className="space-y-8">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center">
            <History className="mr-2" style={{ color: '#6f42c1' }} />
            Activity Logs
          </h3>
          <div className="flex flex-wrap gap-2 mb-4">
            {LOG_FILTERS.map((filter) => (
              <button
                key={filter.id}
                onClick={() => {
                  setLogFilter(filter.id);
                  setVisibleLogs(20); // Reset visible logs when filter changes
                }}
                className={`flex items-center gap-1 px-3 py-1.5 text-sm font-medium rounded-md transition-colors duration-200 ${
                  logFilter === filter.id ? 'bg-indigo-100 text-indigo-600' : 'bg-white text-slate-600 border border-slate-300 hover:bg-slate-50'
                }`}
                aria-label={`Filter logs by ${filter.label}`}
              >
                {filter.icon && <filter.icon className="w-4 h-4" />}
                {filter.label}
              </button>
            ))}
          </div>
          {filteredLogs.length === 0 ? (
            <div className="text-center py-8 bg-slate-50 rounded-xl border border-slate-200">
              <p className="text-slate-600">No logs available for this filter.</p>
            </div>
          ) : (
            <>
              <div className="space-y-4">
                {filteredLogs.slice(0, visibleLogs).map((log, index) => (
                  <div key={index} className="flex items-center justify-between p-3 rounded-md bg-slate-50 transition-all hover:bg-slate-100">
                    <div className="flex items-center">
                      {log.type === 'exercise' && <Activity className="w-5 h-5 mr-2 text-green-600" />}
                      {log.type === 'sleep' && <Moon className="w-5 h-5 mr-2 text-purple-600" />}
                      {log.type === 'water' && <Droplets className="w-5 h-5 mr-2 text-indigo-600" />}
                      {log.type === 'meditation' && <Brain className="w-5 h-5 mr-2 text-orange-600" />}
                      <div>
                        <p className="text-sm font-medium text-slate-800">{log.description}</p>
                        <p className="text-xs text-slate-500">{new Date(log.timestamp).toLocaleString()}</p>
                      </div>
                    </div>
                    <p className="text-xs text-slate-600">{log.date}</p>
                  </div>
                ))}
              </div>
              {filteredLogs.length > visibleLogs && (
                <div className="mt-8 text-center">
                  <button
                    onClick={loadMoreLogs}
                    className="px-6 py-3 bg-indigo-600 text-white font-semibold rounded-lg shadow hover:bg-indigo-700 transition-all duration-300"
                    aria-label="Load more activity logs"
                  >
                    {loading.logs ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2 inline-block"></div>
                        Loading...
                      </>
                    ) : (
                      'Load More'
                    )}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    );
  }

  return null;
};

export default HealthLogActivities;