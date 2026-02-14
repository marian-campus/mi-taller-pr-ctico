import { useState } from 'react';
import Layout from '@/components/Layout';
import { useApp } from '@/context/AppContext';
import ProductCard from '@/components/ProductCard';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const categories = [
  { value: 'todas', label: 'Todas' },
  { value: 'gastronomia', label: '🍰 Gastro' },
  { value: 'indumentaria', label: '👗 Indumentaria' },
  { value: 'cosmetica', label: '💄 Cosmética' },
  { value: 'artesanias', label: '🎨 Artesanías' },
  { value: 'servicios', label: '💼 Servicios' },
  { value: 'otros', label: '📦 Otros' },
];

export default function Recetario() {
  const { products } = useApp();
  const navigate = useNavigate();
  const [filter, setFilter] = useState('todas');

  const filtered = filter === 'todas' ? products : products.filter(p => p.category === filter);

  return (
    <Layout title="📖 Mi Recetario de Costos">
      <div className="space-y-4">
        {/* Category filters */}
        <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-none">
          {categories.map(c => (
            <button
              key={c.value}
              onClick={() => setFilter(c.value)}
              className={`px-3 py-1.5 rounded-full text-sm whitespace-nowrap transition-colors font-medium ${
                filter === c.value
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-accent'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>

        {/* Product list */}
        {filtered.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-4xl mb-3">📦</p>
            <p className="text-muted-foreground">
              {products.length === 0
                ? 'Aún no creaste productos. ¡Empezá ahora!'
                : 'No hay productos en esta categoría.'}
            </p>
            {products.length === 0 && (
              <Button onClick={() => navigate('/recetario/nuevo')} className="mt-4">
                + Nueva Receta
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(p => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}

        {/* FAB */}
        <Button
          onClick={() => navigate('/recetario/nuevo')}
          className="fixed bottom-20 right-4 h-14 w-14 rounded-full shadow-lg z-40"
          size="icon"
        >
          <Plus className="h-6 w-6" />
        </Button>
      </div>
    </Layout>
  );
}
