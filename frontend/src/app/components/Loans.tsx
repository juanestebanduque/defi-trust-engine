import { useEffect, useState } from 'react';
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
  Percent,
  RefreshCw,
  Bookmark,
} from 'lucide-react';
import { toast } from 'sonner';
import { useTheme } from '../context/ThemeContext';
import { loanService, calcTermMonths, type LoanDTO } from '../services/loanService';
import { loanMarketService, type LoanRequestDTO } from '../services/loanMarketService';
import { trustScoreService, type MyTrustScoreResponse } from '../services/trustScoreService';
import { getUserId } from '../services/session';
import { ApiError } from '../services/api';

export function Loans() {
  const { isDarkMode } = useTheme();

  // Form state
  const [requestAmount, setRequestAmount] = useState('');
  const [requestDuration, setRequestDuration] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Data state
  const [myLoans, setMyLoans] = useState<LoanDTO[]>([]);
  const [availableLoans, setAvailableLoans] = useState<LoanRequestDTO[]>([]);
  const [trustScore, setTrustScore] = useState<MyTrustScoreResponse | null>(null);
  const [loadingLoans, setLoadingLoans] = useState(true);
  const [loadingMarket, setLoadingMarket] = useState(true);
  const [savingId, setSavingId] = useState<number | null>(null);
  const [acceptingId, setAcceptingId] = useState<number | null>(null);

  const userId = getUserId();

  const fetchMyLoans = () => {
    setLoadingLoans(true);
    loanService.getMyLoans()
      .then(setMyLoans)
      .catch(() => toast.error('No se pudieron cargar tus préstamos.'))
      .finally(() => setLoadingLoans(false));
  };

  const fetchMarket = () => {
    setLoadingMarket(true);
    loanMarketService.getAvailable({ lenderId: userId ?? undefined })
      .then(setAvailableLoans)
      .catch(() => toast.error('No se pudo cargar el mercado de préstamos.'))
      .finally(() => setLoadingMarket(false));
  };

  useEffect(() => {
    fetchMyLoans();
    fetchMarket();
    trustScoreService.getMyScore()
      .then(setTrustScore)
      .catch(() => {});
  }, []);

  // ── Loan request form ──────────────────────────────────────────────────────
  const handleRequestLoan = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = Number(requestAmount);
    const months = Number(requestDuration);

    if (!amount || amount < 100) {
      toast.error('El monto mínimo es $100.');
      return;
    }
    if (!months || months < 1 || months > 60) {
      toast.error('La duración debe estar entre 1 y 60 meses.');
      return;
    }

    setSubmitting(true);
    try {
      const loan = await loanService.requestLoan(amount, months);
      toast.success(`Solicitud de $${Number(loan.amount).toLocaleString()} creada con tasa ${loan.interestRate}% — estado: ${loan.status}`);
      setRequestAmount('');
      setRequestDuration('');
      fetchMyLoans();
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Error al solicitar el préstamo.';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  // ── Save / watchlist ───────────────────────────────────────────────────────
  const handleToggleSave = async (loan: LoanRequestDTO) => {
    if (!userId) return;
    setSavingId(loan.loanId);
    try {
      if (loan.saved) {
        await loanMarketService.unsave(loan.loanId, userId);
        toast.success('Solicitud eliminada de tu lista.');
      } else {
        await loanMarketService.save(loan.loanId, userId);
        toast.success('Solicitud guardada en tu lista.');
      }
      fetchMarket();
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'No se pudo actualizar la lista.';
      toast.error(msg);
    } finally {
      setSavingId(null);
    }
  };

  // ── Accept loan ────────────────────────────────────────────────────────────
  const handleAcceptLoan = async (loan: LoanRequestDTO) => {
    if (!userId) return;
    setAcceptingId(loan.loanId);
    try {
      await loanMarketService.acceptLoan(loan.loanId, userId);
      toast.success(`Préstamo de $${Number(loan.amount).toLocaleString()} aprobado. El prestatario ha sido notificado.`);
      fetchMarket();
      fetchMyLoans();
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'No se pudo aceptar la solicitud.';
      toast.error(msg);
    } finally {
      setAcceptingId(null);
    }
  };

  // ── Helpers ────────────────────────────────────────────────────────────────
  const getTrustScoreColor = (score: number) => {
    const display = Math.round(Number(score) * 10);
    if (display >= 700) return 'text-green-400 bg-green-500/20 border-green-500/30';
    if (display >= 400) return 'text-blue-400 bg-blue-500/20 border-blue-500/30';
    return 'text-orange-400 bg-orange-500/20 border-orange-500/30';
  };

  const statusBadge = (status: string) => {
    const map: Record<string, string> = {
      ACTIVE: 'Activo',
      PENDING: 'Pendiente',
      PAID: 'Pagado',
      DEFAULT: 'Mora',
    };
    return map[status] ?? status;
  };

  const displayScore = trustScore ? Math.round(trustScore.scoreValue * 10) : null;
  const rateHint = trustScore
    ? trustScore.level === 'ALTO'
      ? '5%'
      : trustScore.level === 'MEDIO'
      ? '12%'
      : '25%'
    : '—';

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
          <TabsTrigger value="request" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=inactive]:text-gray-300">
            Solicitar Préstamo
          </TabsTrigger>
          <TabsTrigger value="available" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=inactive]:text-gray-300">
            Solicitudes Disponibles
          </TabsTrigger>
          <TabsTrigger value="my-loans" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=inactive]:text-gray-300">
            Mis Préstamos
          </TabsTrigger>
        </TabsList>

        {/* ── Solicitar préstamo ─────────────────────────────────────────── */}
        <TabsContent value="request">
          <div className={`rounded-2xl p-6 ${isDarkMode ? 'bg-slate-800 border border-slate-700' : 'bg-white border border-gray-200'}`}>
            <h2 className={`text-xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Solicitar Nuevo Préstamo
            </h2>
            <p className={`text-sm mb-6 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              La tasa de interés se calcula automáticamente según tu Trust Score.
            </p>

            <form onSubmit={handleRequestLoan} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="amount" className={isDarkMode ? 'text-gray-300' : 'text-gray-700'}>Monto (USD)</Label>
                  <input
                    id="amount"
                    type="number"
                    min={100}
                    placeholder="Mín. 100"
                    value={requestAmount}
                    onChange={(e) => setRequestAmount(e.target.value)}
                    disabled={submitting}
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
                    min={1}
                    max={60}
                    placeholder="1 – 60"
                    value={requestDuration}
                    onChange={(e) => setRequestDuration(e.target.value)}
                    disabled={submitting}
                    className={`w-full px-4 py-2.5 rounded-lg outline-none transition-all ${
                      isDarkMode
                        ? 'bg-slate-700 border border-slate-600 text-white placeholder:text-gray-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30'
                        : 'bg-gray-50 border border-gray-300 text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200'
                    }`}
                  />
                </div>
              </div>

              <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-blue-600/20 border border-blue-500/30' : 'bg-blue-100 border border-blue-200'}`}>
                <div className="flex items-start gap-3">
                  <TrendingUp className={`w-5 h-5 mt-0.5 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                  <div>
                    <div className={`font-medium mb-1 ${isDarkMode ? 'text-blue-300' : 'text-blue-700'}`}>
                      Tu Trust Score: {displayScore !== null ? `${displayScore}/1000 (${trustScore?.level})` : 'cargando...'}
                    </div>
                    <div className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      Tasa asignada según tu nivel: <strong>{rateHint}</strong>
                      {trustScore?.level === 'ALTO' && ' — acceso a las mejores tasas'}
                      {trustScore?.level === 'MEDIO' && ' — mejora tu score para reducir la tasa'}
                      {trustScore?.level === 'BAJO' && ' — paga tus deudas para mejorar tu nivel'}
                    </div>
                  </div>
                </div>
              </div>

              <Button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 shadow-lg font-semibold"
                disabled={submitting}
              >
                <DollarSign className="w-4 h-4 mr-2" />
                {submitting ? 'Enviando...' : 'Solicitar Préstamo'}
              </Button>
            </form>
          </div>
        </TabsContent>

        {/* ── Solicitudes disponibles ────────────────────────────────────── */}
        <TabsContent value="available">
          <div className="flex justify-end mb-2">
            <button
              onClick={fetchMarket}
              className={`flex items-center gap-1 text-sm px-3 py-1 rounded-lg transition-colors ${
                isDarkMode ? 'hover:bg-slate-700 text-gray-400' : 'hover:bg-gray-100 text-gray-600'
              }`}
            >
              <RefreshCw className={`w-4 h-4 ${loadingMarket ? 'animate-spin' : ''}`} />
              Actualizar
            </button>
          </div>

          {loadingMarket && (
            <p className={`text-center py-8 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              Cargando solicitudes...
            </p>
          )}
          {!loadingMarket && availableLoans.length === 0 && (
            <p className={`text-center py-8 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              No hay solicitudes disponibles en este momento.
            </p>
          )}

          <div className="space-y-4">
            {availableLoans.map((loan) => {
              const termMonths = calcTermMonths(String(loan.startDate), String(loan.endDate));
              return (
                <div key={loan.loanId} className={`rounded-2xl p-6 ${isDarkMode ? 'bg-slate-800 border border-slate-700' : 'bg-white border border-gray-200'}`}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1 space-y-4">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center">
                          <User className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <div className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                            {loan.borrowerEmail}
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge className={`${getTrustScoreColor(loan.trustScore)} border`}>
                              Trust Score: {Math.round(Number(loan.trustScore) * 10)}
                            </Badge>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        <div>
                          <div className={`text-sm mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Monto</div>
                          <div className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                            ${Number(loan.amount).toLocaleString()}
                          </div>
                        </div>
                        <div>
                          <div className={`text-sm mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Duración</div>
                          <div className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                            {termMonths} mes{termMonths !== 1 ? 'es' : ''}
                          </div>
                        </div>
                        <div>
                          <div className={`text-sm mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Tasa</div>
                          <div className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                            {loan.interestRate}% anual
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="ml-4 flex flex-col gap-2">
                      {loan.borrowerId !== userId && (
                        <Button
                          className="bg-blue-600 hover:bg-blue-700 font-semibold"
                          onClick={() => handleAcceptLoan(loan)}
                          disabled={acceptingId === loan.loanId}
                        >
                          <CheckCircle className="w-4 h-4 mr-2" />
                          {acceptingId === loan.loanId ? 'Procesando...' : 'Aceptar'}
                        </Button>
                      )}
                      <Button
                        className={`font-semibold ${
                          loan.saved
                            ? isDarkMode ? 'bg-slate-600 hover:bg-slate-500 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                            : isDarkMode ? 'bg-slate-700 hover:bg-slate-600 text-white border border-slate-600' : 'bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-300'
                        }`}
                        onClick={() => handleToggleSave(loan)}
                        disabled={savingId === loan.loanId}
                      >
                        <Bookmark className={`w-4 h-4 mr-2 ${loan.saved ? 'fill-current' : ''}`} />
                        {loan.saved ? 'Guardado' : 'Guardar'}
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </TabsContent>

        {/* ── Mis préstamos ──────────────────────────────────────────────── */}
        <TabsContent value="my-loans">
          <div className="flex justify-end mb-2">
            <button
              onClick={fetchMyLoans}
              className={`flex items-center gap-1 text-sm px-3 py-1 rounded-lg transition-colors ${
                isDarkMode ? 'hover:bg-slate-700 text-gray-400' : 'hover:bg-gray-100 text-gray-600'
              }`}
            >
              <RefreshCw className={`w-4 h-4 ${loadingLoans ? 'animate-spin' : ''}`} />
              Actualizar
            </button>
          </div>

          {loadingLoans && (
            <p className={`text-center py-8 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              Cargando préstamos...
            </p>
          )}
          {!loadingLoans && myLoans.length === 0 && (
            <p className={`text-center py-8 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              No tienes préstamos todavía. ¡Solicita uno en la pestaña anterior!
            </p>
          )}

          <div className="space-y-4">
            {myLoans.map((loan) => {
              const termMonths = calcTermMonths(String(loan.startDate), String(loan.endDate));
              return (
                <div key={loan.loanId} className={`rounded-2xl p-6 ${isDarkMode ? 'bg-slate-800 border border-slate-700' : 'bg-white border border-gray-200'}`}>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Badge
                          variant={loan.status === 'ACTIVE' ? 'default' : 'secondary'}
                          className={
                            loan.status === 'PAID'
                              ? isDarkMode ? 'bg-green-600/20 text-green-400 border border-green-500/30' : 'bg-green-100 text-green-700 border border-green-200'
                              : loan.status === 'ACTIVE'
                              ? 'bg-blue-600 text-white'
                              : ''
                          }
                        >
                          {loan.status === 'PAID' && <CheckCircle className="w-3 h-3 mr-1" />}
                          {statusBadge(loan.status)}
                        </Badge>
                        <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                          Préstamo #{loan.loanId}
                        </span>
                      </div>
                      <div className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        ${Number(loan.amount).toLocaleString()}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <div className={`text-sm mb-1 flex items-center gap-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                          <Percent className="w-3 h-3" /> Tasa
                        </div>
                        <div className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                          {loan.interestRate}%
                        </div>
                      </div>
                      <div>
                        <div className={`text-sm mb-1 flex items-center gap-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                          <Clock className="w-3 h-3" /> Plazo
                        </div>
                        <div className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                          {termMonths} mes{termMonths !== 1 ? 'es' : ''}
                        </div>
                      </div>
                      <div>
                        <div className={`text-sm mb-1 flex items-center gap-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                          <Calendar className="w-3 h-3" /> Inicio
                        </div>
                        <div className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                          {new Date(loan.startDate).toLocaleDateString('es-CO')}
                        </div>
                      </div>
                      <div>
                        <div className={`text-sm mb-1 flex items-center gap-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                          <Calendar className="w-3 h-3" /> Vencimiento
                        </div>
                        <div className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                          {new Date(loan.endDate).toLocaleDateString('es-CO')}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
