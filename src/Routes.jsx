import React from "react";
import { Route, Routes } from "react-router-dom";

// Pages
import Home from "./pages/Home";
import Profile from "./pages/Profile";
import Dashboard from "./pages/Dashboard"; 

// Common Components
import Signup from "./Components/Auth/Signup";
import Signin from "./Components/Auth/Signin";
import VerifyEmail from "./Components/Auth/VerifyEmail";
import ForgotPassword from "./Components/Auth/ForgotPassword";
import PaymentPage from "./Components/Common/PaymentPage";

// Layouts
import DashboardLayout from "./layouts/DashboardLayout";

// Protected Route
import ProtectedRoute  from "./Components/ProtectedRoute";

// Dashboard Components
import PrayerTracker from "./Components/DashboardComponents/PrayerTracker";
import CodingTracker from "./Components/DashboardComponents/CodingTracker";
import WorkoutTracker from "./Components/DashboardComponents/WorkoutTracker";
import ReadingTracker from "./Components/DashboardComponents/ReadingTracker";
import DietTracker from "./Components/DashboardComponents/HealthTracker";
import MobileTracker from "./Components/DashboardComponents/Mobile";
import ExpenseTracker from "./Components/DashboardComponents/ExpenseTracker";
import CreateTask from "./Components/DashboardComponents/CreateTask";
import Notes from "./Components/DashboardComponents/Notes";
import Payment from "./Components/DashboardComponents/Payment";

// Cards
import CardMain from "./Components/CardsCreator/Card";

// Not Found
import NotFoundPage from "./pages/NotFound"; 

export default function AppRoutes() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<Home />} />
      <Route path="/signin" element={<Signin />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/verify-email" element={<VerifyEmail />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/payment" element={<PaymentPage />} />
      <Route path="*" element={<NotFoundPage />} />

      {/* Protected Dashboard Route */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="profile" element={<Profile />} />
        <Route path="prayer" element={<PrayerTracker />} />
        <Route path="notes" element={<Notes />} />
        <Route path="mypayment" element={<Payment />} />
        <Route path="create-task" element={<CreateTask />} />
        <Route path="card" element={<CardMain />} />
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
