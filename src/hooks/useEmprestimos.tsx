import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client.ts';
import { useAuth } from './useAuth';
import { addDays, parseISO, isValid } from 'date-fns';
import { toast } from 'sonner';
import { safeNumber } from '@/utils/calculations';

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
  const { user } = useAuth();
  const [emprestimos, setEmprestimos] = useState<Emprestimo[]>([]);
  const [loading, setLoading] = useState(true);
  
  // 🛡️ TRAVAS DE SEGURANÇA
  const isFetched = useRef(false);
  const isFetching = useRef(false); // Impede requisições paralelas

  const fetchEmprestimos = useCallback(async (force = false) => {
    if (!user) {
      setEmprestimos([]);
      setLoading(false);
      return;
    }

    // Se já buscou e não for forçado, ou se já estiver buscando agora, cancela a nova chamada
    if ((isFetched.current && !force) || isFetching.current) return;

    try {
      isFetching.current = true;
      setLoading(true);
      
      const { data, error } = await supabase
        .from('emprestimos')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      setEmprestimos(data || []);
      isFetched.current = true;
    } catch (err) {
      console.error("Erro ao buscar empréstimos:", err);
    } finally {
      setLoading(false);
      isFetching.current = false; // Libera para a próxima busca
    }
  }, [user]);

  useEffect(() => { 
    fetchEmprestimos(); 
  }, [fetchEmprestimos]);

  // 📈 RENOVAÇÃO: Recebe juros e atualiza data
  const renovarEmprestimo = async (id: string) => {
    const emp = emprestimos.find(e => e.id === id);
    if (!emp) return { error: new Error("Contrato não encontrado") };

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
        status: 'ativo'
      })
      .eq('id', id);

    if (!error) {
      toast.success(`Juro de R$ ${juroDoMes.toFixed(2)} recebido!`);
      await fetchEmprestimos(true); // Aqui forçamos a atualização
    }
    return { error };
  };

  const addEmprestimo = async (dados: any) => {
    const { data, error } = await supabase.from('emprestimos').insert({ ...dados, user_id: user?.id }).select().single();
    if (!error) await fetchEmprestimos(true);
    return { data, error };
  };

  const updateEmprestimo = async (id: string, updates: any) => {
    const { error } = await supabase.from('emprestimos').update(updates).eq('id', id);
    if (!error) await fetchEmprestimos(true);
    return { error };
  };

  const deleteEmprestimo = async (id: string) => {
    const { error } = await supabase.from('emprestimos').delete().eq('id', id);
    if (!error) await fetchEmprestimos(true);
    return { error };
  };

  const marcarComoPago = async (id: string, valorTotal: number) => {
    const { error } = await supabase
      .from('emprestimos')
      .update({ status: 'pago', valor_pago: valorTotal, updated_at: new Date().toISOString() })
      .eq('id', id);
    if (!error) await fetchEmprestimos(true);
    return { error };
  };

  return { 
    emprestimos, 
    loading, 
    addEmprestimo, 
    updateEmprestimo, 
    deleteEmprestimo, 
    marcarComoPago, 
    renovarEmprestimo,
    refetch: () => fetchEmprestimos(true) 
  };
};