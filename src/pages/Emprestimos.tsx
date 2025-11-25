import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { getEmprestimos, addEmprestimo, updateEmprestimo, getClientes } from '@/utils/storage';
import { generateId, calcularValorTotal, formatCurrency, formatDate } from '@/utils/calculations';
import { Emprestimo, Cliente } from '@/types';
import { Plus, DollarSign, Edit, CheckCircle, FileText } from 'lucide-react';
import { toast } from 'sonner';

const Emprestimos = () => {
  const navigate = useNavigate();
  const [emprestimos, setEmprestimos] = useState<Emprestimo[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  const [formData, setFormData] = useState({
    clienteId: '',
    valor: '',
    dataInicio: new Date().toISOString().split('T')[0],
    dataVencimento: '',
    juros: '',
    formaPagamento: 'vista' as 'vista' | 'parcelado',
    numeroParcelas: '1',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setEmprestimos(getEmprestimos());
    setClientes(getClientes());
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const valor = parseFloat(formData.valor);
    const juros = parseFloat(formData.juros);
    const numeroParcelas = parseInt(formData.numeroParcelas);
    
    const meses = formData.formaPagamento === 'parcelado' ? numeroParcelas : 1;
    const valorTotal = calcularValorTotal(valor, juros, meses);

    const newEmprestimo: Emprestimo = {
      id: generateId(),
      clienteId: formData.clienteId,
      valor,
      dataInicio: formData.dataInicio,
      dataVencimento: formData.dataVencimento,
      juros,
      formaPagamento: formData.formaPagamento,
      numeroParcelas: formData.formaPagamento === 'parcelado' ? numeroParcelas : undefined,
      status: 'ativo',
      valorTotal,
      valorPago: 0,
      createdAt: new Date().toISOString(),
    };

    addEmprestimo(newEmprestimo);
    toast.success('Empréstimo cadastrado com sucesso!');
    resetForm();
    loadData();
    setIsDialogOpen(false);
  };

  const handleMarcarComoPago = (id: string) => {
    updateEmprestimo(id, { status: 'pago', valorPago: emprestimos.find(e => e.id === id)?.valorTotal || 0 });
    loadData();
    toast.success('Empréstimo marcado como pago!');
  };

  const resetForm = () => {
    setFormData({
      clienteId: '',
      valor: '',
      dataInicio: new Date().toISOString().split('T')[0],
      dataVencimento: '',
      juros: '',
      formaPagamento: 'vista',
      numeroParcelas: '1',
    });
  };

  const getClienteNome = (clienteId: string) => {
    const cliente = clientes.find(c => c.id === clienteId);
    return cliente?.nome || 'Cliente não encontrado';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ativo': return 'bg-info text-info-foreground';
      case 'pago': return 'bg-success text-success-foreground';
      case 'vencido': return 'bg-destructive text-destructive-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Empréstimos</h1>
          <p className="text-muted-foreground mt-1">Gerencie seus empréstimos</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="apple-button" onClick={resetForm}>
              <Plus className="w-4 h-4 mr-2" />
              Novo Empréstimo
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Novo Empréstimo</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="clienteId">Cliente</Label>
                <Select value={formData.clienteId} onValueChange={(value) => setFormData({ ...formData, clienteId: value })}>
                  <SelectTrigger className="rounded-xl">
                    <SelectValue placeholder="Selecione um cliente" />
                  </SelectTrigger>
                  <SelectContent>
                    {clientes.map(cliente => (
                      <SelectItem key={cliente.id} value={cliente.id}>{cliente.nome}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="valor">Valor</Label>
                <Input
                  id="valor"
                  type="number"
                  step="0.01"
                  value={formData.valor}
                  onChange={(e) => setFormData({ ...formData, valor: e.target.value })}
                  required
                  className="rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="dataInicio">Data Início</Label>
                  <Input
                    id="dataInicio"
                    type="date"
                    value={formData.dataInicio}
                    onChange={(e) => setFormData({ ...formData, dataInicio: e.target.value })}
                    required
                    className="rounded-xl"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dataVencimento">Data Vencimento</Label>
                  <Input
                    id="dataVencimento"
                    type="date"
                    value={formData.dataVencimento}
                    onChange={(e) => setFormData({ ...formData, dataVencimento: e.target.value })}
                    required
                    className="rounded-xl"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="juros">Juros (%)</Label>
                <Input
                  id="juros"
                  type="number"
                  step="0.01"
                  value={formData.juros}
                  onChange={(e) => setFormData({ ...formData, juros: e.target.value })}
                  required
                  className="rounded-xl"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="formaPagamento">Forma de Pagamento</Label>
                <Select value={formData.formaPagamento} onValueChange={(value: 'vista' | 'parcelado') => setFormData({ ...formData, formaPagamento: value })}>
                  <SelectTrigger className="rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="vista">À Vista</SelectItem>
                    <SelectItem value="parcelado">Parcelado</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {formData.formaPagamento === 'parcelado' && (
                <div className="space-y-2">
                  <Label htmlFor="numeroParcelas">Número de Parcelas</Label>
                  <Input
                    id="numeroParcelas"
                    type="number"
                    value={formData.numeroParcelas}
                    onChange={(e) => setFormData({ ...formData, numeroParcelas: e.target.value })}
                    required
                    className="rounded-xl"
                  />
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} className="flex-1 apple-button">
                  Cancelar
                </Button>
                <Button type="submit" className="flex-1 apple-button">
                  Cadastrar
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {emprestimos.map((emprestimo) => (
          <Card key={emprestimo.id} className="apple-card animate-scale-in">
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-primary/10 rounded-lg">
                    <DollarSign className="w-6 h-6 text-primary" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-lg">{getClienteNome(emprestimo.clienteId)}</h3>
                      <Badge className={getStatusColor(emprestimo.status)}>
                        {emprestimo.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Valor: {formatCurrency(emprestimo.valor)} → {formatCurrency(emprestimo.valorTotal)}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Juros: {emprestimo.juros}% | {emprestimo.formaPagamento === 'parcelado' ? `${emprestimo.numeroParcelas}x` : 'À vista'}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Início: {formatDate(emprestimo.dataInicio)} | Vencimento: {formatDate(emprestimo.dataVencimento)}
                    </p>
                  </div>
                </div>

                <div className="flex gap-2">
                  {emprestimo.formaPagamento === 'parcelado' && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => navigate(`/emprestimos/${emprestimo.id}/parcelas`)}
                      className="apple-button"
                    >
                      <FileText className="w-4 h-4 mr-1" />
                      Ver Parcelas
                    </Button>
                  )}
                  
                  {emprestimo.status === 'ativo' && (
                    <Button
                      size="sm"
                      onClick={() => handleMarcarComoPago(emprestimo.id)}
                      className="apple-button"
                    >
                      <CheckCircle className="w-4 h-4 mr-1" />
                      Marcar como Pago
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {emprestimos.length === 0 && (
        <Card className="apple-card">
          <CardContent className="text-center py-12">
            <DollarSign className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Nenhum empréstimo cadastrado ainda</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Emprestimos;
