import { useState } from 'react';
import { Button } from './ui/button';
import { Save, User, Wallet as WalletIcon, Info, Lock, Moon, Sun } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';
import { Label } from './ui/label';
import { Switch } from './ui/switch';
import { toast } from 'sonner';
import { useTheme } from '../context/ThemeContext';
import { userService } from '../services/userService';
import { ApiError } from '../services/api';
import { getStoredProfileData, getEmail, getUserId, saveProfileData } from '../services/session';

export function Settings() {
  const [loading, setLoading] = useState(false);
  const { isDarkMode, toggleTheme } = useTheme();

  const storedProfile = getStoredProfileData();
  const email = getEmail();
  const userId = getUserId();

  const [personalData, setPersonalData] = useState({
    firstName: storedProfile.firstName,
    lastName: storedProfile.lastName,
  });

  const [financialData, setFinancialData] = useState({
    phone: storedProfile.phone,
    address: storedProfile.address,
    wallet: storedProfile.blockchainHashId,
  });

  const [personalErrors, setPersonalErrors] = useState<{ [key: string]: string }>({});
  const [financialErrors, setFinancialErrors] = useState<{ [key: string]: string }>({});

  const handlePersonalChange = (field: string, value: string) => {
    setPersonalData(prev => ({ ...prev, [field]: value }));
    if (personalErrors[field]) {
      setPersonalErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleFinancialChange = (field: string, value: string) => {
    setFinancialData(prev => ({ ...prev, [field]: value }));
    if (financialErrors[field]) {
      setFinancialErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validatePersonalData = () => {
    const errors: { [key: string]: string } = {};

    if (!personalData.firstName.trim()) {
      errors.firstName = 'El nombre es obligatorio';
    }

    if (!personalData.lastName.trim()) {
      errors.lastName = 'El apellido es obligatorio';
    }

    setPersonalErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateFinancialData = () => {
    const errors: { [key: string]: string } = {};

    if (financialData.phone && !/^\+?[\d\s-]{8,}$/.test(financialData.phone)) {
      errors.phone = 'El formato del teléfono no es válido';
    }

    if (financialData.wallet && !/^0x[a-fA-F0-9]{40}$/.test(financialData.wallet)) {
      errors.wallet = 'Formato de wallet inválido';
    }

    setFinancialErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSavePersonal = async () => {
    if (!validatePersonalData()) {
      toast.error('Por favor corrige los errores');
      return;
    }
    if (!userId) { toast.error('No se encontró sesión activa.'); return; }

    setLoading(true);
    try {
      await userService.updateProfile(userId, {
        firstName: personalData.firstName.trim(),
        lastName: personalData.lastName.trim(),
      });
      saveProfileData({
        firstName: personalData.firstName.trim(),
        lastName: personalData.lastName.trim(),
      });
      toast.success('Información personal actualizada');
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'No fue posible actualizar el perfil.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveFinancial = async () => {
    if (!validateFinancialData()) {
      toast.error('Por favor corrige los errores');
      return;
    }
    if (!userId) { toast.error('No se encontró sesión activa.'); return; }

    setLoading(true);
    try {
      await userService.updateProfile(userId, {
        phone: financialData.phone.trim(),
        address: financialData.address.trim(),
        blockchainHashId: financialData.wallet.trim(),
      });
      saveProfileData({
        phone: financialData.phone.trim(),
        address: financialData.address.trim(),
        blockchainHashId: financialData.wallet.trim(),
      });
      toast.success('Perfil financiero actualizado');
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'No fue posible actualizar el perfil.');
    } finally {
      setLoading(false);
    }
  };

  const handleConnectMetamask = async () => {
    try {
      if (typeof window.ethereum !== 'undefined') {
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        handleFinancialChange('wallet', accounts[0]);
        toast.success('Wallet conectada correctamente');
      } else {
        toast.error('MetaMask no está instalado');
      }
    } catch (error) {
      toast.error('Error al conectar MetaMask');
    }
  };

  const handleDarkModeToggle = () => {
    toggleTheme();
    toast.success(isDarkMode ? 'Modo claro activado' : 'Modo oscuro activado');
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">
          Configuración de Perfil
        </h1>
        <p className="text-gray-400">
          Administra tu información personal y financiera
        </p>
      </div>

      {/* Dark Mode Toggle Card */}
      <div className={`rounded-2xl p-6 ${
        isDarkMode ? 'bg-slate-800 border border-slate-700' : 'bg-white border border-gray-200'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-lg ${
              isDarkMode
                ? 'bg-gradient-to-br from-indigo-500 to-purple-600'
                : 'bg-gradient-to-br from-yellow-400 to-orange-500'
            }`}>
              {isDarkMode ? (
                <Moon className="w-6 h-6 text-white" />
              ) : (
                <Sun className="w-6 h-6 text-white" />
              )}
            </div>
            <div>
              <h3 className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                Tema de la Interfaz
              </h3>
              <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                {isDarkMode ? 'Modo Oscuro' : 'Modo Claro'}
              </p>
            </div>
          </div>
          <Switch
            checked={isDarkMode}
            onCheckedChange={handleDarkModeToggle}
            className="data-[state=checked]:bg-purple-600"
          />
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Personal Information Section */}
        <div className={`rounded-2xl p-6 ${
          isDarkMode ? 'bg-slate-800 border border-slate-700' : 'bg-white border border-gray-200'
        }`}>
          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-lg ${
              isDarkMode
                ? 'bg-gradient-to-br from-blue-500 to-cyan-600'
                : 'bg-gradient-to-br from-blue-600 to-blue-700'
            }`}>
              <User className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                Información Personal
              </h2>
              <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Datos básicos de tu cuenta
              </p>
            </div>
          </div>

          {/* Form */}
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName" className={isDarkMode ? 'text-gray-300' : 'text-gray-700'}>
                  Nombre
                </Label>
                <input
                  id="firstName"
                  type="text"
                  value={personalData.firstName}
                  onChange={(e) => handlePersonalChange('firstName', e.target.value)}
                  disabled={loading}
                  className={`w-full px-4 py-3 rounded-xl outline-none transition-all ${
                    isDarkMode
                      ? 'bg-slate-700 border border-slate-600 text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30'
                      : 'bg-gray-50 border border-gray-300 text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-200'
                  }`}
                />
                {personalErrors.firstName && (
                  <p className="text-sm text-red-500">{personalErrors.firstName}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="lastName" className={isDarkMode ? 'text-gray-300' : 'text-gray-700'}>
                  Apellido
                </Label>
                <input
                  id="lastName"
                  type="text"
                  value={personalData.lastName}
                  onChange={(e) => handlePersonalChange('lastName', e.target.value)}
                  disabled={loading}
                  className={`w-full px-4 py-3 rounded-xl outline-none transition-all ${
                    isDarkMode
                      ? 'bg-slate-700 border border-slate-600 text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30'
                      : 'bg-gray-50 border border-gray-300 text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-200'
                  }`}
                />
                {personalErrors.lastName && (
                  <p className="text-sm text-red-500">{personalErrors.lastName}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className={isDarkMode ? 'text-gray-300' : 'text-gray-700'}>
                Correo Electrónico
              </Label>
              <input
                id="email"
                type="email"
                value={email}
                disabled
                className={`w-full px-4 py-3 rounded-xl outline-none cursor-not-allowed opacity-60 ${
                  isDarkMode
                    ? 'bg-slate-700 border border-slate-600 text-white'
                    : 'bg-gray-100 border border-gray-300 text-gray-900'
                }`}
              />
              <p className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                El correo no puede modificarse desde aquí.
              </p>
            </div>

            <div className="pt-4">
              <Button
                onClick={handleSavePersonal}
                className={`w-full font-bold shadow-lg transition-all ${
                  isDarkMode
                    ? 'bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500'
                    : 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800'
                }`}
                disabled={loading}
              >
                <Save className="w-5 h-5 mr-2" />
                {loading ? 'Guardando...' : 'Guardar Cambios'}
              </Button>
            </div>

            <div className={`pt-2 border-t ${isDarkMode ? 'border-slate-700' : 'border-gray-200'}`}>
              <button className={`flex items-center gap-2 text-sm transition-colors ${
                isDarkMode ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'
              }`}>
                <Lock className="w-4 h-4" />
                Cambiar contraseña
              </button>
            </div>
          </div>
        </div>

        {/* Financial Profile Section */}
        <div className={`rounded-2xl p-6 ${
          isDarkMode ? 'bg-slate-800 border border-slate-700' : 'bg-white border border-gray-200'
        }`}>
          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-lg ${
              isDarkMode
                ? 'bg-gradient-to-br from-purple-500 to-blue-600'
                : 'bg-gradient-to-br from-orange-500 to-orange-600'
            }`}>
              <WalletIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Perfil Financiero</h2>
              <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Información DeFi y contacto</p>
            </div>
          </div>

          {/* Form */}
          <div className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="phone" className={isDarkMode ? 'text-gray-300' : 'text-gray-700'}>Teléfono</Label>
              <input
                id="phone"
                type="tel"
                placeholder="+1 234 567 8900"
                value={financialData.phone}
                onChange={(e) => handleFinancialChange('phone', e.target.value)}
                disabled={loading}
                className={`w-full px-4 py-3 rounded-xl outline-none transition-all ${
                  isDarkMode
                    ? 'bg-slate-700 border border-slate-600 text-white placeholder:text-gray-500 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/30'
                    : 'bg-gray-50 border border-gray-300 text-gray-900 placeholder:text-gray-400 focus:border-orange-500 focus:ring-2 focus:ring-orange-200'
                }`}
              />
              {financialErrors.phone && (
                <p className="text-sm text-red-500">{financialErrors.phone}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="address" className={isDarkMode ? 'text-gray-300' : 'text-gray-700'}>Dirección</Label>
              <input
                id="address"
                type="text"
                placeholder="Calle Principal #123"
                value={financialData.address}
                onChange={(e) => handleFinancialChange('address', e.target.value)}
                disabled={loading}
                className={`w-full px-4 py-3 rounded-xl outline-none transition-all ${
                  isDarkMode
                    ? 'bg-slate-700 border border-slate-600 text-white placeholder:text-gray-500 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/30'
                    : 'bg-gray-50 border border-gray-300 text-gray-900 placeholder:text-gray-400 focus:border-orange-500 focus:ring-2 focus:ring-orange-200'
                }`}
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label htmlFor="wallet" className={isDarkMode ? 'text-gray-300' : 'text-gray-700'}>Billetera DeFi</Label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button type="button" className={`transition-colors ${
                        isDarkMode ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-900'
                      }`}>
                        <Info className="w-4 h-4" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent className={`max-w-xs ${
                      isDarkMode ? 'bg-slate-700 border border-slate-600' : 'bg-white border border-gray-300'
                    }`}>
                      <p className={`text-sm ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                        Tu dirección de wallet se encuentra en MetaMask, Trust Wallet o cualquier billetera Web3.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <input
                id="wallet"
                type="text"
                placeholder="0x..."
                value={financialData.wallet}
                onChange={(e) => handleFinancialChange('wallet', e.target.value)}
                disabled={loading}
                className={`w-full px-4 py-3 rounded-xl outline-none transition-all font-mono text-sm ${
                  isDarkMode
                    ? 'bg-slate-700 border border-slate-600 text-white placeholder:text-gray-500 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/30'
                    : 'bg-gray-50 border border-gray-300 text-gray-900 placeholder:text-gray-400 focus:border-orange-500 focus:ring-2 focus:ring-orange-200'
                }`}
              />
              {financialErrors.wallet && (
                <p className="text-sm text-red-500">{financialErrors.wallet}</p>
              )}
              <Button
                type="button"
                className={`w-full font-semibold ${
                  isDarkMode
                    ? 'bg-slate-700 hover:bg-slate-600 border border-slate-600 text-white'
                    : 'bg-gray-200 hover:bg-gray-300 border border-gray-300 text-gray-900'
                }`}
                onClick={handleConnectMetamask}
                disabled={loading}
              >
                <WalletIcon className="w-4 h-4 mr-2" />
                Conectar MetaMask
              </Button>
            </div>

            <div className="pt-4">
              <Button
                onClick={handleSaveFinancial}
                className={`w-full font-bold shadow-lg transition-all ${
                  isDarkMode
                    ? 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500'
                    : 'bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700'
                }`}
                disabled={loading}
              >
                <Save className="w-5 h-5 mr-2" />
                {loading ? 'Guardando...' : 'Guardar Cambios'}
              </Button>
            </div>

            <div className={`mt-4 p-4 rounded-xl ${
              isDarkMode
                ? 'bg-blue-600/20 border border-blue-500/30'
                : 'bg-orange-100 border border-orange-200'
            }`}>
              <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                <span className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Tip:</span> Conectar tu wallet aumenta tu Trust Score en +50 puntos
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
