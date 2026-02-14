import { useState } from 'react';
import Layout from '@/components/Layout';
import { useApp } from '@/context/AppContext';
import { formatCurrency } from '@/lib/format';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { X } from 'lucide-react';

const rubros = [
  { value: 'gastronomia', label: '🍰 Gastronomía' },
  { value: 'indumentaria', label: '👗 Indumentaria' },
  { value: 'cosmetica', label: '💄 Cosmética' },
  { value: 'artesanias', label: '🎨 Artesanías' },
  { value: 'servicios', label: '💼 Servicios' },
  { value: 'otros', label: '📦 Otros' },
];

export default function Perfil() {
  const { user, setUser } = useApp();
  const [form, setForm] = useState({ ...user });
  const [newFixedName, setNewFixedName] = useState('');
  const [newFixedAmount, setNewFixedAmount] = useState('');

  const update = (key: string, value: string | number) => setForm(prev => ({ ...prev, [key]: value }));

  const handleSave = () => {
    setUser(form);
    toast.success('¡Configuración guardada!');
  };

  const addFixedCost = () => {
    if (!newFixedName.trim() || !newFixedAmount) return;
    setForm(prev => ({
      ...prev,
      fixedCosts: [...prev.fixedCosts, { name: newFixedName.trim(), amount: parseFloat(newFixedAmount) }],
    }));
    setNewFixedName('');
    setNewFixedAmount('');
  };

  const removeFixedCost = (index: number) => {
    setForm(prev => ({ ...prev, fixedCosts: prev.fixedCosts.filter((_, i) => i !== index) }));
  };

  const totalFixed = form.fixedCosts.reduce((s, f) => s + f.amount, 0);

  return (
    <Layout title="⚙️ Mi Perfil">
      <div className="space-y-5 max-w-lg mx-auto">
        {/* Business Info */}
        <Card className="p-4 space-y-3 rounded-xl">
          <h3 className="font-semibold text-lg">Mi Emprendimiento</h3>
          <div>
            <Label>Tu nombre</Label>
            <Input value={form.name} onChange={e => update('name', e.target.value)} className="mt-1" />
          </div>
          <div>
            <Label>Nombre del emprendimiento</Label>
            <Input value={form.businessName} onChange={e => update('businessName', e.target.value)} className="mt-1" />
          </div>
          <div>
            <Label>Rubro</Label>
            <select value={form.businessCategory} onChange={e => update('businessCategory', e.target.value)}
              className="w-full h-10 mt-1 rounded-md border border-input bg-background px-3 text-sm">
              {rubros.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
            </select>
          </div>
          <div>
            <Label>Ubicación</Label>
            <Input value={form.location} onChange={e => update('location', e.target.value)} className="mt-1" />
          </div>
        </Card>

        {/* Hourly Rate */}
        <Card className="p-4 space-y-3 rounded-xl">
          <h3 className="font-semibold text-lg">Tu Valor por Hora</h3>
          <p className="text-sm text-muted-foreground">💡 Tu tiempo es tu recurso más valioso. No regales tu esfuerzo.</p>
          <div>
            <Label>$ / hora</Label>
            <Input type="number" value={form.hourlyRate} onChange={e => update('hourlyRate', parseFloat(e.target.value) || 0)} className="mt-1" />
          </div>
          <div className="flex gap-2 flex-wrap">
            {[2000, 4000, 6000].map(v => (
              <Button key={v} variant="outline" size="sm" onClick={() => update('hourlyRate', v)}
                className={form.hourlyRate === v ? 'border-primary bg-accent' : ''}>
                {formatCurrency(v)}
              </Button>
            ))}
          </div>
        </Card>

        {/* Service Costs */}
        <Card className="p-4 space-y-3 rounded-xl">
          <h3 className="font-semibold text-lg">Costo Estimado Servicios</h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Electricidad ($/hora)</Label>
              <Input type="number" value={form.electricityCostPerHour} onChange={e => update('electricityCostPerHour', parseFloat(e.target.value) || 0)} className="mt-1" />
            </div>
            <div>
              <Label>Gas ($/hora)</Label>
              <Input type="number" value={form.gasCostPerHour} onChange={e => update('gasCostPerHour', parseFloat(e.target.value) || 0)} className="mt-1" />
            </div>
          </div>
        </Card>

        {/* Fixed Costs */}
        <Card className="p-4 space-y-3 rounded-xl">
          <h3 className="font-semibold text-lg">Gastos Fijos Mensuales</h3>
          {form.fixedCosts.map((fc, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="flex-1 text-sm">{fc.name}</span>
              <span className="font-medium text-sm">{formatCurrency(fc.amount)}</span>
              <button onClick={() => removeFixedCost(i)} className="text-destructive p-1">
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
          <div className="flex gap-2">
            <Input placeholder="Nombre" value={newFixedName} onChange={e => setNewFixedName(e.target.value)} className="flex-1" />
            <Input type="number" placeholder="$" value={newFixedAmount} onChange={e => setNewFixedAmount(e.target.value)} className="w-28" />
            <Button variant="outline" size="icon" onClick={addFixedCost} className="shrink-0">+</Button>
          </div>
          <div className="border-t pt-2 flex justify-between font-semibold">
            <span>Total</span>
            <span className="text-primary">{formatCurrency(totalFixed)}</span>
          </div>
        </Card>

        <Button onClick={handleSave} className="w-full h-12">Guardar Configuración</Button>
      </div>
    </Layout>
  );
}
