import { useState } from 'react';
import Layout from '@/components/Layout';
import { useApp } from '@/context/AppContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useNavigate, useParams } from 'react-router-dom';
import { Expense } from '@/types';
import { toast } from 'sonner';

const categories = [
  { value: 'transporte', label: '🚗 Transporte y Nafta' },
  { value: 'publicidad', label: '📱 Publicidad y Marketing' },
  { value: 'alquiler', label: '🏢 Alquiler' },
  { value: 'servicios', label: '📞 Servicios' },
  { value: 'limpieza', label: '🧹 Limpieza' },
  { value: 'capacitacion', label: '📚 Capacitación' },
  { value: 'comisiones', label: '🏦 Comisiones Bancarias' },
  { value: 'tramites', label: '📄 Trámites' },
  { value: 'muestras', label: '🎁 Muestras' },
  { value: 'impuestos', label: '💸 Impuestos y Tasas' },
  { value: 'otros', label: '📦 Otros' },
];

const paymentMethods = [
  { value: 'efectivo', label: '💵 Efectivo' },
  { value: 'debito', label: '💳 Débito' },
  { value: 'credito', label: '💳 Crédito' },
  { value: 'transferencia', label: '🏦 Transferencia' },
];

export default function NuevoGasto() {
  const { addExpense, updateExpense, expenses } = useApp();
  const navigate = useNavigate();
  const { id } = useParams();
  const existing = id ? expenses.find(e => e.id === id) : null;

  const [description, setDescription] = useState(existing?.description || '');
  const [category, setCategory] = useState(existing?.category || 'otros');
  const [amount, setAmount] = useState(existing?.amount.toString() || '');
  const [date, setDate] = useState(existing?.date || new Date().toISOString().split('T')[0]);
  const [paymentMethod, setPaymentMethod] = useState(existing?.paymentMethod || 'efectivo');
  const [recurring, setRecurring] = useState(existing?.recurring || false);

  const handleSave = () => {
    if (!description.trim() || !amount || parseFloat(amount) <= 0) {
      toast.error('Completá todos los campos');
      return;
    }
    const expense: Expense = {
      id: existing?.id || 'exp-' + Date.now(),
      description: description.trim(),
      category,
      amount: parseFloat(amount),
      date,
      paymentMethod,
      recurring,
      includedInFixedCosts: existing?.includedInFixedCosts ?? true,
    };
    if (existing) updateExpense(expense); else addExpense(expense);
    toast.success(existing ? '¡Gasto actualizado!' : '¡Gasto registrado!');
    navigate('/bolsillo');
  };

  return (
    <Layout title={existing ? '✏️ Editar Gasto' : '+ Nuevo Gasto'}>
      <div className="space-y-4 max-w-lg md:max-w-xl mx-auto">
        <div>
          <Label>¿Qué gastaste?</Label>
          <Input value={description} onChange={e => setDescription(e.target.value)} placeholder="Ej: Nafta para comprar ingredientes" className="mt-1" />
        </div>

        <div>
          <Label>Categoría</Label>
          <select value={category} onChange={e => setCategory(e.target.value)}
            className="w-full h-10 mt-1 rounded-md border border-input bg-background px-3 text-sm">
            {categories.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
        </div>

        <div>
          <Label>Monto ($)</Label>
          <Input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0" min="0" className="mt-1" />
        </div>

        <div>
          <Label>Fecha</Label>
          <Input type="date" value={date} onChange={e => setDate(e.target.value)} className="mt-1" />
        </div>

        <div>
          <Label>Método de pago</Label>
          <select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)}
            className="w-full h-10 mt-1 rounded-md border border-input bg-background px-3 text-sm">
            {paymentMethods.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
          </select>
        </div>

        <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
          <Switch checked={recurring} onCheckedChange={setRecurring} />
          <div className="flex-1">
            <Label className="cursor-pointer">¿Este gasto se repite cada mes?</Label>
          </div>
          {recurring && <span className="text-xs bg-cta/20 text-cta px-2 py-0.5 rounded-full font-medium">Recurrente</span>}
        </div>

        <div className="flex gap-3 pt-2">
          <Button onClick={handleSave} className="flex-1 h-12">Guardar</Button>
          <Button variant="outline" onClick={() => navigate('/bolsillo')} className="flex-1 h-12">Cancelar</Button>
        </div>
      </div>
    </Layout>
  );
}
