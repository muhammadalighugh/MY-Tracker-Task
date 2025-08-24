import React, { useState, useEffect } from 'react';
import { Bell } from 'lucide-react';
import AdminSidebar from './AdminPages/Sidbar/AdminSidbar';
import Dashboard from './AdminPages/Dashboard/Dashboard';
import Users from './AdminPages/Users/User';
import Products from './AdminPages/Product/Product';
import Billing from './AdminPages/Billing/Billing';
import Analytics from './AdminPages/Analytics/Analytics';
import Settings from './AdminPages/Settings/Settings';
import Help from './AdminPages/Help/Help';
import CouponCodeGenerator from './AdminPages/Coopen/Coopen';
import { auth, db } from '../firebase/firebase.config';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';

const AdminPanel = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        try {
          const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
          const isAdmin = userDoc.exists() && userDoc.data().isAdmin === true;
          if (isAdmin) {
            setUser(currentUser);
            setLoading(false);
          } else {
            console.log('User is not an admin, redirecting to login');
            navigate('/login');
          }
        } catch (error) {
          console.error('Error checking admin status:', error);
          navigate('/login');
        }
      } else {
        console.log('No authenticated user, redirecting to login');
        navigate('/login');
      }
    });

    return () => unsubscribe();
  }, [navigate]);

  if (loading) {
    return <div className="text-center py-12">Loading...</div>;
  }

  if (!user) {
    return null; // User will be redirected to /login by useEffect
  }

  const sidebarItems = [
    { id: 'dashboard', label: 'Dashboard', icon: 'Home' },
    { id: 'users', label: 'Users', icon: 'Users' },
    { id: 'products', label: 'Products', icon: 'Package' },
    { id: 'billing', label: 'Billing', icon: 'CreditCard' },
    { id: 'analytics', label: 'Analytics', icon: 'BarChart3' },
    { id: 'settings', label: 'Settings', icon: 'Settings' },
    { id: 'help', label: 'Help & Support', icon: 'HelpCircle' },
    { id: 'Coopen', label: 'Coupon', icon: 'BadgePercent' },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard />;
      case 'users':
        return <Users />;
      case 'products':
        return <Products />;
      case 'billing':
        return <Billing />;
      case 'analytics':
        return <Analytics />;
      case 'settings':
        return <Settings />;
      case 'help':
        return <Help />;
      case 'Coopen':
        return <CouponCodeGenerator />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <AdminSidebar 
        sidebarOpen={sidebarOpen} 
        setSidebarOpen={setSidebarOpen} 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-white shadow-sm px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h1 className="text-xl font-semibold text-gray-900">
                {sidebarItems.find(item => item.id === activeTab)?.label || 'Dashboard'}
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <button className="p-2 text-gray-400 hover:text-gray-600 relative">
                <Bell className="h-5 w-5" />
                <span className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full"></span>
              </button>
              <button className="flex items-center space-x-2 text-gray-700 hover:text-gray-900">
                <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                  <span className="text-sm font-medium">A</span>
                </div>
                <span className="text-sm font-medium">Admin User</span>
              </button>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 p-6">
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

export default AdminPanel;