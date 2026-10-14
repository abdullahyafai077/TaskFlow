import { InputHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/cn";

export const Input = forwardRef<
  HTMLInputElement,
  InputHTMLAttributes<HTMLInputElement>
>(({ className, ...props }, ref) => (
  <input
    ref={ref}
    className={cn(
      "h-10 w-full rounded-2xl bg-surface-strong px-3 text-sm text-ink outline-none ring-1 ring-line transition placeholder:text-muted focus:ring-2 focus:ring-accent",
      className,
    )}
    {...props}
  />
));
Input.displayName = "Input";
