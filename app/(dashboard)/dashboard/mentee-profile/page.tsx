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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { PhotoUpload } from '@/components/forms/photo-upload';
import { toast } from 'sonner';
import {
  Save,
  Target,
  User,
  MapPin,
  Briefcase,
  Brain,
  CheckCircle,
  Camera,
  Heart,
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

// Must match the values used in the mentee application form (/mentorship/mentee)
const careerStageOptions = [
  { value: 'undergraduate', label: 'Undergraduate/Graduate' },
  { value: 'postgraduate', label: 'Post Graduate' },
  { value: 'early_career', label: 'Professional - Early Career (0-3 years)' },
  { value: 'mid_career', label: 'Professional - Mid Career (3-7 years)' },
  { value: 'senior', label: 'Professional - Senior (7+ years)' },
  { value: 'career_transition', label: 'Career Transition' },
];

const meetingFrequencyOptions = [
  { value: 'weekly', label: 'Weekly' },
  { value: 'bi_weekly', label: 'Bi-weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'as_needed', label: 'As Needed' },
];


interface ProfileData {
  // Basic info
  photoUrl: string;
  fullName: string;
  gender: string;
  age: number | null;
  phone: string;
  // Location
  city: string;
  preferredMeetingFormat: string;
  // Professional
  currentJobTitle: string;
  currentIndustry: string;
  careerStage: string;
  preferredMeetingFrequency: string;
  bio: string;
  // Skills - what mentee wants to learn
  softSkillsBasic: string[];
  softSkillsExpert: string[];
  industrySkillsBasic: string[];
  industrySkillsExpert: string[];
  // Goals & Preferences
  preferredIndustries: string[];
  longTermGoals: string;
  shortTermGoals: string;
  whyMentor: string;
  programExpectations: string;
  // Personality
  mbtiType: string;
}

const initialProfile: ProfileData = {
  photoUrl: '',
  fullName: '',
  gender: '',
  age: null,
  phone: '',
  city: '',
  preferredMeetingFormat: '',
  currentJobTitle: '',
  currentIndustry: '',
  careerStage: '',
  preferredMeetingFrequency: '',
  bio: '',
  softSkillsBasic: [],
  softSkillsExpert: [],
  industrySkillsBasic: [],
  industrySkillsExpert: [],
  preferredIndustries: [],
  longTermGoals: '',
  shortTermGoals: '',
  whyMentor: '',
  programExpectations: '',
  mbtiType: '',
};

function MenteeProgrammeBadge() {
  const [programmeName, setProgrammeName] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/user/mentee-profile')
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data?.profile?.programmeName) {
          setProgrammeName(data.profile.programmeName);
        }
      })
      .catch(() => {});
  }, []);

  if (!programmeName) return null;

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="bg-[#f7e5f3] text-brand border-brand/30 px-3 py-1">
            {programmeName}
          </Badge>
          <span className="text-sm text-muted-foreground">Programme participant</span>
        </div>
      </CardContent>
    </Card>
  );
}

export default function MenteeProfilePage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [profile, setProfile] = useState<ProfileData>(initialProfile);

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
            ...initialProfile,
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
    if (profile.softSkillsBasic.length === 0) {
      toast.error('Please select at least one soft skill you want to learn');
      return;
    }
    if (profile.industrySkillsBasic.length === 0) {
      toast.error('Please select at least one industry skill you want to learn');
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
        <h1 className="text-3xl font-bold mb-2">Mentee Profile</h1>
        <p className="text-muted-foreground">
          Edit your mentee profile information to help us match you with the perfect mentor.
        </p>
      </div>

      <div className="space-y-6">
        {/* Programme Badge (read-only, shown only if mentee is in a programme) */}
        <MenteeProgrammeBadge />

        {/* Photo Upload */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Camera className="h-5 w-5 text-periwinkle" />
              Profile Photo
            </CardTitle>
            <CardDescription>
              Upload a recent photo of yourself
            </CardDescription>
          </CardHeader>
          <CardContent>
            <PhotoUpload
              value={profile.photoUrl}
              onChange={(url) => setProfile({ ...profile, photoUrl: url || '' })}
              type="mentee"
            />
          </CardContent>
        </Card>

        {/* Personal Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5 text-brand" />
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="age">Age</Label>
                <Input
                  id="age"
                  type="number"
                  min="16"
                  max="100"
                  placeholder="Your age"
                  value={profile.age || ''}
                  onChange={(e) => setProfile({ ...profile, age: e.target.value ? parseInt(e.target.value) : null })}
                />
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
            <div>
              <Label htmlFor="frequency">Preferred Meeting Frequency</Label>
              <Select
                value={profile.preferredMeetingFrequency}
                onValueChange={(value) => setProfile({ ...profile, preferredMeetingFrequency: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select meeting frequency" />
                </SelectTrigger>
                <SelectContent>
                  {meetingFrequencyOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
              Tell mentors about your professional background
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="currentJobTitle">Current Job Title</Label>
                <Input
                  id="currentJobTitle"
                  placeholder="e.g., Junior Developer, Student"
                  value={profile.currentJobTitle}
                  onChange={(e) => setProfile({ ...profile, currentJobTitle: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="currentIndustry">Current Industry</Label>
                <Select
                  value={profile.currentIndustry}
                  onValueChange={(value) => setProfile({ ...profile, currentIndustry: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select your industry" />
                  </SelectTrigger>
                  <SelectContent>
                    {industryOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="careerStage">Career Stage</Label>
              <Select
                value={profile.careerStage}
                onValueChange={(value) => setProfile({ ...profile, careerStage: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select your career stage" />
                </SelectTrigger>
                <SelectContent>
                  {careerStageOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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

        {/* Preferred Industries */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Briefcase className="h-5 w-5 text-periwinkle" />
              Preferred Industries
            </CardTitle>
            <CardDescription>
              Which industries interest you for your career?
            </CardDescription>
          </CardHeader>
          <CardContent>
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
          </CardContent>
        </Card>

        {/* Skills You Want to Develop - Expert Level */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-brand" />
              Skills You Want to Master
            </CardTitle>
            <CardDescription>
              Select skills you want to develop to an expert level
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <Label className="mb-2 block">Soft Skills (Want to Master)</Label>
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
              <Label className="mb-2 block">Industry Skills (Want to Master)</Label>
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

        {/* Skills You Want to Develop - Basic Level */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-info" />
              Skills You Want to Learn
            </CardTitle>
            <CardDescription>
              Select skills you want to develop basic competency in
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <Label className="mb-2 block">Soft Skills (Want to Learn)</Label>
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
              <Label className="mb-2 block">Industry Skills (Want to Learn)</Label>
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
              <Heart className="h-5 w-5 text-brand" />
              Goals & Expectations
            </CardTitle>
            <CardDescription>
              Share your goals and what you expect from the mentorship program
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="longTermGoals">Long-Term Goals</Label>
              <Textarea
                id="longTermGoals"
                placeholder="What are your long-term career goals? (5+ years)"
                value={profile.longTermGoals}
                onChange={(e) => setProfile({ ...profile, longTermGoals: e.target.value })}
                className="min-h-[100px]"
              />
            </div>
            <div>
              <Label htmlFor="shortTermGoals">Short-Term Goals</Label>
              <Textarea
                id="shortTermGoals"
                placeholder="What do you want to achieve in the next 6-12 months?"
                value={profile.shortTermGoals}
                onChange={(e) => setProfile({ ...profile, shortTermGoals: e.target.value })}
                className="min-h-[100px]"
              />
            </div>
            <div>
              <Label htmlFor="whyMentor">Why Do You Want a Mentor?</Label>
              <Textarea
                id="whyMentor"
                placeholder="Why do you want to be part of the mentorship programme?"
                value={profile.whyMentor}
                onChange={(e) => setProfile({ ...profile, whyMentor: e.target.value })}
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

        {/* MBTI */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-periwinkle" />
              Personality
            </CardTitle>
            <CardDescription>
              Your personality type helps us find compatible mentors
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div>
              <Label htmlFor="mbti">MBTI Personality Type</Label>
              <Select
                value={profile.mbtiType}
                onValueChange={(value) => setProfile({ ...profile, mbtiType: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select your MBTI type (optional)" />
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
