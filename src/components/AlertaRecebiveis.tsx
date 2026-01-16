import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { isSameDay, parseISO } from 'date-fns';
import { BellRing, ArrowRight, Target, TrendingUp } from 'lucide-react';
import { formatCurrency, safeNumber } from '@/utils/calculations';
import { cn } from '@/lib/utils';

interface AlertaProps {
  emprestimos: any[];
  nomeUsuario: string;
}

const AlertaRecebiveis = ({ emprestimos, nomeUsuario }: AlertaProps) => {
  const navigate = useNavigate();

  // --- LÓGICA DE NEGÓCIO INTACTA ---
  const resumoHoje = useMemo(() => {
    const hoje = new Date();
    
    const paraReceberHoje = (emprestimos || []).filter(emp => {
      const isAberto = String(emp.status).toLowerCase() !== 'pago' && String(emp.status).toLowerCase() !== 'quitado';
      const venceHoje = emp.data_vencimento && isSameDay(parseISO(emp.data_vencimento), hoje);
      return isAberto && venceHoje;
    });

    const total = paraReceberHoje.reduce((acc, emp) => 
      acc + (safeNumber(emp.valor_total) - safeNumber(emp.valor_pago)), 0
    );

    return {
      valor: total,
      qtd: paraReceberHoje.length
    };
  }, [emprestimos]);

  if (resumoHoje.qtd === 0) return null;

  return (
    <div className="relative group px-2 mb-8 animate-in slide-in-from-top-6 duration-700">
      {/* Liquid Glow de Fundo - Efeito de profundidade premium */}
      <div className="absolute -inset-1 bg-gradient-to-r from-primary/30 via-primary/5 to-emerald-500/30 rounded-[2.5rem] blur-xl opacity-20 group-hover:opacity-40 transition duration-1000"></div>
      
      <div className="relative glass-card border-primary/20 bg-card/40 backdrop-blur-2xl p-6 rounded-[2.5rem] flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl overflow-hidden border-t-2 border-t-primary/30">
        
        {/* Elemento Decorativo Interno */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />

        <div className="flex items-center gap-5 relative z-10">
          {/* Ícone com Animação Tada do seu Config */}
          <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-[inset_0_0_20px_rgba(var(--primary),0.1)] border border-primary/20 shrink-0">
            <BellRing className="w-7 h-7 animate-tada" />
          </div>
          
          <div className="space-y-1">
            <div className="flex items-center gap-2">
                <Target size={12} className="text-primary animate-pulse" />
                <h4 className="text-base font-black tracking-tight text-white leading-none">
                  Bom dia, Shark {nomeUsuario.split(' ')[0]}
                </h4>
            </div>
            <p className="text-sm text-muted-foreground font-medium leading-relaxed">
              O radar detectou <span className="text-white font-black">{formatCurrency(resumoHoje.valor)}</span> aguardando liquidação de <span className="text-primary font-black">{resumoHoje.qtd}</span> {resumoHoje.qtd === 1 ? 'alvo' : 'alvos'} hoje.
            </p>
          </div>
        </div>

        <button 
          onClick={() => navigate('/cobranca')}
          className="w-full md:w-auto h-14 px-8 bg-primary text-black rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-3 hover:scale-[1.03] active:scale-95 transition-all shadow-xl shadow-primary/20 group/btn relative z-10"
        >
          Iniciar Ataque <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
        </button>
      </div>
    </div>
  );
};

export default AlertaRecebiveis;