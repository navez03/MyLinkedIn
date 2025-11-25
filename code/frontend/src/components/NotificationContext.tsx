import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { notificationAPI } from '../services/notificationsService';

interface NotificationContextType {
  unreadCount: number;
  isLoading: boolean;
  refreshNotifications: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  const fetchNotifications = async () => {
    try {
      setIsLoading(true);
      const currentUserId = localStorage.getItem('userId');

      if (!currentUserId) {
        setUnreadCount(0);
        setIsLoading(false);
        return;
      }

      const response = await notificationAPI.list(currentUserId);
      if (response.success && response.data?.notifications) {
        const unread = response.data.notifications.filter(n => !n.is_read);
        setUnreadCount(unread.length);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Monitorizar mudanças no userId do localStorage
  useEffect(() => {
    const checkUserId = () => {
      const currentUserId = localStorage.getItem('userId');
      if (currentUserId !== userId) {
        setUserId(currentUserId);
        if (currentUserId) {
          fetchNotifications();
        } else {
          setUnreadCount(0);
        }
      }
    };

    // Handler para evento customizado de login
    const handleUserLogin = () => {
      checkUserId();
    };

    // Verificar imediatamente
    checkUserId();

    // Verificar periodicamente (para detectar login)
    const interval = setInterval(checkUserId, 1000);

    // Listener para mudanças de storage (funciona entre tabs)
    window.addEventListener('storage', checkUserId);

    // Listener para evento customizado de login
    window.addEventListener('user-logged-in', handleUserLogin);

    return () => {
      clearInterval(interval);
      window.removeEventListener('storage', checkUserId);
      window.removeEventListener('user-logged-in', handleUserLogin);
    };
  }, [userId]);

  const refreshNotifications = async () => {
    await fetchNotifications();
  };

  return (
    <NotificationContext.Provider value={{ unreadCount, isLoading, refreshNotifications }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};
