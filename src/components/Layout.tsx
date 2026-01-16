import { ReactNode, useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, Users, DollarSign, Bell, 
  MessageSquare, BarChart3, LogOut, Plus, Menu, WifiOff, Wifi,
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

  const currentPage = menuItems.find(item => item.path === location.pathname)?.label || "Creditrack";

  return (
    <div className="flex min-h-screen relative font-sans antialiased overflow-x-hidden selection:bg-primary/30">
      
      {/* ✅ SEU BACKGROUND ORIGINAL PRESERVADO */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div 
          className="absolute inset-0 bg-login-pattern-custom bg-no-repeat bg-cover 
                     transition-all duration-700 ease-in-out bg-fixed
                     bg-[position:center_bottom] md:bg-center
                     opacity-[0.20] dark:opacity-[0.06]
                     brightness-110 contrast-125 saturate-50 dark:brightness-50 dark:contrast-150"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background via-transparent to-background opacity-90" />
      </div>

      {isMobile ? (
        <div className="flex flex-col w-full min-h-screen">
          <header className="sticky top-0 z-40 px-5 py-4 bg-background/60 backdrop-blur-3xl border-b border-white/10 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Avatar className="h-10 w-10 border-2 border-primary/20 shadow-lg">
                    <AvatarImage src={profile?.avatar_url || undefined} />
                    <AvatarFallback className="bg-primary text-white font-black">
                      {profile?.nome?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className={cn(
                    "absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-background shadow-sm",
                    isOnline ? "bg-emerald-500" : "bg-destructive animate-pulse"
                  )} />
                </div>
                <div className="flex flex-col">
                  <div className="flex items-center gap-1.5">
                    <img src="/src/components/icons/fav-icon.svg" className="w-3.5 h-3.5" alt="logo" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-primary leading-none">
                      Gestão LojinhaBoy
                    </span>
                  </div>
                  <p className="font-black text-foreground text-sm tracking-tight leading-none mt-1 uppercase">
                    {profile?.nome?.split(' ')[0] || "Renato"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <DarkModeToggle />
                <NavLink to="/notificacoes" className="relative p-2.5 rounded-2xl bg-secondary/40 backdrop-blur-lg border border-white/10 active:scale-95">
                  <Bell className={cn("w-5 h-5 transition-colors", unreadCount > 0 ? 'text-primary' : 'text-muted-foreground')} />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-destructive text-[10px] font-black text-white ring-2 ring-background">
                      {unreadCount}
                    </span>
                  )}
                </NavLink>
              </div>
            </div>
          </header>

          <main className="flex-1 relative z-10 px-5 py-6 pb-44">
            <h2 className="text-2xl font-black tracking-tighter uppercase mb-6 opacity-80">{currentPage}</h2>
            {children}
          </main>

          <nav className="fixed bottom-0 left-0 right-0 z-50 px-6 pb-10 pointer-events-none">
            <div className="flex items-center justify-around py-3 bg-card/70 backdrop-blur-3xl rounded-[2.5rem] border border-white/10 shadow-2xl pointer-events-auto ring-1 ring-white/5">
              <NavTab to="/dashboard" icon={LayoutDashboard} label="Home" />
              <NavTab to="/relatorios" icon={BarChart3} label="Dados" />
              <NavLink to="/emprestimos" className="flex h-14 w-14 -mt-14 items-center justify-center rounded-full bg-gradient-to-tr from-primary to-primary-600 text-white shadow-xl shadow-primary/40 border-4 border-background active:scale-90 transition-all">
                <Plus className="w-8 h-8 stroke-[3]" />
              </NavLink>
              <NavTab to="/cobranca" icon={MessageSquare} label="Cobrar" />
              <Sheet>
                <SheetTrigger asChild>
                  <button className="flex flex-col items-center gap-1 opacity-60 active:scale-90 transition-all p-1">
                    <Menu className="w-6 h-6" />
                    <span className="text-[8px] font-black uppercase tracking-tighter">Menu</span>
                  </button>
                </SheetTrigger>
                <SheetContent side="bottom" className="rounded-t-[3rem] bg-card/95 backdrop-blur-3xl border-t border-white/10 pb-12 outline-none">
                  <SheetHeader className="mb-6">
                    <div className="w-12 h-1.5 bg-muted rounded-full mx-auto mb-4" />
                    <SheetTitle className="text-center font-black uppercase text-[10px] tracking-[0.4em] text-primary">Creditrack Engine</SheetTitle>
                  </SheetHeader>
                  <div className="grid grid-cols-1 gap-2">
                    {menuItems.map((item) => (
                      <NavLink key={item.path} to={item.path} activeClassName="bg-primary text-black shadow-lg" className="flex items-center justify-between p-4 rounded-3xl font-black text-sm uppercase transition-all hover:bg-secondary/50 group">
                        <div className="flex items-center gap-4"><item.icon className="w-5 h-5" /> {item.label}</div>
                        <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-40 transition-all" />
                      </NavLink>
                    ))}
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </nav>
        </div>
      ) : (
        /* ✅ DESKTOP: Layout de Elite com Alinhamento Suíço */
        <div className="flex w-full h-screen overflow-hidden">
          <aside className="w-72 bg-card/30 backdrop-blur-3xl border-r border-white/5 flex flex-col shadow-2xl z-20">
            <div className="p-8 pb-4">
              {/* Branding Section */}
              <div className="flex items-center justify-between mb-10 px-1">
                <div className="flex items-center gap-3.5">
                  <img src="/src/components/icons/fav-icon.svg" className="w-9 h-9 drop-shadow-[0_0_10px_rgba(var(--primary),0.3)]" alt="logo" />
                  <div className="flex flex-col">
                    <h1 className="text-xl font-black tracking-tighter leading-none text-foreground uppercase italic">
                      Credi<span className="text-primary">track</span>
                    </h1>
                    <span className="text-[9px] font-black uppercase tracking-[0.2em] text-primary/70 mt-1">
                      Gestão LojinhaBoy
                    </span>
                  </div>
                </div>
                <DarkModeToggle />
              </div>
              
              {/* ✅ USER CARD REFINADO (Operador) */}
              <div className="flex items-center gap-4 p-5 rounded-[2.2rem] bg-white/5 border border-white/5 shadow-inner relative overflow-hidden group transition-all hover:bg-white/10 hover:border-primary/20">
                <div className="relative">
                  <Avatar className="h-12 w-12 border-2 border-primary/30 transition-transform group-hover:scale-110 duration-500">
                    <AvatarImage src={profile?.avatar_url || undefined} />
                    <AvatarFallback className="font-black bg-primary text-black">
                      {profile?.nome?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className={cn(
                    "absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-background",
                    isOnline ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]" : "bg-destructive"
                  )} />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-[9px] font-black text-primary uppercase tracking-[0.15em] mb-0.5 opacity-80">Operador</span>
                  <p className="text-[13px] font-black truncate text-foreground leading-tight uppercase">
                    {profile?.nome || "Renato Filho"}
                  </p>
                  <p className="text-[10px] font-bold text-muted-foreground mt-1">
                    {isOnline ? "Sinal Estável" : "Sinal Perdido"}
                  </p>
                </div>
              </div>
            </div>

            {/* Navigation Section */}
            <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto custom-scrollbar">
              {menuItems.map((item) => (
                <NavLink 
                  key={item.path} 
                  to={item.path} 
                  activeClassName="bg-gradient-to-r from-primary/20 to-transparent border-l-4 border-primary text-foreground shadow-sm"
                  className="w-full flex items-center gap-4 px-6 py-3.5 rounded-xl transition-all duration-300 font-black text-[11px] uppercase tracking-widest text-muted-foreground hover:bg-white/5 hover:text-foreground group border-l-4 border-transparent"
                >
                  <item.icon className="w-5 h-5 group-hover:scale-110 transition-transform duration-300" />
                  <span className="pt-0.5">{item.label}</span>
                </NavLink>
              ))}
            </nav>
            
            <div className="p-6 border-t border-white/5">
              <button 
                onClick={handleSignOut}
                className="w-full flex items-center gap-4 px-6 py-4 rounded-2xl text-destructive/80 hover:text-destructive hover:bg-destructive/5 transition-all font-black text-[10px] uppercase tracking-widest group active:scale-95"
              >
                <LogOut className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> 
                <span>Sair do Terminal</span>
              </button>
            </div>
          </aside>
          
          <main className="flex-1 overflow-auto p-8 lg:p-12 relative">
            {/* Page Header */}
            <div className="max-w-7xl mx-auto flex items-end justify-between mb-10 pb-6 border-b border-white/5">
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2 mb-1">
                   <div className="w-2 h-2 bg-primary rounded-full" />
                   <span className="text-[10px] font-black text-primary uppercase tracking-[0.4em]">Monitoramento Real-time</span>
                </div>
                <h2 className="text-5xl font-black tracking-tighter uppercase text-foreground leading-none">
                  {currentPage}
                </h2>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-3 px-5 py-2.5 rounded-2xl bg-card/40 backdrop-blur-xl border border-white/5 shadow-sm">
                  <ShieldCheck className="w-5 h-5 text-emerald-500" />
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black uppercase tracking-widest leading-none">Status</span>
                    <span className="text-[9px] font-bold text-emerald-500/80 uppercase">Protegido</span>
                  </div>
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

const NavTab = ({ to, icon: Icon, label }: any) => (
  <NavLink 
    to={to} 
    activeClassName="text-primary scale-105 opacity-100" 
    className="flex flex-col items-center gap-1 transition-all text-muted-foreground opacity-60 hover:opacity-100 active:scale-90 p-1 group"
  >
    <div className="p-1 rounded-xl transition-colors group-hover:bg-primary/10">
      <Icon className="w-6 h-6 stroke-[2.5]" />
    </div>
    <span className="text-[9px] font-black uppercase tracking-tighter">{label}</span>
  </NavLink>
);

export default Layout;