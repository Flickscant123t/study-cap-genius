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

    if ("requestIdleCallback" in window) {
      idleCallbackId = window.requestIdleCallback(revealBelowFold, { timeout: 1200 });
    } else {
      timeoutId = window.setTimeout(revealBelowFold, 300);
    }

    return () => {
      if (idleCallbackId !== undefined && "cancelIdleCallback" in window) {
        window.cancelIdleCallback(idleCallbackId);
      }
      if (timeoutId !== undefined) {
        window.clearTimeout(timeoutId);
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
      <section className="pt-32 pb-20 px-6">
        <div className="container mx-auto text-center max-w-4xl">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary mb-8 animate-fade-in">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-secondary-foreground">AI-Powered Learning Assistant</span>
          </div>

          <h1 className="text-5xl md:text-7xl font-extrabold mb-6 animate-fade-in-up">
            Study Smarter With{" "}
            <span className="text-gradient">StudyCap</span>
          </h1>

          <p
            className="text-xl md:text-2xl text-muted-foreground mb-10 max-w-2xl mx-auto animate-fade-in-up"
            style={{ animationDelay: "0.1s" }}
          >
            Your AI-powered study partner that helps you learn faster, understand deeper, and achieve more.
          </p>

          <div
            className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in-up"
            style={{ animationDelay: "0.2s" }}
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

          <p className="mt-6 text-sm text-muted-foreground animate-fade-in" style={{ animationDelay: "0.3s" }}>
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
