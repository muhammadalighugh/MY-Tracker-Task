import React, { createContext, useContext, useState } from 'react';

const SidebarContext = createContext();

export function SidebarProvider({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [activeTrackers, setActiveTrackers] = useState([1]); // Only Prayer Tracker active by default
  const [trackersExpanded, setTrackersExpanded] = useState(true);
  const [customTrackers, setCustomTrackers] = useState([]);

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