import { createContext, useState, useEffect, useMemo } from 'react';
import { auth } from '../firebase/firebase.config';
import { onAuthStateChanged } from 'firebase/auth';
import { toast } from 'react-toastify';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, 
      (user) => {
        setUser(user);
        setLoading(false);
      }, 
      (error) => {
        console.error("Auth state error:", error);
        toast.error("Authentication error");
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const value = useMemo(() => ({
    user,
    loading,
    setUser
  }), [user, loading]);

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};