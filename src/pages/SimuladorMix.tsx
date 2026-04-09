import { useState, useMemo, useEffect } from 'react';
import Layout from '@/components/Layout';
import { useApp } from '@/context/AppContext';
import { formatCurrency } from '@/lib/format';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { AlertCircle, Rocket, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { generateManagementReport } from '@/lib/pdfUtils';

const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

export default function SimuladorMix() {
    const context = useApp();
    const { products = [], user, projection, setProjection, updateProjection, totalProjectedProfit, expenses = [] } = context || { products: [], user: null, projection: {}, setProjection: () => {}, updateProjection: () => {}, totalProjectedProfit: 0, expenses: [] };
    
    const now = new Date();
    const [month, setMonth] = useState(now.getMonth());
    const [year, setYear] = useState(now.getFullYear());
    const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
    const [preparedUrl, setPreparedUrl] = useState<string | null>(null);

    // Reset prepared URL if data changes
    useEffect(() => {
        if (preparedUrl) {
            setPreparedUrl(null);
        }
    }, [projection, month, year, products, expenses]);


    // Filtered expenses for the selected month/year
    const { monthExpenses, totalMonthExpenses } = useMemo(() => {
        const filtered = expenses.filter(e => {
            const d = new Date(e.date);
            return d.getMonth() === month && d.getFullYear() === year;
        });
        const total = filtered.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
        return { monthExpenses: filtered, totalMonthExpenses: total };
    }, [expenses, month, year]);
    
    // Sync projection state when products load
    useEffect(() => {
        if (products.length > 0 && Object.keys(projection).length === 0) {
            const initial = products.reduce((acc, p) => ({
                ...acc,
                [p.id]: { enabled: true, qty: '0' }
            }), {});
            setProjection(initial);
        }
    }, [products, projection, setProjection]);

    // 3. Survival Progress
    const { survivalPercentage, netProfit, isBreakEvenReached } = useMemo(() => {
        const profit = totalProjectedProfit || 0;
        const expensesTarget = totalMonthExpenses || 0;
        const perc = expensesTarget > 0
            ? Math.min(Math.round((profit / expensesTarget) * 100), 100)
            : 100;
        const net = profit - expensesTarget;
        return {
            survivalPercentage: isNaN(perc) ? 0 : perc,
            netProfit: net,
            isBreakEvenReached: net >= 0
        };
    }, [totalMonthExpenses, totalProjectedProfit]);

    const handleGenerateReport = async () => {
        if (isGeneratingPDF || !user) return;
        setIsGeneratingPDF(true);
        
        try {
            await generateManagementReport(
                user, 
                products, 
                monthExpenses, 
                totalMonthExpenses, 
                totalProjectedProfit, 
                projection, 
                month, 
                year
            );
            // Optionally we could track success to show a "Download Again" button
            // but the function already triggers the download.
        } catch (error) {
            console.error("Error generating PDF:", error);
            // Error is already toasted in generateManagementReport
        } finally {
            setIsGeneratingPDF(false);
        }
    };

    if (!context || !context.user) return <Layout title="Cargando..."><div className="p-8 text-center text-muted-foreground">Cargando simulador...</div></Layout>;

    return (
        <Layout title="📊 Simulador Mix de Ventas">
            <div className="space-y-5 pb-20 max-w-lg mx-auto">
                {/* Month Selector */}
                <div className="flex gap-2 bg-muted/30 p-2 rounded-xl border border-border/50">
                    <select value={month} onChange={e => setMonth(parseInt(e.target.value))}
                        className="flex-1 h-10 rounded-lg border-none bg-background px-3 text-sm font-bold focus:ring-2 focus:ring-primary shadow-sm">
                        {months.map((m, i) => <option key={i} value={i}>{m}</option>)}
                    </select>
                    <select value={year} onChange={e => setYear(parseInt(e.target.value))}
                        className="w-24 h-10 rounded-lg border-none bg-background px-3 text-sm font-bold focus:ring-2 focus:ring-primary shadow-sm">
                        {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                </div>

                <div className="bg-primary/5 p-4 rounded-xl border border-primary/10">
                    <p className="text-sm text-primary font-medium">
                        Simulá diferentes escenarios activando productos y ajustando cantidades.
                        El objetivo es que tu ganancia neta supere tus gastos totales del mes seleccionado.
                    </p>
                </div>

                {/* Global Summary Card */}
                <Card className="p-5 bg-primary text-primary-foreground rounded-2xl shadow-lg">
                    <p className="text-sm opacity-90">Rentabilidad Global Proyectada</p>
                    <p className="text-4xl font-bold mt-1">{formatCurrency(totalProjectedProfit, user?.currencySymbol)}</p>
                    <div className="mt-4 space-y-2">
                        <div className="flex justify-between text-xs opacity-80">
                            <span>Progreso de punto de equilibrio</span>
                            <span>{survivalPercentage}%</span>
                        </div>
                        <div className="h-2 w-full bg-white/20 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-white transition-all duration-500"
                                style={{ width: `${survivalPercentage}%` }}
                            />
                        </div>
                    </div>
                </Card>

                {/* Breakdown Table */}
                <Card className="rounded-xl overflow-hidden border-none shadow-sm">
                    <Table>
                        <TableHeader className="bg-muted/50">
                            <TableRow>
                                <TableHead className="w-[80px]">Estado</TableHead>
                                <TableHead>Producto</TableHead>
                                <TableHead className="text-center w-[80px]">Cant.</TableHead>
                                <TableHead className="text-right">Ganancia</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {products.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center py-8 text-muted-foreground italic">
                                        No hay productos para simular
                                    </TableCell>
                                </TableRow>
                            ) : (
                                products.filter(p => p.active !== false).map((p) => {
                                    const proj = projection[p.id] || { enabled: true, qty: '0' };
                                    const unitProfit = (p.sellingPrice || 0) - p.totalCost;
                                    const totalAporte = unitProfit * (parseInt(proj.qty) || 0);

                                    return (
                                        <TableRow key={p.id} className={cn(!proj.enabled && "opacity-40 grayscale-[0.5]")}>
                                            <TableCell>
                                                <div className="flex flex-col items-center gap-1">
                                                    <Switch
                                                        checked={proj.enabled}
                                                        onCheckedChange={(val) => updateProjection(p.id, 'enabled', val)}
                                                        className="scale-75"
                                                    />
                                                    <span className={cn(
                                                        "text-[9px] font-black uppercase tracking-tighter",
                                                        proj.enabled ? "text-primary" : "text-muted-foreground"
                                                    )}>
                                                        {proj.enabled ? 'ON' : 'OFF'}
                                                    </span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="font-medium text-xs py-3">
                                                {p.name}
                                                <p className="text-[10px] text-muted-foreground">+{formatCurrency(unitProfit, user?.currencySymbol)} c/u</p>
                                            </TableCell>
                                            <TableCell>
                                                <Input
                                                    type="number"
                                                    value={proj.qty}
                                                    onChange={(e) => updateProjection(p.id, 'qty', e.target.value)}
                                                    className="h-8 w-14 text-xs px-1 text-center font-bold"
                                                    disabled={!proj.enabled}
                                                />
                                            </TableCell>
                                            <TableCell className="text-right text-xs font-bold">
                                                {formatCurrency(totalAporte, user?.currencySymbol)}
                                            </TableCell>
                                        </TableRow>
                                    );
                                })
                            )}
                        </TableBody>
                    </Table>
                </Card>

                {/* Financial Health Message */}
                <Card className="p-4 space-y-4 rounded-xl border-dashed border-2">
                    <div className="flex justify-between items-end border-b border-dashed pb-2">
                        <span className="text-sm font-medium text-muted-foreground">Meta (Gastos "{months[month]} {year}"):</span>
                        <span className="font-bold text-lg">{formatCurrency(totalMonthExpenses, user?.currencySymbol)}</span>
                    </div>

                    <div className={cn(
                        "p-4 rounded-xl text-sm font-medium flex gap-3 items-start",
                        !isBreakEvenReached
                            ? "bg-red-100 text-red-900 border border-red-200"
                            : "bg-emerald-100 text-emerald-800 border border-emerald-200"
                    )}>
                        {!isBreakEvenReached ? (
                            <>
                                <AlertCircle className="h-5 w-5 shrink-0 text-red-600" />
                                <p>Te faltan <strong>{formatCurrency(Math.abs(netProfit), user?.currencySymbol)}</strong> para cubrir tus gastos de <strong>{months[month]}</strong> (<strong>{formatCurrency(totalMonthExpenses, user?.currencySymbol)}</strong>).</p>
                            </>
                        ) : (
                            <>
                                <Rocket className="h-5 w-5 shrink-0 text-emerald-600" />
                                <p>¡Punto de equilibrio alcanzado! Estás cubriendo tus gastos y te sobran <strong>{formatCurrency(netProfit, user?.currencySymbol)}</strong> de ganancia neta.</p>
                            </>
                        )}
                    </div>
                </Card>

                <p className="text-[10px] text-center text-muted-foreground px-4 italic">
                    * Los resultados se basan en la sumatoria de todas las ganancias (Precio - Costo) de los productos activados multiplicada por la cantidad que proyectes vender.
                </p>

                {/* Paso Final: Reporte de Gestión */}
                <div className="pt-4 mt-6 border-t border-border">
                    <h3 className="text-lg font-bold mb-3 px-1 flex items-center gap-2">
                         <span className="bg-primary/10 p-2 rounded-lg text-primary">📊</span> Reporte de Gestión
                    </h3>
                    <Card className="p-6 bg-gradient-to-br from-card to-muted/30 border-primary/10 rounded-2xl shadow-md border-2 hover:border-primary/30 transition-all group overflow-hidden relative">
                         <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:scale-110 transition-transform">
                             <Download className="h-24 w-24" />
                         </div>
                         <div className="relative space-y-4">
                             <p className="text-sm text-muted-foreground leading-relaxed">
                                 Analizá el rendimiento de tu negocio para {months[month]} {year} con un reporte profesional.
                             </p>
                             <Button 
                                 onClick={handleGenerateReport} 
                                 disabled={isGeneratingPDF}
                                 className="w-full h-12 gap-2 text-base font-bold shadow-lg shadow-primary/10 transition-all hover:scale-[1.02] bg-primary"
                             >
                                 {isGeneratingPDF ? (
                                     <>
                                         <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                         Generando en servidor...
                                     </>
                                 ) : (
                                     <>
                                         <Download className="h-5 w-5" />
                                         Descargar Reporte PDF
                                     </>
                                 )}
                             </Button>
                             <p className="text-[9px] text-center text-muted-foreground mt-2">
                                 El reporte se genera en el servidor y se descarga automáticamente.
                             </p>
                         </div>
                    </Card>
                </div>
            </div>
        </Layout>
    );
}
