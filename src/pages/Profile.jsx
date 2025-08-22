import { useState, useEffect } from "react";
import { useSidebar } from "../context/SidebarContext";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth, db } from "../firebase/firebase.config";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { toast } from "react-toastify";
import { User, Settings, Mail, Calendar, MapPin, Globe, Award } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function Profile() {
  const { collapsed } = useSidebar();
  const [user, loading, error] = useAuthState(auth);
  const [userData, setUserData] = useState({
    name: "",
    email: "",
    avatar: "",
    isPremium: false,
    // Additional fields from Google
    displayName: "",
    photoURL: "",
    phoneNumber: "",
    providerData: [],
    metadata: {},
    emailVerified: false,
    // Extended profile fields
    location: "",
    website: "",
    bio: "",
    joinDate: "",
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
              // Google data
              displayName: user.displayName || "",
              photoURL: user.photoURL || "",
              phoneNumber: user.phoneNumber || "",
              providerData: user.providerData || [],
              metadata: user.metadata || {},
              emailVerified: user.emailVerified || false,
              // Extended profile
              location: data.location || "",
              website: data.website || "",
              bio: data.bio || "",
              joinDate: data.joinDate || new Date(user.metadata.creationTime).toLocaleDateString(),
            });
          } else {
            // Initialize user data with Google info if none exists
            const userDataToSave = {
              name: user.displayName || "User",
              email: user.email || "",
              avatar: user.photoURL || "",
              isPremium: false,
              // Google data
              displayName: user.displayName || "",
              photoURL: user.photoURL || "",
              phoneNumber: user.phoneNumber || "",
              providerData: user.providerData || [],
              metadata: user.metadata || {},
              emailVerified: user.emailVerified || false,
              // Extended profile with defaults
              location: "",
              website: "",
              bio: "",
              joinDate: new Date(user.metadata.creationTime).toLocaleDateString(),
            };
            
            await setDoc(userDocRef, userDataToSave);
            setUserData(userDataToSave);
          }
        } catch (err) {
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
        location: userData.location,
        website: userData.website,
        bio: userData.bio,
      });
      toast.success("Profile updated successfully");
      setIsEditing(false);
    } catch (err) {
      toast.error("Failed to update profile");
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    // Reset to original data
    if (user) {
      setUserData(prev => ({
        ...prev,
        name: user.displayName || "User",
        avatar: user.photoURL || "",
        // Keep other editable fields as they were
      }));
    }
  };

  const getProviderName = (providerId) => {
    const providers = {
      "google.com": "Google",
      "password": "Email",
      "facebook.com": "Facebook",
      "twitter.com": "Twitter",
      "github.com": "GitHub",
    };
    return providers[providerId] || providerId;
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
    navigate("/signin");
    return null;
  }

  return (
    <div
      className={`min-h-screen p-4 sm:p-6 bg-slate-50 transition-all duration-300 ${
        collapsed ? "lg:ml-20" : "lg:ml-64"
      }`}
    >
      <div className="max-w-4xl mx-auto">
        {/* Profile Header */}
        <div className="flex flex-col md:flex-row gap-6 items-start bg-white p-6 rounded-xl shadow-sm border border-slate-200 mb-6">
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
                <input
                  type="text"
                  name="location"
                  value={userData.location}
                  onChange={handleInputChange}
                  className="bg-transparent text-slate-900 border-b border-slate-300 focus:outline-none focus:border-indigo-500 w-full"
                  placeholder="Location"
                />
                <input
                  type="text"
                  name="website"
                  value={userData.website}
                  onChange={handleInputChange}
                  className="bg-transparent text-slate-900 border-b border-slate-300 focus:outline-none focus:border-indigo-500 w-full"
                  placeholder="Website"
                />
                <textarea
                  name="bio"
                  value={userData.bio}
                  onChange={handleInputChange}
                  className="bg-transparent text-slate-900 border border-slate-300 rounded-md focus:outline-none focus:border-indigo-500 w-full p-2"
                  placeholder="Bio"
                  rows="3"
                />
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
              <div className="space-y-3">
                <h1 className="text-3xl font-bold text-slate-900">{userData.name}</h1>
                <div className="flex items-center text-slate-600">
                  <Mail size={16} className="mr-2" />
                  <span>{userData.email}</span>
                </div>
                {userData.location && (
                  <div className="flex items-center text-slate-600">
                    <MapPin size={16} className="mr-2" />
                    <span>{userData.location}</span>
                  </div>
                )}
                {userData.website && (
                  <div className="flex items-center text-slate-600">
                    <Globe size={16} className="mr-2" />
                    <a 
                      href={userData.website} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-indigo-600 hover:underline"
                    >
                      {userData.website}
                    </a>
                  </div>
                )}
                {userData.bio && (
                  <p className="text-slate-700 mt-3">{userData.bio}</p>
                )}
                <div className="flex items-center text-slate-600">
                  <Calendar size={16} className="mr-2" />
                  <span>Joined {userData.joinDate}</span>
                </div>
                <div className="flex items-center">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    userData.isPremium 
                      ? "bg-amber-100 text-amber-800" 
                      : "bg-slate-100 text-slate-800"
                  }`}>
                    {userData.isPremium ? "Premium Member" : "Free User"}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Account Information Card */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 mb-6">
          <h2 className="text-xl font-semibold text-slate-900 mb-4 flex items-center">
            <Award size={20} className="mr-2" />
            Account Information
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-slate-500">Email Verification</h3>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                userData.emailVerified 
                  ? "bg-green-100 text-green-800" 
                  : "bg-red-100 text-red-800"
              }`}>
                {userData.emailVerified ? "Verified" : "Not Verified"}
              </span>
            </div>
            
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-slate-500">Account Created</h3>
              <p className="text-slate-900">{new Date(userData.metadata.creationTime).toLocaleDateString()}</p>
            </div>
            
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-slate-500">Last Sign In</h3>
              <p className="text-slate-900">
                {userData.metadata.lastSignInTime 
                  ? new Date(userData.metadata.lastSignInTime).toLocaleDateString()
                  : "Unknown"
                }
              </p>
            </div>
            
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-slate-500">Login Methods</h3>
              <div className="flex flex-wrap gap-2">
                {userData.providerData.map((provider, index) => (
                  <span 
                    key={index}
                    className="px-3 py-1 bg-slate-100 text-slate-800 rounded-full text-sm"
                  >
                    {getProviderName(provider.providerId)}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Provider Information (for debugging) */}
        {userData.providerData.length > 0 && (
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <h2 className="text-xl font-semibold text-slate-900 mb-4">Connected Accounts</h2>
            <div className="space-y-3">
              {userData.providerData.map((provider, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm mr-3">
                      {provider.providerId === "google.com" && (
                        <span className="text-sm font-medium text-blue-600">G</span>
                      )}
                      {provider.providerId === "password" && (
                        <Mail size={16} className="text-slate-600" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium">{getProviderName(provider.providerId)}</p>
                      <p className="text-sm text-slate-600">{provider.email || provider.uid}</p>
                    </div>
                  </div>
                  <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                    Connected
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}