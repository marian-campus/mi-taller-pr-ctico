import { createClient } from '@supabase/supabase-js';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import fs from 'fs';
import path from 'path';

// Helper to format currency (local port of src/lib/format.ts)
const formatCurrency = (amount: number, symbol: string = '$'): string => {
  return symbol + ' ' + amount.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Manejo de CORS (opcional si es del mismo dominio, pero bueno para pruebas)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { userSettings, products, expenses, totalExpenses, totalProjectedProfit, projection, selectedMonth, selectedYear } = req.body;

    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Supabase configuration missing (URL or Service Role Key)');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Obtener el ID del usuario desde el header de autorización (si existe)
    // O usar un ID genérico si no lo pasamos, pero para seguridad es mejor identificarlo.
    const authHeader = req.headers.get?.('authorization') || req.headers['authorization'];
    let userId = 'anonymous';
    
    if (authHeader && typeof authHeader === 'string') {
        const { data: { user }, error: authError } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
        if (!authError && user) {
            userId = user.id;
        }
    }

    // 1. LIMPIEZA PREVIA (Lazy Cleanup)
    const { data: oldFiles } = await supabase.storage.from('reports').list(userId);
    if (oldFiles && oldFiles.length > 0) {
      const filesToDelete = oldFiles.map(f => `${userId}/${f.name}`);
      await supabase.storage.from('reports').remove(filesToDelete);
    }

    // 2. GENERACIÓN DEL PDF
    const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    const now = new Date();
    const reportMonth = selectedMonth !== undefined ? selectedMonth : now.getMonth();
    const reportYear = selectedYear !== undefined ? selectedYear : now.getFullYear();
    const currentMonthName = months[reportMonth];
    
    const doc = new jsPDF();
    
    // 2.1 Logo y Encabezado
    try {
      const logoPath = path.join(process.cwd(), 'public', 'logo.png');
      if (fs.existsSync(logoPath)) {
        const logoData = fs.readFileSync(logoPath).toString('base64');
        doc.addImage(logoData, 'PNG', 14, 10, 18, 18);
      }
    } catch (e) {
      console.error('Error loading logo in PDF:', e);
    }

    const title = `Reporte de Gestión - ${currentMonthName} ${reportYear}`;

    doc.setFontSize(20);
    doc.text(String(title), 14, 38);
    doc.setFontSize(10);
    doc.text(`Negocio: ${userSettings.businessName}`, 14, 46);
    doc.text(`Emprendedor: ${userSettings.name}`, 14, 51);

    const activeExpenses = expenses.filter((e: any) => e.includedInFixedCosts !== false);
    autoTable(doc, {
      startY: 65,
      head: [['Descripción', 'Categoría', 'Monto']],
      body: activeExpenses.map((e: any) => [e.description, e.category, formatCurrency(e.amount, userSettings.currencySymbol)]),
      foot: [['Total Gastos', '', formatCurrency(totalExpenses, userSettings.currencySymbol)]],
      theme: 'striped',
      headStyles: { fillColor: [100, 100, 255] }
    });

    const finalY1 = (doc as any).lastAutoTable.finalY + 15;
    doc.text('2. Productos Activos y Costos', 14, finalY1);
    const activeProducts = products.filter((p: any) => p.active !== false);
    autoTable(doc, {
      startY: finalY1 + 5,
      head: [['Producto', 'Categoría', 'Costo Unit.', 'Precio Venta']],
      body: activeProducts.map((p: any) => [p.name, p.category, formatCurrency(p.totalCost, userSettings.currencySymbol), p.sellingPrice ? formatCurrency(p.sellingPrice, userSettings.currencySymbol) : '-']),
      theme: 'grid',
      headStyles: { fillColor: [50, 180, 120] }
    });

    const finalY2 = (doc as any).lastAutoTable.finalY + 15;
    doc.text('3. Proyección de Rentabilidad', 14, finalY2);
    const simulatorData = activeProducts.map((p: any) => {
      const proj = projection[p.id] || { enabled: true, qty: '0' };
      const qty = parseInt(proj.qty) || 0;
      const profitPerUnit = (p.sellingPrice || 0) - p.totalCost;
      return [p.name, qty.toString(), formatCurrency(profitPerUnit, userSettings.currencySymbol), formatCurrency(profitPerUnit * qty, userSettings.currencySymbol)];
    }).filter(row => row[1] !== '0');

    autoTable(doc, {
      startY: finalY2 + 5,
      head: [['Producto', 'Cant.', 'Ganancia u.', 'Subtotal']],
      body: simulatorData.length > 0 ? simulatorData : [['No hay ventas proyectadas', '-', '-', '-']],
      theme: 'striped',
      headStyles: { fillColor: [240, 100, 100] }
    });

    const finalY3 = (doc as any).lastAutoTable.finalY + 15;
    const netProfit = totalProjectedProfit - totalExpenses;
    doc.setFontSize(14);
    doc.text(`Total Bruto: ${formatCurrency(totalProjectedProfit, userSettings.currencySymbol)}`, 14, finalY3 + 10);
    doc.text(`Gastos: ${formatCurrency(totalExpenses, userSettings.currencySymbol)}`, 14, finalY3 + 20);
    doc.setTextColor(netProfit >= 0 ? 0 : 200, netProfit >= 0 ? 150 : 0, 0);
    doc.text(`GANANCIA NETA: ${formatCurrency(netProfit, userSettings.currencySymbol)}`, 14, finalY3 + 30);

    const fileName = `Reporte_${currentMonthName}_${reportYear}_${Date.now()}.pdf`;
    const pdfBuffer = Buffer.from(doc.output('arraybuffer'));

    // 3. SUBIR A STORAGE
    const { error: uploadError } = await supabase.storage
      .from('reports')
      .upload(`${userId}/${fileName}`, pdfBuffer, {
        contentType: 'application/pdf',
        upsert: true
      });

    if (uploadError) throw uploadError;

    // 4. GENERAR SIGNED URL
    const { data: signedData, error: signedError } = await supabase.storage
      .from('reports')
      .createSignedUrl(`${userId}/${fileName}`, 300);

    if (signedError) throw signedError;

    return res.status(200).json({ url: signedData.signedUrl });

  } catch (error: any) {
    console.error('Error generating PDF:', error);
    return res.status(500).json({ error: error.message });
  }
}
