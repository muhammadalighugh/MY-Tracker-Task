// src/Components/Common/Header.jsx
import React, { useState, useEffect } from "react";
import { Menu, Bell, CalendarDays, Hourglass, MessageCircle, X } from "lucide-react";
import { useSidebar } from "../../context/SidebarContext";

export default function Header() {
  const { setSidebarOpen } = useSidebar();
  const [currentDateTime, setCurrentDateTime] = useState({
    date: "",
    time: "",
  });
  const [showNotification, setShowNotification] = useState(false);

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

  const handleNotificationClick = () => {
    setShowNotification(!showNotification);
  };

  // Close notification when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showNotification && !event.target.closest('.notification-container')) {
        setShowNotification(false);
      }
    };
    if (showNotification) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showNotification]);

  return (
    <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-sm border-b border-slate-200">
      <div className="max-w-screen-xl mx-auto flex justify-between items-center h-12 sm:h-14 px-3 sm:px-4 lg:px-8">

        {/* Left: Mobile Menu Button */}
        <div className="flex items-center gap-2 sm:gap-4">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden text-slate-600 hover:text-slate-900 p-1 rounded-md hover:bg-slate-100 transition-colors"
            aria-label="Open sidebar"
          >
            <Menu size={20} className="sm:w-6 sm:h-6" />
          </button>
        </div>

        {/* Center: Feedback Text and Message Icon */}
        <div className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm text-indigo-800 font-medium">
          <MessageCircle size={16} className="text-indigo-600 flex-shrink-0" />
          <span className="leading-tight">
            We appreciate your feedback:{" "}
            <a
              href="mailto:info@amigsol.com"
              className="text-indigo-700 hover:underline"
            >
              info@amigsol.com
            </a>
          </span>
        </div>

        {/* Right: Date + Notification */}
        <div className="flex items-center gap-2 sm:gap-4 relative">
          {/* Date/Time */}
          <div className="hidden sm:flex items-center gap-1 sm:gap-2 text-xs sm:text-sm text-slate-600">
            <CalendarDays size={14} className="text-slate-400 sm:w-4 sm:h-4" />
            <span className="hidden lg:inline">{currentDateTime.date}</span>
            <span className="lg:hidden">
              {new Date().toLocaleDateString("en-US", {
                month: "short",
                day: "numeric"
              })}
            </span>
            <span className="text-slate-300 hidden lg:inline">|</span>
            <span className="font-medium">{currentDateTime.time}</span>
          </div>

          {/* Notification Bell */}
          <div className="notification-container relative">
            <button
              onClick={handleNotificationClick}
              className="relative text-slate-500 hover:text-slate-800 transition-colors p-2 rounded-full hover:bg-slate-100"
              aria-label="Notifications"
            >
              <Bell size={18} className="sm:w-5 sm:h-5" />
              <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full"></span>
            </button>

            {/* Notification Popup */}
            {showNotification && (
              <>
                <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 sm:hidden" />
                <div className="absolute top-12 right-0 bg-white border border-slate-200 rounded-lg shadow-xl p-4 w-80 sm:w-72 z-50 max-w-[calc(100vw-2rem)] sm:max-w-none">
                  <div className="flex items-center justify-between mb-3 sm:hidden">
                    <h2 className="text-sm font-semibold text-slate-900">Notifications</h2>
                    <button
                      onClick={() => setShowNotification(false)}
                      className="text-slate-400 hover:text-slate-600 p-1 rounded-full"
                    >
                      <X size={16} />
                    </button>
                  </div>
                  <div className="flex items-start mb-3">
                    <Hourglass size={20} className="text-indigo-500 mr-2 mt-0.5 flex-shrink-0" />
                    <div className="text-left min-w-0">
                      <h3 className="text-sm font-semibold text-slate-900">Notifications Coming Soon</h3>
                      <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                        We're working to bring you real-time notifications for updates and alerts.
                      </p>
                    </div>
                  </div>
                  <div className="border-t border-slate-100 pt-3">
                    <div className="flex items-start text-xs text-slate-700">
                      <MessageCircle size={14} className="text-indigo-500 mr-2 mt-0.5 flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="font-medium">Your feedback matters!</p>
                        <p className="mt-1 leading-relaxed">
                          Help us improve:{" "}
                          <a
                            href="mailto:info@amigsol.com"
                            className="text-indigo-600 font-medium hover:underline break-all"
                          >
                            info@amigsol.com
                          </a>
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
