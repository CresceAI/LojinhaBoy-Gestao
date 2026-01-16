import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Home, SearchX, LifeBuoy, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

// 🦈 Mascote de Erro (Fundo Transparente)
import mascoteErro from "@/components/icons/mascote-erro.svg";

const NotFound = () => {
  const location = useLocation();

  // Efeito de "bolhas" subindo no fundo
  const bubbles = Array.from({ length: 12 }).map((_, i) => ({
    id: i,
    left: `${(i * 15) % 100}%`,
    duration: `${10 + (i % 5) * 2}s`,
    delay: `${i * 0.5}s`,
    size: 4 + (i % 4) * 2,
  }));

  useEffect(() => {
    console.error(
      "🦈 Shark Alert: Rota não encontrada:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center relative overflow-hidden bg-background text-foreground selection:bg-primary selection:text-black">
      
      {/* 🔮 Background Deep Ocean - Elementos de Luz */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[150px] opacity-60" />
        <div className="absolute bottom-0 left-1/4 w-[800px] h-[500px] bg-primary/10 rounded-full blur-[180px]" />
      </div>
      
      {/* 🫧 Bolhas Flutuantes (Animação Otimizada) */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-10">
        {bubbles.map((bubble) => (
          <div
            key={bubble.id}
            className="absolute bottom-[-20px] bg-primary/10 rounded-full backdrop-blur-sm animate-[float_linear_infinite]"
            style={{
              left: bubble.left,
              width: `${bubble.size}px`,
              height: `${bubble.size}px`,
              animationDuration: bubble.duration,
              animationDelay: bubble.delay,
            }}
          />
        ))}
        <style>
          {`
            @keyframes float {
              0% { transform: translateY(0) scale(1); opacity: 0; }
              10% { opacity: 0.4; }
              90% { opacity: 0.2; }
              100% { transform: translateY(-110vh) scale(1.5); opacity: 0; }
            }
          `}
        </style>
      </div>

      {/* Conteúdo Central Bento-style */}
      <div className="relative z-20 w-full max-w-xl px-6 py-12 text-center animate-fade-in">
        
        {/* Card Liquid Glass Premium */}
        <div className="glass-card border-white/5 bg-card/40 backdrop-blur-3xl rounded-[3.5rem] p-10 md:p-16 shadow-[0_30px_70px_rgba(0,0,0,0.5)] group hover:border-primary/20 transition-all duration-700">
          
          {/* Ilustração do Mascote */}
          <div className="flex justify-center mb-12 relative">
            {/* Glow pulsante atrás do mascote */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-primary/10 blur-[60px] rounded-full animate-pulse" />
            
            <img 
              src={mascoteErro} 
              alt="Shark Confuso" 
              className="w-56 h-56 object-contain relative z-10 drop-shadow-[0_20px_40px_rgba(0,0,0,0.5)] group-hover:scale-105 transition-transform duration-500" 
            />
            
            <div className="absolute -top-4 right-12 text-primary animate-tada">
               <SearchX size={48} className="opacity-60" />
            </div>
          </div>

          {/* Copywriting Shark */}
          <div className="space-y-4">
            <p className="text-[10px] font-black uppercase tracking-[0.5em] text-primary/60">
              Sonar Descalibrado
            </p>
            <h1 className="text-7xl font-black tracking-tighter text-foreground leading-none relative inline-block">
              404
              <span className="text-[10px] absolute -top-2 -right-14 bg-primary text-black px-3 py-1 rounded-full font-black rotate-12 uppercase tracking-widest shadow-lg shadow-primary/20">
                Perdido!
              </span>
            </h1>
            <h2 className="text-2xl font-black tracking-tight mt-4">
              Mergulhamos fundo demais...
            </h2>
            <p className="text-muted-foreground text-sm leading-relaxed max-w-xs mx-auto font-medium">
              Nosso radar vasculhou a banca, mas a rota <span className="text-primary font-mono bg-primary/10 px-2 py-0.5 rounded-lg text-[10px] border border-primary/10 inline-block align-middle truncate max-w-[150px]">{location.pathname}</span> não foi localizada.
            </p>
          </div>

          {/* Ações de Recuperação */}
          <div className="mt-12 space-y-6">
            <Button asChild className="w-full h-16 rounded-2xl bg-primary text-black font-black uppercase text-[10px] tracking-[0.2em] shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all border-none relative overflow-hidden group/btn">
              <Link to="/dashboard" className="flex items-center justify-center gap-3">
                <LifeBuoy className="w-5 h-5 group-hover/btn:animate-spin" />
                Retornar ao Dashboard
              </Link>
            </Button>
            
            <div>
              <Link
                to="/"
                className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground hover:text-primary transition-all group/link"
              >
                <ArrowLeft className="w-4 h-4 transition-transform group-hover/link:-translate-x-1" />
                Tela Inicial
              </Link>
            </div>
          </div>
        </div>

        {/* Assinatura Semântica sutil */}
        <p className="mt-12 text-[8px] font-black uppercase tracking-[0.8em] text-muted-foreground/20 pointer-events-none">
          LojinhaBoy Pro • Deep Ocean System
        </p>
      </div>
    </div>
  );
};

export default NotFound;