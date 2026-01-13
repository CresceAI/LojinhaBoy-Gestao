import { isValid, parseISO, addDays, format, isBefore, startOfDay, differenceInDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';

/**
 * 🛡️ PROTEÇÃO NUMÉRICA (Anti-NaN)
 * Garante que qualquer valor (nulo, indefinido ou texto) vire um número válido.
 */
export const safeNumber = (value: any): number => {
  const num = Number(value);
  return isNaN(num) || value === null || value === undefined ? 0 : num;
};

/**
 * 💰 FORMATAÇÃO DE MOEDA (BRL)
 */
export const formatCurrency = (value: number | string | null | undefined): string => {
  const amount = safeNumber(value);
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(amount);
};

/**
 * 📅 FORMATAÇÃO DE DATA SEGURA
 */
export const formatDate = (dateString: string | null | undefined): string => {
  if (!dateString) return '--/--/----';
  try {
    const date = parseISO(dateString);
    if (!isValid(date)) return 'Data inválida';
    return format(date, 'dd/MM/yyyy', { locale: ptBR });
  } catch (error) {
    return 'Erro na data';
  }
};

/**
 * 🚩 VERIFICAÇÃO DE VENCIMENTO
 * Compara a data de vencimento com o início do dia de hoje.
 */
export const isVencido = (dataVencimento: string | null | undefined): boolean => {
  if (!dataVencimento) return false;
  try {
    const vencimento = parseISO(dataVencimento);
    if (!isValid(vencimento)) return false;
    
    const hoje = startOfDay(new Date());
    // Retorna true se o vencimento for ANTES de hoje
    return isBefore(vencimento, hoje);
  } catch {
    return false;
  }
};

/**
 * 🕒 CÁLCULO DE DIAS DE ATRASO
 */
export const calcularDiasAtraso = (dataVencimento: string | null | undefined): number => {
  if (!dataVencimento) return 0;
  const venc = parseISO(dataVencimento);
  if (!isValid(venc)) return 0;
  
  const hoje = startOfDay(new Date());
  const diff = differenceInDays(hoje, venc);
  
  return diff > 0 ? diff : 0;
};

/**
 * 🧮 CÁLCULOS FINANCEIROS BÁSICOS
 */
export const calcularValorTotal = (valor: number = 0, juros: number = 0): number => {
  return safeNumber(valor) + safeNumber(juros);
};

export const calcularValorParcela = (valorTotal: number = 0, numeroParcelas: number = 1): number => {
  const total = safeNumber(valorTotal);
  const parcelas = safeNumber(numeroParcelas) || 1;
  return total / parcelas;
};

/**
 * 📈 PREPARAR RENOVAÇÃO (NOVA LÓGICA)
 * Calcula os novos dados para quando o cliente paga apenas os juros.
 */
export const prepararRenovacao = (emprestimo: { valor: number, juros: number, data_vencimento: string }) => {
  const dataVenc = emprestimo.data_vencimento ? parseISO(emprestimo.data_vencimento) : new Date();
  const baseDate = isValid(dataVenc) ? dataVenc : new Date();

  return {
    lucroGerado: safeNumber(emprestimo.juros),
    novoVencimento: addDays(baseDate, 30).toISOString(),
    principalMantido: safeNumber(emprestimo.valor)
  };
};

/**
 * 🆔 GERADOR DE ID
 */
export const generateId = (): string => {
  try {
    return crypto.randomUUID();
  } catch {
    return Math.random().toString(36).substring(2, 15);
  }
};