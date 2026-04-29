import { TrendingUp, DollarSign, Clock, CheckCircle, ArrowUpRight, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Progress } from './ui/progress';
import { useTheme } from '../context/ThemeContext';

interface DashboardProps {
  onNavigate: (view: string) => void;
}

export function Dashboard({ onNavigate }: DashboardProps) {
  const { isDarkMode } = useTheme();
  const stats = {
    trustScore: 785,
    balance: 5420.50,
    activeLoans: 2,
    completedLoans: 8
  };

  const recentActivity = [
    {
      id: 1,
      type: 'payment',
      description: 'Pago recibido - Préstamo #1234',
      amount: '+$500',
      date: '2026-04-20',
      status: 'success'
    },
    {
      id: 2,
      type: 'loan',
      description: 'Nuevo préstamo otorgado',
      amount: '-$2,000',
      date: '2026-04-18',
      status: 'pending'
    },
    {
      id: 3,
      type: 'payment',
      description: 'Pago realizado - Préstamo #1189',
      amount: '-$300',
      date: '2026-04-15',
      status: 'success'
    }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className={`text-3xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
          Bienvenido a TrustFi
        </h1>
        <p className={isDarkMode ? 'text-gray-300' : 'text-gray-600'}>
          Gestiona tus préstamos y construye tu reputación financiera
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className={`cursor-pointer transition-all rounded-2xl p-6 ${
          isDarkMode
            ? 'bg-slate-800 border border-slate-700 hover:bg-slate-700'
            : 'bg-white border border-gray-200 hover:shadow-lg'
        }`} onClick={() => onNavigate('trust-score')}>
          <div className="flex items-center justify-between mb-4">
            <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Trust Score</p>
            <TrendingUp className="w-5 h-5 text-green-500" />
          </div>
          <div className={`text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{stats.trustScore}</div>
          <div className="flex items-center gap-1 mt-2">
            <ArrowUpRight className="w-4 h-4 text-green-500" />
            <span className="text-sm text-green-500">+12% este mes</span>
          </div>
          <div className={`mt-3 h-2 rounded-full overflow-hidden ${isDarkMode ? 'bg-slate-700' : 'bg-gray-200'}`}>
            <div className="h-full bg-gradient-to-r from-green-500 to-green-400" style={{ width: '78.5%' }}></div>
          </div>
        </div>

        <div className={`rounded-2xl p-6 ${
          isDarkMode
            ? 'bg-slate-800 border border-slate-700'
            : 'bg-white border border-gray-200'
        }`}>
          <div className="flex items-center justify-between mb-4">
            <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Balance Disponible</p>
            <DollarSign className="w-5 h-5 text-blue-500" />
          </div>
          <div className={`text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            ${stats.balance.toLocaleString()}
          </div>
          <p className={`text-sm mt-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>USD</p>
        </div>

        <div className={`rounded-2xl p-6 ${
          isDarkMode
            ? 'bg-slate-800 border border-slate-700'
            : 'bg-white border border-gray-200'
        }`}>
          <div className="flex items-center justify-between mb-4">
            <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Préstamos Activos</p>
            <Clock className="w-5 h-5 text-orange-500" />
          </div>
          <div className={`text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{stats.activeLoans}</div>
          <p className={`text-sm mt-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>En curso</p>
        </div>

        <div className={`rounded-2xl p-6 ${
          isDarkMode
            ? 'bg-slate-800 border border-slate-700'
            : 'bg-white border border-gray-200'
        }`}>
          <div className="flex items-center justify-between mb-4">
            <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Préstamos Completados</p>
            <CheckCircle className="w-5 h-5 text-green-500" />
          </div>
          <div className={`text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{stats.completedLoans}</div>
          <p className={`text-sm mt-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Historial limpio</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className={`rounded-2xl p-6 ${
        isDarkMode ? 'bg-slate-800 border border-slate-700' : 'bg-white border border-gray-200'
      }`}>
        <h3 className={`text-lg font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Acciones Rápidas</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Button
            className="h-auto py-6 bg-blue-600 hover:bg-blue-700 shadow-lg font-semibold"
            onClick={() => onNavigate('loans')}
          >
            <div className="text-center">
              <DollarSign className="w-6 h-6 mx-auto mb-2" />
              <div className="font-medium">Solicitar Préstamo</div>
              <div className="text-xs opacity-90 mt-1">Pide dinero prestado</div>
            </div>
          </Button>

          <Button
            className={`h-auto py-6 font-semibold ${
              isDarkMode
                ? 'bg-slate-700 hover:bg-slate-600 border border-slate-600 text-white'
                : 'bg-orange-500 hover:bg-orange-600 text-white'
            }`}
            onClick={() => onNavigate('loans')}
          >
            <div className="text-center">
              <TrendingUp className="w-6 h-6 mx-auto mb-2" />
              <div className="font-medium">Ver Solicitudes</div>
              <div className={`text-xs mt-1 ${isDarkMode ? 'text-gray-400' : 'text-white/90'}`}>Presta a otros</div>
            </div>
          </Button>

          <Button
            className={`h-auto py-6 font-semibold ${
              isDarkMode
                ? 'bg-slate-700 hover:bg-slate-600 border border-slate-600 text-white'
                : 'bg-gray-200 hover:bg-gray-300 border border-gray-300 text-gray-900'
            }`}
            onClick={() => onNavigate('transactions')}
          >
            <div className="text-center">
              <Clock className="w-6 h-6 mx-auto mb-2" />
              <div className="font-medium">Ver Historial</div>
              <div className={`text-xs mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Todas tus transacciones</div>
            </div>
          </Button>
        </div>
      </div>

      {/* Recent Activity */}
      <div className={`rounded-2xl p-6 ${
        isDarkMode ? 'bg-slate-800 border border-slate-700' : 'bg-white border border-gray-200'
      }`}>
        <h3 className={`text-lg font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Actividad Reciente</h3>
        <div className="space-y-4">
          {recentActivity.map((activity) => (
            <div key={activity.id} className={`flex items-center justify-between p-4 rounded-lg ${
              isDarkMode
                ? 'bg-slate-700 border border-slate-600'
                : 'bg-gray-50 border border-gray-200'
            }`}>
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  activity.status === 'success' ? 'bg-green-500/20' : 'bg-orange-500/20'
                }`}>
                  {activity.status === 'success' ? (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-orange-500" />
                  )}
                </div>
                <div>
                  <p className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{activity.description}</p>
                  <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>{activity.date}</p>
                </div>
              </div>
              <div className={`font-semibold ${
                activity.amount.startsWith('+')
                  ? 'text-green-500'
                  : isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>
                {activity.amount}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
