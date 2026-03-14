import { useState } from 'react';
import Layout from '@/components/Layout';
import { useApp } from '@/context/AppContext';
import ProductCard from '@/components/ProductCard';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Recetario() {
  const { products } = useApp();
  const navigate = useNavigate();

  return (
    <Layout title="📖 Mis Costos">
      <div className="space-y-6">
        {/* Product list */}
        {products.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-5xl mb-4">🍰</p>
            <p className="text-muted-foreground text-lg">
              Aún no creaste productos. ¡Empezá ahora!
            </p>
            <Button onClick={() => navigate('/recetario/nuevo')} className="mt-6 h-12 px-8 rounded-xl font-bold">
              + Nuevo Producto
            </Button>
          </div>
        ) : (
          <div className="grid gap-4">
            {products.map(p => (
              <ProductCard key={p.id} product={p} variant="highlighted" />
            ))}
          </div>
        )}


        {/* FAB */}
        <Button
          onClick={() => navigate('/recetario/nuevo')}
          className="fixed bottom-20 right-4 h-14 w-14 rounded-full shadow-2xl z-40 bg-primary text-primary-foreground hover:scale-105 active:scale-95 transition-transform"
          size="icon"
        >
          <Plus className="h-7 w-7" />
          <span className="sr-only">Nuevo Producto</span>
        </Button>
      </div>
    </Layout>
  );
}
