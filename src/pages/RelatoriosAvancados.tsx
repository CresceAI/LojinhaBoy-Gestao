import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useEmprestimos } from '@/hooks/useEmprestimos';
import { formatCurrency } from '@/utils/calculations';
import { BarChart3, Download, TrendingUp, DollarSign, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

const RelatoriosAvancados = () => {
  const { emprestimos, loading } = useEmprestimos();
  const [filtroStatus, setFiltroStatus] = useState<string>('todos');
  const [stats, setStats] = useState({
    totalEmprestado: 0,
    totalRecebido: 0,
    totalAberto: 0,
    totalVencido: 0,
  });

  const emprestimosFiltrados = filtroStatus === 'todos' 
    ? emprestimos 
    : emprestimos.filter(e => e.status === filtroStatus);

  useEffect(() => {
    const data = emprestimosFiltrados;

    const totalEmprestado = data.reduce((acc, emp) => acc + Number(emp.valor_total), 0);
    const totalRecebido = data.reduce((acc, emp) => acc + Number(emp.valor_pago), 0);
    const totalAberto = data
      .filter(e => e.status === 'ativo')
      .reduce((acc, emp) => acc + (Number(emp.valor_total) - Number(emp.valor_pago)), 0);
    const totalVencido = data
      .filter(e => e.status === 'vencido')
      .reduce((acc, emp) => acc + Number(emp.valor_total), 0);

    setStats({
      totalEmprestado,
      totalRecebido,
      totalAberto,
      totalVencido,
    });
  }, [emprestimosFiltrados]);

  const handleExportarPDF = () => {
    toast.success('Exportação PDF em breve!');
  };

  const handleExportarExcel = () => {
    toast.success('Exportação Excel em breve!');
  };

  const cardStats = [
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
      title: 'Total em Aberto',
      value: formatCurrency(stats.totalAberto),
      icon: BarChart3,
      color: 'text-info',
      bgColor: 'bg-info/10',
    },
    {
      title: 'Total Vencido',
      value: formatCurrency(stats.totalVencido),
      icon: AlertCircle,
      color: 'text-destructive',
      bgColor: 'bg-destructive/10',
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-muted-foreground">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Relatórios</h1>
        <p className="text-muted-foreground mt-1">Análise e estatísticas dos empréstimos</p>
      </div>

      <Card className="apple-card">
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={filtroStatus} onValueChange={setFiltroStatus}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="ativo">Ativos</SelectItem>
                  <SelectItem value="pago">Pagos</SelectItem>
                  <SelectItem value="vencido">Vencidos</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end gap-2">
              <Button onClick={handleExportarPDF} variant="outline" className="apple-button">
                <Download className="w-4 h-4 mr-2" />
                Exportar PDF
              </Button>
              <Button onClick={handleExportarExcel} variant="outline" className="apple-button">
                <Download className="w-4 h-4 mr-2" />
                Exportar Excel
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {cardStats.map((card, index) => {
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

      <Card className="apple-card">
        <CardHeader>
          <CardTitle>Distribuição por Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {['ativo', 'pago', 'vencido'].map((status) => {
              const count = emprestimosFiltrados.filter(e => e.status === status).length;
              const total = emprestimosFiltrados.length || 1;
              const percentage = (count / total) * 100;
              const valorTotal = emprestimosFiltrados
                .filter(e => e.status === status)
                .reduce((acc, emp) => acc + Number(emp.valor_total), 0);
              
              const colors: Record<string, string> = {
                ativo: 'bg-info',
                pago: 'bg-success',
                vencido: 'bg-destructive',
              };

              return (
                <div key={status} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="capitalize font-medium">{status}</span>
                    <div className="flex gap-4">
                      <span className="text-muted-foreground">{count} empréstimos</span>
                      <span className="font-semibold">{formatCurrency(valorTotal)}</span>
                    </div>
                  </div>
                  <div className="w-full bg-muted rounded-full h-3">
                    <div
                      className={`h-3 rounded-full ${colors[status]} transition-all duration-300 flex items-center justify-end pr-2`}
                      style={{ width: `${percentage}%` }}
                    >
                      {percentage > 15 && (
                        <span className="text-xs text-white font-medium">{percentage.toFixed(0)}%</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {emprestimosFiltrados.length === 0 && (
        <Card className="apple-card">
          <CardContent className="text-center py-12">
            <BarChart3 className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Nenhum dado disponível para os filtros selecionados</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default RelatoriosAvancados;
