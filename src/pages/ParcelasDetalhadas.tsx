import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { getEmprestimos, getClientes, getParcelasByEmprestimo, updateParcela, getParcelas, saveParcelas, getAssinatura, saveAssinatura } from '@/utils/storage';
import { formatCurrency, formatDate, generateId, calcularValorParcela } from '@/utils/calculations';
import { Parcela } from '@/types/parcela';
import { ArrowLeft, CheckCircle, Calendar, DollarSign, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { AssinaturaDigital } from '@/components/AssinaturaDigital';

const ParcelasDetalhadas = () => {
  const { emprestimoId } = useParams();
  const navigate = useNavigate();
  const [parcelas, setParcelas] = useState<Parcela[]>([]);
  const [emprestimo, setEmprestimo] = useState<any>(null);
  const [cliente, setCliente] = useState<any>(null);
  const [showAssinatura, setShowAssinatura] = useState(false);
  const [assinatura, setAssinatura] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, [emprestimoId]);

  const loadData = () => {
    if (!emprestimoId) return;

    const emp = getEmprestimos().find(e => e.id === emprestimoId);
    if (!emp) {
      toast.error('Empréstimo não encontrado');
      navigate('/emprestimos');
      return;
    }

    setEmprestimo(emp);

    const cli = getClientes().find(c => c.id === emp.clienteId);
    setCliente(cli);

    // Buscar ou gerar parcelas
    let parcelasExistentes = getParcelasByEmprestimo(emprestimoId);
    
    if (parcelasExistentes.length === 0 && emp.formaPagamento === 'parcelado' && emp.numeroParcelas) {
      // Gerar parcelas automaticamente
      parcelasExistentes = gerarParcelas(emp);
    }

    setParcelas(parcelasExistentes);

    // Carregar assinatura
    const assinaturaExistente = getAssinatura(emprestimoId);
    setAssinatura(assinaturaExistente);
  };

  const gerarParcelas = (emp: any): Parcela[] => {
    const novasParcelas: Parcela[] = [];
    const valorParcela = calcularValorParcela(emp.valorTotal, emp.numeroParcelas!);
    const dataInicio = new Date(emp.dataInicio);

    for (let i = 1; i <= emp.numeroParcelas!; i++) {
      const dataVencimento = new Date(dataInicio);
      dataVencimento.setMonth(dataVencimento.getMonth() + i);

      const parcela: Parcela = {
        id: generateId(),
        emprestimoId: emp.id,
        numeroParcela: i,
        valor: valorParcela,
        dataVencimento: dataVencimento.toISOString().split('T')[0],
        status: 'pendente',
        createdAt: new Date().toISOString(),
      };

      novasParcelas.push(parcela);
    }

    // Salvar parcelas
    const todasParcelas = [...getParcelas(), ...novasParcelas];
    saveParcelas(todasParcelas);

    return novasParcelas;
  };

  const handlePagarParcela = (id: string) => {
    updateParcela(id, {
      status: 'pago',
      dataPagamento: new Date().toISOString(),
    });
    loadData();
    toast.success('Parcela marcada como paga!');
  };

  const handleSaveAssinatura = (assinaturaData: string) => {
    if (!emprestimoId) return;
    saveAssinatura(emprestimoId, assinaturaData);
    setAssinatura(assinaturaData);
    setShowAssinatura(false);
    toast.success('Assinatura salva com sucesso!');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pendente': return 'bg-warning text-warning-foreground';
      case 'pago': return 'bg-success text-success-foreground';
      case 'vencido': return 'bg-destructive text-destructive-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  if (!emprestimo || !cliente) {
    return null;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => navigate('/emprestimos')} className="apple-button">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-foreground">Parcelas - {cliente.nome}</h1>
          <p className="text-muted-foreground mt-1">
            {emprestimo.formaPagamento === 'parcelado' 
              ? `${emprestimo.numeroParcelas}x de ${formatCurrency(calcularValorParcela(emprestimo.valorTotal, emprestimo.numeroParcelas))}`
              : 'Pagamento à vista'}
          </p>
        </div>
      </div>

      {/* Resumo do Empréstimo */}
      <Card className="apple-card">
        <CardHeader>
          <CardTitle>Resumo do Empréstimo</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Valor Total</p>
              <p className="text-xl font-bold text-foreground">{formatCurrency(emprestimo.valorTotal)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Valor Pago</p>
              <p className="text-xl font-bold text-success">{formatCurrency(emprestimo.valorPago)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Saldo Restante</p>
              <p className="text-xl font-bold text-warning">{formatCurrency(emprestimo.valorTotal - emprestimo.valorPago)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Status</p>
              <Badge className={`${getStatusColor(emprestimo.status)} mt-2`}>
                {emprestimo.status}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Assinatura Digital */}
      {!showAssinatura && (
        <Card className="apple-card">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Assinatura Digital
            </CardTitle>
            <Button onClick={() => setShowAssinatura(true)} className="apple-button">
              {assinatura ? 'Editar Assinatura' : 'Adicionar Assinatura'}
            </Button>
          </CardHeader>
          {assinatura && (
            <CardContent>
              <div className="border border-border rounded-xl p-4 bg-muted/50">
                <img src={assinatura} alt="Assinatura" className="max-h-32 mx-auto" />
              </div>
            </CardContent>
          )}
        </Card>
      )}

      {showAssinatura && (
        <AssinaturaDigital
          onSave={handleSaveAssinatura}
          onCancel={() => setShowAssinatura(false)}
          assinaturaExistente={assinatura || undefined}
        />
      )}

      {/* Lista de Parcelas */}
      <div className="space-y-3">
        <h2 className="text-xl font-semibold text-foreground">Parcelas</h2>
        
        {parcelas.map((parcela) => (
          <Card key={parcela.id} className="apple-card animate-scale-in">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-lg ${parcela.status === 'pago' ? 'bg-success/10' : 'bg-warning/10'}`}>
                    {parcela.status === 'pago' ? (
                      <CheckCircle className="w-6 h-6 text-success" />
                    ) : (
                      <DollarSign className="w-6 h-6 text-warning" />
                    )}
                  </div>
                  
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-lg">Parcela {parcela.numeroParcela}</h3>
                      <Badge className={getStatusColor(parcela.status)}>
                        {parcela.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      Vencimento: {formatDate(parcela.dataVencimento)}
                    </p>
                    {parcela.dataPagamento && (
                      <p className="text-sm text-success flex items-center gap-2">
                        <CheckCircle className="w-4 h-4" />
                        Pago em: {formatDate(parcela.dataPagamento)}
                      </p>
                    )}
                  </div>
                </div>

                <div className="text-right flex items-center gap-4">
                  <div>
                    <p className="text-2xl font-bold text-foreground">{formatCurrency(parcela.valor)}</p>
                  </div>
                  
                  {parcela.status === 'pendente' && (
                    <Button
                      onClick={() => handlePagarParcela(parcela.id)}
                      className="apple-button"
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Marcar como Paga
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {parcelas.length === 0 && emprestimo.formaPagamento === 'vista' && (
        <Card className="apple-card">
          <CardContent className="text-center py-12">
            <DollarSign className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Este empréstimo é à vista, não há parcelas.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ParcelasDetalhadas;
