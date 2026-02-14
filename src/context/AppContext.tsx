import React, { createContext, useContext, ReactNode } from 'react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { Product, Expense, Supply, UserSettings } from '@/types';
import { seedSupplies, seedProducts, seedExpenses, defaultSettings } from '@/data/seed';

interface AppContextType {
  user: UserSettings;
  setUser: (u: UserSettings) => void;
  products: Product[];
  addProduct: (p: Product) => void;
  updateProduct: (p: Product) => void;
  deleteProduct: (id: string) => void;
  expenses: Expense[];
  addExpense: (e: Expense) => void;
  updateExpense: (e: Expense) => void;
  deleteExpense: (id: string) => void;
  supplies: Supply[];
  addSupply: (s: Supply) => void;
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useLocalStorage<UserSettings>('mtc-user', defaultSettings);
  const [products, setProducts] = useLocalStorage<Product[]>('mtc-products', seedProducts);
  const [expenses, setExpenses] = useLocalStorage<Expense[]>('mtc-expenses', seedExpenses);
  const [supplies, setSupplies] = useLocalStorage<Supply[]>('mtc-supplies', seedSupplies);

  const addProduct = (p: Product) => setProducts(prev => [...prev, p]);
  const updateProduct = (p: Product) => setProducts(prev => prev.map(x => x.id === p.id ? p : x));
  const deleteProduct = (id: string) => setProducts(prev => prev.filter(x => x.id !== id));
  const addExpense = (e: Expense) => setExpenses(prev => [...prev, e]);
  const updateExpense = (e: Expense) => setExpenses(prev => prev.map(x => x.id === e.id ? e : x));
  const deleteExpense = (id: string) => setExpenses(prev => prev.filter(x => x.id !== id));
  const addSupply = (s: Supply) => setSupplies(prev => [...prev, s]);

  return (
    <AppContext.Provider value={{ user, setUser, products, addProduct, updateProduct, deleteProduct, expenses, addExpense, updateExpense, deleteExpense, supplies, addSupply }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
