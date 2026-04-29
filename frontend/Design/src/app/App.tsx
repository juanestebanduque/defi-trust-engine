import { useState } from 'react';
import { Login } from './components/Login';
import { Register } from './components/Register';
import { ForgotPassword } from './components/ForgotPassword';
import { FinancialProfileSetup } from './components/FinancialProfileSetup';
import { DashboardLayout } from './components/DashboardLayout';
import { Dashboard } from './components/Dashboard';
import { Profile } from './components/Profile';
import { TrustScore } from './components/TrustScore';
import { Loans } from './components/Loans';
import { Transactions } from './components/Transactions';
import { Blockchain } from './components/Blockchain';
import { Settings } from './components/Settings';
import { Toaster } from './components/ui/sonner';
import { ThemeProvider } from './context/ThemeContext';

type AuthView = 'login' | 'register' | 'forgot-password';
type DashboardView = 'dashboard' | 'profile' | 'trust-score' | 'loans' | 'transactions' | 'blockchain' | 'settings';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authView, setAuthView] = useState<AuthView>('login');
  const [dashboardView, setDashboardView] = useState<DashboardView>('dashboard');
  const [userEmail, setUserEmail] = useState('');
  const [showFinancialSetup, setShowFinancialSetup] = useState(false);

  const handleLogin = (email: string) => {
    setUserEmail(email);
    setIsAuthenticated(true);
    setDashboardView('dashboard');
  };

  const handleRegister = (email: string, userData: any) => {
    setUserEmail(email);
    setIsAuthenticated(true);
    setShowFinancialSetup(true);
  };

  const handleFinancialSetupComplete = () => {
    setShowFinancialSetup(false);
    setDashboardView('dashboard');
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setUserEmail('');
    setAuthView('login');
  };

  const renderDashboardContent = () => {
    switch (dashboardView) {
      case 'dashboard':
        return <Dashboard onNavigate={setDashboardView} />;
      case 'profile':
        return <Profile />;
      case 'trust-score':
        return <TrustScore />;
      case 'loans':
        return <Loans />;
      case 'transactions':
        return <Transactions />;
      case 'blockchain':
        return <Blockchain />;
      case 'settings':
        return <Settings />;
      default:
        return <Dashboard onNavigate={setDashboardView} />;
    }
  };

  // Show Financial Profile Setup after registration
  if (isAuthenticated && showFinancialSetup) {
    return (
      <ThemeProvider>
        <FinancialProfileSetup onComplete={handleFinancialSetupComplete} />
        <Toaster />
      </ThemeProvider>
    );
  }

  if (!isAuthenticated) {
    return (
      <>
        {authView === 'login' ? (
          <Login
            onLogin={handleLogin}
            onSwitchToRegister={() => setAuthView('register')}
            onForgotPassword={() => setAuthView('forgot-password')}
          />
        ) : authView === 'register' ? (
          <Register
            onRegister={handleRegister}
            onSwitchToLogin={() => setAuthView('login')}
          />
        ) : (
          <ForgotPassword
            onBack={() => setAuthView('login')}
          />
        )}
        <Toaster />
      </>
    );
  }

  return (
    <ThemeProvider>
      <DashboardLayout
        currentView={dashboardView}
        onNavigate={setDashboardView}
        onLogout={handleLogout}
        userEmail={userEmail}
      >
        {renderDashboardContent()}
      </DashboardLayout>
      <Toaster />
    </ThemeProvider>
  );
}
