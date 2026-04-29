import { useState } from 'react';
import { Button } from './ui/button';
import { Save, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';
import { useTheme } from '../context/ThemeContext';
import { userService } from '../services/userService';
import { ApiError } from '../services/api';
import { getStoredProfileData, getUserId, saveProfileData } from '../services/session';

interface ProfileProps {
  onProfileUpdated?: () => void;
}

export function Profile({ onProfileUpdated }: ProfileProps) {
  const { isDarkMode } = useTheme();
  const storedProfile = getStoredProfileData();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    firstName: storedProfile.firstName,
    lastName: storedProfile.lastName,
    phone: storedProfile.phone,
    address: storedProfile.address,
    blockchainHashId: storedProfile.blockchainHashId,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const userId = getUserId();
    if (!userId) {
      setLoading(false);
      toast.error('No se encontró una sesión activa.');
      return;
    }

    const payload = Object.entries(formData).reduce<Record<string, string>>((acc, [key, value]) => {
      const trimmed = value.trim();
      if (trimmed) {
        acc[key] = trimmed;
      }
      return acc;
    }, {});

    if (Object.keys(payload).length === 0) {
      setLoading(false);
      toast.error('Ingresa al menos un campo para actualizar.');
      return;
    }

    try {
      const message = await userService.updateProfile(userId, payload);
      saveProfileData({
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        phone: formData.phone.trim(),
        address: formData.address.trim(),
        blockchainHashId: formData.blockchainHashId.trim(),
      });
      onProfileUpdated?.();
      toast.success(message);
    } catch (err) {
      if (err instanceof ApiError) {
        toast.error(err.payload.error ?? 'No fue posible actualizar el perfil.');
      } else {
        toast.error('No fue posible actualizar el perfil.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className={`text-3xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
          Perfil Financiero
        </h1>
        <p className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>
          Actualiza tu información para mejorar tu Trust Score
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className={`rounded-2xl p-6 ${
            isDarkMode ? 'bg-slate-800 border border-slate-700' : 'bg-white border border-gray-200'
          }`}>
            <h2 className={`text-xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Información Personal</h2>
            <p className={`text-sm mb-6 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Actualiza tus datos de contacto y billetera Web3
            </p>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label htmlFor="firstName" className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Nombre</label>
                  <input
                    id="firstName"
                    type="text"
                    value={formData.firstName}
                    onChange={(e) => handleChange('firstName', e.target.value)}
                    disabled={loading}
                    placeholder="Juan Carlos"
                    className={`w-full px-4 py-2.5 rounded-lg outline-none transition-all ${
                      isDarkMode
                        ? 'bg-slate-700 border border-slate-600 text-white placeholder:text-gray-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30'
                        : 'bg-gray-50 border border-gray-300 text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200'
                    }`}
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="lastName" className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Apellido</label>
                  <input
                    id="lastName"
                    type="text"
                    value={formData.lastName}
                    onChange={(e) => handleChange('lastName', e.target.value)}
                    disabled={loading}
                    placeholder="Pérez"
                    className={`w-full px-4 py-2.5 rounded-lg outline-none transition-all ${
                      isDarkMode
                        ? 'bg-slate-700 border border-slate-600 text-white placeholder:text-gray-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30'
                        : 'bg-gray-50 border border-gray-300 text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200'
                    }`}
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="phone" className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Teléfono</label>
                  <input
                    id="phone"
                    type="text"
                    value={formData.phone}
                    onChange={(e) => handleChange('phone', e.target.value)}
                    disabled={loading}
                    placeholder="3009876543"
                    className={`w-full px-4 py-2.5 rounded-lg outline-none transition-all ${
                      isDarkMode
                        ? 'bg-slate-700 border border-slate-600 text-white placeholder:text-gray-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30'
                        : 'bg-gray-50 border border-gray-300 text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200'
                    }`}
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="address" className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Dirección</label>
                  <input
                    id="address"
                    type="text"
                    value={formData.address}
                    onChange={(e) => handleChange('address', e.target.value)}
                    disabled={loading}
                    placeholder="Carrera 5 #10"
                    className={`w-full px-4 py-2.5 rounded-lg outline-none transition-all ${
                      isDarkMode
                        ? 'bg-slate-700 border border-slate-600 text-white placeholder:text-gray-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30'
                        : 'bg-gray-50 border border-gray-300 text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200'
                    }`}
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <label htmlFor="blockchainHashId" className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Blockchain Hash ID</label>
                  <input
                    id="blockchainHashId"
                    type="text"
                    value={formData.blockchainHashId}
                    onChange={(e) => handleChange('blockchainHashId', e.target.value)}
                    disabled={loading}
                    placeholder="0xDEF"
                    className={`w-full px-4 py-2.5 rounded-lg outline-none transition-all font-mono text-sm ${
                      isDarkMode
                        ? 'bg-slate-700 border border-slate-600 text-white placeholder:text-gray-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30'
                        : 'bg-gray-50 border border-gray-300 text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200'
                    }`}
                  />
                </div>
              </div>

              <Button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 shadow-lg font-semibold"
                disabled={loading}
              >
                <Save className="w-4 h-4 mr-2" />
                {loading ? 'Guardando...' : 'Guardar Cambios'}
              </Button>
            </form>
          </div>
        </div>

        <div>
          <div className={`sticky top-6 rounded-2xl p-6 ${
            isDarkMode ? 'bg-slate-800 border border-slate-700' : 'bg-white border border-gray-200'
          }`}>
            <div className="flex items-center gap-2 mb-6">
              <TrendingUp className="w-5 h-5 text-green-500" />
              <h3 className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Tu Trust Score</h3>
            </div>
            <div className="text-center">
              <div className={`text-5xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>785</div>
              <div className={`text-sm mb-6 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Excelente</div>

              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>Historial de pagos</span>
                  <span className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>95%</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>Préstamos activos</span>
                  <span className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>2</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>Antigüedad</span>
                  <span className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>8 meses</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>Verificación</span>
                  <span className="font-medium text-green-500">Completa</span>
                </div>
              </div>

              <div className={`mt-6 p-4 rounded-lg ${
                isDarkMode
                  ? 'bg-blue-600/20 border border-blue-500/30'
                  : 'bg-blue-100 border border-blue-200'
              }`}>
                <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Completar tu perfil puede aumentar tu score hasta en 50 puntos
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
