'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { 
  Save, 
  Target, 
  BookOpen, 
  Clock, 
  Globe,
  Heart,
  Sparkles,
  CheckCircle,
  User
} from 'lucide-react';

const learningGoals = [
  'Get first tech job',
  'Career transition',
  'Skill improvement',
  'Leadership development',
  'Technical expertise',
  'Project management',
  'Startup guidance',
  'Work-life balance',
  'Networking skills',
  'Interview preparation',
];

const areasOfInterest = [
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
  'Entrepreneurship',
  'Career Development',
];

const experienceLevels = [
  'Student',
  'Entry Level',
  'Junior',
  'Mid-Level',
  'Senior',
  'Career Changer',
];

const meetingFrequencies = [
  'Weekly',
  'Bi-weekly',
  'Monthly',
  'As needed',
];

export default function MenteeProfilePage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [profile, setProfile] = useState({
    learningGoals: [] as string[],
    areasOfInterest: [] as string[],
    currentLevel: 'Junior',
    preferredMentorExpertise: [] as string[],
    preferredMeetingFrequency: 'Bi-weekly',
    timezone: 'America/Los_Angeles',
    linkedinUrl: '',
    bio: '',
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await fetch('/api/user/mentee-profile');
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
      console.error('Failed to fetch mentee profile:', error);
      toast.error('Failed to load profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    // Validation
    if (profile.learningGoals.length === 0) {
      toast.error('Please select at least one learning goal');
      return;
    }
    if (profile.areasOfInterest.length === 0) {
      toast.error('Please select at least one area of interest');
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch('/api/user/mentee-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile),
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

  const toggleGoal = (goal: string) => {
    setProfile(prev => ({
      ...prev,
      learningGoals: prev.learningGoals.includes(goal)
        ? prev.learningGoals.filter(g => g !== goal)
        : [...prev.learningGoals, goal],
    }));
  };

  const toggleInterest = (interest: string) => {
    setProfile(prev => ({
      ...prev,
      areasOfInterest: prev.areasOfInterest.includes(interest)
        ? prev.areasOfInterest.filter(i => i !== interest)
        : [...prev.areasOfInterest, interest],
    }));
  };

  const toggleExpertise = (expertise: string) => {
    setProfile(prev => ({
      ...prev,
      preferredMentorExpertise: prev.preferredMentorExpertise.includes(expertise)
        ? prev.preferredMentorExpertise.filter(e => e !== expertise)
        : [...prev.preferredMentorExpertise, expertise],
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
        <h1 className="text-3xl font-bold mb-2">Mentee Profile</h1>
        <p className="text-muted-foreground">
          Help us match you with the perfect mentor
        </p>
      </div>

      <div className="space-y-6">
        {/* Learning Goals */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Learning Goals *
            </CardTitle>
            <CardDescription>
              What do you want to achieve through mentorship?
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {learningGoals.map((goal) => (
                <Badge
                  key={goal}
                  variant={profile.learningGoals.includes(goal) ? 'default' : 'outline'}
                  className="cursor-pointer"
                  onClick={() => toggleGoal(goal)}
                >
                  {profile.learningGoals.includes(goal) && (
                    <CheckCircle className="h-3 w-3 mr-1" />
                  )}
                  {goal}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Areas of Interest */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Areas of Interest *
            </CardTitle>
            <CardDescription>
              Which fields are you interested in exploring?
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {areasOfInterest.map((area) => (
                <Badge
                  key={area}
                  variant={profile.areasOfInterest.includes(area) ? 'default' : 'outline'}
                  className="cursor-pointer"
                  onClick={() => toggleInterest(area)}
                >
                  {profile.areasOfInterest.includes(area) && (
                    <CheckCircle className="h-3 w-3 mr-1" />
                  )}
                  {area}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Current Level & Preferences */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Background & Preferences
            </CardTitle>
            <CardDescription>
              Tell us about your current situation and preferences
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="currentLevel">Current Level</Label>
                <Select
                  value={profile.currentLevel}
                  onValueChange={(value) => setProfile({ ...profile, currentLevel: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {experienceLevels.map((level) => (
                      <SelectItem key={level} value={level}>
                        {level}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="frequency">Meeting Frequency</Label>
                <Select
                  value={profile.preferredMeetingFrequency}
                  onValueChange={(value) => setProfile({ ...profile, preferredMeetingFrequency: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {meetingFrequencies.map((freq) => (
                      <SelectItem key={freq} value={freq}>
                        {freq}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="timezone">Timezone</Label>
                <Select
                  value={profile.timezone}
                  onValueChange={(value) => setProfile({ ...profile, timezone: value })}
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
              <Label htmlFor="bio">About You</Label>
              <Textarea
                id="bio"
                placeholder="Tell potential mentors about yourself, your background, and what you hope to learn..."
                value={profile.bio}
                onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                className="min-h-[120px]"
              />
            </div>
          </CardContent>
        </Card>

        {/* Preferred Mentor Expertise */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              Preferred Mentor Expertise
            </CardTitle>
            <CardDescription>
              What expertise are you looking for in a mentor?
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {areasOfInterest.map((expertise) => (
                <Badge
                  key={expertise}
                  variant={profile.preferredMentorExpertise.includes(expertise) ? 'default' : 'outline'}
                  className="cursor-pointer"
                  onClick={() => toggleExpertise(expertise)}
                >
                  {profile.preferredMentorExpertise.includes(expertise) && (
                    <CheckCircle className="h-3 w-3 mr-1" />
                  )}
                  {expertise}
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