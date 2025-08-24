// CouponCodeGenerator.js
import React, { useState, useEffect } from 'react';
import { Copy, Percent, DollarSign, Calendar, Users, Hash, Target, Clock, Gift, Zap, Plus, Activity, History, Eye, Trash2, Archive, AlertCircle, CheckCircle, XCircle, Tag } from 'lucide-react';
import { db } from '../../../firebase/firebase.config';
import { collection, addDoc, getDocs, query, where, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { toast } from 'react-toastify';

const purposeOptions = [
  { value: 'premium_trial', label: 'Premium Trial Access', icon: Zap },
  { value: 'upgrade_discount', label: 'Upgrade Discount', icon: DollarSign },
  { value: 'retention_offer', label: 'User Retention Offer', icon: Users },
  { value: 'referral_bonus', label: 'Referral Bonus', icon: Gift },
  { value: 'seasonal_promo', label: 'Seasonal Promotion', icon: Target },
  { value: 'welcome_bonus', label: 'Welcome Bonus', icon: Calendar }
];

const durationOptions = [
  { value: '3_days', label: '3 Days', multiplier: 3 },
  { value: '1_week', label: '1 Week', multiplier: 7 },
  { value: '2_weeks', label: '2 Weeks', multiplier: 14 },
  { value: '1_month', label: '1 Month', multiplier: 30 },
  { value: '2_months', label: '2 Months', multiplier: 60 },
  { value: '3_months', label: '3 Months', multiplier: 90 },
  { value: '6_months', label: '6 Months', multiplier: 180 },
  { value: '1_year', label: '1 Year', multiplier: 365 }
];

const CouponCodeGenerator = () => {
  const [activeTab, setActiveTab] = useState('create');
  const [couponData, setCouponData] = useState({
    code: '',
    purpose: 'premium_trial',
    discountType: 'free',
    discountValue: 100,
    premiumDuration: '1_week',
    premiumDurationType: 'trial',
    maxUses: 100,
    expirationDate: '',
    minPurchase: 0,
    description: '',
    planName: '', // Will be selected from products
  });
  const [activeCoupons, setActiveCoupons] = useState([]);
  const [historyData, setHistoryData] = useState([]);
  const [products, setProducts] = useState([]);
  const [copiedIndex, setCopiedIndex] = useState(-1);
  const [selectedCoupon, setSelectedCoupon] = useState(null);

  useEffect(() => {
    fetchProducts();
    fetchActiveCoupons();
    fetchHistoryCoupons();
  }, []);

  const fetchProducts = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'products'));
      setProducts(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (error) {
      toast.error('Failed to fetch products');
    }
  };

  const fetchActiveCoupons = async () => {
    try {
      const now = new Date();
      const q = query(collection(db, 'coupons'), where('status', '==', 'active'));
      const querySnapshot = await getDocs(q);
      let coupons = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const toArchive = coupons.filter(c => c.expirationDate && new Date(c.expirationDate) < now);
      for (const c of toArchive) {
        await archiveCoupon(c.id, 'Expired automatically');
      }
      coupons = coupons.filter(c => !(c.expirationDate && new Date(c.expirationDate) < now));
      setActiveCoupons(coupons);
    } catch (error) {
      toast.error('Failed to fetch active coupons');
    }
  };

  const fetchHistoryCoupons = async () => {
    try {
      const q = query(collection(db, 'coupons'), where('status', '!=', 'active'));
      const querySnapshot = await getDocs(q);
      setHistoryData(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (error) {
      toast.error('Failed to fetch history coupons');
    }
  };

  const generateRandomCode = () => {
    const prefix = couponData.purpose === 'premium_trial' ? 'TRIAL' : 
                   couponData.purpose === 'welcome_bonus' ? 'WELCOME' :
                   couponData.purpose === 'referral_bonus' ? 'REF' : 'PROMO';
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let suffix = '';
    for (let i = 0; i < 4; i++) {
      suffix += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    const code = `${prefix}${suffix}`;
    setCouponData({...couponData, code});
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    let updatedData = {...couponData, [name]: value};
    
    if (name === 'purpose' || name === 'discountType' || name === 'premiumDuration') {
      updatedData.description = generateDescription(updatedData);
    }
    
    setCouponData(updatedData);
  };

  const generateDescription = (data) => {
    const purpose = purposeOptions.find(p => p.value === data.purpose);
    const duration = durationOptions.find(d => d.value === data.premiumDuration);
    
    if (data.discountType === 'free') {
      return `Get ${duration?.label || '1 Week'} of Premium Access completely FREE! Unlock all tracking features and advanced analytics.`;
    } else if (data.discountType === 'percentage') {
      return `${purpose?.label || 'Special Offer'}: Get ${data.discountValue}% off ${duration?.label || '1 Week'} Premium Access!`;
    } else {
      return `${purpose?.label || 'Special Offer'}: Save $${data.discountValue} on ${duration?.label || '1 Week'} Premium Access!`;
    }
  };

  const handleSubmit = async () => {
    if (!couponData.code.trim() || !couponData.planName) {
      alert('Please enter a coupon code, generate one, and select a plan');
      return;
    }
    
    try {
      const newCoupon = {
        ...couponData,
        createdAt: new Date().toISOString(),
        description: couponData.description || generateDescription(couponData),
        usedCount: 0,
        status: 'active',
        usageHistory: [],
      };
      await addDoc(collection(db, 'coupons'), newCoupon);
      toast.success('Coupon created successfully');
      fetchActiveCoupons();
      setCouponData({
        code: '',
        purpose: 'premium_trial',
        discountType: 'free',
        discountValue: 100,
        premiumDuration: '1_week',
        premiumDurationType: 'trial',
        maxUses: 100,
        expirationDate: '',
        minPurchase: 0,
        description: '',
        planName: '',
      });
      setActiveTab('active');
    } catch (error) {
      toast.error('Failed to create coupon');
    }
  };

  const simulateUsage = async (couponId) => {
    try {
      const couponRef = doc(db, 'coupons', couponId);
      const couponSnap = await getDoc(couponRef);
      if (!couponSnap.exists()) return;
      const coupon = couponSnap.data();
      if (coupon.usedCount >= coupon.maxUses) return;

      const newUsedCount = coupon.usedCount + 1;
      const newUsage = {
        usedAt: new Date().toISOString(),
        userId: `user_${Math.random().toString(36).substr(2, 9)}`,
        userEmail: `user${Math.floor(Math.random() * 1000)}@example.com`,
      };

      await updateDoc(couponRef, {
        usedCount: newUsedCount,
        usageHistory: [...coupon.usageHistory, newUsage],
      });

      if (newUsedCount >= coupon.maxUses) {
        await archiveCoupon(couponId, 'Maximum uses reached');
      }

      fetchActiveCoupons();
      fetchHistoryCoupons();
    } catch (error) {
      toast.error('Failed to simulate usage');
    }
  };

  const archiveCoupon = async (couponId, reason = 'Manually archived') => {
    try {
      const couponRef = doc(db, 'coupons', couponId);
      await updateDoc(couponRef, {
        status: 'archived',
        archivedAt: new Date().toISOString(),
        archivedReason: reason,
      });
      fetchActiveCoupons();
      fetchHistoryCoupons();
    } catch (error) {
      toast.error('Failed to archive coupon');
    }
  };

  const copyToClipboard = (text, index) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(-1), 2000);
  };

  const formatDiscount = (coupon) => {
    if (coupon.discountType === 'free') {
      return 'FREE ACCESS';
    }
    return coupon.discountType === 'percentage' 
      ? `${coupon.discountValue}% OFF` 
      : `$${coupon.discountValue} OFF`;
  };

  const getPurposeIcon = (purpose) => {
    const option = purposeOptions.find(p => p.value === purpose);
    return option ? option.icon : Target;
  };

  const getPurposeLabel = (purpose) => {
    const option = purposeOptions.find(p => p.value === purpose);
    return option ? option.label : 'Special Offer';
  };

  const getDurationLabel = (duration) => {
    const option = durationOptions.find(d => d.value === duration);
    return option ? option.label : '1 Week';
  };

  const getStatusColor = (coupon) => {
    if (coupon.expirationDate && new Date(coupon.expirationDate) < new Date()) {
      return 'text-red-600 bg-red-50';
    }
    if (coupon.usedCount >= coupon.maxUses) {
      return 'text-orange-600 bg-orange-50';
    }
    return 'text-green-600 bg-green-50';
  };

  const getStatusText = (coupon) => {
    if (coupon.expirationDate && new Date(coupon.expirationDate) < new Date()) {
      return 'Expired';
    }
    if (coupon.usedCount >= coupon.maxUses) {
      return 'Limit Reached';
    }
    return 'Active';
  };

  const getUsagePercentage = (coupon) => {
    return (coupon.usedCount / coupon.maxUses) * 100;
  };

  const renderNavigation = () => (
    <div className="bg-white border-b border-gray-200 mb-2">
      <div className="flex space-x-4">
        <button
          onClick={() => setActiveTab('create')}
          className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
            activeTab === 'create'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          <Plus className="h-4 w-4 inline mr-2" />
          Create Coupon
        </button>
        <button
          onClick={() => setActiveTab('active')}
          className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
            activeTab === 'active'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          <Activity className="h-4 w-4 inline mr-2" />
          Active Coupons
          {activeCoupons.length > 0 && (
            <span className="ml-2 bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
              {activeCoupons.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
            activeTab === 'history'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          <History className="h-4 w-4 inline mr-2" />
          History
          {historyData.length > 0 && (
            <span className="ml-2 bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded-full">
              {historyData.length}
            </span>
          )}
        </button>
      </div>
    </div>
  );

  const renderCreateCoupon = () => (
    <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6">
      <div className="space-y-4 sm:space-y-6 mb-6 sm:mb-8">
        {/* Purpose and Code Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Coupon Purpose */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Target className="inline h-4 w-4 mr-1" />
              Coupon Purpose
            </label>
            <select
              name="purpose"
              value={couponData.purpose}
              onChange={handleInputChange}
              className="w-full px-3 py-2 bg-white rounded-lg border-2 border-gray-200 focus:border-blue-500 focus:ring-0 transition-colors"
              required
            >
              {purposeOptions.map(option => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>

          {/* Coupon Code */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Hash className="inline h-4 w-4 mr-1" />
              Coupon Code
            </label>
            <div className="flex space-x-2">
              <input
                type="text"
                name="code"
                value={couponData.code}
                onChange={handleInputChange}
                placeholder="Enter code or generate"
                className="flex-1 px-3 py-2 bg-white rounded-lg border-2 border-gray-200 focus:border-blue-500 focus:ring-0 transition-colors"
                required
              />
              <button
                type="button"
                onClick={generateRandomCode}
                className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                title="Generate Random Code"
              >
                <Hash className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Plan Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Associated Plan
          </label>
          <select
            name="planName"
            value={couponData.planName}
            onChange={handleInputChange}
            className="w-full px-3 py-2 bg-white rounded-lg border-2 border-gray-200 focus:border-blue-500 focus:ring-0 transition-colors"
            required
          >
            <option value="">Select a plan</option>
            {products.map(product => (
              <option key={product.id} value={product.name}>{product.name}</option>
            ))}
          </select>
        </div>

        {/* Discount Type and Premium Duration */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Discount Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Offer Type
            </label>
            <div className="space-y-2">
              <label className="flex items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors">
                <input
                  type="radio"
                  name="discountType"
                  value="free"
                  checked={couponData.discountType === 'free'}
                  onChange={handleInputChange}
                  className="mr-3 text-blue-600"
                />
                <Gift className="h-4 w-4 mr-2 text-green-600" />
                <span className="font-medium text-green-700">Completely Free</span>
              </label>
              <label className="flex items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors">
                <input
                  type="radio"
                  name="discountType"
                  value="percentage"
                  checked={couponData.discountType === 'percentage'}
                  onChange={handleInputChange}
                  className="mr-3 text-blue-600"
                />
                <Percent className="h-4 w-4 mr-2 text-blue-600" />
                <span>Percentage Discount</span>
              </label>
              <label className="flex items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors">
                <input
                  type="radio"
                  name="discountType"
                  value="fixed"
                  checked={couponData.discountType === 'fixed'}
                  onChange={handleInputChange}
                  className="mr-3 text-blue-600"
                />
                <DollarSign className="h-4 w-4 mr-2 text-purple-600" />
                <span>Fixed Amount Discount</span>
              </label>
            </div>
          </div>

          {/* Premium Duration */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Clock className="inline h-4 w-4 mr-1" />
              Premium Access Duration
            </label>
            <select
              name="premiumDuration"
              value={couponData.premiumDuration}
              onChange={handleInputChange}
              className="w-full px-3 py-2 bg-white rounded-lg border-2 border-gray-200 focus:border-blue-500 focus:ring-0 transition-colors"
              required
            >
              {durationOptions.map(option => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Discount Value, Max Uses, Min Purchase */}
        {couponData.discountType !== 'free' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Discount Value */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {couponData.discountType === 'percentage' ? 'Discount %' : 'Discount $'}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  {couponData.discountType === 'percentage' ? (
                    <Percent className="h-4 w-4 text-gray-400" />
                  ) : (
                    <DollarSign className="h-4 w-4 text-gray-400" />
                  )}
                </div>
                <input
                  type="number"
                  name="discountValue"
                  value={couponData.discountValue}
                  onChange={handleInputChange}
                  min="1"
                  max={couponData.discountType === 'percentage' ? '100' : ''}
                  className="pl-10 w-full px-3 py-2 bg-white rounded-lg border-2 border-gray-200 focus:border-blue-500 focus:ring-0 transition-colors"
                  required
                />
              </div>
            </div>

            {/* Maximum Uses */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Max Uses
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Users className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  type="number"
                  name="maxUses"
                  value={couponData.maxUses}
                  onChange={handleInputChange}
                  min="1"
                  className="pl-10 w-full px-3 py-2 bg-white rounded-lg border-2 border-gray-200 focus:border-blue-500 focus:ring-0 transition-colors"
                  required
                />
              </div>
            </div>

            {/* Minimum Purchase */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Min Purchase $
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <DollarSign className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  type="number"
                  name="minPurchase"
                  value={couponData.minPurchase}
                  onChange={handleInputChange}
                  min="0"
                  step="0.01"
                  className="pl-10 w-full px-3 py-2 bg-white rounded-lg border-2 border-gray-200 focus:border-blue-500 focus:ring-0 transition-colors"
                />
              </div>
            </div>
          </div>
        )}

        {/* For free offers, show max uses and expiration */}
        {couponData.discountType === 'free' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Maximum Uses */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Maximum Uses
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Users className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  type="number"
                  name="maxUses"
                  value={couponData.maxUses}
                  onChange={handleInputChange}
                  min="1"
                  className="pl-10 w-full px-3 py-2 bg-white rounded-lg border-2 border-gray-200 focus:border-blue-500 focus:ring-0 transition-colors"
                  required
                />
              </div>
            </div>

            {/* Expiration Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar className="inline h-4 w-4 mr-1" />
                Expiration Date
              </label>
              <input
                type="date"
                name="expirationDate"
                value={couponData.expirationDate}
                onChange={handleInputChange}
                className="w-full px-3 py-2 bg-white rounded-lg border-2 border-gray-200 focus:border-blue-500 focus:ring-0 transition-colors"
              />
            </div>
          </div>
        )}

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Coupon Description
          </label>
          <textarea
            name="description"
            value={couponData.description || generateDescription(couponData)}
            onChange={handleInputChange}
            rows="3"
            placeholder="Auto-generated description based on your selections..."
            className="w-full px-3 py-2 bg-white rounded-lg border-2 border-gray-200 focus:border-blue-500 focus:ring-0 transition-colors resize-none"
          />
        </div>

        <button
          type="button"
          onClick={handleSubmit}
          className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-4 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 font-medium"
        >
          Generate Premium Coupon
        </button>
      </div>
    </div>
  );

  const renderActiveCoupons = () => (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
          <Activity className="h-5 w-5 mr-2" />
          Active Coupons ({activeCoupons.length})
        </h3>
      </div>
      
      {activeCoupons.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <Activity className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-lg">No active coupons</p>
          <p className="text-sm text-gray-400 mt-1">Create your first coupon to get started</p>
          <button
            onClick={() => setActiveTab('create')}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Create Coupon
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {activeCoupons.map((coupon, index) => {
            const PurposeIcon = getPurposeIcon(coupon.purpose);
            const usagePercentage = getUsagePercentage(coupon);
            
            return (
              <div key={coupon.id} className="bg-white rounded-lg shadow-sm border-2 border-gray-100 overflow-hidden">
                <div className="bg-gradient-to-r from-gray-50 to-blue-50 p-4">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <PurposeIcon className="h-4 w-4 text-blue-600" />
                        <span className="font-medium text-gray-900 text-sm">{getPurposeLabel(coupon.purpose)}</span>
                        <span className={`px-2 py-1 text-xs rounded-full font-medium ${getStatusColor(coupon)}`}>
                          {getStatusText(coupon)}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 mb-3">
                        <span className="font-mono text-lg font-bold bg-yellow-100 px-3 py-1 rounded-lg shadow-sm">
                          {coupon.code}
                        </span>
                        <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                          coupon.discountType === 'free' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {formatDiscount(coupon)}
                        </span>
                        <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full">
                          {getDurationLabel(coupon.premiumDuration)}
                        </span>
                        <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded-full">
                          {coupon.planName}
                        </span>
                      </div>
                      
                      {/* Usage Progress Bar */}
                      <div className="mb-3">
                        <div className="flex justify-between text-xs text-gray-600 mb-1">
                          <span>Usage: {coupon.usedCount} / {coupon.maxUses}</span>
                          <span>{Math.round(usagePercentage)}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full transition-all duration-300 ${
                              usagePercentage >= 100 ? 'bg-red-500' :
                              usagePercentage >= 80 ? 'bg-yellow-500' :
                              'bg-green-500'
                            }`}
                            style={{ width: `${Math.min(usagePercentage, 100)}%` }}
                          ></div>
                        </div>
                      </div>
                      
                      {coupon.description && (
                        <p className="text-sm text-gray-600">{coupon.description}</p>
                      )}
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => copyToClipboard(coupon.code, index)}
                        className="flex items-center space-x-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm whitespace-nowrap"
                      >
                        <Copy className="h-4 w-4" />
                        <span>{copiedIndex === index ? 'Copied!' : 'Copy'}</span>
                      </button>
                      <button
                        onClick={() => setSelectedCoupon(coupon)}
                        className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm"
                        title="View Details"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => archiveCoupon(coupon.id)}
                        className="px-3 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors text-sm"
                        title="Archive Coupon"
                      >
                        <Archive className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
                
                <div className="p-4 bg-white">
                  <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 text-xs mb-3">
                    <div>
                      <span className="text-gray-500 block mb-1">Used</span>
                      <span className="font-medium">{coupon.usedCount}</span>
                    </div>
                    <div>
                      <span className="text-gray-500 block mb-1">Max Uses</span>
                      <span className="font-medium">{coupon.maxUses}</span>
                    </div>
                    <div>
                      <span className="text-gray-500 block mb-1">Min Purchase</span>
                      <span className="font-medium">{coupon.minPurchase > 0 ? `$${coupon.minPurchase}` : 'None'}</span>
                    </div>
                    <div>
                      <span className="text-gray-500 block mb-1">Expires</span>
                      <span className="font-medium">{coupon.expirationDate ? new Date(coupon.expirationDate).toLocaleDateString() : 'Never'}</span>
                    </div>
                    <div>
                      <span className="text-gray-500 block mb-1">Created</span>
                      <span className="font-medium">{new Date(coupon.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="flex space-x-2">
                    <button
                      onClick={() => simulateUsage(coupon.id)}
                      disabled={coupon.usedCount >= coupon.maxUses}
                      className={`flex-1 px-3 py-2 text-sm rounded-lg transition-colors ${
                        coupon.usedCount >= coupon.maxUses
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          : 'bg-green-100 text-green-700 hover:bg-green-200'
                      }`}
                    >
                      <Users className="h-4 w-4 inline mr-1" />
                      Simulate Usage
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  const renderHistory = () => (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
          <History className="h-5 w-5 mr-2" />
          Coupon History ({historyData.length})
        </h3>
      </div>
      
      {historyData.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <History className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-lg">No archived coupons</p>
          <p className="text-sm text-gray-400 mt-1">Expired or used coupons will appear here</p>
        </div>
      ) : (
        <div className="space-y-4">
          {historyData.map((coupon, index) => {
            const PurposeIcon = getPurposeIcon(coupon.purpose);
            const getArchiveStatusColor = (status) => {
              switch(status) {
                case 'expired': return 'bg-red-100 text-red-800';
                case 'max_uses_reached': return 'bg-orange-100 text-orange-800';
                case 'archived': return 'bg-gray-100 text-gray-800';
                default: return 'bg-gray-100 text-gray-800';
              }
            };
            
            const getArchiveStatusIcon = (status) => {
              switch(status) {
                case 'expired': return XCircle;
                case 'max_uses_reached': return CheckCircle;
                case 'archived': return Archive;
                default: return AlertCircle;
              }
            };
            
            const StatusIcon = getArchiveStatusIcon(coupon.status);
            
            return (
              <div key={coupon.id} className="bg-gray-50 rounded-lg border border-gray-200 overflow-hidden">
                <div className="p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <PurposeIcon className="h-4 w-4 text-gray-600" />
                        <span className="font-medium text-gray-800 text-sm">{getPurposeLabel(coupon.purpose)}</span>
                        <span className={`px-2 py-1 text-xs rounded-full font-medium flex items-center ${getArchiveStatusColor(coupon.status)}`}>
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {coupon.status === 'expired' ? 'Expired' :
                           coupon.status === 'max_uses_reached' ? 'Limit Reached' :
                           'Archived'}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <span className="font-mono text-lg font-bold bg-gray-200 px-3 py-1 rounded-lg">
                          {coupon.code}
                        </span>
                        <span className="px-2 py-1 text-xs rounded-full font-medium bg-gray-200 text-gray-700">
                          {formatDiscount(coupon)}
                        </span>
                        <span className="px-2 py-1 bg-gray-200 text-gray-700 text-xs rounded-full">
                          {getDurationLabel(coupon.premiumDuration)}
                        </span>
                        <span className="px-2 py-1 bg-gray-200 text-gray-700 text-xs rounded-full">
                          {coupon.planName}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">
                        <strong>Reason:</strong> {coupon.archivedReason}
                      </p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 lg:grid-cols-6 gap-3 text-xs">
                    <div>
                      <span className="text-gray-500 block mb-1">Total Used</span>
                      <span className="font-medium text-gray-700">{coupon.usedCount}</span>
                    </div>
                    <div>
                      <span className="text-gray-500 block mb-1">Max Uses</span>
                      <span className="font-medium text-gray-700">{coupon.maxUses}</span>
                    </div>
                    <div>
                      <span className="text-gray-500 block mb-1">Created</span>
                      <span className="font-medium text-gray-700">{new Date(coupon.createdAt).toLocaleDateString()}</span>
                    </div>
                    <div>
                      <span className="text-gray-500 block mb-1">Archived</span>
                      <span className="font-medium text-gray-700">{new Date(coupon.archivedAt).toLocaleDateString()}</span>
                    </div>
                    <div>
                      <span className="text-gray-500 block mb-1">Expiration</span>
                      <span className="font-medium text-gray-700">{coupon.expirationDate ? new Date(coupon.expirationDate).toLocaleDateString() : 'Never'}</span>
                    </div>
                    <div>
                      <span className="text-gray-500 block mb-1">Usage Rate</span>
                      <span className="font-medium text-gray-700">{Math.round((coupon.usedCount / coupon.maxUses) * 100)}%</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  const renderCouponDetails = () => {
    if (!selectedCoupon) return null;
    
    const PurposeIcon = getPurposeIcon(selectedCoupon.purpose);
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <div className="p-6">
            <div className="flex justify-between items-start mb-6">
              <div className="flex items-center space-x-3">
                <PurposeIcon className="h-6 w-6 text-blue-600" />
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">Coupon Details</h3>
                  <p className="text-sm text-gray-600">{getPurposeLabel(selectedCoupon.purpose)}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedCoupon(null)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <XCircle className="h-5 w-5 text-gray-400" />
              </button>
            </div>
            
            <div className="space-y-6">
              {/* Basic Info */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-3">Basic Information</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Code:</span>
                    <span className="font-mono font-medium ml-2">{selectedCoupon.code}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Discount:</span>
                    <span className="font-medium ml-2">{formatDiscount(selectedCoupon)}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Duration:</span>
                    <span className="font-medium ml-2">{getDurationLabel(selectedCoupon.premiumDuration)}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Status:</span>
                    <span className={`font-medium ml-2 ${getStatusColor(selectedCoupon)}`}>
                      {getStatusText(selectedCoupon)}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">Plan:</span>
                    <span className="font-medium ml-2">{selectedCoupon.planName}</span>
                  </div>
                </div>
              </div>
              
              {/* Usage Statistics */}
              <div className="bg-blue-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-3">Usage Statistics</h4>
                <div className="grid grid-cols-3 gap-4 text-sm text-center">
                  <div className="bg-white rounded-lg p-3">
                    <div className="text-2xl font-bold text-blue-600">{selectedCoupon.usedCount}</div>
                    <div className="text-gray-600">Times Used</div>
                  </div>
                  <div className="bg-white rounded-lg p-3">
                    <div className="text-2xl font-bold text-purple-600">{selectedCoupon.maxUses}</div>
                    <div className="text-gray-600">Max Uses</div>
                  </div>
                  <div className="bg-white rounded-lg p-3">
                    <div className="text-2xl font-bold text-green-600">{Math.round(getUsagePercentage(selectedCoupon))}%</div>
                    <div className="text-gray-600">Usage Rate</div>
                  </div>
                </div>
              </div>
              
              {/* Usage History */}
              {selectedCoupon.usageHistory && selectedCoupon.usageHistory.length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Recent Usage</h4>
                  <div className="bg-gray-50 rounded-lg max-h-48 overflow-y-auto">
                    {selectedCoupon.usageHistory.slice(-10).reverse().map((usage, index) => (
                      <div key={index} className="p-3 border-b border-gray-200 last:border-b-0 text-sm">
                        <div className="flex justify-between items-center">
                          <div>
                            <span className="font-medium">{usage.userEmail}</span>
                            <span className="text-gray-500 ml-2">({usage.userId})</span>
                          </div>
                          <span className="text-gray-500">
                            {new Date(usage.usedAt).toLocaleDateString()} {new Date(usage.usedAt).toLocaleTimeString()}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Description */}
              {selectedCoupon.description && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Description</h4>
                  <p className="text-gray-700 bg-gray-50 p-3 rounded-lg">{selectedCoupon.description}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="w-full max-w-6xl mx-auto ">
      {renderNavigation()}
      
      {activeTab === 'create' && renderCreateCoupon()}
      {activeTab === 'active' && renderActiveCoupons()}
      {activeTab === 'history' && renderHistory()}
      {renderCouponDetails()}
    </div>
  );
};

export default CouponCodeGenerator;