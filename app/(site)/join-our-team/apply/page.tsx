'use client';

import { useState, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CVUpload } from '@/components/forms/cv-upload';
import {
  MultiStepFormWrapper,
  type FormStep,
} from '@/components/forms/multi-step-form-wrapper';
import { User, Briefcase, Heart, Clock } from 'lucide-react';

const STATUS_OPTIONS = [
  { value: 'high_school_student', label: 'High School Student' },
  { value: 'university_student', label: 'University Student' },
  { value: 'industry', label: 'Full Time Work / Professional' },
  { value: 'sponsor_partner', label: 'Sponsor/Partner' },
  { value: 'other', label: 'Other' },
];

const HOW_HEARD_OPTIONS = [
  { value: 'attended_event', label: 'Attended an Event' },
  { value: 'linkedin', label: 'LinkedIn' },
  { value: 'word_of_mouth', label: 'Word of Mouth / Through a Friend' },
  { value: 'search_engine', label: 'Search Engine (Google, etc.)' },
  { value: 'social_media', label: 'Social Media' },
  { value: 'other', label: 'Other' },
];

const HOURS_OPTIONS = [
  { value: '1-5', label: '1-5 hours' },
  { value: '5-10', label: '5-10 hours' },
  { value: '10-15', label: '10-15 hours' },
  { value: '15-20', label: '15-20 hours' },
  { value: '20+', label: '20+ hours' },
];

const EVENTS_OPTIONS = [
  { value: '1-2', label: '1-2 events' },
  { value: '3-4', label: '3-4 events' },
  { value: '5-6', label: '5-6 events' },
  { value: '6+', label: '6+ events' },
];

interface FormErrors {
  [key: string]: string;
}

// Volunteer form steps
const VOLUNTEER_STEPS: FormStep[] = [
  {
    id: 1,
    title: 'About You',
    description: "Let's start with the basics",
    icon: User,
    encouragement: 'Great start! Just a bit more about you...',
  },
  {
    id: 2,
    title: 'Your Background',
    description: 'Tell us about your current situation',
    icon: Briefcase,
    encouragement: 'Almost there! One last step...',
  },
  {
    id: 3,
    title: 'Your Contribution',
    description: 'How you can help She Sharp events',
    icon: Heart,
  },
];

// Ambassador form steps
const AMBASSADOR_STEPS: FormStep[] = [
  {
    id: 1,
    title: 'About You',
    description: 'Your identity and professional links',
    icon: User,
    encouragement: "Nice! Let's learn more about you...",
  },
  {
    id: 2,
    title: 'Your Background',
    description: 'Tell us about your current situation',
    icon: Briefcase,
    encouragement: "You're halfway there!",
  },
  {
    id: 3,
    title: 'Your Passion',
    description: 'What drives your interest in tech',
    icon: Heart,
    encouragement: 'Almost done! Just one more step...',
  },
  {
    id: 4,
    title: 'Your Commitment',
    description: 'Availability and supporting documents',
    icon: Clock,
  },
];

export default function VolunteerApplyPage() {
  const searchParams = useSearchParams();
  const formType = searchParams.get('type') === 'volunteer' ? 'volunteer' : 'ambassador';
  const isAmbassador = formType === 'ambassador';

  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});

  // Shared form state
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [currentStatus, setCurrentStatus] = useState('');
  const [currentStatusOther, setCurrentStatusOther] = useState('');
  const [howHeardAboutOption, setHowHeardAboutOption] = useState('');
  const [howHeardAboutOther, setHowHeardAboutOther] = useState('');
  const [skillSets, setSkillSets] = useState('');

  // Ambassador-only state
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [organisation, setOrganisation] = useState('');
  const [itIndustryInterest, setItIndustryInterest] = useState('');
  const [volunteerHoursPerWeek, setVolunteerHoursPerWeek] = useState('');
  const [cvUrl, setCvUrl] = useState<string | undefined>();
  const [cvFileName, setCvFileName] = useState<string | undefined>();

  // Volunteer-only state
  const [eventsPerYear, setEventsPerYear] = useState('');

  const validateStep = useCallback(
    (step: number): boolean => {
      const errs: FormErrors = {};

      if (isAmbassador) {
        switch (step) {
          case 0: // About You
            if (!firstName.trim()) errs.firstName = 'First name is required';
            if (!lastName.trim()) errs.lastName = 'Last name is required';
            if (!email.trim()) errs.email = 'Email is required';
            else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
              errs.email = 'Invalid email address';
            if (linkedinUrl && !/^https?:\/\/.+/.test(linkedinUrl))
              errs.linkedinUrl = 'Please enter a valid URL';
            break;
          case 1: // Background
            if (!currentStatus) errs.currentStatus = 'Please select your current status';
            if (currentStatus === 'other' && !currentStatusOther.trim())
              errs.currentStatusOther = 'Please specify your current status';
            if (!howHeardAboutOption) errs.howHeardAboutOption = 'Please select an option';
            if (howHeardAboutOption === 'other' && !howHeardAboutOther.trim())
              errs.howHeardAboutOther = 'Please specify';
            break;
          case 2: // Passion
            if (!itIndustryInterest.trim()) errs.itIndustryInterest = 'This field is required';
            if (!skillSets.trim()) errs.skillSets = 'This field is required';
            break;
          case 3: // Commitment
            if (!volunteerHoursPerWeek) errs.volunteerHoursPerWeek = 'Please select your availability';
            if (!cvUrl) errs.cvUrl = 'Please upload your CV';
            break;
        }
      } else {
        switch (step) {
          case 0: // About You
            if (!firstName.trim()) errs.firstName = 'First name is required';
            if (!lastName.trim()) errs.lastName = 'Last name is required';
            if (!email.trim()) errs.email = 'Email is required';
            else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
              errs.email = 'Invalid email address';
            break;
          case 1: // Background
            if (!currentStatus) errs.currentStatus = 'Please select your current status';
            if (currentStatus === 'other' && !currentStatusOther.trim())
              errs.currentStatusOther = 'Please specify your current status';
            if (!howHeardAboutOption) errs.howHeardAboutOption = 'Please select an option';
            if (howHeardAboutOption === 'other' && !howHeardAboutOther.trim())
              errs.howHeardAboutOther = 'Please specify';
            break;
          case 2: // Contribution
            if (!skillSets.trim()) errs.skillSets = 'This field is required';
            if (!eventsPerYear) errs.eventsPerYear = 'Please select your availability';
            break;
        }
      }

      setErrors(errs);
      return Object.keys(errs).length === 0;
    },
    [
      isAmbassador, firstName, lastName, email, currentStatus,
      currentStatusOther, howHeardAboutOption, howHeardAboutOther,
      skillSets, linkedinUrl, itIndustryInterest, volunteerHoursPerWeek,
      cvUrl, eventsPerYear,
    ]
  );

  const handleSubmit = useCallback(async () => {
    setSubmitting(true);

    try {
      const howHeardAboutLabel = HOW_HEARD_OPTIONS.find(
        (o) => o.value === howHeardAboutOption
      )?.label || howHeardAboutOther || howHeardAboutOption;

      const payload: Record<string, unknown> = {
        type: formType,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim(),
        currentStatus,
        currentStatusOther: currentStatus === 'other' ? currentStatusOther.trim() : undefined,
        howHeardAbout: howHeardAboutOption === 'other' ? howHeardAboutOther.trim() : howHeardAboutLabel,
        howHeardAboutOption,
        howHeardAboutOther: howHeardAboutOption === 'other' ? howHeardAboutOther.trim() : undefined,
        skillSets: skillSets.trim(),
      };

      if (isAmbassador) {
        payload.organisation = organisation.trim() || undefined;
        payload.linkedinUrl = linkedinUrl.trim() || undefined;
        payload.itIndustryInterest = itIndustryInterest.trim();
        payload.volunteerHoursPerWeek = volunteerHoursPerWeek;
        payload.cvUrl = cvUrl;
        payload.cvFileName = cvFileName;
      } else {
        payload.eventsPerYear = eventsPerYear;
      }

      const response = await fetch('/api/forms/volunteer/public', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok || data.error) {
        throw new Error(data.error || 'Something went wrong. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  }, [
    formType, firstName, lastName, email, currentStatus, currentStatusOther,
    howHeardAboutOption, howHeardAboutOther, skillSets, isAmbassador,
    organisation, linkedinUrl, itIndustryInterest, volunteerHoursPerWeek,
    cvUrl, cvFileName, eventsPerYear,
  ]);

  // Render step content for volunteer form
  const renderVolunteerStep = (step: number) => {
    switch (step) {
      case 0:
        return (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">
                  First Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="firstName"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="Enter your first name"
                />
                {errors.firstName && <p className="text-sm text-red-500">{errors.firstName}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">
                  Last Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="lastName"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Enter your last name"
                />
                {errors.lastName && <p className="text-sm text-red-500">{errors.lastName}</p>}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">
                Email <span className="text-red-500">*</span>
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email address"
              />
              {errors.email && <p className="text-sm text-red-500">{errors.email}</p>}
            </div>
          </>
        );

      case 1:
        return (
          <>
            <div className="space-y-3">
              <Label>
                What is your current status? <span className="text-red-500">*</span>
              </Label>
              <RadioGroup value={currentStatus} onValueChange={setCurrentStatus}>
                {STATUS_OPTIONS.map((option) => (
                  <div key={option.value} className="flex items-center space-x-2">
                    <RadioGroupItem value={option.value} id={`status-${option.value}`} />
                    <Label htmlFor={`status-${option.value}`} className="font-normal cursor-pointer">
                      {option.label}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
              {errors.currentStatus && <p className="text-sm text-red-500">{errors.currentStatus}</p>}
              {currentStatus === 'other' && (
                <div className="ml-6 space-y-2">
                  <Input
                    value={currentStatusOther}
                    onChange={(e) => setCurrentStatusOther(e.target.value)}
                    placeholder="Please specify"
                  />
                  {errors.currentStatusOther && (
                    <p className="text-sm text-red-500">{errors.currentStatusOther}</p>
                  )}
                </div>
              )}
            </div>
            <div className="space-y-2">
              <Label>
                How did you hear about She#? <span className="text-red-500">*</span>
              </Label>
              <Select value={howHeardAboutOption} onValueChange={setHowHeardAboutOption}>
                <SelectTrigger>
                  <SelectValue placeholder="Select an option" />
                </SelectTrigger>
                <SelectContent>
                  {HOW_HEARD_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.howHeardAboutOption && (
                <p className="text-sm text-red-500">{errors.howHeardAboutOption}</p>
              )}
              {howHeardAboutOption === 'other' && (
                <div className="mt-2">
                  <Input
                    value={howHeardAboutOther}
                    onChange={(e) => setHowHeardAboutOther(e.target.value)}
                    placeholder="Please specify"
                  />
                  {errors.howHeardAboutOther && (
                    <p className="text-sm text-red-500">{errors.howHeardAboutOther}</p>
                  )}
                </div>
              )}
            </div>
          </>
        );

      case 2:
        return (
          <>
            <div className="space-y-2">
              <Label htmlFor="skillSets">
                What skill sets can you bring to the team? <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="skillSets"
                value={skillSets}
                onChange={(e) => setSkillSets(e.target.value)}
                placeholder="Describe your skills and experience relevant to volunteering"
                rows={4}
              />
              {errors.skillSets && <p className="text-sm text-red-500">{errors.skillSets}</p>}
            </div>
            <div className="space-y-2">
              <Label>
                How many events per year can you volunteer for? <span className="text-red-500">*</span>
              </Label>
              <Select value={eventsPerYear} onValueChange={setEventsPerYear}>
                <SelectTrigger>
                  <SelectValue placeholder="Select events per year" />
                </SelectTrigger>
                <SelectContent>
                  {EVENTS_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.eventsPerYear && (
                <p className="text-sm text-red-500">{errors.eventsPerYear}</p>
              )}
            </div>
          </>
        );

      default:
        return null;
    }
  };

  // Render step content for ambassador form
  const renderAmbassadorStep = (step: number) => {
    switch (step) {
      case 0:
        return (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">
                  First Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="firstName"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="Enter your first name"
                />
                {errors.firstName && <p className="text-sm text-red-500">{errors.firstName}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">
                  Last Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="lastName"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Enter your last name"
                />
                {errors.lastName && <p className="text-sm text-red-500">{errors.lastName}</p>}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">
                Email <span className="text-red-500">*</span>
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email address"
              />
              {errors.email && <p className="text-sm text-red-500">{errors.email}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="linkedinUrl">LinkedIn URL (optional)</Label>
              <Input
                id="linkedinUrl"
                type="url"
                value={linkedinUrl}
                onChange={(e) => setLinkedinUrl(e.target.value)}
                placeholder="https://linkedin.com/in/your-profile"
              />
              {errors.linkedinUrl && <p className="text-sm text-red-500">{errors.linkedinUrl}</p>}
            </div>
          </>
        );

      case 1:
        return (
          <>
            <div className="space-y-3">
              <Label>
                What is your current status? <span className="text-red-500">*</span>
              </Label>
              <RadioGroup value={currentStatus} onValueChange={setCurrentStatus}>
                {STATUS_OPTIONS.map((option) => (
                  <div key={option.value} className="flex items-center space-x-2">
                    <RadioGroupItem value={option.value} id={`status-${option.value}`} />
                    <Label htmlFor={`status-${option.value}`} className="font-normal cursor-pointer">
                      {option.label}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
              {errors.currentStatus && <p className="text-sm text-red-500">{errors.currentStatus}</p>}
              {currentStatus === 'other' && (
                <div className="ml-6 space-y-2">
                  <Input
                    value={currentStatusOther}
                    onChange={(e) => setCurrentStatusOther(e.target.value)}
                    placeholder="Please specify"
                  />
                  {errors.currentStatusOther && (
                    <p className="text-sm text-red-500">{errors.currentStatusOther}</p>
                  )}
                </div>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="organisation">Organisation (optional)</Label>
              <Input
                id="organisation"
                value={organisation}
                onChange={(e) => setOrganisation(e.target.value)}
                placeholder="University, workplace, or other organisation"
              />
            </div>
            <div className="space-y-2">
              <Label>
                How did you hear about She#? <span className="text-red-500">*</span>
              </Label>
              <Select value={howHeardAboutOption} onValueChange={setHowHeardAboutOption}>
                <SelectTrigger>
                  <SelectValue placeholder="Select an option" />
                </SelectTrigger>
                <SelectContent>
                  {HOW_HEARD_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.howHeardAboutOption && (
                <p className="text-sm text-red-500">{errors.howHeardAboutOption}</p>
              )}
              {howHeardAboutOption === 'other' && (
                <div className="mt-2">
                  <Input
                    value={howHeardAboutOther}
                    onChange={(e) => setHowHeardAboutOther(e.target.value)}
                    placeholder="Please specify"
                  />
                  {errors.howHeardAboutOther && (
                    <p className="text-sm text-red-500">{errors.howHeardAboutOther}</p>
                  )}
                </div>
              )}
            </div>
          </>
        );

      case 2:
        return (
          <>
            <div className="space-y-2">
              <Label htmlFor="itIndustryInterest">
                What intrigues you about the IT industry? <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="itIndustryInterest"
                value={itIndustryInterest}
                onChange={(e) => setItIndustryInterest(e.target.value)}
                placeholder="Tell us what excites you about technology and the IT industry"
                rows={4}
              />
              {errors.itIndustryInterest && (
                <p className="text-sm text-red-500">{errors.itIndustryInterest}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="skillSets">
                What skill sets can you bring to the team? <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="skillSets"
                value={skillSets}
                onChange={(e) => setSkillSets(e.target.value)}
                placeholder="Describe your skills and experience"
                rows={4}
              />
              {errors.skillSets && <p className="text-sm text-red-500">{errors.skillSets}</p>}
            </div>
          </>
        );

      case 3:
        return (
          <>
            <div className="space-y-2">
              <Label>
                How many hours do you intend to volunteer per week? <span className="text-red-500">*</span>
              </Label>
              <Select value={volunteerHoursPerWeek} onValueChange={setVolunteerHoursPerWeek}>
                <SelectTrigger>
                  <SelectValue placeholder="Select hours per week" />
                </SelectTrigger>
                <SelectContent>
                  {HOURS_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.volunteerHoursPerWeek && (
                <p className="text-sm text-red-500">{errors.volunteerHoursPerWeek}</p>
              )}
            </div>
            <CVUpload
              value={cvUrl}
              fileName={cvFileName}
              onChange={(url, name) => {
                setCvUrl(url);
                setCvFileName(name);
              }}
              email={email}
              label="CV / Resume"
              description="Upload your CV or resume in PDF format"
              required
              error={errors.cvUrl}
            />
          </>
        );

      default:
        return null;
    }
  };

  return (
    <MultiStepFormWrapper
      title={
        isAmbassador
          ? 'She# Ambassador Application'
          : 'Event Volunteer Application'
      }
      subtitle={
        isAmbassador
          ? 'Shape She Sharp\'s future and lead meaningful projects!'
          : 'Help us make amazing events happen!'
      }
      steps={isAmbassador ? AMBASSADOR_STEPS : VOLUNTEER_STEPS}
      renderStep={isAmbassador ? renderAmbassadorStep : renderVolunteerStep}
      validateStep={validateStep}
      onSubmit={handleSubmit}
      isSubmitting={submitting}
      successTitle="Application Submitted!"
      successMessage={`Thank you for your interest in becoming a She# ${
        isAmbassador ? 'Ambassador' : 'Event Volunteer'
      }. We will review your application and get back to you within 5-7 business days.`}
      backLink={{ href: '/join-our-team', label: 'Back to Join Our Team' }}
    />
  );
}
