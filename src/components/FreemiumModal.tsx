import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Lock, Sparkles, Rocket } from "lucide-react";
import { useApp } from "@/context/AppContext";

export default function FreemiumModal() {
  const { isFreemiumModalOpen, setFreemiumModalOpen } = useApp();

  return (
    <Dialog open={isFreemiumModalOpen} onOpenChange={setFreemiumModalOpen}>
      <DialogContent className="sm:max-w-md bg-card border-none shadow-2xl rounded-3xl overflow-hidden">
        {/* Background Decorative Gradient */}
        <div className="absolute top-0 inset-x-0 h-32 bg-gradient-to-br from-primary/30 via-primary/5 to-transparent pointer-events-none" />
        
        <div className="relative pt-6 px-2 flex flex-col items-center text-center space-y-4">
          <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center border-4 border-background shadow-sm mb-2">
            <Rocket className="h-10 w-10 text-primary" strokeWidth={1.5} />
          </div>
          
          <DialogHeader className="text-center space-y-2">
            <DialogTitle className="text-2xl font-black text-foreground">
              ¡Has alcanzado el límite de la versión gratuita!
            </DialogTitle>
            <DialogDescription className="text-base text-muted-foreground pt-2">
              Para seguir creando <strong className="text-foreground">productos ilimitados</strong>, acceder a las asesorías de Conta (IA) y descargar reportes PDF profesionales, suscríbete al Plan Pro.
            </DialogDescription>
          </DialogHeader>

          <div className="w-full space-y-3 pt-4 pb-2">
            <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/50 text-sm font-medium text-left">
              <Sparkles className="h-5 w-5 text-primary shrink-0" />
              <span>Crea infinitas recetas y materiales</span>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/50 text-sm font-medium text-left">
              <Lock className="h-5 w-5 text-primary shrink-0" />
              <span>Desbloquea exportación a PDF y Asesor IA</span>
            </div>
          </div>

          <Button 
            disabled 
            className="w-full h-12 text-md font-bold rounded-xl mt-2 opacity-80 cursor-not-allowed border-2 border-primary"
            variant="default"
          >
            Próximamente: Suscribirme al Plan Pro
          </Button>
          
          <button 
            onClick={() => setFreemiumModalOpen(false)}
            className="text-xs text-muted-foreground hover:text-foreground font-medium pt-2 pb-4 transition-colors"
          >
            Quizás más tarde
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
