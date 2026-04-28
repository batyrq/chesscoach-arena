import * as React from "react";
import { cn } from "@/lib/utils";

export function Select({ className, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        "h-10 w-full rounded-lg border border-white/10 bg-slate-950/80 px-3 text-sm text-white outline-none transition focus:border-[var(--mint)] focus:ring-2 focus:ring-[rgba(127,163,106,0.18)]",
        className
      )}
      {...props}
    />
  );
}
