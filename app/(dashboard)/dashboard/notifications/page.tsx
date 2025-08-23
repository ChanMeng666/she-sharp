'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Bell, 
  Calendar, 
  Users, 
  FileText, 
  CheckCircle,
  Info,
  AlertCircle,
  Mail,
  Settings,
  Archive,
  Trash2,
  Sparkles,
  ArrowRight,
  Clock
} from 'lucide-react';
import { format } from 'date-fns';

interface Notification {
  id: number;
  type: 'event' | 'mentorship' | 'resource' | 'system';
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  actionUrl?: string;
  actionLabel?: string;
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const response = await fetch('/api/notifications');
      if (response.ok) {
        const data = await response.json();
        const formattedNotifications = data.notifications.map((n: any) => ({
          id: n.id,
          type: n.type,
          title: n.title,
          message: n.message,
          read: n.read,
          createdAt: n.created_at,
          actionUrl: n.action_url,
          actionLabel: n.action_label,
        }));
        setNotifications(formattedNotifications);
      } else {
        console.error('Failed to fetch notifications');
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id: number) => {
    try {
      const response = await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'mark_read',
          notificationIds: [id],
        }),
      });
      
      if (response.ok) {
        setNotifications(prev =>
          prev.map(n => n.id === id ? { ...n, read: true } : n)
        );
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const response = await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'mark_all_read',
        }),
      });
      
      if (response.ok) {
        setNotifications(prev =>
          prev.map(n => ({ ...n, read: true }))
        );
      }
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const deleteNotification = async (id: number) => {
    try {
      const response = await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'delete',
          notificationIds: [id],
        }),
      });
      
      if (response.ok) {
        setNotifications(prev => prev.filter(n => n.id !== id));
      }
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'event':
        return <Calendar className="h-5 w-5" />;
      case 'mentorship':
        return <Users className="h-5 w-5" />;
      case 'resource':
        return <FileText className="h-5 w-5" />;
      case 'system':
        return <Info className="h-5 w-5" />;
      default:
        return <Bell className="h-5 w-5" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'event':
        return 'bg-purple-light text-purple-dark';
      case 'mentorship':
        return 'bg-periwinkle-light text-periwinkle-dark';
      case 'resource':
        return 'bg-mint-light text-mint-dark';
      case 'system':
        return 'bg-navy-light text-navy-dark';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getTimeAgo = (date: string) => {
    const now = new Date();
    const notificationDate = new Date(date);
    const diffInMs = now.getTime() - notificationDate.getTime();
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    if (diffInMinutes < 60) {
      return `${diffInMinutes} minute${diffInMinutes !== 1 ? 's' : ''} ago`;
    } else if (diffInHours < 24) {
      return `${diffInHours} hour${diffInHours !== 1 ? 's' : ''} ago`;
    } else if (diffInDays < 7) {
      return `${diffInDays} day${diffInDays !== 1 ? 's' : ''} ago`;
    } else {
      return format(notificationDate, 'PPP');
    }
  };

  const filteredNotifications = activeTab === 'unread' 
    ? notifications.filter(n => !n.read)
    : notifications;

  const unreadCount = notifications.filter(n => !n.read).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-dark mx-auto"></div>
          <p className="mt-4 text-gray">Loading notifications...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-4 sm:py-6 lg:py-8 px-4 sm:px-6 lg:px-8 max-w-7xl">
      {/* Header Section */}
      <div className="mb-6 sm:mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
              <Bell className="h-5 w-5 sm:h-6 sm:w-6 text-purple-dark flex-shrink-0" />
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-purple-dark to-purple-mid bg-clip-text text-transparent">
                Notifications
              </h1>
            </div>
            <p className="text-gray text-base sm:text-lg">
              Stay updated with your events, mentorship, and resources
            </p>
          </div>
          <div className="flex gap-2">
            {unreadCount > 0 && (
              <Button 
                variant="outline"
                onClick={markAllAsRead}
                size="sm"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Mark all read
              </Button>
            )}
            <Button 
              variant="outline"
              className="border-gray-300 hover:border-purple-mid/30 hover:bg-purple-light/30"
              size="sm"
            >
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </Button>
          </div>
        </div>
      </div>

      {/* Unread Alert */}
      {unreadCount > 0 && (
        <Alert className="mb-6 sm:mb-8 border-purple-mid/20 bg-purple-light/20">
          <Bell className="h-4 w-4 text-purple-dark" />
          <AlertDescription className="text-navy-dark">
            <strong className="font-semibold">You have {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}!</strong>
            <span className="block sm:inline"> Stay informed about your activities and updates.</span>
          </AlertDescription>
        </Alert>
      )}

      {/* Tabs Section */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full max-w-xs grid-cols-2 bg-purple-light/20 p-1">
          <TabsTrigger 
            value="all"
            className="data-[state=active]:bg-white data-[state=active]:text-purple-dark data-[state=active]:shadow-sm"
          >
            All ({notifications.length})
          </TabsTrigger>
          <TabsTrigger 
            value="unread"
            className="data-[state=active]:bg-white data-[state=active]:text-purple-dark data-[state=active]:shadow-sm relative"
          >
            Unread ({unreadCount})
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 h-2 w-2 bg-purple-dark rounded-full animate-pulse"></span>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="space-y-4">
          {filteredNotifications.length === 0 ? (
            <Card className="border-purple-light shadow-sm">
              <CardContent className="text-center py-12">
                <Sparkles className="h-12 w-12 text-purple-mid mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-navy-dark mb-2">
                  {activeTab === 'unread' ? 'All caught up!' : 'No notifications'}
                </h3>
                <p className="text-gray">
                  {activeTab === 'unread' 
                    ? 'You\'ve read all your notifications' 
                    : 'Notifications will appear here when you have updates'}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {filteredNotifications.map(notification => (
                <Card 
                  key={notification.id} 
                  className={`group hover:shadow-lg transition-all duration-300 ${
                    !notification.read 
                      ? 'border-purple-mid/30 bg-gradient-to-r from-purple-light/10 to-periwinkle-light/10' 
                      : 'border-gray-200 bg-white'
                  }`}
                >
                  <CardContent className="p-4 sm:p-6">
                    <div className="flex items-start gap-4">
                      <div className={`p-2.5 rounded-lg ${getTypeColor(notification.type)} flex-shrink-0`}>
                        {getIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4">
                          <div className="space-y-1 flex-1">
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold text-navy-dark">
                                {notification.title}
                              </h3>
                              {!notification.read && (
                                <span className="flex h-2 w-2">
                                  <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-purple-dark opacity-75"></span>
                                  <span className="relative inline-flex rounded-full h-2 w-2 bg-purple-dark"></span>
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-gray">
                              {notification.message}
                            </p>
                            <div className="flex items-center gap-2 text-xs text-gray pt-1">
                              <Clock className="h-3 w-3" />
                              <span>{getTimeAgo(notification.createdAt)}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            {!notification.read && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => markAsRead(notification.id)}
                                className="text-purple-dark hover:bg-purple-light"
                              >
                                <CheckCircle className="h-4 w-4" />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => deleteNotification(notification.id)}
                              className="text-gray hover:text-error hover:bg-error/10"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        {notification.actionUrl && (
                          <Button
                            variant="link"
                            className="p-0 h-auto text-purple-dark hover:text-purple-mid mt-3 text-sm font-medium"
                            onClick={() => window.location.href = notification.actionUrl!}
                          >
                            {notification.actionLabel || 'View'}
                            <ArrowRight className="ml-1 h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}