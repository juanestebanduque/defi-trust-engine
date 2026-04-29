import { useState } from 'react';
import { AuthLayout } from './AuthLayout';
import { Button } from './ui/button';
import { FormInput } from './FormInput';
import { ArrowLeft, KeyRound } from 'lucide-react';
import { toast } from 'sonner';

interface ForgotPasswordProps {
  onBack: () => void;
}

export function ForgotPassword({ onBack }: ForgotPasswordProps) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [securityQuestion, setSecurityQuestion] = useState('');
  const [securityAnswer, setSecurityAnswer] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const validateEmail = () => {
    if (!email) {
      setErrors({ email: 'El correo es obligatorio' });
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setErrors({ email: 'El formato del correo no es válido' });
      return false;
    }
    return true;
  };

  const validateStep2 = () => {
    const newErrors: { [key: string]: string } = {};

    if (!securityAnswer.trim()) {
      newErrors.securityAnswer = 'La respuesta es obligatoria';
    }

    if (!newPassword) {
      newErrors.newPassword = 'La nueva contraseña es obligatoria';
    } else if (newPassword.length < 8) {
      newErrors.newPassword = 'La contraseña debe tener al menos 8 caracteres';
    }

    if (newPassword !== confirmPassword) {
      newErrors.confirmPassword = 'Las contraseñas no coinciden';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleStep1Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    if (!validateEmail()) return;

    setLoading(true);

    // Simular API call: POST /forgot-password (paso 1)
    setTimeout(() => {
      setLoading(false);

      // Simular respuesta del backend con pregunta de seguridad
      const mockSecurityQuestion = '¿Cuál es el nombre de tu primera mascota?';
      setSecurityQuestion(mockSecurityQuestion);
      setStep(2);
      toast.success('Pregunta de seguridad cargada');
    }, 1000);
  };

  const handleStep2Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    if (!validateStep2()) {
      toast.error('Por favor completa todos los campos correctamente');
      return;
    }

    setLoading(true);

    // Simular API call: POST /forgot-password (paso 2)
    setTimeout(() => {
      setLoading(false);

      // Simular diferentes respuestas
      const simulateError = Math.random() > 0.7;

      if (simulateError) {
        setErrors({ securityAnswer: 'La respuesta de seguridad es incorrecta' });
        toast.error('La respuesta de seguridad es incorrecta');
        return;
      }

      toast.success('Contraseña restablecida exitosamente');
      onBack();
    }, 1200);
  };

  return (
    <AuthLayout
      title={step === 1 ? 'Recuperar Contraseña' : 'Restablecer Contraseña'}
      subtitle={
        step === 1
          ? 'Ingresa tu correo para continuar'
          : 'Responde la pregunta de seguridad'
      }
    >
      <div className="space-y-6">
        {step === 1 ? (
          <form onSubmit={handleStep1Submit} className="space-y-6">
            <div className="p-4 bg-blue-600/20 border border-blue-500/30 rounded-lg">
              <p className="text-sm text-blue-300">
                Ingresa tu correo electrónico y te mostraremos tu pregunta de seguridad
              </p>
            </div>

            <FormInput
              id="email"
              type="email"
              label="Correo Electrónico"
              placeholder="tu@email.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setErrors({});
              }}
              error={errors.email}
              disabled={loading}
              required
            />

            <Button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 shadow-lg font-semibold"
              disabled={loading}
            >
              {loading ? 'Verificando...' : 'Continuar'}
            </Button>

            <Button
              type="button"
              variant="outline"
              className="w-full border-slate-600 text-gray-300 hover:bg-slate-700 hover:text-white"
              onClick={onBack}
              disabled={loading}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver al inicio de sesión
            </Button>
          </form>
        ) : (
          <form onSubmit={handleStep2Submit} className="space-y-6">
            <div className="p-4 bg-blue-600/20 border border-blue-500/30 rounded-lg">
              <div className="flex items-start gap-3">
                <KeyRound className="w-5 h-5 text-blue-400 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-blue-300 mb-1">
                    Pregunta de Seguridad
                  </p>
                  <p className="text-sm text-gray-300">{securityQuestion}</p>
                </div>
              </div>
            </div>

            <FormInput
              id="securityAnswer"
              label="Respuesta"
              placeholder="Tu respuesta"
              value={securityAnswer}
              onChange={(e) => {
                setSecurityAnswer(e.target.value);
                setErrors({ ...errors, securityAnswer: '' });
              }}
              error={errors.securityAnswer}
              disabled={loading}
              required
            />

            <FormInput
              id="newPassword"
              type="password"
              label="Nueva Contraseña"
              placeholder="Mínimo 8 caracteres"
              value={newPassword}
              onChange={(e) => {
                setNewPassword(e.target.value);
                setErrors({ ...errors, newPassword: '' });
              }}
              error={errors.newPassword}
              helperText="Debe tener al menos 8 caracteres"
              disabled={loading}
              required
            />

            <FormInput
              id="confirmPassword"
              type="password"
              label="Confirmar Nueva Contraseña"
              placeholder="Repite tu contraseña"
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                setErrors({ ...errors, confirmPassword: '' });
              }}
              error={errors.confirmPassword}
              disabled={loading}
              required
            />

            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                className="flex-1 border-slate-600 text-gray-300 hover:bg-slate-700 hover:text-white"
                onClick={() => setStep(1)}
                disabled={loading}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Atrás
              </Button>

              <Button
                type="submit"
                className="flex-1 bg-blue-600 hover:bg-blue-700 shadow-lg font-semibold"
                disabled={loading}
              >
                {loading ? 'Restableciendo...' : 'Restablecer Contraseña'}
              </Button>
            </div>
          </form>
        )}
      </div>
    </AuthLayout>
  );
}
