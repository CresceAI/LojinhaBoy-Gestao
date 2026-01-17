import { useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useEmprestimos } from '@/hooks/useEmprestimos';
import { useClientes } from '@/hooks/useClientes';
import { useAuth } from '@/hooks/useAuth';
import { formatCurrency, formatDate, safeNumber } from '@/utils/calculations';
import { Search, AlertCircle, Layers, Target, Check } from 'lucide-react'; // Adicionado Check
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
  const [copiedId, setCopiedId] = useState<string | null>(null); // Estado para feedback de cópia
  const queryClient = useQueryClient();

  const sharkImg = theme === 'dark' ? sharkLight : sharkDark;
  const hoje = startOfDay(new Date());
  const sharkTitle = profile?.nome ? `Shark ${profile.nome}` : "Shark Tank";

  // --- LÓGICA DE NEGÓCIO ---
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
      
      // Feedback visual interno
      setCopiedId(emp.id);
      setTimeout(() => setCopiedId(null), 2500);

      toast.success("Ataque copiado!", {
        description: "Mensagem pronta para envio.",
        icon: <Check className="w-4 h-4 text-primary" />
      });

      const { error } = await supabase
        .from('emprestimos')
        .update({ status: 'em_cobranca', updated_at: new Date().toISOString() })
        .eq('id', emp.id);

      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ['emprestimos'] });
    } catch (err) {
      toast.error("Falha ao preparar ataque.");
    }
  };

  if (loadingEmp || loadingCli) return <LoadingState />;

  return (
    <div className="min-h-screen pt-safe pb-safe px-4 sm:px-6 md:px-10 space-y-6 md:space-y-8 max-w-5xl mx-auto animate-fade-in relative pb-32">
      
      {/* Background Decorativo */}
      <div className="fixed inset-0 z-[-1] pointer-events-none overflow-hidden">
        <div className="absolute top-0 right-0 w-[300px] md:w-[400px] h-[300px] md:h-[400px] bg-primary/5 rounded-full blur-[80px] md:blur-[100px] animate-pulse" />
      </div>

      <header className="pt-6 md:pt-8 space-y-1 md:space-y-2">
        <div className="flex items-center gap-2 text-primary">
          <Target className="w-3.5 h-3.5 animate-pulse" />
          <p className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.3em]">Operação Radar</p>
        </div>
        <h1 className="text-2xl sm:text-3xl md:text-5xl font-black tracking-tighter text-foreground leading-none">
          {sharkTitle}
        </h1>
      </header>

      {/* Bento Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <div className="stat-card border-l-4 border-l-primary bg-card/30 p-4 md:p-5">
          <p className="text-[8px] md:text-[9px] font-black uppercase tracking-widest text-muted-foreground mb-1">Vence Hoje</p>
          <p className="text-2xl md:text-3xl font-black text-foreground">{devedoresProcessados.filter(e => e.diasRestantes === 0).length}</p>
        </div>
        <div className="stat-card border-l-4 border-l-destructive bg-card/30 p-4 md:p-5">
          <p className="text-[8px] md:text-[9px] font-black uppercase tracking-widest text-muted-foreground mb-1">Atrasados</p>
          <p className="text-2xl md:text-3xl font-black text-destructive">{devedoresProcessados.filter(e => e.diasRestantes < 0).length}</p>
        </div>
        <div className="col-span-2 glass-card p-4 md:p-5 flex items-center justify-between bg-primary/5 border-primary/10">
          <div className="space-y-0.5">
            <p className="text-[8px] md:text-[9px] font-black uppercase tracking-widest text-primary">Total Radar</p>
            <p className="text-xl md:text-2xl font-black text-foreground">
              {formatCurrency(devedoresProcessados.reduce((acc, e) => acc + (safeNumber(e.valor_total) - safeNumber(e.valor_pago)), 0))}
            </p>
          </div>
          <AlertCircle className="text-primary opacity-20 w-8 h-8 shrink-0" />
        </div>
      </div>

      {/* Busca */}
      <div className="relative group">
        <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors w-4 h-4" />
        <Input
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Localizar alvo na banca..."
          className="pl-12 md:pl-14 h-14 md:h-16 rounded-2xl md:rounded-[1.8rem] bg-card/40 backdrop-blur-md border-white/5 focus-visible:ring-primary/20 text-sm md:text-base"
        />
      </div>

      {/* Lista de Alvos */}
      <div className="space-y-4">
        {listaExibida.length > 0 ? (
          listaExibida.map((emp) => (
            <SharkActionCard 
                key={emp.id} 
                emp={emp} 
                onAttack={handleSharkAttack} 
                sharkImg={sharkImg}
                isCopied={copiedId === emp.id} // Passando o estado de cópia
            />
          ))
        ) : (
          <div className="text-center py-16 glass-card border-dashed border-white/10 rounded-[2rem]">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Nenhum alvo detectado.</p>
          </div>
        )}
      </div>
    </div>
  );
};

const SharkActionCard = ({ emp, onAttack, sharkImg, isCopied }: any) => {
  const saldo = safeNumber(emp.valor_total) - safeNumber(emp.valor_pago);
  const statusStr = String(emp.status);
  const isVencido = emp.diasRestantes < 0;
  const isHoje = emp.diasRestantes === 0;

  return (
    <Card className={`group relative overflow-hidden border-white/5 rounded-[2rem] md:rounded-[2.5rem] bg-card/40 backdrop-blur-md transition-all duration-500 ${
      isCopied ? 'ring-2 ring-emerald-500 bg-emerald-500/5 shadow-2xl shadow-emerald-500/10' : 
      isHoje ? 'ring-1 ring-primary/40 shadow-xl shadow-primary/5' : ''
    }`}>
      <CardContent className="p-5 md:p-8 flex items-center justify-between gap-4 md:gap-6">
        <div className="space-y-3 flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className={`text-[8px] md:text-[9px] font-black uppercase px-2.5 py-1 rounded-lg tracking-widest transition-colors ${
              isCopied ? 'bg-emerald-500 text-black' :
              isVencido ? 'bg-destructive/10 text-destructive' : 
              isHoje ? 'bg-primary text-black' : 'bg-secondary text-muted-foreground'
            }`}>
              {isCopied ? "Mensagem Copiada" : isHoje ? "Vence Hoje" : isVencido ? `Atrasado ${Math.abs(emp.diasRestantes)}d` : `Em ${emp.diasRestantes} dias`}
            </span>
          </div>

          <div className="min-w-0">
            <h3 className="text-lg md:text-2xl font-black tracking-tighter text-foreground truncate group-hover:text-primary transition-colors">
              {emp.clienteNome}
            </h3>
            <div className="flex flex-col md:flex-row md:items-center gap-1 md:gap-3 mt-1">
              <p className="text-2xl md:text-3xl font-black text-foreground tracking-tighter">
                {formatCurrency(saldo)}
              </p>
              <p className="text-[9px] md:text-[11px] font-bold text-muted-foreground uppercase tracking-widest opacity-60">
                Vence {formatDate(emp.data_vencimento)}
              </p>
            </div>
          </div>
        </div>

        <Button 
          onClick={() => onAttack(emp)}
          className={`h-16 w-16 md:h-20 md:w-20 rounded-[1.5rem] md:rounded-[2rem] transition-all duration-300 shrink-0 shadow-lg ${
            isCopied 
            ? 'bg-emerald-500 text-black scale-110' 
            : 'bg-primary text-black hover:scale-105 active:scale-95 shadow-primary/20'
          }`}
        >
          {isCopied ? (
            <Check className="w-8 h-8 md:w-10 md:h-10 animate-scale-in" />
          ) : (
            <img 
              src={sharkImg} 
              alt="Shark" 
              className="w-10 h-10 md:w-12 md:h-12 object-contain animate-float" 
            />
          )}
        </Button>
      </CardContent>
    </Card>
  );
};

const LoadingState = () => (
  <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-6">
    <div className="w-12 h-12 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
    <p className="text-[10px] font-black uppercase tracking-[0.5em] text-primary">Sincronizando Radar...</p>
  </div>
);

export default CobrancaPage;