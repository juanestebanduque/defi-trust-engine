import { useEffect, useState } from 'react';
import { ArrowLeft, ShieldCheck, ShieldAlert, Shield, AlertTriangle } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { publicProfileService, type PublicProfileResponse } from '../services/publicProfileService';

interface PublicProfileProps {
  userId: number;
  onBack?: () => void;
}

export function PublicProfile({ userId, onBack }: PublicProfileProps) {
  const { isDarkMode } = useTheme();
  const [profile, setProfile] = useState<PublicProfileResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    publicProfileService
      .getPublicProfile(userId)
      .then(setProfile)
      .catch(() => setError('No se pudo cargar el perfil público.'))
      .finally(() => setLoading(false));
  }, [userId]);

  // ── Badge config ────────────────────────────────────────────────────────────
  const getBadgeConfig = (level: string) => {
    switch (level) {
      case 'ALTO':
        return {
          icon: <ShieldCheck className="w-8 h-8" />,
          label: 'ALTO',
          bg: isDarkMode
            ? 'bg-green-500/20 border-green-500/40 text-green-400'
            : 'bg-green-100 border-green-300 text-green-700',
          ring: isDarkMode ? 'ring-green-500/30' : 'ring-green-300/50',
          dot: 'bg-green-500',
        };
      case 'MEDIO':
        return {
          icon: <Shield className="w-8 h-8" />,
          label: 'MEDIO',
          bg: isDarkMode
            ? 'bg-amber-500/20 border-amber-500/40 text-amber-400'
            : 'bg-amber-100 border-amber-300 text-amber-700',
          ring: isDarkMode ? 'ring-amber-500/30' : 'ring-amber-300/50',
          dot: 'bg-amber-500',
        };
      default:
        return {
          icon: <ShieldAlert className="w-8 h-8" />,
          label: 'BAJO',
          bg: isDarkMode
            ? 'bg-red-500/20 border-red-500/40 text-red-400'
            : 'bg-red-100 border-red-300 text-red-700',
          ring: isDarkMode ? 'ring-red-500/30' : 'ring-red-300/50',
          dot: 'bg-red-500',
        };
    }
  };

  const cardCls = isDarkMode
    ? 'bg-slate-800 border border-slate-700'
    : 'bg-white border border-gray-200';
  const labelCls = isDarkMode ? 'text-gray-400' : 'text-gray-500';
  const valueCls = isDarkMode ? 'text-white' : 'text-gray-900';
  const titleCls = `text-2xl font-bold mb-1 ${valueCls}`;

  // ── States ──────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className={`text-center py-16 ${labelCls}`}>Cargando perfil público...</div>
    );
  }

  if (error || !profile) {
    return (
      <div className="space-y-4">
        {onBack && (
          <button
            onClick={onBack}
            className={`flex items-center gap-2 text-sm ${labelCls} hover:underline`}
          >
            <ArrowLeft className="w-4 h-4" /> Volver
          </button>
        )}
        <p className={`text-center py-12 ${isDarkMode ? 'text-red-400' : 'text-red-600'}`}>
          {error ?? 'Perfil no encontrado.'}
        </p>
      </div>
    );
  }

  const badge = getBadgeConfig(profile.level);
  const scoreDisplay = Math.round(profile.trustScore * 10);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        {onBack && (
          <button
            onClick={onBack}
            className={`p-2 rounded-lg transition-colors ${
              isDarkMode ? 'hover:bg-slate-700 text-gray-400' : 'hover:bg-gray-100 text-gray-600'
            }`}
            title="Volver"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
        )}
        <div>
          <h1 className={titleCls}>Perfil Público</h1>
          <p className={`text-sm ${labelCls}`}>Reputación financiera verificada en blockchain</p>
        </div>
      </div>

      {/* Blocked banner */}
      {profile.blocked && (
        <div
          className={`flex items-center gap-3 p-4 rounded-xl border ${
            isDarkMode
              ? 'bg-red-500/10 border-red-500/30 text-red-400'
              : 'bg-red-50 border-red-200 text-red-700'
          }`}
        >
          <AlertTriangle className="w-5 h-5 flex-shrink-0" />
          <span className="font-medium">Esta cuenta ha sido bloqueada y no puede operar en la plataforma.</span>
        </div>
      )}

      {/* Identity + Badge */}
      <div className={`rounded-2xl p-6 ${cardCls}`}>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
          {/* Avatar */}
          <div className="w-16 h-16 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
            <span className="text-2xl font-bold text-white">
              {profile.displayName.charAt(0).toUpperCase()}
            </span>
          </div>

          <div className="flex-1">
            <h2 className={`text-xl font-bold mb-1 ${valueCls}`}>{profile.displayName}</h2>
            {profile.scoreDate && (
              <p className={`text-xs ${labelCls}`}>
                Score calculado el{' '}
                {new Date(profile.scoreDate).toLocaleDateString('es-CO', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </p>
            )}
          </div>

          {/* Trust Score Badge */}
          <div
            className={`flex flex-col items-center gap-2 px-6 py-4 rounded-xl border-2 ring-4 ${badge.bg} ${badge.ring}`}
          >
            {badge.icon}
            <div className="text-center">
              <div className="text-3xl font-black">{scoreDisplay}</div>
              <div className="text-xs font-semibold tracking-widest opacity-80">/ 1000</div>
              <div className={`mt-1 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-bold`}>
                <span className={`w-2 h-2 rounded-full ${badge.dot}`} />
                Nivel {badge.label}
              </div>
            </div>
          </div>
        </div>

        {/* Level description */}
        <p className={`mt-4 text-sm ${labelCls}`}>{profile.levelDescription}</p>
      </div>

      {/* Payment summary */}
      <div className={`rounded-2xl p-6 ${cardCls}`}>
        <h3 className={`text-lg font-semibold mb-4 ${valueCls}`}>Resumen de Historial de Pagos</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <SummaryCard
            label="Total préstamos"
            value={`$${Number(profile.totalLoansTaken).toLocaleString('es-CO')}`}
            isDarkMode={isDarkMode}
          />
          <SummaryCard
            label="Total repagado"
            value={`$${Number(profile.totalRepaid).toLocaleString('es-CO')}`}
            isDarkMode={isDarkMode}
            positive
          />
          <SummaryCard
            label="Pagos perdidos"
            value={String(profile.missedPayments)}
            isDarkMode={isDarkMode}
            negative={profile.missedPayments > 0}
          />
          <SummaryCard
            label="Deuda pendiente"
            value={`$${Number(profile.pendingBalance).toLocaleString('es-CO')}`}
            isDarkMode={isDarkMode}
            negative={Number(profile.pendingBalance) > 0}
          />
        </div>
      </div>
    </div>
  );
}

// ── Internal sub-component ──────────────────────────────────────────────────

interface SummaryCardProps {
  label: string;
  value: string;
  isDarkMode: boolean;
  positive?: boolean;
  negative?: boolean;
}

function SummaryCard({ label, value, isDarkMode, positive, negative }: SummaryCardProps) {
  const baseBg = isDarkMode ? 'bg-slate-700/50' : 'bg-gray-50';
  const labelColor = isDarkMode ? 'text-gray-400' : 'text-gray-500';
  const valueColor = negative
    ? isDarkMode ? 'text-red-400' : 'text-red-600'
    : positive
    ? isDarkMode ? 'text-green-400' : 'text-green-600'
    : isDarkMode ? 'text-white' : 'text-gray-900';

  return (
    <div className={`rounded-xl p-4 ${baseBg}`}>
      <p className={`text-xs mb-1 ${labelColor}`}>{label}</p>
      <p className={`text-lg font-bold ${valueColor}`}>{value}</p>
    </div>
  );
}
