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
    toast.success("Novo contrato Shark aberto!");
  };

  if (!cliente) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] sm:max-w-xl max-h-[95vh] overflow-y-auto border-none bg-card/95 backdrop-blur-3xl shadow-2xl rounded-[2rem] md:rounded-[2.5rem] p-0 outline-none">
        
        {/* Header Consolidado - Responsivo */}
        <div className="p-5 md:p-8 pb-4 sticky top-0 bg-card/50 backdrop-blur-md z-20 border-b border-white/5">
          <DialogHeader>
            <div className="flex items-center gap-2 text-primary/70 mb-1">
              <TrendingUp className="w-3.5 h-3.5" />
              <span className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.3em]">Shark Intelligence</span>
            </div>
            <DialogTitle className="text-xl md:text-3xl font-black tracking-tighter text-foreground flex items-center justify-between min-w-0">
              <span className="truncate pr-2">{cliente.nome}</span>
              <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full hover:bg-white/10 h-10 w-10 shrink-0">
                <X className="w-5 h-5" />
              </Button>
            </DialogTitle>
            <DialogDescription className="text-[9px] md:text-[10px] font-bold text-muted-foreground uppercase tracking-widest leading-none">
              Análise de Crédito e Histórico
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="p-5 md:p-8 space-y-6 md:space-y-8">
          {/* Resumo Financeiro Bento Style */}
          <div className="grid grid-cols-2 gap-3 md:gap-4">
            <div className="p-4 md:p-5 bg-destructive/5 rounded-[1.5rem] md:rounded-[2rem] border border-destructive/10">
              <p className="text-[8px] md:text-[10px] font-black text-destructive uppercase tracking-widest mb-1 opacity-70">Dívida Ativa</p>
              <p className="text-xl md:text-2xl font-black text-foreground truncate">{formatCurrency(totalDevendo)}</p>
            </div>
            <div className="p-4 md:p-5 bg-emerald-500/5 rounded-[1.5rem] md:rounded-[2rem] border border-emerald-500/10">
              <p className="text-[8px] md:text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-1 opacity-70">Lucro Total</p>
              <p className="text-xl md:text-2xl font-black text-foreground truncate">{formatCurrency(lucroTotal)}</p>
            </div>
          </div>

          {/* Ação Principal: Novo Contrato */}
          {!showForm ? (
            <Button 
              onClick={() => setShowForm(true)} 
              className="w-full h-14 md:h-16 rounded-xl md:rounded-2xl bg-primary text-black font-black uppercase text-[10px] md:text-xs tracking-widest hover:scale-[1.01] active:scale-95 transition-all shadow-xl shadow-primary/20"
            >
              <Plus className="w-5 h-5 mr-2 stroke-[3]" /> Abrir Novo Contrato
            </Button>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4 md:space-y-5 p-5 md:p-6 border border-primary/20 rounded-[2rem] md:rounded-[2.5rem] bg-primary/5 animate-in slide-in-from-top-4 duration-500">
              <div className="flex justify-between items-center">
                <h4 className="text-[9px] md:text-[10px] font-black uppercase text-primary tracking-[0.2em]">Novo Lançamento</h4>
                <Button variant="ghost" size="sm" onClick={() => setShowForm(false)} className="h-8 w-8 p-0 rounded-full hover:bg-primary/10">
                  <X className="w-4 h-4" />
                </Button>
              </div>
              
              <div className="grid grid-cols-2 gap-3 md:gap-4">
                <div className="space-y-1.5">
                  <Label className="text-[9px] md:text-[10px] font-black uppercase opacity-60 ml-2">Capital (R$)</Label>
                  <Input 
                    type="number" 
                    placeholder="0,00"
                    value={valor} 
                    onChange={(e) => setValor(e.target.value)} 
                    className="rounded-xl md:rounded-2xl h-12 md:h-14 bg-background border-none font-bold text-base md:text-lg focus-visible:ring-primary/30" 
                    autoFocus 
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[9px] md:text-[10px] font-black uppercase opacity-60 ml-2 text-primary">Juros (R$)</Label>
                  <Input 
                    type="number" 
                    placeholder="0,00"
                    value={juros} 
                    onChange={(e) => setJuros(e.target.value)} 
                    className="rounded-xl md:rounded-2xl h-12 md:h-14 bg-background border-none font-bold text-base md:text-lg text-primary focus-visible:ring-primary/30" 
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 md:gap-4">
                <div className="space-y-1.5">
                  <Label className="text-[9px] md:text-[10px] font-black uppercase opacity-60 ml-2 text-center block md:text-left">Início</Label>
                  <Input type="date" value={dataInicio} onChange={(e) => setDataInicio(e.target.value)} className="rounded-lg md:rounded-xl h-10 md:h-12 bg-background border-none text-[10px] font-bold" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[9px] md:text-[10px] font-black uppercase opacity-60 ml-2 text-center block md:text-left">Vencimento</Label>
                  <Input type="date" value={dataVencimento} onChange={(e) => setDataVencimento(e.target.value)} className="rounded-lg md:rounded-xl h-10 md:h-12 bg-background border-none text-[10px] font-bold text-primary" />
                </div>
              </div>
              
              <Button type="submit" className="w-full h-12 md:h-14 rounded-lg md:rounded-xl bg-primary text-black font-black uppercase text-[10px] tracking-widest shadow-lg shadow-primary/20 transition-all active:scale-95">
                Confirmar Operação
              </Button>
            </form>
          )}

          {/* Histórico de Transações */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 px-1 text-muted-foreground">
              <History className="w-3.5 h-3.5" />
              <h4 className="font-black text-[9px] md:text-[10px] uppercase tracking-[0.2em]">Fluxo de Contratos</h4>
            </div>

            <div className="space-y-3 pb-6 md:pb-8">
              {clienteEmprestimos.map((emp) => {
                const statusStr = String(emp.status).toLowerCase();
                const isPago = statusStr === 'pago' || statusStr === 'quitado';
                const isVencido = new Date(emp.dataVencimento) < new Date() && !isPago;
                const saldoCard = safeNumber(emp.valorTotal) - safeNumber(emp.valorPago);

                return (
                  <div 
                    key={emp.id} 
                    className={cn(
                      "p-4 md:p-5 rounded-[1.8rem] md:rounded-[2.2rem] border transition-all duration-300",
                      isPago ? "bg-secondary/10 border-white/5 opacity-60" : 
                      isVencido ? "bg-destructive/5 border-destructive/20" : 
                      "bg-secondary/20 border-white/5 hover:border-primary/20"
                    )}
                  >
                    <div className="flex items-center justify-between mb-4 gap-2">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className={cn(
                          "px-2.5 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest shadow-sm truncate",
                          isPago ? "bg-emerald-500/20 text-emerald-500" : 
                          isVencido ? "bg-destructive text-white shadow-lg shadow-destructive/20" : 
                          "bg-primary/20 text-primary"
                        )}>
                          {isPago ? 'Liquidado' : isVencido ? 'Vencido' : 'Em Aberto'}
                        </span>
                        {isVencido && <AlertTriangle className="w-3 h-3 text-destructive shrink-0 animate-pulse" />}
                      </div>

                      <div className="flex gap-1 md:gap-1.5 shrink-0">
                        {!isPago && (
                          <>
                            <button 
                              onClick={() => onRenovarJuros(emp.id)} 
                              className="h-8 w-8 md:h-9 md:w-9 flex items-center justify-center text-primary bg-primary/10 hover:bg-primary/20 rounded-lg md:rounded-xl transition-colors"
                              title="Renovar"
                            >
                              <RefreshCw className="w-3.5 h-3.5 md:w-4 md:h-4" />
                            </button>
                            <button 
                              onClick={() => onMarcarPago(emp)} 
                              className="h-8 w-8 md:h-9 md:w-9 flex items-center justify-center text-emerald-500 bg-emerald-500/10 hover:bg-emerald-500/20 rounded-lg md:rounded-xl transition-colors"
                              title="Quitar"
                            >
                              <CheckCircle className="w-3.5 h-3.5 md:w-4 md:h-4" />
                            </button>
                          </>
                        )}
                        <button 
                          onClick={() => onEditEmprestimo(emp)} 
                          className="h-8 w-8 md:h-9 md:w-9 flex items-center justify-center text-muted-foreground bg-white/5 hover:bg-white/10 rounded-lg md:rounded-xl transition-colors"
                        >
                          <Edit2 className="w-3 h-3 md:w-3.5 md:h-3.5" />
                        </button>
                        <button 
                          onClick={() => { if(confirm('Excluir este contrato?')) onDeleteEmprestimo(emp.id); }} 
                          className="h-8 w-8 md:h-9 md:w-9 flex items-center justify-center text-destructive/40 hover:text-destructive hover:bg-destructive/10 rounded-lg md:rounded-xl transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5 md:w-4 md:h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="flex justify-between items-end gap-2">
                      <div className="space-y-0.5 min-w-0">
                        <p className="text-[8px] md:text-[9px] font-black text-muted-foreground uppercase tracking-widest opacity-60 truncate">Saldo a Receber</p>
                        <p className={cn(
                          "text-xl md:text-2xl font-black tracking-tighter truncate",
                          isVencido ? "text-destructive" : "text-foreground"
                        )}>
                          {formatCurrency(saldoCard)}
                        </p>
                      </div>
                      <div className="text-right space-y-0.5 shrink-0">
                        <div className="flex items-center justify-end gap-1 text-muted-foreground opacity-60">
                          <Calendar className="w-2.5 h-2.5" />
                          <p className="text-[8px] md:text-[9px] font-black uppercase tracking-widest">Vencimento</p>
                        </div>
                        <p className={cn(
                          "text-[10px] md:text-xs font-bold",
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