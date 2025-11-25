interface LogoProps {
  className?: string;
}

export function Logo({ className = "h-32" }: LogoProps) {
  return (
    <>
      <img
        src="/fcb-logo.png"
        alt="FCB Logo"
        className={`${className} block dark:hidden`}
      />
      <img
        src="/fcb-logo-white.png"
        alt="FCB Logo"
        className={`${className} hidden dark:block`}
      />
    </>
  );
}
