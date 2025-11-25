import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { getNotificacoes, markNotificacaoAsRead, getClientes } from '@/utils/storage';
import { Notificacao } from '@/types';
import { Bell, BellOff, CheckCircle } from 'lucide-react';
import { formatDate } from '@/utils/calculations';

const Notificacoes = () => {
  const [notificacoes, setNotificacoes] = useState<Notificacao[]>([]);
  const [clientes, setClientes] = useState<any[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    const nots = getNotificacoes();
    setNotificacoes(nots.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    setClientes(getClientes());
  };

  const handleMarkAsRead = (id: string) => {
    markNotificacaoAsRead(id);
    loadData();
  };

  const getClienteNome = (clienteId: string) => {
    const cliente = clientes.find(c => c.id === clienteId);
    return cliente?.nome || 'Cliente não encontrado';
  };

  const getTipoColor = (tipo: string) => {
    switch (tipo) {
      case 'vencimento_proximo': return 'bg-warning text-warning-foreground';
      case 'vencido': return 'bg-destructive text-destructive-foreground';
      case 'pago': return 'bg-success text-success-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getTipoLabel = (tipo: string) => {
    switch (tipo) {
      case 'vencimento_proximo': return 'Vencimento Próximo';
      case 'vencido': return 'Vencido';
      case 'pago': return 'Pago';
      default: return tipo;
    }
  };

  const notificacoesNaoLidas = notificacoes.filter(n => !n.lida);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Notificações</h1>
        <p className="text-muted-foreground mt-1">
          {notificacoesNaoLidas.length} {notificacoesNaoLidas.length === 1 ? 'notificação não lida' : 'notificações não lidas'}
        </p>
      </div>

      <div className="space-y-3">
        {notificacoes.map((notificacao) => (
          <Card
            key={notificacao.id}
            className={`apple-card transition-all ${notificacao.lida ? 'opacity-60' : 'animate-scale-in'}`}
          >
            <CardContent className="pt-6">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-4 flex-1">
                  <div className={`p-3 rounded-lg ${notificacao.lida ? 'bg-muted' : 'bg-primary/10'}`}>
                    {notificacao.lida ? (
                      <BellOff className="w-5 h-5 text-muted-foreground" />
                    ) : (
                      <Bell className="w-5 h-5 text-primary" />
                    )}
                  </div>
                  
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold">{getClienteNome(notificacao.clienteId)}</h3>
                      <Badge className={getTipoColor(notificacao.tipo)}>
                        {getTipoLabel(notificacao.tipo)}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{notificacao.mensagem}</p>
                    <p className="text-xs text-muted-foreground">{formatDate(notificacao.createdAt)}</p>
                  </div>
                </div>

                {!notificacao.lida && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleMarkAsRead(notificacao.id)}
                    className="apple-button shrink-0"
                  >
                    <CheckCircle className="w-4 h-4 mr-1" />
                    Marcar como lida
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {notificacoes.length === 0 && (
        <Card className="apple-card">
          <CardContent className="text-center py-12">
            <Bell className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Nenhuma notificação ainda</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Notificacoes;
