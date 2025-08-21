import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useSidebar } from "../../context/SidebarContext";
import { 
  CalendarDays, 
  Flag, 
  Palette, 
  Repeat, 
  Tag, 
  FileText, 
  X,
  Save,
  ArrowLeft,
  Clock,
  Smile,
  AlertCircle,
  CheckCircle2,
  Calendar as CalendarIcon,
  RefreshCw,
  Plus,
  Filter,
  SortAsc,
  MoreVertical,
  Edit3,
  Trash2,
  Archive,
  TrendingUp,
  Target,
  Activity
} from "lucide-react";
import { db } from "../../firebase/firebase.config";
import { 
  collection, 
  addDoc, 
  query, 
  where, 
  getDocs, 
  orderBy, 
  limit,
  serverTimestamp,
  doc,
  updateDoc,
  deleteDoc,
  writeBatch,
  getDoc,
  setDoc
} from "firebase/firestore";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, CartesianGrid, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';

// Enhanced Constants
const COLORS = [
  { value: '#4f46e5', name: 'Indigo' },
  { value: '#8b5cf6', name: 'Purple' },
  { value: '#10b981', name: 'Emerald' },
  { value: '#f59e0b', name: 'Amber' },
  { value: '#ef4444', name: 'Red' },
  { value: '#3b82f6', name: 'Blue' },
  { value: '#06b6d4', name: 'Cyan' },
  { value: '#84cc16', name: 'Lime' },
  { value: '#ec4899', name: 'Pink' },
  { value: '#14b8a6', name: 'Teal' }
];

const PRIORITIES = [
  { value: 'Low', color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200' },
  { value: 'Medium', color: 'text-yellow-600', bg: 'bg-yellow-50', border: 'border-yellow-200' },
  { value: 'High', color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-200' },
  { value: 'Urgent', color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200' }
];

const RECURRENCES = ["None", "Daily", "Weekly", "Monthly", "Custom"];
const CUSTOM_UNITS = ["days", "weeks", "months"];
const CATEGORY_SUGGESTIONS = [
  "Work", "Personal", "Urgent", "Project", "Learning", 
  "Health", "Finance", "Shopping", "Travel", "Meeting",
  "Review", "Bug Fix", "Feature", "Documentation", "Testing"
];

const TABS = [
  { id: "create", label: "Create Task", icon: FileText },
  { id: "pending", label: "Today's Tasks", icon: Clock },
  { id: "overdue", label: "Overdue", icon: AlertCircle },
  { id: "history", label: "Completed", icon: CheckCircle2 },
  { id: "analytics", label: "Analytics", icon: TrendingUp },
  { id: "calendar", label: "Calendar", icon: CalendarIcon }
];

// Helper function to calculate next due date
const calculateNextDue = (currentDueStr, recurrence, customInterval = 1, customUnit = 'days', alwaysAdvance = false) => {
  let currentDue = new Date(currentDueStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const advanceDate = () => {
    if (recurrence === 'Daily') {
      currentDue.setDate(currentDue.getDate() + 1);
    } else if (recurrence === 'Weekly') {
      currentDue.setDate(currentDue.getDate() + 7);
    } else if (recurrence === 'Monthly') {
      currentDue.setMonth(currentDue.getMonth() + 1);
    } else if (recurrence === 'Custom') {
      if (customUnit === 'days') {
        currentDue.setDate(currentDue.getDate() + customInterval);
      } else if (customUnit === 'weeks') {
        currentDue.setDate(currentDue.getDate() + customInterval * 7);
      } else if (customUnit === 'months') {
        currentDue.setMonth(currentDue.getMonth() + customInterval);
      }
    }
  };

  if (alwaysAdvance) {
    advanceDate();
  }

  while (currentDue < today) {
    advanceDate();
  }

  return currentDue.toISOString().split('T')[0];
};

// Calendar Component
const SimpleCalendar = ({ tasks, onDateSelect, selectedDate }) => {
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());

  const getDaysInMonth = (month, year) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (month, year) => {
    return new Date(year, month, 1).getDay();
  };

  const getTasksForDate = useCallback((date) => {
    const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    return tasks.filter(task => task.dueDate === dateStr);
  }, [tasks]);

  const renderCalendarDays = () => {
    const daysInMonth = getDaysInMonth(currentMonth, currentYear);
    const firstDay = getFirstDayOfMonth(currentMonth, currentYear);
    const days = [];

    // Empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-6 sm:h-8 md:h-10"></div>);
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentYear, currentMonth, day);
      const isToday = date.toDateString() === today.toDateString();
      const isSelected = selectedDate && date.toDateString() === selectedDate.toDateString();
      const dayTasks = getTasksForDate(date);
      const hasOverdue = dayTasks.some(task => !task.completed && task.dueDate < today.toISOString().split('T')[0]);

      days.push(
        <div
          key={day}
          onClick={() => onDateSelect(date)}
          className={`h-6 sm:h-8 md:h-10 flex items-center justify-center cursor-pointer rounded-lg text-xs sm:text-sm font-medium transition-all duration-200 relative
            ${isToday ? 'bg-indigo-100 text-indigo-700 ring-2 ring-indigo-200' : ''}
            ${isSelected ? 'bg-indigo-600 text-white' : ''}
            ${!isToday && !isSelected ? 'hover:bg-slate-100 text-slate-700' : ''}
          `}
        >
          {day}
          {dayTasks.length > 0 && (
            <div className={`absolute bottom-0 right-0 w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full ${
              hasOverdue ? 'bg-red-500' : 'bg-indigo-500'
            }`}></div>
          )}
        </div>
      );
    }

    return days;
  };

  const navigateMonth = (direction) => {
    if (direction === 'prev') {
      if (currentMonth === 0) {
        setCurrentMonth(11);
        setCurrentYear(currentYear - 1);
      } else {
        setCurrentMonth(currentMonth - 1);
      }
    } else {
      if (currentMonth === 11) {
        setCurrentMonth(0);
        setCurrentYear(currentYear + 1);
      } else {
        setCurrentMonth(currentMonth + 1);
      }
    }
  };

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 sm:p-6">
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <h3 className="text-base sm:text-lg font-semibold text-slate-800">
          {monthNames[currentMonth]} {currentYear}
        </h3>
        <div className="flex gap-1 sm:gap-2">
          <button
            onClick={() => navigateMonth('prev')}
            className="p-1 sm:p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-3 h-3 sm:w-4 sm:h-4" />
          </button>
          <button
            onClick={() => navigateMonth('next')}
            className="p-1 sm:p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-3 h-3 sm:w-4 sm:h-4 rotate-180" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-0.5 sm:gap-1 mb-1 sm:mb-2">
        {dayNames.map(day => (
          <div key={day} className="h-6 sm:h-8 flex items-center justify-center text-xs font-medium text-slate-500">
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-0.5 sm:gap-1">
        {renderCalendarDays()}
      </div>
    </div>
  );
};

// Enhanced Custom Hooks
const useAuth = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);

  const ensureUserDocument = useCallback(async (user) => {
    try {
      const userDocRef = doc(db, "users", user.uid);
      const userDoc = await getDoc(userDocRef);
      
      if (!userDoc.exists()) {
        await setDoc(userDocRef, {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName || '',
          photoURL: user.photoURL || '',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          preferences: {
            defaultPriority: 'Medium',
            defaultColor: COLORS[0].value,
            notifications: true
          }
        });
      }
    } catch (error) {
      console.error("Error ensuring user document:", error);
    }
  }, []);

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUser(user);
        await ensureUserDocument(user);
      } else {
        setUser(null);
      }
      setLoading(false);
      setInitialized(true);
    });
    return () => unsubscribe();
  }, [ensureUserDocument]);

  return { user, loading, initialized };
};

const useTasks = (userId) => {
  const [tasks, setTasks] = useState({
    pending: [],
    overdue: [],
    history: [],
    all: []
  });
  const [loading, setLoading] = useState(false);

  const fetchTasks = useCallback(async () => {
    if (!userId) return;
    
    setLoading(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      
      const allTasksQuery = query(
        collection(db, "tasks"), 
        where("userId", "==", userId)
      );

      const allTasksSnapshot = await getDocs(allTasksQuery);
      let allTasks = allTasksSnapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate?.() || new Date(),
        completedDate: doc.data().completedDate
      }));

      // Advance overdue recurring tasks
      const batch = writeBatch(db);
      let needsBatchCommit = false;

      const updatedTasks = allTasks.map(task => {
        if (!task.completed && task.recurrence !== "None" && task.dueDate < today) {
          const newDueDate = calculateNextDue(
            task.dueDate,
            task.recurrence,
            task.customInterval,
            task.customUnit,
            false
          );
          if (newDueDate !== task.dueDate) {
            const taskRef = doc(db, "tasks", task.id);
            batch.update(taskRef, {
              dueDate: newDueDate,
              updatedAt: serverTimestamp()
            });
            needsBatchCommit = true;
            return { ...task, dueDate: newDueDate };
          }
        }
        return task;
      });

      if (needsBatchCommit) {
        await batch.commit();
      }

      const categorizedTasks = {
        all: updatedTasks,
        pending: updatedTasks.filter(task => 
          !task.completed && 
          task.dueDate === today
        ),
        overdue: updatedTasks.filter(task => 
          !task.completed && 
          task.dueDate && 
          task.dueDate < today
        ),
        history: updatedTasks.filter(task => task.completed).slice(0, 100)
      };

      setTasks(categorizedTasks);
    } catch (error) {
      console.error("Error fetching tasks:", error);
      toast.error("Failed to fetch tasks. Please check your permissions.");
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const updateTask = useCallback(async (taskId, updates) => {
    try {
      const taskRef = doc(db, "tasks", taskId);
      await updateDoc(taskRef, {
        ...updates,
        updatedAt: serverTimestamp()
      });
      await fetchTasks();
      return true;
    } catch (error) {
      console.error("Error updating task:", error);
      toast.error("Failed to update task");
      return false;
    }
  }, [fetchTasks]);

  const deleteTask = useCallback(async (task) => {
    try {
      await deleteDoc(doc(db, "tasks", task.id));
      await fetchTasks();
      toast.success(task.recurrence !== "None" ? "Recurring task deleted and future recurrences stopped." : "Task deleted successfully.");
      return true;
    } catch (error) {
      console.error("Error deleting task:", error);
      toast.error("Failed to delete task");
      return false;
    }
  }, [fetchTasks]);

  const completeTask = useCallback(async (task) => {
    const success = await updateTask(task.id, {
      completed: true,
      completedDate: new Date().toISOString().split('T')[0]
    });

    if (success && task.recurrence !== "None") {
      try {
        const nextDue = calculateNextDue(task.dueDate, task.recurrence, task.customInterval, task.customUnit, true);
        const newTaskData = {
          ...task,
          dueDate: nextDue,
          completed: false,
          completedDate: null,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        };
        delete newTaskData.id;
        await addDoc(collection(db, "tasks"), newTaskData);
        await fetchTasks();
        toast.success(`Recurring task completed! Next instance created for ${nextDue}.`);
      } catch (error) {
        console.error("Error creating next recurring task:", error);
        toast.error("Failed to create next recurring task.");
      }
    } else if (success) {
      toast.success("Task completed successfully.");
    }

    return success;
  }, [updateTask, fetchTasks]);

  useEffect(() => {
    if (userId) {
      fetchTasks();
    }
  }, [fetchTasks, userId]);

  return { 
    tasks, 
    loading, 
    refetchTasks: fetchTasks,
    updateTask,
    deleteTask,
    completeTask
  };
};

// Enhanced Task form validation
const validateTask = (task) => {
  const errors = {};
  
  if (!task.title?.trim()) {
    errors.title = "Task title is required";
  } else if (task.title.length > 100) {
    errors.title = "Title must be less than 100 characters";
  }
  
  if (task.description && task.description.length > 1000) {
    errors.description = "Description must be less than 1000 characters";
  }

  if (task.recurrence === "Custom") {
    if (task.customInterval < 1) {
      errors.customInterval = "Interval must be at least 1";
    } else if (task.customInterval > 365) {
      errors.customInterval = "Interval cannot exceed 365";
    }
  }

  if (task.dueDate) {
    const today = new Date().toISOString().split('T')[0];
    if (task.dueDate < today && task.recurrence === "None") {
      errors.dueDate = "Due date cannot be in the past";
    }
  }

  return errors;
};

// Loading Component
const LoadingSpinner = ({ size = "xl", text = "Loading..." }) => {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-6 h-6",
    lg: "w-8 h-8"
  };

  return (
    <div className="flex flex-col items-center justify-center py-8">
      <div className={`${sizeClasses[size]} border-2 border-indigo-500 border-t-transparent rounded-full animate-spin`}></div>
      <p className="text-slate-500 mt-2 text-sm">{text}</p>
    </div>
  );
};

// Task Card Component
const TaskCard = ({ task, onComplete, onEdit, onDelete, showActions = true }) => {
  const [isUpdating, setIsUpdating] = useState(false);
  const priority = PRIORITIES.find(p => p.value === task.priority) || PRIORITIES[1];

  const handleComplete = useCallback(async () => {
    setIsUpdating(true);
    await onComplete(task);
    setIsUpdating(false);
  }, [onComplete, task]);

  const isOverdue = task.dueDate && task.dueDate < new Date().toISOString().split('T')[0] && !task.completed;

  return (
    <div className={`p-3 sm:p-4 rounded-lg border transition-all duration-200 hover:shadow-md ${
      isOverdue ? 'bg-red-50 border-red-200' : 'bg-slate-50 border-slate-200'
    }`}>
      <div className="flex flex-col sm:flex-row items-start sm:items-start justify-between gap-3 sm:gap-0">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            {task.emoji && <span className="text-base sm:text-lg flex-shrink-0">{task.emoji}</span>}
            <h3 className={`font-medium text-slate-900 truncate text-sm sm:text-base ${task.completed ? 'line-through text-slate-500' : ''}`}>
              {task.title}
            </h3>
            <span className={`inline-flex items-center px-1.5 sm:px-2 py-0.5 rounded-full text-xs font-medium ${priority.bg} ${priority.color} ${priority.border} border`}>
              {task.priority}
            </span>
            {isOverdue && (
              <span className="inline-flex items-center px-1.5 sm:px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700 border border-red-200">
                Overdue
              </span>
            )}
          </div>
          
          {task.description && (
            <p className={`text-xs sm:text-sm mb-2 ${task.completed ? 'text-slate-400' : 'text-slate-600'}`}>
              {task.description.length > 100 ? `${task.description.substring(0, 100)}...` : task.description}
            </p>
          )}
          
          <div className="flex items-center gap-2 sm:gap-4 text-xs text-slate-500 flex-wrap">
            {task.dueDate && (
              <span className="flex items-center gap-1">
                <CalendarDays className="w-3 h-3" />
                {new Date(task.dueDate).toLocaleDateString()}
              </span>
            )}
            {task.categories && task.categories.length > 0 && (
              <div className="flex gap-1 flex-wrap">
                {task.categories.slice(0, 3).map((cat, idx) => (
                  <span key={idx} className="px-1.5 sm:px-2 py-0.5 bg-white rounded-md text-xs border border-slate-200">
                    {cat}
                  </span>
                ))}
                {task.categories.length > 3 && (
                  <span className="px-1.5 sm:px-2 py-0.5 bg-white rounded-md text-xs border border-slate-200">
                    +{task.categories.length - 3} more
                  </span>
                )}
              </div>
            )}
            {task.recurrence !== "None" && (
              <span className="flex items-center gap-1">
                <Repeat className="w-3 h-3" />
                {task.recurrence}
              </span>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-2 ml-0 sm:ml-4 mt-2 sm:mt-0 w-full sm:w-auto justify-between sm:justify-end">
          <div 
            className="w-3 h-3 rounded-full flex-shrink-0 border border-slate-300" 
            style={{ backgroundColor: task.color }}
          />
          {showActions && !task.completed && (
            <div className="flex items-center gap-1">
              <button
                onClick={handleComplete}
                disabled={isUpdating}
                className="p-1 text-green-600 hover:bg-green-50 rounded-md transition-colors disabled:opacity-50"
                title="Mark as complete"
              >
                <CheckCircle2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => onEdit?.(task)}
                className="p-1 text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                title="Edit task"
              >
                <Edit3 className="w-4 h-4" />
              </button>
              <button
                onClick={() => onDelete?.(task)}
                className="p-1 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                title="Delete task"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Main Component
function CreateTask() {
  const { collapsed } = useSidebar();
  const { user, loading: authLoading, initialized } = useAuth();
  const { tasks, loading: tasksLoading, refetchTasks, updateTask, deleteTask, completeTask } = useTasks(user?.uid);
  
  // Move all hooks to the top level
  const [activeTab, setActiveTab] = useState("create");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  const [editingTask, setEditingTask] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  
  const [task, setTask] = useState({
    title: "",
    description: "",
    dueDate: "",
    priority: "Medium",
    categories: [],
    notes: "",
    recurrence: "None",
    customInterval: 1,
    customUnit: "days",
    emoji: "",
    color: COLORS[0].value,
    completed: false,
    completedDate: null,
  });
  
  const [categoryInput, setCategoryInput] = useState("");

  // Calendar data computation
  const getTasksForDate = useCallback((date) => {
    const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    return tasks.all.filter(task => task.dueDate === dateStr);
  }, [tasks.all]);

  const selectedDateTasks = useMemo(() => getTasksForDate(selectedDate), [getTasksForDate, selectedDate]);

  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setTask(prev => ({ ...prev, [name]: value }));
    
    if (validationErrors[name]) {
      setValidationErrors(prev => ({ ...prev, [name]: null }));
    }
  }, [validationErrors]);

  const handleCategoryAdd = useCallback((e) => {
    if (e.key === "Enter" && categoryInput.trim() && !task.categories.includes(categoryInput.trim())) {
      setTask(prev => ({
        ...prev,
        categories: [...prev.categories, categoryInput.trim()],
      }));
      setCategoryInput("");
    }
  }, [categoryInput, task.categories]);

  const handleCategoryRemove = useCallback((categoryToRemove) => {
    setTask(prev => ({
      ...prev,
      categories: prev.categories.filter(cat => cat !== categoryToRemove),
    }));
  }, []);

  const resetForm = useCallback(() => {
    setTask({
      title: "",
      description: "",
      dueDate: "",
      priority: "Medium",
      categories: [],
      notes: "",
      recurrence: "None",
      customInterval: 1,
      customUnit: "days",
      emoji: "",
      color: COLORS[0].value,
      completed: false,
      completedDate: null,
    });
    setValidationErrors({});
    setEditingTask(null);
  }, []);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    
    const errors = validateTask(task);
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      toast.error("Please fix the form errors.");
      return;
    }

    if (!user?.uid) {
      toast.error("Authentication required.");
      return;
    }

    setIsSubmitting(true);
    
    try {
      const taskData = { 
        ...task,
        title: task.title.trim(),
        description: task.description.trim(),
        notes: task.notes.trim(),
        userId: user.uid,
        createdAt: editingTask ? editingTask.createdAt : serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      if (task.recurrence === "Daily" && !taskData.dueDate) {
        taskData.dueDate = new Date().toISOString().split('T')[0];
      }

      if (editingTask) {
        await updateDoc(doc(db, "tasks", editingTask.id), taskData);
        toast.success("Task updated successfully.");
      } else {
        await addDoc(collection(db, "tasks"), taskData);
        toast.success("Task created successfully.");
      }
      
      resetForm();
      await refetchTasks();
      
    } catch (error) {
      console.error("Error saving task:", error);
      const errorMessage = error.code === 'permission-denied' 
        ? "Permission denied. Please check your authentication." 
        : `Failed to ${editingTask ? 'update' : 'create'} task: ${error.message}`;
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  }, [task, user, editingTask, resetForm, refetchTasks]);

  const handleEdit = useCallback((taskToEdit) => {
    setTask({
      ...taskToEdit,
      categories: taskToEdit.categories || [],
      customInterval: taskToEdit.customInterval || 1,
      customUnit: taskToEdit.customUnit || "days"
    });
    setEditingTask(taskToEdit);
    setActiveTab("create");
  }, []);

  const handleDelete = useCallback(async (task) => {
    if (window.confirm("Are you sure you want to delete this task?")) {
      await deleteTask(task);
    }
  }, [deleteTask]);

  const analyticsData = useMemo(() => {
    const getDailyData = () => {
      const data = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        const count = tasks.history.filter(t => t.completedDate === dateStr).length;
        data.push({ 
          date: dateStr, 
          completed: count,
          formattedDate: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        });
      }
      return data;
    };

    const getCategoryData = () => {
      const categoryCount = {};
      tasks.all.forEach(task => {
        if (task.categories) {
          task.categories.forEach(cat => {
            categoryCount[cat] = (categoryCount[cat] || 0) + 1;
          });
        }
      });
      
      return Object.entries(categoryCount)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 8);
    };

    const getPriorityData = () => {
      const priorityCount = { Low: 0, Medium: 0, High: 0, Urgent: 0 };
      tasks.all.forEach(task => {
        if (task.priority && priorityCount.hasOwnProperty(task.priority)) {
          priorityCount[task.priority]++;
        }
      });
      
      return Object.entries(priorityCount).map(([name, value]) => ({ name, value }));
    };

    return {
      daily: getDailyData(),
      categories: getCategoryData(),
      priorities: getPriorityData()
    };
  }, [tasks.all, tasks.history]);

  if (authLoading || !initialized) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <LoadingSpinner size="lg" text="Initializing..." />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-800 mb-4">Authentication Required</h2>
          <p className="text-slate-600">Please sign in to access your tasks.</p>
        </div>
      </div>
    );
  }

  const renderTaskForm = () => (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 sm:p-6">
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <h2 className="text-lg sm:text-xl md:text-2xl font-semibold text-slate-900">
          {editingTask ? 'Edit Task' : 'Create New Task'}
        </h2>
        {editingTask && (
          <button
            onClick={resetForm}
            className="text-slate-500 hover:text-slate-700 transition-colors text-xs sm:text-sm md:text-base"
          >
            Cancel Edit
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
          {/* Column 1: Basic Info */}
          <div className="space-y-3 sm:space-y-4">
            <div>
              <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-1 sm:mb-2">
                Task Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="title"
                value={task.title}
                onChange={handleChange}
                className={`w-full px-3 py-2 text-xs sm:text-sm border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 ${
                  validationErrors.title ? 'border-red-300' : 'border-slate-300'
                }`}
                placeholder="Enter task title..."
                maxLength={100}
              />
              {validationErrors.title && (
                <p className="text-red-500 text-xs mt-1">{validationErrors.title}</p>
              )}
              <p className="text-xs text-slate-500 mt-1">{task.title.length}/100</p>
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-1 sm:mb-2">Description</label>
              <textarea
                name="description"
                value={task.description}
                onChange={handleChange}
                className={`w-full px-3 py-2 text-xs sm:text-sm border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none transition-all duration-200 ${
                  validationErrors.description ? 'border-red-300' : 'border-slate-200'
                }`}
                placeholder="Task description..."
                rows="3 sm:rows-4"
                maxLength={1000}
              />
              {validationErrors.description && (
                <p className="text-red-500 text-xs mt-1">{validationErrors.description}</p>
              )}
              <p className="text-xs text-slate-500 mt-1">{task.description.length}/1000</p>
            </div>

            <div className="grid grid-cols-2 gap-2 sm:gap-3">
              <div>
                <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-1 sm:mb-2">Emoji</label>
                <input
                  type="text"
                  name="emoji"
                  value={task.emoji}
                  onChange={handleChange}
                  className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
                  placeholder="🔥"
                  maxLength={2}
                />
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-1 sm:mb-2">Priority</label>
                <select
                  name="priority"
                  value={task.priority}
                  onChange={handleChange}
                  className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
                >
                  {PRIORITIES.map((priority) => (
                    <option key={priority.value} value={priority.value}>
                      {priority.value}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Column 2: Schedule & Recurrence */}
          <div className="space-y-3 sm:space-y-4">
            {task.recurrence !== "Daily" && (
              <div>
                <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-1 sm:mb-2">
                  {task.recurrence !== "None" ? "Start Date" : "Due Date"}
                </label>
                <input
                  type="date"
                  name="dueDate"
                  value={task.dueDate}
                  onChange={handleChange}
                  min={new Date().toISOString().split('T')[0]}
                  className={`w-full px-3 py-2 text-xs sm:text-sm border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 ${
                    validationErrors.dueDate ? 'border-red-300' : 'border-slate-200'
                  }`}
                />
                {validationErrors.dueDate && (
                  <p className="text-red-500 text-xs mt-1">{validationErrors.dueDate}</p>
                )}
              </div>
            )}

            <div>
              <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-1 sm:mb-2">Recurrence</label>
              <select
                name="recurrence"
                value={task.recurrence}
                onChange={handleChange}
                className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
              >
                {RECURRENCES.map((rec) => (
                  <option key={rec} value={rec}>{rec}</option>
                ))}
              </select>
            </div>

            {task.recurrence === "Custom" && (
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Every</label>
                  <input
                    type="number"
                    name="customInterval"
                    value={task.customInterval}
                    onChange={handleChange}
                    className={`w-full px-3 py-2 text-xs sm:text-sm border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 ${
                      validationErrors.customInterval ? 'border-red-300' : 'border-slate-200'
                    }`}
                    min="1"
                    max="365"
                  />
                  {validationErrors.customInterval && (
                    <p className="text-red-500 text-xs mt-1">{validationErrors.customInterval}</p>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Unit</label>
                  <select
                    name="customUnit"
                    value={task.customUnit}
                    onChange={handleChange}
                    className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
                  >
                    {CUSTOM_UNITS.map((unit) => (
                      <option key={unit} value={unit}>
                        {unit.charAt(0).toUpperCase() + unit.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-1 sm:mb-2">Color</label>
              <div className="flex gap-1 sm:gap-2 flex-wrap">
                {COLORS.map((color) => (
                  <button
                    key={color.value}
                    type="button"
                    onClick={() => setTask(prev => ({ ...prev, color: color.value }))}
                    className={`w-5 h-5 sm:w-6 md:w-8 sm:h-6 md:h-8 rounded-lg border-2 transition-all duration-200 hover:scale-105 ${
                      task.color === color.value 
                        ? 'border-slate-400 scale-110 ring-2 ring-slate-200' 
                        : 'border-slate-200'
                    }`}
                    style={{ backgroundColor: color.value }}
                    title={color.name}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Column 3: Categories & Notes */}
          <div className="space-y-3 sm:space-y-4">
            <div>
              <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-1 sm:mb-2">Categories</label>
              <input
                type="text"
                value={categoryInput}
                onChange={(e) => setCategoryInput(e.target.value)}
                onKeyPress={handleCategoryAdd}
                className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
                placeholder="Add category and press Enter..."
                list="category-suggestions"
              />
              <datalist id="category-suggestions">
                {CATEGORY_SUGGESTIONS.map((suggestion) => (
                  <option key={suggestion} value={suggestion} />
                ))}
              </datalist>
              {task.categories.length > 0 && (
                <div className="flex flex-wrap gap-1 sm:gap-2 mt-2 sm:mt-3">
                  {task.categories.map((category, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-1.5 sm:px-2 md:px-3 py-0.5 sm:py-1 bg-indigo-50 text-indigo-700 text-xs font-medium rounded-md border border-indigo-200"
                    >
                      {category}
                      <button
                        type="button"
                        onClick={() => handleCategoryRemove(category)}
                        className="ml-1 sm:ml-2 text-indigo-500 hover:text-indigo-700 transition-colors"
                      >
                        <X className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-1 sm:mb-2">Notes</label>
              <textarea
                name="notes"
                value={task.notes}
                onChange={handleChange}
                className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none transition-all duration-200"
                placeholder="Additional notes..."
                rows="4 sm:rows-5"
                maxLength={500}
              />
              <p className="text-xs text-slate-500 mt-1">{task.notes.length}/500</p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-3 mt-6 sm:mt-8 pt-4 sm:pt-6 border-t border-slate-200">
          <button
            type="button"
            onClick={resetForm}
            className="w-full sm:w-auto px-4 py-2 sm:py-2.5 bg-slate-100 text-slate-700 text-xs sm:text-sm font-medium rounded-lg hover:bg-slate-200 transition-colors"
            disabled={isSubmitting}
          >
            {editingTask ? 'Cancel' : 'Reset'}
          </button>
          <button
            type="submit"
            className="w-full sm:w-auto px-4 sm:px-6 md:px-8 py-2 sm:py-2.5 bg-indigo-600 text-white text-xs sm:text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
            disabled={isSubmitting}
          >
            <Save className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
            {isSubmitting ? (editingTask ? "Updating..." : "Creating...") : (editingTask ? "Update Task" : "Create Task")}
          </button>
        </div>
      </form>
    </div>
  );

  const renderTaskList = (taskList, title, emptyMessage, bgColor = "bg-slate-50") => (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 sm:mb-6 gap-3 sm:gap-4">
        <div className="flex items-center gap-2 sm:gap-3">
          <h2 className="text-base sm:text-lg md:text-xl font-semibold text-slate-900">{title}</h2>
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
            {taskList.length} tasks
          </span>
        </div>
        <button
          onClick={refetchTasks}
          className="p-1.5 sm:p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
          title="Refresh tasks"
        >
          <RefreshCw className="w-3 h-3 sm:w-4 sm:h-4" />
        </button>
      </div>
      
      {tasksLoading ? (
        <LoadingSpinner text="Loading tasks..." />
      ) : taskList.length > 0 ? (
        <div className="space-y-3">
          {taskList.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onComplete={completeTask}
              onEdit={handleEdit}
              onDelete={handleDelete}
              showActions={!task.completed}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-8 sm:py-12">
          <div className="w-12 h-12 sm:w-16 sm:h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
            <FileText className="w-6 h-6 sm:w-8 sm:h-8 text-slate-400" />
          </div>
          <p className="text-slate-500 text-base sm:text-lg font-medium">{emptyMessage}</p>
          <p className="text-slate-400 text-xs sm:text-sm mt-1">Create your first task to get started!</p>
        </div>
      )}
    </div>
  );

  const renderAnalytics = () => (
    <div className="space-y-4 sm:space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-3 sm:p-4 md:p-6 rounded-xl border border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xs font-medium text-blue-800">Today's Tasks</h3>
              <p className="text-lg sm:text-xl md:text-2xl font-bold text-blue-900">{tasks.pending.length}</p>
            </div>
            <Clock className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 text-blue-600" />
          </div>
        </div>
        <div className="bg-gradient-to-r from-red-50 to-red-100 p-3 sm:p-4 md:p-6 rounded-xl border border-red-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xs font-medium text-red-800">Overdue</h3>
              <p className="text-lg sm:text-xl md:text-2xl font-bold text-red-900">{tasks.overdue.length}</p>
            </div>
            <AlertCircle className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 text-red-600" />
          </div>
        </div>
        <div className="bg-gradient-to-r from-green-50 to-green-100 p-3 sm:p-4 md:p-6 rounded-xl border border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xs font-medium text-green-800">Completed</h3>
              <p className="text-lg sm:text-xl md:text-2xl font-bold text-green-900">{tasks.history.length}</p>
            </div>
            <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 text-green-600" />
          </div>
        </div>
        <div className="bg-gradient-to-r from-purple-50 to-purple-100 p-3 sm:p-4 md:p-6 rounded-xl border border-purple-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xs font-medium text-purple-800">Total Tasks</h3>
              <p className="text-lg sm:text-xl md:text-2xl font-bold text-purple-900">{tasks.all.length}</p>
            </div>
            <FileText className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 text-purple-600" />
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        {/* Daily Completed Tasks */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-3 sm:p-4 md:p-6">
          <h3 className="text-sm sm:text-base md:text-lg font-semibold text-slate-800 mb-3 sm:mb-4">Daily Completed Tasks (Last 7 Days)</h3>
          <div className="h-[200px] sm:h-[250px] md:h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analyticsData.daily}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="formattedDate" stroke="#64748b" fontSize={10} sm:fontSize={12} />
                <YAxis stroke="#64748b" fontSize={10} sm:fontSize={12} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#ffffff', 
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }}
                />
                <Bar dataKey="completed" fill="#4f46e5" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Priority Distribution */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-3 sm:p-4 md:p-6">
          <h3 className="text-sm sm:text-base md:text-lg font-semibold text-slate-800 mb-3 sm:mb-4">Tasks by Priority</h3>
          <div className="h-[200px] sm:h-[250px] md:h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={analyticsData.priorities}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={60} sm:outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {analyticsData.priorities.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length].value} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Categories Chart */}
      {analyticsData.categories.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-3 sm:p-4 md:p-6">
          <h3 className="text-sm sm:text-base md:text-lg font-semibold text-slate-800 mb-3 sm:mb-4">Top Categories</h3>
          <div className="h-[200px] sm:h-[250px] md:h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analyticsData.categories} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis type="number" stroke="#64748b" fontSize={10} sm:fontSize={12} />
                <YAxis dataKey="name" type="category" stroke="#64748b" fontSize={10} sm:fontSize={12} width={60} sm:width={80} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#ffffff', 
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }}
                />
                <Bar dataKey="value" fill="#10b981" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );

  const renderCalendarView = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
      <SimpleCalendar
        tasks={tasks.all}
        onDateSelect={setSelectedDate}
        selectedDate={selectedDate}
      />
      
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 sm:p-6">
        <h3 className="text-sm sm:text-base md:text-lg font-semibold text-slate-800 mb-3 sm:mb-4">
          Tasks for {selectedDate.toLocaleDateString()}
        </h3>
        {selectedDateTasks.length > 0 ? (
          <div className="space-y-3">
            {selectedDateTasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onComplete={completeTask}
                onEdit={handleEdit}
                onDelete={handleDelete}
                showActions={!task.completed}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-6 sm:py-8">
            <CalendarDays className="w-10 h-10 sm:w-12 sm:h-12 text-slate-300 mx-auto mb-2 sm:mb-3" />
            <p className="text-slate-500 text-sm sm:text-base">No tasks for this date</p>
          </div>
        )}
      </div>
    </div>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case "create":
        return renderTaskForm();
      case "pending":
        return renderTaskList(tasks.pending, "Today's Tasks", "No tasks scheduled for today");
      case "overdue":
        return renderTaskList(tasks.overdue, "Overdue Tasks", "No overdue tasks", "bg-red-50");
      case "history":
        return renderTaskList(tasks.history, "Completed Tasks", "No completed tasks yet", "bg-green-50");
      case "analytics":
        return renderAnalytics();
      case "calendar":
        return renderCalendarView();
      default:
        return renderTaskForm();
    }
  };

  return (
    <div className={`min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 transition-all duration-300 ${
      collapsed ? 'ml-0 lg:ml-16' : 'ml-0 lg:ml-64'
    } px-4 py-1 lg:px-8`}>
      <div className="max-w-7xl mx-auto">
        {/* Tab Navigation */}
        <div className="mb-2 md:mb-2">
          <div className="border-b border-slate-200 bg-white rounded-t-xl shadow-sm">
            <nav className="-mb-px grid grid-cols-3 gap-0 sm:flex sm:flex-wrap sm:overflow-x-auto px-2 sm:px-4 md:px-6">
              {TABS.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center justify-center gap-1 sm:gap-2 py-2 sm:py-3 md:py-4 px-1 sm:px-3 md:px-4 text-xs font-medium border-b-2 transition-colors duration-200 whitespace-nowrap ${
                      activeTab === tab.id
                        ? 'border-indigo-500 text-indigo-600'
                        : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    <Icon className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span className="hidden sm:inline">{tab.label}</span>
                    <span className="sm:hidden">{tab.label.split(' ')[0]}</span>
                    {tab.id === "pending" && tasks.pending.length > 0 && (
                      <span className="ml-1 bg-blue-100 text-blue-600 text-xs font-medium px-1 py-0.5 rounded-full">
                        {tasks.pending.length}
                      </span>
                    )}
                    {tab.id === "overdue" && tasks.overdue.length > 0 && (
                      <span className="ml-1 bg-red-100 text-red-600 text-xs font-medium px-1 py-0.5 rounded-full">
                        {tasks.overdue.length}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        <div className="transition-all duration-300">
          {renderTabContent()}
        </div>
      </div>
    </div>
  );
}

export default CreateTask;