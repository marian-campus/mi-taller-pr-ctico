import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { dataService } from '@/lib/dataService';
import { toast } from 'sonner';

export default function Register() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [form, setForm] = useState({
        firstName: '',
        lastName: '',
        email: '',
        businessName: '',
        password: '',
        confirmPassword: ''
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (form.password !== form.confirmPassword) {
            toast.error('Las contraseñas no coinciden');
            return;
        }

        try {
            setLoading(true);
            const { data: authData, error: authError } = await supabase.auth.signUp({
                email: form.email,
                password: form.password,
                options: {
                    data: {
                        first_name: form.firstName,
                    },
                    emailRedirectTo: 'https://mi-taller-pr-ctico.vercel.app/dashboard'
                }
            });

            if (authError) throw authError;

            if (authData.user) {
                // Create initial profile (Resilient: if this fails by RLS, AppContext will heal it in Dashboard)
                try {
                    await dataService.createProfile({
                        id: authData.user.id,
                        name: form.firstName,
                        businessName: form.businessName,
                        businessCategory: 'gastronomia',
                        startDate: new Date().toISOString().split('T')[0],
                        location: '',
                        hourlyRate: 0,
                        monthlySalary: 0,
                        monthlyWorkingHours: 0,
                        country: '',
                        currencySymbol: '$',
                        language: 'es'
                    });
                } catch (profileError) {
                    console.warn('⚠️ Initial profile creation failed (probably RLS). Healing will occur in Dashboard.', profileError);
                }

                toast.success('¡Iniciando registro! Revisa tu email para confirmar.');
                navigate('/'); // Redirect to landing (login)
            }
        } catch (err: any) {
            console.error(err);
            // Error de RLS en Supabase es usualmente 42501
            if (err.code === '42501' || (err.message && err.message.toLowerCase().includes('row-level security'))) {
                toast.error('Error de permisos en la base de datos. Por favor, verifica las políticas de seguridad.');
            } else {
                toast.error(err.message || 'Error al crear la cuenta');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
            <div className="max-w-md w-full space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="text-center space-y-2">
                    <h1 className="text-3xl font-extrabold tracking-tight">Crear cuenta</h1>
                    <p className="text-muted-foreground text-sm">Empieza a costear de forma profesional</p>
                </div>

                <Card className="p-8 border-none bg-card/50 backdrop-blur shadow-xl rounded-3xl">
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="firstName">Nombre</Label>
                                <Input
                                    id="firstName"
                                    placeholder="Maru"
                                    value={form.firstName}
                                    onChange={e => setForm({ ...form, firstName: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="lastName">Apellido</Label>
                                <Input
                                    id="lastName"
                                    placeholder="García"
                                    value={form.lastName}
                                    onChange={e => setForm({ ...form, lastName: e.target.value })}
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="businessName">Nombre de tu Negocio</Label>
                            <Input
                                id="businessName"
                                placeholder="Mi Taller Dulce"
                                value={form.businessName}
                                onChange={e => setForm({ ...form, businessName: e.target.value })}
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="hola@ejemplo.com"
                                value={form.email}
                                onChange={e => setForm({ ...form, email: e.target.value })}
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="password">Contraseña</Label>
                            <Input
                                id="password"
                                type="password"
                                placeholder="••••••••"
                                value={form.password}
                                onChange={e => setForm({ ...form, password: e.target.value })}
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="confirmPassword">Reconfirmar Contraseña</Label>
                            <Input
                                id="confirmPassword"
                                type="password"
                                placeholder="••••••••"
                                value={form.confirmPassword}
                                onChange={e => setForm({ ...form, confirmPassword: e.target.value })}
                                required
                            />
                        </div>

                        <Button type="submit" className="w-full h-12 text-lg font-bold rounded-xl mt-4" disabled={loading}>
                            {loading ? 'Creando cuenta...' : 'Registrarme'}
                        </Button>
                    </form>

                    <div className="mt-6 text-center text-sm">
                        <span className="text-muted-foreground mr-1">¿Ya tienes cuenta?</span>
                        <button
                            onClick={() => navigate('/')}
                            className="text-primary font-semibold hover:underline"
                        >
                            Inicia sesión
                        </button>
                    </div>
                </Card>
            </div>
        </div>
    );
}
