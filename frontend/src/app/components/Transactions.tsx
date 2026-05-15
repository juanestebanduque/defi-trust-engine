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
  ChevronLeft,
  ChevronRight,
  X,
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { transactionService, type TransactionResponse } from '../services/transactionService';

const PAGE_SIZE = 10;

export function Transactions() {
  const { isDarkMode } = useTheme();
  const [filterType, setFilterType] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [transactions, setTransactions] = useState<TransactionResponse[]>([]);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedTx, setSelectedTx] = useState<TransactionResponse | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const fetchTransactions = (page = 0) => {
    setLoading(true);
    setError('');
    transactionService.getMyTransactions(page, PAGE_SIZE)
      .then((data) => {
        setTransactions(data.content);
        setTotalElements(data.totalElements);
        setTotalPages(data.totalPages);
        setCurrentPage(data.number);
      })
      .catch(() => setError('No se pudieron cargar las transacciones.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchTransactions(0); }, []);

  const openDetail = (tx: TransactionResponse) => {
    setSelectedTx(tx);
    setDetailLoading(true);
    transactionService.getMyTransactionById(tx.id)
      .then((full) => setSelectedTx(full))
      .catch(() => {/* keep the list data already set */})
      .finally(() => setDetailLoading(false));
  };

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
          onClick={() => fetchTransactions(currentPage)}
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
          <p className={`text-sm mb-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Total Recibido (página)</p>
          <div className={`text-2xl font-bold ${isDarkMode ? 'text-green-400' : 'text-green-600'}`}>
            +${totalIncome.toLocaleString()}
          </div>
        </div>
        <div className={`rounded-2xl p-6 ${isDarkMode ? 'bg-slate-800 border border-slate-700' : 'bg-white border border-gray-200'}`}>
          <p className={`text-sm mb-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Total Enviado (página)</p>
          <div className={`text-2xl font-bold ${isDarkMode ? 'text-red-400' : 'text-red-600'}`}>
            -${totalExpense.toLocaleString()}
          </div>
        </div>
        <div className={`rounded-2xl p-6 ${isDarkMode ? 'bg-slate-800 border border-slate-700' : 'bg-white border border-gray-200'}`}>
          <p className={`text-sm mb-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Transacciones Totales</p>
          <div className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            {totalElements}
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
          Transacciones ({filteredTransactions.length} en vista · {totalElements} total)
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
            <button
              key={tx.id}
              onClick={() => openDetail(tx)}
              className={`w-full text-left rounded-xl p-4 transition-colors cursor-pointer ${
                isDarkMode
                  ? 'bg-slate-700 border border-slate-600 hover:bg-slate-600'
                  : 'bg-gray-50 border border-gray-200 hover:bg-gray-100'
              }`}
            >
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
                        year: 'numeric', month: 'short', day: 'numeric',
                        hour: '2-digit', minute: '2-digit',
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
            </button>
          ))}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-6">
            <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Página {currentPage + 1} de {totalPages}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => fetchTransactions(currentPage - 1)}
                disabled={currentPage === 0}
                className={`p-2 rounded-lg transition-colors disabled:opacity-40 ${
                  isDarkMode ? 'hover:bg-slate-700 text-gray-300' : 'hover:bg-gray-100 text-gray-600'
                }`}
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => fetchTransactions(currentPage + 1)}
                disabled={currentPage >= totalPages - 1}
                className={`p-2 rounded-lg transition-colors disabled:opacity-40 ${
                  isDarkMode ? 'hover:bg-slate-700 text-gray-300' : 'hover:bg-gray-100 text-gray-600'
                }`}
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Detail modal */}
      {selectedTx && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={() => setSelectedTx(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className={`relative w-full max-w-md mx-4 rounded-2xl p-6 shadow-2xl ${
              isDarkMode ? 'bg-slate-800 border border-slate-700' : 'bg-white border border-gray-200'
            }`}
          >
            <button
              onClick={() => setSelectedTx(null)}
              className={`absolute top-4 right-4 p-1 rounded-lg ${
                isDarkMode ? 'hover:bg-slate-700 text-gray-400' : 'hover:bg-gray-100 text-gray-500'
              }`}
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className={`text-xl font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Detalle de Transacción
            </h2>

            {detailLoading ? (
              <p className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>Cargando detalle...</p>
            ) : (
              <div className="space-y-4">
                <div className={`flex items-center gap-3 p-4 rounded-xl ${isDarkMode ? 'bg-slate-700' : 'bg-gray-50'}`}>
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${isDarkMode ? 'bg-slate-600' : 'bg-gray-200'}`}>
                    {isIncome(selectedTx.type)
                      ? <ArrowDownRight className="w-6 h-6 text-green-400" />
                      : <ArrowUpRight className="w-6 h-6 text-red-400" />
                    }
                  </div>
                  <div>
                    <p className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      {typeLabel(selectedTx.type)}
                    </p>
                    <p className={`text-2xl font-bold ${
                      isIncome(selectedTx.type)
                        ? isDarkMode ? 'text-green-400' : 'text-green-600'
                        : isDarkMode ? 'text-red-400' : 'text-red-600'
                    }`}>
                      {isIncome(selectedTx.type) ? '+' : '-'}${Number(selectedTx.amount).toLocaleString()}
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  <DetailRow label="ID" value={String(selectedTx.id)} isDark={isDarkMode} />
                  <DetailRow
                    label="Fecha"
                    value={new Date(selectedTx.createdAt).toLocaleString('es-CO', {
                      year: 'numeric', month: 'long', day: 'numeric',
                      hour: '2-digit', minute: '2-digit', second: '2-digit',
                    })}
                    isDark={isDarkMode}
                  />
                  {selectedTx.description && (
                    <DetailRow label="Descripción" value={selectedTx.description} isDark={isDarkMode} />
                  )}
                  <div>
                    <p className={`text-xs mb-1 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>Hash SHA-256</p>
                    <code className={`block w-full text-xs font-mono p-2 rounded-lg break-all ${
                      isDarkMode ? 'bg-slate-700 text-gray-300' : 'bg-gray-100 text-gray-700'
                    }`}>
                      {selectedTx.transactionHash}
                    </code>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function DetailRow({ label, value, isDark }: { label: string; value: string; isDark: boolean }) {
  return (
    <div className="flex justify-between items-start gap-4">
      <p className={`text-sm shrink-0 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{label}</p>
      <p className={`text-sm text-right ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>{value}</p>
    </div>
  );
}
