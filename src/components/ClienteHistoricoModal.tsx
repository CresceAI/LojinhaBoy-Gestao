import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Cliente, Emprestimo } from "@/types";
import {
  formatCurrency,
  formatDate,
  generateId,
} from "@/utils/calculations";
import {
  Plus,
  Edit2,
  CheckCircle,
  DollarSign,
  Calendar,
} from "lucide-react";

interface ClienteHistoricoModalProps {
  cliente: Cliente | null;
  emprestimos: Emprestimo[];
  isOpen: boolean;
  onClose: () => void;
  onAddEmprestimo: (emprestimo: Emprestimo) => void;
  onEditEmprestimo: (emprestimo: Emprestimo) => void;
  onMarcarPago: (emprestimo: Emprestimo) => void;
}

const ClienteHistoricoModal = ({
  cliente,
  emprestimos,
  isOpen,
  onClose,
  onAddEmprestimo,
  onEditEmprestimo,
  onMarcarPago,
}: ClienteHistoricoModalProps) => {
  const [showForm, setShowForm] = useState(false);
  const [valor, setValor] = useState("");
  const [juros, setJuros] = useState("");
  const [dataInicio, setDataInicio] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [dataVencimento, setDataVencimento] = useState("");

  useEffect(() => {
    if (dataInicio) {
      const inicio = new Date(dataInicio);
      const vencimento = new Date(inicio);
      vencimento.setDate(vencimento.getDate() + 30);
      setDataVencimento(vencimento.toISOString().split("T")[0]);
    }
  }, [dataInicio]);

  if (!cliente) return null;

  const clienteEmprestimos = emprestimos
    .filter((e) => e.clienteId === cliente.id)
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() -
        new Date(a.createdAt).getTime()
    );

  const totalDevendo = clienteEmprestimos
    .filter((e) => e.status === "ativo" || e.status === "vencido")
    .reduce(
      (acc, e) => acc + (e.valorTotal - e.valorPago),
      0
    );

  const totalPago = clienteEmprestimos
    .filter((e) => e.status === "pago")
    .reduce((acc, e) => acc + e.valorTotal, 0);

  const lucroTotal = clienteEmprestimos
    .filter((e) => e.status === "pago")
    .reduce((acc, e) => acc + e.juros, 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cliente) return;

    const valorNum = parseFloat(valor);
    const jurosNum = parseFloat(juros);

    if (
      isNaN(valorNum) ||
      isNaN(jurosNum) ||
      valorNum <= 0 ||
      jurosNum < 0
    ) {
      return;
    }

    const novoEmprestimo: Emprestimo = {
      id: generateId(),
      clienteId: cliente.id,
      valor: valorNum,
      dataInicio,
      dataVencimento,
      juros: jurosNum,
      formaPagamento: "vista",
      status: "ativo",
      valorTotal: valorNum + jurosNum,
      valorPago: 0,
      createdAt: new Date().toISOString(),
    };

    onAddEmprestimo(novoEmprestimo);
    setShowForm(false);
    setValor("");
    setJuros("");
    setDataInicio(new Date().toISOString().split("T")[0]);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      {/* NÃO coloque glass-panel aqui para não quebrar o layout fixo do shadcn */}
      <DialogContent className="sm:max-w-lg p-0 border-0 bg-transparent">
        {/* Container real do modal com glass, scroll e tudo */}
        <div className="glass-panel max-h-[90vh] overflow-y-auto">
          <div className="glass-glow" />

          <div className="relative px-5 pt-5 pb-4 space-y-5">
            <DialogHeader className="mb-2">
              <DialogTitle className="flex items-center gap-2 text-lg">
                {cliente.nome}
              </DialogTitle>
            </DialogHeader>

            {/* Resumo */}
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-2xl bg-destructive/15 py-3 text-center">
                <p className="text-[11px] text-muted-foreground">Deve</p>
                <p className="text-lg font-semibold text-destructive">
                  {formatCurrency(totalDevendo)}
                </p>
              </div>
              <div className="rounded-2xl bg-success/15 py-3 text-center">
                <p className="text-[11px] text-muted-foreground">Pago</p>
                <p className="text-lg font-semibold text-success">
                  {formatCurrency(totalPago)}
                </p>
              </div>
              <div className="rounded-2xl bg-[hsl(var(--neon))/0.18] py-3 text-center">
                <p className="text-[11px] text-muted-foreground">
                  Seu lucro
                </p>
                <p className="text-lg font-semibold text-[hsl(var(--neon))]">
                  {formatCurrency(lucroTotal)}
                </p>
              </div>
            </div>

            {/* Botão Novo Empréstimo */}
            {!showForm && (
              <Button
                onClick={() => setShowForm(true)}
                className="w-full btn-neon-primary"
              >
                <Plus className="w-4 h-4 mr-2" />
                Novo empréstimo para {cliente.nome}
              </Button>
            )}

            {/* Formulário */}
            {showForm && (
              <form
                onSubmit={handleSubmit}
                className="space-y-3 rounded-2xl border border-white/10 bg-black/30 p-4 backdrop-blur-xl"
              >
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Valor (R$)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={valor}
                      onChange={(e) => setValor(e.target.value)}
                      placeholder="550"
                      className="rounded-2xl bg-background/80"
                      autoFocus
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Juros (R$)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={juros}
                      onChange={(e) => setJuros(e.target.value)}
                      placeholder="165"
                      className="rounded-2xl bg-background/80"
                    />
                  </div>
                </div>

                {(valor || juros) && (
                  <div className="rounded-xl bg-[hsl(var(--neon))/0.12] py-2 text-center">
                    <span className="text-sm font-medium text-[hsl(var(--neon))]">
                      Total:{" "}
                      {formatCurrency(
                        (parseFloat(valor) || 0) +
                          (parseFloat(juros) || 0)
                      )}
                    </span>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Início</Label>
                    <Input
                      type="date"
                      value={dataInicio}
                      onChange={(e) => setDataInicio(e.target.value)}
                      className="rounded-2xl bg-background/80"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Vencimento</Label>
                    <Input
                      type="date"
                      value={dataVencimento}
                      onChange={(e) => setDataVencimento(e.target.value)}
                      className="rounded-2xl bg-background/80"
                    />
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button type="submit" className="flex-1 btn-neon-primary">
                    Adicionar
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowForm(false)}
                    className="flex-1 apple-button"
                  >
                    Cancelar
                  </Button>
                </div>
              </form>
            )}

            {/* Lista de Empréstimos */}
            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-muted-foreground">
                Histórico ({clienteEmprestimos.length})
              </h4>

              {clienteEmprestimos.map((emp) => {
                const isVencido =
                  new Date(emp.dataVencimento) < new Date() &&
                  emp.status === "ativo";

                return (
                  <div
                    key={emp.id}
                    className={`rounded-2xl border px-3 py-3 text-xs ${
                      emp.status === "pago"
                        ? "bg-success/10 border-success/20"
                        : isVencido
                        ? "bg-destructive/10 border-destructive/25"
                        : "bg-warning/10 border-warning/20"
                    }`}
                  >
                    <div className="mb-2 flex items-center justify-between">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${
                          emp.status === "pago"
                            ? "bg-success/20 text-success"
                            : isVencido
                            ? "bg-destructive/20 text-destructive"
                            : "bg-warning/20 text-warning"
                        }`}
                      >
                        {emp.status === "pago"
                          ? "Pago"
                          : isVencido
                          ? "Vencido"
                          : "Ativo"}
                      </span>

                      <div className="flex gap-1">
                        {emp.status !== "pago" && (
                          <>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => onEditEmprestimo(emp)}
                              className="h-7 w-7 p-0"
                            >
                              <Edit2 className="w-3 h-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => onMarcarPago(emp)}
                              className="h-7 w-7 p-0 text-success"
                            >
                              <CheckCircle className="w-3 h-3" />
                            </Button>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="flex items-center gap-1">
                        <DollarSign className="w-3 h-3 text-muted-foreground" />
                        <span>
                          Total:{" "}
                          <strong>
                            {formatCurrency(emp.valorTotal)}
                          </strong>
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-muted-foreground" />
                        <span>Vence: {formatDate(emp.dataVencimento)}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">
                          Emprestado:
                        </span>{" "}
                        {formatCurrency(emp.valor)}
                      </div>
                      <div>
                        <span className="text-muted-foreground">
                          Juros:
                        </span>{" "}
                        {formatCurrency(emp.juros)}
                      </div>
                    </div>
                  </div>
                );
              })}

              {clienteEmprestimos.length === 0 && (
                <p className="py-4 text-center text-sm text-muted-foreground">
                  Nenhum empréstimo registrado
                </p>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ClienteHistoricoModal;
