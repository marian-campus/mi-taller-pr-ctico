import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { saveAs } from 'file-saver';
import { formatCurrency } from './format';
import { Product, Expense, UserSettings } from '@/types';

/**
 * STEP 1: Generates the PDF document and returns the Blob + Filename
 * This can be called asynchronously without losing the user gesture for the NEXT step.
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
    const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    const now = new Date();
    const reportMonth = selectedMonth !== undefined ? selectedMonth : now.getMonth();
    const reportYear = selectedYear !== undefined ? selectedYear : now.getFullYear();
    const currentMonthName = months[reportMonth];
    const currentYear = reportYear;

    const doc = new jsPDF();
    const title = `Reporte de Gestión - ${currentMonthName} ${currentYear}`;

    // PDF Content Generation
    doc.setFontSize(20);
    doc.setTextColor(40, 40, 40);
    doc.text(String(title), 14, 22);

    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Negocio: ${user.businessName}`, 14, 30);
    doc.text(`Emprendedor: ${user.name}`, 14, 35);
    doc.text(`Fecha de generación: ${new Date().toLocaleDateString()}`, 14, 40);

    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    doc.text('1. Gastos Mensuales (Mi Negocio)', 14, 55);

    const activeExpenses = expenses.filter(e => e.includedInFixedCosts !== false);
    const expenseData = activeExpenses.map(e => [
        e.description,
        e.category,
        formatCurrency(e.amount, user.currencySymbol)
    ]);

    autoTable(doc, {
        startY: 60,
        head: [['Descripción', 'Categoría', 'Monto']],
        body: expenseData,
        foot: [['Total Gastos', '', formatCurrency(totalExpenses, user.currencySymbol)]],
        theme: 'striped',
        headStyles: { fillColor: [100, 100, 255] }
    });

    const finalY1 = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 15;
    doc.text('2. Productos Activos y Costos', 14, finalY1);

    const activeProducts = products.filter(p => p.active !== false);
    const productData = activeProducts.map(p => [
        p.name,
        p.category,
        formatCurrency(p.totalCost, user.currencySymbol),
        p.sellingPrice ? formatCurrency(p.sellingPrice, user.currencySymbol) : '-'
    ]);

    autoTable(doc, {
        startY: finalY1 + 5,
        head: [['Producto', 'Categoría', 'Costo Unit.', 'Precio Venta']],
        body: productData,
        theme: 'grid',
        headStyles: { fillColor: [50, 180, 120] }
    });

    const finalY2 = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 15;
    doc.text('3. Proyección de Rentabilidad (Mix de Ventas)', 14, finalY2);

    const simulatorData = activeProducts.map(p => {
        const proj = projection[p.id] || { enabled: true, qty: '0' };
        const qty = parseInt(proj.qty) || 0;
        const profitPerUnit = (p.sellingPrice || 0) - p.totalCost;
        const totalProfit = profitPerUnit * qty;

        return [
            p.name,
            qty.toString(),
            formatCurrency(profitPerUnit, user.currencySymbol),
            formatCurrency(totalProfit, user.currencySymbol)
        ];
    }).filter(row => row[1] !== '0');

    autoTable(doc, {
        startY: finalY2 + 5,
        head: [['Producto', 'Ventas Proyect.', 'Ganancia u.', 'Subtotal Ganancia']],
        body: simulatorData.length > 0 ? simulatorData : [['No hay ventas proyectadas', '-', '-', '-']],
        theme: 'striped',
        headStyles: { fillColor: [240, 100, 100] }
    });

    const finalY3 = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 15;
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('Resumen Final', 14, finalY3);

    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    const netProfit = totalProjectedProfit - totalExpenses;

    doc.text(`Total Ganancia Bruta (Ventas): ${formatCurrency(totalProjectedProfit, user.currencySymbol)}`, 14, finalY3 + 10);
    doc.text(`Total Gastos Operativos: ${formatCurrency(totalExpenses, user.currencySymbol)}`, 14, finalY3 + 18);

    doc.setFont('helvetica', 'bold');
    if (netProfit >= 0) {
        doc.setTextColor(0, 150, 0);
        doc.text(`GANANCIA NETA ESTIMADA: ${formatCurrency(netProfit, user.currencySymbol)}`, 14, finalY3 + 30);
    } else {
        doc.setTextColor(200, 0, 0);
        doc.text(`PÉRDIDA NETA ESTIMADA: ${formatCurrency(Math.abs(netProfit), user.currencySymbol)}`, 14, finalY3 + 30);
    }

    doc.setFont('helvetica', 'italic');
    doc.setFontSize(9);
    doc.setTextColor(120, 120, 120);
    doc.text('* Calculado sobre el precio de venta sugerido menos costos totales (insumos, mano de obra y costos indirectos).', 14, finalY3 + 38);

    const fileName = `Reporte_Gestion_${currentMonthName}_${currentYear}.pdf`;
    const blob = doc.output('blob');

    return { blob, fileName, title };
};

/**
 * STEP 2: Triggers the actual download/share
 * MUST be called directly from a button click handler to preserve user gesture.
 */
export const downloadReport = async (blob: Blob, fileName: string, title?: string) => {
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

    if (isMobile) {
        // Try Web Share first (if available)
        if (navigator.share) {
            try {
                const file = new File([blob], fileName, { type: 'application/pdf' });
                await navigator.share({
                    files: [file],
                    title: title || 'Reporte de Gestión',
                    text: `Comparto mi reporte de gestión generado el ${new Date().toLocaleDateString()}.`,
                });
                return;
            } catch (err) {
                if ((err as Error).name === 'AbortError') return;
                console.warn('Share failed, falling back to download:', err);
            }
        }

        // Try FileSaver
        try {
            saveAs(blob, fileName);
            // On non-iOS mobile, saveAs is usually enough
            if (!/iPhone|iPad|iPod/i.test(navigator.userAgent)) return;
        } catch (err) {
            console.warn('FileSaver failed:', err);
        }

        // Final Fallback: Blob URL
        const url = URL.createObjectURL(blob);
        window.open(url, '_blank');
        setTimeout(() => URL.revokeObjectURL(url), 1000);
    } else {
        // Desktop: FileSaver is 100% reliable
        saveAs(blob, fileName);
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
