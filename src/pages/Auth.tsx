import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { GraduationCap, Mail, Lock, ArrowLeft, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";

const authSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [resendingVerification, setResendingVerification] = useState(false);
  const [pendingVerificationEmail, setPendingVerificationEmail] = useState("");
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { signIn, signUp, signInWithGoogle, resendVerificationEmail, user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      const upgrade = searchParams.get('upgrade');
      if (upgrade === 'true') {
        // Redirect to Stripe checkout
        window.location.href = 'https://buy.stripe.com/cNi4gz2EDaLuc185B2e3e03';
      } else {
        navigate('/dashboard');
      }
    }
  }, [user, navigate, searchParams]);

  const validateForm = () => {
    try {
      authSchema.parse({ email, password });
      setErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors: { email?: string; password?: string } = {};
        error.errors.forEach((err) => {
          if (err.path[0] === 'email') fieldErrors.email = err.message;
          if (err.path[0] === 'password') fieldErrors.password = err.message;
        });
        setErrors(fieldErrors);
      }
      return false;
    }
  };

  const isEmailNotConfirmedError = (message: string) =>
    /email not confirmed|not confirmed/i.test(message);

  const isMissingGoogleProviderConfigError = (message: string) =>
    /missing oauth secret|unsupported provider/i.test(message);

  const handleResendVerification = async () => {
    if (!pendingVerificationEmail) return;

    setResendingVerification(true);
    try {
      const { error } = await resendVerificationEmail(pendingVerificationEmail);

      if (error) {
        toast({
          variant: "destructive",
          title: "Couldn't resend email",
          description: error.message,
        });
        return;
      }

      toast({
        title: "Verification email sent",
        description: `A new verification link was sent to ${pendingVerificationEmail}.`,
      });
    } finally {
      setResendingVerification(false);
    }
  };

  const handleGoogleAuth = async () => {
    setGoogleLoading(true);

    try {
      const upgrade = searchParams.get('upgrade');
      const redirectUrl = new URL(`${window.location.origin}/auth`);

      if (upgrade === 'true') {
        redirectUrl.searchParams.set('upgrade', 'true');
      }

      const { error } = await signInWithGoogle(redirectUrl.toString());

      if (error) {
        toast({
          variant: "destructive",
          title: "Google sign in failed",
          description: isMissingGoogleProviderConfigError(error.message)
            ? "Google is not fully configured for this Supabase project yet. Please complete the Google provider setup in Supabase Authentication."
            : error.message,
        });
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await signIn(email, password);
        if (error) {
          if (isEmailNotConfirmedError(error.message)) {
            setPendingVerificationEmail(email);
            toast({
              variant: "destructive",
              title: "Email not verified",
              description: "Please click the verification link in your email before signing in.",
            });
          } else {
            toast({
              variant: "destructive",
              title: "Sign in failed",
              description: error.message === "Invalid login credentials" 
                ? "Invalid email or password. Please try again."
                : error.message,
            });
          }
        } else {
          setPendingVerificationEmail("");
          toast({
            title: "Welcome back!",
            description: "You've successfully signed in.",
          });
        }
      } else {
        const { error, needsEmailVerification } = await signUp(email, password);
        if (error) {
          if (error.message.includes("already registered")) {
            toast({
              variant: "destructive",
              title: "Account exists",
              description: "An account with this email already exists. Try signing in instead.",
            });
          } else {
            toast({
              variant: "destructive",
              title: "Sign up failed",
              description: error.message,
            });
          }
        } else {
          if (needsEmailVerification) {
            setPendingVerificationEmail(email);
            setPassword("");
            setIsLogin(true);
            toast({
              title: "Check your email",
              description: `We sent a verification link to ${email}. Verify your email, then sign in.`,
            });
          } else {
            setPendingVerificationEmail("");
            toast({
              title: "Account created!",
              description: "You've successfully signed up. Welcome to StudyCap!",
            });
          }
        }
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen gradient-hero flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <button 
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to home
        </button>

        <Card className="p-8 shadow-card">
          <div className="text-center mb-8">
            <div className="w-14 h-14 rounded-2xl gradient-primary flex items-center justify-center mx-auto mb-4">
              <GraduationCap className="w-7 h-7 text-primary-foreground" />
            </div>
            <h1 className="text-2xl font-bold">
              {isLogin ? "Welcome back!" : "Create your account"}
            </h1>
            <p className="text-muted-foreground mt-2">
              {isLogin ? "Sign in to continue learning" : "Start your learning journey today"}
            </p>
          </div>

          <Button
            type="button"
            variant="outline"
            size="lg"
            className="w-full"
            onClick={handleGoogleAuth}
            disabled={loading || googleLoading}
          >
            {googleLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Redirecting to Google...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" viewBox="0 0 24 24" aria-hidden="true">
                  <path fill="#EA4335" d="M12 10.2v3.9h5.5c-.2 1.2-1.5 3.6-5.5 3.6-3.3 0-6-2.8-6-6.2s2.7-6.2 6-6.2c1.9 0 3.2.8 3.9 1.5l2.7-2.7C16.9 2.3 14.7 1.5 12 1.5 6.8 1.5 2.6 6 2.6 11.5S6.8 21.5 12 21.5c6.9 0 9.5-4.9 9.5-7.5 0-.5 0-.8-.1-1.2H12z" />
                </svg>
                Continue with Google
              </>
            )}
          </Button>

          <div className="relative my-5">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">or continue with email</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                />
              </div>
              {errors.email && (
                <p className="text-sm text-destructive">{errors.email}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10"
                />
              </div>
              {errors.password && (
                <p className="text-sm text-destructive">{errors.password}</p>
              )}
            </div>

            <Button type="submit" variant="hero" size="lg" className="w-full" disabled={loading || googleLoading}>
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {isLogin ? "Signing in..." : "Creating account..."}
                </>
              ) : (
                isLogin ? "Sign In" : "Create Account"
              )}
            </Button>
          </form>

          {isLogin && pendingVerificationEmail && (
            <div className="mt-4">
              <Button
                type="button"
                variant="outline"
                size="lg"
                className="w-full"
                onClick={handleResendVerification}
                disabled={loading || googleLoading || resendingVerification}
              >
                {resendingVerification ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Sending verification email...
                  </>
                ) : (
                  "Resend verification email"
                )}
              </Button>
            </div>
          )}

          <div className="mt-6 text-center">
            <p className="text-muted-foreground">
              {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
              <button
                type="button"
                onClick={() => {
                  setIsLogin(!isLogin);
                  setErrors({});
                  if (!isLogin) {
                    setPendingVerificationEmail("");
                  }
                }}
                className="text-primary font-semibold hover:underline"
              >
                {isLogin ? "Sign up" : "Sign in"}
              </button>
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}
