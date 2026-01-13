import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client.ts';
import { useAuth } from './useAuth';
import { addDays, parseISO, isValid } from 'date-fns';
import { toast } from 'sonner';
import { safeNumber } from '@/utils/calculations';
import { saveOfflineEmprestimo } from '@/utils/offlinePersistence';

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

  // ✅ Query principal: cache 5min para empréstimos
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
    staleTime: 1000 * 60 * 5,    // 5min fresco
    gcTime: 1000 * 60 * 15,     // 15min em memória
    retry: (failureCount, error: any) =>
      failureCount < 2 && ![401, 403].includes(error?.status),
    placeholderData: [],         // Sem flash vazio
  });

  // ✅ Mutation: ADD com offline
  const addEmprestimoMutation = useMutation({
    mutationFn: async (dados: any) => {
      if (!navigator.onLine) {
        await saveOfflineEmprestimo({ ...dados, user_id: user?.id });

        if ('serviceWorker' in navigator && 'SyncManager' in window) {
          const registration = await navigator.serviceWorker.ready;
          // @ts-ignore
          await registration.sync.register('sync-emprestimos');
        }

        toast.warning('Modo Offline Ativado', {
          description: 'O empréstimo será enviado quando houver sinal.',
          duration: 5000,
        });

        return { data: null, error: null, offline: true };
      }

      if (!user?.id) throw new Error('Não autenticado');
      const { data, error } = await supabase
        .from('emprestimos')
        .insert({ ...dados, user_id: user.id })
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    },
    onSuccess: (_, variables) => {
      if (!variables.offline) {
        queryClient.invalidateQueries({ queryKey: ['emprestimos', user?.id] });
      }
    },
  });

  const addEmprestimo = (dados: any) => {
    return addEmprestimoMutation.mutateAsync(dados);
  };

  // ✅ Mutation: RENOVAR
  const renovarEmprestimoMutation = useMutation({
    mutationFn: async (id: string) => {
      const emp = emprestimos.find((e) => e.id === id);
      if (!emp) throw new Error('Contrato não encontrado');

      const juroDoMes = safeNumber(emp.juros);
      const novoValorPago = safeNumber(emp.valor_pago) + juroDoMes;
      const novoValorTotal = safeNumber(emp.valor_total) + juroDoMes;

      const dataBase = emp.data_vencimento ? parseISO(emp.data_vencimento) : new Date();
      const novaData = addDays(isValid(dataBase) ? dataBase : new Date(), 30).toISOString();

      const { error } = await supabase
        .from('emprestimos')
        .update({
          data_vencimento: novaData,
          valor_pago: novoValorPago,
          valor_total: novoValorTotal,
          updated_at: new Date().toISOString(),
          status: 'ativo',
        })
        .eq('id', id);

      if (error) throw error;

      toast.success(`Juro de R$ ${juroDoMes.toFixed(2)} recebido!`);
      return { error: null };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['emprestimos', user?.id] });
    },
  });

  const renovarEmprestimo = (id: string) => {
    return renovarEmprestimoMutation.mutateAsync(id);
  };

  // ✅ Mutation: UPDATE
  const updateEmprestimoMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: any }) => {
      const { error } = await supabase.from('emprestimos').update(updates).eq('id', id);
      if (error) throw error;
      return { error: null };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['emprestimos', user?.id] });
    },
  });

  const updateEmprestimo = (id: string, updates: any) => {
    return updateEmprestimoMutation.mutateAsync({ id, updates });
  };

  // ✅ Mutation: DELETE
  const deleteEmprestimoMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('emprestimos').delete().eq('id', id);
      if (error) throw error;
      return { error: null };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['emprestimos', user?.id] });
    },
  });

  const deleteEmprestimo = (id: string) => {
    return deleteEmprestimoMutation.mutateAsync(id);
  };

  // ✅ Mutation: MARCAR PAGO
  const marcarComoPagoMutation = useMutation({
    mutationFn: async ({ id, valorTotal }: { id: string; valorTotal: number }) => {
      const { error } = await supabase
        .from('emprestimos')
        .update({
          status: 'pago',
          valor_pago: valorTotal,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (error) throw error;
      return { error: null };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['emprestimos', user?.id] });
    },
  });

  const marcarComoPago = (id: string, valorTotal: number) => {
    return marcarComoPagoMutation.mutateAsync({ id, valorTotal });
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
