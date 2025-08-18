// src/components/ProtectedRoute.jsx
import { Navigate } from 'react-router-dom';
import { useContext, useEffect } from 'react';
import { AuthContext } from '../context/AuthContext.jsx'; // Adjust path

export const ProtectedRoute = ({ children }) => {
  const context = useContext(AuthContext);

  // Log context for debugging (remove in production)
  useEffect(() => {
    if (context === undefined) {
      console.warn('AuthContext is undefined. Ensure AuthProvider is wrapped around the app.');
    }
  }, [context]);

  // Fallback if context is undefined
  if (context === undefined) {
    return <div>Error: Authentication context not found. Check AuthProvider setup.</div>;
  }

  const { user, loading } = context;

  if (loading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/signin" replace />;
  }

  return children;
};