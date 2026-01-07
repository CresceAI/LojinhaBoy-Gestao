import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

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
}

export const useEmprestimos = () => {
  const { user } = useAuth();
  const [emprestimos, setEmprestimos] = useState<Emprestimo[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchEmprestimos = useCallback(async () => {
    if (!user) {
      setEmprestimos([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const { data, error } = await supabase
      .from('emprestimos')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setEmprestimos(data);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchEmprestimos();
  }, [fetchEmprestimos]);

  const addEmprestimo = async (emprestimo: Omit<Emprestimo, 'id' | 'user_id' | 'created_at'>) => {
    if (!user) return { data: null, error: new Error('Não autenticado') };

    const { data, error } = await supabase
      .from('emprestimos')
      .insert({ ...emprestimo, user_id: user.id })
      .select()
      .single();

    if (!error) {
      await fetchEmprestimos();
    }

    return { data, error };
  };

  const updateEmprestimo = async (id: string, updates: Partial<Emprestimo>) => {
    const { error } = await supabase
      .from('emprestimos')
      .update(updates)
      .eq('id', id);

    if (!error) {
      await fetchEmprestimos();
    }

    return { error };
  };

  const deleteEmprestimo = async (id: string) => {
    const { error } = await supabase
      .from('emprestimos')
      .delete()
      .eq('id', id);

    if (!error) {
      await fetchEmprestimos();
    }

    return { error };
  };

  const marcarComoPago = async (id: string, valorTotal: number) => {
    return updateEmprestimo(id, { status: 'pago', valor_pago: valorTotal });
  };

  const getEmprestimosByCliente = (clienteId: string) => {
    return emprestimos.filter(e => e.cliente_id === clienteId);
  };

  const getEmprestimosAtivos = () => {
    return emprestimos.filter(e => e.status === 'ativo' || e.status === 'vencido');
  };

  return {
    emprestimos,
    loading,
    addEmprestimo,
    updateEmprestimo,
    deleteEmprestimo,
    marcarComoPago,
    getEmprestimosByCliente,
    getEmprestimosAtivos,
    refetch: fetchEmprestimos
  };
};
