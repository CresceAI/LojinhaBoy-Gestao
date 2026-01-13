import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { format, startOfDay, isBefore } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  TrendingUp, AlertCircle, Clock, 
  Users, PieChart, Info, ShieldCheck, Banknote
} from 'lucide-react';

import { useAuth } from '@/hooks/useAuth';
import { useEmprestimos } from '@/hooks/useEmprestimos';
import { useClientes } from '@/hooks/useClientes';
import { useIsMobile } from '@/hooks/use-mobile';
import { formatCurrency, safeNumber } from '@/utils/calculations';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const Dashboard = () => {
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { emprestimos, loading: loadingEmp } = useEmprestimos();
  const { clientes, loading: loadingCli } = useClientes();

  const clientesMap = useMemo(() => {
    const map = new Map();
    clientes?.forEach(c => map.set(c.id, c.nome));
    return map;
  }, [clientes]);

  // 🛡️ LÓGICA FINANCEIRA CORRIGIDA
  const stats = useMemo(() => {
    const initial = {
      capitalNaRua: 0,     // Dinheiro original que ainda está com os clientes
      lucroRealizado: 0,   // DINHEIRO NO BOLSO: Juros quitados + Renovação recebida
      lucroProjetado: 0,   // Juros que ainda vão vencer
      valorEmAtraso: 0,    // Saldo total (capital+juro) que já passou da data
      ativosCount: 0,
    };

    if (!emprestimos?.length) return initial;
    const hoje = startOfDay(new Date());

    return emprestimos.reduce((acc, emp) => {
      const capOriginal = safeNumber(emp.valor);
      const juroContrato = safeNumber(emp.juros);
      const jaPago = safeNumber(emp.valor_pago);
      const totalContrato = safeNumber(emp.valor_total);
      
      const saldoDevedor = totalContrato - jaPago;
      const dataVenc = emp.data_vencimento ? startOfDay(new Date(emp.data_vencimento)) : null;
      const atrasado = emp.status !== 'pago' && dataVenc && isBefore(dataVenc, hoje);

      if (emp.status === 'pago') {
        // 💰 Se quitou: O juro é o seu lucro realizado
        acc.lucroRealizado += juroContrato;
      } else {
        // 📈 Contratos em andamento
        acc.capitalNaRua += capOriginal; 
        acc.lucroProjetado += juroContrato;
        acc.ativosCount++;
        
        // 💸 RENOVAÇÕES: Se ele pagou juros mas o contrato continua aberto
        if (jaPago > 0) {
          acc.lucroRealizado += jaPago; 
        }

        if (atrasado) {
          acc.valorEmAtraso += saldoDevedor;
        }
      }

      return acc;
    }, initial);
  }, [emprestimos]);

  const proximosRecebimentos = useMemo(() => {
    return (emprestimos || [])
      .filter(e => (e.status === 'ativo' || e.status === 'vencido') && e.data_vencimento)
      .sort((a, b) => new Date(a.data_vencimento!).getTime() - new Date(b.data_vencimento!).getTime())
      .slice(0, 5);
  }, [emprestimos]);

  if (loadingEmp || loadingCli) return <LoadingState />;

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-24 max-w-5xl mx-auto px-2">
      
      <header className="flex flex-col gap-1">
        <h1 className="text-3xl font-black tracking-tight">Painel da Banca</h1>
        <p className="text-muted-foreground text-[10px] font-bold uppercase tracking-widest">
          {format(new Date(), "EEEE, dd 'de' MMMM", { locale: ptBR })}
        </p>
      </header>

      {/* CARD PRINCIPAL: PATRIMÔNIO TOTAL */}
      <div className="relative overflow-hidden bg-card border border-border/40 rounded-[2.5rem] p-8 shadow-2xl">
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Patrimônio Sob Gestão</span>
            <HelpInfo text="Total que você possui hoje: Capital na rua + Juros já recebidos." />
          </div>
          
          <h2 className="text-5xl font-black tracking-tighter">
            {formatCurrency(stats.capitalNaRua + stats.lucroRealizado)}
          </h2>

          <div className="grid grid-cols-2 gap-8 mt-10 pt-8 border-t border-border/40">
            <section>
              <div className="flex items-center gap-2 mb-1">
                <p className="text-[10px] font-black text-primary uppercase tracking-widest">Lucro no Bolso</p>
                <HelpInfo text="Dinheiro real que entrou: Juros de contratos pagos + Juros de renovações recebidas." />
              </div>
              <p className="text-3xl font-black text-primary leading-none">{formatCurrency(stats.lucroRealizado)}</p>
            </section>
            <section>
              <div className="flex items-center gap-2 mb-1">
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Capital Emprestado</p>
                <HelpInfo text="Dinheiro puro que está na mão dos clientes no momento." />
              </div>
              <p className="text-3xl font-black leading-none">{formatCurrency(stats.capitalNaRua)}</p>
            </section>
          </div>
        </div>
        <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-80 h-80 bg-primary/10 rounded-full blur-[100px]" />
      </div>

      {/* INDICADORES DE PERFORMANCE */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatSmall 
          label="Em Atraso" 
          value={formatCurrency(stats.valorEmAtraso)} 
          icon={AlertCircle} 
          color={stats.valorEmAtraso > 0 ? "text-destructive" : "text-emerald-500"}
          help="Saldo devedor total que já passou da data de vencimento."
        />
        <StatSmall 
          label="Juros Futuros" 
          value={formatCurrency(stats.lucroProjetado)} 
          icon={TrendingUp} 
          color="text-primary" 
          help="Expectativa de lucro dos contratos que ainda vão vencer."
        />
        <StatSmall label="Contratos" value={stats.ativosCount} icon={ShieldCheck} color="text-blue-500" help="Total de empréstimos rodando agora." />
        <StatSmall label="Clientes" value={clientes?.length || 0} icon={Users} color="text-slate-400" help="Total de clientes cadastrados." />
      </div>

      {/* LISTAGEM DE FLUXO */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-4">
          <h3 className="text-sm font-black uppercase tracking-widest flex items-center gap-2 px-2">
            <Clock className="w-4 h-4 text-amber-500" /> Próximos Vencimentos
          </h3>
          <div className="space-y-3">
            {proximosRecebimentos.map(emp => (
              <TransactionItem 
                key={emp.id}
                name={clientesMap.get(emp.cliente_id) || 'Cliente'}
                date={emp.data_vencimento ? format(new Date(emp.data_vencimento), "dd/MM", { locale: ptBR }) : '--'}
                amount={formatCurrency(safeNumber(emp.valor_total) - safeNumber(emp.valor_pago))}
                isLate={emp.data_vencimento ? isBefore(startOfDay(new Date(emp.data_vencimento)), startOfDay(new Date())) : false}
              />
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-sm font-black uppercase tracking-widest flex items-center gap-2 px-2 text-emerald-500">
            <Banknote className="w-4 h-4" /> Entradas Recentes
          </h3>
          <div className="space-y-3">
            {emprestimos?.filter(e => safeNumber(e.valor_pago) > 0).slice(0, 5).map(emp => (
              <TransactionItem 
                key={emp.id}
                name={clientesMap.get(emp.cliente_id) || 'Cliente'}
                date={emp.status === 'pago' ? "Contrato Quitado" : "Renovação Recebida"}
                amount={formatCurrency(emp.status === 'pago' ? safeNumber(emp.juros) : safeNumber(emp.valor_pago))}
                variant="success"
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// --- COMPONENTES AUXILIARES ---

const StatSmall = ({ label, value, icon: Icon, color, help }: any) => (
  <div className="bg-card p-5 rounded-[2rem] border border-border/40 shadow-sm hover:border-primary/20 transition-all">
    <div className="flex items-center justify-between mb-3">
      <div className={`p-2.5 rounded-xl bg-secondary/50 ${color}`}><Icon className="w-4 h-4" /></div>
      <HelpInfo text={help} />
    </div>
    <p className="text-muted-foreground text-[9px] font-black uppercase tracking-tighter mb-0.5">{label}</p>
    <p className="text-lg font-black truncate leading-none">{value}</p>
  </div>
);

const TransactionItem = ({ name, date, amount, isLate, variant = "default" }: any) => (
  <div className="flex items-center justify-between p-4 bg-card rounded-2xl border border-border/40 hover:border-primary/20 transition-all">
    <div className="flex items-center gap-3">
      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
        variant === 'success' ? 'bg-emerald-500/10' : isLate ? 'bg-destructive/10' : 'bg-primary/5'
      }`}>
        {variant === 'success' ? <Banknote className="w-4 h-4 text-emerald-600" /> : <Clock className="w-4 h-4 text-primary" />}
      </div>
      <div>
        <p className="text-sm font-bold leading-none">{name}</p>
        <p className={`text-[10px] font-bold mt-1 ${isLate ? 'text-destructive' : 'text-muted-foreground uppercase'}`}>{isLate ? 'VENCIDO' : date}</p>
      </div>
    </div>
    <p className={`text-sm font-black ${variant === 'success' ? 'text-emerald-600' : 'text-foreground'}`}>
      {variant === 'success' ? `+${amount}` : amount}
    </p>
  </div>
);

const HelpInfo = ({ text }: { text: string }) => (
  <TooltipProvider>
    <Tooltip>
      <TooltipTrigger asChild>
        <button className="p-1 outline-none focus:ring-0">
          <Info className="w-3.5 h-3.5 text-muted-foreground/30 hover:text-primary transition-colors" />
        </button>
      </TooltipTrigger>
      <TooltipContent className="bg-popover/95 backdrop-blur-md border-border/40 p-3 rounded-xl text-[11px] font-medium max-w-[180px] shadow-2xl">
        <p className="leading-relaxed">{text}</p>
      </TooltipContent>
    </Tooltip>
  </TooltipProvider>
);

const LoadingState = () => (
  <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
    <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
    <p className="text-xs font-black uppercase tracking-[0.3em] animate-pulse text-muted-foreground">Calculando Banca...</p>
  </div>
);

export default Dashboard;