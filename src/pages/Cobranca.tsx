import { useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useEmprestimos } from '@/hooks/useEmprestimos';
import { useClientes } from '@/hooks/useClientes';
import { useAuth } from '@/hooks/useAuth';
import { formatCurrency, formatDate, safeNumber } from '@/utils/calculations';
import { Search, AlertCircle, Copy, Layers } from 'lucide-react';
import { parseISO, differenceInDays, startOfDay } from 'date-fns';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { useTheme } from 'next-themes';

// Ícones PNG por tema
import sharkDark from '@/components/icons/shark-dark.png';
import sharkLight from '@/components/icons/shark-light.png';

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

  // ✅ Título Ajustado: Nome normal e sem itálico
  const sharkTitle = profile?.nome 
    ? `SHARK ${profile.nome}` 
    : "SHARK TANK";

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
      toast.success("Mensagem de cobrança copiada!", {
        icon: <img src={sharkImg} className="w-4 h-4" />
      });

      const { error } = await supabase
        .from('emprestimos')
        .update({ status: 'em_cobranca', updated_at: new Date().toISOString() })
        .eq('id', emp.id);

      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ['emprestimos'] });
    } catch (err) {
      toast.error("Erro na operação.");
    }
  };

  if (loadingEmp || loadingCli) return <LoadingState />;

  return (
    <div className="space-y-8 max-w-4xl mx-auto pb-32 px-4 relative min-h-screen">
      
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className={`absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-[500px] h-[500px] rounded-full blur-[120px] ${theme === 'dark' ? 'bg-primary/10' : 'bg-primary/5 opacity-50'}`} />
        <div className={`absolute inset-0 opacity-[0.03] ${theme === 'dark' ? 'block' : 'hidden'}`} style={{ backgroundImage: "url('/banner-login.svg')" }} />
      </div>

      <div className="relative z-10 space-y-8">
        <header className="pt-10 space-y-2">
          <div className="flex items-center gap-3">
            <div className="h-1 bg-primary w-12 rounded-full" />
            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-primary">Operação Ativa</p>
          </div>
          {/* ✅ Removido o 'italic' e o 'toUpperCase' do título principal */}
          <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-foreground leading-none">
            {sharkTitle}
          </h1>
          <p className="text-muted-foreground text-[11px] font-bold uppercase tracking-widest opacity-70">
            {devedoresProcessados.length} Alvos no Radar
          </p>
        </header>

        <section className="grid grid-cols-2 gap-3">
          <div className="bg-card border border-border/40 p-5 rounded-[2rem] shadow-sm">
            <p className="text-[8px] font-black uppercase text-muted-foreground mb-1 tracking-widest">Vence Hoje</p>
            <p className="text-3xl font-black text-foreground">
              {devedoresProcessados.filter(e => e.diasRestantes === 0).length}
            </p>
          </div>
          <div className="bg-card border border-border/40 p-5 rounded-[2rem] shadow-sm">
            <p className="text-[8px] font-black uppercase text-muted-foreground mb-1 tracking-widest">Atrasados</p>
            <p className="text-3xl font-black text-destructive">
              {devedoresProcessados.filter(e => e.diasRestantes < 0).length}
            </p>
          </div>
        </section>

        <section className="space-y-3">
          <h3 className="text-[10px] font-black uppercase text-amber-500 tracking-widest flex items-center gap-2 px-1">
            <Layers className="w-4 h-4" /> Alta Concentração de Capital
          </h3>
          <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
            {Array.from(new Set(devedoresProcessados.filter(e => e.isMultiContrato).map(e => e.cliente_id))).map(id => {
              const c = devedoresProcessados.find(e => e.cliente_id === id);
              return (
                <Badge 
                  key={id} 
                  onClick={() => setFiltroCliente(filtroCliente === id ? null : id)}
                  className={`cursor-pointer py-2.5 px-5 rounded-2xl border transition-all duration-300 shadow-sm ${
                    filtroCliente === id 
                    ? 'bg-primary text-black border-primary' 
                    : 'bg-card border-border/40 text-muted-foreground hover:border-primary/40'
                  }`}
                >
                  {c?.clienteNome} <span className="ml-2 opacity-40">({c?.totalContratos})</span>
                </Badge>
              );
            })}
          </div>
        </section>

        <div className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Pesquisar alvo na banca..."
            className="pl-11 h-14 rounded-2xl bg-card border-border/40 shadow-sm text-foreground focus-visible:ring-primary/30"
          />
          {filtroCliente && (
            <Button variant="ghost" size="sm" onClick={() => setFiltroCliente(null)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] font-black uppercase">
              Limpar Filtro
            </Button>
          )}
        </div>

        <div className="space-y-4">
          {listaExibida.map((emp) => (
            <SharkActionCard key={emp.id} emp={emp} onAttack={handleSharkAttack} sharkImg={sharkImg} />
          ))}
        </div>
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
    <Card className={`group overflow-hidden border border-border/40 rounded-[2.2rem] bg-card/60 backdrop-blur-md transition-all hover:bg-card ${
      isHoje ? 'ring-1 ring-primary shadow-lg' : ''
    }`}>
      <CardContent className="p-6 flex items-center justify-between gap-4">
        <div className="space-y-3 flex-1">
          <div className="flex items-center gap-2">
            <span className={`text-[8px] font-black uppercase px-2.5 py-1 rounded-lg ${
              isVencido ? 'bg-destructive/10 text-destructive' : 
              isHoje ? 'bg-primary/20 text-primary animate-pulse' : 'bg-secondary text-muted-foreground'
            }`}>
              {isHoje ? "🚨 Vence Hoje" : isVencido ? `⚠️ Atrasado ${Math.abs(emp.diasRestantes)}d` : `📅 em ${emp.diasRestantes} dias`}
            </span>
            {statusStr === 'em_cobranca' && (
              <Badge className="bg-blue-500/10 text-blue-500 text-[8px] font-black border-none uppercase px-2 py-1">
                Radar Enviado
              </Badge>
            )}
          </div>

          <div>
            <h3 className="text-xl font-black tracking-tight text-foreground group-hover:text-primary transition-colors">
              {emp.clienteNome}
            </h3>
            <div className="flex items-center gap-2 mt-1">
              {/* ✅ Removido o 'italic' do valor e data */}
              <p className="text-2xl font-black text-foreground tracking-tighter">
                {formatCurrency(saldo)}
              </p>
              <div className="h-1 w-1 rounded-full bg-border" />
              <p className="text-[10px] font-bold text-muted-foreground uppercase">
                Vence {formatDate(emp.data_vencimento)}
              </p>
            </div>
          </div>
        </div>

        <Button 
          onClick={() => onAttack(emp)}
          className={`h-16 w-16 rounded-[1.5rem] transition-all duration-500 ${
            statusStr === 'em_cobranca' 
            ? 'bg-secondary text-muted-foreground' 
            : 'bg-primary text-black hover:scale-105 shadow-md'
          }`}
        >
          <img 
            src={sharkImg} 
            alt="Shark" 
            className={`w-10 h-10 object-contain ${statusStr === 'em_cobranca' ? 'opacity-20' : 'animate-tada'}`} 
          />
        </Button>
      </CardContent>
    </Card>
  );
};

const LoadingState = () => (
  <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-6">
    <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
    <p className="text-[10px] font-black uppercase tracking-[0.4em] text-primary animate-pulse">Sincronizando Radar Shark...</p>
  </div>
);

export default CobrancaPage;