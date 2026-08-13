import { Link } from "wouter";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
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
  return (
    <Breadcrumb className={cn("mb-4", className)}>
      <BreadcrumbList className="text-[0.8125rem]">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <BreadcrumbItem key={item.href}>
              {isLast ? (
                <BreadcrumbPage className="font-medium text-foreground">
                  {item.label}
                </BreadcrumbPage>
              ) : (
                <>
                  <BreadcrumbLink asChild>
                    <Link
                      href={item.href}
                      className="text-muted-foreground hover:text-foreground transition-colors duration-150 font-medium"
                    >
                      {item.label}
                    </Link>
                  </BreadcrumbLink>
                  <BreadcrumbSeparator className="text-border" />
                </>
              )}
            </BreadcrumbItem>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
