import React, { useEffect, useMemo, useState } from "react";
import Navigation from "../components/header";
import { MessageSquare, Users, Check, Trash2, CheckCheck } from "lucide-react";
import { notificationAPI, Notification } from "../services/notificationsService";
import AIChatWidget from "../components/AIChatWidget";
import Loading from "../components/loading";


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

type UIItem = {
  id: string;
  type: string;
  user: string;
  avatarUrl?: string | null;
  IconComponent: React.ComponentType<any>;
  action: string;
  time: string;
  unread: boolean;
};

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

      const notifications = payload as Notification[];

      // Mapear notificações para items de UI
      const uiItems = notifications.map((n) => {
        const type = n.kind === "connection_request" ? "connection" : "message";
        const isConnection = type === "connection";
        const IconComponent = isConnection ? Users : MessageSquare;
        const action = isConnection ? "sent you a connection request" : "sent you a message";
        const time = timeAgo(n.created_at);
        const senderName = n.sender_name || "Someone";

        return {
          id: n.id,
          type,
          user: senderName,
          avatarUrl: n.sender_avatar_url,
          IconComponent,
          action,
          time,
          unread: !n.is_read,
        };
      });

      setItems(uiItems);
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

  const handleMarkRead = async (notificationId: string) => {
    try {
      const response = await notificationAPI.markRead({ notificationId, read: true });
      if (response.success && response.data && response.data.notification) {
        setItems((prev) =>
          prev.map((item) =>
            item.id === notificationId
              ? { ...item, is_read: true, unread: false }
              : item
          )
        );
      }
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  const handleDelete = async (notificationId: string) => {
    try {
      await notificationAPI.delete(notificationId);
      // Remove da lista localmente
      setItems((prev) => prev.filter((item) => item.id !== notificationId));
    } catch (error) {
      console.error("Error deleting notification:", error);
    }
  };

  const handleMarkAllRead = async () => {
    if (!currentUserId) return;
    try {
      await notificationAPI.markAllRead({ userId: currentUserId });
      // Marca todas como lidas localmente
      setItems((prev) => prev.map((item) => ({ ...item, unread: false })));
    } catch (error) {
      console.error("Error marking all as read:", error);
    }
  };

  return (
    <>
      {loading ? (
        <Loading />
      ) : (
        <div style={{ overflowY: 'auto', height: '100vh' }}>
          <div className="min-h-screen bg-background">
            <Navigation />
            <div className="max-w-[1128px] mx-auto px-4 py-6">
              <div className="max-w-[680px] mx-auto">
                {/* Header */}
                <div className="bg-card rounded-lg border border-border p-4 mb-2 flex items-center justify-between">
                  <h1 className="text-xl font-semibold text-foreground">
                    Notifications
                  </h1>
                  {items.length > 0 && items.some((item) => item.unread) && (
                    <button
                      onClick={handleMarkAllRead}
                      className="flex items-center gap-2 px-3 py-1.5 text-sm text-primary hover:bg-secondary rounded-md transition-colors"
                    >
                      <CheckCheck className="w-4 h-4" />
                      Mark all as read
                    </button>
                  )}
                </div>
                {/* Notifications List */}
                <div className="bg-card rounded-lg border border-border">
                  {error && (
                    <div className="p-4 text-sm text-red-500">{error}</div>
                  )}
                  {!error && items.length === 0 && (
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
                      className={`flex items-start gap-3 p-4 hover:bg-secondary/50 transition-colors ${index !== items.length - 1 ? "border-b border-border" : ""}
                          ${notification.unread ? "bg-secondary/30" : ""}`}
                    >
                      {/* Avatar */}
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden ${!notification.avatarUrl ? 'bg-primary' : ''}`}>
                        {notification.avatarUrl ? (
                          <img
                            src={notification.avatarUrl}
                            alt={notification.user}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                              if (e.currentTarget.nextElementSibling) {
                                e.currentTarget.nextElementSibling.classList.remove('hidden');
                              }
                            }}
                          />
                        ) : null}
                        <div className={notification.avatarUrl ? 'hidden' : ''}>
                          <notification.IconComponent className="w-6 h-6 text-primary-foreground" />
                        </div>
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
                      {/* Action buttons */}
                      <div className="flex items-center gap-2">
                        {notification.unread && (
                          <button
                            onClick={() => handleMarkRead(notification.id)}
                            className="p-2 hover:bg-secondary rounded-full transition-colors"
                            title="Mark as read"
                          >
                            <Check className="w-4 h-4 text-muted-foreground hover:text-foreground" />
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(notification.id)}
                          className="p-2 hover:bg-secondary rounded-full transition-colors"
                          title="Delete notification"
                        >
                          <Trash2 className="w-4 h-4 text-muted-foreground hover:text-red-500" />
                        </button>
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
        </div>
      )}
      <AIChatWidget />
    </>
  );
};

export default Notifications;
