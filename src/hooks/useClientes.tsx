import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client.ts';
import { useAuth } from './useAuth';

export interface Cliente {
  id: string;
  user_id: string;
  nome: string;
  cpf_cnpj: string | null;
  telefone: string | null;
  email: string | null;
  endereco: string | null;
  created_at: string;
}

export const useClientes = () => {
  const { user } = useAuth();
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchClientes = useCallback(async () => {
    if (!user) {
      setClientes([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const { data, error } = await supabase
      .from('clientes')
      .select('*')
      .eq('user_id', user.id)
      .order('nome', { ascending: true });

    if (!error && data) {
      setClientes(data);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchClientes();
  }, [fetchClientes]);

  const addCliente = async (cliente: Omit<Cliente, 'id' | 'user_id' | 'created_at'>) => {
    if (!user) return { data: null, error: new Error('Não autenticado') };

    const { data, error } = await supabase
      .from('clientes')
      .insert({ ...cliente, user_id: user.id })
      .select()
      .single();

    if (!error) {
      await fetchClientes();
    }

    return { data, error };
  };

  const updateCliente = async (id: string, updates: Partial<Cliente>) => {
    const { error } = await supabase
      .from('clientes')
      .update(updates)
      .eq('id', id);

    if (!error) {
      await fetchClientes();
    }

    return { error };
  };

  const deleteCliente = async (id: string) => {
    const { error } = await supabase
      .from('clientes')
      .delete()
      .eq('id', id);

    if (!error) {
      await fetchClientes();
    }

    return { error };
  };

  const findClienteByNome = (nome: string): Cliente | undefined => {
    return clientes.find(c => c.nome.toLowerCase() === nome.toLowerCase());
  };

  return {
    clientes,
    loading,
    addCliente,
    updateCliente,
    deleteCliente,
    findClienteByNome,
    refetch: fetchClientes
  };
};
