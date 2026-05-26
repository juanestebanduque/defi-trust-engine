import { useEffect, useState } from 'react';
import { X, TrendingUp, AlertTriangle, CheckCircle, Info, ShieldAlert, ShieldCheck, Shield } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { riskAnalysisService, type RiskAnalysisResponse } from '../services/riskAnalysisService';

interface Props {
  borrowerId: number;
  borrowerEmail: string;
  onClose: () => void;
}

export function BorrowerRiskAnalysis({ borrowerId, borrowerEmail, onClose }: Props) {
  const { isDarkMode } = useTheme();
  const [data, setData] = useState<RiskAnalysisResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    riskAnalysisService.getRiskAnalysis(borrowerId)
      .then(setData)
      .catch(() => setError('No se pudo cargar el análisis de riesgo.'))
      .finally(() => setLoading(false));
  }, [borrowerId]);

  const riskColors = {
    BAJO:  { text: isDarkMode ? 'text-green-400'  : 'text-green-700',  bg: isDarkMode ? 'bg-green-600/20 border-green-500/30'  : 'bg-green-50 border-green-200',  icon: ShieldCheck },
    MEDIO: { text: isDarkMode ? 'text-yellow-400' : 'text-yellow-700', bg: isDarkMode ? 'bg-yellow-600/20 border-yellow-500/30' : 'bg-yellow-50 border-yellow-200', icon: Shield },
    ALTO:  { text: isDarkMode ? 'text-red-400'    : 'text-red-700',    bg: isDarkMode ? 'bg-red-600/20 border-red-500/30'       : 'bg-red-50 border-red-200',       icon: ShieldAlert },
  };

  const factorIcon = (type: string) => {
    if (type === 'POSITIVE') return <CheckCircle className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />;
    if (type === 'NEGATIVE') return <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />;
    return <Info className="w-4 h-4 text-yellow-500 shrink-0 mt-0.5" />;
  };

  const factorTextColor = (type: string) => {
    if (type === 'POSITIVE') return isDarkMode ? 'text-green-300' : 'text-green-700';
    if (type === 'NEGATIVE') return isDarkMode ? 'text-red-300'   : 'text-red-700';
    return isDarkMode ? 'text-yellow-300' : 'text-yellow-700';
  };

  const dataAvailabilityBanner = () => {
    if (!data || data.dataAvailability === 'SUFFICIENT') return null;
    const isNone = data.dataAvailability === 'NONE';
    return (
      <div className={`flex items-start gap-3 p-4 rounded-lg border ${
        isNone
          ? isDarkMode ? 'bg-red-600/20 border-red-500/30' : 'bg-red-50 border-red-200'
          : isDarkMode ? 'bg-yellow-600/20 border-yellow-500/30' : 'bg-yellow-50 border-yellow-200'
      }`}>
        <AlertTriangle className={`w-5 h-5 shrink-0 mt-0.5 ${isNone ? 'text-red-500' : 'text-yellow-500'}`} />
        <div>
          <p className={`font-semibold text-sm ${isNone
            ? isDarkMode ? 'text-red-300' : 'text-red-700'
            : isDarkMode ? 'text-yellow-300' : 'text-yellow-700'}`}>
            {isNone ? 'Evaluación muy limitada — Sin historial' : 'Historial insuficiente'}
          </p>
          <p className={`text-sm mt-0.5 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            {data.dataAvailabilityMessage}
          </p>
        </div>
      </div>
    );
  };

  const scoreBar = (value: number, label: string, weight: number) => (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span className={isDarkMode ? 'text-gray-300' : 'text-gray-700'}>{label} <span className={isDarkMode ? 'text-gray-500' : 'text-gray-400'}>({weight}%)</span></span>
        <span className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{Math.round(value)}/100</span>
      </div>
      <div className={`h-2 rounded-full ${isDarkMode ? 'bg-slate-700' : 'bg-gray-200'}`}>
        <div
          className={`h-2 rounded-full transition-all ${
            value >= 70 ? 'bg-green-500' : value >= 40 ? 'bg-blue-500' : 'bg-orange-500'
          }`}
          style={{ width: `${Math.min(value, 100)}%` }}
        />
      </div>
    </div>
  );

  const card = (className?: string) =>
    `rounded-xl p-5 border ${isDarkMode ? 'bg-slate-800/60 border-slate-700' : 'bg-white border-gray-200'} ${className ?? ''}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className={`relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl border ${
          isDarkMode ? 'bg-slate-900 border-slate-700' : 'bg-gray-50 border-gray-200'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className={`sticky top-0 z-10 flex items-center justify-between px-6 py-4 border-b ${
          isDarkMode ? 'bg-slate-900 border-slate-700' : 'bg-gray-50 border-gray-200'
        }`}>
          <div className="flex items-center gap-3">
            <TrendingUp className="w-5 h-5 text-blue-500" />
            <div>
              <h2 className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                Análisis de Riesgo
              </h2>
              <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>{borrowerEmail}</p>
            </div>
          </div>
          <button onClick={onClose} className={`p-2 rounded-lg transition-colors ${isDarkMode ? 'hover:bg-slate-700 text-gray-400' : 'hover:bg-gray-200 text-gray-500'}`}>
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {loading && (
            <p className={`text-center py-12 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              Generando análisis...
            </p>
          )}

          {error && (
            <p className="text-center py-12 text-red-500">{error}</p>
          )}

          {data && !loading && (() => {
            const risk = riskColors[data.overallRiskRating];
            const RiskIcon = risk.icon;
            const displayScore = Math.round(data.trustScore * 10);
            return (
              <>
                {/* CA3: data availability warning */}
                {dataAvailabilityBanner()}

                {/* Overall risk + trust score */}
                <div className="grid grid-cols-2 gap-4">
                  <div className={card()}>
                    <p className={`text-xs font-medium mb-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      RIESGO GENERAL
                    </p>
                    <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${risk.bg}`}>
                      <RiskIcon className={`w-5 h-5 ${risk.text}`} />
                      <span className={`text-lg font-bold ${risk.text}`}>{data.overallRiskRating}</span>
                    </div>
                    <p className={`text-xs mt-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      {data.lenderRecommendation}
                    </p>
                  </div>

                  <div className={card()}>
                    <p className={`text-xs font-medium mb-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      TRUST SCORE
                    </p>
                    <div className="flex items-baseline gap-1">
                      <span className={`text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        {displayScore}
                      </span>
                      <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>/1000</span>
                    </div>
                    <span className={`text-sm font-semibold ${
                      data.trustLevel === 'ALTO' ? 'text-green-500' :
                      data.trustLevel === 'MEDIO' ? 'text-blue-500' : 'text-orange-500'
                    }`}>
                      {data.trustLevel}
                    </span>
                    <p className={`text-xs mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      Calculado el {new Date(data.analysisDate).toLocaleDateString('es-CO')}
                    </p>
                  </div>
                </div>

                {/* Score breakdown */}
                <div className={card()}>
                  <p className={`text-sm font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    Desglose del Trust Score
                  </p>
                  <div className="space-y-3">
                    {scoreBar(data.punctualityScore, 'Puntualidad', 40)}
                    {scoreBar(data.activityScore,    'Actividad',   30)}
                    {scoreBar(data.stabilityScore,   'Estabilidad', 30)}
                  </div>
                </div>

                {/* Payment metrics (CA2: late payments highlighted) */}
                <div className={card()}>
                  <p className={`text-sm font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    Historial de Pagos
                  </p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {[
                      { label: 'A tiempo',    value: data.paidOnTime,    color: 'text-green-500' },
                      { label: 'Con retraso', value: data.latePayments,  color: data.latePayments > 0 ? 'text-red-500' : isDarkMode ? 'text-gray-300' : 'text-gray-700' },
                      { label: 'Vencidas',    value: data.pendingOverdue, color: data.pendingOverdue > 0 ? 'text-red-500' : isDarkMode ? 'text-gray-300' : 'text-gray-700' },
                      { label: 'Total cuotas', value: data.totalInstallments, color: isDarkMode ? 'text-gray-300' : 'text-gray-700' },
                    ].map(({ label, value, color }) => (
                      <div key={label} className={`rounded-lg p-3 text-center ${isDarkMode ? 'bg-slate-700/60' : 'bg-gray-100'}`}>
                        <div className={`text-2xl font-bold ${color}`}>{value}</div>
                        <div className={`text-xs mt-0.5 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>{label}</div>
                      </div>
                    ))}
                  </div>

                  {/* CA2: delay detail */}
                  {data.latePayments > 0 && (
                    <div className={`mt-3 flex items-center gap-2 px-3 py-2 rounded-lg border text-sm ${
                      isDarkMode ? 'bg-red-600/15 border-red-500/30 text-red-300' : 'bg-red-50 border-red-200 text-red-700'
                    }`}>
                      <AlertTriangle className="w-4 h-4 shrink-0" />
                      <span>
                        {data.latePayments} pago(s) tardío(s) · promedio{' '}
                        <strong>{data.averageDaysLate.toFixed(1)} días</strong> de retraso
                        {data.totalLateDays > 0 && ` · ${data.totalLateDays} días acumulados`}
                      </span>
                    </div>
                  )}
                </div>

                {/* Loan history + financial summary */}
                <div className="grid grid-cols-2 gap-4">
                  <div className={card()}>
                    <p className={`text-sm font-semibold mb-3 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      Historial de Préstamos
                    </p>
                    {[
                      { label: 'Total solicitados', value: data.totalLoans },
                      { label: 'Activos',            value: data.activeLoans },
                      { label: 'Cancelados',         value: data.paidLoans },
                      { label: 'Incumplidos',        value: data.defaultedLoans, alert: data.defaultedLoans > 0 },
                    ].map(({ label, value, alert }) => (
                      <div key={label} className="flex justify-between py-1.5 text-sm border-b border-dashed last:border-0 border-gray-600/20">
                        <span className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>{label}</span>
                        <span className={`font-semibold ${alert ? 'text-red-500' : isDarkMode ? 'text-white' : 'text-gray-900'}`}>{value}</span>
                      </div>
                    ))}
                  </div>

                  <div className={card()}>
                    <p className={`text-sm font-semibold mb-3 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      Resumen Financiero
                    </p>
                    {[
                      { label: 'Total prestado',   value: `$${Number(data.totalLoansTaken).toLocaleString()}` },
                      { label: 'Total repagado',   value: `$${Number(data.totalRepaid).toLocaleString()}` },
                      { label: 'Deuda actual',     value: `$${Number(data.currentDebt).toLocaleString()}`, alert: Number(data.currentDebt) > 0 },
                      { label: 'Pagos omitidos',   value: data.missedPayments, alert: data.missedPayments > 0 },
                    ].map(({ label, value, alert }) => (
                      <div key={label} className="flex justify-between py-1.5 text-sm border-b border-dashed last:border-0 border-gray-600/20">
                        <span className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>{label}</span>
                        <span className={`font-semibold ${alert ? 'text-red-500' : isDarkMode ? 'text-white' : 'text-gray-900'}`}>{value}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Risk factors */}
                {data.riskFactors.length > 0 && (
                  <div className={card()}>
                    <p className={`text-sm font-semibold mb-3 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      Factores de Riesgo
                    </p>
                    <ul className="space-y-2">
                      {data.riskFactors.map((f, i) => (
                        <li key={i} className="flex items-start gap-2">
                          {factorIcon(f.type)}
                          <span className={`text-sm ${factorTextColor(f.type)}`}>{f.description}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </>
            );
          })()}
        </div>
      </div>
    </div>
  );
}
