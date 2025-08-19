import React, { useContext } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useSidebar } from "../../context/SidebarContext";
import { AuthContext } from "../../context/AuthContext";
import { signOut } from "firebase/auth";
import { auth } from "../../firebase/firebase.config"; 
import { toast } from "react-toastify";
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
  ListTodo,
  IdCardLanyard ,
  NotebookPen
} from "lucide-react";

const ICON_MAP = {
  HeartHandshake,
  Code,
  Dumbbell,
  BookOpen,
  CircleDollarSign,
  Carrot,
  Smartphone,
  Home,
  ListTodo,
  NotebookPen,
  IdCardLanyard 
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

  if (isDashboard) {
    return (
      <div className="mx-2 my-1">
        <NavLink
          to={to}
          end
          className={({ isActive }) =>
            `flex items-center ${collapsed ? 'justify-center px-2 py-2' : 'px-3 py-2'} rounded-lg transition-all duration-200 ${
              isActive
                ? "bg-indigo-500 text-white font-semibold shadow-md border border-indigo-600"
                : "hover:bg-indigo-50 text-indigo-600"
            }`
          }
        >
          {({ isActive }) => (
            <>
              <span className={`flex-shrink-0 transition-colors duration-200 ${isActive ? 'text-white' : 'text-indigo-600'}`}>
                <Icon size={16} />
              </span>
              {!collapsed && <span className="ml-2 text-sm">{text}</span>}
            </>
          )}
        </NavLink>
      </div>
    );
  }

  return (
    <div className="mx-2 my-1">
      {isActiveTracker ? (
        <NavLink
          to={to}
          className={({ isActive }) =>
            `flex items-center ${collapsed ? 'justify-center px-2 py-2' : 'px-3 py-2'} rounded-lg transition-all duration-200 ${
              isActive
                ? "bg-blue-500 text-white font-semibold shadow-lg border border-blue-600"
                : "hover:bg-slate-100 text-slate-600"
            }`
          }
        >
          {({ isActive }) => (
            <>
              <span className={`flex-shrink-0 transition-colors duration-200 ${isActive ? 'text-white' : 'text-slate-600'}`}>
                <Icon size={16} />
              </span>
              {!collapsed && <span className="ml-2 text-sm font-medium">{text}</span>}
            </>
          )}
        </NavLink>
      ) : (
        <div
          className={`flex items-center ${collapsed ? 'justify-center px-2 py-2' : 'px-3 py-2'} rounded-lg text-slate-400 opacity-50 cursor-not-allowed`}
          aria-disabled="true"
        >
          <span className="flex-shrink-0 text-slate-400">
            <Icon size={16} />
          </span>
          {!collapsed && <span className="ml-2 text-sm font-medium">{text}</span>}
        </div>
      )}
    </div>
  );
}

export default function Sidebar() {
  const { sidebarOpen, setSidebarOpen, collapsed, setCollapsed, activeTrackers, trackersExpanded, setTrackersExpanded, customTrackers } = useSidebar();
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  // Extract first name from displayName or fallback to "User" if null
  const displayName = user?.displayName || "User";
  const firstName = displayName.split(" ")[0];
  const avatarLetter = firstName.charAt(0).toUpperCase();

  const handleLogout = () => {
    signOut(auth)
      .then(() => {
        toast.success("Logged out successfully!");
        navigate("/signin");
      })
      .catch((error) => {
        toast.error(`Logout failed: ${error.message}`);
      });
  };

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
        <div className="flex items-center justify-between h-14 px-3 border-b border-slate-200">
          {!collapsed && <h1 className="text-lg font-bold text-slate-800">TrackerPro</h1>}
          <div className="flex items-center">
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="hidden lg:block text-slate-500 hover:text-slate-800"
            >
              {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
            </button>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden text-slate-500 hover:text-slate-800"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* User Info with Alphabetic Avatar */}
        <NavLink
          to="/dashboard/profile"
          className={`flex items-center ${collapsed ? 'justify-center p-3' : 'p-3'} mt-1 rounded-lg hover:bg-slate-50 transition-colors duration-200`}
        >
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center bg-indigo-500 text-white font-bold text-lg"
          >
            {avatarLetter}
          </div>
          {!collapsed && (
            <div className="ml-2">
              <p className="text-xs font-medium text-slate-800">{displayName}</p>
              <p className="text-[10px] text-emerald-500 font-semibold">Premium Member</p>
            </div>
          )}
        </NavLink>

        {/* Main Navigation */}
        <nav className="mt-2">
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
            iconName="ListTodo"
            text="Tasks Todo"
            collapsed={collapsed}
            isActiveTracker={true}
            color="#059669"
          />
          <SidebarLink
            to="/dashboard/card"
            iconName="IdCardLanyard"
            text="Cards"
            collapsed={collapsed}
            isActiveTracker={true}
            color="#059669"
          />
          <SidebarLink
            to="/dashboard/Notes"
            iconName="NotebookPen"
            text="Notes"
            collapsed={collapsed}
            isActiveTracker={true}
            color="#DC2626"
          />
        </nav>

        {/* Tracker Section */}
        <div className="mt-1">
          <button
            onClick={() => setTrackersExpanded(!trackersExpanded)}
            className={`flex items-center w-full ${collapsed ? 'justify-center px-1 py-2' : 'justify-between px-3 py-2'} bg-green-500 hover:bg-green-600 text-white hover:text-white transition-all duration-200 text-sm`}
          >
            {collapsed ? (
              trackersExpanded ? <ChevronDown size={16} /> : <ChevronUp size={16} />
            ) : (
              <>
                <span className="font-semibold text-xs tracking-wide text-white">
                  MY TRACKERS
                </span>
                {trackersExpanded ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
              </>
            )}
          </button>

          {trackersExpanded && (
            <div className="mt-1 space-y-0">
              {allTrackers.length === 0 || activeTrackers.length === 0 ? (
                <p className="px-2 text-xs text-slate-500">No active trackers</p>
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

        {/* Logout Button */}
        {!collapsed && (
          <div className="mt-auto p-3">
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center py-1 px-3 bg-red-500 hover:bg-red-600 rounded-lg text-white text-sm font-medium transition-colors"
            >
              Logout
            </button>
          </div>
        )}
      </div>
    </>
  );
}