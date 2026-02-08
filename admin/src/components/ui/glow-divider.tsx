import { cn } from "@/lib/utils";

interface GlowDividerProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

const GlowDivider = ({ size = "md", className }: GlowDividerProps) => {
  const sizeClasses = {
    sm: "glow-divider-sm",
    md: "",
    lg: "glow-divider-lg",
  };

  return (
    <div 
      className={cn(
        "glow-divider",
        sizeClasses[size],
        className
      )} 
    />
  );
};

export default GlowDivider;
