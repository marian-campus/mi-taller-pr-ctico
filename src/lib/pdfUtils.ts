import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { saveAs } from 'file-saver';
import { formatCurrency } from './format';
import { Product, Expense, UserSettings } from '@/types';

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
    const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    const now = new Date();
    const reportMonth = selectedMonth !== undefined ? selectedMonth : now.getMonth();
    const reportYear = selectedYear !== undefined ? selectedYear : now.getFullYear();
    const currentMonthName = months[reportMonth];
    const currentYear = reportYear;

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
        doc.setTextColor(0, 150, 0); // Green for profit
        doc.text(`GANANCIA NETA ESTIMADA: ${formatCurrency(netProfit, user.currencySymbol)}`, 14, finalY3 + 30);
    } else {
        doc.setTextColor(200, 0, 0); // Red for loss
        doc.text(`PÉRDIDA NETA ESTIMADA: ${formatCurrency(Math.abs(netProfit), user.currencySymbol)}`, 14, finalY3 + 30);
    }

    doc.setFont('helvetica', 'italic');
    doc.setFontSize(9);
    doc.setTextColor(120, 120, 120);
    doc.text('* Calculado sobre el precio de venta sugerido menos costos totales (insumos, mano de obra y costos indirectos).', 14, finalY3 + 38);

    const fileName = `Reporte_Gestion_${currentMonthName}_${currentYear}.pdf`;
    
    // Convert blob to Base64 for fallback
    const blobToBase64 = (blob: Blob): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string || '');
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    };

    try {
        const blob = doc.output('blob');
        const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

        // 1. Try Web Share API on mobile if supported
        if (isMobile && navigator.share) {
            const file = new File([blob], fileName, { type: 'application/pdf' });
            if (navigator.canShare && navigator.canShare({ files: [file] })) {
                try {
                    await navigator.share({
                        files: [file],
                        title: 'Reporte de Gestión',
                        text: `Reporte de Gestión - ${currentMonthName} ${currentYear}`,
                    });
                    console.log("PDF shared successfully via Web Share API");
                    return;
                } catch (shareError) {
                    if ((shareError as Error).name !== 'AbortError') {
                        console.error("Web Share API failed:", shareError);
                    } else {
                        return; // User cancelled the share sheet
                    }
                }
            }
        }

        // 2. Try FileSaver.js (most robust for blobs)
        try {
            saveAs(blob, fileName);
            console.log("PDF saved successfully via FileSaver.js");
        } catch (fileSaverError) {
            console.error("FileSaver.js failed, trying next fallback:", fileSaverError);
            
            // 3. Fallback: window.open (Blob URL) - Good for iOS Safari
            try {
                const url = URL.createObjectURL(blob);
                const win = window.open(url, '_blank');
                if (!win) throw new Error("Popup blocked");
                console.log("PDF opened in new tab via Blob URL");
            } catch (windowOpenError) {
                console.error("window.open(blob) failed, trying Base64:", windowOpenError);
                
                // 4. Last resort: Base64 Data URL (can skip some 'http/https only' blocks in WebViews)
                const base64data = await blobToBase64(blob);
                try {
                    // Try direct download link first
                    const link = document.createElement('a');
                    link.href = base64data;
                    link.download = fileName;
                    link.setAttribute('download', fileName);
                    link.target = '_blank';
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    console.log("PDF download triggered via Base64 fallback link");
                } catch (linkError) {
                    console.error("Base64 link failed, trying window.location.href:", linkError);
                    // Most aggressive fallback: redirect current window or open new
                    window.location.href = base64data;
                }
            }
        }
    } catch (error) {
        console.error("Critical error in PDF flow:", error);
        
        // Final attempt using standard jsPDF save
        try {
            doc.save(fileName);
        } catch (finalError) {
            console.error("doc.save also failed:", finalError);
            alert("No se pudo descargar automáticamente. Por favor use un navegador como Safari o Chrome.");
        }
    }
};
