import { ReactNode, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, Users, DollarSign, Bell, 
  MessageSquare, BarChart3, LogOut, Plus, Menu, WifiOff, Wifi
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { DarkModeToggle } from './DarkModeToggle';
import { useIsMobile } from '@/hooks/use-mobile';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from './ui/sheet';
import { useNotificacoes } from '@/hooks/useNotificacoes';
import { NavLink } from './NavLink';
import { cn } from '@/lib/utils';

const Layout = ({ children }: { children: ReactNode }) => {
  const { profile, signOut } = useAuth();
  const isMobile = useIsMobile();
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

  return (
    <div className="flex min-h-screen relative font-sans antialiased overflow-x-hidden">
      
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
          {/* ✅ HEADER: px-5 para respiro lateral de fintech */}
          <header className="sticky top-0 z-40 px-5 py-4 bg-background/60 backdrop-blur-3xl border-b border-white/10 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10 border-2 border-primary/20 shadow-lg">
                  <AvatarImage src={profile?.avatar_url || undefined} />
                  <AvatarFallback className="bg-primary text-white font-black">
                    {profile?.nome?.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col">
                  <span className={cn(
                    "text-[9px] font-black uppercase tracking-widest leading-none mb-1 flex items-center gap-1",
                    isOnline ? "text-emerald-500" : "text-destructive animate-pulse"
                  )}>
                    {isOnline ? <Wifi className="w-2 h-2" /> : <WifiOff className="w-2 h-2" />}
                    {isOnline ? "Online" : "Offline"}
                  </span>
                  <p className="font-black text-foreground text-sm tracking-tight">{profile?.nome?.split(' ')[0]}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <DarkModeToggle />
                <NavLink to="/notificacoes" className="relative p-2.5 rounded-2xl bg-secondary/40 backdrop-blur-lg border border-white/10 active:scale-95">
                  <Bell className={`w-5 h-5 ${unreadCount > 0 ? 'text-primary animate-pulse' : ''}`} />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-destructive text-[10px] font-black text-white ring-2 ring-background">
                      {unreadCount}
                    </span>
                  )}
                </NavLink>
              </div>
            </div>
          </header>

          {/* ✅ MAIN: px-5 lateral para valores altos (Safe Area) e pb-40 para respiro do dock */}
          <main className="flex-1 relative z-10 px-5 py-6 pb-40">{children}</main>

          {/* ✅ NAV: pb-10 para respeitar a área de gestos do sistema em telas mobile */}
          <nav className="fixed bottom-0 left-0 right-0 z-50 px-6 pb-10 pointer-events-none">
            <div className="flex items-center justify-around py-3 bg-card/70 backdrop-blur-3xl rounded-[2.5rem] border border-white/10 shadow-2xl pointer-events-auto">
              <NavTab to="/dashboard" icon={LayoutDashboard} label="Home" />
              <NavTab to="/relatorios" icon={BarChart3} label="Dados" />
              
              <NavLink to="/emprestimos" className="flex h-14 w-14 -mt-14 items-center justify-center rounded-full bg-gradient-to-tr from-primary to-primary-600 text-white shadow-xl shadow-primary/40 border-4 border-background active:scale-90 transition-transform">
                <Plus className="w-8 h-8" />
              </NavLink>

              <NavTab to="/cobranca" icon={MessageSquare} label="Cobrar" />
              
              <Sheet>
                <SheetTrigger asChild>
                  <button className="flex flex-col items-center gap-1 opacity-60 active:scale-90 transition-transform">
                    <Menu className="w-6 h-6" />
                  </button>
                </SheetTrigger>
                <SheetContent side="bottom" className="rounded-t-[3rem] bg-card/95 backdrop-blur-3xl border-t border-white/10 pb-12">
                  <SheetHeader className="mb-6">
                    <SheetTitle className="text-center font-black uppercase text-[10px] tracking-widest text-muted-foreground">Menu LojinhaBoy Pro</SheetTitle>
                  </SheetHeader>
                  <div className="grid grid-cols-1 gap-2">
                    {menuItems.map((item) => (
                      <NavLink 
                        key={item.path} 
                        to={item.path} 
                        activeClassName="bg-gradient-to-r from-primary to-primary-600 text-white shadow-lg"
                        className="flex items-center gap-4 p-4 rounded-3xl font-black text-sm uppercase transition-all hover:bg-secondary/50"
                      >
                        <item.icon className="w-5 h-5" /> {item.label}
                      </NavLink>
                    ))}
                    <button 
                      onClick={handleSignOut}
                      className="flex items-center gap-4 p-4 rounded-3xl font-black text-sm uppercase text-destructive border border-destructive/10 mt-4 active:bg-destructive/5"
                    >
                      <LogOut className="w-5 h-5" /> Sair do Sistema
                    </button>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </nav>
        </div>
      ) : (
        /* DESKTOP ASIDE: Sem alterações conforme pedido */
        <div className="flex w-full h-screen overflow-hidden">
          <aside className="w-72 bg-card/30 backdrop-blur-3xl border-r border-white/5 flex flex-col shadow-2xl z-20">
            <div className="p-8">
              <div className="flex items-center justify-between mb-8">
                <h1 className="text-2xl font-black tracking-tighter text-primary">LojinhaBoy<span className="text-foreground">Pro</span></h1>
                <DarkModeToggle />
              </div>
              
              <div className="flex items-center gap-4 p-4 rounded-[2rem] bg-secondary/30 border border-white/10 shadow-sm relative overflow-hidden group">
                <Avatar className="h-12 w-12 border-2 border-primary/20 transition-transform group-hover:scale-105">
                  <AvatarImage src={profile?.avatar_url || undefined} />
                  <AvatarFallback className="font-black bg-primary text-black">
                    {profile?.nome?.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-black truncate leading-none mb-1 text-foreground">{profile?.nome}</p>
                  <div className={cn(
                    "flex items-center gap-1 text-[9px] font-black uppercase tracking-widest transition-colors",
                    isOnline ? "text-emerald-500" : "text-destructive animate-pulse"
                  )}>
                    <span className="text-base leading-none">●</span> {isOnline ? "Online" : "Offline"}
                  </div>
                </div>
              </div>
            </div>

            <nav className="flex-1 px-4 space-y-2 overflow-y-auto custom-scrollbar">
              {menuItems.map((item) => (
                <NavLink 
                  key={item.path} 
                  to={item.path} 
                  activeClassName="bg-gradient-to-r from-primary to-primary-600 text-white shadow-xl shadow-primary/30 scale-[1.02]"
                  className="w-full flex items-center gap-4 px-6 py-4 rounded-[1.5rem] transition-all duration-300 font-black text-xs uppercase tracking-widest text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
                >
                  <item.icon className="w-5 h-5" />
                  <span>{item.label}</span>
                  {item.label === 'Notificações' && unreadCount > 0 && (
                    <span className="ml-auto bg-destructive text-white text-[10px] font-black px-2 py-0.5 rounded-full ring-2 ring-background">{unreadCount}</span>
                  )}
                </NavLink>
              ))}
            </nav>
            
            <div className="p-6 border-t border-white/5">
              <button 
                onClick={handleSignOut}
                className="w-full flex items-center gap-4 px-6 py-4 rounded-2xl text-destructive hover:bg-destructive/10 transition-all font-black text-xs uppercase tracking-widest border border-transparent hover:border-destructive/20 active:scale-95"
              >
                <LogOut className="w-5 h-5" /> Sair
              </button>
            </div>
          </aside>
          
          <main className="flex-1 overflow-auto p-8 lg:p-12 relative bg-gradient-to-br from-transparent to-primary/5">
            <div className="max-w-7xl mx-auto">
              {children}
            </div>
          </main>
        </div>
      )}
    </div>
  );
};

const NavTab = ({ to, icon: Icon, label }: any) => (
  <NavLink 
    to={to} 
    activeClassName="text-primary scale-110 opacity-100" 
    className="flex flex-col items-center gap-1 transition-all text-muted-foreground opacity-60 hover:opacity-100 active:scale-90"
  >
    <div className="p-1.5 rounded-xl"><Icon className="w-6 h-6" /></div>
    <span className="text-[8px] font-black uppercase tracking-tighter">{label}</span>
  </NavLink>
);

export default Layout;