import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Save, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';
import { useTheme } from '../context/ThemeContext';

export function Profile() {
  const { isDarkMode } = useTheme();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    monthlyIncome: '3500',
    riskLevel: 'medium',
    occupation: 'Desarrollador de Software',
    yearsExperience: '5'
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Simular API call: PUT /user/profile
    setTimeout(() => {
      setLoading(false);
      toast.success('Perfil actualizado correctamente');
    }, 1000);
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
            <h2 className={`text-xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Información Financiera</h2>
            <p className={`text-sm mb-6 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Esta información se usa para calcular tu capacidad de pago
            </p>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="monthlyIncome" className={isDarkMode ? 'text-gray-300' : 'text-gray-700'}>Ingresos Mensuales (USD)</Label>
                  <input
                    id="monthlyIncome"
                    type="number"
                    value={formData.monthlyIncome}
                    onChange={(e) => handleChange('monthlyIncome', e.target.value)}
                    disabled={loading}
                    placeholder="3500"
                    className={`w-full px-4 py-2.5 rounded-lg outline-none transition-all ${
                      isDarkMode
                        ? 'bg-slate-700 border border-slate-600 text-white placeholder:text-gray-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30'
                        : 'bg-gray-50 border border-gray-300 text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200'
                    }`}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="riskLevel" className={isDarkMode ? 'text-gray-300' : 'text-gray-700'}>Nivel de Riesgo</Label>
                  <Select
                    value={formData.riskLevel}
                    onValueChange={(value) => handleChange('riskLevel', value)}
                    disabled={loading}
                  >
                    <SelectTrigger id="riskLevel" className={isDarkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-gray-50 border-gray-300 text-gray-900'}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className={isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}>
                      <SelectItem value="low">Bajo - Conservador</SelectItem>
                      <SelectItem value="medium">Medio - Moderado</SelectItem>
                      <SelectItem value="high">Alto - Agresivo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="occupation" className={isDarkMode ? 'text-gray-300' : 'text-gray-700'}>Ocupación</Label>
                  <input
                    id="occupation"
                    type="text"
                    value={formData.occupation}
                    onChange={(e) => handleChange('occupation', e.target.value)}
                    disabled={loading}
                    placeholder="Tu profesión"
                    className={`w-full px-4 py-2.5 rounded-lg outline-none transition-all ${
                      isDarkMode
                        ? 'bg-slate-700 border border-slate-600 text-white placeholder:text-gray-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30'
                        : 'bg-gray-50 border border-gray-300 text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200'
                    }`}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="yearsExperience" className={isDarkMode ? 'text-gray-300' : 'text-gray-700'}>Años de Experiencia</Label>
                  <input
                    id="yearsExperience"
                    type="number"
                    value={formData.yearsExperience}
                    onChange={(e) => handleChange('yearsExperience', e.target.value)}
                    disabled={loading}
                    placeholder="5"
                    className={`w-full px-4 py-2.5 rounded-lg outline-none transition-all ${
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
