import { useEffect, useState } from 'react';
import {
  Users, ShieldOff, ShieldCheck, RefreshCw, Search, TrendingUp, Crown, Zap
} from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { useTheme } from '../context/ThemeContext';
import { adminService, type AdminUserDTO } from '../services/adminService';
import { apiFetch } from '../services/api';
import { getUserId } from '../services/session';
import { ApiError } from '../services/api';
import { toast } from 'sonner';

export function AdminPanel() {
  const { isDarkMode } = useTheme();
  const [users, setUsers] = useState<AdminUserDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [actionId, setActionId] = useState<number | null>(null);
  const [runningPenalties, setRunningPenalties] = useState(false);

  const myId = getUserId();

  const fetchUsers = () => {
    setLoading(true);
    adminService.listUsers()
      .then(setUsers)
      .catch(() => toast.error('No se pudo cargar la lista de usuarios.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchUsers(); }, []);

  const handleRunPenalties = async () => {
    setRunningPenalties(true);
    try {
      const result = await apiFetch<{ affectedUsers: number; penalizedInstallments: number; message: string }>(
        '/admin/penalties/run', { method: 'POST' }
      );
      toast.success(result.message);
      fetchUsers();
    } catch {
      toast.error('Error al ejecutar penalizaciones.');
    } finally {
      setRunningPenalties(false);
    }
  };

  const handleBlock = async (user: AdminUserDTO) => {
    setActionId(user.id);
    try {
      const updated = await adminService.blockUser(user.id);
      setUsers(prev => prev.map(u => u.id === updated.id ? updated : u));
      toast.success(`Usuario ${user.email} bloqueado.`);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Error al bloquear usuario.');
    } finally {
      setActionId(null);
    }
  };

  const handleActivate = async (user: AdminUserDTO) => {
    setActionId(user.id);
    try {
      const updated = await adminService.activateUser(user.id);
      setUsers(prev => prev.map(u => u.id === updated.id ? updated : u));
      toast.success(`Usuario ${user.email} activado.`);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Error al activar usuario.');
    } finally {
      setActionId(null);
    }
  };

  const filtered = users.filter(u =>
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    u.fullName.toLowerCase().includes(search.toLowerCase())
  );

  const trustColor = (level: string) => {
    if (level === 'ALTO')  return isDarkMode ? 'text-green-400'  : 'text-green-700';
    if (level === 'MEDIO') return isDarkMode ? 'text-blue-400'   : 'text-blue-700';
    return isDarkMode ? 'text-orange-400' : 'text-orange-700';
  };

  const stats = {
    total:   users.length,
    active:  users.filter(u => u.status === 'ACTIVE').length,
    blocked: users.filter(u => u.status === 'BLOCKED').length,
    admins:  users.filter(u => u.role === 'ADMIN').length,
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className={`text-3xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
          Panel de Administración
        </h1>
        <p className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>
          Gestión de usuarios de la plataforma
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Usuarios',   value: stats.total,   icon: Users,       color: 'text-blue-500' },
          { label: 'Activos',          value: stats.active,  icon: ShieldCheck, color: 'text-green-500' },
          { label: 'Bloqueados',       value: stats.blocked, icon: ShieldOff,   color: 'text-red-500' },
          { label: 'Administradores',  value: stats.admins,  icon: Crown,       color: 'text-yellow-500' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className={`rounded-xl p-5 border ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
            <div className="flex items-center gap-3">
              <Icon className={`w-5 h-5 ${color}`} />
              <div>
                <div className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{value}</div>
                <div className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>{label}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Penalty trigger */}
      <div className={`flex items-center justify-between p-4 rounded-xl border ${
        isDarkMode ? 'bg-orange-600/10 border-orange-500/30' : 'bg-orange-50 border-orange-200'
      }`}>
        <div>
          <p className={`text-sm font-semibold ${isDarkMode ? 'text-orange-300' : 'text-orange-700'}`}>
            Penalización de Trust Score
          </p>
          <p className={`text-xs mt-0.5 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            El sistema ejecuta esto automáticamente cada medianoche. Usa este botón para forzar la ejecución manual.
          </p>
        </div>
        <Button
          className="bg-orange-600 hover:bg-orange-700 text-white font-semibold shrink-0 ml-4"
          onClick={handleRunPenalties}
          disabled={runningPenalties}
        >
          <Zap className="w-4 h-4 mr-2" />
          {runningPenalties ? 'Procesando...' : 'Ejecutar ahora'}
        </Button>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-3">
        <div className={`flex-1 flex items-center gap-2 px-4 py-2.5 rounded-lg border ${
          isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-300'
        }`}>
          <Search className={`w-4 h-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-400'}`} />
          <input
            type="text"
            placeholder="Buscar por email o nombre..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className={`flex-1 bg-transparent outline-none text-sm ${isDarkMode ? 'text-white placeholder:text-gray-500' : 'text-gray-900 placeholder:text-gray-400'}`}
          />
        </div>
        <button
          onClick={fetchUsers}
          className={`flex items-center gap-1.5 text-sm px-3 py-2.5 rounded-lg border transition-colors ${
            isDarkMode ? 'border-slate-700 hover:bg-slate-700 text-gray-400' : 'border-gray-300 hover:bg-gray-100 text-gray-600'
          }`}
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Actualizar
        </button>
      </div>

      {/* User table */}
      <div className={`rounded-2xl border overflow-hidden ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
        {loading ? (
          <p className={`text-center py-12 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            Cargando usuarios...
          </p>
        ) : filtered.length === 0 ? (
          <p className={`text-center py-12 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            No se encontraron usuarios.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className={`border-b text-xs uppercase tracking-wide ${
                  isDarkMode ? 'border-slate-700 text-gray-400 bg-slate-900/50' : 'border-gray-200 text-gray-500 bg-gray-50'
                }`}>
                  <th className="text-left px-5 py-3">Usuario</th>
                  <th className="text-left px-5 py-3">Rol</th>
                  <th className="text-left px-5 py-3">Estado</th>
                  <th className="text-left px-5 py-3">Trust Score</th>
                  <th className="text-left px-5 py-3">Deuda</th>
                  <th className="text-left px-5 py-3">Pagos omitidos</th>
                  <th className="text-left px-5 py-3">Registro</th>
                  <th className="px-5 py-3">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(user => {
                  const isSelf = user.id === myId;
                  const isAdmin = user.role === 'ADMIN';
                  const isBlocked = user.status === 'BLOCKED';
                  const busy = actionId === user.id;

                  return (
                    <tr
                      key={user.id}
                      className={`border-b last:border-0 transition-colors ${
                        isDarkMode
                          ? 'border-slate-700 hover:bg-slate-700/40'
                          : 'border-gray-100 hover:bg-gray-50'
                      } ${isBlocked ? isDarkMode ? 'opacity-60' : 'opacity-70' : ''}`}
                    >
                      {/* Usuario */}
                      <td className="px-5 py-4">
                        <div className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                          {user.fullName}
                        </div>
                        <div className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                          {user.email}
                        </div>
                      </td>

                      {/* Rol */}
                      <td className="px-5 py-4">
                        {isAdmin ? (
                          <span className="flex items-center gap-1 text-yellow-500 font-semibold text-xs">
                            <Crown className="w-3.5 h-3.5" /> Admin
                          </span>
                        ) : (
                          <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Usuario</span>
                        )}
                      </td>

                      {/* Estado */}
                      <td className="px-5 py-4">
                        <Badge className={
                          isBlocked
                            ? isDarkMode ? 'bg-red-600/20 text-red-400 border border-red-500/30' : 'bg-red-100 text-red-700 border border-red-200'
                            : isDarkMode ? 'bg-green-600/20 text-green-400 border border-green-500/30' : 'bg-green-100 text-green-700 border border-green-200'
                        }>
                          {isBlocked ? (
                            <><ShieldOff className="w-3 h-3 mr-1 inline" />Bloqueado</>
                          ) : (
                            <><ShieldCheck className="w-3 h-3 mr-1 inline" />Activo</>
                          )}
                        </Badge>
                      </td>

                      {/* Trust Score */}
                      <td className="px-5 py-4">
                        <span className={`font-semibold ${trustColor(user.trustLevel)}`}>
                          {Math.round(Number(user.trustScore) * 10)}/1000
                        </span>
                        <div className={`flex items-center gap-1 text-xs mt-0.5 ${trustColor(user.trustLevel)}`}>
                          <TrendingUp className="w-3 h-3" /> {user.trustLevel}
                        </div>
                      </td>

                      {/* Deuda */}
                      <td className="px-5 py-4">
                        <span className={`font-medium ${
                          Number(user.currentDebt) > 0
                            ? 'text-red-500'
                            : isDarkMode ? 'text-gray-300' : 'text-gray-700'
                        }`}>
                          ${Number(user.currentDebt).toLocaleString()}
                        </span>
                      </td>

                      {/* Pagos omitidos */}
                      <td className="px-5 py-4">
                        <span className={`font-medium ${
                          (user.missedPayments ?? 0) > 0
                            ? 'text-red-500'
                            : isDarkMode ? 'text-gray-300' : 'text-gray-700'
                        }`}>
                          {user.missedPayments ?? 0}
                        </span>
                      </td>

                      {/* Registro */}
                      <td className={`px-5 py-4 text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        {new Date(user.createdAt).toLocaleDateString('es-CO')}
                      </td>

                      {/* Acciones */}
                      <td className="px-5 py-4">
                        {isSelf || isAdmin ? (
                          <span className={`text-xs italic ${isDarkMode ? 'text-gray-600' : 'text-gray-400'}`}>—</span>
                        ) : isBlocked ? (
                          <Button
                            size="sm"
                            className="bg-green-600 hover:bg-green-700 text-white font-semibold"
                            onClick={() => handleActivate(user)}
                            disabled={busy}
                          >
                            <ShieldCheck className="w-3.5 h-3.5 mr-1" />
                            {busy ? '...' : 'Activar'}
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            className="bg-red-600 hover:bg-red-700 text-white font-semibold"
                            onClick={() => handleBlock(user)}
                            disabled={busy}
                          >
                            <ShieldOff className="w-3.5 h-3.5 mr-1" />
                            {busy ? '...' : 'Bloquear'}
                          </Button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
