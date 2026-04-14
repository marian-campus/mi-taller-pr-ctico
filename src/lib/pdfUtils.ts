import { supabase } from './supabase';
import { Product, Expense, UserSettings } from '@/types';
import { toast } from 'sonner';

/**
 * Triggers the download of a real HTTPS URL (Signed URL from Supabase)
 * This works on mobile devices where Blob URLs are often blocked.
 */
export const downloadReportFromUrl = (url: string) => {
    console.log(`[PDF] Attempting download from real URL: ${url}`);
    
    // Most direct method for mobile
    window.location.assign(url);
    
    toast.success('Iniciando descarga...');
};

/**
 * Main function: Calls the Vercel Function to generate PDF on server
 */
export const generateManagementReport = async (
    userSettings: UserSettings,
    products: Product[],
    expenses: Expense[],
    totalExpenses: number,
    totalProjectedProfit: number,
    projection: Record<string, { enabled: boolean; qty: string }>,
    selectedMonth?: number,
    selectedYear?: number
) => {
    const toastId = toast.loading('Generando reporte en el servidor...');

    try {
        console.log("[PDF] Calling Vercel API '/api/generate-pdf'...");
        
        // Get the session to pass the authorization header
        const { data: { session } } = await supabase.auth.getSession();

        const response = await fetch('/api/generate-pdf', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': session ? `Bearer ${session.access_token}` : ''
            },
            body: JSON.stringify({
                userSettings,
                products,
                expenses,
                totalExpenses,
                totalProjectedProfit,
                projection,
                selectedMonth,
                selectedYear
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Error en la respuesta del servidor');
        }

        const data = await response.json();

        if (!data?.url) throw new Error('No se recibió la URL del reporte');

        console.log("[PDF] Success! Received Signed URL.");
        toast.dismiss(toastId);
        
        // Trigger download
        downloadReportFromUrl(data.url);
        
        // 🎉 Mensaje especial para validadores (aparece 2s después para no interrumpir la descarga)
        setTimeout(() => {
            toast.success(
                '¡Gracias por probar la app! No olvides completar la encuesta de feedback 📋',
                {
                    id: 'feedback-reminder',
                    duration: 8000,
                    description: 'Tu opinión es muy importante para mejorar Mi Taller Contable.',
                }
            );
        }, 2000);

    } catch (err: any) {
        console.error("[PDF] Error in server-side generation:", err);
        toast.error(`Error: ${err.message || 'No se pudo generar el reporte'}`, { id: toastId });
    }
};

// Compatibility export (legacy helper if needed, but we now use generateManagementReport)
export const createManagementReportBlob = () => {
    throw new Error("createManagementReportBlob is deprecated. Use generateManagementReport (Server-side).");
};

export const downloadReport = () => {
    throw new Error("downloadReport is deprecated. Use downloadReportFromUrl (Server-side).");
};
