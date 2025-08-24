// Billing.js (Admin Analytics Dashboard)
import React, { useState, useEffect } from 'react';
import { 
  CreditCard, 
  Users, 
  DollarSign, 
  TrendingUp, 
  BarChart3, 
  Download, 
  Filter, 
  Calendar,
  FileText,
  Percent,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { auth, db } from '../../../firebase/firebase.config';
import { useAuthState } from 'react-firebase-hooks/auth';
import { 
  collection, 
  getDocs, 
  query, 
  where, 
  Timestamp,
  orderBy,
  limit,
  doc,
  getDoc
} from 'firebase/firestore';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';

const Billing = () => {
  const [user, loading, authError] = useAuthState(auth);
  const [analytics, setAnalytics] = useState({
    totalUsers: 0,
    premiumUsers: 0,
    totalRevenue: 0,
    couponUsage: 0,
    totalSavings: 0,
    activeSubscriptions: 0,
    totalProfit: 0,
    averageRevenuePerUser: 0
  });
  const [loadingData, setLoadingData] = useState(true);
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [filterPeriod, setFilterPeriod] = useState('30d'); // 7d, 30d, 90d, all
  const navigate = useNavigate();

  useEffect(() => {
    console.log('Current user:', user); // Debug: Check user object
    if (!loading && !user) {
      toast.error('Please sign in to access admin billing');
      navigate('/signin');
      return;
    }
    if (authError) {
      toast.error('Authentication error: ' + authError.message);
      navigate('/signin');
      return;
    }
    checkAdminAccess();
  }, [user, loading, authError, navigate]);

  const checkAdminAccess = async () => {
    if (!user?.uid) {
      toast.error('User ID not found. Please sign out and sign in again.');
      navigate('/signin');
      return;
    }
    try {
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      console.log('User document exists:', userDoc.exists(), 'Data:', userDoc.data()); // Debug: Check document
      if (!userDoc.exists()) {
        toast.error('User profile not found in database.');
        navigate('/dashboard');
        return;
      }
      const userData = userDoc.data();
      if (!userData.isAdmin) {
        toast.error('Access denied. Admin privileges required.');
        navigate('/dashboard');
        return;
      }
      fetchAnalytics();
      fetchRecentTransactions();
    } catch (error) {
      console.error('Admin access check error:', error);
      toast.error('Failed to verify admin access: ' + error.message);
      navigate('/dashboard');
    }
  };

  const fetchAnalytics = async () => {
    setLoadingData(true);
    try {
      const now = new Date();
      let startDate;
      
      switch (filterPeriod) {
        case '7d':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case '30d':
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        case '90d':
          startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
          break;
        default:
          startDate = new Date(0); // All time
      }

      // Fetch all users
      const usersSnapshot = await getDocs(collection(db, 'users'));
      const allUsers = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      // Filter premium users
      const premiumUsers = allUsers.filter(u => u.isPremium && u.premiumEndDate && 
        Timestamp.fromDate(new Date(startDate)) <= u.premiumEndDate);
      
      // Fetch all coupons
      const couponsSnapshot = await getDocs(collection(db, 'coupons'));
      const allCoupons = couponsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      // Calculate coupon usage and savings
      let totalCouponUsage = 0;
      let totalSavings = 0;
      
      allCoupons.forEach(coupon => {
        if (coupon.usageHistory && coupon.usageHistory.length > 0) {
          const periodUsage = coupon.usageHistory.filter(usage => 
            new Date(usage.usedAt) >= startDate
          ).length;
          totalCouponUsage += periodUsage;
          
          if (coupon.discountType === 'free') {
            totalSavings += periodUsage * (coupon.planName ? getPlanPrice(coupon.planName) : 0);
          } else if (coupon.discountType === 'percentage') {
            totalSavings += periodUsage * (coupon.discountValue / 100) * (coupon.planName ? getPlanPrice(coupon.planName) : 0);
          } else if (coupon.discountType === 'fixed') {
            totalSavings += periodUsage * coupon.discountValue;
          }
        }
      });

      // Fetch products to get plan prices
      const productsSnapshot = await getDocs(collection(db, 'products'));
      const products = productsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      // Calculate revenue
      let totalRevenue = 0;
      let activeSubscriptions = 0;
      
      premiumUsers.forEach(user => {
        const plan = products.find(p => p.name === user.planName);
        if (plan) {
          const daysSubscribed = Math.max(0, (user.premiumEndDate.toDate() - user.premiumStartDate.toDate()) / (1000 * 60 * 60 * 24));
          const monthlyPrice = plan.price;
          const revenue = (monthlyPrice / 30) * daysSubscribed;
          totalRevenue += revenue;
          activeSubscriptions += 1;
        }
      });

      const totalProfit = totalRevenue - totalSavings;
      const avgRevenuePerUser = totalRevenue / (allUsers.length || 1);

      setAnalytics({
        totalUsers: allUsers.length,
        premiumUsers: premiumUsers.length,
        totalRevenue: parseFloat(totalRevenue.toFixed(2)),
        couponUsage: totalCouponUsage,
        totalSavings: parseFloat(totalSavings.toFixed(2)),
        activeSubscriptions: activeSubscriptions,
        totalProfit: parseFloat(totalProfit.toFixed(2)),
        averageRevenuePerUser: parseFloat(avgRevenuePerUser.toFixed(2))
      });
    } catch (error) {
      toast.error('Failed to fetch billing analytics');
      console.error('Analytics error:', error);
    } finally {
      setLoadingData(false);
    }
  };

  const getPlanPrice = (planName) => {
    const prices = {
      'Basic Plan': 9.99,
      'Premium Plan': 29.99,
      'Enterprise Plan': 99.99
    };
    return prices[planName] || 0;
  };

  const fetchRecentTransactions = async () => {
    try {
      const now = new Date();
      const startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      
      const usersSnapshot = await getDocs(
        query(
          collection(db, 'users'), 
          where('premiumStartDate', '>', Timestamp.fromDate(startDate)),
          orderBy('premiumStartDate', 'desc'),
          limit(10)
        )
      );
      
      const transactions = usersSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          type: 'Subscription Upgrade',
          userEmail: data.email || 'N/A',
          planName: data.planName || 'N/A',
          amount: getPlanPrice(data.planName),
          date: data.premiumStartDate.toDate(),
          couponUsed: data.couponUsed || false,
          status: 'Completed'
        };
      });

      const couponsSnapshot = await getDocs(collection(db, 'coupons'));
      couponsSnapshot.docs.forEach(doc => {
        const coupon = doc.data();
        if (coupon.usageHistory) {
          coupon.usageHistory.slice(-5).forEach(usage => {
            if (new Date(usage.usedAt) >= startDate) {
              transactions.push({
                id: `${doc.id}-usage-${usage.usedAt}`,
                type: 'Coupon Redemption',
                userEmail: usage.userEmail,
                planName: coupon.planName,
                amount: 0,
                savings: coupon.discountType === 'free' ? getPlanPrice(coupon.planName) : 
                        coupon.discountType === 'percentage' ? (coupon.discountValue / 100) * getPlanPrice(coupon.planName) : 
                        coupon.discountValue,
                date: new Date(usage.usedAt),
                couponUsed: true,
                status: 'Redeemed'
              });
            }
          });
        }
      });

      transactions.sort((a, b) => b.date - a.date);
      setRecentTransactions(transactions.slice(0, 10));
    } catch (error) {
      console.error('Failed to fetch recent transactions:', error);
    }
  };

  const handleFilterChange = (period) => {
    setFilterPeriod(period);
    fetchAnalytics();
  };

  const exportReport = () => {
    const csvContent = generateCSV();
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `billing-report-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success('Report exported successfully!');
  };

  const generateCSV = () => {
    const headers = ['Metric', 'Value'];
    const rows = [
      ['Total Users', analytics.totalUsers],
      ['Premium Users', analytics.premiumUsers],
      ['Total Revenue', `$${analytics.totalRevenue}`],
      ['Coupon Usage', analytics.couponUsage],
      ['Total Savings', `$${analytics.totalSavings}`],
      ['Active Subscriptions', analytics.activeSubscriptions],
      ['Total Profit', `$${analytics.totalProfit}`],
      ['Avg Revenue/User', `$${analytics.averageRevenuePerUser}`]
    ];
    return [headers, ...rows].map(row => row.join(',')).join('\n');
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!user || loadingData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">Loading billing analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {/* <div>
              <h1 className="text-3xl font-bold text-gray-900">Billing Analytics</h1>
              <p className="mt-2 text-lg text-gray-600">Comprehensive overview of system revenue, coupon usage, and subscription metrics</p>
            </div> */}
            <button
              onClick={exportReport}
              className="bg-indigo-600 text-white px-6 py-2 rounded-lg flex items-center space-x-2 hover:bg-indigo-700 transition-colors"
            >
              <Download className="h-4 w-4" />
              <span>Export Report</span>
            </button>
          </div>
        </div>

        <div className="mb-6">
          <div className="flex items-center space-x-4">
            <label className="text-sm font-medium text-gray-700">Filter by period:</label>
            {['7d', '30d', '90d', 'all'].map(period => (
              <button
                key={period}
                onClick={() => handleFilterChange(period)}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                  filterPeriod === period
                    ? 'bg-indigo-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                }`}
              >
                {period === '7d' && '7 Days'}
                {period === '30d' && '30 Days'}
                {period === '90d' && '90 Days'}
                {period === 'all' && 'All Time'}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                <p className="mt-1 text-3xl font-bold text-gray-900">{formatCurrency(analytics.totalRevenue)}</p>
              </div>
              <DollarSign className="h-8 w-8 text-green-600" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Profit</p>
                <p className="mt-1 text-3xl font-bold text-gray-900">{formatCurrency(analytics.totalProfit)}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Coupon Usage</p>
                <p className="mt-1 text-3xl font-bold text-gray-900">{analytics.couponUsage}</p>
              </div>
              <Percent className="h-8 w-8 text-orange-600" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Premium Users</p>
                <p className="mt-1 text-3xl font-bold text-gray-900">{analytics.premiumUsers}</p>
              </div>
              <Users className="h-8 w-8 text-indigo-600" />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Savings (Coupons)</p>
                <p className="mt-1 text-2xl font-bold text-orange-600">{formatCurrency(analytics.totalSavings)}</p>
              </div>
              <AlertCircle className="h-6 w-6 text-orange-600" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Subscriptions</p>
                <p className="mt-1 text-2xl font-bold text-gray-900">{analytics.activeSubscriptions}</p>
              </div>
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg Revenue/User</p>
                <p className="mt-1 text-2xl font-bold text-gray-900">{formatCurrency(analytics.averageRevenuePerUser)}</p>
              </div>
              <BarChart3 className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border mb-8">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center">
              <FileText className="h-5 w-5 mr-2" />
              Recent Transactions
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Plan</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {recentTransactions.map((transaction) => (
                  <tr key={transaction.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{transaction.type}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{transaction.userEmail}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{transaction.planName}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {transaction.savings ? <span className="text-orange-600">-{formatCurrency(transaction.savings)}</span> : formatCurrency(transaction.amount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(transaction.date)}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        transaction.status === 'Completed' || transaction.status === 'Redeemed'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>{transaction.status}</span>
                    </td>
                  </tr>
                ))}
                {recentTransactions.length === 0 && (
                  <tr>
                    <td colSpan="6" className="px-6 py-4 text-center text-gray-500">No recent transactions</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue Breakdown</h3>
            <div className="space-y-3">
              <div className="flex justify-between text-sm"><span className="text-gray-600">Direct Revenue</span><span className="font-medium">{formatCurrency(analytics.totalRevenue)}</span></div>
              <div className="flex justify-between text-sm"><span className="text-gray-600">Coupon Discounts</span><span className="text-orange-600 font-medium">-{formatCurrency(analytics.totalSavings)}</span></div>
              <div className="flex justify-between text-sm border-t pt-2 font-semibold"><span className="text-gray-900">Net Profit</span><span className="text-green-600">{formatCurrency(analytics.totalProfit)}</span></div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">User Analytics</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between"><span className="text-gray-600">Total Users</span><span className="font-medium">{analytics.totalUsers}</span></div>
              <div className="flex justify-between"><span className="text-gray-600">Premium Users</span><span className="font-medium text-indigo-600">{analytics.premiumUsers}</span></div>
              <div className="flex justify-between"><span className="text-gray-600">Conversion Rate</span><span className="font-medium">{((analytics.premiumUsers / analytics.totalUsers) * 100).toFixed(1)}%</span></div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Coupon Analytics</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between"><span className="text-gray-600">Coupons Used</span><span className="font-medium">{analytics.couponUsage}</span></div>
              <div className="flex justify-between"><span className="text-gray-600">Total Savings</span><span className="font-medium text-orange-600">{formatCurrency(analytics.totalSavings)}</span></div>
              <div className="flex justify-between"><span className="text-gray-600">Savings % of Revenue</span><span className="font-medium">{((analytics.totalSavings / (analytics.totalRevenue || 1)) * 100).toFixed(1)}%</span></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Billing;