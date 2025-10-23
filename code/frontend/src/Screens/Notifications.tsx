import React from 'react';
import Navigation from '../components/header';

const Notifications: React.FC = () => {
  // Sample notifications data
  const notifications = [
    {
      id: 1,
      type: 'connection',
      user: 'Sarah Johnson',
      avatar: 'SJ',
      action: 'accepted your connection request',
      time: '2h ago',
      unread: true,
    },
    {
      id: 2,
      type: 'like',
      user: 'Michael Chen',
      avatar: 'MC',
      action: 'liked your post about React development',
      time: '5h ago',
      unread: true,
    },
    {
      id: 3,
      type: 'comment',
      user: 'Emily Rodriguez',
      avatar: 'ER',
      action: 'commented on your post',
      time: '1d ago',
      unread: false,
    },
    {
      id: 4,
      type: 'mention',
      user: 'David Kim',
      avatar: 'DK',
      action: 'mentioned you in a comment',
      time: '2d ago',
      unread: false,
    },
    {
      id: 5,
      type: 'job',
      user: 'LinkedIn Jobs',
      avatar: 'LJ',
      action: 'New job postings match your preferences',
      time: '3d ago',
      unread: false,
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="max-w-[1128px] mx-auto px-4 py-6">
        <div className="max-w-[680px] mx-auto">
          {/* Header */}
          <div className="bg-card rounded-lg border border-border p-4 mb-2">
            <h1 className="text-xl font-semibold text-foreground">Notifications</h1>
          </div>

          {/* Notifications List */}
          <div className="bg-card rounded-lg border border-border">
            {notifications.map((notification, index) => (
              <div
                key={notification.id}
                className={`flex items-start gap-3 p-4 hover:bg-secondary/50 transition-colors cursor-pointer ${
                  index !== notifications.length - 1 ? 'border-b border-border' : ''
                } ${notification.unread ? 'bg-secondary/30' : ''}`}
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
                    <span className="font-semibold">{notification.user}</span>{' '}
                    <span className="text-muted-foreground">{notification.action}</span>
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">{notification.time}</p>
                </div>

                {/* Unread indicator */}
                {notification.unread && (
                  <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-2"></div>
                )}
              </div>
            ))}

            {/* Empty state (uncomment if no notifications) */}
            {/* <div className="flex flex-col items-center justify-center py-16 px-4">
              <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mb-4">
                <Bell className="w-8 h-8 text-muted-foreground" />
              </div>
              <h2 className="text-lg font-semibold text-foreground mb-2">No notifications yet</h2>
              <p className="text-sm text-muted-foreground text-center max-w-sm">
                When you get notifications, they'll show up here
              </p>
            </div> */}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Notifications;