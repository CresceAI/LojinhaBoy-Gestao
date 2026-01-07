import { useEffect, useState, useRef, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { useEmprestimos } from '@/hooks/useEmprestimos';
import { useClientes } from '@/hooks/useClientes';
import { useNotificacoes } from '@/hooks/useNotificacoes';
import { formatCurrency } from '@/utils/calculations';
import { 
  DollarSign, TrendingUp, AlertCircle, Clock, 
  ArrowUpRight, ArrowDownLeft, Users, ChevronRight,
  PieChart, Wallet
} from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { format, isValid } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const { profile } = useAuth();
  // Adicionado carregamento de clientes para evitar erro ao voltar para tela
  const { emprestimos, loading: loadingEmprestimos } = useEmprestimos();
  const { clientes, loading: loadingClientes } = useClientes();
  const { checkAndAddNotificacao } = useNotificacoes();
  
  // --- LÓGICA DE INSIGHTS (Defensiva para Mobile) ---
  const insights = useMemo(() => {
    // Se não houver dados, retorna objeto zerado para não quebrar a tela
    if (!emprestimos || emprestimos.length === 0) return {
      capitalNaRua: 0, lucroRealizado: 0, lucroProjetado: 0, totalRecebido: 0, valorEmAtraso: 0 
    };

    const agora = new Date();

    return emprestimos.reduce((acc, emp) => {
      // Uso de Number() e ?. para garantir que sempre tenhamos números válidos
      const valorTotal = Number(emp?.valor_total || 0);
      const valorPago = Number(emp?.valor_pago || 0);
      const juros = Number(emp?.juros || 0);
      const pendente = valorTotal - valorPago;
      
      const dataVenc = emp?.data_vencimento ? new Date(emp.data_vencimento) : null;

      if (emp.status === 'ativo' || emp.status === 'vencido') {
        acc.capitalNaRua += pendente;
      }

      if (emp.status === 'pago') {
        acc.lucroRealizado += juros;
      }

      // Verificação segura de data usando isValid do date-fns
      if (emp.status === 'ativo' && dataVenc && isValid(dataVenc) && dataVenc < agora) {
        acc.valorEmAtraso += pendente;
      }

      acc.lucroProjetado += juros;
      acc.totalRecebido += valorPago;
      return acc;
    }, { 
      capitalNaRua: 0, 
      lucroRealizado: 0, 
      lucroProjetado: 0, 
      totalRecebido: 0,
      valorEmAtraso: 0 
    });
  }, [emprestimos]);

  // --- FILTROS DE LISTAS ---
  const proximosVencimentos = useMemo(() => {
    if (!emprestimos) return [];
    // Filtra apenas os que têm data válida
    return emprestimos
      .filter(e => e.status === 'ativo' && e.data_vencimento)
      .sort((a, b) => {
        const dateA = new Date(a.data_vencimento).getTime();
        const dateB = new Date(b.data_vencimento).getTime();
        return dateA - dateB;
      })
      .slice(0, 4);
  }, [emprestimos]);

  // --- RENDERS DE CARREGAMENTO ---
  // Evita a tela branca esperando os dados essenciais carregarem
  if (loadingEmprestimos || loadingClientes) {
    return <div className="p-10 text-center animate-pulse text-muted-foreground">Carregando inteligência financeira...</div>;
  }

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      
      {/* HEADER DINÂMICO */}
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight">
          Olá, {profile?.nome ? profile.nome.split(' ')[0] : 'Gestor'}
        </h1>
        <p className="text-muted-foreground text-sm">
          {format(new Date(), "EEEE, dd 'de' MMMM", { locale: ptBR })}
        </p>
      </div>

      {/* CARD PRINCIPAL (CORRIGIDO CORES LIGHT MODE) */}
      <div className="balance-card bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-6 rounded-[2rem] shadow-sm overflow-hidden relative border border-primary/10">
        <div className="relative z-10">
          {/* Corrigido para text-muted-foreground */}
          <p className="text-muted-foreground text-xs font-medium uppercase tracking-wider mb-1">Capital Total sob Gestão</p>
          <h2 className="text-4xl font-bold mb-6 text-foreground">
            {formatCurrency((insights.capitalNaRua) + (insights.totalRecebido))}
          </h2>
          
          <div className="grid grid-cols-2 gap-4 border-t border-border pt-4">
            <div>
              {/* Corrigido para text-muted-foreground */}
              <p className="text-muted-foreground text-[10px] uppercase font-bold">Lucro Realizado</p>
              {/* Mantido o destaque na cor do valor */}
              <p className="text-lg font-semibold text-accent">{formatCurrency(insights.lucroRealizado)}</p>
            </div>
            <div>
              {/* Corrigido para text-muted-foreground */}
              <p className="text-muted-foreground text-[10px] uppercase font-bold">Capital na Rua</p>
              <p className="text-lg font-semibold text-foreground">{formatCurrency(insights.capitalNaRua)}</p>
            </div>
          </div>
        </div>
        {/* Ajustado o elemento decorativo para ser mais sutil no modo claro */}
        <div className="absolute -right-10 -top-10 w-40 h-40 bg-primary/5 rounded-full blur-3xl"></div>
      </div>

      {/* QUICK ACTIONS MOBILE */}
      {isMobile && (
        <div className="grid grid-cols-3 gap-3">
          <QuickAction icon={ArrowUpRight} label="Novo" color="bg-primary/10 text-primary" onClick={() => navigate('/emprestimos')} />
          <QuickAction icon={ArrowDownLeft} label="Receber" color="bg-success/10 text-success" onClick={() => navigate('/cobranca')} />
          <QuickAction icon={Users} label="Clientes" color="bg-info/10 text-info" onClick={() => navigate('/clientes')} />
        </div>
      )}

      {/* INSIGHTS DE SAÚDE DO NEGÓCIO */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatSmall 
          label="Em Atraso" 
          value={formatCurrency(insights.valorEmAtraso)} 
          icon={AlertCircle} 
          trend={insights.valorEmAtraso > 0 ? "Risco" : "Saudável"}
          color={insights.valorEmAtraso > 0 ? "text-destructive" : "text-success"}
        />
        <StatSmall 
          label="Lucro a Receber" 
          value={formatCurrency(insights.lucroProjetado - insights.lucroRealizado)} 
          icon={PieChart}
          color="text-primary"
        />
        {!isMobile && (
          <>
            {/* Proteção contra undefined com ?. e || 0 */}
            <StatSmall label="Empréstimos Ativos" value={emprestimos?.filter(e => e.status === 'ativo').length || 0} icon={Clock} color="text-info" />
            <StatSmall label="Total Clientes" value={clientes?.length || 0} icon={Users} color="text-slate-500" />
          </>
        )}
      </div>

      {/* LISTAS DE ATENÇÃO */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Vencimentos */}
        <section className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <h3 className="font-bold flex items-center gap-2">
              <Clock className="w-4 h-4 text-warning" /> Próximos Recebimentos
            </h3>
            <button onClick={() => navigate('/emprestimos')} className="text-xs text-primary font-bold">Ver todos</button>
          </div>
          
          <div className="space-y-3">
            {proximosVencimentos.map(emp => (
              <TransactionItem 
                key={emp.id}
                // Uso seguro do array de clientes
                title={clientes?.find(c => c.id === emp.cliente_id)?.nome || 'Cliente'}
                subtitle={emp.data_vencimento ? format(new Date(emp.data_vencimento), "dd 'de' MMM", { locale: ptBR }) : '--'}
                value={formatCurrency(Number(emp.valor_total || 0) - Number(emp.valor_pago || 0))}
                isVencido={emp.data_vencimento && new Date(emp.data_vencimento) < new Date()}
              />
            ))}
          </div>
        </section>

        {/* Transações Recentes */}
        <section className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <h3 className="font-bold flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-success" /> Ganhos Recentes
            </h3>
          </div>
          <div className="space-y-3">
            {/* Uso seguro do array emprestimos */}
            {emprestimos?.filter(e => e.status === 'pago').slice(0, 4).map(emp => (
              <TransactionItem 
                key={emp.id}
                title={clientes?.find(c => c.id === emp.cliente_id)?.nome || 'Cliente'}
                subtitle="Pagamento integral"
                value={formatCurrency(Number(emp.valor_total || 0))}
                type="positive"
              />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

// --- SUB-COMPONENTES AUXILIARES (COM TIPAGEM CORRIGIDA) ---

const QuickAction = ({ icon: Icon, label, color, onClick }: any) => (
  <button onClick={onClick} className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-card border border-border/40 hover:bg-secondary/50 transition-all">
    <div className={`p-3 rounded-xl ${color}`}>
      <Icon className="w-5 h-5" />
    </div>
    <span className="text-[10px] font-bold uppercase tracking-tighter">{label}</span>
  </button>
);

// Adicionado tipagem explícita e ? para propriedades opcionais
const StatSmall = ({ label, value, icon: Icon, color, trend }: { 
  label: string; 
  value: string | number; 
  icon: any; 
  color: string; 
  trend?: string; // Opcional
}) => (
  <div className="bg-card p-4 rounded-2xl border border-border/50 shadow-sm">
    <div className="flex items-center justify-between mb-2">
      <div className={`p-2 rounded-lg bg-secondary`}>
        <Icon className={`w-4 h-4 ${color}`} />
      </div>
      {trend && <span className={`text-[10px] font-bold ${color}`}>{trend}</span>}
    </div>
    <p className="text-muted-foreground text-[10px] uppercase font-bold tracking-tight">{label}</p>
    <p className="text-lg font-bold truncate">{value}</p>
  </div>
);

// Adicionado tipagem explícita e ? para propriedades opcionais
const TransactionItem = ({ title, subtitle, value, isVencido, type = "neutral" }: {
  title: string;
  subtitle: string;
  value: string;
  isVencido?: boolean; // Opcional
  type?: "positive" | "neutral";
}) => (
  <div className="flex items-center justify-between p-4 bg-card rounded-2xl border border-border/30 hover:border-primary/20 transition-all">
    <div className="flex items-center gap-3">
      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
        type === 'positive' ? 'bg-success/10' : isVencido ? 'bg-destructive/10' : 'bg-primary/10'
      }`}>
        {type === 'positive' ? <ArrowDownLeft className="w-5 h-5 text-success" /> : <Wallet className="w-5 h-5 text-primary" />}
      </div>
      <div>
        <p className="text-sm font-bold leading-none mb-1">{title}</p>
        <p className={`text-[11px] ${isVencido ? 'text-destructive font-bold' : 'text-muted-foreground'}`}>
          {isVencido ? 'EM ATRASO' : subtitle}
        </p>
      </div>
    </div>
    <div className="text-right">
      <p className={`text-sm font-bold ${type === 'positive' ? 'text-success' : 'text-foreground'}`}>
        {value}
      </p>
    </div>
  </div>
);

export default Dashboard;