// PaymentPage.js
import { useState, useEffect } from 'react';
import { CreditCard, Lock, Mail } from 'lucide-react';
import { auth, db } from '../../firebase/firebase.config';
import { updateDoc, doc, getDoc, getDocs, collection, query, where, Timestamp } from 'firebase/firestore';
import { useAuthState } from 'react-firebase-hooks/auth';
import { toast } from 'react-toastify';
import { useNavigate, useLocation } from 'react-router-dom';
import HomeLayout from '../../layouts/HomeLayout';

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

const getDurationLabel = (duration) => {
  const option = durationOptions.find(d => d.value === duration);
  return option ? option.label : 'Unknown';
};

export default function PaymentPage() {
  const [coupon, setCoupon] = useState('');
  const [discount, setDiscount] = useState(0);
  const [couponData, setCouponData] = useState(null);
  const [error, setError] = useState('');
  const [user, loading, authError] = useAuthState(auth);
  const navigate = useNavigate();
  const location = useLocation();
  const { planName = 'Premium Plan', coupon: initialCoupon } = location.state || {};
  const [planPrice, setPlanPrice] = useState(0);

  useEffect(() => {
    if (!loading && !user) {
      toast.error('Please sign in to access the payment page');
      navigate('/signin');
    }
    if (authError) {
      toast.error('Authentication error: ' + authError.message);
      navigate('/signin');
    }
    if (initialCoupon) {
      setCoupon(initialCoupon.code || '');
      setCouponData(initialCoupon);
      calculateInitialDiscount(initialCoupon);
    }
    fetchPlanPrice();
  }, [user, loading, authError, navigate, planName, initialCoupon]);

  const fetchPlanPrice = async () => {
    try {
      const q = query(collection(db, 'products'), where('name', '==', planName));
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        const planDoc = querySnapshot.docs[0].data();
        setPlanPrice(planDoc.price);
      } else {
        toast.error('Selected plan not found');
        navigate('/pricing');
      }
    } catch (err) {
      toast.error('Failed to fetch plan price');
      navigate('/pricing');
    }
  };

  const calculateInitialDiscount = (coupon) => {
    if (!coupon) return;
    let appliedDiscount = 0;
    if (coupon.discountType === 'free') {
      appliedDiscount = planPrice;
    } else if (coupon.discountType === 'percentage') {
      appliedDiscount = (coupon.discountValue / 100) * planPrice;
    } else if (coupon.discountType === 'fixed') {
      appliedDiscount = coupon.discountValue;
    }
    setDiscount(appliedDiscount);
  };

  const handleCoupon = async (e) => {
    e.preventDefault();
    setError('');
    setDiscount(0);
    setCouponData(null);

    if (!coupon.trim()) return;

    try {
      const q = query(collection(db, 'coupons'), where('code', '==', coupon.toUpperCase()), where('status', '==', 'active'));
      const querySnapshot = await getDocs(q);
      if (querySnapshot.empty) {
        setError('Invalid or inactive coupon code');
        return;
      }

      const foundCoupon = querySnapshot.docs[0].data();
      const couponId = querySnapshot.docs[0].id;

      if (foundCoupon.expirationDate && new Date(foundCoupon.expirationDate) < new Date()) {
        setError('Coupon has expired');
        return;
      }

      if (foundCoupon.usedCount >= foundCoupon.maxUses) {
        setError('Coupon usage limit reached');
        return;
      }

      if (foundCoupon.planName !== planName) {
        setError(`Coupon not applicable to ${planName}`);
        return;
      }

      let appliedDiscount = 0;
      if (foundCoupon.discountType === 'free') {
        appliedDiscount = planPrice;
      } else if (foundCoupon.discountType === 'percentage') {
        appliedDiscount = (foundCoupon.discountValue / 100) * planPrice;
      } else if (foundCoupon.discountType === 'fixed') {
        appliedDiscount = foundCoupon.discountValue;
      }

      if (foundCoupon.minPurchase > planPrice - appliedDiscount) {
        setError('Total after discount does not meet minimum purchase requirement');
        return;
      }

      setDiscount(appliedDiscount);
      setCouponData({ ...foundCoupon, id: couponId });
    } catch (err) {
      setError('Failed to validate coupon');
    }
  };

  const handlePayment = async (e) => {
    e.preventDefault();
    if (!user) {
      toast.error('User not authenticated');
      navigate('/signin');
      return;
    }

    const total = planPrice - discount;
    if (total <= 0 && couponData && couponData.discountType === 'free') {
      const userDocRef = doc(db, 'users', user.uid);
      try {
        const userSnap = await getDoc(userDocRef);
        if (!userSnap.exists()) {
          toast.error('User data not found');
          return;
        }

        const now = Timestamp.now();
        const durationMultiplier = durationOptions.find(d => d.value === couponData.premiumDuration)?.multiplier || 7;
        const endSeconds = now.seconds + durationMultiplier * 24 * 60 * 60;
        const end = new Timestamp(endSeconds, 0);

        await updateDoc(userDocRef, {
          isPremium: true,
          premiumStartDate: now,
          premiumEndDate: end,
          planName: planName,
        });

        const couponRef = doc(db, 'coupons', couponData.id);
        const updatedHistory = [
          ...(couponData.usageHistory || []),
          {
            usedAt: now.toDate().toISOString(),
            userId: user.uid,
            userEmail: user.email,
          },
        ];
        await updateDoc(couponRef, {
          usedCount: (couponData.usedCount || 0) + 1,
          usageHistory: updatedHistory,
        });

        toast.success(`Congratulations! 🎉 You have successfully upgraded to ${planName} for ${getDurationLabel(couponData.premiumDuration)}!`);
        navigate('/dashboard');
      } catch (err) {
        toast.error('Failed to upgrade. Please try again or contact info@amigsol.com.');
      }
    } else {
      toast.info('Payment processed (simulation). Real payment not implemented.');
    }
  };

  if (loading) {
    return (
      <HomeLayout>
        <div className="relative isolate lg:mt-7 text-white">
          <div className="fixed inset-0 bg-[linear-gradient(rgba(16,185,129,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(16,185,129,0.03)_1px,transparent_1px)] bg-[size:2rem_2rem] sm:bg-[size:3rem_3rem] lg:bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000,transparent)] pointer-events-none" />
          <div className="relative z-10 flex items-center justify-center min-h-screen py-12 px-4 sm:px-6 lg:px-8">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </HomeLayout>
    );
  }

  return (
    <HomeLayout>
      <div className="relative isolate lg:mt-7 text-white">
        <div className="fixed inset-0 bg-[linear-gradient(rgba(16,185,129,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(16,185,129,0.03)_1px,transparent_1px)] bg-[size:2rem_2rem] sm:bg-[size:3rem_3rem] lg:bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000,transparent)] pointer-events-none" />
        <div className="relative z-10 flex items-center justify-center min-h-screen py-12 px-4 sm:px-6 lg:px-8">
          <div className="w-full max-w-2xl backdrop-blur-xl border border-gray-700/50 rounded-xl p-6 sm:p-8 lg:p-10 shadow-2xl relative overflow-hidden">
            {/* Glass effect overlay */}
            <div className="absolute inset-0 bg-gray/10 rounded-xl" />
            <div className="absolute inset-0 bg-gray-900/40 rounded-xl" />

            {/* Content */}
            <div className="relative z-10">
              <div className="text-center mb-8">
                <div className="flex items-center justify-center mb-4 gap-x-3">
                  <div className="bg-blue-600/20 backdrop-blur-sm p-3 rounded-full border border-blue-500/30 flex items-center justify-center">
                    <CreditCard className="text-blue-400" size={24} />
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-bold text-center font-serif">Upgrade to {planName}</h2>
                </div>

                <p className="mt-2 text-gray-400 font-serif">Secure checkout for {planName} Membership</p>
                <p className="mt-2 text-sm sm:text-base text-yellow-400/80 backdrop-blur-sm bg-yellow-900/20 rounded-lg p-3 border border-yellow-700/50">
                  Note: This payment system is in development. For issues, contact{' '}
                  <a href="mailto:info@amigsol.com" className="underline hover:text-yellow-300">
                    info@amigsol.com
                  </a>.
                </p>
              </div>

              <div className="mt-8">
                <h3 className="text-lg sm:text-xl font-semibold text-white mb-4">Order Summary</h3>
                <div className="bg-gray-800/30 backdrop-blur-sm rounded-lg p-4 border border-gray-600/50">
                  <div className="space-y-4 text-sm sm:text-base text-gray-300">
                    <div className="flex justify-between">
                      <span>{planName}</span>
                      <span>${planPrice.toFixed(2)}/month</span>
                    </div>
                    {discount > 0 && (
                      <div className="flex justify-between text-green-400">
                        <span>Coupon Discount ({coupon})</span>
                        <span>-${discount.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="border-t border-gray-600/50 pt-4">
                      <div className="flex justify-between font-semibold text-white text-lg">
                        <span>Total</span>
                        <span>${(planPrice - discount).toFixed(2)}/month</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <form onSubmit={handleCoupon} className="mt-8">
                <div className="flex flex-col sm:flex-row gap-4">
                  <input
                    type="text"
                    value={coupon}
                    onChange={(e) => setCoupon(e.target.value)}
                    placeholder="Enter coupon code"
                    className="flex-1 px-4 py-3 bg-gray-800/30 backdrop-blur-sm border border-gray-600/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-gray-400"
                  />
                  <button
                    type="submit"
                    className="px-6 py-3 bg-blue-600/80 backdrop-blur-sm hover:bg-blue-700/80 rounded-lg text-sm sm:text-base font-semibold text-white transition-colors border border-blue-500/30"
                  >
                    Apply
                  </button>
                </div>
                {error && (
                  <div className="mt-2 p-3 bg-red-900/30 backdrop-blur-sm rounded-lg text-red-200 text-sm border border-red-700/50">
                    {error}
                  </div>
                )}
              </form>

              <form onSubmit={handlePayment} className="mt-8 space-y-6">
                <div>
                  <label className="block text-sm sm:text-base font-medium text-gray-300 mb-2">Card Information</label>
                  <div className="flex flex-col sm:flex-row items-center gap-4">
                    <CreditCard className="h-5 w-5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Card number (disabled)"
                      className="flex-1 px-4 py-3 bg-gray-800/30 backdrop-blur-sm border border-gray-600/50 rounded-lg text-white placeholder-gray-400 opacity-50 cursor-not-allowed"
                      disabled
                    />
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-4">
                    <input
                      type="text"
                      placeholder="MM/YY (disabled)"
                      className="px-4 py-3 bg-gray-800/30 backdrop-blur-sm border border-gray-600/50 rounded-lg text-white placeholder-gray-400 opacity-50 cursor-not-allowed"
                      disabled
                    />
                    <input
                      type="text"
                      placeholder="CVC (disabled)"
                      className="px-4 py-3 bg-gray-800/30 backdrop-blur-sm border border-gray-600/50 rounded-lg text-white placeholder-gray-400 opacity-50 cursor-not-allowed"
                      disabled
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm sm:text-base font-medium text-gray-300 mb-2">Billing Information</label>
                  <input
                    type="text"
                    placeholder="Full name (disabled)"
                    className="w-full px-4 py-3 bg-gray-800/30 backdrop-blur-sm border border-gray-600/50 rounded-lg text-white placeholder-gray-400 opacity-50 cursor-not-allowed"
                    disabled
                  />
                  <input
                    type="text"
                    placeholder="Billing address (disabled)"
                    className="mt-4 w-full px-4 py-3 bg-gray-800/30 backdrop-blur-sm border border-gray-600/50 rounded-lg text-white placeholder-gray-400 opacity-50 cursor-not-allowed"
                    disabled
                  />
                  <div className="mt-4 grid grid-cols-2 gap-4">
                    <input
                      type="text"
                      placeholder="City (disabled)"
                      className="px-4 py-3 bg-gray-800/30 backdrop-blur-sm border border-gray-600/50 rounded-lg text-white placeholder-gray-400 opacity-50 cursor-not-allowed"
                      disabled
                    />
                    <input
                      type="text"
                      placeholder="ZIP code (disabled)"
                      className="px-4 py-3 bg-gray-800/30 backdrop-blur-sm border border-gray-600/50 rounded-lg text-white placeholder-gray-400 opacity-50 cursor-not-allowed"
                      disabled
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 px-4 bg-gradient-to-r from-blue-600/80 to-purple-600/80 backdrop-blur-sm hover:from-blue-700/80 hover:to-purple-700/80 rounded-lg text-sm sm:text-base font-semibold text-white focus:outline-none focus:ring-2 focus:ring-blue-400 transition-colors border border-blue-500/30"
                >
                  {discount >= planPrice ? `Claim Free ${planName} for ${couponData ? getDurationLabel(couponData.premiumDuration) : '15 Days'}` : `Pay $${(planPrice - discount).toFixed(2)}`}
                </button>
              </form>

              <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-2 text-sm sm:text-base text-gray-300">
                <Lock className="h-4 w-4" />
                <span>Secure payment (in development)</span>
              </div>

              <div className="mt-6 text-center text-xs text-gray-500 flex items-center justify-center gap-2">
                <Mail size={14} className="text-gray-400" />
                <p>Support: info@gmail.com</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </HomeLayout>
  );
}