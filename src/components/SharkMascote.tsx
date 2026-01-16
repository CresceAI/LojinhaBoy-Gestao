import { cn } from "@/lib/utils";

type MascoteType = 
  | 'alerta' | 'cartao' | 'dash' | 'data' 
  | 'erro' | 'notificacao' | 'ok';

interface SharkMascoteProps {
  type: MascoteType;
  className?: string;
  size?: number;
  animate?: boolean;
}

export const SharkMascote = ({ 
  type, 
  className, 
  size = 120, 
  animate = true 
}: SharkMascoteProps) => {
  
  const src = `/src/components/icons/mascote-${type}.svg`;
  
  return (
    <div className={cn(
      "relative flex items-center justify-center transition-all duration-500",
      animate && "hover:scale-110 active:scale-95",
      className
    )}>
      {/* Glow de fundo para efeito Liquid Glass */}
      <div className="absolute inset-0 bg-primary/10 rounded-full blur-2xl opacity-40 animate-pulse" />
      
      <img 
        src={src} 
        alt={`Mascote ${type}`}
        width={size}
        height={size}
        className="relative z-10 drop-shadow-[0_8px_24px_rgba(var(--primary),0.3)]"
        // Previne arraste da imagem (UX refinement)
        onDragStart={(e) => e.preventDefault()}
      />
    </div>
  );
};