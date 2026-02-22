import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { ShoppingCart, FileSpreadsheet, CreditCard, Calculator, Lock } from '@/lib/icons';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { T } from '@/components/DualText';

const tabs = [
  { path: '/', icon: ShoppingCart, tKey: 'nav.purchase' },
  { path: '/summary', icon: FileSpreadsheet, tKey: 'nav.summary' },
  { path: '/payments', icon: CreditCard, tKey: 'nav.payments' },
  { path: '/settlement', icon: Calculator, tKey: 'nav.settlement' },
];

export default function AppLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { lock } = useAuth();
  const { hindiEnabled, toggleHindi } = useLanguage();

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-30 flex items-center justify-between border-b bg-card px-4 py-3">
        <T tKey="app.title" className="text-lg font-bold text-foreground tracking-tight" />
        <div className="flex items-center gap-2">
          <button
            onClick={toggleHindi}
            className={`px-2 py-1 text-xs rounded-md font-semibold border transition-colors ${
              hindiEnabled
                ? 'bg-primary/15 text-primary border-primary/30'
                : 'bg-muted text-muted-foreground border-border'
            }`}
            title={hindiEnabled ? 'Hindi ON' : 'Hindi OFF'}
          >
            अ/A
          </button>
          <button onClick={lock} className="p-2 rounded-lg text-muted-foreground hover:bg-muted transition-colors">
            <Lock className="h-4 w-4" />
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-auto pb-20">
        <Outlet />
      </main>

      <nav className="fixed bottom-0 left-0 right-0 z-30 border-t bg-card">
        <div className="flex">
          {tabs.map(({ path, icon: Icon, tKey }) => (
            <button
              key={path}
              onClick={() => navigate(path)}
              className={`flex flex-1 flex-col items-center gap-0.5 py-2.5 transition-colors ${
                isActive(path) ? 'text-primary' : 'text-muted-foreground'
              }`}
            >
              <Icon className="h-5 w-5" />
              <span className="text-[11px] font-medium"><T tKey={tKey} /></span>
            </button>
          ))}
        </div>
        <div className="h-safe-area-bottom" />
      </nav>
    </div>
  );
}
