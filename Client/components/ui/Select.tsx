import { SelectHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/cn";

export const Select = forwardRef<
  HTMLSelectElement,
  SelectHTMLAttributes<HTMLSelectElement>
>(({ className, children, ...props }, ref) => (
  <select
    ref={ref}
    className={cn(
      "h-10 w-full rounded-2xl bg-surface-strong px-3 text-sm text-ink outline-none ring-1 ring-line transition focus:ring-2 focus:ring-accent",
      className,
    )}
    {...props}
  >
    {children}
  </select>
));
Select.displayName = "Select";
