import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useEmprestimos } from '@/hooks/useEmprestimos';
import { useClientes } from '@/hooks/useClientes';
import { formatCurrency, formatDate, safeNumber } from '@/utils/calculations';
import { 
  CheckCircle, Edit2, Trash2, Plus, 
  User, ChevronDown, ChevronUp, Search, RefreshCw, AlertCircle,
  Calendar, DollarSign, Wallet
} from 'lucide-react';
import { toast } from 'sonner';
import EditEmprestimoModal from '@/components/EditEmprestimoModal';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from '@/lib/utils';

const EmprestimosPage = () => {
  const { 
    emprestimos, addEmprestimo, updateEmprestimo, 
    deleteEmprestimo, marcarComoPago, renovarEmprestimo, loading 
  } = useEmprestimos();
  
  const { clientes, addCliente, loading: clientesLoading } = useClientes();
  
  const [nomeCliente, setNomeCliente] = useState('');
  const [valor, setValor] = useState('');
  const [juros, setJuros] = useState('');
  const [dataInicio, setDataInicio] = useState(new Date().toISOString().split('T')[0]);
  const [dataVencimento, setDataVencimento] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [busca, setBusca] = useState('');

  const [editingEmprestimo, setEditingEmprestimo] = useState<any>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [expandedClientes, setExpandedClientes] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (dataInicio) {
      const inicio = new Date(dataInicio);
      const vencimento = new Date(inicio);
      vencimento.setDate(vencimento.getDate() + 30);
      setDataVencimento(vencimento.toISOString().split('T')[0]);
    }
  }, [dataInicio]);

  const emprestimosAgrupados = useMemo(() => {
    return (emprestimos || []).reduce((acc, emp) => {
      const clienteId = emp.cliente_id;
      if (!acc[clienteId]) acc[clienteId] = [];
      acc[clienteId].push(emp);
      return acc;
    }, {} as Record<string, any[]>);
  }, [emprestimos]);

  const clientesFiltrados = useMemo(() => {
    return Object.keys(emprestimosAgrupados).filter(clienteId => {
      const cliente = clientes.find(c => c.id === clienteId);
      return cliente?.nome.toLowerCase().includes(busca.toLowerCase());
    });
  }, [emprestimosAgrupados, clientes, busca]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nomeCliente.trim() || !valor || !juros) return toast.error('Campos obrigatórios ausentes');

    setSubmitting(true);
    try {
      let cliente = clientes.find(
        c => c.nome.toLowerCase() === nomeCliente.trim().toLowerCase()
      );

      if (!cliente) {
        cliente = await addCliente({ 
          nome: nomeCliente.trim(), 
          cpf_cnpj: null, telefone: null, email: null, endereco: null 
        });
      }

      if (cliente) {
        await addEmprestimo({
          cliente_id: cliente.id,
          valor: safeNumber(valor),
          juros: safeNumber(juros),
          valor_total: safeNumber(valor) + safeNumber(juros),
          valor_pago: 0,
          data_inicio: dataInicio,
          data_vencimento: dataVencimento,
          status: 'ativo',
          forma_pagamento: 'vista',
          numero_parcelas: null
        });
        toast.success('Contrato Shark registrado!');
        setShowForm(false);
        setNomeCliente(''); setValor(''); setJuros('');
      }
    } catch (err) {
      toast.error('Erro ao registrar contrato');
    } finally { 
      setSubmitting(false); 
    }
  };

  if (loading || clientesLoading) return <LoadingState />;

  return (
    <div className="min-h-screen pt-safe pb-safe px-4 sm:px-6 md:px-10 space-y-6 md:space-y-8 max-w-5xl mx-auto animate-fade-in relative pb-32">
      
      <header className="flex items-center justify-between pt-6 md:pt-8">
        <div>
          <div className="flex items-center gap-2 text-primary/60">
            <Wallet className="w-3.5 h-3.5" />
            <p className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.3em] md:tracking-[0.4em]">Intelligence & Security</p>
          </div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tighter leading-none text-foreground">Empréstimos</h1>
        </div>
        <Button 
          onClick={() => setShowForm(!showForm)} 
          className={cn(
            "h-12 w-12 md:h-14 md:w-14 rounded-xl md:rounded-2xl transition-all duration-500 shadow-xl shadow-primary/10",
            showForm ? "rotate-45 bg-destructive text-white" : "bg-primary text-black hover:scale-105"
          )}
        >
          <Plus className="w-6 h-6 md:w-7 md:h-7" />
        </Button>
      </header>

      {showForm && (
        <Card className="glass-card border-primary/20 animate-in slide-in-from-top-4 duration-500 overflow-hidden">
          <CardContent className="p-5 md:p-8">
            <form onSubmit={handleSubmit} className="space-y-5 md:space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-6">
                <div className="space-y-2">
                  <label className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Cliente</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4 md:w-4.5 md:h-4.5" />
                    <Input 
                      value={nomeCliente} 
                      onChange={e => setNomeCliente(e.target.value)} 
                      placeholder="Nome do cliente" 
                      className="pl-11 md:pl-12 h-12 md:h-14 rounded-xl md:rounded-2xl bg-secondary/30 border-none text-sm md:text-base font-bold shadow-inner"
                      list="list-c"
                    />
                  </div>
                  <datalist id="list-c">{clientes.map(c => <option key={c.id} value={c.nome} />)}</datalist>
                </div>

                <div className="grid grid-cols-2 gap-3 md:gap-4">
                  <div className="space-y-2">
                    <label className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Capital</label>
                    <div className="relative">
                      <DollarSign className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                      <Input type="number" value={valor} onChange={e => setValor(e.target.value)} placeholder="0,00" className="pl-9 md:pl-10 h-12 md:h-14 rounded-xl md:rounded-2xl bg-secondary/30 border-none font-black text-base md:text-lg" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-primary ml-1">Juros</label>
                    <Input type="number" value={juros} onChange={e => setJuros(e.target.value)} placeholder="0,00" className="h-12 md:h-14 rounded-xl md:rounded-2xl bg-primary/10 border-none text-primary font-black text-base md:text-lg" />
                  </div>
                </div>

                <div className="space-y-2">
                    <label className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Início</label>
                    <div className="relative">
                      <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                      <Input type="date" value={dataInicio} onChange={e => setDataInicio(e.target.value)} className="pl-11 md:pl-12 h-12 md:h-14 rounded-xl md:rounded-2xl bg-secondary/30 border-none font-bold text-sm" />
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-primary ml-1">Vencimento Automático</label>
                    <Input type="date" value={dataVencimento} onChange={e => setDataVencimento(e.target.value)} className="h-12 md:h-14 rounded-xl md:rounded-2xl bg-primary/5 border border-primary/20 text-primary font-bold text-sm" />
                </div>
              </div>

              <Button type="submit" className="w-full h-14 md:h-16 rounded-xl md:rounded-2xl bg-primary text-black font-black uppercase tracking-[0.1em] md:tracking-[0.2em] hover:brightness-110 shadow-lg shadow-primary/20 transition-all active:scale-95" disabled={submitting}>
                {submitting ? 'Processando...' : 'Confirmar Contrato Shark'}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="relative group">
        <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors w-4.5 h-4.5" />
        <Input 
          value={busca} 
          onChange={e => setBusca(e.target.value)} 
          placeholder="Pesquisar por cliente..." 
          className="pl-13 md:pl-14 h-14 md:h-16 rounded-2xl md:rounded-[1.8rem] bg-card/40 backdrop-blur-md border-white/5 focus-visible:ring-primary/20 text-sm md:text-base shadow-lg" 
        />
      </div>

      <div className="space-y-3 md:space-y-4">
        {clientesFiltrados.length > 0 ? (
          clientesFiltrados.map((clienteId) => {
            const clienteObj = clientes.find(c => c.id === clienteId);
            const emprestimosDoCliente = emprestimosAgrupados[clienteId];
            const estaExpandido = expandedClientes.has(clienteId);

            return (
              <Card key={clienteId} className={cn("overflow-hidden rounded-[1.8rem] md:rounded-[2.2rem] transition-all duration-500", estaExpandido ? "glass-card" : "bg-card/40 border-white/5")}>
                <Collapsible 
                  open={estaExpandido} 
                  onOpenChange={() => {
                    const n = new Set(expandedClientes);
                    estaExpandido ? n.delete(clienteId) : n.add(clienteId);
                    setExpandedClientes(n);
                  }}
                >
                  <CollapsibleTrigger asChild>
                    <div className="p-5 md:p-6 flex items-center justify-between cursor-pointer group">
                      <div className="flex items-center gap-4 md:gap-5 min-w-0">
                        <div className={cn("p-3 md:p-4 rounded-xl md:rounded-2xl transition-all duration-500 shrink-0", estaExpandido ? "bg-primary text-black shadow-lg shadow-primary/20" : "bg-secondary text-muted-foreground")}>
                          <User className="w-5 h-5 md:w-5.5 md:h-5.5" />
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-black text-lg md:text-xl tracking-tighter leading-none group-hover:text-primary transition-colors truncate">
                            {clienteObj?.nome}
                          </h3>
                          <p className="text-[9px] md:text-[10px] font-black text-muted-foreground uppercase tracking-widest mt-1.5 md:mt-2">
                            {emprestimosDoCliente.length} Contrato(s) ativo(s)
                          </p>
                        </div>
                      </div>
                      {estaExpandido ? <ChevronUp className="text-primary w-5 h-5 shrink-0" /> : <ChevronDown className="text-muted-foreground opacity-30 w-5 h-5 shrink-0" />}
                    </div>
                  </CollapsibleTrigger>

                  <CollapsibleContent className="px-5 md:px-6 pb-5 md:pb-6 space-y-4 animate-in slide-in-from-top-2 duration-300">
                    <div className="h-px bg-white/5 w-full mb-4 md:mb-6" />
                    {emprestimosDoCliente.map((emp) => (
                      <ContractCard 
                        key={emp.id} 
                        emp={emp} 
                        onRenovar={() => renovarEmprestimo(emp.id)}
                        onQuitar={() => marcarComoPago(emp.id, emp.valor_total)}
                        onEdit={() => {
                            setEditingEmprestimo({
                                id: emp.id,
                                clienteId: emp.cliente_id,
                                valor: Number(emp.valor),
                                juros: Number(emp.juros),
                                valorTotal: Number(emp.valor_total),
                                dataInicio: emp.data_inicio,
                                dataVencimento: emp.data_vencimento
                            });
                            setIsEditModalOpen(true);
                        }}
                        onDelete={() => deleteEmprestimo(emp.id)}
                      />
                    ))}
                  </CollapsibleContent>
                </Collapsible>
              </Card>
            );
          })
        ) : (
          <div className="py-20 text-center glass-card border-dashed border-white/10 rounded-[2rem]">
            <AlertCircle className="mx-auto text-muted-foreground opacity-10 mb-4 w-10 h-10" />
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground px-4">Radar Limpo: Sem Contratos</p>
          </div>
        )}
      </div>

      <EditEmprestimoModal 
        isOpen={isEditModalOpen} 
        onClose={() => setIsEditModalOpen(false)} 
        emprestimo={editingEmprestimo} 
        onSave={async (u) => { 
          await updateEmprestimo(u.id, { 
            valor: u.valor, juros: u.juros, valor_total: u.valorTotal, 
            data_inicio: u.dataInicio, data_vencimento: u.dataVencimento 
          }); 
          setIsEditModalOpen(false); 
        }}
        onDelete={deleteEmprestimo}
      />
    </div>
  );
};

const ContractCard = ({ emp, onRenovar, onQuitar, onEdit, onDelete }: any) => {
  const isVencido = emp.status === 'vencido';
  const isPago = emp.status === 'pago' || emp.status === 'quitado';

  return (
    <div className={cn("p-4 md:p-5 rounded-2xl md:rounded-[1.8rem] border transition-all", isVencido ? "bg-destructive/5 border-destructive/20 shadow-[inset_0_0_20px_rgba(var(--destructive),0.05)]" : "bg-white/5 border-white/5")}>
      
      {/* CABEÇALHO DO CARD CORRIGIDO: Agora usa flex-wrap e melhor espaçamento para evitar o visual espremido no mobile */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-5">
        <span className={cn(
          "text-[8px] md:text-[9px] font-black uppercase px-2.5 py-1 rounded-lg tracking-widest shrink-0", 
          isPago ? "bg-emerald-500/10 text-emerald-500" : isVencido ? "bg-destructive text-white shadow-lg shadow-destructive/20" : "bg-primary/20 text-primary"
        )}>
          {emp.status}
        </span>
        
        {/* CONTAINER DE ÍCONES: Ajustado com gap maior e flex-wrap para telas muito estreitas */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-2">
          {!isPago && (
            <>
              <Button size="icon" variant="ghost" className="h-9 w-9 md:h-9 md:w-9 text-primary bg-white/5 hover:bg-primary/20 rounded-xl" onClick={onRenovar} title="Renovar">
                <RefreshCw className="w-4 h-4" />
              </Button>
              <Button size="icon" variant="ghost" className="h-9 w-9 md:h-9 md:w-9 text-emerald-500 bg-white/5 hover:bg-emerald-500/20 rounded-xl" onClick={onQuitar} title="Quitar">
                <CheckCircle className="w-4 h-4" />
              </Button>
            </>
          )}
          <Button size="icon" variant="ghost" className="h-9 w-9 md:h-9 md:w-9 text-muted-foreground bg-white/5 hover:bg-white/10 rounded-xl" onClick={onEdit}>
            <Edit2 className="w-3.5 h-3.5" />
          </Button>
          <Button size="icon" variant="ghost" className="h-9 w-9 md:h-9 md:w-9 text-destructive/50 bg-white/5 hover:bg-destructive/20 rounded-xl" onClick={onDelete}>
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="flex justify-between items-end gap-2">
        <div className="min-w-0">
          <p className="text-[8px] md:text-[9px] font-black text-muted-foreground uppercase tracking-widest mb-1 opacity-60">Saldo Devedor</p>
          <p className={cn("text-xl md:text-2xl font-black tracking-tighter truncate", isVencido ? "text-destructive" : "text-foreground")}>
            {formatCurrency(safeNumber(emp.valor_total) - safeNumber(emp.valor_pago))}
          </p>
        </div>
        <div className="text-right shrink-0">
          <p className="text-[8px] md:text-[9px] font-black text-muted-foreground uppercase tracking-widest mb-1 opacity-60">Vencimento</p>
          <p className="text-[12px] md:text-sm font-bold text-foreground">{formatDate(emp.data_vencimento)}</p>
        </div>
      </div>
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
    <p className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.4em] md:tracking-[0.5em] text-primary animate-pulse text-center">Sincronizando Banca...</p>
  </div>
);

export default EmprestimosPage;