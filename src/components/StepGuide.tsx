import { useApp } from "@/context/AppContext";
import { cn } from "@/lib/utils";
import { Check, ChevronRight, User, Wallet, BookOpen, DollarSign, BarChart3 } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function StepGuide() {
    const { user, expenses, products } = useApp();
    const navigate = useNavigate();

    const steps = [
        {
            id: "perfil",
            title: "Tu Perfil",
            description: "Nombre y negocio",
            icon: User,
            path: "/perfil",
            isCompleted: !!(user?.name && user?.businessName),
        },
        {
            id: "negocio",
            title: "Tu Negocio",
            description: "Gastos y sueldo",
            icon: Wallet,
            path: "/bolsillo",
            isCompleted: !!(expenses.length > 0 && user?.monthlySalary),
        },
        {
            id: "costos",
            title: "Tus Costos",
            description: "Crear productos",
            icon: BookOpen,
            path: "/recetario",
            isCompleted: !!(products.length > 0),
        },
        {
            id: "precios",
            title: "Tus Precios",
            description: "Definir rentabilidad",
            icon: DollarSign,
            path: "/precio-justo",
            isCompleted: !!(products.some(p => p.sellingPrice && p.sellingPrice > 0)),
        },
        {
            id: "simulador",
            title: "Tu Meta",
            description: "Simular ventas",
            icon: BarChart3,
            path: "/simulador",
            isCompleted: false, // This is an ongoing step
        },
    ];

    const currentStepIndex = steps.findIndex(s => !s.isCompleted);
    const activeStepIndex = currentStepIndex === -1 ? steps.length - 1 : currentStepIndex;

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between px-1">
                <h2 className="text-lg font-bold text-foreground">Tu Ruta al Éxito 🚀</h2>
                <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-1 rounded-full uppercase">
                    {Math.round((steps.filter(s => s.isCompleted).length / (steps.length - 1)) * 100)}% Completado
                </span>
            </div>

            <div className="grid grid-cols-1 gap-3">
                {steps.map((step, index) => {
                    const isActive = index === activeStepIndex;
                    const isDone = step.isCompleted;

                    return (
                        <div
                            key={step.id}
                            onClick={() => navigate(step.path)}
                            className={cn(
                                "group relative flex items-center gap-4 p-4 rounded-2xl border-2 transition-all cursor-pointer",
                                isActive
                                    ? "bg-card border-primary shadow-md scale-[1.02]"
                                    : isDone
                                        ? "bg-muted/30 border-transparent opacity-80"
                                        : "bg-muted/10 border-dashed border-border opacity-60 hover:opacity-100"
                            )}
                        >
                            <div className={cn(
                                "flex items-center justify-center h-12 w-12 rounded-xl shrink-0 transition-colors",
                                isDone ? "bg-primary text-primary-foreground" : isActive ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"
                            )}>
                                {isDone ? <Check className="h-6 w-6" /> : <step.icon className="h-6 w-6" />}
                            </div>

                            <div className="flex-1 min-w-0">
                                <h3 className={cn("font-bold text-sm", isActive ? "text-foreground" : "text-muted-foreground")}>
                                    Paso {index + 1}: {step.title}
                                </h3>
                                <p className="text-xs text-muted-foreground truncate">{step.description}</p>
                            </div>

                            {isActive && (
                                <ChevronRight className="h-5 w-5 text-primary animate-pulse" />
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
