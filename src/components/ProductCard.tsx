import { Product } from '@/types';
import { formatCurrency } from '@/lib/format';
import { useApp } from '@/context/AppContext';
import { categoryEmojis } from './CategoryIcon';
import { Card } from '@/components/ui/card';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from './ui/button';
import { Eye, Edit2, Trash2 } from 'lucide-react';
import { Switch } from './ui/switch';
import { cn } from '@/lib/utils';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function ProductCard({
  product,
  variant = 'full'
}: {
  product: Product;
  variant?: 'full' | 'simple' | 'highlighted'
}) {
  const navigate = useNavigate();
  const { user, toggleProductActive, deleteProduct } = useApp();

  const isInactive = product.active === false;

  const DeleteButton = () => (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-8 w-8 text-muted-foreground hover:text-red-500 hover:bg-red-50 transition-colors"
          onClick={(e) => e.stopPropagation()}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>¿Eliminar este producto?</AlertDialogTitle>
          <AlertDialogDescription>
            Esta acción no se puede deshacer. Se borrará permanentemente el producto <strong>"{product.name}"</strong> y su receta. Tus insumos (materiales) no se verán afectados.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction 
            onClick={() => deleteProduct(product.id)}
            className="bg-red-500 hover:bg-red-600 text-white"
          >
            Eliminar
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );

  if (variant === 'simple') {
    return (
      <Card className={cn(
        "p-3 hover:shadow-sm transition-all relative group",
        isInactive && "opacity-50 grayscale-[0.5] bg-muted/30"
      )}>
        <div className="flex justify-between items-center gap-2">
          <span className="font-medium text-foreground truncate">{product.name}</span>
          <div className="flex items-center gap-2">
            <span className="font-bold text-primary shrink-0 text-sm">
              {formatCurrency(product.sellingPrice || 0, user.currencySymbol)}
            </span>
            <DeleteButton />
          </div>
        </div>
      </Card>
    );
  }

  if (variant === 'highlighted') {
    return (
      <Card className={cn(
        "p-4 hover:shadow-md transition-all relative",
        isInactive && "opacity-60 grayscale-[0.8] bg-muted/20 border-dashed"
      )}>
        <div className="absolute top-2 right-2">
          <DeleteButton />
        </div>
        <div className="space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-12 h-12 rounded-lg bg-accent flex items-center justify-center text-2xl shrink-0">
                {categoryEmojis[product.category] || '📦'}
              </div>
              <div className="min-w-0 text-left">
                <h3 className="font-bold text-lg text-foreground truncate pr-6">{product.name}</h3>
                <div className="flex flex-col items-start gap-1">
                  <Switch
                    checked={product.active !== false}
                    onCheckedChange={() => toggleProductActive(product.id)}
                    className="scale-75 origin-left"
                  />
                  <span className={cn(
                    "text-[10px] font-black uppercase tracking-tighter",
                    product.active !== false ? "text-primary" : "text-muted-foreground"
                  )}>
                    {product.active !== false ? 'ON' : 'OFF'}
                  </span>
                </div>
              </div>
            </div>
            <div className="text-right shrink-0">
              <p className="text-2xl font-black text-primary">
                {formatCurrency(product.totalCost, user.currencySymbol)}
              </p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Costo Total</p>
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1 gap-1.5 h-9"
              onClick={() => navigate(`/recetario/${product.id}?view=true`)}
            >
              <Eye className="h-4 w-4" /> Ver detalle
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex-1 gap-1.5 h-9"
              onClick={() => navigate(`/recetario/${product.id}`)}
            >
              <Edit2 className="h-3.5 w-3.5" /> Editar
            </Button>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className={cn(
      "p-4 hover:shadow-md transition-all",
      isInactive && "opacity-50 grayscale-[0.5]"
    )}>
      <div className="flex items-center gap-3">
        <Link to={`/recetario/${product.id}`} className="flex-1 min-w-0 flex items-center gap-3">
          <div className="w-12 h-12 rounded-lg bg-accent flex items-center justify-center text-2xl shrink-0">
            {categoryEmojis[product.category] || '📦'}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-foreground truncate">{product.name}</h3>
            <p className="text-sm text-muted-foreground line-clamp-1">Costo: {formatCurrency(product.totalCost, user.currencySymbol)}</p>
          </div>
        </Link>

        {product.sellingPrice != null && product.sellingPrice > 0 && (
          <div className="text-right shrink-0 mr-4">
            <p className="text-xs text-muted-foreground">Precio</p>
            <p className="font-bold text-primary">{formatCurrency(product.sellingPrice, user.currencySymbol)}</p>
          </div>
        )}

        <div className="flex items-center gap-2 border-l pl-3">
          <div className="flex flex-col items-center gap-1">
            <Switch
              checked={product.active !== false}
              onCheckedChange={() => toggleProductActive(product.id)}
              className="scale-75"
            />
            <span className={cn(
              "text-[9px] font-black uppercase tracking-tighter",
              product.active !== false ? "text-primary" : "text-muted-foreground"
            )}>
              {product.active !== false ? 'ON' : 'OFF'}
            </span>
          </div>
          <DeleteButton />
        </div>
      </div>
    </Card>
  );
}

