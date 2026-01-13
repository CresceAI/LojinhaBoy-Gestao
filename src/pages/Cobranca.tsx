import { useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useEmprestimos } from '@/hooks/useEmprestimos';
import { useClientes } from '@/hooks/useClientes';
import { formatCurrency, formatDate, safeNumber } from '@/utils/calculations';
import { Search, AlertCircle, Clock, CheckCircle2, ReceiptText, History } from 'lucide-react';

const CobrancaPage = () => {
  const { emprestimos, loading: loadingEmprestimos } = useEmprestimos();
  const { clientes, loading: loadingClientes } = useClientes();
  const [busca, setBusca] = useState('');

  const loading = loadingEmprestimos || loadingClientes;

  // 🛡️ Otimização: Filtro de Dívidas Ativas (Quem deve pagar agora)
  const devedoresAtivos = useMemo(() => {
    return (emprestimos || [])
      .filter(e => e.status === 'ativo' || e.status === 'vencido')
      .sort((a, b) => new Date(a.data_vencimento).getTime() - new Date(b.data_vencimento).getTime());
  }, [emprestimos]);

  // 🧾 NOVA SEÇÃO: Logs de Juros Recebidos (Quem já pagou renovação)
  const logsJuros = useMemo(() => {
    return (emprestimos || [])
      .filter(e => safeNumber(e.valor_pago) > 0)
      .sort((a, b) => new Date(b.updated_at || b.created_at).getTime() - new Date(a.updated_at || a.created_at).getTime());
  }, [emprestimos]);

  const getClienteNome = (clienteId: string) => {
    return clientes.find(c => c.id === clienteId)?.nome || 'Cliente não encontrado';
  };

  const devedoresFiltrados = devedoresAtivos.filter(emp => 
    getClienteNome(emp.cliente_id).toLowerCase().includes(busca.toLowerCase())
  );

  const calcularDiasAtraso = (dataVencimento: string) => {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const vencimento = new Date(dataVencimento);
    const diffTime = hoje.getTime() - vencimento.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  if (loading) return <div className="p-20 text-center animate-pulse font-bold">Carregando Cobranças...</div>;

  return (
    <div className="space-y-8 animate-fade-in max-w-4xl mx-auto pb-24 px-2">
      <header>
        <h1 className="text-3xl font-black tracking-tight text-foreground">Cobrança & Logs</h1>
        <p className="text-muted-foreground text-xs font-bold uppercase tracking-widest mt-1">Gestão de Recebimentos</p>
      </header>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
        <Input
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar devedor..."
          className="pl-11 h-12 rounded-2xl bg-card border-border/40 shadow-sm"
        />
      </div>

      {/* --- SEÇÃO 1: QUEM PRECISA PAGAR --- */}
      <section className="space-y-4">
        <h3 className="text-sm font-black uppercase tracking-widest flex items-center gap-2 px-1 text-primary">
          <AlertCircle className="w-4 h-4" /> Contratos em Aberto
        </h3>
        
        <div className="space-y-3">
          {devedoresFiltrados.map((emp) => {
            const diasAtraso = calcularDiasAtraso(emp.data_vencimento);
            const isVencido = diasAtraso > 0;
            const valorDevendo = safeNumber(emp.valor_total) - safeNumber(emp.valor_pago);

            return (
              <Card key={emp.id} className={`apple-card overflow-hidden border-l-4 ${isVencido ? 'border-l-destructive' : 'border-l-primary'}`}>
                <CardContent className="p-5">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-black leading-tight">{getClienteNome(emp.cliente_id)}</h3>
                      <p className="text-[10px] font-bold text-muted-foreground uppercase mt-1">Vencimento: {formatDate(emp.data_vencimento)}</p>
                    </div>
                    {isVencido && (
                      <span className="bg-destructive/10 text-destructive text-[10px] font-black px-2 py-1 rounded-lg uppercase">
                        {diasAtraso} dias de atraso
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-secondary/30 p-3 rounded-2xl">
                      <p className="text-[9px] font-bold text-muted-foreground uppercase">Total para Quitar</p>
                      <p className="text-xl font-black text-destructive">{formatCurrency(valorDevendo)}</p>
                    </div>
                    <div className="bg-secondary/30 p-3 rounded-2xl">
                      <p className="text-[9px] font-bold text-muted-foreground uppercase">Juro Mensal (Lucro)</p>
                      <p className="text-xl font-black text-primary">{formatCurrency(safeNumber(emp.juros))}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      {/* --- SEÇÃO 2: LOGS DE PAGAMENTO DE JUROS (RENOVAÇÕES) --- */}
      <section className="space-y-4 pt-4">
        <h3 className="text-sm font-black uppercase tracking-widest flex items-center gap-2 px-1 text-emerald-500">
          <History className="w-4 h-4" /> Logs de Juros Recebidos
        </h3>

        <div className="bg-card/50 rounded-[2rem] border border-border/40 overflow-hidden">
          {logsJuros.length > 0 ? (
            <div className="divide-y divide-border/40">
              {logsJuros.slice(0, 8).map((log) => (
                <div key={log.id} className="p-4 flex items-center justify-between hover:bg-secondary/20 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-2xl bg-emerald-500/10 flex items-center justify-center">
                      <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                    </div>
                    <div>
                      <p className="text-sm font-bold">{getClienteNome(log.cliente_id)}</p>
                      <p className="text-[10px] text-muted-foreground font-bold uppercase">Pago em: {formatDate(log.updated_at || log.created_at)}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-black text-emerald-500">+{formatCurrency(safeNumber(log.valor_pago))}</p>
                    <p className="text-[9px] font-bold text-muted-foreground uppercase">Juro Recebido</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-10 text-center text-muted-foreground text-xs font-bold uppercase">Nenhum log registrado</div>
          )}
        </div>
        <p className="text-[9px] text-center text-muted-foreground font-medium italic">Exibindo os últimos 8 recebimentos de juros</p>
      </section>
    </div>
  );
};

export default CobrancaPage;