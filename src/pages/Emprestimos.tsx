import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useEmprestimos } from '@/hooks/useEmprestimos';
import { useClientes } from '@/hooks/useClientes';
import { formatCurrency, formatDate } from '@/utils/calculations';
import { DollarSign, CheckCircle, Edit2, Trash2, Plus, User, ChevronDown, ChevronUp, X, Search } from 'lucide-react';
import { toast } from 'sonner';
import EditEmprestimoModal from '@/components/EditEmprestimoModal';
import { useIsMobile } from '@/hooks/use-mobile';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const EmprestimosPage = () => {
  const { emprestimos, addEmprestimo, updateEmprestimo, deleteEmprestimo, marcarComoPago, loading } = useEmprestimos();
  const { clientes, addCliente, findClienteByNome } = useClientes();
  const isMobile = useIsMobile();
  
  // Form fields
  const [nomeCliente, setNomeCliente] = useState('');
  const [valor, setValor] = useState('');
  const [juros, setJuros] = useState('');
  const [dataInicio, setDataInicio] = useState(new Date().toISOString().split('T')[0]);
  const [dataVencimento, setDataVencimento] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [busca, setBusca] = useState('');

  // Edit modal
  const [editingEmprestimo, setEditingEmprestimo] = useState<any>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Quick add modal for existing client
  const [quickAddCliente, setQuickAddCliente] = useState<any>(null);
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [quickValor, setQuickValor] = useState('');
  const [quickJuros, setQuickJuros] = useState('');
  const [quickDataInicio, setQuickDataInicio] = useState(new Date().toISOString().split('T')[0]);
  const [quickDataVencimento, setQuickDataVencimento] = useState('');

  // Grouped view
  const [expandedClientes, setExpandedClientes] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (dataInicio) {
      const inicio = new Date(dataInicio);
      const vencimento = new Date(inicio);
      vencimento.setDate(vencimento.getDate() + 30);
      setDataVencimento(vencimento.toISOString().split('T')[0]);
    }
  }, [dataInicio]);

  useEffect(() => {
    if (quickDataInicio) {
      const inicio = new Date(quickDataInicio);
      const vencimento = new Date(inicio);
      vencimento.setDate(vencimento.getDate() + 30);
      setQuickDataVencimento(vencimento.toISOString().split('T')[0]);
    }
  }, [quickDataInicio]);

  // Group emprestimos by cliente
  const emprestimosAgrupados = emprestimos.reduce((acc, emp) => {
    const clienteId = emp.cliente_id;
    if (!acc[clienteId]) {
      acc[clienteId] = [];
    }
    acc[clienteId].push(emp);
    return acc;
  }, {} as Record<string, typeof emprestimos>);

  // Filter by search
  const clientesFiltrados = Object.keys(emprestimosAgrupados).filter(clienteId => {
    const cliente = clientes.find(c => c.id === clienteId);
    if (!cliente) return false;
    return cliente.nome.toLowerCase().includes(busca.toLowerCase());
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!nomeCliente.trim() || !valor || !juros) {
      toast.error('Preencha nome, valor e juros');
      return;
    }

    const valorNum = parseFloat(valor);
    const jurosNum = parseFloat(juros);

    if (isNaN(valorNum) || isNaN(jurosNum) || valorNum <= 0 || jurosNum < 0) {
      toast.error('Valor e juros devem ser números válidos');
      return;
    }

    setSubmitting(true);

    try {
      let cliente = findClienteByNome(nomeCliente.trim());
      
      if (!cliente) {
        const { data: newCliente, error: clienteError } = await addCliente({
          nome: nomeCliente.trim(),
          cpf_cnpj: null,
          telefone: null,
          email: null,
          endereco: null
        });

        if (clienteError || !newCliente) {
          toast.error('Erro ao criar cliente');
          setSubmitting(false);
          return;
        }
        cliente = newCliente;
      }

      const valorTotal = valorNum + jurosNum;

      const { error } = await addEmprestimo({
        cliente_id: cliente.id,
        valor: valorNum,
        juros: jurosNum,
        valor_total: valorTotal,
        valor_pago: 0,
        data_inicio: dataInicio,
        data_vencimento: dataVencimento,
        forma_pagamento: 'vista',
        numero_parcelas: null,
        status: 'ativo'
      });

      if (error) {
        toast.error('Erro ao cadastrar empréstimo');
      } else {
        toast.success('Empréstimo cadastrado!');
        setNomeCliente('');
        setValor('');
        setJuros('');
        setDataInicio(new Date().toISOString().split('T')[0]);
        setShowForm(false);
        // Expand the client group
        if (cliente) {
          setExpandedClientes(prev => new Set(prev).add(cliente!.id));
        }
      }
    } catch (err) {
      toast.error('Erro inesperado');
    } finally {
      setSubmitting(false);
    }
  };

  const handleQuickAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickAddCliente || !quickValor || !quickJuros) {
      toast.error('Preencha valor e juros');
      return;
    }

    const valorNum = parseFloat(quickValor);
    const jurosNum = parseFloat(quickJuros);

    if (isNaN(valorNum) || isNaN(jurosNum) || valorNum <= 0 || jurosNum < 0) {
      toast.error('Valores inválidos');
      return;
    }

    setSubmitting(true);

    try {
      const { error } = await addEmprestimo({
        cliente_id: quickAddCliente.id,
        valor: valorNum,
        juros: jurosNum,
        valor_total: valorNum + jurosNum,
        valor_pago: 0,
        data_inicio: quickDataInicio,
        data_vencimento: quickDataVencimento,
        forma_pagamento: 'vista',
        numero_parcelas: null,
        status: 'ativo'
      });

      if (error) {
        toast.error('Erro ao adicionar empréstimo');
      } else {
        toast.success(`Novo empréstimo para ${quickAddCliente.nome}!`);
        setIsQuickAddOpen(false);
        setQuickAddCliente(null);
        setQuickValor('');
        setQuickJuros('');
        setExpandedClientes(prev => new Set(prev).add(quickAddCliente.id));
      }
    } catch (err) {
      toast.error('Erro inesperado');
    } finally {
      setSubmitting(false);
    }
  };

  const handleMarcarPago = async (emp: any) => {
    const { error } = await marcarComoPago(emp.id, emp.valor_total);
    if (error) {
      toast.error('Erro ao marcar como pago');
    } else {
      toast.success('Empréstimo marcado como pago!');
    }
  };

  const handleEdit = (emp: any) => {
    setEditingEmprestimo(transformForModal(emp));
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
    
    if (error) {
      toast.error('Erro ao atualizar empréstimo');
    } else {
      toast.success('Empréstimo atualizado!');
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await deleteEmprestimo(id);
    if (error) {
      toast.error('Erro ao excluir empréstimo');
    } else {
      toast.success('Empréstimo excluído!');
    }
  };

  const openQuickAdd = (clienteId: string) => {
    const cliente = clientes.find(c => c.id === clienteId);
    if (cliente) {
      setQuickAddCliente(cliente);
      setQuickDataInicio(new Date().toISOString().split('T')[0]);
      setIsQuickAddOpen(true);
    }
  };

  const getClienteNome = (clienteId: string) => {
    return clientes.find(c => c.id === clienteId)?.nome || 'Cliente não encontrado';
  };

  const getClienteStats = (clienteId: string) => {
    const clienteEmps = emprestimosAgrupados[clienteId] || [];
    const totalDevendo = clienteEmps
      .filter(e => e.status === 'ativo' || e.status === 'vencido')
      .reduce((acc, e) => acc + (Number(e.valor_total) - Number(e.valor_pago)), 0);
    const emprestimosAtivos = clienteEmps.filter(e => e.status === 'ativo' || e.status === 'vencido').length;
    const temVencido = clienteEmps.some(e => new Date(e.data_vencimento) < new Date() && e.status === 'ativo');
    return { totalDevendo, emprestimosAtivos, temVencido };
  };

  const calcularTotal = () => {
    const valorNum = parseFloat(valor) || 0;
    const jurosNum = parseFloat(juros) || 0;
    return valorNum + jurosNum;
  };

  const toggleCliente = (clienteId: string) => {
    setExpandedClientes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(clienteId)) {
        newSet.delete(clienteId);
      } else {
        newSet.add(clienteId);
      }
      return newSet;
    });
  };

  const transformForModal = (emp: any) => ({
    id: emp.id,
    clienteId: emp.cliente_id,
    valor: Number(emp.valor),
    juros: Number(emp.juros),
    valorTotal: Number(emp.valor_total),
    valorPago: Number(emp.valor_pago),
    dataInicio: emp.data_inicio,
    dataVencimento: emp.data_vencimento,
    formaPagamento: emp.forma_pagamento,
    numeroParcelas: emp.numero_parcelas,
    status: emp.status,
    createdAt: emp.created_at
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-muted-foreground">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-fade-in max-w-4xl mx-auto pb-20">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className={`font-bold text-foreground ${isMobile ? 'text-2xl' : 'text-3xl'}`}>Empréstimos</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            {emprestimos.length} empréstimo(s) • {clientes.length} cliente(s)
          </p>
        </div>
        {!showForm && (
          <Button 
            onClick={() => setShowForm(true)} 
            className={`apple-button ${isMobile ? 'h-10 w-10 p-0' : ''}`}
          >
            <Plus className={isMobile ? 'w-5 h-5' : 'w-4 h-4 mr-2'} />
            {!isMobile && 'Novo'}
          </Button>
        )}
      </div>

      {/* Search */}
      {emprestimos.length > 0 && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar por cliente..."
            className="pl-9 h-10 rounded-xl text-sm"
          />
        </div>
      )}

      {/* New Loan Form */}
      {showForm && (
        <Card className="apple-card border-primary/20">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-foreground">Novo Empréstimo</h3>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8"
                onClick={() => setShowForm(false)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="nome" className="text-xs">Nome do Cliente</Label>
                <Input
                  id="nome"
                  value={nomeCliente}
                  onChange={(e) => setNomeCliente(e.target.value)}
                  placeholder="Ex: João Silva"
                  className="rounded-xl h-10"
                  autoFocus
                  list="clientes-list"
                  disabled={submitting}
                />
                <datalist id="clientes-list">
                  {clientes.map(c => (
                    <option key={c.id} value={c.nome} />
                  ))}
                </datalist>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="valor" className="text-xs">Valor (R$)</Label>
                  <Input
                    id="valor"
                    type="number"
                    step="0.01"
                    value={valor}
                    onChange={(e) => setValor(e.target.value)}
                    placeholder="550"
                    className="rounded-xl h-10"
                    disabled={submitting}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="juros" className="text-xs">Juros (R$)</Label>
                  <Input
                    id="juros"
                    type="number"
                    step="0.01"
                    value={juros}
                    onChange={(e) => setJuros(e.target.value)}
                    placeholder="165"
                    className="rounded-xl h-10"
                    disabled={submitting}
                  />
                </div>
              </div>

              {(valor || juros) && (
                <div className="p-2.5 bg-primary/10 rounded-xl">
                  <p className="text-sm font-medium text-primary text-center">
                    Total: {formatCurrency(calcularTotal())} • Lucro: {formatCurrency(parseFloat(juros) || 0)}
                  </p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="dataInicio" className="text-xs">Início</Label>
                  <Input
                    id="dataInicio"
                    type="date"
                    value={dataInicio}
                    onChange={(e) => setDataInicio(e.target.value)}
                    className="rounded-xl h-10"
                    disabled={submitting}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="dataVencimento" className="text-xs">Vencimento</Label>
                  <Input
                    id="dataVencimento"
                    type="date"
                    value={dataVencimento}
                    onChange={(e) => setDataVencimento(e.target.value)}
                    className="rounded-xl h-10"
                    disabled={submitting}
                  />
                </div>
              </div>

              <Button type="submit" className="w-full apple-button h-10" disabled={submitting}>
                <DollarSign className="w-4 h-4 mr-2" />
                {submitting ? 'Cadastrando...' : 'Cadastrar'}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Grouped Loans by Client */}
      <div className="space-y-3">
        {clientesFiltrados.map((clienteId) => {
          const clienteEmps = emprestimosAgrupados[clienteId] || [];
          const { totalDevendo, emprestimosAtivos, temVencido } = getClienteStats(clienteId);
          const isExpanded = expandedClientes.has(clienteId);
          
          return (
            <Card key={clienteId} className="apple-card overflow-hidden">
              <Collapsible open={isExpanded} onOpenChange={() => toggleCliente(clienteId)}>
                <CollapsibleTrigger asChild>
                  {/* ALTERAÇÃO: Trocado <button> por <div> para evitar erro de aninhamento */}
                  <div className="w-full p-4 flex items-center justify-between hover:bg-muted/30 transition-colors cursor-pointer">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-xl ${temVencido ? 'bg-destructive/10' : totalDevendo > 0 ? 'bg-warning/10' : 'bg-success/10'}`}>
                        <User className={`w-5 h-5 ${temVencido ? 'text-destructive' : totalDevendo > 0 ? 'text-warning' : 'text-success'}`} />
                      </div>
                      <div className="text-left">
                        <h3 className="font-semibold text-foreground">{getClienteNome(clienteId)}</h3>
                        <div className="flex items-center gap-2 text-xs">
                          {totalDevendo > 0 ? (
                            <span className={temVencido ? 'text-destructive font-medium' : 'text-warning'}>
                              {formatCurrency(totalDevendo)} devendo
                            </span>
                          ) : (
                            <span className="text-success">✓ Quitado</span>
                          )}
                          <span className="text-muted-foreground">• {clienteEmps.length} empréstimo(s)</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-primary"
                        onClick={(e) => {
                          e.stopPropagation();
                          openQuickAdd(clienteId);
                        }}
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                      {isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                    </div>
                  </div>
                </CollapsibleTrigger>

                <CollapsibleContent>
                  <div className="px-4 pb-4 space-y-2 border-t border-border pt-3">
                    {clienteEmps
                      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                      .map((emp) => {
                        const isVencido = new Date(emp.data_vencimento) < new Date() && emp.status === 'ativo';
                        
                        return (
                          <div
                            key={emp.id}
                            className={`p-3 rounded-xl border ${
                              emp.status === 'pago' ? 'bg-success/5 border-success/20' :
                              isVencido ? 'bg-destructive/5 border-destructive/20' :
                              'bg-warning/5 border-warning/20'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                emp.status === 'pago' ? 'bg-success/10 text-success' :
                                isVencido ? 'bg-destructive/10 text-destructive' :
                                'bg-warning/10 text-warning'
                              }`}>
                                {emp.status === 'pago' ? 'Pago' : isVencido ? 'Vencido' : 'Ativo'}
                              </span>
                              
                              <div className="flex gap-1">
                                {emp.status !== 'pago' && (
                                  <>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => handleEdit(emp)}
                                      className="h-7 w-7 p-0"
                                    >
                                      <Edit2 className="w-3.5 h-3.5" />
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => handleMarcarPago(emp)}
                                      className="h-7 w-7 p-0 text-success hover:text-success"
                                    >
                                      <CheckCircle className="w-3.5 h-3.5" />
                                    </Button>
                                  </>
                                )}
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => {
                                    if (confirm('Excluir este empréstimo?')) {
                                      handleDelete(emp.id);
                                    }
                                  }}
                                  className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </Button>
                              </div>
                            </div>

                            <div className={`grid gap-2 text-xs ${isMobile ? 'grid-cols-2' : 'grid-cols-4'}`}>
                              <div>
                                <p className="text-muted-foreground">Emprestado</p>
                                <p className="font-medium">{formatCurrency(Number(emp.valor))}</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">Juros</p>
                                <p className="font-medium text-success">{formatCurrency(Number(emp.juros))}</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">Total</p>
                                <p className="font-semibold">{formatCurrency(Number(emp.valor_total))}</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">Vencimento</p>
                                <p className="font-medium">{formatDate(emp.data_vencimento)}</p>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            </Card>
          );
        })}
      </div>

      {/* Empty State */}
      {emprestimos.length === 0 && !showForm && (
        <Card className="apple-card">
          <CardContent className="text-center py-12">
            <DollarSign className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">Nenhum empréstimo cadastrado ainda</p>
            <Button onClick={() => setShowForm(true)} className="apple-button">
              <Plus className="w-4 h-4 mr-2" />
              Cadastrar Primeiro Empréstimo
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Quick Add Modal */}
      <Dialog open={isQuickAddOpen} onOpenChange={setIsQuickAddOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="w-5 h-5 text-primary" />
              Novo Empréstimo
            </DialogTitle>
          </DialogHeader>
          
          {quickAddCliente && (
            <form onSubmit={handleQuickAdd} className="space-y-4">
              <div className="p-3 bg-primary/10 rounded-xl">
                <p className="text-sm font-medium text-primary text-center">
                  Cliente: {quickAddCliente.nome}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Valor (R$)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={quickValor}
                    onChange={(e) => setQuickValor(e.target.value)}
                    placeholder="550"
                    className="rounded-xl"
                    autoFocus
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Juros (R$)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={quickJuros}
                    onChange={(e) => setQuickJuros(e.target.value)}
                    placeholder="165"
                    className="rounded-xl"
                  />
                </div>
              </div>

              {(quickValor || quickJuros) && (
                <div className="p-2 bg-primary/10 rounded-lg text-center">
                  <span className="text-sm font-medium text-primary">
                    Total: {formatCurrency((parseFloat(quickValor) || 0) + (parseFloat(quickJuros) || 0))}
                  </span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Início</Label>
                  <Input
                    type="date"
                    value={quickDataInicio}
                    onChange={(e) => setQuickDataInicio(e.target.value)}
                    className="rounded-xl"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Vencimento</Label>
                  <Input
                    type="date"
                    value={quickDataVencimento}
                    onChange={(e) => setQuickDataVencimento(e.target.value)}
                    className="rounded-xl"
                  />
                </div>
              </div>

              <Button type="submit" className="w-full apple-button" disabled={submitting}>
                <DollarSign className="w-4 h-4 mr-2" />
                {submitting ? 'Adicionando...' : 'Adicionar Empréstimo'}
              </Button>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Modal */}
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