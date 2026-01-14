import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { format, startOfDay, isBefore, parseISO, isSameDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  TrendingUp, AlertCircle, Clock, 
  Users, Info, ShieldCheck, Banknote, 
  ArrowRight
} from 'lucide-react';

import { useAuth } from '@/hooks/useAuth';
import { useEmprestimos } from '@/hooks/useEmprestimos';
import { useClientes } from '@/hooks/useClientes';
import { useIsMobile } from '@/hooks/use-mobile';
import { formatCurrency, safeNumber } from '@/utils/calculations';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useTheme } from 'next-themes';

import sharkDark from '@/components/icons/shark-dark.png';
import sharkLight from '@/components/icons/shark-light.png';

const Dashboard = () => {
  const { theme } = useTheme();
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { emprestimos, loading: loadingEmp } = useEmprestimos();
  const { clientes, loading: loadingCli } = useClientes();

  const sharkImg = theme === 'dark' ? sharkLight : sharkDark;

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

  if (loadingEmp || loadingCli) return <LoadingState />;

  return (
    // ✅ Safe Area: px-5 no mobile, md:px-2 no desktop
    <div className="space-y-6 animate-in fade-in duration-500 pb-24 max-w-5xl mx-auto px-5 md:px-2 relative min-h-screen">
      
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div className={`absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-[600px] h-[600px] rounded-full blur-[120px] ${theme === 'dark' ? 'bg-primary/10' : 'bg-primary/5'}`} />
      </div>

      <div className="relative z-10 space-y-6">
        <header className="flex flex-col gap-1 pt-6">
          <p className="text-[10px] font-black uppercase tracking-[0.4em] text-primary text-left">lojinha-boy pro</p>
          <h1 className="text-4xl font-black tracking-tighter text-foreground leading-none uppercase text-left">
            SHARK {profile?.nome}
          </h1>
          <p className="text-muted-foreground text-[10px] font-bold mt-1 uppercase tracking-widest text-left">
            {format(new Date(), "EEEE, dd 'de' MMMM", { locale: ptBR })}
          </p>
        </header>

        {/* 🦈 SHARK RADAR */}
        {resumoHoje.qtd > 0 && (
          <div className="animate-in slide-in-from-top-4 duration-700">
            <div className="relative group overflow-hidden bg-primary/10 border border-primary/20 backdrop-blur-xl p-5 rounded-[2.2rem] flex items-center justify-between shadow-xl">
              <div className="flex items-center gap-4 relative z-10">
                <div className="h-14 w-14 rounded-2xl bg-primary flex items-center justify-center text-black shadow-lg">
                  <img src={sharkImg} alt="Shark" className="w-9 h-9 object-contain" />
                </div>
                <div>
                  <h4 className="text-sm font-black text-foreground leading-none">Radar do Tubarão</h4>
                  <p className="text-[11px] text-muted-foreground mt-1 font-medium">
                    Detectamos <span className="text-primary font-black">{formatCurrency(resumoHoje.valor)}</span> hoje.
                  </p>
                </div>
              </div>
              <button onClick={() => navigate('/cobranca')} className="h-10 px-4 bg-primary text-black rounded-xl text-[10px] font-black uppercase tracking-widest">
                Atacar
              </button>
            </div>
          </div>
        )}

        {/* CARD PRINCIPAL: CORREÇÃO DE MOBILE OVERLAP */}
        <div className="relative overflow-hidden bg-card/40 backdrop-blur-md border border-border/40 rounded-[2.5rem] p-6 md:p-8 shadow-2xl">
          <div className="relative z-10">
            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground block mb-2">Patrimônio Sob Gestão</span>
            <h2 className="text-4xl md:text-5xl font-black tracking-tighter text-foreground leading-tight">
              {formatCurrency(stats.capitalNaRua + stats.lucroRealizado)}
            </h2>

            {/* ✅ AJUSTE RESPONSIVO: flex-col no mobile (para não encavalar) e grid no desktop */}
            <div className="flex flex-col sm:grid sm:grid-cols-2 gap-6 sm:gap-12 mt-8 pt-8 border-t border-border/10">
              <section className="min-w-0">
                <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-1">Lucro no Bolso</p>
                <p className="text-2xl md:text-3xl font-black text-emerald-500 leading-none truncate">
                  {formatCurrency(stats.lucroRealizado)}
                </p>
              </section>
              <section className="min-w-0">
                <p className="text-[10px] font-black text-primary uppercase tracking-widest mb-1">Capital na Rua</p>
                <p className="text-2xl md:text-3xl font-black text-foreground leading-none opacity-80 truncate">
                  {formatCurrency(stats.capitalNaRua)}
                </p>
              </section>
            </div>
          </div>
        </div>

        {/* INDICADORES (Grid de Cards Pequenos) */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatSmall label="Atrasados" value={formatCurrency(stats.valorEmAtraso)} icon={AlertCircle} color={stats.valorEmAtraso > 0 ? "text-destructive" : "text-emerald-500"} />
          <StatSmall label="Projetado" value={formatCurrency(stats.lucroProjetado)} icon={TrendingUp} color="text-primary" />
          <StatSmall label="Em Aberto" value={stats.ativosCount} icon={ShieldCheck} color="text-blue-500" />
          <StatSmall label="Carteira" value={clientes?.length || 0} icon={Users} color="text-slate-400" />
        </div>

        {/* LISTAGENS */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pb-10">
          <div className="space-y-4">
            <h3 className="text-[11px] font-black uppercase tracking-[0.2em] flex items-center gap-2 px-1 text-amber-500">
              <Clock className="w-4 h-4" /> Vencimentos
            </h3>
            {proximosRecebimentos.map(emp => (
              <TransactionItem key={emp.id} name={clientesMap.get(emp.cliente_id) || 'Cliente'} date={emp.data_vencimento ? format(parseISO(emp.data_vencimento), "dd/MM") : '--'} amount={formatCurrency(safeNumber(emp.valor_total) - safeNumber(emp.valor_pago))} isLate={emp.data_vencimento ? isBefore(startOfDay(parseISO(emp.data_vencimento)), startOfDay(new Date())) : false} />
            ))}
          </div>
          <div className="space-y-4">
            <h3 className="text-[11px] font-black uppercase tracking-[0.2em] flex items-center gap-2 px-1 text-emerald-500">
              <Banknote className="w-4 h-4" /> Entradas (Juros)
            </h3>
            {entradasRecentes.map(emp => (
              <TransactionItem key={emp.id} name={clientesMap.get(emp.cliente_id) || 'Cliente'} date={String(emp.status) === 'pago' ? "Quitado" : "Renovação"} amount={formatCurrency(safeNumber(emp.valor_pago))} variant="success" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// Componente de Estatística Pequeno
const StatSmall = ({ label, value, icon: Icon, color }: any) => (
  <div className="bg-card/40 backdrop-blur-md p-4 md:p-5 rounded-[2rem] border border-border/20 shadow-sm">
    <div className={`p-2.5 rounded-xl bg-secondary/50 w-fit mb-3 ${color}`}><Icon className="w-4 h-4" /></div>
    <p className="text-muted-foreground text-[8px] font-black uppercase tracking-widest mb-1">{label}</p>
    <p className="text-lg md:text-xl font-black truncate leading-none text-foreground">{value}</p>
  </div>
);

// Item de Transação Listado
const TransactionItem = ({ name, date, amount, isLate, variant = "default" }: any) => (
  <div className="flex items-center justify-between p-4 bg-card/40 backdrop-blur-md rounded-[1.5rem] border border-border/10">
    <div className="flex items-center gap-3 min-w-0">
      <div className={`w-10 h-10 rounded-2xl flex-shrink-0 flex items-center justify-center ${variant === 'success' ? 'bg-emerald-500/10' : isLate ? 'bg-destructive/10' : 'bg-primary/5'}`}>
        {variant === 'success' ? <Banknote className="w-4 h-4 text-emerald-600" /> : <Clock className="w-4 h-4 text-primary" />}
      </div>
      <div className="min-w-0">
        <p className="text-sm font-bold leading-none text-foreground truncate">{name}</p>
        <p className={`text-[9px] font-black mt-1 ${isLate ? 'text-destructive' : 'text-muted-foreground uppercase'}`}>{isLate ? 'VENCIDO' : date}</p>
      </div>
    </div>
    <p className={`text-sm font-black flex-shrink-0 ml-2 ${variant === 'success' ? 'text-emerald-500' : 'text-foreground'}`}>
      {variant === 'success' ? `+${amount}` : amount}
    </p>
  </div>
);

const LoadingState = () => (
  <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-4">
    <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
    <p className="text-xs font-black uppercase tracking-[0.3em] text-primary animate-pulse">Sincronizando Banca...</p>
  </div>
);

export default Dashboard;