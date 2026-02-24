import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Crown, Sparkles, CheckCircle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { getStripeCheckoutUrl } from "@/lib/stripe";

interface PremiumModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  featureName: string;
  featureDescription?: string;
}

export function PremiumModal({
  open,
  onOpenChange,
  featureName,
  featureDescription = "This is a premium feature. Upgrade to unlock unlimited access.",
}: PremiumModalProps) {
  const { user } = useAuth();

  const stripeUrl = getStripeCheckoutUrl({
    email: user?.email,
    userId: user?.id,
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-center">
          <div className="w-16 h-16 rounded-xl gradient-primary flex items-center justify-center mx-auto mb-4">
            <Sparkles className="w-8 h-8 text-primary-foreground" />
          </div>
          <DialogTitle className="text-xl">{featureName}</DialogTitle>
          <DialogDescription className="text-center">
            {featureDescription}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 my-4">
          {[
            "AI-powered flashcard generation",
            "Unlimited study sessions",
            "Personalized learning paths",
          ].map((benefit, i) => (
            <div key={i} className="flex items-center gap-2 text-sm">
              <CheckCircle className="w-4 h-4 text-green-500" />
              {benefit}
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-2">
          <Button
            variant="hero"
            onClick={() => (window.location.href = stripeUrl)}
          >
            <Crown className="w-4 h-4" />
            Buy Now - Upgrade to Pro
          </Button>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Maybe Later
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
