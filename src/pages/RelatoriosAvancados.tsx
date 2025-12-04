import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { getEmprestimos } from "@/utils/storage";
import { formatCurrency } from "@/utils/calculations";
import { Emprestimo } from "@/types";
import {
  BarChart3,
  Download,
  TrendingUp,
  DollarSign,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";

const RelatoriosAvancados = () => {
  const [emprestimos, setEmprestimos] = useState<Emprestimo[]>([]);
  const [filtroStatus, setFiltroStatus] = useState<string>("todos");
  const [stats, setStats] = useState({
    totalEmprestado: 0,
    totalRecebido: 0,
    totalAberto: 0,
    totalVencido: 0,
  });

  useEffect(() => {
    loadData();
  }, [filtroStatus]);

  const loadData = () => {
    let data = getEmprestimos();

    if (filtroStatus !== "todos") {
      data = data.filter((e) => e.status === filtroStatus);
    }

    setEmprestimos(data);

    const totalEmprestado = data.reduce(
      (acc, emp) => acc + emp.valorTotal,
      0
    );
    const totalRecebido = data.reduce(
      (acc, emp) => acc + emp.valorPago,
      0
    );
    const totalAberto = data
      .filter((e) => e.status === "ativo")
      .reduce(
        (acc, emp) => acc + (emp.valorTotal - emp.valorPago),
        0
      );
    const totalVencido = data
      .filter((e) => e.status === "vencido")
      .reduce((acc, emp) => acc + emp.valorTotal, 0);

    setStats({
      totalEmprestado,
      totalRecebido,
      totalAberto,
      totalVencido,
    });
  };

  const handleExportarPDF = () => {
    toast.success("Exportação simulada! Em produção, seria gerado um PDF.");
  };

  const handleExportarExcel = () => {
    toast.success("Exportação simulada! Em produção, seria gerado um Excel.");
  };

  const cardStats = [
    {
      title: "Total emprestado",
      value: formatCurrency(stats.totalEmprestado),
      icon: DollarSign,
      color: "text-primary",
      bgColor: "bg-primary/15",
    },
    {
      title: "Total recebido",
      value: formatCurrency(stats.totalRecebido),
      icon: TrendingUp,
      color: "text-success",
      bgColor: "bg-success/15",
    },
    {
      title: "Total em aberto",
      value: formatCurrency(stats.totalAberto),
      icon: BarChart3,
      color: "text-info",
      bgColor: "bg-info/15",
    },
    {
      title: "Total vencido",
      value: formatCurrency(stats.totalVencido),
      icon: AlertCircle,
      color: "text-destructive",
      bgColor: "bg-destructive/15",
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold tracking-tight">
          Relatórios
        </h1>
        <p className="text-sm text-muted-foreground">
          Análise avançada da carteira de empréstimos.
        </p>
      </div>

      {/* Filtros */}
      <Card className="glass-panel hover-lift">
        <div className="glass-glow" />
        <CardHeader className="relative">
          <CardTitle>Filtros e exportação</CardTitle>
        </CardHeader>
        <CardContent className="relative space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={filtroStatus}
                onValueChange={setFiltroStatus}
              >
                <SelectTrigger className="rounded-2xl bg-background/70 border-white/10">
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="ativo">Ativos</SelectItem>
                  <SelectItem value="pago">Pagos</SelectItem>
                  <SelectItem value="vencido">Vencidos</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-wrap gap-2 md:col-span-2 justify-end">
              <Button
                onClick={handleExportarPDF}
                variant="outline"
                className="apple-button"
              >
                <Download className="w-4 h-4 mr-2" />
                Exportar PDF
              </Button>
              <Button
                onClick={handleExportarExcel}
                variant="outline"
                className="apple-button"
              >
                <Download className="w-4 h-4 mr-2" />
                Exportar Excel
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cards de métricas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {cardStats.map((card, index) => {
          const Icon = card.icon;
          return (
            <Card
              key={card.title}
              className="glass-panel hover-lift"
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              <div className="glass-glow" />
              <CardHeader className="relative flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-xs font-medium text-muted-foreground">
                  {card.title}
                </CardTitle>
                <div className={`p-2 rounded-xl ${card.bgColor}`}>
                  <Icon className={`w-4 h-4 ${card.color}`} />
                </div>
              </CardHeader>
              <CardContent className="relative">
                <div className="text-2xl font-semibold tracking-tight">
                  {card.value}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Distribuição por status */}
      <Card className="glass-panel hover-lift">
        <div className="glass-glow" />
        <CardHeader className="relative">
          <CardTitle>Distribuição por status</CardTitle>
        </CardHeader>
        <CardContent className="relative">
          <div className="space-y-4">
            {["ativo", "pago", "vencido"].map((status) => {
              const count = emprestimos.filter(
                (e) => e.status === status
              ).length;
              const total = emprestimos.length || 1;
              const percentage = (count / total) * 100;
              const valorTotal = emprestimos
                .filter((e) => e.status === status)
                .reduce(
                  (acc, emp) => acc + emp.valorTotal,
                  0
                );

              const colors: Record<string, string> = {
                ativo: "bg-info",
                pago: "bg-success",
                vencido: "bg-destructive",
              };

              return (
                <div key={status} className="space-y-2">
                  <div className="flex justify-between text-xs md:text-sm">
                    <span className="capitalize font-medium">
                      {status}
                    </span>
                    <div className="flex gap-4">
                      <span className="text-muted-foreground">
                        {count} empréstimos
                      </span>
                      <span className="font-semibold">
                        {formatCurrency(valorTotal)}
                      </span>
                    </div>
                  </div>
                  <div className="w-full bg-black/25 rounded-full h-3 overflow-hidden">
                    <div
                      className={`h-3 rounded-full ${colors[status]} transition-all duration-300 flex items-center justify-end pr-2`}
                      style={{ width: `${percentage}%` }}
                    >
                      {percentage > 15 && (
                        <span className="text-[10px] text-white font-medium">
                          {percentage.toFixed(0)}%
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {emprestimos.length === 0 && (
        <Card className="glass-panel">
          <div className="glass-glow" />
          <CardContent className="relative text-center py-12">
            <BarChart3 className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-sm text-muted-foreground">
              Nenhum dado disponível para os filtros selecionados.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default RelatoriosAvancados;
