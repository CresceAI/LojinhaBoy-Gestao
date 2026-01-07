import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
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

const queryClient = new QueryClient();

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-muted-foreground">Carregando...</div>
      </div>
    );
  }

  return user ? <Layout>{children}</Layout> : <Navigate to="/login" replace />;
};

const AppRoutes = () => (
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
