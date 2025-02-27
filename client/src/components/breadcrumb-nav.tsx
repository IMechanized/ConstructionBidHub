import { Link, useLocation } from "wouter";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

interface BreadcrumbItemType {
  label: string;
  href: string;
}

interface BreadcrumbNavProps {
  items: BreadcrumbItemType[];
}

export function BreadcrumbNav({ items }: BreadcrumbNavProps) {
  const [location] = useLocation();

  return (
    <Breadcrumb className="mb-6">
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <Link href="/">Home</Link>
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        {items.map((item, index) => (
          <BreadcrumbItem key={item.href}>
            {index === items.length - 1 ? (
              <BreadcrumbPage>{item.label}</BreadcrumbPage>
            ) : (
              <>
                <BreadcrumbLink asChild>
                  <Link href={item.href}>{item.label}</Link>
                </BreadcrumbLink>
                <BreadcrumbSeparator />
              </>
            )}
          </BreadcrumbItem>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
