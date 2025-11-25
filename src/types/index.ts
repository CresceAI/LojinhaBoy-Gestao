export interface User {
  id: string;
  email: string;
  password: string;
  name: string;
  createdAt: string;
}

export interface Cliente {
  id: string;
  nome: string;
  cpfCnpj: string;
  telefone: string;
  endereco: string;
  observacoes?: string;
  createdAt: string;
}

export interface Emprestimo {
  id: string;
  clienteId: string;
  valor: number;
  dataInicio: string;
  dataVencimento: string;
  juros: number; // percentual
  formaPagamento: 'parcelado' | 'vista';
  numeroParcelas?: number;
  status: 'ativo' | 'pago' | 'vencido';
  valorTotal: number;
  valorPago: number;
  createdAt: string;
}

export interface Notificacao {
  id: string;
  emprestimoId: string;
  clienteId: string;
  tipo: 'vencimento_proximo' | 'vencido' | 'pago';
  mensagem: string;
  lida: boolean;
  createdAt: string;
}

export interface Cobranca {
  id: string;
  emprestimoId: string;
  clienteId: string;
  mensagem: string;
  enviada: boolean;
  dataEnvio?: string;
  createdAt: string;
}

export interface DashboardStats {
  totalEmprestado: number;
  totalRecebido: number;
  emprestimosAbertos: number;
  vencimentosProximos: number;
}
