import { useState, useEffect } from "react";
import { useSidebar } from "../context/SidebarContext";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth, db } from "../firebase/firebase.config";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { toast } from "react-toastify";
import { User, Settings } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function Profile() {
  const { collapsed } = useSidebar();
  const [user, loading, error] = useAuthState(auth);
  const [userData, setUserData] = useState({
    name: "",
    email: "",
    avatar: "",
    isPremium: false,
  });
  const [isEditing, setIsEditing] = useState(false);
  const navigate = useNavigate();

  // Fetch user data from Firestore
  useEffect(() => {
    if (user) {
      const userDocRef = doc(db, "users", user.uid);
      const fetchUserData = async () => {
        try {
          const docSnap = await getDoc(userDocRef);
          if (docSnap.exists()) {
            const data = docSnap.data();
            setUserData({
              name: data.name || user.displayName || "User",
              email: user.email || "",
              avatar: data.avatar || user.photoURL || "",
              isPremium: data.isPremium || false,
            });
          } else {
            // Initialize default user data if none exists
            await updateDoc(userDocRef, {
              name: user.displayName || "User",
              email: user.email || "",
              avatar: user.photoURL || "",
              isPremium: false,
            });
            setUserData({
              name: user.displayName || "User",
              email: user.email || "",
              avatar: user.photoURL || "",
              isPremium: false,
            });
          }
        } catch (err) {
          console.error("Error fetching user data:", err);
          toast.error("Failed to load profile data");
        }
      };
      fetchUserData();
    } else if (!loading) {
      toast.error("Please sign in to view your profile");
      navigate("/signin");
    }
  }, [user, loading, navigate]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setUserData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    if (!user) return;
    const userDocRef = doc(db, "users", user.uid);
    try {
      await updateDoc(userDocRef, {
        name: userData.name,
        avatar: userData.avatar,
      });
      toast.success("Profile updated successfully");
      setIsEditing(false);
    } catch (err) {
      console.error("Error updating profile:", err);
      toast.error("Failed to update profile");
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    // Reset to original data
    setUserData({
      name: user?.displayName || "User",
      email: user?.email || "",
      avatar: user?.photoURL || "",
      isPremium: userData.isPremium,
    });
  };

  if (loading) {
    return (
      <div
        className={`min-h-screen flex items-center justify-center bg-slate-50 transition-all duration-300 ${
          collapsed ? "lg:ml-20" : "lg:ml-64"
        }`}
      >
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error) {
    toast.error("Authentication error: " + error.message);
    navigate("/signin");
    return null;
  }

  return (
    <div
      className={`min-h-screen p-4 sm:p-6 bg-slate-50 transition-all duration-300 ${
        collapsed ? "lg:ml-20" : "lg:ml-64"
      }`}
    >
      {/* Profile Header */}
      <div className="flex flex-col md:flex-row gap-6 items-start bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        {/* Avatar */}
        <div className="w-full md:w-auto flex flex-col items-center">
          <div className="relative group">
            <div className="w-32 h-32 rounded-full bg-slate-100 border-2 border-slate-200 flex items-center justify-center overflow-hidden">
              {userData.avatar ? (
                <img
                  src={userData.avatar}
                  alt={userData.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <User size={64} className="text-slate-400" />
              )}
            </div>
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="absolute bottom-0 right-0 bg-indigo-600 text-white p-2 rounded-full hover:bg-indigo-500 transition-colors shadow-md"
            >
              <Settings size={18} />
            </button>
          </div>
        </div>

        {/* User Info */}
        <div className="flex-1">
          {isEditing ? (
            <div className="space-y-4">
              <input
                type="text"
                name="name"
                value={userData.name}
                onChange={handleInputChange}
                className="text-2xl font-bold bg-transparent text-slate-900 border-b border-slate-300 focus:outline-none focus:border-indigo-500 w-full"
                placeholder="Enter your name"
              />
              <div className="flex items-center text-slate-600">
                <input
                  type="text"
                  name="avatar"
                  value={userData.avatar}
                  onChange={handleInputChange}
                  className="bg-transparent text-slate-900 border-b border-slate-300 focus:outline-none focus:border-indigo-500 w-full"
                  placeholder="Avatar URL"
                />
              </div>
              <div className="flex items-center text-slate-600">
                <span className="text-sm font-medium">
                  {userData.isPremium ? "Premium Member" : "Free User"}
                </span>
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={handleCancel}
                  className="px-4 py-2 bg-slate-200 text-slate-800 rounded-md hover:bg-slate-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-500 transition-colors"
                >
                  Save Changes
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <h1 className="text-3xl font-bold text-slate-900">{userData.name}</h1>
              <div className="flex items-center text-slate-600">
                <span>{userData.email}</span>
              </div>
              <div className="flex items-center text-slate-600">
                <span className="text-sm font-medium">
                  {userData.isPremium ? "Premium Member" : "Free User"}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}