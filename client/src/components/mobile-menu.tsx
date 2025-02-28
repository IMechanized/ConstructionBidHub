import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { Link } from "wouter";
import { Menu } from "lucide-react";

interface MobileMenuProps {
  companyName?: string;
  logo?: string | null;
  onLogout: () => void;
}

export function MobileMenu({ companyName, logo, onLogout }: MobileMenuProps) {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent>
        <div className="flex flex-col h-full">
          <div className="flex flex-col items-center gap-4 py-6">
            {logo && (
              <Avatar className="h-16 w-16">
                <img
                  src={logo}
                  alt={`${companyName} logo`}
                  className="h-full w-full object-cover"
                />
              </Avatar>
            )}
            {companyName && (
              <p className="text-lg font-medium">{companyName}</p>
            )}
          </div>

          <div className="space-y-2 flex-1">
            <Button
              variant="ghost"
              className="w-full justify-start"
              asChild
            >
              <Link href="/dashboard">Dashboard</Link>
            </Button>
          </div>

          <Button
            variant="ghost"
            className="w-full justify-start mt-auto"
            onClick={onLogout}
          >
            Logout
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}