import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useNotificacoes } from '@/hooks/useNotificacoes';
import { useClientes } from '@/hooks/useClientes';
import { Bell, CheckCircle, Trash2, CheckCheck, AlertCircle, Clock, Info } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useIsMobile } from '@/hooks/use-mobile';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

const Notificacoes = () => {
  // ✅ CORREÇÃO 1: Alterado de fetchNotificacoes para refetch conforme o erro do seu TS
  const { 
    notificacoes, 
    marcarComoLida, 
    marcarTodasComoLidas, 
    deleteNotificacao,
    refetch, 
    loading 
  } = useNotificacoes();
  
  const { clientes } = useClientes();
  const isMobile = useIsMobile();
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    const syncAlerts = async () => {
      setIsSyncing(true);
      try {
        // ✅ CORREÇÃO 2: Adicionado 'as any' para o TS ignorar que a função é nova no banco
        await supabase.rpc('gerar_alertas_diarios' as any);
        // ✅ CORREÇÃO 3: Usando refetch() para atualizar a lista
        await refetch();
      } catch (err) {
        console.error("Erro na sincronização:", err);
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
    if (!error) toast.success('Confirmado');
  };

  const handleMarkAllAsRead = async () => {
    const { error } = await marcarTodasComoLidas();
    if (!error) toast.success('Todos os alertas lidos');
  };

  const getTipoConfig = (tipo: string) => {
    switch (tipo) {
      case 'vencido':
        return { icon: AlertCircle, bgColor: 'bg-destructive/10', textColor: 'text-destructive', label: 'Atrasado' };
      case 'vencimento_proximo':
        return { icon: Clock, bgColor: 'bg-amber-500/10', textColor: 'text-amber-600', label: 'Vencimento' };
      default:
        return { icon: Info, bgColor: 'bg-blue-500/10', textColor: 'text-blue-600', label: 'Aviso' };
    }
  };

  if (loading || isSyncing) return <LoadingState />;

  const unread = notificacoes.filter(n => !n.lida).length;

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-4xl mx-auto pb-40 px-5">
      
      <header className="flex flex-col gap-1 pt-8">
        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-primary">Inteligência de Banca</p>
        <div className="flex items-center justify-between">
          <h1 className="text-4xl font-black tracking-tighter text-foreground uppercase">Alertas</h1>
          {unread > 0 && (
            <Button 
              onClick={handleMarkAllAsRead} 
              variant="ghost" 
              className="h-10 rounded-2xl text-[10px] font-black uppercase tracking-widest text-primary hover:bg-primary/10 active:scale-95 transition-all"
            >
              <CheckCheck className="w-4 h-4 mr-2" /> Limpar
            </Button>
          )}
        </div>
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">
          {unread > 0 ? `${unread} pendências detectadas` : 'Céu limpo no radar'}
        </p>
      </header>

      <div className="space-y-3">
        {notificacoes.length > 0 ? (
          notificacoes.map((n) => {
            const config = getTipoConfig(n.tipo);
            const Icon = config.icon;
            const clienteNome = nomesClientes.get(n.cliente_id) || 'Cliente';
            
            return (
              <Card 
                key={n.id} 
                className={cn(
                  "border border-border/40 rounded-[2.2rem] transition-all duration-300 overflow-hidden",
                  !n.lida ? "bg-card shadow-lg ring-1 ring-primary/10" : "bg-card/40 opacity-50"
                )}
              >
                <CardContent className="p-5">
                  <div className="flex items-start gap-4">
                    <div className={cn("p-3 rounded-2xl flex-shrink-0", config.bgColor)}>
                      <Icon className={cn("w-5 h-5", config.textColor)} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <h3 className="text-sm font-black uppercase truncate text-foreground tracking-tight">{clienteNome}</h3>
                        <Badge className={cn("border-none text-[8px] font-black uppercase px-2", config.bgColor, config.textColor)}>{config.label}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground font-medium leading-tight mb-2">{n.mensagem}</p>
                      <span className="text-[9px] font-bold text-muted-foreground/40 uppercase tracking-tighter">
                        {format(new Date(n.created_at), "dd 'de' MMMM 'às' HH:mm", { locale: ptBR })}
                      </span>
                    </div>
                  </div>

                  {!n.lida && (
                    <div className="flex gap-2 mt-4 pt-4 border-t border-border/10">
                      <Button 
                        onClick={() => handleMarkAsRead(n.id)} 
                        className="flex-1 bg-primary text-black hover:bg-primary/90 h-12 rounded-2xl font-black text-[10px] uppercase tracking-widest active:scale-95 transition-all shadow-lg shadow-primary/20"
                      >
                        Confirmar Leitura
                      </Button>
                      <Button 
                        onClick={() => deleteNotificacao(n.id)} 
                        variant="secondary"
                        className="h-12 px-5 text-destructive bg-destructive/5 hover:bg-destructive/10 rounded-2xl active:scale-95 transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
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

const LoadingState = () => (
  <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
    <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-primary animate-pulse">Varrendo Contratos...</p>
  </div>
);

const EmptyState = () => (
  <div className="p-16 text-center bg-card/20 border border-dashed border-border/40 rounded-[2.5rem] mt-10">
    <div className="w-16 h-16 mx-auto bg-secondary/50 rounded-[1.5rem] flex items-center justify-center mb-4">
      <Bell className="w-8 h-8 text-muted-foreground/20" />
    </div>
    <h3 className="text-sm font-black uppercase tracking-widest text-muted-foreground">Radar Limpo</h3>
    <p className="text-[10px] text-muted-foreground/60 mt-1 uppercase font-bold">Nenhum alerta de cobrança para hoje.</p>
  </div>
);

export default Notificacoes;