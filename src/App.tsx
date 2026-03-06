import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import ProtectedRoute from "@/components/ProtectedRoute";
import AppLayout from "@/components/AppLayout";
import Login from "@/pages/Login";
import Cadastro from "@/pages/Cadastro";
import Onboarding from "@/pages/Onboarding";
import Dashboard from "@/pages/Dashboard";
import Treino from "@/pages/Treino";
import TreinoExecucao from "@/pages/TreinoExecucao";
import TreinoHistorico from "@/pages/TreinoHistorico";
import Dieta from "@/pages/Dieta";
import Agenda from "@/pages/Agenda";
import EventoDetalhe from "@/pages/EventoDetalhe";
import Checklist from "@/pages/Checklist";
import Comunidade from "@/pages/Comunidade";
import Desafios from "@/pages/Desafios";
import DesafioDetalhe from "@/pages/DesafioDetalhe";
import Perfil from "@/pages/Perfil";
import Admin from "@/pages/Admin";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/cadastro" element={<Cadastro />} />
            <Route path="/onboarding" element={<ProtectedRoute><Onboarding /></ProtectedRoute>} />
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/treino" element={<Treino />} />
              <Route path="/treino/historico" element={<TreinoHistorico />} />
              <Route path="/treino/:id" element={<TreinoExecucao />} />
              <Route path="/dieta" element={<Dieta />} />
              <Route path="/agenda" element={<Agenda />} />
              <Route path="/agenda/:id" element={<EventoDetalhe />} />
              <Route path="/checklist" element={<Checklist />} />
              <Route path="/comunidade" element={<Comunidade />} />
              <Route path="/desafios" element={<Desafios />} />
              <Route path="/desafios/:id" element={<DesafioDetalhe />} />
              <Route path="/perfil" element={<Perfil />} />
              <Route path="/admin" element={<Admin />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
