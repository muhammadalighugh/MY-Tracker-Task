import React from 'react';
import { Activity, Calendar, TrendingUp, MousePointer, BarChart3, Users ,Eye } from 'lucide-react';
import { linkTypes } from './renderCard'; // Import linkTypes from renderCard.jsx

function Analytics({ cards }) {
  const renderAnalytics = (card) => {
    const analytics = card.analytics || { 
      totalVisits: 0, 
      totalClicks: 0, 
      topLink: 'No links', 
      dailyStats: [], 
      linkStats: [] 
    };
    
    const ctr = analytics.totalVisits > 0 ? (analytics.totalClicks / analytics.totalVisits * 100).toFixed(1) : 0;
    
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - i);
      return date.toISOString().split('T')[0];
    }).reverse();
    
    const recentStats = last7Days.map(date => {
      const dayStats = analytics.dailyStats.find(d => d.date === date);
      return {
        date,
        visits: dayStats?.visits || 0,
        clicks: dayStats?.clicks || 0
      };
    });
    
    return (
      <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2 sm:mb-0">Analytics for {card.name}</h3>
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <Activity size={14} />
            <span>Real-time data</span>
          </div>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500 rounded-lg">
                <Users className="text-white" size={20} />
              </div>
              <div>
                <p className="text-xs text-blue-600 font-medium uppercase tracking-wide">Total Visits</p>
                <p className="text-2xl font-bold text-blue-900">{analytics.totalVisits}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500 rounded-lg">
                <MousePointer className="text-white" size={20} />
              </div>
              <div>
                <p className="text-xs text-green-600 font-medium uppercase tracking-wide">Total Clicks</p>
                <p className="text-2xl font-bold text-green-900">{analytics.totalClicks}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-500 rounded-lg">
                <TrendingUp className="text-white" size={20} />
              </div>
              <div>
                <p className="text-xs text-purple-600 font-medium uppercase tracking-wide">Click Rate</p>
                <p className="text-2xl font-bold text-purple-900">{ctr}%</p>
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-500 rounded-lg">
                <BarChart3 className="text-white" size={20} />
              </div>
              <div>
                <p className="text-xs text-orange-600 font-medium uppercase tracking-wide">Top Link</p>
                <p className="text-sm font-bold text-orange-900 truncate">{analytics.topLink}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity Chart */}
        <div className="mb-6">
          <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
            <Calendar size={16} />
            Last 7 Days Activity
          </h4>
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-end justify-between h-32 gap-1">
              {recentStats.map((stat, index) => {
                const maxValue = Math.max(...recentStats.map(s => Math.max(s.visits, s.clicks))) || 1;
                const visitHeight = (stat.visits / maxValue) * 100;
                const clickHeight = (stat.clicks / maxValue) * 100;
                
                return (
                  <div key={stat.date} className="flex-1 flex flex-col items-center gap-1">
                    <div className="w-full flex flex-col gap-0.5 items-center">
                      {stat.visits > 0 && (
                        <div 
                          className="w-3 bg-blue-500 rounded-t" 
                          style={{ height: `${visitHeight}%`, minHeight: stat.visits > 0 ? '4px' : '0' }}
                          title={`${stat.visits} visits`}
                        />
                      )}
                      {stat.clicks > 0 && (
                        <div 
                          className="w-3 bg-green-500 rounded-t" 
                          style={{ height: `${clickHeight}%`, minHeight: stat.clicks > 0 ? '4px' : '0' }}
                          title={`${stat.clicks} clicks`}
                        />
                      )}
                      {stat.visits === 0 && stat.clicks === 0 && (
                        <div className="w-3 h-1 bg-gray-300 rounded" />
                      )}
                    </div>
                    <span className="text-xs text-gray-500 transform rotate-45 origin-left whitespace-nowrap">
                      {new Date(stat.date).toLocaleDateString('en-US', { weekday: 'short' })}
                    </span>
                  </div>
                );
              })}
            </div>
            <div className="flex items-center justify-center gap-4 mt-4 text-xs">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-blue-500 rounded"></div>
                <span className="text-gray-600">Visits</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-green-500 rounded"></div>
                <span className="text-gray-600">Clicks</span>
              </div>
            </div>
          </div>
        </div>

        {/* Link Performance */}
        <div className="space-y-3">
          <h4 className="font-medium text-gray-900 flex items-center gap-2">
            <MousePointer size={16} />
            Link Performance
          </h4>
          {card.links && card.links.length > 0 ? (
            <div className="space-y-2">
              {card.links.map((link) => {
                const linkType = linkTypes.find(lt => lt.id === link.type);
                const IconComp = linkType?.icon || Globe;
                const clicks = link.clicks || 0;
                const maxClicks = Math.max(...card.links.map(l => l.clicks || 0)) || 1;
                const percentage = maxClicks > 0 ? (clicks / maxClicks) * 100 : 0;
                
                return (
                  <div key={link.id} className="bg-gray-50 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <IconComp size={16} className="text-gray-600 flex-shrink-0" />
                        <span className="text-sm font-medium text-gray-900 truncate">{link.label || linkType?.name || 'Link'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-gray-900">{clicks}</span>
                        <span className="text-xs text-gray-500">clicks</span>
                      </div>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-500 h-2 rounded-full transition-all duration-300" 
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-6 text-gray-500 bg-gray-50 rounded-lg">
              <MousePointer size={24} className="mx-auto mb-2 opacity-50" />
              <p className="text-sm">No links added yet</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Analytics Dashboard</h2>
        <p className="text-gray-600">Track performance across all your cards</p>
      </div>
      {cards.length === 0 ? (
        <div className="text-center py-12">
          <div className="bg-gray-100 rounded-full w-24 h-24 mx-auto mb-4 flex items-center justify-center">
            <BarChart3 size={32} className="text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No analytics data</h3>
          <p className="text-gray-600">Create and share cards to see analytics</p>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Eye className="text-blue-600" size={24} />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Cards</p>
                  <p className="text-2xl font-bold text-gray-900">{cards.length}</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Users className="text-green-600" size={24} />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Visits</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {cards.reduce((sum, card) => sum + (card.analytics?.totalVisits || 0), 0)}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <MousePointer className="text-purple-600" size={24} />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Clicks</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {cards.reduce((sum, card) => sum + (card.analytics?.totalClicks || 0), 0)}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <BarChart3 className="text-orange-600" size={24} />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Avg. CTR</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {cards.length > 0 ? Math.round((cards.reduce((sum, card) => sum + (card.analytics?.totalClicks || 0), 0) / cards.reduce((sum, card) => sum + (card.analytics?.totalVisits || 0), 0)) * 100) || 0 : 0}%
                  </p>
                </div>
              </div>
            </div>
          </div>
          <div className="space-y-6">
            {cards.map((card) => renderAnalytics(card))}
          </div>
        </div>
      )}
    </div>
  );
}

export default Analytics;