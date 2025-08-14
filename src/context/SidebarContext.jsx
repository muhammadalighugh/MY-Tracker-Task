import React, { createContext, useContext, useState, useEffect } from 'react';

const SidebarContext = createContext();

export function SidebarProvider({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [activeTrackers, setActiveTrackers] = useState([]);
  const [trackersExpanded, setTrackersExpanded] = useState(true);
  const [customTrackers, setCustomTrackers] = useState([]);

  useEffect(() => {
    try {
      const savedActiveTrackers = JSON.parse(localStorage.getItem("activeTrackers") || '[]');
      const savedCustomTrackers = JSON.parse(localStorage.getItem("customTrackers") || '[]');
      setActiveTrackers(savedActiveTrackers.length ? savedActiveTrackers : [1, 2, 3, 4, 5, 6, 7]);
      setCustomTrackers(Array.isArray(savedCustomTrackers) ? savedCustomTrackers : []);
      console.log("Context Initialized:", { activeTrackers: savedActiveTrackers, customTrackers: savedCustomTrackers });
    } catch (error) {
      console.error("Error loading from localStorage:", error);
      setActiveTrackers([1, 2, 3, 4, 5, 6, 7]);
      setCustomTrackers([]);
    }
  }, []);

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

  return (
    <SidebarContext.Provider
      value={{
        sidebarOpen,
        setSidebarOpen,
        collapsed,
        setCollapsed,
        activeTrackers,
        setActiveTrackers,
        trackersExpanded,
        setTrackersExpanded,
        customTrackers,
        setCustomTrackers
      }}
    >
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebar() {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error('useSidebar must be used within a SidebarProvider');
  }
  return context;
}