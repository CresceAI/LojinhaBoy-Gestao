import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { getCurrentUser } from "@/utils/storage";
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
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    const user = getCurrentUser();
    setIsAuthenticated(!!user);
  }, []);

  if (isAuthenticated === null) {
    return <div className="flex items-center justify-center min-h-screen">Carregando...</div>;
  }

  return isAuthenticated ? <Layout>{children}</Layout> : <Navigate to="/login" replace />;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
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
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
