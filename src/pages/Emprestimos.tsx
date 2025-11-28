import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { getEmprestimos, addEmprestimo, getClientes, addCliente, updateEmprestimo } from '@/utils/storage';
import { generateId, formatCurrency, formatDate } from '@/utils/calculations';
import { Emprestimo, Cliente } from '@/types';
import { DollarSign, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

const EmprestimosPage = () => {
  const [emprestimos, setEmprestimos] = useState<Emprestimo[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  
  // Form fields
  const [nomeCliente, setNomeCliente] = useState('');
  const [valor, setValor] = useState('');
  const [juros, setJuros] = useState('');
  const [dataInicio, setDataInicio] = useState(new Date().toISOString().split('T')[0]);
  const [dataVencimento, setDataVencimento] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    // Calcula data de vencimento automaticamente (30 dias após início)
    if (dataInicio) {
      const inicio = new Date(dataInicio);
      const vencimento = new Date(inicio);
      vencimento.setDate(vencimento.getDate() + 30);
      setDataVencimento(vencimento.toISOString().split('T')[0]);
    }
  }, [dataInicio]);

  const loadData = () => {
    setEmprestimos(getEmprestimos().sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    setClientes(getClientes());
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!nomeCliente.trim() || !valor || !juros) {
      toast.error('Preencha nome, valor e juros');
      return;
    }

    const valorNum = parseFloat(valor);
    const jurosNum = parseFloat(juros);

    if (isNaN(valorNum) || isNaN(jurosNum) || valorNum <= 0 || jurosNum < 0) {
      toast.error('Valor e juros devem ser números válidos');
      return;
    }

    // Busca ou cria o cliente
    let cliente = clientes.find(c => c.nome.toLowerCase() === nomeCliente.trim().toLowerCase());
    
    if (!cliente) {
      cliente = {
        id: generateId(),
        nome: nomeCliente.trim(),
        createdAt: new Date().toISOString(),
      };
      addCliente(cliente);
    }

    const valorTotal = valorNum + jurosNum;

    const novoEmprestimo: Emprestimo = {
      id: generateId(),
      clienteId: cliente.id,
      valor: valorNum,
      dataInicio,
      dataVencimento,
      juros: jurosNum,
      formaPagamento: 'vista',
      status: 'ativo',
      valorTotal,
      valorPago: 0,
      createdAt: new Date().toISOString(),
    };

    addEmprestimo(novoEmprestimo);
    toast.success('Empréstimo cadastrado!');
    
    // Limpa form
    setNomeCliente('');
    setValor('');
    setJuros('');
    setDataInicio(new Date().toISOString().split('T')[0]);
    
    loadData();
  };

  const handleMarcarPago = (emprestimo: Emprestimo) => {
    const emprestimoAtualizado = { ...emprestimo, status: 'pago' as const, valorPago: emprestimo.valorTotal };
    updateEmprestimo(emprestimo.id, emprestimoAtualizado);
    toast.success('Empréstimo marcado como pago!');
    loadData();
  };

  const getClienteNome = (clienteId: string) => {
    return clientes.find(c => c.id === clienteId)?.nome || 'Cliente não encontrado';
  };

  const calcularTotal = () => {
    const valorNum = parseFloat(valor) || 0;
    const jurosNum = parseFloat(juros) || 0;
    return valorNum + jurosNum;
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Novo Empréstimo</h1>
        <p className="text-muted-foreground mt-1">Cadastro rápido em uma tela</p>
      </div>

      <Card className="apple-card">
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nome">Nome do Cliente</Label>
              <Input
                id="nome"
                value={nomeCliente}
                onChange={(e) => setNomeCliente(e.target.value)}
                placeholder="Ex: João Silva"
                className="rounded-xl"
                autoFocus
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="valor">Valor Emprestado (R$)</Label>
                <Input
                  id="valor"
                  type="number"
                  step="0.01"
                  value={valor}
                  onChange={(e) => setValor(e.target.value)}
                  placeholder="Ex: 550"
                  className="rounded-xl"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="juros">Juros (R$)</Label>
                <Input
                  id="juros"
                  type="number"
                  step="0.01"
                  value={juros}
                  onChange={(e) => setJuros(e.target.value)}
                  placeholder="Ex: 165"
                  className="rounded-xl"
                />
              </div>
            </div>

            {(valor || juros) && (
              <div className="p-4 bg-primary/10 rounded-xl">
                <p className="text-sm font-medium text-primary">
                  Total a Pagar: {formatCurrency(calcularTotal())}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Seu lucro: {formatCurrency(parseFloat(juros) || 0)}
                </p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="dataInicio">Data do Empréstimo</Label>
                <Input
                  id="dataInicio"
                  type="date"
                  value={dataInicio}
                  onChange={(e) => setDataInicio(e.target.value)}
                  className="rounded-xl"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="dataVencimento">Data de Vencimento</Label>
                <Input
                  id="dataVencimento"
                  type="date"
                  value={dataVencimento}
                  onChange={(e) => setDataVencimento(e.target.value)}
                  className="rounded-xl"
                />
              </div>
            </div>

            <Button type="submit" className="w-full apple-button">
              <DollarSign className="w-4 h-4 mr-2" />
              Cadastrar Empréstimo
            </Button>
          </form>
        </CardContent>
      </Card>

      <div>
        <h2 className="text-2xl font-bold text-foreground mb-4">Empréstimos Cadastrados</h2>
        <div className="space-y-3">
          {emprestimos.map((emp) => {
            const isVencido = new Date(emp.dataVencimento) < new Date() && emp.status === 'ativo';
            
            return (
              <Card key={emp.id} className="apple-card animate-scale-in">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-3">
                        <h3 className="text-lg font-semibold">{getClienteNome(emp.clienteId)}</h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          emp.status === 'pago' ? 'bg-success/10 text-success' :
                          isVencido ? 'bg-destructive/10 text-destructive' :
                          'bg-warning/10 text-warning'
                        }`}>
                          {emp.status === 'pago' ? 'Pago' : isVencido ? 'Vencido' : 'Ativo'}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Emprestado</p>
                          <p className="font-medium">{formatCurrency(emp.valor)}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Juros</p>
                          <p className="font-medium text-success">{formatCurrency(emp.juros)}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Total</p>
                          <p className="font-semibold">{formatCurrency(emp.valorTotal)}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Vencimento</p>
                          <p className="font-medium">{formatDate(emp.dataVencimento)}</p>
                        </div>
                      </div>
                    </div>

                    {emp.status === 'ativo' && (
                      <Button
                        onClick={() => handleMarcarPago(emp)}
                        variant="outline"
                        size="sm"
                        className="apple-button ml-4"
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Marcar Pago
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
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
    </div>
  );
};

export default EmprestimosPage;
