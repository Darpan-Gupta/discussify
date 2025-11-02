import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { useAuth } from './AuthContext'
import { notificationsAPI } from '../services/api'

interface Notification {
    _id: string
    type: 'discussion' | 'resource'
    title: string
    message: string
    community: {
        _id: string
        name: string
    }
    discussion?: {
        _id: string
        title: string
    }
    resource?: {
        _id: string
        title: string
    }
    isRead: boolean
    createdAt: string
}

interface NotificationPreferences {
    discussion: boolean
    resource: boolean
}

interface NotificationContextType {
    notifications: Notification[]
    unreadCount: number
    preferences: NotificationPreferences
    loading: boolean
    fetchNotifications: () => Promise<void>
    markAsRead: (id: string) => Promise<void>
    markAllAsRead: () => Promise<void>
    updatePreferences: (prefs: Partial<NotificationPreferences>) => Promise<void>
    refreshNotifications: () => void
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined)

export const useNotifications = () => {
    const context = useContext(NotificationContext)
    if (!context) {
        throw new Error('useNotifications must be used within NotificationProvider')
    }
    return context
}

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user } = useAuth()
    const [notifications, setNotifications] = useState<Notification[]>([])
    const [unreadCount, setUnreadCount] = useState(0)
    const [preferences, setPreferences] = useState<NotificationPreferences>({
        discussion: true,
        resource: true
    })
    const [loading, setLoading] = useState(false)

    const fetchNotifications = useCallback(async () => {
        if (!user) return

        try {
            setLoading(true)
            const response = await notificationsAPI.getAll({ limit: 50, page: 1 })
            setNotifications(response.data.notifications || [])
            setUnreadCount(response.data.unreadCount || 0)
        } catch (err) {
            console.error('Error fetching notifications:', err)
        } finally {
            setLoading(false)
        }
    }, [user])

    const fetchPreferences = useCallback(async () => {
        if (!user) return

        try {
            const response = await notificationsAPI.getPreferences()
            setPreferences(response.data.preferences || { discussion: true, resource: true })
        } catch (err) {
            console.error('Error fetching preferences:', err)
        }
    }, [user])

    const markAsRead = useCallback(async (id: string) => {
        try {
            await notificationsAPI.markAsRead(id)
            setNotifications(prev =>
                prev.map(n => n._id === id ? { ...n, isRead: true } : n)
            )
            setUnreadCount(prev => Math.max(0, prev - 1))
        } catch (err) {
            console.error('Error marking notification as read:', err)
        }
    }, [])

    const markAllAsRead = useCallback(async () => {
        try {
            await notificationsAPI.markAllAsRead()
            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
            setUnreadCount(0)
        } catch (err) {
            console.error('Error marking all as read:', err)
        }
    }, [])

    const updatePreferences = useCallback(async (prefs: Partial<NotificationPreferences>) => {
        try {
            await notificationsAPI.updatePreferences(prefs)
            setPreferences(prev => ({ ...prev, ...prefs }))
        } catch (err: any) {
            const errorMessage = err.response?.data?.error || err.response?.data?.message || 'Failed to update preferences'
            throw new Error(errorMessage)
        }
    }, [])

    const refreshNotifications = useCallback(() => {
        fetchNotifications()
    }, [fetchNotifications])

    useEffect(() => {
        if (user) {
            fetchNotifications()
            fetchPreferences()
            // Refresh notifications every 30 seconds
            const interval = setInterval(fetchNotifications, 30000)
            return () => clearInterval(interval)
        } else {
            setNotifications([])
            setUnreadCount(0)
        }
    }, [user, fetchNotifications, fetchPreferences])

    return (
        <NotificationContext.Provider
            value={{
                notifications,
                unreadCount,
                preferences,
                loading,
                fetchNotifications,
                markAsRead,
                markAllAsRead,
                updatePreferences,
                refreshNotifications
            }}
        >
            {children}
        </NotificationContext.Provider>
    )
}

