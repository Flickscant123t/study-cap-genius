import { cn } from "@/lib/utils";

type BrandIconProps = {
  className?: string;
  alt?: string;
};

export function BrandIcon({ className, alt = "StudyCap icon" }: BrandIconProps) {
  return (
    <img
      src="/chatgpt-icon.webp"
      alt={alt}
      className={cn("h-full w-full object-cover", className)}
    />
  );
}
