import { Button } from "@/components/ui/button";
import { Download, Share2 } from "lucide-react";
import { usePwaInstall } from "@/hooks/use-pwa-install";

export function PwaInstallButton() {
  const { isInstallable, install, isIOS, isStandalone } = usePwaInstall();

  if (!isInstallable || isStandalone) return null;

  return (
    <Button
      variant="outline"
      className="gap-2"
      onClick={isIOS ? undefined : install}
    >
      {isIOS ? (
        <>
          <Share2 className="h-4 w-4" />
          Add to Home Screen
        </>
      ) : (
        <>
          <Download className="h-4 w-4" />
          Install App
        </>
      )}
    </Button>
  );
}