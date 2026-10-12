interface LogoProps {
  className?: string;
}

export function Logo({ className }: LogoProps) {
  return (
    <>
      {/* Light mode logo */}
      <img
        src="/fcb-logo.png"
        alt="FindConstructionBids"
        className={`h-10 w-auto block dark:hidden ${className ?? ""}`}
      />
      {/* Dark mode logo */}
      <img
        src="/fcb-logo-white.png"
        alt="FindConstructionBids"
        className={`h-10 w-auto hidden dark:block ${className ?? ""}`}
      />
    </>
  );
}
