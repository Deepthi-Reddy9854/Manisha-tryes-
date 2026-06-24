import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Loader2 } from 'lucide-react';

const ProtectedRoute = ({ adminOnly = false, allowedRoles = null }) => {
  const { user, loading, isAuthenticated } = useAuth();

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-950">
        <Loader2 className="w-12 h-12 text-indigo-600 dark:text-indigo-400 animate-spin" />
        <p className="mt-4 text-sm font-semibold text-gray-500 dark:text-gray-400">Loading your profile...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const role = user?.role;

  if (adminOnly && role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(role)) {
    if (role === 'admin') return <Navigate to="/admin" replace />;
    if (role === 'delivery') return <Navigate to="/delivery" replace />;
    if (role === 'manager') return <Navigate to="/manager" replace />;
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
