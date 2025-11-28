import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { getEmprestimos, getClientes } from '@/utils/storage';
import { formatCurrency, formatDate } from '@/utils/calculations';
import { Emprestimo, Cliente } from '@/types';
import { Search, AlertCircle, Clock } from 'lucide-react';

const CobrancaPage = () => {
  const [emprestimos, setEmprestimos] = useState<Emprestimo[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [busca, setBusca] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    // Filtro inteligente: apenas empréstimos ativos ou vencidos, ordenados por data de vencimento
    const emprestimosAbertos = getEmprestimos()
      .filter(e => e.status === 'ativo' || e.status === 'vencido')
      .sort((a, b) => new Date(a.dataVencimento).getTime() - new Date(b.dataVencimento).getTime());
    
    setEmprestimos(emprestimosAbertos);
    setClientes(getClientes());
  };

  const getClienteNome = (clienteId: string) => {
    return clientes.find(c => c.id === clienteId)?.nome || 'Cliente não encontrado';
  };

  const emprestimosFiltrados = emprestimos.filter(emp => {
    const nomeCliente = getClienteNome(emp.clienteId).toLowerCase();
    return nomeCliente.includes(busca.toLowerCase());
  });

  const calcularDiasAtraso = (dataVencimento: string) => {
    const hoje = new Date();
    const vencimento = new Date(dataVencimento);
    const diffTime = hoje.getTime() - vencimento.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Cobrança Rápida</h1>
        <p className="text-muted-foreground mt-1">Busque quanto cada cliente está devendo</p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
        <Input
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar por nome do cliente..."
          className="pl-10 rounded-xl"
          autoFocus
        />
      </div>

      <div className="space-y-3">
        {emprestimosFiltrados.map((emp) => {
          const isVencido = new Date(emp.dataVencimento) < new Date();
          const diasAtraso = calcularDiasAtraso(emp.dataVencimento);
          const valorDevendo = emp.valorTotal - emp.valorPago;

          return (
            <Card key={emp.id} className={`apple-card animate-scale-in ${isVencido ? 'border-destructive/50' : ''}`}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-3 flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="text-xl font-bold">{getClienteNome(emp.clienteId)}</h3>
                      {isVencido && (
                        <span className="px-3 py-1 rounded-full text-xs font-medium bg-destructive/10 text-destructive flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          {diasAtraso} dias de atraso
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      <div className="p-3 bg-muted/50 rounded-lg">
                        <p className="text-xs text-muted-foreground mb-1">Deve</p>
                        <p className="text-2xl font-bold text-destructive">{formatCurrency(valorDevendo)}</p>
                      </div>
                      
                      <div className="p-3 bg-muted/50 rounded-lg">
                        <p className="text-xs text-muted-foreground mb-1">Juros (Seu lucro)</p>
                        <p className="text-lg font-semibold text-success">{formatCurrency(emp.juros)}</p>
                      </div>

                      <div className="p-3 bg-muted/50 rounded-lg">
                        <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          Vencimento
                        </p>
                        <p className={`text-sm font-medium ${isVencido ? 'text-destructive' : 'text-foreground'}`}>
                          {formatDate(emp.dataVencimento)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>Emprestado: {formatCurrency(emp.valor)}</span>
                      <span>•</span>
                      <span>Início: {formatDate(emp.dataInicio)}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {emprestimosFiltrados.length === 0 && emprestimos.length > 0 && (
        <Card className="apple-card">
          <CardContent className="text-center py-12">
            <Search className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Nenhum cliente encontrado com esse nome</p>
          </CardContent>
        </Card>
      )}

      {emprestimos.length === 0 && (
        <Card className="apple-card">
          <CardContent className="text-center py-12">
            <AlertCircle className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Nenhuma dívida em aberto no momento</p>
            <p className="text-sm text-muted-foreground mt-2">Todos os empréstimos foram pagos!</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default CobrancaPage;
