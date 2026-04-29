import { ReactNode } from 'react';
import {
  LayoutDashboard,
  User,
  TrendingUp,
  DollarSign,
  History,
  Shield,
  LogOut,
  Menu,
  Settings
} from 'lucide-react';
import { Button } from './ui/button';
import { useTheme } from '../context/ThemeContext';

interface DashboardLayoutProps {
  children: ReactNode;
  currentView: string;
  onNavigate: (view: string) => void;
  onLogout: () => void;
  userEmail: string;
  profileLocked: boolean;
  onForceProfile: () => void;
}

const menuItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'profile', label: 'Perfil Financiero', icon: User },
  { id: 'trust-score', label: 'Trust Score', icon: TrendingUp },
  { id: 'loans', label: 'Préstamos', icon: DollarSign },
  { id: 'transactions', label: 'Transacciones', icon: History },
  { id: 'blockchain', label: 'Blockchain', icon: Shield },
  { id: 'settings', label: 'Configuración', icon: Settings },
];

export function DashboardLayout({
  children,
  currentView,
  onNavigate,
  onLogout,
  userEmail,
  profileLocked,
  onForceProfile
}: DashboardLayoutProps) {
  const { isDarkMode } = useTheme();

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-slate-900' : 'bg-gray-50'}`}>
      {/* Sidebar */}
      <aside className={`fixed left-0 top-0 h-full w-64 ${
        isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'
      } border-r flex flex-col z-30`}>
        <div className={`p-6 ${isDarkMode ? 'border-white/10' : 'border-gray-200'} border-b`}>
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-lg ${
              isDarkMode ? 'bg-gradient-to-br from-blue-500 to-purple-600' : 'bg-gradient-to-br from-blue-600 to-orange-500'
            }`}>
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>TrustFi</h1>
              <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>DeFi Lending</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;

            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                  isActive
                    ? isDarkMode
                      ? 'bg-blue-600 text-white shadow-lg'
                      : 'bg-blue-600 text-white shadow-lg'
                    : isDarkMode
                      ? 'text-gray-300 hover:bg-white/5 hover:text-white'
                      : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-sm font-medium">{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className={`p-4 ${isDarkMode ? 'border-white/10' : 'border-gray-200'} border-t`}>
          <div className="flex items-center gap-3 mb-3">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              isDarkMode ? 'bg-blue-600' : 'bg-blue-500'
            }`}>
              <User className="w-4 h-4 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-medium truncate ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{userEmail}</p>
            </div>
          </div>
          <Button
            className="w-full bg-red-600 hover:bg-red-700 text-white shadow-lg font-semibold transition-all"
            size="sm"
            onClick={onLogout}
          >
            <LogOut className="w-4 h-4 mr-2" />
            Cerrar Sesión
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className={`ml-64 p-8 relative ${
        profileLocked && currentView !== 'profile' && currentView !== 'settings' ? 'h-screen overflow-hidden' : 'min-h-[100vh]'
      } ${isDarkMode ? 'bg-slate-900' : 'bg-gray-50'}`}>
        {profileLocked && currentView !== 'profile' && currentView !== 'settings' && (
          <>
            <div className={`absolute inset-0 z-10 backdrop-blur-md ${isDarkMode ? 'bg-slate-900/60' : 'bg-white/40'}`} />
            <div className="absolute inset-0 z-20 flex items-center justify-center p-6">
              <div className={`max-w-md w-full border rounded-xl shadow-2xl p-8 text-center relative overflow-hidden pointer-events-auto ${
                isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'
              }`}>
                <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${
                  isDarkMode ? 'bg-blue-600/20' : 'bg-blue-50'
                }`}>
                  <Shield className={`w-8 h-8 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                </div>
                <h3 className={`text-2xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Completar Perfil</h3>
                <p className={`mb-6 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Debes llenar la información de tu perfil financiero (teléfono y blockchain Hash ID) para usar la aplicación.
                </p>
                <Button className="w-full bg-blue-600 hover:bg-blue-700 h-12 text-lg font-medium" onClick={onForceProfile}>
                  Ir a Perfil Financiero
                </Button>
              </div>
            </div>
          </>
        )}
        <div className={profileLocked && currentView !== 'profile' && currentView !== 'settings' ? 'pointer-events-none select-none' : ''}>
          {children}
        </div>
      </main>
    </div>
  );
}
