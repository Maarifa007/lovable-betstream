
import React, { useState, useEffect } from 'react';
import AdminLogin from './AdminLogin';

const AdminAuthFlow: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  useEffect(() => {
    // Check if admin is already logged in
    const isLoggedIn = localStorage.getItem('adminLoggedIn') === 'true';
    if (isLoggedIn) {
      setIsAuthenticated(true);
    }
  }, []);
  
  const handleLoginSuccess = () => {
    localStorage.setItem('adminLoggedIn', 'true');
    setIsAuthenticated(true);
  };
  
  const handleLogout = () => {
    localStorage.removeItem('adminLoggedIn');
    setIsAuthenticated(false);
  };

  // Import AdminDashboard dynamically to avoid circular imports
  const AdminDashboard = React.lazy(() => import('./AdminDashboard'));
  
  if (!isAuthenticated) {
    return <AdminLogin onSuccess={handleLoginSuccess} />;
  }
  
  return (
    <div className="min-h-screen bg-background">
      <div className="flex justify-end p-4">
        <button 
          onClick={handleLogout}
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          Logout
        </button>
      </div>
      <React.Suspense fallback={<div>Loading...</div>}>
        <AdminDashboard />
      </React.Suspense>
    </div>
  );
};

export default AdminAuthFlow;
