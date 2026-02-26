'use client';

import { useState, useCallback } from 'react';
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
import {
  MultiStepFormWrapper,
  type FormStep,
} from '@/components/forms/multi-step-form-wrapper';
import { User, Compass, MessageCircle } from 'lucide-react';

const EXPERIENCE_RATINGS = [
  { value: 'excellent', label: 'Excellent' },
  { value: 'good', label: 'Good' },
  { value: 'average', label: 'Average' },
  { value: 'below_average', label: 'Below Average' },
  { value: 'poor', label: 'Poor' },
];

const MOST_VALUABLE_OPTIONS = [
  { value: 'networking', label: 'Networking Opportunities' },
  { value: 'skills', label: 'Skills Development' },
  { value: 'mentorship', label: 'Mentorship & Guidance' },
  { value: 'community', label: 'Community Involvement' },
  { value: 'other', label: 'Other' },
];

const COMMUNICATION_OPTIONS = [
  { value: 'email', label: 'Email' },
  { value: 'phone', label: 'Phone' },
];

const currentYear = new Date().getFullYear();
const YEAR_OPTIONS = Array.from({ length: 15 }, (_, i) => ({
  value: String(currentYear - i),
  label: String(currentYear - i),
}));

interface FormErrors {
  [key: string]: string;
}

const EX_AMBASSADOR_STEPS: FormStep[] = [
  {
    id: 1,
    title: 'About You',
    description: "Let's start with the basics",
    icon: User,
    encouragement: "Thanks for sharing! Let's reflect on your journey...",
  },
  {
    id: 2,
    title: 'Your Journey',
    description: 'Reflect on your She Sharp experience',
    icon: Compass,
    encouragement: 'Almost there! Just a few more questions...',
  },
  {
    id: 3,
    title: 'Stay Connected',
    description: 'Help us keep in touch',
    icon: MessageCircle,
  },
];

export default function ExAmbassadorFormPage() {
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});

  // Step 1
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [currentRoleTitle, setCurrentRoleTitle] = useState('');

  // Step 2
  const [joinedYear, setJoinedYear] = useState('');
  const [leftYear, setLeftYear] = useState('');
  const [stillAmbassador, setStillAmbassador] = useState('');
  const [experienceRating, setExperienceRating] = useState('');
  const [mostValuablePart, setMostValuablePart] = useState('');
  const [mostValuablePartOther, setMostValuablePartOther] = useState('');

  // Step 3
  const [wouldRecommend, setWouldRecommend] = useState('');
  const [wantFeatured, setWantFeatured] = useState('');
  const [preferredCommunication, setPreferredCommunication] = useState('');
  const [additionalComments, setAdditionalComments] = useState('');

  const validateStep = useCallback(
    (step: number): boolean => {
      const errs: FormErrors = {};

      switch (step) {
        case 0:
          if (!firstName.trim()) errs.firstName = 'First name is required';
          if (!lastName.trim()) errs.lastName = 'Last name is required';
          if (!email.trim()) errs.email = 'Email is required';
          else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
            errs.email = 'Invalid email address';
          break;
        case 1:
          if (!joinedYear) errs.joinedYear = 'Please select the year you joined';
          if (!stillAmbassador) errs.stillAmbassador = 'Please select an option';
          if (stillAmbassador === 'no' && !leftYear)
            errs.leftYear = 'Please select the year you left';
          if (!experienceRating) errs.experienceRating = 'Please rate your experience';
          if (!mostValuablePart) errs.mostValuablePart = 'Please select an option';
          if (mostValuablePart === 'other' && !mostValuablePartOther.trim())
            errs.mostValuablePartOther = 'Please specify';
          break;
        case 2:
          if (!wouldRecommend) errs.wouldRecommend = 'Please select an option';
          if (!wantFeatured) errs.wantFeatured = 'Please select an option';
          if (!preferredCommunication)
            errs.preferredCommunication = 'Please select a contact method';
          break;
      }

      setErrors(errs);
      return Object.keys(errs).length === 0;
    },
    [
      firstName, lastName, email, joinedYear, leftYear, stillAmbassador,
      experienceRating, mostValuablePart, mostValuablePartOther,
      wouldRecommend, wantFeatured, preferredCommunication,
    ]
  );

  const handleSubmit = useCallback(async () => {
    setSubmitting(true);

    try {
      const payload = {
        type: 'ex_ambassador',
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim(),
        currentRoleTitle: currentRoleTitle.trim() || undefined,
        joinedSheSharpYear: parseInt(joinedYear),
        leftRoleYear: stillAmbassador === 'no' ? parseInt(leftYear) : undefined,
        stillAmbassador: stillAmbassador === 'yes',
        experienceRating,
        mostValuablePart,
        mostValuablePartOther: mostValuablePart === 'other' ? mostValuablePartOther.trim() : undefined,
        wouldRecommend: wouldRecommend === 'yes',
        wantFeatured: wantFeatured === 'yes',
        preferredCommunication,
        additionalComments: additionalComments.trim() || undefined,
      };

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
    firstName, lastName, email, currentRoleTitle, joinedYear, leftYear,
    stillAmbassador, experienceRating, mostValuablePart, mostValuablePartOther,
    wouldRecommend, wantFeatured, preferredCommunication, additionalComments,
  ]);

  const renderStep = (step: number) => {
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
              <Label htmlFor="currentRoleTitle">Current Role / Title (optional)</Label>
              <Input
                id="currentRoleTitle"
                value={currentRoleTitle}
                onChange={(e) => setCurrentRoleTitle(e.target.value)}
                placeholder="e.g. Software Engineer at Xero"
              />
            </div>
          </>
        );

      case 1:
        return (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>
                  Year you joined She Sharp <span className="text-red-500">*</span>
                </Label>
                <Select value={joinedYear} onValueChange={setJoinedYear}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select year" />
                  </SelectTrigger>
                  <SelectContent>
                    {YEAR_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.joinedYear && <p className="text-sm text-red-500">{errors.joinedYear}</p>}
              </div>
              <div className="space-y-2">
                <Label>
                  Are you still an Ambassador? <span className="text-red-500">*</span>
                </Label>
                <RadioGroup value={stillAmbassador} onValueChange={setStillAmbassador}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="yes" id="still-yes" />
                    <Label htmlFor="still-yes" className="font-normal cursor-pointer">Yes</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="no" id="still-no" />
                    <Label htmlFor="still-no" className="font-normal cursor-pointer">No</Label>
                  </div>
                </RadioGroup>
                {errors.stillAmbassador && (
                  <p className="text-sm text-red-500">{errors.stillAmbassador}</p>
                )}
              </div>
            </div>
            {stillAmbassador === 'no' && (
              <div className="space-y-2">
                <Label>
                  Year you left the role <span className="text-red-500">*</span>
                </Label>
                <Select value={leftYear} onValueChange={setLeftYear}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select year" />
                  </SelectTrigger>
                  <SelectContent>
                    {YEAR_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.leftYear && <p className="text-sm text-red-500">{errors.leftYear}</p>}
              </div>
            )}
            <div className="space-y-3">
              <Label>
                How would you rate your experience? <span className="text-red-500">*</span>
              </Label>
              <RadioGroup value={experienceRating} onValueChange={setExperienceRating}>
                {EXPERIENCE_RATINGS.map((option) => (
                  <div key={option.value} className="flex items-center space-x-2">
                    <RadioGroupItem value={option.value} id={`rating-${option.value}`} />
                    <Label htmlFor={`rating-${option.value}`} className="font-normal cursor-pointer">
                      {option.label}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
              {errors.experienceRating && (
                <p className="text-sm text-red-500">{errors.experienceRating}</p>
              )}
            </div>
            <div className="space-y-3">
              <Label>
                What was the most valuable part? <span className="text-red-500">*</span>
              </Label>
              <RadioGroup value={mostValuablePart} onValueChange={setMostValuablePart}>
                {MOST_VALUABLE_OPTIONS.map((option) => (
                  <div key={option.value} className="flex items-center space-x-2">
                    <RadioGroupItem value={option.value} id={`valuable-${option.value}`} />
                    <Label
                      htmlFor={`valuable-${option.value}`}
                      className="font-normal cursor-pointer"
                    >
                      {option.label}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
              {errors.mostValuablePart && (
                <p className="text-sm text-red-500">{errors.mostValuablePart}</p>
              )}
              {mostValuablePart === 'other' && (
                <div className="ml-6 space-y-2">
                  <Input
                    value={mostValuablePartOther}
                    onChange={(e) => setMostValuablePartOther(e.target.value)}
                    placeholder="Please specify"
                  />
                  {errors.mostValuablePartOther && (
                    <p className="text-sm text-red-500">{errors.mostValuablePartOther}</p>
                  )}
                </div>
              )}
            </div>
          </>
        );

      case 2:
        return (
          <>
            <div className="space-y-3">
              <Label>
                Would you recommend She Sharp to others? <span className="text-red-500">*</span>
              </Label>
              <RadioGroup value={wouldRecommend} onValueChange={setWouldRecommend}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="yes" id="recommend-yes" />
                  <Label htmlFor="recommend-yes" className="font-normal cursor-pointer">Yes</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="no" id="recommend-no" />
                  <Label htmlFor="recommend-no" className="font-normal cursor-pointer">No</Label>
                </div>
              </RadioGroup>
              {errors.wouldRecommend && (
                <p className="text-sm text-red-500">{errors.wouldRecommend}</p>
              )}
            </div>
            <div className="space-y-3">
              <Label>
                Would you like to be featured in our alumni spotlight? <span className="text-red-500">*</span>
              </Label>
              <RadioGroup value={wantFeatured} onValueChange={setWantFeatured}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="yes" id="featured-yes" />
                  <Label htmlFor="featured-yes" className="font-normal cursor-pointer">Yes, I&apos;d love to!</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="no" id="featured-no" />
                  <Label htmlFor="featured-no" className="font-normal cursor-pointer">No, thank you</Label>
                </div>
              </RadioGroup>
              {errors.wantFeatured && (
                <p className="text-sm text-red-500">{errors.wantFeatured}</p>
              )}
            </div>
            <div className="space-y-3">
              <Label>
                Preferred contact method <span className="text-red-500">*</span>
              </Label>
              <RadioGroup value={preferredCommunication} onValueChange={setPreferredCommunication}>
                {COMMUNICATION_OPTIONS.map((option) => (
                  <div key={option.value} className="flex items-center space-x-2">
                    <RadioGroupItem value={option.value} id={`comm-${option.value}`} />
                    <Label htmlFor={`comm-${option.value}`} className="font-normal cursor-pointer">
                      {option.label}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
              {errors.preferredCommunication && (
                <p className="text-sm text-red-500">{errors.preferredCommunication}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="additionalComments">Additional Comments (optional)</Label>
              <Textarea
                id="additionalComments"
                value={additionalComments}
                onChange={(e) => setAdditionalComments(e.target.value)}
                placeholder="Any thoughts, suggestions, or memories you'd like to share"
                rows={4}
              />
            </div>
          </>
        );

      default:
        return null;
    }
  };

  return (
    <MultiStepFormWrapper
      title="Ex-Ambassador Feedback"
      subtitle="Share your She Sharp journey and help us improve!"
      steps={EX_AMBASSADOR_STEPS}
      renderStep={renderStep}
      validateStep={validateStep}
      onSubmit={handleSubmit}
      isSubmitting={submitting}
      successTitle="Thank You!"
      successMessage="Your feedback is invaluable to us. Thank you for being part of the She Sharp family!"
      backLink={{ href: '/join-our-team', label: 'Back to Join Our Team' }}
    />
  );
}
