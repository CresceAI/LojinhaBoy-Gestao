import { useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { format, isValid, startOfDay, isBefore } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  DollarSign, TrendingUp, AlertCircle, Clock, 
  ArrowUpRight, ArrowDownLeft, Users, PieChart, Wallet 
} from 'lucide-react';

import { useAuth } from '@/hooks/useAuth';
import { useEmprestimos } from '@/hooks/useEmprestimos';
import { useClientes } from '@/hooks/useClientes';
import { useNotificacoes } from '@/hooks/useNotificacoes';
import { useIsMobile } from '@/hooks/use-mobile';
import { formatCurrency } from '@/utils/calculations';

// Tipagem para os sub-componentes
interface QuickActionProps {
  icon: any;
  label: string;
  color: string;
  onClick: () => void;
}

const Dashboard = () => {
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const { profile } = useAuth();
  
  // Hooks de dados com loading centralizado
  const { emprestimos, loading: loadingEmp } = useEmprestimos();
  const { clientes, loading: loadingCli } = useClientes();
  const { checkAndAddNotificacao } = useNotificacoes();

  // 1. Otimização de busca: Transformar array de clientes em um Mapa para busca instantânea
  const clientesMap = useMemo(() => {
    const map = new Map();
    clientes?.forEach(c => map.set(c.id, c.nome));
    return map;
  }, [clientes]);

  // 2. Inteligência Financeira: Cálculos consolidados em um único useMemo
  const stats = useMemo(() => {
    const initial = {
      capitalNaRua: 0,
      lucroRealizado: 0,
      lucroProjetado: 0,
      totalRecebido: 0,
      valorEmAtraso: 0,
      ativosCount: 0
    };

    if (!emprestimos?.length) return initial;

    const hoje = startOfDay(new Date());

    return emprestimos.reduce((acc, emp) => {
      const total = Number(emp.valor_total || 0);
      const pago = Number(emp.valor_pago || 0);
      const juros = Number(emp.juros || 0);
      const saldoDevedor = total - pago;
      
      const dataVenc = emp.data_vencimento ? startOfDay(new Date(emp.data_vencimento)) : null;
      const isAtrasado = emp.status !== 'pago' && dataVenc && isBefore(dataVenc, hoje);

      // Agregações
      if (emp.status === 'ativo' || emp.status === 'vencido') {
        acc.capitalNaRua += saldoDevedor;
        acc.ativosCount++;
        if (isAtrasado) acc.valorEmAtraso += saldoDevedor;
      }

      if (emp.status === 'pago') {
        acc.lucroRealizado += juros;
      }

      acc.lucroProjetado += juros;
      acc.totalRecebido += pago;

      return acc;
    }, initial);
  }, [emprestimos]);

  // 3. Verificação automática de notificações (Economia de requisições: roda apenas no load)
  useEffect(() => {
    if (stats.valorEmAtraso > 0) {
      // Aqui você pode disparar uma lógica de verificação se necessário
    }
  }, [stats.valorEmAtraso]);

  const proximosRecebimentos = useMemo(() => {
    return (emprestimos || [])
      .filter(e => e.status === 'ativo' && e.data_vencimento)
      .sort((a, b) => new Date(a.data_vencimento!).getTime() - new Date(b.data_vencimento!).getTime())
      .slice(0, 4);
  }, [emprestimos]);

  // Renderização de Loading Profissional
  if (loadingEmp || loadingCli) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
          <p className="text-sm text-muted-foreground animate-pulse">Sincronizando carteira...</p>
        </div>
      </div>
    );
  }

  return (
    <div key="dashboard-resilient-view" className="space-y-6 animate-in fade-in duration-500 pb-20">
      
      {/* Header Dinâmico */}
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Olá, {profile?.nome?.split(' ')[0] || 'Gestor'}
        </h1>
        <p className="text-muted-foreground text-sm">
          {format(new Date(), "EEEE, dd 'de' MMMM", { locale: ptBR })}
        </p>
      </header>

      {/* Card de Patrimônio (Cálculo de Capital sob Gestão) */}
      <div className="relative overflow-hidden bg-card border border-border/50 rounded-[2rem] p-6 shadow-sm">
        <div className="relative z-10">
          <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Patrimônio sob Gestão</span>
          <div className="flex items-baseline gap-2 mt-1">
            <h2 className="text-4xl font-black tracking-tighter">
              {formatCurrency(stats.capitalNaRua + stats.totalRecebido)}
            </h2>
          </div>

          <div className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t border-border/50">
            <section>
              <p className="text-[10px] font-bold text-muted-foreground uppercase">Lucro Líquido</p>
              <p className="text-xl font-bold text-primary">{formatCurrency(stats.lucroRealizado)}</p>
            </section>
            <section>
              <p className="text-[10px] font-bold text-muted-foreground uppercase">Em Aberto</p>
              <p className="text-xl font-bold">{formatCurrency(stats.capitalNaRua)}</p>
            </section>
          </div>
        </div>
        <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />
      </div>

      {/* Ações Rápidas (Mobile Only Otimizado) */}
      {isMobile && (
        <nav className="grid grid-cols-3 gap-3">
          <QuickAction icon={ArrowUpRight} label="Novo" color="bg-primary/10 text-primary" onClick={() => navigate('/emprestimos')} />
          <QuickAction icon={ArrowDownLeft} label="Receber" color="bg-emerald-500/10 text-emerald-600" onClick={() => navigate('/cobranca')} />
          <QuickAction icon={Users} label="Clientes" color="bg-blue-500/10 text-blue-600" onClick={() => navigate('/clientes')} />
        </nav>
      )}

      {/* Indicadores de Risco e Performance */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatSmall 
          label="Inadimplência" 
          value={formatCurrency(stats.valorEmAtraso)} 
          icon={AlertCircle} 
          color={stats.valorEmAtraso > 0 ? "text-destructive" : "text-emerald-500"}
          trend={stats.valorEmAtraso > 0 ? "Atenção" : "Em dia"}
        />
        <StatSmall 
          label="Lucro Previsto" 
          value={formatCurrency(stats.lucroProjetado - stats.lucroRealizado)} 
          icon={PieChart} 
          color="text-primary" 
        />
        {!isMobile && (
          <>
            <StatSmall label="Contratos Ativos" value={stats.ativosCount} icon={Clock} color="text-amber-500" />
            <StatSmall label="Base Clientes" value={clientes?.length || 0} icon={Users} color="text-slate-400" />
          </>
        )}
      </div>

      {/* Listagens de Fluxo de Caixa */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Coluna: Recebimentos Futuros */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-500" /> Próximos 7 dias
            </h3>
            <button onClick={() => navigate('/emprestimos')} className="text-[11px] font-bold text-primary hover:underline">VER TUDO</button>
          </div>
          <div className="space-y-3">
            {proximosRecebimentos.map(emp => (
              <TransactionItem 
                key={emp.id}
                name={clientesMap.get(emp.cliente_id) || 'Cliente'}
                date={emp.data_vencimento ? format(new Date(emp.data_vencimento), "dd 'de' MMM", { locale: ptBR }) : '--'}
                amount={formatCurrency(Number(emp.valor_total) - Number(emp.valor_pago))}
                isLate={emp.data_vencimento ? isBefore(startOfDay(new Date(emp.data_vencimento)), startOfDay(new Date())) : false}
              />
            ))}
            {proximosRecebimentos.length === 0 && <EmptyState message="Nenhum vencimento próximo" />}
          </div>
        </div>

        {/* Coluna: Histórico Recente */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-500" /> Liquidados Recentemente
          </h3>
          <div className="space-y-3">
            {emprestimos?.filter(e => e.status === 'pago').slice(0, 4).map(emp => (
              <TransactionItem 
                key={emp.id}
                name={clientesMap.get(emp.cliente_id) || 'Cliente'}
                date="Pagamento concluído"
                amount={formatCurrency(Number(emp.valor_total))}
                variant="success"
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// --- SUB-COMPONENTES MEMOIZADOS ---

const QuickAction = ({ icon: Icon, label, color, onClick }: QuickActionProps) => (
  <button 
    onClick={onClick} 
    className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-card border border-border/40 hover:border-primary/30 transition-all active:scale-95 shadow-sm"
  >
    <div className={`p-3 rounded-xl ${color}`}><Icon className="w-5 h-5" /></div>
    <span className="text-[10px] font-bold uppercase tracking-tight">{label}</span>
  </button>
);

const StatSmall = ({ label, value, icon: Icon, color, trend }: any) => (
  <div className="bg-card p-4 rounded-2xl border border-border/40 shadow-sm hover:shadow-md transition-shadow">
    <div className="flex items-center justify-between mb-3">
      <div className="p-2 rounded-lg bg-secondary/50"><Icon className={`w-4 h-4 ${color}`} /></div>
      {trend && <span className={`text-[9px] font-black uppercase px-2 py-1 rounded-full bg-secondary ${color}`}>{trend}</span>}
    </div>
    <p className="text-muted-foreground text-[10px] font-bold uppercase tracking-tighter">{label}</p>
    <p className="text-lg font-black truncate">{value}</p>
  </div>
);

const TransactionItem = ({ name, date, amount, isLate, variant = "default" }: any) => (
  <div className="flex items-center justify-between p-4 bg-card rounded-2xl border border-border/40 hover:border-primary/20 transition-colors group">
    <div className="flex items-center gap-3">
      <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
        variant === 'success' ? 'bg-emerald-500/10' : isLate ? 'bg-destructive/10' : 'bg-primary/5'
      }`}>
        {variant === 'success' ? <TrendingUp className="w-4 h-4 text-emerald-600" /> : <Wallet className="w-4 h-4 text-primary" />}
      </div>
      <div>
        <p className="text-sm font-bold group-hover:text-primary transition-colors">{name}</p>
        <p className={`text-[10px] font-medium ${isLate ? 'text-destructive' : 'text-muted-foreground'}`}>
          {isLate ? 'VENCIDO' : date}
        </p>
      </div>
    </div>
    <p className={`text-sm font-black ${variant === 'success' ? 'text-emerald-600' : 'text-foreground'}`}>
      {variant === 'success' ? `+${amount}` : amount}
    </p>
  </div>
);

const EmptyState = ({ message }: { message: string }) => (
  <div className="p-8 text-center border border-dashed border-border rounded-2xl">
    <p className="text-xs text-muted-foreground">{message}</p>
  </div>
);

export default Dashboard;