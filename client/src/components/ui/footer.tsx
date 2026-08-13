import { Link } from "wouter";
import { Logo } from "./logo";

export function Footer() {
  return (
    <footer aria-label="Site footer" className="border-t bg-background">
      <div className="container mx-auto px-6 py-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {/* Logo and Description */}
          <div className="col-span-2 md:col-span-1 space-y-3">
            <Logo className="h-8" />
            <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">
              Government-RFP marketplace for construction contractors.
            </p>
          </div>

          {/* Platform */}
          <div>
            <h4 className="text-xs font-medium text-foreground uppercase tracking-wider mb-3">Platform</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/opportunities/featured">
                  <span className="text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
                    Browse RFPs
                  </span>
                </Link>
              </li>
              <li>
                <Link href="/auth">
                  <span className="text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
                    Post an RFP
                  </span>
                </Link>
              </li>
              <li>
                <Link href="/leaderboard">
                  <span className="text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
                    Leaderboard
                  </span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="text-xs font-medium text-foreground uppercase tracking-wider mb-3">Company</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/about">
                  <span className="text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
                    About
                  </span>
                </Link>
              </li>
              <li>
                <Link href="/support">
                  <span className="text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
                    Support
                  </span>
                </Link>
              </li>
              <li>
                <Link href="/terms">
                  <span className="text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
                    Terms
                  </span>
                </Link>
              </li>
              <li>
                <Link href="/privacy-policy">
                  <span className="text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer" data-testid="link-privacy-policy">
                    Privacy Policy
                  </span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-xs font-medium text-foreground uppercase tracking-wider mb-3">Contact</h4>
            <ul className="space-y-2">
              <li>
                <a href="mailto:info@findconstructionbids.com" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  info@findconstructionbids.com
                </a>
              </li>
              <li>
                <a href="tel:+12034956300" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  (203) 495-6300
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} FindConstructionBids. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
