import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center relative overflow-hidden bg-[radial-gradient(circle_at_top,_rgba(190,255,100,0.22),_transparent_55%),radial-gradient(circle_at_bottom,_#020617,_#000000)] text-foreground">
      <div className="pointer-events-none absolute inset-0 opacity-[0.15] mix-blend-soft-light bg-[url('/images/noise.png')] bg-repeat" />

      <div className="relative glass-panel px-10 py-8 text-center hover-lift max-w-md mx-4">
        <div className="glass-glow" />
        <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground mb-3">
          LojinhaBoy Pro
        </p>
        <h1 className="text-5xl font-semibold mb-2">404</h1>
        <p className="text-sm text-muted-foreground mb-6">
          Rota <span className="font-mono">{location.pathname}</span> não foi
          encontrada. Verifique o endereço ou volte para o painel.
        </p>

        <Button asChild className="btn-neon-primary">
          <Link to="/dashboard">Voltar para o Dashboard</Link>
        </Button>

        <div className="mt-3 text-[11px] text-muted-foreground">
          ou&nbsp;
          <Link
            to="/"
            className="underline underline-offset-4 hover:text-primary"
          >
            ir para a tela inicial
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
