import { useEffect } from 'react';
import { getOfflineQueue, removeOfflineItem, markAsFailed } from '@/utils/offlinePersistence';
import { useEmprestimos } from './useEmprestimos';
import { toast } from 'sonner';

/**
 * 🦈 Shark Engine - Motor de Sincronização Inteligente
 * Gerencia a fila de ações (Criar, Editar, Deletar) quando o sistema volta a ficar online.
 */
export const useOfflineSync = () => {
  const { addEmprestimo, updateEmprestimo, deleteEmprestimo } = useEmprestimos();

  useEffect(() => {
    const handleSync = async () => {
      // Heurística #1: Só inicia se houver sinal
      if (!navigator.onLine) return;

      const queue = await getOfflineQueue('pending');
      if (queue.length === 0) return;

      // Feedback visual de início de operação (UX Premium)
      toast.info(`Shark, processando ${queue.length} operações pendentes...`, {
        icon: '🔄',
        duration: 4000
      });

      for (const item of queue) {
        try {
          // Heurística #7: Eficiência na escolha da ação
          switch (item.action) {
            case 'CREATE':
              await addEmprestimo(item.data);
              break;
              
            case 'UPDATE':
              if (item.recordId) {
                await updateEmprestimo(item.recordId, item.data);
              }
              break;
              
            case 'DELETE':
              if (item.recordId) {
                await deleteEmprestimo(item.recordId);
              }
              break;
          }

          // Se a ação foi concluída com sucesso no Supabase, removemos da banca local
          await removeOfflineItem(item.id);
          console.log(`✅ [Shark Engine] Sincronizado: ${item.action} - ${item.id}`);

        } catch (err) {
          console.error(`❌ [Shark Engine] Falha na sincronia do item ${item.id}:`, err);
          
          // Heurística #5: Prevenção de Erros - Marca para não tentar infinitamente se houver erro de dado
          await markAsFailed(item.id, "Erro técnico na comunicação com servidor");
        }
      }

      toast.success("Banca 100% atualizada e sincronizada!", {
        icon: '🦈',
        duration: 5000
      });
    };

    // Eventos de conectividade do navegador
    window.addEventListener('online', handleSync);
    
    // Tenta sincronizar sempre que o hook é montado (Ex: F5 ou troca de página)
    handleSync();

    return () => window.removeEventListener('online', handleSync);
  }, [addEmprestimo, updateEmprestimo, deleteEmprestimo]);
};
