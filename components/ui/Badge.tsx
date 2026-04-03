import { cn } from "@/lib/utils";

interface BadgeProps {
  children: React.ReactNode;
  variant?: "lime" | "blue" | "amber" | "red" | "gray";
  className?: string;
}

const variantStyles = {
  lime: "bg-[#96FC03]/10 text-[#96FC03] border-[#96FC03]/30",
  blue: "bg-blue-500/10 text-blue-400 border-blue-500/30",
  amber: "bg-amber-500/10 text-amber-400 border-amber-500/30",
  red: "bg-red-500/10 text-red-400 border-red-500/30",
  gray: "bg-[#222229] text-[#8B949E] border-[#222229]",
};

export function Badge({ children, variant = "lime", className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center text-xs font-semibold uppercase tracking-wide px-2.5 py-1 rounded-md border",
        variantStyles[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
