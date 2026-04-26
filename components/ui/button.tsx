import * as React from "react";
import Link from "next/link";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-full text-sm font-semibold transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--mint)] disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-[var(--gold)] text-slate-950 shadow-[0_0_32px_rgba(248,200,106,0.28)] hover:-translate-y-0.5 hover:bg-[#ffe08e]",
        secondary: "border border-white/15 bg-white/10 text-white hover:-translate-y-0.5 hover:bg-white/15",
        ghost: "text-slate-300 hover:bg-white/10 hover:text-white",
        danger: "bg-[var(--coral)] text-slate-950 hover:bg-[#ff9b9b]"
      },
      size: {
        default: "h-11 px-5",
        sm: "h-9 px-4 text-xs",
        lg: "h-13 px-7 text-base"
      }
    },
    defaultVariants: {
      variant: "default",
      size: "default"
    }
  }
);

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
    href?: string;
  };

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild, href, ...props }, ref) => {
  const classes = cn(buttonVariants({ variant, size }), className);

  if (asChild && href) {
    return <Link href={href} className={classes}>{props.children}</Link>;
  }

  return <button ref={ref} className={classes} {...props} />;
  }
);

Button.displayName = "Button";

export { buttonVariants };
