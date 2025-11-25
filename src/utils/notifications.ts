import { Emprestimo, Notificacao } from '@/types';
import { addNotificacao, getNotificacoes } from './storage';
import { isVencimentoProximo, isVencido, generateId } from './calculations';

export const checkAndCreateNotifications = (emprestimos: Emprestimo[]): void => {
  const notificacoesExistentes = getNotificacoes();
  
  emprestimos.forEach(emprestimo => {
    if (emprestimo.status === 'ativo') {
      const jaNotificado = notificacoesExistentes.some(
        n => n.emprestimoId === emprestimo.id && n.tipo === 'vencimento_proximo'
      );

      if (isVencido(emprestimo.dataVencimento)) {
        const jaNotificadoVencido = notificacoesExistentes.some(
          n => n.emprestimoId === emprestimo.id && n.tipo === 'vencido'
        );

        if (!jaNotificadoVencido) {
          const notificacao: Notificacao = {
            id: generateId(),
            emprestimoId: emprestimo.id,
            clienteId: emprestimo.clienteId,
            tipo: 'vencido',
            mensagem: `Empréstimo vencido! Valor: R$ ${emprestimo.valorTotal.toFixed(2)}`,
            lida: false,
            createdAt: new Date().toISOString(),
          };
          addNotificacao(notificacao);
        }
      } else if (isVencimentoProximo(emprestimo.dataVencimento) && !jaNotificado) {
        const notificacao: Notificacao = {
          id: generateId(),
          emprestimoId: emprestimo.id,
          clienteId: emprestimo.clienteId,
          tipo: 'vencimento_proximo',
          mensagem: `Vencimento próximo! Data: ${new Date(emprestimo.dataVencimento).toLocaleDateString('pt-BR')}`,
          lida: false,
          createdAt: new Date().toISOString(),
        };
        addNotificacao(notificacao);
      }
    }
  });
};
