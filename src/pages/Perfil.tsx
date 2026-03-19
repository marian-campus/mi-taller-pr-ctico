import { useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import { useApp } from '@/context/AppContext';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Moon, Sun, Globe, User, LogOut, ChevronRight, Calculator } from 'lucide-react';
import { useTheme } from '@/components/theme-provider';
import { toast } from 'sonner';
import { cn } from "@/lib/utils";
import { supabase } from '@/lib/supabase';

export default function Perfil() {
  const { user, updateProfile } = useApp();
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();

  if (!user) return <Layout title="Cargando..."><div className="p-8 text-center text-muted-foreground">Cargando perfil...</div></Layout>;

  const handleUpdateField = async (field: string, val: any) => {
    await updateProfile({ [field]: val });
  };

  const handleUpdateLabor = async (salary: number, hours: number) => {
    const rate = hours > 0 ? salary / hours : 0;
    await updateProfile({
      monthlySalary: salary,
      monthlyWorkingHours: hours,
      hourlyRate: rate
    });
  };

  const countries = ['Argentina', 'Chile', 'Uruguay', 'México', 'Colombia', 'España', 'Otro'];
  const currencies = [
    { code: '$', name: 'Pesos ($)' },
    { code: 'USD', name: 'Dólares (USD)' },
    { code: '€', name: 'Euros (€)' },
    { code: 'Mex$', name: 'Pesos Mex (Mex$)' }
  ];

  return (
    <Layout title="Perfil">
      <div className="space-y-6 pb-20">

        {/* Profile Branding */}
        <Card className="p-6 rounded-3xl bg-gradient-to-br from-primary/5 to-primary/10 border-primary/10">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 bg-primary/20 rounded-2xl flex items-center justify-center text-3xl">
              🏢
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-bold text-foreground">Tu emprendimiento</h2>
              <p className="text-xs text-muted-foreground">Personalizá cómo te ven tus clientes</p>
            </div>
          </div>

          <div className="mt-6 space-y-4">
            <div className="space-y-2">
              <Label className="text-xs font-bold text-muted-foreground uppercase">Nombre del Negocio</Label>
              <Input
                value={user.businessName}
                onChange={e => handleUpdateField('businessName', e.target.value)}
                placeholder="Ej: Dulces de Maru"
                className="rounded-xl h-11"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-bold text-muted-foreground uppercase">Tu Nombre</Label>
              <Input
                value={user.name}
                onChange={e => handleUpdateField('name', e.target.value)}
                placeholder="Tu nombre"
                className="rounded-xl h-11"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-bold text-muted-foreground uppercase">Ubicación / Ciudad</Label>
              <Input
                value={user.location}
                onChange={e => handleUpdateField('location', e.target.value)}
                placeholder="Ej: Ciudad de Buenos Aires"
                className="rounded-xl h-11"
              />
            </div>
          </div>
        </Card>

        {/* Labor Calculation Settings */}
        <Card className="p-6 rounded-3xl border-primary/10">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-10 w-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
              <Calculator className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-foreground leading-tight">Mano de Obra</h3>
              <p className="text-xs text-muted-foreground">Configurá cuánto vale tu tiempo</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-xs font-bold text-muted-foreground uppercase">Sueldo Mensual Deseado</Label>
              <div className="relative">
                <span className="absolute left-3 top-3 text-muted-foreground">{user.currencySymbol}</span>
                <Input
                  type="number"
                  value={user.monthlySalary || ''}
                  onChange={e => handleUpdateLabor(parseFloat(e.target.value) || 0, user.monthlyWorkingHours)}
                  placeholder="0.00"
                  className="rounded-xl h-11 pl-8"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-bold text-muted-foreground uppercase">Horas de Trabajo al Mes</Label>
              <Input
                type="number"
                value={user.monthlyWorkingHours || ''}
                onChange={e => handleUpdateLabor(user.monthlySalary, parseFloat(e.target.value) || 0)}
                placeholder="Ej: 160"
                className="rounded-xl h-11"
              />
            </div>
            
            <div className="p-4 bg-primary/5 rounded-2xl border border-primary/10 mt-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-muted-foreground">Tu Valor Hora:</span>
                <span className="text-xl font-black text-primary">
                  {user.currencySymbol}{user.hourlyRate.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </Card>


        {/* Global Settings */}
        <div className="space-y-3 px-1">
          <h3 className="text-xs font-bold text-muted-foreground uppercase flex items-center gap-2">
            <Globe className="h-4 w-4" /> Ajustes de la App
          </h3>

          <Card className="p-2 rounded-2xl space-y-1">
            <div className="flex items-center justify-between p-3 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 bg-muted rounded-lg flex items-center justify-center">
                  {theme === 'dark' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
                </div>
                <span className="text-sm font-medium">Modo Oscuro</span>
              </div>
              <div className="flex bg-muted p-1 rounded-lg">
                <button
                  onClick={() => setTheme('light')}
                  className={cn("px-3 py-1 text-[10px] font-bold rounded-md transition-all", theme === 'light' ? "bg-background shadow-sm text-primary" : "text-muted-foreground")}
                >CLARO</button>
                <button
                  onClick={() => setTheme('dark')}
                  className={cn("px-3 py-1 text-[10px] font-bold rounded-md transition-all", theme === 'dark' ? "bg-background shadow-sm text-primary" : "text-muted-foreground")}
                >OSCURO</button>
              </div>
            </div>

            <div className="p-3">
              <Label className="text-[10px] font-bold text-muted-foreground uppercase ml-1">País / Región</Label>
              <select
                value={user.country}
                onChange={e => handleUpdateField('country', e.target.value)}
                className="w-full h-10 mt-1 rounded-xl border-none bg-muted px-3 text-sm font-semibold focus:ring-2 focus:ring-primary"
              >
                {countries.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <div className="p-3">
              <Label className="text-[10px] font-bold text-muted-foreground uppercase ml-1">Idioma</Label>
              <select
                value={user.language}
                onChange={e => handleUpdateField('language', e.target.value)}
                className="w-full h-10 mt-1 rounded-xl border-none bg-muted px-3 text-sm font-semibold focus:ring-2 focus:ring-primary"
              >
                <option value="es-AR">Español (Argentina)</option>
                <option value="es-ES">Español (España)</option>
                <option value="en-US">Inglés</option>
                <option value="pt-BR">Portugués</option>
              </select>
            </div>

            <div className="p-3">
              <Label className="text-[10px] font-bold text-muted-foreground uppercase ml-1">Símbolo de Moneda</Label>
              <div className="flex gap-2 mt-1">
                {[
                  { code: '$', name: 'Peso' },
                  { code: 'USD', name: 'Dólar' },
                  { code: '€', name: 'Euro' },
                  { code: 'R$', name: 'Real' }
                ].map(curr => (
                  <button
                    key={curr.code}
                    onClick={() => handleUpdateField('currencySymbol', curr.code)}
                    className={cn(
                      "flex-1 py-3 rounded-xl text-xs font-bold transition-all border-2",
                      user.currencySymbol === curr.code ? "bg-primary border-primary text-white" : "bg-muted border-transparent text-muted-foreground"
                    )}
                  >
                    {curr.code}
                  </button>
                ))}
              </div>
            </div>
          </Card>
        </div>

        {/* Footer info & Logout */}
        <div className="pt-4 flex flex-col items-center gap-6">
          <Button
            variant="ghost"
            onClick={async () => {
              try {
                await supabase.auth.signOut();
                localStorage.clear();
                toast.success('Sesión cerrada correctamente');
                navigate('/');
              } catch (error) {
                console.error('Error logging out:', error);
                toast.error('Error al cerrar sesión');
              }
            }}
            className="text-destructive font-bold hover:bg-destructive/5 hover:text-destructive w-full rounded-2xl h-12"
          >
            <LogOut className="h-4 w-4 mr-2" /> Cerrar sesión
          </Button>

          <div className="text-center">
            <p className="text-[10px] text-muted-foreground font-medium">Mi Taller Contable v2.1</p>
            <p className="text-[10px] text-muted-foreground/60 tracking-widest uppercase">Hecho para valientes emprendedores</p>
          </div>
        </div>

      </div>
    </Layout>
  );
}
