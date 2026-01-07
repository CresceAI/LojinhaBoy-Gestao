import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
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
  const { user } = useAuth();
  const [notificacoes, setNotificacoes] = useState<Notificacao[]>([]);
  const [loading, setLoading] = useState(true);
  const checkedLoansRef = useRef<Set<string>>(new Set());

  const fetchNotificacoes = useCallback(async () => {
    if (!user) {
      setNotificacoes([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const { data, error } = await supabase
      .from('notificacoes')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setNotificacoes(data);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchNotificacoes();
  }, [fetchNotificacoes]);

  const checkAndAddNotificacao = useCallback(async (notificacao: Omit<Notificacao, 'id' | 'user_id' | 'created_at' | 'lida'>) => {
    if (!user) return { data: null, error: new Error('Não autenticado') };

    // Create unique key for this loan+type combination
    const uniqueKey = `${notificacao.emprestimo_id}-${notificacao.tipo}`;
    
    // Skip if already checked in this session
    if (checkedLoansRef.current.has(uniqueKey)) {
      return { data: null, error: null, skipped: true };
    }
    
    // Mark as checked
    checkedLoansRef.current.add(uniqueKey);

    // Check if notification already exists in database
    const { data: existing } = await supabase
      .from('notificacoes')
      .select('id')
      .eq('emprestimo_id', notificacao.emprestimo_id)
      .eq('tipo', notificacao.tipo)
      .maybeSingle();

    if (existing) return { data: null, error: null, exists: true };

    const { data, error } = await supabase
      .from('notificacoes')
      .insert({ ...notificacao, user_id: user.id, lida: false })
      .select()
      .single();

    if (!error && data) {
      // Update local state without refetching
      setNotificacoes(prev => [data, ...prev]);
    }

    return { data, error };
  }, [user]);

  const marcarComoLida = async (id: string) => {
    const { error } = await supabase
      .from('notificacoes')
      .update({ lida: true })
      .eq('id', id);

    if (!error) {
      setNotificacoes(prev => prev.map(n => n.id === id ? { ...n, lida: true } : n));
    }

    return { error };
  };

  const marcarTodasComoLidas = async () => {
    if (!user) return { error: new Error('Não autenticado') };
    
    const { error } = await supabase
      .from('notificacoes')
      .update({ lida: true })
      .eq('user_id', user.id)
      .eq('lida', false);

    if (!error) {
      setNotificacoes(prev => prev.map(n => ({ ...n, lida: true })));
    }

    return { error };
  };

  const deleteNotificacao = async (id: string) => {
    const { error } = await supabase
      .from('notificacoes')
      .delete()
      .eq('id', id);

    if (!error) {
      setNotificacoes(prev => prev.filter(n => n.id !== id));
    }

    return { error };
  };

  const getUnreadCount = () => {
    return notificacoes.filter(n => !n.lida).length;
  };

  return {
    notificacoes,
    loading,
    checkAndAddNotificacao,
    marcarComoLida,
    marcarTodasComoLidas,
    deleteNotificacao,
    getUnreadCount,
    refetch: fetchNotificacoes
  };
};
