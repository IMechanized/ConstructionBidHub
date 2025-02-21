import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface LoaderProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: "default" | "sm" | "lg";
  centered?: boolean;
}

export function Loader({ 
  className, 
  size = "default", 
  centered = false,
  ...props 
}: LoaderProps) {
  return (
    <div
      className={cn(
        "animate-in fade-in-0",
        centered && "flex items-center justify-center",
        className
      )}
      {...props}
    >
      <Loader2
        className={cn(
          "animate-spin",
          size === "sm" && "h-4 w-4",
          size === "default" && "h-6 w-6",
          size === "lg" && "h-8 w-8"
        )}
      />
    </div>
  );
}

interface LoadingOverlayProps extends React.HTMLAttributes<HTMLDivElement> {
  message?: string;
}

export function LoadingOverlay({ 
  className,
  message = "Loading...",
  ...props 
}: LoadingOverlayProps) {
  return (
    <div
      className={cn(
        "absolute inset-0 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm animate-in fade-in-0 duration-300",
        className
      )}
      {...props}
    >
      <Loader2 className="h-8 w-8 animate-spin" />
      {message && (
        <p className="mt-2 text-sm text-muted-foreground">{message}</p>
      )}
    </div>
  );
}
