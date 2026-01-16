import { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { formatCurrency, safeNumber } from '@/utils/calculations';
import { Save, Trash2, Calculator, Calendar, DollarSign, X, ShieldAlert } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EditEmprestimoModalProps {
  emprestimo: any;
  isOpen: boolean;
  onClose: () => void;
  onSave: (emprestimo: any) => void;
  onDelete?: (id: string) => void;
}

const EditEmprestimoModal = ({ emprestimo, isOpen, onClose, onSave, onDelete }: EditEmprestimoModalProps) => {
  const [valor, setValor] = useState('');
  const [juros, setJuros] = useState('');
  const [dataInicio, setDataInicio] = useState('');
  const [dataVencimento, setDataVencimento] = useState('');

  useEffect(() => {
    if (emprestimo) {
      setValor(safeNumber(emprestimo.valor).toString());
      setJuros(safeNumber(emprestimo.juros).toString());
      setDataInicio(emprestimo.dataInicio || '');
      setDataVencimento(emprestimo.dataVencimento || '');
    }
  }, [emprestimo]);

  // Heurística #1: Feedback em tempo real do novo total
  const novoTotal = useMemo(() => {
    return safeNumber(valor) + safeNumber(juros);
  }, [valor, juros]);

  const handleSave = () => {
    if (!emprestimo) return;
    onSave({
      ...emprestimo,
      valor: safeNumber(valor),
      juros: safeNumber(juros),
      valorTotal: novoTotal,
      dataInicio,
      dataVencimento,
    });
  };

  if (!emprestimo) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md border-white/5 bg-card/90 backdrop-blur-3xl shadow-[0_0_50px_rgba(0,0,0,0.5)] rounded-[2.5rem] p-0 outline-none overflow-hidden">
        
        {/* Banner de Status Superior */}
        <div className="bg-primary/10 border-b border-white/5 p-8 flex items-center justify-between">
            <div className="space-y-1">
                <div className="flex items-center gap-2 text-primary">
                    <ShieldAlert size={14} />
                    <p className="text-[10px] font-black uppercase tracking-[0.3em]">Editor de Contratos</p>
                </div>
                <DialogTitle className="text-2xl font-black tracking-tighter text-foreground">
                    Ajustar Operação
                </DialogTitle>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full hover:bg-white/10 h-10 w-10">
                <X size={20} />
            </Button>
        </div>

        <div className="p-8 space-y-8">
          
          {/* Dashboard de Cálculo (Heurística #1 & #6) */}
          <div className="bg-white/5 rounded-[2rem] p-6 border border-white/5 flex items-center justify-between group hover:border-primary/20 transition-all">
            <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                    <Calculator size={24} />
                </div>
                <div>
                    <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Montante Final Atualizado</p>
                    <p className="text-2xl font-black tracking-tighter text-primary">{formatCurrency(novoTotal)}</p>
                </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase opacity-40 ml-1">Capital Bruto (R$)</Label>
                <div className="relative">
                    <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input 
                        type="number" 
                        step="0.01" 
                        value={valor} 
                        onChange={e => setValor(e.target.value)} 
                        className="pl-10 rounded-2xl h-14 bg-secondary/30 border-none font-black text-lg focus-visible:ring-primary/20" 
                    />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-primary ml-1">Juros Fixados (R$)</Label>
                <div className="relative">
                    <TrendingUp className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-primary" />
                    <Input 
                        type="number" 
                        step="0.01" 
                        value={juros} 
                        onChange={e => setJuros(e.target.value)} 
                        className="pl-10 rounded-2xl h-14 bg-primary/10 border-none font-black text-lg text-primary focus-visible:ring-primary/30" 
                    />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
               <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase opacity-40 ml-1">Abertura</Label>
                <div className="relative">
                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input 
                        type="date" 
                        value={dataInicio} 
                        onChange={e => setDataInicio(e.target.value)} 
                        className="pl-10 rounded-xl h-14 bg-secondary/30 border-none text-xs font-bold" 
                    />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-primary ml-1">Vencimento</Label>
                <div className="relative">
                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-primary" />
                    <Input 
                        type="date" 
                        value={dataVencimento} 
                        onChange={e => setDataVencimento(e.target.value)} 
                        className="pl-10 rounded-xl h-14 bg-primary/5 border border-primary/20 text-xs font-bold text-primary" 
                    />
                </div>
              </div>
            </div>
          </div>

          {/* Ações (Heurística #3 & #7) */}
          <div className="flex gap-3 pt-4">
            <Button 
                onClick={handleSave} 
                className="flex-1 h-16 rounded-2xl bg-primary text-black font-black uppercase text-[10px] tracking-[0.2em] shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all"
            >
              <Save className="w-4 h-4 mr-2" /> Atualizar Contrato
            </Button>
            
            {onDelete && (
              <Button 
                onClick={() => { if(confirm('⚠️ Esta ação é irreversível. Deseja excluir este contrato?')) { onDelete(emprestimo.id); onClose(); } }} 
                variant="ghost" 
                className="h-16 w-16 rounded-2xl bg-destructive/10 text-destructive hover:bg-destructive hover:text-white transition-all active:scale-90"
              >
                <Trash2 className="w-6 h-6" />
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// Ícone auxiliar interno
const TrendingUp = ({ className, size }: { className?: string; size?: number }) => (
    <svg 
        xmlns="http://www.w3.org/2000/svg" 
        width={size || 24} 
        height={size || 24} 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="3" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        className={className}
    >
        <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
        <polyline points="16 7 22 7 22 13" />
    </svg>
);

export default EditEmprestimoModal;