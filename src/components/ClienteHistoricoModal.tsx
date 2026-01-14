import { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Cliente, Emprestimo } from '@/types';
import { formatCurrency, formatDate, safeNumber } from '@/utils/calculations';
import { 
  Plus, Edit2, CheckCircle, DollarSign, 
  Calendar, RefreshCw, X, Trash2 
} from 'lucide-react'; 
import { toast } from 'sonner';

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

  // Filtra e ordena empréstimos do cliente
  const clienteEmprestimos = useMemo(() => {
    return (emprestimos || [])
      .filter(e => e.clienteId === cliente?.id)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [emprestimos, cliente]);

  // 🧮 CÁLCULOS TÉCNICOS (Corrigindo Erros de Overlap do TS)
  
  // 1. Saldo Devedor: Tudo que NÃO está pago/quitado
  const totalDevendo = useMemo(() => {
    return clienteEmprestimos
      .filter(e => String(e.status) !== 'pago' && String(e.status) !== 'quitado')
      .reduce((acc, e) => acc + (safeNumber(e.valorTotal) - safeNumber(e.valorPago)), 0);
  }, [clienteEmprestimos]);

  // 2. Lucro Total: Soma de todos os juros recebidos (valorPago)
  const lucroTotal = useMemo(() => {
    return clienteEmprestimos.reduce((acc, e) => acc + safeNumber(e.valorPago), 0);
  }, [clienteEmprestimos]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cliente) return;
    const valorNum = safeNumber(valor);
    const jurosNum = safeNumber(juros);
    if (valorNum <= 0) return toast.error("Valor inválido");

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
    setValor(''); setJuros('');
  };

  if (!cliente) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto border-none bg-card/95 backdrop-blur-2xl shadow-2xl rounded-[2rem]">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div>
              <span className="text-2xl font-black tracking-tighter">{cliente.nome}</span>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Controle de Banca</p>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 pt-4">
          {/* Resumo Financeiro */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-4 bg-destructive/10 rounded-3xl border border-destructive/10 text-center">
              <p className="text-[9px] font-black text-destructive uppercase mb-1">Saldo Devedor</p>
              <p className="text-xl font-black">{formatCurrency(totalDevendo)}</p>
            </div>
            <div className="p-4 bg-emerald-500/10 rounded-3xl border border-emerald-500/10 text-center">
              <p className="text-[9px] font-black text-emerald-500 uppercase mb-1">Lucro no Bolso</p>
              <p className="text-xl font-black">{formatCurrency(lucroTotal)}</p>
            </div>
          </div>

          {!showForm && (
            <Button onClick={() => setShowForm(true)} className="w-full apple-button h-14 font-black uppercase text-xs">
              <Plus className="w-5 h-5 mr-2" /> Novo Empréstimo
            </Button>
          )}

          {showForm && (
            <form onSubmit={handleSubmit} className="space-y-4 p-5 border border-white/5 rounded-[2rem] bg-secondary/20 animate-in fade-in zoom-in-95">
              <div className="flex justify-between items-center mb-2">
                <span className="text-[10px] font-black uppercase text-primary tracking-widest">Abrir Contrato</span>
                <X className="w-5 h-5 cursor-pointer text-muted-foreground" onClick={() => setShowForm(false)} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-[10px] font-black uppercase opacity-60">Capital</Label>
                  <Input type="number" value={valor} onChange={(e) => setValor(e.target.value)} className="rounded-2xl h-12 bg-background border-none font-bold" autoFocus />
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] font-black uppercase opacity-60">Juros</Label>
                  <Input type="number" value={juros} onChange={(e) => setJuros(e.target.value)} className="rounded-2xl h-12 bg-background border-none font-bold text-primary" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Input type="date" value={dataInicio} onChange={(e) => setDataInicio(e.target.value)} className="rounded-2xl h-12 bg-background border-none text-xs font-bold" />
                <Input type="date" value={dataVencimento} onChange={(e) => setDataVencimento(e.target.value)} className="rounded-2xl h-12 bg-background border-none text-xs font-bold text-primary" />
              </div>
              <Button type="submit" className="w-full apple-button h-12 font-black uppercase">Criar</Button>
            </form>
          )}

          <div className="space-y-3 pb-4">
            <h4 className="font-black text-[10px] text-muted-foreground uppercase tracking-widest px-2">Histórico</h4>
            {clienteEmprestimos.map((emp) => {
              // ✅ Correção TS: Forçando o tipo string para evitar erro de overlap
              const statusStr = String(emp.status);
              const isPago = statusStr === 'pago' || statusStr === 'quitado';
              const isVencido = new Date(emp.dataVencimento) < new Date() && !isPago;
              const saldoCard = safeNumber(emp.valorTotal) - safeNumber(emp.valorPago);

              return (
                <div key={emp.id} className={`p-4 rounded-[2rem] border transition-all ${isPago ? 'bg-secondary/10 border-white/5 opacity-60' : isVencido ? 'bg-destructive/5 border-destructive/20' : 'bg-secondary/20 border-white/5'}`}>
                  <div className="flex items-center justify-between mb-4">
                    <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase ${isPago ? 'bg-emerald-500/20 text-emerald-500' : isVencido ? 'bg-destructive/20 text-destructive' : 'bg-primary/20 text-primary'}`}>
                      {isPago ? 'Liquidado' : statusStr}
                    </span>
                    <div className="flex gap-1.5">
                      {!isPago && (
                        <>
                          <Button size="sm" variant="ghost" onClick={() => onRenovarJuros(emp.id)} className="h-8 w-8 p-0 text-primary hover:bg-primary/10 rounded-xl">
                            <RefreshCw className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => onMarcarPago(emp)} className="h-8 w-8 p-0 text-emerald-500 hover:bg-emerald-500/10 rounded-xl">
                            <CheckCircle className="w-4 h-4" />
                          </Button>
                        </>
                      )}
                      <Button size="sm" variant="ghost" onClick={() => onEditEmprestimo(emp)} className="h-8 w-8 p-0 text-muted-foreground rounded-xl">
                        <Edit2 className="w-3.5 h-3.5" />
                      </Button>
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        onClick={() => { if(confirm('Excluir?')) onDeleteEmprestimo(emp.id); }} 
                        className="h-8 w-8 p-0 text-destructive/40 hover:text-destructive rounded-xl"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="flex justify-between items-end">
                    <div>
                      <p className="text-[8px] font-black text-muted-foreground uppercase mb-1">Saldo Atual</p>
                      <p className="text-xl font-black tracking-tighter">{formatCurrency(saldoCard)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[8px] font-black text-muted-foreground uppercase mb-1">Vencimento</p>
                      <p className={`text-[11px] font-black ${isVencido ? 'text-destructive' : 'text-foreground'}`}>{formatDate(emp.dataVencimento)}</p>
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