import { ReactNode } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, Users, DollarSign, Bell, 
  MessageSquare, BarChart3, LogOut, User, Plus, Menu 
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { DarkModeToggle } from './DarkModeToggle';
import { useIsMobile } from '@/hooks/use-mobile';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from './ui/sheet';
import { useNotificacoes } from '@/hooks/useNotificacoes';

interface LayoutProps {
  children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { profile, signOut } = useAuth();
  const isMobile = useIsMobile();
  
  // 🛡️ Proteção notificações
  const notificacoes = useNotificacoes();
  const unreadCount = typeof notificacoes?.getUnreadCount === 'function' 
    ? Math.max(0, notificacoes.getUnreadCount() || 0)
    : 0;

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
    { icon: Users, label: 'Clientes', path: '/clientes' },
    { icon: DollarSign, label: 'Empréstimos', path: '/emprestimos' },
    { icon: Bell, label: 'Notificações', path: '/notificacoes' },
    { icon: MessageSquare, label: 'Cobrança', path: '/cobranca' },
    { icon: BarChart3, label: 'Relatórios', path: '/relatorios' },
  ];

  const getInitials = (nome: string) => {
    return nome.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  // 🖼️ MOBILE LAYOUT com BACKGROUND
  if (isMobile) {
    return (
      <div className="flex flex-col min-h-screen relative">
        {/* 🎨 BACKGROUND SUA CLASSE */}
        <div 
          className="fixed inset-0 -z-10 bg-login-pattern-custom"
          style={{
            backgroundSize: 'cover',
            backgroundPosition: 'center bottom',
            backgroundAttachment: 'fixed'
          }}
        />
        
        {/* Header */}
        <header className="sticky top-0 z-40 px-4 pt-safe pb-3 header-glass bg-background/95 backdrop-blur-xl border-b border-border/40 shadow-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10 ring-2 ring-primary/20 shadow-lg">
                <AvatarImage src={profile?.avatar_url || undefined} alt={profile?.nome} />
                <AvatarFallback className="bg-primary text-primary-foreground font-semibold text-sm">
                  {profile?.nome ? getInitials(profile.nome) : <User className="w-4 h-4" />}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col">
                <p className="text-[10px] text-muted-foreground leading-tight">Bem-vindo</p>
                <p className="font-semibold text-foreground text-sm leading-tight">{profile?.nome?.split(' ')[0] || 'Usuário'}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <DarkModeToggle />
              <button 
                onClick={() => navigate('/notificacoes')}
                className="relative p-2.5 rounded-xl glass-button bg-background/95 backdrop-blur-lg shadow-md hover:shadow-lg"
              >
                <Bell className="w-5 h-5 text-foreground" />
                {unreadCount > 0 && (
                  <span className="notification-badge">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </button>
            </div>
          </div>
        </header>

        {/* Main Content com Overlay */}
        <main className="flex-1 overflow-auto relative bg-gradient-to-t from-background/98 via-background/95 to-background/90 backdrop-blur-sm">
          <div className="px-4 py-4 pb-28 min-h-screen">
            {children}
          </div>
        </main>

        {/* Bottom Nav */}
        <nav className="bottom-nav pb-safe z-50">
          <div className="flex items-center justify-around px-2 py-3 bg-card/98 backdrop-blur-2xl rounded-t-3xl shadow-2xl border-t border-border/60">
            <button
              onClick={() => navigate('/dashboard')}
              className={`nav-item ${location.pathname === '/dashboard' ? 'nav-item-active' : 'text-muted-foreground'}`}
            >
              <LayoutDashboard className="w-5 h-5" />
              <span className="text-[10px] font-medium">Home</span>
            </button>

            <button
              onClick={() => navigate('/relatorios')}
              className={`nav-item ${location.pathname === '/relatorios' ? 'nav-item-active' : 'text-muted-foreground'}`}
            >
              <BarChart3 className="w-5 h-5" />
              <span className="text-[10px] font-medium">Analytics</span>
            </button>

            <button
              onClick={() => navigate('/emprestimos')}
              className="action-btn -mt-8 bg-gradient-to-r from-primary to-primary-500 shadow-2xl shadow-primary/30 hover:shadow-primary/50 active:scale-[0.96]"
            >
              <Plus className="w-6 h-6 text-primary-foreground" />
            </button>

            <button
              onClick={() => navigate('/cobranca')}
              className={`nav-item ${location.pathname === '/cobranca' ? 'nav-item-active' : 'text-muted-foreground'}`}
            >
              <MessageSquare className="w-5 h-5" />
              <span className="text-[10px] font-medium">Cobrança</span>
            </button>

            <Sheet>
              <SheetTrigger asChild>
                <button className="nav-item text-muted-foreground hover:text-foreground">
                  <Menu className="w-5 h-5" />
                  <span className="text-[10px] font-medium">Menu</span>
                </button>
              </SheetTrigger>
              <SheetContent side="bottom" className="rounded-t-3xl pb-safe bg-card/98 backdrop-blur-2xl border-t border-border/50">
                <SheetHeader className="pb-6">
                  <SheetTitle className="text-left font-bold text-lg">Navegação</SheetTitle>
                </SheetHeader>
                <div className="space-y-2">
                  {menuItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = location.pathname === item.path;
                    return (
                      <button
                        key={item.path}
                        onClick={() => navigate(item.path)}
                        className={`w-full flex items-center gap-4 px-4 py-4 rounded-2xl transition-all shadow-sm hover:shadow-md ${
                          isActive 
                            ? 'bg-primary text-primary-foreground shadow-primary/20' 
                            : 'text-foreground hover:bg-secondary/80'
                        }`}
                      >
                        <Icon className="w-5 h-5 flex-shrink-0" />
                        <span className="font-semibold">{item.label}</span>
                      </button>
                    );
                  })}
                  <div className="pt-4 border-t border-border/50 mt-4">
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-4 px-4 py-4 rounded-2xl text-destructive hover:bg-destructive/10 transition-all shadow-sm hover:shadow-md"
                    >
                      <LogOut className="w-5 h-5" />
                      <span className="font-semibold">Sair da Conta</span>
                    </button>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </nav>
      </div>
    );
  }

  // 🖼️ DESKTOP LAYOUT com BACKGROUND
  return (
    <div className="flex h-screen relative">
      {/* 🎨 BACKGROUND SUA CLASSE */}
      <div 
        className="fixed inset-0 -z-10 bg-login-pattern-custom"
        style={{
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundAttachment: 'fixed'
        }}
      />
      
      {/* Sidebar */}
      <aside className="w-64 bg-card/98 backdrop-blur-2xl border-r border-border/60 flex flex-col shadow-2xl shadow-black/10 relative z-10">
        <div className="p-6 border-b border-border/50">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-black bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text">
              Lojinha-Boy
            </h1>
            <DarkModeToggle />
          </div>
          
          <div className="flex items-center gap-4 p-4 rounded-2xl bg-gradient-to-r from-secondary/30 to-secondary/10 border border-border/40 shadow-inner">
            <Avatar className="h-12 w-12 ring-3 ring-primary/30 shadow-xl">
              <AvatarImage src={profile?.avatar_url || undefined} alt={profile?.nome} />
              <AvatarFallback className="bg-gradient-to-br from-primary to-primary-foreground text-primary-foreground font-bold text-lg flex items-center justify-center">
                {profile?.nome ? getInitials(profile.nome) : <User className="w-5 h-5" />}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-base font-black truncate mb-1">{profile?.nome || 'Usuário'}</p>
              <p className="text-sm text-muted-foreground truncate font-mono">{profile?.email}</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-6 space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all duration-300 shadow-sm hover:shadow-lg group ${
                  isActive
                    ? 'bg-gradient-to-r from-primary to-primary-500 text-primary-foreground shadow-primary/30 hover:shadow-primary/40' 
                    : 'text-foreground/80 hover:bg-gradient-to-r hover:from-secondary/50 hover:shadow-md bg-secondary/20'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-primary-foreground' : 'group-hover:text-primary'}`} />
                <span className="font-semibold text-sm flex-1 text-left">{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="p-6 border-t border-border/60">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-4 px-5 py-4 rounded-2xl text-destructive hover:bg-destructive/10 transition-all shadow-sm hover:shadow-md font-semibold"
          >
            <LogOut className="w-5 h-5" />
            <span>Sair da Conta</span>
          </button>
        </div>
      </aside>

      {/* Main Content com Overlay */}
      <main className="flex-1 overflow-auto relative bg-gradient-to-b from-background/95 via-background/92 to-background/98 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto p-8 lg:p-12 min-h-screen">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;
