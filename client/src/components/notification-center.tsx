import { useState } from "react";
import { Bell, Mail, Clock, AlertCircle, X, CheckCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useNotifications } from "@/hooks/use-notifications";
import { Link } from "wouter";
import { format, isToday, isYesterday } from "date-fns";
import { cn } from "@/lib/utils";
import type { Notification } from "@shared/schema";

function NotificationIcon({ type }: { type: Notification["type"] }) {
  switch (type) {
    case "rfi_response":
      return <Mail className="h-4 w-4 text-chart-3" />;
    case "deadline_reminder":
      return <Clock className="h-4 w-4 text-chart-4" />;
    case "system":
    default:
      return <AlertCircle className="h-4 w-4 text-muted-foreground" />;
  }
}

function formatGroupKey(dateStr: string | Date) {
  const date = new Date(dateStr);
  if (isToday(date)) return "Today";
  if (isYesterday(date)) return "Yesterday";
  return format(date, "MMMM d");
}

function groupByDate(notifications: Notification[]) {
  const groups: Record<string, Notification[]> = {};
  for (const n of notifications) {
    const key = formatGroupKey(n.createdAt);
    if (!groups[key]) groups[key] = [];
    groups[key].push(n);
  }
  return groups;
}

function getHref(n: Notification): string | null {
  if (!n.relatedId) return null;
  if (n.relatedType === "rfi") return `/dashboard/rfi-management/${n.relatedId}`;
  if (n.relatedType === "rfp") return `/rfp/${n.relatedId}`;
  return null;
}

function NotificationRow({
  n,
  onDelete,
  onRead,
}: {
  n: Notification;
  onDelete: (id: number) => void;
  onRead: (id: number) => void;
}) {
  const href = getHref(n);

  const handleClick = () => {
    if (!n.isRead) {
      onRead(n.id);
    }
  };

  const inner = (
    <div
      className={cn(
        "group relative flex gap-3 px-4 py-3 transition-colors duration-150",
        n.isRead ? "hover:bg-accent/40" : "bg-primary/5 hover:bg-primary/10"
      )}
      onClick={href ? undefined : handleClick}
    >
      <div className="mt-0.5 shrink-0">
        <NotificationIcon type={n.type} />
      </div>
      <div className="flex-1 min-w-0 pr-6">
        <p className={cn(
          "text-[0.8125rem] leading-snug",
          n.isRead ? "font-normal text-foreground" : "font-medium text-foreground"
        )}>
          {n.title}
        </p>
        <p className="text-[0.75rem] text-muted-foreground mt-0.5 line-clamp-2">
          {n.message}
        </p>
        <p className="text-[0.6875rem] text-muted-foreground mt-1">
          {format(new Date(n.createdAt), "h:mm a")}
        </p>
      </div>
      {!n.isRead && (
        <span className="absolute top-3.5 right-8 h-2 w-2 rounded-full bg-primary" />
      )}
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-2.5 right-1.5 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-foreground"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onDelete(n.id);
        }}
        aria-label="Dismiss notification"
      >
        <X className="h-3.5 w-3.5" />
      </Button>
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="block hover:no-underline" onClick={handleClick}>
        {inner}
      </Link>
    );
  }
  return inner;
}

export function NotificationCenter() {
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    isLoading,
  } = useNotifications();
  const [tab, setTab] = useState<"all" | "unread">("all");

  const displayed = tab === "unread" ? notifications.filter(n => !n.isRead) : notifications;
  const groups = groupByDate(displayed);
  const groupKeys = Object.keys(groups);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative h-9 w-9 text-muted-foreground hover:text-foreground"
          aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ""}`}
        >
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[0.625rem] font-bold text-destructive-foreground">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent
        className="w-[380px] p-0 shadow-lg"
        align="end"
        sideOffset={8}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <h3 className="text-[0.9375rem] font-semibold">Notifications</h3>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 gap-1.5 text-[0.75rem] text-muted-foreground hover:text-foreground"
              onClick={markAllAsRead}
            >
              <CheckCheck className="h-3.5 w-3.5" />
              Mark all read
            </Button>
          )}
        </div>

        {/* Tabs */}
        <Tabs value={tab} onValueChange={(v) => setTab(v as "all" | "unread")}>
          <TabsList className="w-full rounded-none border-b border-border bg-transparent p-0 h-9">
            <TabsTrigger
              value="all"
              className="flex-1 rounded-none h-full text-[0.8125rem] border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary"
            >
              All
            </TabsTrigger>
            <TabsTrigger
              value="unread"
              className="flex-1 rounded-none h-full text-[0.8125rem] border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary"
            >
              Unread
              {unreadCount > 0 && (
                <span className="ml-1.5 rounded-full bg-primary/10 px-1.5 py-0.5 text-[0.625rem] font-medium text-primary">
                  {unreadCount}
                </span>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value={tab} className="mt-0">
            <ScrollArea className="h-[380px]">
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <p className="text-[0.8125rem] text-muted-foreground">Loading…</p>
                </div>
              ) : groupKeys.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
                  <Bell className="h-10 w-10 text-border mb-3" />
                  <p className="text-[0.8125rem] font-medium text-foreground">
                    {tab === "unread" ? "All caught up" : "No notifications"}
                  </p>
                  <p className="text-[0.75rem] text-muted-foreground mt-1">
                    {tab === "unread"
                      ? "You've read everything."
                      : "Notifications for RFIs, deadlines, and updates will appear here."}
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {groupKeys.map(group => (
                    <div key={group}>
                      <p className="px-4 py-2 text-[0.6875rem] font-medium uppercase tracking-wider text-muted-foreground bg-muted/40">
                        {group}
                      </p>
                      {groups[group].map(n => (
                        <NotificationRow
                          key={n.id}
                          n={n}
                          onDelete={deleteNotification}
                          onRead={markAsRead}
                        />
                      ))}
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </PopoverContent>
    </Popover>
  );
}
