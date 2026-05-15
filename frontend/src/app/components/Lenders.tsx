import { useEffect, useState, useCallback, useRef } from 'react';
import {
  Search,
  RefreshCw,
  Bookmark,
  ExternalLink,
  ShieldCheck,
  Shield,
  ShieldAlert,
  Users,
  SlidersHorizontal,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import { useTheme } from '../context/ThemeContext';
import { lendersService, type UserCardResponse } from '../services/lendersService';

interface LendersProps {
  onViewProfile?: (userId: number) => void;
}

// ── Trust-score helpers ────────────────────────────────────────────────────

const BADGE = {
  ALTO: {
    icon: <ShieldCheck className="w-4 h-4" />,
    dark:  'bg-green-500/20 border-green-500/40 text-green-400',
    light: 'bg-green-100 border-green-300 text-green-700',
    dot:   'bg-green-500',
  },
  MEDIO: {
    icon: <Shield className="w-4 h-4" />,
    dark:  'bg-amber-500/20 border-amber-500/40 text-amber-400',
    light: 'bg-amber-100 border-amber-300 text-amber-700',
    dot:   'bg-amber-500',
  },
  BAJO: {
    icon: <ShieldAlert className="w-4 h-4" />,
    dark:  'bg-red-500/20 border-red-500/40 text-red-400',
    light: 'bg-red-100 border-red-300 text-red-700',
    dot:   'bg-red-500',
  },
};

function ScoreBadge({ level, score, isDarkMode }: { level: string; score: number; isDarkMode: boolean }) {
  const cfg = BADGE[level as keyof typeof BADGE] ?? BADGE.BAJO;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${isDarkMode ? cfg.dark : cfg.light}`}>
      {cfg.icon}
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {Math.round(score * 10)} / 1000 · {level}
    </span>
  );
}

// ── Score Range Slider ─────────────────────────────────────────────────────

interface RangeSliderProps {
  min: number; max: number;
  valueMin: number; valueMax: number;
  onChange: (min: number, max: number) => void;
  isDarkMode: boolean;
}

function RangeSlider({ min, max, valueMin, valueMax, onChange, isDarkMode }: RangeSliderProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const pct = (v: number) => ((v - min) / (max - min)) * 100;
  const labelCls = isDarkMode ? 'text-gray-400' : 'text-gray-500';
  const valueCls = isDarkMode ? 'text-white' : 'text-gray-900';
  const thumbCls = `appearance-none h-4 w-4 rounded-full bg-blue-500 cursor-pointer
    border-2 border-white shadow-md focus:outline-none`;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs">
        <span className={labelCls}>Trust Score</span>
        <span className={`font-semibold ${valueCls}`}>
          {Math.round(valueMin * 10)} – {Math.round(valueMax * 10)}
        </span>
      </div>

      {/* Track visual */}
      <div ref={trackRef} className="relative h-2 rounded-full bg-gray-600">
        <div
          className="absolute h-full rounded-full bg-blue-500"
          style={{ left: `${pct(valueMin)}%`, right: `${100 - pct(valueMax)}%` }}
        />
        {/* Min thumb */}
        <input
          type="range" min={min} max={max} step={1}
          value={valueMin}
          onChange={e => {
            const v = Math.min(Number(e.target.value), valueMax - 1);
            onChange(v, valueMax);
          }}
          className={`absolute inset-0 w-full opacity-0 h-2 cursor-pointer z-20 ${thumbCls}`}
          style={{ pointerEvents: 'all' }}
        />
        {/* Max thumb */}
        <input
          type="range" min={min} max={max} step={1}
          value={valueMax}
          onChange={e => {
            const v = Math.max(Number(e.target.value), valueMin + 1);
            onChange(valueMin, v);
          }}
          className={`absolute inset-0 w-full opacity-0 h-2 cursor-pointer z-20 ${thumbCls}`}
          style={{ pointerEvents: 'all' }}
        />
        {/* Visual thumbs */}
        <div className="absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-blue-500 border-2 border-white shadow pointer-events-none"
          style={{ left: `calc(${pct(valueMin)}% - 8px)` }} />
        <div className="absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-blue-500 border-2 border-white shadow pointer-events-none"
          style={{ left: `calc(${pct(valueMax)}% - 8px)` }} />
      </div>

      <div className="flex justify-between text-xs">
        <span className={labelCls}>0</span>
        <span className={labelCls}>500</span>
        <span className={labelCls}>1000</span>
      </div>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────

export function Lenders({ onViewProfile }: LendersProps) {
  const { isDarkMode } = useTheme();

  const [lenders, setLenders]       = useState<UserCardResponse[]>([]);
  const [loading, setLoading]       = useState(true);
  const [savingId, setSavingId]     = useState<number | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  // Filter state (displayed as 0–1000 scale, sent as 0–100 to API)
  const [name, setName]           = useState('');
  const [minScore, setMinScore]   = useState(0);    // raw 0–100
  const [maxScore, setMaxScore]   = useState(100);  // raw 0–100

  const cardCls = isDarkMode
    ? 'bg-slate-800 border border-slate-700'
    : 'bg-white border border-gray-200';
  const labelCls = isDarkMode ? 'text-gray-400' : 'text-gray-500';
  const valueCls = isDarkMode ? 'text-white' : 'text-gray-900';

  // ── Fetch ────────────────────────────────────────────────────────────────

  const fetchLenders = useCallback(() => {
    setLoading(true);
    lendersService.getDirectory({
      name:     name.trim() || undefined,
      minScore: minScore > 0   ? minScore   : undefined,
      maxScore: maxScore < 100 ? maxScore   : undefined,
    })
      .then(setLenders)
      .catch(() => toast.error('No se pudo cargar el directorio.'))
      .finally(() => setLoading(false));
  }, [name, minScore, maxScore]);

  // Debounced search
  useEffect(() => {
    const t = setTimeout(fetchLenders, 400);
    return () => clearTimeout(t);
  }, [fetchLenders]);

  // ── Save / unsave ────────────────────────────────────────────────────────

  const handleToggleSave = async (lender: UserCardResponse) => {
    setSavingId(lender.userId);
    try {
      if (lender.saved) {
        await lendersService.unsave(lender.userId);
        toast.success(`${lender.displayName} eliminado de guardados.`);
      } else {
        await lendersService.save(lender.userId);
        toast.success(`${lender.displayName} guardado.`);
      }
      setLenders(prev =>
        prev.map(l => l.userId === lender.userId ? { ...l, saved: !l.saved } : l)
      );
    } catch {
      toast.error('No se pudo actualizar.');
    } finally {
      setSavingId(null);
    }
  };

  // ── Reset filters ────────────────────────────────────────────────────────

  const hasActiveFilters = name.trim() !== '' || minScore > 0 || maxScore < 100;

  const resetFilters = () => {
    setName('');
    setMinScore(0);
    setMaxScore(100);
  };

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className={`text-3xl font-bold mb-1 ${valueCls}`}>Directorio de Prestamistas</h1>
        <p className={`text-sm ${labelCls}`}>
          Explora usuarios de la plataforma, consulta su reputación y guarda los que te interesen.
        </p>
      </div>

      {/* Filter bar */}
      <div className={`rounded-2xl p-4 space-y-4 ${cardCls}`}>
        <div className="flex items-center gap-3">
          {/* Search by name */}
          <div className="relative flex-1">
            <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${labelCls}`} />
            <input
              type="text"
              placeholder="Buscar por nombre..."
              value={name}
              onChange={e => setName(e.target.value)}
              className={`w-full pl-9 pr-4 py-2.5 rounded-lg outline-none transition-all text-sm ${
                isDarkMode
                  ? 'bg-slate-700 border border-slate-600 text-white placeholder:text-gray-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30'
                  : 'bg-gray-50 border border-gray-300 text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200'
              }`}
            />
          </div>

          {/* Toggle score filter */}
          <button
            onClick={() => setShowFilters(v => !v)}
            className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors border ${
              showFilters
                ? 'bg-blue-600 text-white border-blue-600'
                : isDarkMode
                ? 'border-slate-600 text-gray-300 hover:bg-slate-700'
                : 'border-gray-300 text-gray-700 hover:bg-gray-100'
            }`}
          >
            <SlidersHorizontal className="w-4 h-4" />
            Score
          </button>

          {/* Refresh */}
          <button
            onClick={fetchLenders}
            className={`p-2.5 rounded-lg transition-colors border ${
              isDarkMode
                ? 'border-slate-600 text-gray-400 hover:bg-slate-700'
                : 'border-gray-300 text-gray-600 hover:bg-gray-100'
            }`}
            title="Actualizar"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          {/* Reset */}
          {hasActiveFilters && (
            <button
              onClick={resetFilters}
              className={`flex items-center gap-1 px-3 py-2.5 rounded-lg text-sm border transition-colors ${
                isDarkMode
                  ? 'border-slate-600 text-gray-400 hover:bg-slate-700'
                  : 'border-gray-300 text-gray-600 hover:bg-gray-100'
              }`}
            >
              <X className="w-3.5 h-3.5" /> Limpiar
            </button>
          )}
        </div>

        {/* Score range slider */}
        {showFilters && (
          <div className={`pt-2 border-t ${isDarkMode ? 'border-slate-700' : 'border-gray-200'}`}>
            <RangeSlider
              min={0} max={100}
              valueMin={minScore} valueMax={maxScore}
              onChange={(lo, hi) => { setMinScore(lo); setMaxScore(hi); }}
              isDarkMode={isDarkMode}
            />
          </div>
        )}
      </div>

      {/* Results count */}
      <div className={`text-sm ${labelCls}`}>
        {loading ? 'Cargando...' : (
          <>
            <span className={`font-semibold ${valueCls}`}>{lenders.length}</span> usuario{lenders.length !== 1 ? 's' : ''} encontrado{lenders.length !== 1 ? 's' : ''}
            {hasActiveFilters && <span className="ml-1">(con filtros activos)</span>}
          </>
        )}
      </div>

      {/* Empty state */}
      {!loading && lenders.length === 0 && (
        <div className={`text-center py-16 rounded-2xl ${cardCls}`}>
          <Users className={`w-12 h-12 mx-auto mb-3 ${labelCls}`} />
          <p className={`font-medium ${valueCls}`}>No se encontraron usuarios</p>
          <p className={`text-sm mt-1 ${labelCls}`}>
            Prueba ajustando los filtros o el rango de Trust Score.
          </p>
        </div>
      )}

      {/* Cards grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {lenders.map(lender => (
          <LenderCard
            key={lender.userId}
            lender={lender}
            isDarkMode={isDarkMode}
            onViewProfile={onViewProfile}
            onToggleSave={handleToggleSave}
            isSaving={savingId === lender.userId}
          />
        ))}
      </div>
    </div>
  );
}

// ── LenderCard ─────────────────────────────────────────────────────────────

interface LenderCardProps {
  lender: UserCardResponse;
  isDarkMode: boolean;
  onViewProfile?: (userId: number) => void;
  onToggleSave: (lender: UserCardResponse) => void;
  isSaving: boolean;
}

function LenderCard({ lender, isDarkMode, onViewProfile, onToggleSave, isSaving }: LenderCardProps) {
  const cardCls = isDarkMode ? 'bg-slate-800 border border-slate-700' : 'bg-white border border-gray-200';
  const labelCls = isDarkMode ? 'text-gray-400' : 'text-gray-500';
  const valueCls = isDarkMode ? 'text-white' : 'text-gray-900';

  const avatarLetter = lender.displayName.charAt(0).toUpperCase();
  const displayScore = Math.round(lender.trustScore * 10);

  const avatarColor =
    lender.level === 'ALTO'  ? 'bg-green-600'  :
    lender.level === 'MEDIO' ? 'bg-amber-600'  :
                               'bg-red-600';

  return (
    <div className={`rounded-2xl p-5 flex flex-col gap-4 transition-shadow hover:shadow-lg ${cardCls}`}>
      {/* Top: avatar + name + score */}
      <div className="flex items-center gap-3">
        <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${avatarColor}`}>
          <span className="text-xl font-bold text-white">{avatarLetter}</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className={`font-semibold truncate ${valueCls}`}>{lender.displayName}</p>
          {lender.memberSince && (
            <p className={`text-xs ${labelCls}`}>
              Miembro desde{' '}
              {new Date(lender.memberSince).toLocaleDateString('es-CO', { year: 'numeric', month: 'short' })}
            </p>
          )}
        </div>
      </div>

      {/* Score badge */}
      <ScoreBadge level={lender.level} score={lender.trustScore} isDarkMode={isDarkMode} />

      {/* Level description */}
      <p className={`text-xs leading-relaxed ${labelCls}`}>{lender.levelDescription}</p>

      {/* Actions */}
      <div className="flex gap-2 mt-auto">
        {onViewProfile && (
          <button
            onClick={() => onViewProfile(lender.userId)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium transition-colors ${
              isDarkMode
                ? 'bg-indigo-600/80 hover:bg-indigo-600 text-white'
                : 'bg-indigo-100 hover:bg-indigo-200 text-indigo-700'
            }`}
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Ver perfil
          </button>
        )}
        <button
          onClick={() => onToggleSave(lender)}
          disabled={isSaving}
          title={lender.saved ? 'Quitar de guardados' : 'Guardar prestamista'}
          className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
            lender.saved
              ? isDarkMode ? 'bg-blue-600/30 text-blue-300 border border-blue-500/40' : 'bg-blue-100 text-blue-700 border border-blue-200'
              : isDarkMode ? 'bg-slate-700 hover:bg-slate-600 text-gray-300 border border-slate-600' : 'bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-300'
          } ${isSaving ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <Bookmark className={`w-4 h-4 ${lender.saved ? 'fill-current' : ''}`} />
          {lender.saved ? 'Guardado' : 'Guardar'}
        </button>
      </div>
    </div>
  );
}
