import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, CheckCircle, Clock, AlertCircle, Info } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export function TrustScore() {
  const { isDarkMode } = useTheme();
  const scoreHistory = [
    { month: 'Oct', score: 650 },
    { month: 'Nov', score: 680 },
    { month: 'Dic', score: 720 },
    { month: 'Ene', score: 740 },
    { month: 'Feb', score: 760 },
    { month: 'Mar', score: 770 },
    { month: 'Abr', score: 785 },
  ];

  const scoreFactors = [
    {
      name: 'Historial de Pagos',
      weight: 35,
      score: 95,
      status: 'excellent',
      description: '8 de 8 préstamos pagados a tiempo'
    },
    {
      name: 'Antigüedad en la Plataforma',
      weight: 25,
      score: 70,
      status: 'good',
      description: '8 meses como usuario activo'
    },
    {
      name: 'Diversificación',
      weight: 20,
      score: 80,
      status: 'good',
      description: 'Interacciones con 12 usuarios diferentes'
    },
    {
      name: 'Verificación de Identidad',
      weight: 15,
      score: 100,
      status: 'excellent',
      description: 'Verificación completa en blockchain'
    },
    {
      name: 'Ratio Deuda/Ingreso',
      weight: 5,
      score: 65,
      status: 'warning',
      description: 'Nivel moderado de endeudamiento'
    }
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'excellent':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'good':
        return <Clock className="w-5 h-5 text-blue-500" />;
      case 'warning':
        return <AlertCircle className="w-5 h-5 text-orange-500" />;
      default:
        return <Info className={`w-5 h-5 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />;
    }
  };

  const getProgressColor = (score: number) => {
    if (score >= 90) return 'from-green-500 to-green-400';
    if (score >= 70) return 'from-blue-500 to-blue-400';
    return 'from-orange-500 to-orange-400';
  };

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
        <div className={`lg:col-span-1 rounded-2xl p-6 ${
          isDarkMode ? 'bg-slate-800 border border-slate-700' : 'bg-white border border-gray-200'
        }`}>
          <div className="text-center mb-6">
            <div className="mx-auto w-40 h-40 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center mb-4 shadow-xl">
              <div className={`w-36 h-36 rounded-full flex items-center justify-center ${
                isDarkMode ? 'bg-slate-800' : 'bg-white'
              }`}>
                <div>
                  <div className={`text-5xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>785</div>
                  <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>de 1000</div>
                </div>
              </div>
            </div>
            <h3 className={`text-xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Tu Puntuación</h3>
            <div className="flex items-center justify-center gap-2 text-green-500">
              <TrendingUp className="w-4 h-4" />
              <span className="text-sm">+25 puntos este mes</span>
            </div>
          </div>

          <div className="space-y-4">
            <div className={`p-4 rounded-lg ${
              isDarkMode
                ? 'bg-green-600/20 border border-green-500/30'
                : 'bg-green-100 border border-green-200'
            }`}>
              <div className={`font-medium mb-1 ${isDarkMode ? 'text-green-300' : 'text-green-700'}`}>Excelente</div>
              <div className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Tienes acceso a las mejores tasas de interés
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>Ranking global</span>
                <span className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Top 15%</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>Próximo nivel</span>
                <span className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>815 pts</span>
              </div>
            </div>
          </div>
        </div>

        <div className={`lg:col-span-2 rounded-2xl p-6 ${
          isDarkMode ? 'bg-slate-800 border border-slate-700' : 'bg-white border border-gray-200'
        }`}>
          <h3 className={`text-lg font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Evolución del Score</h3>
          <p className={`text-sm mb-6 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Últimos 7 meses</p>

          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={scoreHistory}>
              <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? '#475569' : '#e5e7eb'} />
              <XAxis
                dataKey="month"
                stroke={isDarkMode ? '#94a3b8' : '#6b7280'}
                style={{ fontSize: '12px' }}
              />
              <YAxis
                domain={[600, 850]}
                stroke={isDarkMode ? '#94a3b8' : '#6b7280'}
                style={{ fontSize: '12px' }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: isDarkMode ? '#1e293b' : '#ffffff',
                  border: `1px solid ${isDarkMode ? '#475569' : '#e5e7eb'}`,
                  borderRadius: '8px',
                  color: isDarkMode ? '#fff' : '#000'
                }}
              />
              <Line
                type="monotone"
                dataKey="score"
                stroke="#3b82f6"
                strokeWidth={3}
                dot={{ fill: '#3b82f6', r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className={`rounded-2xl p-6 ${
        isDarkMode ? 'bg-slate-800 border border-slate-700' : 'bg-white border border-gray-200'
      }`}>
        <h3 className={`text-lg font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Factores del Score</h3>
        <p className={`text-sm mb-6 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          Cómo se calcula tu puntuación de confianza
        </p>

        <div className="space-y-6">
          {scoreFactors.map((factor) => (
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

      <div className={`rounded-2xl p-6 ${
        isDarkMode ? 'bg-slate-800 border border-slate-700' : 'bg-white border border-gray-200'
      }`}>
        <h3 className={`text-lg font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Cómo Mejorar tu Score</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className={`p-4 rounded-lg ${
            isDarkMode
              ? 'bg-blue-600/20 border border-blue-500/30'
              : 'bg-blue-100 border border-blue-200'
          }`}>
            <div className={`font-medium mb-2 ${isDarkMode ? 'text-blue-300' : 'text-blue-700'}`}>Paga a Tiempo</div>
            <div className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Mantén un historial de pagos del 100% para maximizar tu score
            </div>
          </div>
          <div className={`p-4 rounded-lg ${
            isDarkMode
              ? 'bg-green-600/20 border border-green-500/30'
              : 'bg-green-100 border border-green-200'
          }`}>
            <div className={`font-medium mb-2 ${isDarkMode ? 'text-green-300' : 'text-green-700'}`}>Diversifica</div>
            <div className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Interactúa con más usuarios para aumentar tu red de confianza
            </div>
          </div>
          <div className={`p-4 rounded-lg ${
            isDarkMode
              ? 'bg-purple-600/20 border border-purple-500/30'
              : 'bg-purple-100 border border-purple-200'
          }`}>
            <div className={`font-medium mb-2 ${isDarkMode ? 'text-purple-300' : 'text-purple-700'}`}>Mantén Actividad</div>
            <div className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Usa la plataforma regularmente para construir antigüedad
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
