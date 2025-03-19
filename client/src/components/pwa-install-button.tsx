import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { usePwaInstall } from "@/hooks/use-pwa-install";

export function PwaInstallButton() {
  const { isInstallable, install } = usePwaInstall();

  if (!isInstallable) return null;

  return (
    <Button
      variant="outline"
      className="gap-2"
      onClick={install}
    >
      <Download className="h-4 w-4" />
      Install App
    </Button>
  );
}
