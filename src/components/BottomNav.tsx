import { Link, useLocation } from 'react-router-dom';
import { Home, BookOpen, Wallet, DollarSign, User } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { to: '/', icon: Home, label: 'Inicio' },
  { to: '/recetario', icon: BookOpen, label: 'Recetario' },
  { to: '/bolsillo', icon: Wallet, label: 'Bolsillo' },
  { to: '/precio-justo', icon: DollarSign, label: 'Precios' },
  { to: '/perfil', icon: User, label: 'Perfil' },
];

export default function BottomNav() {
  const { pathname } = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border safe-area-bottom">
      <div className="flex justify-around items-center h-16 max-w-2xl mx-auto">
        {navItems.map(({ to, icon: Icon, label }) => {
          const active = to === '/' ? pathname === '/' : pathname.startsWith(to);
          return (
            <Link
              key={to}
              to={to}
              className={cn(
                'flex flex-col items-center gap-0.5 text-[11px] font-medium transition-colors px-3 py-1',
                active ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Icon className={cn('h-5 w-5', active && 'stroke-[2.5]')} />
              <span>{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
