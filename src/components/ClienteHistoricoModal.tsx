import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Cliente, Emprestimo } from '@/types';
import { formatCurrency, formatDate, generateId } from '@/utils/calculations';
import { Plus, Edit2, CheckCircle, DollarSign, Calendar } from 'lucide-react';

interface ClienteHistoricoModalProps {
  cliente: Cliente | null;
  emprestimos: Emprestimo[];
  isOpen: boolean;
  onClose: () => void;
  onAddEmprestimo: (emprestimo: Emprestimo) => void;
  onEditEmprestimo: (emprestimo: Emprestimo) => void;
  onMarcarPago: (emprestimo: Emprestimo) => void;
}

const ClienteHistoricoModal = ({
  cliente,
  emprestimos,
  isOpen,
  onClose,
  onAddEmprestimo,
  onEditEmprestimo,
  onMarcarPago,
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

  const clienteEmprestimos = emprestimos
    .filter(e => e.clienteId === cliente?.id)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const totalDevendo = clienteEmprestimos
    .filter(e => e.status === 'ativo' || e.status === 'vencido')
    .reduce((acc, e) => acc + (e.valorTotal - e.valorPago), 0);

  const totalPago = clienteEmprestimos
    .filter(e => e.status === 'pago')
    .reduce((acc, e) => acc + e.valorTotal, 0);

  const lucroTotal = clienteEmprestimos
    .filter(e => e.status === 'pago')
    .reduce((acc, e) => acc + e.juros, 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cliente) return;

    const valorNum = parseFloat(valor);
    const jurosNum = parseFloat(juros);

    if (isNaN(valorNum) || isNaN(jurosNum) || valorNum <= 0 || jurosNum < 0) {
      return;
    }

    const novoEmprestimo: Emprestimo = {
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
    };

    onAddEmprestimo(novoEmprestimo);
    setShowForm(false);
    setValor('');
    setJuros('');
    setDataInicio(new Date().toISOString().split('T')[0]);
  };

  if (!cliente) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="text-xl">{cliente.nome}</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Resumo */}
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 bg-destructive/10 rounded-xl text-center">
              <p className="text-xs text-muted-foreground">Deve</p>
              <p className="text-lg font-bold text-destructive">{formatCurrency(totalDevendo)}</p>
            </div>
            <div className="p-3 bg-success/10 rounded-xl text-center">
              <p className="text-xs text-muted-foreground">Pago</p>
              <p className="text-lg font-bold text-success">{formatCurrency(totalPago)}</p>
            </div>
            <div className="p-3 bg-primary/10 rounded-xl text-center">
              <p className="text-xs text-muted-foreground">Seu Lucro</p>
              <p className="text-lg font-bold text-primary">{formatCurrency(lucroTotal)}</p>
            </div>
          </div>

          {/* Botão Novo Empréstimo */}
          {!showForm && (
            <Button onClick={() => setShowForm(true)} className="w-full apple-button">
              <Plus className="w-4 h-4 mr-2" />
              Novo Empréstimo para {cliente.nome}
            </Button>
          )}

          {/* Formulário */}
          {showForm && (
            <form onSubmit={handleSubmit} className="space-y-3 p-4 border rounded-xl bg-muted/30">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Valor (R$)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={valor}
                    onChange={(e) => setValor(e.target.value)}
                    placeholder="550"
                    className="rounded-xl"
                    autoFocus
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Juros (R$)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={juros}
                    onChange={(e) => setJuros(e.target.value)}
                    placeholder="165"
                    className="rounded-xl"
                  />
                </div>
              </div>

              {(valor || juros) && (
                <div className="p-2 bg-primary/10 rounded-lg text-center">
                  <span className="text-sm font-medium text-primary">
                    Total: {formatCurrency((parseFloat(valor) || 0) + (parseFloat(juros) || 0))}
                  </span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Início</Label>
                  <Input
                    type="date"
                    value={dataInicio}
                    onChange={(e) => setDataInicio(e.target.value)}
                    className="rounded-xl"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Vencimento</Label>
                  <Input
                    type="date"
                    value={dataVencimento}
                    onChange={(e) => setDataVencimento(e.target.value)}
                    className="rounded-xl"
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <Button type="submit" className="flex-1 apple-button">
                  Adicionar
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                  Cancelar
                </Button>
              </div>
            </form>
          )}

          {/* Lista de Empréstimos */}
          <div className="space-y-2">
            <h4 className="font-semibold text-sm text-muted-foreground">
              Histórico ({clienteEmprestimos.length})
            </h4>
            
            {clienteEmprestimos.map((emp) => {
              const isVencido = new Date(emp.dataVencimento) < new Date() && emp.status === 'ativo';
              
              return (
                <div
                  key={emp.id}
                  className={`p-3 rounded-xl border ${
                    emp.status === 'pago' ? 'bg-success/5 border-success/20' :
                    isVencido ? 'bg-destructive/5 border-destructive/20' :
                    'bg-warning/5 border-warning/20'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      emp.status === 'pago' ? 'bg-success/10 text-success' :
                      isVencido ? 'bg-destructive/10 text-destructive' :
                      'bg-warning/10 text-warning'
                    }`}>
                      {emp.status === 'pago' ? 'Pago' : isVencido ? 'Vencido' : 'Ativo'}
                    </span>
                    
                    <div className="flex gap-1">
                      {emp.status !== 'pago' && (
                        <>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => onEditEmprestimo(emp)}
                            className="h-7 w-7 p-0"
                          >
                            <Edit2 className="w-3 h-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => onMarcarPago(emp)}
                            className="h-7 w-7 p-0 text-success"
                          >
                            <CheckCircle className="w-3 h-3" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="flex items-center gap-1">
                      <DollarSign className="w-3 h-3 text-muted-foreground" />
                      <span>Total: <strong>{formatCurrency(emp.valorTotal)}</strong></span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-muted-foreground" />
                      <span>Vence: {formatDate(emp.dataVencimento)}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Emprestado:</span> {formatCurrency(emp.valor)}
                    </div>
                    <div>
                      <span className="text-muted-foreground">Juros:</span> {formatCurrency(emp.juros)}
                    </div>
                  </div>
                </div>
              );
            })}

            {clienteEmprestimos.length === 0 && (
              <p className="text-center text-sm text-muted-foreground py-4">
                Nenhum empréstimo registrado
              </p>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ClienteHistoricoModal;
