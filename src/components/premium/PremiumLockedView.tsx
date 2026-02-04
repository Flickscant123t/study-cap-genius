import { Lock, Crown, Sparkles, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";

interface PremiumLockedViewProps {
  title?: string;
  description?: string;
  featureName?: string;
  showBenefits?: boolean;
  compact?: boolean;
}

const STRIPE_URL = "https://buy.stripe.com/test_28EaEXdh7dr11y87olcV200";

const benefits = [
  "Unlimited AI Study Sessions",
  "Adaptive Flashcard Generation",
  "AI-Powered Study Plans",
  "Mastery Verification Tutoring",
  "Premium Aura Themes",
  "Priority Support",
];

export function PremiumLockedView({
  title = "Unlock AI Study Genius",
  description = "Get unlimited access to all premium features and supercharge your learning.",
  featureName,
  showBenefits = true,
  compact = false,
}: PremiumLockedViewProps) {
  const { user } = useAuth();

  const stripeUrl = user?.email
    ? `${STRIPE_URL}?prefilled_email=${encodeURIComponent(user.email)}`
    : STRIPE_URL;

  if (compact) {
    return (
      <Card className="p-6 text-center border-primary/20 bg-primary/5">
        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-3">
          <Lock className="w-6 h-6 text-primary" />
        </div>
        <h3 className="font-semibold mb-1">{featureName || "Premium Feature"}</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Upgrade to unlock this feature
        </p>
        <Button
          variant="hero"
          onClick={() => (window.location.href = stripeUrl)}
          className="w-full"
        >
          <Crown className="w-4 h-4" />
          Upgrade to Pro
        </Button>
      </Card>
    );
  }

  return (
    <div className="flex-1 flex items-center justify-center p-8">
      <Card className="w-full max-w-md p-8 text-center border-primary/20">
        <div className="w-20 h-20 rounded-2xl gradient-primary flex items-center justify-center mx-auto mb-6">
          <Lock className="w-10 h-10 text-primary-foreground" />
        </div>

        <h2 className="text-2xl font-bold mb-2">{title}</h2>
        <p className="text-muted-foreground mb-6">{description}</p>

        {showBenefits && (
          <div className="text-left bg-secondary/30 rounded-xl p-4 mb-6">
            <p className="text-sm font-medium mb-3 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              Premium Benefits
            </p>
            <ul className="space-y-2">
              {benefits.map((benefit, i) => (
                <li key={i} className="flex items-center gap-2 text-sm">
                  <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                  {benefit}
                </li>
              ))}
            </ul>
          </div>
        )}

        <Button
          variant="hero"
          size="lg"
          onClick={() => (window.location.href = stripeUrl)}
          className="w-full"
        >
          <Crown className="w-5 h-5" />
          Upgrade to Pro
        </Button>

        <p className="text-xs text-muted-foreground mt-4">
          Cancel anytime. 30-day money-back guarantee.
        </p>
      </Card>
    </div>
  );
}
