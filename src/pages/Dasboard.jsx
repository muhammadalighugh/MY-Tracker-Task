import { useState, useEffect } from "react";
import { useSidebar } from "../context/SidebarContext";
import { NavLink } from "react-router-dom";
import {
  HeartHandshake,
  Code,
  Dumbbell,
  BookOpen,
  CircleDollarSign,
  Carrot,
  Smartphone,
  Search,
  Menu,
  SortAsc,
  SortDesc,
  PlusCircle,
  Home
} from "lucide-react";

const PREDEFINED_TRACKERS = [
  { id: 1, name: "Prayer Tracker", path: "/dashboard/prayer", iconName: "HeartHandshake", color: "#3B82F6", stats: { entries: 45, streak: "7 days" } },
  { id: 2, name: "Coding Tracker", path: "/dashboard/coding", iconName: "Code", color: "#10B981", stats: { entries: 28, streak: "3 days" } },
  { id: 3, name: "Workout Tracker", path: "/dashboard/workout", iconName: "Dumbbell", color: "#EF4444", stats: { entries: 15, streak: "5 days" } },
  { id: 4, name: "Reading Tracker", path: "/dashboard/reading", iconName: "BookOpen", color: "#F59E0B", stats: { entries: 10, streak: "2 days" } },
  { id: 5, name: "Expense Tracker", path: "/dashboard/expense", iconName: "CircleDollarSign", color: "#8B5CF6", stats: { entries: 32, streak: "4 days" } },
  { id: 6, name: "Health Tracker", path: "/dashboard/diet", iconName: "Carrot", color: "#4F46E5", stats: { entries: 20, streak: "6 days" } },
  { id: 7, name: "Mobile Tracker", path: "/dashboard/mobile", iconName: "Smartphone", color: "#EC4899", stats: { entries: 18, streak: "3 days" } },
];

const ICON_MAP = {
  Home,
  HeartHandshake,
  Code,
  Dumbbell,
  BookOpen,
  CircleDollarSign,
  Carrot,
  Smartphone
};

const COLORS = ['#3B82F6', '#10B981', '#EF4444', '#F59E0B', '#8B5CF6', '#4F46E5', '#EC4899'];

function CustomTrackerModal({ isOpen, onClose, onSave }) {
  const [name, setName] = useState("");
  const [iconName, setIconName] = useState(Object.keys(ICON_MAP).filter(k => k !== "Home")[0]);

  const handleSave = () => {
    if (!name) return;
    onSave(name, iconName);
    setName("");
    setIconName(Object.keys(ICON_MAP).filter(k => k !== "Home")[0]);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/20 backdrop-blur-md z-50 transition-opacity duration-300">
      <div className="bg-white/80 p-7 rounded-xl w-full max-w-md shadow-2xl border border-slate-200/50">
        <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center">
          <PlusCircle className="mr-2" size={20} />
          Create Custom Tracker
        </h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Tracker Name</label>
            <input
              type="text"
              className="w-full px-3 py-2 bg-white/50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm text-slate-800 placeholder-slate-400"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Meditation Tracker"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Select Icon</label>
            <select
              className="w-full px-3 py-2 bg-white/50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm text-slate-800"
              value={iconName}
              onChange={(e) => setIconName(e.target.value)}
            >
              {Object.keys(ICON_MAP).filter(k => k !== "Home").map((key) => (
                <option key={key} value={key}>{key}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 text-slate-800 rounded-md hover:bg-slate-200 transition-colors text-sm font-semibold"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors text-sm font-semibold disabled:bg-indigo-400 disabled:cursor-not-allowed"
            disabled={!name}
          >
            Create Tracker
          </button>
        </div>
      </div>
    </div>
  );
}

function DashboardContent() {
  const { setSidebarOpen, collapsed, activeTrackers, setActiveTrackers, customTrackers, setCustomTrackers } = useSidebar();
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("name-asc");
  const [selectedTrackers, setSelectedTrackers] = useState([]);
  const [bulkAction, setBulkAction] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [customModalOpen, setCustomModalOpen] = useState(false);

  useEffect(() => {
    try {
      const savedActiveTrackers = JSON.parse(localStorage.getItem("activeTrackers") || '[]');
      const savedCustomTrackers = JSON.parse(localStorage.getItem("customTrackers") || '[]');
      setActiveTrackers(savedActiveTrackers.length ? savedActiveTrackers : [1, 2, 3, 4, 5, 6, 7]);
      setCustomTrackers(Array.isArray(savedCustomTrackers) ? savedCustomTrackers : []);
      console.log("Dashboard Initialized:", { activeTrackers: savedActiveTrackers, customTrackers: savedCustomTrackers });
    } catch (error) {
      console.error("Error loading from localStorage:", error);
      setActiveTrackers([1, 2, 3, 4, 5, 6, 7]);
      setCustomTrackers([]);
    }
  }, [setActiveTrackers, setCustomTrackers]);

  useEffect(() => {
    try {
      localStorage.setItem("activeTrackers", JSON.stringify(activeTrackers));
      console.log("Saved activeTrackers:", activeTrackers);
    } catch (error) {
      console.error("Error saving activeTrackers to localStorage:", error);
    }
  }, [activeTrackers]);

  useEffect(() => {
    try {
      localStorage.setItem("customTrackers", JSON.stringify(customTrackers));
      console.log("Saved customTrackers:", customTrackers);
    } catch (error) {
      console.error("Error saving customTrackers to localStorage:", error);
    }
  }, [customTrackers]);

  const handleToggleTracker = (trackerId) => {
    setActiveTrackers((prev) =>
      prev.includes(trackerId) ? prev.filter((id) => id !== trackerId) : [...prev, trackerId]
    );
  };

  const handleSelectTracker = (trackerId) => {
    setSelectedTrackers((prev) =>
      prev.includes(trackerId) ? prev.filter((id) => id !== trackerId) : [...prev, trackerId]
    );
  };

  const handleBulkAction = (action) => {
    setBulkAction(action);
    setModalOpen(true);
  };

  const handleConfirmBulkAction = () => {
    if (bulkAction === "activate") {
      setActiveTrackers([...new Set([...activeTrackers, ...selectedTrackers])]);
    } else if (bulkAction === "deactivate") {
      setActiveTrackers(activeTrackers.filter((id) => !selectedTrackers.includes(id)));
    }
    setSelectedTrackers([]);
    setModalOpen(false);
    setBulkAction(null);
  };

  const handleCreateCustomTracker = (name, iconName) => {
    const maxId = Math.max(...PREDEFINED_TRACKERS.map(t => t.id), ...customTrackers.map(t => t.id), 7);
    const newCustom = {
      id: maxId + 1,
      name,
      path: `/dashboard/custom/${name.toLowerCase().replace(/\s/g, '-')}`,
      iconName,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      stats: { entries: 0, streak: "0 days" }
    };
    setCustomTrackers([...customTrackers, newCustom]);
    setActiveTrackers([...activeTrackers, newCustom.id]);
    console.log("Created Custom Tracker:", newCustom);
  };

  const allTrackers = [...PREDEFINED_TRACKERS, ...customTrackers];

  const filteredTrackers = allTrackers.filter((tracker) =>
    tracker.name.toLowerCase().includes(searchQuery.toLowerCase())
  ).sort((a, b) => {
    if (sortBy === "name-asc") return a.name.localeCompare(b.name);
    if (sortBy === "name-desc") return b.name.localeCompare(b.name);
    if (sortBy === "status-asc") return activeTrackers.includes(a.id) === activeTrackers.includes(b.id) ? 0 : activeTrackers.includes(a.id) ? -1 : 1;
    if (sortBy === "status-desc") return activeTrackers.includes(a.id) === activeTrackers.includes(b.id) ? 0 : activeTrackers.includes(a.id) ? 1 : -1;
    return 0;
  });

  const isTrackerActive = (tracker) => activeTrackers.includes(tracker.id);

  return (
    <div className={`min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 transition-all duration-300 ${collapsed ? "lg:ml-20" : "lg:ml-64"}`}>
      <main className="p-6 md:p-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
          <h1 className="text-3xl font-bold text-slate-900 flex items-center">
            
            Dashboard Overview
          </h1>
          <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
            <div className="relative flex-1 sm:flex-none">
              <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search trackers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full sm:w-64 pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm text-slate-800 placeholder-slate-400"
              />
            </div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-4 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm text-slate-800"
            >
              <option value="name-asc">Sort by Name (A-Z)</option>
              <option value="name-desc">Sort by Name (Z-A)</option>
              <option value="status-asc">Sort by Status (Active First)</option>
              <option value="status-desc">Sort by Status (Inactive First)</option>
            </select>
          </div>
        </div>

        {selectedTrackers.length > 0 && (
          <div className="mb-6 flex gap-4">
            <button
              onClick={() => handleBulkAction("activate")}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-semibold"
            >
              Activate Selected
            </button>
            <button
              onClick={() => handleBulkAction("deactivate")}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-semibold"
            >
              Deactivate Selected
            </button>
            <button
              onClick={() => setSelectedTrackers([])}
              className="px-4 py-2 bg-slate-100 text-slate-800 rounded-lg hover:bg-slate-200 transition-colors text-sm font-semibold"
            >
              Clear Selection
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredTrackers.length === 0 ? (
            <p className="col-span-full text-center text-slate-600">No trackers match your search.</p>
          ) : (
            filteredTrackers.map((tracker) => {
              const Icon = ICON_MAP[tracker.iconName];
              if (!Icon) {
                console.error(`Invalid iconName for tracker ${tracker.name}: ${tracker.iconName}`);
                return null;
              }
              return (
                <div
                  key={tracker.id}
                  className="relative bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-lg transition-all duration-300 ease-in-out hover:-translate-y-1"
                >
                  <input
                    type="checkbox"
                    checked={selectedTrackers.includes(tracker.id)}
                    onChange={() => handleSelectTracker(tracker.id)}
                    className="absolute top-4 right-4 h-4 w-4 text-indigo-600 focus:ring-indigo-500 rounded"
                  />
                  {isTrackerActive(tracker) ? (
                    <NavLink to={tracker.path} className="block">
                      <div className="flex items-center mb-3">
                        <span style={{ color: tracker.color }}><Icon size={20} /></span>
                        <h2 className="ml-3 text-lg font-semibold text-slate-800">{tracker.name}</h2>
                      </div>
                      <div className="flex items-center mb-4">
                        <span
                          className={`h-2 w-2 rounded-full mr-2 ${isTrackerActive(tracker) ? "bg-emerald-500" : "bg-slate-400"}`}
                        ></span>
                        <p
                          className={`text-sm font-medium ${isTrackerActive(tracker) ? "text-emerald-600" : "text-slate-500"}`}
                        >
                          {isTrackerActive(tracker) ? "Active" : "Inactive"}
                        </p>
                      </div>
                      <div className="text-sm text-slate-600">
                        <p>Entries: {tracker.stats.entries}</p>
                        <p>Current Streak: {tracker.stats.streak}</p>
                      </div>
                    </NavLink>
                  ) : (
                    <div>
                      <div className="flex items-center mb-3">
                        <span style={{ color: "#94A3B8" }}><Icon size={20} /></span>
                        <h2 className="ml-3 text-lg font-semibold text-slate-800">{tracker.name}</h2>
                      </div>
                      <div className="flex items-center mb-4">
                        <span className="h-2 w-2 rounded-full mr-2 bg-slate-400"></span>
                        <p className="text-sm font-medium text-slate-500">Inactive</p>
                      </div>
                      <p className="text-sm text-slate-600 mb-4">Activate to access this tracker</p>
                    </div>
                  )}
                  <label className="flex items-center mt-4 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isTrackerActive(tracker)}
                      onChange={() => handleToggleTracker(tracker.id)}
                      className="hidden"
                    />
                    <div
                      className={`relative inline-flex items-center h-6 w-11 rounded-full transition-colors duration-200 ${
                        isTrackerActive(tracker) ? "bg-indigo-600" : "bg-slate-300"
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 rounded-full bg-white transform transition-transform duration-200 ${
                          isTrackerActive(tracker) ? "translate-x-6" : "translate-x-1"
                        }`}
                      />
                    </div>
                    <span className="ml-2 text-sm text-slate-600">Toggle Status</span>
                  </label>
                </div>
              );
            })
          )}
          <div
            className="bg-white p-6 rounded-xl border border-dashed border-indigo-300 shadow-sm hover:shadow-lg transition-all duration-300 ease-in-out hover:-translate-y-1 cursor-pointer"
            onClick={() => setCustomModalOpen(true)}
          >
            <div className="flex flex-col items-center justify-center h-full text-center">
              <PlusCircle size={40} className="text-indigo-600 mb-3" />
              <h2 className="text-lg font-semibold text-slate-800 mb-2">Add Custom Tracker</h2>
              <p className="text-sm text-slate-600">Create your own personalized tracker</p>
            </div>
          </div>
        </div>
      </main>

      {modalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/20 backdrop-blur-md z-50 transition-opacity duration-300">
          <div className="bg-white/80 p-7 rounded-xl w-full max-w-md shadow-2xl border border-slate-200/50">
            <h2 className="text-xl font-bold text-slate-900 mb-4">
              {bulkAction === "activate" ? "Activate Trackers" : "Deactivate Trackers"}
            </h2>
            <p className="mb-6 text-slate-600">
              Are you sure you want to{" "}
              <span className="font-semibold">{bulkAction === "activate" ? "activate" : "deactivate"}</span>{" "}
              {selectedTrackers.length} selected tracker(s)?
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setModalOpen(false);
                  setBulkAction(null);
                }}
                className="px-4 py-2 bg-slate-100 text-slate-800 rounded-md hover:bg-slate-200 transition-colors text-sm font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmBulkAction}
                className={`px-4 py-2 text-white rounded-md transition-colors text-sm font-semibold ${
                  bulkAction === "activate"
                    ? "bg-indigo-600 hover:bg-indigo-700"
                    : "bg-red-600 hover:bg-red-700"
                }`}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      <CustomTrackerModal
        isOpen={customModalOpen}
        onClose={() => setCustomModalOpen(false)}
        onSave={handleCreateCustomTracker}
      />
    </div>
  );
}

export default function Dashboard() {
  return <DashboardContent />;
}