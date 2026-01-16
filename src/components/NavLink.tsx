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
 * Aplica Heurísticas de Visibilidade e Feedback Tátil
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
            // --- Base UX Styles ---
            // Heurística #8: Minimalista e Consistente
            "relative inline-flex items-center justify-center transition-all duration-300 ease-in-out",
            "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background",
            "hover:opacity-100 active:scale-95 select-none cursor-pointer",
            
            // --- Link Common State ---
            className,

            // --- Heurística #1: Visibilidade do Sistema (Estado Ativo) ---
            isActive ? cn(
              "font-black scale-[1.05] z-10", // Ganho de autoridade visual
              "drop-shadow-[0_0_12px_rgba(var(--primary),0.3)]", // Glow sutil neon
              activeClassName
            ) : "opacity-70 hover:opacity-100 hover:translate-x-0.5 md:hover:translate-x-0 md:hover:-translate-y-0.5",

            // --- Estado Pendente (Feedback de Carregamento) ---
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