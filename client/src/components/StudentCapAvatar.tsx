import { GraduationCap } from "lucide-react";

interface StudentCapAvatarProps {
  name: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function StudentCapAvatar({ name, size = "md", className = "" }: StudentCapAvatarProps) {
  const sizeClasses = {
    sm: "w-6 h-6",
    md: "w-7 h-7", 
    lg: "w-8 h-8"
  };

  const iconSizes = {
    sm: "h-3 w-3",
    md: "h-4 w-4",
    lg: "h-5 w-5"
  };

  const textSizes = {
    sm: "text-xs",
    md: "text-xs", 
    lg: "text-sm"
  };

  return (
    <div className={`${sizeClasses[size]} bg-gradient-to-br from-blue-100 to-blue-200 rounded-full flex items-center justify-center border-2 border-blue-300 ${className}`}>
      <GraduationCap className={`${iconSizes[size]} text-blue-600`} />
    </div>
  );
}
