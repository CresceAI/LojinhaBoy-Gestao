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
  UploadCloud, AlertTriangle, FileSpreadsheet, ShieldCheck
} from 'lucide-react';
import { parseISO, format, getMonth, getYear, differenceInDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useTheme } from 'next-themes';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

// Ícones Shark
import sharkDark from '@/components/icons/shark-dark.png';
import sharkLight from '@/components/icons/shark-light.png';

const RelatoriosAvancados = () => {
  const { theme } = useTheme();
  const { profile, user } = useAuth();
  const { emprestimos, loading } = useEmprestimos();
  const { clientes } = useClientes();
  const [lastBackup, setLastBackup] = useState<string | null>(localStorage.getItem('last_backup_date'));

  const sharkImg = theme === 'dark' ? sharkLight : sharkDark;
  
  // ✅ AJUSTADO: Nome no padrão normal (Ex: Renato Filho) e sem itálico
  const auditTitle = profile?.nome ? `SHARK AUDIT: ${profile.nome}` : "SHARK AUDIT";

  // 🛡️ MOTOR DE INTELIGÊNCIA HISTÓRICA E SEGURANÇA
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

  // 💾 EXPORTAR BACKUP
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
    link.download = `shark_vault_${format(new Date(), 'ddMMyy')}.json`;
    link.click();
    localStorage.setItem('last_backup_date', new Date().toISOString());
    setLastBackup(new Date().toISOString());
    toast.success('Backup realizado com sucesso!');
  };

  // 📥 IMPORTAR BACKUP
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

  // 📊 EXPORTAR EXCEL
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
    toast.success("Excel gerado com sucesso!");
  };

  const backupAntigo = lastBackup ? differenceInDays(new Date(), new Date(lastBackup)) > 7 : true;

  if (loading) return <div className="p-20 text-center animate-pulse font-black text-primary uppercase text-[10px] tracking-widest">Sincronizando Auditoria...</div>;

  return (
    <div className="space-y-8 pb-32 max-w-6xl mx-auto px-4 relative min-h-screen">
      
      {/* 🔮 BACKGROUND INTEGRADO COM BANNER LOGIN */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden opacity-40">
        <div 
          className="absolute inset-0 bg-no-repeat bg-cover bg-fixed opacity-[0.08] dark:opacity-[0.05]"
          style={{ backgroundImage: "url('/banner-login.svg')", backgroundPosition: 'center' }}
        />
        <div className={`absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-[600px] h-[600px] rounded-full blur-[120px] ${theme === 'dark' ? 'bg-primary/10' : 'bg-primary/5'}`} />
      </div>

      <div className="relative z-10 space-y-8">
        
        {/* BANNER DE ALERTA DE SEGURANÇA */}
        {backupAntigo && (
          <Card className="bg-destructive/10 border-destructive/20 p-5 rounded-[2rem] flex flex-col md:flex-row items-center justify-between gap-4 animate-in slide-in-from-top-4">
            <div className="flex items-center gap-4">
              <AlertTriangle className="text-destructive w-8 h-8" />
              <div>
                <h4 className="text-sm font-black text-destructive uppercase tracking-widest leading-none">Sua banca está em risco!</h4>
                <p className="text-[10px] text-muted-foreground font-bold uppercase mt-1">Último backup: {lastBackup ? format(parseISO(lastBackup), 'dd/MM/yyyy') : 'Nunca realizado'}</p>
              </div>
            </div>
            <Button onClick={handleExportBackup} className="bg-destructive text-white hover:bg-destructive/90 rounded-2xl px-8 h-12 font-black text-[10px] uppercase">Fazer Backup Agora</Button>
          </Card>
        )}

        <header className="pt-6 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <img src={sharkImg} className="w-6 h-6 object-contain" alt="Shark" />
              <p className="text-[10px] font-black uppercase tracking-[0.4em] text-primary">Intelligence & Security</p>
            </div>
            {/* ✅ REMOVIDO 'italic' e mantido padrão normal de caixa */}
            <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-foreground leading-none uppercase">
              {auditTitle}
            </h1>
          </div>
          
          <div className="flex gap-2 w-full md:w-auto">
            <Button onClick={handleExportBackup} variant="outline" className="flex-1 md:flex-none h-12 rounded-2xl border-primary/20 bg-card text-foreground text-[10px] font-black uppercase shadow-sm">
              <Database className="w-4 h-4 mr-2 text-primary" /> Backup JSON
            </Button>
            <Label htmlFor="import-json" className="flex-1 md:flex-none flex items-center justify-center px-4 h-12 rounded-2xl bg-secondary text-foreground cursor-pointer text-[10px] font-black uppercase border border-border/40">
              <UploadCloud className="w-4 h-4 mr-2" /> Inserir JSON
              <input type="file" accept=".json" onChange={handleImportBackup} className="hidden" id="import-json" />
            </Label>
          </div>
        </header>

        {/* MÉTRICAS EM BENTO GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard title="Lucro Mensal" value={businessPillar.lucroMensal} icon={Calendar} color="text-primary" />
          <MetricCard title="Lucro Anual" value={businessPillar.lucroAnual} icon={TrendingUp} color="text-emerald-500" />
          <MetricCard title="Capital na Rua" value={businessPillar.capitalNaRua} icon={DollarSign} color="text-blue-500" />
          <Button onClick={exportToCSV} className="h-full bg-card border border-border/40 hover:border-emerald-500/50 rounded-[2rem] flex flex-col items-center justify-center p-6 gap-2 transition-all group">
             <FileSpreadsheet className="w-8 h-8 text-emerald-500 group-hover:scale-110 transition-transform" />
             <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Baixar Excel</span>
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* GRÁFICO DE CRESCIMENTO */}
          <Card className="lg:col-span-2 bg-card border-border/40 rounded-[2.5rem] shadow-xl overflow-hidden">
            <CardHeader className="pb-0">
              <CardTitle className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-primary" /> Desempenho Mensal {new Date().getFullYear()}
              </CardTitle>
            </CardHeader>
            <CardContent className="h-64 flex items-end justify-between gap-2 px-8 pb-10 pt-10">
              {businessPillar.meses.map((valor, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-2 group">
                  <div 
                    className="w-full bg-primary/20 rounded-t-lg transition-all group-hover:bg-primary/60 min-h-[4px]"
                    style={{ height: `${valor > 0 ? (valor / (businessPillar.lucroAnual || 1)) * 100 : 2}%` }}
                  />
                  <span className="text-[8px] font-bold text-muted-foreground uppercase">{format(new Date(2026, i, 1), 'MMM', { locale: ptBR })}</span>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* TOP CLIENTES */}
          <Card className="bg-card border-border/40 rounded-[2.5rem] shadow-xl">
            <CardHeader>
              <CardTitle className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                <Star className="w-4 h-4 text-amber-500" /> Clientes VIP (Lucro)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {Object.values(businessPillar.ranking).sort((a,b) => b.total - a.total).slice(0, 5).map((c, i) => (
                <div key={i} className="p-4 rounded-2xl bg-secondary/20 border border-border/10 flex justify-between items-center group hover:bg-secondary/40 transition-all">
                  <div>
                    <p className="text-[10px] font-black uppercase text-foreground">{c.nome}</p>
                    <p className="text-[8px] font-bold text-muted-foreground uppercase">{c.qtd} Operações</p>
                  </div>
                  <p className="text-xs font-black text-emerald-500">{formatCurrency(c.total)}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* LUCRO TOTAL HISTÓRICO */}
        <div className="bg-primary/10 border border-primary/20 p-8 rounded-[2.5rem] flex flex-col items-center text-center">
          <ShieldCheck className="w-10 h-10 text-primary mb-3" />
          <p className="text-[10px] font-black uppercase tracking-[0.6em] text-primary">Lucro Total Acumulado sob Gestão</p>
          {/* ✅ REMOVIDO 'italic' conforme pedido */}
          <h2 className="text-6xl font-black tracking-tighter text-foreground mt-2 uppercase">
            {formatCurrency(businessPillar.lucroTotal)}
          </h2>
        </div>
      </div>
    </div>
  );
};

// --- COMPONENTE AUXILIAR ---
const MetricCard = ({ title, value, icon: Icon, color }: any) => (
  <Card className="bg-card border-border/40 rounded-[2rem] p-6 shadow-xl relative overflow-hidden">
    <div className={`p-3 rounded-2xl bg-secondary/50 w-fit mb-4 ${color}`}>
      <Icon className="w-6 h-6" />
    </div>
    <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">{title}</p>
    <h3 className="text-2xl font-black text-foreground tracking-tighter mt-1">{formatCurrency(value)}</h3>
    <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full blur-2xl -mr-12 -mt-12 opacity-50" />
  </Card>
);

export default RelatoriosAvancados;