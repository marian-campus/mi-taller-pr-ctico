import { ReactNode } from 'react';
import BottomNav from './BottomNav';

interface LayoutProps {
  children: ReactNode;
  title?: string;
}

export default function Layout({ children, title }: LayoutProps) {
  return (
    <div className="min-h-screen bg-background pb-20">
      {title && (
        <header className="sticky top-0 z-40 bg-card/95 backdrop-blur border-b border-border px-4 py-3">
          <h1 className="text-lg font-bold text-foreground">{title}</h1>
        </header>
      )}
      <main className="px-4 py-4 max-w-2xl mx-auto">{children}</main>
      <BottomNav />
    </div>
  );
}
