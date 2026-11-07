import * as React from "react";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "success" | "warning" | "outline";
}

const variantStyles: Record<NonNullable<BadgeProps["variant"]>, string> = {
  default:
    "bg-[#f0f2f5] text-[#334155] border border-[#cbd5e1] dark:bg-[#192231] dark:text-[#94a3b8] dark:border-[#2b3a50]",
  success:
    "bg-[#edf7ed] text-[#1b4332] border border-[#b7dfca] dark:bg-[#12281d] dark:text-[#82d6a9] dark:border-[#1b4332]",
  warning:
    "bg-[#fef9ee] text-[#855307] border border-[#f5dea4] dark:bg-[#251d0d] dark:text-[#f0c05a] dark:border-[#4d3a14]",
  outline:
    "bg-transparent text-[#475569] border border-[#cbd5e1] dark:text-[#94a3b8] dark:border-[#334155]",
};

export function Badge({
  className = "",
  variant = "default",
  children,
  ...props
}: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-sm px-1.5 py-0.5 text-[11px] font-semibold tracking-wide uppercase select-none ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {children}
    </span>
  );
}
