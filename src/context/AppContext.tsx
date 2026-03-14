import React, { createContext, useContext, ReactNode, useMemo, useState, useEffect } from 'react';
import { Product, Expense, Supply, UserSettings } from '@/types';
import { dataService } from '@/lib/dataService';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

interface AppContextType {
  user: UserSettings | null;
  setUser: (u: UserSettings) => void;
  products: Product[];
  addProduct: (p: any, ingredients: any[]) => Promise<void>;
  updateProduct: (p: Product) => void;
  deleteProduct: (id: string) => void;
  toggleProductActive: (id: string) => void;
  expenses: Expense[];
  addExpense: (e: Omit<Expense, 'id'>) => Promise<void>;
  updateExpense: (e: Expense) => void;
  deleteExpense: (id: string) => void;
  supplies: Supply[];
  addSupply: (s: Omit<Supply, 'id'>) => Promise<void>;
  updateSupply: (s: Supply) => Promise<void>;
  deleteSupply: (id: string) => Promise<void>;
  totalExpenses: number;
  projection: Record<string, { enabled: boolean; qty: string }>;
  setProjection: (p: Record<string, { enabled: boolean; qty: string }>) => void;
  updateProjection: (id: string, field: 'enabled' | 'qty', value: any) => void;
  totalProjectedProfit: number;
  loading: boolean;
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUserState] = useState<UserSettings | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [supplies, setSupplies] = useState<Supply[]>([]);
  const [projection, setProjection] = useState<Record<string, { enabled: boolean; qty: string }>>({});
  const [loading, setLoading] = useState(true);

  // 1. Initial Data Fetch (Local-First & Silent Sync)
  useEffect(() => {
    let isMounted = true;

    async function initData() {
      if (!isMounted) return;

      console.log("🚀 Initializing Mi Taller Contable (Hybrid Mode)...");

      try {
        // --- STEP 1: IMMEDIATE LOCAL LOAD (UI Restoration) ---
        const localUser = localStorage.getItem('user_settings');
        const localSupplies = localStorage.getItem('supplies');
        const localProducts = localStorage.getItem('products');
        const localExpenses = localStorage.getItem('expenses');

        if (localUser) setUserState(JSON.parse(localUser));
        if (localSupplies) setSupplies(JSON.parse(localSupplies));
        if (localProducts) setProducts(JSON.parse(localProducts));
        if (localExpenses) setExpenses(JSON.parse(localExpenses));

        // Unlock the UI immediately if we have at least the user profile
        if (localUser) {
          console.log("📱 Local profile found, unlocking UI...");
          setLoading(false);
        }

        // --- STEP 2: SILENT BACKGROUND SYNC ---
        const hasCredentials = !!import.meta.env.VITE_SUPABASE_URL && !!import.meta.env.VITE_SUPABASE_ANON_KEY;
        if (hasCredentials) {
          try {
            // Check session with a short timeout
            const { data: { user: authUser } } = await Promise.race([
              supabase.auth.getUser(),
              new Promise<any>((_, reject) => setTimeout(() => reject(new Error('Timeout checking session')), 5000))
            ]);

            if (authUser) {
              await refreshUserData(authUser.id);
            } else {
              // If no authUser, we should probably stop loading even if no local profile
              setLoading(false);
            }
          } catch (syncError) {
            console.log("📡 Offline/Slow mode: Background sync postponed.");
            setLoading(false); // Ensure UI is unlocked even if sync fails
          }
        } else {
          setLoading(false);
        }
      } catch (err) {
        console.error("❌ Critical error in initData:", err);
        setLoading(false);
      }
    }

    initData();

    // 2. Auth State Listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log(`🔐 Auth Event: ${event}`, session?.user?.email);

      if ((event === 'SIGNED_IN' || event === 'INITIAL_SESSION') && session?.user) {
        // Only set loading to true if we don't have user data yet
        if (!user) setLoading(true);

        console.log("🔄 refreshing data in background...");
        try {
          await refreshUserData(session.user.id);
        } catch (err) {
          console.error("❌ Failed to refresh user data:", err);
        } finally {
          setLoading(false);
        }
      } else if (event === 'SIGNED_OUT') {
        console.log("👋 Clearing state...");
        setUserState(null);
        setSupplies([]);
        setProducts([]);
        setExpenses([]);
        localStorage.clear();
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  async function refreshUserData(userId: string) {
    try {
      console.log("☁️ START sync with cloud for:", userId);

      // Use a race to avoid hanging the entire app if one request is slow
      const fetchWithTimeout = async (promise: Promise<any>, name: string) => {
        return Promise.race([
          promise,
          new Promise((_, reject) => setTimeout(() => reject(new Error(`Timeout fetching ${name}`)), 8000))
        ]);
      };

      console.log("🔍 Fetching profile...");
      const profile = await fetchWithTimeout(dataService.getProfile(userId), "profile");
      console.log("✅ Profile fetched:", !!profile);

      if (profile) {
        setUserState(profile);
        localStorage.setItem('user_settings', JSON.stringify(profile));

        console.log("🔍 Fetching data tables...");

        // Execute background fetches in parallel with individual error handling
        const [supps, prods, exps] = await Promise.all([
          fetchWithTimeout(dataService.getSupplies(), "supplies").catch(e => { console.error(e); return null; }),
          fetchWithTimeout(dataService.getProducts(), "products").catch(e => { console.error(e); return null; }),
          fetchWithTimeout(dataService.getExpenses(), "expenses").catch(e => { console.error(e); return null; })
        ]);

        if (supps) {
          setSupplies(supps);
          localStorage.setItem('supplies', JSON.stringify(supps));
        }
        if (prods) {
          setProducts(prods);
          localStorage.setItem('products', JSON.stringify(prods));
        }
        if (exps) {
          setExpenses(exps);
          localStorage.setItem('expenses', JSON.stringify(exps));
        }

        console.log("☁️ END sync with cloud.");
      }
    } catch (err) {
      console.error("❌ error in refreshUserData:", err);
    }
  }

  const setUser = (u: UserSettings) => setUserState(u);

  const addProduct = async (p: any, ingredients: any[]) => {
    if (!user?.id) return;
    try {
      const newProd = await dataService.createProduct(p, ingredients, user.id);
      setProducts(prev => {
        const next = [newProd, ...prev];
        localStorage.setItem('products', JSON.stringify(next));
        return next;
      });
    } catch (err) {
      toast.error('Error al guardar el producto');
      throw err;
    }
  };

  const updateProduct = async (p: Product, ingredients?: any[]) => {
    if (!user?.id) return;
    try {
      await dataService.updateProduct(p.id, p, ingredients);
      setProducts(prev => {
        const next = prev.map(x => x.id === p.id ? { ...p, ingredients: ingredients || p.ingredients } : x);
        localStorage.setItem('products', JSON.stringify(next));
        return next;
      });
      toast.success('Producto actualizado');
    } catch (err) {
      console.error('Error updating product:', err);
      toast.error('Error al actualizar el producto');
    }
  };

  const deleteProduct = async (id: string) => {
    if (!user?.id) return;
    try {
      await dataService.deleteProduct(id);
      setProducts(prev => {
        const next = prev.filter(x => x.id !== id);
        localStorage.setItem('products', JSON.stringify(next));
        return next;
      });
      toast.success('Producto eliminado');
    } catch (err) {
      console.error('Error deleting product:', err);
      toast.error('Error al eliminar el producto');
    }
  };

  const toggleProductActive = async (id: string) => {
    if (!user?.id) return;
    const product = products.find(p => p.id === id);
    if (!product) return;
    try {
      const newActive = !product.active;
      await dataService.updateProduct(id, { active: newActive });
      setProducts(prev => {
        const next = prev.map(p => p.id === id ? { ...p, active: newActive } : p);
        localStorage.setItem('products', JSON.stringify(next));
        return next;
      });
    } catch (err) {
      console.error('Error toggling product status:', err);
      toast.error('Error al cambiar estado del producto');
    }
  };

  const addExpense = async (e: Omit<Expense, 'id'>) => {
    if (!user?.id) return;
    try {
      const newExp = await dataService.createExpense(e, user.id);
      setExpenses(prev => {
        const next = [newExp, ...prev];
        localStorage.setItem('expenses', JSON.stringify(next));
        return next;
      });
    } catch (err) {
      toast.error('Error al guardar el gasto');
      throw err;
    }
  };

  const updateExpense = async (e: Expense) => {
    if (!user?.id) return;
    try {
      await dataService.updateExpense(e.id, e);
      setExpenses(prev => {
        const next = prev.map(x => x.id === e.id ? e : x);
        localStorage.setItem('expenses', JSON.stringify(next));
        return next;
      });
      toast.success('Gasto actualizado');
    } catch (err) {
      console.error('Error updating expense:', err);
      toast.error('Error al actualizar el gasto');
    }
  };

  const deleteExpense = async (id: string) => {
    if (!user?.id) return;
    try {
      await dataService.deleteExpense(id);
      setExpenses(prev => {
        const next = prev.filter(x => x.id !== id);
        localStorage.setItem('expenses', JSON.stringify(next));
        return next;
      });
      toast.success('Gasto eliminado');
    } catch (err) {
      console.error('Error deleting expense:', err);
      toast.error('Error al eliminar el gasto');
    }
  };

  const addSupply = async (s: Omit<Supply, 'id'>) => {
    if (!user?.id) return;
    try {
      const newSupply = await dataService.createSupply(s, user.id);
      setSupplies(prev => {
        const next = [...prev, newSupply];
        localStorage.setItem('supplies', JSON.stringify(next));
        return next;
      });
    } catch (err) {
      toast.error('Error al guardar el insumo');
      throw err;
    }
  };

  const updateSupply = async (s: Supply) => {
    if (!user?.id) return;
    try {
      await dataService.updateSupply(s.id, s);
      setSupplies(prev => {
        const next = prev.map(x => x.id === s.id ? s : x);
        localStorage.setItem('supplies', JSON.stringify(next));
        return next;
      });
    } catch (err) {
      toast.error('Error al actualizar el insumo');
      throw err;
    }
  };

  const deleteSupply = async (id: string) => {
    if (!user?.id) return;
    try {
      await dataService.deleteSupply(id);
      setSupplies(prev => {
        const next = prev.filter(x => x.id !== id);
        localStorage.setItem('supplies', JSON.stringify(next));
        return next;
      });
    } catch (err) {
      toast.error('Error al eliminar el insumo');
      throw err;
    }
  };

  const totalExpenses = useMemo(() =>
    expenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0)
    , [expenses]);

  const updateProjection = (id: string, field: 'enabled' | 'qty', value: any) => {
    setProjection(prev => ({
      ...prev,
      [id]: { ... (prev[id] || { enabled: true, qty: '0' }), [field]: value }
    }));
  };

  const totalProjectedProfit = useMemo(() =>
    products.reduce((sum, p) => {
      if (p.active === false) return sum;
      const proj = projection[p.id] || { enabled: true, qty: '0' };
      if (!proj.enabled) return sum;
      const qty = parseInt(proj.qty) || 0;
      const profit = (p.sellingPrice || 0) - (p.totalCost || 0);
      return sum + (isNaN(profit * qty) ? 0 : profit * qty);
    }, 0)
    , [products, projection]);

  return (
    <AppContext.Provider value={{
      user, setUser,
      products, addProduct, updateProduct, deleteProduct, toggleProductActive,
      expenses, addExpense, updateExpense, deleteExpense,
      supplies, addSupply, updateSupply, deleteSupply,
      totalExpenses,
      projection, setProjection, updateProjection, totalProjectedProfit,
      loading
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
