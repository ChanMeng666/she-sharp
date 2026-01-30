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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { PhotoUpload } from '@/components/forms/photo-upload';
import { toast } from 'sonner';
import {
  Save,
  User,
  Briefcase,
  Globe,
  Clock,
  Users,
  Target,
  MapPin,
  Phone,
  Brain,
  CheckCircle,
  Camera,
} from 'lucide-react';

// New Zealand cities
const nzCities = [
  { value: 'auckland', label: 'Auckland' },
  { value: 'wellington', label: 'Wellington' },
  { value: 'christchurch', label: 'Christchurch' },
  { value: 'hamilton', label: 'Hamilton' },
  { value: 'tauranga', label: 'Tauranga' },
  { value: 'dunedin', label: 'Dunedin' },
  { value: 'palmerston_north', label: 'Palmerston North' },
  { value: 'napier_hastings', label: 'Napier-Hastings' },
  { value: 'nelson', label: 'Nelson' },
  { value: 'rotorua', label: 'Rotorua' },
  { value: 'other_nz', label: 'Other (New Zealand)' },
  { value: 'international', label: 'International' },
];

const genderOptions = [
  { value: 'female', label: 'Female' },
  { value: 'male', label: 'Male' },
  { value: 'non_binary', label: 'Non-binary' },
  { value: 'prefer_not_to_say', label: 'Prefer not to say' },
  { value: 'other', label: 'Other' },
];

// Must match the values used in the mentor application form (/mentorship/become-a-mentor)
const yearsExperienceOptions = [
  { value: '3', label: '3-5 years' },
  { value: '5', label: '5-10 years' },
  { value: '10', label: '10-15 years' },
  { value: '15', label: '15+ years' },
];

const maxMenteesOptions = [
  { value: '1', label: '1 mentee' },
  { value: '2', label: '2 mentees' },
  { value: '3', label: '3 mentees' },
  { value: '4', label: '4 mentees' },
  { value: '5', label: '5 mentees' },
];

const availabilityOptions = [
  { value: '2', label: '2 hours' },
  { value: '4', label: '4 hours' },
  { value: '6', label: '6 hours' },
  { value: '8', label: '8+ hours' },
];

const meetingFormatOptions = [
  { value: 'online', label: 'Online (Virtual meetings only)' },
  { value: 'in_person', label: 'In-Person (Face-to-face meetings)' },
  { value: 'hybrid', label: 'Hybrid (Both online and in-person)' },
];

const industryOptions = [
  { value: 'engineering', label: 'Engineering' },
  { value: 'it_cs', label: 'Information Technology (IT) and Computer Science' },
  { value: 'healthcare', label: 'Healthcare and Medicine' },
  { value: 'biotech', label: 'Biotechnology and Life Sciences' },
  { value: 'renewable_energy', label: 'Renewable Energy' },
  { value: 'agriculture', label: 'Agriculture and Food Science' },
  { value: 'environmental', label: 'Environmental Science and Sustainability' },
  { value: 'telecom', label: 'Telecommunications' },
  { value: 'robotics', label: 'Robotics and Automation' },
  { value: 'manufacturing', label: 'Manufacturing and Materials Science' },
  { value: 'aerospace', label: 'Aerospace and Defense' },
  { value: 'finance', label: 'Finance and Banking' },
  { value: 'consulting', label: 'Consulting' },
  { value: 'education', label: 'Education' },
  { value: 'other', label: 'Other' },
];

const softSkillsOptions = [
  'Communication', 'Leadership', 'Problem Solving', 'Time Management',
  'Critical Thinking', 'Teamwork', 'Adaptability', 'Creativity',
  'Emotional Intelligence', 'Conflict Resolution', 'Negotiation', 'Presentation',
  'Networking', 'Active Listening', 'Decision Making',
];

const industrySkillsOptions = [
  'Software Development', 'Data Science', 'Product Management', 'UX/UI Design',
  'Cloud Computing', 'DevOps', 'Cybersecurity', 'Machine Learning',
  'Mobile Development', 'Web Development', 'Database Management', 'System Architecture',
  'Project Management', 'Agile/Scrum', 'Business Analysis', 'Quality Assurance',
  'Customer Service', 'Event Planning', 'Research', 'Technical Writing',
];

const mbtiTypes = [
  'INTJ', 'INTP', 'ENTJ', 'ENTP',
  'INFJ', 'INFP', 'ENFJ', 'ENFP',
  'ISTJ', 'ISFJ', 'ESTJ', 'ESFJ',
  'ISTP', 'ISFP', 'ESTP', 'ESFP',
];

const menteeTypeOptions = [
  { value: 'undergraduate', label: 'Undergraduate/Graduate' },
  { value: 'postgraduate', label: 'Post Graduate' },
  { value: 'professional', label: 'Professional' },
];


interface ProfileData {
  // Basic info
  photoUrl: string;
  fullName: string;
  gender: string;
  phone: string;
  // Location
  city: string;
  preferredMeetingFormat: string;
  // Professional
  jobTitle: string;
  company: string;
  yearsExperience: string;
  linkedinUrl: string;
  bio: string;
  // Skills
  softSkillsBasic: string[];
  softSkillsExpert: string[];
  industrySkillsBasic: string[];
  industrySkillsExpert: string[];
  // Goals
  expectedMenteeGoalsLongTerm: string;
  expectedMenteeGoalsShortTerm: string;
  programExpectations: string;
  // Preferences
  preferredMenteeTypes: string[];
  preferredIndustries: string[];
  // Personality & Availability
  mbtiType: string;
  availabilityHoursPerMonth: string;
  maxMentees: string;
  isAcceptingMentees: boolean;
}

const initialProfile: ProfileData = {
  photoUrl: '',
  fullName: '',
  gender: '',
  phone: '',
  city: '',
  preferredMeetingFormat: '',
  jobTitle: '',
  company: '',
  yearsExperience: '',
  linkedinUrl: '',
  bio: '',
  softSkillsBasic: [],
  softSkillsExpert: [],
  industrySkillsBasic: [],
  industrySkillsExpert: [],
  expectedMenteeGoalsLongTerm: '',
  expectedMenteeGoalsShortTerm: '',
  programExpectations: '',
  preferredMenteeTypes: [],
  preferredIndustries: [],
  mbtiType: '',
  availabilityHoursPerMonth: '4',
  maxMentees: '3',
  isAcceptingMentees: true,
};

export default function MentorProfilePage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [profile, setProfile] = useState<ProfileData>(initialProfile);

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
            ...initialProfile,
            ...data.profile,
            // Convert number values to strings for Select components
            yearsExperience: data.profile.yearsExperience != null ? String(data.profile.yearsExperience) : '',
            availabilityHoursPerMonth: data.profile.availabilityHoursPerMonth != null ? String(data.profile.availabilityHoursPerMonth) : '',
            maxMentees: data.profile.maxMentees != null ? String(data.profile.maxMentees) : '',
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
    if (!profile.jobTitle || !profile.yearsExperience) {
      toast.error('Please fill in your job title and years of experience');
      return;
    }
    if (profile.softSkillsExpert.length === 0 && profile.industrySkillsExpert.length === 0) {
      toast.error('Please select at least one expert skill');
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch('/api/user/mentor-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile),
      });

      if (response.ok) {
        toast.success('Profile saved successfully!');
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

  const toggleArrayItem = (field: keyof ProfileData, item: string) => {
    const currentArray = profile[field] as string[];
    setProfile(prev => ({
      ...prev,
      [field]: currentArray.includes(item)
        ? currentArray.filter(i => i !== item)
        : [...currentArray, item],
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
          Edit your mentor profile information. All changes will be saved automatically.
        </p>
      </div>

      <div className="space-y-6">
        {/* Photo Upload */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Camera className="h-5 w-5 text-brand" />
              Profile Photo
            </CardTitle>
            <CardDescription>
              Upload a professional photo for your mentor profile
            </CardDescription>
          </CardHeader>
          <CardContent>
            <PhotoUpload
              value={profile.photoUrl}
              onChange={(url) => setProfile({ ...profile, photoUrl: url || '' })}
              type="mentor"
            />
          </CardContent>
        </Card>

        {/* Personal Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5 text-periwinkle" />
              Personal Information
            </CardTitle>
            <CardDescription>
              Your basic personal details
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="fullName">Full Name</Label>
                <Input
                  id="fullName"
                  placeholder="Your full name"
                  value={profile.fullName}
                  onChange={(e) => setProfile({ ...profile, fullName: e.target.value })}
                />
              </div>
            </div>
            <div>
              <Label>Gender</Label>
              <RadioGroup
                value={profile.gender}
                onValueChange={(value) => setProfile({ ...profile, gender: value })}
                className="flex flex-wrap gap-4 mt-2"
              >
                {genderOptions.map((option) => (
                  <div key={option.value} className="flex items-center space-x-2">
                    <RadioGroupItem value={option.value} id={`gender-${option.value}`} />
                    <Label htmlFor={`gender-${option.value}`} className="font-normal cursor-pointer">
                      {option.label}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>
            <div>
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="+64 xxx xxx xxxx"
                value={profile.phone}
                onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
              />
            </div>
          </CardContent>
        </Card>

        {/* Location */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-info" />
              Location & Meeting Preferences
            </CardTitle>
            <CardDescription>
              Where you are located and how you prefer to meet
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="city">City</Label>
                <Select
                  value={profile.city}
                  onValueChange={(value) => setProfile({ ...profile, city: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select your city" />
                  </SelectTrigger>
                  <SelectContent>
                    {nzCities.map((city) => (
                      <SelectItem key={city.value} value={city.value}>
                        {city.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="meetingFormat">Preferred Meeting Format</Label>
                <Select
                  value={profile.preferredMeetingFormat}
                  onValueChange={(value) => setProfile({ ...profile, preferredMeetingFormat: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select meeting format" />
                  </SelectTrigger>
                  <SelectContent>
                    {meetingFormatOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Professional Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Briefcase className="h-5 w-5 text-navy" />
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
                <Label>Years of Experience *</Label>
                <Select
                  value={profile.yearsExperience}
                  onValueChange={(value) => setProfile({ ...profile, yearsExperience: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select experience" />
                  </SelectTrigger>
                  <SelectContent>
                    {yearsExperienceOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
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

        {/* Skills - Expert Level */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-brand" />
              Expert Skills
            </CardTitle>
            <CardDescription>
              Select skills you can teach at an expert level
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <Label className="mb-2 block">Soft Skills (Expert)</Label>
              <div className="flex flex-wrap gap-2">
                {softSkillsOptions.map((skill) => (
                  <Badge
                    key={skill}
                    variant={profile.softSkillsExpert.includes(skill) ? 'default' : 'outline'}
                    className="cursor-pointer"
                    onClick={() => toggleArrayItem('softSkillsExpert', skill)}
                  >
                    {profile.softSkillsExpert.includes(skill) && (
                      <CheckCircle className="h-3 w-3 mr-1" />
                    )}
                    {skill}
                  </Badge>
                ))}
              </div>
            </div>
            <div>
              <Label className="mb-2 block">Industry Skills (Expert)</Label>
              <div className="flex flex-wrap gap-2">
                {industrySkillsOptions.map((skill) => (
                  <Badge
                    key={skill}
                    variant={profile.industrySkillsExpert.includes(skill) ? 'default' : 'outline'}
                    className="cursor-pointer"
                    onClick={() => toggleArrayItem('industrySkillsExpert', skill)}
                  >
                    {profile.industrySkillsExpert.includes(skill) && (
                      <CheckCircle className="h-3 w-3 mr-1" />
                    )}
                    {skill}
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Skills - Basic Level */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-periwinkle" />
              Basic Skills
            </CardTitle>
            <CardDescription>
              Select skills you can provide basic guidance on
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <Label className="mb-2 block">Soft Skills (Basic)</Label>
              <div className="flex flex-wrap gap-2">
                {softSkillsOptions.map((skill) => (
                  <Badge
                    key={skill}
                    variant={profile.softSkillsBasic.includes(skill) ? 'secondary' : 'outline'}
                    className="cursor-pointer"
                    onClick={() => toggleArrayItem('softSkillsBasic', skill)}
                  >
                    {profile.softSkillsBasic.includes(skill) && (
                      <CheckCircle className="h-3 w-3 mr-1" />
                    )}
                    {skill}
                  </Badge>
                ))}
              </div>
            </div>
            <div>
              <Label className="mb-2 block">Industry Skills (Basic)</Label>
              <div className="flex flex-wrap gap-2">
                {industrySkillsOptions.map((skill) => (
                  <Badge
                    key={skill}
                    variant={profile.industrySkillsBasic.includes(skill) ? 'secondary' : 'outline'}
                    className="cursor-pointer"
                    onClick={() => toggleArrayItem('industrySkillsBasic', skill)}
                  >
                    {profile.industrySkillsBasic.includes(skill) && (
                      <CheckCircle className="h-3 w-3 mr-1" />
                    )}
                    {skill}
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Goals & Expectations */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-mint" />
              Mentee Goals & Expectations
            </CardTitle>
            <CardDescription>
              What you expect from your mentees and the mentorship program
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="longTermGoals">Expected Mentee Long-Term Goals</Label>
              <Textarea
                id="longTermGoals"
                placeholder="What long-term goals should your ideal mentee have?"
                value={profile.expectedMenteeGoalsLongTerm}
                onChange={(e) => setProfile({ ...profile, expectedMenteeGoalsLongTerm: e.target.value })}
                className="min-h-[100px]"
              />
            </div>
            <div>
              <Label htmlFor="shortTermGoals">Expected Mentee Short-Term Goals</Label>
              <Textarea
                id="shortTermGoals"
                placeholder="What short-term goals should your ideal mentee have?"
                value={profile.expectedMenteeGoalsShortTerm}
                onChange={(e) => setProfile({ ...profile, expectedMenteeGoalsShortTerm: e.target.value })}
                className="min-h-[100px]"
              />
            </div>
            <div>
              <Label htmlFor="programExpectations">Programme Expectations</Label>
              <Textarea
                id="programExpectations"
                placeholder="What do you expect from the mentorship programme?"
                value={profile.programExpectations}
                onChange={(e) => setProfile({ ...profile, programExpectations: e.target.value })}
                className="min-h-[100px]"
              />
            </div>
          </CardContent>
        </Card>

        {/* Mentee Preferences */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-info" />
              Mentee Preferences
            </CardTitle>
            <CardDescription>
              What type of mentees are you looking to work with?
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <Label className="mb-2 block">Preferred Mentee Types</Label>
              <div className="flex flex-wrap gap-2">
                {menteeTypeOptions.map((type) => (
                  <Badge
                    key={type.value}
                    variant={profile.preferredMenteeTypes.includes(type.value) ? 'default' : 'outline'}
                    className="cursor-pointer"
                    onClick={() => toggleArrayItem('preferredMenteeTypes', type.value)}
                  >
                    {profile.preferredMenteeTypes.includes(type.value) && (
                      <CheckCircle className="h-3 w-3 mr-1" />
                    )}
                    {type.label}
                  </Badge>
                ))}
              </div>
            </div>
            <div>
              <Label className="mb-2 block">Preferred Industries</Label>
              <div className="flex flex-wrap gap-2">
                {industryOptions.map((industry) => (
                  <Badge
                    key={industry.value}
                    variant={profile.preferredIndustries.includes(industry.value) ? 'default' : 'outline'}
                    className="cursor-pointer"
                    onClick={() => toggleArrayItem('preferredIndustries', industry.value)}
                  >
                    {profile.preferredIndustries.includes(industry.value) && (
                      <CheckCircle className="h-3 w-3 mr-1" />
                    )}
                    {industry.label}
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* MBTI & Availability */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-brand" />
              Personality & Availability
            </CardTitle>
            <CardDescription>
              Your personality type and mentorship availability
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="mbti">MBTI Personality Type</Label>
              <Select
                value={profile.mbtiType}
                onValueChange={(value) => setProfile({ ...profile, mbtiType: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select your MBTI type" />
                </SelectTrigger>
                <SelectContent>
                  {mbtiTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Availability (hours/month)</Label>
                <Select
                  value={profile.availabilityHoursPerMonth}
                  onValueChange={(value) => setProfile({ ...profile, availabilityHoursPerMonth: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select hours" />
                  </SelectTrigger>
                  <SelectContent>
                    {availabilityOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Maximum Mentees</Label>
                <Select
                  value={profile.maxMentees}
                  onValueChange={(value) => setProfile({ ...profile, maxMentees: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select number" />
                  </SelectTrigger>
                  <SelectContent>
                    {maxMenteesOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
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
