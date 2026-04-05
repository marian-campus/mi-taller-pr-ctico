import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { useApp } from '@/context/AppContext';
import { Monitor, LineChart } from 'lucide-react';

export default function Landing() {
    const navigate = useNavigate();
    const { user, loading: contextLoading } = useApp();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const [searchParams] = useSearchParams();

    // 0. Mostrar mensaje de logout si viene en la URL
    useEffect(() => {
        if (searchParams.get('logout') === 'true') {
            toast.success('Has cerrado sesión correctamente. ¡Vuelve pronto!', {
                id: 'logout-success',
            });
            // Limpiar el parámetro de la URL
            const newParams = new URLSearchParams(searchParams);
            newParams.delete('logout');
            navigate(`/?${newParams.toString()}`, { replace: true });
        }
    }, [searchParams, navigate]);

    // 1. Limpieza de rastro se delega a AppContext para mayor consistencia

    // 2. Redirección: Solo si el usuario ya está cargado en el context
    useEffect(() => {
        console.log("👀 Landing state check - User:", !!user, "Context Loading:", contextLoading);
        if (user) {
            console.log("🚀 User detected! Redirecting to dashboard...");
            navigate('/dashboard');
        }
    }, [user, contextLoading, navigate]);

    // 3. Fallback: Si se queda pegado en loading por más de 12 segundos
    useEffect(() => {
        let timeout: any;
        if (loading && !user) {
            timeout = setTimeout(async () => {
                console.warn("⚠️ Login timeout reached. Checking session manually...");
                const { data: { session } } = await supabase.auth.getSession();
                if (session) {
                    console.log("🎉 Manual session found during timeout, redirecting.");
                    navigate('/dashboard');
                } else {
                    setLoading(false);
                    toast.error("La carga está tardando mucho. Revisa tu conexión o intenta recargar.");
                }
            }, 12000);
        }
        return () => clearTimeout(timeout);
    }, [loading, user, navigate]);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        console.log("🖱️ handleLogin started for:", email);
        setLoading(true);
        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) throw error;

            console.log("✅ Supabase signIn successful:", data.user?.id);
            toast.success('¡Bienvenido de nuevo!');

            // Si por alguna razón el AppContext no reacciona al evento SIGNED_IN
            // forzamos una verificación manual después de 2 segundos
            setTimeout(async () => {
                if (loading) {
                    console.log("🔍 Manual session check after delay...");
                    const { data: { session } } = await supabase.auth.getSession();
                    if (session) {
                        console.log("🎉 Session found manually, forcing redirect.");
                        navigate('/dashboard');
                    }
                }
            }, 3000);

        } catch (error) {
            const err = error as Error;
            console.error("❌ Login error:", err);
            toast.error(err.message || 'Error al iniciar sesión');
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
            <div className="max-w-md w-full space-y-8 animate-in fade-in zoom-in duration-500">
                {/* Branding Area */}
                <div className="text-center space-y-3">
                    <div className="mx-auto h-20 w-20 bg-primary/10 rounded-3xl flex items-center justify-center mb-4 relative">
                        <Monitor className="w-11 h-11 text-primary absolute" strokeWidth={1.5} />
                        <LineChart className="w-5 h-5 text-primary absolute -mt-1.5" strokeWidth={2.5} />
                    </div>
                    <h1 className="text-3xl font-black tracking-tight text-foreground">
                        Mi Taller <span className="text-primary">Contable</span>
                    </h1>
                    <p className="text-muted-foreground text-sm">
                        Calculá tus costos sin enloquecer
                    </p>
                </div>

                {/* Login Form */}
                <Card className="p-8 border-none bg-card/50 backdrop-blur shadow-2xl rounded-3xl space-y-6">
                    <form onSubmit={handleLogin} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="tu@email.com"
                                value={email}
                                onChange={e => setEmail(e.target.value.trim())}
                                required
                                className="h-11 rounded-xl"
                            />
                        </div>
                        <div className="space-y-2">
                            <div className="flex justify-between items-center">
                                <Label htmlFor="password">Contraseña</Label>
                                <button
                                    type="button"
                                    onClick={() => navigate('/recover')}
                                    className="text-[11px] text-primary hover:underline font-medium"
                                >
                                    ¿Olvidaste tu contraseña?
                                </button>
                            </div>
                            <Input
                                id="password"
                                type="password"
                                placeholder="••••••••"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                required
                                className="h-11 rounded-xl"
                            />
                        </div>

                        <Button
                            type="submit"
                            className="w-full h-12 text-lg font-bold rounded-xl mt-2 transition-all active:scale-95"
                            disabled={loading}
                        >
                            {loading ? 'Iniciando sesión...' : 'Iniciar sesión'}
                        </Button>
                    </form>

                    <div className="text-center text-sm pt-2">
                        <span className="text-muted-foreground mr-1">¿No tienes cuenta?</span>
                        <button
                            onClick={() => navigate('/register')}
                            className="text-primary font-bold hover:underline"
                        >
                            Regístrate gratis
                        </button>
                    </div>

                    {user && !contextLoading && (
                        <div className="pt-4 border-t border-border/50 text-center">
                            <p className="text-[10px] text-muted-foreground mb-2">Sesión activa sin perfil</p>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => supabase.auth.signOut().then(() => window.location.reload())}
                                className="text-[10px] h-8"
                            >
                                Cerrar sesión actual
                            </Button>
                        </div>
                    )}
                </Card>

                <p className="text-[11px] text-muted-foreground/60 text-center">
                    Al ingresar aceptas nuestros términos y condiciones
                </p>
            </div>
        </div>
    );
}
