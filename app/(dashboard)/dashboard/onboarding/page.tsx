'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  ArrowRight, 
  ArrowLeft, 
  CheckCircle2,
  Briefcase,
  Target,
  Calendar,
  BookOpen,
  Users,
  Loader2
} from 'lucide-react';

type OnboardingStep = {
  id: string;
  title: string;
  description: string;
  icon: any;
};

const mentorSteps: OnboardingStep[] = [
  {
    id: 'expertise',
    title: 'Your Expertise',
    description: 'Tell us about your professional background and areas of expertise',
    icon: Briefcase
  },
  {
    id: 'availability',
    title: 'Availability',
    description: 'Set your mentoring availability and preferences',
    icon: Calendar
  },
  {
    id: 'profile',
    title: 'Mentor Profile',
    description: 'Complete your mentor profile to attract mentees',
    icon: Users
  }
];

const menteeSteps: OnboardingStep[] = [
  {
    id: 'goals',
    title: 'Learning Goals',
    description: 'Share your career goals and what you hope to achieve',
    icon: Target
  },
  {
    id: 'preferences',
    title: 'Mentor Preferences',
    description: "Tell us what kind of mentor you're looking for",
    icon: Users
  },
  {
    id: 'profile',
    title: 'Your Profile',
    description: 'Complete your profile to help mentors understand your needs',
    icon: BookOpen
  }
];

function OnboardingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [currentStep, setCurrentStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<any>({});
  
  const roleParam = searchParams.get('role');
  const rolesParam = searchParams.get('roles');
  
  const roles = rolesParam ? rolesParam.split(',') : roleParam ? [roleParam] : [];
  const isMentor = roles.includes('mentor');
  const isMentee = roles.includes('mentee');
  const currentRole = currentStep < (isMentor ? mentorSteps.length : 0) ? 'mentor' : 'mentee';
  
  const allSteps = [
    ...(isMentor ? mentorSteps : []),
    ...(isMentee ? menteeSteps : [])
  ];
  
  const activeSteps = currentRole === 'mentor' ? mentorSteps : menteeSteps;
  const activeStepIndex = currentRole === 'mentor' 
    ? currentStep 
    : currentStep - (isMentor ? mentorSteps.length : 0);
  
  const currentStepData = activeSteps[activeStepIndex];
  const progress = ((currentStep + 1) / allSteps.length) * 100;

  const handleNext = async () => {
    if (currentStep < allSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      await handleSubmit();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    try {
      // Activate roles
      for (const role of roles) {
        await fetch('/api/user/roles', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ roleType: role })
        });

        // Submit profile data based on role
        if (role === 'mentor') {
          await fetch('/api/user/mentor-profile', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData.mentor || {})
          });
        } else if (role === 'mentee') {
          await fetch('/api/user/mentee-profile', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData.mentee || {})
          });
        }
      }

      router.push('/dashboard');
    } catch (error) {
      console.error('Error completing onboarding:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateFormData = (field: string, value: any) => {
    setFormData((prev: any) => ({
      ...prev,
      [currentRole]: {
        ...prev[currentRole],
        [field]: value
      }
    }));
  };

  const renderStepContent = () => {
    if (!currentStepData) return null;

    if (currentRole === 'mentor') {
      switch (currentStepData.id) {
        case 'expertise':
          return (
            <div className="space-y-6">
              <div>
                <Label htmlFor="company">Company/Organization</Label>
                <Input
                  id="company"
                  placeholder="e.g., Microsoft, Stanford University"
                  value={formData.mentor?.company || ''}
                  onChange={(e) => updateFormData('company', e.target.value)}
                  className="mt-2"
                />
              </div>
              
              <div>
                <Label htmlFor="jobTitle">Job Title</Label>
                <Input
                  id="jobTitle"
                  placeholder="e.g., Senior Software Engineer"
                  value={formData.mentor?.jobTitle || ''}
                  onChange={(e) => updateFormData('jobTitle', e.target.value)}
                  className="mt-2"
                />
              </div>

              <div>
                <Label htmlFor="yearsExperience">Years of Experience</Label>
                <Input
                  id="yearsExperience"
                  type="number"
                  placeholder="e.g., 5"
                  value={formData.mentor?.yearsExperience || ''}
                  onChange={(e) => updateFormData('yearsExperience', e.target.value)}
                  className="mt-2"
                />
              </div>

              <div>
                <Label htmlFor="expertiseAreas">Areas of Expertise</Label>
                <p className="text-sm text-gray mb-2">Select your areas of expertise</p>
                <div className="grid grid-cols-2 gap-2">
                  {['Software Engineering', 'Data Science', 'Product Management', 'UX Design', 'Cloud Computing', 'AI/ML', 'Cybersecurity', 'Other'].map(area => (
                    <label key={area} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        value={area}
                        checked={formData.mentor?.expertiseAreas?.includes(area) || false}
                        onChange={(e) => {
                          const areas = formData.mentor?.expertiseAreas || [];
                          if (e.target.checked) {
                            updateFormData('expertiseAreas', [...areas, area]);
                          } else {
                            updateFormData('expertiseAreas', areas.filter((a: string) => a !== area));
                          }
                        }}
                        className="rounded border-primary text-primary focus:ring-purple-dark"
                      />
                      <span className="text-sm">{area}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          );

        case 'availability':
          return (
            <div className="space-y-6">
              <div>
                <Label htmlFor="availabilityHours">Hours Available per Month</Label>
                <Input
                  id="availabilityHours"
                  type="number"
                  placeholder="e.g., 4"
                  value={formData.mentor?.availabilityHoursPerMonth || ''}
                  onChange={(e) => updateFormData('availabilityHoursPerMonth', e.target.value)}
                  className="mt-2"
                />
                <p className="text-sm text-gray mt-1">How many hours can you dedicate to mentoring each month?</p>
              </div>

              <div>
                <Label htmlFor="maxMentees">Maximum Number of Mentees</Label>
                <Input
                  id="maxMentees"
                  type="number"
                  placeholder="e.g., 3"
                  value={formData.mentor?.maxMentees || '3'}
                  onChange={(e) => updateFormData('maxMentees', e.target.value)}
                  className="mt-2"
                />
                <p className="text-sm text-gray mt-1">How many mentees can you effectively mentor at once?</p>
              </div>

              <div>
                <Label htmlFor="meetingPreference">Preferred Meeting Frequency</Label>
                <select
                  id="meetingPreference"
                  value={formData.mentor?.meetingFrequency || ''}
                  onChange={(e) => updateFormData('meetingFrequency', e.target.value)}
                  className="w-full mt-2 rounded-md border border-input bg-background px-3 py-2"
                >
                  <option value="">Select frequency</option>
                  <option value="weekly">Weekly</option>
                  <option value="biweekly">Bi-weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="flexible">Flexible</option>
                </select>
              </div>
            </div>
          );

        case 'profile':
          return (
            <div className="space-y-6">
              <div>
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  placeholder="Tell potential mentees about yourself, your experience, and what you can offer as a mentor..."
                  value={formData.mentor?.bio || ''}
                  onChange={(e) => updateFormData('bio', e.target.value)}
                  className="mt-2 min-h-[150px]"
                />
              </div>

              <div>
                <Label htmlFor="linkedinUrl">LinkedIn Profile (Optional)</Label>
                <Input
                  id="linkedinUrl"
                  type="url"
                  placeholder="https://linkedin.com/in/yourprofile"
                  value={formData.mentor?.linkedinUrl || ''}
                  onChange={(e) => updateFormData('linkedinUrl', e.target.value)}
                  className="mt-2"
                />
              </div>
            </div>
          );
      }
    } else if (currentRole === 'mentee') {
      switch (currentStepData.id) {
        case 'goals':
          return (
            <div className="space-y-6">
              <div>
                <Label htmlFor="careerStage">Current Career Stage</Label>
                <select
                  id="careerStage"
                  value={formData.mentee?.careerStage || ''}
                  onChange={(e) => updateFormData('careerStage', e.target.value)}
                  className="w-full mt-2 rounded-md border border-input bg-background px-3 py-2"
                >
                  <option value="">Select your career stage</option>
                  <option value="student">Student</option>
                  <option value="recent_graduate">Recent Graduate</option>
                  <option value="early_career">Early Career (0-3 years)</option>
                  <option value="mid_career">Mid Career (3-7 years)</option>
                  <option value="senior">Senior (7+ years)</option>
                  <option value="career_change">Career Change</option>
                </select>
              </div>

              <div>
                <Label htmlFor="learningGoals">Learning Goals</Label>
                <p className="text-sm text-gray mb-2">What do you hope to achieve through mentorship?</p>
                <div className="grid grid-cols-1 gap-2">
                  {['Career advancement', 'Skill development', 'Industry transition', 'Leadership skills', 'Technical expertise', 'Work-life balance', 'Networking', 'Interview preparation'].map(goal => (
                    <label key={goal} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        value={goal}
                        checked={formData.mentee?.learningGoals?.includes(goal) || false}
                        onChange={(e) => {
                          const goals = formData.mentee?.learningGoals || [];
                          if (e.target.checked) {
                            updateFormData('learningGoals', [...goals, goal]);
                          } else {
                            updateFormData('learningGoals', goals.filter((g: string) => g !== goal));
                          }
                        }}
                        className="rounded border-primary text-primary focus:ring-purple-dark"
                      />
                      <span className="text-sm">{goal}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <Label htmlFor="currentChallenge">Current Challenge</Label>
                <Textarea
                  id="currentChallenge"
                  placeholder="Describe a current challenge or area where you need guidance..."
                  value={formData.mentee?.currentChallenge || ''}
                  onChange={(e) => updateFormData('currentChallenge', e.target.value)}
                  className="mt-2 min-h-[100px]"
                />
              </div>
            </div>
          );

        case 'preferences':
          return (
            <div className="space-y-6">
              <div>
                <Label htmlFor="preferredExpertise">Preferred Mentor Expertise</Label>
                <p className="text-sm text-gray mb-2">What expertise are you looking for in a mentor?</p>
                <div className="grid grid-cols-2 gap-2">
                  {['Software Engineering', 'Data Science', 'Product Management', 'UX Design', 'Cloud Computing', 'AI/ML', 'Cybersecurity', 'Other'].map(area => (
                    <label key={area} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        value={area}
                        checked={formData.mentee?.preferredExpertiseAreas?.includes(area) || false}
                        onChange={(e) => {
                          const areas = formData.mentee?.preferredExpertiseAreas || [];
                          if (e.target.checked) {
                            updateFormData('preferredExpertiseAreas', [...areas, area]);
                          } else {
                            updateFormData('preferredExpertiseAreas', areas.filter((a: string) => a !== area));
                          }
                        }}
                        className="rounded border-primary text-primary focus:ring-purple-dark"
                      />
                      <span className="text-sm">{area}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <Label htmlFor="meetingFrequency">Preferred Meeting Frequency</Label>
                <select
                  id="meetingFrequency"
                  value={formData.mentee?.preferredMeetingFrequency || ''}
                  onChange={(e) => updateFormData('preferredMeetingFrequency', e.target.value)}
                  className="w-full mt-2 rounded-md border border-input bg-background px-3 py-2"
                >
                  <option value="">Select frequency</option>
                  <option value="weekly">Weekly</option>
                  <option value="biweekly">Bi-weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="flexible">Flexible</option>
                </select>
              </div>
            </div>
          );

        case 'profile':
          return (
            <div className="space-y-6">
              <div>
                <Label htmlFor="bio">About You</Label>
                <Textarea
                  id="bio"
                  placeholder="Tell potential mentors about yourself, your background, and what you're looking to achieve..."
                  value={formData.mentee?.bio || ''}
                  onChange={(e) => updateFormData('bio', e.target.value)}
                  className="mt-2 min-h-[150px]"
                />
              </div>
            </div>
          );
      }
    }

    return null;
  };

  if (!currentStepData) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-navy-dark mb-4">Invalid onboarding flow</h2>
          <Button onClick={() => router.push('/dashboard/welcome')}>
            Back to Welcome
          </Button>
        </div>
      </div>
    );
  }

  const Icon = currentStepData.icon;

  return (
    <div className="container mx-auto py-8 px-4 sm:px-6 lg:px-8 max-w-3xl">
      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray">
            Step {currentStep + 1} of {allSteps.length}
          </span>
          <Badge variant="secondary" className="bg-purple-light text-primary">
            {currentRole === 'mentor' ? 'Mentor Setup' : 'Mentee Setup'}
          </Badge>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Step Card */}
      <Card className="border-border">
        <CardHeader>
          <div className="flex items-center gap-4 mb-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-purple-light">
              <Icon className="h-6 w-6 text-primary" />
            </div>
            <div>
              <CardTitle className="text-2xl text-navy-dark">
                {currentStepData.title}
              </CardTitle>
              <CardDescription className="text-gray">
                {currentStepData.description}
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {renderStepContent()}

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-8">
            <Button
              variant="outline"
              onClick={handleBack}
              disabled={currentStep === 0}
              className="border-primary text-primary"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>

            <Button
              onClick={handleNext}
              disabled={isLoading}
              variant="default"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : currentStep === allSteps.length - 1 ? (
                <>
                  Complete Setup
                  <CheckCircle2 className="ml-2 h-4 w-4" />
                </>
              ) : (
                <>
                  Next
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Skip Option */}
      {currentStep === 0 && (
        <div className="text-center mt-6">
          <Button
            variant="ghost"
            onClick={() => router.push('/dashboard')}
            className="text-gray hover:text-primary"
          >
            Skip for now and complete later
          </Button>
        </div>
      )}
    </div>
  );
}

export default function OnboardingPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    }>
      <OnboardingContent />
    </Suspense>
  );
}