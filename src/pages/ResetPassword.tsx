import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

export default function ResetPassword() {
    const navigate = useNavigate();
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        // Supabase handles the session via URL fragments automatically,
        // but it's good practice to check if we have a session or if we're coming from a recovery link.
        const checkSession = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                // If no session, they might have clicked an expired link or just typed the URL
                // We could redirect them, but Supabase might still be processing the hash.
                console.log("No active session detected for password reset yet.");
            }
        };
        checkSession();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (password.length < 6) {
            toast.error('La contraseña debe tener al menos 6 caracteres');
            return;
        }

        if (password !== confirmPassword) {
            toast.error('Las contraseñas no coinciden');
            return;
        }

        setLoading(true);

        try {
            const { error } = await supabase.auth.updateUser({
                password: password
            });

            if (error) {
                toast.error(error.message || 'Error al actualizar la contraseña');
                return;
            }

            toast.success('¡Contraseña actualizada con éxito!');
            setTimeout(() => navigate('/'), 2000);
        } catch (error: any) {
            toast.error('Ocurrió un error inesperado');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
            <div className="max-w-md w-full space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="text-center space-y-2">
                    <h1 className="text-3xl font-extrabold tracking-tight">Nueva contraseña</h1>
                    <p className="text-muted-foreground text-sm">Ingresa tu nueva contraseña para acceder</p>
                </div>

                <Card className="p-8 border-none bg-card/50 backdrop-blur shadow-xl rounded-3xl">
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="password">Nueva contraseña</Label>
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

                        <div className="space-y-2">
                            <Label htmlFor="confirmPassword">Confirmar contraseña</Label>
                            <Input
                                id="confirmPassword"
                                type="password"
                                placeholder="••••••••"
                                value={confirmPassword}
                                onChange={e => setConfirmPassword(e.target.value)}
                                required
                                className="h-11 rounded-xl"
                            />
                        </div>

                        <Button 
                            type="submit" 
                            className="w-full h-12 text-lg font-bold rounded-xl mt-2 transition-all active:scale-95"
                            disabled={loading}
                        >
                            {loading ? 'Actualizando...' : 'Cambiar contraseña'}
                        </Button>
                    </form>
                </Card>
            </div>
        </div>
    );
}
