'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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
import { PhotoUpload } from '@/components/forms/photo-upload';
import {
  User,
  Lock,
  Mail,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Eye,
  EyeOff,
  RefreshCw,
  Phone,
  Calendar,
  Users,
  Link as LinkIcon,
  Clock,
  Info,
  Trash2,
} from 'lucide-react';

interface ConnectedAccount {
  provider: string;
  providerAccountId: string;
  type: string;
  email?: string;
}

const genderOptions = [
  { value: 'female', label: 'Female' },
  { value: 'male', label: 'Male' },
  { value: 'non_binary', label: 'Non-binary' },
  { value: 'prefer_not_to_say', label: 'Prefer not to say' },
  { value: 'other', label: 'Other' },
];

function AccountPageContent() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'profile' | 'password' | 'privacy'>('profile');

  const [user, setUser] = useState<Record<string, unknown> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // User roles and auth info
  const [activeRoles, setActiveRoles] = useState<string[]>([]);
  const [hasPassword, setHasPassword] = useState(true);
  const [connectedAccounts, setConnectedAccounts] = useState<ConnectedAccount[]>([]);
  const [currentPhotoUrl, setCurrentPhotoUrl] = useState<string>('');

  // Profile form
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [age, setAge] = useState<number | ''>('');
  const [gender, setGender] = useState<string>('');
  const [photoUrl, setPhotoUrl] = useState<string | undefined>(undefined);

  // Password form
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPasswords, setShowPasswords] = useState(false);

  // Email verification
  const [isVerified, setIsVerified] = useState(false);
  const [isSendingVerification, setIsSendingVerification] = useState(false);

  // Account deletion
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteEmailConfirm, setDeleteEmailConfirm] = useState('');

  // Computed properties
  const isAdmin = activeRoles.includes('admin');
  const isMentor = activeRoles.includes('mentor');
  const isMentee = activeRoles.includes('mentee');
  const showExtendedProfile = isMentor || isMentee;

  useEffect(() => {
    fetchUserData();
    fetchRolesAndPhoto();
    fetchConnectedAccounts();
  }, []);

  const fetchUserData = async () => {
    try {
      const response = await fetch('/api/user');
      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
        setName(userData.name || '');
        setEmail(userData.email || '');
        setPhone(userData.phone || '');
        setAge(userData.age || '');
        setGender(userData.gender || '');
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

  const fetchRolesAndPhoto = async () => {
    try {
      const [rolesRes, photoRes] = await Promise.all([
        fetch('/api/user/roles'),
        fetch('/api/user/profile-photo'),
      ]);

      if (rolesRes.ok) {
        const rolesData = await rolesRes.json();
        setActiveRoles(rolesData.activeRoles || []);
      }

      if (photoRes.ok) {
        const photoData = await photoRes.json();
        setCurrentPhotoUrl(photoData.photoUrl || '');
        setPhotoUrl(photoData.photoUrl || undefined);
      }
    } catch (err) {
      console.error('Error fetching roles/photo:', err);
    }
  };

  const fetchConnectedAccounts = async () => {
    try {
      const response = await fetch('/api/user/connected-accounts');
      if (response.ok) {
        const data = await response.json();
        setConnectedAccounts(data.accounts || []);
        setHasPassword(data.hasPassword);
      }
    } catch (err) {
      console.error('Error fetching connected accounts:', err);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdating(true);
    setError('');
    setMessage('');

    try {
      const profileData: Record<string, unknown> = { name, email };

      // Only include extended fields for mentor/mentee
      if (showExtendedProfile) {
        profileData.phone = phone || null;
        profileData.age = age || null;
        profileData.gender = gender || null;
        if (photoUrl) {
          profileData.image = photoUrl;
        }
      }

      const response = await fetch('/api/user/update-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profileData),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage(data.message || 'Profile updated successfully');
        if (data.emailChanged) {
          setIsVerified(false);
        }
        // Refresh photo
        fetchRolesAndPhoto();
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
        body: JSON.stringify({ email: user?.email }),
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

  const handleDeleteAccount = async () => {
    setIsUpdating(true);
    setError('');

    try {
      // Use password for users with passwords, email confirmation for OAuth users
      const body = hasPassword
        ? { password: deletePassword }
        : { emailConfirm: deleteEmailConfirm };

      const response = await fetch('/api/user/delete-account', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        router.push('/sign-in');
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to delete account');
      }
    } catch (err) {
      setError('An error occurred while deleting account');
    } finally {
      setIsUpdating(false);
      setShowDeleteDialog(false);
      setDeletePassword('');
      setDeleteEmailConfirm('');
    }
  };

  const handlePhotoChange = (url: string | undefined) => {
    setPhotoUrl(url);
  };

  const passwordRequirements = [
    { label: 'At least 8 characters', met: newPassword.length >= 8 },
    { label: 'Contains uppercase letter', met: /[A-Z]/.test(newPassword) },
    { label: 'Contains lowercase letter', met: /[a-z]/.test(newPassword) },
    { label: 'Contains number', met: /[0-9]/.test(newPassword) },
    { label: 'Contains special character', met: /[!@#$%^&*]/.test(newPassword) },
  ];

  const getProviderIcon = (provider: string) => {
    switch (provider.toLowerCase()) {
      case 'google':
        return (
          <svg className="h-5 w-5" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
        );
      case 'github':
        return (
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
          </svg>
        );
      default:
        return <LinkIcon className="h-5 w-5" />;
    }
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
        {activeRoles.length > 0 && (
          <div className="flex gap-2 mt-3">
            {activeRoles.map(role => (
              <Badge key={role} variant="secondary" className="capitalize">
                {role}
              </Badge>
            ))}
          </div>
        )}
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

      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as typeof activeTab)} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="password">Security</TabsTrigger>
          <TabsTrigger value="privacy">Verification</TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>
                {isAdmin && !showExtendedProfile
                  ? 'Update your basic account information'
                  : 'Update your profile information and photo'}
              </CardDescription>
            </CardHeader>
            <form onSubmit={handleUpdateProfile}>
              <CardContent className="space-y-6">
                {/* Profile Photo - Only for mentor/mentee */}
                {showExtendedProfile && (
                  <div className="space-y-4">
                    <Label>Profile Photo</Label>
                    <div className="flex items-start gap-6">
                      <Avatar className="h-24 w-24">
                        <AvatarImage src={photoUrl || currentPhotoUrl} alt={name} />
                        <AvatarFallback className="text-2xl">
                          {name?.charAt(0)?.toUpperCase() || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <PhotoUpload
                          value={photoUrl}
                          onChange={handlePhotoChange}
                          type={isMentor ? 'mentor' : 'mentee'}
                          email={email}
                          label=""
                          description="Upload a new profile photo"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Basic Info */}
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="name">
                      <User className="inline h-4 w-4 mr-1" />
                      Name
                    </Label>
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
                    <Label htmlFor="email">
                      <Mail className="inline h-4 w-4 mr-1" />
                      Email Address
                    </Label>
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
                </div>

                {/* Extended fields - Only for mentor/mentee */}
                {showExtendedProfile && (
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="space-y-2">
                      <Label htmlFor="phone">
                        <Phone className="inline h-4 w-4 mr-1" />
                        Phone (optional)
                      </Label>
                      <Input
                        id="phone"
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="Your phone number"
                        disabled={isUpdating}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="age">
                        <Calendar className="inline h-4 w-4 mr-1" />
                        Age (optional)
                      </Label>
                      <Input
                        id="age"
                        type="number"
                        value={age}
                        onChange={(e) => setAge(e.target.value ? parseInt(e.target.value) : '')}
                        placeholder="Your age"
                        min={13}
                        max={120}
                        disabled={isUpdating}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="gender">
                        <Users className="inline h-4 w-4 mr-1" />
                        Gender (optional)
                      </Label>
                      <Select value={gender} onValueChange={setGender} disabled={isUpdating}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select gender" />
                        </SelectTrigger>
                        <SelectContent>
                          {genderOptions.map(option => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}

                <Button type="submit" disabled={isUpdating}>
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
              </CardContent>
            </form>
          </Card>
        </TabsContent>

        <TabsContent value="password">
          {/* Connected Accounts - For OAuth users */}
          {connectedAccounts.length > 0 && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Connected Accounts</CardTitle>
                <CardDescription>
                  External accounts linked to your profile
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {connectedAccounts.map((account, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        {getProviderIcon(account.provider)}
                        <div>
                          <p className="font-medium capitalize">{account.provider}</p>
                          <p className="text-sm text-muted-foreground">{account.email}</p>
                        </div>
                      </div>
                      <Badge variant="secondary">Connected</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Password Form - Only if user has password */}
          {hasPassword ? (
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

                  <Button
                    type="submit"
                    disabled={isUpdating || !passwordRequirements.every(req => req.met) || newPassword !== confirmPassword}
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
                </CardContent>
              </form>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Password</CardTitle>
                <CardDescription>
                  You signed up using an external provider
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Your account is connected to an external provider ({connectedAccounts.map(a => a.provider).join(', ')}).
                  You can sign in using your connected account.
                </p>
              </CardContent>
            </Card>
          )}

          <Card className="mt-6 border-red-200">
            <CardHeader>
              <CardTitle className="text-red-600 flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Danger Zone
              </CardTitle>
              <CardDescription>
                Account deletion and data removal
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Deleting your account will immediately disable access. Your data will be retained
                for 30 days before permanent removal, allowing account recovery if needed.
              </p>

              {/* Impact Summary - Collapsible */}
              <details className="text-sm">
                <summary className="cursor-pointer text-muted-foreground hover:text-foreground font-medium">
                  What happens when I delete my account?
                </summary>
                <ul className="mt-3 space-y-2 text-muted-foreground ml-4">
                  <li className="flex items-start gap-2">
                    <XCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                    <span>Immediate loss of access to dashboard and member features</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <XCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                    <span>Active mentorship relationships will be terminated</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <XCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                    <span>Event registrations and history will be removed</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <XCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                    <span>Points and rewards will be forfeited</span>
                  </li>
                </ul>
              </details>

              <div className="flex items-center gap-4">
                <Button
                  variant="destructive"
                  onClick={() => setShowDeleteDialog(true)}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Account
                </Button>
                <a
                  href="/privacy-policy"
                  className="text-sm text-muted-foreground hover:text-foreground underline"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Learn more about data retention
                </a>
              </div>
            </CardContent>
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
                <>
                  <Alert className="border-amber-200 bg-amber-50">
                    <Mail className="h-4 w-4 text-amber-600" />
                    <AlertDescription>
                      We've sent a verification link to <strong>{user?.email as string}</strong>.
                      Please check your inbox and click the link to verify your account.
                    </AlertDescription>
                  </Alert>

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
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Delete Account Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              Delete Your Account?
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-4">
                <p>
                  Your account will be deactivated immediately and you will lose access to all
                  She Sharp member features.
                </p>

                {/* Data Retention Notice */}
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-amber-800">
                  <p className="flex items-start gap-2 text-sm">
                    <Clock className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <span>
                      <strong>30-day recovery period:</strong> Your data will be retained for
                      30 days. During this time, you can contact us to recover your account.
                      After 30 days, all data will be permanently deleted.
                    </span>
                  </p>
                </div>

                {/* OAuth-specific notice */}
                {!hasPassword && connectedAccounts.length > 0 && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-blue-800">
                    <p className="flex items-start gap-2 text-sm">
                      <Info className="h-4 w-4 mt-0.5 flex-shrink-0" />
                      <span>
                        Your account is linked to <strong>{connectedAccounts.map(a => a.provider).join(' and ')}</strong>.
                        Type your email address below to confirm deletion.
                      </span>
                    </p>
                  </div>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="my-4 space-y-3">
            {hasPassword ? (
              <>
                <Label htmlFor="delete-password" className="text-sm font-medium">
                  Enter your password to confirm deletion
                </Label>
                <Input
                  id="delete-password"
                  type="password"
                  value={deletePassword}
                  onChange={(e) => setDeletePassword(e.target.value)}
                  placeholder="Enter your password"
                  className="mt-1"
                />
              </>
            ) : (
              <>
                <Label htmlFor="delete-email" className="text-sm font-medium">
                  Type your email address to confirm deletion
                </Label>
                <Input
                  id="delete-email"
                  type="email"
                  value={deleteEmailConfirm}
                  onChange={(e) => setDeleteEmailConfirm(e.target.value)}
                  placeholder="your.email@example.com"
                  className="mt-1"
                />
                <p className="text-xs text-muted-foreground">
                  Type <strong>{user?.email as string}</strong> to confirm
                </p>
              </>
            )}
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setDeletePassword('');
              setDeleteEmailConfirm('');
            }}>
              Keep My Account
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAccount}
              disabled={
                (hasPassword ? !deletePassword : deleteEmailConfirm !== user?.email) || isUpdating
              }
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isUpdating ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Account
                </>
              )}
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
