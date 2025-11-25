import { User, Cliente, Emprestimo, Notificacao, Cobranca } from '@/types';
import { Parcela } from '@/types/parcela';

const STORAGE_KEYS = {
  USERS: 'loan_manager_users',
  CURRENT_USER: 'loan_manager_current_user',
  CLIENTES: 'loan_manager_clientes',
  EMPRESTIMOS: 'loan_manager_emprestimos',
  NOTIFICACOES: 'loan_manager_notificacoes',
  COBRANCAS: 'loan_manager_cobrancas',
  PARCELAS: 'loan_manager_parcelas',
  ASSINATURAS: 'loan_manager_assinaturas',
};

// Generic storage functions
export const getFromStorage = <T>(key: string): T[] => {
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : [];
};

export const saveToStorage = <T>(key: string, data: T[]): void => {
  localStorage.setItem(key, JSON.stringify(data));
};

// Users
export const getUsers = (): User[] => getFromStorage<User>(STORAGE_KEYS.USERS);
export const saveUsers = (users: User[]): void => saveToStorage(STORAGE_KEYS.USERS, users);

export const getCurrentUser = (): User | null => {
  const data = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
  return data ? JSON.parse(data) : null;
};

export const setCurrentUser = (user: User | null): void => {
  if (user) {
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
  } else {
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
  }
};

// Clientes
export const getClientes = (): Cliente[] => getFromStorage<Cliente>(STORAGE_KEYS.CLIENTES);
export const saveClientes = (clientes: Cliente[]): void => saveToStorage(STORAGE_KEYS.CLIENTES, clientes);

export const addCliente = (cliente: Cliente): void => {
  const clientes = getClientes();
  clientes.push(cliente);
  saveClientes(clientes);
};

export const updateCliente = (id: string, updatedCliente: Partial<Cliente>): void => {
  const clientes = getClientes();
  const index = clientes.findIndex(c => c.id === id);
  if (index !== -1) {
    clientes[index] = { ...clientes[index], ...updatedCliente };
    saveClientes(clientes);
  }
};

export const deleteCliente = (id: string): void => {
  const clientes = getClientes().filter(c => c.id !== id);
  saveClientes(clientes);
};

// Empréstimos
export const getEmprestimos = (): Emprestimo[] => getFromStorage<Emprestimo>(STORAGE_KEYS.EMPRESTIMOS);
export const saveEmprestimos = (emprestimos: Emprestimo[]): void => saveToStorage(STORAGE_KEYS.EMPRESTIMOS, emprestimos);

export const addEmprestimo = (emprestimo: Emprestimo): void => {
  const emprestimos = getEmprestimos();
  emprestimos.push(emprestimo);
  saveEmprestimos(emprestimos);
};

export const updateEmprestimo = (id: string, updatedEmprestimo: Partial<Emprestimo>): void => {
  const emprestimos = getEmprestimos();
  const index = emprestimos.findIndex(e => e.id === id);
  if (index !== -1) {
    emprestimos[index] = { ...emprestimos[index], ...updatedEmprestimo };
    saveEmprestimos(emprestimos);
  }
};

export const deleteEmprestimo = (id: string): void => {
  const emprestimos = getEmprestimos().filter(e => e.id !== id);
  saveEmprestimos(emprestimos);
};

// Notificações
export const getNotificacoes = (): Notificacao[] => getFromStorage<Notificacao>(STORAGE_KEYS.NOTIFICACOES);
export const saveNotificacoes = (notificacoes: Notificacao[]): void => saveToStorage(STORAGE_KEYS.NOTIFICACOES, notificacoes);

export const addNotificacao = (notificacao: Notificacao): void => {
  const notificacoes = getNotificacoes();
  notificacoes.push(notificacao);
  saveNotificacoes(notificacoes);
};

export const markNotificacaoAsRead = (id: string): void => {
  const notificacoes = getNotificacoes();
  const index = notificacoes.findIndex(n => n.id === id);
  if (index !== -1) {
    notificacoes[index].lida = true;
    saveNotificacoes(notificacoes);
  }
};

// Cobranças
export const getCobrancas = (): Cobranca[] => getFromStorage<Cobranca>(STORAGE_KEYS.COBRANCAS);
export const saveCobrancas = (cobrancas: Cobranca[]): void => saveToStorage(STORAGE_KEYS.COBRANCAS, cobrancas);

export const addCobranca = (cobranca: Cobranca): void => {
  const cobrancas = getCobrancas();
  cobrancas.push(cobranca);
  saveCobrancas(cobrancas);
};

// Parcelas
export const getParcelas = (): Parcela[] => getFromStorage<Parcela>(STORAGE_KEYS.PARCELAS);
export const saveParcelas = (parcelas: Parcela[]): void => saveToStorage(STORAGE_KEYS.PARCELAS, parcelas);

export const addParcela = (parcela: Parcela): void => {
  const parcelas = getParcelas();
  parcelas.push(parcela);
  saveParcelas(parcelas);
};

export const updateParcela = (id: string, updatedParcela: Partial<Parcela>): void => {
  const parcelas = getParcelas();
  const index = parcelas.findIndex(p => p.id === id);
  if (index !== -1) {
    parcelas[index] = { ...parcelas[index], ...updatedParcela };
    saveParcelas(parcelas);
  }
};

export const getParcelasByEmprestimo = (emprestimoId: string): Parcela[] => {
  return getParcelas().filter(p => p.emprestimoId === emprestimoId);
};

// Assinaturas
export const getAssinatura = (emprestimoId: string): string | null => {
  const assinaturas = getFromStorage<{ emprestimoId: string; assinatura: string }>(STORAGE_KEYS.ASSINATURAS);
  const found = assinaturas.find(a => a.emprestimoId === emprestimoId);
  return found?.assinatura || null;
};

export const saveAssinatura = (emprestimoId: string, assinatura: string): void => {
  const assinaturas = getFromStorage<{ emprestimoId: string; assinatura: string }>(STORAGE_KEYS.ASSINATURAS);
  const index = assinaturas.findIndex(a => a.emprestimoId === emprestimoId);
  
  if (index !== -1) {
    assinaturas[index].assinatura = assinatura;
  } else {
    assinaturas.push({ emprestimoId, assinatura });
  }
  
  saveToStorage(STORAGE_KEYS.ASSINATURAS, assinaturas);
};
