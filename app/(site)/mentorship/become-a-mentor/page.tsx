'use client';

import { useState } from 'react';
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
  Heart,
  Award,
  Clock,
  ChevronRight,
  ChevronLeft,
  User,
  Briefcase,
  Target,
  FileText,
  MapPin,
  ExternalLink,
  CheckCircle2,
} from 'lucide-react';
import Link from 'next/link';

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

const menteeTypeOptions = [
  { value: 'undergraduate', label: 'Undergraduate/Graduate' },
  { value: 'postgraduate', label: 'Post Graduate' },
  { value: 'professional', label: 'Professional' },
];

const bioMethodOptions = [
  { value: 'create_own', label: 'Create my own bio' },
  { value: 'team_create', label: 'Have it created for you. Our team will email it to you for preview' },
  { value: 'already_sent', label: 'I have already sent one' },
];

interface FormData {
  // Step 1: Photo & Personal Info
  photoUrl: string;
  fullName: string;
  email: string;
  phone: string;
  gender: string;
  // Step 2: Location & Professional
  city: string;
  preferredMeetingFormat: string;
  jobTitle: string;
  company: string;
  yearsExperience: string;
  linkedinUrl: string;
  bioMethod: string;
  bio: string;
  // Step 3: Skills
  softSkillsBasic: string[];
  softSkillsExpert: string[];
  industrySkillsBasic: string[];
  industrySkillsExpert: string[];
  // Step 4: Goals & Preferences
  expectedMenteeGoalsLongTerm: string;
  expectedMenteeGoalsShortTerm: string;
  programExpectations: string;
  preferredMenteeTypes: string[];
  preferredIndustries: string[];
  // Step 5: Personality & Commitment
  mbtiType: string;
  maxMentees: string;
  availabilityHoursPerMonth: string;
  agreeToTerms: boolean;
  agreeToCommitment: boolean;
}

const initialFormData: FormData = {
  photoUrl: '',
  fullName: '',
  email: '',
  phone: '',
  gender: '',
  city: '',
  preferredMeetingFormat: '',
  jobTitle: '',
  company: '',
  yearsExperience: '',
  linkedinUrl: '',
  bioMethod: '',
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
  maxMentees: '2',
  availabilityHoursPerMonth: '4',
  agreeToTerms: false,
  agreeToCommitment: false,
};

const steps = [
  { id: 1, title: 'Photo & Info', icon: User },
  { id: 2, title: 'Professional', icon: Briefcase },
  { id: 3, title: 'Skills', icon: Target },
  { id: 4, title: 'Goals', icon: Target },
  { id: 5, title: 'Review', icon: FileText },
];

const benefits = [
  { icon: Users, title: 'Connect with Mentees', description: 'Guide the next generation' },
  { icon: Heart, title: 'Give Back', description: 'Share your expertise' },
  { icon: Award, title: 'Recognition', description: 'Build your profile' },
  { icon: Clock, title: 'Flexible Hours', description: 'You set the schedule' },
];

export default function BecomeMentorPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);

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
      if (!formData.jobTitle.trim()) newErrors.jobTitle = 'Job title is required';
      if (!formData.company.trim()) newErrors.company = 'Company is required';
      if (!formData.yearsExperience) newErrors.yearsExperience = 'Please select years of experience';
      if (!formData.bioMethod) newErrors.bioMethod = 'Please select bio option';
      if (formData.bioMethod === 'create_own' && (!formData.bio.trim() || formData.bio.length < 50)) {
        newErrors.bio = 'Please provide a bio (at least 50 characters)';
      }
    }

    if (step === 3) {
      if (formData.softSkillsExpert.length < 2) {
        newErrors.softSkillsExpert = 'Please select at least 2 expert soft skills';
      }
      if (formData.industrySkillsExpert.length < 2) {
        newErrors.industrySkillsExpert = 'Please select at least 2 expert industry skills';
      }
    }

    if (step === 4) {
      if (!formData.expectedMenteeGoalsLongTerm.trim() || formData.expectedMenteeGoalsLongTerm.length < 20) {
        newErrors.expectedMenteeGoalsLongTerm = 'Please describe long-term goals (at least 20 characters)';
      }
      if (!formData.expectedMenteeGoalsShortTerm.trim() || formData.expectedMenteeGoalsShortTerm.length < 20) {
        newErrors.expectedMenteeGoalsShortTerm = 'Please describe short-term goals (at least 20 characters)';
      }
      if (formData.preferredMenteeTypes.length === 0) {
        newErrors.preferredMenteeTypes = 'Please select at least one mentee type';
      }
      if (formData.preferredIndustries.length === 0) {
        newErrors.preferredIndustries = 'Please select at least one industry';
      }
    }

    if (step === 5) {
      if (!formData.mbtiType) newErrors.mbtiType = 'Please select your personality type';
      if (!formData.agreeToTerms) newErrors.agreeToTerms = 'Please agree to the terms';
      if (!formData.agreeToCommitment) newErrors.agreeToCommitment = 'Please agree to the commitment';
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
    if (!validateStep(5)) return;

    setLoading(true);
    try {
      const response = await fetch('/api/forms/mentor/public', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          yearsExperience: parseInt(formData.yearsExperience),
          maxMentees: parseInt(formData.maxMentees),
          availabilityHoursPerMonth: parseInt(formData.availabilityHoursPerMonth),
        }),
      });

      const data = await response.json();

      if (data.error) {
        setErrors({ email: data.error });
        setLoading(false);
        return;
      }

      setIsSubmitted(true);
    } catch (error) {
      setErrors({ email: 'Failed to submit application. Please try again.' });
      setLoading(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white py-16">
        <div className="container mx-auto px-4 max-w-lg">
          <Card className="border-green-200 shadow-lg">
            <CardContent className="pt-8 text-center">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 className="h-12 w-12 text-green-600" />
              </div>
              <h1 className="text-2xl font-bold text-navy-dark mb-3">
                Application Submitted!
              </h1>
              <p className="text-gray-600 mb-6">
                Thank you for applying to become a mentor with She Sharp. Our team will
                review your application and get back to you within 5-7 business days.
              </p>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 text-left">
                <h3 className="font-semibold text-blue-900 mb-2">What happens next?</h3>
                <ol className="text-sm text-blue-700 space-y-2">
                  <li>1. Our team reviews your application</li>
                  <li>2. If approved, you&apos;ll receive an email with your invitation code</li>
                  <li>3. Use the code to create your mentor account</li>
                  <li>4. Complete your profile and start mentoring!</li>
                </ol>
              </div>
              <Link href="/">
                <Button className="w-full bg-purple-dark hover:bg-purple-dark/90">
                  Return to Home
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <PhotoUpload
              value={formData.photoUrl}
              onChange={(url) => updateField('photoUrl', url || '')}
              type="mentor"
              email={formData.email}
              label="Your Photo"
              description="Upload a recent photo. This will be featured on our mentorship program page."
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
                    Auckland is She Sharp&apos;s primary activity city. Your location helps us match you with local mentees for in-person meetings.
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

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="jobTitle">Current Job Title *</Label>
                <Input
                  id="jobTitle"
                  placeholder="Senior Software Engineer"
                  value={formData.jobTitle}
                  onChange={(e) => updateField('jobTitle', e.target.value)}
                  className={errors.jobTitle ? 'border-red-500' : ''}
                />
                {errors.jobTitle && <p className="text-sm text-red-500">{errors.jobTitle}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="company">Organisation *</Label>
                <Input
                  id="company"
                  placeholder="Tech Company Ltd"
                  value={formData.company}
                  onChange={(e) => updateField('company', e.target.value)}
                  className={errors.company ? 'border-red-500' : ''}
                />
                {errors.company && <p className="text-sm text-red-500">{errors.company}</p>}
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Years of Experience *</Label>
                <Select value={formData.yearsExperience} onValueChange={(v) => updateField('yearsExperience', v)}>
                  <SelectTrigger className={errors.yearsExperience ? 'border-red-500' : ''}>
                    <SelectValue placeholder="Select experience" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="3">3-5 years</SelectItem>
                    <SelectItem value="5">5-10 years</SelectItem>
                    <SelectItem value="10">10-15 years</SelectItem>
                    <SelectItem value="15">15+ years</SelectItem>
                  </SelectContent>
                </Select>
                {errors.yearsExperience && <p className="text-sm text-red-500">{errors.yearsExperience}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="linkedinUrl">LinkedIn Profile (Optional)</Label>
                <Input
                  id="linkedinUrl"
                  placeholder="https://linkedin.com/in/yourprofile"
                  value={formData.linkedinUrl}
                  onChange={(e) => updateField('linkedinUrl', e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Provide a bio *</Label>
              <p className="text-sm text-gray-500">This will be featured on our mentorship program page.</p>
              <RadioGroup
                value={formData.bioMethod}
                onValueChange={(v) => updateField('bioMethod', v)}
                className="space-y-2"
              >
                {bioMethodOptions.map((opt) => (
                  <div key={opt.value} className="flex items-center space-x-2">
                    <RadioGroupItem value={opt.value} id={`bio-${opt.value}`} />
                    <Label htmlFor={`bio-${opt.value}`} className="font-normal cursor-pointer text-sm">
                      {opt.label}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
              {errors.bioMethod && <p className="text-sm text-red-500">{errors.bioMethod}</p>}
            </div>

            {formData.bioMethod === 'create_own' && (
              <div className="space-y-2">
                <Label htmlFor="bio">Your Bio *</Label>
                <Textarea
                  id="bio"
                  placeholder="Tell mentees about your career journey and what drives you (150-500 words)"
                  value={formData.bio}
                  onChange={(e) => updateField('bio', e.target.value)}
                  rows={5}
                  className={errors.bio ? 'border-red-500' : ''}
                />
                <div className="flex justify-between text-xs text-gray-500">
                  <span>{errors.bio && <span className="text-red-500">{errors.bio}</span>}</span>
                  <span>{formData.bio.split(/\s+/).filter(Boolean).length} words</span>
                </div>
              </div>
            )}
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="space-y-3">
              <Label>Basic Soft Skills (Optional)</Label>
              <p className="text-sm text-gray-500">Skills you can help mentees develop</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {softSkillsOptions.map((skill) => (
                  <Button
                    key={skill}
                    type="button"
                    variant={formData.softSkillsBasic.includes(skill) ? 'default' : 'outline'}
                    size="sm"
                    className={`justify-start text-xs ${formData.softSkillsBasic.includes(skill) ? 'bg-blue-600' : ''}`}
                    onClick={() => toggleArrayItem('softSkillsBasic', skill)}
                  >
                    {skill}
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <Label>Expert Soft Skills * (Select at least 2)</Label>
              <p className="text-sm text-gray-500">Skills you have mastered and can teach</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {softSkillsOptions.map((skill) => (
                  <Button
                    key={skill}
                    type="button"
                    variant={formData.softSkillsExpert.includes(skill) ? 'default' : 'outline'}
                    size="sm"
                    className={`justify-start text-xs ${formData.softSkillsExpert.includes(skill) ? 'bg-purple-dark' : ''}`}
                    onClick={() => toggleArrayItem('softSkillsExpert', skill)}
                  >
                    {skill}
                  </Button>
                ))}
              </div>
              {errors.softSkillsExpert && <p className="text-sm text-red-500">{errors.softSkillsExpert}</p>}
            </div>

            <div className="space-y-3">
              <Label>Basic Industry Skills (Optional)</Label>
              <p className="text-sm text-gray-500">Technical skills you can help mentees develop</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {industrySkillsOptions.map((skill) => (
                  <Button
                    key={skill}
                    type="button"
                    variant={formData.industrySkillsBasic.includes(skill) ? 'default' : 'outline'}
                    size="sm"
                    className={`justify-start text-xs ${formData.industrySkillsBasic.includes(skill) ? 'bg-blue-600' : ''}`}
                    onClick={() => toggleArrayItem('industrySkillsBasic', skill)}
                  >
                    {skill}
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <Label>Expert Industry Skills * (Select at least 2)</Label>
              <p className="text-sm text-gray-500">Technical skills you have mastered</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {industrySkillsOptions.map((skill) => (
                  <Button
                    key={skill}
                    type="button"
                    variant={formData.industrySkillsExpert.includes(skill) ? 'default' : 'outline'}
                    size="sm"
                    className={`justify-start text-xs ${formData.industrySkillsExpert.includes(skill) ? 'bg-purple-dark' : ''}`}
                    onClick={() => toggleArrayItem('industrySkillsExpert', skill)}
                  >
                    {skill}
                  </Button>
                ))}
              </div>
              {errors.industrySkillsExpert && <p className="text-sm text-red-500">{errors.industrySkillsExpert}</p>}
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="longTermGoals">What long-term goal would you prefer your mentee to have? *</Label>
              <p className="text-sm text-gray-500">Example: To establish a successful tech startup</p>
              <Textarea
                id="longTermGoals"
                placeholder="Describe the long-term goals you'd like to help mentees achieve..."
                value={formData.expectedMenteeGoalsLongTerm}
                onChange={(e) => updateField('expectedMenteeGoalsLongTerm', e.target.value)}
                rows={3}
                className={errors.expectedMenteeGoalsLongTerm ? 'border-red-500' : ''}
              />
              {errors.expectedMenteeGoalsLongTerm && <p className="text-sm text-red-500">{errors.expectedMenteeGoalsLongTerm}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="shortTermGoals">What short-term goal would you prefer your mentee to have? *</Label>
              <p className="text-sm text-gray-500">Example: To complete a front-end web certification course</p>
              <Textarea
                id="shortTermGoals"
                placeholder="Describe the short-term goals you'd like to help mentees achieve..."
                value={formData.expectedMenteeGoalsShortTerm}
                onChange={(e) => updateField('expectedMenteeGoalsShortTerm', e.target.value)}
                rows={3}
                className={errors.expectedMenteeGoalsShortTerm ? 'border-red-500' : ''}
              />
              {errors.expectedMenteeGoalsShortTerm && <p className="text-sm text-red-500">{errors.expectedMenteeGoalsShortTerm}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="expectations">What would you hope to get from this program? (Optional)</Label>
              <Textarea
                id="expectations"
                placeholder="Personal growth, giving back to the community, expanding network..."
                value={formData.programExpectations}
                onChange={(e) => updateField('programExpectations', e.target.value)}
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label>What type(s) of mentee would you prefer? *</Label>
              <div className="flex flex-wrap gap-4 mt-2">
                {menteeTypeOptions.map((opt) => (
                  <div key={opt.value} className="flex items-center space-x-2">
                    <Checkbox
                      id={`mentee-${opt.value}`}
                      checked={formData.preferredMenteeTypes.includes(opt.value)}
                      onCheckedChange={() => toggleArrayItem('preferredMenteeTypes', opt.value)}
                    />
                    <label htmlFor={`mentee-${opt.value}`} className="text-sm cursor-pointer">
                      {opt.label}
                    </label>
                  </div>
                ))}
              </div>
              {errors.preferredMenteeTypes && <p className="text-sm text-red-500">{errors.preferredMenteeTypes}</p>}
            </div>

            <div className="space-y-2">
              <Label>What industries would you like to mentor in? *</Label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-48 overflow-y-auto p-2 border rounded-lg">
                {industryOptions.map((opt) => (
                  <div key={opt.value} className="flex items-center space-x-2">
                    <Checkbox
                      id={`ind-${opt.value}`}
                      checked={formData.preferredIndustries.includes(opt.value)}
                      onCheckedChange={() => toggleArrayItem('preferredIndustries', opt.value)}
                    />
                    <label htmlFor={`ind-${opt.value}`} className="text-sm cursor-pointer">
                      {opt.label}
                    </label>
                  </div>
                ))}
              </div>
              {errors.preferredIndustries && <p className="text-sm text-red-500">{errors.preferredIndustries}</p>}
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            <div className="space-y-3">
              <Label>Your Personality Type (MBTI) *</Label>
              <p className="text-sm text-gray-500 flex items-center gap-1">
                Take the test at{' '}
                <a
                  href="https://www.16personalities.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-purple-dark hover:underline inline-flex items-center"
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
                    className={formData.mbtiType === type ? 'bg-purple-dark' : ''}
                    onClick={() => updateField('mbtiType', type)}
                  >
                    {type}
                  </Button>
                ))}
              </div>
              {errors.mbtiType && <p className="text-sm text-red-500">{errors.mbtiType}</p>}
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Maximum Mentees</Label>
                <Select value={formData.maxMentees} onValueChange={(v) => updateField('maxMentees', v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 mentee</SelectItem>
                    <SelectItem value="2">2 mentees</SelectItem>
                    <SelectItem value="3">3 mentees</SelectItem>
                    <SelectItem value="4">4 mentees</SelectItem>
                    <SelectItem value="5">5 mentees</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Availability (hours/month)</Label>
                <Select value={formData.availabilityHoursPerMonth} onValueChange={(v) => updateField('availabilityHoursPerMonth', v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="2">2 hours</SelectItem>
                    <SelectItem value="4">4 hours</SelectItem>
                    <SelectItem value="6">6 hours</SelectItem>
                    <SelectItem value="8">8+ hours</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Review Summary */}
            <div className="bg-gray-50 rounded-lg p-4 space-y-3">
              <h3 className="font-semibold text-navy-dark">Application Summary</h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="text-gray-500">Name:</div>
                <div className="font-medium">{formData.fullName}</div>
                <div className="text-gray-500">Email:</div>
                <div className="font-medium">{formData.email}</div>
                <div className="text-gray-500">City:</div>
                <div className="font-medium">{nzCities.find(c => c.value === formData.city)?.label}</div>
                <div className="text-gray-500">Role:</div>
                <div className="font-medium">{formData.jobTitle} at {formData.company}</div>
              </div>
              <div className="pt-2">
                <div className="text-gray-500 text-sm mb-1">Expert Skills:</div>
                <div className="flex flex-wrap gap-1">
                  {[...formData.softSkillsExpert, ...formData.industrySkillsExpert].map(s => (
                    <span key={s} className="bg-purple-100 text-purple-700 px-2 py-0.5 rounded text-xs">{s}</span>
                  ))}
                </div>
              </div>
            </div>

            {/* Agreements */}
            <div className="space-y-3 border-t pt-4">
              <div className="flex items-start space-x-3">
                <Checkbox
                  id="agreeToTerms"
                  checked={formData.agreeToTerms}
                  onCheckedChange={(checked) => updateField('agreeToTerms', !!checked)}
                />
                <Label htmlFor="agreeToTerms" className="text-sm leading-relaxed cursor-pointer">
                  I agree to the{' '}
                  <Link href="/terms-of-service" className="text-purple-dark underline">
                    Terms of Service
                  </Link>{' '}
                  and{' '}
                  <Link href="/privacy-policy" className="text-purple-dark underline">
                    Privacy Policy
                  </Link>
                </Label>
              </div>
              {errors.agreeToTerms && <p className="text-sm text-red-500 ml-7">{errors.agreeToTerms}</p>}

              <div className="flex items-start space-x-3">
                <Checkbox
                  id="agreeToCommitment"
                  checked={formData.agreeToCommitment}
                  onCheckedChange={(checked) => updateField('agreeToCommitment', !!checked)}
                />
                <Label htmlFor="agreeToCommitment" className="text-sm leading-relaxed cursor-pointer">
                  I commit to being an active mentor, responding to mentees within 48 hours,
                  and participating in at least 2 mentoring sessions per month
                </Label>
              </div>
              {errors.agreeToCommitment && <p className="text-sm text-red-500 ml-7">{errors.agreeToCommitment}</p>}
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white">
      <section className="py-12 md:py-16">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto mb-8">
            <div className="inline-flex items-center gap-2 bg-purple-100 text-purple-dark px-4 py-2 rounded-full mb-4">
              <Sparkles className="h-4 w-4" />
              <span className="text-sm font-medium">Become a Mentor 2026</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-navy-dark mb-4">
              Share Your Expertise, Shape the Future
            </h1>
            <p className="text-gray-600">
              Join our community of industry leaders and help guide the next generation of women in STEM.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8 max-w-4xl mx-auto">
            {benefits.map((benefit, index) => (
              <div key={index} className="flex items-center gap-3 p-3 bg-white rounded-lg shadow-sm">
                <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <benefit.icon className="h-5 w-5 text-purple-dark" />
                </div>
                <div>
                  <h3 className="font-medium text-navy-dark text-sm">{benefit.title}</h3>
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
                          currentStep >= step.id ? 'text-purple-dark' : 'text-gray-400'
                        }`}
                      >
                        <div
                          className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                            currentStep > step.id
                              ? 'bg-purple-dark text-white'
                              : currentStep === step.id
                              ? 'bg-purple-100 text-purple-dark border-2 border-purple-dark'
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
                  {currentStep === 3 && 'Select skills you can teach and have expertise in'}
                  {currentStep === 4 && 'Share your mentoring goals and preferences'}
                  {currentStep === 5 && 'Review your application and confirm commitment'}
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
                    <Button onClick={handleNext} className="bg-purple-dark hover:bg-purple-dark/90">
                      Next
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  ) : (
                    <Button
                      onClick={handleSubmit}
                      disabled={loading}
                      className="bg-purple-dark hover:bg-purple-dark/90"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="animate-spin mr-2 h-4 w-4" />
                          Submitting...
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-4 w-4 mr-2" />
                          Submit Application
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
                <Link href="/sign-up" className="text-purple-dark hover:underline font-medium">
                  Sign up here
                </Link>
              </p>
              <p className="text-gray-600">
                Looking to become a mentee?{' '}
                <Link href="/mentorship/join" className="text-purple-dark hover:underline font-medium">
                  Join as mentee
                </Link>
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
