import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getUsers, saveUsers, setCurrentUser } from '@/utils/storage';
import { generateId } from '@/utils/calculations';
import { User } from '@/types';
import { toast } from 'sonner';

const Login = () => {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const users = getUsers();

    if (isLogin) {
      // Login
      const user = users.find(u => u.email === email && u.password === password);
      if (user) {
        setCurrentUser(user);
        toast.success('Login realizado com sucesso!');
        navigate('/dashboard');
      } else {
        toast.error('Email ou senha incorretos');
      }
    } else {
      // Cadastro
      const existingUser = users.find(u => u.email === email);
      if (existingUser) {
        toast.error('Email já cadastrado');
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
      toast.success('Cadastro realizado com sucesso!');
      navigate('/dashboard');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md animate-fade-in">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">LojinhaBoy</h1>
          <p className="text-muted-foreground">Gestão inteligente de empréstimos</p>
        </div>

        <Card className="apple-card">
          <CardHeader>
            <CardTitle>{isLogin ? 'Entrar' : 'Criar Conta'}</CardTitle>
            <CardDescription>
              {isLogin ? 'Entre com suas credenciais' : 'Crie sua conta para começar'}
            </CardDescription>
          </CardHeader>
          <CardContent>
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
                    className="rounded-xl"
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="rounded-xl"
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
                  className="rounded-xl"
                />
              </div>

              <Button type="submit" className="w-full apple-button">
                {isLogin ? 'Entrar' : 'Criar Conta'}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <button
                onClick={() => setIsLogin(!isLogin)}
                className="text-primary hover:text-primary-hover text-sm font-medium"
              >
                {isLogin ? 'Não tem conta? Cadastre-se' : 'Já tem conta? Entre'}
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Login;
