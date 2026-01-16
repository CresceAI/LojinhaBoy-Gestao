import { useState, useEffect } from "react";
import { SharkMascote } from "./SharkMascote";
import { Button } from "./ui/button";
import { X, Download } from "lucide-react";
import { cn } from "@/lib/utils";

export const InstallPrompt = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handler = (e: any) => {
      // Previne o prompt padrão do Chrome para usarmos o nosso (Heurística #8)
      e.preventDefault();
      setDeferredPrompt(e);
      
      // Mostra o prompt após 5 segundos para não ser invasivo
      setTimeout(() => setIsVisible(true), 5000);
    };

    window.addEventListener("beforeinstallprompt", handler);

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === "accepted") {
      console.log("🦈 [Creditrack] Usuário aceitou a instalação.");
      setIsVisible(false);
    }
    setDeferredPrompt(null);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-24 left-6 right-6 z-[100] animate-in fade-in slide-in-from-bottom-10 duration-700 pointer-events-none">
      <div className={cn(
        "relative w-full max-w-sm mx-auto pointer-events-auto",
        "bg-card/40 backdrop-blur-3xl border border-white/10 p-6 rounded-[2.5rem] shadow-2xl overflow-hidden",
        "before:absolute before:inset-0 before:bg-gradient-to-tr before:from-primary/10 before:to-transparent before:-z-10"
      )}>
        {/* Botão Fechar */}
        <button 
          onClick={() => setIsVisible(false)}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-white/5 transition-colors"
        >
          <X size={18} className="text-muted-foreground" />
        </button>

        <div className="flex items-center gap-5">
          {/* Seu Mascote OK como selo de qualidade */}
          <SharkMascote type="ok" size={80} className="shrink-0" />

          <div className="flex flex-col space-y-1">
            <h3 className="text-sm font-black uppercase tracking-[0.2em] text-primary">
              Creditrack App
            </h3>
            <p className="text-[11px] font-bold text-foreground leading-snug">
              Instale na tela inicial para acesso instantâneo e modo offline.
            </p>
          </div>
        </div>

        <div className="mt-6 flex gap-3">
          <Button 
            onClick={handleInstall}
            className="flex-1 h-12 rounded-2xl bg-primary text-black font-black uppercase text-xs tracking-widest shadow-lg shadow-primary/20"
          >
            <Download size={16} className="mr-2" /> Instalar Agora
          </Button>
        </div>
      </div>
    </div>
  );
};