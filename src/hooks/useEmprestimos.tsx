import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client.ts';
import { useAuth } from './useAuth';
import { addDays, parseISO, isValid } from 'date-fns';
import { toast } from 'sonner';
import { safeNumber } from '@/utils/calculations';
import { saveOfflineAction } from '@/utils/offlinePersistence'; // ✅ Atualizado para a lógica de Ações

export interface Emprestimo {
  id: string;
  user_id: string;
  cliente_id: string;
  valor: number;
  juros: number;
  valor_total: number;
  valor_pago: number;
  data_inicio: string;
  data_vencimento: string;
  forma_pagamento: string;
  numero_parcelas: number | null;
  status: string;
  created_at: string;
  updated_at?: string;
}

export const useEmprestimos = () => {
  const { user, loading: authLoading } = useAuth();
  const queryClient = useQueryClient();

  // ✅ Query principal: Cache inteligente
  const {
    data: emprestimos = [],
    isLoading: loading,
    refetch,
  } = useQuery({
    queryKey: ['emprestimos', user?.id],
    queryFn: async () => {
      if (!user?.id) throw new Error('Não autenticado');
      const { data, error } = await supabase
        .from('emprestimos')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id && !authLoading,
    staleTime: 1000 * 60 * 5,
  });

  /**
   * 🦈 MUTATION: ADD (CRIAR)
   */
  const addEmprestimoMutation = useMutation({
    mutationFn: async (dados: any) => {
      if (!navigator.onLine) {
        await saveOfflineAction('CREATE', 'emprestimos', { ...dados, user_id: user?.id });
        return { offline: true };
      }

      if (!user?.id) throw new Error('Não autenticado');
      const { data, error } = await supabase
        .from('emprestimos')
        .insert({ ...dados, user_id: user.id })
        .select().single();

      if (error) throw error;
      return { data, offline: false };
    },
    onSuccess: (res) => {
      if (res?.offline) {
        toast.warning('Operação offline registrada na banca.');
      } else {
        queryClient.invalidateQueries({ queryKey: ['emprestimos', user?.id] });
        toast.success('Novo empréstimo registrado!');
      }
    },
  });

  /**
   * 🦈 MUTATION: UPDATE (EDITAR)
   * Resolve o problema de mapeamento camelCase -> snake_case
   */
  const updateEmprestimoMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: any }) => {
      if (!navigator.onLine) {
        await saveOfflineAction('UPDATE', 'emprestimos', updates, id);
        return { offline: true };
      }

      const { error } = await supabase.from('emprestimos').update(updates).eq('id', id);
      if (error) throw error;
      return { offline: false };
    },
    onSuccess: (res) => {
      if (res?.offline) {
        toast.info('Alterações salvas localmente para sincronia.');
      } else {
        queryClient.invalidateQueries({ queryKey: ['emprestimos', user?.id] });
        toast.success('Contrato atualizado com sucesso!');
      }
    },
  });

  /**
   * 🦈 MUTATION: DELETE (EXCLUIR)
   */
  const deleteEmprestimoMutation = useMutation({
    mutationFn: async (id: string) => {
      if (!navigator.onLine) {
        await saveOfflineAction('DELETE', 'emprestimos', null, id);
        return { offline: true };
      }
      const { error } = await supabase.from('emprestimos').delete().eq('id', id);
      if (error) throw error;
      return { offline: false };
    },
    onSuccess: (res) => {
      if (res?.offline) {
        toast.error('Exclusão agendada para quando houver sinal.');
      } else {
        queryClient.invalidateQueries({ queryKey: ['emprestimos', user?.id] });
        toast.success('Registro removido da banca.');
      }
    },
  });

  // --- FUNÇÕES DE ABSTRAÇÃO (Semânticas) ---

  const addEmprestimo = (dados: any) => addEmprestimoMutation.mutateAsync(dados);
  
  const updateEmprestimo = (id: string, updates: any) => 
    updateEmprestimoMutation.mutateAsync({ id, updates });

  const deleteEmprestimo = (id: string) => 
    deleteEmprestimoMutation.mutateAsync(id);

  const renovarEmprestimo = async (id: string) => {
    const emp = emprestimos.find((e) => e.id === id);
    if (!emp) return;

    const juroDoMes = safeNumber(emp.juros);
    const dataBase = emp.data_vencimento ? parseISO(emp.data_vencimento) : new Date();
    const novaData = addDays(isValid(dataBase) ? dataBase : new Date(), 30).toISOString();

    const updates = {
      data_vencimento: novaData,
      valor_pago: safeNumber(emp.valor_pago) + juroDoMes,
      valor_total: safeNumber(emp.valor_total) + juroDoMes,
      updated_at: new Date().toISOString(),
      status: 'ativo',
    };

    return updateEmprestimo(id, updates);
  };

  const marcarComoPago = (id: string, valorTotal: number) => {
    return updateEmprestimo(id, {
      status: 'pago',
      valor_pago: valorTotal,
      updated_at: new Date().toISOString(),
    });
  };

  return {
    emprestimos,
    loading: loading || authLoading,
    addEmprestimo,
    updateEmprestimo,
    deleteEmprestimo,
    marcarComoPago,
    renovarEmprestimo,
    refetch,
  };
};