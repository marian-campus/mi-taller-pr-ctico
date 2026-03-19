import { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import { useApp } from '@/context/AppContext';
import { formatCurrency } from '@/lib/format';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { TrendingUp, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function PrecioJusto() {
  const { products = [], updateProduct, user } = useApp();
  const navigate = useNavigate();

  const [selectedId, setSelectedId] = useState(products[0]?.id || '');
  const [margin, setMargin] = useState([70]);
  const [comp1, setComp1] = useState('');
  const [comp2, setComp2] = useState('');
  const [comp3, setComp3] = useState('');

  // Handle selectedId when products load
  useEffect(() => {
    if (products.length > 0 && !selectedId) {
      setSelectedId(products[0].id);
    }
  }, [products, selectedId]);

  if (!user) return <Layout title="Cargando..."><div className="p-8 text-center text-muted-foreground">Cargando datos...</div></Layout>;

  const product = products.find(p => p.id === selectedId);
  const cost = product?.totalCost || 0;
  const marginPct = margin[0];
  const suggestedPrice = Math.round(cost * (1 + marginPct / 100));
  const profit = suggestedPrice - cost;
  const rentability = cost > 0 ? Math.round((profit / cost) * 100) : 0;

  const competitors = [comp1, comp2, comp3].map(Number).filter(n => n > 0);
  const avgComp = competitors.length > 0 ? competitors.reduce((a, b) => a + b, 0) / competitors.length : 0;
  const diffPct = avgComp > 0 ? Math.round(((suggestedPrice - avgComp) / avgComp) * 100) : 0;

  const handleSave = () => {
    if (product) {
      updateProduct({ ...product, sellingPrice: suggestedPrice });
      toast.success('¡Precio sugerido guardado!');
    }
  };

  return (
    <Layout title="💵 El Precio Justo">
      <div className="space-y-5 max-w-lg mx-auto pb-20">
        {/* Product selector */}
        <div className="bg-muted/30 p-4 rounded-xl space-y-2">
          <Label className="text-muted-foreground font-semibold">1. Seleccioná el producto a costear</Label>
          <select value={selectedId} onChange={e => setSelectedId(e.target.value)}
            className="w-full h-12 rounded-xl border border-input bg-background px-4 text-sm font-medium focus:ring-2 focus:ring-primary shadow-sm">
            {products.length === 0 && <option value="">No hay productos creados</option>}
            {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>

        {product ? (
          <>
            <Card className="p-4 rounded-xl border-dashed">
              <p className="text-sm text-muted-foreground font-medium">Costo de producción unitario:</p>
              <p className="text-3xl font-black text-primary mt-1">{formatCurrency(cost, user?.currencySymbol)}</p>
            </Card>

            {/* Margin Selection */}
            <Card className="p-5 space-y-4 rounded-2xl shadow-sm">
              <div className="flex justify-between items-center">
                <h3 className="font-bold text-lg">2. Tu Margen de Ganancia</h3>
                <span className="font-black text-primary text-xl">{marginPct}%</span>
              </div>
              <Slider value={margin} onValueChange={setMargin} max={200} step={5} className="w-full pt-2" />
              <div className="grid grid-cols-1 gap-2 pt-2">
                <Button variant="outline" onClick={() => setMargin([40])} className={marginPct === 40 ? 'border-primary bg-primary/5 text-primary' : ''}>🌱 Básico (40%) - Para venta mayorista</Button>
                <Button variant="outline" onClick={() => setMargin([70])} className={marginPct === 70 ? 'border-primary bg-primary/5 text-primary' : ''}>⭐ Recomendado (70%) - Emprendedores</Button>
                <Button variant="outline" onClick={() => setMargin([100])} className={marginPct === 100 ? 'border-primary bg-primary/5 text-primary' : ''}>👑 Premium (100%) - Valor agregado</Button>
              </div>
            </Card>

            {/* Suggested Price Result */}
            <Card className="p-6 bg-primary text-primary-foreground rounded-3xl shadow-xl shadow-primary/20">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs font-bold opacity-80 tracking-widest uppercase">Precio Sugerido</p>
                  <p className="text-4xl font-black mt-2">{formatCurrency(suggestedPrice, user?.currencySymbol)}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] opacity-80 uppercase">{profit >= 0 ? 'Ganancia' : 'Pérdida'}</p>
                  <p className="text-lg font-bold">{formatCurrency(profit, user?.currencySymbol)}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 mt-4 pt-4 border-t border-white/20 text-sm">
                <TrendingUp className="h-4 w-4" />
                <span>Rentabilidad del <strong>{rentability}%</strong> sobre el costo</span>
              </div>
            </Card>

            {/* Competitor Price Comparison */}
            <Card className="p-5 space-y-4 rounded-2xl">
              <h3 className="font-bold">3. Compará con tu Competencia</h3>
              <p className="text-xs text-muted-foreground">Ingresá precios de referencia del mercado para saber dónde estás parado.</p>
              <div className="grid grid-cols-3 gap-3">
                <Input type="number" placeholder="$ Ref 1" value={comp1} onChange={e => setComp1(e.target.value)} className="rounded-lg" />
                <Input type="number" placeholder="$ Ref 2" value={comp2} onChange={e => setComp2(e.target.value)} className="rounded-lg" />
                <Input type="number" placeholder="$ Ref 3" value={comp3} onChange={e => setComp3(e.target.value)} className="rounded-lg" />
              </div>
              {avgComp > 0 && (
                <div className={cn(
                  "p-4 rounded-xl text-sm font-medium",
                  diffPct > 0 ? "bg-amber-100 text-amber-900 border border-amber-200" : "bg-emerald-100 text-emerald-800 border border-emerald-200"
                )}>
                  <p>Promedio del mercado: <strong>{formatCurrency(avgComp, user?.currencySymbol)}</strong></p>
                  <p className="mt-1">
                    Estás {Math.abs(diffPct)}% {diffPct > 0 ? (
                      <span><strong className="text-amber-700">por encima</strong>. Asegurate de que tu calidad sea superior.</span>
                    ) : (
                      <span><strong className="text-emerald-700">por debajo</strong>. Tenés un precio muy competitivo.</span>
                    )}
                  </p>
                </div>
              )}
            </Card>

            <Button onClick={handleSave} className="w-full h-14 text-lg font-bold rounded-2xl">
              Guardar este precio en el producto
            </Button>

            {/* Call to Action: Simulator */}
            <div className="pt-4">
              <Card
                className="p-5 bg-gradient-to-br from-cta to-cta/80 text-white rounded-2xl border-none shadow-lg cursor-pointer hover:scale-[1.01] transition-transform"
                onClick={() => navigate('/simulador')}
              >
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <h3 className="font-black text-lg">Paso Final: Tu Meta Global</h3>
                    <p className="text-xs opacity-90">Simulá tu mix de ventas para cubrir todos los gastos.</p>
                  </div>
                  <ArrowRight className="h-6 w-6 opacity-80" />
                </div>
              </Card>
            </div>
          </>
        ) : (
          <Card className="p-10 text-center rounded-3xl border-2 border-dashed">
            <div className="text-5xl mb-4">🧁</div>
            <p className="text-muted-foreground font-medium mb-4">Aún no tienes productos creados en tu recetario.</p>
            <Button onClick={() => navigate('/recetario/nuevo')}>Empezar a Crear</Button>
          </Card>
        )}
      </div>
    </Layout>
  );
}
