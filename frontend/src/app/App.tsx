import { useEffect, useState } from 'react';
import { Login } from './components/Login';
import { Register } from './components/Register';
import { ForgotPassword } from './components/ForgotPassword';
import { DashboardLayout } from './components/DashboardLayout';
import { Dashboard } from './components/Dashboard';
import { Profile } from './components/Profile';
import { TrustScore } from './components/TrustScore';
import { Loans } from './components/Loans';
import { Transactions } from './components/Transactions';
import { Blockchain } from './components/Blockchain';
import { Toaster } from './components/ui/sonner';
import { authService } from './services/authService';
import { clearSession, getEmail, getRole, getToken, saveSession, saveProfileData } from './services/session';
import { userService } from './services/userService';
import { ThemeProvider } from './context/ThemeContext';
import { Settings } from './components/Settings';
import { AdminPanel } from './components/AdminPanel';
import { toast } from 'sonner';

type AuthView = 'login' | 'register' | 'forgot-password';
type DashboardView = 'dashboard' | 'profile' | 'trust-score' | 'loans' | 'transactions' | 'blockchain' | 'settings' | 'admin';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authView, setAuthView] = useState<AuthView>('login');
  const [dashboardView, setDashboardView] = useState<DashboardView>('dashboard');
  const [userEmail, setUserEmail] = useState(getEmail());
  const [userRole, setUserRole] = useState(getRole());
  const [authLoading, setAuthLoading] = useState(true);
  const [profileLocked, setProfileLocked] = useState(false);

  const fetchAndSetProfile = async (isInitialAuth = false) => {
    let profileData = { firstName: '', lastName: '', phone: '', address: '', blockchainHashId: '' };
    try {
      const profile = await userService.getMyProfile();
      const parts = (profile.fullName || '').trim().split(/\s+/);
      const firstName = parts[0] || '';
      const lastName = parts.slice(1).join(' ') || '';

      profileData = {
        firstName,
        lastName,
        phone: profile.phone || '',
        address: profile.address || '',
        blockchainHashId: profile.blockchainHashId || '',
      };
      saveProfileData(profileData);
    } catch (e) {
      console.error('Error fetching profile, fallando a datos locales si existen:', e);
      // Usar lo que se haya guardado en el login/registro
      const stored = localStorage.getItem('trustfi_profile');
      if (stored) {
        try {
          profileData = JSON.parse(stored);
        } catch {
          // ignorar
        }
      }
    }

    const locked = !profileData.phone || !profileData.blockchainHashId;
    setProfileLocked(locked);

    if (isInitialAuth) {
      if (locked) {
        setDashboardView('profile');
        toast.warning('Debes completar teléfono y blockchain hash para usar la app.');
      } else {
        setDashboardView('dashboard');
      }
    }
  };

  const refreshProfileLock = async () => {
    await fetchAndSetProfile(false);
  };

  useEffect(() => {
    const bootstrapSession = async () => {
      const token = getToken();
      if (!token) {
        setAuthLoading(false);
        return;
      }

      try {
        const me = await authService.getMe();
        saveSession(me);
        setUserEmail(me.email);
        setUserRole(me.role);
        if (me.role === 'ADMIN') {
          setDashboardView('admin');
        } else {
          await fetchAndSetProfile(true);
        }
        setIsAuthenticated(true);
      } catch {
        clearSession();
        setIsAuthenticated(false);
        setAuthView('login');
      } finally {
        setAuthLoading(false);
      }
    };

    const onAuthExpired = () => {
      clearSession();
      setIsAuthenticated(false);
      setUserEmail('');
      setAuthView('login');
      toast.error('Tu sesión expiró, inicia sesión nuevamente.');
    };

    void bootstrapSession();
    window.addEventListener('auth:expired', onAuthExpired);
    return () => window.removeEventListener('auth:expired', onAuthExpired);
  }, []);

  const handleLogin = async () => {
    const role = getRole();
    setUserEmail(getEmail());
    setUserRole(role);
    if (role === 'ADMIN') {
      setDashboardView('admin');
    } else {
      await fetchAndSetProfile(true);
    }
    setIsAuthenticated(true);
  };

  const handleRegister = async () => {
    setUserEmail(getEmail());
    setUserRole(getRole());
    await fetchAndSetProfile(true);
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setUserEmail('');
    setUserRole('');
    setAuthView('login');
    clearSession();
    setProfileLocked(false);
  };

  const handleNavigate = (view: string) => {
    setDashboardView(view as DashboardView);
  };

  if (authLoading) {
    return (
      <ThemeProvider>
        <div className="min-h-screen flex items-center justify-center bg-gray-50 text-gray-600">
          Validando sesión...
        </div>
        <Toaster />
      </ThemeProvider>
    );
  }

  const renderDashboardContent = () => {
    switch (dashboardView) {
      case 'dashboard':
        return <Dashboard onNavigate={handleNavigate} />;
      case 'profile':
        return <Profile onProfileUpdated={refreshProfileLock} />;
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
      case 'admin':
        return <AdminPanel />;
      default:
        return <Dashboard onNavigate={handleNavigate} />;
    }
  };

  if (!isAuthenticated) {
    return (
      <ThemeProvider>
        {authView === 'login' ? (
          <Login
            onLogin={handleLogin}
            onSwitchToRegister={() => setAuthView('register')}
            onSwitchToForgotPassword={() => setAuthView('forgot-password')}
          />
        ) : authView === 'register' ? (
          <Register
            onRegister={handleRegister}
            onSwitchToLogin={() => setAuthView('login')}
          />
        ) : (
          <ForgotPassword onSwitchToLogin={() => setAuthView('login')} />
        )}
        <Toaster />
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider>
      <DashboardLayout
        currentView={dashboardView}
        onNavigate={handleNavigate}
        onLogout={handleLogout}
        userEmail={userEmail}
        userRole={userRole}
        profileLocked={profileLocked}
        onForceProfile={() => setDashboardView('profile')}
      >
        {renderDashboardContent()}
      </DashboardLayout>
      <Toaster />
    </ThemeProvider>
  );
}
