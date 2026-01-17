import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useEmprestimos } from '@/hooks/useEmprestimos';
import { useClientes } from '@/hooks/useClientes';
import { useAuth } from '@/hooks/useAuth';
import { formatCurrency, safeNumber } from '@/utils/calculations';
import { 
  TrendingUp, DollarSign, BarChart3, 
  Calendar, Star, Database, 
  UploadCloud, AlertTriangle, FileSpreadsheet, ShieldCheck,
  ArrowUpRight, Info
} from 'lucide-react';
import { parseISO, format, getMonth, getYear, differenceInDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useTheme } from 'next-themes';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

const RelatoriosAvancados = () => {
  const { theme } = useTheme();
  const { profile, user } = useAuth();
  const { emprestimos, loading } = useEmprestimos();
  const { clientes } = useClientes();
  const [lastBackup, setLastBackup] = useState<string | null>(localStorage.getItem('last_backup_date'));

  const auditTitle = profile?.nome ? `Shark Audit: ${profile.nome}` : "Shark Audit";

  // --- MOTOR DE INTELIGÊNCIA FINANCEIRA (MANTIDO INTACTO) ---
  const businessPillar = useMemo(() => {
    const hoje = new Date();
    const initial = {
      lucroMensal: 0,
      lucroAnual: 0,
      lucroTotal: 0,
      capitalNaRua: 0,
      meses: Array(12).fill(0),
      ranking: {} as Record<string, { nome: string, total: number, qtd: number }>
    };

    if (!emprestimos?.length) return initial;

    return emprestimos.reduce((acc, emp) => {
      const valorPago = safeNumber(emp.valor_pago);
      const dataRef = emp.updated_at ? parseISO(emp.updated_at) : parseISO(emp.created_at);
      const status = String(emp.status).toLowerCase();

      acc.lucroTotal += valorPago;

      if (getYear(dataRef) === getYear(hoje)) {
        acc.lucroAnual += valorPago;
        acc.meses[getMonth(dataRef)] += valorPago;
        if (getMonth(dataRef) === getMonth(hoje)) acc.lucroMensal += valorPago;
      }

      if (status !== 'pago' && status !== 'quitado') {
        acc.capitalNaRua += safeNumber(emp.valor);
      }

      if (valorPago > 0) {
        const cId = emp.cliente_id;
        if (!acc.ranking[cId]) {
          acc.ranking[cId] = { nome: clientes.find(c => c.id === cId)?.nome || 'Cliente', total: 0, qtd: 0 };
        }
        acc.ranking[cId].total += valorPago;
        acc.ranking[cId].qtd += 1;
      }

      return acc;
    }, initial);
  }, [emprestimos, clientes]);

  const handleExportBackup = () => {
    const backupData = {
      version: "1.1",
      timestamp: new Date().toISOString(),
      user: user?.email,
      data: { emprestimos, clientes }
    };
    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `shark_vault_${format(new Date(), 'ddMMyy')}.json`;
    link.click();
    localStorage.setItem('last_backup_date', new Date().toISOString());
    setLastBackup(new Date().toISOString());
    toast.success('Backup realizado e salvo no Vault');
  };

  const handleImportBackup = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const content = JSON.parse(e.target?.result as string);
        const dataToImport = content.data?.emprestimos || content.emprestimos;
        if (!Array.isArray(dataToImport)) throw new Error("Formato inválido");
        toast.loading("Restaurando banca...");
        for (const emp of dataToImport) {
          const { id, created_at, updated_at, ...rest } = emp;
          await supabase.from('emprestimos').upsert({
            ...rest,
            user_id: user?.id,
            updated_at: new Date().toISOString()
          });
        }
        toast.success("Dados restaurados com sucesso!");
        setTimeout(() => window.location.reload(), 1500);
      } catch (err) {
        toast.error("Erro ao importar arquivo JSON.");
      }
    };
    reader.readAsText(file);
  };

  const exportToCSV = () => {
    const headers = "Cliente,Capital,Lucro Recebido,Status,Vencimento\n";
    const rows = (emprestimos || []).map(e => {
      const cliente = clientes.find(c => c.id === e.cliente_id)?.nome || "N/A";
      return `${cliente},${e.valor},${e.valor_pago},${e.status},${e.data_vencimento}`;
    }).join("\n");
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `shark_excel_${format(new Date(), 'dd_MM')}.csv`;
    a.click();
    toast.success("Relatório Excel gerado");
  };

  const backupAntigo = lastBackup ? differenceInDays(new Date(), new Date(lastBackup)) > 7 : true;

  if (loading) return <LoadingState />;

  return (
    <div className="min-h-screen pt-safe pb-safe px-4 sm:px-6 md:px-10 space-y-6 md:space-y-8 max-w-7xl mx-auto animate-fade-in relative pb-32">
      
      {/* Background Decorativo */}
      <div className="fixed inset-0 z-[-1] pointer-events-none overflow-hidden">
        <div className="absolute top-0 right-0 w-[280px] md:w-[500px] h-[280px] md:h-[500px] bg-primary/5 rounded-full blur-[80px] md:blur-[120px] animate-login-blob" />
      </div>

      {/* Banner de Segurança */}
      {backupAntigo && (
        <Card className="bg-destructive/10 border-destructive/20 rounded-[2rem] p-5 md:p-6 flex flex-col md:flex-row items-center justify-between gap-5 animate-in slide-in-from-top-4 shadow-2xl shadow-destructive/5">
          <div className="flex items-center gap-4 w-full md:w-auto">
            <div className="w-12 h-12 rounded-2xl bg-destructive/20 flex items-center justify-center text-destructive shrink-0">
                <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-base font-black tracking-tight text-destructive leading-tight">Segurança Comprometida</h4>
              <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-widest">
                Último backup: {lastBackup ? format(parseISO(lastBackup), 'dd/MM/yy') : 'Pendente'}
              </p>
            </div>
          </div>
          <Button onClick={handleExportBackup} className="w-full md:w-auto bg-destructive text-white px-8 h-12 md:h-14 rounded-xl md:rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all active:scale-95 shadow-lg shadow-destructive/20">
            Sincronizar Vault
          </Button>
        </Card>
      )}

      <header className="pt-6 md:pt-8 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div className="space-y-1 md:space-y-2">
          <div className="flex items-center gap-2 text-primary/60">
            <ShieldCheck className="w-3.5 h-3.5" />
            <p className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.3em]">Intelligence & Security</p>
          </div>
          <h1 className="text-2xl sm:text-3xl md:text-5xl font-black tracking-tighter text-foreground leading-none">
            {auditTitle}
          </h1>
        </div>
        
        <div className="flex gap-2 w-full md:w-auto">
          <Button onClick={handleExportBackup} variant="outline" className="flex-1 md:flex-none h-12 md:h-14 rounded-xl md:rounded-2xl border-white/5 bg-card/40 backdrop-blur-md text-[9px] md:text-[10px] font-black uppercase tracking-widest">
            <Database className="w-4 h-4 mr-2 text-primary" /> Exportar
          </Button>
          <Label htmlFor="import-json" className="flex-1 md:flex-none flex items-center justify-center px-4 md:px-6 h-12 md:h-14 rounded-xl md:rounded-2xl bg-secondary/50 cursor-pointer text-[9px] md:text-[10px] font-black uppercase tracking-widest border border-white/5 hover:bg-secondary/80 transition-all">
            <UploadCloud className="w-4 h-4 mr-2" /> Importar
            <input type="file" accept=".json" onChange={handleImportBackup} className="hidden" id="import-json" />
          </Label>
        </div>
      </header>

      {/* Bento Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <MetricBlock title="Lucro Mensal" value={businessPillar.lucroMensal} icon={Calendar} variant="primary" />
        <MetricBlock title="Lucro Anual" value={businessPillar.lucroAnual} icon={TrendingUp} variant="success" />
        <MetricBlock title="Capital Rua" value={businessPillar.capitalNaRua} icon={DollarSign} variant="info" />
        
        <Button onClick={exportToCSV} className="h-full bg-card/40 backdrop-blur-md border border-white/5 hover:border-emerald-500/50 rounded-[1.8rem] md:rounded-[2rem] flex flex-col items-center justify-center p-6 md:p-8 gap-3 transition-all group min-h-[140px] md:min-h-[160px]">
           <FileSpreadsheet className="w-7 h-7 md:w-8 md:h-8 text-emerald-500 group-hover:scale-110 transition-transform duration-500" />
           <span className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground group-hover:text-emerald-500 transition-colors text-center">Gerar Excel</span>
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        {/* Gráfico Mensal */}
        <Card className="lg:col-span-2 glass-card rounded-[2rem] md:rounded-[2.5rem] shadow-2xl overflow-hidden border-white/5">
          <CardHeader className="pb-0 px-6 md:px-8 pt-6 md:pt-8">
            <div className="flex justify-between items-center">
                <CardTitle className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-primary" /> Performance Mensal
                </CardTitle>
                <div className="flex items-center gap-1 text-[9px] font-bold text-emerald-500">
                    <ArrowUpRight className="w-3 h-3" /> Alta
                </div>
            </div>
          </CardHeader>
          <CardContent className="h-60 md:h-64 flex items-end justify-between gap-1.5 md:gap-3 px-6 md:px-8 pb-8 pt-10">
            {businessPillar.meses.map((valor, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-2 group h-full justify-end">
                <div 
                  className="w-full bg-primary/10 rounded-lg transition-all duration-700 group-hover:bg-primary/50 relative"
                  style={{ height: `${valor > 0 ? (valor / (Math.max(...businessPillar.meses) || 1)) * 100 : 4}%` }}
                >
                    {valor > 0 && (
                        <div className="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-primary text-black text-[8px] font-black px-1.5 py-0.5 rounded-md z-10 whitespace-nowrap">
                            {formatCurrency(valor)}
                        </div>
                    )}
                </div>
                <span className="text-[8px] md:text-[9px] font-black text-muted-foreground uppercase tracking-tight group-hover:text-foreground transition-colors">
                    {format(new Date(2026, i, 1), 'MMM', { locale: ptBR }).replace('.', '')}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Ranking VIP */}
        <Card className="glass-card rounded-[2rem] border-white/5 shadow-2xl flex flex-col">
          <CardHeader className="p-6 md:p-8 pb-4">
            <CardTitle className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
              <Star className="w-4 h-4 text-amber-500" /> High-Profit
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 px-6 md:px-8 pb-6 md:pb-8 flex-1 overflow-y-auto max-h-[350px] lg:max-h-none">
            {Object.values(businessPillar.ranking).sort((a,b) => b.total - a.total).slice(0, 5).map((c, i) => (
              <div key={i} className="p-3 md:p-4 rounded-xl md:rounded-2xl bg-white/5 border border-white/5 flex justify-between items-center group hover:bg-white/10 transition-all">
                <div className="flex items-center gap-3 min-w-0">
                    <div className="w-7 h-7 md:w-8 md:h-8 shrink-0 rounded-full bg-secondary flex items-center justify-center text-[9px] md:text-[10px] font-black">#{i+1}</div>
                    <div className="min-w-0">
                        <p className="text-xs font-black text-foreground truncate">{c.nome}</p>
                        <p className="text-[8px] md:text-[9px] font-bold text-muted-foreground uppercase tracking-widest">{c.qtd} contratos</p>
                    </div>
                </div>
                <p className="text-xs md:text-sm font-black text-emerald-500 ml-2 whitespace-nowrap">{formatCurrency(c.total)}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Patrimônio Acumulado */}
      <div className="balance-card group border-primary/20 p-8 md:p-12 rounded-[2.5rem] md:rounded-[3.5rem] text-center flex flex-col items-center justify-center shadow-[0_0_60px_rgba(var(--primary),0.05)]">
        <div className="w-14 h-14 md:w-20 md:h-20 rounded-2xl md:rounded-3xl bg-primary/10 flex items-center justify-center text-primary mb-6 animate-float">
            <ShieldCheck className="w-8 h-8 md:w-12 md:h-12" />
        </div>
        <p className="text-[9px] md:text-[12px] font-black uppercase tracking-[0.4em] md:tracking-[0.8em] text-primary/60 mb-2">Lucro Total Acumulado</p>
        <h2 className="text-4xl md:text-8xl font-black tracking-tighter text-foreground leading-none">
          {formatCurrency(businessPillar.lucroTotal)}
        </h2>
        <div className="mt-8 flex items-center gap-2 text-[8px] md:text-[10px] font-bold text-muted-foreground uppercase tracking-widest text-center px-4">
            <Info className="w-3 h-3 shrink-0" /> Auditoria baseada em dados reais da banca
        </div>
      </div>
    </div>
  );
};

// --- COMPONENTES AUXILIARES ---

const MetricBlock = ({ title, value, icon: Icon, variant }: any) => {
    const styles = {
        primary: "text-primary bg-primary/10 border-primary/10",
        success: "text-emerald-500 bg-emerald-500/10 border-emerald-500/10",
        info: "text-blue-400 bg-blue-400/10 border-blue-400/10",
    };

    return (
        <Card className="glass-card border-white/5 rounded-[1.8rem] md:rounded-[2.2rem] p-5 md:p-7 shadow-2xl relative overflow-hidden flex flex-col justify-between group min-h-[140px] md:min-h-[160px]">
            <div className={`w-10 h-10 md:w-12 md:h-12 rounded-xl flex items-center justify-center transition-transform duration-500 group-hover:scale-110 shrink-0 ${styles[variant as keyof typeof styles]}`}>
                {/* CORREÇÃO DO CONFLITO: Adicionado prefixo md: no h-6 */}
                <Icon className="w-5 h-5 md:w-6 md:h-6" />
            </div>
            <div className="space-y-1 mt-4">
                <p className="text-[8px] md:text-[9px] font-black text-muted-foreground uppercase tracking-[0.1em]">{title}</p>
                <h3 className="text-xl md:text-2xl font-black text-foreground tracking-tighter leading-none truncate">{formatCurrency(value)}</h3>
            </div>
            <div className="absolute top-0 right-0 w-20 h-20 bg-white/5 rounded-full blur-3xl -mr-10 -mt-10 group-hover:bg-primary/5 transition-all" />
        </Card>
    );
};

const LoadingState = () => (
  <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-6">
    <div className="relative">
        <div className="w-16 h-16 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
        <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-8 h-8 bg-primary/20 rounded-full animate-pulse" />
        </div>
    </div>
    <p className="text-[10px] font-black uppercase tracking-[0.5em] text-primary animate-pulse text-center">Iniciando Auditoria Shark...</p>
  </div>
);

export default RelatoriosAvancados;