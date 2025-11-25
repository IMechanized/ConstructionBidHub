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
    <nav className="border-b sticky top-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-50">
      <div className="container mx-auto px-4 h-16 md:h-20 flex items-center justify-between">
        <Link href="/" className="flex items-center hover:opacity-80 transition-opacity">
          <Logo />
        </Link>
        
        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-4">
          <Link href="/about" className="text-sm text-muted-foreground hover:text-primary transition-colors">
            About
          </Link>
          <Link href="/support" className="text-sm text-muted-foreground hover:text-primary transition-colors">
            Support
          </Link>
          <ThemeToggle size="sm" />
          <Button asChild variant="outline" size="sm" className="text-base">
            {user ? (
              <Link href="/dashboard">Dashboard</Link>
            ) : (
              <Link href="/auth">Get Started</Link>
            )}
          </Button>
        </div>

        {/* Mobile Navigation - Hamburger Menu */}
        <div className="md:hidden">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="h-9 w-9">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Open menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px]">
              <div className="flex flex-col h-full pt-6">
                <div className="space-y-4 flex-1">
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-base"
                    asChild
                  >
                    <Link href="/about">About</Link>
                  </Button>
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-base"
                    asChild
                  >
                    <Link href="/support">Support</Link>
                  </Button>
                  
                  <div className="flex items-center justify-between px-3">
                    <span className="text-sm font-medium">Theme</span>
                    <ThemeToggle size="sm" />
                  </div>
                  
                  <Button
                    variant="outline"
                    className="w-full text-base"
                    asChild
                  >
                    {user ? (
                      <Link href="/dashboard">Dashboard</Link>
                    ) : (
                      <Link href="/auth">Get Started</Link>
                    )}
                  </Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </nav>
  );
}
