import { Suspense, lazy, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Crown, GraduationCap, Sparkles } from "lucide-react";
const LandingBelowFold = lazy(() => import("@/components/landing/LandingBelowFold"));
export default function Landing() {
  const navigate = useNavigate();
  const [showBelowFold, setShowBelowFold] = useState(false);
  useEffect(() => {
    let idleCallbackId: number | undefined;
    let timeoutId: number | undefined;
    const revealBelowFold = () => setShowBelowFold(true);
    if (typeof (window as any).requestIdleCallback === "function") {
      idleCallbackId = (window as any).requestIdleCallback(revealBelowFold, { timeout: 1200 });
    } else {
      timeoutId = setTimeout(revealBelowFold, 300) as unknown as number;
    }
    return () => {
      if (idleCallbackId !== undefined && typeof (window as any).cancelIdleCallback === "function") {
        (window as any).cancelIdleCallback(idleCallbackId);
      }
      if (timeoutId !== undefined) {
        clearTimeout(timeoutId);
      }
    };
  }, []);
  return (
    <div className="min-h-screen gradient-hero">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border/50">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl gradient-primary flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-bold text-xl">StudyCap</span>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => navigate("/auth")}>
              Sign In
            </Button>
            <Button variant="hero" onClick={() => navigate("/auth")}>
              Get Started
            </Button>
          </div>
        </div>
      </nav>
      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6 relative overflow-hidden">
        {/* Decorative glow orbs */}
        <div className="hero-glow top-20 -left-40 animate-glow-pulse" />
        <div className="hero-glow top-40 -right-40 animate-glow-pulse" style={{ animationDelay: "2s" }} />
        
        <div className="container mx-auto text-center max-w-4xl relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-card mb-8 animate-slide-up-fade">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-secondary-foreground">AI-Powered Learning Assistant</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-extrabold mb-6 animate-slide-up-fade tracking-tight" style={{ animationDelay: "0.1s" }}>
            Study Smarter With{" "}
            <span className="text-gradient">StudyCap</span>
          </h1>
          <p
            className="text-xl md:text-2xl text-muted-foreground mb-10 max-w-2xl mx-auto animate-slide-up-fade leading-relaxed"
            style={{ animationDelay: "0.2s" }}
          >
            Your AI-powered study partner that helps you learn faster, understand deeper, and achieve more.
          </p>
          <div
            className="flex flex-col sm:flex-row gap-4 justify-center animate-slide-up-fade"
            style={{ animationDelay: "0.3s" }}
          >
            <Button size="xl" variant="hero" onClick={() => navigate("/auth")} className="group">
              Start Free
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Button>
            <Button size="xl" variant="heroOutline" onClick={() => navigate("/auth?upgrade=true")}>
              <Crown className="w-5 h-5" />
              Upgrade to Premium
            </Button>
          </div>
          <p className="mt-6 text-sm text-muted-foreground animate-slide-up-fade" style={{ animationDelay: "0.4s" }}>
            * 15 free questions per day - No credit card required
          </p>
        </div>
      </section>
      {showBelowFold && (
        <Suspense fallback={null}>
          <LandingBelowFold />
        </Suspense>
      )}
    </div>
  );
}
