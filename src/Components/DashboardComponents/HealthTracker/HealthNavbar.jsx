import React from 'react';
import {
  LayoutDashboard,
  Plus,
  BarChart3,
  History,
  Bot,
  Crosshair,
  ChevronDown,
  MoreVertical,Brain ,
  Utensils 
} from 'lucide-react';

const HealthNavbar = ({ activeTab, setActiveTab, mobileNavOpen, setMobileNavOpen }) => {
  const TABS = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'MentalHealth', label: 'MentalHealth', icon: Brain  },
    { id: 'Nutrition', label: 'Nutrition', icon: Utensils  },
    { id: 'log', label: 'Log Activities', icon: Plus },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'history', label: 'History', icon: History },
    { id: 'ai', label: 'AI Assistant', icon: Bot },
    { id: 'goals', label: 'Set Goals', icon: Crosshair },
  ];

  return (
    <div className="mb-4 sm:mb-2 relative">
      <div className="border-b border-slate-200 bg-white rounded-t-xl shadow-sm">
        <nav className="-mb-px flex overflow-x-auto px-3 sm:px-6" aria-label="Tabs">
          {TABS.slice(0, 3).map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 py-3 sm:py-4 px-2 sm:px-4 text-xs sm:text-sm font-medium border-b-2 transition-colors duration-200 whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-slate-600 hover:text-slate-700 hover:border-slate-300'
                }`}
                aria-label={`View ${tab.label} tab`}
              >
                <Icon className="w-4 h-4" />
                <span className="hidden sm:inline">{tab.label}</span>
                <span className="sm:hidden">{tab.label.split(' ')[0]}</span>
              </button>
            );
          })}
          <button
            onClick={() => setMobileNavOpen(!mobileNavOpen)}
            className={`lg:hidden flex items-center gap-1 py-3 sm:py-4 px-2 sm:px-4 text-xs sm:text-sm font-medium border-b-2 transition-colors duration-200 whitespace-nowrap ${
              mobileNavOpen || TABS.slice(3).some((tab) => tab.id === activeTab)
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-slate-600 hover:text-slate-700 hover:border-slate-300'
            }`}
            aria-label="Toggle more tabs menu"
            aria-expanded={mobileNavOpen}
          >
            <MoreVertical className="w-4 h-4" />
            <span className="hidden sm:inline">More</span>
            <ChevronDown className={`w-3 h-3 transition-transform ${mobileNavOpen ? 'rotate-180' : ''}`} />
          </button>
          {TABS.slice(3).map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`hidden lg:flex items-center gap-2 py-3 sm:py-4 px-2 sm:px-4 text-xs sm:text-sm font-medium border-b-2 transition-colors duration-200 whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-slate-600 hover:text-slate-700 hover:border-slate-300'
                }`}
                aria-label={`View ${tab.label} tab`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>
      {mobileNavOpen && (
        <div className="lg:hidden absolute top-full right-3 bg-white rounded-lg shadow-lg border border-slate-200 p-2 z-50 mt-1 min-w-[180px]">
          <div className="space-y-1">
            {TABS.slice(3).map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id);
                    setMobileNavOpen(false);
                  }}
                  className={`w-full flex items-center gap-2 py-2 px-3 text-sm font-medium rounded-md transition-colors duration-200 text-left ${
                    activeTab === tab.id ? 'bg-indigo-100 text-indigo-700' : 'text-slate-600 hover:bg-slate-100'
                  }`}
                  aria-label={`View ${tab.label} tab`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default HealthNavbar;