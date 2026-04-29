import { useState } from 'react';
import { Button } from './ui/button';
import { Wallet, Info, Sparkles, ArrowRight, SkipForward } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';
import { Label } from './ui/label';
import { toast } from 'sonner';

interface FinancialProfileSetupProps {
  onComplete: (data?: any) => void;
}

export function FinancialProfileSetup({ onComplete }: FinancialProfileSetupProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    phone: '',
    address: '',
    wallet: ''
  });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [touched, setTouched] = useState<Set<string>>(new Set());

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleBlur = (field: string) => {
    setTouched(prev => new Set(prev).add(field));
    validateField(field);
  };

  const validateField = (field: string) => {
    const newErrors: { [key: string]: string } = { ...errors };

    if (field === 'phone' && formData.phone) {
      if (!/^\+?[\d\s-]{8,}$/.test(formData.phone)) {
        newErrors.phone = 'El formato del teléfono no es válido';
      } else {
        delete newErrors.phone;
      }
    }

    if (field === 'wallet' && formData.wallet) {
      if (!/^0x[a-fA-F0-9]{40}$/.test(formData.wallet)) {
        newErrors.wallet = 'Formato de wallet inválido (debe empezar con 0x)';
      } else {
        delete newErrors.wallet;
      }
    }

    setErrors(newErrors);
  };

  const handleConnectMetamask = async () => {
    try {
      if (typeof window.ethereum !== 'undefined') {
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        handleChange('wallet', accounts[0]);
        toast.success('Wallet conectada correctamente');
      } else {
        toast.error('MetaMask no está instalado');
      }
    } catch (error) {
      toast.error('Error al conectar MetaMask');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (Object.keys(errors).length > 0) {
      toast.error('Por favor corrige los errores');
      return;
    }

    setLoading(true);

    setTimeout(() => {
      setLoading(false);
      toast.success('Perfil financiero actualizado');
      onComplete(formData);
    }, 1000);
  };

  const handleSkip = () => {
    onComplete();
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl mb-4 shadow-xl">
            <Sparkles className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-3">
            Completa tu Perfil Financiero
          </h1>
          <p className="text-gray-400 text-lg">
            Mejora tu Trust Score proporcionando información adicional
          </p>
        </div>

        {/* Card */}
        <div className="bg-slate-800 border border-slate-700 rounded-3xl shadow-2xl p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Benefits */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-blue-600/20 border border-blue-500/30 rounded-xl p-4">
                <div className="text-3xl font-bold text-blue-300 mb-1">+50</div>
                <div className="text-sm text-gray-300">Trust Score</div>
              </div>
              <div className="bg-green-600/20 border border-green-500/30 rounded-xl p-4">
                <div className="text-3xl font-bold text-green-300 mb-1">3x</div>
                <div className="text-sm text-gray-300">Límite de préstamo</div>
              </div>
              <div className="bg-purple-600/20 border border-purple-500/30 rounded-xl p-4">
                <div className="text-3xl font-bold text-purple-300 mb-1">-2%</div>
                <div className="text-sm text-gray-300">Tasas de interés</div>
              </div>
            </div>

            {/* Phone Input */}
            <div className="space-y-2">
              <Label htmlFor="phone" className="text-white">
                Teléfono (Opcional)
              </Label>
              <input
                id="phone"
                type="tel"
                placeholder="+1 234 567 8900"
                value={formData.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
                onBlur={() => handleBlur('phone')}
                disabled={loading}
                className="w-full px-4 py-3 rounded-xl bg-slate-700 border border-slate-600 text-white placeholder:text-gray-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30 outline-none transition-all"
              />
              {errors.phone && (
                <p className="text-sm text-red-400">{errors.phone}</p>
              )}
            </div>

            {/* Address Input */}
            <div className="space-y-2">
              <Label htmlFor="address" className="text-white">
                Dirección (Opcional)
              </Label>
              <input
                id="address"
                type="text"
                placeholder="Calle Principal #123"
                value={formData.address}
                onChange={(e) => handleChange('address', e.target.value)}
                disabled={loading}
                className="w-full px-4 py-3 rounded-xl bg-slate-700 border border-slate-600 text-white placeholder:text-gray-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30 outline-none transition-all"
              />
            </div>

            {/* Wallet Input */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label htmlFor="wallet" className="text-white">
                  Billetera DeFi (Opcional)
                </Label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button type="button" className="text-gray-400 hover:text-white transition-colors">
                        <Info className="w-4 h-4" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs bg-slate-700 border border-slate-600">
                      <p className="text-sm text-gray-200">
                        Tu dirección de wallet se encuentra en MetaMask, Trust Wallet o cualquier billetera Web3.
                        Debe comenzar con "0x" seguido de 40 caracteres alfanuméricos.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <input
                id="wallet"
                type="text"
                placeholder="0x..."
                value={formData.wallet}
                onChange={(e) => handleChange('wallet', e.target.value)}
                onBlur={() => handleBlur('wallet')}
                disabled={loading}
                className="w-full px-4 py-3 rounded-xl bg-slate-700 border border-slate-600 text-white placeholder:text-gray-500 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/30 outline-none transition-all font-mono text-sm"
              />
              {errors.wallet && (
                <p className="text-sm text-red-400">{errors.wallet}</p>
              )}
              <Button
                type="button"
                className="w-full bg-slate-700 hover:bg-slate-600 border border-slate-600 text-white font-semibold"
                onClick={handleConnectMetamask}
                disabled={loading}
              >
                <Wallet className="w-4 h-4 mr-2" />
                Conectar MetaMask
              </Button>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col gap-3 pt-4">
              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-bold shadow-lg transition-all"
                disabled={loading}
              >
                {loading ? 'Guardando...' : (
                  <>
                    Completar Perfil
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </>
                )}
              </Button>

              <Button
                type="button"
                className="w-full bg-slate-700 hover:bg-slate-600 border border-slate-600 text-white font-semibold"
                onClick={handleSkip}
                disabled={loading}
              >
                <SkipForward className="w-4 h-4 mr-2" />
                Completar más tarde
              </Button>
            </div>

            <p className="text-center text-sm text-gray-400 pt-2">
              Puedes actualizar esta información en cualquier momento desde Configuración
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
