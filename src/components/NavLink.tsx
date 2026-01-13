import { NavLink as RouterNavLink, NavLinkProps } from "react-router-dom";
import { forwardRef, memo } from "react";
import { cn } from "@/lib/utils";

interface NavLinkCompatProps extends Omit<NavLinkProps, "className"> {
  className?: string;
  activeClassName?: string;
  pendingClassName?: string;
}

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
            "transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
            className,
            isActive && [
              "font-black shadow-lg scale-[1.02]",
              activeClassName
            ],
            isPending && pendingClassName
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
