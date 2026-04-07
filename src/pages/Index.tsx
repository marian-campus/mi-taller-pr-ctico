import Layout from '@/components/Layout';
import { useApp } from '@/context/AppContext';
import { formatCurrency } from '@/lib/format';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import ProductCard from '@/components/ProductCard';
import { Plus, Receipt, Settings, Download } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import StepGuide from '@/components/StepGuide';

export default function Dashboard() {
  const now = new Date();
  const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
  const currentMonthName = months[now.getMonth()];
  const currentYear = now.getFullYear();

  const { user, products, expenses, totalMonthExpenses, totalProjectedProfit, loading, setFreemiumModalOpen } = useApp();
  const navigate = useNavigate();

  // Authentication guard
  useEffect(() => {
    if (!loading && !user) {
      console.log('No user session found, redirecting to login...');
      navigate('/');
    }
  }, [loading, user, navigate]);

  const handleNewProductClick = () => {
    if (products.length >= 6) {
      setFreemiumModalOpen(true);
    } else {
      navigate('/recetario/nuevo');
    }
  };

  if (loading || !user) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-muted-foreground animate-pulse">Cargando tus datos...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <Link to="/perfil" className="relative group">
              <div className="h-14 w-14 bg-primary/10 rounded-2xl flex items-center justify-center border-2 border-primary/20 overflow-hidden shadow-sm group-hover:scale-105 transition-transform">
                {user.logoUrl ? (
                  <img src={user.logoUrl} alt="Logo" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex flex-col items-center justify-center">
                    <span className="text-xl font-black text-primary/40">
                      {user.businessName?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'MN'}
                    </span>
                  </div>
                )}
              </div>
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-black text-foreground">¡Hola {user.name.split(' ')[0]}! 👋</h1>
              </div>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest opacity-70">{user.businessName}</p>
            </div>
          </div>
          <Link to="/perfil" className="p-3 bg-muted/50 rounded-2xl hover:bg-muted transition-colors shadow-sm">
            <Settings className="h-5 w-5 text-muted-foreground" />
          </Link>
        </div>

        <StepGuide />

        {/* Summary Card */}
        <Card className="p-6 bg-primary text-primary-foreground rounded-3xl shadow-xl shadow-primary/20">
          <h2 className="text-xs font-bold opacity-80 uppercase tracking-widest">Resumen de {currentMonthName} {currentYear}</h2>
          <div className="grid grid-cols-3 gap-2 mt-4">
            <div className="space-y-1">
              <p className="text-2xl font-black">{products.filter(p => p.active !== false).length}</p>
              <p className="text-[10px] opacity-80 uppercase font-bold leading-tight">Productos<br />activos</p>
            </div>
            <div className="space-y-1 border-l border-white/20 pl-4">
              <p className="text-2xl font-black">{formatCurrency(totalMonthExpenses, user?.currencySymbol)}</p>
              <p className="text-[10px] opacity-80 uppercase font-bold leading-tight">Gastos de<br />este mes</p>
            </div>
            <div className="space-y-1 border-l border-white/20 pl-4">
              <p className="text-2xl font-black">{formatCurrency(totalProjectedProfit - totalMonthExpenses, user?.currencySymbol)}</p>
              <p className="text-[10px] opacity-80 uppercase font-bold leading-tight text-cta-foreground">Ganancia<br />Neta</p>
            </div>
          </div>
        </Card>

        {/* Quick Actions */}
        <div className="flex gap-3">
          <Button onClick={handleNewProductClick} className="flex-1 gap-2 h-12 rounded-xl">
            <Plus className="h-4 w-4" /> Nuevo Producto
          </Button>
          <Button variant="cta" onClick={() => navigate('/bolsillo/nuevo')} className="flex-1 gap-2 h-12 rounded-xl">
            <Receipt className="h-4 w-4" /> Nuevo Gasto Negocio
          </Button>
        </div>

        {/* Recent Products */}
        <div>
          <h2 className="text-lg font-semibold text-foreground mb-3">Tus Productos</h2>
          {products.length === 0 ? (
            <Card className="p-8 text-center rounded-xl">
              <p className="text-3xl mb-2">📦</p>
              <p className="text-muted-foreground mb-3">Aún no creaste productos. ¡Empezá ahora!</p>
              <Button onClick={handleNewProductClick}>+ Nuevo Producto</Button>
            </Card>
          ) : (
            <div className="space-y-4">
              <div className="space-y-3 md:space-y-0 md:grid md:grid-cols-2 lg:grid-cols-3 md:gap-4">
                {products.filter(p => p.active !== false).slice(-3).reverse().map(p => (
                  <ProductCard key={p.id} product={p} variant="simple" />
                ))}
              </div>
              {products.length > 0 && (
                <Button variant="ghost" onClick={() => navigate('/recetario')} className="w-full text-primary">
                  {products.length > 3 ? `Ver los ${products.length} productos →` : 'Ver todos los productos →'}
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}

