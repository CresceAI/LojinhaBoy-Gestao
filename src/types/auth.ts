import { User, Session } from '@supabase/supabase-js';
import { Perfil } from './database.helper';

export interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Perfil | null;
  loading: boolean;
  isLoading: boolean;
  signUp: (email: string, password: string, nome: string) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<Perfil>) => Promise<{ error: any }>;
  uploadAvatar: (file: File) => Promise<{ url: string | null; error: any }>;
}