'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import {
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Users,
  Heart,
  Award,
  Clock,
  Briefcase,
  Loader2,
  AlertCircle,
  Sparkles,
} from 'lucide-react';

// Form step configuration
const STEPS = [
  { id: 1, title: 'Personal Info', description: 'Basic information' },
  { id: 2, title: 'Professional', description: 'Work experience' },
  { id: 3, title: 'Mentorship', description: 'Your approach' },
  { id: 4, title: 'Review', description: 'Confirm details' },
];

// MBTI types
const MBTI_TYPES = [
  'INTJ', 'INTP', 'ENTJ', 'ENTP',
  'INFJ', 'INFP', 'ENFJ', 'ENFP',
  'ISTJ', 'ISFJ', 'ESTJ', 'ESFJ',
  'ISTP', 'ISFP', 'ESTP', 'ESFP',
];

// Skill options
const SOFT_SKILLS = [
  'Communication', 'Leadership', 'Problem Solving', 'Time Management',
  'Teamwork', 'Adaptability', 'Critical Thinking', 'Creativity',
  'Emotional Intelligence', 'Conflict Resolution', 'Negotiation', 'Presentation',
];

const INDUSTRY_SKILLS = [
  'Software Development', 'Data Science', 'Product Management', 'UX/UI Design',
  'Cloud Computing', 'DevOps', 'Cybersecurity', 'Machine Learning',
  'Mobile Development', 'Web Development', 'Database Management', 'System Architecture',
  'Project Management', 'Agile/Scrum', 'Business Analysis', 'Quality Assurance',
];

interface FormData {
  // Step 1: Personal Info
  fullName: string;
  email: string;
  phone: string;
  gender: string;
  mbtiType: string;
  // Step 2: Professional
  jobTitle: string;
  company: string;
  yearsExperience: string;
  linkedinUrl: string;
  bio: string;
  // Step 3: Mentorship
  softSkillsExpert: string[];
  industrySkillsExpert: string[];
  maxMentees: string;
  availabilityHoursPerMonth: string;
  expectedMenteeGoalsLongTerm: string;
  programExpectations: string;
  preferredMenteeTypes: string[];
  // Agreements
  agreeToTerms: boolean;
  agreeToCommitment: boolean;
}

const initialFormData: FormData = {
  fullName: '',
  email: '',
  phone: '',
  gender: '',
  mbtiType: '',
  jobTitle: '',
  company: '',
  yearsExperience: '',
  linkedinUrl: '',
  bio: '',
  softSkillsExpert: [],
  industrySkillsExpert: [],
  maxMentees: '2',
  availabilityHoursPerMonth: '4',
  expectedMenteeGoalsLongTerm: '',
  programExpectations: '',
  preferredMenteeTypes: [],
  agreeToTerms: false,
  agreeToCommitment: false,
};

export default function BecomeMentorPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  const updateField = (field: keyof FormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const toggleArrayItem = (field: keyof FormData, item: string) => {
    const current = formData[field] as string[];
    const updated = current.includes(item)
      ? current.filter(i => i !== item)
      : [...current, item];
    updateField(field, updated);
  };

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        return !!(formData.fullName && formData.email && formData.phone);
      case 2:
        return !!(formData.jobTitle && formData.company && formData.yearsExperience && formData.bio);
      case 3:
        return !!(
          formData.softSkillsExpert.length >= 2 &&
          formData.industrySkillsExpert.length >= 2 &&
          formData.expectedMenteeGoalsLongTerm
        );
      case 4:
        return formData.agreeToTerms && formData.agreeToCommitment;
      default:
        return true;
    }
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 4));
    }
  };

  const handleBack = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = async () => {
    if (!validateStep(4)) {
      setError('Please agree to the terms and commitment');
      return;
    }

    setIsSubmitting(true);
    setError('');

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

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to submit application');
      }

      setIsSubmitted(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Success state
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

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white">
      {/* Hero Section */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-4xl text-center">
          <Badge className="mb-4 bg-purple-100 text-purple-dark">Become a Mentor</Badge>
          <h1 className="text-4xl md:text-5xl font-bold text-navy-dark mb-4">
            Share Your Expertise,<br />Shape the Future
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Join our community of industry leaders and help guide the next generation
            of women in STEM. Your experience can make a real difference.
          </p>

          {/* Benefits */}
          <div className="grid md:grid-cols-4 gap-4 mb-12">
            <div className="bg-white p-4 rounded-xl shadow-sm border">
              <Users className="h-8 w-8 text-purple-dark mx-auto mb-2" />
              <p className="font-medium">Connect with Mentees</p>
            </div>
            <div className="bg-white p-4 rounded-xl shadow-sm border">
              <Heart className="h-8 w-8 text-purple-dark mx-auto mb-2" />
              <p className="font-medium">Give Back</p>
            </div>
            <div className="bg-white p-4 rounded-xl shadow-sm border">
              <Award className="h-8 w-8 text-purple-dark mx-auto mb-2" />
              <p className="font-medium">Recognition</p>
            </div>
            <div className="bg-white p-4 rounded-xl shadow-sm border">
              <Clock className="h-8 w-8 text-purple-dark mx-auto mb-2" />
              <p className="font-medium">Flexible Hours</p>
            </div>
          </div>
        </div>
      </section>

      {/* Application Form */}
      <section className="pb-16 px-4">
        <div className="container mx-auto max-w-3xl">
          <Card className="shadow-lg">
            <CardHeader>
              <div className="flex items-center justify-between mb-4">
                <CardTitle>Mentor Application</CardTitle>
                <span className="text-sm text-muted-foreground">
                  Step {currentStep} of 4
                </span>
              </div>

              {/* Progress Steps */}
              <div className="flex items-center justify-between mb-2">
                {STEPS.map((step, index) => (
                  <div key={step.id} className="flex items-center">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                        currentStep > step.id
                          ? 'bg-green-500 text-white'
                          : currentStep === step.id
                          ? 'bg-purple-dark text-white'
                          : 'bg-gray-200 text-gray-500'
                      }`}
                    >
                      {currentStep > step.id ? <CheckCircle2 className="h-5 w-5" /> : step.id}
                    </div>
                    {index < STEPS.length - 1 && (
                      <div
                        className={`hidden sm:block w-16 md:w-24 h-1 mx-2 ${
                          currentStep > step.id ? 'bg-green-500' : 'bg-gray-200'
                        }`}
                      />
                    )}
                  </div>
                ))}
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                {STEPS.map(step => (
                  <span key={step.id} className="hidden sm:inline">{step.title}</span>
                ))}
              </div>
            </CardHeader>

            <CardContent className="space-y-6">
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {/* Step 1: Personal Info */}
              {currentStep === 1 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Personal Information</h3>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="fullName">Full Name *</Label>
                      <Input
                        id="fullName"
                        value={formData.fullName}
                        onChange={e => updateField('fullName', e.target.value)}
                        placeholder="Jane Smith"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email *</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={e => updateField('email', e.target.value)}
                        placeholder="jane@example.com"
                      />
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number *</Label>
                      <Input
                        id="phone"
                        value={formData.phone}
                        onChange={e => updateField('phone', e.target.value)}
                        placeholder="+64 21 123 4567"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="gender">Gender</Label>
                      <Select value={formData.gender} onValueChange={v => updateField('gender', v)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select gender" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="female">Female</SelectItem>
                          <SelectItem value="male">Male</SelectItem>
                          <SelectItem value="non_binary">Non-binary</SelectItem>
                          <SelectItem value="prefer_not_to_say">Prefer not to say</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>MBTI Personality Type (Optional)</Label>
                    <p className="text-sm text-muted-foreground mb-2">
                      This helps us match you with compatible mentees
                    </p>
                    <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                      {MBTI_TYPES.map(type => (
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
                  </div>
                </div>
              )}

              {/* Step 2: Professional */}
              {currentStep === 2 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Professional Background</h3>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="jobTitle">Current Job Title *</Label>
                      <Input
                        id="jobTitle"
                        value={formData.jobTitle}
                        onChange={e => updateField('jobTitle', e.target.value)}
                        placeholder="Senior Software Engineer"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="company">Company *</Label>
                      <Input
                        id="company"
                        value={formData.company}
                        onChange={e => updateField('company', e.target.value)}
                        placeholder="Tech Company Ltd"
                      />
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="yearsExperience">Years of Experience *</Label>
                      <Select value={formData.yearsExperience} onValueChange={v => updateField('yearsExperience', v)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select experience" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="3">3-5 years</SelectItem>
                          <SelectItem value="5">5-10 years</SelectItem>
                          <SelectItem value="10">10-15 years</SelectItem>
                          <SelectItem value="15">15+ years</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="linkedinUrl">LinkedIn Profile</Label>
                      <Input
                        id="linkedinUrl"
                        value={formData.linkedinUrl}
                        onChange={e => updateField('linkedinUrl', e.target.value)}
                        placeholder="https://linkedin.com/in/yourprofile"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="bio">Professional Bio *</Label>
                    <p className="text-sm text-muted-foreground">
                      Tell mentees about your career journey and what drives you (150-500 words)
                    </p>
                    <Textarea
                      id="bio"
                      value={formData.bio}
                      onChange={e => updateField('bio', e.target.value)}
                      placeholder="I'm passionate about technology and helping others succeed..."
                      rows={6}
                    />
                    <p className="text-xs text-muted-foreground text-right">
                      {formData.bio.split(/\s+/).filter(Boolean).length} words
                    </p>
                  </div>
                </div>
              )}

              {/* Step 3: Mentorship */}
              {currentStep === 3 && (
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold">Mentorship Approach</h3>

                  <div className="space-y-3">
                    <Label>Soft Skills You Can Teach * (Select at least 2)</Label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {SOFT_SKILLS.map(skill => (
                        <Button
                          key={skill}
                          type="button"
                          variant={formData.softSkillsExpert.includes(skill) ? 'default' : 'outline'}
                          size="sm"
                          className={`justify-start ${formData.softSkillsExpert.includes(skill) ? 'bg-purple-dark' : ''}`}
                          onClick={() => toggleArrayItem('softSkillsExpert', skill)}
                        >
                          {skill}
                        </Button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Label>Technical/Industry Skills * (Select at least 2)</Label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {INDUSTRY_SKILLS.map(skill => (
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
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Maximum Mentees</Label>
                      <Select value={formData.maxMentees} onValueChange={v => updateField('maxMentees', v)}>
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
                      <Select value={formData.availabilityHoursPerMonth} onValueChange={v => updateField('availabilityHoursPerMonth', v)}>
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

                  <div className="space-y-2">
                    <Label htmlFor="expectedMenteeGoalsLongTerm">
                      What goals would you like to help mentees achieve? *
                    </Label>
                    <Textarea
                      id="expectedMenteeGoalsLongTerm"
                      value={formData.expectedMenteeGoalsLongTerm}
                      onChange={e => updateField('expectedMenteeGoalsLongTerm', e.target.value)}
                      placeholder="I'd like to help mentees with career transitions, technical skill development, building confidence in the workplace..."
                      rows={4}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="programExpectations">
                      What do you hope to gain from this program? (Optional)
                    </Label>
                    <Textarea
                      id="programExpectations"
                      value={formData.programExpectations}
                      onChange={e => updateField('programExpectations', e.target.value)}
                      placeholder="Personal growth, giving back to the community, expanding my network..."
                      rows={3}
                    />
                  </div>
                </div>
              )}

              {/* Step 4: Review */}
              {currentStep === 4 && (
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold">Review Your Application</h3>

                  <div className="space-y-4">
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h4 className="font-medium mb-2">Personal Information</h4>
                      <div className="grid sm:grid-cols-2 gap-2 text-sm">
                        <p><span className="text-muted-foreground">Name:</span> {formData.fullName}</p>
                        <p><span className="text-muted-foreground">Email:</span> {formData.email}</p>
                        <p><span className="text-muted-foreground">Phone:</span> {formData.phone}</p>
                        <p><span className="text-muted-foreground">MBTI:</span> {formData.mbtiType || 'Not specified'}</p>
                      </div>
                    </div>

                    <div className="bg-gray-50 rounded-lg p-4">
                      <h4 className="font-medium mb-2">Professional Background</h4>
                      <div className="grid sm:grid-cols-2 gap-2 text-sm">
                        <p><span className="text-muted-foreground">Title:</span> {formData.jobTitle}</p>
                        <p><span className="text-muted-foreground">Company:</span> {formData.company}</p>
                        <p><span className="text-muted-foreground">Experience:</span> {formData.yearsExperience}+ years</p>
                      </div>
                    </div>

                    <div className="bg-gray-50 rounded-lg p-4">
                      <h4 className="font-medium mb-2">Skills & Expertise</h4>
                      <div className="flex flex-wrap gap-1 mb-2">
                        {formData.softSkillsExpert.map(skill => (
                          <Badge key={skill} variant="secondary">{skill}</Badge>
                        ))}
                        {formData.industrySkillsExpert.map(skill => (
                          <Badge key={skill} variant="outline">{skill}</Badge>
                        ))}
                      </div>
                      <p className="text-sm">
                        <span className="text-muted-foreground">Capacity:</span> Up to {formData.maxMentees} mentees, {formData.availabilityHoursPerMonth} hours/month
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3 border-t pt-4">
                    <div className="flex items-start space-x-3">
                      <Checkbox
                        id="agreeToTerms"
                        checked={formData.agreeToTerms}
                        onCheckedChange={checked => updateField('agreeToTerms', checked)}
                      />
                      <Label htmlFor="agreeToTerms" className="text-sm leading-relaxed">
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

                    <div className="flex items-start space-x-3">
                      <Checkbox
                        id="agreeToCommitment"
                        checked={formData.agreeToCommitment}
                        onCheckedChange={checked => updateField('agreeToCommitment', checked)}
                      />
                      <Label htmlFor="agreeToCommitment" className="text-sm leading-relaxed">
                        I commit to being an active mentor, responding to mentees within 48 hours,
                        and participating in at least 2 mentoring sessions per month
                      </Label>
                    </div>
                  </div>
                </div>
              )}

              {/* Navigation Buttons */}
              <div className="flex justify-between pt-4 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleBack}
                  disabled={currentStep === 1}
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>

                {currentStep < 4 ? (
                  <Button
                    type="button"
                    onClick={handleNext}
                    disabled={!validateStep(currentStep)}
                    className="bg-purple-dark hover:bg-purple-dark/90"
                  >
                    Next
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                ) : (
                  <Button
                    type="button"
                    onClick={handleSubmit}
                    disabled={isSubmitting || !validateStep(4)}
                    className="bg-purple-dark hover:bg-purple-dark/90"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
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
        </div>
      </section>
    </div>
  );
}
