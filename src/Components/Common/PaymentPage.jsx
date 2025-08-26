// import React, { useState, useEffect } from 'react';
// import { loadStripe } from '@stripe/stripe-js';
// import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
// import { CreditCard, Lock, Mail, CheckCircle, ArrowLeft } from 'lucide-react';
// import { auth, db } from '../../firebase/firebase.config';
// import { updateDoc, doc, getDoc, getDocs, collection, query, where, Timestamp } from 'firebase/firestore';
// import { useAuthState } from 'react-firebase-hooks/auth';
// import { toast } from 'react-toastify';
// import { useNavigate, useLocation } from 'react-router-dom';
// import HomeLayout from '../../layouts/HomeLayout';

// const stripePromise = loadStripe('pk_test_51RzzhA0WcAc7V8YUyn6CcExlhQZXoEybwtTLmPArc8w5oEG99T7y4HLg2OO33dlAzwh6tM2P7q6O98dSDdEpHz9i00Y7WfgY3X');

// const durationOptions = [
//   { value: '3_days', label: '3 Days', multiplier: 3 },
//   { value: '1_week', label: '1 Week', multiplier: 7 },
//   { value: '2_weeks', label: '2 Weeks', multiplier: 14 },
//   { value: '1_month', label: '1 Month', multiplier: 30 },
//   { value: '2_months', label: '2 Months', multiplier: 60 },
//   { value: '3_months', label: '3 Months', multiplier: 90 },
//   { value: '6_months', label: '6 Months', multiplier: 180 },
//   { value: '1_year', label: '1 Year', multiplier: 365 },
// ];

// const getDurationLabel = (duration) => {
//   const option = durationOptions.find(d => d.value === duration);
//   return option ? option.label : '1 Week';
// };

// // Custom component to handle Stripe payment form
// const CheckoutForm = ({ planPrice, discount, couponData, planName, billingCycle }) => {
//   const stripe = useStripe();
//   const elements = useElements();
//   const navigate = useNavigate();
//   const [user] = useAuthState(auth);
//   const [error, setError] = useState(null);
//   const [processing, setProcessing] = useState(false);

//   const handlePayment = async (e) => {
//     e.preventDefault();
//     if (!stripe || !elements || !user) return;

//     setProcessing(true);

//     const total = planPrice - discount;
//     if (total <= 0 && couponData && couponData.discountType === 'free') {
//       const userDocRef = doc(db, 'users', user.uid);
//       try {
//         const userSnap = await getDoc(userDocRef);
//         if (!userSnap.exists()) {
//           toast.error('User data not found');
//           return;
//         }

//         const now = Timestamp.now();
//         const durationMultiplier = durationOptions.find(d => d.value === couponData.premiumDuration)?.multiplier || 7;
//         const endSeconds = now.seconds + durationMultiplier * 24 * 60 * 60;
//         const end = new Timestamp(endSeconds, 0);

//         await updateDoc(userDocRef, {
//           isPremium: true,
//           premiumStartDate: now,
//           premiumEndDate: end,
//           planName,
//           billingCycle: billingCycle || 'monthly',
//         });

//         const couponRef = doc(db, 'coupons', couponData.id);
//         const updatedHistory = [
//           ...(couponData.usageHistory || []),
//           {
//             usedAt: now.toDate().toISOString(),
//             userId: user.uid,
//             userEmail: user.email,
//           },
//         ];
//         await updateDoc(couponRef, {
//           usedCount: (couponData.usedCount || 0) + 1,
//           usageHistory: updatedHistory,
//         });

//         toast.success(`Successfully upgraded to ${planName} for ${getDurationLabel(couponData.premiumDuration)}!`);
//         navigate('/dashboard');
//       } catch (err) {
//         toast.error('Failed to upgrade. Please try again or contact support.');
//       } finally {
//         setProcessing(false);
//       }
//     } else {
//       const cardElement = elements.getElement(CardElement);
//       const { error: paymentMethodError, paymentMethod } = await stripe.createPaymentMethod({
//         type: 'card',
//         card: cardElement,
//       });

//       if (paymentMethodError) {
//         setError(paymentMethodError.message);
//         setProcessing(false);
//         return;
//       }

//       try {
//         const response = await fetch('http://localhost:3000/api/create-payment-intent', {
//           method: 'POST',
//           headers: { 'Content-Type': 'application/json' },
//           body: JSON.stringify({
//             amount: Math.round(total * 100),
//             currency: 'usd',
//             userId: user.uid,
//             planName,
//             billingCycle,
//           }),
//         });

//         if (!response.ok) throw new Error('Payment intent creation failed');

//         const { clientSecret } = await response.json();
//         const result = await stripe.confirmCardPayment(clientSecret, {
//           payment_method: paymentMethod.id,
//         });

//         if (result.error) {
//           setError(result.error.message);
//         } else {
//           const userDocRef = doc(db, 'users', user.uid);
//           const now = Timestamp.now();
//           const endSeconds = now.seconds + (durationOptions.find(d => d.value === '1_month')?.multiplier || 30) * 24 * 60 * 60;
//           const end = new Timestamp(endSeconds, 0);

//           await updateDoc(userDocRef, {
//             isPremium: true,
//             premiumStartDate: now,
//             premiumEndDate: end,
//             planName,
//             billingCycle: billingCycle || 'monthly',
//           });

//           toast.success(`Payment successful! Upgraded to ${planName} for 1 month.`);
//           navigate('/dashboard');
//         }
//       } catch (err) {
//         toast.error(`Payment failed: ${err.message}. Please try again or contact support.`);
//       } finally {
//         setProcessing(false);
//       }
//     }
//   };

//   return (
//     <form onSubmit={handlePayment} className="mt-8 space-y-6">
//       <div>
//         <label className="block text-sm sm:text-base font-medium text-gray-300 mb-2">Card Information</label>
//         <div className="flex items-center gap-4 mb-4">
//           <CreditCard className="h-5 w-5 text-gray-400" />
//           <CardElement
//             className="flex-1 px-4 py-3 bg-gray-800/30 border border-gray-700/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-gray-500"
//             options={{
//               style: {
//                 base: {
//                   color: '#fff',
//                   fontSize: '16px',
//                   '::placeholder': { color: '#a1a1aa' },
//                 },
//               },
//             }}
//           />
//         </div>
//         {error && <div className="text-red-200 text-sm">{error}</div>}
//       </div>
//       <button
//         type="submit"
//         disabled={!stripe || processing}
//         className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-lg text-sm sm:text-base font-semibold text-white focus:outline-none focus:ring-2 focus:ring-blue-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
//       >
//         {processing ? 'Processing...' : (discount >= planPrice ? `Claim Free ${planName} for ${couponData ? getDurationLabel(couponData.premiumDuration) : '1 Week'}` : `Pay $${(planPrice - discount).toFixed(2)}`)}
//       </button>
//     </form>
//   );
// };

// export default function PaymentPage() {
//   const [coupon, setCoupon] = useState('');
//   const [discount, setDiscount] = useState(0);
//   const [couponData, setCouponData] = useState(null);
//   const [error, setError] = useState('');
//   const [user, loading, authError] = useAuthState(auth);
//   const navigate = useNavigate();
//   const location = useLocation();
//   const { planName = 'Premium Plan', billingCycle } = location.state || {};
//   const [planPrice, setPlanPrice] = useState(0);
//   const [paymentMethod, setPaymentMethod] = useState('card');

//   useEffect(() => {
//     if (!loading && !user) {
//       toast.error('Please sign in to access the payment page');
//       navigate('/signin');
//       return;
//     }
//     if (authError) {
//       toast.error(`Authentication error: ${authError.message}`);
//       navigate('/signin');
//       return;
//     }
//     fetchPlanPrice();
//   }, [user, loading, authError, navigate, planName, billingCycle]);

//   const fetchPlanPrice = async () => {
//     try {
//       const q = query(collection(db, 'products'), where('name', '==', planName));
//       const querySnapshot = await getDocs(q);
//       if (!querySnapshot.empty) {
//         const planDoc = querySnapshot.docs[0].data();
//         setPlanPrice(planDoc.price || 0);
//       } else {
//         toast.error('Selected plan not found');
//         navigate('/pricing');
//       }
//     } catch (err) {
//       toast.error('Failed to fetch plan price');
//       navigate('/pricing');
//     }
//   };

//   const handleCoupon = async (e) => {
//     e.preventDefault();
//     setError('');
//     setDiscount(0);
//     setCouponData(null);

//     if (!coupon.trim()) return;

//     try {
//       const q = query(collection(db, 'coupons'), where('code', '==', coupon.toUpperCase()), where('status', '==', 'active'));
//       const querySnapshot = await getDocs(q);
//       if (querySnapshot.empty) {
//         setError('Invalid or inactive coupon code');
//         return;
//       }

//       const foundCoupon = querySnapshot.docs[0].data();
//       const couponId = querySnapshot.docs[0].id;

//       if (foundCoupon.expirationDate && new Date(foundCoupon.expirationDate) < new Date()) {
//         setError('Coupon has expired');
//         return;
//       }

//       if (foundCoupon.usedCount >= foundCoupon.maxUses) {
//         setError('Coupon usage limit reached');
//         return;
//       }

//       if (foundCoupon.planName !== planName) {
//         setError(`Coupon not applicable to ${planName}`);
//         return;
//       }

//       let appliedDiscount = 0;
//       if (foundCoupon.discountType === 'free') {
//         appliedDiscount = planPrice;
//       } else if (foundCoupon.discountType === 'percentage') {
//         appliedDiscount = (foundCoupon.discountValue / 100) * planPrice;
//       } else if (foundCoupon.discountType === 'fixed') {
//         appliedDiscount = foundCoupon.discountValue;
//       }

//       if (foundCoupon.minPurchase > planPrice - appliedDiscount) {
//         setError('Total after discount does not meet minimum purchase requirement');
//         return;
//       }

//       setDiscount(appliedDiscount);
//       setCouponData({ ...foundCoupon, id: couponId });
//     } catch (err) {
//       setError('Failed to validate coupon');
//     }
//   };

//   if (loading) {
//     return (
//       <HomeLayout>
//         <div className="min-h-screen flex items-center justify-center">
//           <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div>
//         </div>
//       </HomeLayout>
//     );
//   }

//   return (
//     <HomeLayout>
//       <div className="min-h-screen py-20 px-4 sm:px-6 lg:px-8">
//         <div className="max-w-2xl mx-auto bg-white/5 backdrop-blur-md border border-gray-800/50 rounded-xl p-6 sm:p-8 lg:p-10 shadow-lg">
//           <button
//             onClick={() => navigate('/pricing')}
//             className="flex items-center text-sm text-gray-300 hover:text-gray-100 mb-6 transition-colors"
//           >
//             <ArrowLeft size={18} className="mr-2" />
//             Back to Plans
//           </button>

//           <div className="text-center mb-8">
//             <div className="flex items-center justify-center mb-4 gap-x-3">
//               <div className="bg-blue-600/20 p-2 rounded-full border border-blue-500/30">
//                 <CreditCard className="text-blue-400" size={24} />
//               </div>
//               <h2 className="text-2xl sm:text-3xl font-bold text-white">Upgrade to {planName}</h2>
//             </div>
//             <p className="mt-2 text-gray-400">Secure checkout for your {planName} membership</p>
//           </div>

//           <div className="mt-8">
//             <h3 className="text-lg sm:text-xl font-semibold text-gray-100 mb-4">Order Summary</h3>
//             <div className="bg-gray-800/30 rounded-lg p-4 border border-gray-700/50">
//               <div className="space-y-4 text-sm sm:text-base text-gray-300">
//                 <div className="flex justify-between">
//                   <span>{planName} ({billingCycle || 'monthly'})</span>
//                   <span>${planPrice.toFixed(2)}</span>
//                 </div>
//                 {discount > 0 && (
//                   <div className="flex justify-between text-green-400">
//                     <span>Coupon Discount ({coupon})</span>
//                     <span>-${discount.toFixed(2)}</span>
//                   </div>
//                 )}
//                 <div className="border-t border-gray-700/50 pt-4">
//                   <div className="flex justify-between font-semibold text-white text-lg">
//                     <span>Total</span>
//                     <span>${(planPrice - discount).toFixed(2)}</span>
//                   </div>
//                 </div>
//               </div>
//             </div>
//           </div>

//           <form onSubmit={handleCoupon} className="mt-8">
//             <div className="flex flex-col sm:flex-row gap-4">
//               <input
//                 type="text"
//                 value={coupon}
//                 onChange={(e) => setCoupon(e.target.value)}
//                 placeholder="Enter coupon code"
//                 className="flex-1 px-4 py-3 bg-gray-800/30 border border-gray-700/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-gray-500"
//               />
//               <button
//                 type="submit"
//                 className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm sm:text-base font-semibold text-white transition-colors border border-blue-500/50"
//               >
//                 Apply
//               </button>
//             </div>
//             {error && (
//               <div className="mt-2 p-3 bg-red-900/30 rounded-lg text-red-200 text-sm border border-red-700/50">
//                 {error}
//               </div>
//             )}
//           </form>

//           <div className="mt-8">
//             <h3 className="text-lg sm:text-xl font-semibold text-gray-100 mb-4">Payment Method</h3>
//             <div className="space-y-4">
//               <button
//                 onClick={() => setPaymentMethod('card')}
//                 className={`w-full py-2 px-4 rounded-lg border ${paymentMethod === 'card' ? 'bg-blue-600 text-white border-blue-500' : 'bg-gray-800/30 text-gray-300 border-gray-700/50'} hover:bg-blue-700 transition-colors`}
//               >
//                 Credit/Debit Card
//               </button>
//               <button
//                 className="w-full py-2 px-4 rounded-lg bg-gray-800/30 text-gray-500 border border-gray-700/50 cursor-not-allowed opacity-75"
//               >
//                 PayPal (Coming Soon)
//               </button>
//               <button
//                 className="w-full py-2 px-4 rounded-lg bg-gray-800/30 text-gray-500 border border-gray-700/50 cursor-not-allowed opacity-75"
//               >
//                 Bank Transfer (Coming Soon)
//               </button>
//             </div>
//           </div>

//           {paymentMethod === 'card' && (
//             <Elements stripe={stripePromise}>
//               <CheckoutForm planPrice={planPrice} discount={discount} couponData={couponData} planName={planName} billingCycle={billingCycle} />
//             </Elements>
//           )}

//           <div className="mt-6 flex items-center justify-center gap-2 text-sm sm:text-base text-gray-400">
//             <Lock className="h-4 w-4" />
//             <span>Secure payment</span>
//           </div>

//           <div className="mt-6 text-center text-xs text-gray-500 flex items-center justify-center gap-2">
//             <Mail size={14} className="text-gray-400" />
//             <p>Support: support@example.com</p>
//           </div>
//         </div>
//       </div>
//     </HomeLayout>
//   );
// }
import React from 'react'

export default function PaymentPage() {
  return (
    <div>PaymentPage</div>
  )
}
