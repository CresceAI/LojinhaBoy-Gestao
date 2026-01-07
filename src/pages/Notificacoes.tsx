import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useNotificacoes } from '@/hooks/useNotificacoes';
import { useClientes } from '@/hooks/useClientes';
import { Bell, CheckCircle, Trash2, CheckCheck, AlertCircle, Clock } from 'lucide-react';
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
    if (!error) toast.success('Marcada como lida');
  };

  const handleMarkAllAsRead = async () => {
    const { error } = await marcarTodasComoLidas();
    if (!error) toast.success('Todas marcadas como lidas');
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
          label: 'Vencido'
        };
      case 'vencimento_proximo':
        return { 
          icon: Clock, 
          bgColor: 'bg-warning/10', 
          textColor: 'text-warning',
          label: 'Vence em breve'
        };
      default:
        return { 
          icon: CheckCircle, 
          bgColor: 'bg-success/10', 
          textColor: 'text-success',
          label: 'Pago'
        };
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-primary/20 animate-pulse" />
          <span className="text-muted-foreground text-sm">Carregando...</span>
        </div>
      </div>
    );
  }

  const unreadCount = getUnreadCount();

  // Mobile Layout
  if (isMobile) {
    return (
      <div className="space-y-4 animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Notificações</h1>
            <p className="text-sm text-muted-foreground">
              {unreadCount > 0 ? `${unreadCount} não lida${unreadCount > 1 ? 's' : ''}` : 'Todas lidas'}
            </p>
          </div>
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllAsRead}
              className="glass-button text-sm flex items-center gap-2 text-primary"
            >
              <CheckCheck className="w-4 h-4" />
              Ler todas
            </button>
          )}
        </div>

        {/* Notifications List */}
        {notificacoes.length > 0 ? (
          <div className="space-y-3">
            {notificacoes.map((n, index) => {
              const config = getTipoConfig(n.tipo);
              const Icon = config.icon;
              
              return (
                <div 
                  key={n.id} 
                  className={`glass-card-sm animate-slide-up ${!n.lida ? 'border-l-4 border-l-primary' : ''}`}
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  <div className="flex items-start gap-3">
                    <div className={`icon-container ${config.bgColor}`}>
                      <Icon className={`w-5 h-5 ${config.textColor}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-semibold text-foreground truncate">
                          {getClienteNome(n.cliente_id)}
                        </p>
                        <span className={`pill-badge ${config.bgColor} ${config.textColor}`}>
                          {config.label}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2">{n.mensagem}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {format(new Date(n.created_at), "dd MMM 'às' HH:mm", { locale: ptBR })}
                      </p>
                    </div>
                  </div>
                  
                  {/* Actions */}
                  <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border/30">
                    {!n.lida && (
                      <button
                        onClick={() => handleMarkAsRead(n.id)}
                        className="flex-1 flex items-center justify-center gap-2 py-2 rounded-xl bg-primary/10 text-primary text-sm font-medium"
                      >
                        <CheckCircle className="w-4 h-4" />
                        Marcar lida
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(n.id)}
                      className={`${!n.lida ? '' : 'flex-1'} flex items-center justify-center gap-2 py-2 px-4 rounded-xl bg-destructive/10 text-destructive text-sm font-medium`}
                    >
                      <Trash2 className="w-4 h-4" />
                      {n.lida && 'Remover'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="glass-card text-center py-12">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-muted/50 flex items-center justify-center mb-4">
              <Bell className="w-8 h-8 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground font-medium">Nenhuma notificação</p>
            <p className="text-sm text-muted-foreground mt-1">
              Você será notificado sobre vencimentos
            </p>
          </div>
        )}
      </div>
    );
  }

  // Desktop Layout
  return (
    <div className="space-y-6 animate-fade-in max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Notificações</h1>
          <p className="text-muted-foreground mt-1">
            {unreadCount > 0 ? `${unreadCount} não lida${unreadCount > 1 ? 's' : ''}` : 'Todas lidas'}
          </p>
        </div>
        {unreadCount > 0 && (
          <Button onClick={handleMarkAllAsRead} variant="outline" className="gap-2">
            <CheckCheck className="w-4 h-4" />
            Marcar todas como lidas
          </Button>
        )}
      </div>
      
      <div className="space-y-3">
        {notificacoes.map((n) => {
          const config = getTipoConfig(n.tipo);
          
          return (
            <Card key={n.id} className={`apple-card ${!n.lida ? 'border-l-4 border-l-primary' : ''}`}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-3">
                      <h3 className="font-semibold">{getClienteNome(n.cliente_id)}</h3>
                      <Badge className={`${config.bgColor} ${config.textColor}`}>
                        {config.label}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{n.mensagem}</p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(n.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {!n.lida && (
                      <Button onClick={() => handleMarkAsRead(n.id)} variant="outline" size="sm">
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Lida
                      </Button>
                    )}
                    <Button onClick={() => handleDelete(n.id)} variant="ghost" size="sm" className="text-destructive hover:bg-destructive/10">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
      
      {notificacoes.length === 0 && (
        <Card className="apple-card">
          <CardContent className="text-center py-12">
            <Bell className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Nenhuma notificação</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Notificacoes;
