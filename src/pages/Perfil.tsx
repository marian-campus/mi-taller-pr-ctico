import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import Layout from '@/components/Layout';
import { useApp } from '@/context/AppContext';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Moon, Sun, Globe, User, LogOut, ChevronRight, Camera, Loader2 } from 'lucide-react';
import { useTheme } from '@/components/theme-provider';
import { toast } from 'sonner';
import { cn } from "@/lib/utils";
import { supabase } from '@/lib/supabase';

export default function Perfil() {
  const { user, updateProfile } = useApp();
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();
  const [uploading, setUploading] = useState(false);

  if (!user) return <Layout title="Cargando..."><div className="p-8 text-center text-muted-foreground">Cargando perfil...</div></Layout>;

  const handleUpdateField = async (field: string, val: any) => {
    await updateProfile({ [field]: val });
  };

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);
      const file = event.target.files?.[0];
      if (!file) return;

      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;

      // 1. Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('logos')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // 2. Get Public URL
      const { data: { publicUrl } } = supabase.storage
        .from('logos')
        .getPublicUrl(filePath);

      // 3. Update Profile
      await updateProfile({ logoUrl: publicUrl });
      toast.success('Logo actualizado correctamente');
    } catch (error: any) {
      console.error('Error uploading logo:', error);
      toast.error(`Error: ${error.message || 'No se pudo subir la imagen'}`);
    } finally {
      setUploading(false);
    }
  };


  const countries = ['Argentina', 'Chile', 'Uruguay', 'México', 'Colombia', 'España', 'Otro'];

  return (
    <Layout title="Perfil">
      <div className="space-y-6 pb-20">

        {/* Profile Branding */}
        <Card className="p-6 rounded-3xl bg-gradient-to-br from-primary/5 to-primary/10 border-primary/10">
          <div className="flex flex-col items-center text-center space-y-4 mb-6">
            <div className="relative group">
              <div className="h-24 w-24 bg-primary/10 rounded-3xl flex items-center justify-center text-4xl overflow-hidden border-2 border-primary/20 shadow-inner">
                {user.logoUrl ? (
                  <img src={user.logoUrl} alt="Logo" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex flex-col items-center justify-center">
                    <span className="text-3xl font-black text-primary/40 leading-none">
                      {user.businessName?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'MN'}
                    </span>
                  </div>
                )}
                {uploading && (
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                    <Loader2 className="h-8 w-8 text-white animate-spin" />
                  </div>
                )}
              </div>
              <label className="absolute -bottom-2 -right-2 bg-primary text-primary-foreground p-2 rounded-xl cursor-pointer shadow-lg hover:scale-110 transition-transform">
                <Camera className="h-4 w-4" />
                <input type="file" className="hidden" accept="image/*" onChange={handleLogoUpload} disabled={uploading} />
              </label>
            </div>
            <div>
              <h2 className="text-xl font-black text-foreground">{user.businessName || 'Tu Negocio'}</h2>
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-[10px] font-bold text-muted-foreground uppercase ml-1">Nombre del Emprendimiento</Label>
              <Input
                value={user.businessName}
                onChange={e => handleUpdateField('businessName', e.target.value)}
                placeholder="Ej: Dulces de Maru"
                className="rounded-xl h-12 bg-background border-none shadow-sm focus-visible:ring-primary text-base"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-bold text-muted-foreground uppercase ml-1">Tu Nombre de Usuario</Label>
              <Input
                value={user.name}
                onChange={e => handleUpdateField('name', e.target.value)}
                placeholder="Tu nombre"
                className="rounded-xl h-11 bg-background/50"
              />
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
