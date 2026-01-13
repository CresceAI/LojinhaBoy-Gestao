import { useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useClientes } from '@/hooks/useClientes';
import { useEmprestimos } from '@/hooks/useEmprestimos';
import { formatCurrency } from '@/utils/calculations';
import { Search, User, ChevronRight } from 'lucide-react';
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

  // 🚀 OTIMIZAÇÃO: Filtra e calcula dados apenas quando necessário (evita requisições altas)
  const clientesProcessados = useMemo(() => {
    return clientes.filter(cliente =>
      cliente.nome.toLowerCase().includes(busca.toLowerCase())
    ).map(cliente => {
      const ativos = emprestimos.filter(e => 
        e.cliente_id === cliente.id && (e.status === 'ativo' || e.status === 'vencido')
      );
      const totalDevendo = ativos.reduce((acc, e) => acc + (Number(e.valor_total) - Number(e.valor_pago)), 0);
      
      return {
        ...cliente,
        totalDevendo,
        emprestimosAtivos: ativos.length
      };
    });
  }, [clientes, busca, emprestimos]);

  // 🛠️ ADAPTER: Transforma os dados do Supabase para o formato que o seu Modal espera (camelCase)
  const emprestimosParaModal = useMemo(() => {
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
  }, [emprestimos]);

  const handleClienteClick = (cliente: any) => {
    setSelectedCliente({
      id: cliente.id,
      nome: cliente.nome,
      createdAt: cliente.created_at
    });
    setIsHistoricoOpen(true);
  };

  const handleAddEmprestimo = async (emp: any) => {
    const { error } = await addEmprestimo({
      cliente_id: emp.clienteId,
      valor: emp.valor,
      juros: emp.juros,
      valor_total: emp.valorTotal,
      valor_pago: 0,
      data_inicio: emp.dataInicio,
      data_vencimento: emp.dataVencimento,
      forma_pagamento: emp.formaPagamento || 'vista',
      numero_parcelas: emp.numeroParcelas || null,
      status: 'ativo'
    });
    if (error) toast.error('Erro ao adicionar');
    else toast.success('Adicionado!');
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

  if (loading) return <div className="flex items-center justify-center min-h-[400px]">Carregando banca...</div>;

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-20">
      <header>
        <h1 className="text-3xl font-bold italic tracking-tighter">Clientes</h1>
        <p className="text-muted-foreground">Gerencie sua base de tomadores.</p>
      </header>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5" />
        <Input
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Pesquisar cliente..."
          className="pl-10 rounded-xl bg-card/50 backdrop-blur-sm"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {clientesProcessados.map((cliente) => (
          <Card 
            key={cliente.id} 
            className="hover:scale-[1.01] cursor-pointer transition-all border-white/10 bg-card/40 backdrop-blur-md"
            onClick={() => handleClienteClick(cliente)}
          >
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-primary/10 rounded-lg"><User className="w-6 h-6 text-primary" /></div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold">{cliente.nome}</h3>
                  <div className="flex items-center gap-4 mt-1">
                    <span className={`text-sm font-bold ${cliente.totalDevendo > 0 ? 'text-destructive' : 'text-emerald-500'}`}>
                      {cliente.totalDevendo > 0 ? formatCurrency(cliente.totalDevendo) : '✓ Quitado'}
                    </span>
                    <span className="text-xs text-muted-foreground">{cliente.emprestimosAtivos} ativo(s)</span>
                  </div>
                </div>
                <ChevronRight className="text-muted-foreground opacity-50" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <ClienteHistoricoModal
        cliente={selectedCliente}
        emprestimos={emprestimosParaModal}
        isOpen={isHistoricoOpen}
        onClose={() => { setIsHistoricoOpen(false); setSelectedCliente(null); }}
        onAddEmprestimo={handleAddEmprestimo}
        onEditEmprestimo={(emp) => { setEditingEmprestimo(emp); setIsEditModalOpen(true); }}
        // ✅ Correção do erro de assinatura: passa id e valor separadamente
        onMarcarPago={(emp: any) => marcarComoPago(emp.id, emp.valorTotal)}
        onRenovarJuros={renovarEmprestimo}
        onDeleteEmprestimo={deleteEmprestimo}
      />

      <EditEmprestimoModal
        emprestimo={editingEmprestimo}
        isOpen={isEditModalOpen}
        onClose={() => { setIsEditModalOpen(false); setEditingEmprestimo(null); }}
        onSave={handleSaveEdit}
        onDelete={deleteEmprestimo}
      />
    </div>
  );
};

export default ClientesPage;