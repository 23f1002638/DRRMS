import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { toast } from 'sonner';

export interface Notification {
    id: string;
    user_id: string;
    title: string;
    message: string;
    type: 'info' | 'success' | 'warning' | 'error';
    read: boolean;
    link?: string;
    created_at: string;
}

export function useNotifications() {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(true);

    async function fetchNotifications() {
        try {
            const session = await api.auth.getSession();
            if (!session?.user) {
                setNotifications([]);
                setUnreadCount(0);
                setLoading(false);
                return;
            }

            const data = await api.notifications.getAll();
            setNotifications(data || []);
            setUnreadCount((data || []).filter((n: Notification) => !n.read).length);
        } catch (error) {
            console.error('Error fetching notifications:', error);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        fetchNotifications();
        // Polling for notifications instead of real-time
        const interval = setInterval(fetchNotifications, 10000);
        return () => clearInterval(interval);
    }, []);

    async function markAsRead(id: string) {
        try {
            await api.notifications.markAsRead(id);

            // Optimistic update
            setNotifications(prev =>
                prev.map(n => n.id === id ? { ...n, read: true } : n)
            );
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (error) {
            console.error('Error marking notification as read:', error);
        }
    }

    async function markAllAsRead() {
        try {
            await api.notifications.markAllAsRead();

            // Optimistic update
            setNotifications(prev => prev.map(n => ({ ...n, read: true })));
            setUnreadCount(0);
        } catch (error) {
            console.error('Error marking all as read:', error);
        }
    }

    return {
        notifications,
        unreadCount,
        loading,
        markAsRead,
        markAllAsRead,
        refetch: fetchNotifications
    };
}
