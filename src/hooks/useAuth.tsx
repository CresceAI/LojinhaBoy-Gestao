import { 
  useState, 
  useEffect, 
  createContext, 
  useContext, 
  ReactNode, 
  useCallback, 
  useRef 
} from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client.ts';
import { Perfil } from '@/types/database.helper.ts';

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

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Perfil | null>(null);
  const [loading, setLoading] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const mountedRef = useRef(true);
  const retryCount = useRef(0);
  const maxRetries = 3;

  const fetchProfile = useCallback(async (userId: string): Promise<Perfil | null> => {
    console.log("🔍 Auth: Buscando perfil (tentativa", retryCount.current + 1, ")");
    
    const cachedProfile = localStorage.getItem(`profile_${userId}`);
    if (cachedProfile) {
      try {
        const parsed = JSON.parse(cachedProfile) as Perfil;
        setProfile(parsed);
        return parsed;
      } catch {}
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    try {
      // ✅ CORREÇÃO 1: .abortSignal() deve vir ANTES do .maybeSingle()
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .abortSignal(controller.signal)
        .maybeSingle();

      clearTimeout(timeoutId);

      if (error) {
        if (retryCount.current < maxRetries && error.message.includes('RLS')) {
          retryCount.current++;
          return fetchProfile(userId);
        }
        throw error;
      }

      if (data) {
        localStorage.setItem(`profile_${userId}`, JSON.stringify(data));
        setProfile(data);
        return data;
      }

      console.log("➕ Auth: Criando perfil vazio");
      // ✅ CORREÇÃO 2: 'nome_completo' alterado para 'nome' (conforme seu Database Type)
      // Removido 'ativo' pois não existe na sua tabela profiles
      const { error: insertError } = await supabase
        .from('profiles')
        .insert({ 
          user_id: userId, 
          nome: 'Usuário', 
          email: session?.user?.email || '' 
        })
        .select()
        .maybeSingle();

      if (!insertError) {
        return await fetchProfile(userId);
      }

      return null;
    } catch (error: any) {
      clearTimeout(timeoutId);
      console.error("❌ Auth: Erro/Timeout perfil:", error.message);
      
      // ✅ CORREÇÃO 3: Fallback usando 'nome' e respeitando a interface Perfil
      const fallbackProfile: Perfil = {
        id: crypto.randomUUID(), // Necessário para satisfazer o tipo Perfil
        user_id: userId,
        nome: 'Carregando...',
        email: session?.user?.email || '',
        avatar_url: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      setProfile(fallbackProfile);
      return fallbackProfile;
    }
  }, [session?.user?.email]);

  useEffect(() => {
    mountedRef.current = true;

    const initializeAuth = async () => {
      try {
        setLoading(true);
        const { data: { session: serverSession } } = await supabase.auth.getSession();
        
        if (serverSession && mountedRef.current) {
          setUser(serverSession.user);
          setSession(serverSession);
          localStorage.setItem('supabase_session', JSON.stringify(serverSession));
          await fetchProfile(serverSession.user.id);
        }
      } catch (error) {
        console.error("⚠️ Auth: Erro inicialização:", error);
      } finally {
        if (mountedRef.current) {
          setLoading(false);
          setIsLoading(false);
        }
      }
    };

    initializeAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        if (!mountedRef.current) return;

        if (currentSession) {
          setUser(currentSession.user);
          setSession(currentSession);
          localStorage.setItem('supabase_session', JSON.stringify(currentSession));
          await fetchProfile(currentSession.user.id);
        } else {
          setUser(null);
          setSession(null);
          setProfile(null);
          localStorage.removeItem('supabase_session');
        }

        setLoading(false);
        setIsLoading(false);
      }
    );

    return () => {
      mountedRef.current = false;
      subscription.unsubscribe();
    };
  }, [fetchProfile]);

  const signUp = async (email: string, password: string, nome: string) => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { nome }, emailRedirectTo: window.location.origin }
      });
      setIsLoading(false);
      return { error };
    } catch (error: any) {
      setIsLoading(false);
      return { error };
    }
  };

  const signIn = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      setIsLoading(false);
      return { error: error || null };
    } catch (error: any) {
      setIsLoading(false);
      return { error };
    }
  };

  const signOut = async () => {
    setIsLoading(true);
    try {
      await supabase.auth.signOut();
      setUser(null);
      setSession(null);
      setProfile(null);
      localStorage.clear();
      window.location.href = '/login';
    } catch (error) {
      console.error("❌ Logout erro:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateProfile = async (updates: Partial<Perfil>) => {
    if (!user) return { error: new Error('Não autenticado') };
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('user_id', user.id);

      if (!error) {
        localStorage.removeItem(`profile_${user.id}`);
        await fetchProfile(user.id);
      }
      
      setIsLoading(false);
      return { error };
    } catch (error: any) {
      setIsLoading(false);
      return { error };
    }
  };

  const uploadAvatar = async (file: File) => {
    if (!user) return { url: null, error: new Error('Não autenticado') };
    setIsLoading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const filePath = `${user.id}/avatar-${crypto.randomUUID()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      await updateProfile({ avatar_url: publicUrl });
      setIsLoading(false);
      return { url: publicUrl, error: null };
    } catch (error: any) {
      setIsLoading(false);
      return { url: null, error };
    }
  };

  const value: AuthContextType = {
    user, session, profile, loading, isLoading,
    signUp, signIn, signOut, updateProfile, uploadAvatar
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de AuthProvider');
  }
  return context;
};