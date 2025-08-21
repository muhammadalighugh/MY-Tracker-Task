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
import DietTracker from "./Components/DasbhoardComponenets/HealthTracker";
import MobileTracker from "./Components/DasbhoardComponenets/Mobile";
import ExpenseTracker from "./Components/DasbhoardComponenets/ExpenseTracker";
import CreateTask from "./Components/DasbhoardComponenets/CreateTask";
// import CardMain from "./Components/CardsCreator/card"; 
import ProtectedRoute  from "./Components/ProtectedRoute"; 
import Notes from "./Components/DasbhoardComponenets/Notes";
import  CardMain from './Components/CardsCreator/Card';
// import  CardView from './Components/CardsCreator/card';
// import CardPreview from "./Components/CardsCreator/CardPreview";
import VerifyEmail from "./Components/Common/VerifyEmail";
import ForgotPassword from "./Components/Common/ForgotPassword";
import PaymentPage from "./Components/Common/PaymentPage";
import Payment from "./Components/DasbhoardComponenets/Payment";
import NotFoundPage from "./pages/NotfFound";
export default function AppRoutes() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<Home />} />
      <Route path="/signin" element={<Signin />} /> {/* Updated to lowercase */}
      <Route path="/signup" element={<Signup />} /> {/* Updated to lowercase */}
      <Route path="verify-email" element={<VerifyEmail />} />
      <Route path="forgot-password" element={<ForgotPassword />} />
      <Route path="payment" element={<PaymentPage />} />
      {/* <Route path="/dashboard/card/preview" element={<CardPreview />} /> */}
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
        {/* <Route path="/dashboard/card/:shortLink" element={<CardView />} /> */}
      </Route>
    </Routes>
  );
}