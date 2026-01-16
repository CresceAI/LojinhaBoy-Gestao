import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronRight, ChevronLeft, X, Trophy, Target, Zap, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import { differenceInDays, parseISO } from "date-fns";

// 🦈 Mascotes Shark
import mascoteDash from "@/components/icons/mascote-dash.svg";
import mascoteOk from "@/components/icons/mascote-ok.svg";
import mascoteAlerta from "@/components/icons/mascote-alerta.svg";
import mascoteData from "@/components/icons/mascote-data.svg";

const steps = [
  {
    title: "Bem-vindo ao topo da cadeia alimentar",
    description: "Você está operando a Shark Engine, o sistema soberano para quem domina o mercado de crédito. Autoridade e controle total.",
    mascot: mascoteOk,
    module: "Autoridade Shark",
    color: "text-primary",
    glow: "bg-primary/20",
    icon: Trophy
  },
  {
    title: "Patrimônio sob seu controle",
    description: "Saiba exatamente quanto de lucro real já está no seu bolso e quanto capital está girando nas ruas com precisão cirúrgica.",
    mascot: mascoteDash,
    module: "Gestão de Capital",
    color: "text-emerald-500",
    glow: "bg-emerald-500/20",
    icon: Target
  },
  {
    title: "Radar Shark: A hora da caça",
    description: "Nosso sonar identifica cada centavo que deve entrar hoje. Quando o radar brilhar, ataque as cobranças com agilidade.",
    mascot: mascoteAlerta,
    module: "Inteligência de Campo",
    color: "text-primary",
    glow: "bg-primary/20",
    icon: Zap
  },
  {
    title: "Métricas para decisões brutais",
    description: "Transforme dados em poder. Analise contratos ativos e lucro projetado para escalar sua operação para o próximo nível.",
    mascot: mascoteData,
    module: "Estratégia de Dados",
    color: "text-blue-500",
    glow: "bg-blue-500/20",
    icon: BarChart3
  }
];

const Onboarding = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const navigate = useNavigate();
  const { user } = useAuth();

  // --- LÓGICA DE PERSISTÊNCIA CORRIGIDA ---
  useEffect(() => {
    if (!user?.email) return;

    const keySession = `shark_session_seen_${user.email}`;
    const keyLongTerm = `shark_last_onboarding_${user.email}`;
    
    const hasSeenInSession = sessionStorage.getItem(keySession);
    const lastSeenDate = localStorage.getItem(keyLongTerm);

    // Regra: Se já viu nesta sessão (login atual) OU viu há menos de 30 dias, PULA.
    if (hasSeenInSession === "true") {
      navigate("/dashboard");
      return;
    }

    if (lastSeenDate) {
      const daysSinceLastSeen = differenceInDays(new Date(), parseISO(lastSeenDate));
      if (daysSinceLastSeen < 30) {
        navigate("/dashboard");
        return;
      }
    }
  }, [user, navigate]);

  const handleFinish = () => {
    if (user?.email) {
      // Salva na sessão (para não repetir enquanto estiver logado)
      sessionStorage.setItem(`shark_session_seen_${user.email}`, "true");
      // Salva no HD (para a regra dos 30 dias)
      localStorage.setItem(`shark_last_onboarding_${user.email}`, new Date().toISOString());
    }
    navigate("/dashboard");
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleFinish();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) setCurrentStep(currentStep - 1);
  };

  const current = steps[currentStep];
  const StepIcon = current.icon;

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6 relative overflow-hidden font-sans">
      
      {/* 🔮 Visual Atmosphere */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className={cn(
          "absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full blur-[140px] transition-colors duration-1000 opacity-20",
          current.glow
        )} />
      </div>

      <div className="w-full max-w-2xl z-10 space-y-8 animate-fade-in">
        
        {/* Barra de Progresso (Visível em Light/Dark) */}
        <div className="flex items-center justify-between px-4">
          <div className="flex gap-3 flex-1 mr-12">
            {steps.map((_, index) => (
              <div 
                key={index}
                className={cn(
                  "h-1.5 rounded-full transition-all duration-700 flex-1",
                  index <= currentStep 
                    ? 'bg-primary shadow-[0_0_15px_rgba(var(--primary),0.5)]' 
                    : 'bg-muted dark:bg-white/10'
                )}
              />
            ))}
          </div>
          <button 
            onClick={handleFinish} 
            className="text-muted-foreground hover:text-foreground transition-all p-2 active:scale-90"
          >
            <X size={24} />
          </button>
        </div>

        {/* Card Liquid Glass Bento */}
        <div className="glass-card border-border/40 dark:border-white/5 bg-card/60 dark:bg-card/40 backdrop-blur-3xl rounded-[3.5rem] p-8 md:p-16 shadow-2xl relative overflow-hidden min-h-[650px] flex flex-col justify-between group transition-all">
          
          <div className={cn(
            "absolute -top-24 -left-24 w-64 h-64 blur-[100px] rounded-full transition-all duration-1000 opacity-30",
            current.glow
          )} />

          {/* Mascote SVG */}
          <div className="flex justify-center relative z-10 py-6">
            <img 
                src={current.mascot} 
                alt="Shark" 
                className="w-48 h-48 md:w-64 md:h-64 object-contain relative z-10 transition-transform duration-700 transform hover:scale-105 drop-shadow-[0_20px_50px_rgba(0,0,0,0.2)] dark:drop-shadow-[0_20px_50px_rgba(0,0,0,0.7)]" 
            />
          </div>

          {/* Conteúdo: Títulos com text-foreground para Tema Claro */}
          <div className="space-y-6 text-center md:text-left relative z-10">
            <div className="flex items-center justify-center md:justify-start gap-3">
               <div className={cn("p-2.5 rounded-2xl bg-primary/10 border border-primary/20", current.color)}>
                 <StepIcon size={20} />
               </div>
               <span className={cn("text-[11px] font-black uppercase tracking-[0.4em]", current.color)}>
                {current.module}
              </span>
            </div>
            
            <div className="space-y-4">
                <h2 className="text-3xl md:text-5xl font-black tracking-tighter text-foreground leading-none">
                  {current.title}
                </h2>
                <p className="text-muted-foreground text-base md:text-xl leading-relaxed font-medium max-w-xl">
                  {current.description}
                </p>
            </div>
          </div>

          {/* Navegação */}
          <div className="flex items-center gap-4 mt-12 relative z-10">
            {currentStep > 0 && (
              <button 
                onClick={handleBack}
                className="h-16 w-16 rounded-2xl border border-border bg-secondary/50 flex items-center justify-center text-muted-foreground hover:text-foreground transition-all active:scale-90"
              >
                <ChevronLeft size={32} />
              </button>
            )}
            
            <Button 
              onClick={handleNext}
              className="flex-1 h-16 rounded-2xl bg-primary text-primary-foreground font-black uppercase text-[11px] tracking-[0.2em] shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all border-none relative overflow-hidden group/btn"
            >
              <span className="relative z-10 flex items-center justify-center gap-2">
                {currentStep === steps.length - 1 ? "Assumir Comando" : "Próximo Passo"}
                <ChevronRight size={20} strokeWidth={3} className="group-hover/btn:translate-x-1 transition-transform" />
              </span>
            </Button>
          </div>
        </div>

        {/* Footer Semântico */}
        <div className="text-center space-y-2 opacity-40 dark:opacity-20">
           <p className="text-[10px] font-black uppercase tracking-[0.6em] text-foreground dark:text-white leading-none">Shark Pro • Engine Soberana</p>
           <p className="text-[8px] font-bold text-foreground dark:text-white tracking-[0.3em]">Engineered by Renato Filho</p>
        </div>
      </div>
    </div>
  );
};

export default Onboarding;