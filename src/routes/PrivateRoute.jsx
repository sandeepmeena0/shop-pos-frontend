import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { usePOS } from '../context/POSContext';

export function PrivateRoute({ children, allowedRoles }) {
  const { currentUser } = usePOS();
  const location = useLocation();

  if (!currentUser) {
    // Not logged in, redirect to login page with the return url
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(currentUser.role)) {
    // Logged in, but does not have the required role
    return <Navigate to="/pos" replace />;
  }

  // Authorized
  return children;
}
