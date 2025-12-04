import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  getClientes,
  getEmprestimos,
  addEmprestimo,
  updateEmprestimo,
  saveEmprestimos,
} from "@/utils/storage";
import { formatCurrency } from "@/utils/calculations";
import { Cliente, Emprestimo } from "@/types";
import { Search, User, DollarSign, ChevronRight } from "lucide-react";
import ClienteHistoricoModal from "@/components/ClienteHistoricoModal";
import EditEmprestimoModal from "@/components/EditEmprestimoModal";
import { toast } from "sonner";

const ClientesPage = () => {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [emprestimos, setEmprestimos] = useState<Emprestimo[]>([]);
  const [busca, setBusca] = useState("");

  const [selectedCliente, setSelectedCliente] = useState<Cliente | null>(null);
  const [isHistoricoOpen, setIsHistoricoOpen] = useState(false);
  const [editingEmprestimo, setEditingEmprestimo] =
    useState<Emprestimo | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setClientes(
      getClientes().sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"))
    );
    setEmprestimos(getEmprestimos());
  };

  const clientesFiltrados = clientes.filter((cliente) =>
    cliente.nome.toLowerCase().includes(busca.toLowerCase())
  );

  const getTotalDevendo = (clienteId: string) => {
    return emprestimos
      .filter(
        (e) =>
          e.clienteId === clienteId &&
          (e.status === "ativo" || e.status === "vencido")
      )
      .reduce((acc, e) => acc + (e.valorTotal - e.valorPago), 0);
  };

  const getEmprestimosAtivos = (clienteId: string) => {
    return emprestimos.filter(
      (e) =>
        e.clienteId === clienteId &&
        (e.status === "ativo" || e.status === "vencido")
    ).length;
  };

  const handleClienteClick = (cliente: Cliente) => {
    setSelectedCliente(cliente);
    setIsHistoricoOpen(true);
  };

  const handleAddEmprestimo = (emprestimo: Emprestimo) => {
    addEmprestimo(emprestimo);
    toast.success("Empréstimo adicionado!");
    loadData();
  };

  const handleEditEmprestimo = (emprestimo: Emprestimo) => {
    setEditingEmprestimo(emprestimo);
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = (updated: Emprestimo) => {
    updateEmprestimo(updated.id, updated);
    toast.success("Empréstimo atualizado!");
    loadData();
  };

  const handleMarcarPago = (emprestimo: Emprestimo) => {
    updateEmprestimo(emprestimo.id, {
      status: "pago",
      valorPago: emprestimo.valorTotal,
    });
    toast.success("Marcado como pago!");
    loadData();
  };

  const handleDeleteEmprestimo = (id: string) => {
    const filtered = emprestimos.filter((e) => e.id !== id);
    saveEmprestimos(filtered);
    toast.success("Empréstimo excluído!");
    loadData();
  };

  const totalClientes = clientes.length;
  const totalEmprestimos = emprestimos.length;

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl mx-auto">
      {/* Header + resumo numérico */}
      <div className="flex flex-col gap-3">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Clientes</h1>
          <p className="text-sm text-muted-foreground">
            Toque em um cliente para ver histórico, cobrar ou adicionar novos
            empréstimos.
          </p>
        </div>

        {/* mini-cards: total clientes x contratos */}
        <div className="flex flex-wrap gap-3">
          <div className="glass-panel px-4 py-2 hover-lift">
            <div className="glass-glow" />
            <div className="relative text-xs text-muted-foreground">
              Total de clientes
              <p className="text-base font-semibold text-foreground">
                {totalClientes}
              </p>
            </div>
          </div>

          <div className="glass-panel px-4 py-2 hover-lift">
            <div className="glass-glow" />
            <div className="relative text-xs text-muted-foreground">
              Total de empréstimos
              <p className="text-base font-semibold text-foreground">
                {totalEmprestimos}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Busca em estilo glass */}
      <div className="relative glass-panel hover-lift px-3 py-2">
        <div className="glass-glow" />
        <div className="relative flex items-center gap-2">
          <Search className="w-5 h-5 text-muted-foreground shrink-0" />
          <Input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar cliente por nome..."
            className="border-0 bg-transparent shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 px-0"
          />
        </div>
      </div>

      {/* Lista de clientes */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {clientesFiltrados.map((cliente) => {
          const totalDevendo = getTotalDevendo(cliente.id);
          const emprestimosAtivos = getEmprestimosAtivos(cliente.id);

          return (
            <Card
              key={cliente.id}
              className="glass-panel hover-lift cursor-pointer animate-scale-in"
              onClick={() => handleClienteClick(cliente)}
            >
              <div className="glass-glow" />
              <CardContent className="relative pt-5 pb-4">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-2xl bg-[hsl(var(--neon))/0.16]">
                    <User className="w-6 h-6 text-[hsl(var(--neon))]" />
                  </div>

                  <div className="flex-1 space-y-1">
                    <h3 className="text-base font-semibold leading-tight">
                      {cliente.nome}
                    </h3>

                    <div className="flex items-center gap-3 flex-wrap">
                      {totalDevendo > 0 ? (
                        <div className="inline-flex items-center gap-1 rounded-full bg-destructive/10 px-2 py-0.5">
                          <DollarSign className="w-3 h-3 text-destructive" />
                          <span className="text-xs font-medium text-destructive">
                            {formatCurrency(totalDevendo)}
                          </span>
                        </div>
                      ) : (
                        <span className="badge-status-pago text-[11px]">
                          ✓ Sem dívidas
                        </span>
                      )}

                      <span className="text-[11px] text-muted-foreground">
                        {emprestimosAtivos} empréstimo(s) ativo(s)
                      </span>
                    </div>
                  </div>

                  <ChevronRight className="w-5 h-5 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Estados vazios */}
      {clientesFiltrados.length === 0 && clientes.length > 0 && (
        <Card className="glass-panel">
          <div className="glass-glow" />
          <CardContent className="relative text-center py-12 space-y-3">
            <Search className="w-10 h-10 mx-auto text-muted-foreground mb-2" />
            <p className="text-sm font-medium">Nenhum cliente encontrado</p>
            <p className="text-xs text-muted-foreground">
              Tente buscar por outro nome ou limpe o campo de pesquisa.
            </p>
          </CardContent>
        </Card>
      )}

      {clientes.length === 0 && (
        <Card className="glass-panel">
          <div className="glass-glow" />
          <CardContent className="relative text-center py-12 space-y-3">
            <User className="w-10 h-10 mx-auto text-muted-foreground mb-2" />
            <p className="text-sm font-medium">
              Nenhum cliente cadastrado ainda
            </p>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              Os clientes são criados automaticamente quando você registra um
              novo empréstimo. Comece adicionando o primeiro contrato.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Modais */}
      <ClienteHistoricoModal
        cliente={selectedCliente}
        emprestimos={emprestimos}
        isOpen={isHistoricoOpen}
        onClose={() => {
          setIsHistoricoOpen(false);
          setSelectedCliente(null);
        }}
        onAddEmprestimo={handleAddEmprestimo}
        onEditEmprestimo={handleEditEmprestimo}
        onMarcarPago={handleMarcarPago}
      />

      <EditEmprestimoModal
        emprestimo={editingEmprestimo}
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingEmprestimo(null);
        }}
        onSave={handleSaveEdit}
        onDelete={handleDeleteEmprestimo}
      />
    </div>
  );
};

export default ClientesPage;
