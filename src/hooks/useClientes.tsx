import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client.ts';
import { useAuth } from './useAuth';

export interface Cliente {
  id: string;
  user_id: string;
  nome: string;
  telefone: string | null;
  email: string | null;
  created_at: string;
}

export const useClientes = () => {
  const { user, loading: authLoading } = useAuth();
  const queryClient = useQueryClient();

  // ✅ Query principal: cache 5min, reutiliza entre telas
  const {
    data: clientes = [],
    isLoading: loading,
    refetch,
  } = useQuery({
    queryKey: ['clientes', user?.id],
    queryFn: async () => {
      if (!user?.id) throw new Error('Não autenticado');

      const { data, error } = await supabase
        .from('clientes')
        .select('*')
        .eq('user_id', user.id)
        .order('nome', { ascending: true });

      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id && !authLoading,
    staleTime: 1000 * 60 * 5,    // 5min fresco ✅
    gcTime: 1000 * 60 * 15,     // 15min em memória ✅
    retry: (failureCount, error: any) =>
      failureCount < 2 && ![401, 403].includes(error?.status),
    placeholderData: [],         // Sem flash vazio ✅
  });

  // ✅ Mutation: adiciona e atualiza lista automaticamente
  const addClienteMutation = useMutation({
    mutationFn: async (cliente: Omit<Cliente, 'id' | 'created_at'>) => {
      if (!user?.id) throw new Error('Não autenticado');

      const { data, error } = await supabase
        .from('clientes')
        .insert({ ...cliente, user_id: user.id })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clientes', user?.id] });
    },
  });

  const addCliente = (cliente: any) => {
    return addClienteMutation.mutateAsync(cliente);
  };

  return {
    clientes,
    loading: loading || authLoading || addClienteMutation.isPending,
    addCliente,
    refetch,
  };
};
