import * as React from "react";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";

/**
 * ScrollableForm Component
 * 
 * A wrapper component that makes forms scrollable across different screen heights.
 * It uses the ScrollArea component to enable smooth scrolling behavior.
 * 
 * @example
 * ```tsx
 * <ScrollableForm className="max-h-[500px]">
 *   <form>...</form>
 * </ScrollableForm>
 * ```
 */
interface ScrollableFormProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Optional maximum height for the form container
   * If not provided, defaults to 70vh
   */
  maxHeight?: string;
}

const ScrollableForm = React.forwardRef<
  HTMLDivElement,
  ScrollableFormProps
>(({ className, maxHeight = "70vh", children, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn("w-full", className)}
      style={{ maxHeight: maxHeight }}
      {...props}
    >
      <ScrollArea className="h-full w-full">
        <div className="p-1">
          {children}
        </div>
      </ScrollArea>
    </div>
  );
});

ScrollableForm.displayName = "ScrollableForm";

export { ScrollableForm };