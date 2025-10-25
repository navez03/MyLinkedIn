import React, { useEffect, useMemo, useState } from "react";
import Navigation from "../components/header";
import {
  notificationAPI,
  Notification,
} from "../services/notificationsService";

// Util "2h ago"
function timeAgo(iso: string) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const sec = Math.floor(diffMs / 1000);
  const min = Math.floor(sec / 60);
  const hr = Math.floor(min / 60);
  const day = Math.floor(hr / 24);
  if (sec < 60) return `${sec}s ago`;
  if (min < 60) return `${min}m ago`;
  if (hr < 24) return `${hr}h ago`;
  return `${day}d ago`;
}

function mapToUIItem(n: Notification) {
  const type = n.kind === "connection_request" ? "connection" : "message";
  const isConnection = type === "connection";
  const user = isConnection ? "Connection" : "Message";
  const avatar = isConnection ? "CR" : "MS";
  const action = isConnection ? "new connection request" : "sent you a message";
  const time = timeAgo(n.created_at);

  return {
    id: n.id,
    type,
    user,
    avatar,
    action,
    time,
    unread: !n.is_read,
  };
}
type UIItem = ReturnType<typeof mapToUIItem>;

const Notifications: React.FC<{ userId?: string }> = ({ userId }) => {
  const [items, setItems] = useState<UIItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // userId efetivo (prop > localStorage)
  const currentUserId = useMemo(() => {
    if (userId) return userId;
    return localStorage.getItem("userId") || "";
  }, [userId]);

  const loadNotifications = async () => {
    setLoading(true);
    try {
      if (!currentUserId) {
        setItems([]);
        setError("Missing userId (prop ou localStorage).");
        return;
      }

      const response = await notificationAPI.list(currentUserId);

      if (!response.success) {
        throw new Error(response.error || "Failed to fetch notifications");
      }

      // Aceita { notifications: [...] } OU o array direto
      const payload =
        (response.data as any)?.notifications ??
        (Array.isArray(response.data) ? response.data : []);

      setItems((payload as Notification[]).map(mapToUIItem));
    } catch (error: any) {
      console.error("Error loading notifications:", error);
      setError(error?.message ?? "Error loading notifications");
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <div className="max-w-[1128px] mx-auto px-4 py-6">
        <div className="max-w-[680px] mx-auto">
          {/* Header */}
          <div className="bg-card rounded-lg border border-border p-4 mb-2">
            <h1 className="text-xl font-semibold text-foreground">
              Notifications
            </h1>
          </div>

          {/* Notifications List */}
          <div className="bg-card rounded-lg border border-border">
            {loading && (
              <div className="p-4 text-sm text-muted-foreground">Loading…</div>
            )}

            {error && !loading && (
              <div className="p-4 text-sm text-red-500">{error}</div>
            )}

            {!loading && !error && items.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 px-4">
                <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mb-4">
                  <span className="text-muted-foreground text-2xl">🔔</span>
                </div>
                <h2 className="text-lg font-semibold text-foreground mb-2">
                  No notifications yet
                </h2>
                <p className="text-sm text-muted-foreground text-center max-w-sm">
                  When you get notifications, they'll show up here
                </p>
              </div>
            )}

            {items.map((notification, index) => (
              <div
                key={notification.id}
                className={`flex items-start gap-3 p-4 hover:bg-secondary/50 transition-colors cursor-pointer ${
                  index !== items.length - 1 ? "border-b border-border" : ""
                } ${notification.unread ? "bg-secondary/30" : ""}`}
              >
                {/* Avatar */}
                <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                  <span className="text-sm text-primary-foreground font-semibold">
                    {notification.avatar}
                  </span>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground">
                    <span className="font-semibold">{notification.user}</span>{" "}
                    <span className="text-muted-foreground">
                      {notification.action}
                    </span>
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {notification.time}
                  </p>
                </div>

                {/* Unread indicator */}
                {notification.unread && (
                  <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-2"></div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Notifications;
