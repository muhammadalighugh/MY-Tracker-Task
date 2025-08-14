// src/Components/Common/Header.jsx
import React, { useState, useEffect } from "react";
import { Menu, Bell, CalendarDays } from "lucide-react";
import { useSidebar } from "../../context/SidebarContext";

export default function Header() {
  const { setSidebarOpen } = useSidebar();
  const [currentDateTime, setCurrentDateTime] = useState({
    date: "",
    time: "",
  });

  useEffect(() => {
    const updateDateTime = () => {
      const now = new Date();
      const date = now.toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });
      const time = now.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });
      setCurrentDateTime({ date, time });
    };

    const interval = setInterval(updateDateTime, 1000);
    updateDateTime();
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-sm border-b border-slate-200">
      <div className="max-w-screen-xl mx-auto flex justify-between items-center h-16 px-4 sm:px-6 lg:px-8">
        {/* Left: Mobile Menu Button */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden text-slate-600 hover:text-slate-900"
            aria-label="Open sidebar"
          >
            <Menu size={24} />
          </button>
        </div>

        {/* Right: Date + Notification */}
        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-2 text-sm text-slate-600">
            <CalendarDays size={16} className="text-slate-400" />
            <span>{currentDateTime.date}</span>
            <span className="text-slate-300">|</span>
            <span>{currentDateTime.time}</span>
          </div>

          <button
            className="relative text-slate-500 hover:text-slate-800"
            aria-label="Notifications"
          >
            <Bell size={20} />
            <span className="absolute top-0 right-0 h-2 w-2 bg-red-500 rounded-full"></span>
          </button>
        </div>
      </div>
    </header>
  );
}
