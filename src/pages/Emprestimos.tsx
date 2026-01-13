import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useEmprestimos } from '@/hooks/useEmprestimos';
import { useClientes } from '@/hooks/useClientes';
import { formatCurrency, formatDate, safeNumber, isVencido } from '@/utils/calculations';
import { 
  DollarSign, CheckCircle, Edit2, Trash2, Plus, 
  User, ChevronDown, ChevronUp, X, Search, RefreshCw 
} from 'lucide-react';
import { toast } from 'sonner';
import EditEmprestimoModal from '@/components/EditEmprestimoModal';
import { useIsMobile } from '@/hooks/use-mobile';
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
  const { clientes, addCliente, findClienteByNome } = useClientes();
  const isMobile = useIsMobile();
  
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
    if (!nomeCliente.trim() || !valor || !juros) return toast.error('Preencha os campos');

    setSubmitting(true);
    try {
      let cliente = findClienteByNome(nomeCliente.trim());
      if (!cliente) {
        const { data: newC } = await addCliente({ nome: nomeCliente.trim(), cpf_cnpj: null, telefone: null, email: null, endereco: null });
        cliente = newC;
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
          forma_pagamento: 'vista', // Fixo como vista
          numero_parcelas: null     // Fixo como null
        });
        toast.success('Empréstimo Criado!');
        setShowForm(false);
        setNomeCliente(''); setValor(''); setJuros('');
      }
    } finally { setSubmitting(false); }
  };

  const handleEdit = (emp: any) => {
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
  };

  if (loading) return <div className="p-20 text-center animate-pulse">Carregando banca...</div>;

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-24">
      <header className="flex items-center justify-between px-2">
        <h1 className="text-3xl font-black tracking-tight">Empréstimos</h1>
        <Button onClick={() => setShowForm(!showForm)} className={`apple-button h-12 w-12 p-0 rounded-2xl ${showForm ? 'rotate-45 bg-destructive' : ''}`}>
          <Plus className="w-6 h-6" />
        </Button>
      </header>

      {showForm && (
        <Card className="apple-card border-primary/20">
          <CardContent className="pt-6 space-y-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input value={nomeCliente} onChange={e => setNomeCliente(e.target.value)} placeholder="Cliente" className="h-11 rounded-xl bg-secondary/20" list="list-c" />
              <datalist id="list-c">{clientes.map(c => <option key={c.id} value={c.nome} />)}</datalist>
              <div className="grid grid-cols-2 gap-3">
                <Input type="number" value={valor} onChange={e => setValor(e.target.value)} placeholder="Capital (R$)" className="h-11 rounded-xl bg-secondary/20" />
                <Input type="number" value={juros} onChange={e => setJuros(e.target.value)} placeholder="Juros (R$)" className="h-11 rounded-xl bg-secondary/20 text-primary font-bold" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Input type="date" value={dataInicio} onChange={e => setDataInicio(e.target.value)} className="h-11 rounded-xl bg-secondary/20" />
                <Input type="date" value={dataVencimento} onChange={e => setDataVencimento(e.target.value)} className="h-11 rounded-xl bg-secondary/20" />
              </div>
              <Button type="submit" className="w-full apple-button h-12 font-bold" disabled={submitting}>Salvar Contrato</Button>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
        <Input value={busca} onChange={e => setBusca(e.target.value)} placeholder="Pesquisar..." className="pl-11 h-12 rounded-2xl bg-card/50" />
      </div>

      <div className="space-y-3">
        {clientesFiltrados.map((clienteId) => (
          <Card key={clienteId} className="apple-card overflow-hidden">
            <Collapsible open={expandedClientes.has(clienteId)} onOpenChange={() => {
              const n = new Set(expandedClientes);
              expandedClientes.has(clienteId) ? n.delete(clienteId) : n.add(clienteId);
              setExpandedClientes(n);
            }}>
              <CollapsibleTrigger asChild>
                <div className="w-full p-5 flex items-center justify-between cursor-pointer hover:bg-secondary/20 transition-all">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-2xl bg-primary/10 text-primary"><User /></div>
                    <h3 className="font-bold text-lg">{clientes.find(c => c.id === clienteId)?.nome}</h3>
                  </div>
                  {expandedClientes.has(clienteId) ? <ChevronUp /> : <ChevronDown />}
                </div>
              </CollapsibleTrigger>
              <CollapsibleContent className="px-5 pb-5 space-y-3 border-t border-border/40 pt-4">
                {emprestimosAgrupados[clienteId].map((emp) => (
                  <div key={emp.id} className="p-4 rounded-2xl border border-border/40 bg-secondary/30">
                    <div className="flex justify-between items-start mb-4">
                       <span className="text-[10px] font-black uppercase bg-muted px-2 py-0.5 rounded">{emp.status}</span>
                       <div className="flex gap-2">
                        {emp.status !== 'pago' && (
                          <>
                            <Button size="icon" variant="ghost" className="h-8 w-8 text-primary" onClick={() => renovarEmprestimo(emp.id)}><RefreshCw className="w-4 h-4" /></Button>
                            <Button size="icon" variant="ghost" className="h-8 w-8 text-success" onClick={() => marcarComoPago(emp.id, emp.valor_total)}><CheckCircle className="w-4 h-4" /></Button>
                          </>
                        )}
                        <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => handleEdit(emp)}><Edit2 className="w-4 h-4" /></Button>
                        <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => deleteEmprestimo(emp.id)}><Trash2 className="w-4 h-4" /></Button>
                       </div>
                    </div>
                    <div className="flex justify-between items-end">
                      <p className="text-xl font-black">{formatCurrency(safeNumber(emp.valor_total) - safeNumber(emp.valor_pago))}</p>
                      <p className="text-xs font-bold text-muted-foreground">{formatDate(emp.data_vencimento)}</p>
                    </div>
                  </div>
                ))}
              </CollapsibleContent>
            </Collapsible>
          </Card>
        ))}
      </div>

      <EditEmprestimoModal 
        isOpen={isEditModalOpen} 
        onClose={() => setIsEditModalOpen(false)} 
        emprestimo={editingEmprestimo} 
        onSave={async (u) => { await updateEmprestimo(u.id, { valor: u.valor, juros: u.juros, valor_total: u.valorTotal, data_inicio: u.dataInicio, data_vencimento: u.dataVencimento }); setIsEditModalOpen(false); }}
        onDelete={deleteEmprestimo}
      />
    </div>
  );
};

export default EmprestimosPage;