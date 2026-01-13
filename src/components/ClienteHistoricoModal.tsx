import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Cliente, Emprestimo } from '@/types';
import { formatCurrency, formatDate, generateId, safeNumber } from '@/utils/calculations';
import { Plus, Edit2, CheckCircle, DollarSign, Calendar, RefreshCw, X, Trash2 } from 'lucide-react'; // 🛡️ Adicionado Trash2

interface ClienteHistoricoModalProps {
  cliente: Cliente | null;
  emprestimos: Emprestimo[];
  isOpen: boolean;
  onClose: () => void;
  onAddEmprestimo: (emprestimo: Emprestimo) => void;
  onEditEmprestimo: (emprestimo: Emprestimo) => void;
  onMarcarPago: (emprestimo: Emprestimo) => void;
  onRenovarJuros: (id: string) => void;
  onDeleteEmprestimo: (id: string) => void; // 🛡️ Nova Prop
}

const ClienteHistoricoModal = ({
  cliente,
  emprestimos,
  isOpen,
  onClose,
  onAddEmprestimo,
  onEditEmprestimo,
  onMarcarPago,
  onRenovarJuros,
  onDeleteEmprestimo, // 🛡️ Recebendo a Prop
}: ClienteHistoricoModalProps) => {
  const [showForm, setShowForm] = useState(false);
  const [valor, setValor] = useState('');
  const [juros, setJuros] = useState('');
  const [dataInicio, setDataInicio] = useState(new Date().toISOString().split('T')[0]);
  const [dataVencimento, setDataVencimento] = useState('');

  useEffect(() => {
    if (dataInicio) {
      const inicio = new Date(dataInicio);
      const vencimento = new Date(inicio);
      vencimento.setDate(vencimento.getDate() + 30);
      setDataVencimento(vencimento.toISOString().split('T')[0]);
    }
  }, [dataInicio]);

  const clienteEmprestimos = (emprestimos || [])
    .filter(e => e.clienteId === cliente?.id)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const totalDevendo = clienteEmprestimos
    .filter(e => e.status === 'ativo' || e.status === 'vencido')
    .reduce((acc, e) => acc + (safeNumber(e.valorTotal) - safeNumber(e.valorPago)), 0);

  const totalPago = clienteEmprestimos
    .filter(e => e.status === 'pago')
    .reduce((acc, e) => acc + safeNumber(e.valorTotal), 0);

  const lucroTotal = clienteEmprestimos
    .filter(e => e.status === 'pago')
    .reduce((acc, e) => acc + safeNumber(e.juros), 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cliente) return;
    const valorNum = safeNumber(valor);
    const jurosNum = safeNumber(juros);
    if (valorNum <= 0) return;

    onAddEmprestimo({
      id: generateId(),
      clienteId: cliente.id,
      valor: valorNum,
      dataInicio,
      dataVencimento,
      juros: jurosNum,
      formaPagamento: 'vista',
      status: 'ativo',
      valorTotal: valorNum + jurosNum,
      valorPago: 0,
      createdAt: new Date().toISOString(),
    });

    setShowForm(false);
    setValor(''); setJuros('');
    setDataInicio(new Date().toISOString().split('T')[0]);
  };

  if (!cliente) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto apple-card border-none bg-card/95 backdrop-blur-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span className="text-2xl font-black tracking-tight">{cliente.nome}</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 pt-4">
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 bg-destructive/10 rounded-2xl border border-destructive/20 text-center">
              <p className="text-[10px] font-bold text-destructive uppercase">Deve</p>
              <p className="text-lg font-black">{formatCurrency(totalDevendo)}</p>
            </div>
            <div className="p-3 bg-success/10 rounded-2xl border border-success/20 text-center">
              <p className="text-[10px] font-bold text-success uppercase">Pago</p>
              <p className="text-lg font-black">{formatCurrency(totalPago)}</p>
            </div>
            <div className="p-3 bg-primary/10 rounded-2xl border border-primary/20 text-center">
              <p className="text-[10px] font-bold text-primary uppercase">Seu Lucro</p>
              <p className="text-lg font-black">{formatCurrency(lucroTotal)}</p>
            </div>
          </div>

          {!showForm && (
            <Button onClick={() => setShowForm(true)} className="w-full apple-button h-12 font-bold">
              <Plus className="w-5 h-5 mr-2" /> Novo Empréstimo
            </Button>
          )}

          {showForm && (
            <form onSubmit={handleSubmit} className="space-y-4 p-5 border rounded-3xl bg-secondary/30 animate-in fade-in zoom-in-95">
              <div className="flex justify-between items-center mb-2 text-muted-foreground uppercase font-black text-[10px]">
                <span>Novo Contrato</span>
                <X className="w-5 h-5 cursor-pointer hover:text-foreground" onClick={() => setShowForm(false)} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-bold uppercase ml-1">Valor (R$)</Label>
                  <Input type="number" step="0.01" value={valor} onChange={(e) => setValor(e.target.value)} className="rounded-2xl h-11 bg-background/50 border-border/40 font-bold" autoFocus />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-bold uppercase ml-1">Juros (R$)</Label>
                  <Input type="number" step="0.01" value={juros} onChange={(e) => setJuros(e.target.value)} className="rounded-2xl h-11 bg-background/50 border-border/40 font-bold text-primary" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-bold uppercase ml-1">Data Início</Label>
                  <Input type="date" value={dataInicio} onChange={(e) => setDataInicio(e.target.value)} className="rounded-2xl h-11 bg-background/50 border-border/40" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-bold uppercase ml-1">Vencimento</Label>
                  <Input type="date" value={dataVencimento} onChange={(e) => setDataVencimento(e.target.value)} className="rounded-2xl h-11 bg-background/50 border-border/40" />
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <Button type="submit" className="flex-1 apple-button h-11 font-bold">Confirmar</Button>
                <Button type="button" variant="outline" className="rounded-2xl h-11 font-bold" onClick={() => setShowForm(false)}>Cancelar</Button>
              </div>
            </form>
          )}

          <div className="space-y-3 pb-4">
            <h4 className="font-bold text-xs text-muted-foreground uppercase tracking-widest px-2">Histórico</h4>
            {clienteEmprestimos.map((emp) => {
              const isVenc = new Date(emp.dataVencimento) < new Date() && emp.status === 'ativo';
              return (
                <div key={emp.id} className={`p-4 rounded-3xl border transition-all ${emp.status === 'pago' ? 'bg-success/5 border-success/10 opacity-70' : isVenc ? 'bg-destructive/5 border-destructive/20' : 'bg-card/50 border-border/40 shadow-sm'}`}>
                  <div className="flex items-center justify-between mb-3">
                    <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase ${emp.status === 'pago' ? 'bg-success/20 text-success' : isVenc ? 'bg-destructive/20 text-destructive' : 'bg-muted text-muted-foreground'}`}>
                      {emp.status === 'pago' ? 'Liquidado' : isVenc ? 'Vencido' : 'Ativo'}
                    </span>
                    <div className="flex gap-2">
                      {emp.status !== 'pago' && (
                        <>
                          <Button size="sm" variant="ghost" onClick={() => onRenovarJuros(emp.id)} className="h-8 w-8 p-0 text-primary hover:bg-primary/10 rounded-xl" title="Renovar Juros">
                            <RefreshCw className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => onEditEmprestimo(emp)} className="h-8 w-8 p-0 rounded-xl">
                            <Edit2 className="w-3.5 h-3.5" />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => onMarcarPago(emp)} className="h-8 w-8 p-0 text-success hover:bg-success/10 rounded-xl">
                            <CheckCircle className="w-4 h-4" />
                          </Button>
                        </>
                      )}
                      {/* 🛡️ BOTÃO EXCLUIR ADICIONADO AQUI */}
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        onClick={() => { if(confirm('Excluir este empréstimo permanentemente?')) onDeleteEmprestimo(emp.id); }} 
                        className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10 rounded-xl"
                        title="Excluir"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[11px] font-bold">
                    <div className="flex items-center gap-1.5 text-foreground">
                      <DollarSign className="w-3.5 h-3.5 text-muted-foreground" />
                      <span>Total: <strong className="text-base font-black tracking-tighter">{formatCurrency(emp.valorTotal)}</strong></span>
                    </div>
                    <div className="flex items-center gap-1.5 justify-end">
                      <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                      <span className={isVenc ? 'text-destructive font-black' : 'text-muted-foreground'}>{formatDate(emp.dataVencimento)}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ClienteHistoricoModal;