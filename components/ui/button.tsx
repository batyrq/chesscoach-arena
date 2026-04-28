import * as React from "react";
import Link from "next/link";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-lg text-sm font-semibold transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--mint)] disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-[var(--mint)] text-stone-950 shadow-[0_8px_18px_rgba(0,0,0,0.22)] hover:bg-[var(--mint-strong)]",
        secondary: "border border-white/15 bg-white/[0.07] text-white hover:border-white/20 hover:bg-white/[0.12]",
        ghost: "text-slate-300 hover:bg-white/10 hover:text-white",
        danger: "bg-[var(--coral)] text-slate-950 hover:bg-[#ff9b9b]"
      },
      size: {
        default: "h-11 px-4",
        sm: "h-9 px-3 text-xs",
        lg: "h-12 px-5 text-base"
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

  if (asChild && React.isValidElement<{ className?: string }>(props.children)) {
    return React.cloneElement(props.children, {
      className: cn(classes, props.children.props.className)
    });
  }

  return <button ref={ref} className={classes} {...props} />;
  }
);

Button.displayName = "Button";

export { buttonVariants };
