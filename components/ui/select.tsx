import * as React from "react";
import { cn } from "@/lib/utils";

export function Select({ className, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        "h-12 w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 text-sm text-white outline-none transition focus:border-[var(--mint)] focus:ring-2 focus:ring-[rgba(118,247,203,0.18)]",
        className
      )}
      {...props}
    />
  );
}
