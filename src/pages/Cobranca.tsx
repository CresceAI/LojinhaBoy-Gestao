import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useEmprestimos } from '@/hooks/useEmprestimos';
import { useClientes } from '@/hooks/useClientes';
import { useAuth } from '@/hooks/useAuth';
import { formatCurrency, formatDate, safeNumber } from '@/utils/calculations';
import { Search, AlertCircle, Copy, Layers, Target, ChevronRight } from 'lucide-react';
import { parseISO, differenceInDays, startOfDay } from 'date-fns';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { useTheme } from 'next-themes';

// Mascotes SVGs
import sharkDark from '@/components/icons/mascote-alerta.svg';
import sharkLight from '@/components/icons/mascote-erro.svg';

const CobrancaPage = () => {
  const { theme } = useTheme();
  const { profile } = useAuth();
  const { emprestimos, loading: loadingEmp } = useEmprestimos();
  const { clientes, loading: loadingCli } = useClientes();
  const [busca, setBusca] = useState('');
  const [filtroCliente, setFiltroCliente] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const sharkImg = theme === 'dark' ? sharkLight : sharkDark;
  const hoje = startOfDay(new Date());

  const sharkTitle = profile?.nome ? `Shark ${profile.nome}` : "Shark Tank";

  // --- LÓGICA DE NEGÓCIO (MANTIDA) ---
  const devedoresProcessados = useMemo(() => {
    const ativos = (emprestimos || []).filter(
      e => String(e.status) !== 'pago' && String(e.status) !== 'quitado'
    );

    return ativos.map(emp => {
      const dataVenc = emp.data_vencimento ? startOfDay(parseISO(emp.data_vencimento)) : hoje;
      const diasRestantes = differenceInDays(dataVenc, hoje);
      const cliente = clientes.find(c => c.id === emp.cliente_id);
      const contratosDoCliente = ativos.filter(a => a.cliente_id === emp.cliente_id);

      return {
        ...emp,
        clienteNome: cliente?.nome || 'Cliente não identificado',
        diasRestantes,
        isMultiContrato: contratosDoCliente.length >= 2,
        totalContratos: contratosDoCliente.length,
      };
    }).sort((a, b) => a.diasRestantes - b.diasRestantes);
  }, [emprestimos, clientes, hoje]);

  const listaExibida = useMemo(() => {
    return devedoresProcessados.filter(e => {
      const matchBusca = e.clienteNome.toLowerCase().includes(busca.toLowerCase());
      const matchFiltro = filtroCliente ? e.cliente_id === filtroCliente : true;
      return matchBusca && matchFiltro;
    });
  }, [devedoresProcessados, busca, filtroCliente]);

  const handleSharkAttack = async (emp: any) => {
    const saldo = safeNumber(emp.valor_total) - safeNumber(emp.valor_pago);
    const msg = `Olá, ${emp.clienteNome}! 🦈\n\nPassando para lembrar que hoje temos um acerto de *${formatCurrency(saldo)}*.\n\nQual a melhor forma para você realizar o pagamento?`;

    try {
      await navigator.clipboard.writeText(msg);
      toast.success("Mensagem copiada para o ataque!", {
        icon: <img src={sharkImg} className="w-4 h-4" />
      });

      const { error } = await supabase
        .from('emprestimos')
        .update({ status: 'em_cobranca', updated_at: new Date().toISOString() })
        .eq('id', emp.id);

      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ['emprestimos'] });
    } catch (err) {
      toast.error("Falha ao atualizar status.");
    }
  };

  if (loadingEmp || loadingCli) return <LoadingState />;

  return (
    <div className="min-h-screen pt-safe pb-safe px-5 md:px-10 space-y-8 max-w-5xl mx-auto animate-fade-in relative pb-32">
      
      {/* Background Decorativo */}
      <div className="fixed inset-0 z-[-1] pointer-events-none overflow-hidden">
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-primary/5 rounded-full blur-[100px] animate-pulse" />
      </div>

      <header className="pt-8 space-y-2">
        <div className="flex items-center gap-2 text-primary">
          <Target size={14} className="animate-pulse" />
          <p className="text-[10px] font-black uppercase tracking-[0.4em]">Operação Radar</p>
        </div>
        <h1 className="text-3xl md:text-5xl font-black tracking-tighter text-foreground leading-none">
          {sharkTitle}
        </h1>
        <p className="text-muted-foreground text-xs font-medium">
          {devedoresProcessados.length} contratos ativos sob vigilância
        </p>
      </header>

      {/* Bento Stats de Cobrança */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="stat-card border-l-4 border-l-primary">
          <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground mb-1">Vence Hoje</p>
          <p className="text-3xl font-black text-foreground">
            {devedoresProcessados.filter(e => e.diasRestantes === 0).length}
          </p>
        </div>
        <div className="stat-card border-l-4 border-l-destructive">
          <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground mb-1">Atrasados</p>
          <p className="text-3xl font-black text-destructive">
            {devedoresProcessados.filter(e => e.diasRestantes < 0).length}
          </p>
        </div>
        <div className="md:col-span-2 glass-card p-5 flex items-center justify-between bg-primary/5 border-primary/10">
          <div className="space-y-1">
            <p className="text-[9px] font-black uppercase tracking-widest text-primary">Total em Aberto</p>
            <p className="text-2xl font-black text-foreground">
              {formatCurrency(devedoresProcessados.reduce((acc, e) => acc + (safeNumber(e.valor_total) - safeNumber(e.valor_pago)), 0))}
            </p>
          </div>
          <AlertCircle className="text-primary opacity-20" size={32} />
        </div>
      </div>

      {/* Filtros de Concentração */}
      <section className="space-y-4">
        <h3 className="text-[11px] font-black uppercase text-amber-500 tracking-[0.2em] flex items-center gap-2 px-1">
          <Layers size={14} /> Alta Concentração de Capital
        </h3>
        <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
          {Array.from(new Set(devedoresProcessados.filter(e => e.isMultiContrato).map(e => e.cliente_id))).map(id => {
            const c = devedoresProcessados.find(e => e.cliente_id === id);
            const isSelected = filtroCliente === id;
            return (
              <button 
                key={id} 
                onClick={() => setFiltroCliente(isSelected ? null : id)}
                className={`flex-shrink-0 px-5 py-3 rounded-2xl border transition-all duration-300 text-xs font-bold flex items-center gap-3 ${
                  isSelected 
                  ? 'bg-primary text-black border-primary shadow-lg shadow-primary/20' 
                  : 'glass-card border-white/5 text-muted-foreground hover:border-primary/40'
                }`}
              >
                {c?.clienteNome}
                <span className={`px-2 py-0.5 rounded-lg text-[10px] ${isSelected ? 'bg-black/10' : 'bg-secondary'}`}>
                  {c?.totalContratos}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* Busca */}
      <div className="relative group">
        <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" size={18} />
        <Input
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Localizar alvo na banca..."
          className="pl-14 h-16 rounded-[1.8rem] bg-card/40 backdrop-blur-md border-white/5 focus-visible:ring-primary/20 text-base"
        />
        {filtroCliente && (
          <Button variant="ghost" size="sm" onClick={() => setFiltroCliente(null)} className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black uppercase hover:bg-transparent text-primary">
            Limpar Filtro
          </Button>
        )}
      </div>

      {/* Lista de Alvos */}
      <div className="space-y-4">
        {listaExibida.length > 0 ? (
          listaExibida.map((emp) => (
            <SharkActionCard key={emp.id} emp={emp} onAttack={handleSharkAttack} sharkImg={sharkImg} />
          ))
        ) : (
          <div className="text-center py-20 glass-card border-dashed">
            <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Nenhum devedor encontrado no radar.</p>
          </div>
        )}
      </div>
    </div>
  );
};

const SharkActionCard = ({ emp, onAttack, sharkImg }: any) => {
  const saldo = safeNumber(emp.valor_total) - safeNumber(emp.valor_pago);
  const statusStr = String(emp.status);
  const isVencido = emp.diasRestantes < 0;
  const isHoje = emp.diasRestantes === 0;

  return (
    <Card className={`group relative overflow-hidden border-white/5 rounded-[2.5rem] bg-card/40 backdrop-blur-md transition-all hover:bg-card/60 ${
      isHoje ? 'ring-2 ring-primary/50 shadow-2xl shadow-primary/10' : isVencido ? 'border-destructive/20' : ''
    }`}>
      <CardContent className="p-6 md:p-8 flex items-center justify-between gap-6">
        <div className="space-y-4 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`text-[9px] font-black uppercase px-3 py-1.5 rounded-xl tracking-widest ${
              isVencido ? 'bg-destructive/10 text-destructive' : 
              isHoje ? 'bg-primary text-black' : 'bg-secondary text-muted-foreground'
            }`}>
              {isHoje ? "Vence Hoje" : isVencido ? `Atrasado ${Math.abs(emp.diasRestantes)}d` : `Em ${emp.diasRestantes} dias`}
            </span>
            {statusStr === 'em_cobranca' && (
              <Badge className="bg-blue-500/10 text-blue-500 text-[9px] font-black border-none uppercase px-3 py-1.5 tracking-widest">
                Mensagem Enviada
              </Badge>
            )}
            {emp.isMultiContrato && (
              <Badge className="bg-amber-500/10 text-amber-500 text-[9px] font-black border-none uppercase px-3 py-1.5 tracking-widest">
                Múltiplos Contratos
              </Badge>
            )}
          </div>

          <div>
            <h3 className="text-2xl font-black tracking-tighter text-foreground group-hover:text-primary transition-colors">
              {emp.clienteNome}
            </h3>
            <div className="flex items-center gap-3 mt-1">
              <p className="text-3xl font-black text-foreground tracking-tighter">
                {formatCurrency(saldo)}
              </p>
              <div className="h-1.5 w-1.5 rounded-full bg-border" />
              <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest opacity-60">
                Vence {formatDate(emp.data_vencimento)}
              </p>
            </div>
          </div>
        </div>

        <Button 
          onClick={() => onAttack(emp)}
          disabled={statusStr === 'em_cobranca'}
          className={`h-20 w-20 rounded-[2rem] transition-all duration-500 shrink-0 ${
            statusStr === 'em_cobranca' 
            ? 'bg-secondary/50 grayscale opacity-40 cursor-not-allowed' 
            : 'bg-primary text-black hover:scale-110 shadow-xl shadow-primary/20 active:scale-90'
          }`}
        >
          <img 
            src={sharkImg} 
            alt="Shark" 
            className={`w-12 h-12 object-contain ${statusStr === 'em_cobranca' ? '' : 'animate-tada'}`} 
          />
        </Button>
      </CardContent>
    </Card>
  );
};

const LoadingState = () => (
  <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-6">
    <div className="w-16 h-16 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
    <p className="text-[10px] font-black uppercase tracking-[0.5em] text-primary animate-pulse">Sincronizando Radar Shark</p>
  </div>
);

export default CobrancaPage;