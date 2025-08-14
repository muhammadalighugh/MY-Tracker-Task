import React from "react";
import { NavLink } from "react-router-dom";
import { useSidebar } from "../../context/SidebarContext";
import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  X,
  Home,
  HeartHandshake,
  Code,
  Dumbbell,
  BookOpen,
  Carrot,
  Smartphone,
  CircleDollarSign,
  Plus,
  Calendar
} from "lucide-react";

const ICON_MAP = {
  Home,
  HeartHandshake,
  Code,
  Dumbbell,
  BookOpen,
  CircleDollarSign,
  Carrot,
  Smartphone,
  Plus,
  Calendar
};

const PREDEFINED_TRACKERS = [
  { id: 1, name: "Prayer Tracker", path: "/dashboard/prayer", iconName: "HeartHandshake", color: "#3B82F6" },
  { id: 2, name: "Coding Tracker", path: "/dashboard/coding", iconName: "Code", color: "#10B981" },
  { id: 3, name: "Workout Tracker", path: "/dashboard/workout", iconName: "Dumbbell", color: "#EF4444" },
  { id: 4, name: "Reading Tracker", path: "/dashboard/reading", iconName: "BookOpen", color: "#F59E0B" },
  { id: 5, name: "Expense Tracker", path: "/dashboard/expense", iconName: "CircleDollarSign", color: "#8B5CF6" },
  { id: 6, name: "Health Tracker", path: "/dashboard/diet", iconName: "Carrot", color: "#4F46E5" },
  { id: 7, name: "Mobile Tracker", path: "/dashboard/mobile", iconName: "Smartphone", color: "#EC4899" }
];

function SidebarLink({ to, iconName, text, collapsed, isActiveTracker, color, isDashboard }) {
  const Icon = ICON_MAP[iconName];
  if (!Icon) {
    console.error(`Invalid iconName: ${iconName}`);
    return null;
  }

  // Dashboard Link (special styling + exact match)
  if (isDashboard) {
    return (
      <div className="mx-2 my-1">
        <NavLink
          to={to}
          end
          className={({ isActive }) =>
            `flex items-center ${collapsed ? 'justify-center px-3 py-3' : 'px-4 py-2.5'} rounded-lg transition-all duration-200 ${
              isActive
                ? "bg-indigo-500 text-white font-semibold shadow-md border border-indigo-600"
                : "hover:bg-indigo-50 text-indigo-600"
            }`
          }
        >
          {({ isActive }) => (
            <>
              <span className={`flex-shrink-0 transition-colors duration-200 ${isActive ? 'text-white' : 'text-indigo-600'}`}>
                <Icon size={20} />
              </span>
              {!collapsed && <span className="ml-3">{text}</span>}
            </>
          )}
        </NavLink>
      </div>
    );
  }

  // Tracker Links
  return (
    <div className="mx-2 my-1">
      {isActiveTracker ? (
        <NavLink
          to={to}
          className={({ isActive }) =>
            `flex items-center ${collapsed ? 'justify-center px-3 py-3' : 'px-4 py-2.5'} rounded-lg transition-all duration-200 ${
              isActive
                ? "bg-blue-500 text-white font-semibold shadow-lg border border-blue-600"
                : "hover:bg-slate-100 text-slate-600"
            }`
          }
        >
          {({ isActive }) => (
            <>
              <span className={`flex-shrink-0 transition-colors duration-200 ${isActive ? 'text-white' : 'text-slate-600'}`}>
                <Icon size={20} />
              </span>
              {!collapsed && <span className="ml-3 font-medium">{text}</span>}
            </>
          )}
        </NavLink>
      ) : (
        <div
          className={`flex items-center ${collapsed ? 'justify-center px-3 py-3' : 'px-4 py-2.5'} rounded-lg text-slate-400 opacity-50 cursor-not-allowed`}
          aria-disabled="true"
        >
          <span className="flex-shrink-0 text-slate-400">
            <Icon size={20} />
          </span>
          {!collapsed && <span className="ml-3 font-medium">{text}</span>}
        </div>
      )}
    </div>
  );
}

export default function Sidebar() {
  const { sidebarOpen, setSidebarOpen, collapsed, setCollapsed, activeTrackers, trackersExpanded, setTrackersExpanded, customTrackers } = useSidebar();

  const allTrackers = [...PREDEFINED_TRACKERS, ...customTrackers];

  return (
    <>
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/20 backdrop-blur-md z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div
        className={`fixed inset-y-0 left-0 z-50 bg-white border-r border-slate-200 shadow-sm transform transition-all duration-300 ease-in-out ${
          collapsed ? "w-20" : "w-64"
        } ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0`}
        style={{ maxHeight: "100vh", overflowY: "auto" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-slate-200">
          {!collapsed && <h1 className="text-xl font-bold text-slate-800">TrackerPro</h1>}
          <div className="flex items-center">
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="hidden lg:block text-slate-500 hover:text-slate-800"
            >
              {collapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
            </button>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden text-slate-500 hover:text-slate-800"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        {/* User Info */}
        <NavLink
          to="/dashboard/profile"
          className={`flex items-center ${collapsed ? 'justify-center p-4' : 'p-4'} mt-2 rounded-lg hover:bg-slate-50 transition-colors duration-200`}
        >
          <img
            src="https://i.pravatar.cc/40?u=a042581f4e29026704d"
            alt="User"
            className="w-10 h-10 rounded-full object-cover"
          />
          {!collapsed && (
            <div className="ml-3">
              <p className="text-sm font-medium text-slate-800">Muhammad Ali</p>
              <p className="text-xs text-emerald-500 font-semibold">Premium Member</p>
            </div>
          )}
        </NavLink>

        {/* Main Navigation */}
        <nav className="mt-4">
          <SidebarLink
            to="/dashboard"
            iconName="Home"
            text="Dashboard"
            collapsed={collapsed}
            isActiveTracker={true}
            color="#3B82F6"
            isDashboard={true}
          />
          <SidebarLink
            to="/dashboard/create-task"
            iconName="Plus"
            text="Create Task"
            collapsed={collapsed}
            isActiveTracker={true}
            color="#059669"
          />
          <SidebarLink
            to="/dashboard/todays-task"
            iconName="Calendar"
            text="Today's Task"
            collapsed={collapsed}
            isActiveTracker={true}
            color="#DC2626"
          />
        </nav>

        {/* Tracker Section */}
        <div className="mt-8">
          <button
            onClick={() => setTrackersExpanded(!trackersExpanded)}
            className={`flex items-center w-full ${collapsed ? 'justify-center px-2 py-2' : 'justify-between px-4 py-2'} rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-500 hover:text-slate-700 transition-all duration-200`}
          >
            {collapsed ? (
              trackersExpanded ? <ChevronDown size={20} /> : <ChevronUp size={20} />
            ) : (
              <>
                <span className="font-semibold text-sm tracking-wide text-indigo-600">
                  MY TRACKERS
                </span>
                {trackersExpanded ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
              </>
            )}
          </button>

          {trackersExpanded && (
            <div className="mt-2 space-y-1">
              {allTrackers.length === 0 || activeTrackers.length === 0 ? (
                <p className="px-2 text-sm text-slate-500">No active trackers</p>
              ) : (
                allTrackers
                  .filter((t) => activeTrackers.includes(t.id))
                  .map((t) => (
                    <SidebarLink
                      key={t.id}
                      to={t.path}
                      iconName={t.iconName}
                      text={t.name}
                      collapsed={collapsed}
                      isActiveTracker={activeTrackers.includes(t.id)}
                      color={t.color}
                    />
                  ))
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}