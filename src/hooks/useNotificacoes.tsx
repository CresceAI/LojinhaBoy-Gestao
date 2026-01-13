import { useState, useEffect, useCallback, useRef } from 'react';
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
  const { user } = useAuth();
  const [notificacoes, setNotificacoes] = useState<Notificacao[]>([]);
  const [loading, setLoading] = useState(true);
  
  // 🛡️ Filtro em memória para não repetir verificações na mesma sessão
  const checkedLoansRef = useRef<Set<string>>(new Set());

  const fetchNotificacoes = useCallback(async (force = false) => {
    if (!user) {
      setNotificacoes([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('notificacoes')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (!error && data) {
        setNotificacoes(data);
      }
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchNotificacoes();
  }, [fetchNotificacoes]);

  // 🔔 ADICIONA NOTIFICAÇÃO (Com trava de duplicidade assertiva)
  const checkAndAddNotificacao = useCallback(async (notificacao: Omit<Notificacao, 'id' | 'user_id' | 'created_at' | 'lida'>) => {
    if (!user) return { error: new Error('Não autenticado') };

    const uniqueKey = `${notificacao.emprestimo_id}-${notificacao.tipo}`;
    
    // 1. Trava em memória (Rápido)
    if (checkedLoansRef.current.has(uniqueKey)) {
      return { data: null, error: null, skipped: true };
    }
    
    checkedLoansRef.current.add(uniqueKey);

    // 2. Trava no Banco de Dados (Segurança)
    const { data: existing } = await supabase
      .from('notificacoes')
      .select('id')
      .eq('emprestimo_id', notificacao.emprestimo_id)
      .eq('tipo', notificacao.tipo)
      .eq('lida', false) // Se já existe uma não lida, não cria outra
      .maybeSingle();

    if (existing) return { data: null, error: null, exists: true };

    const { data, error } = await supabase
      .from('notificacoes')
      .insert({ ...notificacao, user_id: user.id, lida: false })
      .select()
      .single();

    if (!error && data) {
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

  return {
    notificacoes,
    loading,
    checkAndAddNotificacao,
    marcarComoLida,
    marcarTodasComoLidas,
    deleteNotificacao,
    getUnreadCount: () => notificacoes.filter(n => !n.lida).length,
    refetch: () => fetchNotificacoes(true)
  };
};