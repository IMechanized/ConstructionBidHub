import { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Bell, Moon, Smartphone, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { NotificationPreferencesSkeleton } from "@/components/skeletons";
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
    // -(getTimezoneOffset()) converts browser's "minutes behind UTC" to "UTC offset in minutes"
    // e.g. Eastern US (UTC-5): getTimezoneOffset()=300 → utcOffsetMinutes=-300
    const utcOffsetMinutes = -(new Date().getTimezoneOffset());
    await fetch("/api/notification-preferences", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        quietHoursEnabled: prefs.quietHoursEnabled,
        quietHoursStart: prefs.quietHoursStart,
        quietHoursEnd: prefs.quietHoursEnd,
        utcOffsetMinutes,
        notifyOnRfiResponse: prefs.notifyOnRfiResponse,
        notifyOnDeadlineReminder: prefs.notifyOnDeadlineReminder,
        notifyOnNewRfp: prefs.notifyOnNewRfp,
      }),
    });
  } catch (err) {
    console.error("Failed to sync notification preferences to server:", err);
  }
}

/** A single toggle row used throughout the panel */
function PreferenceRow({
  label,
  description,
  icon,
  children,
  alert,
}: {
  label: string;
  description?: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  alert?: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-4">
        <div className="space-y-0.5 min-w-0">
          <div className="flex items-center gap-1.5">
            {icon && <span className="text-muted-foreground shrink-0">{icon}</span>}
            <span className="text-[13px] font-medium leading-none">{label}</span>
          </div>
          {description && (
            <p className="text-sm text-muted-foreground">{description}</p>
          )}
        </div>
        <div className="shrink-0">{children}</div>
      </div>
      {alert}
    </div>
  );
}

export function NotificationPreferencesPanel() {
  const [preferences, setPreferences] = useState<NotificationPreferences>(getNotificationPreferences());
  const [permissionState, setPermissionState] = useState(getNotificationPermissionState());
  const [pushSubscribed, setPushSubscribed] = useState(false);
  const [pushSupported, setPushSupported] = useState(false);
  const [isPushLoading, setIsPushLoading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
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
      .catch(() => {})
      .finally(() => setIsLoading(false));
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

  if (isLoading) {
    return <NotificationPreferencesSkeleton />;
  }

  return (
    <div
      className="rounded-lg border border-border bg-card"
      data-testid="notification-preferences"
    >
      {/* ── Panel header ── */}
      <div className="px-6 py-5 border-b">
        <div className="flex items-center gap-2">
          <Bell className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-lg font-semibold">Notification Preferences</h2>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage how and when you receive notifications
        </p>
      </div>

      {/* ── Delivery channels ── */}
      <div className="px-6 py-5 space-y-5 border-b">
        {/* Browser Notifications */}
        <PreferenceRow
          label="Browser Notifications"
          description="Receive instant notifications while the app is open"
          alert={
            <>
              {!permissionState.supported && (
                <p className="text-sm text-destructive">
                  Your browser doesn't support notifications.
                </p>
              )}
              {permissionState.denied && (
                <p className="text-sm text-destructive">
                  Notifications are blocked. Please enable them in your browser settings.
                </p>
              )}
            </>
          }
        >
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
              variant="outline"
              data-testid="button-enable-browser-notifications"
            >
              Enable
            </Button>
          )}
        </PreferenceRow>

        {/* Push Notifications */}
        <PreferenceRow
          label="Push Notifications"
          description="Receive alerts even when the app is closed or the tab is not active"
          icon={<Smartphone className="h-3.5 w-3.5" />}
          alert={
            <>
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
            </>
          }
        >
          <div className="flex items-center gap-2">
            {isPushLoading && (
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            )}
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
        </PreferenceRow>

        {/* Email Notifications */}
        <PreferenceRow
          label="Email Notifications"
          description="Receive notifications via email"
        >
          <Switch
            id="email-notifications"
            checked={preferences.emailEnabled}
            onCheckedChange={(checked) => updatePreference("emailEnabled", checked)}
            data-testid="switch-email-notifications"
          />
        </PreferenceRow>

        {/* Email Digest */}
        <div className="space-y-1.5">
          <Label
            htmlFor="digest-mode"
            className="text-[13px] font-medium"
          >
            Email Digest
          </Label>
          <Select
            value={preferences.digestMode}
            onValueChange={(value: any) => updatePreference("digestMode", value)}
          >
            <SelectTrigger
              id="digest-mode"
              className="w-full sm:w-60"
              data-testid="select-digest-mode"
            >
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
      </div>

      {/* ── Notification types ── */}
      <div className="px-6 py-5 border-b space-y-4">
        <h3 className="text-lg font-semibold">Notification Types</h3>

        <PreferenceRow label="RFI Responses">
          <Switch
            id="notify-rfi"
            checked={preferences.notifyOnRfiResponse}
            onCheckedChange={(checked) => updatePreference("notifyOnRfiResponse", checked)}
            data-testid="switch-rfi-notifications"
          />
        </PreferenceRow>

        <PreferenceRow label="Deadline Reminders">
          <Switch
            id="notify-deadline"
            checked={preferences.notifyOnDeadlineReminder}
            onCheckedChange={(checked) => updatePreference("notifyOnDeadlineReminder", checked)}
            data-testid="switch-deadline-notifications"
          />
        </PreferenceRow>

        <PreferenceRow label="New RFPs">
          <Switch
            id="notify-new-rfp"
            checked={preferences.notifyOnNewRfp}
            onCheckedChange={(checked) => updatePreference("notifyOnNewRfp", checked)}
            data-testid="switch-new-rfp-notifications"
          />
        </PreferenceRow>
      </div>

      {/* ── Quiet hours ── */}
      <div className="px-6 py-5 space-y-4">
        <h3 className="text-lg font-semibold">Quiet Hours</h3>

        <PreferenceRow
          label="Enable Quiet Hours"
          description="Pause notifications during specific hours"
          icon={<Moon className="h-3.5 w-3.5" />}
        >
          <Switch
            id="quiet-hours"
            checked={preferences.quietHoursEnabled}
            onCheckedChange={(checked) => updatePreference("quietHoursEnabled", checked)}
            data-testid="switch-quiet-hours"
          />
        </PreferenceRow>

        {preferences.quietHoursEnabled && (
          <div className="grid grid-cols-2 gap-4 pl-5 border-l border-border ml-1">
            <div className="space-y-1.5">
              <Label
                htmlFor="quiet-start"
                className="text-[13px] font-medium"
              >
                Start Time
              </Label>
              <Input
                id="quiet-start"
                type="time"
                value={preferences.quietHoursStart}
                onChange={(e) => updatePreference("quietHoursStart", e.target.value)}
                data-testid="input-quiet-start"
              />
            </div>
            <div className="space-y-1.5">
              <Label
                htmlFor="quiet-end"
                className="text-[13px] font-medium"
              >
                End Time
              </Label>
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
    </div>
  );
}
