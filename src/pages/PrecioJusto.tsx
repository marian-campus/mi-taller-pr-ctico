import { useState } from 'react';
import Layout from '@/components/Layout';
import { useApp } from '@/context/AppContext';
import { formatCurrency } from '@/lib/format';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { toast } from 'sonner';

export default function PrecioJusto() {
  const { products, expenses, updateProduct } = useApp();
  const [selectedId, setSelectedId] = useState(products[0]?.id || '');
  const [margin, setMargin] = useState([70]);
  const [units, setUnits] = useState('10');
  const [comp1, setComp1] = useState('');
  const [comp2, setComp2] = useState('');
  const [comp3, setComp3] = useState('');

  const product = products.find(p => p.id === selectedId);
  const cost = product?.totalCost || 0;
  const marginPct = margin[0];
  const suggestedPrice = Math.round(cost * (1 + marginPct / 100));
  const profit = suggestedPrice - cost;
  const rentability = cost > 0 ? Math.round((profit / cost) * 100) : 0;

  const cashPrice = suggestedPrice;
  const debitPrice = Math.round(suggestedPrice * 1.03);
  const creditPrice = Math.round(suggestedPrice * 1.09);

  const numUnits = parseInt(units) || 0;
  const totalRevenue = suggestedPrice * numUnits;
  const totalCosts = cost * numUnits;
  const netProfit = totalRevenue - totalCosts;

  const monthExpenses = expenses.reduce((s, e) => s + e.amount, 0);
  const unitsBreakEven = profit > 0 ? Math.ceil(monthExpenses / profit) : 0;

  const competitors = [comp1, comp2, comp3].map(Number).filter(n => n > 0);
  const avgComp = competitors.length > 0 ? competitors.reduce((a, b) => a + b, 0) / competitors.length : 0;
  const diffPct = avgComp > 0 ? Math.round(((suggestedPrice - avgComp) / avgComp) * 100) : 0;

  const handleSave = () => {
    if (product) {
      updateProduct({ ...product, sellingPrice: suggestedPrice });
      toast.success('¡Precio guardado!');
    }
  };

  return (
    <Layout title="💵 El Precio Justo">
      <div className="space-y-5 max-w-lg mx-auto">
        {/* Product selector */}
        <div>
          <Label>Seleccioná un producto</Label>
          <select value={selectedId} onChange={e => setSelectedId(e.target.value)}
            className="w-full h-10 mt-1 rounded-md border border-input bg-background px-3 text-sm">
            {products.length === 0 && <option value="">No hay productos creados</option>}
            {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>

        {product && (
          <>
            <Card className="p-4 rounded-xl">
              <p className="text-sm text-muted-foreground">📊 Tu costo de producción:</p>
              <p className="text-3xl font-bold text-primary mt-1">{formatCurrency(cost)}</p>
            </Card>

            {/* Margin */}
            <Card className="p-4 space-y-4 rounded-xl">
              <h3 className="font-semibold">¿Qué margen de ganancia querés?</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Margen</span>
                  <span className="font-bold text-primary text-lg">{marginPct}%</span>
                </div>
                <Slider value={margin} onValueChange={setMargin} max={200} step={5} className="w-full" />
                <div className="flex gap-2 flex-wrap">
                  <Button variant="outline" size="sm" onClick={() => setMargin([40])}
                    className={marginPct === 40 ? 'border-primary bg-accent' : ''}>🌱 Básica (40%)</Button>
                  <Button variant="outline" size="sm" onClick={() => setMargin([70])}
                    className={marginPct === 70 ? 'border-primary bg-accent' : ''}>⭐ Recomendada (70%)</Button>
                  <Button variant="outline" size="sm" onClick={() => setMargin([100])}
                    className={marginPct === 100 ? 'border-primary bg-accent' : ''}>👑 Premium (100%)</Button>
                </div>
              </div>
            </Card>

            {/* Suggested Price */}
            <Card className="p-5 bg-primary text-primary-foreground rounded-2xl">
              <p className="text-sm opacity-90">💵 PRECIO SUGERIDO</p>
              <p className="text-4xl font-bold mt-1">{formatCurrency(suggestedPrice)}</p>
              <div className="flex gap-4 mt-3 text-sm opacity-90">
                <span>📈 Ganancia: {formatCurrency(profit)}</span>
                <span>💰 Rentabilidad: {rentability}%</span>
              </div>
              {marginPct < 30 && (
                <p className="mt-3 text-sm bg-primary-foreground/20 rounded-lg p-2">⚠️ Ojo: Con este precio apenas cubrís costos.</p>
              )}
              {marginPct >= 50 && marginPct <= 80 && (
                <p className="mt-3 text-sm bg-primary-foreground/20 rounded-lg p-2">✅ Precio equilibrado para emprendimientos.</p>
              )}
            </Card>

            {/* Payment Methods */}
            <Card className="p-4 space-y-3 rounded-xl">
              <h3 className="font-semibold">Precio según forma de pago</h3>
              <div className="space-y-2">
                <div className="flex justify-between text-sm"><span>💵 Efectivo/Transferencia</span><span className="font-bold">{formatCurrency(cashPrice)}</span></div>
                <div className="flex justify-between text-sm"><span>💳 Débito (+3%)</span><span className="font-bold">{formatCurrency(debitPrice)}</span></div>
                <div className="flex justify-between text-sm"><span>💳 Crédito 3 cuotas (+9%)</span><span className="font-bold">{formatCurrency(creditPrice)}</span></div>
              </div>
            </Card>

            {/* Sales Projection */}
            <Card className="p-4 space-y-3 rounded-xl">
              <h3 className="font-semibold">Proyección de Ventas</h3>
              <div>
                <Label>Si vendés este mes:</Label>
                <div className="flex items-center gap-2 mt-1">
                  <Input type="number" value={units} onChange={e => setUnits(e.target.value)} className="w-24" min="0" />
                  <span className="text-sm text-muted-foreground">unidades</span>
                </div>
              </div>
              {numUnits > 0 && (
                <div className="space-y-1.5 bg-accent p-3 rounded-xl text-sm">
                  <div className="flex justify-between"><span>💵 Ingresos:</span><span className="font-bold">{formatCurrency(totalRevenue)}</span></div>
                  <div className="flex justify-between"><span>💸 Costos:</span><span className="font-bold">{formatCurrency(totalCosts)}</span></div>
                  <div className="flex justify-between border-t border-border pt-1.5">
                    <span className="font-semibold">📈 Ganancia Neta:</span>
                    <span className="font-bold text-primary">{formatCurrency(netProfit)}</span>
                  </div>
                  {unitsBreakEven > 0 && (
                    <p className="text-muted-foreground mt-2">💡 Para cubrir tus gastos de {formatCurrency(monthExpenses)}, necesitás vender {unitsBreakEven} unidades.</p>
                  )}
                </div>
              )}
            </Card>

            {/* Competitor Comparison */}
            <Card className="p-4 space-y-3 rounded-xl">
              <h3 className="font-semibold">Comparar con el mercado</h3>
              <div className="grid grid-cols-3 gap-2">
                <Input type="number" placeholder="Precio 1" value={comp1} onChange={e => setComp1(e.target.value)} />
                <Input type="number" placeholder="Precio 2" value={comp2} onChange={e => setComp2(e.target.value)} />
                <Input type="number" placeholder="Precio 3" value={comp3} onChange={e => setComp3(e.target.value)} />
              </div>
              {avgComp > 0 && (
                <div className="bg-accent p-3 rounded-xl text-sm">
                  <p>Promedio del mercado: <span className="font-bold">{formatCurrency(avgComp)}</span></p>
                  <p className={diffPct > 0 ? 'text-cta font-medium' : 'text-primary font-medium'}>
                    Estás {Math.abs(diffPct)}% {diffPct > 0 ? 'por encima' : 'por debajo'} del mercado
                  </p>
                </div>
              )}
            </Card>

            <Button onClick={handleSave} className="w-full h-12">Guardar Precio de Venta</Button>
          </>
        )}

        {products.length === 0 && (
          <Card className="p-8 text-center rounded-xl">
            <p className="text-3xl mb-2">📦</p>
            <p className="text-muted-foreground">Primero necesitás crear un producto en el Recetario.</p>
          </Card>
        )}
      </div>
    </Layout>
  );
}
