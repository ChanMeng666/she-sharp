'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { PhotoUpload } from '@/components/forms/photo-upload';
import {
  Check,
  Loader2,
  Sparkles,
  Users,
  Calendar,
  BookOpen,
  Award,
  ChevronRight,
  ChevronLeft,
  User,
  Briefcase,
  Target,
  FileText,
  MapPin,
  ExternalLink,
} from 'lucide-react';
import Link from 'next/link';

const benefits = [
  { icon: Users, title: 'Mentor Matching', description: 'AI-powered matching with experienced mentors' },
  { icon: Calendar, title: 'Priority Access', description: 'Early access to exclusive events' },
  { icon: BookOpen, title: 'Learning Resources', description: 'Premium guides and materials' },
  { icon: Award, title: 'Recognition', description: 'Points and achievements' },
];

// New Zealand cities for location matching
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

const currentStageOptions = [
  { value: 'undergraduate', label: 'Undergraduate/Graduate' },
  { value: 'postgraduate', label: 'Post Graduate' },
  { value: 'early_career', label: 'Professional - Early Career (0-3 years)' },
  { value: 'mid_career', label: 'Professional - Mid Career (3-7 years)' },
  { value: 'senior', label: 'Professional - Senior (7+ years)' },
  { value: 'career_transition', label: 'Career Transition' },
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

const meetingFrequencyOptions = [
  { value: 'weekly', label: 'Weekly' },
  { value: 'biweekly', label: 'Bi-weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'flexible', label: 'Flexible' },
];

interface FormData {
  // Step 1: Photo & Basic Info
  photoUrl: string;
  fullName: string;
  email: string;
  phone: string;
  gender: string;
  age: string;
  // Step 2: Location & Background
  city: string;
  preferredMeetingFormat: string;
  currentStage: string;
  currentJobTitle: string;
  currentIndustry: string;
  preferredIndustries: string[];
  bio: string;
  // Step 3: Skills
  softSkillsBasic: string[];
  industrySkillsBasic: string[];
  softSkillsExpert: string[];
  industrySkillsExpert: string[];
  // Step 4: Goals & Personality
  longTermGoals: string;
  shortTermGoals: string;
  whyMentor: string;
  programExpectations: string;
  mbtiType: string;
  preferredMeetingFrequency: string;
}

const initialFormData: FormData = {
  photoUrl: '',
  fullName: '',
  email: '',
  phone: '',
  gender: '',
  age: '',
  city: '',
  preferredMeetingFormat: '',
  currentStage: '',
  currentJobTitle: '',
  currentIndustry: '',
  preferredIndustries: [],
  bio: '',
  softSkillsBasic: [],
  industrySkillsBasic: [],
  softSkillsExpert: [],
  industrySkillsExpert: [],
  longTermGoals: '',
  shortTermGoals: '',
  whyMentor: '',
  programExpectations: '',
  mbtiType: '',
  preferredMeetingFrequency: '',
};

const steps = [
  { id: 1, title: 'Photo & Info', icon: User },
  { id: 2, title: 'Background', icon: Briefcase },
  { id: 3, title: 'Skills', icon: Target },
  { id: 4, title: 'Goals', icon: Target },
  { id: 5, title: 'Review', icon: FileText },
];

export default function MenteeApplicationPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});

  const updateField = <K extends keyof FormData>(field: K, value: FormData[K]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const toggleArrayItem = (field: keyof FormData, item: string) => {
    const currentArray = formData[field] as string[];
    const newArray = currentArray.includes(item)
      ? currentArray.filter((i) => i !== item)
      : [...currentArray, item];
    updateField(field, newArray as FormData[typeof field]);
  };

  const validateStep = (step: number): boolean => {
    const newErrors: Partial<Record<keyof FormData, string>> = {};

    if (step === 1) {
      if (!formData.photoUrl) newErrors.photoUrl = 'Photo is required';
      if (!formData.fullName.trim()) newErrors.fullName = 'Full name is required';
      if (!formData.email.trim()) newErrors.email = 'Email is required';
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        newErrors.email = 'Please enter a valid email';
      }
      if (!formData.phone.trim()) newErrors.phone = 'Phone number is required';
      if (!formData.gender) newErrors.gender = 'Please select your gender';
    }

    if (step === 2) {
      if (!formData.city) newErrors.city = 'Please select your city';
      if (!formData.preferredMeetingFormat) newErrors.preferredMeetingFormat = 'Please select meeting format';
      if (!formData.currentStage) newErrors.currentStage = 'Please select your career stage';
      if (!formData.currentJobTitle.trim()) newErrors.currentJobTitle = 'Job title is required';
      if (!formData.currentIndustry) newErrors.currentIndustry = 'Please select your industry';
      if (!formData.bio.trim() || formData.bio.length < 50) {
        newErrors.bio = 'Please provide a bio (at least 50 characters)';
      }
    }

    if (step === 3) {
      if (formData.softSkillsBasic.length === 0) {
        newErrors.softSkillsBasic = 'Please select at least one basic soft skill';
      }
      if (formData.industrySkillsBasic.length === 0) {
        newErrors.industrySkillsBasic = 'Please select at least one basic industry skill';
      }
    }

    if (step === 4) {
      if (!formData.longTermGoals.trim() || formData.longTermGoals.length < 20) {
        newErrors.longTermGoals = 'Please describe your long-term goals (at least 20 characters)';
      }
      if (!formData.shortTermGoals.trim() || formData.shortTermGoals.length < 20) {
        newErrors.shortTermGoals = 'Please describe your short-term goals (at least 20 characters)';
      }
      if (!formData.whyMentor.trim()) {
        newErrors.whyMentor = 'Please explain why you want a mentor';
      }
      if (!formData.mbtiType) {
        newErrors.mbtiType = 'Please select your personality type';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, 5));
    }
  };

  const handleBack = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const handleSubmit = async () => {
    if (!validateStep(currentStep)) return;

    setLoading(true);
    try {
      const checkResponse = await fetch(`/api/forms/mentee/public?email=${encodeURIComponent(formData.email)}`);
      const checkData = await checkResponse.json();

      if (checkData.exists && !checkData.paymentCompleted) {
        router.push(`/mentorship/join/payment?id=${checkData.submissionId}`);
        return;
      }

      const response = await fetch('/api/forms/mentee/public', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          age: formData.age ? parseInt(formData.age) : undefined,
        }),
      });

      const data = await response.json();

      if (data.error) {
        setErrors({ email: data.error });
        setLoading(false);
        return;
      }

      router.push(`/mentorship/join/payment?id=${data.submissionId}`);
    } catch (error) {
      setErrors({ email: 'Failed to submit application. Please try again.' });
      setLoading(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <PhotoUpload
              value={formData.photoUrl}
              onChange={(url) => updateField('photoUrl', url || '')}
              type="mentee"
              email={formData.email}
              label="Your Photo"
              description="Upload a recent photo of yourself. This will be shared with your assigned mentor."
              required
              error={errors.photoUrl}
            />

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">First and Last Name *</Label>
                <Input
                  id="fullName"
                  placeholder="Jane Smith"
                  value={formData.fullName}
                  onChange={(e) => updateField('fullName', e.target.value)}
                  className={errors.fullName ? 'border-red-500' : ''}
                />
                {errors.fullName && <p className="text-sm text-red-500">{errors.fullName}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email Address *</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={formData.email}
                  onChange={(e) => updateField('email', e.target.value)}
                  className={errors.email ? 'border-red-500' : ''}
                />
                {errors.email && <p className="text-sm text-red-500">{errors.email}</p>}
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number *</Label>
                <Input
                  id="phone"
                  placeholder="+64 21 123 4567"
                  value={formData.phone}
                  onChange={(e) => updateField('phone', e.target.value)}
                  className={errors.phone ? 'border-red-500' : ''}
                />
                {errors.phone && <p className="text-sm text-red-500">{errors.phone}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="age">Age (Optional)</Label>
                <Input
                  id="age"
                  type="number"
                  min="16"
                  max="100"
                  placeholder="Enter your age"
                  value={formData.age}
                  onChange={(e) => updateField('age', e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Gender *</Label>
              <RadioGroup
                value={formData.gender}
                onValueChange={(v) => updateField('gender', v)}
                className="flex flex-wrap gap-4"
              >
                {genderOptions.map((opt) => (
                  <div key={opt.value} className="flex items-center space-x-2">
                    <RadioGroupItem value={opt.value} id={`gender-${opt.value}`} />
                    <Label htmlFor={`gender-${opt.value}`} className="font-normal cursor-pointer">
                      {opt.label}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
              {errors.gender && <p className="text-sm text-red-500">{errors.gender}</p>}
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <div className="flex items-start gap-2">
                <MapPin className="h-5 w-5 text-blue-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-blue-900">Location Matching</p>
                  <p className="text-sm text-blue-700">
                    Auckland is She Sharp&apos;s primary activity city. Selecting Auckland increases opportunities for in-person events and meetings.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Your City *</Label>
                <Select value={formData.city} onValueChange={(v) => updateField('city', v)}>
                  <SelectTrigger className={errors.city ? 'border-red-500' : ''}>
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
                {errors.city && <p className="text-sm text-red-500">{errors.city}</p>}
              </div>

              <div className="space-y-2">
                <Label>Preferred Meeting Format *</Label>
                <Select value={formData.preferredMeetingFormat} onValueChange={(v) => updateField('preferredMeetingFormat', v)}>
                  <SelectTrigger className={errors.preferredMeetingFormat ? 'border-red-500' : ''}>
                    <SelectValue placeholder="Select format" />
                  </SelectTrigger>
                  <SelectContent>
                    {meetingFormatOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.preferredMeetingFormat && <p className="text-sm text-red-500">{errors.preferredMeetingFormat}</p>}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Current Education/Career Stage *</Label>
              <Select value={formData.currentStage} onValueChange={(v) => updateField('currentStage', v)}>
                <SelectTrigger className={errors.currentStage ? 'border-red-500' : ''}>
                  <SelectValue placeholder="Select your stage" />
                </SelectTrigger>
                <SelectContent>
                  {currentStageOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.currentStage && <p className="text-sm text-red-500">{errors.currentStage}</p>}
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="jobTitle">Job Title *</Label>
                <Input
                  id="jobTitle"
                  placeholder="e.g., Software Developer, Student"
                  value={formData.currentJobTitle}
                  onChange={(e) => updateField('currentJobTitle', e.target.value)}
                  className={errors.currentJobTitle ? 'border-red-500' : ''}
                />
                {errors.currentJobTitle && <p className="text-sm text-red-500">{errors.currentJobTitle}</p>}
              </div>

              <div className="space-y-2">
                <Label>Industry Sector *</Label>
                <Select value={formData.currentIndustry} onValueChange={(v) => updateField('currentIndustry', v)}>
                  <SelectTrigger className={errors.currentIndustry ? 'border-red-500' : ''}>
                    <SelectValue placeholder="Select industry" />
                  </SelectTrigger>
                  <SelectContent>
                    {industryOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.currentIndustry && <p className="text-sm text-red-500">{errors.currentIndustry}</p>}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Industries for Mentorship (Optional)</Label>
              <p className="text-sm text-gray-500 mb-2">Select industries you&apos;re interested in exploring with your mentor</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-48 overflow-y-auto p-2 border rounded-lg">
                {industryOptions.map((opt) => (
                  <div key={opt.value} className="flex items-center space-x-2">
                    <Checkbox
                      id={`pref-${opt.value}`}
                      checked={formData.preferredIndustries.includes(opt.value)}
                      onCheckedChange={() => toggleArrayItem('preferredIndustries', opt.value)}
                    />
                    <label htmlFor={`pref-${opt.value}`} className="text-sm cursor-pointer">
                      {opt.label}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio">Brief Bio About Yourself *</Label>
              <p className="text-sm text-gray-500">Include awards, milestones, and relevant experiences (100+ words recommended)</p>
              <Textarea
                id="bio"
                placeholder="Tell us about yourself, your background, achievements, and what makes you unique..."
                value={formData.bio}
                onChange={(e) => updateField('bio', e.target.value)}
                rows={4}
                className={errors.bio ? 'border-red-500' : ''}
              />
              <div className="flex justify-between text-xs text-gray-500">
                <span>{errors.bio && <span className="text-red-500">{errors.bio}</span>}</span>
                <span>{formData.bio.split(/\s+/).filter(Boolean).length} words</span>
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="space-y-3">
              <Label>Basic Soft Skills You&apos;re Developing *</Label>
              <p className="text-sm text-gray-500">Select skills you want to learn or improve</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {softSkillsOptions.map((skill) => (
                  <Button
                    key={skill}
                    type="button"
                    variant={formData.softSkillsBasic.includes(skill) ? 'default' : 'outline'}
                    size="sm"
                    className={`justify-start text-xs ${formData.softSkillsBasic.includes(skill) ? 'bg-foreground' : ''}`}
                    onClick={() => toggleArrayItem('softSkillsBasic', skill)}
                  >
                    {skill}
                  </Button>
                ))}
              </div>
              {errors.softSkillsBasic && <p className="text-sm text-red-500">{errors.softSkillsBasic}</p>}
            </div>

            <div className="space-y-3">
              <Label>Basic Industry Skills You&apos;re Developing *</Label>
              <p className="text-sm text-gray-500">Select technical/industry skills you want to learn</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {industrySkillsOptions.map((skill) => (
                  <Button
                    key={skill}
                    type="button"
                    variant={formData.industrySkillsBasic.includes(skill) ? 'default' : 'outline'}
                    size="sm"
                    className={`justify-start text-xs ${formData.industrySkillsBasic.includes(skill) ? 'bg-foreground' : ''}`}
                    onClick={() => toggleArrayItem('industrySkillsBasic', skill)}
                  >
                    {skill}
                  </Button>
                ))}
              </div>
              {errors.industrySkillsBasic && <p className="text-sm text-red-500">{errors.industrySkillsBasic}</p>}
            </div>

            <div className="space-y-3">
              <Label>Expert Soft Skills (Optional)</Label>
              <p className="text-sm text-gray-500">Select skills you already have expertise in</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {softSkillsOptions.map((skill) => (
                  <Button
                    key={skill}
                    type="button"
                    variant={formData.softSkillsExpert.includes(skill) ? 'default' : 'outline'}
                    size="sm"
                    className={`justify-start text-xs ${formData.softSkillsExpert.includes(skill) ? 'bg-foreground' : ''}`}
                    onClick={() => toggleArrayItem('softSkillsExpert', skill)}
                  >
                    {skill}
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <Label>Expert Industry Skills (Optional)</Label>
              <p className="text-sm text-gray-500">Select technical skills you already have expertise in</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {industrySkillsOptions.map((skill) => (
                  <Button
                    key={skill}
                    type="button"
                    variant={formData.industrySkillsExpert.includes(skill) ? 'default' : 'outline'}
                    size="sm"
                    className={`justify-start text-xs ${formData.industrySkillsExpert.includes(skill) ? 'bg-foreground' : ''}`}
                    onClick={() => toggleArrayItem('industrySkillsExpert', skill)}
                  >
                    {skill}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="longTermGoals">What is your long-term career goal? *</Label>
              <p className="text-sm text-gray-500">Example: To pioneer innovative solutions in artificial intelligence</p>
              <Textarea
                id="longTermGoals"
                placeholder="Describe your long-term career aspirations..."
                value={formData.longTermGoals}
                onChange={(e) => updateField('longTermGoals', e.target.value)}
                rows={3}
                className={errors.longTermGoals ? 'border-red-500' : ''}
              />
              {errors.longTermGoals && <p className="text-sm text-red-500">{errors.longTermGoals}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="shortTermGoals">What is your short-term goal? *</Label>
              <p className="text-sm text-gray-500">Example: To master front-end web development skills within the next year</p>
              <Textarea
                id="shortTermGoals"
                placeholder="What do you want to achieve in the next 6-12 months?"
                value={formData.shortTermGoals}
                onChange={(e) => updateField('shortTermGoals', e.target.value)}
                rows={3}
                className={errors.shortTermGoals ? 'border-red-500' : ''}
              />
              {errors.shortTermGoals && <p className="text-sm text-red-500">{errors.shortTermGoals}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="whyMentor">Why do you want to have a mentor? *</Label>
              <Textarea
                id="whyMentor"
                placeholder="What specific guidance are you seeking from a mentor?"
                value={formData.whyMentor}
                onChange={(e) => updateField('whyMentor', e.target.value)}
                rows={3}
                className={errors.whyMentor ? 'border-red-500' : ''}
              />
              {errors.whyMentor && <p className="text-sm text-red-500">{errors.whyMentor}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="expectations">What would you hope to get from this program? (Optional)</Label>
              <Textarea
                id="expectations"
                placeholder="Your expectations from the mentorship program..."
                value={formData.programExpectations}
                onChange={(e) => updateField('programExpectations', e.target.value)}
                rows={2}
              />
            </div>

            <div className="space-y-3">
              <Label>Your Personality Type (MBTI) *</Label>
              <p className="text-sm text-gray-500 flex items-center gap-1">
                Take the test at{' '}
                <a
                  href="https://www.16personalities.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-foreground hover:underline inline-flex items-center"
                >
                  16personalities.com
                  <ExternalLink className="h-3 w-3 ml-1" />
                </a>
              </p>
              <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                {mbtiTypes.map((type) => (
                  <Button
                    key={type}
                    type="button"
                    variant={formData.mbtiType === type ? 'default' : 'outline'}
                    size="sm"
                    className={formData.mbtiType === type ? 'bg-foreground' : ''}
                    onClick={() => updateField('mbtiType', type)}
                  >
                    {type}
                  </Button>
                ))}
              </div>
              {errors.mbtiType && <p className="text-sm text-red-500">{errors.mbtiType}</p>}
            </div>

            <div className="space-y-2">
              <Label>Preferred Meeting Frequency</Label>
              <Select value={formData.preferredMeetingFrequency} onValueChange={(v) => updateField('preferredMeetingFrequency', v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select frequency" />
                </SelectTrigger>
                <SelectContent>
                  {meetingFrequencyOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            {/* Photo & Personal Info */}
            <div className="bg-gray-50 rounded-lg p-4 space-y-4">
              <h3 className="font-semibold text-foreground flex items-center gap-2">
                <User className="h-4 w-4" /> Personal Information
              </h3>
              <div className="flex gap-4">
                {formData.photoUrl && (
                  <img src={formData.photoUrl} alt="Profile" className="w-16 h-16 rounded-lg object-cover" />
                )}
                <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm flex-1">
                  <div className="text-gray-500">Name:</div>
                  <div className="font-medium">{formData.fullName}</div>
                  <div className="text-gray-500">Email:</div>
                  <div className="font-medium">{formData.email}</div>
                  <div className="text-gray-500">Phone:</div>
                  <div className="font-medium">{formData.phone}</div>
                  <div className="text-gray-500">Gender:</div>
                  <div className="font-medium">{genderOptions.find(o => o.value === formData.gender)?.label}</div>
                </div>
              </div>
            </div>

            {/* Location & Background */}
            <div className="bg-gray-50 rounded-lg p-4 space-y-4">
              <h3 className="font-semibold text-foreground flex items-center gap-2">
                <MapPin className="h-4 w-4" /> Location & Background
              </h3>
              <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                <div className="text-gray-500">City:</div>
                <div className="font-medium">{nzCities.find(c => c.value === formData.city)?.label}</div>
                <div className="text-gray-500">Meeting Format:</div>
                <div className="font-medium">{meetingFormatOptions.find(o => o.value === formData.preferredMeetingFormat)?.label}</div>
                <div className="text-gray-500">Career Stage:</div>
                <div className="font-medium">{currentStageOptions.find(o => o.value === formData.currentStage)?.label}</div>
                <div className="text-gray-500">Job Title:</div>
                <div className="font-medium">{formData.currentJobTitle}</div>
                <div className="text-gray-500">Industry:</div>
                <div className="font-medium">{industryOptions.find(o => o.value === formData.currentIndustry)?.label}</div>
              </div>
            </div>

            {/* Skills */}
            <div className="bg-gray-50 rounded-lg p-4 space-y-4">
              <h3 className="font-semibold text-foreground flex items-center gap-2">
                <Target className="h-4 w-4" /> Skills
              </h3>
              <div className="space-y-3">
                {formData.softSkillsBasic.length > 0 && (
                  <div>
                    <div className="text-gray-500 text-sm mb-1">Learning (Soft):</div>
                    <div className="flex flex-wrap gap-1">
                      {formData.softSkillsBasic.map(s => (
                        <span key={s} className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-xs">{s}</span>
                      ))}
                    </div>
                  </div>
                )}
                {formData.industrySkillsBasic.length > 0 && (
                  <div>
                    <div className="text-gray-500 text-sm mb-1">Learning (Technical):</div>
                    <div className="flex flex-wrap gap-1">
                      {formData.industrySkillsBasic.map(s => (
                        <span key={s} className="bg-muted text-foreground px-2 py-0.5 rounded text-xs">{s}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Goals */}
            <div className="bg-gray-50 rounded-lg p-4 space-y-3">
              <h3 className="font-semibold text-foreground">Goals & Personality</h3>
              <div className="text-sm space-y-2">
                <div>
                  <span className="text-gray-500">Long-term Goal:</span>
                  <p className="mt-1">{formData.longTermGoals}</p>
                </div>
                <div>
                  <span className="text-gray-500">Short-term Goal:</span>
                  <p className="mt-1">{formData.shortTermGoals}</p>
                </div>
                <div className="grid grid-cols-2 gap-2 pt-2">
                  <div><span className="text-gray-500">MBTI:</span> <span className="font-medium">{formData.mbtiType}</span></div>
                  {formData.preferredMeetingFrequency && (
                    <div><span className="text-gray-500">Meeting:</span> <span className="font-medium">{meetingFrequencyOptions.find(o => o.value === formData.preferredMeetingFrequency)?.label}</span></div>
                  )}
                </div>
              </div>
            </div>

            {/* Payment Info */}
            <div className="bg-muted border border-border rounded-lg p-4">
              <h3 className="font-semibold text-foreground mb-2">Next Step: Payment</h3>
              <p className="text-sm text-gray-600">
                After submitting, you&apos;ll be redirected to complete your membership payment of{' '}
                <span className="font-semibold">$100 NZD/year</span>. Upon successful payment, you&apos;ll receive an
                invitation code to complete your registration.
              </p>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-muted">
      <section className="py-12 md:py-16">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto mb-8">
            <div className="inline-flex items-center gap-2 bg-muted-foreground/10 text-foreground px-4 py-2 rounded-full mb-4">
              <Sparkles className="h-4 w-4" />
              <span className="text-sm font-medium">Mentorship Program 2026</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Join She Sharp Mentorship Program
            </h1>
            <p className="text-muted-foreground">
              Connect with experienced professionals and accelerate your career growth.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8 max-w-4xl mx-auto">
            {benefits.map((benefit, index) => (
              <div key={index} className="flex items-center gap-3 p-3 bg-background rounded-lg shadow-sm">
                <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center flex-shrink-0">
                  <benefit.icon className="h-5 w-5 text-foreground" />
                </div>
                <div>
                  <h3 className="font-medium text-foreground text-sm">{benefit.title}</h3>
                </div>
              </div>
            ))}
          </div>

          <div className="max-w-2xl mx-auto">
            <Card className="shadow-lg">
              <CardHeader className="pb-4">
                <div className="mb-4">
                  <div className="flex justify-between mb-2">
                    {steps.map((step) => (
                      <div
                        key={step.id}
                        className={`flex items-center gap-1.5 text-xs ${
                          currentStep >= step.id ? 'text-foreground' : 'text-gray-400'
                        }`}
                      >
                        <div
                          className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                            currentStep > step.id
                              ? 'bg-foreground text-white'
                              : currentStep === step.id
                              ? 'bg-muted text-foreground border-2 border-purple-dark'
                              : 'bg-gray-100 text-gray-400'
                          }`}
                        >
                          {currentStep > step.id ? <Check className="h-3 w-3" /> : step.id}
                        </div>
                        <span className="hidden md:inline font-medium">{step.title}</span>
                      </div>
                    ))}
                  </div>
                  <Progress value={(currentStep / 5) * 100} className="h-1.5" />
                </div>

                <CardTitle className="text-xl">{steps[currentStep - 1].title}</CardTitle>
                <CardDescription>
                  {currentStep === 1 && 'Upload your photo and provide basic information'}
                  {currentStep === 2 && 'Tell us about your location and professional background'}
                  {currentStep === 3 && 'Select skills you want to develop and already have'}
                  {currentStep === 4 && 'Share your goals and personality type'}
                  {currentStep === 5 && 'Review your application before proceeding to payment'}
                </CardDescription>
              </CardHeader>

              <CardContent className="pt-0">
                {renderStepContent()}

                <div className="flex justify-between mt-8 pt-4 border-t">
                  {currentStep > 1 ? (
                    <Button variant="outline" onClick={handleBack} disabled={loading}>
                      <ChevronLeft className="h-4 w-4 mr-1" />
                      Back
                    </Button>
                  ) : (
                    <div />
                  )}

                  {currentStep < 5 ? (
                    <Button onClick={handleNext} className="bg-foreground hover:bg-foreground/90">
                      Next
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  ) : (
                    <Button
                      onClick={handleSubmit}
                      disabled={loading}
                      className="bg-foreground hover:bg-foreground/90"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="animate-spin mr-2 h-4 w-4" />
                          Submitting...
                        </>
                      ) : (
                        <>
                          Submit & Continue to Payment
                          <ChevronRight className="h-4 w-4 ml-1" />
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            <div className="text-center mt-6 space-y-2">
              <p className="text-gray-600">
                Already have an invitation code?{' '}
                <Link href="/sign-up" className="text-foreground hover:underline font-medium">
                  Sign up here
                </Link>
              </p>
              <p className="text-gray-600">
                Want to become a mentor?{' '}
                <Link href="/mentorship/become-a-mentor" className="text-foreground hover:underline font-medium">
                  Apply to mentor
                </Link>
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
