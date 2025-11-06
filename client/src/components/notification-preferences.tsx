import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Bell, BellOff, Moon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  getNotificationPermissionState,
  requestNotificationPermission,
  getNotificationPreferences,
  saveNotificationPreferences,
  NotificationPreferences,
} from "@/lib/push-notifications";

export function NotificationPreferencesPanel() {
  const [preferences, setPreferences] = useState<NotificationPreferences>(getNotificationPreferences());
  const [permissionState, setPermissionState] = useState(getNotificationPermissionState());
  const { toast } = useToast();

  useEffect(() => {
    // Update permission state on mount and when preferences change
    setPermissionState(getNotificationPermissionState());
  }, [preferences.browserEnabled]);

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

  const updatePreference = <K extends keyof NotificationPreferences>(
    key: K,
    value: NotificationPreferences[K]
  ) => {
    const updated = { ...preferences, [key]: value };
    setPreferences(updated);
    saveNotificationPreferences(updated);
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
                  Receive instant notifications in your browser
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
