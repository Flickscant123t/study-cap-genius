import React from "react";
import { cn } from "@/lib/utils";

type BrandIconProps = {
  className?: string;
  alt?: string;
};

export const BrandIcon = React.forwardRef<HTMLImageElement, BrandIconProps>(
  ({ className, alt = "StudyCap icon" }, ref) => {
    return (
      <img
        ref={ref}
        src="/chatgpt-icon.webp"
        alt={alt}
        className={cn("h-full w-full object-cover", className)}
      />
    );
  }
);

BrandIcon.displayName = "BrandIcon";
