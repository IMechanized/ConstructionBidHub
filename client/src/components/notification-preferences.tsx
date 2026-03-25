import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Bell, BellOff, Moon, Smartphone, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  getNotificationPermissionState,
  requestNotificationPermission,
  getNotificationPreferences,
  saveNotificationPreferences,
  checkPushSupport,
  subscribeToPush,
  unsubscribeFromPush,
  isPushSubscribed,
  NotificationPreferences,
} from "@/lib/push-notifications";

/** Fields that are persisted server-side for push enforcement */
const SERVER_SYNCED_FIELDS: (keyof NotificationPreferences)[] = [
  "quietHoursEnabled",
  "quietHoursStart",
  "quietHoursEnd",
  "notifyOnRfiResponse",
  "notifyOnDeadlineReminder",
  "notifyOnNewRfp",
];

async function syncPreferencesToServer(prefs: NotificationPreferences): Promise<void> {
  try {
    await fetch("/api/notification-preferences", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        quietHoursEnabled: prefs.quietHoursEnabled,
        quietHoursStart: prefs.quietHoursStart,
        quietHoursEnd: prefs.quietHoursEnd,
        notifyOnRfiResponse: prefs.notifyOnRfiResponse,
        notifyOnDeadlineReminder: prefs.notifyOnDeadlineReminder,
        notifyOnNewRfp: prefs.notifyOnNewRfp,
      }),
    });
  } catch (err) {
    console.error("Failed to sync notification preferences to server:", err);
  }
}

export function NotificationPreferencesPanel() {
  const [preferences, setPreferences] = useState<NotificationPreferences>(getNotificationPreferences());
  const [permissionState, setPermissionState] = useState(getNotificationPermissionState());
  const [pushSubscribed, setPushSubscribed] = useState(false);
  const [pushSupported, setPushSupported] = useState(false);
  const [isPushLoading, setIsPushLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    setPermissionState(getNotificationPermissionState());
    setPushSupported(checkPushSupport());
    isPushSubscribed().then(setPushSubscribed);

    // Load server-side preferences and merge with local
    fetch("/api/notification-preferences", { credentials: "include" })
      .then((r) => (r.ok ? r.json() : null))
      .then((serverPrefs) => {
        if (serverPrefs) {
          const merged: NotificationPreferences = {
            ...getNotificationPreferences(),
            quietHoursEnabled: serverPrefs.quietHoursEnabled,
            quietHoursStart: serverPrefs.quietHoursStart,
            quietHoursEnd: serverPrefs.quietHoursEnd,
            notifyOnRfiResponse: serverPrefs.notifyOnRfiResponse,
            notifyOnDeadlineReminder: serverPrefs.notifyOnDeadlineReminder,
            notifyOnNewRfp: serverPrefs.notifyOnNewRfp,
          };
          setPreferences(merged);
          saveNotificationPreferences(merged);
        }
      })
      .catch(() => {});
  }, []);

  const handleEnableBrowserNotifications = async () => {
    if (!permissionState.supported) {
      toast({
        title: "Not supported",
        description: "Your browser doesn't support notifications",
        variant: "destructive",
      });
      return;
    }

    if (permissionState.denied) {
      toast({
        title: "Permission denied",
        description: "Please enable notifications in your browser settings",
        variant: "destructive",
      });
      return;
    }

    const granted = await requestNotificationPermission();
    if (granted) {
      updatePreference("browserEnabled", true);
      setPermissionState(getNotificationPermissionState());
      toast({
        title: "Notifications enabled",
        description: "You'll now receive browser notifications",
      });
    } else {
      toast({
        title: "Permission denied",
        description: "Notifications were not enabled",
        variant: "destructive",
      });
    }
  };

  const handleTogglePush = async (enable: boolean) => {
    setIsPushLoading(true);
    try {
      if (enable) {
        // Request browser permission first if not already granted
        const permState = getNotificationPermissionState();
        if (!permState.granted) {
          const granted = await requestNotificationPermission();
          if (!granted) {
            toast({
              title: "Permission required",
              description: "Please allow notifications in your browser to enable push notifications",
              variant: "destructive",
            });
            setIsPushLoading(false);
            return;
          }
          setPermissionState(getNotificationPermissionState());
        }

        const success = await subscribeToPush();
        if (success) {
          setPushSubscribed(true);
          updatePreference("pushEnabled", true);
          toast({
            title: "Push notifications enabled",
            description: "You'll receive notifications even when the app is closed",
          });
        } else {
          toast({
            title: "Could not enable push notifications",
            description: "Please check your browser settings and try again",
            variant: "destructive",
          });
        }
      } else {
        const success = await unsubscribeFromPush();
        if (success) {
          setPushSubscribed(false);
          updatePreference("pushEnabled", false);
          toast({
            title: "Push notifications disabled",
            description: "You'll no longer receive push notifications on this device",
          });
        } else {
          toast({
            title: "Could not disable push notifications",
            description: "Please try again",
            variant: "destructive",
          });
        }
      }
    } finally {
      setIsPushLoading(false);
    }
  };

  const updatePreference = <K extends keyof NotificationPreferences>(
    key: K,
    value: NotificationPreferences[K]
  ) => {
    const updated = { ...preferences, [key]: value };
    setPreferences(updated);
    saveNotificationPreferences(updated);
    // Sync to server for fields that control push notification delivery
    if (SERVER_SYNCED_FIELDS.includes(key)) {
      syncPreferencesToServer(updated);
    }
  };

  return (
    <div className="space-y-6" data-testid="notification-preferences">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notification Preferences
          </CardTitle>
          <CardDescription>
            Manage how and when you receive notifications
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Browser Notifications */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="browser-notifications">Browser Notifications</Label>
                <p className="text-sm text-muted-foreground">
                  Receive instant notifications while the app is open
                </p>
              </div>
              {preferences.browserEnabled ? (
                <Switch
                  id="browser-notifications"
                  checked={preferences.browserEnabled}
                  onCheckedChange={(checked) => updatePreference("browserEnabled", checked)}
                  data-testid="switch-browser-notifications"
                />
              ) : (
                <Button
                  onClick={handleEnableBrowserNotifications}
                  size="sm"
                  data-testid="button-enable-browser-notifications"
                >
                  Enable
                </Button>
              )}
            </div>

            {!permissionState.supported && (
              <p className="text-sm text-destructive">
                Your browser doesn't support notifications
              </p>
            )}
            {permissionState.denied && (
              <p className="text-sm text-destructive">
                Notifications are blocked. Please enable them in your browser settings.
              </p>
            )}
          </div>

          {/* Push Notifications */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="push-notifications" className="flex items-center gap-2">
                  <Smartphone className="h-4 w-4" />
                  Push Notifications
                </Label>
                <p className="text-sm text-muted-foreground">
                  Receive alerts even when the app is closed or the tab is not active
                </p>
              </div>
              <div className="flex items-center gap-2">
                {isPushLoading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
                {pushSupported ? (
                  <Switch
                    id="push-notifications"
                    checked={pushSubscribed}
                    onCheckedChange={handleTogglePush}
                    disabled={isPushLoading}
                    data-testid="switch-push-notifications"
                  />
                ) : (
                  <span className="text-sm text-muted-foreground">Not supported</span>
                )}
              </div>
            </div>
            {pushSubscribed && (
              <p className="text-sm text-green-600 dark:text-green-400">
                This device is registered for push notifications.
              </p>
            )}
            {!pushSupported && (
              <p className="text-sm text-muted-foreground">
                Push notifications require a modern browser with service worker support.
              </p>
            )}
          </div>

          {/* Email Notifications */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="email-notifications">Email Notifications</Label>
              <p className="text-sm text-muted-foreground">
                Receive notifications via email
              </p>
            </div>
            <Switch
              id="email-notifications"
              checked={preferences.emailEnabled}
              onCheckedChange={(checked) => updatePreference("emailEnabled", checked)}
              data-testid="switch-email-notifications"
            />
          </div>

          {/* Digest Mode */}
          <div className="space-y-2">
            <Label htmlFor="digest-mode">Email Digest</Label>
            <Select
              value={preferences.digestMode}
              onValueChange={(value: any) => updatePreference("digestMode", value)}
            >
              <SelectTrigger id="digest-mode" data-testid="select-digest-mode">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="instant">Instant (as they happen)</SelectItem>
                <SelectItem value="daily">Daily digest</SelectItem>
                <SelectItem value="weekly">Weekly digest</SelectItem>
                <SelectItem value="never">Never</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Notification Types */}
          <div className="space-y-4 pt-4 border-t">
            <h4 className="font-semibold text-sm">Notification Types</h4>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="notify-rfi">RFI Responses</Label>
              <Switch
                id="notify-rfi"
                checked={preferences.notifyOnRfiResponse}
                onCheckedChange={(checked) => updatePreference("notifyOnRfiResponse", checked)}
                data-testid="switch-rfi-notifications"
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="notify-deadline">Deadline Reminders</Label>
              <Switch
                id="notify-deadline"
                checked={preferences.notifyOnDeadlineReminder}
                onCheckedChange={(checked) => updatePreference("notifyOnDeadlineReminder", checked)}
                data-testid="switch-deadline-notifications"
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="notify-new-rfp">New RFPs</Label>
              <Switch
                id="notify-new-rfp"
                checked={preferences.notifyOnNewRfp}
                onCheckedChange={(checked) => updatePreference("notifyOnNewRfp", checked)}
                data-testid="switch-new-rfp-notifications"
              />
            </div>
          </div>

          {/* Quiet Hours */}
          <div className="space-y-4 pt-4 border-t">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="quiet-hours" className="flex items-center gap-2">
                  <Moon className="h-4 w-4" />
                  Quiet Hours
                </Label>
                <p className="text-sm text-muted-foreground">
                  Pause notifications during specific hours
                </p>
              </div>
              <Switch
                id="quiet-hours"
                checked={preferences.quietHoursEnabled}
                onCheckedChange={(checked) => updatePreference("quietHoursEnabled", checked)}
                data-testid="switch-quiet-hours"
              />
            </div>

            {preferences.quietHoursEnabled && (
              <div className="grid grid-cols-2 gap-4 pl-6">
                <div className="space-y-2">
                  <Label htmlFor="quiet-start">Start Time</Label>
                  <Input
                    id="quiet-start"
                    type="time"
                    value={preferences.quietHoursStart}
                    onChange={(e) => updatePreference("quietHoursStart", e.target.value)}
                    data-testid="input-quiet-start"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="quiet-end">End Time</Label>
                  <Input
                    id="quiet-end"
                    type="time"
                    value={preferences.quietHoursEnd}
                    onChange={(e) => updatePreference("quietHoursEnd", e.target.value)}
                    data-testid="input-quiet-end"
                  />
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
