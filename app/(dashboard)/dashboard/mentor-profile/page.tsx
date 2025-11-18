'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { 
  Save, 
  User, 
  Briefcase, 
  Globe, 
  Clock, 
  Users,
  Languages,
  Calendar,
  AlertCircle,
  CheckCircle
} from 'lucide-react';

const expertiseOptions = [
  'Web Development',
  'Mobile Development',
  'Data Science',
  'Machine Learning',
  'Cloud Computing',
  'DevOps',
  'Cybersecurity',
  'UI/UX Design',
  'Product Management',
  'Project Management',
  'Backend Development',
  'Frontend Development',
  'Full Stack Development',
  'Database Design',
  'System Architecture',
];

const meetingTypes = [
  'Video Call',
  'Phone Call',
  'In-Person',
  'Chat/Messaging',
  'Email Mentoring',
];

const languages = [
  'English',
  'Spanish',
  'Mandarin',
  'Hindi',
  'French',
  'Arabic',
  'Portuguese',
  'Russian',
  'Japanese',
  'German',
];

export default function MentorProfilePage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [profile, setProfile] = useState({
    expertiseAreas: [] as string[],
    yearsExperience: 0,
    jobTitle: '',
    company: '',
    linkedinUrl: '',
    bio: '',
    availabilityHoursPerMonth: 4,
    maxMentees: 3,
    isAcceptingMentees: true,
  });

  // Local state for fields not in database schema
  const [extraFields, setExtraFields] = useState({
    preferredMeetingTypes: [] as string[],
    timezone: 'America/Los_Angeles',
    languagesSpoken: ['English'] as string[],
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await fetch('/api/user/mentor-profile');
      if (response.ok) {
        const data = await response.json();
        if (data.profile) {
          setProfile({
            ...profile,
            ...data.profile,
          });
        }
      }
    } catch (error) {
      console.error('Failed to fetch mentor profile:', error);
      toast.error('Failed to load profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    // Validation
    if (profile.expertiseAreas.length === 0) {
      toast.error('Please select at least one area of expertise');
      return;
    }
    if (!profile.jobTitle || !profile.yearsExperience) {
      toast.error('Please fill in your job title and years of experience');
      return;
    }

    setIsSaving(true);
    try {
      // Only send fields that exist in the database schema
      const profileData = {
        expertiseAreas: profile.expertiseAreas,
        yearsExperience: profile.yearsExperience,
        jobTitle: profile.jobTitle,
        company: profile.company,
        linkedinUrl: profile.linkedinUrl,
        bio: profile.bio,
        availabilityHoursPerMonth: profile.availabilityHoursPerMonth,
        maxMentees: profile.maxMentees,
        isAcceptingMentees: profile.isAcceptingMentees,
      };

      const response = await fetch('/api/user/mentor-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profileData),
      });

      if (response.ok) {
        toast.success('Profile saved successfully!');
        // Redirect to mentorship dashboard
        router.push('/dashboard/mentorship');
      } else {
        const error = await response.json();
        toast.error(error.message || 'Failed to save profile');
      }
    } catch (error) {
      console.error('Failed to save profile:', error);
      toast.error('Failed to save profile');
    } finally {
      setIsSaving(false);
    }
  };

  const toggleExpertise = (expertise: string) => {
    setProfile(prev => ({
      ...prev,
      expertiseAreas: prev.expertiseAreas.includes(expertise)
        ? prev.expertiseAreas.filter(e => e !== expertise)
        : [...prev.expertiseAreas, expertise],
    }));
  };

  const toggleMeetingType = (type: string) => {
    setExtraFields(prev => ({
      ...prev,
      preferredMeetingTypes: prev.preferredMeetingTypes.includes(type)
        ? prev.preferredMeetingTypes.filter(t => t !== type)
        : [...prev.preferredMeetingTypes, type],
    }));
  };

  const toggleLanguage = (language: string) => {
    setExtraFields(prev => ({
      ...prev,
      languagesSpoken: prev.languagesSpoken.includes(language)
        ? prev.languagesSpoken.filter(l => l !== language)
        : [...prev.languagesSpoken, language],
    }));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Mentor Profile</h1>
        <p className="text-muted-foreground">
          Complete your mentor profile to start accepting mentees
        </p>
      </div>

      <div className="space-y-6">
        {/* Professional Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Briefcase className="h-5 w-5" />
              Professional Information
            </CardTitle>
            <CardDescription>
              Tell mentees about your professional background
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="jobTitle">Job Title *</Label>
                <Input
                  id="jobTitle"
                  placeholder="e.g., Senior Software Engineer"
                  value={profile.jobTitle}
                  onChange={(e) => setProfile({ ...profile, jobTitle: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="company">Company</Label>
                <Input
                  id="company"
                  placeholder="e.g., Google"
                  value={profile.company}
                  onChange={(e) => setProfile({ ...profile, company: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="experience">Years of Experience *</Label>
                <Input
                  id="experience"
                  type="number"
                  min="0"
                  max="50"
                  value={profile.yearsExperience}
                  onChange={(e) => setProfile({ ...profile, yearsExperience: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div>
                <Label htmlFor="linkedin">LinkedIn URL</Label>
                <Input
                  id="linkedin"
                  type="url"
                  placeholder="https://linkedin.com/in/yourprofile"
                  value={profile.linkedinUrl}
                  onChange={(e) => setProfile({ ...profile, linkedinUrl: e.target.value })}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                placeholder="Tell potential mentees about yourself, your experience, and what you can offer..."
                value={profile.bio}
                onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                className="min-h-[120px]"
              />
            </div>
          </CardContent>
        </Card>

        {/* Expertise Areas */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Areas of Expertise *
            </CardTitle>
            <CardDescription>
              Select all areas where you can provide mentorship
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {expertiseOptions.map((expertise) => (
                <Badge
                  key={expertise}
                  variant={profile.expertiseAreas.includes(expertise) ? 'default' : 'outline'}
                  className="cursor-pointer"
                  onClick={() => toggleExpertise(expertise)}
                >
                  {profile.expertiseAreas.includes(expertise) && (
                    <CheckCircle className="h-3 w-3 mr-1" />
                  )}
                  {expertise}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Availability Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Availability Settings
            </CardTitle>
            <CardDescription>
              Configure your mentorship availability
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="hours">Hours per Month</Label>
                <Input
                  id="hours"
                  type="number"
                  min="1"
                  max="40"
                  value={profile.availabilityHoursPerMonth}
                  onChange={(e) => setProfile({ ...profile, availabilityHoursPerMonth: parseInt(e.target.value) || 4 })}
                />
              </div>
              <div>
                <Label htmlFor="maxMentees">Maximum Mentees</Label>
                <Input
                  id="maxMentees"
                  type="number"
                  min="1"
                  max="10"
                  value={profile.maxMentees}
                  onChange={(e) => setProfile({ ...profile, maxMentees: parseInt(e.target.value) || 3 })}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="timezone">Timezone</Label>
              <Select
                value={extraFields.timezone}
                onValueChange={(value) => setExtraFields({ ...extraFields, timezone: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="America/Los_Angeles">Pacific Time (PT)</SelectItem>
                  <SelectItem value="America/Denver">Mountain Time (MT)</SelectItem>
                  <SelectItem value="America/Chicago">Central Time (CT)</SelectItem>
                  <SelectItem value="America/New_York">Eastern Time (ET)</SelectItem>
                  <SelectItem value="Europe/London">London (GMT)</SelectItem>
                  <SelectItem value="Europe/Paris">Paris (CET)</SelectItem>
                  <SelectItem value="Asia/Tokyo">Tokyo (JST)</SelectItem>
                  <SelectItem value="Asia/Shanghai">Shanghai (CST)</SelectItem>
                  <SelectItem value="Australia/Sydney">Sydney (AEDT)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label htmlFor="accepting">Accepting New Mentees</Label>
                <p className="text-sm text-muted-foreground">
                  Toggle this off when you're at capacity
                </p>
              </div>
              <Switch
                id="accepting"
                checked={profile.isAcceptingMentees}
                onCheckedChange={(checked) => setProfile({ ...profile, isAcceptingMentees: checked })}
              />
            </div>
          </CardContent>
        </Card>

        {/* Meeting Preferences */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Meeting Preferences
            </CardTitle>
            <CardDescription>
              How do you prefer to meet with mentees?
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {meetingTypes.map((type) => (
                <Badge
                  key={type}
                  variant={extraFields.preferredMeetingTypes.includes(type) ? 'default' : 'outline'}
                  className="cursor-pointer"
                  onClick={() => toggleMeetingType(type)}
                >
                  {extraFields.preferredMeetingTypes.includes(type) && (
                    <CheckCircle className="h-3 w-3 mr-1" />
                  )}
                  {type}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Languages */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Languages className="h-5 w-5" />
              Languages Spoken
            </CardTitle>
            <CardDescription>
              Select all languages you're comfortable mentoring in
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {languages.map((language) => (
                <Badge
                  key={language}
                  variant={extraFields.languagesSpoken.includes(language) ? 'default' : 'outline'}
                  className="cursor-pointer"
                  onClick={() => toggleLanguage(language)}
                >
                  {extraFields.languagesSpoken.includes(language) && (
                    <CheckCircle className="h-3 w-3 mr-1" />
                  )}
                  {language}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end gap-4">
          <Button
            variant="outline"
            onClick={() => router.push('/dashboard')}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSaving}
          >
            {isSaving ? 'Saving...' : 'Save Profile'}
            <Save className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </div>
    </div>
  );
}