import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Crown } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { getStripeCheckoutUrl } from "@/lib/stripe";

interface LimitReachedCardProps {
  currentCount: number;
  maxCount: number;
  itemName: string;
}

export function LimitReachedCard({
  currentCount,
  maxCount,
  itemName,
}: LimitReachedCardProps) {
  const { user } = useAuth();

  const stripeUrl = getStripeCheckoutUrl({
    email: user?.email,
    userId: user?.id,
  });

  return (
    <Card className="p-6 border-orange-500/30 bg-orange-500/5">
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-xl bg-orange-500/10 flex items-center justify-center flex-shrink-0">
          <AlertTriangle className="w-6 h-6 text-orange-500" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-lg mb-1">Limit Reached</h3>
          <p className="text-muted-foreground mb-4">
            You've created {currentCount} of {maxCount} free {itemName}. Upgrade
            to Pro for unlimited {itemName} and all premium features.
          </p>
          <Button
            variant="hero"
            onClick={() => (window.location.href = stripeUrl)}
          >
            <Crown className="w-4 h-4" />
            Upgrade for Unlimited
          </Button>
        </div>
      </div>
    </Card>
  );
}
