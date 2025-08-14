import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
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
  Smile
} from "lucide-react";

const COLORS = [
  { value: '#4f46e5', name: 'Indigo' },
  { value: '#8b5cf6', name: 'Purple' },
  { value: '#10b981', name: 'Emerald' },
  { value: '#f59e0b', name: 'Amber' },
  { value: '#ef4444', name: 'Red' },
  { value: '#3b82f6', name: 'Blue' },
];

function CreateTask() {
  const { collapsed } = useSidebar();
  const navigate = useNavigate();
  const [task, setTask] = useState({
    id: null,
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
    completions: {},
    completed: false,
    completedDate: null,
  });
  const [categoryInput, setCategoryInput] = useState("");
  const priorities = ["Low", "Medium", "High"];
  const recurrences = ["None", "Daily", "Weekly", "Monthly", "Custom"];
  const customUnits = ["days", "weeks", "months"];
  const categorySuggestions = ["Work", "Personal", "Urgent", "Project", "Learning", "Health", "Finance", "Other"];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setTask((prev) => ({ ...prev, [name]: value }));
  };

  const handleCategoryAdd = (e) => {
    if (e.key === "Enter" && categoryInput && !task.categories.includes(categoryInput)) {
      setTask((prev) => ({
        ...prev,
        categories: [...prev.categories, categoryInput],
      }));
      setCategoryInput("");
    }
  };

  const handleCategoryRemove = (categoryToRemove) => {
    setTask((prev) => ({
      ...prev,
      categories: prev.categories.filter((cat) => cat !== categoryToRemove),
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!task.title) {
      alert("Task title is required.");
      return;
    }
    let newTask = { 
      ...task, 
      id: Date.now(),
      completions: task.recurrence !== "None" ? {} : task.completions,
      completed: task.recurrence === "None" ? false : task.completed
    };
    if (task.recurrence === "Daily" && !newTask.dueDate) {
      newTask.dueDate = new Date().toISOString().split('T')[0];
    }
    const existingTasks = JSON.parse(localStorage.getItem("tasks") || "[]");
    localStorage.setItem("tasks", JSON.stringify([...existingTasks, newTask]));
    navigate("/dashboard/todays-task");
  };

  return (
    <div className={`min-h-screen bg-slate-50 transition-all duration-300 ${collapsed ? "lg:ml-20" : "lg:ml-64"}`}>
      <div className="p-4 max-w-6xl mx-auto">
        {/* Compact Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/dashboard/todays-task")}
              className="flex items-center justify-center w-8 h-8 rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-100 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <h1 className="text-2xl font-bold text-slate-900">Create Task</h1>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Single Card Layout */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              
              {/* Column 1: Basic Info */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Task Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="title"
                    value={task.title}
                    onChange={handleChange}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="Enter task title..."
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                  <textarea
                    name="description"
                    value={task.description}
                    onChange={handleChange}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                    placeholder="Task description..."
                    rows="3"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Emoji</label>
                    <input
                      type="text"
                      name="emoji"
                      value={task.emoji}
                      onChange={handleChange}
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      placeholder="🔥"
                      maxLength={2}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Priority</label>
                    <select
                      name="priority"
                      value={task.priority}
                      onChange={handleChange}
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    >
                      {priorities.map((priority) => (
                        <option key={priority} value={priority}>{priority}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Column 2: Schedule & Recurrence */}
              <div className="space-y-4">
                {task.recurrence !== "Daily" && (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      {task.recurrence !== "None" ? "Start Date" : "Due Date"}
                    </label>
                    <input
                      type="date"
                      name="dueDate"
                      value={task.dueDate}
                      onChange={handleChange}
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Recurrence</label>
                  <select
                    name="recurrence"
                    value={task.recurrence}
                    onChange={handleChange}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  >
                    {recurrences.map((rec) => (
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
                        className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        min="1"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">Unit</label>
                      <select
                        name="customUnit"
                        value={task.customUnit}
                        onChange={handleChange}
                        className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
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

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Color</label>
                  <div className="flex gap-2">
                    {COLORS.map((color) => (
                      <button
                        key={color.value}
                        type="button"
                        onClick={() => setTask(prev => ({ ...prev, color: color.value }))}
                        className={`w-6 h-6 rounded-md border-2 transition-all ${
                          task.color === color.value 
                            ? 'border-slate-400 scale-110' 
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
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Categories</label>
                  <input
                    type="text"
                    value={categoryInput}
                    onChange={(e) => setCategoryInput(e.target.value)}
                    onKeyPress={handleCategoryAdd}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="Add category..."
                    list="category-suggestions"
                  />
                  <datalist id="category-suggestions">
                    {categorySuggestions.map((suggestion) => (
                      <option key={suggestion} value={suggestion} />
                    ))}
                  </datalist>
                  {task.categories.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {task.categories.map((category, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-2 py-1 bg-indigo-50 text-indigo-700 text-xs font-medium rounded-md"
                        >
                          {category}
                          <button
                            type="button"
                            onClick={() => handleCategoryRemove(category)}
                            className="ml-1 text-indigo-500 hover:text-indigo-700"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Notes</label>
                  <textarea
                    name="notes"
                    value={task.notes}
                    onChange={handleChange}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                    placeholder="Additional notes..."
                    rows="4"
                  />
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-200">
              <button
                type="button"
                onClick={() => navigate("/dashboard/todays-task")}
                className="px-4 py-2 bg-slate-100 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-200 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors flex items-center"
              >
                <Save className="w-4 h-4 mr-1" />
                Create Task
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CreateTask;