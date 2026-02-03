import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { 
  GraduationCap, 
  Home, 
  BookOpen, 
  CreditCard as FlashcardIcon, 
  CheckSquare, 
  Settings, 
  LogOut,
  Send,
  Crown,
  Sparkles,
  Loader2,
  Menu,
  X,
  User,
  Brain,
  Target,
  Clock,
  PenTool,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import ReactMarkdown from "react-markdown";

type Message = {
  role: "user" | "assistant";
  content: string;
};

export default function Dashboard() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const navigate = useNavigate();
  const { user, signOut, isPremium, dailyUsage, maxFreeUsage, incrementUsage } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (!user) {
      navigate('/auth');
    }
  }, [user, navigate]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const canSendMessage = isPremium || dailyUsage < maxFreeUsage;

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    if (!canSendMessage) {
      toast({
        variant: "destructive",
        title: "Daily limit reached",
        description: "You've used all 15 free questions today. Upgrade to Premium for unlimited access!",
      });
      return;
    }

    const userMessage: Message = { role: "user", content: input.trim() };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    if (!isPremium) {
      incrementUsage();
    }

    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/study-chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          messages: [...messages, userMessage],
          isPremium,
        }),
      });

      if (response.status === 429) {
        toast({
          variant: "destructive",
          title: "Rate limited",
          description: "Too many requests. Please try again in a moment.",
        });
        setIsLoading(false);
        return;
      }

      if (response.status === 402) {
        toast({
          variant: "destructive",
          title: "Credits required",
          description: "Please add credits to continue using the AI features.",
        });
        setIsLoading(false);
        return;
      }

      if (!response.ok || !response.body) {
        throw new Error("Failed to get response");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let assistantContent = "";

      setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const jsonStr = line.slice(6).trim();
            if (jsonStr === "[DONE]") continue;
            try {
              const parsed = JSON.parse(jsonStr);
              const content = parsed.choices?.[0]?.delta?.content;
              if (content) {
                assistantContent += content;
                setMessages((prev) => {
                  const updated = [...prev];
                  updated[updated.length - 1] = { role: "assistant", content: assistantContent };
                  return updated;
                });
              }
            } catch {
              // Ignore parse errors for incomplete chunks
            }
          }
        }
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to get a response. Please try again.",
      });
      setMessages((prev) => prev.slice(0, -1)); // Remove the empty assistant message
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  const navItems = [
    { icon: Home, label: "Home", path: "/dashboard", active: true, isFree: true },
    { icon: PenTool, label: "Whiteboard", path: "/whiteboard", active: false, isFree: true },
    { icon: Target, label: "Study Planner", path: "/study-planner", active: false, isFree: false },
    { icon: BookOpen, label: "Notes", path: "/notes", active: false, isFree: false },
    { icon: FlashcardIcon, label: "Flashcards", path: "/flashcards", active: false, isFree: false },
    { icon: CheckSquare, label: "Tasks", path: "/tasks", active: false, isFree: false },
    { icon: Settings, label: "Settings", path: "/settings", active: false, isFree: false },
  ];

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
                  item.active
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
          <span className="ml-4 font-semibold">StudyCap</span>
        </header>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col max-w-4xl w-full mx-auto p-4">
          {messages.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
              <div className="w-20 h-20 rounded-3xl gradient-primary flex items-center justify-center mb-6 animate-float">
                <Brain className="w-10 h-10 text-primary-foreground" />
              </div>
              <h2 className="text-2xl font-bold mb-2">Hi, I'm NovaAI!</h2>
              <p className="text-muted-foreground max-w-md mb-8">
                Your AI-powered study assistant. Ask me anything about your studies - from math problems to essay help!
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-2xl">
                {[
                  { icon: Target, label: "Explain a concept", example: "Explain photosynthesis" },
                  { icon: BookOpen, label: "Help with homework", example: "Solve this math problem" },
                  { icon: Clock, label: "Create a study plan", example: "Plan for my biology exam" },
                ].map((item, i) => (
                  <button
                    key={i}
                    onClick={() => setInput(item.example)}
                    className="p-4 rounded-xl bg-card border border-border hover:border-primary/50 hover:shadow-soft transition-all text-left group"
                  >
                    <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center mb-3 group-hover:gradient-primary transition-all">
                      <item.icon className="w-5 h-5 text-secondary-foreground group-hover:text-primary-foreground" />
                    </div>
                    <p className="font-medium text-sm">{item.label}</p>
                    <p className="text-xs text-muted-foreground mt-1">"{item.example}"</p>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto space-y-4 pb-4">
              {messages.map((message, i) => (
                <div
                  key={i}
                  className={cn(
                    "flex gap-3 animate-fade-in",
                    message.role === "user" ? "justify-end" : "justify-start"
                  )}
                >
                  {message.role === "assistant" && (
                    <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center flex-shrink-0">
                      <Sparkles className="w-4 h-4 text-primary-foreground" />
                    </div>
                  )}
                  <div
                    className={cn(
                      "max-w-[80%] rounded-2xl px-4 py-3",
                      message.role === "user"
                        ? "gradient-primary text-primary-foreground"
                        : "bg-card border border-border"
                    )}
                  >
                    {message.role === "assistant" ? (
                      <div className="prose prose-sm dark:prose-invert max-w-none">
                        <ReactMarkdown>{message.content || "..."}</ReactMarkdown>
                      </div>
                    ) : (
                      <p>{message.content}</p>
                    )}
                  </div>
                  {message.role === "user" && (
                    <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center flex-shrink-0">
                      <User className="w-4 h-4 text-secondary-foreground" />
                    </div>
                  )}
                </div>
              ))}
              {isLoading && messages[messages.length - 1]?.role === "user" && (
                <div className="flex gap-3 animate-fade-in">
                  <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center flex-shrink-0">
                    <Sparkles className="w-4 h-4 text-primary-foreground" />
                  </div>
                  <div className="bg-card border border-border rounded-2xl px-4 py-3">
                    <Loader2 className="w-5 h-5 animate-spin text-primary" />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}

          {/* Input Area */}
          <form onSubmit={handleSendMessage} className="sticky bottom-0 pt-4 bg-background">
            {!canSendMessage && (
              <div className="mb-4 p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-center">
                <p className="text-destructive font-medium">You've reached your daily limit.</p>
                <Button 
                  variant="accent" 
                  size="sm" 
                  className="mt-2"
                  onClick={() => window.location.href = `https://buy.stripe.com/test_28EaEXdh7dr11y87olcV200?prefilled_email=${encodeURIComponent(user?.email || '')}`}
                >
                  <Crown className="w-4 h-4" />
                  Upgrade for unlimited access
                </Button>
              </div>
            )}
            <div className="flex gap-3">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={canSendMessage ? "Ask me anything about your studies..." : "Upgrade to continue..."}
                disabled={!canSendMessage || isLoading}
                className="flex-1 h-12 rounded-xl"
              />
              <Button 
                type="submit" 
                size="icon" 
                variant="hero"
                className="h-12 w-12 rounded-xl"
                disabled={!canSendMessage || isLoading || !input.trim()}
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Send className="w-5 h-5" />
                )}
              </Button>
            </div>
          </form>
        </div>
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
