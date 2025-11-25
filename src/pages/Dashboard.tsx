import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getEmprestimos, getClientes } from '@/utils/storage';
import { formatCurrency, isVencimentoProximo } from '@/utils/calculations';
import { checkAndCreateNotifications } from '@/utils/notifications';
import { DollarSign, TrendingUp, AlertCircle, Clock } from 'lucide-react';
import { DashboardStats } from '@/types';

const Dashboard = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalEmprestado: 0,
    totalRecebido: 0,
    emprestimosAbertos: 0,
    vencimentosProximos: 0,
  });

  useEffect(() => {
    const emprestimos = getEmprestimos();
    checkAndCreateNotifications(emprestimos);

    const totalEmprestado = emprestimos.reduce((acc, emp) => acc + emp.valorTotal, 0);
    const totalRecebido = emprestimos.reduce((acc, emp) => acc + emp.valorPago, 0);
    const emprestimosAbertos = emprestimos.filter(e => e.status === 'ativo').length;
    const vencimentosProximos = emprestimos.filter(
      e => e.status === 'ativo' && isVencimentoProximo(e.dataVencimento)
    ).length;

    setStats({
      totalEmprestado,
      totalRecebido,
      emprestimosAbertos,
      vencimentosProximos,
    });
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

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Visão geral dos seus empréstimos</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
            <CardTitle>Atividade Recente</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-muted-foreground">
              <p>Nenhuma atividade recente</p>
            </div>
          </CardContent>
        </Card>

        <Card className="apple-card">
          <CardHeader>
            <CardTitle>Clientes em Atraso</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-muted-foreground">
              <p>Nenhum cliente em atraso</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
