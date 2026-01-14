import { useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useClientes } from '@/hooks/useClientes';
import { useEmprestimos } from '@/hooks/useEmprestimos';
import { formatCurrency, safeNumber } from '@/utils/calculations';
import { Search, User, ChevronRight, AlertCircle } from 'lucide-react';
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
  const [selectedCliente, setSelectedCliente] = useState<any>(null);
  const [isHistoricoOpen, setIsHistoricoOpen] = useState(false);
  const [editingEmprestimo, setEditingEmprestimo] = useState<any>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const loading = loadingClientes || loadingEmprestimos;

  const clientesProcessados = useMemo(() => {
    return clientes.filter(cliente =>
      cliente.nome.toLowerCase().includes(busca.toLowerCase())
    ).map(cliente => {
      const ativos = emprestimos.filter(e => 
        e.cliente_id === cliente.id && (e.status !== 'pago' && e.status !== 'quitado')
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

  // ✅ CORREÇÃO TS 2322: Garantindo que o status seja mapeado corretamente
  const emprestimosParaModal = useMemo(() => {
    return emprestimos.map(emp => ({
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
      status: emp.status as any, // Forçando tipo para evitar conflito
      createdAt: emp.created_at,
      updatedAt: emp.updated_at
    }));
  }, [emprestimos]);

  if (loading) return <div className="p-20 text-center animate-pulse font-black uppercase text-xs tracking-widest">Sincronizando...</div>;

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-24 px-2">
      <header>
        <h1 className="text-3xl font-black tracking-tight">Clientes</h1>
        <p className="text-muted-foreground text-[10px] font-black uppercase tracking-[0.2em] mt-1">LojinhaBoy Pro • Gestão de Carteira</p>
      </header>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
        <Input
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Pesquisar por nome..."
          className="pl-11 h-12 rounded-2xl bg-card border-none shadow-sm"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {clientesProcessados.map((cliente) => (
          <Card 
            key={cliente.id} 
            className="hover:scale-[1.01] cursor-pointer transition-all border-none bg-card/60 backdrop-blur-md shadow-md"
            onClick={() => {
              setSelectedCliente(cliente);
              setIsHistoricoOpen(true);
            }}
          >
            <CardContent className="p-5">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-primary/10 rounded-2xl">
                  <User className="w-6 h-6 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-black leading-tight">{cliente.nome}</h3>
                  <div className="flex items-center gap-3 mt-1">
                    <span className={`text-[11px] font-black uppercase ${cliente.totalDevendo > 0 ? 'text-destructive' : 'text-emerald-500'}`}>
                      {cliente.totalDevendo > 0 ? formatCurrency(cliente.totalDevendo) : '✓ Quitado'}
                    </span>
                    <span className="text-[10px] font-bold text-muted-foreground uppercase">
                      {cliente.emprestimosAtivos} contrato(s)
                    </span>
                  </div>
                </div>
                <ChevronRight className="text-muted-foreground opacity-30" />
              </div>
            </CardContent>
          </Card>
        ))}
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
        onSave={(updated: any) => updateEmprestimo(updated.id, updated)}
        onDelete={deleteEmprestimo}
      />
    </div>
  );
};

export default ClientesPage;