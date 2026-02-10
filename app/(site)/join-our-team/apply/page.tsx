'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Container } from '@/components/layout/container';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CVUpload } from '@/components/forms/cv-upload';
import { CheckCircle2, ArrowLeft, Loader2 } from 'lucide-react';

const STATUS_OPTIONS = [
  { value: 'high_school_student', label: 'High School Student' },
  { value: 'university_student', label: 'University Student' },
  { value: 'industry', label: 'Industry Professional' },
  { value: 'sponsor_partner', label: 'Sponsor/Partner' },
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

export default function VolunteerApplyPage() {
  const searchParams = useSearchParams();
  const formType = searchParams.get('type') === 'volunteer' ? 'volunteer' : 'ambassador';
  const isAmbassador = formType === 'ambassador';

  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [errors, setErrors] = useState<FormErrors>({});

  // Form state
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [currentStatus, setCurrentStatus] = useState('');
  const [currentStatusOther, setCurrentStatusOther] = useState('');
  const [organisation, setOrganisation] = useState('');
  const [howHeardAbout, setHowHeardAbout] = useState('');
  const [skillSets, setSkillSets] = useState('');
  // Ambassador-only
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [itIndustryInterest, setItIndustryInterest] = useState('');
  const [volunteerHoursPerWeek, setVolunteerHoursPerWeek] = useState('');
  const [cvUrl, setCvUrl] = useState<string | undefined>();
  const [cvFileName, setCvFileName] = useState<string | undefined>();
  // Volunteer-only
  const [eventsPerYear, setEventsPerYear] = useState('');

  function validate(): FormErrors {
    const errs: FormErrors = {};
    if (!firstName.trim()) errs.firstName = 'First name is required';
    if (!lastName.trim()) errs.lastName = 'Last name is required';
    if (!email.trim()) errs.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errs.email = 'Invalid email address';
    if (!currentStatus) errs.currentStatus = 'Please select your current status';
    if (currentStatus === 'other' && !currentStatusOther.trim()) {
      errs.currentStatusOther = 'Please specify your current status';
    }
    if (!howHeardAbout.trim()) errs.howHeardAbout = 'This field is required';
    if (!skillSets.trim()) errs.skillSets = 'This field is required';

    if (isAmbassador) {
      if (linkedinUrl && !/^https?:\/\/.+/.test(linkedinUrl)) errs.linkedinUrl = 'Please enter a valid URL';
      if (!itIndustryInterest.trim()) errs.itIndustryInterest = 'This field is required';
      if (!volunteerHoursPerWeek) errs.volunteerHoursPerWeek = 'Please select your availability';
      if (!cvUrl) errs.cvUrl = 'Please upload your CV';
    } else {
      if (!eventsPerYear) errs.eventsPerYear = 'Please select your availability';
    }

    return errs;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setServerError(null);

    const validationErrors = validate();
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;

    setSubmitting(true);

    try {
      const payload: Record<string, unknown> = {
        type: formType,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim(),
        currentStatus,
        currentStatusOther: currentStatus === 'other' ? currentStatusOther.trim() : undefined,
        organisation: organisation.trim() || undefined,
        howHeardAbout: howHeardAbout.trim(),
        skillSets: skillSets.trim(),
      };

      if (isAmbassador) {
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
        setServerError(data.error || 'Something went wrong. Please try again.');
        return;
      }

      setSubmitted(true);
    } catch {
      setServerError('Network error. Please check your connection and try again.');
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <section className="w-full bg-background text-foreground min-h-screen">
        <div className="py-24 md:py-32">
          <Container size="content">
            <div className="max-w-lg mx-auto text-center space-y-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="h-8 w-8 text-green-600" />
              </div>
              <h1 className="text-display-sm text-foreground">
                Application Submitted!
              </h1>
              <p className="text-muted-foreground text-lg">
                Thank you for your interest in becoming a She# {isAmbassador ? 'Ambassador' : 'Event Volunteer'}.
                We will review your application and get back to you soon.
              </p>
              <Button asChild variant="brand" size="lg">
                <Link href="/">Return to Home</Link>
              </Button>
            </div>
          </Container>
        </div>
      </section>
    );
  }

  return (
    <section className="w-full bg-background text-foreground">
      {/* Hero */}
      <div className="bg-gradient-to-b from-brand/5 to-background py-16 md:py-24">
        <Container size="content">
          <div className="max-w-2xl mx-auto text-center space-y-4">
            <Link
              href="/join-our-team"
              className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Join Our Team
            </Link>
            <h1 className="text-display-sm md:text-display-md text-foreground">
              {isAmbassador ? 'She# Ambassador' : 'Event Volunteer'} — Expression of Interest
            </h1>
            <p className="text-muted-foreground text-base md:text-lg">
              Thank you for your interest in volunteering with She Sharp!
              Please fill out the form below and we will be in touch.
              If you have any questions, feel free to contact us at{' '}
              <a href="mailto:people@shesharp.org.nz" className="text-brand hover:underline">
                people@shesharp.org.nz
              </a>
            </p>
          </div>
        </Container>
      </div>

      {/* Form */}
      <div className="pb-16 md:pb-24">
        <Container size="content">
          <Card className="max-w-2xl mx-auto p-6 md:p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Name fields */}
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

              {/* Email */}
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

              {/* Current Status */}
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

              {/* Organisation */}
              <div className="space-y-2">
                <Label htmlFor="organisation">Organisation</Label>
                <Input
                  id="organisation"
                  value={organisation}
                  onChange={(e) => setOrganisation(e.target.value)}
                  placeholder="Name of your current university, workplace, or other affiliated organisation"
                />
              </div>

              {/* How heard about */}
              <div className="space-y-2">
                <Label htmlFor="howHeardAbout">
                  How did you hear about She#? <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  id="howHeardAbout"
                  value={howHeardAbout}
                  onChange={(e) => setHowHeardAbout(e.target.value)}
                  placeholder="Tell us how you found out about She Sharp"
                  rows={3}
                />
                {errors.howHeardAbout && <p className="text-sm text-red-500">{errors.howHeardAbout}</p>}
              </div>

              {/* Skill sets */}
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

              {/* Ambassador-only fields */}
              {isAmbassador && (
                <>
                  {/* LinkedIn */}
                  <div className="space-y-2">
                    <Label htmlFor="linkedinUrl">LinkedIn URL</Label>
                    <Input
                      id="linkedinUrl"
                      type="url"
                      value={linkedinUrl}
                      onChange={(e) => setLinkedinUrl(e.target.value)}
                      placeholder="https://linkedin.com/in/your-profile"
                    />
                    {errors.linkedinUrl && <p className="text-sm text-red-500">{errors.linkedinUrl}</p>}
                  </div>

                  {/* IT Industry Interest */}
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

                  {/* Hours per week */}
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

                  {/* CV Upload */}
                  <CVUpload
                    value={cvUrl}
                    fileName={cvFileName}
                    onChange={(url, name) => {
                      setCvUrl(url);
                      setCvFileName(name);
                    }}
                    email={email}
                    label="CV / Resume"
                    description="Upload your CV or resume (PDF, DOC, or DOCX)"
                    required
                    error={errors.cvUrl}
                  />
                </>
              )}

              {/* Volunteer-only fields */}
              {!isAmbassador && (
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
              )}

              {/* Server error */}
              {serverError && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                  {serverError}
                </div>
              )}

              {/* Submit */}
              <Button
                type="submit"
                variant="brand"
                size="lg"
                className="w-full"
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Submitting...
                  </>
                ) : (
                  'Submit Application'
                )}
              </Button>
            </form>
          </Card>
        </Container>
      </div>
    </section>
  );
}
