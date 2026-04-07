import React, { createContext, useContext, ReactNode, useMemo, useState, useEffect } from 'react';
import { Product, Expense, Supply, UserSettings } from '@/types';
import { dataService } from '@/lib/dataService';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

interface AppContextType {
  user: UserSettings | null;
  setUser: (u: UserSettings) => void;
  updateProfile: (updates: Partial<UserSettings>) => Promise<void>;
  products: Product[];
  addProduct: (p: any, ingredients: any[]) => Promise<void>;
  updateProduct: (id: string, updates: Partial<Product>, ingredients?: any[]) => Promise<void>;
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
  totalFixedExpenses: number;
  totalMonthExpenses: number;
  projection: Record<string, { enabled: boolean; qty: string }>;
  setProjection: (p: Record<string, { enabled: boolean; qty: string }>) => void;
  updateProjection: (id: string, field: 'enabled' | 'qty', value: any) => void;
  totalProjectedProfit: number;
  loading: boolean;
  signOut: () => Promise<void>;
  isFreemiumModalOpen: boolean;
  setFreemiumModalOpen: (open: boolean) => void;
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUserState] = useState<UserSettings | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [supplies, setSupplies] = useState<Supply[]>([]);
  const [projection, setProjection] = useState<Record<string, { enabled: boolean; qty: string }>>({});
  const [loading, setLoading] = useState(true);
  const [isFreemiumModalOpen, setFreemiumModalOpen] = useState(false);
  const isSyncing = React.useRef(false);

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

        // Unlock the UI immediately if we have local data
        if (localUser) {
          console.log("📱 Local profile found, unlocking UI early...");
          setLoading(false);
        }

        // --- STEP 2: SILENT BACKGROUND SYNC ---
        const hasCredentials = !!import.meta.env.VITE_SUPABASE_URL && !!import.meta.env.VITE_SUPABASE_ANON_KEY;
        if (hasCredentials) {
          try {
            // Short timeout for session check to avoid hanging
            const { data: { user: authUser } } = await Promise.race([
              supabase.auth.getUser(),
              new Promise<any>((_, reject) => setTimeout(() => reject(new Error('Timeout checking session')), 4000))
            ]);

            if (authUser) {
              await refreshUserData(authUser.id);
            }
          } catch (syncError) {
            console.log("📡 Offline mode or session check timeout. Proceeding with local data.");
          }
        }
      } catch (err) {
        console.error("❌ Critical error in initData:", err);
      } finally {
        // ALWAYS ensure loading is off after sync attempt
        setLoading(false);
      }
    }

    initData();

    // 2. Auth State Listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log(`🔐 Auth Event: ${event}`, session?.user?.email);

      if ((event === 'SIGNED_IN' || event === 'INITIAL_SESSION') && session?.user) {
        // Only set loading to true if we don't have user data yet in state
        const hasLocalData = !!localStorage.getItem('user_settings');
        if (!hasLocalData) setLoading(true);

        console.log("🔄 refreshing data in background...");
        try {
          await refreshUserData(session.user.id);
        } catch (err) {
          console.error("❌ Failed to refresh user data:", err);
        } finally {
          setLoading(false); // ALWAYS release loading state
        }
      } else if (event === 'SIGNED_OUT' || (event === 'INITIAL_SESSION' && !session)) {
        console.log("👋 Clearing state (No session detected or Sign out logic)...");
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
    if (isSyncing.current) {
      console.log("⏳ Sync already in progress, skipping duplicate call...");
      return;
    }
    isSyncing.current = true;

    try {
      console.log("☁️ START sync with cloud for:", userId);

      const fetchWithTimeout = async (promise: Promise<any>, name: string, timeoutMs: number = 8000) => {
        return Promise.race([
          promise,
          new Promise((_, reject) => setTimeout(() => reject(new Error(`Timeout fetching ${name}`)), timeoutMs))
        ]);
      };

      console.log("🔍 Fetching profile...");
      let profile = null;
      let isProfileMissing = false;

      try {
        profile = await fetchWithTimeout(dataService.getProfile(userId), "profile");
      } catch (err: any) {
        if (err?.code === 'PGRST116' || err?.message?.includes('JSON object requested, but 0 rows were returned')) {
          console.warn("⚠️ Profile missing (PGRST116). Attempting self-healing...");
          isProfileMissing = true;
        } else {
          console.error("❌ Error fetching profile:", err.message || err);
        }
      }
      
      // --- SELF-HEALING: Crear perfil si no existe ---
      if (isProfileMissing && !profile) {
        try {
          console.log("🛠️ Creating minimal fallback profile for:", userId);
          profile = await dataService.createProfile({
            id: userId,
            name: 'Usuario',
            businessName: 'Mi Negocio',
            businessCategory: 'gastronomia',
            startDate: new Date().toISOString().split('T')[0],
            location: '',
            hourlyRate: 0,
            monthlySalary: 0,
            monthlyWorkingHours: 0,
            country: '',
            currencySymbol: '$',
            language: 'es',
            businessDescription: '',
            mainProducts: ''
          } as UserSettings & { id: string });
          console.log("✅ Profile created/upserted successfully.");
        } catch (healError) {
          console.error("❌ Failed to create profile:", healError);
        }
      }

      // --- CRITICAL FALLBACK ---
      // Si todo falla (timeout o error), NO dejamos al usuario afuera. Usamos uno en memoria.
      if (!profile) {
          console.warn("⚠️ Using emergency fallback profile in memory to unlock UI");
          profile = {
                id: userId,
                name: 'Usuario',
                businessName: 'Mi Negocio',
                businessCategory: 'gastronomia',
                startDate: new Date().toISOString().split('T')[0],
                location: '',
                hourlyRate: 0,
                monthlySalary: 0,
                monthlyWorkingHours: 0,
                country: '',
                currencySymbol: '$',
                language: 'es',
                logoUrl: '',
                businessDescription: '',
                mainProducts: ''
          } as UserSettings;
      }

      if (profile) {
        setUserState(profile);
        localStorage.setItem('user_settings', JSON.stringify(profile));
      }

      // Parallel fetch of other user data (5s timeout for speed)
      const [supps, prods, exps] = await Promise.all([
        fetchWithTimeout(dataService.getSupplies(userId), "supplies", 5000).catch(e => { console.error("Error supplies:", e); return null; }),
        fetchWithTimeout(dataService.getProducts(userId), "products", 5000).catch(e => { console.error("Error products:", e); return null; }),
        fetchWithTimeout(dataService.getExpenses(userId), "expenses", 5000).catch(e => { console.error("Error expenses:", e); return null; })
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
      
      // Always stop loading once we've tried everything
      setLoading(false);
    } catch (err) {
      console.error("❌ Critical error in refreshUserData:", err);
      setLoading(false);
    } finally {
      isSyncing.current = false;
    }
  }

  const setUser = (u: UserSettings) => setUserState(u);

  const updateProfile = async (updates: Partial<UserSettings>) => {
    if (!user?.id) return;
    try {
      const newUser = { ...user, ...updates };
      setUserState(newUser);
      localStorage.setItem('user_settings', JSON.stringify(newUser));
      await dataService.updateProfile(user.id, updates);
    } catch (err) {
      console.error('Error updating profile:', err);
      toast.error('Error al sincronizar perfil');
    }
  };

  const addProduct = async (p: any, ingredients: any[]) => {
    if (!user?.id) return;
    try {
      const newProd = await dataService.createProduct(p, ingredients, user.id);
      setProducts(prev => {
        const next = [newProd as Product, ...prev];
        localStorage.setItem('products', JSON.stringify(next));
        return next;
      });
    } catch (err) {
      toast.error('Error al guardar el producto');
      throw err;
    }
  };

  const deleteProduct = async (id: string) => {
    if (!user?.id) return;
    try {
      setProducts(prev => {
        const next = prev.filter(p => p.id !== id);
        localStorage.setItem('products', JSON.stringify(next));
        return next;
      });
      await dataService.deleteProduct(id);
      toast.success('Producto eliminado');
    } catch (err: any) {
      console.error('Error deleting product:', err);
      toast.error('Error al eliminar producto');
      // No re-fetching here to avoid jitter, but in a real app we might
    }
  };

  const updateProduct = async (id: string, updates: Partial<Product>, ingredients?: any[]) => {
    if (!user?.id) return;
    try {
      await dataService.updateProduct(id, updates, ingredients);
      
      // Fetch the updated product to ensure consistent state
      const userId = user.id;
      const updatedProducts = await dataService.getProducts(userId);
      setProducts(updatedProducts);
      localStorage.setItem('products', JSON.stringify(updatedProducts));
      
      toast.success('Producto actualizado');
    } catch (err) {
      console.error('Error updating product:', err);
      toast.error('Error al actualizar el producto');
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

  const totalFixedExpenses = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    return expenses
      .filter(e => {
        const d = new Date(e.date + 'T12:00:00'); // Use midday to avoid timezone shifts
        return d.getMonth() === currentMonth && 
               d.getFullYear() === currentYear && 
               e.includedInFixedCosts !== false;
      })
      .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  }, [expenses]);

  const totalMonthExpenses = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    return expenses
      .filter(e => {
        const d = new Date(e.date + 'T12:00:00');
        return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
      })
      .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  }, [expenses]);

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
      user, setUser, updateProfile,
      products, addProduct, updateProduct, deleteProduct, toggleProductActive,
      expenses, addExpense, updateExpense, deleteExpense,
      supplies, addSupply, updateSupply, deleteSupply,
      totalExpenses, totalFixedExpenses, totalMonthExpenses,
      projection, setProjection, updateProjection, totalProjectedProfit,
      loading,
      isFreemiumModalOpen, setFreemiumModalOpen,
      signOut: async () => {
        console.log("👋 Manual Sign out triggered, cleaning memory immediately...");
        // Clear visually immediately for better UX
        setUserState(null);
        setSupplies([]);
        setProducts([]);
        setExpenses([]);
        localStorage.clear();
        
        // Non-blocking sign out
        supabase.auth.signOut().catch(e => console.error("Error signing out from Supabase:", e));
      }
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
