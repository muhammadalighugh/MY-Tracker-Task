import { useState, useEffect } from 'react';
import { CreditCard, Lock } from 'lucide-react';
import { auth, db } from '../../firebase/firebase.config';
import { updateDoc, doc, getDoc, Timestamp } from 'firebase/firestore';
import { useAuthState } from 'react-firebase-hooks/auth';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';

export default function PaymentPage() {
  const [coupon, setCoupon] = useState('');
  const [discount, setDiscount] = useState(0);
  const [error, setError] = useState('');
  const [user, loading, authError] = useAuthState(auth);
  const navigate = useNavigate();

  // Redirect to signin if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      toast.error('Please sign in to access the payment page');
      navigate('/signin');
    }
    if (authError) {
      toast.error('Authentication error: ' + authError.message);
      navigate('/signin');
    }
  }, [user, loading, authError, navigate]);

  const handleCoupon = (e) => {
    e.preventDefault();
    if (coupon.toUpperCase() === 'AMIPRO') {
      setDiscount(8);
      setError('');
    } else {
      setDiscount(0);
      setError('Invalid coupon code');
    }
  };

  const handlePayment = async (e) => {
    e.preventDefault();
    if (8 - discount <= 0 && discount === 8) {
      if (user) {
        const userDocRef = doc(db, 'users', user.uid);
        try {
          const userSnap = await getDoc(userDocRef);
          if (!userSnap.exists()) {
            toast.error('User data not found');
            return;
          }
          const data = userSnap.data();
          if (data.hasUsedCoupon) {
            toast.error('Coupon already used. You can only use it once.');
            return;
          }
          const now = Timestamp.now();
          const endSeconds = now.seconds + 15 * 24 * 60 * 60; // 15 days
          const end = new Timestamp(endSeconds, 0);
          await updateDoc(userDocRef, {
            isPremium: true,
            premiumStartDate: now,
            premiumEndDate: end,
            hasUsedCoupon: true,
          });
          toast.success('Congratulations! 🎉 You have successfully upgraded to Premium for 15 days!');
          navigate('/dashboard');
        } catch (err) {
          toast.error('Failed to upgrade. Please try again or contact info@amigsol.com.');
        }
      } else {
        toast.error('User not authenticated');
        navigate('/signin');
      }
    } else {
      toast.error('Use valid coupon code (AMIPRO) for free 15-day premium. Real payment is not implemented.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 py-16 sm:py-24 lg:py-32 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-2xl">
        <div className="bg-white/5 rounded-3xl p-6 sm:p-8 lg:p-10 ring-1 ring-white/10 backdrop-blur-sm">
          <div className="text-center">
            <h2 className="text-2xl sm:text-3xl font-bold text-white">Upgrade to Premium</h2>
            <p className="mt-2 text-sm sm:text-base text-gray-300">Secure checkout for Premium Membership</p>
            <p className="mt-2 text-sm sm:text-base text-yellow-400">
              Note: This payment system is in development. For issues, contact{' '}
              <a href="mailto:info@amigsol.com" className="underline hover:text-yellow-300">
                info@amigsol.com
              </a>.
            </p>
          </div>

          {/* Order Summary */}
          <div className="mt-8">
            <h3 className="text-lg sm:text-xl font-semibold text-white">Order Summary</h3>
            <div className="mt-4 space-y-4 text-sm sm:text-base text-gray-300">
              <div className="flex justify-between">
                <span>Premium Plan</span>
                <span>$8.00/month</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-green-400">
                  <span>Coupon Discount (AMIPRO)</span>
                  <span>-${discount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between font-semibold text-white">
                <span>Total</span>
                <span>${(8 - discount).toFixed(2)}/month</span>
              </div>
            </div>
          </div>

          {/* Coupon Form */}
          <form onSubmit={handleCoupon} className="mt-8">
            <div className="flex flex-col sm:flex-row gap-4">
              <input
                type="text"
                value={coupon}
                onChange={(e) => setCoupon(e.target.value)}
                placeholder="Enter coupon code"
                className="flex-1 rounded-xl bg-white/10 p-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
              <button
                type="submit"
                className="rounded-xl bg-indigo-600 px-6 py-3 text-sm sm:text-base font-semibold text-white hover:bg-indigo-500 transition-colors"
              >
                Apply
              </button>
            </div>
            {error && <p className="mt-2 text-sm text-red-400">{error}</p>}
          </form>

          {/* Payment Form */}
          <form onSubmit={handlePayment} className="mt-8 space-y-6">
            {/* Card Information */}
            <div>
              <label className="block text-sm sm:text-base font-medium text-gray-300">Card Information</label>
              <div className="mt-2 flex flex-col sm:flex-row items-center gap-4">
                <CreditCard className="h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Card number (disabled)"
                  className="flex-1 rounded-xl bg-white/10 p-3 text-white placeholder-gray-400 opacity-50 cursor-not-allowed"
                  disabled
                />
              </div>
              <div className="mt-4 grid grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="MM/YY (disabled)"
                  className="rounded-xl bg-white/10 p-3 text-white placeholder-gray-400 opacity-50 cursor-not-allowed"
                  disabled
                />
                <input
                  type="text"
                  placeholder="CVC (disabled)"
                  className="rounded-xl bg-white/10 p-3 text-white placeholder-gray-400 opacity-50 cursor-not-allowed"
                  disabled
                />
              </div>
            </div>

            {/* Billing Information */}
            <div>
              <label className="block text-sm sm:text-base font-medium text-gray-300">Billing Information</label>
              <input
                type="text"
                placeholder="Full name (disabled)"
                className="mt-2 w-full rounded-xl bg-white/10 p-3 text-white placeholder-gray-400 opacity-50 cursor-not-allowed"
                disabled
              />
              <input
                type="text"
                placeholder="Billing address (disabled)"
                className="mt-4 w-full rounded-xl bg-white/10 p-3 text-white placeholder-gray-400 opacity-50 cursor-not-allowed"
                disabled
              />
              <div className="mt-4 grid grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="City (disabled)"
                  className="rounded-xl bg-white/10 p-3 text-white placeholder-gray-400 opacity-50 cursor-not-allowed"
                  disabled
                />
                <input
                  type="text"
                  placeholder="ZIP code (disabled)"
                  className="rounded-xl bg-white/10 p-3 text-white placeholder-gray-400 opacity-50 cursor-not-allowed"
                  disabled
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 py-3 text-sm sm:text-base font-semibold text-white hover:from-indigo-500 hover:to-purple-500 focus:outline-none focus:ring-2 focus:ring-indigo-400 transition-colors"
            >
              {discount === 8 ? 'Claim 15-Day Free Premium' : 'Pay $' + (8 - discount).toFixed(2)}
            </button>
          </form>

          <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-2 text-sm sm:text-base text-gray-300">
            <Lock className="h-4 w-4" />
            <span>Secure payment (in development)</span>
          </div>
        </div>
      </div>
    </div>
  );
}
