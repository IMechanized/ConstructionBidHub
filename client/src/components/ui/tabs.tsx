import * as React from "react"
import * as TabsPrimitive from "@radix-ui/react-tabs"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const Tabs = TabsPrimitive.Root

const TabsScrollButton = React.forwardRef<
  HTMLButtonElement,
  React.ComponentPropsWithoutRef<typeof Button>
>(({ className, ...props }, ref) => (
  <Button
    ref={ref}
    variant="ghost"
    size="icon"
    className={cn(
      "h-8 w-8 p-0 hidden md:hidden",
      className
    )}
    {...props}
  />
))
TabsScrollButton.displayName = "TabsScrollButton"

const TabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(({ className, ...props }, ref) => {
  const listRef = React.useRef<HTMLDivElement>(null)
  const [showLeftArrow, setShowLeftArrow] = React.useState(false)
  const [showRightArrow, setShowRightArrow] = React.useState(false)

  const checkScroll = React.useCallback(() => {
    if (!listRef.current) return
    const { scrollLeft, scrollWidth, clientWidth } = listRef.current
    setShowLeftArrow(scrollLeft > 0)
    setShowRightArrow(scrollLeft < scrollWidth - clientWidth)
  }, [])

  React.useEffect(() => {
    checkScroll()
    window.addEventListener('resize', checkScroll)
    return () => window.removeEventListener('resize', checkScroll)
  }, [checkScroll])

  const scroll = (direction: 'left' | 'right') => {
    if (!listRef.current) return
    const scrollAmount = direction === 'left' ? -200 : 200
    listRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' })
  }

  return (
    <div className="relative flex items-center">
      {showLeftArrow && (
        <TabsScrollButton 
          onClick={() => scroll('left')}
          className="absolute left-0 z-10 md:hidden"
        >
          <ChevronLeft className="h-4 w-4" />
        </TabsScrollButton>
      )}
      <TabsPrimitive.List
        ref={(el) => {
          // Handle both refs
          if (typeof ref === 'function') ref(el)
          else if (ref) ref.current = el
          // @ts-ignore - we know this is an HTMLDivElement
          listRef.current = el
        }}
        className={cn(
          "inline-flex h-10 items-center justify-start rounded-md bg-muted p-1 text-muted-foreground relative",
          "md:justify-center",
          "overflow-x-auto scrollbar-none scroll-smooth",
          className
        )}
        onScroll={checkScroll}
        {...props}
      />
      {showRightArrow && (
        <TabsScrollButton 
          onClick={() => scroll('right')}
          className="absolute right-0 z-10 md:hidden"
        >
          <ChevronRight className="h-4 w-4" />
        </TabsScrollButton>
      )}
    </div>
  )
})
TabsList.displayName = TabsPrimitive.List.displayName

const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    className={cn(
      "inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm",
      "min-w-[100px] flex-shrink-0",
      className
    )}
    {...props}
  />
))
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName

const TabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn(
      "mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
      className
    )}
    {...props}
  />
))
TabsContent.displayName = TabsPrimitive.Content.displayName

export { Tabs, TabsList, TabsTrigger, TabsContent }