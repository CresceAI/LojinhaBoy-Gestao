import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Emprestimo } from '@/types';
import { formatCurrency } from '@/utils/calculations';
import { Save, Trash2 } from 'lucide-react';

interface EditEmprestimoModalProps {
  emprestimo: Emprestimo | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (emprestimo: Emprestimo) => void;
  onDelete?: (id: string) => void;
}

const EditEmprestimoModal = ({ emprestimo, isOpen, onClose, onSave, onDelete }: EditEmprestimoModalProps) => {
  const [valor, setValor] = useState('');
  const [juros, setJuros] = useState('');
  const [dataInicio, setDataInicio] = useState('');
  const [dataVencimento, setDataVencimento] = useState('');

  useEffect(() => {
    if (emprestimo) {
      setValor(emprestimo.valor.toString());
      setJuros(emprestimo.juros.toString());
      setDataInicio(emprestimo.dataInicio);
      setDataVencimento(emprestimo.dataVencimento);
    }
  }, [emprestimo]);

  const calcularTotal = () => {
    const valorNum = parseFloat(valor) || 0;
    const jurosNum = parseFloat(juros) || 0;
    return valorNum + jurosNum;
  };

  const handleSave = () => {
    if (!emprestimo) return;

    const valorNum = parseFloat(valor);
    const jurosNum = parseFloat(juros);

    if (isNaN(valorNum) || isNaN(jurosNum) || valorNum <= 0 || jurosNum < 0) {
      return;
    }

    const updated: Emprestimo = {
      ...emprestimo,
      valor: valorNum,
      juros: jurosNum,
      valorTotal: valorNum + jurosNum,
      dataInicio,
      dataVencimento,
    };

    onSave(updated);
    onClose();
  };

  const handleDelete = () => {
    if (emprestimo && onDelete) {
      if (confirm('Tem certeza que deseja excluir este empréstimo?')) {
        onDelete(emprestimo.id);
        onClose();
      }
    }
  };

  if (!emprestimo) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Empréstimo</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="edit-valor" className="text-xs">Valor Emprestado (R$)</Label>
              <Input
                id="edit-valor"
                type="number"
                step="0.01"
                value={valor}
                onChange={(e) => setValor(e.target.value)}
                className="rounded-xl h-10"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="edit-juros" className="text-xs">Juros (R$)</Label>
              <Input
                id="edit-juros"
                type="number"
                step="0.01"
                value={juros}
                onChange={(e) => setJuros(e.target.value)}
                className="rounded-xl h-10"
              />
            </div>
          </div>

          <div className="p-2.5 bg-primary/10 rounded-xl">
            <p className="text-sm font-medium text-primary text-center">
              Total: {formatCurrency(calcularTotal())} • Lucro: {formatCurrency(parseFloat(juros) || 0)}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="edit-dataInicio" className="text-xs">Data do Empréstimo</Label>
              <Input
                id="edit-dataInicio"
                type="date"
                value={dataInicio}
                onChange={(e) => setDataInicio(e.target.value)}
                className="rounded-xl h-10"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="edit-dataVencimento" className="text-xs">Data de Vencimento</Label>
              <Input
                id="edit-dataVencimento"
                type="date"
                value={dataVencimento}
                onChange={(e) => setDataVencimento(e.target.value)}
                className="rounded-xl h-10"
              />
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <Button onClick={handleSave} className="flex-1 apple-button h-10">
              <Save className="w-4 h-4 mr-2" />
              Salvar
            </Button>
            {onDelete && (
              <Button onClick={handleDelete} variant="destructive" size="icon" className="h-10 w-10">
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EditEmprestimoModal;
