import { useState } from 'react';
import { Badge } from './ui/badge';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import {
  CheckCircle,
  Clock,
  XCircle,
  ArrowUpRight,
  ArrowDownRight,
  Search
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export function Transactions() {
  const { isDarkMode } = useTheme();
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const transactions = [
    {
      id: 'TX001',
      type: 'payment_received',
      description: 'Pago recibido - Préstamo #1234',
      amount: 500,
      date: '2026-04-20',
      status: 'completed',
      counterparty: 'usuario@example.com',
      hash: '0x7f3a...9b2c'
    },
    {
      id: 'TX002',
      type: 'loan_disbursed',
      description: 'Préstamo otorgado',
      amount: -2000,
      date: '2026-04-18',
      status: 'completed',
      counterparty: 'maria@example.com',
      hash: '0x4e2d...1a5f'
    },
    {
      id: 'TX003',
      type: 'payment_sent',
      description: 'Pago realizado - Préstamo #1189',
      amount: -300,
      date: '2026-04-15',
      status: 'completed',
      counterparty: 'carlos@example.com',
      hash: '0x9c6b...3d8e'
    },
    {
      id: 'TX004',
      type: 'payment_received',
      description: 'Pago recibido - Préstamo #1045',
      amount: 200,
      date: '2026-04-10',
      status: 'completed',
      counterparty: 'ana@example.com',
      hash: '0x2a1f...7e4c'
    },
    {
      id: 'TX005',
      type: 'payment_sent',
      description: 'Pago pendiente - Préstamo #1234',
      amount: -500,
      date: '2026-05-01',
      status: 'pending',
      counterparty: 'usuario@example.com',
      hash: null
    },
    {
      id: 'TX006',
      type: 'loan_received',
      description: 'Préstamo recibido',
      amount: 2000,
      date: '2026-03-28',
      status: 'completed',
      counterparty: 'pedro@example.com',
      hash: '0x8b5a...6f2d'
    },
    {
      id: 'TX007',
      type: 'payment_sent',
      description: 'Pago realizado - Préstamo #1122',
      amount: -400,
      date: '2026-03-15',
      status: 'completed',
      counterparty: 'laura@example.com',
      hash: '0x3d9c...4a1b'
    },
    {
      id: 'TX008',
      type: 'payment_received',
      description: 'Pago atrasado',
      amount: 150,
      date: '2026-03-05',
      status: 'failed',
      counterparty: 'jorge@example.com',
      hash: '0x5f7e...8c3a'
    }
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return (
          <Badge className={`border ${
            isDarkMode
              ? 'bg-green-600/20 text-green-400 border-green-500/30'
              : 'bg-green-100 text-green-700 border-green-200'
          }`}>
            <CheckCircle className="w-3 h-3 mr-1" />
            Completado
          </Badge>
        );
      case 'pending':
        return (
          <Badge className={`border ${
            isDarkMode
              ? 'bg-orange-600/20 text-orange-400 border-orange-500/30'
              : 'bg-orange-100 text-orange-700 border-orange-200'
          }`}>
            <Clock className="w-3 h-3 mr-1" />
            Pendiente
          </Badge>
        );
      case 'failed':
        return (
          <Badge className={`border ${
            isDarkMode
              ? 'bg-red-600/20 text-red-400 border-red-500/30'
              : 'bg-red-100 text-red-700 border-red-200'
          }`}>
            <XCircle className="w-3 h-3 mr-1" />
            Fallido
          </Badge>
        );
      default:
        return null;
    }
  };

  const getTypeIcon = (type: string) => {
    const isIncome = type.includes('received');
    return isIncome ? (
      <ArrowDownRight className="w-4 h-4 text-green-400" />
    ) : (
      <ArrowUpRight className="w-4 h-4 text-red-400" />
    );
  };

  const filteredTransactions = transactions.filter(tx => {
    const matchesType = filterType === 'all' || tx.type.includes(filterType);
    const matchesStatus = filterStatus === 'all' || tx.status === filterStatus;
    const matchesSearch = searchTerm === '' ||
      tx.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tx.counterparty.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tx.id.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesType && matchesStatus && matchesSearch;
  });

  const totalIncome = transactions
    .filter(tx => tx.amount > 0 && tx.status === 'completed')
    .reduce((sum, tx) => sum + tx.amount, 0);

  const totalExpense = transactions
    .filter(tx => tx.amount < 0 && tx.status === 'completed')
    .reduce((sum, tx) => sum + Math.abs(tx.amount), 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className={`text-3xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
          Historial de Transacciones
        </h1>
        <p className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>
          Registro completo de todas tus operaciones
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className={`rounded-2xl p-6 ${
          isDarkMode ? 'bg-slate-800 border border-slate-700' : 'bg-white border border-gray-200'
        }`}>
          <p className={`text-sm mb-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Total Recibido</p>
          <div className={`text-2xl font-bold ${isDarkMode ? 'text-green-400' : 'text-green-600'}`}>
            +${totalIncome.toLocaleString()}
          </div>
        </div>

        <div className={`rounded-2xl p-6 ${
          isDarkMode ? 'bg-slate-800 border border-slate-700' : 'bg-white border border-gray-200'
        }`}>
          <p className={`text-sm mb-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Total Enviado</p>
          <div className={`text-2xl font-bold ${isDarkMode ? 'text-red-400' : 'text-red-600'}`}>
            -${totalExpense.toLocaleString()}
          </div>
        </div>

        <div className={`rounded-2xl p-6 ${
          isDarkMode ? 'bg-slate-800 border border-slate-700' : 'bg-white border border-gray-200'
        }`}>
          <p className={`text-sm mb-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Transacciones Totales</p>
          <div className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            {transactions.length}
          </div>
        </div>
      </div>

      <div className={`rounded-2xl p-6 ${
        isDarkMode ? 'bg-slate-800 border border-slate-700' : 'bg-white border border-gray-200'
      }`}>
        <h3 className={`text-lg font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Filtros</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="search" className={isDarkMode ? 'text-gray-300' : 'text-gray-700'}>Buscar</Label>
            <div className="relative">
              <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`} />
              <input
                id="search"
                placeholder="ID, descripción, usuario..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`w-full pl-9 px-4 py-2.5 rounded-lg outline-none transition-all ${
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
                <SelectItem value="payment">Pagos</SelectItem>
                <SelectItem value="loan">Préstamos</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="status" className={isDarkMode ? 'text-gray-300' : 'text-gray-700'}>Estado</Label>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger id="status" className={isDarkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-gray-50 border-gray-300 text-gray-900'}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent className={isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="completed">Completado</SelectItem>
                <SelectItem value="pending">Pendiente</SelectItem>
                <SelectItem value="failed">Fallido</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className={`rounded-2xl p-6 ${
        isDarkMode ? 'bg-slate-800 border border-slate-700' : 'bg-white border border-gray-200'
      }`}>
        <h3 className={`text-lg font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Transacciones ({filteredTransactions.length})</h3>
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
                    {getTypeIcon(tx.type)}
                  </div>
                  <div>
                    <p className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{tx.description}</p>
                    <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>{tx.date}</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`text-lg font-bold ${
                    tx.amount > 0
                      ? isDarkMode ? 'text-green-400' : 'text-green-600'
                      : isDarkMode ? 'text-red-400' : 'text-red-600'
                  }`}>
                    {tx.amount > 0 ? '+' : ''}${Math.abs(tx.amount).toLocaleString()}
                  </div>
                  {getStatusBadge(tx.status)}
                </div>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>ID: {tx.id}</span>
                {tx.hash ? (
                  <code className={`px-2 py-1 rounded text-xs font-mono ${
                    isDarkMode ? 'bg-slate-600 text-gray-300' : 'bg-gray-200 text-gray-700'
                  }`}>
                    {tx.hash}
                  </code>
                ) : (
                  <span className={isDarkMode ? 'text-gray-500' : 'text-gray-400'}>-</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
