import { Product } from '@/types';
import { formatCurrency } from '@/lib/format';
import { categoryEmojis } from './CategoryIcon';
import { Card } from '@/components/ui/card';
import { Link } from 'react-router-dom';

export default function ProductCard({ product }: { product: Product }) {
  return (
    <Card className="p-4 hover:shadow-md transition-shadow">
      <Link to={`/recetario/${product.id}`} className="block">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-lg bg-accent flex items-center justify-center text-2xl shrink-0">
            {categoryEmojis[product.category] || '📦'}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-foreground truncate">{product.name}</h3>
            <p className="text-sm text-muted-foreground">Costo: {formatCurrency(product.totalCost)}</p>
          </div>
          {product.sellingPrice != null && product.sellingPrice > 0 && (
            <div className="text-right shrink-0">
              <p className="text-xs text-muted-foreground">Precio</p>
              <p className="font-bold text-primary">{formatCurrency(product.sellingPrice)}</p>
            </div>
          )}
        </div>
      </Link>
    </Card>
  );
}
