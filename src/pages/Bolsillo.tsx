import { useState, useMemo, useEffect } from 'react';
import Layout from '@/components/Layout';
import { useApp } from '@/context/AppContext';
import { formatCurrency } from '@/lib/format';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import CategoryIcon from '@/components/CategoryIcon';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Plus, Pencil, Trash2, Calculator, ChevronRight, Save } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const COLORS = ['#00A86B', '#FF6B35', '#4A90D9', '#E74C3C', '#9B59B6', '#F1C40F', '#1ABC9C', '#E67E22', '#95A5A6', '#2ECC71'];

const categoryLabels: Record<string, string> = {
  transporte: 'Transporte', publicidad: 'Publicidad', alquiler: 'Alquiler',
  servicios: 'Servicios', limpieza: 'Limpieza', capacitacion: 'Capacitación',
  comisiones: 'Comisiones', tramites: 'Trámites', muestras: 'Muestras', otros: 'Otros',
};

const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

export default function Bolsillo() {
  const { expenses, updateExpense, deleteExpense, user, setUser, updateProfile } = useApp();
  const navigate = useNavigate();

  const now = new Date();
  const [month, setMonth] = useState(now.getMonth());
  const [year, setYear] = useState(now.getFullYear());

  // Form state for Section A
  const [form, setForm] = useState<any>({ 
    monthlySalary: user?.monthlySalary || 0,
    monthlyWorkingHours: user?.monthlyWorkingHours || 0,
    hourlyRate: user?.hourlyRate || 0,
    currencySymbol: user?.currencySymbol || '$',
    businessDescription: user?.businessDescription || '',
    mainProducts: user?.mainProducts || '',
    ...user 
  });

  // Update local form when user settings change
  useEffect(() => {
    if (user) {
      setForm({ ...user });
    }
  }, [user]);
  
  const updateForm = (field: string, value: string | number) => {
    setForm(prev => {
      const next = { ...prev, [field]: value };
      if (field === 'monthlySalary' || field === 'monthlyWorkingHours') {
        const valStr = String(value);
        const salary = field === 'monthlySalary' ? (parseFloat(valStr) || 0) : Number(prev.monthlySalary);
        const hours = field === 'monthlyWorkingHours' ? (parseFloat(valStr) || 0) : Number(prev.monthlyWorkingHours);
        next.hourlyRate = hours > 0 ? (salary / hours) : 0;
      }
      return next;
    });
  };

  const toggleExpenseInclusion = (id: string, checked: boolean) => {
    const expense = expenses.find(e => e.id === id);
    if (expense) {
      updateExpense({ ...expense, includedInFixedCosts: checked });
    }
  };

  const handleSaveConfig = async () => {
    try {
      await updateProfile({
        monthlySalary: Number(form.monthlySalary),
        monthlyWorkingHours: Number(form.monthlyWorkingHours),
        hourlyRate: Number(form.hourlyRate),
        businessDescription: form.businessDescription,
        mainProducts: form.mainProducts
      });
      toast.success('Configuración guardada');
    } catch (err) {
      toast.error('Error al guardar configuración');
    }
  };

  const monthExpenses = useMemo(() =>
    expenses
      .filter(e => { const d = new Date(e.date); return d.getMonth() === month && d.getFullYear() === year; })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    [expenses, month, year]
  );

  const totalMonth = monthExpenses.reduce((s, e) => s + e.amount, 0);

  // Section B Logic: Dynamic calculation of included expenses
  const includedExpensesTotal = useMemo(() => {
    return monthExpenses
      .filter(e => e.includedInFixedCosts !== false)
      .reduce((sum, e) => sum + e.amount, 0);
  }, [monthExpenses]);

  const hourlyFixedCostRate = useMemo(() => {
    return (form.monthlyWorkingHours || 0) > 0 ? (includedExpensesTotal / (form.monthlyWorkingHours || 0)) : 0;
  }, [includedExpensesTotal, form.monthlyWorkingHours]);

  const chartData = useMemo(() => {
    const byCategory: Record<string, number> = {};
    monthExpenses.forEach(e => { byCategory[e.category] = (byCategory[e.category] || 0) + e.amount; });
    return Object.entries(byCategory).map(([cat, amount]) => ({ name: categoryLabels[cat] || cat, value: amount }));
  }, [monthExpenses]);

  if (!user) return <Layout title="Cargando..."><div className="p-8 text-center text-muted-foreground">Cargando datos del negocio...</div></Layout>;

  return (
    <Layout title="💰 Mi Negocio">
      <div className="space-y-4">

        <Card className="p-4 space-y-4 rounded-xl border-border/50 shadow-sm">
          <div>
            <Label className="text-sm font-bold text-foreground mb-1.5 block">Breve Descripción de Mi Negocio o Emprendimiento</Label>
            <Textarea 
              placeholder="Ej: Taller de costura artesanal especializado en accesorios..."
              value={form.businessDescription}
              onChange={e => updateForm('businessDescription', e.target.value)}
              className="min-h-[80px] bg-background/50 focus:bg-background transition-colors"
            />
          </div>
          <div>
            <Label className="text-sm font-bold text-foreground mb-1.5 block">Productos principales de Venta</Label>
            <Textarea 
              placeholder="Ej: Mochilas, cartucheras, bolsos de tela..."
              value={form.mainProducts}
              onChange={e => updateForm('mainProducts', e.target.value)}
              className="min-h-[80px] bg-background/50 focus:bg-background transition-colors"
            />
          </div>
        </Card>

        <Card className="p-4 bg-accent/20 border-accent/30 rounded-xl">
          <p className="text-sm text-muted-foreground leading-relaxed">
            Un espacio para registrar los gastos mensuales de tu negocio. Estos gastos se suman para calcular automáticamente el <strong>Costo Fijo Proporcional</strong> en tus productos.
          </p>
        </Card>


        {/* Month selector */}
        <div className="flex gap-2">
          <select value={month} onChange={e => setMonth(parseInt(e.target.value))}
            className="flex-1 h-10 rounded-md border border-input bg-background px-3 text-sm">
            {months.map((m, i) => <option key={i} value={i}>{m}</option>)}
          </select>
          <select value={year} onChange={e => setYear(parseInt(e.target.value))}
            className="w-24 h-10 rounded-md border border-input bg-background px-3 text-sm">
            {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>

        <Card className="p-5 bg-primary text-primary-foreground rounded-2xl">
          <p className="text-sm opacity-90">💼 {months[month]} {year}</p>
          <p className="text-3xl font-bold mt-1">{formatCurrency(totalMonth, user?.currencySymbol)}</p>
          <p className="text-xs opacity-80 mt-1">{monthExpenses.length} gastos registrados</p>
        </Card>

        {/* Pie chart */}
        {chartData.length > 0 && (
          <Card className="p-4 rounded-xl">
            <h3 className="font-semibold mb-3">Distribución por categoría</h3>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={chartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} innerRadius={40}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                  {chartData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(value: number) => formatCurrency(value, user?.currencySymbol)} />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        )}

        {/* Expense list */}
        <div className="space-y-2">
          <h3 className="font-semibold px-1">Gastos del mes</h3>
          {monthExpenses.length === 0 ? (
            <Card className="p-8 text-center rounded-xl">
              <p className="text-3xl mb-2">💸</p>
              <p className="text-muted-foreground">No hay gastos registrados este mes.</p>
            </Card>
          ) : (
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {monthExpenses.map(e => (
                <Card key={e.id} className="p-3 rounded-xl flex flex-col justify-between">
                  <div className="flex items-center gap-3">
                    <CategoryIcon category={e.category} className="text-xl" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{e.description}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(e.date + 'T12:00:00').toLocaleDateString('es-AR')}
                        {e.recurring && <span className="ml-2 bg-cta/20 text-cta px-1.5 py-0.5 rounded-full text-[10px] font-medium">Recurrente</span>}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/50">
                    <p className="font-bold text-lg whitespace-nowrap">{formatCurrency(e.amount, user?.currencySymbol)}</p>
                    <div className="flex gap-1 shrink-0">
                      <button onClick={() => navigate(`/bolsillo/${e.id}`)} className="p-1.5 text-muted-foreground hover:text-primary rounded transition-colors bg-muted/50">
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button onClick={() => { if (confirm('¿Eliminar este gasto?')) deleteExpense(e.id); }}
                        className="p-1.5 text-muted-foreground hover:text-destructive rounded transition-colors bg-destructive/10">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>

        <div className="h-4" />
        <div className="border-t border-border pt-6 pb-4">
          <h2 className="text-xl font-bold px-1 mb-2">Configuración de Impacto en Costos</h2>
          <p className="text-sm text-muted-foreground px-1 mb-6">
            Ajustá cómo estos gastos y tu tiempo impactan en el precio de tus productos.
          </p>

          <div className="space-y-6 md:grid md:grid-cols-2 md:gap-6 md:space-y-0 md:items-start">
            {/* SECCIÓN A: Mano de Obra */}
            <Card className="p-4 space-y-4 rounded-xl border-primary/20 border-2 shadow-md flex-1">
              <div className="flex items-center gap-2">
                <span className="text-2xl">⏱️</span>
                <h3 className="font-bold text-lg">SECCIÓN A: Mano de Obra</h3>
              </div>

              <div className="space-y-4">
                <div>
                  <Label className="text-xs font-bold uppercase text-muted-foreground">Sueldo Mensual Aproximado</Label>
                  <Input
                    type="number"
                    value={form.monthlySalary}
                    onChange={e => updateForm('monthlySalary', e.target.value)}
                    className="mt-1 h-12 text-lg font-semibold"
                    placeholder="Ej: 800000"
                  />
                  <p className="text-[11px] text-muted-foreground mt-1 leading-tight">
                    Esto definirá el costo de tu tiempo.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs font-bold uppercase text-muted-foreground">Horas por mes</Label>
                    <Input
                      type="number"
                      value={form.monthlyWorkingHours}
                      onChange={e => updateForm('monthlyWorkingHours', e.target.value)}
                      className="mt-1 h-12 text-lg font-semibold"
                    />
                    <p className="text-[10px] text-muted-foreground mt-1">Default: 160hs (40 horas semanales por 4)</p>
                  </div>
                  <div>
                    <Label className="text-xs font-bold uppercase text-muted-foreground">Valor hora (calc.)</Label>
                    <div className="h-12 mt-1 flex items-center px-4 rounded-md border border-input bg-primary/5 text-lg font-black text-primary truncate">
                      {formatCurrency(form.hourlyRate, form.currencySymbol)}/h
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            {/* SECCIÓN B: Costos Fijos */}
            <Card className="p-4 space-y-4 rounded-xl bg-accent/30 border-accent border-2 shadow-md flex-1">
              <div className="flex items-center gap-2">
                <span className="text-2xl">🏠</span>
                <h3 className="font-bold text-lg">SECCIÓN B: Costos Fijos</h3>
              </div>

              <p className="text-sm text-muted-foreground">
                Activá los gastos que querés trasladar proporcionalmente a tus productos.
              </p>

              <div className="space-y-3">
                {monthExpenses.length === 0 ? (
                  <p className="text-xs text-muted-foreground italic text-center py-4 bg-background/50 rounded-lg">
                    Cargá gastos arriba para verlos aquí.
                  </p>
                ) : (
                  monthExpenses.map((e) => (
                    <div key={e.id} className="flex items-center justify-between p-3 rounded-xl bg-background border border-border shadow-sm">
                      <div className="flex-1 min-w-0 pr-4">
                        <p className="text-sm font-bold truncate">{e.description}</p>
                        <p className="text-xs text-muted-foreground">{formatCurrency(e.amount, form.currencySymbol)}</p>
                      </div>
                      <div className="flex flex-col items-center gap-1">
                        <Switch
                          checked={e.includedInFixedCosts !== false}
                          onCheckedChange={(checked) => toggleExpenseInclusion(e.id, checked)}
                          className="scale-75"
                        />
                        <span className={cn(
                          "text-[9px] font-black uppercase tracking-tighter",
                          e.includedInFixedCosts !== false ? "text-primary" : "text-muted-foreground"
                        )}>
                          {e.includedInFixedCosts !== false ? 'ON' : 'OFF'}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="space-y-4 pt-4 border-t border-accent">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-muted-foreground uppercase">Total Activados:</span>
                  <span className="font-black text-xl text-foreground text-right">{formatCurrency(includedExpensesTotal, form.currencySymbol)}</span>
                </div>

                <div className="p-4 bg-primary/10 rounded-xl flex justify-between items-center border border-primary/20">
                  <div className="flex-1 mr-2">
                    <p className="text-xs font-bold text-primary uppercase leading-tight">Costo Fijo / Hora</p>
                    <p className="text-[10px] text-muted-foreground">Total / {form.monthlyWorkingHours}hs</p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-xl font-black text-primary">
                      {formatCurrency(hourlyFixedCostRate, form.currencySymbol)}
                    </span>
                    <span className="text-xs font-bold text-primary ml-1">/h</span>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          <Button onClick={handleSaveConfig} className="w-full h-16 text-lg font-black shadow-xl shadow-primary/20 gap-2 mt-6">
              <Save className="h-6 w-6" /> Guardar Configuración de Costos
            </Button>
          </div>

        <Button onClick={() => navigate('/bolsillo/nuevo')} className="fixed bottom-20 right-4 md:bottom-8 md:right-8 h-14 w-14 rounded-full shadow-lg z-40 hover:scale-105 active:scale-95 transition-transform" size="icon">
          <Plus className="h-6 w-6" />
        </Button>
      </div>
    </Layout>
  );
}
