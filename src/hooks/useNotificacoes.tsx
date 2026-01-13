import { useRef } from 'react';  // ✅ useRef do React
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';  // ✅ React Query separado
import { supabase } from '@/integrations/supabase/client.ts';
import { useAuth } from './useAuth';

export interface Notificacao {
  id: string;
  user_id: string;
  emprestimo_id: string;
  cliente_id: string;
  tipo: string;
  mensagem: string;
  lida: boolean;
  created_at: string;
}

export const useNotificacoes = () => {
  const { user, loading: authLoading } = useAuth();
  const queryClient = useQueryClient();
  const checkedLoansRef = useRef<Set<string>>(new Set());

  // ✅ Query principal: cache 2min para notificações
  const {
    data: notificacoes = [],
    isLoading: loading,
    refetch,
  } = useQuery({
    queryKey: ['notificacoes', user?.id],
    queryFn: async () => {
      if (!user?.id) throw new Error('Não autenticado');

      const { data, error } = await supabase
        .from('notificacoes')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id && !authLoading,
    staleTime: 1000 * 60 * 2,
    gcTime: 1000 * 60 * 10,
    retry: (failureCount, error: any) =>
      failureCount < 1 && ![401, 403].includes(error?.status),
    placeholderData: [],
  });

  // ✅ Mutation: CHECK & ADD
  const checkAndAddNotificacaoMutation = useMutation({
    mutationFn: async (notificacao: Omit<Notificacao, 'id' | 'user_id' | 'created_at' | 'lida'>) => {
      if (!user?.id) throw new Error('Não autenticado');

      const uniqueKey = `${notificacao.emprestimo_id}-${notificacao.tipo}`;

      if (checkedLoansRef.current.has(uniqueKey)) {
        return { data: null, error: null, skipped: true };
      }

      checkedLoansRef.current.add(uniqueKey);

      const { data: existing } = await supabase
        .from('notificacoes')
        .select('id')
        .eq('emprestimo_id', notificacao.emprestimo_id)
        .eq('tipo', notificacao.tipo)
        .eq('lida', false)
        .maybeSingle();

      if (existing) return { data: null, error: null, exists: true };

      const { data, error } = await supabase
        .from('notificacoes')
        .insert({ ...notificacao, user_id: user.id, lida: false })
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notificacoes', user?.id] });
    },
  });

  const checkAndAddNotificacao = (
    notificacao: Omit<Notificacao, 'id' | 'user_id' | 'created_at' | 'lida'>
  ) => {
    return checkAndAddNotificacaoMutation.mutateAsync(notificacao);
  };

  // ✅ Mutation: MARCAR LIDA
  const marcarComoLidaMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('notificacoes')
        .update({ lida: true })
        .eq('id', id);

      if (error) throw error;
      return { error: null };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notificacoes', user?.id] });
    },
  });

  const marcarComoLida = (id: string) => {
    return marcarComoLidaMutation.mutateAsync(id);
  };

  // ✅ Mutation: TODAS LIDAS
  const marcarTodasComoLidasMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error('Não autenticado');

      const { error } = await supabase
        .from('notificacoes')
        .update({ lida: true })
        .eq('user_id', user.id)
        .eq('lida', false);

      if (error) throw error;
      return { error: null };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notificacoes', user?.id] });
    },
  });

  const marcarTodasComoLidas = () => {
    return marcarTodasComoLidasMutation.mutateAsync();
  };

  // ✅ Mutation: DELETE
  const deleteNotificacaoMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('notificacoes').delete().eq('id', id);
      if (error) throw error;
      return { error: null };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notificacoes', user?.id] });
    },
  });

  const deleteNotificacao = (id: string) => {
    return deleteNotificacaoMutation.mutateAsync(id);
  };

  return {
    notificacoes,
    loading: loading || authLoading,
    checkAndAddNotificacao,
    marcarComoLida,
    marcarTodasComoLidas,
    deleteNotificacao,
    getUnreadCount: () => notificacoes.filter((n) => !n.lida).length,
    refetch,
  };
};
