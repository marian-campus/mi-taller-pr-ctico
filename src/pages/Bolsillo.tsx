import { useState, useMemo } from 'react';
import Layout from '@/components/Layout';
import { useApp } from '@/context/AppContext';
import { formatCurrency } from '@/lib/format';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import CategoryIcon from '@/components/CategoryIcon';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const COLORS = ['#00A86B', '#FF6B35', '#4A90D9', '#E74C3C', '#9B59B6', '#F1C40F', '#1ABC9C', '#E67E22', '#95A5A6', '#2ECC71'];

const categoryLabels: Record<string, string> = {
  transporte: 'Transporte', publicidad: 'Publicidad', alquiler: 'Alquiler',
  servicios: 'Servicios', limpieza: 'Limpieza', capacitacion: 'Capacitación',
  comisiones: 'Comisiones', tramites: 'Trámites', muestras: 'Muestras', otros: 'Otros',
};

const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

export default function Bolsillo() {
  const { expenses, deleteExpense } = useApp();
  const navigate = useNavigate();
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth());
  const [year, setYear] = useState(now.getFullYear());

  const monthExpenses = useMemo(() =>
    expenses
      .filter(e => { const d = new Date(e.date); return d.getMonth() === month && d.getFullYear() === year; })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    [expenses, month, year]
  );

  const totalMonth = monthExpenses.reduce((s, e) => s + e.amount, 0);

  const chartData = useMemo(() => {
    const byCategory: Record<string, number> = {};
    monthExpenses.forEach(e => { byCategory[e.category] = (byCategory[e.category] || 0) + e.amount; });
    return Object.entries(byCategory).map(([cat, amount]) => ({ name: categoryLabels[cat] || cat, value: amount }));
  }, [monthExpenses]);

  return (
    <Layout title="💰 Mi Bolsillo Diario">
      <div className="space-y-4">
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

        {/* Summary */}
        <Card className="p-5 bg-primary text-primary-foreground rounded-2xl">
          <p className="text-sm opacity-90">💼 {months[month]} {year}</p>
          <p className="text-3xl font-bold mt-1">{formatCurrency(totalMonth)}</p>
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
                <Tooltip formatter={(value: number) => formatCurrency(value)} />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        )}

        {/* Expense list */}
        <div className="space-y-2">
          <h3 className="font-semibold">Gastos del mes</h3>
          {monthExpenses.length === 0 ? (
            <Card className="p-8 text-center rounded-xl">
              <p className="text-3xl mb-2">💸</p>
              <p className="text-muted-foreground">No hay gastos registrados este mes.</p>
            </Card>
          ) : (
            monthExpenses.map(e => (
              <Card key={e.id} className="p-3 rounded-xl">
                <div className="flex items-center gap-3">
                  <CategoryIcon category={e.category} className="text-xl" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{e.description}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(e.date + 'T12:00:00').toLocaleDateString('es-AR')}
                      {e.recurring && <span className="ml-2 bg-cta/20 text-cta px-1.5 py-0.5 rounded-full text-[10px] font-medium">Recurrente</span>}
                    </p>
                  </div>
                  <p className="font-bold text-sm whitespace-nowrap">{formatCurrency(e.amount)}</p>
                  <div className="flex gap-1 shrink-0">
                    <button onClick={() => navigate(`/bolsillo/${e.id}`)} className="p-1.5 text-muted-foreground hover:text-primary rounded transition-colors">
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button onClick={() => { if (confirm('¿Eliminar este gasto?')) deleteExpense(e.id); }}
                      className="p-1.5 text-muted-foreground hover:text-destructive rounded transition-colors">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>

        <Button onClick={() => navigate('/bolsillo/nuevo')} className="fixed bottom-20 right-4 h-14 w-14 rounded-full shadow-lg z-40" size="icon">
          <Plus className="h-6 w-6" />
        </Button>
      </div>
    </Layout>
  );
}
