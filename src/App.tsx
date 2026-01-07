import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { Component, ErrorInfo, ReactNode } from "react";
import Layout from "./components/Layout";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Clientes from "./pages/Clientes";
import Emprestimos from "./pages/Emprestimos";
import Notificacoes from "./pages/Notificacoes";
import Cobranca from "./pages/Cobranca";
import RelatoriosAvancados from "./pages/RelatoriosAvancados";
import ParcelasDetalhadas from "./pages/ParcelasDetalhadas";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60 * 5,
    },
  },
});

// --- COMPONENTE ERROR BOUNDARY CORRIGIDO ---
interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Erro capturado pelo Boundary:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen p-6 text-center bg-background">
          <div className="bg-destructive/10 p-6 rounded-2xl border border-destructive/20 max-w-sm">
            <h2 className="text-xl font-bold mb-2 text-destructive">Ops! Algo deu errado.</h2>
            <p className="text-sm text-muted-foreground mb-4">
              {this.state.error?.message || "Ocorreu um erro inesperado na interface."}
            </p>
            <button 
              onClick={() => window.location.href = '/dashboard'}
              className="w-full bg-primary text-primary-foreground font-bold py-3 rounded-xl shadow-lg active:scale-95 transition-transform"
            >
              Recarregar Aplicativo
            </button>
          </div>
        </div>
      );
    }

    // CORREÇÃO AQUI: Adicionado .props antes de .children
    return this.props.children; 
  }
}

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background text-primary">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return user ? <Layout>{children}</Layout> : <Navigate to="/login" replace />;
};

const AppRoutes = () => (
  <ErrorBoundary>
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="/login" element={<Login />} />
      <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/clientes" element={<ProtectedRoute><Clientes /></ProtectedRoute>} />
      <Route path="/emprestimos" element={<ProtectedRoute><Emprestimos /></ProtectedRoute>} />
      <Route path="/emprestimos/:emprestimoId/parcelas" element={<ProtectedRoute><ParcelasDetalhadas /></ProtectedRoute>} />
      <Route path="/notificacoes" element={<ProtectedRoute><Notificacoes /></ProtectedRoute>} />
      <Route path="/cobranca" element={<ProtectedRoute><Cobranca /></ProtectedRoute>} />
      <Route path="/relatorios" element={<ProtectedRoute><RelatoriosAvancados /></ProtectedRoute>} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  </ErrorBoundary>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;