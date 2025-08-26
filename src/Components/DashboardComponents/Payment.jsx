import React, { useState, useEffect } from 'react';
import { ArrowLeft, CheckCircle ,CircleDollarSign  } from 'lucide-react';
import { auth, db } from '../../firebase/firebase.config';
import { useAuthState } from 'react-firebase-hooks/auth';
import { doc, onSnapshot, updateDoc, getDocs, collection } from 'firebase/firestore';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import HomeLayout from '../../layouts/HomeLayout';

export default function Payment() {
  const [user, loadingAuth, errorAuth] = useAuthState(auth);
  const navigate = useNavigate();
  const [isPremium, setIsPremium] = useState(false);
  const [premiumEndDate, setPremiumEndDate] = useState(null);
  const [planName, setPlanName] = useState('');
  const [billingCycle, setBillingCycle] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [products, setProducts] = useState([]);
  const [activePlan, setActivePlan] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (loadingAuth) return;
    if (errorAuth) {
      toast.error(`Authentication error: ${errorAuth.message}`);
      setLoading(false);
      return;
    }
    if (!user) {
      setLoading(false);
      navigate('/signin');
      return;
    }

    const userDocRef = doc(db, 'users', user.uid);
    const unsubscribe = onSnapshot(userDocRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        const premium = data.isPremium || false;
        const end = data.premiumEndDate ? data.premiumEndDate.toDate() : null;
        const currentPlan = data.planName || '';
        const cycle = data.billingCycle || '';

        if (premium && end && end < new Date()) {
          updateDoc(userDocRef, {
            isPremium: false,
            planName: '',
            billingCycle: '',
            premiumStartDate: null,
            premiumEndDate: null,
          }).catch(() => toast.error('Failed to update expired subscription'));
          setIsPremium(false);
          setPlanName('');
          setBillingCycle('');
          setPremiumEndDate(null);
          setActivePlan(null);
        } else {
          setIsPremium(premium);
          setPlanName(currentPlan);
          setBillingCycle(cycle);
          setPremiumEndDate(end);
          fetchProducts().then(() => {
            const freePlan = products.find(p => p.price === 0 && p.name === currentPlan);
            setActivePlan(freePlan || (currentPlan ? { name: currentPlan, billingCycle: cycle } : null));
          });
        }
        setDisplayName(data.displayName || user.displayName || '');
      } else {
        setIsPremium(false);
        setPlanName('');
        setBillingCycle('');
        setPremiumEndDate(null);
        setDisplayName(user.displayName || '');
        setActivePlan(null);
      }
      setLoading(false);
    }, (error) => {
      toast.error(`Failed to load user data: ${error.message}`);
      setLoading(false);
    });

    fetchProducts();
    return () => unsubscribe();
  }, [user, loadingAuth, errorAuth, navigate]);

  const fetchProducts = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'products'));
      const productList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setProducts(productList.filter(p => p.status === 'Active'));
    } catch (error) {
      toast.error('Failed to fetch available plans');
    }
  };

  const getAdjustedPrice = (price, billingCycle) => {
    if (typeof price !== 'number') return 0;
    let adjusted = price;
    if (billingCycle === 'yearly') adjusted = price * 12 * 0.9;
    else if (billingCycle === '6month') adjusted = price * 6 * 0.95;
    return price === 0 ? 'Free' : adjusted.toFixed(2);
  };

  const handleUpgrade = (selectedPlanName, selectedBillingCycle) => {
    navigate('/checkout', { state: { planName: selectedPlanName, billingCycle: selectedBillingCycle } }); // Changed to /checkout to avoid loop
  };

  if (loading) {
    return (
      <HomeLayout>
        <div className="min-h-screen flex items-center justify-center">
          <CircleDollarSign size={32} className="animate-spin text-emerald-500" />
        </div>
      </HomeLayout>
    );
  }

  return (
      <div className="min-h-screen bg-gray-100 p-4 sm:p-6 lg:p-8">
        <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-lg p-4 sm:p-6 lg:p-8">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center text-sm text-gray-600 hover:text-gray-800 mb-4 transition-colors"
          >
            <ArrowLeft size={18} className="mr-2" />
            Back to Dashboard
          </button>

          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6">Payment & Subscription</h1>

          {user ? (
            <div className="space-y-6 sm:space-y-8">
              <div className="flex items-center space-x-3 sm:space-x-4 p-3 sm:p-4 bg-gray-50 rounded-lg sm:rounded-xl shadow-inner">
                <div className="w-12 sm:w-14 h-12 sm:h-14 rounded-full flex items-center justify-center bg-gradient-to-r from-indigo-500 to-blue-500 text-white font-bold text-xl sm:text-2xl">
                  {displayName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-lg sm:text-xl font-semibold text-gray-900">{displayName}</p>
                  <p className={`text-sm sm:text-base font-medium ${isPremium ? 'text-emerald-600' : 'text-gray-500'}`}>
                    {isPremium
                      ? `${planName} (${billingCycle}) - Expires ${premiumEndDate?.toLocaleDateString() || 'N/A'}`
                      : 'Free Plan'}
                  </p>
                </div>
              </div>

              <div className="border-t border-gray-200 pt-4 sm:pt-6">
                <h2 className="text-xl sm:text-2xl font-semibold text-gray-700 mb-3 sm:mb-4">Your Subscription</h2>
                {(isPremium || (activePlan && activePlan.price === 0)) ? (
                  <div className="p-4 sm:p-6 bg-emerald-50 rounded-lg sm:rounded-xl">
                    <p className="text-sm sm:text-base text-gray-600 mb-2">
                      You are subscribed to the <span className="font-medium text-emerald-600">{planName || activePlan?.name}</span> on a{' '}
                      <span className="font-medium">{billingCycle || activePlan?.billingCycle || 'N/A'}</span> basis.
                    </p>
                    <p className="text-sm sm:text-base text-gray-600">
                      {activePlan && activePlan.price === 0
                        ? 'Enjoy the free plan with basic features.'
                        : `Access all features until ${premiumEndDate?.toLocaleDateString() || 'N/A'}.`}
                    </p>
                  </div>
                ) : (
                  <div className="p-4 sm:p-6 bg-gray-50 rounded-lg sm:rounded-xl">
                    <p className="text-sm sm:text-base text-gray-600 mb-3 sm:mb-4">
                      You are on the Free Plan. Upgrade to unlock advanced features and priority support.
                    </p>
                    <h3 className="text-lg sm:text-xl font-semibold text-gray-700 mb-3 sm:mb-4">Available Plans</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                      {products.map((product) => (
                        <div key={product.id} className="bg-white p-3 sm:p-4 rounded-lg shadow-md border border-gray-200 hover:shadow-lg transition-shadow">
                          <h4 className="text-lg sm:text-xl font-bold text-gray-900 mb-1 sm:mb-2">{product.name}</h4>
                          <p className="text-xs sm:text-sm text-gray-600 mb-1 sm:mb-2">{product.description}</p>
                          <div className="text-xl sm:text-2xl font-bold text-gray-900 mb-1 sm:mb-2">
                            {getAdjustedPrice(product.price, product.billingCycle)}/{product.billingCycle}
                          </div>
                          <ul className="space-y-1 text-xs sm:text-sm text-gray-600 mb-2 sm:mb-4">
                            {product.features.map((feature, idx) => (
                              <li key={idx} className="flex items-center">
                                <CheckCircle size={14} className="text-emerald-500 mr-1 sm:mr-2" />
                                {feature}
                              </li>
                            ))}
                          </ul>
                          <button
                            onClick={() => handleUpgrade(product.name, product.billingCycle)}
                            className="w-full py-1 sm:py-2 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-colors shadow-sm"
                          >
                            Upgrade Now
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-6 sm:mt-8 p-4 sm:p-6 bg-white rounded-lg sm:rounded-xl shadow-inner">
                <h3 className="text-lg sm:text-xl font-semibold text-gray-700 mb-3 sm:mb-4">Why Go Premium?</h3>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4 text-xs sm:text-sm text-gray-600">
                  <li className="flex items-center">
                    <CheckCircle size={14} className="text-emerald-500 mr-1 sm:mr-2" /> Full access to all trackers
                  </li>
                  <li className="flex items-center">
                    <CheckCircle size={14} className="text-emerald-500 mr-1 sm:mr-2" /> Advanced analytics and insights
                  </li>
                  <li className="flex items-center">
                    <CheckCircle size={14} className="text-emerald-500 mr-1 sm:mr-2" /> Priority customer support
                  </li>
                  <li className="flex items-center">
                    <CheckCircle size={14} className="text-emerald-500 mr-1 sm:mr-2" /> Exclusive features and updates
                  </li>
                </ul>
              </div>
            </div>
          ) : (
            <div className="text-center">
              <p className="text-base text-gray-600">Please sign in to view your subscription details.</p>
              <button
                onClick={() => navigate('/signin')}
                className="mt-4 inline-flex items-center justify-center py-2 px-4 bg-indigo-600 hover:bg-indigo-700 rounded-lg text-white text-sm font-medium transition-colors duration-200"
              >
                Sign In
              </button>
            </div>
          )}
        </div>
      </div>
  );
}