import React, { useEffect, useMemo, useState } from 'react';
import { AuthLayout } from './AuthLayout';
import { Button } from './ui/button';
import { FormInput } from './FormInput';
import { authService } from '../services/authService';
import { ApiError } from '../services/api';
import { saveSession } from '../services/session';

interface LoginProps {
  onLogin: () => void;
  onSwitchToRegister: () => void;
  onSwitchToForgotPassword: () => void;
}

export function Login({ onLogin, onSwitchToRegister, onSwitchToForgotPassword }: LoginProps) {
  const MAX_ATTEMPTS = 3;
  const BLOCK_DURATION_MS = 5 * 60 * 1000;

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [remainingAttempts, setRemainingAttempts] = useState<number | null>(null);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [blockedUntil, setBlockedUntil] = useState<number | null>(null);
  const [now, setNow] = useState(Date.now());

  const blocked = useMemo(() => {
    if (!blockedUntil) return false;
    return blockedUntil > now;
  }, [blockedUntil, now]);

  const blockRemainingSeconds = useMemo(() => {
    if (!blockedUntil) return 0;
    return Math.max(0, Math.ceil((blockedUntil - now) / 1000));
  }, [blockedUntil, now]);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!blockedUntil) return;
    if (blockedUntil <= now) {
      setBlockedUntil(null);
      setFailedAttempts(0);
      setRemainingAttempts(null);
      setError('');
    }
  }, [blockedUntil, now]);

  const blockForFiveMinutes = () => {
    const lockUntil = Date.now() + BLOCK_DURATION_MS;
    setBlockedUntil(lockUntil);
    setFailedAttempts(MAX_ATTEMPTS);
    setRemainingAttempts(0);
    setError('Cuenta bloqueada por múltiples intentos fallidos. Intenta de nuevo en 5 minutos.');
  };

  const getAttemptsFromMessage = (message: string): number | null => {
    const match = message.match(/Intentos fallidos:\s*(\d+)/i);
    if (!match) {
      return null;
    }
    const parsed = Number(match[1]);
    return Number.isNaN(parsed) ? null : parsed;
  };

  const isInvalidCredentialsMessage = (message: string): boolean => {
    return /credenciales?\s+inv[áa]lidas?/i.test(message);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (blocked) {
      return;
    }

    setError('');
    setRemainingAttempts(null);

    if (!email || !password) {
      setError('Por favor completa todos los campos');
      return;
    }

    setLoading(true);
    try {
      const response = await authService.login({ email, password });
      saveSession(response);
      setFailedAttempts(0);
      setBlockedUntil(null);
      onLogin();
    } catch (err) {
      if (err instanceof ApiError) {
        const backendMessage = err.payload.error ?? 'No fue posible iniciar sesión.';
        setError(backendMessage);

        const serverAttempts = getAttemptsFromMessage(backendMessage);
        if (serverAttempts !== null || isInvalidCredentialsMessage(backendMessage)) {
          setFailedAttempts((prev) => {
            // Si backend trae contador, usamos el mayor entre backend y el siguiente local
            // para evitar quedarnos pegados cuando backend responde siempre "1".
            const nextAttempts = serverAttempts !== null ? Math.max(serverAttempts, prev + 1) : prev + 1;
            const remaining = Math.max(0, MAX_ATTEMPTS - nextAttempts);
            setRemainingAttempts(remaining);
            if (nextAttempts >= MAX_ATTEMPTS) {
              blockForFiveMinutes();
            }
            return nextAttempts;
          });
        }

        if (backendMessage.toLowerCase().includes('bloqueada')) {
          blockForFiveMinutes();
        }
      } else {
        setError('No fue posible iniciar sesión.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="TrustFi"
      subtitle="Préstamos P2P con reputación descentralizada"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="p-4 bg-red-600/20 border border-red-500/30 rounded-lg">
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}

        <FormInput
          id="email"
          type="email"
          label="Correo Electrónico"
          placeholder="tu@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={loading || blocked}
          required
        />

        <div className="space-y-2">
          <FormInput
            id="password"
            type="password"
            label="Contraseña"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading || blocked}
            required
          />
        </div>

        <Button
          type="submit"
          className="w-full bg-blue-600 hover:bg-blue-700 shadow-lg font-semibold"
          disabled={loading || blocked}
        >
          {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
        </Button>

        {remainingAttempts !== null && !blocked && (
          <p className="text-sm text-amber-500 text-center">Te quedan {remainingAttempts} intentos.</p>
        )}

        {blocked && (
          <p className="text-sm text-red-400 text-center">
            Cuenta bloqueada temporalmente. Intenta en {Math.floor(blockRemainingSeconds / 60)}:
            {String(blockRemainingSeconds % 60).padStart(2, '0')} minutos.
          </p>
        )}

        <div className="text-center">
          <button
            type="button"
            onClick={onSwitchToForgotPassword}
            className="text-sm text-blue-400 hover:text-blue-300 transition-colors block w-full mb-2"
          >
            ¿Olvidaste tu contraseña?
          </button>
          <button
            type="button"
            onClick={onSwitchToRegister}
            className="text-sm text-gray-400 hover:text-white transition-colors"
          >
            ¿No tienes cuenta? <span className="text-blue-400 hover:text-blue-300">Regístrate</span>
          </button>
        </div>
      </form>
    </AuthLayout>
  );
}
