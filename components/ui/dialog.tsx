"use client";

import * as DialogPrimitive from "@radix-ui/react-dialog";
import type React from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export const Dialog = DialogPrimitive.Root;
export const DialogTrigger = DialogPrimitive.Trigger;
export const DialogClose = DialogPrimitive.Close;

export function DialogContent({
  className,
  children,
  ...props
}: DialogPrimitive.DialogContentProps) {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm data-[state=open]:animate-in" />
      <DialogPrimitive.Content
        className={cn(
          "glass fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-2xl -translate-x-1/2 -translate-y-1/2 rounded-[2rem] p-6 shadow-2xl outline-none",
          className
        )}
        {...props}
      >
        {children}
        <DialogPrimitive.Close className="absolute right-5 top-5 rounded-full bg-white/10 p-2 text-slate-300 transition hover:bg-white/20 hover:text-white">
          <X className="h-4 w-4" />
        </DialogPrimitive.Close>
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
}

export function DialogHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("space-y-2 pr-10", className)} {...props} />;
}

export function DialogTitle({ className, ...props }: DialogPrimitive.DialogTitleProps) {
  return <DialogPrimitive.Title className={cn("font-[var(--font-display)] text-3xl font-bold", className)} {...props} />;
}

export function DialogDescription({ className, ...props }: DialogPrimitive.DialogDescriptionProps) {
  return <DialogPrimitive.Description className={cn("text-sm text-slate-300", className)} {...props} />;
}
