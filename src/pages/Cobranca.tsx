import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { getCobrancas, addCobranca, getEmprestimos, getClientes } from '@/utils/storage';
import { generateId, formatCurrency, formatDate } from '@/utils/calculations';
import { Cobranca, Emprestimo, Cliente } from '@/types';
import { MessageSquare, Send, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

const CobrancaPage = () => {
  const [cobrancas, setCobrancas] = useState<Cobranca[]>([]);
  const [emprestimos, setEmprestimos] = useState<Emprestimo[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedEmprestimo, setSelectedEmprestimo] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setCobrancas(getCobrancas().sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    setEmprestimos(getEmprestimos().filter(e => e.status === 'ativo'));
    setClientes(getClientes());
  };

  const handleEnviarCobranca = () => {
    if (!selectedEmprestimo) {
      toast.error('Selecione um empréstimo');
      return;
    }

    const emprestimo = emprestimos.find(e => e.id === selectedEmprestimo);
    if (!emprestimo) return;

    const cliente = clientes.find(c => c.id === emprestimo.clienteId);
    const mensagem = `Olá ${cliente?.nome}, este é um lembrete de cobrança do seu empréstimo no valor de ${formatCurrency(emprestimo.valorTotal)} com vencimento em ${formatDate(emprestimo.dataVencimento)}.`;

    const novaCobranca: Cobranca = {
      id: generateId(),
      emprestimoId: emprestimo.id,
      clienteId: emprestimo.clienteId,
      mensagem,
      enviada: true,
      dataEnvio: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };

    addCobranca(novaCobranca);
    toast.success('Cobrança enviada com sucesso! (Simulação)');
    
    // Simula envio de WhatsApp
    const whatsappUrl = `https://wa.me/${cliente?.telefone.replace(/\D/g, '')}?text=${encodeURIComponent(mensagem)}`;
    window.open(whatsappUrl, '_blank');

    setSelectedEmprestimo('');
    loadData();
    setIsDialogOpen(false);
  };

  const getClienteNome = (clienteId: string) => {
    const cliente = clientes.find(c => c.id === clienteId);
    return cliente?.nome || 'Cliente não encontrado';
  };

  const getEmprestimoInfo = (emprestimoId: string) => {
    const emprestimo = emprestimos.find(e => e.id === emprestimoId);
    return emprestimo;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Cobrança</h1>
          <p className="text-muted-foreground mt-1">Envie lembretes de pagamento</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="apple-button">
              <Send className="w-4 h-4 mr-2" />
              Enviar Cobrança
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Enviar Cobrança</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Selecione o Empréstimo</Label>
                <Select value={selectedEmprestimo} onValueChange={setSelectedEmprestimo}>
                  <SelectTrigger className="rounded-xl">
                    <SelectValue placeholder="Selecione um empréstimo" />
                  </SelectTrigger>
                  <SelectContent>
                    {emprestimos.map(emp => {
                      const cliente = clientes.find(c => c.id === emp.clienteId);
                      return (
                        <SelectItem key={emp.id} value={emp.id}>
                          {cliente?.nome} - {formatCurrency(emp.valorTotal)} (Venc: {formatDate(emp.dataVencimento)})
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>

              {selectedEmprestimo && (
                <div className="p-4 bg-muted rounded-lg space-y-2">
                  <p className="text-sm font-medium">Prévia da mensagem:</p>
                  <p className="text-sm text-muted-foreground">
                    {(() => {
                      const emp = emprestimos.find(e => e.id === selectedEmprestimo);
                      const cli = clientes.find(c => c.id === emp?.clienteId);
                      return `Olá ${cli?.nome}, este é um lembrete de cobrança do seu empréstimo no valor de ${formatCurrency(emp?.valorTotal || 0)} com vencimento em ${formatDate(emp?.dataVencimento || '')}.`;
                    })()}
                  </p>
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} className="flex-1 apple-button">
                  Cancelar
                </Button>
                <Button onClick={handleEnviarCobranca} className="flex-1 apple-button">
                  <Send className="w-4 h-4 mr-2" />
                  Enviar via WhatsApp
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-3">
        {cobrancas.map((cobranca) => (
          <Card key={cobranca.id} className="apple-card animate-scale-in">
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <div className={`p-3 rounded-lg ${cobranca.enviada ? 'bg-success/10' : 'bg-muted'}`}>
                  {cobranca.enviada ? (
                    <CheckCircle className="w-5 h-5 text-success" />
                  ) : (
                    <MessageSquare className="w-5 h-5 text-muted-foreground" />
                  )}
                </div>
                
                <div className="space-y-2 flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold">{getClienteNome(cobranca.clienteId)}</h3>
                    {cobranca.enviada && cobranca.dataEnvio && (
                      <span className="text-xs text-muted-foreground">
                        Enviado em {formatDate(cobranca.dataEnvio)}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">{cobranca.mensagem}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {cobrancas.length === 0 && (
        <Card className="apple-card">
          <CardContent className="text-center py-12">
            <MessageSquare className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Nenhuma cobrança enviada ainda</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default CobrancaPage;
