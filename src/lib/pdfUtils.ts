import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatCurrency } from './format';
import { Product, Expense, UserSettings } from '@/types';

export const generateManagementReport = (
    user: UserSettings,
    products: Product[],
    expenses: Expense[],
    totalExpenses: number,
    totalProjectedProfit: number,
    projection: Record<string, { enabled: boolean; qty: string }>
) => {
    const now = new Date();
    const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    const currentMonthName = months[now.getMonth()];
    const currentYear = now.getFullYear();

    const doc = new jsPDF();
    const title = `Reporte de Gestión - ${currentMonthName} ${currentYear}`;

    // Header
    doc.setFontSize(20);
    doc.setTextColor(40, 40, 40);
    doc.text(String(title), 14, 22);

    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Negocio: ${user.businessName}`, 14, 30);
    doc.text(`Emprendedor: ${user.name}`, 14, 35);
    doc.text(`Fecha de generación: ${new Date().toLocaleDateString()}`, 14, 40);

    // 1. Gastos Mensuales (Only included in fixed costs)
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

    // 2. Productos Activos
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

    // 3. Proyección de Rentabilidad (Simulator Results)
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
    }).filter(row => row[1] !== '0'); // Show only products with projected sales

    autoTable(doc, {
        startY: finalY2 + 5,
        head: [['Producto', 'Ventas Proyect.', 'Ganancia u.', 'Subtotal Ganancia']],
        body: simulatorData.length > 0 ? simulatorData : [['No hay ventas proyectadas', '-', '-', '-']],
        theme: 'striped',
        headStyles: { fillColor: [240, 100, 100] }
    });

    // Final Summary
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
    } else {
        doc.setTextColor(200, 0, 0);
    }
    doc.text(`GANANCIA NETA ESTIMADA: ${formatCurrency(netProfit, user.currencySymbol)}`, 14, finalY3 + 30);

    // Save
    doc.save(`Reporte_Gestion_${currentMonthName}_${currentYear}.pdf`);
};
