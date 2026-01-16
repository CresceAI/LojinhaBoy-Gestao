import { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Cliente, Emprestimo } from '@/types';
import { formatCurrency, formatDate, safeNumber } from '@/utils/calculations';
import { 
  Plus, Edit2, CheckCircle, DollarSign, 
  Calendar, RefreshCw, X, Trash2, History, TrendingUp, AlertTriangle
} from 'lucide-react'; 
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface ClienteHistoricoModalProps {
  cliente: Cliente | null;
  emprestimos: Emprestimo[];
  isOpen: boolean;
  onClose: () => void;
  onAddEmprestimo: (emprestimo: any) => void;
  onEditEmprestimo: (emprestimo: any) => void;
  onMarcarPago: (emprestimo: any) => void;
  onRenovarJuros: (id: string) => void;
  onDeleteEmprestimo: (id: string) => void;
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
  onDeleteEmprestimo,
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

  const clienteEmprestimos = useMemo(() => {
    return (emprestimos || [])
      .filter(e => e.clienteId === cliente?.id)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [emprestimos, cliente]);

  const totalDevendo = useMemo(() => {
    return clienteEmprestimos
      .filter(e => String(e.status) !== 'pago' && String(e.status) !== 'quitado')
      .reduce((acc, e) => acc + (safeNumber(e.valorTotal) - safeNumber(e.valorPago)), 0);
  }, [clienteEmprestimos]);

  const lucroTotal = useMemo(() => {
    return clienteEmprestimos.reduce((acc, e) => acc + safeNumber(e.valorPago), 0);
  }, [clienteEmprestimos]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cliente) return;
    const valorNum = safeNumber(valor);
    const jurosNum = safeNumber(juros);
    if (valorNum <= 0) return toast.error("O capital deve ser maior que zero.");

    onAddEmprestimo({
      clienteId: cliente.id,
      valor: valorNum,
      juros: jurosNum,
      valorTotal: valorNum + jurosNum,
      valorPago: 0,
      dataInicio,
      dataVencimento,
      status: 'ativo',
      formaPagamento: 'vista'
    });

    setShowForm(false);
    setValor(''); 
    setJuros('');
    toast.success("Novo contrato aberto com sucesso!");
  };

  if (!cliente) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-xl max-h-[95vh] overflow-y-auto border-none bg-card/95 backdrop-blur-3xl shadow-2xl rounded-[2.5rem] p-0 outline-none">
        
        {/* Header Consolidado (Heurística #1 & #8) */}
        <div className="p-8 pb-4 sticky top-0 bg-card/50 backdrop-blur-md z-20 border-b border-white/5">
          <DialogHeader>
            <div className="flex items-center gap-2 text-primary mb-1">
              <TrendingUp size={16} />
              <span className="text-[10px] font-black uppercase tracking-[0.3em]">Shark Intelligence</span>
            </div>
            <DialogTitle className="text-3xl font-black tracking-tighter text-foreground flex items-center justify-between">
              {cliente.nome}
              <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full hover:bg-white/10 h-10 w-10">
                <X size={20} />
              </Button>
            </DialogTitle>
            <DialogDescription className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
              Análise de Crédito e Histórico de Movimentações
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="p-8 space-y-8">
          {/* Resumo Financeiro Bento Style (Heurística #2) */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-5 bg-destructive/5 rounded-[2rem] border border-destructive/10">
              <p className="text-[10px] font-black text-destructive uppercase tracking-widest mb-1 opacity-70">Dívida Ativa</p>
              <p className="text-2xl font-black text-foreground">{formatCurrency(totalDevendo)}</p>
            </div>
            <div className="p-5 bg-emerald-500/5 rounded-[2rem] border border-emerald-500/10">
              <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-1 opacity-70">Lucro Realizado</p>
              <p className="text-2xl font-black text-foreground">{formatCurrency(lucroTotal)}</p>
            </div>
          </div>

          {/* Ação Principal: Novo Contrato (Heurística #7) */}
          {!showForm ? (
            <Button 
              onClick={() => setShowForm(true)} 
              className="w-full h-16 rounded-2xl bg-primary text-black font-black uppercase text-xs tracking-widest hover:scale-[1.01] active:scale-95 transition-all shadow-xl shadow-primary/10"
            >
              <Plus className="w-5 h-5 mr-2 stroke-[3]" /> Abrir Novo Contrato
            </Button>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5 p-6 border border-primary/20 rounded-[2.5rem] bg-primary/5 animate-in slide-in-from-top-4 duration-500">
              <div className="flex justify-between items-center">
                <h4 className="text-[10px] font-black uppercase text-primary tracking-[0.2em]">Novo Lançamento</h4>
                <Button variant="ghost" size="sm" onClick={() => setShowForm(false)} className="h-8 w-8 p-0 rounded-full">
                  <X size={16} />
                </Button>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase opacity-60 ml-2">Capital (R$)</Label>
                  <Input 
                    type="number" 
                    placeholder="0,00"
                    value={valor} 
                    onChange={(e) => setValor(e.target.value)} 
                    className="rounded-2xl h-14 bg-background border-none font-bold text-lg focus-visible:ring-primary/30" 
                    autoFocus 
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase opacity-60 ml-2 text-primary">Juros (R$)</Label>
                  <Input 
                    type="number" 
                    placeholder="0,00"
                    value={juros} 
                    onChange={(e) => setJuros(e.target.value)} 
                    className="rounded-2xl h-14 bg-background border-none font-bold text-lg text-primary focus-visible:ring-primary/30" 
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase opacity-60 ml-2">Data Inicial</Label>
                  <Input type="date" value={dataInicio} onChange={(e) => setDataInicio(e.target.value)} className="rounded-xl h-12 bg-background border-none text-xs font-bold" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase opacity-60 ml-2">Vencimento</Label>
                  <Input type="date" value={dataVencimento} onChange={(e) => setDataVencimento(e.target.value)} className="rounded-xl h-12 bg-background border-none text-xs font-bold text-primary" />
                </div>
              </div>
              
              <Button type="submit" className="w-full h-14 rounded-xl bg-primary text-black font-black uppercase tracking-widest shadow-lg shadow-primary/20">
                Confirmar e Gerar
              </Button>
            </form>
          )}

          {/* Histórico de Transações (Heurística #1 & #6) */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 px-2 text-muted-foreground">
              <History size={14} />
              <h4 className="font-black text-[10px] uppercase tracking-[0.2em]">Fluxo de Contratos</h4>
            </div>

            <div className="space-y-3 pb-8">
              {clienteEmprestimos.map((emp) => {
                const statusStr = String(emp.status).toLowerCase();
                const isPago = statusStr === 'pago' || statusStr === 'quitado';
                const isVencido = new Date(emp.dataVencimento) < new Date() && !isPago;
                const saldoCard = safeNumber(emp.valorTotal) - safeNumber(emp.valorPago);

                return (
                  <div 
                    key={emp.id} 
                    className={cn(
                      "p-5 rounded-[2.2rem] border transition-all duration-300 group",
                      isPago ? "bg-secondary/10 border-white/5 opacity-60" : 
                      isVencido ? "bg-destructive/5 border-destructive/20 animate-pulse-subtle" : 
                      "bg-secondary/20 border-white/5 hover:border-primary/20"
                    )}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <span className={cn(
                          "px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-tighter shadow-sm",
                          isPago ? "bg-emerald-500/20 text-emerald-500" : 
                          isVencido ? "bg-destructive text-white" : 
                          "bg-primary/20 text-primary"
                        )}>
                          {isPago ? 'Liquidado' : isVencido ? 'Vencido' : 'Em Aberto'}
                        </span>
                        {isVencido && <AlertTriangle size={12} className="text-destructive animate-bounce" />}
                      </div>

                      <div className="flex gap-1.5">
                        {!isPago && (
                          <>
                            <button 
                              onClick={() => onRenovarJuros(emp.id)} 
                              className="h-9 w-9 flex items-center justify-center text-primary bg-primary/10 hover:bg-primary/20 rounded-xl transition-colors"
                              title="Renovar Juros"
                            >
                              <RefreshCw size={16} />
                            </button>
                            <button 
                              onClick={() => onMarcarPago(emp)} 
                              className="h-9 w-9 flex items-center justify-center text-emerald-500 bg-emerald-500/10 hover:bg-emerald-500/20 rounded-xl transition-colors"
                              title="Baixar Título"
                            >
                              <CheckCircle size={16} />
                            </button>
                          </>
                        )}
                        <button 
                          onClick={() => onEditEmprestimo(emp)} 
                          className="h-9 w-9 flex items-center justify-center text-muted-foreground bg-white/5 hover:bg-white/10 rounded-xl transition-colors"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button 
                          onClick={() => { if(confirm('Deseja excluir permanentemente este contrato?')) onDeleteEmprestimo(emp.id); }} 
                          className="h-9 w-9 flex items-center justify-center text-destructive/40 hover:text-destructive hover:bg-destructive/10 rounded-xl transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>

                    <div className="flex justify-between items-end">
                      <div className="space-y-0.5">
                        <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest opacity-60">Saldo a Receber</p>
                        <p className={cn(
                          "text-2xl font-black tracking-tighter",
                          isVencido ? "text-destructive" : "text-foreground"
                        )}>
                          {formatCurrency(saldoCard)}
                        </p>
                      </div>
                      <div className="text-right space-y-0.5">
                        <div className="flex items-center justify-end gap-1 text-muted-foreground opacity-60">
                          <Calendar size={10} />
                          <p className="text-[9px] font-black uppercase tracking-widest">Vencimento</p>
                        </div>
                        <p className={cn(
                          "text-xs font-bold",
                          isVencido ? "text-destructive" : "text-foreground"
                        )}>
                          {formatDate(emp.dataVencimento)}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ClienteHistoricoModal;