import React, { useState, useEffect, useCallback, useMemo, useRef } from "react"
import { useSidebar } from "../context/SidebarContext"
import { doc, setDoc, updateDoc, onSnapshot } from "firebase/firestore"
import { auth, db } from "../firebase/firebase.config"
import { useAuthState } from "react-firebase-hooks/auth"
import { toast } from "react-toastify"
import { useNavigate } from "react-router-dom"
import {
  HeartHandshake, Code, Dumbbell, BookOpen, CircleDollarSign, Carrot, Smartphone,
  PlusCircle, X, ListChecks, Clock, Timer, Play, Pause, RotateCcw, Expand, Shrink,
  Palette, FileClock, Save, Trash2, Download, Hourglass, BarChart3, Settings
} from "lucide-react"

// --- Skeleton Components ---
const DashboardSkeleton = () => (
  <div className="min-h-screen bg-slate-100 p-6 md:p-8 animate-pulse">
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Tracker Manager Skeleton */}
      <div className="bg-white/60 rounded-xl h-[300px] p-4">
        <div className="h-8 bg-white/40 rounded w-3/4 mb-6"></div>
        <div className="space-y-4">
          <div className="h-4 bg-white/40 rounded w-full"></div>
          <div className="h-4 bg-white/40 rounded w-5/6"></div>
          <div className="h-4 bg-white/40 rounded w-2/3"></div>
          <div className="h-10 bg-white/40 rounded w-1/2 mt-8"></div>
        </div>
      </div>

      {/* Digital Watch Skeleton */}
      <div className="bg-white/60 rounded-xl h-[60vh] p-4">
        <div className="h-10 bg-white/40 rounded w-full mb-4"></div>
        <div className="flex justify-center items-center h-[70%]">
          <div className="h-20 bg-white/40 rounded w-1/2 mx-auto"></div>
        </div>
        <div className="h-8 bg-white/40 rounded w-3/4 mx-auto"></div>
      </div>
    </div>
  </div>
)

const TrackerManagerSkeleton = () => (
  <div className="fixed inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-50 p-4">
    <div className="bg-slate-50 w-full max-w-4xl h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-pulse">
      <div className="flex items-center justify-between p-6 border-b border-slate-200 flex-shrink-0">
        <div className="space-y-2">
          <div className="h-6 bg-slate-200 rounded w-1/3"></div>
          <div className="h-4 bg-slate-200 rounded w-1/2"></div>
        </div>
        <div className="h-8 w-8 bg-slate-200 rounded-full"></div>
      </div>
      <div className="p-6 flex-grow overflow-y-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(9)].map((_, i) => (
            <div key={i} className="bg-white/60 p-5 rounded-xl h-32 animate-pulse">
              <div className="h-4 bg-white/40 rounded w-3/4 mb-3"></div>
              <div className="h-3 bg-white/40 rounded w-1/2 mb-2"></div>
              <div className="h-8 bg-white/40 rounded w-full"></div>
            </div>
          ))}
          <div className="bg-white/60 p-5 rounded-xl h-32 animate-pulse">
            <div className="flex flex-col items-center justify-center h-full">
              <div className="h-8 w-8 bg-white/40 rounded-full mb-3"></div>
              <div className="h-4 bg-white/40 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-white/40 rounded w-1/2"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
)

// --- Constants ---
const PREDEFINED_TRACKERS = [
  { id: 1, name: "Prayer Tracker", path: "/dashboard/prayer", iconName: "HeartHandshake", color: "#3B82F6" },
  { id: 2, name: "Coding Tracker", path: "/dashboard/coding", iconName: "Code", color: "#10B981" },
  { id: 3, name: "Workout Tracker", path: "/dashboard/workout", iconName: "Dumbbell", color: "#EF4444" },
  { id: 4, name: "Reading Tracker", path: "/dashboard/reading", iconName: "BookOpen", color: "#F59E0B" },
  { id: 5, name: "Expense Tracker", path: "/dashboard/expense", iconName: "CircleDollarSign", color: "#8B5CF6" },
  { id: 6, name: "Health Tracker", path: "/dashboard/diet", iconName: "Carrot", color: "#4F46E5" },
  { id: 7, name: "Mobile Tracker", path: "/dashboard/mobile", iconName: "Smartphone", color: "#EC4899" },
]

const ICON_MAP = {
  HeartHandshake, Code, Dumbbell, BookOpen, CircleDollarSign, Carrot, Smartphone
}

const COLORS = ['#3B82F6', '#10B981', '#EF4444', '#F59E0B', '#8B5CF6', '#4F46E5', '#EC4899']

const WATCH_THEMES = {
  indigo: { bg: 'bg-indigo-700', text: 'text-indigo-100', accent: 'text-indigo-300', button: 'bg-indigo-600 hover:bg-indigo-500', input: 'bg-indigo-800/50 border-indigo-500/50 focus:border-indigo-400 focus:ring-indigo-400' },
  slate: { bg: 'bg-slate-800', text: 'text-slate-100', accent: 'text-slate-300', button: 'bg-slate-700 hover:bg-slate-600', input: 'bg-slate-900/50 border-slate-600/50 focus:border-slate-500 focus:ring-slate-500' },
  emerald: { bg: 'bg-emerald-700', text: 'text-emerald-100', accent: 'text-emerald-300', button: 'bg-emerald-600 hover:bg-emerald-500', input: 'bg-emerald-800/50 border-emerald-500/50 focus:border-emerald-400 focus:ring-emerald-400' },
  rose: { bg: 'bg-rose-700', text: 'text-rose-100', accent: 'text-rose-300', button: 'bg-rose-600 hover:bg-rose-500', input: 'bg-rose-800/50 border-rose-500/50 focus:border-rose-400 focus:ring-rose-400' },
  sky: { bg: 'bg-sky-700', text: 'text-sky-100', accent: 'text-sky-300', button: 'bg-sky-600 hover:bg-sky-500', input: 'bg-sky-800/50 border-sky-500/50 focus:border-sky-400 focus:ring-sky-400' },
  teal: { bg: 'bg-teal-700', text: 'text-teal-100', accent: 'text-teal-300', button: 'bg-teal-600 hover:bg-teal-500', input: 'bg-teal-800/50 border-teal-500/50 focus:border-teal-400 focus:ring-teal-400' },
  cyan: { bg: 'bg-cyan-700', text: 'text-cyan-100', accent: 'text-cyan-300', button: 'bg-cyan-600 hover:bg-cyan-500', input: 'bg-cyan-800/50 border-cyan-500/50 focus:border-cyan-400 focus:ring-cyan-400' },
  lime: { bg: 'bg-lime-700', text: 'text-lime-100', accent: 'text-lime-300', button: 'bg-lime-600 hover:bg-lime-500', input: 'bg-lime-800/50 border-lime-500/50 focus:border-lime-400 focus:ring-lime-400' },
  yellow: { bg: 'bg-yellow-700', text: 'text-yellow-100', accent: 'text-yellow-300', button: 'bg-yellow-600 hover:bg-yellow-500', input: 'bg-yellow-800/50 border-yellow-500/50 focus:border-yellow-400 focus:ring-yellow-400' },
  amber: { bg: 'bg-amber-700', text: 'text-amber-100', accent: 'text-amber-300', button: 'bg-amber-600 hover:bg-amber-500', input: 'bg-amber-800/50 border-amber-500/50 focus:border-amber-400 focus:ring-amber-400' },
  orange: { bg: 'bg-orange-700', text: 'text-orange-100', accent: 'text-orange-300', button: 'bg-orange-600 hover:bg-orange-500', input: 'bg-orange-800/50 border-orange-500/50 focus:border-orange-400 focus:ring-orange-400' },
  red: { bg: 'bg-red-700', text: 'text-red-100', accent: 'text-red-300', button: 'bg-red-600 hover:bg-red-500', input: 'bg-red-800/50 border-red-500/50 focus:border-red-400 focus:ring-red-400' },
  fuchsia: { bg: 'bg-fuchsia-700', text: 'text-fuchsia-100', accent: 'text-fuchsia-300', button: 'bg-fuchsia-600 hover:bg-fuchsia-500', input: 'bg-fuchsia-800/50 border-fuchsia-500/50 focus:border-fuchsia-400 focus:ring-fuchsia-400' },
  violet: { bg: 'bg-violet-700', text: 'text-violet-100', accent: 'text-violet-300', button: 'bg-violet-600 hover:bg-violet-500', input: 'bg-violet-800/50 border-violet-500/50 focus:border-violet-400 focus:ring-violet-400' },
}

// --- Utility Functions ---
const formatStopwatch = (ms) => {
  const hours = String(Math.floor(ms / 3600000)).padStart(2, '0')
  const minutes = String(Math.floor((ms % 3600000) / 60000)).padStart(2, '0')
  const seconds = String(Math.floor((ms % 60000) / 1000)).padStart(2, '0')
  return `${hours}:${minutes}:${seconds}`
}

const debounce = (func, delay) => {
  let timeoutId
  return (...args) => {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => func(...args), delay)
  }
}

// --- Optimized Components ---
const TrackerItem = React.memo(({ tracker, isActive, isFreeTracker, isPremium, isUpdating, onToggle }) => {
  const Icon = ICON_MAP[tracker.iconName]
  return (
    <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center">
          <span className="transition-colors duration-300" style={{ color: isActive ? tracker.color : "#94A3B8" }}>
            <Icon size={20} />
          </span>
          <h3 className="ml-3 text-md font-semibold text-slate-800">{tracker.name}</h3>
        </div>
        {!isPremium && !isFreeTracker && (
          <span className="bg-indigo-600 text-white text-xs font-semibold px-2 py-1 rounded-full">Pro</span>
        )}
      </div>
      <div className="flex items-center mb-4">
        <span className={`h-2 w-2 rounded-full mr-2 ${isActive ? "bg-emerald-500" : "bg-slate-400"}`}></span>
        <p className={`text-sm font-medium ${isActive ? "text-emerald-600" : "text-slate-500"}`}>
          {isActive ? "Active" : "Inactive"}
        </p>
      </div>
      <label className="flex items-center cursor-pointer">
        <input
          type="checkbox"
          checked={isActive}
          onChange={() => onToggle(tracker.id)}
          className="hidden"
          disabled={isUpdating}
        />
        <div className={`relative inline-flex items-center h-6 w-11 rounded-full transition-colors duration-300 ${isActive ? "bg-indigo-600" : "bg-slate-300"}`}>
          <span className={`inline-block h-4 w-4 rounded-full bg-white transform transition-transform duration-300 ${isActive ? "translate-x-6" : "translate-x-1"}`} />
        </div>
        <span className="ml-2 text-sm text-slate-600">
          {isUpdating ? "Saving..." : "Toggle"}
        </span>
      </label>
    </div>
  )
})

const DigitalWatch = React.memo(({ tasks, onSaveTask, onDeleteTask }) => {
  const [time, setTime] = useState(new Date())
  const [activeTab, setActiveTab] = useState('clock')
  const [stopwatchTime, setStopwatchTime] = useState(0)
  const [isStopwatchRunning, setIsStopwatchRunning] = useState(false)
  const [taskName, setTaskName] = useState("")
  const [resumingTaskId, setResumingTaskId] = useState(null)
  const [isFullScreen, setIsFullScreen] = useState(false)
  const [theme, setTheme] = useState('indigo')
  const [showPalette, setShowPalette] = useState(false)
  const paletteTimeoutRef = useRef(null)
  const stopwatchIntervalRef = useRef(null)
  const watchRef = useRef(null)

  useEffect(() => {
    const timerId = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(timerId)
  }, [])

  useEffect(() => {
    if (isStopwatchRunning) {
      const startTime = Date.now() - stopwatchTime
      stopwatchIntervalRef.current = setInterval(() => {
        setStopwatchTime(Date.now() - startTime)
      }, 1000)
    } else {
      clearInterval(stopwatchIntervalRef.current)
    }
    return () => clearInterval(stopwatchIntervalRef.current)
  }, [isStopwatchRunning])

  const resetStopwatch = useCallback(() => {
    setStopwatchTime(0)
    setIsStopwatchRunning(false)
    setTaskName("")
    setResumingTaskId(null)
  }, [])

  const handleSaveSession = useCallback(() => {
    if (!taskName || stopwatchTime === 0) return
    onSaveTask({ name: taskName, duration: stopwatchTime }, resumingTaskId)
    toast.success(resumingTaskId ? `Updated "${taskName}" session.` : `Saved "${taskName}" session.`)
    resetStopwatch()
  }, [taskName, stopwatchTime, resumingTaskId, onSaveTask])

  const handleResumeTask = useCallback((task) => {
    setActiveTab('stopwatch')
    setTaskName(task.name)
    setResumingTaskId(task.id)
    setStopwatchTime(0)
    setIsStopwatchRunning(true)
  }, [])

  const handleFullScreen = useCallback(async () => {
    if (!watchRef.current) return
    if (isFullScreen) {
      if (document.exitFullscreen) await document.exitFullscreen()
      setIsFullScreen(false)
    } else {
      if (watchRef.current.requestFullscreen) {
        await watchRef.current.requestFullscreen()
        setIsFullScreen(true)
      }
    }
  }, [isFullScreen])

  useEffect(() => {
    const handleScreenChange = () => setIsFullScreen(!!document.fullscreenElement)
    document.addEventListener('fullscreenchange', handleScreenChange)
    return () => document.removeEventListener('fullscreenchange', handleScreenChange)
  }, [])

  const handleExportLogs = useCallback(() => {
    if (tasks.length === 0) return
    const csvContent = 'Name,Duration (ms),Duration (formatted),Created At\n' +
      tasks.map(task => `${task.name},${task.duration},${formatStopwatch(task.duration)},${task.createdAt}`).join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'task_logs.csv'
    link.click()
    URL.revokeObjectURL(url)
    toast.success('Logs exported successfully.')
  }, [tasks])

  const totalDuration = useMemo(() =>
    tasks.reduce((sum, task) => sum + task.duration, 0),
    [tasks]
  )

  const formatTime = useCallback((date) => date.toLocaleTimeString('en-US', { hour12: true }), [])

  const currentTheme = WATCH_THEMES[theme]

  const handlePaletteToggle = useCallback(() => {
    if (paletteTimeoutRef.current) clearTimeout(paletteTimeoutRef.current)
    setShowPalette(!showPalette)
  }, [showPalette])

  const handlePaletteMouseEnter = useCallback(() => {
    if (paletteTimeoutRef.current) clearTimeout(paletteTimeoutRef.current)
    setShowPalette(true)
  }, [])

  const handlePaletteMouseLeave = useCallback(() => {
    paletteTimeoutRef.current = setTimeout(() => setShowPalette(false), 500)
  }, [])

  return (
    <div ref={watchRef} className={`relative flex flex-col p-6 rounded-xl border border-slate-200 shadow-sm transition-all duration-300 ${currentTheme.bg} ${isFullScreen ? 'w-screen h-screen justify-center' : 'h-[60vh]'}`}>
      {/* Header and Tabs */}
      <div className={`flex items-center justify-between pb-4 border-b ${isFullScreen ? 'border-white/20 absolute top-6 left-6 right-6' : 'border-white/10'}`}>
        <div className="flex items-center gap-1 sm:gap-2">
          <button onClick={() => setActiveTab('clock')} className={`px-3 py-1 text-sm rounded-md transition-colors ${activeTab === 'clock' ? 'bg-white/20' : 'hover:bg-white/10'} ${currentTheme.text}`}><Clock size={16} className="inline mr-1" /> Clock</button>
          <button onClick={() => setActiveTab('stopwatch')} className={`px-3 py-1 text-sm rounded-md transition-colors ${activeTab === 'stopwatch' ? 'bg-white/20' : 'hover:bg-white/10'} ${currentTheme.text}`}><Timer size={16} className="inline mr-1" /> Stopwatch</button>
          <button onClick={() => setActiveTab('logs')} className={`px-3 py-1 text-sm rounded-md transition-colors ${activeTab === 'logs' ? 'bg-white/20' : 'hover:bg-white/10'} ${currentTheme.text}`}><FileClock size={16} className="inline mr-1" /> Logs</button>
        </div>
        <div className="flex items-center gap-2">
          <div onClick={handlePaletteToggle} onMouseEnter={handlePaletteMouseEnter} onMouseLeave={handlePaletteMouseLeave} className="relative">
            <button className={`p-2 rounded-full transition-colors ${currentTheme.button}`}><Palette size={18} className={`${currentTheme.text}`} /></button>
            {showPalette && (
              <div className={`absolute right-0 top-full mt-2 w-28 bg-white/90 backdrop-blur-sm rounded-lg shadow-xl p-2 transition-opacity duration-300 z-10`}>
                {Object.keys(WATCH_THEMES).map(themeKey => (
                  <button key={themeKey} onClick={() => { setTheme(themeKey); setShowPalette(false); }} className={`w-full text-left text-sm px-2 py-1 rounded capitalize ${theme === themeKey ? 'bg-slate-200 font-semibold' : 'hover:bg-slate-100'} text-slate-800`}>{themeKey}</button>
                ))}
              </div>
            )}
          </div>
          <button onClick={handleFullScreen} className={`p-2 rounded-full transition-colors ${currentTheme.button}`}>
            {isFullScreen ? <Shrink size={18} className={`${currentTheme.text}`} /> : <Expand size={18} className={`${currentTheme.text}`} />}
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-grow flex flex-col items-center justify-center overflow-hidden pt-4">
        {activeTab === 'clock' && (
          <div className="text-center">
            <h1 className={`font-mono transition-all duration-300 ${isFullScreen ? 'text-8xl md:text-9xl' : 'text-5xl md:text-6xl'} ${currentTheme.text}`}>{formatTime(time)}</h1>
            <p className={`mt-2 ${isFullScreen ? 'text-2xl' : 'text-lg'} ${currentTheme.accent}`}>{time.toDateString()}</p>
          </div>
        )}

        {activeTab === 'stopwatch' && (
          <div className="text-center w-full">
            <input type="text" value={taskName} onChange={(e) => setTaskName(e.target.value)} placeholder="Enter Task Name..." readOnly={isStopwatchRunning} className={`w-full max-w-xs mx-auto text-center p-2 rounded-md border text-lg placeholder:text-white/40 transition-colors ${currentTheme.input} ${currentTheme.text}`} />
            <h1 className={`font-mono transition-all duration-300 my-4 ${isFullScreen ? 'text-8xl' : 'text-7xl'} ${currentTheme.text}`}>{formatStopwatch(stopwatchTime)}</h1>
            <div className={`flex items-center justify-center gap-4 ${isFullScreen ? 'mt-10' : ''}`}>
              {!isStopwatchRunning && stopwatchTime > 0 ? (
                <button onClick={handleSaveSession} className={`px-6 py-3 rounded-full font-semibold transition-colors flex items-center gap-2 ${currentTheme.button} ${currentTheme.text}`}><Save size={20} /> Save Session</button>
              ) : (
                <button onClick={() => setIsStopwatchRunning(!isStopwatchRunning)} disabled={!taskName} className={`px-6 py-3 rounded-full font-semibold transition-colors flex items-center gap-2 ${currentTheme.button} ${currentTheme.text} disabled:opacity-50 disabled:cursor-not-allowed`}>
                  {isStopwatchRunning ? <><Pause size={20} />Pause</> : <><Play size={20} />Start</>}
                </button>
              )}
              <button onClick={resetStopwatch} className={`px-6 py-3 rounded-full font-semibold transition-colors flex items-center gap-2 ${currentTheme.button} ${currentTheme.text}`}><RotateCcw size={20} /> Reset</button>
            </div>
          </div>
        )}

        {activeTab === 'logs' && (
          <div className="w-full h-full flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h2 className={`text-xl font-bold text-center ${currentTheme.text}`}>Task Time Logs</h2>
              <button onClick={handleExportLogs} className={`p-2 rounded-full transition-colors ${currentTheme.button}`} title="Export Logs"><Download size={18} className={`${currentTheme.text}`} /></button>
            </div>
            {tasks.length > 0 ? (
              <div className="flex-grow overflow-y-auto pr-2 max-h-[300px]">
                <ul className={`divide-y ${isFullScreen ? 'divide-white/20' : 'divide-white/10'}`}>
                  {[...tasks].reverse().map(task => (
                    <li key={task.id} className="flex items-center justify-between py-3">
                      <span className={`font-medium ${currentTheme.text}`}>{task.name}</span>
                      <div className="flex items-center gap-4">
                        <span className={`font-mono text-sm ${currentTheme.accent}`}>{formatStopwatch(task.duration)}</span>
                        <button onClick={() => handleResumeTask(task)} className="p-1.5 rounded-full hover:bg-white/10" title="Resume Task"><Play size={16} className="text-emerald-300" /></button>
                        <button onClick={() => onDeleteTask(task.id)} className="p-1.5 rounded-full hover:bg-white/10" title="Delete Task"><Trash2 size={16} className="text-rose-300" /></button>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <div className="flex-grow flex items-center justify-center">
                <p className={`${currentTheme.accent}`}>No saved tasks yet.</p>
              </div>
            )}
            {tasks.length > 0 && (
              <div className={`mt-4 p-2 border-t ${isFullScreen ? 'border-white/20' : 'border-white/10'} text-center ${currentTheme.accent}`}>Total Time: {formatStopwatch(totalDuration)}</div>
            )}
          </div>
        )}
      </div>
    </div>
  )
})

const CustomTrackerModal = React.memo(({ isOpen, onClose, onSave }) => {
  const [name, setName] = useState("")
  const [iconName, setIconName] = useState(Object.keys(ICON_MAP)[0])
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSave = useCallback(async () => {
    if (!name) {
      toast.error("Please enter a tracker name")
      return
    }
    setIsSubmitting(true)
    try {
      await onSave(name, iconName)
      setName("")
      setIconName(Object.keys(ICON_MAP)[0])
      onClose()
    } catch (error) {
      toast.error("Failed to create tracker. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }, [name, iconName, onSave, onClose])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/30 backdrop-blur-sm z-[60] transition-opacity duration-300">
      <div className="bg-white/90 p-7 rounded-xl w-full max-w-md shadow-2xl border border-slate-200/50 text-center">
        <div className="flex justify-center mb-4"><Hourglass size={48} className="text-indigo-500" /></div>
        <h2 className="text-xl font-bold text-slate-900 mb-2">This Service is Coming Soon</h2>
        <p className="text-slate-600 text-sm mb-4">We're working hard to bring you this feature. Stay tuned for updates!</p>
        <p className="text-slate-700 text-sm">For feedback, write to <a href="mailto:info@amigsol.com" className="text-indigo-600 font-semibold hover:underline">info@amigsol.com</a></p>
        <div className="flex justify-center mt-6">
          <button onClick={onClose} className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors text-sm font-semibold">Close</button>
        </div>
      </div>
    </div>
  )
})

const TrackerManagerModal = React.memo(({
  isOpen,
  onClose,
  activeTrackers,
  customTrackers,
  handleToggleTracker,
  handleCreateCustomTracker,
  isPremium,
  userDocRef
}) => {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [updatingTrackers, setUpdatingTrackers] = useState({})
  const allTrackers = useMemo(() => [...PREDEFINED_TRACKERS, ...customTrackers], [customTrackers])
  const freeTrackerIds = useMemo(() => [1, 6], [])
  const debouncedUpdate = useCallback(
    debounce(async (trackerId, newActiveTrackers) => {
      if (!userDocRef) return
      setUpdatingTrackers(prev => ({ ...prev, [trackerId]: true }))
      try {
        await updateDoc(userDocRef, { activeTrackers: newActiveTrackers })
      } catch (err) {
        console.error("Update error:", err)
        toast.error("Failed to save changes")
      } finally {
        setUpdatingTrackers(prev => ({ ...prev, [trackerId]: false }))
      }
    }, 500),
    [userDocRef]
  )

  const handleToggle = useCallback((trackerId) => {
    if (!isPremium && !freeTrackerIds.includes(trackerId) && !activeTrackers.includes(trackerId)) {
      toast.error("Upgrade to Premium to activate this tracker")
      return
    }
    const newActiveTrackers = activeTrackers.includes(trackerId)
      ? activeTrackers.filter(id => id !== trackerId)
      : [...activeTrackers, trackerId]
    handleToggleTracker(newActiveTrackers)
    debouncedUpdate(trackerId, newActiveTrackers)
  }, [activeTrackers, isPremium, freeTrackerIds, handleToggleTracker, debouncedUpdate])

  const handleSaveCustom = useCallback(async (name, iconName) => {
    await handleCreateCustomTracker(name, iconName)
    toast.success(`"${name}" tracker created and activated!`)
    setIsCreateModalOpen(false)
  }, [handleCreateCustomTracker])

  if (!isOpen) return null

  return (
    <>
      <div className="fixed inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-50 p-4">
        <div className="bg-slate-50 w-full max-w-4xl h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden">
          <div className="flex items-center justify-between p-6 border-b border-slate-200 flex-shrink-0">
            <div>
              <h2 className="text-2xl font-bold text-slate-800">Manage Trackers</h2>
              <p className="text-sm text-slate-500">Activate or deactivate trackers from your sidebar.</p>
            </div>
            <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-200 transition-colors"><X size={24} className="text-slate-600" /></button>
          </div>
          <div className="p-6 flex-grow overflow-y-auto">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {allTrackers.map((tracker) => (
                <TrackerItem
                  key={tracker.id}
                  tracker={tracker}
                  isActive={activeTrackers.includes(tracker.id)}
                  isFreeTracker={freeTrackerIds.includes(tracker.id)}
                  isPremium={isPremium}
                  isUpdating={!!updatingTrackers[tracker.id]}
                  onToggle={handleToggle}
                />
              ))}
              <div onClick={() => setIsCreateModalOpen(true)} className="bg-white p-5 rounded-xl border-2 border-dashed border-indigo-300 shadow-sm hover:shadow-lg transition-all duration-300 hover:border-indigo-500 cursor-pointer">
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <PlusCircle size={32} className="text-indigo-600 mb-3" />
                  <h3 className="text-md font-semibold text-slate-800">Add Custom Tracker</h3>
                  <p className="text-sm text-slate-500 mt-1">Create your own</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <CustomTrackerModal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} onSave={handleSaveCustom} />
    </>
  )
})

// --- Main Component with Skeleton Loading ---
const DashboardContent = () => {
  const { collapsed, activeTrackers, setActiveTrackers, customTrackers, setCustomTrackers } = useSidebar()
  const [user, loading, error] = useAuthState(auth)
  const navigate = useNavigate()
  const [isManagerModalOpen, setManagerModalOpen] = useState(false)
  const [timedTasks, setTimedTasks] = useState([])
  const [isPremium, setIsPremium] = useState(false)
  const [hasInitialData, setHasInitialData] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  const userDocRef = useMemo(() => user ? doc(db, "users", user.uid) : null, [user])

  // --- Initialization ---
  useEffect(() => {
    if (error) {
      toast.error("Authentication error: " + error.message)
      navigate("/signin")
    }
  }, [error, navigate])

  useEffect(() => {
    if (!loading && !user) {
      toast.error("Please sign in to access the dashboard")
      navigate("/signin")
    }
  }, [user, loading, navigate])

  const initializeUserData = useCallback(async () => {
    if (!userDocRef) return
    try {
      setIsLoading(true)
      await setDoc(userDocRef, {
        activeTrackers: [1],
        customTrackers: [],
        timedTasks: [],
        isPremium: false
      })
      setHasInitialData(true)
    } catch (err) {
      console.error("Initialization error:", err)
      toast.error("Failed to initialize data")
    } finally {
      setIsLoading(false)
    }
  }, [userDocRef])

  // --- Firestore Listener with Loading States ---
  useEffect(() => {
    if (!user || !userDocRef) {
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    const unsubscribe = onSnapshot(
      userDocRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data()
          setActiveTrackers(data.activeTrackers || [1])
          setCustomTrackers(data.customTrackers || [])
          setTimedTasks(data.timedTasks || [])
          setIsPremium(data.isPremium || false)
          setHasInitialData(true)
        } else {
          initializeUserData()
        }
        setIsLoading(false)
      },
      (err) => {
        console.error("Firestore error:", err)
        toast.error("Failed to load data. Please refresh.")
        setIsLoading(false)
      }
    )

    return () => unsubscribe()
  }, [user, userDocRef, setActiveTrackers, setCustomTrackers, initializeUserData])

  // --- Handlers ---
  const updateUserData = useCallback(async (dataToUpdate) => {
    if (!userDocRef) return
    try {
      await updateDoc(userDocRef, dataToUpdate)
    } catch (err) {
      console.error("Update error:", err)
      toast.error("Failed to save changes")
      throw err
    }
  }, [userDocRef])

  const handleSaveTask = useCallback(async (task, resumingId = null) => {
    if (resumingId) {
      const newTasks = timedTasks.map(t => t.id === resumingId ? { ...t, duration: t.duration + task.duration } : t)
      await updateUserData({ timedTasks: newTasks })
    } else {
      const newTask = { ...task, id: Date.now(), createdAt: new Date().toISOString() }
      const newTasks = [...timedTasks, newTask]
      await updateUserData({ timedTasks: newTasks })
    }
  }, [timedTasks, updateUserData])

  const handleDeleteTask = useCallback(async (taskId) => {
    const newTasks = timedTasks.filter(task => task.id !== taskId)
    await updateUserData({ timedTasks: newTasks })
    toast.info("Task log deleted.")
  }, [timedTasks, updateUserData])

  const handleToggleTracker = useCallback((newActiveTrackers) => {
    setActiveTrackers(newActiveTrackers)
  }, [setActiveTrackers])

  const handleCreateCustomTracker = useCallback(async (name, iconName) => {
    if (!user) throw new Error("User not authenticated")
    const maxId = Math.max(...PREDEFINED_TRACKERS.map(t => t.id), ...(customTrackers.map(t => t.id) || []), 0)
    const newCustom = {
      id: maxId + 1,
      name,
      path: `/dashboard/custom/${name.toLowerCase().replace(/\s/g, '-')}`,
      iconName,
      color: COLORS[Math.floor(Math.random() * COLORS.length)]
    }
    const newCustomTrackers = [...customTrackers, newCustom]
    const newActiveTrackers = [...new Set([...activeTrackers, newCustom.id])]
    const originalCustom = customTrackers
    const originalActive = activeTrackers
    setCustomTrackers(newCustomTrackers)
    setActiveTrackers(newActiveTrackers)
    try {
      await updateUserData({ activeTrackers: newActiveTrackers, customTrackers: newCustomTrackers })
    } catch (err) {
      setCustomTrackers(originalCustom)
      setActiveTrackers(originalActive)
      throw err
    }
  }, [user, customTrackers, activeTrackers, updateUserData, setCustomTrackers, setActiveTrackers])

  // --- Render with Skeleton Loading ---
  if (loading || !hasInitialData || isLoading) {
    return (
      <>
        <DashboardSkeleton />
        {isManagerModalOpen && <TrackerManagerSkeleton />}
      </>
    )
  }

  return (
    <div className={`min-h-screen bg-slate-100 transition-all duration-300 ${collapsed ? "lg:ml-20" : "lg:ml-64"}`}>
      <main className="p-6 md:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div onClick={() => setManagerModalOpen(true)} className="bg-gradient-to-br from-indigo-50 to-slate-50 p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-lg transition-all duration-300 ease-in-out hover:-translate-y-1 cursor-pointer flex flex-col justify-between relative overflow-hidden group">
            <div className="absolute -top-4 -right-4 w-24 h-24 bg-indigo-100 rounded-full opacity-50 group-hover:opacity-70 transition-opacity"></div>
            <div className="absolute -bottom-4 -left-4 w-16 h-16 bg-indigo-200 rounded-full opacity-30 group-hover:opacity-50 transition-opacity"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center text-indigo-600">
                  <div className="p-3 bg-indigo-100 rounded-lg"><Settings size={24} /></div>
                </div>
                <div className="flex items-center text-sm font-medium text-indigo-700 bg-indigo-100 px-3 py-1 rounded-full">
                  <BarChart3 size={14} className="mr-1" />
                  {activeTrackers.length} of {PREDEFINED_TRACKERS.length + customTrackers.length} active
                </div>
              </div>
              <h2 className="text-xl font-semibold text-slate-800 mb-2">Manage Your Trackers</h2>
              <p className="text-slate-600 mb-4">Customize your dashboard by enabling or disabling trackers in your sidebar.</p>
              <div className="flex items-center text-sm text-slate-500 mb-2">
                <span className="h-2 w-2 bg-emerald-500 rounded-full mr-2"></span>
                <span>{activeTrackers.length} trackers enabled</span>
              </div>
              <div className="flex items-center text-sm text-slate-500">
                <span className="h-2 w-2 bg-slate-400 rounded-full mr-2"></span>
                <span>{PREDEFINED_TRACKERS.length + customTrackers.length - activeTrackers.length} trackers disabled</span>
              </div>
            </div>
            <button className="mt-6 w-full text-center px-4 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-semibold shadow-sm group-hover:shadow-md flex items-center justify-center gap-2">
              <ListChecks size={16} />
              Open Tracker Manager
            </button>
          </div>
          <DigitalWatch tasks={timedTasks} onSaveTask={handleSaveTask} onDeleteTask={handleDeleteTask} />
        </div>
      </main>
      {isManagerModalOpen && (
        <TrackerManagerModal
          isOpen={isManagerModalOpen}
          onClose={() => setManagerModalOpen(false)}
          activeTrackers={activeTrackers}
          customTrackers={customTrackers}
          handleToggleTracker={handleToggleTracker}
          handleCreateCustomTracker={handleCreateCustomTracker}
          isPremium={isPremium}
          userDocRef={userDocRef}
        />
      )}
    </div>
  )
}

// --- Default Export ---
export default function Dashboard() {
  return <DashboardContent />
}
