import { useState } from 'react';
import { AuthLayout } from './AuthLayout';
import { Button } from './ui/button';
import { FormInput } from './FormInput';
import { ArrowRight } from 'lucide-react';
import { authService, RegisterPayload } from '../services/authService';
import { ApiError } from '../services/api';
import { saveProfileData, saveSession } from '../services/session';

interface RegisterProps {
  onRegister: () => void;
  onSwitchToLogin: () => void;
}

export function Register({ onRegister, onSwitchToLogin }: RegisterProps) {
  const [formData, setFormData] = useState<RegisterPayload>({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    securityQuestion: '',
    securityAnswer: '',
    phone: '',
    address: '',
    blockchainHashId: '',
    role: 'USER',
  });
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const handleChange = (field: keyof RegisterPayload, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setFieldErrors({});

    if (
      !formData.firstName ||
      !formData.lastName ||
      !formData.email ||
      !formData.password ||
      !formData.securityQuestion ||
      !formData.securityAnswer ||
      !confirmPassword
    ) {
      setError('Completa todos los campos obligatorios.');
      return;
    }

    if (formData.password !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    if (formData.password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    setLoading(true);
    try {
      const payload: RegisterPayload = {
        ...formData,
        phone: formData.phone || undefined,
        address: formData.address || undefined,
        blockchainHashId: formData.blockchainHashId || undefined,
      };
      const response = await authService.register(payload);
      saveSession(response);
      saveProfileData({
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone ?? '',
        address: formData.address ?? '',
        blockchainHashId: formData.blockchainHashId ?? '',
      });
      onRegister();
    } catch (err) {
      if (err instanceof ApiError) {
        const apiError = err.payload.error ?? '';
        if (apiError) {
          setError(apiError);
        } else {
          setFieldErrors(err.payload);
        }
      } else {
        setError('No fue posible crear la cuenta.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Crear Cuenta"
      subtitle="Únete a la red de préstamos descentralizados"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormInput
            id="firstName"
            label="Nombre"
            placeholder="Juan"
            value={formData.firstName}
            onChange={(e) => handleChange('firstName', e.target.value)}
            disabled={loading}
            required
          />

          <FormInput
            id="lastName"
            label="Apellido"
            placeholder="Pérez"
            value={formData.lastName}
            onChange={(e) => handleChange('lastName', e.target.value)}
            disabled={loading}
            required
          />
        </div>

        <FormInput
          id="email"
          type="email"
          label="Correo Electrónico"
          placeholder="tu@email.com"
          value={formData.email}
          onChange={(e) => handleChange('email', e.target.value)}
          disabled={loading}
          required
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormInput
            id="password"
            type="password"
            label="Contraseña"
            placeholder="Mínimo 6 caracteres"
            value={formData.password}
            onChange={(e) => handleChange('password', e.target.value)}
            helperText="Al menos 6 caracteres"
            disabled={loading}
            required
          />

          <FormInput
            id="confirmPassword"
            type="password"
            label="Confirmar Contraseña"
            placeholder="Repite tu contraseña"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            disabled={loading}
            required
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormInput
            id="securityQuestion"
            label="Pregunta de Seguridad"
            placeholder="¿Nombre de tu primera mascota?"
            value={formData.securityQuestion}
            onChange={(e) => handleChange('securityQuestion', e.target.value)}
            helperText="Solo tú puedes responder"
            disabled={loading}
            required
          />

          <FormInput
            id="securityAnswer"
            label="Respuesta de Seguridad"
            placeholder="Tu respuesta"
            value={formData.securityAnswer}
            onChange={(e) => handleChange('securityAnswer', e.target.value)}
            disabled={loading}
            required
          />
        </div>

        <details className="rounded-lg border border-slate-700 p-4">
          <summary className="cursor-pointer text-sm font-medium text-gray-300">Campos opcionales</summary>
          <div className="mt-4 space-y-4">
            <FormInput
              id="phone"
              label="Teléfono"
              placeholder="3001234567"
              value={formData.phone}
              onChange={(e) => handleChange('phone', e.target.value)}
              disabled={loading}
            />

            <FormInput
              id="address"
              label="Dirección"
              placeholder="Calle 10 #5-20"
              value={formData.address}
              onChange={(e) => handleChange('address', e.target.value)}
              disabled={loading}
            />

            <FormInput
              id="blockchainHashId"
              label="Blockchain Hash ID"
              placeholder="0xABC"
              value={formData.blockchainHashId}
              onChange={(e) => handleChange('blockchainHashId', e.target.value)}
              disabled={loading}
            />
          </div>
        </details>

        {error && (
          <div className="p-4 bg-red-600/20 border border-red-500/30 rounded-lg">
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}

        <Button
          type="submit"
          className="w-full bg-blue-600 hover:bg-blue-700 shadow-lg font-semibold"
          disabled={loading}
        >
          {loading ? 'Creando cuenta...' : (
            <>
              Crear Cuenta
              <ArrowRight className="w-4 h-4 ml-2" />
            </>
          )}
        </Button>

        <div className="text-center">
          <button
            type="button"
            onClick={onSwitchToLogin}
            className="text-sm text-gray-400 hover:text-white transition-colors"
          >
            ¿Ya tienes cuenta? <span className="text-blue-400 hover:text-blue-300">Inicia sesión</span>
          </button>
        </div>
      </form>
    </AuthLayout>
  );
}
