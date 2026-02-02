import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { 
  GraduationCap, 
  Home, 
  BookOpen, 
  CreditCard as FlashcardIcon, 
  CheckSquare, 
  Settings, 
  LogOut,
  Crown,
  Sparkles,
  Menu,
  X,
  User,
  PenTool,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface AppLayoutProps {
  children: React.ReactNode;
  title?: string;
}

export function AppLayout({ children, title }: AppLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, signOut, isPremium, dailyUsage, maxFreeUsage } = useAuth();

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  const navItems = [
    { icon: Home, label: "Home", path: "/dashboard", isFree: true },
    { icon: PenTool, label: "Whiteboard", path: "/whiteboard", isFree: true },
    { icon: BookOpen, label: "Notes", path: "/notes", isFree: false },
    { icon: FlashcardIcon, label: "Flashcards", path: "/flashcards", isFree: false },
    { icon: CheckSquare, label: "Tasks", path: "/tasks", isFree: false },
    { icon: Settings, label: "Settings", path: "/settings", isFree: false },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside 
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 bg-sidebar border-r border-sidebar-border transition-transform duration-300 lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex flex-col h-full p-4">
          {/* Logo */}
          <div className="flex items-center gap-3 px-2 mb-8">
            <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-bold text-xl text-sidebar-foreground">StudyCap</span>
            <button 
              onClick={() => setSidebarOpen(false)}
              className="ml-auto lg:hidden text-sidebar-foreground"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Usage Counter */}
          <Card className="p-4 mb-6 gradient-card">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-foreground">Daily Usage</span>
              {isPremium && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full gradient-accent text-xs font-semibold text-accent-foreground">
                  <Crown className="w-3 h-3" />
                  Premium
                </span>
              )}
            </div>
            <div className="text-2xl font-bold text-foreground">
              {isPremium ? (
                <span className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-accent" />
                  Unlimited
                </span>
              ) : (
                <span>{dailyUsage}/{maxFreeUsage}</span>
              )}
            </div>
            {!isPremium && (
              <div className="mt-2">
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full gradient-primary transition-all duration-300"
                    style={{ width: `${(dailyUsage / maxFreeUsage) * 100}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  {maxFreeUsage - dailyUsage} questions remaining today
                </p>
              </div>
            )}
          </Card>

          {/* Navigation */}
          <nav className="flex-1 space-y-1">
            {navItems.map((item) => (
              <button
                key={item.label}
                onClick={() => navigate(item.path)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                  isActive(item.path)
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : item.isFree
                    ? "bg-primary/10 text-sidebar-foreground hover:bg-primary/20"
                    : "text-sidebar-foreground hover:bg-sidebar-accent/50"
                )}
              >
                <item.icon className="w-5 h-5" />
                {item.label}
              </button>
            ))}
          </nav>

          {/* Upgrade Button (for free users) */}
          {!isPremium && (
            <Button 
              variant="accent" 
              className="w-full mb-4"
              onClick={() => window.location.href = `https://buy.stripe.com/test_28EaEXdh7dr11y87olcV200?prefilled_email=${encodeURIComponent(user?.email || '')}`}
            >
              <Crown className="w-4 h-4" />
              Upgrade to Premium
            </Button>
          )}

          {/* User & Logout */}
          <div className="border-t border-sidebar-border pt-4">
            <div className="flex items-center gap-3 px-2 mb-3">
              <div className="w-8 h-8 rounded-full bg-sidebar-accent flex items-center justify-center">
                <User className="w-4 h-4 text-sidebar-accent-foreground" />
              </div>
              <span className="text-sm text-sidebar-foreground truncate flex-1">
                {user?.email}
              </span>
            </div>
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-sidebar-foreground hover:bg-sidebar-accent/50 transition-colors"
            >
              <LogOut className="w-5 h-5" />
              Sign out
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className={cn("flex-1 flex flex-col min-h-screen transition-all duration-300", sidebarOpen && "lg:ml-64")}>
        {/* Mobile Header */}
        <header className="lg:hidden h-14 border-b border-border flex items-center px-4">
          <button onClick={() => setSidebarOpen(true)} className="text-foreground">
            <Menu className="w-6 h-6" />
          </button>
          <span className="ml-4 font-semibold">{title || "StudyCap"}</span>
        </header>

        {children}
      </main>

      {/* Overlay for mobile sidebar */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}
