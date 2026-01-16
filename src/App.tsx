import { Suspense, lazy, memo, useEffect, useState } from "react";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { 
  createBrowserRouter, 
  RouterProvider, 
  Outlet, 
  Navigate 
} from "react-router-dom";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { ReactNode } from "react";

// 🔧 Lazy Loading - Incluindo o Onboarding
const Login = lazy(() => import("./pages/Login"));
const Onboarding = lazy(() => import("./pages/Onboarding")); // ✅ Adicionado
const Layout = lazy(() => import("./components/Layout"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Clientes = lazy(() => import("./pages/Clientes"));
const Emprestimos = lazy(() => import("./pages/Emprestimos"));
const Notificacoes = lazy(() => import("./pages/Notificacoes"));
const Cobranca = lazy(() => import("./pages/Cobranca"));
const RelatoriosAvancados = lazy(() => import("./pages/RelatoriosAvancados"));
const ParcelasDetalhadas = lazy(() => import("./pages/ParcelasDetalhadas"));
const NotFound = lazy(() => import("./pages/NotFound"));

// 🛡️ QueryClient Otimizado
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 10,
      gcTime: 1000 * 60 * 30,
      retry: (failureCount, error: any) => {
        if ([401, 403, 404].includes(error?.status)) return false;
        return failureCount < 2;
      },
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
      networkMode: 'always' as const,
    },
    mutations: { retry: false },
  },
});

// 🛡️ Error Boundary
const GlobalErrorBoundary = ({ children }: { children: ReactNode }) => {
  const [hasError, setHasError] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    const handleError = (error: ErrorEvent) => {
      if (error.message.includes("chunk") || error.message.includes("Loading chunk")) {
        window.location.reload(); 
      }
      setHasError(true);
      setErrorMsg(error.message);
    };
    window.addEventListener("error", handleError);
    return () => window.removeEventListener("error", handleError);
  }, []);

  if (hasError) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-8 bg-black text-white">
        <div className="text-center max-w-md space-y-6">
          <div className="w-16 h-16 mx-auto bg-primary/20 rounded-full flex items-center justify-center text-2xl">⚠️</div>
          <h2 className="text-2xl font-black italic">Sistema Interrompido</h2>
          <p className="text-muted-foreground text-sm">{errorMsg}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="w-full py-4 bg-primary text-[#020617] rounded-2xl font-black uppercase text-xs tracking-widest active:scale-95 transition-transform"
          >
            Recarregar Banca
          </button>
        </div>
      </div>
    );
  }
  return <>{children}</>;
};

const GlobalLoading = () => (
  <div className="min-h-screen flex flex-col items-center justify-center bg-background">
    <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin mb-4" />
    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground animate-pulse">
      Creditrack Pro
    </p>
  </div>
);

// ✅ PROTECTED ROUTE - Para páginas COM o Layout (Sidebar/Nav)
const ProtectedRoute = () => {
  const { user, loading } = useAuth();
  if (loading) return <GlobalLoading />;
  if (!user) return <Navigate to="/login" replace />;

  return (
    <Suspense fallback={<GlobalLoading />}>
      <Layout>
        <Outlet />
      </Layout>
    </Suspense>
  );
};

// ✅ SIMPLE PROTECTED ROUTE - Para o Onboarding (SEM Sidebar/Nav)
const SimpleProtectedRoute = () => {
  const { user, loading } = useAuth();
  if (loading) return <GlobalLoading />;
  if (!user) return <Navigate to="/login" replace />;

  return (
    <Suspense fallback={<GlobalLoading />}>
      <Outlet />
    </Suspense>
  );
};

const router = createBrowserRouter([
  {
    path: "/",
    errorElement: <Suspense fallback={<GlobalLoading />}><NotFound /></Suspense>,
    children: [
      {
        path: "login",
        element: (
          <Suspense fallback={<GlobalLoading />}>
            <Login />
          </Suspense>
        ),
      },
      // 🦈 Rota de Onboarding: Protegida mas em tela cheia (sem Layout)
      {
        path: "onboarding",
        element: <SimpleProtectedRoute />,
        children: [
          { index: true, element: <Onboarding /> }
        ]
      },
      // 🦈 Rotas do Sistema: Protegidas e com Layout
      {
        path: "/",
        element: <ProtectedRoute />,
        children: [
          { index: true, element: <Navigate to="dashboard" replace /> },
          { path: "dashboard", element: <Dashboard /> },
          { path: "clientes", element: <Clientes /> },
          { path: "emprestimos", element: <Emprestimos /> },
          { path: "emprestimos/:emprestimoId/parcelas", element: <ParcelasDetalhadas /> },
          { path: "notificacoes", element: <Notificacoes /> },
          { path: "cobranca", element: <Cobranca /> },
          { path: "relatorios", element: <RelatoriosAvancados /> },
        ],
      },
    ],
  },
]);

const App = memo(() => {
  useEffect(() => {
    if (import.meta.env.PROD && 'serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').catch(err => {
          console.warn('SW registration failed:', err);
        });
      });
    }
  }, []);

  return (
    <GlobalErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <AuthProvider>
            <RouterProvider router={router} />
            <Toaster />
          </AuthProvider>
        </TooltipProvider>
      </QueryClientProvider>
    </GlobalErrorBoundary>
  );
});

App.displayName = "App";

export default App;