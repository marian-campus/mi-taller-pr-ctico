import Layout from '@/components/Layout';
import { useApp } from '@/context/AppContext';
import { formatCurrency } from '@/lib/format';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import ProductCard from '@/components/ProductCard';
import { Plus, Receipt, Settings } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';

export default function Dashboard() {
  const { user, products, expenses } = useApp();
  const navigate = useNavigate();

  const now = new Date();
  const monthExpenses = expenses.filter(e => {
    const d = new Date(e.date);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });
  const totalExpenses = monthExpenses.reduce((sum, e) => sum + e.amount, 0);
  const totalRevenue = products.reduce((sum, p) => sum + (p.sellingPrice || 0), 0);
  const totalCosts = products.reduce((sum, p) => sum + p.totalCost, 0);
  const projectedProfit = totalRevenue - totalCosts;

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">¡Hola {user.name}! 👋</h1>
            <p className="text-sm text-muted-foreground">{user.businessName}</p>
          </div>
          <Link to="/perfil" className="p-2 rounded-lg hover:bg-muted transition-colors">
            <Settings className="h-5 w-5 text-muted-foreground" />
          </Link>
        </div>

        {/* Summary Card */}
        <Card className="p-5 bg-primary text-primary-foreground rounded-2xl">
          <h2 className="text-sm font-medium opacity-90">Resumen del mes</h2>
          <div className="grid grid-cols-3 gap-4 mt-3">
            <div>
              <p className="text-2xl font-bold">{products.length}</p>
              <p className="text-xs opacity-80">Productos</p>
            </div>
            <div>
              <p className="text-2xl font-bold">{formatCurrency(totalExpenses)}</p>
              <p className="text-xs opacity-80">Gastos</p>
            </div>
            <div>
              <p className="text-2xl font-bold">{formatCurrency(projectedProfit)}</p>
              <p className="text-xs opacity-80">Ganancia</p>
            </div>
          </div>
        </Card>

        {/* Quick Actions */}
        <div className="flex gap-3">
          <Button onClick={() => navigate('/recetario/nuevo')} className="flex-1 gap-2 h-12 rounded-xl">
            <Plus className="h-4 w-4" /> Nueva Receta
          </Button>
          <Button variant="cta" onClick={() => navigate('/bolsillo/nuevo')} className="flex-1 gap-2 h-12 rounded-xl">
            <Receipt className="h-4 w-4" /> Nuevo Gasto
          </Button>
        </div>

        {/* Recent Products */}
        <div>
          <h2 className="text-lg font-semibold text-foreground mb-3">Tus Productos</h2>
          {products.length === 0 ? (
            <Card className="p-8 text-center rounded-xl">
              <p className="text-3xl mb-2">📦</p>
              <p className="text-muted-foreground mb-3">Aún no creaste productos. ¡Empezá ahora!</p>
              <Button onClick={() => navigate('/recetario/nuevo')}>+ Nueva Receta</Button>
            </Card>
          ) : (
            <div className="space-y-3">
              {products.slice(-3).reverse().map(p => (
                <ProductCard key={p.id} product={p} />
              ))}
              {products.length > 3 && (
                <Button variant="ghost" onClick={() => navigate('/recetario')} className="w-full text-primary">
                  Ver todos los productos →
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
