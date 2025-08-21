import React, { useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import { doc, onSnapshot, updateDoc } from "firebase/firestore";
import { db } from "../../firebase/firebase.config";
import { toast } from "react-toastify";
import { CircleDollarSign, ArrowLeft } from "lucide-react";

export default function Payment() {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [isPremium, setIsPremium] = useState(false);
  const [premiumEndDate, setPremiumEndDate] = useState(null);
  const [displayName, setDisplayName] = useState("User");
  const [hasUsedCoupon, setHasUsedCoupon] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log("Payment component mounted, user:", user ? user.uid : "No user");
    if (user) {
      const userDocRef = doc(db, "users", user.uid);
      const unsubscribe = onSnapshot(
        userDocRef,
        (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data();
            const premium = data.isPremium || false;
            const end = data.premiumEndDate;
            if (premium && end && end.toDate() < new Date()) {
              updateDoc(userDocRef, {
                isPremium: false,
                premiumStartDate: null,
                premiumEndDate: null,
              }).catch((err) => console.error("Failed to update expiration:", err));
              setIsPremium(false);
              setPremiumEndDate(null);
              setHasUsedCoupon(data.hasUsedCoupon || false);
              setDisplayName(data.displayName || user.displayName || "User");
            } else {
              setIsPremium(premium);
              setPremiumEndDate(end ? end.toDate() : null);
              setHasUsedCoupon(data.hasUsedCoupon || false);
              setDisplayName(data.displayName || user.displayName || "User");
            }
            console.log("User data fetched:", {
              isPremium: data.isPremium,
              displayName: data.displayName,
              premiumEndDate: end ? end.toDate() : null,
              hasUsedCoupon: data.hasUsedCoupon,
            });
          } else {
            setIsPremium(false);
            setPremiumEndDate(null);
            setHasUsedCoupon(false);
            setDisplayName(user.displayName || "User");
            console.log("No user document found, setting defaults");
          }
          setLoading(false);
        },
        (error) => {
          console.error("Error fetching user data:", error);
          toast.error("Failed to load user data");
          setLoading(false);
        }
      );
      return () => {
        console.log("Unsubscribing from Firestore listener");
        unsubscribe();
      };
    } else {
      setLoading(false);
      console.log("No user logged in, redirecting to signin");
      toast.warn("Please sign in to view your subscription details.");
      navigate("/signin");
    }
  }, [user, navigate]);

  const handleUpgrade = () => {
    console.log("Upgrade button clicked for user:", user?.uid);
    toast.info("Redirecting to payment processing...");
    navigate("/payment");
  };

  return (
    <div className="min-h-screen bg-slate-100 p-6">
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-md p-6">
        {/* Back Button */}
        <button
          onClick={() => {
            console.log("Navigating back to dashboard");
            navigate("/dashboard");
          }}
          className="flex items-center text-sm text-slate-600 hover:text-slate-800 mb-4"
        >
          <ArrowLeft size={16} className="mr-2" />
          Back to Dashboard
        </button>

        <h1 className="text-2xl font-bold text-slate-800 mb-6">Payment & Subscription</h1>

        {loading ? (
          <p className="text-sm text-slate-500">Loading user data...</p>
        ) : user ? (
          <div className="space-y-6">
            {/* User Info */}
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 rounded-full flex items-center justify-center bg-indigo-500 text-white font-bold text-xl">
                {displayName.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="text-base font-semibold text-slate-800">{displayName}</p>
                <p className={`text-sm font-medium ${isPremium ? "text-emerald-500" : "text-slate-500"}`}>
                  {isPremium
                    ? `Premium Member${premiumEndDate ? ` (expires ${premiumEndDate.toLocaleDateString()})` : ""}`
                    : "Free Member"}
                </p>
                {isPremium && hasUsedCoupon && (
                  <p className="text-xs text-slate-500 mt-1">
                    Your 15-day premium trial is active.
                  </p>
                )}
              </div>
            </div>

            {/* Current Plan */}
            <div className="border-t border-slate-200 pt-4">
              <h2 className="text-lg font-semibold text-slate-700">Your Subscription</h2>
              {isPremium ? (
                <div className="mt-2">
                  <p className="text-sm text-slate-600">
                    You are enjoying the{" "}
                    <span className="font-medium text-emerald-500">Premium Plan</span>
                    {premiumEndDate ? ` until ${premiumEndDate.toLocaleDateString()}` : ""}.
                  </p>
                  <p className="text-sm text-slate-600 mt-1">
                    Thank you for being a premium member! Enjoy full access to all features.
                  </p>
                  {hasUsedCoupon && (
                    <p className="text-sm text-yellow-600 mt-2">
                      Your premium access was activated using the coupon (15-day trial). After expiration, you will revert to the Free Plan unless you subscribe.
                    </p>
                  )}
                </div>
              ) : (
                <div className="mt-2">
                  <p className="text-sm text-slate-600">
                    You are currently on the{" "}
                    <span className="font-medium text-slate-500">Free Plan</span>.
                  </p>
                  <p className="text-sm text-slate-500 mt-2">
  The Free Plan includes limited access to trackers. Upgrade to Premium for full access, advanced analytics, and priority support. Contact us at <a href="mailto:info@amigsol.om" className="text-blue-500">info@amigsol.om</a>.
</p>

                  {hasUsedCoupon && (
                    <p className="text-sm text-yellow-600 mt-2">
                      You have already used the AMIPRO coupon. Your 15-day trial has expired.
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Upgrade Button for Free Members */}
            {!isPremium && (
              <button
                onClick={handleUpgrade}
                className="w-full flex items-center justify-center py-2.5 px-4 bg-indigo-500 hover:bg-indigo-600 rounded-lg text-white text-base font-semibold transition-colors duration-200 shadow-md hover:shadow-lg"
              >
                <CircleDollarSign size={18} className="mr-2" />
                Upgrade to Premium
              </button>
            )}

            {/* Premium Benefits */}
            <div className="mt-4">
              <h3 className="text-base font-semibold text-slate-700">Why Go Premium?</h3>
              <ul className="mt-3 space-y-2 text-sm text-slate-600">
                <li className="flex items-center">
                  <span className="text-emerald-500 mr-2">✔</span> Full access to all trackers
                </li>
                <li className="flex items-center">
                  <span className="text-emerald-500 mr-2">✔</span> Advanced analytics and insights
                </li>
                <li className="flex items-center">
                  <span className="text-emerald-500 mr-2">✔</span> Priority customer support
                </li>
                <li className="flex items-center">
                  <span className="text-emerald-500 mr-2">✔</span> Exclusive features and updates
                </li>
              </ul>
            </div>
          </div>
        ) : (
          <div className="text-center">
            <p className="text-sm text-slate-600">Please sign in to view your subscription details.</p>
            <button
              onClick={() => navigate("/signin")}
              className="mt-4 inline-flex items-center justify-center py-2 px-4 bg-indigo-500 hover:bg-indigo-600 rounded-lg text-white text-sm font-medium transition-colors duration-200"
            >
              Sign In
            </button>
          </div>
        )}
      </div>
    </div>
  );
}