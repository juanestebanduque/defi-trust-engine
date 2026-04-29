import { useEffect, useState } from 'react';
import { Badge } from './ui/badge';
import { Shield, CheckCircle, XCircle, Copy, ExternalLink, RefreshCw } from 'lucide-react';
import { Button } from './ui/button';
import { toast } from 'sonner';
import { useTheme } from '../context/ThemeContext';
import { getStoredProfileData, getEmail, getUserId } from '../services/session';
import { transactionService, type TransactionResponse } from '../services/transactionService';

export function Blockchain() {
  const { isDarkMode } = useTheme();
  const [transactions, setTransactions] = useState<TransactionResponse[]>([]);
  const [loading, setLoading] = useState(true);

  const profile = getStoredProfileData();
  const email = getEmail();
  const userId = getUserId();

  const verificationStatus = {
    identity: Boolean(profile.firstName.trim() && profile.lastName.trim()),
    wallet: Boolean(profile.blockchainHashId.trim()),
    kyc: Boolean(profile.phone.trim()),
    email: Boolean(email),
  };

  const blockchainId = profile.blockchainHashId.trim() || '—';

  const fetchTransactions = () => {
    if (!userId) { setLoading(false); return; }
    setLoading(true);
    transactionService.getByUser(userId)
      .then(setTransactions)
      .catch(() => toast.error('No se pudieron cargar las transacciones.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchTransactions(); }, []);

  const typeLabel = (type: string) => {
    switch (type) {
      case 'DEPOSIT': return 'Depósito';
      case 'WITHDRAWAL': return 'Retiro';
      case 'LOAN_PAYMENT': return 'Pago de préstamo';
      default: return type;
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copiado al portapapeles');
  };

  const VerificationRow = ({ label, verified, badge }: { label: string; verified: boolean; badge: string }) => (
    <div className={`flex items-center justify-between p-3 rounded-lg ${
      verified
        ? isDarkMode ? 'bg-green-600/20 border border-green-500/30' : 'bg-green-100 border border-green-200'
        : isDarkMode ? 'bg-slate-700 border border-slate-600' : 'bg-gray-50 border border-gray-200'
    }`}>
      <div className="flex items-center gap-3">
        {verified
          ? <CheckCircle className={`w-5 h-5 ${isDarkMode ? 'text-green-400' : 'text-green-600'}`} />
          : <XCircle className={`w-5 h-5 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`} />
        }
        <span className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{label}</span>
      </div>
      <Badge className={verified ? 'bg-green-600 text-white' : isDarkMode ? 'bg-slate-600 text-gray-400' : 'bg-gray-200 text-gray-500'}>
        {verified ? badge : 'Pendiente'}
      </Badge>
    </div>
  );

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
            <VerificationRow label="Identidad" verified={verificationStatus.identity} badge="Verificado" />
            <VerificationRow label="Wallet" verified={verificationStatus.wallet} badge="Conectado" />
            <VerificationRow label="KYC" verified={verificationStatus.kyc} badge="Completo" />
            <VerificationRow label="Email" verified={verificationStatus.email} badge="Verificado" />
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
                {blockchainId}
              </code>
              {profile.blockchainHashId.trim() && (
                <Button
                  size="sm"
                  variant="ghost"
                  className={isDarkMode ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-900'}
                  onClick={() => copyToClipboard(blockchainId)}
                >
                  <Copy className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>
        </div>

        <div className={`lg:col-span-2 rounded-2xl p-6 ${
          isDarkMode ? 'bg-slate-800 border border-slate-700' : 'bg-white border border-gray-200'
        }`}>
          <div className="flex items-center justify-between mb-2">
            <h3 className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Registro en Blockchain</h3>
            <button
              onClick={fetchTransactions}
              className={`flex items-center gap-1 text-sm px-3 py-1 rounded-lg transition-colors ${
                isDarkMode ? 'hover:bg-slate-700 text-gray-400' : 'hover:bg-gray-100 text-gray-600'
              }`}
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Actualizar
            </button>
          </div>
          <p className={`text-sm mb-6 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Historial de transacciones verificadas en la red
          </p>

          {loading && (
            <p className={`text-center py-8 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              Cargando transacciones...
            </p>
          )}
          {!loading && transactions.length === 0 && (
            <p className={`text-center py-8 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              No hay transacciones registradas.
            </p>
          )}

          <div className="space-y-4">
            {transactions.map((tx) => (
              <div key={tx.id} className={`p-4 rounded-xl ${
                isDarkMode ? 'bg-slate-700 border border-slate-600' : 'bg-gray-50 border border-gray-200'
              }`}>
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline" className={isDarkMode ? 'border-slate-500 text-gray-300' : 'border-gray-300 text-gray-700'}>
                        {typeLabel(tx.type)}
                      </Badge>
                      <Badge className={`border ${
                        isDarkMode
                          ? 'bg-green-600/20 text-green-400 border-green-500/30'
                          : 'bg-green-100 text-green-700 border-green-200'
                      }`}>
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Confirmado
                      </Badge>
                    </div>
                    <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      {new Date(tx.createdAt).toLocaleString('es-CO', {
                        year: 'numeric', month: 'short', day: 'numeric',
                        hour: '2-digit', minute: '2-digit'
                      })}
                    </div>
                  </div>
                  <div className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    ${Number(tx.amount).toLocaleString()}
                  </div>
                </div>

                <div className={`flex items-center gap-2 p-3 rounded ${
                  isDarkMode ? 'bg-slate-600' : 'bg-gray-200'
                }`}>
                  <code className={`text-xs flex-1 truncate font-mono ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    {tx.transactionHash}
                  </code>
                  <Button
                    size="sm"
                    variant="ghost"
                    className={isDarkMode ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'}
                    onClick={() => copyToClipboard(tx.transactionHash)}
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className={isDarkMode ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'}
                    onClick={() => window.open(`https://etherscan.io/tx/${tx.transactionHash}`, '_blank')}
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
