import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useNotificacoes } from '@/hooks/useNotificacoes';
import { useClientes } from '@/hooks/useClientes';
import { CheckCheck, AlertCircle, Clock, Info, ShieldAlert, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

// Import do mascote para o loading
import mascoteOk from '@/components/icons/mascote-cartao.svg';

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

  // --- LÓGICA DE SINCRONIZAÇÃO (MANTIDA) ---
  useEffect(() => {
    const syncAlerts = async () => {
      setIsSyncing(true);
      try {
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
    <div className="min-h-screen pt-safe pb-safe px-4 sm:px-6 md:px-10 space-y-6 md:space-y-8 max-w-4xl mx-auto animate-fade-in relative pb-40">
      
      {/* Background Glow Otimizado */}
      <div className="fixed inset-0 z-[-1] pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-[600px] h-[300px] bg-primary/5 rounded-full blur-[80px] md:blur-[120px]" />
      </div>

      <header className="flex flex-col gap-2 pt-6 md:pt-8">
        <div className="flex items-center gap-2 text-primary/60">
          <ShieldAlert className="w-3.5 h-3.5" />
          <p className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.3em] md:tracking-[0.4em]">Shark Intelligence</p>
        </div>
        <div className="flex items-center justify-between gap-4">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tighter text-foreground leading-none">
            Central de Alertas
          </h1>
          {unreadCount > 0 && (
            <Button 
              onClick={handleMarkAllAsRead} 
              variant="ghost" 
              className="h-10 rounded-xl px-3 md:px-4 text-[9px] md:text-[10px] font-black uppercase tracking-[0.1em] md:tracking-[0.2em] text-primary hover:bg-primary/10 transition-all shrink-0"
            >
              <CheckCheck className="w-4 h-4 mr-1.5 md:mr-2" /> Ler tudo
            </Button>
          )}
        </div>
        <p className="text-[13px] md:text-sm font-medium text-muted-foreground/80 leading-relaxed">
          {unreadCount > 0 
            ? `Detectamos ${unreadCount} pendências que exigem sua atenção imediata.` 
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
                  "border-white/5 rounded-[2rem] md:rounded-[2.5rem] transition-all duration-500 overflow-hidden",
                  !n.lida ? "glass-card shadow-2xl shadow-primary/5" : "bg-card/20 opacity-40 scale-[0.98]"
                )}
              >
                <CardContent className="p-5 md:p-8">
                  <div className="flex items-start gap-4 md:gap-6">
                    <div className={cn("p-3.5 md:p-4 rounded-xl md:rounded-2xl flex-shrink-0 transition-transform group-hover:scale-110", config.bgColor)}>
                      <Icon className={cn("w-5 h-5 md:w-6 md:h-6", config.textColor)} />
                    </div>

                    <div className="flex-1 min-w-0 space-y-2 md:space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <h3 className="text-base md:text-lg font-black tracking-tight truncate text-foreground">
                            {clienteNome}
                        </h3>
                        <Badge className={cn("w-fit border-none text-[8px] md:text-[9px] font-black uppercase px-2.5 py-1 rounded-lg tracking-widest", config.bgColor, config.textColor)}>
                            {config.label}
                        </Badge>
                      </div>
                      <p className="text-[14px] md:text-base text-muted-foreground font-medium leading-snug md:leading-relaxed">
                        {n.mensagem}
                      </p>
                      <div className="flex items-center gap-2 pt-1 opacity-40">
                        <Clock className="w-2.5 h-2.5" />
                        <span className="text-[9px] md:text-[10px] font-bold uppercase tracking-widest">
                            {format(new Date(n.created_at), "dd MMM 'às' HH:mm", { locale: ptBR })}
                        </span>
                      </div>
                    </div>
                  </div>

                  {!n.lida && (
                    <div className="flex gap-3 mt-6 md:mt-8 pt-5 md:pt-6 border-t border-white/5">
                      <Button 
                        onClick={() => handleMarkAsRead(n.id)} 
                        className="flex-1 bg-primary text-black hover:brightness-110 h-12 md:h-14 rounded-xl md:rounded-2xl font-black text-[9px] md:text-[10px] uppercase tracking-[0.1em] md:tracking-[0.2em] active:scale-95 transition-all shadow-lg shadow-primary/20"
                      >
                        Confirmar ciência
                      </Button>
                      <Button 
                        onClick={() => deleteNotificacao(n.id)} 
                        variant="ghost"
                        className="h-12 md:h-14 px-4 md:px-6 text-destructive/40 hover:text-destructive hover:bg-destructive/5 rounded-xl md:rounded-2xl active:scale-95 transition-all"
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

// --- COMPONENTE DE CARREGAMENTO PROFISSIONAL SHARK ---

const LoadingState = () => (
  <div className="min-h-screen relative flex flex-col items-center justify-center bg-background overflow-hidden p-4">
    
    {/* ✅ FUNDO COM PADRÃO E GLOW (Igual ao Layout principal) */}
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
      <div 
        className="absolute inset-0 bg-login-pattern-custom bg-no-repeat bg-cover bg-center opacity-[0.04] grayscale"
      />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-primary/10 rounded-full blur-[100px] animate-pulse" />
    </div>

    {/* ✅ ELEMENTO CENTRAL */}
    <div className="relative flex flex-col items-center gap-8 animate-in fade-in zoom-in duration-700">
      <div className="relative">
        {/* Spinner Neon */}
        <div className="w-20 h-20 md:w-24 md:h-24 border-2 border-primary/10 border-t-primary rounded-full animate-spin shadow-[0_0_15px_rgba(var(--primary),0.2)]" />
        
        {/* Mascote Shark sutil no centro do carregamento */}
        <div className="absolute inset-0 flex items-center justify-center">
            <img 
              src={mascoteOk} 
              className="w-10 h-10 md:w-12 md:h-12 opacity-30 animate-pulse grayscale" 
              alt="Shark" 
            />
        </div>
      </div>

      {/* ✅ TIPOGRAFIA SHARK */}
      <div className="text-center space-y-2">
        <p className="text-[10px] md:text-[11px] font-black uppercase tracking-[0.5em] text-primary animate-pulse">
          Varrendo Contratos
        </p>
        <p className="text-[8px] font-bold text-muted-foreground uppercase tracking-[0.3em] opacity-40">
          Shark Intelligence Analysis
        </p>
      </div>
    </div>
  </div>
);

const EmptyState = () => (
  <div className="p-12 md:p-20 text-center glass-card border-dashed border-white/10 rounded-[2.5rem] md:rounded-[3rem] mt-10">
    <div className="w-16 h-16 md:w-20 md:h-20 mx-auto bg-secondary/30 rounded-2xl md:rounded-[2rem] flex items-center justify-center mb-5 md:mb-6">
      <CheckCheck className="w-8 h-8 md:w-10 md:h-10 text-muted-foreground/20" />
    </div>
    <h3 className="text-base md:text-lg font-black tracking-tight text-foreground">Radar Limpo</h3>
    <p className="text-[13px] md:text-sm text-muted-foreground mt-2 font-medium">Você está em dia com todas as cobranças da banca.</p>
  </div>
);

export default Notificacoes;