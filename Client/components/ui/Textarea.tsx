import { TextareaHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/cn";

export const Textarea = forwardRef<
  HTMLTextAreaElement,
  TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => (
  <textarea
    ref={ref}
    className={cn(
      "min-h-[96px] w-full rounded-2xl bg-surface-strong px-3 py-2 text-sm text-ink outline-none ring-1 ring-line transition placeholder:text-muted focus:ring-2 focus:ring-accent",
      className,
    )}
    {...props}
  />
));
Textarea.displayName = "Textarea";
