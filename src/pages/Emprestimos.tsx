import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  getEmprestimos,
  addEmprestimo,
  getClientes,
  addCliente,
  updateEmprestimo,
  saveEmprestimos,
} from "@/utils/storage";
import {
  generateId,
  formatCurrency,
  formatDate,
} from "@/utils/calculations";
import { Emprestimo, Cliente } from "@/types";
import { DollarSign, CheckCircle, Edit2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import EditEmprestimoModal from "@/components/EditEmprestimoModal";

const EmprestimosPage = () => {
  const [emprestimos, setEmprestimos] = useState<Emprestimo[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);

  // Form
  const [nomeCliente, setNomeCliente] = useState("");
  const [valor, setValor] = useState("");
  const [juros, setJuros] = useState("");
  const [dataInicio, setDataInicio] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [dataVencimento, setDataVencimento] = useState("");

  // Edit modal
  const [editingEmprestimo, setEditingEmprestimo] =
    useState<Emprestimo | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (dataInicio) {
      const inicio = new Date(dataInicio);
      const vencimento = new Date(inicio);
      vencimento.setDate(vencimento.getDate() + 30);
      setDataVencimento(vencimento.toISOString().split("T")[0]);
    }
  }, [dataInicio]);

  const loadData = () => {
    setEmprestimos(
      getEmprestimos().sort(
        (a, b) =>
          new Date(b.createdAt).getTime() -
          new Date(a.createdAt).getTime()
      )
    );
    setClientes(getClientes());
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!nomeCliente.trim() || !valor || !juros) {
      toast.error("Preencha nome, valor e juros");
      return;
    }

    const valorNum = parseFloat(valor);
    const jurosNum = parseFloat(juros);

    if (
      isNaN(valorNum) ||
      isNaN(jurosNum) ||
      valorNum <= 0 ||
      jurosNum < 0
    ) {
      toast.error("Valor e juros devem ser números válidos");
      return;
    }

    let cliente = clientes.find(
      (c) =>
        c.nome.toLowerCase() === nomeCliente.trim().toLowerCase()
    );

    if (!cliente) {
      cliente = {
        id: generateId(),
        nome: nomeCliente.trim(),
        createdAt: new Date().toISOString(),
      };
      addCliente(cliente);
    }

    const valorTotal = valorNum + jurosNum;

    const novoEmprestimo: Emprestimo = {
      id: generateId(),
      clienteId: cliente.id,
      valor: valorNum,
      dataInicio,
      dataVencimento,
      juros: jurosNum,
      formaPagamento: "vista",
      status: "ativo",
      valorTotal,
      valorPago: 0,
      createdAt: new Date().toISOString(),
    };

    addEmprestimo(novoEmprestimo);
    toast.success("Empréstimo cadastrado!");

    setNomeCliente("");
    setValor("");
    setJuros("");
    setDataInicio(new Date().toISOString().split("T")[0]);

    loadData();
  };

  const handleMarcarPago = (emprestimo: Emprestimo) => {
    updateEmprestimo(emprestimo.id, {
      status: "pago",
      valorPago: emprestimo.valorTotal,
    });
    toast.success("Empréstimo marcado como pago!");
    loadData();
  };

  const handleEdit = (emprestimo: Emprestimo) => {
    setEditingEmprestimo(emprestimo);
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = (updated: Emprestimo) => {
    updateEmprestimo(updated.id, updated);
    toast.success("Empréstimo atualizado!");
    loadData();
  };

  const handleDelete = (id: string) => {
    const filtered = emprestimos.filter((e) => e.id !== id);
    saveEmprestimos(filtered);
    toast.success("Empréstimo excluído!");
    loadData();
  };

  const getClienteNome = (clienteId: string) => {
    return (
      clientes.find((c) => c.id === clienteId)?.nome ||
      "Cliente não encontrado"
    );
  };

  const calcularTotal = () => {
    const valorNum = parseFloat(valor) || 0;
    const jurosNum = parseFloat(juros) || 0;
    return valorNum + jurosNum;
  };

  const totalContratos = emprestimos.length;

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl mx-auto">
      {/* Header + resumo */}
      <div className="flex flex-col gap-3">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">
            Novo empréstimo
          </h1>
          <p className="text-sm text-muted-foreground">
            Cadastro rápido em uma única tela, com cálculo automático de
            total e vencimento.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <div className="glass-panel px-4 py-2 hover-lift">
            <div className="glass-glow" />
            <div className="relative text-xs text-muted-foreground">
              Contratos cadastrados
              <p className="text-base font-semibold text-foreground">
                {totalContratos}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Form em card glass */}
      <Card className="glass-panel">
        <div className="glass-glow" />
        <CardContent className="relative pt-6">
          <form
            onSubmit={handleSubmit}
            className="space-y-5"
          >
            <div className="space-y-2">
              <Label htmlFor="nome">Nome do cliente</Label>
              <Input
                id="nome"
                value={nomeCliente}
                onChange={(e) => setNomeCliente(e.target.value)}
                placeholder="Ex: João Silva"
                className="rounded-2xl bg-background/60"
                autoFocus
                list="clientes-list"
              />
              <datalist id="clientes-list">
                {clientes.map((c) => (
                  <option key={c.id} value={c.nome} />
                ))}
              </datalist>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="valor">Valor emprestado (R$)</Label>
                <Input
                  id="valor"
                  type="number"
                  step="0.01"
                  value={valor}
                  onChange={(e) => setValor(e.target.value)}
                  placeholder="Ex: 550"
                  className="rounded-2xl bg-background/60"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="juros">Juros (R$)</Label>
                <Input
                  id="juros"
                  type="number"
                  step="0.01"
                  value={juros}
                  onChange={(e) => setJuros(e.target.value)}
                  placeholder="Ex: 165"
                  className="rounded-2xl bg-background/60"
                />
              </div>
            </div>

            {(valor || juros) && (
              <div className="glass-panel px-4 py-3 hover-lift">
                <div className="glass-glow" />
                <div className="relative">
                  <p className="text-sm font-medium text-[hsl(var(--neon))]">
                    Total a receber: {formatCurrency(calcularTotal())}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Seu lucro: {formatCurrency(parseFloat(juros) || 0)}
                  </p>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="dataInicio">Data do empréstimo</Label>
                <Input
                  id="dataInicio"
                  type="date"
                  value={dataInicio}
                  onChange={(e) => setDataInicio(e.target.value)}
                  className="rounded-2xl bg-background/60"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="dataVencimento">
                  Data de vencimento
                </Label>
                <Input
                  id="dataVencimento"
                  type="date"
                  value={dataVencimento}
                  onChange={(e) => setDataVencimento(e.target.value)}
                  className="rounded-2xl bg-background/60"
                />
              </div>
            </div>

            <Button
              type="submit"
              className="w-full btn-neon-primary"
            >
              <DollarSign className="w-4 h-4 mr-2" />
              Cadastrar empréstimo
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Lista de empréstimos */}
      <div>
        <h2 className="text-2xl font-semibold mb-4">
          Empréstimos cadastrados
        </h2>
        <div className="space-y-3">
          {emprestimos.map((emp) => {
            const isVencido =
              new Date(emp.dataVencimento) < new Date() &&
              emp.status === "ativo";

            return (
              <Card
                key={emp.id}
                className={`glass-panel animate-scale-in ${
                  isVencido ? "border-destructive/60" : ""
                }`}
              >
                <div className="glass-glow" />
                <CardContent className="relative pt-5 pb-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-3 flex-1">
                      <div className="flex items-center gap-3 flex-wrap">
                        <h3 className="text-lg font-semibold">
                          {getClienteNome(emp.clienteId)}
                        </h3>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${
                            emp.status === "pago"
                              ? "bg-success/10 text-success"
                              : isVencido
                              ? "bg-destructive/10 text-destructive"
                              : "bg-warning/10 text-warning"
                          }`}
                        >
                          {emp.status === "pago"
                            ? "Pago"
                            : isVencido
                            ? "Vencido"
                            : "Ativo"}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">
                            Emprestado
                          </p>
                          <p className="font-medium">
                            {formatCurrency(emp.valor)}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Juros</p>
                          <p className="font-medium text-success">
                            {formatCurrency(emp.juros)}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Total</p>
                          <p className="font-semibold">
                            {formatCurrency(emp.valorTotal)}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">
                            Vencimento
                          </p>
                          <p className="font-medium">
                            {formatDate(emp.dataVencimento)}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-2 ml-2">
                      {emp.status !== "pago" && (
                        <div className="flex gap-2">
                          <Button
                            onClick={() => handleEdit(emp)}
                            variant="outline"
                            size="icon"
                            className="h-9 w-9"
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button
                            onClick={() => handleMarcarPago(emp)}
                            variant="outline"
                            size="sm"
                            className="apple-button"
                          >
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Pago
                          </Button>
                        </div>
                      )}
                      <Button
                        onClick={() => {
                          if (confirm("Excluir este empréstimo?")) {
                            handleDelete(emp.id);
                          }
                        }}
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {emprestimos.length === 0 && (
          <Card className="glass-panel mt-4">
            <div className="glass-glow" />
            <CardContent className="relative text-center py-12">
              <DollarSign className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
              <p className="text-sm text-muted-foreground">
                Nenhum empréstimo cadastrado ainda
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      <EditEmprestimoModal
        emprestimo={editingEmprestimo}
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingEmprestimo(null);
        }}
        onSave={handleSaveEdit}
        onDelete={handleDelete}
      />
    </div>
  );
};

export default EmprestimosPage;
