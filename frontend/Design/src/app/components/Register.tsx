import { useState, useEffect } from 'react';
import { AuthLayout } from './AuthLayout';
import { Button } from './ui/button';
import { FormInput } from './FormInput';
import { ArrowRight } from 'lucide-react';
import { toast } from 'sonner';

interface RegisterProps {
  onRegister: (email: string, userData: any) => void;
  onSwitchToLogin: () => void;
}

interface FormData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
  securityQuestion: string;
  securityAnswer: string;
}

interface FieldErrors {
  [key: string]: string;
}

export function Register({ onRegister, onSwitchToLogin }: RegisterProps) {
  const [loading, setLoading] = useState(false);
  const [globalError, setGlobalError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [touchedFields, setTouchedFields] = useState<Set<string>>(new Set());

  const [formData, setFormData] = useState<FormData>({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    securityQuestion: '',
    securityAnswer: ''
  });

  useEffect(() => {
    validateFields();
  }, [formData, touchedFields]);

  const validateFields = () => {
    const errors: FieldErrors = {};

    if (touchedFields.has('firstName') && !formData.firstName.trim()) {
      errors.firstName = 'El nombre es obligatorio';
    }

    if (touchedFields.has('lastName') && !formData.lastName.trim()) {
      errors.lastName = 'El apellido es obligatorio';
    }

    if (touchedFields.has('email')) {
      if (!formData.email) {
        errors.email = 'El correo es obligatorio';
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        errors.email = 'El formato del correo no es válido';
      }
    }

    if (touchedFields.has('password')) {
      if (!formData.password) {
        errors.password = 'La contraseña es obligatoria';
      } else if (formData.password.length < 8) {
        errors.password = 'La contraseña debe tener al menos 8 caracteres';
      }
    }

    if (touchedFields.has('confirmPassword')) {
      if (formData.password !== formData.confirmPassword) {
        errors.confirmPassword = 'Las contraseñas no coinciden';
      }
    }

    if (touchedFields.has('securityQuestion') && !formData.securityQuestion.trim()) {
      errors.securityQuestion = 'La pregunta de seguridad es obligatoria';
    }

    if (touchedFields.has('securityAnswer') && !formData.securityAnswer.trim()) {
      errors.securityAnswer = 'La respuesta es obligatoria';
    }

    setFieldErrors(errors);
    return errors;
  };

  const handleChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setGlobalError('');
  };

  const handleBlur = (field: keyof FormData) => {
    setTouchedFields(prev => new Set(prev).add(field));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGlobalError('');

    const requiredFields: (keyof FormData)[] = [
      'firstName', 'lastName', 'email', 'password',
      'confirmPassword', 'securityQuestion', 'securityAnswer'
    ];

    requiredFields.forEach(field => {
      setTouchedFields(prev => new Set(prev).add(field));
    });

    const errors = validateFields();
    if (Object.keys(errors).length > 0) {
      toast.error('Por favor completa todos los campos correctamente');
      return;
    }

    if (!requiredFields.every(field => formData[field])) {
      toast.error('Por favor completa todos los campos');
      return;
    }

    setLoading(true);

    // Simular API call: POST /auth/register
    setTimeout(() => {
      const simulateError = Math.random() > 0.8;

      if (simulateError) {
        setLoading(false);
        setFieldErrors({ email: 'Este correo ya está registrado' });
        toast.error('Error en los datos del formulario');
        return;
      }

      setLoading(false);
      toast.success('Cuenta creada exitosamente');
      onRegister(formData.email, formData);
    }, 1200);
  };

  return (
    <AuthLayout
      title="Crear Cuenta"
      subtitle="Únete a la red de préstamos descentralizados"
    >
      <form onSubmit={handleSubmit} className="space-y-4 mt-6">
        {globalError && (
          <div className="p-4 bg-red-600/20 border border-red-500/30 rounded-lg">
            <p className="text-sm text-red-400">{globalError}</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormInput
            id="firstName"
            label="Nombre"
            placeholder="Juan"
            value={formData.firstName}
            onChange={(e) => handleChange('firstName', e.target.value)}
            onBlur={() => handleBlur('firstName')}
            error={fieldErrors.firstName}
            success={touchedFields.has('firstName') && !fieldErrors.firstName && !!formData.firstName}
            disabled={loading}
            required
          />

          <FormInput
            id="lastName"
            label="Apellido"
            placeholder="Pérez"
            value={formData.lastName}
            onChange={(e) => handleChange('lastName', e.target.value)}
            onBlur={() => handleBlur('lastName')}
            error={fieldErrors.lastName}
            success={touchedFields.has('lastName') && !fieldErrors.lastName && !!formData.lastName}
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
          onBlur={() => handleBlur('email')}
          error={fieldErrors.email}
          success={touchedFields.has('email') && !fieldErrors.email && !!formData.email}
          disabled={loading}
          required
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormInput
            id="password"
            type="password"
            label="Contraseña"
            placeholder="Mínimo 8 caracteres"
            value={formData.password}
            onChange={(e) => handleChange('password', e.target.value)}
            onBlur={() => handleBlur('password')}
            error={fieldErrors.password}
            success={touchedFields.has('password') && !fieldErrors.password && !!formData.password}
            helperText="Al menos 8 caracteres"
            disabled={loading}
            required
          />

          <FormInput
            id="confirmPassword"
            type="password"
            label="Confirmar Contraseña"
            placeholder="Repite tu contraseña"
            value={formData.confirmPassword}
            onChange={(e) => handleChange('confirmPassword', e.target.value)}
            onBlur={() => handleBlur('confirmPassword')}
            error={fieldErrors.confirmPassword}
            success={touchedFields.has('confirmPassword') && !fieldErrors.confirmPassword && !!formData.confirmPassword}
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
            onBlur={() => handleBlur('securityQuestion')}
            error={fieldErrors.securityQuestion}
            success={touchedFields.has('securityQuestion') && !fieldErrors.securityQuestion && !!formData.securityQuestion}
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
            onBlur={() => handleBlur('securityAnswer')}
            error={fieldErrors.securityAnswer}
            success={touchedFields.has('securityAnswer') && !fieldErrors.securityAnswer && !!formData.securityAnswer}
            disabled={loading}
            required
          />
        </div>

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
