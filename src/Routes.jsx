import React from "react";
import { Route, Routes } from "react-router-dom";
import Home from "./pages/Home";
import Profile from "./pages/Profile";
import Signup from "./Components/Common/Signup";
import Signin from "./Components/Common/Signin";
import DashboardLayout from "./layouts/DashboardLayout";
import Dashboard from "./pages/Dasboard";
import PrayerTracker from "./Components/DasbhoardComponenets/PrayerTracker";
import CodingTracker from "./Components/DasbhoardComponenets/CodingTracker";
import WorkoutTracker from "./Components/DasbhoardComponenets/WorkoutTracker";
import ReadingTracker from "./Components/DasbhoardComponenets/ReadingTracker";
// import MeditationTracker from "./Components/DasbhoardComponenets/ExpenseTracker";
import DietTracker from "./Components/DasbhoardComponenets/HealthTracker";
import MobileTracker from "./Components/DasbhoardComponenets/Mobile";
import ExpenseTracker from "./Components/DasbhoardComponenets/ExpenseTracker";
import CreateTask from "./Components/DasbhoardComponenets/CreateTask";
import TodaysTask from "./Components/DasbhoardComponenets/TodaysTask";

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/Signup" element={<Signup />} />
      <Route path="/Signin" element={<Signin />} />

      {/* Dashboard Layout with Sidebar */}
      <Route path="/dashboard" element={<DashboardLayout />}>
        <Route index element={<Dashboard />} />
      <Route path="/dashboard/profile" element={<Profile />} />
        <Route path="prayer" element={<PrayerTracker />} />
        <Route path="create-task" element={<CreateTask />} />
        <Route path="todays-task" element={<TodaysTask />} />
        <Route path="coding" element={<CodingTracker />} />
        <Route path="workout" element={<WorkoutTracker />} />
        <Route path="mobile" element={<MobileTracker />} />
        <Route path="reading" element={<ReadingTracker />} />
        <Route path="expense" element={<ExpenseTracker />} />
        <Route path="diet" element={<DietTracker />} />
      </Route>
    </Routes>
  );
}