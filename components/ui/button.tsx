import * as React from "react";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "forest" | "secondary" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
}

const variantStyles: Record<NonNullable<ButtonProps["variant"]>, string> = {
  primary:
    "bg-[#0f1c2e] text-white hover:bg-[#18283f] active:bg-[#0a1421] border border-[#0f1c2e] dark:bg-[#1e2e42] dark:hover:bg-[#283d58] dark:border-[#2b415d]",
  forest:
    "bg-[#1b4332] text-white hover:bg-[#265943] active:bg-[#143225] border border-[#1b4332] dark:bg-[#214f3b] dark:hover:bg-[#2b664d] dark:border-[#2b664d]",
  secondary:
    "bg-[#efefe9] text-slate-800 hover:bg-[#e4e4dc] active:bg-[#d8d8ce] border border-[#deded6] dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 dark:border-slate-700",
  outline:
    "border border-slate-300 bg-white text-slate-800 hover:bg-slate-50 active:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800",
  ghost:
    "bg-transparent text-slate-700 hover:bg-slate-100 active:bg-slate-200 dark:text-slate-300 dark:hover:bg-slate-800",
};

const sizeStyles: Record<NonNullable<ButtonProps["size"]>, string> = {
  sm: "h-8 px-3 text-xs font-medium rounded-sm",
  md: "h-9 px-3.5 text-sm font-medium rounded-sm",
  lg: "h-10 px-4 text-sm font-semibold rounded-sm",
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = "", variant = "primary", size = "md", children, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled}
        className={`inline-flex items-center justify-center gap-1.5 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-900 disabled:pointer-events-none disabled:opacity-50 select-none ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
