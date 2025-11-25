export const calcularValorTotal = (valor: number, juros: number, meses: number = 1): number => {
  const taxaJuros = juros / 100;
  const valorTotal = valor * (1 + taxaJuros * meses);
  return Math.round(valorTotal * 100) / 100;
};

export const calcularValorParcela = (valorTotal: number, numeroParcelas: number): number => {
  return Math.round((valorTotal / numeroParcelas) * 100) / 100;
};

export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

export const formatDate = (date: string): string => {
  return new Date(date).toLocaleDateString('pt-BR');
};

export const getDaysDifference = (date1: string, date2: string = new Date().toISOString()): number => {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  const diffTime = Math.abs(d2.getTime() - d1.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
};

export const isVencimentoProximo = (dataVencimento: string, dias: number = 3): boolean => {
  const hoje = new Date();
  const vencimento = new Date(dataVencimento);
  const diffTime = vencimento.getTime() - hoje.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays >= 0 && diffDays <= dias;
};

export const isVencido = (dataVencimento: string): boolean => {
  const hoje = new Date();
  const vencimento = new Date(dataVencimento);
  return vencimento < hoje;
};

export const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};
