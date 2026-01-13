import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useClientes } from '@/hooks/useClientes';
import { useEmprestimos } from '@/hooks/useEmprestimos';
import { formatCurrency } from '@/utils/calculations';
import { Search, User, DollarSign, ChevronRight } from 'lucide-react';
import ClienteHistoricoModal from '@/components/ClienteHistoricoModal';
import EditEmprestimoModal from '@/components/EditEmprestimoModal';
import { toast } from 'sonner';

const ClientesPage = () => {
  const { clientes, loading: loadingClientes } = useClientes();
  const { 
    emprestimos, 
    addEmprestimo, 
    updateEmprestimo, 
    deleteEmprestimo, 
    marcarComoPago, 
    renovarEmprestimo, 
    loading: loadingEmprestimos 
  } = useEmprestimos();
  
  const [busca, setBusca] = useState('');
  
  // Modals
  const [selectedCliente, setSelectedCliente] = useState<any>(null);
  const [isHistoricoOpen, setIsHistoricoOpen] = useState(false);
  const [editingEmprestimo, setEditingEmprestimo] = useState<any>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const loading = loadingClientes || loadingEmprestimos;

  const clientesFiltrados = clientes.filter(cliente =>
    cliente.nome.toLowerCase().includes(busca.toLowerCase())
  );

  const getTotalDevendo = (clienteId: string) => {
    return emprestimos
      .filter(e => e.cliente_id === clienteId && (e.status === 'ativo' || e.status === 'vencido'))
      .reduce((acc, e) => acc + (Number(e.valor_total) - Number(e.valor_pago)), 0);
  };

  const getEmprestimosAtivos = (clienteId: string) => {
    return emprestimos.filter(e => e.cliente_id === clienteId && (e.status === 'ativo' || e.status === 'vencido')).length;
  };

  const handleClienteClick = (cliente: any) => {
    const clienteTransformed = {
      id: cliente.id,
      nome: cliente.nome,
      createdAt: cliente.created_at
    };
    setSelectedCliente(clienteTransformed);
    setIsHistoricoOpen(true);
  };

  const getEmprestimosForModal = () => {
    return emprestimos.map(emp => ({
      id: emp.id,
      clienteId: emp.cliente_id,
      valor: Number(emp.valor),
      juros: Number(emp.juros),
      valorTotal: Number(emp.valor_total),
      valorPago: Number(emp.valor_pago),
      dataInicio: emp.data_inicio,
      dataVencimento: emp.data_vencimento,
      formaPagamento: emp.forma_pagamento as 'parcelado' | 'vista',
      numeroParcelas: emp.numero_parcelas,
      status: emp.status as 'ativo' | 'pago' | 'vencido',
      createdAt: emp.created_at
    }));
  };

  const handleAddEmprestimo = async (emprestimo: any) => {
    const { error } = await addEmprestimo({
      cliente_id: emprestimo.clienteId,
      valor: emprestimo.valor,
      juros: emprestimo.juros,
      valor_total: emprestimo.valorTotal,
      valor_pago: 0,
      data_inicio: emprestimo.dataInicio,
      data_vencimento: emprestimo.dataVencimento,
      forma_pagamento: emprestimo.formaPagamento || 'vista',
      numero_parcelas: emprestimo.numeroParcelas || null,
      status: 'ativo'
    });

    if (error) toast.error('Erro ao adicionar');
    else toast.success('Adicionado!');
  };

  const handleEditEmprestimo = (emprestimo: any) => {
    setEditingEmprestimo(emprestimo);
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = async (updated: any) => {
    const { error } = await updateEmprestimo(updated.id, {
      valor: updated.valor,
      juros: updated.juros,
      valor_total: updated.valorTotal,
      data_inicio: updated.dataInicio,
      data_vencimento: updated.dataVencimento
    });
    
    if (error) toast.error('Erro ao atualizar');
    else { toast.success('Atualizado!'); setIsEditModalOpen(false); }
  };

  const handleMarcarPago = async (emprestimo: any) => {
    const { error } = await marcarComoPago(emprestimo.id, emprestimo.valorTotal);
    if (!error) toast.success('Quitado!');
  };

  const handleDeleteEmprestimo = async (id: string) => {
    const { error } = await deleteEmprestimo(id);
    if (!error) toast.success('Excluído!');
  };

  if (loading) return <div className="flex items-center justify-center min-h-[400px]">Carregando...</div>;

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-20">
      <header>
        <h1 className="text-3xl font-bold">Clientes</h1>
        <p className="text-muted-foreground">Gerencie sua base de tomadores.</p>
      </header>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5" />
        <Input
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Pesquisar cliente..."
          className="pl-10 rounded-xl"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {clientesFiltrados.map((cliente) => {
          const totalDevendo = getTotalDevendo(cliente.id);
          const emprestimosAtivos = getEmprestimosAtivos(cliente.id);

          return (
            <Card 
              key={cliente.id} 
              className="apple-card hover:scale-[1.02] cursor-pointer transition-all"
              onClick={() => handleClienteClick(cliente)}
            >
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-primary/10 rounded-lg"><User className="w-6 h-6 text-primary" /></div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold">{cliente.nome}</h3>
                    <div className="flex items-center gap-4 mt-1">
                      <span className={`text-sm font-medium ${totalDevendo > 0 ? 'text-destructive' : 'text-success'}`}>
                        {totalDevendo > 0 ? formatCurrency(totalDevendo) : '✓ Sem dívidas'}
                      </span>
                      <span className="text-xs text-muted-foreground">{emprestimosAtivos} ativo(s)</span>
                    </div>
                  </div>
                  <ChevronRight className="text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* 🛡️ MODAIS COM TODAS AS FUNÇÕES INTEGRADAS */}
      <ClienteHistoricoModal
        cliente={selectedCliente}
        emprestimos={getEmprestimosForModal()}
        isOpen={isHistoricoOpen}
        onClose={() => { setIsHistoricoOpen(false); setSelectedCliente(null); }}
        onAddEmprestimo={handleAddEmprestimo}
        onEditEmprestimo={handleEditEmprestimo}
        onMarcarPago={handleMarcarPago}
        onRenovarJuros={renovarEmprestimo}
        onDeleteEmprestimo={handleDeleteEmprestimo} // 🛡️ CONECTADO AO BOTÃO DE LIXEIRA
      />

      <EditEmprestimoModal
        emprestimo={editingEmprestimo}
        isOpen={isEditModalOpen}
        onClose={() => { setIsEditModalOpen(false); setEditingEmprestimo(null); }}
        onSave={handleSaveEdit}
        onDelete={handleDeleteEmprestimo}
      />
    </div>
  );
};

export default ClientesPage;