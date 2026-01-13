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

const Notificacoes = () => {
  const { 
    notificacoes, 
    marcarComoLida, 
    marcarTodasComoLidas, 
    deleteNotificacao,
    getUnreadCount, 
    loading 
  } = useNotificacoes();
  const { clientes } = useClientes();
  const isMobile = useIsMobile();

  const handleMarkAsRead = async (id: string) => {
    const { error } = await marcarComoLida(id);
    if (!error) toast.success('Confirmado como lido');
  };

  const handleMarkAllAsRead = async () => {
    const { error } = await marcarTodasComoLidas();
    if (!error) toast.success('Tudo limpo!');
  };

  const handleDelete = async (id: string) => {
    const { error } = await deleteNotificacao(id);
    if (!error) toast.success('Notificação removida');
  };

  const getClienteNome = (clienteId: string) => 
    clientes.find(c => c.id === clienteId)?.nome || 'Cliente';
  
  const getTipoConfig = (tipo: string) => {
    switch (tipo) {
      case 'vencido':
        return { 
          icon: AlertCircle, 
          bgColor: 'bg-destructive/10', 
          textColor: 'text-destructive',
          label: 'Atrasado'
        };
      case 'vencimento_proximo':
        return { 
          icon: Clock, 
          bgColor: 'bg-amber-500/10', 
          textColor: 'text-amber-600',
          label: 'Vence em breve'
        };
      default:
        return { 
          icon: Info, 
          bgColor: 'bg-blue-500/10', 
          textColor: 'text-blue-600',
          label: 'Aviso'
        };
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
        <p className="text-xs font-black uppercase tracking-widest text-muted-foreground animate-pulse">Buscando Alertas...</p>
      </div>
    );
  }

  const unreadCount = getUnreadCount();

  return (
    <div className="space-y-6 animate-in fade-in duration-700 max-w-4xl mx-auto pb-24 px-2">
      
      {/* HEADER DINÂMICO */}
      <div className="flex items-center justify-between px-1">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-foreground">Notificações</h1>
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mt-1">
            {unreadCount > 0 ? `${unreadCount} Pendente(s)` : 'Nenhuma pendência'}
          </p>
        </div>
        {unreadCount > 0 && (
          <Button 
            onClick={handleMarkAllAsRead} 
            variant="ghost" 
            className="text-xs font-black uppercase tracking-tighter text-primary hover:bg-primary/5 rounded-2xl h-11"
          >
            <CheckCheck className="w-4 h-4 mr-2" />
            Ler Tudo
          </Button>
        )}
      </div>

      {/* LISTA DE CARDS */}
      <div className="space-y-3">
        {notificacoes.length > 0 ? (
          notificacoes.map((n) => {
            const config = getTipoConfig(n.tipo);
            const Icon = config.icon;
            
            return (
              <Card 
                key={n.id} 
                className={`apple-card overflow-hidden transition-all duration-300 ${!n.lida ? 'border-l-4 border-l-primary bg-primary/[0.02]' : 'opacity-70'}`}
              >
                <CardContent className="p-5">
                  <div className="flex items-start gap-4">
                    {/* ÍCONE DE STATUS */}
                    <div className={`p-3 rounded-2xl ${config.bgColor}`}>
                      <Icon className={`w-5 h-5 ${config.textColor}`} />
                    </div>

                    {/* CONTEÚDO */}
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-black uppercase tracking-tight">{getClienteNome(n.cliente_id)}</h3>
                        <Badge variant="outline" className={`border-none font-black text-[9px] uppercase ${config.bgColor} ${config.textColor}`}>
                          {config.label}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground font-medium leading-relaxed">{n.mensagem}</p>
                      <p className="text-[10px] text-muted-foreground/60 font-bold uppercase">
                        {format(new Date(n.created_at), "dd 'de' MMM 'às' HH:mm", { locale: ptBR })}
                      </p>
                    </div>

                    {/* BOTÕES DE AÇÃO (Desktop) */}
                    {!isMobile && (
                      <div className="flex flex-col gap-2">
                        {!n.lida && (
                          <Button onClick={() => handleMarkAsRead(n.id)} variant="outline" size="sm" className="rounded-xl h-8 px-3 text-[10px] font-black uppercase">
                            <CheckCircle className="w-3.5 h-3.5 mr-1.5" /> Ok
                          </Button>
                        )}
                        <Button onClick={() => handleDelete(n.id)} variant="ghost" size="sm" className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10 rounded-xl">
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    )}
                  </div>

                  {/* BOTÕES DE AÇÃO (Mobile) */}
                  {isMobile && (
                    <div className="flex gap-2 mt-4 pt-4 border-t border-border/40">
                      {!n.lida && (
                        <Button 
                          onClick={() => handleMarkAsRead(n.id)} 
                          className="flex-1 bg-primary/10 text-primary hover:bg-primary/20 border-none h-10 rounded-xl font-black text-[10px] uppercase"
                        >
                          Marcar como Lida
                        </Button>
                      )}
                      <Button 
                        onClick={() => handleDelete(n.id)} 
                        variant="ghost" 
                        className="h-10 px-4 text-destructive hover:bg-destructive/10 rounded-xl font-black text-[10px] uppercase"
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
          <div className="p-16 text-center bg-card/50 border border-dashed border-border/40 rounded-[2.5rem]">
            <div className="w-16 h-16 mx-auto bg-secondary/50 rounded-3xl flex items-center justify-center mb-4">
              <Bell className="w-8 h-8 text-muted-foreground/40" />
            </div>
            <p className="text-muted-foreground font-bold uppercase text-xs tracking-widest">Nada por aqui</p>
            <p className="text-[10px] text-muted-foreground/60 mt-1">Avisaremos quando houver vencimentos.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Notificacoes;