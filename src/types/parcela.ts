export interface Parcela {
  id: string;
  emprestimoId: string;
  numeroParcela: number;
  valor: number;
  dataVencimento: string;
  status: 'pendente' | 'pago' | 'vencido';
  dataPagamento?: string;
  createdAt: string;
}
