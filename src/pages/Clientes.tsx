import { useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useClientes } from '@/hooks/useClientes';
import { useEmprestimos } from '@/hooks/useEmprestimos';
import { formatCurrency, safeNumber } from '@/utils/calculations';
import { Search, User, ChevronRight, Users, FilterX } from 'lucide-react';
import ClienteHistoricoModal from '@/components/ClienteHistoricoModal';
import EditEmprestimoModal from '@/components/EditEmprestimoModal';
import { cn } from '@/lib/utils';

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

  // --- LÓGICA DE NEGÓCIO (MANTIDA) ---
  const clientesProcessados = useMemo(() => {
    return (clientes || []).filter(cliente =>
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
      totalClientes: (clientes || []).length,
      ativos: clientesProcessados.filter(c => c.totalDevendo > 0).length,
      totalNaRua
    };
  }, [clientes, clientesProcessados]);

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
    <div className="min-h-screen pt-safe pb-safe px-4 sm:px-6 md:px-10 space-y-6 md:space-y-8 max-w-6xl mx-auto animate-fade-in relative pb-32">
      
      {/* Background Glow Otimizado */}
      <div className="fixed inset-0 z-[-1] pointer-events-none overflow-hidden">
        <div className="absolute top-0 right-0 w-[300px] md:w-[500px] h-[300px] md:h-[500px] bg-primary/5 rounded-full blur-[80px] md:blur-[120px] animate-login-blob" />
      </div>

      <header className="pt-6 md:pt-8 space-y-1.5">
        <div className="flex items-center gap-2 text-primary/60">
          <Users className="w-3.5 h-3.5" />
          <p className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.3em] md:tracking-[0.4em]">Gestão de Carteira</p>
        </div>
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tighter text-foreground leading-none">Meus Clientes</h1>
        <p className="text-muted-foreground text-[10px] md:text-xs font-medium uppercase tracking-widest opacity-70">Vigilância de devedores e histórico shark.</p>
      </header>

      {/* Bento Stats da Carteira */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
        <div className="stat-card p-4 md:p-5 bg-card/30">
          <p className="text-[8px] md:text-[9px] font-black uppercase tracking-widest text-muted-foreground mb-1">Total Clientes</p>
          <p className="text-2xl md:text-3xl font-black text-foreground">{resumoCarteira.totalClientes}</p>
        </div>
        <div className="stat-card p-4 md:p-5 bg-card/30">
          <p className="text-[8px] md:text-[9px] font-black uppercase tracking-widest text-muted-foreground mb-1">Em Aberto</p>
          <p className="text-2xl md:text-3xl font-black text-primary">{resumoCarteira.ativos}</p>
        </div>
        <div className="col-span-2 md:col-span-1 glass-card bg-primary/5 border-primary/10 flex flex-col justify-center px-5 md:px-6 py-4 md:py-5">
          <p className="text-[8px] md:text-[9px] font-black uppercase tracking-widest text-primary mb-1">Total a Receber</p>
          <p className="text-xl md:text-2xl font-black text-foreground truncate">{formatCurrency(resumoCarteira.totalNaRua)}</p>
        </div>
      </div>

      {/* Busca */}
      <div className="relative group">
        <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors w-4.5 h-4.5" />
        <Input
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Localizar cliente na banca..."
          className="pl-12 md:pl-14 h-14 md:h-16 rounded-2xl md:rounded-[1.8rem] bg-card/40 backdrop-blur-md border-white/5 focus-visible:ring-primary/20 text-sm md:text-base shadow-inner"
        />
      </div>

      {/* Grid de Clientes (Bento Grid) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
        {clientesProcessados.length > 0 ? (
          clientesProcessados.map((cliente) => (
            <Card 
              key={cliente.id} 
              className="group overflow-hidden border-white/5 rounded-[1.8rem] md:rounded-[2.2rem] bg-card/40 backdrop-blur-md transition-all hover:bg-card/60 hover:scale-[1.02] cursor-pointer active:scale-95 shadow-lg"
              onClick={() => {
                setSelectedCliente(cliente);
                setIsHistoricoOpen(true);
              }}
            >
              <CardContent className="p-5 md:p-6">
                <div className="flex items-center justify-between mb-4 md:mb-5">
                  <div className={cn(
                    "p-3 rounded-xl md:rounded-2xl transition-transform group-hover:scale-110",
                    cliente.totalDevendo > 0 ? 'bg-destructive/10 text-destructive' : 'bg-emerald-500/10 text-emerald-500'
                  )}>
                    <User className="w-5 h-5 md:w-5.5 md:h-5.5" />
                  </div>
                  <ChevronRight className="text-muted-foreground opacity-20 group-hover:opacity-100 group-hover:translate-x-1 transition-all w-4 h-4" />
                </div>

                <div className="space-y-1 md:space-y-2">
                  <h3 className="text-base md:text-lg font-black tracking-tight text-foreground truncate">{cliente.nome}</h3>
                  <div className="flex flex-col gap-0.5 md:gap-1">
                    <span className={cn(
                      "text-xl md:text-2xl font-black tracking-tighter transition-colors",
                      cliente.totalDevendo > 0 ? 'text-foreground group-hover:text-primary' : 'text-emerald-500'
                    )}>
                      {cliente.totalDevendo > 0 ? formatCurrency(cliente.totalDevendo) : '✓ Quitado'}
                    </span>
                    <span className="text-[8px] md:text-[9px] font-black text-muted-foreground uppercase tracking-widest opacity-60">
                      {cliente.emprestimosAtivos} {cliente.emprestimosAtivos === 1 ? 'contrato ativo' : 'contratos ativos'}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="col-span-full py-16 md:py-20 text-center glass-card border-dashed border-white/10 rounded-[2rem]">
             <FilterX className="mx-auto text-muted-foreground opacity-10 mb-4 w-10 h-10 md:w-12 md:h-12" />
             <p className="text-[10px] md:text-xs font-bold text-muted-foreground uppercase tracking-[0.2em] px-4">Nenhum alvo encontrado no radar.</p>
          </div>
        )}
      </div>

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

const LoadingState = () => (
  <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-6">
    <div className="relative">
        <div className="w-12 h-12 md:w-16 md:h-16 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
        <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-6 h-6 md:w-8 md:h-8 bg-primary/20 rounded-full animate-pulse" />
        </div>
    </div>
    <p className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.4em] md:tracking-[0.5em] text-primary animate-pulse text-center px-4">Sincronizando Carteira Shark...</p>
  </div>
);

export default ClientesPage;