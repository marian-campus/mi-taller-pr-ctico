import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { saveAs } from 'file-saver';
import { formatCurrency } from './format';
import { Product, Expense, UserSettings } from '@/types';
import { toast } from 'sonner';

/**
 * STEP 1: Generates the PDF document and returns the Blob + Filename
 */
export const createManagementReportBlob = (
    user: UserSettings,
    products: Product[],
    expenses: Expense[],
    totalExpenses: number,
    totalProjectedProfit: number,
    projection: Record<string, { enabled: boolean; qty: string }>,
    selectedMonth?: number,
    selectedYear?: number
): { blob: Blob; fileName: string; title: string } => {
    try {
        const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
        const now = new Date();
        const reportMonth = selectedMonth !== undefined ? selectedMonth : now.getMonth();
        const reportYear = selectedYear !== undefined ? selectedYear : now.getFullYear();
        const currentMonthName = months[reportMonth];
        const currentYear = reportYear;

        const doc = new jsPDF();
        const title = `Reporte de Gestión - ${currentMonthName} ${currentYear}`;

        // PDF Content
        doc.setFontSize(20);
        doc.text(String(title), 14, 22);
        doc.setFontSize(10);
        doc.text(`Negocio: ${user.businessName}`, 14, 30);
        doc.text(`Emprendedor: ${user.name}`, 14, 35);

        // 1. Expenses
        const activeExpenses = expenses.filter(e => e.includedInFixedCosts !== false);
        autoTable(doc, {
            startY: 55,
            head: [['Descripción', 'Categoría', 'Monto']],
            body: activeExpenses.map(e => [e.description, e.category, formatCurrency(e.amount, user.currencySymbol)]),
            foot: [['Total Gastos', '', formatCurrency(totalExpenses, user.currencySymbol)]],
            theme: 'striped',
            headStyles: { fillColor: [100, 100, 255] }
        });

        // 2. Products
        const finalY1 = (doc as any).lastAutoTable.finalY + 15;
        doc.text('2. Productos Activos y Costos', 14, finalY1);
        const activeProducts = products.filter(p => p.active !== false);
        autoTable(doc, {
            startY: finalY1 + 5,
            head: [['Producto', 'Categoría', 'Costo Unit.', 'Precio Venta']],
            body: activeProducts.map(p => [p.name, p.category, formatCurrency(p.totalCost, user.currencySymbol), p.sellingPrice ? formatCurrency(p.sellingPrice, user.currencySymbol) : '-']),
            theme: 'grid',
            headStyles: { fillColor: [50, 180, 120] }
        });

        // 3. Projections
        const finalY2 = (doc as any).lastAutoTable.finalY + 15;
        doc.text('3. Proyección de Rentabilidad', 14, finalY2);
        const simulatorData = activeProducts.map(p => {
            const proj = projection[p.id] || { enabled: true, qty: '0' };
            const qty = parseInt(proj.qty) || 0;
            const profitPerUnit = (p.sellingPrice || 0) - p.totalCost;
            return [p.name, qty.toString(), formatCurrency(profitPerUnit, user.currencySymbol), formatCurrency(profitPerUnit * qty, user.currencySymbol)];
        }).filter(row => row[1] !== '0');

        autoTable(doc, {
            startY: finalY2 + 5,
            head: [['Producto', 'Cant.', 'Ganancia u.', 'Subtotal']],
            body: simulatorData.length > 0 ? simulatorData : [['No hay ventas proyectadas', '-', '-', '-']],
            theme: 'striped',
            headStyles: { fillColor: [240, 100, 100] }
        });

        // Summary
        const finalY3 = (doc as any).lastAutoTable.finalY + 15;
        const netProfit = totalProjectedProfit - totalExpenses;
        doc.setFontSize(14);
        doc.text(`Total Bruto: ${formatCurrency(totalProjectedProfit, user.currencySymbol)}`, 14, finalY3 + 10);
        doc.text(`Gastos: ${formatCurrency(totalExpenses, user.currencySymbol)}`, 14, finalY3 + 20);
        doc.setTextColor(netProfit >= 0 ? [0, 150, 0] : [200, 0, 0]);
        doc.text(`GANANCIA NETA: ${formatCurrency(netProfit, user.currencySymbol)}`, 14, finalY3 + 30);

        const fileName = `Reporte_${currentMonthName}_${currentYear}.pdf`;
        const blob = doc.output('blob');
        return { blob, fileName, title };
    } catch (err) {
        console.error("PDF Creation Error:", err);
        throw err;
    }
};

/**
 * STEP 2: Triggers the download/share (Optimized for Android/Google App)
 */
export const downloadReport = async (blob: Blob, fileName: string, title?: string) => {
    const userAgent = navigator.userAgent || "";
    const isAndroid = /Android/i.test(userAgent);
    const isIOS = /iPhone|iPad|iPod/i.test(userAgent);
    const isGoogleApp = /GSA\//i.test(userAgent); // Modern Google Search App

    console.log(`[PDF] System Info: Android=${isAndroid}, iOS=${isIOS}, GoogleApp=${isGoogleApp}`);

    try {
        // Method A: Web Share API (Primary for Android/Custom Tabs)
        if (navigator.share) {
            try {
                const file = new File([blob], fileName, { type: 'application/pdf' });
                console.log("[PDF] Attempting Web Share...");
                await navigator.share({
                    files: [file],
                    title: title || 'Reporte de Gestión',
                    text: 'Te comparto mi reporte de gestión.'
                });
                toast.success('Reporte compartido correctamente');
                return;
            } catch (err) {
                if ((err as Error).name === 'AbortError') return;
                console.warn("[PDF] Web Share failed:", err);
            }
        }

        // Method B: FileSaver (Direct download)
        console.log("[PDF] Attempting direct download (FileSaver)...");
        toast.info('Iniciando descarga directa...');
        saveAs(blob, fileName);
        
        // On Android Google App, we might need an extra push because Custom Tabs block silent downloads
        if (isAndroid || isGoogleApp) {
            setTimeout(() => {
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = fileName;
                a.target = '_blank';
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                console.log("[PDF] Secondary download trigger sent");
            }, 500);
        }

    } catch (err) {
        console.error("[PDF] All download methods failed:", err);
        toast.error('No se pudo completar la descarga. Intentá desde Chrome o Safari.');
    }
};

// Compatibility export
export const generateManagementReport = async (
    user: UserSettings,
    products: Product[],
    expenses: Expense[],
    totalExpenses: number,
    totalProjectedProfit: number,
    projection: Record<string, { enabled: boolean; qty: string }>,
    selectedMonth?: number,
    selectedYear?: number
) => {
    const { blob, fileName, title } = createManagementReportBlob(user, products, expenses, totalExpenses, totalProjectedProfit, projection, selectedMonth, selectedYear);
    await downloadReport(blob, fileName, title);
};
