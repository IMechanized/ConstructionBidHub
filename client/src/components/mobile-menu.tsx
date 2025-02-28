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
  logo?: string | null;
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
      <SheetContent side="right" className="w-[85vw] sm:w-[350px]">
        <SheetHeader className="text-left">
          <SheetTitle>Menu</SheetTitle>
        </SheetHeader>
        <div className="mt-8 flex flex-col gap-4">
          {logo && (
            <img
              src={logo}
              alt={`${companyName} logo`}
              className="h-16 w-16 object-contain mx-auto rounded-full"
            />
          )}
          {companyName && (
            <div className="text-center font-medium text-lg">{companyName}</div>
          )}
          <Separator className="my-2" />
          <Button variant="ghost" className="w-full justify-start h-12 text-base" asChild>
            <Link href="/dashboard">Dashboard</Link>
          </Button>
          <Button variant="ghost" className="w-full justify-start h-12 text-base" onClick={onLogout}>
            Logout
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}