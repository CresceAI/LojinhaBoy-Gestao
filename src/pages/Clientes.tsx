import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { getClientes, getEmprestimos } from '@/utils/storage';
import { formatCurrency } from '@/utils/calculations';
import { Cliente, Emprestimo } from '@/types';
import { Search, User, DollarSign } from 'lucide-react';

const ClientesPage = () => {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [emprestimos, setEmprestimos] = useState<Emprestimo[]>([]);
  const [busca, setBusca] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setClientes(getClientes().sort((a, b) => a.nome.localeCompare(b.nome)));
    setEmprestimos(getEmprestimos());
  };

  const clientesFiltrados = clientes.filter(cliente =>
    cliente.nome.toLowerCase().includes(busca.toLowerCase())
  );

  const getEmprestimosCliente = (clienteId: string) => {
    return emprestimos.filter(e => e.clienteId === clienteId);
  };

  const getTotalDevendo = (clienteId: string) => {
    return emprestimos
      .filter(e => e.clienteId === clienteId && (e.status === 'ativo' || e.status === 'vencido'))
      .reduce((acc, e) => acc + (e.valorTotal - e.valorPago), 0);
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Clientes</h1>
        <p className="text-muted-foreground mt-1">Lista de todos os clientes cadastrados</p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
        <Input
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar cliente por nome..."
          className="pl-10 rounded-xl"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {clientesFiltrados.map((cliente) => {
          const totalDevendo = getTotalDevendo(cliente.id);
          const emprestimosAtivos = getEmprestimosCliente(cliente.id).filter(e => e.status === 'ativo' || e.status === 'vencido').length;

          return (
            <Card key={cliente.id} className="apple-card animate-scale-in hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-primary/10 rounded-lg">
                    <User className="w-6 h-6 text-primary" />
                  </div>
                  
                  <div className="flex-1 space-y-2">
                    <h3 className="text-lg font-bold">{cliente.nome}</h3>
                    
                    <div className="space-y-1">
                      {totalDevendo > 0 ? (
                        <div className="flex items-center gap-2">
                          <DollarSign className="w-4 h-4 text-destructive" />
                          <span className="text-sm font-medium text-destructive">
                            Deve: {formatCurrency(totalDevendo)}
                          </span>
                        </div>
                      ) : (
                        <span className="text-sm text-success">✓ Nenhuma dívida</span>
                      )}
                      
                      <p className="text-xs text-muted-foreground">
                        {emprestimosAtivos} empréstimo(s) ativo(s)
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {clientesFiltrados.length === 0 && clientes.length > 0 && (
        <Card className="apple-card">
          <CardContent className="text-center py-12">
            <Search className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Nenhum cliente encontrado</p>
          </CardContent>
        </Card>
      )}

      {clientes.length === 0 && (
        <Card className="apple-card">
          <CardContent className="text-center py-12">
            <User className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Nenhum cliente cadastrado ainda</p>
            <p className="text-sm text-muted-foreground mt-2">
              Clientes são criados automaticamente ao cadastrar empréstimos
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ClientesPage;
