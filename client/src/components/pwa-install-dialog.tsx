import { useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, Share2 } from "lucide-react";
import { usePwaInstall } from "@/hooks/use-pwa-install";

export function PwaInstallDialog() {
  const { isInstallable, install, isIOS, isStandalone } = usePwaInstall();

  const handleInstall = async () => {
    await install();
  };

  if (!isInstallable || isStandalone) return null;

  return (
    <Dialog open={isInstallable} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Install FindConstructionBids</DialogTitle>
          <DialogDescription>
            {isIOS ? (
              <>
                To install our app on your iOS device:
                <ol className="mt-2 list-decimal list-inside space-y-1">
                  <li>Tap the share button <Share2 className="inline h-4 w-4" /></li>
                  <li>Scroll down and tap "Add to Home Screen"</li>
                  <li>Tap "Add" to install</li>
                </ol>
              </>
            ) : (
              "Install our app for a better experience with offline support and quick access."
            )}
          </DialogDescription>
        </DialogHeader>
        <div className="flex justify-end gap-3 mt-4">
          {!isIOS && (
            <Button
              variant="default"
              className="gap-2"
              onClick={handleInstall}
            >
              <Download className="h-4 w-4" />
              Install App
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}