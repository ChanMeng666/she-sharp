'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { 
  User, 
  Lock, 
  Mail, 
  Shield, 
  CheckCircle2, 
  XCircle,
  AlertTriangle,
  Eye,
  EyeOff,
  RefreshCw,
  Monitor, 
  Smartphone, 
  Tablet,
  Globe,
  MapPin,
  Clock,
  LogOut,
  Activity
} from 'lucide-react';

interface Session {
  id: number;
  deviceInfo?: string;
  deviceType?: string;
  browser?: string;
  os?: string;
  ipAddress?: string;
  lastActivity: string;
  createdAt: string;
  isCurrent?: boolean;
}

function AccountPageContent() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'profile' | 'password' | 'sessions' | 'privacy'>('profile');
  
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // Profile form
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');

  // Password form
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPasswords, setShowPasswords] = useState(false);

  // Email verification
  const [isVerified, setIsVerified] = useState(false);
  const [isSendingVerification, setIsSendingVerification] = useState(false);

  // Sessions
  const [sessions, setSessions] = useState<Session[]>([]);
  const [isLoadingSessions, setIsLoadingSessions] = useState(false);
  const [isRevoking, setIsRevoking] = useState(false);
  const [sessionToRevoke, setSessionToRevoke] = useState<number | null>(null);
  const [showRevokeDialog, setShowRevokeDialog] = useState(false);

  // Account deletion
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');

  useEffect(() => {
    fetchUserData();
  }, []);

  useEffect(() => {
    if (activeTab === 'sessions') {
      fetchSessions();
    }
  }, [activeTab]);

  const fetchUserData = async () => {
    try {
      const response = await fetch('/api/user');
      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
        setName(userData.name || '');
        setEmail(userData.email || '');
        setIsVerified(!!userData.emailVerifiedAt);
      } else {
        setError('Failed to load user data');
      }
    } catch (err) {
      setError('An error occurred while loading user data');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSessions = async () => {
    setIsLoadingSessions(true);
    try {
      // Mock data for now - replace with actual API call
      const mockSessions: Session[] = [
        {
          id: 1,
          deviceType: 'desktop',
          browser: 'Chrome',
          os: 'Windows 11',
          ipAddress: '192.168.1.1',
          lastActivity: new Date().toISOString(),
          createdAt: new Date(Date.now() - 86400000).toISOString(),
          isCurrent: true,
        },
        {
          id: 2,
          deviceType: 'mobile',
          browser: 'Safari',
          os: 'iOS 17',
          ipAddress: '192.168.1.2',
          lastActivity: new Date(Date.now() - 3600000).toISOString(),
          createdAt: new Date(Date.now() - 172800000).toISOString(),
        },
      ];
      setSessions(mockSessions);
    } catch (err) {
      setError('Failed to load sessions');
    } finally {
      setIsLoadingSessions(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdating(true);
    setError('');
    setMessage('');

    try {
      const response = await fetch('/api/user/update-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage('Profile updated successfully');
        if (email !== user.email) {
          setIsVerified(false);
          setMessage('Profile updated. Please verify your new email address.');
        }
      } else {
        setError(data.error || 'Failed to update profile');
      }
    } catch (err) {
      setError('An error occurred while updating profile');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setIsUpdating(true);
    setError('');
    setMessage('');

    try {
      const response = await fetch('/api/user/update-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          currentPassword, 
          newPassword,
          confirmPassword 
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage('Password updated successfully');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setError(data.error || 'Failed to update password');
      }
    } catch (err) {
      setError('An error occurred while updating password');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleSendVerification = async () => {
    setIsSendingVerification(true);
    setError('');
    setMessage('');

    try {
      const response = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user.email }),
      });

      if (response.ok) {
        setMessage('Verification email sent! Please check your inbox.');
      } else {
        setError('Failed to send verification email');
      }
    } catch (err) {
      setError('An error occurred while sending verification email');
    } finally {
      setIsSendingVerification(false);
    }
  };

  const handleRevokeSession = async (sessionId: number) => {
    setIsRevoking(true);
    setError('');
    setMessage('');

    try {
      // Mock API call - replace with actual implementation
      await new Promise(resolve => setTimeout(resolve, 1000));
      setMessage('Session revoked successfully');
      setSessions(sessions.filter(s => s.id !== sessionId));
    } catch (err) {
      setError('Failed to revoke session');
    } finally {
      setIsRevoking(false);
      setShowRevokeDialog(false);
      setSessionToRevoke(null);
    }
  };

  const handleRevokeAllOther = async () => {
    setIsRevoking(true);
    setError('');
    setMessage('');

    try {
      // Mock API call - replace with actual implementation
      await new Promise(resolve => setTimeout(resolve, 1000));
      setMessage('All other sessions revoked successfully');
      setSessions(sessions.filter(s => s.isCurrent));
    } catch (err) {
      setError('Failed to revoke sessions');
    } finally {
      setIsRevoking(false);
    }
  };

  const handleDeleteAccount = async () => {
    // Implement account deletion logic
    console.log('Delete account with password:', deletePassword);
  };

  const passwordRequirements = [
    { label: 'At least 8 characters', met: newPassword.length >= 8 },
    { label: 'Contains uppercase letter', met: /[A-Z]/.test(newPassword) },
    { label: 'Contains lowercase letter', met: /[a-z]/.test(newPassword) },
    { label: 'Contains number', met: /[0-9]/.test(newPassword) },
    { label: 'Contains special character', met: /[!@#$%^&*]/.test(newPassword) },
  ];

  const getDeviceIcon = (deviceType?: string) => {
    switch (deviceType) {
      case 'mobile':
        return <Smartphone className="h-5 w-5" />;
      case 'tablet':
        return <Tablet className="h-5 w-5" />;
      default:
        return <Monitor className="h-5 w-5" />;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    
    if (hours < 1) return 'Just now';
    if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days} day${days > 1 ? 's' : ''} ago`;
    return date.toLocaleDateString();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-5xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">Account Settings</h1>
        <p className="text-muted-foreground mt-2">Manage your account settings and preferences</p>
      </div>

      {message && (
        <Alert className="mb-6 border-green-200 bg-green-50">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">{message}</AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="password">Security</TabsTrigger>
          <TabsTrigger value="sessions">Sessions</TabsTrigger>
          <TabsTrigger value="privacy">Verification</TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>
                Update your account profile information
              </CardDescription>
            </CardHeader>
            <form onSubmit={handleUpdateProfile}>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your name"
                    disabled={isUpdating}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={isUpdating}
                  />
                  {email !== user?.email && (
                    <p className="text-sm text-amber-600">
                      Changing your email will require verification
                    </p>
                  )}
                </div>
              </CardContent>
              <CardFooter>
                <Button 
                  type="submit" 
                  disabled={isUpdating}
                  className=""
                >
                  {isUpdating ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    <>
                      <User className="mr-2 h-4 w-4" />
                      Update Profile
                    </>
                  )}
                </Button>
              </CardFooter>
            </form>
          </Card>
        </TabsContent>

        <TabsContent value="password">
          <Card>
            <CardHeader>
              <CardTitle>Password & Security</CardTitle>
              <CardDescription>
                Manage your password and account security settings
              </CardDescription>
            </CardHeader>
            <form onSubmit={handleUpdatePassword}>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="currentPassword">Current Password</Label>
                  <div className="relative">
                    <Input
                      id="currentPassword"
                      type={showPasswords ? 'text' : 'password'}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      required
                      disabled={isUpdating}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswords(!showPasswords)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPasswords ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="newPassword">New Password</Label>
                  <Input
                    id="newPassword"
                    type={showPasswords ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    disabled={isUpdating}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm New Password</Label>
                  <Input
                    id="confirmPassword"
                    type={showPasswords ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    disabled={isUpdating}
                  />
                </div>

                {newPassword && (
                  <div className="space-y-2 rounded-lg bg-muted p-3">
                    <p className="text-sm font-medium text-foreground">Password Requirements:</p>
                    <ul className="space-y-1">
                      {passwordRequirements.map((req, index) => (
                        <li key={index} className="flex items-center text-sm">
                          {req.met ? (
                            <CheckCircle2 className="mr-2 h-4 w-4 text-green-500" />
                          ) : (
                            <XCircle className="mr-2 h-4 w-4 text-muted-foreground" />
                          )}
                          <span className={req.met ? 'text-green-700' : 'text-muted-foreground'}>
                            {req.label}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button 
                  type="submit" 
                  disabled={isUpdating || !passwordRequirements.every(req => req.met) || newPassword !== confirmPassword}
                  className=""
                >
                  {isUpdating ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    <>
                      <Lock className="mr-2 h-4 w-4" />
                      Update Password
                    </>
                  )}
                </Button>
              </CardFooter>
            </form>
          </Card>

          <Card className="mt-6 border-red-200">
            <CardHeader>
              <CardTitle className="text-red-600">Danger Zone</CardTitle>
              <CardDescription>
                Permanent account deletion
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Once you delete your account, there is no going back. All your data will be permanently removed.
              </p>
            </CardContent>
            <CardFooter>
              <Button
                variant="destructive"
                onClick={() => setShowDeleteDialog(true)}
              >
                <AlertTriangle className="mr-2 h-4 w-4" />
                Delete Account
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="sessions">
          <Card>
            <CardHeader>
              <CardTitle>Active Sessions</CardTitle>
              <CardDescription>
                Manage devices and browsers where you're currently signed in
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {isLoadingSessions ? (
                <div className="flex items-center justify-center py-8">
                  <RefreshCw className="h-8 w-8 animate-spin text-foreground" />
                </div>
              ) : sessions.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No active sessions found</p>
              ) : (
                <div className="space-y-4">
                  {sessions.map((session) => (
                    <div key={session.id} className="flex items-start justify-between p-4 border rounded-lg">
                      <div className="flex items-start space-x-4">
                        <div className="mt-1">
                          {getDeviceIcon(session.deviceType)}
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <p className="font-medium">
                              {session.browser} on {session.os}
                            </p>
                            {session.isCurrent && (
                              <Badge variant="secondary">Current</Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Globe className="h-3 w-3" />
                              {session.ipAddress}
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              Last active: {formatDate(session.lastActivity)}
                            </div>
                          </div>
                        </div>
                      </div>
                      {!session.isCurrent && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSessionToRevoke(session.id);
                            setShowRevokeDialog(true);
                          }}
                          disabled={isRevoking}
                        >
                          <LogOut className="h-4 w-4" />
                          Revoke
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
            {sessions.filter(s => !s.isCurrent).length > 0 && (
              <CardFooter>
                <Button
                  variant="outline"
                  onClick={handleRevokeAllOther}
                  disabled={isRevoking}
                  className="w-full"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Revoke All Other Sessions
                </Button>
              </CardFooter>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="privacy">
          <Card>
            <CardHeader>
              <CardTitle>Email Verification</CardTitle>
              <CardDescription>
                Verify your email address to access all features
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-3">
                {isVerified ? (
                  <>
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100">
                      <CheckCircle2 className="h-6 w-6 text-green-600" />
                    </div>
                    <div>
                      <p className="font-medium">Email Verified</p>
                      <p className="text-sm text-muted-foreground">
                        Your email address has been verified
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100">
                      <AlertTriangle className="h-6 w-6 text-amber-600" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">Email Not Verified</p>
                      <p className="text-sm text-muted-foreground">
                        Please verify your email address to access all features
                      </p>
                    </div>
                  </>
                )}
              </div>

              {!isVerified && (
                <Alert className="border-amber-200 bg-amber-50">
                  <Mail className="h-4 w-4 text-amber-600" />
                  <AlertDescription>
                    We've sent a verification link to <strong>{user?.email}</strong>.
                    Please check your inbox and click the link to verify your account.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
            {!isVerified && (
              <CardFooter>
                <Button
                  onClick={handleSendVerification}
                  disabled={isSendingVerification}
                  variant="outline"
                  className="w-full"
                >
                  {isSendingVerification ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Mail className="mr-2 h-4 w-4" />
                      Resend Verification Email
                    </>
                  )}
                </Button>
              </CardFooter>
            )}
          </Card>
        </TabsContent>
      </Tabs>

      {/* Delete Account Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete your account
              and remove all your data from our servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="my-4">
            <Label htmlFor="delete-password">Enter your password to confirm</Label>
            <Input
              id="delete-password"
              type="password"
              value={deletePassword}
              onChange={(e) => setDeletePassword(e.target.value)}
              placeholder="Enter your password"
              className="mt-2"
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeletePassword('')}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAccount}
              disabled={!deletePassword}
              className="bg-destructive text-destructive-foreground border-destructive hover:bg-destructive/80 hover:border-destructive/80"
            >
              Delete Account
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Revoke Session Dialog */}
      <AlertDialog open={showRevokeDialog} onOpenChange={setShowRevokeDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Revoke Session?</AlertDialogTitle>
            <AlertDialogDescription>
              This will sign out the selected device. You'll need to sign in again on that device.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => sessionToRevoke && handleRevokeSession(sessionToRevoke)}
            >
              Revoke Session
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default function AccountPage() {
  return <AccountPageContent />;
}