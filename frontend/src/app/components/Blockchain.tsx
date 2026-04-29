import { Badge } from './ui/badge';
import { Shield, CheckCircle, Copy, ExternalLink } from 'lucide-react';
import { Button } from './ui/button';
import { toast } from 'sonner';
import { useTheme } from '../context/ThemeContext';

export function Blockchain() {
  const { isDarkMode } = useTheme();
  const verificationStatus = {
    identity: true,
    wallet: true,
    kyc: true,
    email: true
  };

  const recentBlocks = [
    {
      id: 1,
      type: 'Loan Agreement',
      hash: '0x7f3a9b2c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1',
      timestamp: '2026-04-20 14:23:45',
      status: 'confirmed',
      confirmations: 24
    },
    {
      id: 2,
      type: 'Payment',
      hash: '0x4e2d1a5f6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3',
      timestamp: '2026-04-18 09:15:22',
      status: 'confirmed',
      confirmations: 156
    },
    {
      id: 3,
      type: 'Profile Update',
      hash: '0x9c6b3d8e1f2a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9',
      timestamp: '2026-04-15 16:42:11',
      status: 'confirmed',
      confirmations: 342
    },
    {
      id: 4,
      type: 'Trust Score Update',
      hash: '0x2a1f7e4c8b5d9e6f0a3b1c4d2e5f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4',
      timestamp: '2026-04-10 11:30:00',
      status: 'confirmed',
      confirmations: 567
    }
  ];

  const userBlockchainId = '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb1';

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copiado al portapapeles');
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className={`text-3xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
          Verificación Blockchain
        </h1>
        <p className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>
          Tu identidad y transacciones registradas en blockchain
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className={`lg:col-span-1 rounded-2xl p-6 ${
          isDarkMode ? 'bg-slate-800 border border-slate-700' : 'bg-white border border-gray-200'
        }`}>
          <div className="flex items-center gap-2 mb-6">
            <Shield className={`w-5 h-5 ${isDarkMode ? 'text-green-400' : 'text-green-600'}`} />
            <h3 className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Estado de Verificación</h3>
          </div>

          <div className="space-y-4">
            <div className={`flex items-center justify-between p-3 rounded-lg ${
              isDarkMode
                ? 'bg-green-600/20 border border-green-500/30'
                : 'bg-green-100 border border-green-200'
            }`}>
              <div className="flex items-center gap-3">
                <CheckCircle className={`w-5 h-5 ${isDarkMode ? 'text-green-400' : 'text-green-600'}`} />
                <span className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Identidad</span>
              </div>
              <Badge className={isDarkMode ? 'bg-green-600 text-white' : 'bg-green-600 text-white'}>Verificado</Badge>
            </div>

            <div className={`flex items-center justify-between p-3 rounded-lg ${
              isDarkMode
                ? 'bg-green-600/20 border border-green-500/30'
                : 'bg-green-100 border border-green-200'
            }`}>
              <div className="flex items-center gap-3">
                <CheckCircle className={`w-5 h-5 ${isDarkMode ? 'text-green-400' : 'text-green-600'}`} />
                <span className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Wallet</span>
              </div>
              <Badge className={isDarkMode ? 'bg-green-600 text-white' : 'bg-green-600 text-white'}>Conectado</Badge>
            </div>

            <div className={`flex items-center justify-between p-3 rounded-lg ${
              isDarkMode
                ? 'bg-green-600/20 border border-green-500/30'
                : 'bg-green-100 border border-green-200'
            }`}>
              <div className="flex items-center gap-3">
                <CheckCircle className={`w-5 h-5 ${isDarkMode ? 'text-green-400' : 'text-green-600'}`} />
                <span className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>KYC</span>
              </div>
              <Badge className={isDarkMode ? 'bg-green-600 text-white' : 'bg-green-600 text-white'}>Completo</Badge>
            </div>

            <div className={`flex items-center justify-between p-3 rounded-lg ${
              isDarkMode
                ? 'bg-green-600/20 border border-green-500/30'
                : 'bg-green-100 border border-green-200'
            }`}>
              <div className="flex items-center gap-3">
                <CheckCircle className={`w-5 h-5 ${isDarkMode ? 'text-green-400' : 'text-green-600'}`} />
                <span className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Email</span>
              </div>
              <Badge className={isDarkMode ? 'bg-green-600 text-white' : 'bg-green-600 text-white'}>Verificado</Badge>
            </div>
          </div>

          <div className={`mt-6 p-4 rounded-lg ${
            isDarkMode
              ? 'bg-blue-600/20 border border-blue-500/30'
              : 'bg-blue-100 border border-blue-200'
          }`}>
            <div className={`text-sm font-medium mb-2 ${isDarkMode ? 'text-blue-300' : 'text-blue-700'}`}>
              Blockchain ID
            </div>
            <div className="flex items-center gap-2">
              <code className={`text-xs px-2 py-1 rounded flex-1 truncate font-mono ${
                isDarkMode ? 'bg-slate-700 text-gray-300' : 'bg-gray-200 text-gray-700'
              }`}>
                {userBlockchainId}
              </code>
              <Button
                size="sm"
                variant="ghost"
                className={isDarkMode ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-900'}
                onClick={() => copyToClipboard(userBlockchainId)}
              >
                <Copy className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        <div className={`lg:col-span-2 rounded-2xl p-6 ${
          isDarkMode ? 'bg-slate-800 border border-slate-700' : 'bg-white border border-gray-200'
        }`}>
          <h3 className={`text-lg font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Registro en Blockchain</h3>
          <p className={`text-sm mb-6 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Historial de transacciones verificadas en la red
          </p>

          <div className="space-y-4">
            {recentBlocks.map((block) => (
              <div key={block.id} className={`p-4 rounded-xl ${
                isDarkMode ? 'bg-slate-700 border border-slate-600' : 'bg-gray-50 border border-gray-200'
              }`}>
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline" className={isDarkMode ? 'border-slate-500 text-gray-300' : 'border-gray-300 text-gray-700'}>{block.type}</Badge>
                      <Badge className={`border ${
                        isDarkMode
                          ? 'bg-green-600/20 text-green-400 border-green-500/30'
                          : 'bg-green-100 text-green-700 border-green-200'
                      }`}>
                        <CheckCircle className="w-3 h-3 mr-1" />
                        {block.confirmations} confirmaciones
                      </Badge>
                    </div>
                    <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>{block.timestamp}</div>
                  </div>
                </div>

                <div className={`flex items-center gap-2 p-3 rounded ${
                  isDarkMode ? 'bg-slate-600' : 'bg-gray-200'
                }`}>
                  <code className={`text-xs flex-1 truncate font-mono ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    {block.hash}
                  </code>
                  <Button
                    size="sm"
                    variant="ghost"
                    className={isDarkMode ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'}
                    onClick={() => copyToClipboard(block.hash)}
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className={isDarkMode ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'}
                    onClick={() => window.open(`https://etherscan.io/tx/${block.hash}`, '_blank')}
                  >
                    <ExternalLink className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className={`rounded-2xl p-6 ${
        isDarkMode ? 'bg-slate-800 border border-slate-700' : 'bg-white border border-gray-200'
      }`}>
        <h3 className={`text-lg font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Sobre la Verificación Blockchain</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className={`font-semibold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>¿Qué se registra?</h4>
            <ul className={`space-y-2 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              <li className="flex items-start gap-2">
                <CheckCircle className={`w-4 h-4 mt-0.5 ${isDarkMode ? 'text-green-400' : 'text-green-600'}`} />
                <span>Acuerdos de préstamos entre usuarios</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className={`w-4 h-4 mt-0.5 ${isDarkMode ? 'text-green-400' : 'text-green-600'}`} />
                <span>Pagos y transacciones completadas</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className={`w-4 h-4 mt-0.5 ${isDarkMode ? 'text-green-400' : 'text-green-600'}`} />
                <span>Actualizaciones de Trust Score</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className={`w-4 h-4 mt-0.5 ${isDarkMode ? 'text-green-400' : 'text-green-600'}`} />
                <span>Verificaciones de identidad</span>
              </li>
            </ul>
          </div>

          <div>
            <h4 className={`font-semibold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Beneficios</h4>
            <ul className={`space-y-2 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              <li className="flex items-start gap-2">
                <Shield className={`w-4 h-4 mt-0.5 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                <span>Inmutabilidad: No se puede alterar el historial</span>
              </li>
              <li className="flex items-start gap-2">
                <Shield className={`w-4 h-4 mt-0.5 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                <span>Transparencia: Todas las operaciones son verificables</span>
              </li>
              <li className="flex items-start gap-2">
                <Shield className={`w-4 h-4 mt-0.5 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                <span>Seguridad: Protección criptográfica de datos</span>
              </li>
              <li className="flex items-start gap-2">
                <Shield className={`w-4 h-4 mt-0.5 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                <span>Descentralización: Sin punto único de fallo</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
