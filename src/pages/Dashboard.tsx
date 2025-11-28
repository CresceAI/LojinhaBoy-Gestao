import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getEmprestimos, getClientes, getCurrentUser } from '@/utils/storage';
import { formatCurrency, isVencimentoProximo } from '@/utils/calculations';
import { checkAndCreateNotifications } from '@/utils/notifications';
import { DollarSign, TrendingUp, AlertCircle, Clock, Calendar } from 'lucide-react';
import { DashboardStats, Emprestimo } from '@/types';
import { useIsMobile } from '@/hooks/use-mobile';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface EmprestimoComCliente extends Emprestimo {
  clienteNome: string;
}

const Dashboard = () => {
  const isMobile = useIsMobile();
  const user = getCurrentUser();
  const [stats, setStats] = useState<DashboardStats>({
    totalEmprestado: 0,
    totalRecebido: 0,
    emprestimosAbertos: 0,
    vencimentosProximos: 0,
    lucroRecebido: 0,
  });
  const [proximosVencimentos, setProximosVencimentos] = useState<EmprestimoComCliente[]>([]);
  const [transacoesRecentes, setTransacoesRecentes] = useState<EmprestimoComCliente[]>([]);

  useEffect(() => {
    const emprestimos = getEmprestimos();
    const clientes = getClientes();
    checkAndCreateNotifications(emprestimos);

    const totalEmprestado = emprestimos.reduce((acc, emp) => acc + emp.valorTotal, 0);
    const totalRecebido = emprestimos.reduce((acc, emp) => acc + emp.valorPago, 0);
    const emprestimosAbertos = emprestimos.filter(e => e.status === 'ativo').length;
    const vencimentosProximos = emprestimos.filter(
      e => e.status === 'ativo' && isVencimentoProximo(e.dataVencimento)
    ).length;
    
    // Calcula o lucro recebido (soma dos juros dos empréstimos pagos)
    const lucroRecebido = emprestimos
      .filter(e => e.status === 'pago')
      .reduce((acc, emp) => acc + emp.juros, 0);

    setStats({
      totalEmprestado,
      totalRecebido,
      emprestimosAbertos,
      vencimentosProximos,
      lucroRecebido,
    });

    // Próximos vencimentos (ordenados por data, máx 3)
    const proximos = emprestimos
      .filter(e => e.status === 'ativo')
      .sort((a, b) => new Date(a.dataVencimento).getTime() - new Date(b.dataVencimento).getTime())
      .slice(0, 3)
      .map(emp => ({
        ...emp,
        clienteNome: clientes.find(c => c.id === emp.clienteId)?.nome || 'Cliente não encontrado'
      }));
    setProximosVencimentos(proximos);

    // Transações recentes (últimos 5 pagamentos)
    const recentes = emprestimos
      .filter(e => e.status === 'pago')
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5)
      .map(emp => ({
        ...emp,
        clienteNome: clientes.find(c => c.id === emp.clienteId)?.nome || 'Cliente não encontrado'
      }));
    setTransacoesRecentes(recentes);
  }, []);

  const cards = [
    {
      title: 'Total Emprestado',
      value: formatCurrency(stats.totalEmprestado),
      icon: DollarSign,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
    {
      title: 'Total Recebido',
      value: formatCurrency(stats.totalRecebido),
      icon: TrendingUp,
      color: 'text-success',
      bgColor: 'bg-success/10',
    },
    {
      title: 'Lucro Recebido',
      value: formatCurrency(stats.lucroRecebido),
      icon: TrendingUp,
      color: 'text-success',
      bgColor: 'bg-success/10',
    },
    {
      title: 'Empréstimos Ativos',
      value: stats.emprestimosAbertos.toString(),
      icon: Clock,
      color: 'text-info',
      bgColor: 'bg-info/10',
    },
    {
      title: 'Vencimentos Próximos',
      value: stats.vencimentosProximos.toString(),
      icon: AlertCircle,
      color: 'text-warning',
      bgColor: 'bg-warning/10',
    },
  ];

  // Mobile Layout
  if (isMobile) {
    return (
      <div className="space-y-4 animate-fade-in pb-4">
        {/* Header com saudação e saldo */}
        <div className="bg-gradient-to-br from-primary/10 via-primary/5 to-background rounded-2xl p-6 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-foreground">
                Olá, {user?.name || 'Bem-vindo'}!
              </h2>
              <p className="text-sm text-muted-foreground">Aqui está seu resumo</p>
            </div>
            <div className="bg-primary/10 p-3 rounded-full">
              <DollarSign className="w-6 h-6 text-primary" />
            </div>
          </div>
          
          <div className="pt-2">
            <p className="text-xs text-muted-foreground mb-1">Saldo Disponível</p>
            <p className="text-3xl font-bold text-primary">
              {formatCurrency(stats.totalRecebido - stats.totalEmprestado)}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-3">
            <div className="bg-background/50 backdrop-blur rounded-xl p-3">
              <p className="text-xs text-muted-foreground mb-1">Lucro Recebido</p>
              <p className="text-lg font-bold text-success">{formatCurrency(stats.lucroRecebido)}</p>
            </div>
            <div className="bg-background/50 backdrop-blur rounded-xl p-3">
              <p className="text-xs text-muted-foreground mb-1">Ativos</p>
              <p className="text-lg font-bold text-info">{stats.emprestimosAbertos}</p>
            </div>
          </div>
        </div>

        {/* Próximos Vencimentos */}
        {proximosVencimentos.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-warning" />
                Próximos Vencimentos
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {proximosVencimentos.map((emp) => {
                const diasRestantes = Math.ceil(
                  (new Date(emp.dataVencimento).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
                );
                const isVencido = diasRestantes < 0;
                
                return (
                  <div
                    key={emp.id}
                    className="flex items-center justify-between p-3 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-full ${isVencido ? 'bg-destructive/10' : 'bg-warning/10'}`}>
                        <Calendar className={`w-4 h-4 ${isVencido ? 'text-destructive' : 'text-warning'}`} />
                      </div>
                      <div>
                        <p className="text-sm font-medium">{emp.clienteNome}</p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(emp.dataVencimento), "dd/MM/yyyy", { locale: ptBR })}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold">{formatCurrency(emp.valorTotal - emp.valorPago)}</p>
                      <p className={`text-xs ${isVencido ? 'text-destructive' : 'text-warning'}`}>
                        {isVencido ? `${Math.abs(diasRestantes)}d atraso` : `${diasRestantes}d restantes`}
                      </p>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        )}

        {/* Transações Recentes */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-success" />
              Transações Recentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            {transacoesRecentes.length > 0 ? (
              <div className="space-y-2">
                {transacoesRecentes.map((emp) => (
                  <div
                    key={emp.id}
                    className="flex items-center justify-between p-3 bg-muted/30 rounded-lg"
                  >
                    <div>
                      <p className="text-sm font-medium">{emp.clienteNome}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(emp.createdAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-success">+{formatCurrency(emp.valorTotal)}</p>
                      <p className="text-xs text-muted-foreground">Lucro: {formatCurrency(emp.juros)}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <p className="text-sm">Nenhuma transação recente</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Cards de Estatísticas */}
        <div className="grid grid-cols-2 gap-3">
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-2 rounded-lg bg-primary/10">
                  <DollarSign className="w-4 h-4 text-primary" />
                </div>
              </div>
              <p className="text-xs text-muted-foreground mb-1">Emprestado</p>
              <p className="text-lg font-bold">{formatCurrency(stats.totalEmprestado)}</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-2 rounded-lg bg-success/10">
                  <TrendingUp className="w-4 h-4 text-success" />
                </div>
              </div>
              <p className="text-xs text-muted-foreground mb-1">Recebido</p>
              <p className="text-lg font-bold">{formatCurrency(stats.totalRecebido)}</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Desktop Layout
  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Visão geral dos seus empréstimos</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        {cards.map((card, index) => {
          const Icon = card.icon;
          return (
            <Card key={index} className="apple-card animate-slide-up" style={{ animationDelay: `${index * 0.1}s` }}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {card.title}
                </CardTitle>
                <div className={`p-2 rounded-lg ${card.bgColor}`}>
                  <Icon className={`w-5 h-5 ${card.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">{card.value}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="apple-card">
          <CardHeader>
            <CardTitle>Transações Recentes</CardTitle>
          </CardHeader>
          <CardContent>
            {transacoesRecentes.length > 0 ? (
              <div className="space-y-3">
                {transacoesRecentes.map((emp) => (
                  <div
                    key={emp.id}
                    className="flex items-center justify-between p-3 bg-muted/30 rounded-lg"
                  >
                    <div>
                      <p className="font-medium">{emp.clienteNome}</p>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(emp.createdAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-success">+{formatCurrency(emp.valorTotal)}</p>
                      <p className="text-sm text-muted-foreground">Lucro: {formatCurrency(emp.juros)}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <p>Nenhuma transação recente</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="apple-card">
          <CardHeader>
            <CardTitle>Próximos Vencimentos</CardTitle>
          </CardHeader>
          <CardContent>
            {proximosVencimentos.length > 0 ? (
              <div className="space-y-3">
                {proximosVencimentos.map((emp) => {
                  const diasRestantes = Math.ceil(
                    (new Date(emp.dataVencimento).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
                  );
                  const isVencido = diasRestantes < 0;
                  
                  return (
                    <div
                      key={emp.id}
                      className="flex items-center justify-between p-3 bg-muted/30 rounded-lg"
                    >
                      <div>
                        <p className="font-medium">{emp.clienteNome}</p>
                        <p className="text-sm text-muted-foreground">
                          Vence: {format(new Date(emp.dataVencimento), "dd/MM/yyyy", { locale: ptBR })}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">{formatCurrency(emp.valorTotal - emp.valorPago)}</p>
                        <p className={`text-sm ${isVencido ? 'text-destructive' : 'text-warning'}`}>
                          {isVencido ? `${Math.abs(diasRestantes)}d atraso` : `${diasRestantes}d restantes`}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <p>Nenhum vencimento próximo</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
