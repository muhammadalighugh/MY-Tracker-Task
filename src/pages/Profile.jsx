import { User, Mail, Calendar, Settings, LogOut } from "lucide-react";
import { useState } from "react";
import { useSidebar } from "../context/SidebarContext";

export default function Profile() {
  const { collapsed } = useSidebar();
  const [activeTab, setActiveTab] = useState("profile");
  const [isEditing, setIsEditing] = useState(false);

  const [user, setUser] = useState({
    name: "Alex Johnson",
    email: "alex.johnson@example.com",
    joinDate: "Joined January 2023",
    avatar: "",
    bio: "Product designer and developer. Creating digital experiences that matter.",
    stats: {
      trackers: 12,
      completed: 87,
      streak: 15,
    },
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setUser((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <div
      className={`min-h-screen p-4 sm:p-6 bg-slate-50 transition-all duration-300 ${
        collapsed ? "lg:ml-20" : "lg:ml-64"
      }`}
    >
      {/* Profile Header */}
      <div className="flex flex-col md:flex-row gap-6 items-start bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        {/* Avatar */}
        <div className="w-full md:w-auto flex flex-col items-center">
          <div className="relative group">
            <div className="w-32 h-32 rounded-full bg-slate-100 border-2 border-slate-200 flex items-center justify-center overflow-hidden">
              {user.avatar ? (
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <User size={64} className="text-slate-400" />
              )}
            </div>
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="absolute bottom-0 right-0 bg-indigo-600 text-white p-2 rounded-full hover:bg-indigo-500 transition-colors shadow-md"
            >
              <Settings size={18} />
            </button>
          </div>
        </div>

        {/* User Info */}
        <div className="flex-1">
          {isEditing ? (
            <div className="space-y-4">
              <input
                type="text"
                name="name"
                value={user.name}
                onChange={handleInputChange}
                className="text-2xl font-bold bg-transparent text-slate-900 border-b border-slate-300 focus:outline-none focus:border-indigo-500 w-full"
              />
              <div className="flex items-center text-slate-600">
                <Mail size={16} className="mr-2" />
                <input
                  type="email"
                  name="email"
                  value={user.email}
                  onChange={handleInputChange}
                  className="bg-transparent text-slate-900 border-b border-slate-300 focus:outline-none focus:border-indigo-500 w-full"
                />
              </div>
              <textarea
                name="bio"
                value={user.bio}
                onChange={handleInputChange}
                className="bg-white text-slate-900 border border-slate-300 rounded-md p-2 focus:outline-none focus:border-indigo-500 w-full"
                rows={3}
              />
              <div className="flex space-x-3">
                <button
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 bg-slate-200 text-slate-800 rounded-md hover:bg-slate-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-500 transition-colors"
                >
                  Save Changes
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <h1 className="text-3xl font-bold text-slate-900">{user.name}</h1>
              <div className="flex items-center text-slate-600">
                <Mail size={16} className="mr-2" />
                <span>{user.email}</span>
              </div>
              <div className="flex items-center text-slate-600">
                <Calendar size={16} className="mr-2" />
                <span>{user.joinDate}</span>
              </div>
              <p className="text-slate-700 mt-4 leading-relaxed">{user.bio}</p>
            </div>
          )}

          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
            {[
              { label: "Active Trackers", value: user.stats.trackers, color: "#3B82F6" },
              { label: "Tasks Completed", value: user.stats.completed, color: "#10B981" },
              { label: "Day Streak", value: user.stats.streak, color: "#F59E0B" },
            ].map((stat, idx) => (
              <div
                key={idx}
                className="bg-white border border-slate-200 rounded-lg p-4 hover:shadow-lg hover:border-indigo-500 transition-all text-center"
              >
                <div className="text-slate-600 text-sm">{stat.label}</div>
                <div className="text-2xl font-bold" style={{ color: stat.color }}>
                  {stat.value}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200 mt-8">
        <nav className="flex space-x-8 overflow-x-auto">
          {["profile", "activity", "settings"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-4 px-2 border-b-2 font-medium text-sm capitalize whitespace-nowrap transition-all ${
                activeTab === tab
                  ? "border-indigo-500 text-slate-900"
                  : "border-transparent text-slate-600 hover:text-slate-800 hover:border-slate-300"
              }`}
            >
              {tab}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="py-6">
        {activeTab === "profile" && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-slate-900">Recent Activity</h3>
            <div className="bg-white border border-slate-200 rounded-lg p-4">
              <p className="text-slate-600">No recent activity yet</p>
            </div>
          </div>
        )}
        {activeTab === "activity" && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-slate-900">Your Activity Log</h3>
            <div className="bg-white border border-slate-200 rounded-lg p-4">
              <p className="text-slate-600">Activity log will appear here</p>
            </div>
          </div>
        )}
        {activeTab === "settings" && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-slate-900">Account Settings</h3>
            <div className="bg-white border border-slate-200 rounded-lg p-6 space-y-4">
              <div>
                <h4 className="text-sm font-medium text-slate-700 mb-2">
                  Change Password
                </h4>
                <button className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-500 transition-colors text-sm">
                  Update Password
                </button>
              </div>
              <div>
                <h4 className="text-sm font-medium text-slate-700 mb-2">
                  Notification Preferences
                </h4>
                <button className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-500 transition-colors text-sm">
                  Configure Notifications
                </button>
              </div>
              <div>
                <h4 className="text-sm font-medium text-slate-700 mb-2">
                  Danger Zone
                </h4>
                <button className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-500 transition-colors text-sm flex items-center">
                  <LogOut size={16} className="mr-2" />
                  Delete Account
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}