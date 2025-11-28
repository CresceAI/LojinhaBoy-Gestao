import { ReactNode } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, DollarSign, Bell, MessageSquare, BarChart3, LogOut } from 'lucide-react';
import { getCurrentUser, setCurrentUser } from '@/utils/storage';
import { Button } from './ui/button';
import { DarkModeToggle } from './DarkModeToggle';
import { useIsMobile } from '@/hooks/use-mobile';

interface LayoutProps {
  children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const user = getCurrentUser();
  const isMobile = useIsMobile();

  const handleLogout = () => {
    setCurrentUser(null);
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

  // Mobile Layout
  if (isMobile) {
    return (
      <div className="flex flex-col h-screen bg-background">
        {/* Main Content */}
        <main className="flex-1 overflow-auto pb-20">
          <div className="p-4">
            {children}
          </div>
        </main>

        {/* Bottom Navigation */}
        <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border z-50">
          <div className="grid grid-cols-3 gap-1 p-2">
            {[
              { icon: DollarSign, label: 'Empréstimos', path: '/emprestimos' },
              { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
              { icon: MessageSquare, label: 'Cobrança', path: '/cobranca' },
            ].map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              
              return (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className={`flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-all duration-200 ${
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-xs font-medium">{item.label}</span>
                </button>
              );
            })}
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
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-xl font-semibold text-foreground">Lojinha-Boy</h1>
            <DarkModeToggle />
          </div>
          <p className="text-sm text-muted-foreground mt-1">{user?.name}</p>
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
