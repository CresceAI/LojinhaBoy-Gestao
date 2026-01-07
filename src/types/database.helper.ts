import { Database } from '@/integrations/supabase/types'; // Ajuste o caminho se necessário

// --- Atalhos de Tipagem (O "Coração" do Clean Code) ---
export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row'];
export type TablesInsert<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert'];
export type TablesUpdate<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update'];

// --- Entidades de Negócio (Domínio da Fintech) ---
// Use esses tipos nos seus componentes e Hooks
export type Perfil = Tables<'profiles'>;
export type Cliente = Tables<'clientes'>;
export type Emprestimo = Tables<'emprestimos'>;
export type Notificacao = Tables<'notificacoes'>;
export type Cobranca = Tables<'cobrancas'>;

// --- Tipos Compostos (Para performance e Joins) ---
// Exemplo: Quando você busca um empréstimo e quer o nome do cliente junto
export type EmprestimoComCliente = Emprestimo & {
  clientes: Pick<Cliente, 'nome' | 'email' | 'telefone'> | null;
};

// --- Tipos para o Estado de Notificações ---
export type NotificacaoTipo = Notificacao['tipo']; // 'vencimento', 'atraso', etc.