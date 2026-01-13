import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Emprestimo } from '@/types';
import { formatCurrency, safeNumber } from '@/utils/calculations';
import { Save, Trash2, Calculator } from 'lucide-react';

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

  const handleSave = () => {
    if (!emprestimo) return;
    onSave({
      ...emprestimo,
      valor: safeNumber(valor),
      juros: safeNumber(juros),
      valorTotal: safeNumber(valor) + safeNumber(juros),
      dataInicio,
      dataVencimento,
    });
  };

  if (!emprestimo) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md rounded-[2rem] bg-card/95 backdrop-blur-2xl border-none shadow-2xl">
        <DialogHeader><DialogTitle className="text-xl font-black">Editar Contrato</DialogTitle></DialogHeader>
        <div className="space-y-6 pt-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label className="text-[10px] font-bold uppercase ml-1">Capital (R$)</Label>
              <Input type="number" step="0.01" value={valor} onChange={e => setValor(e.target.value)} className="rounded-2xl h-12 bg-secondary/30" />
            </div>
            <div className="space-y-1">
              <Label className="text-[10px] font-bold uppercase ml-1">Juros (R$)</Label>
              <Input type="number" step="0.01" value={juros} onChange={e => setJuros(e.target.value)} className="rounded-2xl h-12 bg-secondary/30 text-primary font-bold" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input type="date" value={dataInicio} onChange={e => setDataInicio(e.target.value)} className="rounded-2xl h-12 bg-secondary/30" />
            <Input type="date" value={dataVencimento} onChange={e => setDataVencimento(e.target.value)} className="rounded-2xl h-12 bg-secondary/30" />
          </div>
          <div className="flex gap-2">
            <Button onClick={handleSave} className="flex-1 apple-button h-12 font-bold">Salvar Alterações</Button>
            {onDelete && <Button onClick={() => { if(confirm('Excluir?')) { onDelete(emprestimo.id); onClose(); } }} variant="ghost" className="h-12 w-12 rounded-2xl bg-destructive/10 text-destructive"><Trash2 className="w-5 h-5" /></Button>}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EditEmprestimoModal;