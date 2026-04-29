import { useEffect, useState } from 'react';
import { Badge } from './ui/badge';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import {
  CheckCircle,
  ArrowUpRight,
  ArrowDownRight,
  Search,
  RefreshCw,
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { transactionService, type TransactionResponse } from '../services/transactionService';
import { getUserId } from '../services/session';

export function Transactions() {
  const { isDarkMode } = useTheme();
  const [filterType, setFilterType] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [transactions, setTransactions] = useState<TransactionResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchTransactions = () => {
    const userId = getUserId();
    if (!userId) {
      setError('No se encontró sesión activa.');
      setLoading(false);
      return;
    }
    setLoading(true);
    transactionService.getByUser(userId)
      .then(setTransactions)
      .catch(() => setError('No se pudieron cargar las transacciones.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchTransactions(); }, []);

  const typeLabel = (type: string) => {
    switch (type) {
      case 'DEPOSIT': return 'Depósito';
      case 'WITHDRAWAL': return 'Retiro';
      case 'LOAN_PAYMENT': return 'Pago de préstamo';
      case 'LOAN_FUNDING': return 'Financiamiento otorgado';
      case 'LOAN_RECEIPT': return 'Préstamo recibido';
      default: return type;
    }
  };

  const isIncome = (type: string) => type === 'DEPOSIT' || type === 'LOAN_RECEIPT';

  const filteredTransactions = transactions.filter(tx => {
    const matchesType =
      filterType === 'all' ||
      (filterType === 'deposit' && tx.type === 'DEPOSIT') ||
      (filterType === 'withdrawal' && tx.type === 'WITHDRAWAL') ||
      (filterType === 'payment' && tx.type === 'LOAN_PAYMENT');

    const matchesSearch =
      searchTerm === '' ||
      (tx.description ?? '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      tx.transactionHash.toLowerCase().includes(searchTerm.toLowerCase()) ||
      String(tx.id).includes(searchTerm);

    return matchesType && matchesSearch;
  });

  const totalIncome = transactions
    .filter(tx => tx.type === 'DEPOSIT')
    .reduce((sum, tx) => sum + Number(tx.amount), 0);

  const totalExpense = transactions
    .filter(tx => tx.type !== 'DEPOSIT')
    .reduce((sum, tx) => sum + Number(tx.amount), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className={`text-3xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            Historial de Transacciones
          </h1>
          <p className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>
            Registro completo de todas tus operaciones
          </p>
        </div>
        <button
          onClick={fetchTransactions}
          className={`p-2 rounded-lg transition-colors ${
            isDarkMode ? 'hover:bg-slate-700 text-gray-400' : 'hover:bg-gray-100 text-gray-600'
          }`}
          title="Recargar"
        >
          <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className={`rounded-2xl p-6 ${isDarkMode ? 'bg-slate-800 border border-slate-700' : 'bg-white border border-gray-200'}`}>
          <p className={`text-sm mb-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Total Recibido</p>
          <div className={`text-2xl font-bold ${isDarkMode ? 'text-green-400' : 'text-green-600'}`}>
            +${totalIncome.toLocaleString()}
          </div>
        </div>
        <div className={`rounded-2xl p-6 ${isDarkMode ? 'bg-slate-800 border border-slate-700' : 'bg-white border border-gray-200'}`}>
          <p className={`text-sm mb-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Total Enviado</p>
          <div className={`text-2xl font-bold ${isDarkMode ? 'text-red-400' : 'text-red-600'}`}>
            -${totalExpense.toLocaleString()}
          </div>
        </div>
        <div className={`rounded-2xl p-6 ${isDarkMode ? 'bg-slate-800 border border-slate-700' : 'bg-white border border-gray-200'}`}>
          <p className={`text-sm mb-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Transacciones Totales</p>
          <div className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            {transactions.length}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className={`rounded-2xl p-6 ${isDarkMode ? 'bg-slate-800 border border-slate-700' : 'bg-white border border-gray-200'}`}>
        <h3 className={`text-lg font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Filtros</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="search" className={isDarkMode ? 'text-gray-300' : 'text-gray-700'}>Buscar</Label>
            <div className="relative">
              <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`} />
              <input
                id="search"
                placeholder="Descripción, hash o ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`w-full pl-9 pr-4 py-2.5 rounded-lg outline-none transition-all ${
                  isDarkMode
                    ? 'bg-slate-700 border border-slate-600 text-white placeholder:text-gray-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30'
                    : 'bg-gray-50 border border-gray-300 text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200'
                }`}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="type" className={isDarkMode ? 'text-gray-300' : 'text-gray-700'}>Tipo</Label>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger id="type" className={isDarkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-gray-50 border-gray-300 text-gray-900'}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent className={isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="deposit">Depósitos</SelectItem>
                <SelectItem value="payment">Pagos de préstamo</SelectItem>
                <SelectItem value="withdrawal">Retiros</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Transaction list */}
      <div className={`rounded-2xl p-6 ${isDarkMode ? 'bg-slate-800 border border-slate-700' : 'bg-white border border-gray-200'}`}>
        <h3 className={`text-lg font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
          Transacciones ({filteredTransactions.length})
        </h3>

        {loading && (
          <p className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>Cargando transacciones...</p>
        )}
        {!loading && error && (
          <p className={isDarkMode ? 'text-red-400' : 'text-red-600'}>{error}</p>
        )}
        {!loading && !error && filteredTransactions.length === 0 && (
          <p className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>No hay transacciones que coincidan.</p>
        )}

        <div className="space-y-3">
          {filteredTransactions.map((tx) => (
            <div key={tx.id} className={`rounded-xl p-4 ${
              isDarkMode ? 'bg-slate-700 border border-slate-600' : 'bg-gray-50 border border-gray-200'
            }`}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    isDarkMode ? 'bg-slate-600' : 'bg-gray-200'
                  }`}>
                    {isIncome(tx.type)
                      ? <ArrowDownRight className="w-4 h-4 text-green-400" />
                      : <ArrowUpRight className="w-4 h-4 text-red-400" />
                    }
                  </div>
                  <div>
                    <p className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      {tx.description || typeLabel(tx.type)}
                    </p>
                    <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      {new Date(tx.createdAt).toLocaleDateString('es-CO', {
                        year: 'numeric', month: 'short', day: 'numeric'
                      })}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`text-lg font-bold ${
                    isIncome(tx.type)
                      ? isDarkMode ? 'text-green-400' : 'text-green-600'
                      : isDarkMode ? 'text-red-400' : 'text-red-600'
                  }`}>
                    {isIncome(tx.type) ? '+' : '-'}${Number(tx.amount).toLocaleString()}
                  </div>
                  <Badge className={`border ${isDarkMode ? 'bg-green-600/20 text-green-400 border-green-500/30' : 'bg-green-100 text-green-700 border-green-200'}`}>
                    <CheckCircle className="w-3 h-3 mr-1" />
                    {typeLabel(tx.type)}
                  </Badge>
                </div>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>ID: {tx.id}</span>
                <code className={`px-2 py-1 rounded text-xs font-mono truncate max-w-xs ${
                  isDarkMode ? 'bg-slate-600 text-gray-300' : 'bg-gray-200 text-gray-700'
                }`}>
                  {tx.transactionHash.slice(0, 18)}...
                </code>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
