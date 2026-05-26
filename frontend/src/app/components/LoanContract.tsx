import { useEffect, useState } from 'react';
import {
  X, Download, FileText, CheckCircle, Clock, AlertCircle, Building2, User
} from 'lucide-react';
import { Button } from './ui/button';
import { useTheme } from '../context/ThemeContext';
import { loanContractService, type LoanContractData, type ContractInstallment } from '../services/loanContractService';
import { toast } from 'sonner';

interface Props {
  loanId: number;
  onClose: () => void;
}

export function LoanContract({ loanId, onClose }: Props) {
  const { isDarkMode } = useTheme();
  const [data, setData] = useState<LoanContractData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    loanContractService.getContractData(loanId)
      .then(setData)
      .catch(() => setError('No se pudo cargar el contrato.'))
      .finally(() => setLoading(false));
  }, [loanId]);

  const handleDownload = async () => {
    setDownloading(true);
    try {
      await loanContractService.downloadContract(loanId);
      toast.success('Contrato descargado correctamente.');
    } catch {
      toast.error('No se pudo descargar el contrato.');
    } finally {
      setDownloading(false);
    }
  };

  const statusLabel: Record<string, { text: string; color: string }> = {
    ACTIVE:  { text: 'ACTIVO',         color: 'bg-blue-600 text-white' },
    PAID:    { text: 'CANCELADO',      color: isDarkMode ? 'bg-green-600/20 text-green-400 border border-green-500/30' : 'bg-green-100 text-green-700 border border-green-200' },
    PENDING: { text: 'PENDIENTE',      color: isDarkMode ? 'bg-yellow-600/20 text-yellow-400 border border-yellow-500/30' : 'bg-yellow-100 text-yellow-700 border border-yellow-200' },
    DEFAULT: { text: 'INCUMPLIMIENTO', color: 'bg-red-600 text-white' },
  };

  const installmentBadge = (inst: ContractInstallment) => {
    if (inst.status === 'PAID')      return <span className="text-green-500 font-semibold text-xs">Pagada{inst.paidAt ? ` (${inst.paidAt})` : ''}</span>;
    if (inst.status === 'PROJECTED') return <span className="text-gray-400 italic text-xs">Proyectada</span>;
    return <span className="text-yellow-500 font-semibold text-xs">Pendiente</span>;
  };

  const installmentRowIcon = (status: string) => {
    if (status === 'PAID')      return <CheckCircle className="w-3.5 h-3.5 text-green-500" />;
    if (status === 'PROJECTED') return <Clock className="w-3.5 h-3.5 text-gray-400" />;
    return <AlertCircle className="w-3.5 h-3.5 text-yellow-500" />;
  };

  const card = `rounded-xl p-5 border ${isDarkMode ? 'bg-slate-800/70 border-slate-700' : 'bg-white border-gray-200'}`;
  const label = `text-xs font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`;
  const value = `text-sm font-semibold mt-0.5 ${isDarkMode ? 'text-white' : 'text-gray-900'}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className={`relative w-full max-w-3xl max-h-[92vh] overflow-y-auto rounded-2xl shadow-2xl border flex flex-col ${
          isDarkMode ? 'bg-slate-900 border-slate-700' : 'bg-gray-50 border-gray-200'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Sticky header */}
        <div className={`sticky top-0 z-10 flex items-center justify-between px-6 py-4 border-b ${
          isDarkMode ? 'bg-slate-900 border-slate-700' : 'bg-gray-50 border-gray-200'
        }`}>
          <div className="flex items-center gap-3">
            <FileText className="w-5 h-5 text-blue-500" />
            <div>
              <h2 className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                Contrato Digital
              </h2>
              {data && (
                <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  N° {data.contractNumber}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {data && (
              <Button
                className="bg-blue-600 hover:bg-blue-700 font-semibold"
                size="sm"
                onClick={handleDownload}
                disabled={downloading}
              >
                <Download className="w-4 h-4 mr-2" />
                {downloading ? 'Descargando...' : 'Descargar'}
              </Button>
            )}
            <button
              onClick={onClose}
              className={`p-2 rounded-lg transition-colors ${isDarkMode ? 'hover:bg-slate-700 text-gray-400' : 'hover:bg-gray-200 text-gray-500'}`}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-5">
          {loading && (
            <p className={`text-center py-14 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              Generando contrato...
            </p>
          )}

          {error && (
            <p className="text-center py-14 text-red-500">{error}</p>
          )}

          {data && !loading && (
            <>
              {/* Contract meta */}
              <div className={`flex flex-wrap items-center gap-3 px-4 py-3 rounded-xl border ${
                isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'
              }`}>
                <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  <strong className={isDarkMode ? 'text-white' : 'text-gray-900'}>Préstamo:</strong> #{data.loanId}
                </span>
                <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  <strong className={isDarkMode ? 'text-white' : 'text-gray-900'}>Generado:</strong>{' '}
                  {new Date(data.generatedAt).toLocaleDateString('es-CO')}
                </span>
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                  (statusLabel[data.status] ?? { color: 'bg-gray-200 text-gray-700' }).color
                }`}>
                  {(statusLabel[data.status] ?? { text: data.status }).text}
                </span>
              </div>

              {/* CA2: Parties */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className={card}>
                  <div className="flex items-center gap-2 mb-3">
                    <User className="w-4 h-4 text-blue-500" />
                    <span className={`text-xs font-bold uppercase tracking-wide ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      Prestatario
                    </span>
                  </div>
                  {[
                    { l: 'Nombre',        v: data.borrowerName },
                    { l: 'Email',         v: data.borrowerEmail },
                    { l: 'Teléfono',      v: data.borrowerPhone },
                    { l: 'Dirección',     v: data.borrowerAddress },
                    { l: 'Blockchain ID', v: data.borrowerBlockchainId, mono: true },
                  ].map(({ l, v, mono }) => (
                    <div key={l} className="mb-2">
                      <div className={label}>{l}</div>
                      <div className={`${value} ${mono ? 'break-all text-blue-500 font-mono text-xs' : ''}`}>{v}</div>
                    </div>
                  ))}
                </div>

                <div className={card}>
                  <div className="flex items-center gap-2 mb-3">
                    <Building2 className="w-4 h-4 text-blue-500" />
                    <span className={`text-xs font-bold uppercase tracking-wide ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      Prestamista
                    </span>
                  </div>
                  {data.lenderName ? (
                    <>
                      <div className="mb-2">
                        <div className={label}>Nombre</div>
                        <div className={value}>{data.lenderName}</div>
                      </div>
                      <div className="mb-2">
                        <div className={label}>Email</div>
                        <div className={value}>{data.lenderEmail}</div>
                      </div>
                    </>
                  ) : (
                    <p className={`text-sm italic ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                      Pendiente de asignación
                    </p>
                  )}
                </div>
              </div>

              {/* CA2: All agreed conditions */}
              <div className={card}>
                <p className={`text-sm font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  Condiciones Pactadas
                </p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {[
                    { l: 'Monto del Préstamo',  v: `$${Number(data.amount).toLocaleString()}`,         accent: true },
                    { l: 'Tasa de Interés',     v: `${data.interestRate}% anual` },
                    { l: 'Plazo',               v: `${data.termMonths} meses` },
                    { l: 'Cuota Mensual',       v: `$${Number(data.monthlyPayment).toLocaleString()}`,  accent: true },
                    { l: 'Total a Pagar',       v: `$${Number(data.totalPayment).toLocaleString()}` },
                    { l: 'Saldo Pendiente',     v: `$${Number(data.pendingBalance).toLocaleString()}` },
                  ].map(({ l, v, accent }) => (
                    <div
                      key={l}
                      className={`rounded-lg p-3 border text-center ${
                        accent
                          ? isDarkMode ? 'bg-blue-600/20 border-blue-500/30' : 'bg-blue-50 border-blue-200'
                          : isDarkMode ? 'bg-slate-700/60 border-slate-600' : 'bg-gray-50 border-gray-200'
                      }`}
                    >
                      <div className={`text-xs mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>{l}</div>
                      <div className={`font-bold text-base ${accent ? 'text-blue-500' : isDarkMode ? 'text-white' : 'text-gray-900'}`}>{v}</div>
                    </div>
                  ))}
                </div>
                <div className={`mt-3 grid grid-cols-2 gap-2 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  <div>
                    <span className="font-medium">Inicio: </span>
                    {new Date(data.startDate).toLocaleDateString('es-CO')}
                  </div>
                  <div>
                    <span className="font-medium">Vencimiento: </span>
                    {new Date(data.endDate).toLocaleDateString('es-CO')}
                  </div>
                </div>
              </div>

              {/* Payment schedule */}
              <div className={card}>
                <p className={`text-sm font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  Calendario de Pagos
                </p>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className={`text-xs uppercase tracking-wide ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        <th className="text-left py-2 pr-4">#</th>
                        <th className="text-left py-2 pr-4">Vencimiento</th>
                        <th className="text-right py-2 pr-4">Monto</th>
                        <th className="text-left py-2">Estado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.installments.map((inst) => (
                        <tr
                          key={inst.number}
                          className={`border-b last:border-0 ${isDarkMode ? 'border-slate-700' : 'border-gray-100'}`}
                        >
                          <td className={`py-2 pr-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>{inst.number}</td>
                          <td className={`py-2 pr-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                            {new Date(inst.dueDate).toLocaleDateString('es-CO')}
                          </td>
                          <td className={`py-2 pr-4 text-right font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                            ${Number(inst.amount).toLocaleString()}
                          </td>
                          <td className="py-2">
                            <div className="flex items-center gap-1.5">
                              {installmentRowIcon(inst.status)}
                              {installmentBadge(inst)}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Terms */}
              <div className={`rounded-xl p-5 border text-sm leading-relaxed space-y-2 ${
                isDarkMode ? 'bg-slate-800/50 border-slate-700 text-gray-300' : 'bg-gray-50 border-gray-200 text-gray-600'
              }`}>
                <p className={`text-xs font-bold uppercase tracking-wide mb-3 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  Términos y Condiciones
                </p>
                <p><strong className={isDarkMode ? 'text-gray-200' : 'text-gray-800'}>4.1 Obligaciones:</strong> El prestatario se compromete a los pagos en las fechas establecidas. El incumplimiento afectará su Trust Score.</p>
                <p><strong className={isDarkMode ? 'text-gray-200' : 'text-gray-800'}>4.2 Mora:</strong> Los pagos tardíos generarán penalizaciones en el puntaje de reputación de la plataforma.</p>
                <p><strong className={isDarkMode ? 'text-gray-200' : 'text-gray-800'}>4.3 Prepago:</strong> Se permiten pagos anticipados sin penalización.</p>
                <p><strong className={isDarkMode ? 'text-gray-200' : 'text-gray-800'}>4.4 Validez:</strong> Contrato digital vinculante respaldado por el registro de la plataforma TrustFi.</p>
              </div>

              {/* Download CTA */}
              <div className={`rounded-xl p-4 border flex items-center justify-between gap-4 ${
                isDarkMode ? 'bg-blue-600/15 border-blue-500/30' : 'bg-blue-50 border-blue-200'
              }`}>
                <div>
                  <p className={`text-sm font-semibold ${isDarkMode ? 'text-blue-300' : 'text-blue-700'}`}>
                    Descarga tu copia del contrato
                  </p>
                  <p className={`text-xs mt-0.5 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    Formato HTML · Ábrelo en el navegador y usa <em>Imprimir → Guardar como PDF</em>
                  </p>
                </div>
                <Button
                  className="bg-blue-600 hover:bg-blue-700 font-semibold shrink-0"
                  onClick={handleDownload}
                  disabled={downloading}
                >
                  <Download className="w-4 h-4 mr-2" />
                  {downloading ? 'Descargando...' : 'Descargar'}
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
