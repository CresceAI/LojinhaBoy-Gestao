import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { isSameDay, parseISO } from 'date-fns';
import { BellRing, ArrowRight, Wallet } from 'lucide-react';
import { formatCurrency, safeNumber } from '@/utils/calculations';

interface AlertaProps {
  emprestimos: any[];
  nomeUsuario: string;
}

const AlertaRecebiveis = ({ emprestimos, nomeUsuario }: AlertaProps) => {
  const navigate = useNavigate();

  const resumoHoje = useMemo(() => {
    const hoje = new Date();
    
    // Filtra localmente sem ir no banco de dados
    const paraReceberHoje = emprestimos.filter(emp => {
      const isAberto = String(emp.status) !== 'pago' && String(emp.status) !== 'quitado';
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
    <div className="relative group px-2 animate-in slide-in-from-top-4 duration-500">
      {/* Glow de fundo sutil */}
      <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 to-emerald-500/20 rounded-[2rem] blur opacity-25 group-hover:opacity-50 transition duration-1000"></div>
      
      <div className="relative bg-card/60 border border-primary/20 backdrop-blur-xl p-5 rounded-[2rem] flex items-center justify-between shadow-xl">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-inner">
            <BellRing className="w-6 h-6 animate-tada" />
          </div>
          <div>
            <h4 className="text-sm font-black text-white leading-none">
              Bom dia, {nomeUsuario.split(' ')[0]}!
            </h4>
            <p className="text-[11px] text-muted-foreground mt-1 font-medium">
              Você tem <span className="text-primary font-bold">{formatCurrency(resumoHoje.valor)}</span> para receber de <span className="text-white font-bold">{resumoHoje.qtd}</span> {resumoHoje.qtd === 1 ? 'cliente' : 'clientes'} hoje.
            </p>
          </div>
        </div>

        <button 
          onClick={() => navigate('/cobranca')}
          className="h-10 px-4 bg-primary text-black rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:scale-105 active:scale-95 transition-all shadow-lg shadow-primary/20"
        >
          Cobrar <ArrowRight className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
};

export default AlertaRecebiveis;