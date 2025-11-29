interface LogoProps {
  className?: string;
}

export function Logo({ className }: LogoProps) {
  return (
    <>
      {/* Mobile logos (visible on small screens only) */}
      <div className="md:hidden">
        <img
          src="/fcb-logo.png"
          alt="FCB Logo"
          className="h-20 md:h-20 block dark:hidden"
        />
        <img
          src="/fcb-logo-white.png"
          alt="FCB Logo"
          className="h-20 md:h-20 hidden dark:block"
        />
      </div>
      
      {/* Desktop logos (visible on medium screens and up) */}
      <div className="hidden md:block">
        <img
          src="/fcb-logo.png"
          alt="FCB Logo"
          className="h-32 md:h-32 block dark:hidden"
        />
        <img
          src="/fcb-logo-white.png"
          alt="FCB Logo"
          className="h-32 md:h-32 hidden dark:block"
        />
      </div>
    </>
  );
}
