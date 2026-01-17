import { ReactNode, useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, Users, DollarSign, Bell, 
  MessageSquare, BarChart3, LogOut, Plus, Menu, 
  ChevronRight, ShieldCheck
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { DarkModeToggle } from './DarkModeToggle';
import { useIsMobile } from '@/hooks/use-mobile';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from './ui/sheet';
import { useNotificacoes } from '@/hooks/useNotificacoes';
import { NavLink } from './NavLink';
import { InstallPrompt } from './InstallPrompt';
import { cn } from '@/lib/utils';

// ✅ IMPORTAÇÕES CORRETAS DOS ÍCONES E ASSETS
import mascoteOk from '@/components/icons/mascote-cartao.svg';
import logoIcon from '@/components/icons/fav-icon.svg'; // Importação do seu ícone de logo

const Layout = ({ children }: { children: ReactNode }) => {
  const { profile, signOut } = useAuth();
  const isMobile = useIsMobile();
  const location = useLocation();
  const { getUnreadCount } = useNotificacoes();
  const unreadCount = typeof getUnreadCount === 'function' ? getUnreadCount() : 0;

  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const updateStatus = () => setIsOnline(navigator.onLine);
    window.addEventListener('online', updateStatus);
    window.addEventListener('offline', updateStatus);
    return () => {
      window.removeEventListener('online', updateStatus);
      window.removeEventListener('offline', updateStatus);
    };
  }, []);

  const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
    { icon: Users, label: 'Clientes', path: '/clientes' },
    { icon: DollarSign, label: 'Empréstimos', path: '/emprestimos' },
    { icon: Bell, label: 'Notificações', path: '/notificacoes' },
    { icon: MessageSquare, label: 'Cobrança', path: '/cobranca' },
    { icon: BarChart3, label: 'Relatórios', path: '/relatorios' },
  ];

  const handleSignOut = useCallback(async () => {
    await signOut();
  }, [signOut]);

  const currentPage = menuItems.find(item => item.path === location.pathname)?.label || "CrediTrack";

  return (
    <div className="flex min-h-screen relative font-sans antialiased overflow-x-hidden selection:bg-primary/30">
      
      {/* ✅ BACKGROUND: VISÍVEL, SEM REPETIÇÃO E SEM EFEITOS NO MOBILE */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div 
          className={cn(
            "absolute inset-0 bg-login-pattern-custom transition-all duration-700 ease-in-out bg-fixed",
            "bg-no-repeat bg-cover bg-center", // Garante imagem única e centralizada
            isMobile ? "opacity-90" : "opacity-[0.20] dark:opacity-[0.06]"
          )}
          style={isMobile ? { filter: 'none', mixBlendMode: 'normal' } : {}}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/10 via-transparent to-background/40" />
      </div>

      {isMobile ? (
        <div className="flex flex-col w-full min-h-screen">
          {/* HEADER MOBILE */}
          <header className="sticky top-0 z-40 px-4 py-3.5 bg-background/60 backdrop-blur-3xl border-b border-white/5">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-3 min-w-0">
                <div className="relative shrink-0">
                  <Avatar className="h-10 w-10 border-2 border-primary/20 shadow-lg">
                    <AvatarImage src={profile?.avatar_url || undefined} />
                    <AvatarFallback className="bg-primary text-black font-black uppercase">
                      {profile?.nome?.charAt(0) || "R"}
                    </AvatarFallback>
                  </Avatar>
                  <span className={cn(
                    "absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-background shadow-sm",
                    isOnline ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]" : "bg-destructive animate-pulse"
                  )} />
                </div>
                <div className="flex flex-col min-w-0">
                  {/* ✅ BRANDING ATUALIZADO NO MOBILE */}
                  <h1 className="font-black text-foreground text-[14px] tracking-tighter uppercase leading-none italic">
                    Credi<span className="text-primary">Track</span>
                  </h1>
                  <span className="text-[8px] font-bold uppercase tracking-widest text-muted-foreground mt-0.5">
                    Gestão LojinhaBoy
                  </span>
                </div>
              </div>
              
              <div className="flex items-center gap-1.5 shrink-0">
                <DarkModeToggle />
                <NavLink to="/notificacoes" className="relative p-2.5 rounded-xl bg-secondary/40 border border-white/5 active:scale-95">
                  <Bell className={cn("w-5 h-5 transition-colors", unreadCount > 0 ? 'text-primary' : 'text-muted-foreground')} />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-4.5 min-w-[18px] items-center justify-center rounded-full bg-destructive text-[9px] font-black text-white ring-2 ring-background">
                      {unreadCount}
                    </span>
                  )}
                </NavLink>
              </div>
            </div>
          </header>

          <main className="flex-1 relative z-10 px-4 py-6 pb-40">
            <div className="flex items-center gap-2 mb-6 opacity-40">
               <div className="h-px bg-foreground/20 flex-1" />
               <h2 className="text-[10px] font-black tracking-[0.4em] uppercase whitespace-nowrap">{currentPage}</h2>
               <div className="h-px bg-foreground/20 flex-1" />
            </div>
            {children}
          </main>

          {/* ✅ NAVEGAÇÃO BOTTOM COM BACKGROUND ADICIONADO */}
          <nav className="fixed bottom-0 left-0 right-0 z-50 px-5 pb-8 pointer-events-none">
            <div className="flex items-center justify-around py-3 bg-background/90 backdrop-blur-2xl rounded-[2.5rem] border border-white/10 shadow-[0_-10px_40px_rgba(0,0,0,0.5)] pointer-events-auto ring-1 ring-white/5">
              <NavTab to="/dashboard" icon={LayoutDashboard} label="Início" />
              <NavTab to="/relatorios" icon={BarChart3} label="Dados" />
              
              <NavLink to="/emprestimos" className="flex h-14 w-14 -mt-14 items-center justify-center rounded-full bg-primary text-black shadow-2xl shadow-primary/40 border-4 border-background active:scale-90 transition-all">
                <Plus className="w-8 h-8 stroke-[3]" />
              </NavLink>
              
              <NavTab to="/cobranca" icon={MessageSquare} label="Cobrar" />
              
              <Sheet>
                <SheetTrigger asChild>
                  <button className="flex flex-col items-center gap-1 opacity-50 active:scale-90 p-1">
                    <Menu className="w-6 h-6" />
                    <span className="text-[8px] font-black uppercase">Menu</span>
                  </button>
                </SheetTrigger>
                <SheetContent side="bottom" className="rounded-t-[2.5rem] bg-card/95 backdrop-blur-3xl border-t border-white/10 pb-10 outline-none overflow-hidden">
                  <div className="absolute -right-10 -bottom-10 opacity-[0.03] rotate-12">
                     <img src={mascoteOk} className="w-48 h-48" alt="Shark" />
                  </div>
                  <SheetHeader className="mb-6">
                    <div className="w-12 h-1.5 bg-muted/30 rounded-full mx-auto mb-4" />
                    <SheetTitle className="text-center font-black uppercase text-[10px] tracking-[0.4em] text-primary">CrediTrack Engine</SheetTitle>
                  </SheetHeader>
                  <div className="grid grid-cols-1 gap-2 relative z-10">
                    {menuItems.map((item) => (
                      <NavLink key={item.path} to={item.path} activeClassName="bg-primary text-black shadow-lg" className="flex items-center justify-between p-4 rounded-2xl font-black text-sm uppercase transition-all hover:bg-secondary/50 group">
                        <div className="flex items-center gap-4"><item.icon className="w-5 h-5" /> {item.label}</div>
                        <ChevronRight className="w-4 h-4 opacity-20 group-hover:opacity-100 transition-all" />
                      </NavLink>
                    ))}
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </nav>
        </div>
      ) : (
        /* ✅ DESKTOP ELITE */
        <div className="flex w-full h-screen overflow-hidden">
          <aside className="w-72 bg-card/30 backdrop-blur-3xl border-r border-white/5 flex flex-col shadow-2xl z-20">
            <div className="p-8 pb-4">
              <div className="flex items-center justify-between mb-10 px-1">
                <div className="flex items-center gap-3">
                  {/* ✅ ÍCONE CORRIGIDO AQUI */}
                  <img src={logoIcon} className="w-9 h-9 drop-shadow-[0_0_10px_rgba(var(--primary),0.3)]" alt="logo" />
                  <div className="flex flex-col">
                    <h1 className="text-xl font-black tracking-tighter leading-none text-foreground uppercase italic">
                      Credi<span className="text-primary">Track</span>
                    </h1>
                    <span className="text-[9px] font-black uppercase tracking-[0.2em] text-primary/60 mt-1">
                      Gestão LojinhaBoy
                    </span>
                  </div>
                </div>
                <DarkModeToggle />
              </div>
              
              <div className="flex items-center gap-4 p-5 rounded-[2rem] bg-white/[0.03] border border-white/5 relative overflow-hidden group transition-all hover:bg-white/[0.06] hover:border-primary/20">
                <img src={mascoteOk} className="absolute -right-4 -bottom-4 w-16 h-16 opacity-[0.02] grayscale group-hover:grayscale-0 transition-all duration-700" alt="Mascote" />
                <div className="relative shrink-0">
                  <Avatar className="h-11 w-11 border-2 border-primary/30">
                    <AvatarImage src={profile?.avatar_url || undefined} />
                    <AvatarFallback className="font-black bg-primary text-black">
                      {profile?.nome?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className={cn(
                    "absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-background",
                    isOnline ? "bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" : "bg-destructive"
                  )} />
                </div>
                <div className="flex flex-col min-w-0 relative z-10">
                  <span className="text-[8px] font-black text-primary uppercase tracking-widest opacity-80">Operador</span>
                  <p className="text-[13px] font-black truncate text-foreground leading-tight uppercase">
                    {profile?.nome || "Shark Admin"}
                  </p>
                  <p className="text-[9px] font-bold text-muted-foreground mt-0.5">
                    {isOnline ? "Terminal Online" : "Sinal Perdido"}
                  </p>
                </div>
              </div>
            </div>

            <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto custom-scrollbar">
              {menuItems.map((item) => (
                <NavLink 
                  key={item.path} 
                  to={item.path} 
                  activeClassName="bg-gradient-to-r from-primary/15 to-transparent border-l-4 border-primary text-foreground"
                  className="w-full flex items-center gap-4 px-6 py-3.5 rounded-xl transition-all duration-300 font-black text-[11px] uppercase tracking-widest text-muted-foreground hover:bg-white/5 hover:text-foreground group border-l-4 border-transparent"
                >
                  <item.icon className="w-5 h-5 group-hover:scale-110 transition-transform duration-300" />
                  <span>{item.label}</span>
                </NavLink>
              ))}
            </nav>
            
            <div className="p-6 border-t border-white/5">
              <button 
                onClick={handleSignOut}
                className="w-full flex items-center gap-4 px-6 py-4 rounded-xl text-destructive/60 hover:text-destructive hover:bg-destructive/5 transition-all font-black text-[10px] uppercase tracking-widest group"
              >
                <LogOut className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> 
                <span>Sair do Sistema</span>
              </button>
            </div>
          </aside>
          
          <main className="flex-1 overflow-auto p-8 lg:p-12 relative">
            <div className="max-w-7xl mx-auto flex items-end justify-between mb-10 pb-6 border-b border-white/5">
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center gap-2">
                   <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                   <span className="text-[9px] font-black text-primary uppercase tracking-[0.4em]">Real-time Auditor</span>
                </div>
                <h2 className="text-5xl font-black tracking-tighter uppercase text-foreground leading-none">
                  {currentPage}
                </h2>
              </div>
              
              <div className="px-5 py-2.5 rounded-2xl bg-card/40 backdrop-blur-xl border border-white/5 flex items-center gap-3">
                <ShieldCheck className="w-5 h-5 text-emerald-500" />
                <div className="flex flex-col">
                  <span className="text-[10px] font-black uppercase tracking-widest">Sessão</span>
                  <span className="text-[9px] font-bold text-emerald-500/80 uppercase">Protegida</span>
                </div>
              </div>
            </div>

            <div className="max-w-7xl mx-auto">
              {children}
            </div>
          </main>
        </div>
      )}
      
      <InstallPrompt />
    </div>
  );
};

// ✅ COMPONENTE DE ABA COM SELEÇÃO NEON FUNCIONAL
const NavTab = ({ to, icon: Icon, label }: any) => {
  const location = useLocation();
  const isActive = location.pathname === to;

  return (
    <NavLink 
      to={to} 
      className={cn(
        "flex flex-col items-center gap-1 transition-all duration-300 p-1 group",
        isActive 
          ? "text-primary opacity-100 scale-105" 
          : "text-muted-foreground opacity-40 hover:opacity-100"
      )}
    >
      <div className={cn(
        "p-1.5 rounded-xl transition-all duration-300",
        isActive 
          ? "bg-primary/20 shadow-[0_0_15px_rgba(var(--primary),0.35)] ring-1 ring-primary/30" 
          : "group-hover:bg-primary/5"
      )}>
        <Icon className="w-6 h-6 stroke-[2.5]" />
      </div>
      <span className="text-[8px] font-black uppercase tracking-tighter">{label}</span>
    </NavLink>
  );
};

export default Layout;