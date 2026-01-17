import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { format, startOfDay, isBefore, parseISO, isSameDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  TrendingUp, AlertCircle, Clock, 
  Users, ShieldCheck, Banknote, 
  PlusCircle, UserPlus, Receipt, 
  LayoutDashboard, ArrowRight
} from 'lucide-react';

import { useAuth } from '@/hooks/useAuth';
import { useEmprestimos } from '@/hooks/useEmprestimos';
import { useClientes } from '@/hooks/useClientes';
import { formatCurrency, safeNumber } from '@/utils/calculations';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';

// Mascotes SVGs
import sharkDark from '@/components/icons/mascote-erro.svg';
import sharkLight from '@/components/icons/mascote-alerta.svg';
import mascoteOk from '@/components/icons/mascote-cartao.svg';

const Dashboard = () => {
  const { theme } = useTheme();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { emprestimos, loading: loadingEmp } = useEmprestimos();
  const { clientes, loading: loadingCli } = useClientes();

  // --- LÓGICA DE NEGÓCIO MANTIDA ---
  const clientesMap = useMemo(() => {
    const map = new Map();
    clientes?.forEach(c => map.set(c.id, c.nome));
    return map;
  }, [clientes]);

  const resumoHoje = useMemo(() => {
    const hoje = new Date();
    const paraReceberHoje = (emprestimos || []).filter(emp => {
      const status = String(emp.status).toLowerCase();
      const isAberto = status !== 'pago' && status !== 'quitado';
      const venceHoje = emp.data_vencimento && isSameDay(parseISO(emp.data_vencimento), hoje);
      return isAberto && venceHoje;
    });
    const valorTotal = paraReceberHoje.reduce((acc, emp) => 
      acc + (safeNumber(emp.valor_total) - safeNumber(emp.valor_pago)), 0
    );
    return { valor: valorTotal, qtd: paraReceberHoje.length };
  }, [emprestimos]);

  const stats = useMemo(() => {
    const initial = { capitalNaRua: 0, lucroRealizado: 0, lucroProjetado: 0, valorEmAtraso: 0, ativosCount: 0 };
    if (!emprestimos?.length) return initial;
    const hoje = startOfDay(new Date());

    return emprestimos.reduce((acc, emp) => {
      const capOriginal = safeNumber(emp.valor);
      const jaPago = safeNumber(emp.valor_pago);
      const totalContrato = safeNumber(emp.valor_total);
      const status = String(emp.status).toLowerCase();
      const isAberto = status !== 'pago' && status !== 'quitado';
      
      acc.lucroRealizado += jaPago; 
      if (isAberto) {
        acc.capitalNaRua += capOriginal;
        acc.lucroProjetado += safeNumber(emp.juros);
        acc.ativosCount++;
        const dataVenc = emp.data_vencimento ? startOfDay(parseISO(emp.data_vencimento)) : null;
        if (dataVenc && isBefore(dataVenc, hoje)) {
          acc.valorEmAtraso += (totalContrato - jaPago);
        }
      }
      return acc;
    }, initial);
  }, [emprestimos]);

  const sharkImg = useMemo(() => {
    if (resumoHoje.qtd > 0) return theme === 'dark' ? sharkLight : sharkDark;
    return mascoteOk;
  }, [theme, resumoHoje.qtd]);

  const proximosRecebimentos = useMemo(() => {
    return (emprestimos || [])
      .filter(e => (String(e.status).toLowerCase() !== 'pago' && String(e.status).toLowerCase() !== 'quitado') && e.data_vencimento)
      .sort((a, b) => new Date(a.data_vencimento!).getTime() - new Date(b.data_vencimento!).getTime())
      .slice(0, 5);
  }, [emprestimos]);

  const entradasRecentes = useMemo(() => {
    return (emprestimos || [])
      .filter(e => safeNumber(e.valor_pago) > 0)
      .sort((a, b) => new Date(b.updated_at || b.created_at).getTime() - new Date(a.updated_at || a.created_at).getTime())
      .slice(0, 5);
  }, [emprestimos]);

  if (loadingEmp || loadingCli) return <LoadingState mascot={mascoteOk} />;

  return (
    <div className="min-h-screen pt-safe pb-safe px-4 sm:px-6 md:px-10 space-y-6 md:space-y-8 max-w-7xl mx-auto animate-fade-in relative pb-32">
      
      {/* Header Shark */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-2 mt-6 md:mt-8 px-1">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-primary/60">
            <LayoutDashboard className="w-3.5 h-3.5" />
            <p className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.3em]">Lojinha-Boy Pro</p>
          </div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tighter text-foreground leading-none">
            Olá, Shark {profile?.nome?.split(' ')[0]}
          </h1>
          <p className="text-muted-foreground text-[10px] md:text-xs font-medium uppercase tracking-widest opacity-70">
            {format(new Date(), "EEEE, dd 'de' MMMM", { locale: ptBR })}
          </p>
        </div>
      </header>

      {/* Grid Principal Bento */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 md:gap-6">
        
        {/* Card de Patrimônio */}
        <div className="md:col-span-2 balance-card group relative overflow-hidden flex flex-col justify-between min-h-[220px] md:min-h-[260px] p-6 md:p-8">
          <img 
            src={mascoteOk} 
            className="absolute -right-6 -bottom-6 w-40 h-40 md:w-56 md:h-56 opacity-[0.06] dark:opacity-[0.03] pointer-events-none group-hover:scale-110 group-hover:-rotate-12 transition-all duration-1000 ease-in-out" 
            alt="Status"
          />
          
          <div className="relative z-10">
            <span className="bg-primary/10 text-primary border border-primary/20 mb-4 inline-block font-black text-[9px] md:text-[10px] uppercase tracking-widest px-3 py-1.5 rounded-lg">
              Patrimônio sob gestão
            </span>
            <h2 className="text-4xl md:text-6xl font-black tracking-tighter text-foreground leading-none">
              {formatCurrency(stats.capitalNaRua + stats.lucroRealizado)}
            </h2>
          </div>

          <div className="relative z-10 grid grid-cols-2 gap-4 pt-6 border-t border-white/5 mt-6">
            <div className="min-w-0">
              <p className="text-[8px] md:text-[9px] font-black text-emerald-500 uppercase tracking-widest mb-1 truncate">Lucro no Bolso</p>
              <p className="text-lg md:text-2xl font-black text-foreground truncate">{formatCurrency(stats.lucroRealizado)}</p>
            </div>
            <div className="min-w-0">
              <p className="text-[8px] md:text-[9px] font-black text-primary/70 uppercase tracking-widest mb-1 truncate">Capital Rua</p>
              <p className="text-lg md:text-2xl font-black text-foreground/80 truncate">{formatCurrency(stats.capitalNaRua)}</p>
            </div>
          </div>
        </div>

        {/* Radar de Hoje */}
        <div className={cn(
          "md:col-span-2 glass-card flex flex-col justify-between border-t-2 transition-all duration-500 p-6 md:p-8 rounded-[2rem] md:rounded-[2.5rem]",
          resumoHoje.qtd > 0 ? 'border-t-primary shadow-2xl shadow-primary/5 bg-primary/[0.02]' : 'border-t-transparent'
        )}>
            <div className="flex justify-between items-start gap-4">
                <div className="space-y-2 md:space-y-3">
                    <h4 className="text-base md:text-lg font-black tracking-tight uppercase text-foreground">Radar do dia</h4>
                    <p className="text-[13px] md:text-sm text-muted-foreground leading-snug max-w-[200px] md:max-w-none">
                        {resumoHoje.qtd > 0 
                            ? `Detectamos ${resumoHoje.qtd} recebimentos hoje somando ${formatCurrency(resumoHoje.valor)}.` 
                            : "Sua carteira está saudável. Sem recebimentos para hoje."}
                    </p>
                </div>
                <div className={cn("shrink-0", resumoHoje.qtd > 0 ? 'animate-tada' : 'animate-float')}>
                    <img 
                      src={sharkImg} 
                      className={cn("w-16 h-16 md:w-24 md:h-24 object-contain drop-shadow-2xl transition-all duration-500", resumoHoje.qtd === 0 && 'grayscale opacity-40')} 
                      alt="Shark" 
                    />
                </div>
            </div>

            {resumoHoje.qtd > 0 && (
                <button 
                    onClick={() => navigate('/cobranca')}
                    className="w-full mt-6 bg-primary text-black font-black uppercase text-[10px] tracking-widest py-4 md:py-5 rounded-2xl hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-primary/20 flex items-center justify-center gap-2 group"
                >
                    Iniciar Ataque de Cobrança
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </button>
            )}
        </div>

        {/* Ações Rápidas - 2x2 no Mobile */}
        <div className="md:col-span-4 grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mt-2">
            <QuickAction icon={PlusCircle} label="Novo Empréstimo" onClick={() => navigate('/emprestimos')} variant="primary" />
            <QuickAction icon={UserPlus} label="Novo Cliente" onClick={() => navigate('/clientes')} variant="info" />
            <QuickAction icon={Receipt} label="Cobranças" onClick={() => navigate('/cobranca')} variant="warning" />
            <QuickAction icon={Users} label="Gestão Total" onClick={() => navigate('/clientes')} variant="default" />
        </div>

        {/* Stats Pequenos - 2x2 no Mobile */}
        <div className="md:col-span-4 grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          <StatSmall label="Em Atraso" value={formatCurrency(stats.valorEmAtraso)} icon={AlertCircle} type={stats.valorEmAtraso > 0 ? 'danger' : 'success'} />
          <StatSmall label="Lucro Projetado" value={formatCurrency(stats.lucroProjetado)} icon={TrendingUp} type="primary" />
          <StatSmall label="Ativos" value={stats.ativosCount} icon={ShieldCheck} type="default" />
          <StatSmall label="Total Clientes" value={clientes?.length || 0} icon={Users} type="default" />
        </div>

        {/* Listas de Fluxo */}
        <div className="md:col-span-2 space-y-4">
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-warning flex items-center gap-2 px-2">
                <Clock className="w-3.5 h-3.5" /> Próximos Vencimentos
            </h3>
            <div className="space-y-3">
                {proximosRecebimentos.length > 0 ? proximosRecebimentos.map(emp => (
                    <TransactionRow 
                        key={emp.id} 
                        name={clientesMap.get(emp.cliente_id) || 'Cliente'} 
                        info={emp.data_vencimento ? format(parseISO(emp.data_vencimento), "dd/MM") : '--'} 
                        amount={formatCurrency(safeNumber(emp.valor_total) - safeNumber(emp.valor_pago))} 
                        isLate={emp.data_vencimento ? isBefore(startOfDay(parseISO(emp.data_vencimento)), startOfDay(new Date())) : false} 
                    />
                )) : <EmptyState message="Sem vencimentos próximos." />}
            </div>
        </div>

        <div className="md:col-span-2 space-y-4">
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-500 flex items-center gap-2 px-2">
                <Banknote className="w-3.5 h-3.5" /> Entradas Recentes
            </h3>
            <div className="space-y-3">
                {entradasRecentes.length > 0 ? entradasRecentes.map(emp => (
                    <TransactionRow 
                        key={emp.id} 
                        name={clientesMap.get(emp.cliente_id) || 'Cliente'} 
                        info={String(emp.status) === 'pago' ? "Quitado" : "Juros"} 
                        amount={formatCurrency(safeNumber(emp.valor_pago))} 
                        variant="success" 
                    />
                )) : <EmptyState message="Nenhuma entrada recente." />}
            </div>
        </div>

      </div>
    </div>
  );
};

/* --- COMPONENTES AUXILIARES --- */

const QuickAction = ({ icon: Icon, label, onClick, variant }: any) => {
    const variants: any = {
        primary: "text-primary border-primary/20 bg-primary/5 hover:bg-primary/10",
        info: "text-blue-500 border-blue-500/20 bg-blue-500/5 hover:bg-blue-500/10",
        warning: "text-warning border-warning/20 bg-warning/5 hover:bg-warning/10",
        default: "text-muted-foreground border-white/5 bg-secondary/20 hover:bg-secondary/40"
    };

    return (
        <button 
            onClick={onClick}
            className={cn("flex flex-col items-center justify-center gap-3 p-5 md:p-6 rounded-[1.8rem] md:rounded-[2rem] border transition-all duration-300 active:scale-95 group", variants[variant])}
        >
            <Icon className="w-6 h-6 md:w-7 md:h-7 group-hover:scale-110 transition-transform" />
            <span className="text-[8px] md:text-[9px] font-black uppercase tracking-widest text-center">{label}</span>
        </button>
    );
};

const StatSmall = ({ label, value, icon: Icon, type }: any) => {
    const colors: any = {
        danger: "text-destructive bg-destructive/10 border-destructive/10",
        success: "text-emerald-500 bg-emerald-500/10 border-emerald-500/10",
        primary: "text-primary bg-primary/10 border-primary/10",
        default: "text-muted-foreground bg-secondary/50 border-white/5"
    };

    return (
        <div className={cn("p-4 md:p-5 rounded-[1.8rem] md:rounded-[2rem] border transition-all duration-300 group hover:border-primary/20", colors[type])}>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <Icon className="w-4 h-4" />
            </div>
            <p className="text-[8px] md:text-[9px] font-black uppercase tracking-widest opacity-60 mb-1 truncate">{label}</p>
            <p className="text-base md:text-xl font-black tracking-tighter truncate text-foreground">{value}</p>
        </div>
    );
};

const TransactionRow = ({ name, info, amount, isLate, variant = "default" }: any) => (
    <div className="list-item-glass hover:bg-secondary/40 transition-all cursor-pointer group flex items-center justify-between p-4 rounded-[1.5rem] border border-white/5">
        <div className="flex items-center gap-3 min-w-0">
            <div className={cn(
              "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
              variant === 'success' ? 'bg-emerald-500/10 text-emerald-500' : isLate ? 'bg-destructive/10 text-destructive' : 'bg-primary/10 text-primary'
            )}>
                {variant === 'success' ? <TrendingUp className="w-5 h-5" /> : <Clock className="w-5 h-5" />}
            </div>
            <div className="min-w-0">
                <p className="text-sm font-bold text-foreground truncate group-hover:text-primary transition-colors">{name}</p>
                <p className={cn("text-[9px] font-black uppercase tracking-widest", isLate ? 'text-destructive animate-pulse' : 'text-muted-foreground/60')}>
                    {isLate ? 'Vencido' : info}
                </p>
            </div>
        </div>
        <p className={cn("text-sm font-black whitespace-nowrap ml-2", variant === 'success' ? 'text-emerald-500' : 'text-foreground')}>
            {variant === 'success' ? `+${amount}` : amount}
        </p>
    </div>
);

const EmptyState = ({ message }: { message: string }) => (
  <div className="p-10 rounded-[2rem] bg-secondary/10 border border-dashed border-white/5 flex flex-col items-center justify-center text-center">
    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/30">{message}</p>
  </div>
);

const LoadingState = ({ mascot }: any) => (
  <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-6 p-4">
    <div className="relative">
        <div className="w-20 h-20 md:w-24 md:h-24 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
        <div className="absolute inset-0 flex items-center justify-center">
            <img src={mascot} className="w-10 h-10 md:w-12 md:h-12 opacity-40 animate-pulse grayscale" alt="Shark" />
        </div>
    </div>
    <div className="text-center space-y-2">
        <p className="text-[10px] font-black uppercase tracking-[0.5em] text-primary animate-pulse">Sincronizando Banca...</p>
        <p className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest">Aguarde, o Shark está analisando os dados</p>
    </div>
  </div>
);

export default Dashboard;