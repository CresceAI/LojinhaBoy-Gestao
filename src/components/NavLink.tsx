import { NavLink as RouterNavLink, NavLinkProps } from "react-router-dom";
import { forwardRef, memo } from "react";
import { cn } from "@/lib/utils";

interface NavLinkCompatProps extends Omit<NavLinkProps, "className"> {
  className?: string;
  activeClassName?: string;
  pendingClassName?: string;
}

/**
 * NavLink Refinado - Shark Edition
 * Foco em: Visibilidade Total, Feedback Neon e Precisão Mobile
 */
const NavLink = memo(forwardRef<HTMLAnchorElement, NavLinkCompatProps>(
  ({ 
    className, 
    activeClassName, 
    pendingClassName, 
    to, 
    children, 
    ...props 
  }, ref) => {
    return (
      <RouterNavLink
        ref={ref}
        to={to}
        className={({ isActive, isPending }) =>
          cn(
            // --- Base UX Styles (Heurística #8) ---
            "relative inline-flex items-center justify-center transition-all duration-300 ease-in-out",
            "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background",
            "hover:opacity-100 active:scale-95 select-none cursor-pointer",
            
            // --- Estado Padrão (Não Selecionado) ---
            "text-muted-foreground/60 hover:text-foreground",
            className,

            // --- Heurística #1: Visibilidade (Estado Ativo Neon) ---
            isActive ? cn(
              // Cor Primária Forçada (Verde Shark) para não ficar transparente
              "text-primary font-black scale-[1.05] z-10 opacity-100", 
              "drop-shadow-[0_0_8px_rgba(var(--primary-rgb),0.5)]", // Glow se houver variável RGB
              "after:absolute after:-bottom-1 after:left-1/2 after:-translate-x-1/2 after:w-1 after:h-1 after:bg-primary after:rounded-full after:shadow-[0_0_10px_#4ade80]", // Ponto indicador neon
              activeClassName
            ) : "hover:translate-x-0.5 md:hover:translate-x-0 md:hover:-translate-y-0.5",

            // --- Feedback de Carregamento ---
            isPending && cn(
              "animate-pulse cursor-wait opacity-50",
              pendingClassName
            )
          )
        }
        {...props}
      >
        {children}
      </RouterNavLink>
    );
  }
));

NavLink.displayName = "NavLink";

export { NavLink };