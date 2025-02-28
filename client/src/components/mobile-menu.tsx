import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Menu } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";

interface MobileMenuProps {
  companyName?: string;
  logo?: string;
  onLogout: () => void;
}

export function MobileMenu({ companyName, logo, onLogout }: MobileMenuProps) {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="h-6 w-6" />
        </Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Menu</SheetTitle>
        </SheetHeader>
        <div className="mt-8 flex flex-col gap-4">
          {logo && (
            <img
              src={logo}
              alt={`${companyName} logo`}
              className="h-12 w-12 object-contain mx-auto"
            />
          )}
          {companyName && (
            <div className="text-center font-medium">{companyName}</div>
          )}
          <Separator />
          <Button variant="ghost" className="w-full justify-start" asChild>
            <Link href="/dashboard">Dashboard</Link>
          </Button>
          <Button variant="ghost" className="w-full justify-start" onClick={onLogout}>
            Logout
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
