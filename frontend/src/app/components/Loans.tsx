import { useState } from 'react';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Badge } from './ui/badge';
import {
  DollarSign,
  TrendingUp,
  Clock,
  CheckCircle,
  User,
  Calendar,
  Percent
} from 'lucide-react';
import { toast } from 'sonner';
import { useTheme } from '../context/ThemeContext';

export function Loans() {
  const { isDarkMode } = useTheme();
  const [requestAmount, setRequestAmount] = useState('');
  const [requestDuration, setRequestDuration] = useState('');
  const [requestRate, setRequestRate] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRequestLoan = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    setTimeout(() => {
      setLoading(false);
      toast.success('Solicitud de préstamo enviada correctamente');
      setRequestAmount('');
      setRequestDuration('');
      setRequestRate('');
    }, 1200);
  };

  const availableLoans = [
    {
      id: 1,
      borrower: 'usuario@example.com',
      trustScore: 820,
      amount: 1500,
      duration: 6,
      rate: 8.5,
      purpose: 'Expansión de negocio'
    },
    {
      id: 2,
      borrower: 'maria@example.com',
      trustScore: 765,
      amount: 3000,
      duration: 12,
      rate: 10.2,
      purpose: 'Educación'
    },
    {
      id: 3,
      borrower: 'carlos@example.com',
      trustScore: 690,
      amount: 500,
      duration: 3,
      rate: 12.5,
      purpose: 'Emergencia médica'
    }
  ];

  const myLoans = [
    {
      id: 1234,
      type: 'borrowed',
      amount: 2000,
      duration: 12,
      rate: 9.5,
      paid: 4,
      remaining: 8,
      status: 'active',
      nextPayment: '2026-05-01'
    },
    {
      id: 1189,
      type: 'lent',
      amount: 1000,
      duration: 6,
      rate: 8.0,
      paid: 5,
      remaining: 1,
      status: 'active',
      nextPayment: '2026-04-28'
    },
    {
      id: 1045,
      type: 'borrowed',
      amount: 500,
      duration: 3,
      rate: 7.5,
      paid: 3,
      remaining: 0,
      status: 'completed',
      nextPayment: null
    }
  ];

  const handleAcceptLoan = (loanId: number) => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      toast.success('Préstamo aceptado correctamente');
    }, 1000);
  };

  const getTrustScoreColor = (score: number) => {
    if (score >= 800) return 'text-green-400 bg-green-500/20 border-green-500/30';
    if (score >= 700) return 'text-blue-400 bg-blue-500/20 border-blue-500/30';
    return 'text-orange-400 bg-orange-500/20 border-orange-500/30';
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className={`text-3xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
          Gestión de Préstamos
        </h1>
        <p className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>
          Solicita, otorga y administra préstamos P2P
        </p>
      </div>

      <Tabs defaultValue="request" className="space-y-6">
        <TabsList className="bg-slate-700 border border-slate-600 p-1">
          <TabsTrigger
            value="request"
            className="data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=inactive]:text-gray-300"
          >
            Solicitar Préstamo
          </TabsTrigger>
          <TabsTrigger
            value="available"
            className="data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=inactive]:text-gray-300"
          >
            Solicitudes Disponibles
          </TabsTrigger>
          <TabsTrigger
            value="my-loans"
            className="data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=inactive]:text-gray-300"
          >
            Mis Préstamos
          </TabsTrigger>
        </TabsList>

        <TabsContent value="request">
          <div className={`rounded-2xl p-6 ${
            isDarkMode ? 'bg-slate-800 border border-slate-700' : 'bg-white border border-gray-200'
          }`}>
            <h2 className={`text-xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Solicitar Nuevo Préstamo</h2>
            <p className={`text-sm mb-6 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Completa el formulario para solicitar un préstamo
            </p>

            <form onSubmit={handleRequestLoan} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="amount" className={isDarkMode ? 'text-gray-300' : 'text-gray-700'}>Monto (USD)</Label>
                  <input
                    id="amount"
                    type="number"
                    placeholder="1000"
                    value={requestAmount}
                    onChange={(e) => setRequestAmount(e.target.value)}
                    disabled={loading}
                    className={`w-full px-4 py-2.5 rounded-lg outline-none transition-all ${
                      isDarkMode
                        ? 'bg-slate-700 border border-slate-600 text-white placeholder:text-gray-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30'
                        : 'bg-gray-50 border border-gray-300 text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200'
                    }`}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="duration" className={isDarkMode ? 'text-gray-300' : 'text-gray-700'}>Duración (meses)</Label>
                  <input
                    id="duration"
                    type="number"
                    placeholder="12"
                    value={requestDuration}
                    onChange={(e) => setRequestDuration(e.target.value)}
                    disabled={loading}
                    className={`w-full px-4 py-2.5 rounded-lg outline-none transition-all ${
                      isDarkMode
                        ? 'bg-slate-700 border border-slate-600 text-white placeholder:text-gray-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30'
                        : 'bg-gray-50 border border-gray-300 text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200'
                    }`}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="rate" className={isDarkMode ? 'text-gray-300' : 'text-gray-700'}>Tasa de Interés (%)</Label>
                  <input
                    id="rate"
                    type="number"
                    step="0.1"
                    placeholder="8.5"
                    value={requestRate}
                    onChange={(e) => setRequestRate(e.target.value)}
                    disabled={loading}
                    className={`w-full px-4 py-2.5 rounded-lg outline-none transition-all ${
                      isDarkMode
                        ? 'bg-slate-700 border border-slate-600 text-white placeholder:text-gray-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30'
                        : 'bg-gray-50 border border-gray-300 text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200'
                    }`}
                  />
                </div>
              </div>

              <div className={`p-4 rounded-lg ${
                isDarkMode
                  ? 'bg-blue-600/20 border border-blue-500/30'
                  : 'bg-blue-100 border border-blue-200'
              }`}>
                <div className="flex items-start gap-3">
                  <TrendingUp className={`w-5 h-5 mt-0.5 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                  <div>
                    <div className={`font-medium mb-1 ${isDarkMode ? 'text-blue-300' : 'text-blue-700'}`}>
                      Tu Trust Score: 785
                    </div>
                    <div className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      Con tu puntuación, calificas para tasas entre 7% - 11%
                    </div>
                  </div>
                </div>
              </div>

              <Button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 shadow-lg font-semibold"
                disabled={loading}
              >
                <DollarSign className="w-4 h-4 mr-2" />
                {loading ? 'Enviando...' : 'Solicitar Préstamo'}
              </Button>
            </form>
          </div>
        </TabsContent>

        <TabsContent value="available">
          <div className="space-y-4">
            {availableLoans.map((loan) => (
              <div key={loan.id} className={`rounded-2xl p-6 ${
                isDarkMode ? 'bg-slate-800 border border-slate-700' : 'bg-white border border-gray-200'
              }`}>
                <div className="flex items-start justify-between">
                  <div className="flex-1 space-y-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center">
                        <User className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <div className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{loan.borrower}</div>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge className={getTrustScoreColor(loan.trustScore) + ' border'}>
                            Trust Score: {loan.trustScore}
                          </Badge>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <div className={`text-sm mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Monto</div>
                        <div className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                          ${loan.amount.toLocaleString()}
                        </div>
                      </div>
                      <div>
                        <div className={`text-sm mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Duración</div>
                        <div className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                          {loan.duration} meses
                        </div>
                      </div>
                      <div>
                        <div className={`text-sm mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Tasa</div>
                        <div className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                          {loan.rate}% anual
                        </div>
                      </div>
                      <div>
                        <div className={`text-sm mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Propósito</div>
                        <div className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                          {loan.purpose}
                        </div>
                      </div>
                    </div>
                  </div>

                  <Button
                    className="bg-green-600 hover:bg-green-700 shadow-lg font-semibold ml-4"
                    onClick={() => handleAcceptLoan(loan.id)}
                    disabled={loading}
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Aceptar
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="my-loans">
          <div className="space-y-4">
            {myLoans.map((loan) => (
              <div key={loan.id} className={`rounded-2xl p-6 ${
                isDarkMode ? 'bg-slate-800 border border-slate-700' : 'bg-white border border-gray-200'
              }`}>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Badge variant={loan.type === 'borrowed' ? 'default' : 'secondary'}>
                        {loan.type === 'borrowed' ? 'Solicitado' : 'Otorgado'}
                      </Badge>
                      <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Préstamo #{loan.id}</span>
                      {loan.status === 'completed' && (
                        <Badge className={`border ${
                          isDarkMode
                            ? 'bg-green-600/20 text-green-400 border-green-500/30'
                            : 'bg-green-100 text-green-700 border-green-200'
                        }`}>
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Completado
                        </Badge>
                      )}
                    </div>
                    <div className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      ${loan.amount.toLocaleString()}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    <div>
                      <div className={`text-sm mb-1 flex items-center gap-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        <Percent className="w-3 h-3" />
                        Tasa
                      </div>
                      <div className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{loan.rate}%</div>
                    </div>
                    <div>
                      <div className={`text-sm mb-1 flex items-center gap-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        <CheckCircle className="w-3 h-3" />
                        Pagados
                      </div>
                      <div className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{loan.paid}/{loan.duration}</div>
                    </div>
                    <div>
                      <div className={`text-sm mb-1 flex items-center gap-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        <Clock className="w-3 h-3" />
                        Restantes
                      </div>
                      <div className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{loan.remaining} meses</div>
                    </div>
                    {loan.nextPayment && (
                      <div className="col-span-2">
                        <div className={`text-sm mb-1 flex items-center gap-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                          <Calendar className="w-3 h-3" />
                          Próximo Pago
                        </div>
                        <div className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{loan.nextPayment}</div>
                      </div>
                    )}
                  </div>

                  {loan.status === 'active' && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>Progreso</span>
                        <span className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{Math.round((loan.paid / loan.duration) * 100)}%</span>
                      </div>
                      <div className={`h-2 rounded-full overflow-hidden ${isDarkMode ? 'bg-slate-700' : 'bg-gray-200'}`}>
                        <div
                          className="h-full bg-gradient-to-r from-blue-500 to-blue-400 transition-all"
                          style={{ width: `${(loan.paid / loan.duration) * 100}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
