import { Link } from "wouter";
import { Logo } from "./logo";

export function Footer() {
  return (
    <footer aria-label="Site footer" className="border-t border-border bg-muted/20">
      <div className="container mx-auto px-6 py-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
          {/* Logo and Description */}
          <div className="space-y-3">
            <Logo className="h-10" />
            <p className="text-[0.8125rem] text-muted-foreground leading-relaxed max-w-[36ch]">
              Government RFP marketplace for construction contractors.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-[0.75rem] font-medium tracking-[0.05em] uppercase text-muted-foreground mb-4">Quick Links</h4>
            <ul className="space-y-2.5">
              <li>
                <Link href="/about">
                  <span className="text-[0.875rem] text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
                    About
                  </span>
                </Link>
              </li>
              <li>
                <Link href="/auth">
                  <span className="text-[0.875rem] text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
                    Register
                  </span>
                </Link>
              </li>
              <li>
                <Link href="/support">
                  <span className="text-[0.875rem] text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
                    Support
                  </span>
                </Link>
              </li>
              <li>
                <Link href="/terms">
                  <span className="text-[0.875rem] text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
                    Terms & Conditions
                  </span>
                </Link>
              </li>
              <li>
                <Link href="/privacy-policy">
                  <span className="text-[0.875rem] text-muted-foreground hover:text-foreground transition-colors cursor-pointer" data-testid="link-privacy-policy">
                    Privacy Policy
                  </span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-[0.75rem] font-medium tracking-[0.05em] uppercase text-muted-foreground mb-4">Contact</h4>
            <ul className="space-y-2.5">
              <li>
                <a
                  href="mailto:info@findconstructionbids.com"
                  className="text-[0.875rem] text-muted-foreground hover:text-foreground transition-colors"
                >
                  info@findconstructionbids.com
                </a>
              </li>
              <li>
                <a
                  href="tel:+12034956300"
                  className="text-[0.875rem] text-muted-foreground hover:text-foreground transition-colors"
                >
                  (203) 495-6300
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-[0.8125rem] text-muted-foreground">
            © {new Date().getFullYear()} FindConstructionBids. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
