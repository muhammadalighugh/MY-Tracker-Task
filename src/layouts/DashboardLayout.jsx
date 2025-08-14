import React from "react";
import Sidebar from "../Components/Common/Sidebar";
import { Outlet } from "react-router-dom";
import { SidebarProvider } from "../context/SidebarContext";
import Header from "../Components/Common/Header";

export default function DashboardLayout() {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen bg-slate-50">
        <Sidebar /> {/* No activeTrackers prop needed */}
        <div className="flex-1">
          <Header />
          <Outlet />
        </div>
      </div>
    </SidebarProvider>
  );
}