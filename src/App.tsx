import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LanguageProvider } from './contexts/LanguageContext';
import { DataProvider } from './contexts/DataContext';
import { LicenseProvider } from './contexts/LicenseContext';
import { UserManagementProvider } from './contexts/UserManagementContext';
import { SupplierProvider } from './contexts/SupplierContext';
import SubscriptionAlert from './components/common/SubscriptionAlert';
import CommandPalette from './components/common/CommandPalette';
import ExpirationNotification from './components/auth/ExpirationNotification';
import ExpiredAccountModal from './components/auth/ExpiredAccountModal';
import HomePage from './components/home/HomePage';
import Login from './components/auth/Login';
import Dashboard from './components/dashboard/Dashboard';
import Sidebar from './components/layout/Sidebar';
import Header from './components/layout/Header';
import InvoicesList from './components/invoices/InvoicesList';
import CreateInvoice from './components/invoices/CreateInvoice';
import QuotesList from './components/quotes/QuotesList';
import CreateQuote from './components/quotes/CreateQuote';
import ClientsList from './components/clients/ClientsList';
import ProductsList from './components/products/ProductsList';
import Settings from './components/settings/Settings';
import Reports from './components/reports/Reports';
import LicenseAlert from './components/license/LicenseAlert';
import UpgradePage from './components/license/UpgradePage';
import ExpiryAlert from './components/license/ExpiryAlert';
import ProUpgradeSuccess from './components/license/ProUpgradeSuccess';
import { useLicense } from './contexts/LicenseContext';
import AdminDashboard from './components/admin/AdminDashboard';
import StockManagement from './components/stock/StockManagement';
import HRManagement from './components/hr/HRManagement';
import SupplierManagement from './components/suppliers/SupplierManagement';
import SuppliersSection from './components/suppliers/SuppliersSection';
import AccountManagement from './components/account/AccountManagement';
import ProjectManagement from './components/projects/ProjectManagement';

function AppContent() {
  const { user, isAuthenticated, showExpiryAlert, setShowExpiryAlert, expiredDate, subscriptionStatus } = useAuth();
  const { showSuccessModal, setShowSuccessModal, upgradeExpiryDate } = useLicense();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showUpgradePage, setShowUpgradePage] = useState(false);
  const [showExpirationNotification, setShowExpirationNotification] = useState(false);
  const [showExpiredModal, setShowExpiredModal] = useState(false);
  const [isRenewalFlow, setIsRenewalFlow] = useState(false);
  const [showBlockedUserModal, setShowBlockedUserModal] = useState(false);

  // Gérer les notifications d'expiration
  useEffect(() => {
    if (subscriptionStatus.shouldShowNotification) {
      setShowExpirationNotification(true);
    }
    
    if (subscriptionStatus.isExpired && user?.isAdmin) {
      setShowExpiredModal(true);
    }
    
    // Bloquer les utilisateurs non-admin si l'abonnement de l'entreprise a expiré
    if (user && !user.isAdmin && user.email !== 'admin@facture.ma') {
      const isCompanyProExpired = user.company.subscription !== 'pro' || 
        (user.company.expiryDate && new Date(user.company.expiryDate) < new Date());
      if (isCompanyProExpired) {
        setShowBlockedUserModal(true);
      }
    }
  }, [subscriptionStatus, user]);

  const handleRenewSubscription = () => {
    setShowExpirationNotification(false);
    setIsRenewalFlow(true);
    setShowUpgradePage(true);
  };

  const handleDismissNotification = () => {
    setShowExpirationNotification(false);
    // Masquer pour 24h
    localStorage.setItem('dismissedExpirationNotification', new Date().toISOString());
  };

  // Vérifier si la notification a été masquée récemment
  useEffect(() => {
    const dismissed = localStorage.getItem('dismissedExpirationNotification');
    if (dismissed) {
      const dismissedDate = new Date(dismissed);
      const now = new Date();
      const hoursDiff = (now.getTime() - dismissedDate.getTime()) / (1000 * 60 * 60);
      
      if (hoursDiff < 24) {
        setShowExpirationNotification(false);
      }
    }
  }, []);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-50 to-blue-50">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<Login />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    );
  }

  // Si c'est l'admin de facture.ma, afficher le dashboard admin
  if (user?.email === 'admin@facture.ma') {
    return (
      <div className="min-h-screen bg-gray-50">
        <Routes>
          <Route path="/" element={<AdminDashboard />} />
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="*" element={<Navigate to="/admin/dashboard" replace />} />
        </Routes>
      </div>
    );
  }
  return (
    <>
      {/* Alerte d'abonnement - sticky top */}
      <SubscriptionAlert />
      
      {/* Command Palette */}
      <CommandPalette />
      
      {/* Notification d'expiration proche */}
      {showExpirationNotification && subscriptionStatus.shouldShowNotification && (
        <ExpirationNotification
          daysRemaining={subscriptionStatus.daysRemaining}
          onRenew={handleRenewSubscription}
          onDismiss={handleDismissNotification}
        />
      )}
      
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex transition-colors">
      <LicenseAlert onUpgrade={() => setShowUpgradePage(true)} />
      <Sidebar 
        open={sidebarOpen} 
        setOpen={setSidebarOpen} 
        onUpgrade={() => setShowUpgradePage(true)} 
      />
      <div className={`flex-1 transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-16'} pt-16`}>
        <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
        <main className="p-6 pt-0">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/invoices" element={<InvoicesList />} />
            <Route path="/invoices/create" element={<CreateInvoice />} />
            <Route path="/quotes" element={<QuotesList />} />
            <Route path="/quotes/create" element={<CreateQuote />} />
            <Route path="/clients" element={<ClientsList />} />
            <Route path="/products" element={<ProductsList />} />
            <Route path="/suppliers" element={<SuppliersSection />} />
            <Route path="/stock-management" element={<StockManagement />} />
            <Route path="/supplier-management" element={<SupplierManagement />} />
            <Route path="/hr-management" element={<HRManagement />} />
            <Route path="/project-management" element={<ProjectManagement />} />
            <Route path="/account-management" element={<AccountManagement />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </main>
      </div>
      
      
      {showUpgradePage && (
        <UpgradePage 
          onClose={() => {
            setShowUpgradePage(false);
            setIsRenewalFlow(false);
          }} 
          isRenewal={isRenewalFlow}
        />
      )}
      
      {showExpiryAlert && expiredDate && (
        <ExpiryAlert
          isOpen={showExpiryAlert}
          onRenew={() => {
            setShowExpiryAlert(false);
            setIsRenewalFlow(true);
            setShowUpgradePage(true);
          }}
          onLater={() => setShowExpiryAlert(false)}
          expiryDate={expiredDate}
        />
      )}
      
      {showSuccessModal && upgradeExpiryDate && (
        <ProUpgradeSuccess
          isOpen={showSuccessModal}
          onClose={() => setShowSuccessModal(false)}
          expiryDate={upgradeExpiryDate}
        />
      )}
      
      {/* Modal d'abonnement expiré pour admin */}
      {showExpiredModal && subscriptionStatus.isExpired && user?.isAdmin && (
        <ExpiredAccountModal
          isOpen={showExpiredModal}
          onClose={() => setShowExpiredModal(false)}
          isAdmin={true}
          expiryDate={subscriptionStatus.expiryDate || ''}
        />
      )}
      
      {/* Modal de blocage pour utilisateurs non-admin */}
      {showBlockedUserModal && user && !user.isAdmin && (
        <ExpiredAccountModal
          isOpen={showBlockedUserModal}
          onClose={() => setShowBlockedUserModal(false)}
          isAdmin={false}
          expiryDate={user.company.expiryDate || ''}
        />
      )}
    </div>
    </>
  );
}

function App() {
  return (
    <BrowserRouter>
      <LanguageProvider>
        <AuthProvider>
          <UserManagementProvider>
            <SupplierProvider>
              <DataProvider>
                <LicenseProvider>
                  <AppContent />
                </LicenseProvider>
              </DataProvider>
            </SupplierProvider>
          </UserManagementProvider>
        </AuthProvider>
      </LanguageProvider>
    </BrowserRouter>
  );
}

export default App;