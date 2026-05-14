import { useEffect, useState } from 'react';
import { TrendingUp, DollarSign, Clock, CheckCircle, ArrowUpRight, AlertCircle } from 'lucide-react';
import { Button } from './ui/button';
import { useTheme } from '../context/ThemeContext';
import { trustScoreService, type MyTrustScoreResponse } from '../services/trustScoreService';
import { userService, type UserProfileResponse } from '../services/userService';
import { transactionService, type TransactionResponse } from '../services/transactionService';
import { loanService, type LoanDTO } from '../services/loanService';
import { getUserId } from '../services/session';

interface DashboardProps {
  onNavigate: (view: string) => void;
}

export function Dashboard({ onNavigate }: DashboardProps) {
  const { isDarkMode } = useTheme();

  const [trustScore, setTrustScore] = useState<MyTrustScoreResponse | null>(null);
  const [profile, setProfile] = useState<UserProfileResponse | null>(null);
  const [transactions, setTransactions] = useState<TransactionResponse[]>([]);
  const [loans, setLoans] = useState<LoanDTO[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.allSettled([
      trustScoreService.getMyScore(),
      userService.getMyProfile(),
      transactionService.getHistory({ page: 0, size: 3 }),
      loanService.getMyLoans(),
    ]).then(([scoreRes, profileRes, txRes, loansRes]) => {
      if (scoreRes.status === 'fulfilled') setTrustScore(scoreRes.value);
      if (profileRes.status === 'fulfilled') setProfile(profileRes.value);
      if (txRes.status === 'fulfilled') {
        const historyData = (txRes.value as any);
        setTransactions((historyData.transactions?.content as TransactionResponse[]) || []);
      }
      if (loansRes.status === 'fulfilled') setLoans(loansRes.value as LoanDTO[]);
    }).finally(() => setLoading(false));
  }, []);

  const displayScore = trustScore ? Math.round(trustScore.scoreValue * 10) : 0;
  const activeLoans = loans.filter(l => l.status === 'ACTIVE' || l.status === 'PENDING').length;
  const completedLoans = loans.filter(l => l.status === 'PAID').length;
  const currentDebt = profile ? Number(profile.currentDebt) : 0;
  const scorePercent = trustScore ? trustScore.scoreValue : 0;

  const txTypeLabel = (type: string): string => {
    switch (type) {
      case 'DEPOSIT': return 'Depósito';
      case 'WITHDRAWAL': return 'Retiro';
      case 'LOAN_PAYMENT': return 'Pago de préstamo';
      default: return type;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className={`text-3xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
          Bienvenido{profile?.fullName ? `, ${profile.fullName.split(' ')[0]}` : ''} a TrustFi
        </h1>
        <p className={isDarkMode ? 'text-gray-300' : 'text-gray-600'}>
          Gestiona tus préstamos y construye tu reputación financiera
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div
          className={`cursor-pointer transition-all rounded-2xl p-6 ${
            isDarkMode
              ? 'bg-slate-800 border border-slate-700 hover:bg-slate-700'
              : 'bg-white border border-gray-200 hover:shadow-lg'
          }`}
          onClick={() => onNavigate('trust-score')}
        >
          <div className="flex items-center justify-between mb-4">
            <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Trust Score</p>
            <TrendingUp className="w-5 h-5 text-green-500" />
          </div>
          <div className={`text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            {loading ? '—' : displayScore}
          </div>
          {trustScore && (
            <div className="flex items-center gap-1 mt-2">
              <ArrowUpRight className="w-4 h-4 text-green-500" />
              <span className="text-sm text-green-500">{trustScore.level}</span>
            </div>
          )}
          <div className={`mt-3 h-2 rounded-full overflow-hidden ${isDarkMode ? 'bg-slate-700' : 'bg-gray-200'}`}>
            <div
              className="h-full bg-gradient-to-r from-green-500 to-green-400"
              style={{ width: `${scorePercent}%` }}
            />
          </div>
        </div>

        <div className={`rounded-2xl p-6 ${
          isDarkMode ? 'bg-slate-800 border border-slate-700' : 'bg-white border border-gray-200'
        }`}>
          <div className="flex items-center justify-between mb-4">
            <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Deuda Actual</p>
            <DollarSign className="w-5 h-5 text-blue-500" />
          </div>
          <div className={`text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            {loading ? '—' : `$${currentDebt.toLocaleString()}`}
          </div>
          <p className={`text-sm mt-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>USD pendiente</p>
        </div>

        <div className={`rounded-2xl p-6 ${
          isDarkMode ? 'bg-slate-800 border border-slate-700' : 'bg-white border border-gray-200'
        }`}>
          <div className="flex items-center justify-between mb-4">
            <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Préstamos Activos</p>
            <Clock className="w-5 h-5 text-orange-500" />
          </div>
          <div className={`text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            {loading ? '—' : activeLoans}
          </div>
          <p className={`text-sm mt-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>En curso</p>
        </div>

        <div className={`rounded-2xl p-6 ${
          isDarkMode ? 'bg-slate-800 border border-slate-700' : 'bg-white border border-gray-200'
        }`}>
          <div className="flex items-center justify-between mb-4">
            <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Préstamos Completados</p>
            <CheckCircle className="w-5 h-5 text-green-500" />
          </div>
          <div className={`text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            {loading ? '—' : completedLoans}
          </div>
          <p className={`text-sm mt-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Historial</p>
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
        {loading ? (
          <p className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>Cargando actividad...</p>
        ) : transactions.length === 0 ? (
          <p className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>Sin transacciones recientes.</p>
        ) : (
          <div className="space-y-4">
            {transactions.map((tx) => (
              <div
                key={tx.id}
                className={`flex items-center justify-between p-4 rounded-lg ${
                  isDarkMode ? 'bg-slate-700 border border-slate-600' : 'bg-gray-50 border border-gray-200'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    tx.type === 'DEPOSIT' ? 'bg-green-500/20' : 'bg-orange-500/20'
                  }`}>
                    {tx.type === 'DEPOSIT' ? (
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-orange-500" />
                    )}
                  </div>
                  <div>
                    <p className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      {tx.description || txTypeLabel(tx.type)}
                    </p>
                    <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      {new Date(tx.createdAt).toLocaleDateString('es-CO')}
                    </p>
                  </div>
                </div>
                <div className={`font-semibold ${
                  tx.type === 'DEPOSIT' ? 'text-green-500' : isDarkMode ? 'text-white' : 'text-gray-900'
                }`}>
                  {tx.type === 'DEPOSIT' ? '+' : '-'}${Number(tx.amount).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
