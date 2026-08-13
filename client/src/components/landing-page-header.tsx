import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { ThemeToggle } from "@/components/theme-toggle";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Logo } from "@/components/ui/logo";
import { Menu } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useState } from "react";

export function LandingPageHeader() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);

  const closeMenu = () => setOpen(false);

  return (
    <nav aria-label="Main navigation" className="border-b sticky top-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-50">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center hover:opacity-80 transition-opacity">
          <Logo />
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-1">
          <Link
            href="/about"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5 rounded-md hover:bg-muted/50"
          >
            About
          </Link>
          <Link
            href="/support"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5 rounded-md hover:bg-muted/50"
          >
            Support
          </Link>
          <div className="mx-2">
            <ThemeToggle size="sm" />
          </div>
          {user ? (
            <Button asChild variant="outline" size="sm" data-testid="button-dashboard">
              <Link href="/dashboard">Dashboard</Link>
            </Button>
          ) : (
            <>
              <Button asChild variant="ghost" size="sm" data-testid="button-login">
                <Link href="/auth">Login</Link>
              </Button>
              <Button asChild variant="default" size="sm" data-testid="button-get-started">
                <Link href="/auth">Get Started</Link>
              </Button>
            </>
          )}
        </div>

        {/* Mobile Navigation */}
        <div className="md:hidden flex items-center gap-2">
          <ThemeToggle size="sm" />
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="h-9 w-9">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Open menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72 pt-10">
              <div className="flex flex-col gap-1">
                <Button
                  variant="ghost"
                  className="w-full justify-start text-sm text-muted-foreground"
                  asChild
                  onClick={closeMenu}
                >
                  <Link href="/about">About</Link>
                </Button>
                <Button
                  variant="ghost"
                  className="w-full justify-start text-sm text-muted-foreground"
                  asChild
                  onClick={closeMenu}
                >
                  <Link href="/support">Support</Link>
                </Button>

                <div className="my-2 border-t border-border" />

                {user ? (
                  <Button
                    variant="default"
                    className="w-full"
                    asChild
                    onClick={closeMenu}
                    data-testid="mobile-button-dashboard"
                  >
                    <Link href="/dashboard">Dashboard</Link>
                  </Button>
                ) : (
                  <>
                    <Button
                      variant="ghost"
                      className="w-full justify-start"
                      asChild
                      onClick={closeMenu}
                      data-testid="mobile-button-login"
                    >
                      <Link href="/auth">Login</Link>
                    </Button>
                    <Button
                      variant="default"
                      className="w-full"
                      asChild
                      onClick={closeMenu}
                      data-testid="mobile-button-get-started"
                    >
                      <Link href="/auth">Get Started</Link>
                    </Button>
                  </>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </nav>
  );
}
