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
  userEmail
}: DashboardLayoutProps) {
  const { isDarkMode } = useTheme();

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-slate-900' : 'bg-gray-50'}`}>
      {/* Sidebar */}
      <aside className={`fixed left-0 top-0 h-full w-64 ${
        isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'
      } border-r flex flex-col z-20`}>
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
      <main className={`ml-64 p-8 ${isDarkMode ? 'bg-slate-900' : 'bg-gray-50'}`}>
        {children}
      </main>
    </div>
  );
}
