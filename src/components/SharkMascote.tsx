import { cn } from "@/lib/utils";
import { memo } from "react";

// ✅ IMPORTAÇÃO OFICIAL PARA VITE (Garante que as imagens não quebrem no deploy)
import alerta from '@/components/icons/mascote-alerta.svg';
import cartao from '@/components/icons/mascote-cartao.svg';
import dash from '@/components/icons/mascote-dash.svg';
import data from '@/components/icons/mascote-data.svg';
import erro from '@/components/icons/mascote-erro.svg';
import notificacao from '@/components/icons/mascote-notificacao.svg';
import ok from '@/components/icons/mascote-ok.svg';

const MASCOTE_MAP = {
  alerta,
  cartao,
  dash,
  data,
  erro,
  notificacao,
  ok
};

type MascoteType = keyof typeof MASCOTE_MAP;

interface SharkMascoteProps {
  type: MascoteType;
  className?: string;
  size?: number;
  animate?: boolean;
  glow?: boolean;
}

/**
 * SharkMascote - Branding System CrediTrack
 * Refinado com Heurística de Feedback Visual e Estética Liquid Glass
 */
export const SharkMascote = memo(({ 
  type, 
  className, 
  size = 120, 
  animate = true,
  glow = true
}: SharkMascoteProps) => {
  
  const src = MASCOTE_MAP[type];
  
  return (
    <div 
      className={cn(
        "relative flex items-center justify-center transition-all duration-700 ease-in-out",
        animate && "hover:scale-110 active:scale-95 animate-float", // Adicionada animação de flutuação
        className
      )}
      style={{ width: size, height: size }}
    >
      {/* ✅ Glow de fundo ajustado para Design System HSL */}
      {glow && (
        <div className="absolute inset-0 bg-primary/20 rounded-full blur-[40px] opacity-30 animate-pulse pointer-events-none" />
      )}
      
      <img 
        src={src} 
        alt={`Shark ${type}`}
        className={cn(
          "relative z-10 w-full h-full object-contain transition-transform duration-500",
          // Sombra neon que respeita a cor primária do tema
          "drop-shadow-[0_10px_20px_rgba(var(--primary-rgb,74,222,128),0.4)]"
        )}
        onDragStart={(e) => e.preventDefault()}
      />
    </div>
  );
});

SharkMascote.displayName = "SharkMascote";