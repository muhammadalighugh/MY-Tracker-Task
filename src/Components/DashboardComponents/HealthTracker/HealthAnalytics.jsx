import React from 'react';
import { TrendingUp, Award ,Droplets,Activity   } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

const HealthAnalytics = ({ viewPeriod, setViewPeriod, getChartData }) => {
  const chartData = getChartData;
  const avgWater = (chartData.reduce((sum, d) => sum + d.water, 0) / chartData.length).toFixed(1);
  const avgSleep = (chartData.reduce((sum, d) => sum + d.sleep, 0) / chartData.length).toFixed(1);
  const totalExercise = chartData.reduce((sum, d) => sum + d.exercise, 0);
  const totalMeditation = chartData.reduce((sum, d) => sum + d.meditation, 0);

  return (
    <div className="space-y-8">
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col sm:flex-row justify-between sm:items-center gap-4 transition-all duration-300 hover:shadow-md">
        <h2 className="text-xl font-bold text-slate-800 flex items-center">
          <TrendingUp className="mr-3" style={{ color: '#0d6efd' }} />
          Health Analytics
        </h2>
        <div className="flex-shrink-0">
          <span className="relative z-0 inline-flex shadow-sm rounded-md">
            {['weekly', 'monthly', 'yearly'].map((period, i) => (
              <button
                key={period}
                onClick={() => setViewPeriod(period)}
                className={`relative inline-flex items-center px-4 py-2 text-sm font-medium transition-colors duration-300 ${i === 0 ? 'rounded-l-md' : ''} ${i === 2 ? 'rounded-r-md' : ''} ${viewPeriod === period ? 'z-10 bg-indigo-100 border-indigo-500 text-indigo-600' : 'bg-white border-slate-300 text-slate-600 hover:bg-slate-50'}`}
                aria-label={`View ${period} analytics`}
              >
                {period.charAt(0).toUpperCase() + period.slice(1)}
              </button>
            ))}
          </span>
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 transition-all duration-300 hover:shadow-md">
          <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center">
            <Droplets className="mr-2" style={{ color: '#0d6efd' }} />
            Water & Sleep Tracking
          </h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="date" stroke="#64748b" fontSize={12} />
                <YAxis stroke="#64748b" fontSize={12} />
                <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '0.5rem' }} />
                <Line
                  type="monotone"
                  dataKey="water"
                  name="Water (cups)"
                  stroke="#0d6efd"
                  strokeWidth={3}
                  dot={{ fill: '#0d6efd', strokeWidth: 2, r: 6 }}
                />
                <Line
                  type="monotone"
                  dataKey="sleep"
                  name="Sleep (hours)"
                  stroke="#6f42c1"
                  strokeWidth={3}
                  dot={{ fill: '#6f42c1', strokeWidth: 2, r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 transition-all duration-300 hover:shadow-md">
          <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center">
            <Activity className="mr-2" style={{ color: '#198754' }} />
            Exercise & Meditation
          </h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="date" stroke="#64748b" fontSize={12} />
                <YAxis stroke="#64748b" fontSize={12} />
                <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '0.5rem' }} />
                <Bar dataKey="exercise" name="Exercise (min)" fill="#198754" />
                <Bar dataKey="meditation" name="Meditation (min)" fill="#fd7e14" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 transition-all duration-300 hover:shadow-md">
        <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center">
          <Award className="mr-2" style={{ color: '#6f42c1' }} />
          {viewPeriod.charAt(0).toUpperCase() + viewPeriod.slice(1)} Summary
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Avg Water', value: avgWater, unit: 'cups', color: '#0d6efd' },
            { label: 'Avg Sleep', value: avgSleep, unit: 'hours', color: '#6f42c1' },
            { label: 'Total Exercise', value: totalExercise, unit: 'min', color: '#198754' },
            { label: 'Total Meditation', value: totalMeditation, unit: 'min', color: '#fd7e14' },
          ].map((stat, idx) => (
            <div key={idx} className="text-center p-4 rounded-lg bg-slate-50 transition-all hover:bg-slate-100">
              <p className="text-2xl font-bold" style={{ color: stat.color }}>{stat.value}</p>
              <p className="text-sm text-slate-600">{stat.label}</p>
              <p className="text-xs text-slate-500">{stat.unit}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default HealthAnalytics;