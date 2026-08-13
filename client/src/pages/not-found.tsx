import SEOHead from "@/components/seo-head";
import { Button } from "@/components/ui/button";
import { FileSearch } from "lucide-react";
import { Link } from "wouter";

export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background">
      <SEOHead
        title="Page Not Found - FindConstructionBids"
        description="The page you are looking for could not be found. Navigate back to FindConstructionBids to browse construction bids and opportunities."
        noindex={true}
      />
      <div className="w-full max-w-md mx-4 text-center space-y-6">
        {/* Icon */}
        <div className="flex justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
            <FileSearch className="h-8 w-8 text-muted-foreground" aria-hidden="true" />
          </div>
        </div>

        {/* Copy */}
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground uppercase tracking-widest">
            404
          </p>
          <h1 className="text-2xl font-bold tracking-tight">Page not found</h1>
          <p className="text-muted-foreground leading-relaxed">
            The page you're looking for may have been moved or no longer exists. Head back to browse
            available bid opportunities.
          </p>
        </div>

        {/* Action */}
        <Button asChild size="lg">
          <Link href="/">Back to Home</Link>
        </Button>
      </div>
    </div>
  );
}
