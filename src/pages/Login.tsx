import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import {
  Wallet, Mail, Lock, User, ArrowRight,
  Linkedin, Instagram, Phone, Eye, EyeOff, ShieldCheck
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
    if (user) navigate("/dashboard");
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    try {
      if (isLogin) {
        const { error } = await signIn(email.trim(), password);
        if (error) toast.error("Credenciais inválidas.");
        else toast.success("Banca autorizada!");
      } else {
        const { error } = await signUp(email.trim(), password, nome.trim());
        if (error) toast.error("Erro ao registrar operador.");
        else toast.success("Registro concluído!");
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingScreen />;

  return (
    <div className="min-h-screen relative overflow-hidden flex flex-col items-center justify-center px-4 bg-[#020617]">
      
      {/* 🖼️ CAMADA 1: Imagem de Fundo (banner-login.svg) */}
      <div 
        className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat opacity-30"
        style={{ backgroundImage: "url('/banner-login.svg')" }}
      />

      {/* 🔮 CAMADA 2: Glow Orbs (Mesmo Estilo do Dashboard) */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-0 right-0 -translate-y-1/4 translate-x-1/4 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 left-0 translate-y-1/4 -translate-x-1/4 w-[500px] h-[500px] bg-blue-600/5 rounded-full blur-[100px]" />
      </div>

      <div className="w-full max-w-[420px] z-10 space-y-8 animate-in fade-in zoom-in-95 duration-700">
        
        {/* Branding Area */}
        <div className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 rounded-[2.2rem] bg-card border border-white/10 flex items-center justify-center shadow-2xl backdrop-blur-xl">
            <Wallet className="w-8 h-8 text-primary" strokeWidth={2.5} />
          </div>
          <div className="space-y-1">
            <h1 className="text-4xl font-black tracking-tighter text-white">LojinhaBoy<span className="text-primary">.</span></h1>
            <p className="text-muted-foreground text-[10px] font-black uppercase tracking-[0.4em] opacity-70">Sovereign Financial System</p>
          </div>
        </div>

        {/* Login Card (Liquid Glass Effect) */}
        <div className="relative group">
          <div className="absolute -inset-[1px] bg-gradient-to-b from-primary/20 to-transparent rounded-[2.5rem] opacity-50 transition-opacity group-hover:opacity-100" />
          
          <div className="relative bg-card/60 border border-white/5 p-8 rounded-[2.5rem] shadow-2xl backdrop-blur-2xl">
            <div className="flex items-center justify-between mb-8 px-1">
              <h2 className="text-xl font-black text-white tracking-tight">{isLogin ? "Acessar Conta" : "Novo Operador"}</h2>
              <ShieldCheck className="w-5 h-5 text-primary/30" />
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {!isLogin && (
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Identificação</Label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Nome completo"
                      className="pl-12 h-14 rounded-2xl bg-secondary/20 border-none focus:ring-1 focus:ring-primary/40 font-bold placeholder:font-normal"
                      value={nome}
                      onChange={(e) => setNome(e.target.value)}
                    />
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">E-mail Operacional</Label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    type="email"
                    placeholder="exemplo@fintech.com"
                    className="pl-12 h-14 rounded-2xl bg-secondary/20 border-none focus:ring-1 focus:ring-primary/40 font-bold placeholder:font-normal"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Chave de Acesso</Label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    className="pl-12 pr-12 h-14 rounded-2xl bg-secondary/20 border-none focus:ring-1 focus:ring-primary/40 font-bold"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-white transition-colors">
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full h-14 rounded-2xl bg-primary text-[#020617] font-black uppercase text-xs tracking-[0.2em] shadow-[0_10px_30px_rgba(190,255,100,0.2)] hover:scale-[1.01] transition-all active:scale-[0.98]"
                disabled={submitting}
              >
                {submitting ? "Processando..." : isLogin ? "Entrar no Sistema" : "Registrar Agora"}
              </Button>
            </form>

            <button
              onClick={() => setIsLogin(!isLogin)}
              className="w-full mt-8 text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors"
            >
              {isLogin ? "Deseja solicitar uma conta?" : "Já possui licença de uso?"}
            </button>
          </div>
        </div>

        {/* Footer Signature: Engineered by Renato Filho */}
        <footer className="text-center space-y-4 pt-4 opacity-40 hover:opacity-100 transition-opacity duration-700">
          <p className="text-[9px] font-black uppercase tracking-[0.5em] text-white leading-relaxed">
            Designed & Engineered by <span className="text-primary">Renato Filho</span><br/>
            <span className="text-[7px] opacity-60">Full-Stack Engineer • Maracanaú, CE</span>
          </p>
          <div className="flex justify-center gap-7">
            <SocialLink href="https://www.linkedin.com/in/renatofilhodevandtech" icon={<Linkedin className="w-4 h-4" />} />
            <SocialLink href="https://www.instagram.com/renatofilho8" icon={<Instagram className="w-4 h-4" />} />
            <SocialLink href="https://wa.me/5585985252317" icon={<Phone className="w-4 h-4" />} />
          </div>
        </footer>
      </div>
    </div>
  );
};

const SocialLink = ({ href, icon }: { href: string; icon: React.ReactNode }) => (
  <a href={href} target="_blank" rel="noopener noreferrer" className="text-white hover:text-primary transition-all hover:scale-125 duration-300">
    {icon}
  </a>
);

const LoadingScreen = () => (
  <div className="min-h-screen flex items-center justify-center bg-[#020617]">
    <div 
      className="absolute inset-0 opacity-10 bg-cover bg-center"
      style={{ backgroundImage: "url('/banner-login.svg')" }}
    />
    <div className="flex flex-col items-center gap-4 z-10">
      <div className="w-16 h-16 rounded-[2rem] bg-card border border-white/10 flex items-center justify-center text-primary animate-bounce shadow-2xl">
        <Wallet className="w-8 h-8" />
      </div>
      <p className="text-[10px] font-black uppercase tracking-[0.4em] text-primary animate-pulse">Estabelecendo Conexão...</p>
    </div>
  </div>
);

export default Login;