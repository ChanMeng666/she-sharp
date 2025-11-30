import { db } from '@/lib/db/drizzle';
import { sql } from 'drizzle-orm';

export type NotificationType = 'event' | 'mentorship' | 'resource' | 'system' | 'meeting';

interface CreateNotificationParams {
  userId: number;
  type: NotificationType;
  title: string;
  message: string;
  actionUrl?: string;
  actionLabel?: string;
  metadata?: any;
}

interface CreateBulkNotificationParams {
  userIds: number[];
  type: NotificationType;
  title: string;
  message: string;
  actionUrl?: string;
  actionLabel?: string;
  metadata?: any;
}

export class NotificationService {
  /**
   * Create a notification for a single user
   */
  static async createNotification(params: CreateNotificationParams) {
    try {
      // Check user's notification preferences
      const prefsResult = await db.execute(sql`
        SELECT * FROM notification_preferences
        WHERE user_id = ${params.userId}
        LIMIT 1
      `);

      const prefs = prefsResult[0] as any;
      
      // Check if in-app notifications are enabled for this type
      const inappEnabled = prefs ? prefs[`inapp_${params.type}`] : true;
      
      if (inappEnabled) {
        // Create in-app notification
        const [notification] = await db.execute(sql`
          INSERT INTO notifications (
            user_id,
            type,
            title,
            message,
            action_url,
            action_label,
            metadata
          )
          VALUES (
            ${params.userId},
            ${params.type},
            ${params.title},
            ${params.message},
            ${params.actionUrl || null},
            ${params.actionLabel || null},
            ${params.metadata ? JSON.stringify(params.metadata) : null}::jsonb
          )
          RETURNING *
        `);

        // Check if email notifications are enabled
        const emailEnabled = prefs ? prefs[`email_${params.type}`] : true;
        
        if (emailEnabled && prefs?.email_enabled) {
          // Queue email notification
          await NotificationService.queueEmail({
            userId: params.userId,
            subject: params.title,
            content: params.message,
            type: params.type,
            actionUrl: params.actionUrl,
          });
        }

        return notification;
      }

      return null;
    } catch (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  }

  /**
   * Create notifications for multiple users
   */
  static async createBulkNotifications(params: CreateBulkNotificationParams) {
    try {
      const notifications = await Promise.all(
        params.userIds.map(userId =>
          NotificationService.createNotification({
            ...params,
            userId,
          })
        )
      );

      return notifications.filter(n => n !== null);
    } catch (error) {
      console.error('Error creating bulk notifications:', error);
      throw error;
    }
  }

  /**
   * Queue an email to be sent
   */
  static async queueEmail(params: {
    userId: number;
    subject: string;
    content: string;
    type: NotificationType;
    actionUrl?: string;
    priority?: number;
  }) {
    try {
      // Get user's email
      const userResult = await db.execute(sql`
        SELECT email, name FROM users
        WHERE id = ${params.userId}
        LIMIT 1
      `);

      const user = userResult[0] as any;
      
      if (!user) {
        console.error('User not found for email notification');
        return;
      }

      // Create HTML email content
      const htmlContent = NotificationService.generateEmailHtml({
        userName: user.name || 'Member',
        title: params.subject,
        message: params.content,
        actionUrl: params.actionUrl,
        type: params.type,
      });

      // Queue the email
      await db.execute(sql`
        INSERT INTO email_queue (
          to_email,
          subject,
          html_content,
          text_content,
          priority,
          metadata
        )
        VALUES (
          ${user.email},
          ${params.subject},
          ${htmlContent},
          ${params.content},
          ${params.priority || 5},
          ${JSON.stringify({ userId: params.userId, type: params.type })}::jsonb
        )
      `);
    } catch (error) {
      console.error('Error queuing email:', error);
      throw error;
    }
  }

  /**
   * Generate HTML email template
   */
  static generateEmailHtml(params: {
    userName: string;
    title: string;
    message: string;
    actionUrl?: string;
    type: NotificationType;
  }): string {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://shesharp.org';
    
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${params.title}</title>
          <style>
            body { 
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              background-color: #f5f5f5;
              margin: 0;
              padding: 0;
            }
            .container {
              max-width: 600px;
              margin: 40px auto;
              background: white;
              border-radius: 8px;
              overflow: hidden;
              box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            }
            .header {
              background: #000000;
              color: white;
              padding: 30px;
              text-align: center;
            }
            .header h1 {
              margin: 0;
              font-size: 24px;
            }
            .content {
              padding: 30px;
            }
            .message {
              font-size: 16px;
              color: #555;
              margin: 20px 0;
            }
            .button {
              display: inline-block;
              padding: 12px 24px;
              background: #000000;
              color: white;
              text-decoration: none;
              border-radius: 4px;
              font-weight: 500;
              margin: 20px 0;
            }
            .button:hover {
              background: #7a2469;
            }
            .footer {
              background: #f9f9f9;
              padding: 20px;
              text-align: center;
              font-size: 14px;
              color: #777;
            }
            .footer a {
              color: #000000;
              text-decoration: none;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>She Sharp</h1>
            </div>
            <div class="content">
              <h2>Hi ${params.userName},</h2>
              <h3>${params.title}</h3>
              <div class="message">
                ${params.message}
              </div>
              ${params.actionUrl ? `
                <div style="text-align: center;">
                  <a href="${params.actionUrl}" class="button">View Details</a>
                </div>
              ` : ''}
            </div>
            <div class="footer">
              <p>
                You received this email because you have notifications enabled for ${params.type} updates.
                <br>
                <a href="${baseUrl}/dashboard/notifications/settings">Manage your notification preferences</a>
              </p>
              <p>
                © ${new Date().getFullYear()} She Sharp. All rights reserved.
              </p>
            </div>
          </div>
        </body>
      </html>
    `;
  }

  /**
   * Send notification when a mentorship request is received
   */
  static async notifyMentorshipRequest(mentorId: number, menteeId: number, menteeName: string) {
    await NotificationService.createNotification({
      userId: mentorId,
      type: 'mentorship',
      title: 'New Mentorship Request',
      message: `${menteeName} has requested to be your mentee`,
      actionUrl: '/dashboard/mentorship',
      actionLabel: 'Review Request',
      metadata: { menteeId },
    });
  }

  /**
   * Send notification when a mentorship request is approved
   */
  static async notifyMentorshipApproval(menteeId: number, mentorName: string) {
    await NotificationService.createNotification({
      userId: menteeId,
      type: 'mentorship',
      title: 'Mentorship Request Approved',
      message: `${mentorName} has accepted your mentorship request!`,
      actionUrl: '/dashboard/mentorship',
      actionLabel: 'View Details',
    });
  }

  /**
   * Send notification when a meeting is scheduled
   */
  static async notifyMeetingScheduled(userId: number, meetingDetails: {
    title: string;
    date: Date;
    otherPersonName: string;
  }) {
    await NotificationService.createNotification({
      userId,
      type: 'meeting',
      title: 'Meeting Scheduled',
      message: `Meeting "${meetingDetails.title}" scheduled with ${meetingDetails.otherPersonName} on ${meetingDetails.date.toLocaleDateString()}`,
      actionUrl: '/dashboard/meetings',
      actionLabel: 'View Meeting',
    });
  }

  /**
   * Send notification when an event registration is confirmed
   */
  static async notifyEventRegistration(userId: number, eventName: string, eventId: number) {
    await NotificationService.createNotification({
      userId,
      type: 'event',
      title: 'Event Registration Confirmed',
      message: `You have successfully registered for "${eventName}"`,
      actionUrl: `/dashboard/events/${eventId}`,
      actionLabel: 'View Event',
      metadata: { eventId },
    });
  }

  /**
   * Send notification when a new resource is available
   */
  static async notifyNewResource(userIds: number[], resourceTitle: string, resourceId: number) {
    await NotificationService.createBulkNotifications({
      userIds,
      type: 'resource',
      title: 'New Resource Available',
      message: `A new resource "${resourceTitle}" has been added to the library`,
      actionUrl: `/dashboard/resources/${resourceId}`,
      actionLabel: 'View Resource',
      metadata: { resourceId },
    });
  }

  /**
   * Get unread notification count for a user
   */
  static async getUnreadCount(userId: number): Promise<number> {
    try {
      const result = await db.execute(sql`
        SELECT COUNT(*) as count
        FROM notifications
        WHERE user_id = ${userId} AND read = false
      `);

      return parseInt((result[0] as any)?.count || '0');
    } catch (error) {
      console.error('Error getting unread count:', error);
      return 0;
    }
  }
}