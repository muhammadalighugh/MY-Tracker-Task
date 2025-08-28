import React, { useState, useEffect } from 'react';
import { CreditCard, CheckCircle, Zap, Star, Shield } from 'lucide-react';
import { db } from '../firebase/firebase.config';
import { collection, getDocs,doc ,onSnapshot } from 'firebase/firestore';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../firebase/firebase.config'; // Ensure auth is imported
import HomeLayout from '../layouts/HomeLayout';

const Pricing = () => {
  const [user, loadingAuth] = useAuthState(auth);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activePlan, setActivePlan] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      if (loadingAuth) return; // Wait for auth state to load
      setLoading(true);

      try {
        // Fetch products
        const querySnapshot = await getDocs(collection(db, 'products'));
        const productList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        console.log('Fetched products:', productList);
        const activeProducts = productList.filter(p => p.status === 'Active');
        console.log('Active products after filter:', activeProducts);
        setProducts(activeProducts);

        // Fetch user's active plan if signed in
        if (user) {
          const userDocRef = doc(db, 'users', user.uid);
          onSnapshot(userDocRef, (docSnap) => {
            if (docSnap.exists()) {
              const data = docSnap.data();
              const planName = data.planName || '';
              if (planName) {
                const active = activeProducts.find(p => p.name === planName);
                setActivePlan(active || null);
              }
            }
            setLoading(false);
          }, (error) => {
            toast.error('Failed to load user data: ' + error.message);
            setLoading(false);
          });
        } else {
          setLoading(false);
        }

        if (activeProducts.length === 0) {
          toast.warning('No active plans found. Please add or activate plans in the admin panel.');
        }
      } catch (error) {
        console.error('Fetch products error:', error);
        toast.error('Failed to fetch pricing plans: ' + error.message);
        setLoading(false);
      }
    };

    fetchData();
  }, [user, loadingAuth]);

  const handleSelectPlan = (planName, billingCycle) => {
    navigate('/payment', { state: { planName, billingCycle } });
  };

  const getAdjustedPrice = (price) => {
    if (typeof price !== 'number') {
      console.warn('Invalid price value:', price);
      return 0;
    }
    return price === 0 ? 'Free' : price.toFixed(2); // Show "Free" for $0.00
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

  return (
    <HomeLayout>
      <div className="min-h-screen py-16 sm:py-24 lg:py-32 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-serif bg-gradient-to-r from-emerald-400 via-blue-400 to-purple-400 bg-clip-text text-transparent mb-6">
              Choose Your Plan
            </h1>
            <p className="text-xl text-white max-w-3xl mx-auto font-serif">
              Unlock premium features with our flexible pricing plans designed to scale with your needs
            </p>
          </div>

          {/* Pricing Plans */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {products.length > 0 ? (
              products.map((product) => {
                const adjustedPrice = getAdjustedPrice(product.price);
                const name = product.name || 'Unnamed Plan';
                const features = product.features || ['No features listed'];
                const description = product.description || 'No description available';
                const popular = isPopularPlan(product);
                const isActive = activePlan && activePlan.name === product.name;

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
                    {isActive && (
                      <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-10">
                        <span className="bg-emerald-500 text-white px-6 py-2 rounded-full text-sm font-semibold shadow-lg">
                          Active
                        </span>
                      </div>
                    )}

                    <div className={`h-full backdrop-blur-xl border rounded-3xl p-8 shadow-2xl transition-all duration-500 hover:scale-105 ${
                      popular
                        ? 'bg-gradient-to-br from-white/10 to-white/5 border-emerald-400/30'
                        : isActive
                          ? 'bg-emerald-50 border-emerald-400/50'
                          : 'bg-white/5 border-white/10 hover:border-white/20'
                    }`}>
                      
                      {/* Plan Header */}
                      <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center space-x-3">
                          <div className={`p-3 rounded-2xl ${
                            popular
                              ? 'bg-gradient-to-r from-emerald-500/20 to-blue-500/20 text-emerald-400'
                              : isActive
                                ? 'bg-emerald-500/20 text-emerald-400'
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
                          <span className="text-5xl font-bold text-white">
                            {typeof adjustedPrice === 'string' ? adjustedPrice : `$${adjustedPrice}`}
                          </span>
                        </div>
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
                          isActive
                            ? 'bg-emerald-600 text-white cursor-not-allowed opacity-75'
                            : popular
                              ? 'bg-gradient-to-r from-emerald-500 to-blue-500 hover:from-emerald-400 hover:to-blue-400 text-white shadow-lg hover:shadow-2xl'
                              : 'bg-white/10 hover:bg-white/20 text-white border border-white/20 hover:border-white/30'
                        }`}
                        disabled={isActive}
                      >
                        {isActive ? 'Active Plan' : 'Select Plan'}
                      </button>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="col-span-full">
                <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-3xl p-8 shadow-2xl text-center">
                  <div className="text-gray-400 text-lg mb-4">No plans available.</div>
                  <p className="text-gray-500">Please check back later or contact support for assistance.</p>
                </div>
              </div>
            )}
          </div>

          
          
        </div>
      </div>
    </HomeLayout>
  );
};

export default Pricing;