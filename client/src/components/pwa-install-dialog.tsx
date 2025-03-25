import { useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, X } from "lucide-react";
import { usePwaInstall } from "@/hooks/use-pwa-install";

export function PwaInstallDialog() {
  const { isInstallable, install, dismiss } = usePwaInstall();

  const handleInstall = async () => {
    await install();
  };

  const handleClose = () => {
    dismiss();
  };

  if (!isInstallable) return null;

  return (
    <Dialog open={isInstallable} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Install FindConstructionBids</DialogTitle>
          <DialogDescription>
            Install our app for a better experience with offline support and quick access.
          </DialogDescription>
        </DialogHeader>
        <div className="flex justify-between gap-3 mt-4">
          <Button
            variant="outline"
            onClick={handleClose}
          >
            Not Now
          </Button>
          <Button
            variant="default"
            className="gap-2"
            onClick={handleInstall}
          >
            <Download className="h-4 w-4" />
            Install App
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
