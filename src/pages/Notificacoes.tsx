import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useNotificacoes } from '@/hooks/useNotificacoes';
import { useClientes } from '@/hooks/useClientes';
import { Bell, CheckCircle, Trash2, CheckCheck, AlertCircle, Clock, Info, ShieldAlert } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

const Notificacoes = () => {
  const { 
    notificacoes, 
    marcarComoLida, 
    marcarTodasComoLidas, 
    deleteNotificacao,
    refetch, 
    loading 
  } = useNotificacoes();
  
  const { clientes } = useClientes();
  const [isSyncing, setIsSyncing] = useState(false);

  // --- LÓGICA DE SINCRONIZAÇÃO (MANTIDA E CORRIGIDA) ---
  useEffect(() => {
    const syncAlerts = async () => {
      setIsSyncing(true);
      try {
        // RPC com 'as any' para evitar erro de tipagem no banco
        await supabase.rpc('gerar_alertas_diarios' as any);
        await refetch();
      } catch (err) {
        console.error("Falha na varredura:", err);
      } finally {
        setIsSyncing(false);
      }
    };
    syncAlerts();
  }, []);

  const nomesClientes = useMemo(() => {
    const map = new Map();
    clientes?.forEach(c => map.set(c.id, c.nome));
    return map;
  }, [clientes]);

  const handleMarkAsRead = async (id: string) => {
    const { error } = await marcarComoLida(id);
    if (!error) toast.success('Alerta arquivado');
  };

  const handleMarkAllAsRead = async () => {
    const { error } = await marcarTodasComoLidas();
    if (!error) toast.success('Todos os alertas lidos');
  };

  const getTipoConfig = (tipo: string) => {
    switch (tipo) {
      case 'vencido':
        return { icon: AlertCircle, bgColor: 'bg-destructive/10', textColor: 'text-destructive', label: 'Atraso Crítico' };
      case 'vencimento_proximo':
        return { icon: Clock, bgColor: 'bg-amber-500/10', textColor: 'text-amber-500', label: 'Vencendo hoje' };
      default:
        return { icon: Info, bgColor: 'bg-primary/10', textColor: 'text-primary', label: 'Informativo' };
    }
  };

  if (loading || isSyncing) return <LoadingState />;

  const unreadCount = notificacoes.filter(n => !n.lida).length;

  return (
    <div className="min-h-screen pt-safe pb-safe px-5 md:px-10 space-y-8 max-w-4xl mx-auto animate-fade-in relative pb-40">
      
      {/* Background Glow */}
      <div className="fixed inset-0 z-[-1] pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-primary/5 rounded-full blur-[120px]" />
      </div>

      <header className="flex flex-col gap-2 pt-8">
        <div className="flex items-center gap-2 text-primary/60">
          <ShieldAlert size={14} />
          <p className="text-[10px] font-black uppercase tracking-[0.4em]">Shark Intelligence</p>
        </div>
        <div className="flex items-center justify-between">
          <h1 className="text-3xl md:text-4xl font-black tracking-tighter text-foreground leading-none">
            Central de Alertas
          </h1>
          {unreadCount > 0 && (
            <Button 
              onClick={handleMarkAllAsRead} 
              variant="ghost" 
              className="h-10 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] text-primary hover:bg-primary/10 transition-all"
            >
              <CheckCheck className="w-4 h-4 mr-2" /> Ler tudo
            </Button>
          )}
        </div>
        <p className="text-sm font-medium text-muted-foreground/80">
          {unreadCount > 0 
            ? `Detectamos ${unreadCount} pendências que exigem sua atenção.` 
            : 'O radar está limpo. Nenhum alerta pendente no momento.'}
        </p>
      </header>

      <div className="space-y-4">
        {notificacoes.length > 0 ? (
          notificacoes.map((n) => {
            const config = getTipoConfig(n.tipo);
            const Icon = config.icon;
            const clienteNome = nomesClientes.get(n.cliente_id) || 'Cliente';
            
            return (
              <Card 
                key={n.id} 
                className={cn(
                  "border-white/5 rounded-[2.5rem] transition-all duration-500 overflow-hidden",
                  !n.lida ? "glass-card shadow-2xl shadow-primary/5" : "bg-card/20 opacity-40 scale-[0.98]"
                )}
              >
                <CardContent className="p-6 md:p-8">
                  <div className="flex items-start gap-5">
                    <div className={cn("p-4 rounded-2xl flex-shrink-0 transition-transform group-hover:scale-110", config.bgColor)}>
                      <Icon className={cn("w-6 h-6", config.textColor)} />
                    </div>

                    <div className="flex-1 min-w-0 space-y-2">
                      <div className="flex items-center justify-between gap-4">
                        <h3 className="text-lg font-black tracking-tight truncate text-foreground">
                            {clienteNome}
                        </h3>
                        <Badge className={cn("border-none text-[9px] font-black uppercase px-3 py-1 rounded-lg tracking-widest", config.bgColor, config.textColor)}>
                            {config.label}
                        </Badge>
                      </div>
                      <p className="text-base text-muted-foreground font-medium leading-relaxed">
                        {n.mensagem}
                      </p>
                      <div className="flex items-center gap-2 pt-1 opacity-40">
                        <Clock size={10} />
                        <span className="text-[10px] font-bold uppercase tracking-widest">
                            {format(new Date(n.created_at), "dd MMM 'às' HH:mm", { locale: ptBR })}
                        </span>
                      </div>
                    </div>
                  </div>

                  {!n.lida && (
                    <div className="flex gap-3 mt-8 pt-6 border-t border-white/5">
                      <Button 
                        onClick={() => handleMarkAsRead(n.id)} 
                        className="flex-1 bg-primary text-black hover:brightness-110 h-14 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] active:scale-95 transition-all shadow-lg shadow-primary/20"
                      >
                        Confirmar ciência
                      </Button>
                      <Button 
                        onClick={() => deleteNotificacao(n.id)} 
                        variant="ghost"
                        className="h-14 px-6 text-destructive/40 hover:text-destructive hover:bg-destructive/5 rounded-2xl active:scale-95 transition-all"
                      >
                        <Trash2 className="w-5 h-5" />
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })
        ) : (
          <EmptyState />
        )}
      </div>
    </div>
  );
};

// --- COMPONENTES AUXILIARES ---

const LoadingState = () => (
  <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-6">
    <div className="relative">
        <div className="w-16 h-16 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
        <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-8 h-8 bg-primary/20 rounded-full animate-pulse" />
        </div>
    </div>
    <p className="text-[10px] font-black uppercase tracking-[0.5em] text-primary animate-pulse">Varrendo Contratos...</p>
  </div>
);

const EmptyState = () => (
  <div className="p-20 text-center glass-card border-dashed border-white/10 rounded-[3rem] mt-10">
    <div className="w-20 h-20 mx-auto bg-secondary/30 rounded-[2rem] flex items-center justify-center mb-6">
      <Bell className="w-10 h-10 text-muted-foreground/20" />
    </div>
    <h3 className="text-lg font-black tracking-tight text-foreground">Radar Limpo</h3>
    <p className="text-sm text-muted-foreground mt-2 font-medium">Você está em dia com todas as cobranças da banca.</p>
  </div>
);

export default Notificacoes;