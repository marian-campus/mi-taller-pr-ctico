import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

export default function RecoverPassword() {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        toast.success('Instrucciones enviadas a tu email');
        setTimeout(() => navigate('/'), 2000);
    };

    return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
            <div className="max-w-md w-full space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <button
                    onClick={() => navigate('/')}
                    className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors absolute top-8 left-8"
                >
                    <ArrowLeft className="h-4 w-4" /> Volver
                </button>

                <div className="text-center space-y-2">
                    <h1 className="text-3xl font-extrabold tracking-tight">Recuperar contraseña</h1>
                    <p className="text-muted-foreground text-sm">Te enviaremos los pasos para restablecerla</p>
                </div>

                <Card className="p-8 border-none bg-card/50 backdrop-blur shadow-xl rounded-3xl">
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="tu@email.com"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                required
                            />
                        </div>

                        <Button type="submit" className="w-full h-12 text-lg font-bold rounded-xl mt-2">
                            Enviar instrucciones
                        </Button>
                    </form>
                </Card>
            </div>
        </div>
    );
}
