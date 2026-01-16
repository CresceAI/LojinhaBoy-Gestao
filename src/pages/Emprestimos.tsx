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

  // --- LÓGICA DE AGRUPAMENTO ---
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
        toast.success('Contrato registrado com sucesso!');
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
    <div className="min-h-screen pt-safe pb-safe px-5 md:px-10 space-y-8 max-w-5xl mx-auto animate-fade-in relative pb-32">
      
      {/* Header Shark Estilizado */}
      <header className="flex items-center justify-between pt-8">
        <div>
          <div className="flex items-center gap-2 text-primary opacity-80">
            <Wallet size={14} />
            <p className="text-[10px] font-black uppercase tracking-[0.4em]">Gestão de Ativos</p>
          </div>
          <h1 className="text-3xl md:text-4xl font-black tracking-tighter">Empréstimos</h1>
        </div>
        <Button 
          onClick={() => setShowForm(!showForm)} 
          className={`h-14 w-14 rounded-2xl transition-all duration-500 shadow-xl ${
            showForm ? 'rotate-45 bg-destructive text-white' : 'bg-primary text-black hover:scale-105'
          }`}
        >
          <Plus size={28} />
        </Button>
      </header>

      {/* Formulário de Novo Empréstimo (Liquid Glass) */}
      {showForm && (
        <Card className="glass-card border-primary/20 animate-in slide-in-from-top-4 duration-500 overflow-hidden">
          <CardContent className="p-6 md:p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Cliente</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                    <Input 
                      value={nomeCliente} 
                      onChange={e => setNomeCliente(e.target.value)} 
                      placeholder="Nome do cliente" 
                      className="pl-12 h-14 rounded-2xl bg-secondary/30 border-none text-base font-bold"
                      list="list-c"
                    />
                  </div>
                  <datalist id="list-c">{clientes.map(c => <option key={c.id} value={c.nome} />)}</datalist>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Capital</label>
                    <div className="relative">
                      <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                      <Input type="number" value={valor} onChange={e => setValor(e.target.value)} placeholder="0,00" className="pl-10 h-14 rounded-2xl bg-secondary/30 border-none font-black text-lg" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-primary ml-1">Juros</label>
                    <Input type="number" value={juros} onChange={e => setJuros(e.target.value)} placeholder="0,00" className="h-14 rounded-2xl bg-primary/10 border-none text-primary font-black text-lg" />
                  </div>
                </div>

                <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Data de Início</label>
                    <div className="relative">
                      <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                      <Input type="date" value={dataInicio} onChange={e => setDataInicio(e.target.value)} className="pl-12 h-14 rounded-2xl bg-secondary/30 border-none font-bold" />
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-primary ml-1">Vencimento Automático</label>
                    <Input type="date" value={dataVencimento} onChange={e => setDataVencimento(e.target.value)} className="h-14 rounded-2xl bg-primary/5 border border-primary/20 text-primary font-bold" />
                </div>
              </div>

              <Button type="submit" className="w-full h-16 rounded-2xl bg-primary text-black font-black uppercase tracking-[0.2em] hover:brightness-110 shadow-lg shadow-primary/10" disabled={submitting}>
                {submitting ? 'Processando...' : 'Confirmar Contrato Shark'}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Busca e Listagem */}
      <div className="relative group">
        <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" size={18} />
        <Input 
          value={busca} 
          onChange={e => setBusca(e.target.value)} 
          placeholder="Pesquisar por cliente..." 
          className="pl-14 h-16 rounded-[1.8rem] bg-card/40 backdrop-blur-md border-white/5 focus-visible:ring-primary/20 text-base" 
        />
      </div>

      <div className="space-y-4">
        {clientesFiltrados.length > 0 ? (
          clientesFiltrados.map((clienteId) => {
            const clienteObj = clientes.find(c => c.id === clienteId);
            const emprestimosDoCliente = emprestimosAgrupados[clienteId];
            const estaExpandido = expandedClientes.has(clienteId);

            return (
              <Card key={clienteId} className={`overflow-hidden rounded-[2.2rem] transition-all duration-500 ${estaExpandido ? 'glass-card' : 'bg-card/40 border-white/5'}`}>
                <Collapsible 
                  open={estaExpandido} 
                  onOpenChange={() => {
                    const n = new Set(expandedClientes);
                    estaExpandido ? n.delete(clienteId) : n.add(clienteId);
                    setExpandedClientes(n);
                  }}
                >
                  <CollapsibleTrigger asChild>
                    <div className="p-6 flex items-center justify-between cursor-pointer group">
                      <div className="flex items-center gap-5">
                        <div className={`p-4 rounded-2xl transition-all duration-500 ${estaExpandido ? 'bg-primary text-black shadow-lg shadow-primary/20' : 'bg-secondary text-muted-foreground'}`}>
                          <User size={22} />
                        </div>
                        <div>
                          <h3 className="font-black text-xl tracking-tight leading-none group-hover:text-primary transition-colors">
                            {clienteObj?.nome}
                          </h3>
                          <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mt-2">
                            {emprestimosDoCliente.length} Contrato(s) ativo(s)
                          </p>
                        </div>
                      </div>
                      {estaExpandido ? <ChevronUp className="text-primary" /> : <ChevronDown className="text-muted-foreground opacity-30" />}
                    </div>
                  </CollapsibleTrigger>

                  <CollapsibleContent className="px-6 pb-6 space-y-4 animate-in slide-in-from-top-2 duration-300">
                    <div className="h-px bg-white/5 w-full mb-6" />
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
          <div className="py-24 text-center glass-card border-dashed">
            <AlertCircle className="mx-auto text-muted-foreground opacity-20 mb-4" size={40} />
            <p className="text-xs font-black uppercase tracking-[0.3em] text-muted-foreground">Radar Limpo: Sem Contratos</p>
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

// Componente Interno para o Card de Contrato
const ContractCard = ({ emp, onRenovar, onQuitar, onEdit, onDelete }: any) => {
  const isVencido = emp.status === 'vencido';
  const isPago = emp.status === 'pago' || emp.status === 'quitado';

  return (
    <div className={`p-5 rounded-3xl border transition-all ${isVencido ? 'bg-destructive/5 border-destructive/20' : 'bg-white/5 border-white/5'}`}>
      <div className="flex justify-between items-start mb-6">
        <span className={`text-[9px] font-black uppercase px-3 py-1.5 rounded-xl tracking-tighter ${
          isPago ? 'bg-emerald-500/10 text-emerald-500' : isVencido ? 'bg-destructive text-white' : 'bg-primary/20 text-primary'
        }`}>
          {emp.status}
        </span>
        
        <div className="flex gap-2">
          {!isPago && (
            <>
              <Button size="icon" variant="ghost" className="h-10 w-10 text-primary bg-white/5 hover:bg-primary/20 rounded-xl transition-all" onClick={onRenovar} title="Renovar Juros">
                <RefreshCw size={16} />
              </Button>
              <Button size="icon" variant="ghost" className="h-10 w-10 text-emerald-500 bg-white/5 hover:bg-emerald-500/20 rounded-xl transition-all" onClick={onQuitar} title="Quitar Tudo">
                <CheckCircle size={16} />
              </Button>
            </>
          )}
          <Button size="icon" variant="ghost" className="h-10 w-10 text-muted-foreground bg-white/5 hover:bg-white/10 rounded-xl transition-all" onClick={onEdit}>
            <Edit2 size={16} />
          </Button>
          <Button size="icon" variant="ghost" className="h-10 w-10 text-destructive/50 bg-white/5 hover:bg-destructive/20 rounded-xl transition-all" onClick={onDelete}>
            <Trash2 size={16} />
          </Button>
        </div>
      </div>

      <div className="flex justify-between items-end">
        <div>
          <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1 opacity-60">Saldo Devedor</p>
          <p className={`text-2xl font-black tracking-tighter ${isVencido ? 'text-destructive' : 'text-foreground'}`}>
            {formatCurrency(safeNumber(emp.valor_total) - safeNumber(emp.valor_pago))}
          </p>
        </div>
        <div className="text-right">
          <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1 opacity-60">Vencimento</p>
          <p className="text-sm font-bold">{formatDate(emp.data_vencimento)}</p>
        </div>
      </div>
    </div>
  );
};

const LoadingState = () => (
  <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-6">
    <div className="w-16 h-16 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
    <p className="text-[10px] font-black uppercase tracking-[0.5em] text-primary animate-pulse">Sincronizando Banca...</p>
  </div>
);

export default EmprestimosPage;