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

// 🔧 Lazy Loading (Performance)
const Login = lazy(() => import("./pages/Login"));
const Layout = lazy(() => import("./components/Layout"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Clientes = lazy(() => import("./pages/Clientes"));
const Emprestimos = lazy(() => import("./pages/Emprestimos"));
const Notificacoes = lazy(() => import("./pages/Notificacoes"));
const Cobranca = lazy(() => import("./pages/Cobranca"));
const RelatoriosAvancados = lazy(() => import("./pages/RelatoriosAvancados"));
const ParcelasDetalhadas = lazy(() => import("./pages/ParcelasDetalhadas"));
const NotFound = lazy(() => import("./pages/NotFound"));

// 🛡️ QueryClient Otimizado (Supabase Economy)
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 10,    // 10min cache
      gcTime: 1000 * 60 * 30,       // 30min memória
      retry: (failureCount, error: any) => {
        if ([401, 403].includes(error.status)) return false;
        return failureCount < 2;
      },
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      networkMode: 'online' as const,
    },
    mutations: { retry: false },
  },
});

// 🛡️ GLOBAL ERROR BOUNDARY (Tela Branca)
const GlobalErrorBoundary = ({ children }: { children: ReactNode }) => {
  const [hasError, setHasError] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  if (hasError) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-8 bg-gradient-to-br from-background to-muted/50">
        <div className="text-center max-w-md space-y-4">
          <div className="w-20 h-20 mx-auto bg-destructive/10 rounded-2xl flex items-center justify-center">
            <svg className="w-10 h-10 text-destructive" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-foreground">Algo deu errado</h2>
          <p className="text-muted-foreground">{error?.message || "Erro inesperado."}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-6 py-2 bg-primary text-primary-foreground rounded-xl font-medium hover:bg-primary/90"
          >
            Recarregar App
          </button>
        </div>
      </div>
    );
  }

  return children;
};

// ✅ GLOBAL LOADING (className CORRIGIDO)
const GlobalLoading = () => (
  <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted/30">
    <div className="flex flex-col items-center space-y-4 p-8">
      <div className="relative">
        <div className="w-12 h-12 border-3 border-primary/20 rounded-full animate-spin"></div>
        <div className="absolute inset-0 w-12 h-12 border-3 border-primary rounded-full animate-pulse"></div>
      </div>
      <p className="text-muted-foreground font-medium">Carregando aplicação...</p>
    </div>
  </div>
);

// ✅ PROTECTED ROUTE (TypeScript + Loading fix)
const ProtectedRoute = ({ children }: { children: ReactNode }) => {
  const { user, loading: isLoading } = useAuth();

  if (isLoading) return <GlobalLoading />;

  return user ? (
    <Suspense fallback={<GlobalLoading />}>
      <Layout>
        <Outlet />
      </Layout>
    </Suspense>
  ) : (
    <Navigate to="/login" replace />
  );
};

// 🛡️ ROUTER ENTERPRISE (Zero conflitos)
const router = createBrowserRouter([
  {
    path: "/",
    errorElement: (
      <Suspense fallback={<GlobalLoading />}>
        <NotFound />
      </Suspense>
    ),
    children: [
      // Público
      {
        path: "/login",
        element: (
          <Suspense fallback={<GlobalLoading />}>
            <Login />
          </Suspense>
        ),
      },
      
      // Privado
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

// 🎯 APP PRODUCTION READY
const App = memo(() => {
  // ✅ ServiceWorker PRODUCTION ONLY (sem localhost erro)
  useEffect(() => {
    if (import.meta.env.PROD && 'serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(console.error);
    }
  }, []);

  return (
    <GlobalErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <AuthProvider>
            <RouterProvider 
              router={router} 
              fallbackElement={<GlobalLoading />}
            />
            <Toaster />
          </AuthProvider>
        </TooltipProvider>
      </QueryClientProvider>
    </GlobalErrorBoundary>
  );
});

App.displayName = "App";

export default App;
