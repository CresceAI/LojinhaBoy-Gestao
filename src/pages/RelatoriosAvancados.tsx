import { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useEmprestimos } from '@/hooks/useEmprestimos';
import { useClientes } from '@/hooks/useClientes';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { formatCurrency, formatDate, safeNumber } from '@/utils/calculations';
import { 
  BarChart3, Download, TrendingUp, DollarSign, 
  AlertCircle, ShieldCheck, Database, Clock, CalendarDays, History, Info, UploadCloud, AlertTriangle
} from 'lucide-react';
import { toast } from 'sonner';
import { startOfDay, isBefore, addDays, parseISO, format, differenceInDays } from 'date-fns';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const RelatoriosAvancados = () => {
  const { user } = useAuth();
  const { emprestimos, loading } = useEmprestimos();
  const { clientes } = useClientes();
  const [filtroStatus, setFiltroStatus] = useState<string>('todos');
  const [lastBackup, setLastBackup] = useState<string | null>(localStorage.getItem('last_backup_date'));

  // 🛡️ MOTOR DE CÁLCULO E PREVISÃO
  const { stats, timeline, logs } = useMemo(() => {
    const hoje = startOfDay(new Date());
    const seteDias = addDays(hoje, 7);
    const quinzeDias = addDays(hoje, 15);
    const trintaDias = addDays(hoje, 30);

    const initialStats = { capitalNaRua: 0, lucroRealizado: 0, totalAberto: 0, totalVencido: 0, lucroProjetado: 0 };
    const initialTimeline = { atrasado: 0, hoje: 0, estaSemana: 0, proximaQuinzena: 0, finalMes: 0 };

    if (!emprestimos?.length) return { stats: initialStats, timeline: initialTimeline, logs: [] };

    const filtered = filtroStatus === 'todos' ? emprestimos : emprestimos.filter(e => e.status === filtroStatus);

    const calculated = filtered.reduce((acc, emp) => {
      const capOriginal = safeNumber(emp.valor);
      const juroContrato = safeNumber(emp.juros);
      const jaPago = safeNumber(emp.valor_pago);
      const totalContrato = safeNumber(emp.valor_total);
      const saldoDevedor = totalContrato - jaPago;
      
      const vencData = emp.data_vencimento ? startOfDay(parseISO(emp.data_vencimento)) : null;
      const atrasado = emp.status !== 'pago' && vencData && isBefore(vencData, hoje);

      if (emp.status === 'pago') {
        acc.stats.lucroRealizado += juroContrato;
      } else {
        acc.stats.capitalNaRua += capOriginal;
        acc.stats.lucroProjetado += juroContrato;
        acc.stats.totalAberto += saldoDevedor;
        if (jaPago > 0) acc.stats.lucroRealizado += jaPago; 
        if (atrasado) acc.stats.totalVencido += saldoDevedor;

        if (vencData) {
          if (atrasado) acc.timeline.atrasado += saldoDevedor;
          else if (vencData.getTime() === hoje.getTime()) acc.timeline.hoje += saldoDevedor;
          else if (isBefore(vencData, seteDias)) acc.timeline.estaSemana += saldoDevedor;
          else if (isBefore(vencData, quinzeDias)) acc.timeline.proximaQuinzena += saldoDevedor;
          else if (isBefore(vencData, trintaDias)) acc.timeline.finalMes += saldoDevedor;
        }
      }
      return acc;
    }, { stats: initialStats, timeline: initialTimeline });

    return { 
      stats: calculated.stats, 
      timeline: calculated.timeline,
      logs: [...emprestimos].sort((a,b) => new Date(b.updated_at || b.created_at).getTime() - new Date(a.updated_at || a.created_at).getTime()).slice(0, 6)
    };
  }, [emprestimos, filtroStatus]);

  // 💾 EXPORTAR BACKUP (DOWNLOAD JSON)
  const handleExportBackup = () => {
    const backupData = {
      version: "1.0",
      timestamp: new Date().toISOString(),
      user: user?.email,
      data: { emprestimos, clientes }
    };

    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `backup_lojinha_pro_${format(new Date(), 'ddMMyyyy_HHmm')}.json`;
    link.click();
    
    const now = new Date().toISOString();
    localStorage.setItem('last_backup_date', now);
    setLastBackup(now);
    toast.success('Backup realizado com sucesso!');
  };

  // 📥 IMPORTAR BACKUP (INSERIR JSON)
  const handleImportBackup = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const content = JSON.parse(e.target?.result as string);
        const dataToImport = content.data?.emprestimos || content.emprestimos;

        if (!Array.isArray(dataToImport)) throw new Error("Formato inválido");

        toast.info("Restaurando dados... aguarde.");

        for (const emp of dataToImport) {
          const { id, created_at, updated_at, ...rest } = emp;
          await supabase.from('emprestimos').upsert({
            ...rest,
            user_id: user?.id,
            updated_at: new Date().toISOString()
          });
        }

        toast.success("Dados restaurados! Recarregando...");
        setTimeout(() => window.location.reload(), 1500);
      } catch (err) {
        toast.error("Falha ao importar. O arquivo JSON é inválido.");
      }
    };
    reader.readAsText(file);
  };

  // 🛡️ VERIFICADOR DE SEGURANÇA (Backup Antigo)
  const backupAntigo = lastBackup ? differenceInDays(new Date(), new Date(lastBackup)) > 7 : true;

  if (loading) return <LoadingState />;

  return (
    <div className="space-y-6 pb-24 animate-in fade-in duration-700 max-w-6xl mx-auto px-2">
      
      {/* BANNER DE SEGURANÇA */}
      {backupAntigo && (
        <div className="bg-destructive/10 border border-destructive/20 p-4 rounded-3xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertTriangle className="text-destructive w-5 h-5" />
            <div>
              <p className="text-sm font-black text-destructive uppercase tracking-tight">Sua banca está em risco!</p>
              <p className="text-[10px] text-muted-foreground font-bold uppercase">Último backup realizado {lastBackup ? `há ${differenceInDays(new Date(), new Date(lastBackup))} dias` : 'nunca'}.</p>
            </div>
          </div>
          <Button size="sm" onClick={handleExportBackup} className="bg-destructive text-white hover:bg-destructive/90 rounded-xl h-9 font-black text-[10px] uppercase">Salvar Agora</Button>
        </div>
      )}

      <header className="flex flex-col md:flex-row justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight">Relatórios de Banca</h1>
          <p className="text-muted-foreground text-[10px] font-bold uppercase tracking-widest mt-1">Auditoria e Fluxo de Caixa</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleExportBackup} variant="outline" className="apple-button h-12 rounded-2xl border-primary/20 text-primary bg-primary/5">
            <Database className="w-4 h-4 mr-2" /> Backup
          </Button>
          <div className="relative">
            <input type="file" accept=".json" onChange={handleImportBackup} className="hidden" id="import-json" />
            <Label htmlFor="import-json" className="flex items-center justify-center px-4 h-12 rounded-2xl border border-dashed border-border/60 bg-secondary/20 hover:bg-secondary/40 cursor-pointer transition-all text-[10px] font-black uppercase tracking-widest">
              <UploadCloud className="w-4 h-4 mr-2" /> Inserir JSON
            </Label>
          </div>
        </div>
      </header>

      {/* CARDS BENTO */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <ReportCard title="Capital Investido" value={formatCurrency(stats.capitalNaRua)} icon={DollarSign} color="text-foreground" help="Valor líquido emprestado." />
        <ReportCard title="Lucro Realizado" value={formatCurrency(stats.lucroRealizado)} icon={TrendingUp} color="text-emerald-500" help="Juros totais recebidos." />
        <ReportCard title="Total em Aberto" value={formatCurrency(stats.totalAberto)} icon={BarChart3} color="text-primary" help="Total a receber (Capital + Juros)." />
        <ReportCard title="Total Vencido" value={formatCurrency(stats.totalVencido)} icon={AlertCircle} color="text-destructive" help="Atrasos reais pela data." />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* AGENDA 30 DIAS */}
        <Card className="apple-card border-border/40 lg:col-span-2 shadow-xl">
          <CardHeader><CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2"><CalendarDays className="w-4 h-4 text-primary" /> Agenda de Recebimentos (30 dias)</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <TimelineItem label="Atrasados" value={timeline.atrasado} color="bg-destructive" />
            <TimelineItem label="Hoje" value={timeline.hoje} color="bg-emerald-500" />
            <TimelineItem label="Esta Semana" value={timeline.estaSemana} color="bg-primary" />
            <TimelineItem label="15 Dias" value={timeline.proximaQuinzena} color="bg-blue-500" />
            <TimelineItem label="30 Dias" value={timeline.finalMes} color="bg-slate-400" />
            <div className="pt-4 border-t border-dashed mt-6 flex justify-between items-center">
              <span className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Expectativa Total:</span>
              <span className="text-xl font-black">{formatCurrency(timeline.hoje + timeline.estaSemana + timeline.proximaQuinzena + timeline.finalMes)}</span>
            </div>
          </CardContent>
        </Card>

        {/* AUDITORIA */}
        <Card className="apple-card border-border/40 lg:col-span-1">
          <CardHeader><CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2"><History className="w-4 h-4" /> Auditoria</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {logs.map(log => (
              <div key={log.id} className="p-3 rounded-2xl bg-secondary/20 flex justify-between items-center border border-border/10">
                <div className="max-w-[100px]"><p className="text-[10px] font-black truncate uppercase">{clientes.find(c => c.id === log.cliente_id)?.nome || 'Cliente'}</p></div>
                <div className="text-right"><p className="text-xs font-black text-primary">{formatCurrency(safeNumber(log.valor_total))}</p></div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

// --- COMPONENTES AUXILIARES ---

const ReportCard = ({ title, value, icon: Icon, color, help }: any) => (
  <Card className="apple-card border-border/40 overflow-hidden relative shadow-md">
    <CardHeader className="pb-2 flex flex-row items-center justify-between">
      <CardTitle className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.1em]">{title}</CardTitle>
      <HelpInfo text={help} />
    </CardHeader>
    <CardContent className="flex items-center gap-3">
      <div className="p-2 rounded-xl bg-secondary/50"><Icon className={`w-4 h-4 ${color}`} /></div>
      <h3 className="text-2xl font-black tracking-tighter leading-none">{value}</h3>
    </CardContent>
  </Card>
);

const TimelineItem = ({ label, value, color }: any) => (
  <div className="space-y-1.5">
    <div className="flex justify-between text-[9px] font-black uppercase">
      <span className="text-muted-foreground">{label}</span>
      <span>{formatCurrency(value)}</span>
    </div>
    <div className="h-2 w-full bg-secondary/30 rounded-full overflow-hidden">
      <div className={`h-full ${color} transition-all duration-1000`} style={{ width: value > 0 ? '100%' : '0%', opacity: value > 0 ? 1 : 0.2 }} />
    </div>
  </div>
);

const HelpInfo = ({ text }: { text: string }) => (
  <TooltipProvider><Tooltip><TooltipTrigger asChild><button className="outline-none"><Info className="w-3 h-3 text-muted-foreground/30 hover:text-primary transition-colors" /></button></TooltipTrigger><TooltipContent className="bg-popover border-border/40 p-3 rounded-xl text-[10px] max-w-[160px] font-bold shadow-2xl uppercase tracking-tight">{text}</TooltipContent></Tooltip></TooltipProvider>
);

const LoadingState = () => (
  <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
    <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
    <p className="text-[10px] font-black uppercase tracking-[0.3em] animate-pulse text-muted-foreground">Sincronizando Banca...</p>
  </div>
);

export default RelatoriosAvancados;