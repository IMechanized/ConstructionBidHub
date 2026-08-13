import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { ThemeToggle } from "@/components/theme-toggle";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Logo } from "@/components/ui/logo";
import { Menu } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

export function LandingPageHeader() {
  const { user } = useAuth();

  return (
    <nav aria-label="Main navigation" className="border-b border-border sticky top-0 bg-background z-50">
      <div className="container mx-auto px-4 h-14 md:h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center hover:opacity-75 transition-opacity">
          <Logo />
        </Link>
        
        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-1">
          <Link
            href="/about"
            className="text-[0.8125rem] font-medium text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5 rounded-[6px] hover:bg-muted/60"
          >
            About
          </Link>
          <Link
            href="/support"
            className="text-[0.8125rem] font-medium text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5 rounded-[6px] hover:bg-muted/60"
          >
            Support
          </Link>
          <ThemeToggle size="sm" />
          <div className="w-px h-4 bg-border mx-1" />
          {user ? (
            <Button asChild variant="outline" size="sm" className="text-[0.8125rem] h-8" data-testid="button-dashboard">
              <Link href="/dashboard">Dashboard</Link>
            </Button>
          ) : (
            <>
              <Button asChild variant="ghost" size="sm" className="text-[0.8125rem] h-8" data-testid="button-login">
                <Link href="/auth">Login</Link>
              </Button>
              <Button asChild variant="default" size="sm" className="text-[0.8125rem] h-8" data-testid="button-get-started">
                <Link href="/auth">Get Started</Link>
              </Button>
            </>
          )}
        </div>

        {/* Mobile Navigation */}
        <div className="md:hidden flex items-center gap-2">
          <ThemeToggle size="sm" />
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Menu className="h-4.5 w-4.5" />
                <span className="sr-only">Open menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[280px]">
              <div className="flex flex-col h-full pt-6">
                <div className="space-y-1 flex-1">
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-[0.9375rem] h-10"
                    asChild
                  >
                    <Link href="/about">About</Link>
                  </Button>
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-[0.9375rem] h-10"
                    asChild
                  >
                    <Link href="/support">Support</Link>
                  </Button>
                  
                  <div className="pt-3 border-t border-border mt-3">
                    {user ? (
                      <Button
                        variant="outline"
                        className="w-full text-[0.9375rem] h-10"
                        asChild
                        data-testid="mobile-button-dashboard"
                      >
                        <Link href="/dashboard">Dashboard</Link>
                      </Button>
                    ) : (
                      <div className="space-y-2">
                        <Button
                          variant="ghost"
                          className="w-full text-[0.9375rem] h-10"
                          asChild
                          data-testid="mobile-button-login"
                        >
                          <Link href="/auth">Login</Link>
                        </Button>
                        <Button
                          variant="default"
                          className="w-full text-[0.9375rem] h-10"
                          asChild
                          data-testid="mobile-button-get-started"
                        >
                          <Link href="/auth">Get Started</Link>
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </nav>
  );
}
