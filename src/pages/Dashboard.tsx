import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getEmprestimos, getClientes, getCurrentUser } from "@/utils/storage";
import { formatCurrency, isVencimentoProximo } from "@/utils/calculations";
import { checkAndCreateNotifications } from "@/utils/notifications";
import {
  DollarSign,
  TrendingUp,
  AlertCircle,
  Clock,
  Calendar,
} from "lucide-react";
import { DashboardStats, Emprestimo } from "@/types";
import { useIsMobile } from "@/hooks/use-mobile";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

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
  const [proximosVencimentos, setProximosVencimentos] = useState<
    EmprestimoComCliente[]
  >([]);
  const [transacoesRecentes, setTransacoesRecentes] = useState<
    EmprestimoComCliente[]
  >([]);

  useEffect(() => {
    const emprestimos = getEmprestimos();
    const clientes = getClientes();
    checkAndCreateNotifications(emprestimos);

    const totalEmprestado = emprestimos.reduce(
      (acc, emp) => acc + emp.valorTotal,
      0
    );
    const totalRecebido = emprestimos.reduce(
      (acc, emp) => acc + emp.valorPago,
      0
    );
    const emprestimosAbertos = emprestimos.filter(
      (e) => e.status === "ativo"
    ).length;
    const vencimentosProximos = emprestimos.filter(
      (e) => e.status === "ativo" && isVencimentoProximo(e.dataVencimento)
    ).length;

    const lucroRecebido = emprestimos
      .filter((e) => e.status === "pago")
      .reduce((acc, emp) => acc + emp.juros, 0);

    setStats({
      totalEmprestado,
      totalRecebido,
      emprestimosAbertos,
      vencimentosProximos,
      lucroRecebido,
    });

    const proximos = emprestimos
      .filter((e) => e.status === "ativo")
      .sort(
        (a, b) =>
          new Date(a.dataVencimento).getTime() -
          new Date(b.dataVencimento).getTime()
      )
      .slice(0, 3)
      .map((emp) => ({
        ...emp,
        clienteNome:
          clientes.find((c) => c.id === emp.clienteId)?.nome ||
          "Cliente não encontrado",
      }));
    setProximosVencimentos(proximos);

    const recentes = emprestimos
      .filter((e) => e.status === "pago")
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() -
          new Date(a.createdAt).getTime()
      )
      .slice(0, 5)
      .map((emp) => ({
        ...emp,
        clienteNome:
          clientes.find((c) => c.id === emp.clienteId)?.nome ||
          "Cliente não encontrado",
      }));
    setTransacoesRecentes(recentes);
  }, []);

  const cards = [
    {
      title: "Total Emprestado",
      value: formatCurrency(stats.totalEmprestado),
      icon: DollarSign,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      title: "Total Recebido",
      value: formatCurrency(stats.totalRecebido),
      icon: TrendingUp,
      color: "text-success",
      bgColor: "bg-success/10",
    },
    {
      title: "Lucro Recebido",
      value: formatCurrency(stats.lucroRecebido),
      icon: TrendingUp,
      color: "text-success",
      bgColor: "bg-success/10",
    },
    {
      title: "Empréstimos Ativos",
      value: stats.emprestimosAbertos.toString(),
      icon: Clock,
      color: "text-info",
      bgColor: "bg-info/10",
    },
    {
      title: "Vencimentos Próximos",
      value: stats.vencimentosProximos.toString(),
      icon: AlertCircle,
      color: "text-warning",
      bgColor: "bg-warning/10",
    },
  ];

  /* ---------- MOBILE ---------- */

  if (isMobile) {
    return (
      <div className="space-y-4 pb-6 animate-fade-in">
        {/* Hero glass card */}
        <div className="glass-panel hover-lift p-5">
          <div className="glass-glow" />
          <div className="relative space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">
                  Bem-vindo de  volta
                </p>
                <h2 className="text-lg font-semibold">
                  {user?.name || "Chefe da Lojinha"}
                </h2>
              </div>
              <div className="p-3 rounded-2xl bg-[hsl(var(--neon))/0.2]">
                <DollarSign className="w-6 h-6 text-[hsl(var(--neon))]" />
              </div>
            </div>

            <div>
              <p className="text-xs text-muted-foreground mb-1">
                Saldo geral Chefe! (valor emprestado)
              </p>
              <p className="text-3xl font-bold tracking-tight text-[hsl(var(--neon))]">
                {formatCurrency(stats.totalRecebido - stats.totalEmprestado)}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-background/40 backdrop-blur-xl rounded-2xl p-3">
                <p className="text-xs text-muted-foreground mb-1">
                  Lucro recebido
                </p>
                <p className="text-lg font-semibold text-success">
                  {formatCurrency(stats.lucroRecebido)}
                </p>
              </div>
              <div className="bg-background/40 backdrop-blur-xl rounded-2xl p-3">
                <p className="text-xs text-muted-foreground mb-1">
                  Empréstimos ativos
                </p>
                <p className="text-lg font-semibold text-info">
                  {stats.emprestimosAbertos}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Próximos vencimentos */}
        {proximosVencimentos.length > 0 && (
          <Card className="glass-panel hover-lift">
            <div className="glass-glow" />
            <CardHeader className="relative pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-warning" />
                Próximos vencimentos
              </CardTitle>
            </CardHeader>
            <CardContent className="relative space-y-2">
              {proximosVencimentos.map((emp) => {
                const diasRestantes = Math.ceil(
                  (new Date(emp.dataVencimento).getTime() -
                    new Date().getTime()) /
                    (1000 * 60 * 60 * 24)
                );
                const isVencido = diasRestantes < 0;

                return (
                  <div
                    key={emp.id}
                    className="flex items-center justify-between p-3 rounded-2xl bg-black/10 hover:bg-black/20 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`p-2 rounded-full ${
                          isVencido ? "bg-destructive/15" : "bg-warning/15"
                        }`}
                      >
                        <Calendar
                          className={`w-4 h-4 ${
                            isVencido ? "text-destructive" : "text-warning"
                          }`}
                        />
                      </div>
                      <div>
                        <p className="text-sm font-medium">{emp.clienteNome}</p>
                        <p className="text-[11px] text-muted-foreground">
                          {format(
                            new Date(emp.dataVencimento),
                            "dd/MM/yyyy",
                            { locale: ptBR }
                          )}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold">
                        {formatCurrency(emp.valorTotal - emp.valorPago)}
                      </p>
                      <p
                        className={`text-[11px] ${
                          isVencido ? "text-destructive" : "text-warning"
                        }`}
                      >
                        {isVencido
                          ? `${Math.abs(diasRestantes)}d atraso`
                          : `${diasRestantes}d restantes`}
                      </p>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        )}

        {/* Transações recentes */}
        <Card className="glass-panel hover-lift">
          <div className="glass-glow" />
          <CardHeader className="relative pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-success" />
              Transações recentes
            </CardTitle>
          </CardHeader>
          <CardContent className="relative">
            {transacoesRecentes.length > 0 ? (
              <div className="space-y-2">
                {transacoesRecentes.map((emp) => (
                  <div
                    key={emp.id}
                    className="flex items-center justify-between p-3 rounded-2xl bg-black/10"
                  >
                    <div>
                      <p className="text-sm font-medium">{emp.clienteNome}</p>
                      <p className="text-[11px] text-muted-foreground">
                        {format(
                          new Date(emp.createdAt),
                          "dd/MM/yyyy 'às' HH:mm",
                          { locale: ptBR }
                        )}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-success">
                        +{formatCurrency(emp.valorTotal)}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        Lucro: {formatCurrency(emp.juros)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground text-sm">
                Nenhuma transação recente
              </div>
            )}
          </CardContent>
        </Card>

        {/* Estatísticas rápidas */}
        <div className="grid grid-cols-2 gap-3">
          <Card className="glass-panel hover-lift">
            <CardContent className="relative pt-4">
              <div className="glass-glow" />
              <div className="flex items-center gap-2 mb-2">
                <div className="p-2 rounded-lg bg-primary/15">
                  <DollarSign className="w-4 h-4 text-primary" />
                </div>
              </div>
              <p className="text-[11px] text-muted-foreground mb-1">
                Total emprestado
              </p>
              <p className="text-base font-semibold">
                {formatCurrency(stats.totalEmprestado)}
              </p>
            </CardContent>
          </Card>

          <Card className="glass-panel hover-lift">
            <CardContent className="relative pt-4">
              <div className="glass-glow" />
              <div className="flex items-center gap-2 mb-2">
                <div className="p-2 rounded-lg bg-success/15">
                  <TrendingUp className="w-4 h-4 text-success" />
                </div>
              </div>
              <p className="text-[11px] text-muted-foreground mb-1">
                Total recebido
              </p>
              <p className="text-base font-semibold">
                {formatCurrency(stats.totalRecebido)}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  /* ---------- DESKTOP ---------- */

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header + meta rápida */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">
            Dashboard
          </h1>
          <p className="text-sm text-muted-foreground">
            Visão geral dos seus empréstimos e lucros.
          </p>
        </div>
        <div className="glass-panel px-4 py-3 flex items-center gap-4 hover-lift">
          <div className="glass-glow" />
          <div>
            <p className="text-[11px] text-muted-foreground">
              Lucro recebido
            </p>
            <p className="text-sm font-semibold">
              {formatCurrency(stats.lucroRecebido)}
            </p>
          </div>
          <div className="h-8 w-px bg-border/60" />
          <div>
            <p className="text-[11px] text-muted-foreground">
              Empréstimos ativos
            </p>
            <p className="text-sm font-semibold">
              {stats.emprestimosAbertos}
            </p>
          </div>
        </div>
      </div>

      {/* Cards principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        {cards.map((card, index) => {
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
                <p className="text-2xl font-semibold tracking-tight">
                  {card.value}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Listas: transações e vencimentos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="glass-panel hover-lift">
          <div className="glass-glow" />
          <CardHeader className="relative">
            <CardTitle className="flex items-center gap-2 text-sm">
              <TrendingUp className="w-4 h-4 text-success" />
              Transações recentes
            </CardTitle>
          </CardHeader>
          <CardContent className="relative">
            {transacoesRecentes.length > 0 ? (
              <div className="space-y-3">
                {transacoesRecentes.map((emp) => (
                  <div
                    key={emp.id}
                    className="flex items-center justify-between p-3 rounded-2xl bg-black/10"
                  >
                    <div>
                      <p className="text-sm font-medium">{emp.clienteNome}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(
                          new Date(emp.createdAt),
                          "dd/MM/yyyy 'às' HH:mm",
                          { locale: ptBR }
                        )}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-success">
                        +{formatCurrency(emp.valorTotal)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Lucro: {formatCurrency(emp.juros)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-10 text-muted-foreground text-sm">
                Nenhuma transação recente
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="glass-panel hover-lift">
          <div className="glass-glow" />
          <CardHeader className="relative">
            <CardTitle className="flex items-center gap-2 text-sm">
              <AlertCircle className="w-4 h-4 text-warning" />
              Próximos vencimentos
            </CardTitle>
          </CardHeader>
          <CardContent className="relative">
            {proximosVencimentos.length > 0 ? (
              <div className="space-y-3">
                {proximosVencimentos.map((emp) => {
                  const diasRestantes = Math.ceil(
                    (new Date(emp.dataVencimento).getTime() -
                      new Date().getTime()) /
                      (1000 * 60 * 60 * 24)
                  );
                  const isVencido = diasRestantes < 0;

                  return (
                    <div
                      key={emp.id}
                      className="flex items-center justify-between p-3 rounded-2xl bg-black/10"
                    >
                      <div>
                        <p className="text-sm font-medium">
                          {emp.clienteNome}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Vence em{" "}
                          {format(
                            new Date(emp.dataVencimento),
                            "dd/MM/yyyy",
                            { locale: ptBR }
                          )}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold">
                          {formatCurrency(emp.valorTotal - emp.valorPago)}
                        </p>
                        <p
                          className={`text-xs ${
                            isVencido ? "text-destructive" : "text-warning"
                          }`}
                        >
                          {isVencido
                            ? `${Math.abs(diasRestantes)}d atraso`
                            : `${diasRestantes}d restantes`}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-10 text-muted-foreground text-sm">
                Nenhum vencimento próximo
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
