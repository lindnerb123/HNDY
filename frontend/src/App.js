import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Home from './pages/Home';
import NewRequest from './pages/NewRequest';
import CustomerPortal from './pages/CustomerPortal';
import AdminPanel from './pages/AdminPanel';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';
import SetPassword from './pages/auth/SetPassword';
import ContractorRegister from './pages/contractor/ContractorRegister';
import ContractorLogin from './pages/contractor/ContractorLogin';
import VettingDashboard from './pages/contractor/VettingDashboard';
import GatekeeperPayment from './pages/contractor/GatekeeperPayment';
import PWAInstallPrompt from './components/ui/PWAInstallPrompt';
import './index.css';

function App() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      deferredPrompt.userChoice.then((choiceResult) => {
        if (choiceResult.outcome === 'accepted') {
          console.log('User accepted the install prompt');
        } else {
          console.log('User dismissed the install prompt');
        }
        setDeferredPrompt(null);
      });
    }
  };

  return (
    <BrowserRouter>
      {/* Global PWA Prompt */}
      {deferredPrompt && (
        <PWAInstallPrompt
          onInstall={handleInstallClick}
          onDismiss={() => setDeferredPrompt(null)}
        />
      )}

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/new-request" element={<NewRequest />} />
        <Route path="/customer-portal" element={<CustomerPortal />} />
        <Route path="/admin" element={<AdminPanel />} />

        {/* Auth Routes */}
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/set-password" element={<SetPassword />} />

        {/* Contractor Routes */}
        <Route path="/contractor/register" element={<ContractorRegister />} />
        <Route path="/contractor/login" element={<ContractorLogin />} />
        <Route path="/contractor/dashboard" element={<VettingDashboard />} />
        <Route path="/contractor/payment" element={<GatekeeperPayment />} />


        {/* Legacy redirects if needed */}
        <Route path="/login" element={<Navigate to="/customer-portal" replace />} />

        {/* 404 - Redirect to Home */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;