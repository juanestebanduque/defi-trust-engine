import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, CheckCircle, Clock, AlertCircle, Info } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { trustScoreService, type MyTrustScoreResponse } from '../services/trustScoreService';

export function TrustScore() {
  const { isDarkMode } = useTheme();
  const [data, setData] = useState<MyTrustScoreResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    trustScoreService.getMyScore()
      .then(setData)
      .catch(() => setError('No se pudo cargar el trust score.'))
      .finally(() => setLoading(false));
  }, []);

  const displayScore = data ? Math.round(data.scoreValue * 10) : 0;

  const levelColor = (level: string) => {
    if (level === 'ALTO') return 'text-green-500';
    if (level === 'MEDIO') return 'text-blue-500';
    return 'text-orange-500';
  };

  const levelBg = (level: string) => {
    if (level === 'ALTO') return isDarkMode ? 'bg-green-600/20 border border-green-500/30' : 'bg-green-100 border border-green-200';
    if (level === 'MEDIO') return isDarkMode ? 'bg-blue-600/20 border border-blue-500/30' : 'bg-blue-100 border border-blue-200';
    return isDarkMode ? 'bg-orange-600/20 border border-orange-500/30' : 'bg-orange-100 border border-orange-200';
  };

  const levelTextColor = (level: string) => {
    if (level === 'ALTO') return isDarkMode ? 'text-green-300' : 'text-green-700';
    if (level === 'MEDIO') return isDarkMode ? 'text-blue-300' : 'text-blue-700';
    return isDarkMode ? 'text-orange-300' : 'text-orange-700';
  };

  const factors = data
    ? [
        {
          name: 'Puntualidad',
          score: Math.round(data.punctualityScore),
          weight: 40,
          description: 'Porcentaje de cuotas pagadas a tiempo',
          status: data.punctualityScore >= 80 ? 'excellent' : data.punctualityScore >= 50 ? 'good' : 'warning',
        },
        {
          name: 'Actividad',
          score: Math.round(data.activityScore),
          weight: 30,
          description: 'Volumen y frecuencia de transacciones',
          status: data.activityScore >= 80 ? 'excellent' : data.activityScore >= 50 ? 'good' : 'warning',
        },
        {
          name: 'Estabilidad',
          score: Math.round(data.stabilityScore),
          weight: 30,
          description: 'Ratio deuda/repagado y pagos perdidos',
          status: data.stabilityScore >= 80 ? 'excellent' : data.stabilityScore >= 50 ? 'good' : 'warning',
        },
      ]
    : [];

  const chartData = factors.map(f => ({ name: f.name, valor: f.score, peso: f.weight }));

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'excellent': return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'good': return <Clock className="w-5 h-5 text-blue-500" />;
      case 'warning': return <AlertCircle className="w-5 h-5 text-orange-500" />;
      default: return <Info className={`w-5 h-5 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />;
    }
  };

  const getProgressColor = (score: number) => {
    if (score >= 80) return 'from-green-500 to-green-400';
    if (score >= 50) return 'from-blue-500 to-blue-400';
    return 'from-orange-500 to-orange-400';
  };

  if (loading) {
    return (
      <div className={`min-h-64 flex items-center justify-center ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
        Calculando trust score...
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className={`min-h-64 flex items-center justify-center ${isDarkMode ? 'text-red-400' : 'text-red-600'}`}>
        {error || 'No se pudo obtener el trust score.'}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className={`text-3xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
          Trust Score Detallado
        </h1>
        <p className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>
          Tu reputación descentralizada en la red
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Score circle */}
        <div className={`lg:col-span-1 rounded-2xl p-6 ${
          isDarkMode ? 'bg-slate-800 border border-slate-700' : 'bg-white border border-gray-200'
        }`}>
          <div className="text-center mb-6">
            <div className="mx-auto w-40 h-40 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center mb-4 shadow-xl">
              <div className={`w-36 h-36 rounded-full flex items-center justify-center ${
                isDarkMode ? 'bg-slate-800' : 'bg-white'
              }`}>
                <div>
                  <div className={`text-5xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    {displayScore}
                  </div>
                  <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>de 1000</div>
                </div>
              </div>
            </div>
            <h3 className={`text-xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Tu Puntuación</h3>
            <div className={`flex items-center justify-center gap-2 ${levelColor(data.level)}`}>
              <TrendingUp className="w-4 h-4" />
              <span className="text-sm font-semibold">{data.level}</span>
            </div>
          </div>

          <div className="space-y-4">
            <div className={`p-4 rounded-lg ${levelBg(data.level)}`}>
              <div className={`font-medium mb-1 ${levelTextColor(data.level)}`}>{data.level}</div>
              <div className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                {data.levelDescription}
              </div>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>Calculado el</span>
                <span className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  {new Date(data.calculationDate).toLocaleDateString('es-CO')}
                </span>
              </div>
              <div className="flex justify-between">
                <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>Próximo nivel</span>
                <span className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  {data.level === 'BAJO' ? '400 pts' : data.level === 'MEDIO' ? '700 pts' : 'Máximo'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Breakdown bar chart */}
        <div className={`lg:col-span-2 rounded-2xl p-6 ${
          isDarkMode ? 'bg-slate-800 border border-slate-700' : 'bg-white border border-gray-200'
        }`}>
          <h3 className={`text-lg font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            Desglose por Factor
          </h3>
          <p className={`text-sm mb-6 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Puntuación actual (0–100) por cada componente del score
          </p>

          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? '#475569' : '#e5e7eb'} />
              <XAxis
                dataKey="name"
                stroke={isDarkMode ? '#94a3b8' : '#6b7280'}
                style={{ fontSize: '12px' }}
              />
              <YAxis
                domain={[0, 100]}
                stroke={isDarkMode ? '#94a3b8' : '#6b7280'}
                style={{ fontSize: '12px' }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: isDarkMode ? '#1e293b' : '#ffffff',
                  border: `1px solid ${isDarkMode ? '#475569' : '#e5e7eb'}`,
                  borderRadius: '8px',
                  color: isDarkMode ? '#fff' : '#000',
                }}
                formatter={(value: number) => [`${value}%`, 'Puntuación']}
              />
              <Bar dataKey="valor" fill="#3b82f6" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Factor detail */}
      <div className={`rounded-2xl p-6 ${
        isDarkMode ? 'bg-slate-800 border border-slate-700' : 'bg-white border border-gray-200'
      }`}>
        <h3 className={`text-lg font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Factores del Score</h3>
        <p className={`text-sm mb-6 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          Cómo se calcula tu puntuación de confianza
        </p>
        <div className="space-y-6">
          {factors.map((factor) => (
            <div key={factor.name} className="space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  {getStatusIcon(factor.status)}
                  <div>
                    <div className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{factor.name}</div>
                    <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>{factor.description}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{factor.score}%</div>
                  <div className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Peso: {factor.weight}%</div>
                </div>
              </div>
              <div className={`h-2 rounded-full overflow-hidden ${isDarkMode ? 'bg-slate-700' : 'bg-gray-200'}`}>
                <div
                  className={`h-full bg-gradient-to-r ${getProgressColor(factor.score)} transition-all`}
                  style={{ width: `${factor.score}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Tips */}
      <div className={`rounded-2xl p-6 ${
        isDarkMode ? 'bg-slate-800 border border-slate-700' : 'bg-white border border-gray-200'
      }`}>
        <h3 className={`text-lg font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Cómo Mejorar tu Score</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-blue-600/20 border border-blue-500/30' : 'bg-blue-100 border border-blue-200'}`}>
            <div className={`font-medium mb-2 ${isDarkMode ? 'text-blue-300' : 'text-blue-700'}`}>Paga a Tiempo</div>
            <div className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Mantén un historial del 100% para maximizar tu score de puntualidad (40%)
            </div>
          </div>
          <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-green-600/20 border border-green-500/30' : 'bg-green-100 border border-green-200'}`}>
            <div className={`font-medium mb-2 ${isDarkMode ? 'text-green-300' : 'text-green-700'}`}>Aumenta Actividad</div>
            <div className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Realiza más transacciones para subir el factor de actividad (30%)
            </div>
          </div>
          <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-purple-600/20 border border-purple-500/30' : 'bg-purple-100 border border-purple-200'}`}>
            <div className={`font-medium mb-2 ${isDarkMode ? 'text-purple-300' : 'text-purple-700'}`}>Reduce Deuda</div>
            <div className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Pagar préstamos mejora tu ratio deuda/ingreso y el factor de estabilidad (30%)
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
