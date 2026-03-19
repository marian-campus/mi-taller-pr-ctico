import { useState, useMemo, useEffect } from 'react';
import Layout from '@/components/Layout';
import { useApp } from '@/context/AppContext';
import { formatCurrency } from '@/lib/format';
import { cn } from '@/lib/utils';
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
import { AlertCircle, Rocket } from 'lucide-react';

export default function SimuladorMix() {
    const context = useApp();
    const { products = [], user, projection, setProjection, updateProjection, totalProjectedProfit, totalExpenses } = context || { products: [], user: null, projection: {}, setProjection: () => {}, updateProjection: () => {}, totalProjectedProfit: 0, totalExpenses: 0 };
    
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
        const expenses = totalExpenses || 0;
        const perc = expenses > 0
            ? Math.min(Math.round((profit / expenses) * 100), 100)
            : 100;
        const net = profit - expenses;
        return {
            survivalPercentage: isNaN(perc) ? 0 : perc,
            netProfit: net,
            isBreakEvenReached: net >= 0
        };
    }, [totalExpenses, totalProjectedProfit]);

    if (!context || !context.user) return <Layout title="Cargando..."><div className="p-8 text-center text-muted-foreground">Cargando simulador...</div></Layout>;

    return (
        <Layout title="📊 Simulador Mix de Ventas">
            <div className="space-y-5 pb-20 max-w-lg mx-auto">
                <div className="bg-primary/5 p-4 rounded-xl border border-primary/10">
                    <p className="text-sm text-primary font-medium">
                        Simulá diferentes escenarios activando productos y ajustando cantidades.
                        El objetivo es que tu ganancia neta supere tus gastos totales.
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
                        <span className="text-sm font-medium text-muted-foreground">Meta (Gastos Totales "Mi Negocio"):</span>
                        <span className="font-bold text-lg">{formatCurrency(totalExpenses, user?.currencySymbol)}</span>
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
                                <p>Te faltan <strong>{formatCurrency(Math.abs(netProfit), user?.currencySymbol)}</strong> para cubrir tus gastos totales (<strong>{formatCurrency(totalExpenses, user?.currencySymbol)}</strong>).</p>
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
            </div>
        </Layout>
    );
}
