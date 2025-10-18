import { Link, useLocation } from "wouter";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { cn } from "@/lib/utils";

interface BreadcrumbItemType {
  label: string;
  href: string;
}

interface BreadcrumbNavProps {
  items: BreadcrumbItemType[];
  className?: string;
}

export function BreadcrumbNav({ items, className }: BreadcrumbNavProps) {
  const [location] = useLocation();

  return (
    <Breadcrumb className={cn("mb-6", className)}>
      <BreadcrumbList>
        {items.map((item, index) => (
          <BreadcrumbItem key={item.href}>
            {index === items.length - 1 ? (
              <BreadcrumbPage className="font-medium text-foreground">{item.label}</BreadcrumbPage>
            ) : (
              <>
                <BreadcrumbLink asChild>
                  <Link 
                    href={item.href}
                    className="text-muted-foreground hover:text-foreground transition-colors duration-200 font-medium hover:underline underline-offset-4"
                  >
                    {item.label}
                  </Link>
                </BreadcrumbLink>
                <BreadcrumbSeparator className="text-muted-foreground/50" />
              </>
            )}
          </BreadcrumbItem>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  );
}