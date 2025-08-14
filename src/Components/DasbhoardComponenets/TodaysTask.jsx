import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSidebar } from "../../context/SidebarContext";
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend
} from 'recharts';
import { Edit2, Trash2, Plus, CheckCircle, XCircle, Calendar, Search, ChevronLeft, ChevronRight } from "lucide-react";

const COLORS = ['#10B981', '#EF4444'];

function isApplicableToDate(task, dateStr) {
  if (!task.dueDate) return false;
  const taskDate = new Date(task.dueDate);
  const d = new Date(dateStr);
  if (task.recurrence === 'None') {
    return task.dueDate === dateStr;
  }
  if (d < taskDate) return false;
  const diffMs = d - taskDate;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (task.recurrence === 'Daily') {
    return true;
  } else if (task.recurrence === 'Weekly') {
    return diffDays % 7 === 0;
  } else if (task.recurrence === 'Monthly') {
    const approxDaysInMonth = 30;
    return diffDays % approxDaysInMonth === 0;
  } else if (task.recurrence === 'Custom') {
    let intervalDays = task.customInterval;
    if (task.customUnit === 'weeks') intervalDays *= 7;
    else if (task.customUnit === 'months') intervalDays *= 30; // approximate
    return diffDays % intervalDays === 0;
  }
  return false;
}

function getCompletedForDate(task, dateStr) {
  if (task.recurrence === 'None') return task.completed;
  return task.completions?.[dateStr] || false;
}

function SimpleCalendar({ tasks }) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
  const firstDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay();
  const weeks = [];
  let day = 1;
  for (let i = 0; i < 6; i++) {
    const week = [];
    for (let j = 0; j < 7; j++) {
      if (i === 0 && j < firstDay) {
        week.push(null);
      } else if (day > daysInMonth) {
        week.push(null);
      } else {
        week.push(day);
        day++;
      }
    }
    weeks.push(week);
    if (day > daysInMonth) break;
  }

  const hasTaskOnDate = (d) => {
    if (!d) return false;
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), d);
    const dateStr = date.toISOString().split('T')[0];
    return tasks.some((task) => task.recurrence !== 'Daily' && isApplicableToDate(task, dateStr));
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
      <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
        <Calendar className="mr-2" size={20} />
        Calendar
      </h2>
      <div className="flex justify-between mb-4">
        <button onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))} className="text-gray-600 hover:text-gray-800">
          <ChevronLeft size={20} />
        </button>
        <span className="font-medium">{currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}</span>
        <button onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))} className="text-gray-600 hover:text-gray-800">
          <ChevronRight size={20} />
        </button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-sm">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
          <div key={d} className="font-medium text-gray-500">
            {d}
          </div>
        ))}
        {weeks.flat().map((d, idx) => (
          <div key={idx} className={`p-2 rounded-md ${d ? 'hover:bg-gray-100 relative' : ''}`}>
            {d && d}
            {hasTaskOnDate(d) && <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-red-500 rounded-full" />}
          </div>
        ))}
      </div>
    </div>
  );
}

function TodaysTask() {
  const { collapsed } = useSidebar();
  const navigate = useNavigate();
  const [tasks, setTasks] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [updateForm, setUpdateForm] = useState({ title: "", description: "" });
  const [editForm, setEditForm] = useState({});
  const [activeTab, setActiveTab] = useState("today");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState(null);

  const today = new Date().toISOString().split("T")[0];

  useEffect(() => {
    const savedTasks = JSON.parse(localStorage.getItem("tasks") || "[]");
    setTasks(savedTasks);
  }, []);

  const updateLocalStorage = (updatedTasks) => {
    localStorage.setItem("tasks", JSON.stringify(updatedTasks));
    setTasks(updatedTasks);
  };

  const handleToggleComplete = (taskId) => {
    const updatedTasks = tasks.map((task) => {
      if (task.id === taskId) {
        const isRecurrent = task.recurrence !== "None";
        let updatedTask = task;
        if (isRecurrent) {
          const currentCompleted = getCompletedForDate(task, today);
          const newCompletions = { ...task.completions, [today]: !currentCompleted };
          updatedTask = { ...task, completions: newCompletions };
        } else {
          const newCompleted = !task.completed;
          updatedTask = { ...task, completed: newCompleted, completedDate: newCompleted ? today : null };
        }
        return updatedTask;
      }
      return task;
    });
    updateLocalStorage(updatedTasks);
  };

  const handleUpdateChange = (e) => {
    const { name, value } = e.target;
    setUpdateForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddUpdate = () => {
    if (!selectedTask) return;
    const newUpdate = {
      ...updateForm,
      date: new Date().toISOString(),
    };
    const updatedTasks = tasks.map((task) =>
      task.id === selectedTask.id
        ? { ...task, updates: [...(task.updates || []), newUpdate] }
        : task
    );
    updateLocalStorage(updatedTasks);
    setShowUpdateModal(false);
    setUpdateForm({ title: "", description: "" });
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSaveEdit = () => {
    const updatedTasks = tasks.map((task) =>
      task.id === editForm.id ? { ...editForm } : task
    );
    updateLocalStorage(updatedTasks);
    setShowEditModal(false);
  };

  const handleDeleteTask = (taskId) => {
    const updatedTasks = tasks.filter((task) => task.id !== taskId);
    updateLocalStorage(updatedTasks);
    setShowDeleteConfirm(false);
  };

  const getFilteredTasks = () => {
    let filtered = tasks;
    if (activeTab === "today") {
      filtered = filtered.filter((task) => isApplicableToDate(task, today));
    } else if (activeTab === "overdue") {
      filtered = filtered.filter((task) => task.dueDate < today && !task.completed && task.recurrence === "None");
    } else if (activeTab === "upcoming") {
      filtered = filtered.filter((task) => task.recurrence !== "Daily" && task.dueDate > today && task.recurrence === "None" && !task.completed);
    } else if (activeTab === "completed") {
      filtered = filtered.filter((task) => task.completed && task.recurrence === "None");
    } else if (activeTab === "history") {
      filtered = filtered.filter((task) => (task.recurrence === "None" && task.completed) || Object.keys(task.completions || {}).length > 0);
    }
    if (searchQuery) {
      filtered = filtered.filter((task) =>
        task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    return filtered;
  };

  const filteredTasks = getFilteredTasks();

  const todaysApplicableTasks = tasks.filter((task) => isApplicableToDate(task, today));
  const completedCount = todaysApplicableTasks.filter((t) => getCompletedForDate(t, today)).length;
  const pendingCount = todaysApplicableTasks.length - completedCount;
  const chartData = [
    { name: 'Completed', value: completedCount },
    { name: 'Pending', value: pendingCount },
  ];

  return (
    <div className={`min-h-screen bg-gray-50 transition-all duration-300 p-6 md:p-8 ${collapsed ? "lg:ml-20" : "lg:ml-64"}`}>
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <h1 className="text-3xl font-bold text-gray-900">Task Manager</h1>
          <div className="flex items-center gap-4 w-full md:w-auto">
            <div className="relative flex-1 md:flex-none">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search tasks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full md:w-64 pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <button
              onClick={() => navigate("/dashboard/create-task")}
              className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors"
            >
              <Plus size={16} />
              New Task
            </button>
          </div>
        </div>

        <div className="mb-8">
          <div className="flex space-x-1 bg-white p-1 rounded-lg shadow-sm border border-gray-200 overflow-x-auto">
            {["today", "overdue", "upcoming", "all", "completed", "history"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-shrink-0 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                  activeTab === tab ? "bg-indigo-50 text-indigo-700" : "text-gray-600 hover:bg-gray-50"
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          <div className="lg:col-span-2 space-y-6">
            {filteredTasks.length === 0 ? (
              <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200 text-center">
                <Calendar className="mx-auto w-12 h-12 text-gray-400 mb-4" />
                <p className="text-gray-500 font-medium">No tasks found for this view.</p>
              </div>
            ) : (
              filteredTasks.map((task) => {
                const isHistory = activeTab === "history";
                const completed = getCompletedForDate(task, today);
                const isCompleted = task.recurrence === "None" ? task.completed : completed;
                return (
                  <div 
                    key={task.id} 
                    className="bg-white p-6 rounded-xl shadow-sm border border-gray-200"
                    style={{ borderLeftWidth: '4px', borderLeftColor: task.color || '#3B82F6' }}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4 flex-1">
                        {!isHistory && (
                          <button
                            onClick={() => handleToggleComplete(task.id)}
                            className={`mt-1 flex-shrink-0 ${
                              isCompleted ? "text-green-500" : "text-gray-400 hover:text-gray-600"
                            }`}
                          >
                            {isCompleted ? <CheckCircle size={24} /> : <XCircle size={24} />}
                          </button>
                        )}
                        <div>
                          <h3 className={`text-lg font-semibold ${isCompleted ? "text-gray-500 line-through" : "text-gray-900"}`}>
                            {task.emoji && <span className="mr-2">{task.emoji}</span>}
                            {task.title}
                          </h3>
                          <p className="text-sm text-gray-600 mt-1">{task.description}</p>
                          <div className="flex flex-wrap gap-2 mt-2">
                            <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800">
                              Due: {task.dueDate || "No date"}
                            </span>
                            <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-indigo-100 text-indigo-800">
                              {task.priority}
                            </span>
                            <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                              {isCompleted ? 'Completed' : 'Pending'}
                            </span>
                            {task.recurrence !== 'None' && (
                              <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                                Recurs: {task.recurrence}
                              </span>
                            )}
                          </div>
                          {task.categories.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {task.categories.map((cat, idx) => (
                                <span key={idx} className="text-xs text-indigo-600">
                                  #{cat}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                      {!isHistory && (
                        <div className="flex gap-2 ml-4">
                          <button
                            onClick={() => {
                              setSelectedTask(task);
                              setShowUpdateModal(true);
                            }}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-md"
                          >
                            <Plus size={16} />
                          </button>
                          <button
                            disabled={isCompleted}
                            onClick={() => {
                              if (!isCompleted) {
                                setEditForm(task);
                                setShowEditModal(true);
                              }
                            }}
                            className={`p-2 ${isCompleted ? 'text-gray-400 cursor-not-allowed' : 'text-indigo-600 hover:bg-indigo-50'} rounded-md`}
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={() => {
                              setTaskToDelete(task.id);
                              setShowDeleteConfirm(true);
                            }}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-md"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      )}
                    </div>

                    {task.notes && (
                      <div className="mt-4 pl-10 text-sm text-gray-600">
                        <h4 className="font-medium text-gray-700 mb-1">Notes</h4>
                        <p>{task.notes}</p>
                      </div>
                    )}

                    {task.updates && task.updates.length > 0 && (
                      <div className="mt-4 pl-10">
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Updates</h4>
                        <ul className="space-y-3">
                          {task.updates.map((update, idx) => (
                            <li key={idx} className="text-sm">
                              <span className="font-medium text-gray-800">{update.title}</span>
                              <p className="text-gray-600">{update.description}</p>
                              <p className="text-xs text-gray-400 mt-1">
                                {new Date(update.date).toLocaleString()}
                              </p>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {isHistory && (
                      <div className="mt-4 pl-10 text-sm text-gray-600">
                        <h4 className="font-medium text-gray-700 mb-1">Completion History</h4>
                        {task.recurrence === 'None' ? (
                          <p>Completed on: {task.completedDate}</p>
                        ) : (
                          <ul>
                            {Object.keys(task.completions || {}).filter(date => task.completions[date]).map(date => (
                              <li key={date}>{date}</li>
                            ))}
                          </ul>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          <div className="space-y-8">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Task Overview</h2>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartData}
                      innerRadius={40}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4 text-center text-sm text-gray-600">
                Today's Tasks: {todaysApplicableTasks.length}
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Quick Stats</h2>
              <ul className="space-y-3 text-sm">
                <li className="flex justify-between">
                  <span className="text-gray-600">Today's Tasks</span>
                  <span className="font-medium">{todaysApplicableTasks.length}</span>
                </li>
                <li className="flex justify-between">
                  <span className="text-gray-600">Overdue</span>
                  <span className="font-medium text-red-600">{tasks.filter(t => t.dueDate < today && !t.completed && t.recurrence === 'None').length}</span>
                </li>
                <li className="flex justify-between">
                  <span className="text-gray-600">Upcoming</span>
                  <span className="font-medium">{tasks.filter(t => t.dueDate > today && t.recurrence === 'None').length}</span>
                </li>
                <li className="flex justify-between">
                  <span className="text-gray-600">Completed</span>
                  <span className="font-medium text-green-600">{tasks.filter(t => t.completed && t.recurrence === 'None').length}</span>
                </li>
              </ul>
            </div>

            <SimpleCalendar tasks={tasks} />
          </div>
        </div>

        {showUpdateModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-xl shadow-xl w-full max-w-md m-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Add Update</h3>
              <div className="space-y-4">
                <input
                  type="text"
                  name="title"
                  value={updateForm.title}
                  onChange={handleUpdateChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500"
                  placeholder="Update title"
                />
                <textarea
                  name="description"
                  value={updateForm.description}
                  onChange={handleUpdateChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500"
                  placeholder="Update description"
                  rows="3"
                />
                <div className="flex justify-end gap-3">
                  <button
                    onClick={() => setShowUpdateModal(false)}
                    className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAddUpdate}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                  >
                    Save Update
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {showEditModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 overflow-y-auto">
            <div className="bg-white p-6 rounded-xl shadow-xl w-full max-w-2xl m-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Edit Task</h3>
              <form className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                    <input
                      type="text"
                      name="title"
                      value={editForm.title}
                      onChange={handleEditChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Emoji</label>
                    <input
                      type="text"
                      name="emoji"
                      value={editForm.emoji}
                      onChange={handleEditChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500"
                      maxLength={2}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    name="description"
                    value={editForm.description}
                    onChange={handleEditChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500"
                    rows="3"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {editForm.recurrence !== "Daily" && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">{editForm.recurrence !== "None" ? "Start Date" : "Due Date"}</label>
                      <input
                        type="date"
                        name="dueDate"
                        value={editForm.dueDate}
                        onChange={handleEditChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  )}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                    <select
                      name="priority"
                      value={editForm.priority}
                      onChange={handleEditChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500"
                    >
                      <option>Low</option>
                      <option>Medium</option>
                      <option>High</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Color</label>
                    <select
                      name="color"
                      value={editForm.color}
                      onChange={handleEditChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500"
                    >
                      {COLORS.map((col) => (
                        <option key={col.value} value={col.value}>
                          {col.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Recurrence</label>
                    <select
                      name="recurrence"
                      value={editForm.recurrence}
                      onChange={handleEditChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500"
                    >
                      {recurrences.map((rec) => (
                        <option key={rec} value={rec}>
                          {rec}
                        </option>
                      ))}
                    </select>
                  </div>
                  {editForm.recurrence === "Custom" && (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Interval</label>
                        <input
                          type="number"
                          name="customInterval"
                          value={editForm.customInterval}
                          onChange={handleEditChange}
                          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500"
                          min="1"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Unit</label>
                        <select
                          name="customUnit"
                          value={editForm.customUnit}
                          onChange={handleEditChange}
                          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500"
                        >
                          {customUnits.map((unit) => (
                            <option key={unit} value={unit}>
                              {unit.charAt(0).toUpperCase() + unit.slice(1)}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                  <textarea
                    name="notes"
                    value={editForm.notes}
                    onChange={handleEditChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500"
                    rows="3"
                  />
                </div>
                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setShowEditModal(false)}
                    className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveEdit}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-xl shadow-xl w-full max-w-sm m-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Confirm Deletion</h3>
              <p className="text-sm text-gray-600 mb-6">Are you sure you want to delete this task? This action cannot be undone.</p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDeleteTask(taskToDelete)}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default TodaysTask;