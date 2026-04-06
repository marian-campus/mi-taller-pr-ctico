import { useState } from 'react';
import Layout from '@/components/Layout';
import { useApp } from '@/context/AppContext';
import ProductCard from '@/components/ProductCard';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Recetario() {
  const { products, setFreemiumModalOpen } = useApp();
  const navigate = useNavigate();

  const handleNewProductClick = () => {
    if (products.length >= 6) {
      setFreemiumModalOpen(true);
    } else {
      navigate('/recetario/nuevo');
    }
  };

  return (
    <Layout title="📖 Mis Costos">
      <div className="space-y-6">
        <div className="bg-muted/30 p-3 rounded-xl border border-primary/10 flex items-center justify-between">
          <span className="text-sm font-medium text-muted-foreground">Productos creados:</span>
          <span className="text-sm font-bold text-foreground bg-background px-3 py-1 rounded-md shadow-sm border border-border">
            {products.length} <span className="text-muted-foreground font-normal">de 5 gratuitos</span>
          </span>
        </div>

        {/* Product list */}
        {products.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-5xl mb-4">🍰</p>
            <p className="text-muted-foreground text-lg">
              Aún no creaste productos. ¡Empezá ahora!
            </p>
            <Button onClick={handleNewProductClick} className="mt-6 h-12 px-8 rounded-xl font-bold">
              + Nuevo Producto
            </Button>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {products.map(p => (
              <ProductCard key={p.id} product={p} variant="highlighted" />
            ))}
          </div>
        )}


        {/* FAB */}
        <Button
          onClick={handleNewProductClick}
          className="fixed bottom-20 right-4 md:bottom-8 md:right-8 h-14 w-14 rounded-full shadow-2xl z-40 bg-primary text-primary-foreground hover:scale-105 active:scale-95 transition-transform"
          size="icon"
        >
          <Plus className="h-7 w-7" />
          <span className="sr-only">Nuevo Producto</span>
        </Button>
      </div>
    </Layout>
  );
}
