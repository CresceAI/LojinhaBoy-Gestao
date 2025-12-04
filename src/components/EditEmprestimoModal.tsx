import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Emprestimo } from "@/types";
import { formatCurrency } from "@/utils/calculations";
import { Save, Trash2 } from "lucide-react";

interface EditEmprestimoModalProps {
  emprestimo: Emprestimo | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (emprestimo: Emprestimo) => void;
  onDelete?: (id: string) => void;
}

const EditEmprestimoModal = ({
  emprestimo,
  isOpen,
  onClose,
  onSave,
  onDelete,
}: EditEmprestimoModalProps) => {
  const [valor, setValor] = useState("");
  const [juros, setJuros] = useState("");
  const [dataInicio, setDataInicio] = useState("");
  const [dataVencimento, setDataVencimento] = useState("");

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

    if (
      isNaN(valorNum) ||
      isNaN(jurosNum) ||
      valorNum <= 0 ||
      jurosNum < 0
    ) {
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
      if (
        confirm("Tem certeza que deseja excluir este empréstimo?")
      ) {
        onDelete(emprestimo.id);
        onClose();
      }
    }
  };

  if (!emprestimo) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md glass-panel">
        <div className="glass-glow" />
        <DialogHeader className="relative">
          <DialogTitle>Editar empréstimo</DialogTitle>
        </DialogHeader>

        <div className="relative space-y-4 pt-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-valor">Valor emprestado (R$)</Label>
              <Input
                id="edit-valor"
                type="number"
                step="0.01"
                value={valor}
                onChange={(e) => setValor(e.target.value)}
                className="rounded-2xl bg-background/80"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-juros">Juros (R$)</Label>
              <Input
                id="edit-juros"
                type="number"
                step="0.01"
                value={juros}
                onChange={(e) => setJuros(e.target.value)}
                className="rounded-2xl bg-background/80"
              />
            </div>
          </div>

          <div className="glass-panel px-3 py-2">
            <div className="glass-glow" />
            <p className="relative text-sm font-medium text-[hsl(var(--neon))]">
              Total a receber: {formatCurrency(calcularTotal())}
            </p>
            <p className="relative mt-1 text-xs text-muted-foreground">
              Seu lucro: {formatCurrency(parseFloat(juros) || 0)}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-dataInicio">Data do empréstimo</Label>
              <Input
                id="edit-dataInicio"
                type="date"
                value={dataInicio}
                onChange={(e) => setDataInicio(e.target.value)}
                className="rounded-2xl bg-background/80"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-dataVencimento">
                Data de vencimento
              </Label>
              <Input
                id="edit-dataVencimento"
                type="date"
                value={dataVencimento}
                onChange={(e) => setDataVencimento(e.target.value)}
                className="rounded-2xl bg-background/80"
              />
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <Button
              onClick={handleSave}
              className="flex-1 btn-neon-primary"
            >
              <Save className="w-4 h-4 mr-2" />
              Salvar
            </Button>
            {onDelete && (
              <Button
                onClick={handleDelete}
                variant="outline"
                size="icon"
                className="border-destructive/40 text-destructive hover:bg-destructive/10"
              >
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
