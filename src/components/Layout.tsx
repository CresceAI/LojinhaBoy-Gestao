import { ReactNode } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  DollarSign, 
  Bell, 
  MessageSquare, 
  BarChart3, 
  LogOut, 
  User,
  Plus,
  Menu,
  Settings,
  FileText
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from './ui/button';
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
  const { getUnreadCount } = useNotificacoes();

  const unreadCount = getUnreadCount();

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

  // Mobile Layout
  if (isMobile) {
    return (
      <div className="flex flex-col min-h-screen bg-background">
        {/* Header - Liquid Glass */}
        <header className="sticky top-0 z-40 px-4 pt-safe pb-3 header-glass">
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
                className="relative p-2.5 rounded-xl glass-button"
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

        {/* Main Content */}
        <main className="flex-1 overflow-auto">
          <div className="px-4 py-4 pb-28">
            {children}
          </div>
        </main>

        {/* Bottom Navigation - Floating Liquid Glass */}
        <nav className="bottom-nav pb-safe">
          <div className="flex items-center justify-around px-2 py-3">
            {/* Home */}
            <button
              onClick={() => navigate('/dashboard')}
              className={`nav-item ${location.pathname === '/dashboard' ? 'nav-item-active' : 'text-muted-foreground'}`}
            >
              <LayoutDashboard className="w-5 h-5" />
              <span className="text-[10px] font-medium">Home</span>
            </button>

            {/* Analytics */}
            <button
              onClick={() => navigate('/relatorios')}
              className={`nav-item ${location.pathname === '/relatorios' ? 'nav-item-active' : 'text-muted-foreground'}`}
            >
              <BarChart3 className="w-5 h-5" />
              <span className="text-[10px] font-medium">Analytics</span>
            </button>

            {/* Central Action Button - Elevated */}
            <button
              onClick={() => navigate('/emprestimos')}
              className="action-btn -mt-8"
            >
              <Plus className="w-6 h-6 text-primary-foreground" />
            </button>

            {/* Cobrança */}
            <button
              onClick={() => navigate('/cobranca')}
              className={`nav-item ${location.pathname === '/cobranca' ? 'nav-item-active' : 'text-muted-foreground'}`}
            >
              <MessageSquare className="w-5 h-5" />
              <span className="text-[10px] font-medium">Cobrança</span>
            </button>

            {/* Menu Sheet */}
            <Sheet>
              <SheetTrigger asChild>
                <button className="nav-item text-muted-foreground">
                  <Menu className="w-5 h-5" />
                  <span className="text-[10px] font-medium">Menu</span>
                </button>
              </SheetTrigger>
              <SheetContent side="bottom" className="rounded-t-3xl pb-safe">
                <SheetHeader className="pb-4">
                  <SheetTitle className="text-left">Menu</SheetTitle>
                </SheetHeader>
                <div className="space-y-1">
                  {menuItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = location.pathname === item.path;
                    return (
                      <button
                        key={item.path}
                        onClick={() => navigate(item.path)}
                        className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all ${
                          isActive 
                            ? 'bg-primary text-primary-foreground' 
                            : 'text-foreground hover:bg-secondary'
                        }`}
                      >
                        <Icon className="w-5 h-5" />
                        <span className="font-medium">{item.label}</span>
                      </button>
                    );
                  })}
                  <div className="pt-4 border-t border-border mt-4">
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl text-destructive hover:bg-destructive/10 transition-all"
                    >
                      <LogOut className="w-5 h-5" />
                      <span className="font-medium">Sair</span>
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

  // Desktop Layout
  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <aside className="w-64 bg-card border-r border-border flex flex-col">
        <div className="p-6 border-b border-border">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-bold text-foreground">Lojinha-Boy</h1>
            <DarkModeToggle />
          </div>
          
          {/* User Profile */}
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10 ring-2 ring-primary/20">
              <AvatarImage src={profile?.avatar_url || undefined} alt={profile?.nome} />
              <AvatarFallback className="bg-primary text-primary-foreground font-semibold">
                {profile?.nome ? getInitials(profile.nome) : <User className="w-4 h-4" />}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{profile?.nome || 'Usuário'}</p>
              <p className="text-xs text-muted-foreground truncate">{profile?.email}</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                  isActive
                    ? 'bg-primary text-primary-foreground shadow-md'
                    : 'text-foreground hover:bg-secondary'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-border">
          <Button
            variant="ghost"
            onClick={handleLogout}
            className="w-full justify-start gap-3 text-destructive hover:bg-destructive/10"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium">Sair</span>
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <div className="max-w-7xl mx-auto p-8">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;
