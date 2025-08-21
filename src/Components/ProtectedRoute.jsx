import { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth, db } from "../firebase/firebase.config";
import { doc, onSnapshot, updateDoc } from "firebase/firestore";
import { toast } from "react-toastify";

export function ProtectedRoute({ children }) {
  const [user, loading, error] = useAuthState(auth);
  const [isPremium, setIsPremium] = useState(null); // null indicates loading
  const location = useLocation();

  // Define free tracker paths (corresponding to IDs 1 and 6)
  const freeTrackerPaths = ["/dashboard/prayer", "/dashboard/diet"];

  // Fetch premium status from Firestore
  useEffect(() => {
    if (user) {
      const userDocRef = doc(db, "users", user.uid);
      const unsubscribe = onSnapshot(
        userDocRef,
        (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data();
            const premium = data.isPremium || false;
            const endDate = data.premiumEndDate;
            if (premium && endDate && endDate.toDate() < new Date()) {
              updateDoc(userDocRef, {
                isPremium: false,
                premiumStartDate: null,
                premiumEndDate: null,
              }).catch((err) => console.error("Failed to update expiration:", err));
              setIsPremium(false);
            } else {
              setIsPremium(premium);
            }
          } else {
            setIsPremium(false); // Default to non-premium if no doc exists
          }
        },
        (err) => {
          console.error("Error fetching premium status:", err);
          toast.error("Failed to load user data");
          setIsPremium(false);
        }
      );
      return () => unsubscribe();
    } else {
      setIsPremium(false);
    }
  }, [user]);

  // Handle loading and error states
  if (loading || isPremium === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error) {
    toast.error("Authentication error: " + error.message);
    return <Navigate to="/signin" replace />;
  }

  if (!user) {
    toast.error("Please sign in to access this page");
    return <Navigate to="/signin" replace state={{ from: location }} />;
  }

  // Check if the current route is a premium tracker
  const isPremiumTracker =
    !freeTrackerPaths.includes(location.pathname) &&
    location.pathname.startsWith("/dashboard") &&
    ![
      "/dashboard",
      "/dashboard/profile",
      "/dashboard/create-task",
      "/dashboard/card",
      "/dashboard/mypayment",
      "/dashboard/notes",
    ].includes(location.pathname);

  // Redirect non-premium users trying to access premium trackers
  if (isPremiumTracker && !isPremium) {
    toast.error("Upgrade to Premium to access this tracker");
    return <Navigate to="/payment" replace state={{ from: location }} />;
  }

  return children;
}