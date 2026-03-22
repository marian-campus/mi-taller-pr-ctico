import React, { useState } from 'react';
import { Sparkles, Send, User, Bot } from 'lucide-react';
import { Button } from './ui/button';
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from './ui/sheet';
import { ScrollArea } from './ui/scroll-area';
import { Input } from './ui/input';
import { useApp } from '@/context/AppContext';

export default function AIAssistant() {
    const { user, products, totalExpenses } = useApp();
    const [isOpen, setIsOpen] = useState(false);
    const [inputValue, setInputValue] = useState('');
    const [messages, setMessages] = useState([
        {
            id: 'welcome',
            role: 'assistant',
            content: '¡Hola! Soy tu asistente contable. ¿En qué puedo ayudarte hoy?',
        },
    ]);
    const [isLoading, setIsLoading] = useState(false);

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!inputValue.trim() || isLoading) return;


        
        // Prepare context data
        const tasaFijos = user?.monthlyWorkingHours && user.monthlyWorkingHours > 0 
            ? Math.round((totalExpenses / user.monthlyWorkingHours) * 100) / 100 
            : 0;

        const userContext = {
            lista_productos: products.filter(p => p.active !== false).map(p => ({
                nombre: p.name,
                categoria: p.category,
                costo_total: p.totalCost,
                precio_venta: p.sellingPrice || 0,
                costo_fijo_unidad: p.fixedCostPerUnit,
                mano_obra: p.labor.cost,
                insumos: p.ingredients.map(i => ({ nombre: i.name, costo: i.cost })),
                packaging: p.packaging.map(i => ({ nombre: i.name, costo: i.cost }))
            })),
            total_gastos: totalExpenses,
            valor_hora: user?.hourlyRate || 0,
            tasa_fijos: tasaFijos
        };

        const isNewUser = products.length === 0 && totalExpenses === 0;
        const chatInput = isNewUser && messages.length === 1 
            ? `Usuario nuevo, sin datos cargados todavía. Mensaje del usuario: ${inputValue}` 
            : inputValue;

        const userMessage = {
            id: Date.now().toString(),
            role: 'user',
            content: inputValue,
        };

        setMessages((prev) => [...prev, userMessage]);
        setInputValue('');
        setIsLoading(true);

        try {
            const webhookUrl = import.meta.env.VITE_N8N_WEBHOOK_URL;
            
            if (!webhookUrl) {
                console.warn('VITE_N8N_WEBHOOK_URL is not defined in environment variables');
                setMessages((prev) => [
                    ...prev,
                    {
                        id: (Date.now() + 1).toString(),
                        role: 'assistant',
                        content: 'Error de configuración: El webhook de IA no está configurado.',
                    },
                ]);
                return;
            }

            const response = await fetch(webhookUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    chatInput,
                    sessionId: user?.id || 'anonymous',
                    userContext
                }),
            });

            if (!response.ok) {
                throw new Error('Network response was not ok');
            }

            const text = await response.text();
            let assistantMessageContent = '';

            try {
                if (text) {
                    const data = JSON.parse(text);
                    assistantMessageContent = data.output || data.text || data.message || text;
                } else {
                    assistantMessageContent = 'Mensaje enviado correctamente al flujo de trabajo.';
                }
            } catch (e) {
                assistantMessageContent = text || 'Recibí una respuesta, pero no está en el formato esperado.';
            }
            
            const assistantMessage = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: assistantMessageContent,
            };

            setMessages((prev) => [...prev, assistantMessage]);
        } catch (error) {
            console.error('Error in assistant:', error);
            setMessages((prev) => [
                ...prev,
                {
                    id: (Date.now() + 1).toString(),
                    role: 'assistant',
                    content: 'Lo siento, hubo un problema al conectar con el asistente de IA. Por favor, inténtalo de nuevo más tarde.',
                },
            ]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 text-primary hover:text-primary hover:bg-primary/10"
                    title="Asistente de IA"
                >
                    <Sparkles className="h-5 w-5" />
                </Button>
            </SheetTrigger>
            <SheetContent className="flex flex-col w-[350px] sm:w-[450px] p-0 gap-0">
                <SheetHeader className="p-4 border-b">
                    <SheetTitle className="flex items-center gap-2">
                        <Sparkles className="h-5 w-5 text-primary" />
                        Asistente Contable
                    </SheetTitle>
                </SheetHeader>

                <ScrollArea className="flex-1 p-4">
                    <div className="flex flex-col gap-4">
                        {messages.map((message) => (
                            <div
                                key={message.id}
                                className={`flex gap-3 ${message.role === 'assistant' ? 'flex-row' : 'flex-row-reverse'
                                    }`}
                            >
                                <div
                                    className={`flex h-8 w-8 shrink-0 select-none items-center justify-center rounded-md border shadow ${message.role === 'assistant'
                                            ? 'bg-primary text-primary-foreground'
                                            : 'bg-muted'
                                        }`}
                                >
                                    {message.role === 'assistant' ? (
                                        <Bot className="h-4 w-4" />
                                    ) : (
                                        <User className="h-4 w-4" />
                                    )}
                                </div>
                                <div
                                    className={`rounded-lg px-3 py-2 text-sm ${message.role === 'assistant'
                                            ? 'bg-muted max-w-[85%]'
                                            : 'bg-primary text-primary-foreground max-w-[85%]'
                                        }`}
                                >
                                    {message.content}
                                </div>
                            </div>
                        ))}
                    </div>
                </ScrollArea>

                <div className="p-4 border-t bg-background">
                    <form onSubmit={handleSend} className="flex gap-2">
                        <Input
                            placeholder="Escribe tu consulta..."
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            className="flex-1"
                        />
                        <Button type="submit" size="icon" disabled={!inputValue.trim() || isLoading}>
                            {isLoading ? (
                                <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                            ) : (
                                <Send className="h-4 w-4" />
                            )}
                        </Button>
                    </form>
                    <p className="text-[10px] text-muted-foreground mt-2 text-center">
                        Acceso en tiempo real a tus productos, gastos e insumos habilitado.
                    </p>
                </div>
            </SheetContent>
        </Sheet>
    );
}
