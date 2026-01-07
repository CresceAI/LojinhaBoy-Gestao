import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import {
  Wallet,
  Mail,
  Lock,
  User,
  ArrowRight,
  Linkedin,
  Instagram,
  Phone,
  Eye,
  EyeOff,
} from "lucide-react";

const Login = () => {
  const navigate = useNavigate();
  const { user, signIn, signUp, loading } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nome, setNome] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    document.documentElement.classList.add("dark");
  }, []);

  useEffect(() => {
    if (user) {
      navigate("/dashboard");
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (isLogin) {
        const { error } = await signIn(email, password);
        if (error) {
          toast.error(error.message.includes("Invalid") ? "Email ou senha incorretos" : error.message);
        } else {
          toast.success("Login realizado!");
          navigate("/dashboard");
        }
      } else {
        if (nome.length < 2) {
          toast.error("Nome deve ter pelo menos 2 caracteres");
          setSubmitting(false);
          return;
        }
        const { error } = await signUp(email, password, nome);
        if (error) {
          toast.error(error.message.includes("already") ? "Email já cadastrado" : error.message);
        } else {
          toast.success("Conta criada!");
          navigate("/dashboard");
        }
      }
    } catch (_err) {
      toast.error("Erro inesperado");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#020617]">
        <div className="flex flex-col items-center gap-3 animate-pulse">
          <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center text-primary">
            <Wallet className="w-6 h-6" />
          </div>
          <span className="text-primary text-sm font-medium tracking-widest uppercase">Lojinha-Boy</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden flex flex-col items-center justify-center px-4 bg-[#020617]">
      
      {/* Background Animado (Orbes e Grid) */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-primary/20 rounded-full blur-[120px] animate-blob" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-500/10 rounded-full blur-[120px] animate-blob animation-delay-2000" />
        <div className="absolute inset-0 opacity-[0.05] bg-[linear-gradient(to_right,#808080_1px,transparent_1px),linear-gradient(to_bottom,#808080_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
      </div>

      {/* Banner Original */}
      <div className="login-banner-bg" />

      {/* Conteúdo Principal */}
      <div className="w-full max-w-[420px] z-10 space-y-8 animate-fade-in">
        
        <div className="text-center space-y-3">
          <div className="mx-auto w-14 h-14 rounded-2xl bg-primary flex items-center justify-center shadow-[0_0_30px_rgba(190,255,100,0.3)] mb-4 animate-float">
            <Wallet className="w-7 h-7 text-black" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Lojinha-Boy</h1>
          <p className="text-muted-foreground text-sm">
            {isLogin 
              ? "Acesse seu painel e veja quem te deve hoje." 
              : "Abandone o caderninho e profissionalize suas cobranças."}
          </p>
        </div>

        <div className="bg-card/40 backdrop-blur-2xl border border-white/10 p-6 md:p-8 rounded-[2.5rem] shadow-2xl relative">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-[1px] bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
          
          <form onSubmit={handleSubmit} className="space-y-5">
            {!isLogin && (
              <div className="space-y-2">
                <Label htmlFor="nome" className="text-xs uppercase tracking-wider ml-1">Nome Completo</Label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="nome"
                    required
                    placeholder="Seu nome"
                    className="pl-12 h-14 rounded-2xl bg-white/5 border-white/5 focus:border-primary/50 focus:ring-0 transition-all"
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    disabled={submitting}
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email" className="text-xs uppercase tracking-wider ml-1">E-mail</Label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  required
                  placeholder="seu@email.com"
                  className="pl-12 h-14 rounded-2xl bg-white/5 border-white/5 focus:border-primary/50 focus:ring-0 transition-all"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={submitting}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-xs uppercase tracking-wider ml-1">Senha</Label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder="••••••••"
                  className="pl-12 pr-12 h-14 rounded-2xl bg-white/5 border-white/5 focus:border-primary/50 focus:ring-0 transition-all"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={submitting}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full h-14 rounded-2xl bg-primary text-black font-bold text-lg hover:scale-[1.02] active:scale-[0.98] transition-all shadow-[0_8px_30px_rgba(190,255,100,0.3)] mt-2"
              disabled={submitting}
            >
              {submitting ? "Entrando..." : (
                <span className="flex items-center gap-2">
                  {isLogin ? "Acessar Painel" : "Criar Conta Agora"}
                  <ArrowRight className="w-5 h-5" />
                </span>
              )}
            </Button>
          </form>

          <div className="mt-8 text-center">
            <button
              onClick={() => {
                setIsLogin(!isLogin);
                setShowPassword(false);
              }}
              className="text-sm text-muted-foreground hover:text-primary transition-colors"
              disabled={submitting}
            >
              {isLogin ? (
                <span>Novo por aqui? <b className="text-primary ml-1">Cadastre-se grátis</b></span>
              ) : (
                <span>Já tem conta? <b className="text-primary ml-1">Fazer Login</b></span>
              )}
            </button>
          </div>
        </div>

        {/* COPY REFINADA NO FOOTER */}
        <footer className="text-center space-y-4 opacity-50 hover:opacity-100 transition-opacity pb-8">
          <p className="text-[10px] uppercase tracking-[0.3em] text-white/70">
            Engineered by <span className="font-bold">Renato Filho</span> • Full-Stack Engineer & Cloud Specialist
          </p>
          <div className="flex items-center justify-center gap-6">
            <a href="https://www.linkedin.com/in/renatofilhodevandtech" target="_blank" className="hover:text-primary transition-colors"><Linkedin className="w-4 h-4" /></a>
            <a href="https://www.instagram.com/renatofilho8" target="_blank" className="hover:text-primary transition-colors"><Instagram className="w-4 h-4" /></a>
            <a href="https://wa.me/5585985252317" target="_blank" className="hover:text-primary transition-colors"><Phone className="w-4 h-4" /></a>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default Login;