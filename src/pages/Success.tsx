import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Crown, Sparkles, Rocket, Zap, Star } from "lucide-react";
import confetti from "canvas-confetti";

export default function Success() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, refreshPremiumStatus } = useAuth();
  const [isVerifying, setIsVerifying] = useState(true);
  const [verified, setVerified] = useState(false);

  useEffect(() => {
    const sessionId = searchParams.get("session_id");
    
    const verifyAndActivate = async () => {
      if (!user) {
        // Wait for auth to load
        setTimeout(verifyAndActivate, 500);
        return;
      }

      try {
        // Verify session with Stripe (the webhook should have already processed it)
        // We'll check the subscription status in the database
        const { data: subscription } = await supabase
          .from("subscriptions")
          .select("status, plan")
          .eq("user_id", user.id)
          .maybeSingle();

        if (subscription?.status === "active" && subscription?.plan === "premium") {
          setVerified(true);
          
          // Also cache in localStorage for quick access
          localStorage.setItem("studycap_premium", "true");
          
          // Refresh context
          await refreshPremiumStatus();
          
          // Launch confetti celebration!
          launchConfetti();
        } else if (sessionId) {
          // If webhook hasn't processed yet, wait and retry
          setTimeout(verifyAndActivate, 2000);
          return;
        }
      } catch (error) {
        console.error("Error verifying premium status:", error);
      } finally {
        setIsVerifying(false);
      }
    };

    verifyAndActivate();
  }, [searchParams, user, refreshPremiumStatus]);

  const launchConfetti = () => {
    // Initial burst
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ["#6366f1", "#f59e0b", "#8b5cf6", "#ec4899"],
    });

    // Second wave
    setTimeout(() => {
      confetti({
        particleCount: 50,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ["#6366f1", "#f59e0b"],
      });
      confetti({
        particleCount: 50,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ["#8b5cf6", "#ec4899"],
      });
    }, 200);

    // Third wave with stars
    setTimeout(() => {
      confetti({
        particleCount: 30,
        spread: 100,
        origin: { y: 0.4 },
        shapes: ["star"],
        colors: ["#fbbf24", "#f59e0b"],
      });
    }, 400);
  };

  if (isVerifying) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-primary/5 via-background to-accent/5">
        <div className="w-24 h-24 rounded-3xl gradient-primary flex items-center justify-center mb-8 animate-pulse">
          <Crown className="w-12 h-12 text-primary-foreground" />
        </div>
        <h1 className="text-2xl font-bold mb-4">Verifying Your Payment...</h1>
        <p className="text-muted-foreground">This will only take a moment.</p>
      </div>
    );
  }

  if (!verified) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-destructive/5 via-background to-destructive/5 p-4">
        <div className="w-24 h-24 rounded-3xl bg-destructive/10 flex items-center justify-center mb-8">
          <Crown className="w-12 h-12 text-destructive" />
        </div>
        <h1 className="text-2xl font-bold mb-4 text-center">Verification Pending</h1>
        <p className="text-muted-foreground text-center max-w-md mb-8">
          Your payment is being processed. If you've already paid, please wait a moment and refresh this page.
        </p>
        <div className="flex gap-4">
          <Button variant="outline" onClick={() => window.location.reload()}>
            Refresh
          </Button>
          <Button variant="hero" onClick={() => navigate("/dashboard")}>
            Go to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-primary/10 via-background to-accent/10 p-4">
      {/* Floating decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-20 h-20 rounded-full gradient-primary opacity-20 blur-2xl animate-float" />
        <div className="absolute bottom-32 right-16 w-32 h-32 rounded-full gradient-accent opacity-20 blur-3xl animate-float" style={{ animationDelay: "1s" }} />
        <div className="absolute top-1/3 right-1/4 w-16 h-16 rounded-full bg-purple-500/20 blur-2xl animate-float" style={{ animationDelay: "0.5s" }} />
      </div>

      <div className="relative z-10 text-center max-w-2xl">
        {/* Icon */}
        <div className="relative inline-block mb-8">
          <div className="w-32 h-32 rounded-3xl gradient-primary flex items-center justify-center shadow-hover animate-bounce-slow">
            <Crown className="w-16 h-16 text-primary-foreground" />
          </div>
          {/* Sparkles around icon */}
          <Sparkles className="absolute -top-2 -right-2 w-8 h-8 text-accent animate-pulse" />
          <Star className="absolute -bottom-1 -left-3 w-6 h-6 text-yellow-400 animate-pulse" style={{ animationDelay: "0.3s" }} />
          <Zap className="absolute top-1/2 -right-6 w-5 h-5 text-purple-500 animate-pulse" style={{ animationDelay: "0.6s" }} />
        </div>

        {/* Title */}
        <h1 className="text-5xl md:text-6xl font-extrabold mb-4 leading-tight">
          <span className="text-gradient">Genius Status</span>
          <br />
          <span className="text-foreground">Activated! 🚀</span>
        </h1>

        {/* Subtitle */}
        <p className="text-xl text-muted-foreground mb-8 max-w-lg mx-auto">
          Welcome to the elite, genius! You now have unlimited access to all premium features. 
          Let's crush those study goals together!
        </p>

        {/* Features unlocked */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          {[
            { icon: Sparkles, label: "Unlimited AI" },
            { icon: Rocket, label: "Smart Flashcards" },
            { icon: Zap, label: "Study Plans" },
            { icon: Crown, label: "All Themes" },
          ].map((feature, i) => (
            <div
              key={feature.label}
              className="p-4 rounded-xl bg-card/50 backdrop-blur-sm border border-border/50 animate-fade-in"
              style={{ animationDelay: `${i * 0.1}s` }}
            >
              <feature.icon className="w-8 h-8 mx-auto mb-2 text-primary" />
              <p className="text-sm font-medium">{feature.label}</p>
            </div>
          ))}
        </div>

        {/* CTA Button */}
        <Button
          variant="hero"
          size="lg"
          className="text-lg px-10 py-6 rounded-2xl shadow-hover hover:scale-105 transition-transform"
          onClick={() => navigate("/dashboard")}
        >
          <Rocket className="w-5 h-5 mr-2" />
          Get Started
        </Button>

        <p className="text-sm text-muted-foreground mt-6">
          Your premium membership is now active. Time to become a study genius!
        </p>
      </div>

      {/* Add custom animation */}
      <style>{`
        @keyframes bounce-slow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        .animate-bounce-slow {
          animation: bounce-slow 3s ease-in-out infinite;
        }
        @keyframes float {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(5deg); }
        }
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
