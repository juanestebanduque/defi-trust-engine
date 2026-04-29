import { useState } from 'react';
import { AuthLayout } from './AuthLayout';
import { Button } from './ui/button';
import { FormInput } from './FormInput';
import { toast } from 'sonner';

interface LoginProps {
  onLogin: (email: string) => void;
  onSwitchToRegister: () => void;
  onForgotPassword: () => void;
}

interface FieldErrors {
  [key: string]: string;
}

export function Login({ onLogin, onSwitchToRegister, onForgotPassword }: LoginProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [globalError, setGlobalError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [touchedFields, setTouchedFields] = useState<Set<string>>(new Set());

  const validateFields = () => {
    const errors: FieldErrors = {};

    if (touchedFields.has('email')) {
      if (!email) {
        errors.email = 'El correo es obligatorio';
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        errors.email = 'El formato del correo no es válido';
      }
    }

    if (touchedFields.has('password') && !password) {
      errors.password = 'La contraseña es obligatoria';
    }

    setFieldErrors(errors);
    return errors;
  };

  const handleBlur = (field: string) => {
    setTouchedFields(prev => new Set(prev).add(field));
    validateFields();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGlobalError('');
    setFieldErrors({});

    // Marcar todos los campos como tocados
    setTouchedFields(new Set(['email', 'password']));

    if (!email || !password) {
      setGlobalError('Por favor completa todos los campos');
      toast.error('Por favor completa todos los campos');
      return;
    }

    const errors = validateFields();
    if (Object.keys(errors).length > 0) {
      toast.error('Por favor corrige los errores en el formulario');
      return;
    }

    setLoading(true);

    // Simular API call: POST /auth/login
    setTimeout(() => {
      setLoading(false);

      // Simular diferentes respuestas del backend
      const simulateScenario = Math.random();

      // Caso 1: Error por campo específico (400)
      if (simulateScenario > 0.8) {
        setFieldErrors({
          email: 'Este correo no está registrado'
        });
        toast.error('Credenciales incorrectas');
        return;
      }

      // Caso 2: Error global de autenticación (401)
      if (simulateScenario > 0.6) {
        setGlobalError('Correo o contraseña incorrectos');
        toast.error('Correo o contraseña incorrectos');
        return;
      }

      // Caso 3: Error de servidor (500)
      if (simulateScenario > 0.9) {
        setGlobalError('Error del servidor. Por favor intenta más tarde');
        toast.error('Error del servidor. Por favor intenta más tarde');
        return;
      }

      // Caso 4: Éxito
      toast.success('Inicio de sesión exitoso');
      onLogin(email);
    }, 1000);
  };

  return (
    <AuthLayout
      title="TrustFi"
      subtitle="Préstamos P2P con reputación descentralizada"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {globalError && (
          <div className="p-4 bg-red-600/20 border border-red-500/30 rounded-lg">
            <p className="text-sm text-red-400">{globalError}</p>
          </div>
        )}

        <FormInput
          id="email"
          type="email"
          label="Correo Electrónico"
          placeholder="tu@email.com"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            setGlobalError('');
            if (fieldErrors.email) {
              setFieldErrors({ ...fieldErrors, email: '' });
            }
          }}
          onBlur={() => handleBlur('email')}
          error={fieldErrors.email}
          success={touchedFields.has('email') && !fieldErrors.email && !!email}
          disabled={loading}
          required
        />

        <div className="space-y-2">
          <FormInput
            id="password"
            type="password"
            label="Contraseña"
            placeholder="••••••••"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setGlobalError('');
              if (fieldErrors.password) {
                setFieldErrors({ ...fieldErrors, password: '' });
              }
            }}
            onBlur={() => handleBlur('password')}
            error={fieldErrors.password}
            disabled={loading}
            required
          />

          <div className="flex justify-end">
            <button
              type="button"
              onClick={onForgotPassword}
              className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
            >
              ¿Olvidaste tu contraseña?
            </button>
          </div>
        </div>

        <Button
          type="submit"
          className="w-full bg-blue-600 hover:bg-blue-700 shadow-lg font-semibold"
          disabled={loading}
        >
          {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
        </Button>

        <div className="text-center">
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
