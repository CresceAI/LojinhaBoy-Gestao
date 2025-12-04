import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { getEmprestimos, getClientes } from "@/utils/storage";
import { formatCurrency, formatDate } from "@/utils/calculations";
import { Emprestimo, Cliente } from "@/types";
import { Search, AlertCircle, Clock } from "lucide-react";

const CobrancaPage = () => {
  const [emprestimos, setEmprestimos] = useState<Emprestimo[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [busca, setBusca] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    const emprestimosAbertos = getEmprestimos()
      .filter((e) => e.status === "ativo" || e.status === "vencido")
      .sort(
        (a, b) =>
          new Date(a.dataVencimento).getTime() -
          new Date(b.dataVencimento).getTime()
      );

    setEmprestimos(emprestimosAbertos);
    setClientes(getClientes());
  };

  const getClienteNome = (clienteId: string) => {
    return (
      clientes.find((c) => c.id === clienteId)?.nome ||
      "Cliente não encontrado"
    );
  };

  const emprestimosFiltrados = emprestimos.filter((emp) => {
    const nomeCliente = getClienteNome(emp.clienteId).toLowerCase();
    return nomeCliente.includes(busca.toLowerCase());
  });

  const calcularDiasAtraso = (dataVencimento: string) => {
    const hoje = new Date();
    const vencimento = new Date(dataVencimento);
    const diffTime = hoje.getTime() - vencimento.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold tracking-tight">
          Cobrança rápida
        </h1>
        <p className="text-sm text-muted-foreground">
          Encontre rapidamente quem está devendo e quanto ainda falta receber.
        </p>
      </div>

      {/* Busca em estilo glass */}
      <div className="glass-panel hover-lift px-3 py-2">
        <div className="glass-glow" />
        <div className="relative flex items-center gap-2">
          <Search className="w-5 h-5 text-muted-foreground shrink-0" />
          <Input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar por nome do cliente..."
            className="border-0 bg-transparent shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 px-0"
            autoFocus
          />
        </div>
      </div>

      {/* Lista de dívidas */}
      <div className="space-y-3">
        {emprestimosFiltrados.map((emp) => {
          const isVencido = new Date(emp.dataVencimento) < new Date();
          const diasAtraso = calcularDiasAtraso(emp.dataVencimento);
          const valorDevendo = emp.valorTotal - emp.valorPago;

          return (
            <Card
              key={emp.id}
              className={`glass-panel hover-lift animate-scale-in ${
                isVencido ? "border-destructive/60" : ""
              }`}
            >
              <div className="glass-glow" />
              <CardContent className="relative pt-5 pb-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-3 flex-1">
                    {/* Nome + badge atraso */}
                    <div className="flex items-center gap-3 flex-wrap">
                      <h3 className="text-lg font-semibold leading-tight">
                        {getClienteNome(emp.clienteId)}
                      </h3>
                      {isVencido && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-destructive/12 text-destructive px-3 py-1 text-xs font-medium">
                          <AlertCircle className="w-3 h-3" />
                          {diasAtraso}d em atraso
                        </span>
                      )}
                    </div>

                    {/* Métricas principais */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div className="rounded-2xl bg-black/15 p-3">
                        <p className="text-[11px] text-muted-foreground mb-1">
                          Total devendo
                        </p>
                        <p className="text-xl font-semibold text-destructive">
                          {formatCurrency(valorDevendo)}
                        </p>
                      </div>

                      <div className="rounded-2xl bg-black/15 p-3">
                        <p className="text-[11px] text-muted-foreground mb-1">
                          Juros (seu lucro)
                        </p>
                        <p className="text-base font-semibold text-success">
                          {formatCurrency(emp.juros)}
                        </p>
                      </div>

                      <div className="rounded-2xl bg-black/15 p-3">
                        <p className="text-[11px] text-muted-foreground mb-1 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          Vencimento
                        </p>
                        <p
                          className={`text-sm font-medium ${
                            isVencido ? "text-destructive" : "text-foreground"
                          }`}
                        >
                          {formatDate(emp.dataVencimento)}
                        </p>
                      </div>
                    </div>

                    {/* Linha de detalhes */}
                    <div className="flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground">
                      <span>Emprestado: {formatCurrency(emp.valor)}</span>
                      <span>•</span>
                      <span>Início: {formatDate(emp.dataInicio)}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Estados vazios */}
      {emprestimosFiltrados.length === 0 && emprestimos.length > 0 && (
        <Card className="glass-panel">
          <div className="glass-glow" />
          <CardContent className="relative text-center py-12 space-y-3">
            <Search className="w-10 h-10 mx-auto text-muted-foreground mb-2" />
            <p className="text-sm font-medium">
              Nenhum cliente encontrado com esse nome
            </p>
            <p className="text-xs text-muted-foreground">
              Verifique a ortografia ou limpe o campo de busca.
            </p>
          </CardContent>
        </Card>
      )}

      {emprestimos.length === 0 && (
        <Card className="glass-panel">
          <div className="glass-glow" />
          <CardContent className="relative text-center py-12 space-y-3">
            <AlertCircle className="w-10 h-10 mx-auto text-muted-foreground mb-2" />
            <p className="text-sm font-medium">
              Nenhuma dívida em aberto no momento
            </p>
            <p className="text-xs text-muted-foreground">
              Todos os empréstimos foram pagos. Bom sinal!
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default CobrancaPage;
