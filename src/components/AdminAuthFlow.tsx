
import React, { useState, useEffect } from 'react';
import AdminLogin from './AdminLogin';
import TwoFactorAuth from './TwoFactorAuth';
import AdminDashboard from './AdminDashboard';

enum AuthStep {
  Login,
  TwoFactor,
  Setup2FA,
  Dashboard
}

const AdminAuthFlow: React.FC = () => {
  const [authStep, setAuthStep] = useState<AuthStep>(AuthStep.Login);
  
  useEffect(() => {
    // For demo purposes, check if admin is already logged in
    const isLoggedIn = localStorage.getItem('adminLoggedIn') === 'true';
    if (isLoggedIn) {
      setAuthStep(AuthStep.Dashboard);
      return;
    }
    
    // Check if we're in the middle of the 2FA step
    const currentStep = localStorage.getItem('adminLoginStep');
    if (currentStep === 'twoFactor') {
      setAuthStep(AuthStep.TwoFactor);
      return;
    }
    
    // Check if admin has 2FA set up
    const has2FA = localStorage.getItem('adminHas2FA') === 'true';
    if (currentStep === 'login' && !has2FA) {
      setAuthStep(AuthStep.Setup2FA);
      return;
    }
  }, []);
  
  const handleLoginSuccess = () => {
    const has2FA = localStorage.getItem('adminHas2FA') === 'true';
    if (has2FA) {
      setAuthStep(AuthStep.TwoFactor);
    } else {
      setAuthStep(AuthStep.Setup2FA);
    }
  };
  
  const handle2FAVerified = () => {
    setAuthStep(AuthStep.Dashboard);
  };
  
  const handleSetup2FACompleted = () => {
    setAuthStep(AuthStep.Dashboard);
  };
  
  const handleLogout = () => {
    localStorage.removeItem('adminLoggedIn');
    localStorage.removeItem('adminLoginStep');
    setAuthStep(AuthStep.Login);
  };
  
  return (
    <div className="container mx-auto p-4">
      {authStep === AuthStep.Login && (
        <AdminLogin onSuccess={handleLoginSuccess} />
      )}
      
      {authStep === AuthStep.TwoFactor && (
        <TwoFactorAuth onVerified={handle2FAVerified} />
      )}
      
      {authStep === AuthStep.Setup2FA && (
        <TwoFactorAuth onVerified={handleSetup2FACompleted} setupMode={true} />
      )}
      
      {authStep === AuthStep.Dashboard && (
        <div>
          <div className="flex justify-end mb-4">
            <button 
              onClick={handleLogout}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Logout
            </button>
          </div>
          <AdminDashboard />
        </div>
      )}
    </div>
  );
};

export default AdminAuthFlow;
