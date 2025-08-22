import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';

const SidebarContext = createContext();

export function SidebarProvider({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [trackersExpanded, setTrackersExpanded] = useState(true);

  // Memoized initial state for activeTrackers and customTrackers
  const [activeTrackers, setActiveTrackers] = useState(() => {
    try {
      const saved = localStorage.getItem('activeTrackers');
      return saved ? JSON.parse(saved) : [1];
    } catch (e) {
      return [1];
    }
  });
  const [customTrackers, setCustomTrackers] = useState(() => {
    try {
      const saved = localStorage.getItem('customTrackers');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  // Memoized handlers to prevent unnecessary re-renders
  const setActiveTrackersMemoized = useCallback((newTrackers) => {
    setActiveTrackers(newTrackers);
  }, []);

  const setCustomTrackersMemoized = useCallback((newTrackers) => {
    setCustomTrackers(newTrackers);
  }, []);

  // Save to localStorage only when dependencies change
  useEffect(() => {
    localStorage.setItem('activeTrackers', JSON.stringify(activeTrackers));
  }, [activeTrackers]);

  useEffect(() => {
    localStorage.setItem('customTrackers', JSON.stringify(customTrackers));
  }, [customTrackers]);

  // Memoized context value
  const contextValue = useMemo(() => ({
    sidebarOpen,
    setSidebarOpen,
    collapsed,
    setCollapsed,
    activeTrackers,
    setActiveTrackers: setActiveTrackersMemoized,
    trackersExpanded,
    setTrackersExpanded,
    customTrackers,
    setCustomTrackers: setCustomTrackersMemoized,
  }), [
    sidebarOpen,
    collapsed,
    activeTrackers,
    trackersExpanded,
    customTrackers,
    setActiveTrackersMemoized,
    setCustomTrackersMemoized,
  ]);

  return (
    <SidebarContext.Provider value={contextValue}>
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
