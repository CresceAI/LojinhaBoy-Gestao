import { useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useClientes } from '@/hooks/useClientes';
import { useEmprestimos } from '@/hooks/useEmprestimos';
import { formatCurrency, safeNumber } from '@/utils/calculations';
import { Search, User, ChevronRight, Users, Banknote, Target, FilterX } from 'lucide-react';
import ClienteHistoricoModal from '@/components/ClienteHistoricoModal';
import EditEmprestimoModal from '@/components/EditEmprestimoModal';

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
  const [selectedCliente, setSelectedCliente] = useState<any>(null);
  const [isHistoricoOpen, setIsHistoricoOpen] = useState(false);
  const [editingEmprestimo, setEditingEmprestimo] = useState<any>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const loading = loadingClientes || loadingEmprestimos;

  // --- LÓGICA DE NEGÓCIO ---
  const clientesProcessados = useMemo(() => {
    return clientes.filter(cliente =>
      cliente.nome.toLowerCase().includes(busca.toLowerCase())
    ).map(cliente => {
      const ativos = (emprestimos || []).filter(e => 
        e.cliente_id === cliente.id && (String(e.status).toLowerCase() !== 'pago' && String(e.status).toLowerCase() !== 'quitado')
      );
      
      const totalDevendo = ativos.reduce((acc, e) => 
        acc + (safeNumber(e.valor_total) - safeNumber(e.valor_pago)), 0
      );
      
      return {
        ...cliente,
        totalDevendo,
        emprestimosAtivos: ativos.length
      };
    });
  }, [clientes, busca, emprestimos]);

  const resumoCarteira = useMemo(() => {
    const totalNaRua = clientesProcessados.reduce((acc, c) => acc + c.totalDevendo, 0);
    return {
      totalClientes: clientes.length,
      ativos: clientesProcessados.filter(c => c.totalDevendo > 0).length,
      totalNaRua
    };
  }, [clientes, clientesProcessados]);

  // ✅ MANTIDA CORREÇÃO TS 2322
  const emprestimosParaModal = useMemo(() => {
    return (emprestimos || []).map(emp => ({
      id: emp.id,
      clienteId: emp.cliente_id,
      valor: safeNumber(emp.valor),
      juros: safeNumber(emp.juros),
      valorTotal: safeNumber(emp.valor_total),
      valorPago: safeNumber(emp.valor_pago),
      dataInicio: emp.data_inicio,
      dataVencimento: emp.data_vencimento,
      formaPagamento: emp.forma_pagamento as 'parcelado' | 'vista',
      numeroParcelas: emp.numero_parcelas || 0,
      status: emp.status as any,
      createdAt: emp.created_at,
      updated_at: emp.updated_at
    }));
  }, [emprestimos]);

  if (loading) return <LoadingState />;

  return (
    <div className="min-h-screen pt-safe pb-safe px-5 md:px-10 space-y-8 max-w-6xl mx-auto animate-fade-in relative pb-32">
      
      {/* Header Estilo Fintech */}
      <header className="pt-8 space-y-1">
        <div className="flex items-center gap-2 text-primary opacity-80">
          <Users size={14} />
          <p className="text-[10px] font-black uppercase tracking-[0.4em]">Gestão de Carteira</p>
        </div>
        <h1 className="text-3xl md:text-4xl font-black tracking-tighter text-foreground">Meus Clientes</h1>
        <p className="text-muted-foreground text-xs font-medium">Controle total de devedores e histórico de crédito.</p>
      </header>

      {/* Bento Stats da Carteira */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div className="stat-card">
          <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground mb-1">Total Clientes</p>
          <p className="text-2xl font-black text-foreground">{resumoCarteira.totalClientes}</p>
        </div>
        <div className="stat-card">
          <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground mb-1">Em Aberto</p>
          <p className="text-2xl font-black text-primary">{resumoCarteira.ativos}</p>
        </div>
        <div className="col-span-2 md:col-span-1 glass-card bg-primary/5 border-primary/10 flex flex-col justify-center px-6">
          <p className="text-[9px] font-black uppercase tracking-widest text-primary mb-1">Total a Receber</p>
          <p className="text-2xl font-black text-foreground">{formatCurrency(resumoCarteira.totalNaRua)}</p>
        </div>
      </div>

      {/* Busca */}
      <div className="relative group">
        <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" size={18} />
        <Input
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Pesquisar por nome do cliente..."
          className="pl-14 h-16 rounded-[1.8rem] bg-card/40 backdrop-blur-md border-white/5 focus-visible:ring-primary/20 text-base"
        />
      </div>

      {/* Grid de Clientes (Bento Grid) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {clientesProcessados.length > 0 ? (
          clientesProcessados.map((cliente) => (
            <Card 
              key={cliente.id} 
              className="group overflow-hidden border-white/5 rounded-[2.2rem] bg-card/40 backdrop-blur-md transition-all hover:bg-card/60 hover:scale-[1.02] cursor-pointer"
              onClick={() => {
                setSelectedCliente(cliente);
                setIsHistoricoOpen(true);
              }}
            >
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-3 rounded-2xl ${cliente.totalDevendo > 0 ? 'bg-destructive/10 text-destructive' : 'bg-emerald-500/10 text-emerald-500'}`}>
                    <User size={20} />
                  </div>
                  <ChevronRight size={16} className="text-muted-foreground opacity-20 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                </div>

                <div className="space-y-1">
                  <h3 className="text-lg font-black tracking-tight text-foreground truncate">{cliente.nome}</h3>
                  <div className="flex flex-col gap-1">
                    <span className={`text-xl font-black tracking-tighter ${cliente.totalDevendo > 0 ? 'text-foreground' : 'text-emerald-500'}`}>
                      {cliente.totalDevendo > 0 ? formatCurrency(cliente.totalDevendo) : '✓ Quitado'}
                    </span>
                    <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">
                      {cliente.emprestimosAtivos} {cliente.emprestimosAtivos === 1 ? 'contrato ativo' : 'contratos ativos'}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="col-span-full py-20 text-center glass-card border-dashed">
             <FilterX size={40} className="mx-auto text-muted-foreground opacity-20 mb-4" />
             <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Nenhum cliente encontrado com este nome.</p>
          </div>
        )}
      </div>

      {/* Modais MANTIDOS com a Lógica Original */}
      <ClienteHistoricoModal
        cliente={selectedCliente}
        emprestimos={emprestimosParaModal}
        isOpen={isHistoricoOpen}
        onClose={() => setIsHistoricoOpen(false)}
        onAddEmprestimo={(emp: any) => addEmprestimo(emp)}
        onEditEmprestimo={(emp: any) => { setEditingEmprestimo(emp); setIsEditModalOpen(true); }}
        onMarcarPago={(emp: any) => marcarComoPago(emp.id, emp.valorTotal)}
        onRenovarJuros={renovarEmprestimo}
        onDeleteEmprestimo={deleteEmprestimo}
      />

      <EditEmprestimoModal
        emprestimo={editingEmprestimo}
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSave={(updated: any) => {
          // 🚀 CORREÇÃO DA LÓGICA DE SALVAMENTO: Mapeamento CamelCase -> Snake_Case
          const dataToSave = {
            valor: safeNumber(updated.valor),
            juros: safeNumber(updated.juros),
            valor_total: safeNumber(updated.valorTotal),
            valor_pago: safeNumber(updated.valorPago),
            data_inicio: updated.dataInicio,
            data_vencimento: updated.dataVencimento,
            forma_pagamento: updated.formaPagamento,
            numero_parcelas: updated.numeroParcelas,
            status: updated.status,
            cliente_id: updated.clienteId
          };

          updateEmprestimo(updated.id, dataToSave);
          setIsEditModalOpen(false);
        }}
        onDelete={deleteEmprestimo}
      />
    </div>
  );
};

// Componente Interno de Loading para Manter Consistência
const LoadingState = () => (
  <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-6">
    <div className="relative">
        <div className="w-16 h-16 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
        <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-8 h-8 bg-primary/20 rounded-full animate-pulse" />
        </div>
    </div>
    <p className="text-[10px] font-black uppercase tracking-[0.5em] text-primary animate-pulse">Sincronizando Clientes...</p>
  </div>
);

export default ClientesPage;