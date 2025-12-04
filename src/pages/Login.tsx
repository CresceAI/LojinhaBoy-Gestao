import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getUsers, saveUsers, setCurrentUser } from "@/utils/storage";
import { generateId } from "@/utils/calculations";
import { User } from "@/types";
import { toast } from "sonner";

const Login = () => {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");

  // força modo escuro nesta página
  useEffect(() => {
    document.documentElement.classList.add("dark");
    return () => {
      // se quiser que o resto do app respeite o toggle, pode remover aqui:
      // document.documentElement.classList.remove("dark");
    };
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const users = getUsers();

    if (isLogin) {
      const user = users.find(
        (u) => u.email === email && u.password === password
      );
      if (user) {
        setCurrentUser(user);
        toast.success("Login realizado com sucesso!");
        navigate("/dashboard");
      } else {
        toast.error("Email ou senha incorretos");
      }
    } else {
      const existingUser = users.find((u) => u.email === email);
      if (existingUser) {
        toast.error("Email já cadastrado");
        return;
      }

      const newUser: User = {
        id: generateId(),
        email,
        password,
        name,
        createdAt: new Date().toISOString(),
      };

      users.push(newUser);
      saveUsers(users);
      setCurrentUser(newUser);
      toast.success("Cadastro realizado com sucesso!");
      navigate("/dashboard");
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-[radial-gradient(circle_at_top,_rgba(190,255,100,0.3),_transparent_55%),radial-gradient(circle_at_bottom,_#020617,_#000000)] text-foreground">
      {/* textura/ruído suave para dar cara de vidro */}
      <div className="pointer-events-none absolute inset-0 opacity-[0.15] mix-blend-soft-light bg-[url('/banner-login.svg')] bg-repeat" />

      <div className="relative flex min-h-screen items-center justify-center px-4">
        <div className="w-full max-w-md space-y-8 animate-fade-in">
          {/* Branding */}
          <div className="text-center space-y-3">
            <div className="inline-flex items-center justify-center rounded-full px-3 py-1 text-[11px] font-medium bg-white/5 border border-white/10 backdrop-blur-xl">
              <span className="h-2 w-2 rounded-full bg-[hsl(var(--neon))] mr-2 shadow-[0_0_12px_rgba(190,255,100,0.9)]" />
              LojinhaBoy Pro • Fintech local
            </div>
            <h1 className="text-4xl font-semibold tracking-tight">
              Lojinha-Boy
            </h1>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto">
              Gestão inteligente de empréstimos com foco em lucro, fluxo de
              caixa e cobrança rápida.
            </p>
          </div>

          {/* Card glass principal */}
          <Card className="glass-panel hover-lift">
            <div className="glass-glow" />
            <CardHeader className="relative space-y-1">
              <CardTitle className="text-xl">
                {isLogin ? "Entrar" : "Criar conta"}
              </CardTitle>
              <CardDescription>
                {isLogin
                  ? "Acesse seu painel financeiro da LojinhaBoy."
                  : "Crie sua conta para começar a controlar seus empréstimos."}
              </CardDescription>
            </CardHeader>

            <CardContent className="relative">
              <form onSubmit={handleSubmit} className="space-y-4">
                {!isLogin && (
                  <div className="space-y-2">
                    <Label htmlFor="name">Nome</Label>
                    <Input
                      id="name"
                      type="text"
                      placeholder="Seu nome completo"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      className="rounded-2xl bg-background/80 border-white/10 focus-visible:ring-[hsl(var(--neon))]/70"
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="voce@lojinhaboy.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="rounded-2xl bg-background/80 border-white/10 focus-visible:ring-[hsl(var(--neon))]/70"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Senha</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="rounded-2xl bg-background/80 border-white/10 focus-visible:ring-[hsl(var(--neon))]/70"
                  />
                </div>

                {/* microcopy de segurança */}
                <p className="text-[11px] text-muted-foreground">
                  Seus dados são armazenados somente neste dispositivo
                  (localStorage).
                </p>

                <Button
                  type="submit"
                  className="w-full btn-neon-primary mt-1"
                >
                  {isLogin ? "Entrar no painel" : "Criar conta"}
                </Button>
              </form>

              <div className="mt-6 text-center text-xs text-muted-foreground">
                <button
                  onClick={() => setIsLogin(!isLogin)}
                  className="text-primary hover:text-primary-hover font-medium"
                  type="button"
                >
                  {isLogin
                    ? "Não tem conta? Cadastre-se"
                    : "Já tem conta? Entrar"}
                </button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Login;
