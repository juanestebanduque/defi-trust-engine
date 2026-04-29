import { useState } from 'react';
import { AuthLayout } from './AuthLayout';
import { Button } from './ui/button';
import { FormInput } from './FormInput';
import { ArrowLeft } from 'lucide-react';
import { authService } from '../services/authService';
import { ApiError } from '../services/api';

interface ForgotPasswordProps {
  onSwitchToLogin: () => void;
}

type Step = 1 | 2 | 3;

export function ForgotPassword({ onSwitchToLogin }: ForgotPasswordProps) {
  const [step, setStep] = useState<Step>(1);
  const [email, setEmail] = useState('');
  const [securityAnswer, setSecurityAnswer] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!email || !securityAnswer || !newPassword || !confirmPassword) {
      setError('Todos los campos son obligatorios.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    setLoading(true);
    try {
      const message = await authService.forgotPassword({ email, securityAnswer, newPassword });
      setSuccess(message);
      setTimeout(onSwitchToLogin, 1200);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.payload.error ?? 'No fue posible restablecer la contraseña.');
      } else {
        setError('No fue posible restablecer la contraseña.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout title="Recuperar Contraseña" subtitle="Restablece tu acceso de forma segura">
      <form onSubmit={handleSubmit} className="space-y-6">
        <FormInput
          id="email"
          type="email"
          label="Correo Electrónico"
          placeholder="tu@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={loading || step > 1}
          required
        />

        {step >= 2 && (
          <FormInput
            id="securityAnswer"
            label="Respuesta de Seguridad"
            placeholder="Tu respuesta"
            value={securityAnswer}
            onChange={(e) => setSecurityAnswer(e.target.value)}
            disabled={loading || step > 2}
            required
          />
        )}

        {step >= 3 && (
          <>
            <FormInput
              id="newPassword"
              type="password"
              label="Nueva contraseña"
              placeholder="Nueva contraseña"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              disabled={loading}
              required
            />

            <FormInput
              id="confirmPassword"
              type="password"
              label="Confirmar contraseña"
              placeholder="Confirma la nueva contraseña"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={loading}
              required
            />
          </>
        )}

        {error && (
          <div className="p-4 bg-red-600/20 border border-red-500/30 rounded-lg">
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}
        {success && (
          <div className="p-4 bg-green-600/20 border border-green-500/30 rounded-lg">
            <p className="text-sm text-green-400">{success}</p>
          </div>
        )}

        {step === 1 && (
          <Button type="button" className="w-full bg-blue-600 hover:bg-blue-700 shadow-lg font-semibold" onClick={() => setStep(2)}>
            Continuar
          </Button>
        )}

        {step === 2 && (
          <Button type="button" className="w-full bg-blue-600 hover:bg-blue-700 shadow-lg font-semibold" onClick={() => setStep(3)}>
            Continuar
          </Button>
        )}

        {step === 3 && (
          <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 shadow-lg font-semibold" disabled={loading}>
            {loading ? 'Restableciendo...' : 'Restablecer contraseña'}
          </Button>
        )}

        <Button
          type="button"
          variant="outline"
          className="w-full border-slate-600 text-gray-300 hover:bg-slate-700 hover:text-white"
          onClick={onSwitchToLogin}
          disabled={loading}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Volver al login
        </Button>
      </form>
    </AuthLayout>
  );
}
