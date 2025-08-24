import React, { useState, useEffect } from 'react';
import { CreditCard, CheckCircle, Zap, Star, Shield } from 'lucide-react';
import { db } from '../firebase/firebase.config';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import HomeLayout from '../layouts/HomeLayout';

const Pricing = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [coupon, setCoupon] = useState('');
  const [couponData, setCouponData] = useState(null);
  const [discounts, setDiscounts] = useState({});
  const [error, setError] = useState('');
  const [selectedCycle, setSelectedCycle] = useState('6month');
  const navigate = useNavigate();

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'products'));
      const productList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      console.log('Fetched products:', productList);
      const activeProducts = productList.filter(p => p.status === 'Active');
      console.log('Active products after filter:', activeProducts);
      setProducts(activeProducts);
      if (activeProducts.length === 0) {
        toast.warning('No active plans found. Please add or activate plans in the admin panel.');
      }
      setLoading(false);
    } catch (error) {
      console.error('Fetch products error:', error);
      toast.error('Failed to fetch pricing plans: ' + error.message);
      setLoading(false);
    }
  };

  const handleCoupon = async (e) => {
    e.preventDefault();
    setError('');
    setCouponData(null);
    setDiscounts({});
    if (!coupon.trim()) {
      setError('Please enter a coupon code');
      return;
    }
    try {
      const q = query(
        collection(db, 'coupons'),
        where('code', '==', coupon.toUpperCase()),
        where('status', '==', 'active')
      );
      const querySnapshot = await getDocs(q);
      if (querySnapshot.empty) {
        setError('Invalid or inactive coupon code');
        return;
      }
      const foundCoupon = querySnapshot.docs[0].data();
      const couponId = querySnapshot.docs[0].id;
      console.log('Found coupon:', foundCoupon);
      if (foundCoupon.expirationDate && new Date(foundCoupon.expirationDate) < new Date()) {
        setError('Coupon has expired');
        return;
      }
      if (foundCoupon.usedCount >= foundCoupon.maxUses) {
        setError('Coupon usage limit reached');
        return;
      }
      const matchingProduct = products.find(p => p.name === foundCoupon.planName && p.billingCycle === selectedCycle);
      if (!matchingProduct) {
        setError(`Coupon not applicable to any ${selectedCycle} plan`);
        return;
      }
      const productPrice = typeof matchingProduct.price === 'number' ? matchingProduct.price : 0;
      console.log('Matching product price:', productPrice);
      let appliedDiscount = 0;
      if (foundCoupon.discountType === 'free') {
        appliedDiscount = productPrice;
      } else if (foundCoupon.discountType === 'percentage') {
        appliedDiscount = (foundCoupon.discountValue / 100) * productPrice;
      } else if (foundCoupon.discountType === 'fixed') {
        appliedDiscount = foundCoupon.discountValue;
      }
      if (foundCoupon.minPurchase > productPrice - appliedDiscount) {
        setError('Total after discount does not meet minimum purchase requirement');
        return;
      }
      setDiscounts({ [matchingProduct.name]: appliedDiscount });
      setCouponData({ ...foundCoupon, id: couponId });
    } catch (err) {
      console.error('Coupon validation error:', err);
      setError('Failed to validate coupon');
    }
  };

  const handleSelectPlan = (planName, billingCycle) => {
    navigate('/payment', { state: { planName, billingCycle, coupon: couponData } });
  };

  const getAdjustedPrice = (price, billingCycle) => {
    if (typeof price !== 'number') {
      console.warn('Invalid price value:', price);
      return 0;
    }
    let adjusted = price;
    if (billingCycle === 'yearly') adjusted = price * 12 * 0.9;
    else if (billingCycle === '6month') adjusted = price * 6 * 0.95;
    return adjusted;
  };

  const getPlanIcon = (planName) => {
    switch (planName?.toLowerCase()) {
      case 'starter': 
      case 'basic': 
        return <Zap className="h-6 w-6" />;
      case 'professional':
      case 'pro':
      case 'premium':
        return <Star className="h-6 w-6" />;
      case 'enterprise':
      case 'business':
        return <Shield className="h-6 w-6" />;
      default: 
        return <CreditCard className="h-6 w-6" />;
    }
  };

  const isPopularPlan = (product) => {
    const popularNames = ['professional', 'pro', 'premium'];
    return popularNames.includes(product.name?.toLowerCase());
  };

  if (loading) {
    return (
      <HomeLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-400"></div>
        </div>
      </HomeLayout>
    );
  }

  const sortedProducts = [...products].sort((a, b) => {
    if (couponData && a.name === couponData.planName && a.billingCycle === selectedCycle) return -1;
    if (couponData && b.name === couponData.planName && b.billingCycle === selectedCycle) return 1;
    return 0;
  });

  return (
    <HomeLayout>
      <div className="min-h-screen py-16 sm:py-24 lg:py-32 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="text-center mb-16">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold bg-gradient-to-r from-emerald-400 via-blue-400 to-purple-400 bg-clip-text text-transparent mb-6">
              Choose Your Plan
            </h1>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Unlock premium features with our flexible pricing plans designed to scale with your needs
            </p>
          </div>

          {/* Billing Cycle Selector */}
          <div className="flex justify-center mb-12">
            <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-2 shadow-2xl">
              <div className="flex space-x-1">
                {[
                  { value: 'monthly', label: 'Monthly' },
                  { value: '6month', label: '6 Months', badge: 'Save 5%' },
                  { value: 'yearly', label: 'Yearly', badge: 'Save 10%' }
                ].map((cycle) => (
                  <button
                    key={cycle.value}
                    onClick={() => setSelectedCycle(cycle.value)}
                    className={`px-6 py-3 rounded-xl font-medium transition-all duration-300 relative ${
                      selectedCycle === cycle.value
                        ? 'bg-gradient-to-r from-emerald-500 to-blue-500 text-white shadow-lg'
                        : 'text-gray-300 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    {cycle.label}
                    {cycle.badge && cycle.value !== 'monthly' && (
                      <span className="absolute -top-2 -right-2 text-xs bg-emerald-500/20 text-emerald-300 px-2 py-1 rounded-full">
                        {cycle.badge}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Coupon Input */}
          <div className="max-w-md mx-auto mb-16">
            <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6 shadow-2xl">
              <form onSubmit={handleCoupon} className="space-y-4">
                <div className="flex flex-col sm:flex-row gap-4">
                  <input
                    type="text"
                    value={coupon}
                    onChange={(e) => setCoupon(e.target.value)}
                    placeholder="Enter coupon code"
                    className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent backdrop-blur-sm"
                  />
                  <button
                    type="submit"
                    className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-blue-500 hover:from-emerald-400 hover:to-blue-400 rounded-xl font-semibold text-white transition-all duration-300 shadow-lg hover:shadow-xl"
                  >
                    Apply Coupon
                  </button>
                </div>
                {error && (
                  <p className="text-red-400 text-sm text-center animate-pulse">{error}</p>
                )}
              </form>
            </div>
          </div>

          {/* Pricing Plans */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {sortedProducts.length > 0 ? (
              sortedProducts.map((product) => {
                const adjustedPrice = getAdjustedPrice(product.price, product.billingCycle);
                const discount = discounts[product.name] || 0;
                const finalPrice = typeof adjustedPrice === 'number' ? (adjustedPrice - discount).toFixed(2) : '0.00';
                const name = product.name || 'Unnamed Plan';
                const features = product.features || ['No features listed'];
                const description = product.description || 'No description available';
                const popular = isPopularPlan(product);
                const hasCoupon = couponData && product.name === couponData.planName && product.billingCycle === selectedCycle;

                return (
                  <div
                    key={product.id}
                    className={`relative group ${popular ? 'lg:-mt-8' : ''}`}
                  >
                    {popular && (
                      <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-10">
                        <span className="bg-gradient-to-r from-emerald-500 to-blue-500 text-white px-6 py-2 rounded-full text-sm font-semibold shadow-lg">
                          Most Popular
                        </span>
                      </div>
                    )}

                    <div className={`h-full backdrop-blur-xl border rounded-3xl p-8 shadow-2xl transition-all duration-500 hover:scale-105 ${
                      hasCoupon
                        ? 'bg-gradient-to-br from-emerald-500/10 to-blue-500/5 border-emerald-400/50' 
                        : popular 
                          ? 'bg-gradient-to-br from-white/10 to-white/5 border-emerald-400/30' 
                          : 'bg-white/5 border-white/10 hover:border-white/20'
                    }`}>
                      
                      {/* Plan Header */}
                      <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center space-x-3">
                          <div className={`p-3 rounded-2xl ${
                            popular 
                              ? 'bg-gradient-to-r from-emerald-500/20 to-blue-500/20 text-emerald-400' 
                              : 'bg-white/10 text-gray-300'
                          }`}>
                            {getPlanIcon(name)}
                          </div>
                          <div>
                            <h3 className="text-2xl font-bold text-white">{name}</h3>
                            <span className="text-sm text-emerald-400 font-medium">{product.status}</span>
                          </div>
                        </div>
                      </div>

                      <p className="text-gray-300 mb-8 leading-relaxed">{description}</p>

                      {/* Pricing */}
                      <div className="mb-8">
                        <div className="flex items-baseline mb-2">
                          <span className="text-5xl font-bold text-white">${finalPrice}</span>
                          <span className="text-gray-400 ml-2 capitalize">/{product.billingCycle}</span>
                        </div>
                        {discount > 0 && (
                          <div className="text-emerald-400 text-sm">
                            <span className="line-through text-gray-500">${adjustedPrice.toFixed(2)}</span>
                            <span className="ml-2 font-semibold">Save ${discount.toFixed(2)}</span>
                          </div>
                        )}
                      </div>

                      {/* Features */}
                      <div className="space-y-4 mb-8">
                        {features.map((feature, idx) => (
                          <div key={idx} className="flex items-center text-gray-300">
                            <CheckCircle className="h-5 w-5 text-emerald-400 mr-3 flex-shrink-0" />
                            <span>{feature}</span>
                          </div>
                        ))}
                      </div>

                      {/* CTA Button */}
                      <button
                        onClick={() => handleSelectPlan(product.name, product.billingCycle)}
                        className={`w-full py-4 rounded-2xl font-semibold transition-all duration-300 ${
                          discount >= adjustedPrice
                            ? 'bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-400 hover:to-emerald-400 text-white shadow-lg hover:shadow-2xl'
                            : popular
                              ? 'bg-gradient-to-r from-emerald-500 to-blue-500 hover:from-emerald-400 hover:to-blue-400 text-white shadow-lg hover:shadow-2xl'
                              : 'bg-white/10 hover:bg-white/20 text-white border border-white/20 hover:border-white/30'
                        }`}
                      >
                        {discount >= adjustedPrice ? 'Claim Free Plan' : 'Select Plan'}
                      </button>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="col-span-full">
                <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-3xl p-8 shadow-2xl text-center">
                  <div className="text-gray-400 text-lg mb-4">No plans available for the selected billing cycle.</div>
                  <p className="text-gray-500">Please check back later or contact support for assistance.</p>
                </div>
              </div>
            )}
          </div>

          {/* Bottom CTA */}
          <div className="text-center mt-16">
            <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-3xl p-8 shadow-2xl max-w-3xl mx-auto">
              <h3 className="text-2xl font-bold text-white mb-4">Need a Custom Solution?</h3>
              <p className="text-gray-300 mb-6">
                Contact our team to discuss enterprise pricing and custom features tailored to your organization.
              </p>
              <button className="px-8 py-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-400 hover:to-pink-400 rounded-xl font-semibold text-white transition-all duration-300 shadow-lg hover:shadow-xl">
                Contact Sales
              </button>
            </div>
          </div>
        </div>
      </div>
    </HomeLayout>
  );
};

export default Pricing;