import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7"
import { jsPDF } from "https://esm.sh/jspdf@2.5.1"
import autoTable from "https://esm.sh/jspdf-autotable@3.8.2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Helper to format currency (local port of src/lib/format.ts)
const formatCurrency = (amount: number, symbol: string = '$'): string => {
  const isNegative = amount < 0;
  const absAmount = Math.abs(amount);
  const formatted = absAmount.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return isNegative ? `-${symbol} ${formatted}` : `${symbol} ${formatted}`;
};

serve(async (req) => {
  // Manejo de CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Obtener el usuario del JWT para seguridad
    const authHeader = req.headers.get('Authorization')!
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(authHeader.replace('Bearer ', ''))

    if (authError || !user) {
      throw new Error('No autorizado')
    }

    const { userSettings, products, expenses, totalExpenses, totalProjectedProfit, projection, selectedMonth, selectedYear } = await req.json()

    // 1. LIMPIEZA PREVIA (Lazy Cleanup)
    // Borramos archivos viejos del usuario en el bucket 'reports' para no acumular basura
    const { data: oldFiles } = await supabaseClient.storage.from('reports').list(user.id)
    if (oldFiles && oldFiles.length > 0) {
      const filesToDelete = oldFiles.map(f => `${user.id}/${f.name}`)
      await supabaseClient.storage.from('reports').remove(filesToDelete)
    }

    // 2. GENERACIÓN DEL PDF
    const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    const now = new Date();
    const reportMonth = selectedMonth !== undefined ? selectedMonth : now.getMonth();
    const reportYear = selectedYear !== undefined ? selectedYear : now.getFullYear();
    const currentMonthName = months[reportMonth];
    
    // @ts-ignore: jspdf types in deno
    const doc = new jsPDF();
    const title = `Reporte de Gestión - ${currentMonthName} ${reportYear}`;

    doc.setFontSize(20);
    doc.text(String(title), 14, 22);
    doc.setFontSize(10);
    doc.text(`Negocio: ${userSettings.businessName}`, 14, 30);
    doc.text(`Emprendedor: ${userSettings.name}`, 14, 35);

    // Gastos
    const activeExpenses = expenses.filter((e: any) => e.includedInFixedCosts !== false);
    autoTable(doc, {
      startY: 55,
      head: [['Descripción', 'Categoría', 'Monto']],
      body: activeExpenses.map((e: any) => [e.description, e.category, formatCurrency(e.amount, userSettings.currencySymbol)]),
      foot: [['Total Gastos', '', formatCurrency(totalExpenses, userSettings.currencySymbol)]],
      theme: 'striped',
      headStyles: { fillColor: [100, 100, 255] }
    });

    // Productos
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

    // Proyecciones
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
    
    let resultLabel = 'Punto de equilibrio (sin ganancias ni pérdidas)';
    if (netProfit > 0) {
      resultLabel = 'Ganancia estimada';
      doc.setTextColor(22, 163, 74);
    } else if (netProfit < 0) {
      resultLabel = 'Pérdida estimada';
      doc.setTextColor(220, 38, 38);
    } else {
      doc.setTextColor(0, 0, 0);
    }
    
    doc.text(`${resultLabel}: ${formatCurrency(netProfit, userSettings.currencySymbol)}`, 14, finalY3 + 30);

    const fileName = `Reporte_${currentMonthName}_${reportYear}_${Date.now()}.pdf`;
    const pdfOutput = doc.output('arraybuffer');

    // 3. SUBIR A STORAGE
    const { error: uploadError } = await supabaseClient.storage
      .from('reports')
      .upload(`${user.id}/${fileName}`, pdfOutput, {
        contentType: 'application/pdf',
        upsert: true
      })

    if (uploadError) throw uploadError

    // 4. GENERAR SIGNED URL
    const { data: signedData, error: signedError } = await supabaseClient.storage
      .from('reports')
      .createSignedUrl(`${user.id}/${fileName}`, 300) // 5 minutos de validez

    if (signedError) throw signedError

    return new Response(
      JSON.stringify({ url: signedData.signedUrl }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})
