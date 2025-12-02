import { redirect } from 'next/navigation';

/**
 * Mentor Applications Page - Redirects to unified User Management
 *
 * This page has been consolidated into the unified User Management page.
 * All mentor application functionality is now available at /dashboard/admin/users
 * with the "Application" filter set to view pending applications.
 */
export default function MentorApplicationsPage() {
  // Redirect to unified user management page with application filter
  redirect('/dashboard/admin/users?application=pending');
}
