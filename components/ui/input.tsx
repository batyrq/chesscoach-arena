import * as React from "react";
import { cn } from "@/lib/utils";

export function Input({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "h-12 w-full rounded-2xl border border-white/10 bg-white/[0.07] px-4 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-[var(--mint)] focus:ring-2 focus:ring-[rgba(118,247,203,0.18)]",
        className
      )}
      {...props}
    />
  );
}
