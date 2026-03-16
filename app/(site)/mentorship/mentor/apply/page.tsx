"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { HintIcon } from "@/components/ui/hint-icon";
import { PhotoUpload } from "@/components/forms/photo-upload";
import { WarpBackground } from "@/components/ui/warp-background";
import {
  Check,
  Loader2,
  Sparkles,
  Award,
  Clock,
  ChevronRight,
  ChevronLeft,
  User,
  Briefcase,
  Target,
  FileText,
  MapPin,
  CheckCircle2,
} from "lucide-react";
import Link from "next/link";

// New Zealand cities
const nzCities = [
  { value: "auckland", label: "Auckland" },
  { value: "wellington", label: "Wellington" },
  { value: "christchurch", label: "Christchurch" },
  { value: "hamilton", label: "Hamilton" },
  { value: "tauranga", label: "Tauranga" },
  { value: "dunedin", label: "Dunedin" },
  { value: "palmerston_north", label: "Palmerston North" },
  { value: "napier_hastings", label: "Napier-Hastings" },
  { value: "nelson", label: "Nelson" },
  { value: "rotorua", label: "Rotorua" },
  { value: "other_nz", label: "Other (New Zealand)" },
  { value: "international", label: "International" },
];

const genderOptions = [
  { value: "female", label: "Female" },
  { value: "male", label: "Male" },
  { value: "non_binary", label: "Non-binary" },
  { value: "prefer_not_to_say", label: "Prefer not to say" },
  { value: "other", label: "Other" },
];

const meetingFormatOptions = [
  { value: "online", label: "Online (Virtual meetings only)" },
  { value: "in_person", label: "In-Person (Face-to-face meetings)" },
  { value: "hybrid", label: "Hybrid (Both online and in-person)" },
];

const industryOptions = [
  { value: "engineering", label: "Engineering" },
  { value: "it_cs", label: "Information Technology (IT) and Computer Science" },
  { value: "healthcare", label: "Healthcare and Medicine" },
  { value: "biotech", label: "Biotechnology and Life Sciences" },
  { value: "renewable_energy", label: "Renewable Energy" },
  { value: "agriculture", label: "Agriculture and Food Science" },
  { value: "environmental", label: "Environmental Science and Sustainability" },
  { value: "telecom", label: "Telecommunications" },
  { value: "robotics", label: "Robotics and Automation" },
  { value: "manufacturing", label: "Manufacturing and Materials Science" },
  { value: "aerospace", label: "Aerospace and Defense" },
  { value: "finance", label: "Finance and Banking" },
  { value: "consulting", label: "Consulting" },
  { value: "education", label: "Education" },
  { value: "other", label: "Other" },
];

const softSkillsOptions = [
  "Communication",
  "Leadership",
  "Problem Solving",
  "Time Management",
  "Critical Thinking",
  "Teamwork",
  "Adaptability",
  "Creativity",
  "Emotional Intelligence",
  "Conflict Resolution",
  "Negotiation",
  "Presentation",
  "Networking",
  "Active Listening",
  "Decision Making",
];

const industrySkillsOptions = [
  "Software Development",
  "Data Science",
  "Product Management",
  "UX/UI Design",
  "Cloud Computing",
  "DevOps",
  "Cybersecurity",
  "Machine Learning",
  "Mobile Development",
  "Web Development",
  "Database Management",
  "System Architecture",
  "Project Management",
  "Agile/Scrum",
  "Business Analysis",
  "Quality Assurance",
  "Customer Service",
  "Event Planning",
  "Research",
  "Technical Writing",
];

const mbtiTypes = [
  "INTJ",
  "INTP",
  "ENTJ",
  "ENTP",
  "INFJ",
  "INFP",
  "ENFJ",
  "ENFP",
  "ISTJ",
  "ISFJ",
  "ESTJ",
  "ESFJ",
  "ISTP",
  "ISFP",
  "ESTP",
  "ESFP",
];

const menteeTypeOptions = [
  { value: "undergraduate", label: "Undergraduate/Graduate" },
  { value: "postgraduate", label: "Post Graduate" },
  { value: "professional", label: "Professional" },
];

const bioMethodOptions = [
  { value: "self_written", label: "Create my own bio" },
  {
    value: "ai_generated",
    label: "Have it created for you. Our team will email it to you for preview",
  },
  { value: "already_sent", label: "I have already sent one" },
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
  photoUrl: "",
  fullName: "",
  email: "",
  phone: "",
  gender: "",
  city: "",
  preferredMeetingFormat: "",
  jobTitle: "",
  company: "",
  yearsExperience: "",
  linkedinUrl: "",
  bioMethod: "",
  bio: "",
  softSkillsBasic: [],
  softSkillsExpert: [],
  industrySkillsBasic: [],
  industrySkillsExpert: [],
  expectedMenteeGoalsLongTerm: "",
  expectedMenteeGoalsShortTerm: "",
  programExpectations: "",
  preferredMenteeTypes: [],
  preferredIndustries: [],
  mbtiType: "",
  maxMentees: "2",
  availabilityHoursPerMonth: "4",
  agreeToTerms: false,
  agreeToCommitment: false,
};

const steps = [
  { id: 1, title: "Photo & Info", icon: User },
  { id: 2, title: "Professional", icon: Briefcase },
  { id: 3, title: "Skills", icon: Target },
  { id: 4, title: "Goals", icon: Target },
  { id: 5, title: "Review", icon: FileText },
];

export default function MentorApplyPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>(
    {}
  );
  const [isSubmitted, setIsSubmitted] = useState(false);

  const updateField = <K extends keyof FormData>(
    field: K,
    value: FormData[K]
  ) => {
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
      if (!formData.photoUrl) newErrors.photoUrl = "Photo is required";
      if (!formData.fullName.trim())
        newErrors.fullName = "Full name is required";
      if (!formData.email.trim()) newErrors.email = "Email is required";
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        newErrors.email = "Please enter a valid email";
      }
      if (!formData.phone.trim()) newErrors.phone = "Phone number is required";
      if (!formData.gender) newErrors.gender = "Please select your gender";
    }

    if (step === 2) {
      if (!formData.city) newErrors.city = "Please select your city";
      if (!formData.preferredMeetingFormat)
        newErrors.preferredMeetingFormat = "Please select meeting format";
      if (!formData.jobTitle.trim())
        newErrors.jobTitle = "Job title is required";
      if (!formData.company.trim()) newErrors.company = "Company is required";
      if (!formData.yearsExperience)
        newErrors.yearsExperience = "Please select years of experience";
      if (!formData.bioMethod) newErrors.bioMethod = "Please select bio option";
      if (
        formData.bioMethod === "self_written" &&
        (!formData.bio.trim() || formData.bio.length < 50)
      ) {
        newErrors.bio = "Please provide a bio (at least 50 characters)";
      }
    }

    if (step === 3) {
      if (formData.softSkillsExpert.length < 2) {
        newErrors.softSkillsExpert =
          "Please select at least 2 expert soft skills";
      }
      if (formData.industrySkillsExpert.length < 2) {
        newErrors.industrySkillsExpert =
          "Please select at least 2 expert industry skills";
      }
    }

    if (step === 4) {
      if (
        !formData.expectedMenteeGoalsLongTerm.trim() ||
        formData.expectedMenteeGoalsLongTerm.length < 20
      ) {
        newErrors.expectedMenteeGoalsLongTerm =
          "Please describe long-term goals (at least 20 characters)";
      }
      if (
        !formData.expectedMenteeGoalsShortTerm.trim() ||
        formData.expectedMenteeGoalsShortTerm.length < 20
      ) {
        newErrors.expectedMenteeGoalsShortTerm =
          "Please describe short-term goals (at least 20 characters)";
      }
      if (formData.preferredMenteeTypes.length === 0) {
        newErrors.preferredMenteeTypes =
          "Please select at least one mentee type";
      }
      if (formData.preferredIndustries.length === 0) {
        newErrors.preferredIndustries = "Please select at least one industry";
      }
    }

    if (step === 5) {
      if (!formData.mbtiType)
        newErrors.mbtiType = "Please select your personality type";
      if (!formData.agreeToTerms)
        newErrors.agreeToTerms = "Please agree to the terms";
      if (!formData.agreeToCommitment)
        newErrors.agreeToCommitment = "Please agree to the commitment";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, 5));
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleBack = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSubmit = async () => {
    if (!validateStep(5)) return;

    setLoading(true);
    try {
      const response = await fetch("/api/forms/mentor/public", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          yearsExperience: parseInt(formData.yearsExperience),
          maxMentees: parseInt(formData.maxMentees),
          availabilityHoursPerMonth: parseInt(
            formData.availabilityHoursPerMonth
          ),
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
      setErrors({ email: "Failed to submit application. Please try again." });
      setLoading(false);
    }
  };

  if (isSubmitted) {
    return (
      <div
        className="min-h-screen pt-24 md:pt-32 pb-16 relative"
        style={{
          backgroundImage: "url(/img/bauhaus-1764928803893.svg)",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
      >
        <div className="absolute inset-0 glass-overlay"></div>
        <div className="container mx-auto px-4 max-w-lg relative z-10">
          <Card className="glass-card rounded-[50px]">
            <CardContent className="pt-8 text-center">
              <div className="w-20 h-20 bg-[#effefb] border-2 border-[#b1f6e9] rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 className="h-12 w-12 text-brand" />
              </div>
              <h1 className="text-3xl font-bold text-[#1f1e44] mb-3">
                Application Submitted!
              </h1>
              <p className="text-[#1f1e44]/70 mb-6">
                Thank you for applying to become a mentor with She Sharp. Our
                team will review your application and get back to you within 5-7
                business days.
              </p>
              <div className="bg-[#eaf2ff] border border-[#8982ff]/20 rounded-lg p-4 mb-6 text-left">
                <h3 className="font-semibold text-[#1f1e44] mb-2">
                  What happens next?
                </h3>
                <ol className="text-base text-[#1f1e44]/70 space-y-2">
                  <li className="flex items-start gap-2">
                    <span className="w-5 h-5 bg-[#8982ff] text-white rounded-full flex items-center justify-center text-base shrink-0 mt-0.5">
                      1
                    </span>
                    <span>Our team reviews your application</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-5 h-5 bg-[#8982ff] text-white rounded-full flex items-center justify-center text-base shrink-0 mt-0.5">
                      2
                    </span>
                    <span>
                      If approved, you&apos;ll receive an email with your
                      invitation code
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-5 h-5 bg-[#8982ff] text-white rounded-full flex items-center justify-center text-base shrink-0 mt-0.5">
                      3
                    </span>
                    <span>Use the code to create your mentor account</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-5 h-5 bg-[#8982ff] text-white rounded-full flex items-center justify-center text-base shrink-0 mt-0.5">
                      4
                    </span>
                    <span>Complete your profile and start mentoring!</span>
                  </li>
                </ol>
              </div>
              <Link href="/">
                <Button variant="brand" className="w-full">
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
          <div className="space-y-6 md:space-y-8">
            {/* Photo Upload Section */}
            <div className="bg-[#eaf2ff] rounded-lg p-5">
              <PhotoUpload
                value={formData.photoUrl}
                onChange={(url) => updateField("photoUrl", url || "")}
                type="mentor"
                email={formData.email}
                label="Your Photo"
                description="A professional photo builds trust with potential mentees. This will be displayed publicly on our Mentors page."
                required
                error={errors.photoUrl}
              />
            </div>

            <div className="h-px bg-border" />

            {/* Personal Details Section */}
            <div className="space-y-5">
              <div className="grid sm:grid-cols-2 gap-4 md:gap-6">
                <div className="space-y-2">
                  <div className="flex items-center gap-1.5">
                    <Label htmlFor="fullName">First and Last Name *</Label>
                    <HintIcon hint="Your name will be displayed on your public mentor profile." />
                  </div>
                  <Input
                    id="fullName"
                    placeholder="Jane Smith"
                    value={formData.fullName}
                    onChange={(e) => updateField("fullName", e.target.value)}
                    className={errors.fullName ? "border-red-500" : ""}
                  />
                  {errors.fullName && (
                    <p className="text-base text-red-500">{errors.fullName}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-1.5">
                    <Label htmlFor="email">Email Address *</Label>
                    <HintIcon hint="We'll send mentee match notifications and programme updates here." />
                  </div>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={formData.email}
                    onChange={(e) => updateField("email", e.target.value)}
                    className={errors.email ? "border-red-500" : ""}
                  />
                  {errors.email && (
                    <p className="text-base text-red-500">{errors.email}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-1.5">
                  <Label htmlFor="phone">Phone Number *</Label>
                  <HintIcon hint="Used for urgent programme communications only. Not shared with mentees." />
                </div>
                <Input
                  id="phone"
                  placeholder="+64 21 123 4567"
                  value={formData.phone}
                  onChange={(e) => updateField("phone", e.target.value)}
                  className={errors.phone ? "border-red-500" : ""}
                />
                {errors.phone && (
                  <p className="text-base text-red-500">{errors.phone}</p>
                )}
              </div>
            </div>

            <div className="h-px bg-border" />

            {/* Gender Section */}
            <div className="space-y-2">
              <div className="flex items-center gap-1.5">
                <Label>Gender *</Label>
                <HintIcon hint="We celebrate mentors of all genders who support women in STEM." />
              </div>
              <RadioGroup
                value={formData.gender}
                onValueChange={(v) => updateField("gender", v)}
                className="flex flex-wrap gap-4"
              >
                {genderOptions.map((opt) => (
                  <div key={opt.value} className="flex items-center space-x-2">
                    <RadioGroupItem
                      value={opt.value}
                      id={`gender-${opt.value}`}
                    />
                    <Label
                      htmlFor={`gender-${opt.value}`}
                      className="font-normal cursor-pointer"
                    >
                      {opt.label}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
              {errors.gender && (
                <p className="text-base text-red-500">{errors.gender}</p>
              )}
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6 md:space-y-8">
            {/* Location Info Box */}
            <div className="bg-[#f7e5f3] border border-brand/30 rounded-lg p-5">
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-brand mt-0.5 shrink-0" />
                <div className="space-y-1">
                  <p className="text-base font-medium text-brand">
                    Location Matching
                  </p>
                  <p className="text-base text-[#1f1e44] leading-relaxed">
                    Auckland is She Sharp&apos;s primary activity city. Your
                    location helps us match you with local mentees for in-person
                    meetings.
                  </p>
                </div>
              </div>
            </div>

            {/* Location Settings Group */}
            <div className="bg-[#eaf2ff] rounded-lg p-5 space-y-5">
              <div className="grid sm:grid-cols-2 gap-4 md:gap-6">
                <div className="space-y-2">
                  <div className="flex items-center gap-1.5">
                    <Label>Your City *</Label>
                    <HintIcon hint="Helps us match you with local mentees who prefer in-person meetings." />
                  </div>
                  <Select
                    value={formData.city}
                    onValueChange={(v) => updateField("city", v)}
                  >
                    <SelectTrigger
                      className={errors.city ? "border-red-500" : ""}
                    >
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
                  {errors.city && (
                    <p className="text-base text-red-500">{errors.city}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-1.5">
                    <Label>Preferred Meeting Format *</Label>
                    <HintIcon hint="Your preference will be matched with mentees who have similar preferences." />
                  </div>
                  <Select
                    value={formData.preferredMeetingFormat}
                    onValueChange={(v) =>
                      updateField("preferredMeetingFormat", v)
                    }
                  >
                    <SelectTrigger
                      className={
                        errors.preferredMeetingFormat ? "border-red-500" : ""
                      }
                    >
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
                  {errors.preferredMeetingFormat && (
                    <p className="text-base text-red-500">
                      {errors.preferredMeetingFormat}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="h-px bg-border" />

            {/* Professional Identity Group */}
            <div className="space-y-5">
              <div className="grid sm:grid-cols-2 gap-4 md:gap-6">
                <div className="space-y-2">
                  <div className="flex items-center gap-1.5">
                    <Label htmlFor="jobTitle">Current Job Title *</Label>
                    <HintIcon hint="Your current role. This is displayed on your mentor profile." />
                  </div>
                  <Input
                    id="jobTitle"
                    placeholder="Senior Software Engineer"
                    value={formData.jobTitle}
                    onChange={(e) => updateField("jobTitle", e.target.value)}
                    className={errors.jobTitle ? "border-red-500" : ""}
                  />
                  {errors.jobTitle && (
                    <p className="text-base text-red-500">{errors.jobTitle}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-1.5">
                    <Label htmlFor="company">Organisation *</Label>
                    <HintIcon hint="Your company or organisation. Displayed on your mentor profile." />
                  </div>
                  <Input
                    id="company"
                    placeholder="Tech Company Ltd"
                    value={formData.company}
                    onChange={(e) => updateField("company", e.target.value)}
                    className={errors.company ? "border-red-500" : ""}
                  />
                  {errors.company && (
                    <p className="text-base text-red-500">{errors.company}</p>
                  )}
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4 md:gap-6">
                <div className="space-y-2">
                  <div className="flex items-center gap-1.5">
                    <Label>Years of Experience *</Label>
                    <HintIcon hint="Total years in your field. We recommend at least 3 years." />
                  </div>
                  <Select
                    value={formData.yearsExperience}
                    onValueChange={(v) => updateField("yearsExperience", v)}
                  >
                    <SelectTrigger
                      className={errors.yearsExperience ? "border-red-500" : ""}
                    >
                      <SelectValue placeholder="Select experience" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="3">3-5 years</SelectItem>
                      <SelectItem value="5">5-10 years</SelectItem>
                      <SelectItem value="10">10-15 years</SelectItem>
                      <SelectItem value="15">15+ years</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.yearsExperience && (
                    <p className="text-base text-red-500">
                      {errors.yearsExperience}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-1.5">
                    <Label htmlFor="linkedinUrl">
                      LinkedIn Profile (Optional)
                    </Label>
                    <HintIcon hint="Mentees can view your full professional background." />
                  </div>
                  <Input
                    id="linkedinUrl"
                    placeholder="https://linkedin.com/in/yourprofile"
                    value={formData.linkedinUrl}
                    onChange={(e) => updateField("linkedinUrl", e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="h-px bg-border" />

            {/* Bio Section */}
            <div className="space-y-5">
              {/* Bio Info Box */}
              <div className="bg-[#f7e5f3] border border-brand/30 rounded-lg p-5">
                <div className="flex items-start gap-3">
                  <FileText className="h-5 w-5 text-brand mt-0.5 shrink-0" />
                  <div className="space-y-1">
                    <p className="text-base font-medium text-brand">
                      Your Mentor Bio
                    </p>
                    <p className="text-base text-[#1f1e44] leading-relaxed">
                      This bio will be publicly displayed on our mentors page.
                      Share your journey, expertise, and what motivates you to
                      mentor.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <Label>Provide a bio *</Label>
                <RadioGroup
                  value={formData.bioMethod}
                  onValueChange={(v) => updateField("bioMethod", v)}
                  className="space-y-2"
                >
                  {bioMethodOptions.map((opt) => (
                    <div
                      key={opt.value}
                      className="flex items-center space-x-2"
                    >
                      <RadioGroupItem
                        value={opt.value}
                        id={`bio-${opt.value}`}
                      />
                      <Label
                        htmlFor={`bio-${opt.value}`}
                        className="font-normal cursor-pointer text-base"
                      >
                        {opt.label}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
                {errors.bioMethod && (
                  <p className="text-base text-red-500">{errors.bioMethod}</p>
                )}
              </div>

              {formData.bioMethod === "self_written" && (
                <div className="space-y-2">
                  <div className="flex items-center gap-1.5">
                    <Label htmlFor="bio">Your Bio *</Label>
                    <HintIcon hint="Share your career journey and why you want to mentor. 150-300 words works best." />
                  </div>
                  <Textarea
                    id="bio"
                    placeholder="Tell mentees about your career journey and what drives you..."
                    value={formData.bio}
                    onChange={(e) => updateField("bio", e.target.value)}
                    rows={5}
                    className={errors.bio ? "border-red-500" : ""}
                  />
                  <div className="flex justify-between text-base text-muted-foreground">
                    <span>
                      {errors.bio && (
                        <span className="text-red-500">{errors.bio}</span>
                      )}
                    </span>
                    <span>
                      {formData.bio.split(/\s+/).filter(Boolean).length} words
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6 md:space-y-8">
            {/* Expert Skills Requirement Info Box */}
            <div className="bg-[#f7e5f3] border border-brand/30 rounded-lg p-5">
              <div className="flex items-start gap-3">
                <Award className="h-5 w-5 text-brand mt-0.5 shrink-0" />
                <div className="space-y-1">
                  <p className="text-base font-medium text-brand">
                    Expert Skills Requirement
                  </p>
                  <p className="text-base text-[#1f1e44] leading-relaxed">
                    We require at least 2 expert soft skills and 2 expert
                    industry skills to ensure you can provide valuable guidance
                    to your mentees.
                  </p>
                </div>
              </div>
            </div>

            {/* Basic Skills Section (Optional) */}
            <div className="bg-[#eaf2ff] rounded-lg p-5 space-y-6">
              <h3 className="font-medium text-foreground">
                Skills You Can Teach (Optional)
              </h3>

              <div className="space-y-3">
                <div className="flex items-center gap-1.5">
                  <Label>Basic Soft Skills</Label>
                  <HintIcon hint="Skills you can guide mentees in developing." />
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 sm:gap-3">
                  {softSkillsOptions.map((skill) => (
                    <Button
                      key={skill}
                      type="button"
                      variant={
                        formData.softSkillsBasic.includes(skill)
                          ? "default"
                          : "outline"
                      }
                      size="sm"
                      className={`justify-start text-base h-9 min-h-[44px] ${formData.softSkillsBasic.includes(skill) ? "bg-[#8982ff] border-[#8982ff] hover:bg-[#7a74e6]" : ""}`}
                      onClick={() => toggleArrayItem("softSkillsBasic", skill)}
                    >
                      {skill}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-1.5">
                  <Label>Basic Industry Skills</Label>
                  <HintIcon hint="Technical areas you can provide guidance on, even if not your primary expertise." />
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 sm:gap-3">
                  {industrySkillsOptions.map((skill) => (
                    <Button
                      key={skill}
                      type="button"
                      variant={
                        formData.industrySkillsBasic.includes(skill)
                          ? "default"
                          : "outline"
                      }
                      size="sm"
                      className={`justify-start text-base h-9 min-h-[44px] ${formData.industrySkillsBasic.includes(skill) ? "bg-[#8982ff] border-[#8982ff] hover:bg-[#7a74e6]" : ""}`}
                      onClick={() =>
                        toggleArrayItem("industrySkillsBasic", skill)
                      }
                    >
                      {skill}
                    </Button>
                  ))}
                </div>
              </div>
            </div>

            <div className="h-px bg-border" />

            {/* Expert Skills Section (Required) */}
            <div className="bg-[#eaf2ff] rounded-lg p-5 space-y-6">
              <h3 className="font-medium text-foreground">
                Your Expert Skills (Required)
              </h3>

              <div className="space-y-3">
                <div className="flex items-center gap-1.5">
                  <Label>Expert Soft Skills * (Select at least 2)</Label>
                  <HintIcon hint="Skills you've mastered. Mentees seeking these skills may be matched with you." />
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 sm:gap-3">
                  {softSkillsOptions.map((skill) => (
                    <Button
                      key={skill}
                      type="button"
                      variant={
                        formData.softSkillsExpert.includes(skill)
                          ? "default"
                          : "outline"
                      }
                      size="sm"
                      className={`justify-start text-base h-9 min-h-[44px] ${formData.softSkillsExpert.includes(skill) ? "bg-[#8982ff] border-[#8982ff] hover:bg-[#7a74e6]" : ""}`}
                      onClick={() => toggleArrayItem("softSkillsExpert", skill)}
                    >
                      {skill}
                    </Button>
                  ))}
                </div>
                {errors.softSkillsExpert && (
                  <p className="text-base text-red-500">
                    {errors.softSkillsExpert}
                  </p>
                )}
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-1.5">
                  <Label>Expert Industry Skills * (Select at least 2)</Label>
                  <HintIcon hint="Your core technical competencies. These are highlighted on your mentor profile." />
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 sm:gap-3">
                  {industrySkillsOptions.map((skill) => (
                    <Button
                      key={skill}
                      type="button"
                      variant={
                        formData.industrySkillsExpert.includes(skill)
                          ? "default"
                          : "outline"
                      }
                      size="sm"
                      className={`justify-start text-base h-9 min-h-[44px] ${formData.industrySkillsExpert.includes(skill) ? "bg-[#8982ff] border-[#8982ff] hover:bg-[#7a74e6]" : ""}`}
                      onClick={() =>
                        toggleArrayItem("industrySkillsExpert", skill)
                      }
                    >
                      {skill}
                    </Button>
                  ))}
                </div>
                {errors.industrySkillsExpert && (
                  <p className="text-base text-red-500">
                    {errors.industrySkillsExpert}
                  </p>
                )}
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6 md:space-y-8">
            {/* Mentee Goals Section */}
            <div className="space-y-5">
              <div className="space-y-2">
                <div className="flex items-center gap-1.5">
                  <Label htmlFor="longTermGoals">
                    What long-term goal would you prefer your mentee to have? *
                  </Label>
                  <HintIcon hint="What career aspirations would you best support? Example: 'Transition into leadership roles'" />
                </div>
                <Textarea
                  id="longTermGoals"
                  placeholder="Describe the long-term goals you'd like to help mentees achieve..."
                  value={formData.expectedMenteeGoalsLongTerm}
                  onChange={(e) =>
                    updateField("expectedMenteeGoalsLongTerm", e.target.value)
                  }
                  rows={3}
                  className={
                    errors.expectedMenteeGoalsLongTerm ? "border-red-500" : ""
                  }
                />
                {errors.expectedMenteeGoalsLongTerm && (
                  <p className="text-base text-red-500">
                    {errors.expectedMenteeGoalsLongTerm}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-1.5">
                  <Label htmlFor="shortTermGoals">
                    What short-term goal would you prefer your mentee to have? *
                  </Label>
                  <HintIcon hint="What immediate goals can you help mentees achieve? Example: 'Land their first tech job'" />
                </div>
                <Textarea
                  id="shortTermGoals"
                  placeholder="Describe the short-term goals you'd like to help mentees achieve..."
                  value={formData.expectedMenteeGoalsShortTerm}
                  onChange={(e) =>
                    updateField("expectedMenteeGoalsShortTerm", e.target.value)
                  }
                  rows={3}
                  className={
                    errors.expectedMenteeGoalsShortTerm ? "border-red-500" : ""
                  }
                />
                {errors.expectedMenteeGoalsShortTerm && (
                  <p className="text-base text-red-500">
                    {errors.expectedMenteeGoalsShortTerm}
                  </p>
                )}
              </div>
            </div>

            <div className="h-px bg-border" />

            {/* Your Expectations Section */}
            <div className="space-y-2">
              <div className="flex items-center gap-1.5">
                <Label htmlFor="expectations">
                  What would you hope to get from this programme? (Optional)
                </Label>
                <HintIcon hint="What do you hope to gain from being a mentor?" />
              </div>
              <Textarea
                id="expectations"
                placeholder="Personal growth, giving back to the community, expanding network..."
                value={formData.programExpectations}
                onChange={(e) =>
                  updateField("programExpectations", e.target.value)
                }
                rows={2}
              />
            </div>

            <div className="h-px bg-border" />

            {/* Preferences Section */}
            <div className="bg-[#eaf2ff] rounded-lg p-5 space-y-5">
              <div className="space-y-3">
                <div className="flex items-center gap-1.5">
                  <Label>What type(s) of mentee would you prefer? *</Label>
                  <HintIcon hint="Select career stages where you can provide the most value." />
                </div>
                <div className="flex flex-wrap gap-4">
                  {menteeTypeOptions.map((opt) => (
                    <div
                      key={opt.value}
                      className="flex items-center space-x-2"
                    >
                      <Checkbox
                        id={`mentee-${opt.value}`}
                        checked={formData.preferredMenteeTypes.includes(
                          opt.value
                        )}
                        onCheckedChange={() =>
                          toggleArrayItem("preferredMenteeTypes", opt.value)
                        }
                      />
                      <label
                        htmlFor={`mentee-${opt.value}`}
                        className="text-base cursor-pointer"
                      >
                        {opt.label}
                      </label>
                    </div>
                  ))}
                </div>
                {errors.preferredMenteeTypes && (
                  <p className="text-base text-red-500">
                    {errors.preferredMenteeTypes}
                  </p>
                )}
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-1.5">
                  <Label>What industries would you like to mentor in? *</Label>
                  <HintIcon hint="Select industries where your experience is most relevant for mentoring." />
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 sm:gap-3 max-h-48 overflow-y-auto p-3 bg-background border rounded-lg">
                  {industryOptions.map((opt) => (
                    <div
                      key={opt.value}
                      className="flex items-center space-x-2"
                    >
                      <Checkbox
                        id={`ind-${opt.value}`}
                        checked={formData.preferredIndustries.includes(
                          opt.value
                        )}
                        onCheckedChange={() =>
                          toggleArrayItem("preferredIndustries", opt.value)
                        }
                      />
                      <label
                        htmlFor={`ind-${opt.value}`}
                        className="text-base cursor-pointer"
                      >
                        {opt.label}
                      </label>
                    </div>
                  ))}
                </div>
                {errors.preferredIndustries && (
                  <p className="text-base text-red-500">
                    {errors.preferredIndustries}
                  </p>
                )}
              </div>
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-6 md:space-y-8">
            {/* Time Commitment Info Box */}
            <div className="bg-[#f7e5f3] border border-brand/30 rounded-lg p-5">
              <div className="flex items-start gap-3">
                <Clock className="h-5 w-5 text-brand mt-0.5 shrink-0" />
                <div className="space-y-1">
                  <p className="text-base font-medium text-brand">
                    Time Commitment
                  </p>
                  <p className="text-base text-[#1f1e44] leading-relaxed">
                    Mentoring typically requires 2-4 hours per month per mentee,
                    including meetings, messages, and occasional events.
                  </p>
                </div>
              </div>
            </div>

            {/* Personality & Availability Section */}
            <div className="bg-[#eaf2ff] rounded-lg p-5 space-y-5">
              <div className="space-y-3">
                <div className="flex items-center gap-1.5">
                  <Label>Your Personality Type (MBTI) *</Label>
                  <HintIcon hint="Helps us match you with compatible mentees. Test takes ~10 min at 16personalities.com" />
                </div>
                <div className="grid grid-cols-4 sm:grid-cols-8 gap-2.5">
                  {mbtiTypes.map((type) => (
                    <Button
                      key={type}
                      type="button"
                      variant={
                        formData.mbtiType === type ? "default" : "outline"
                      }
                      size="sm"
                      className={`h-9 min-h-[44px] ${formData.mbtiType === type ? "bg-[#8982ff] border-[#8982ff] hover:bg-[#7a74e6]" : ""}`}
                      onClick={() => updateField("mbtiType", type)}
                    >
                      {type}
                    </Button>
                  ))}
                </div>
                {errors.mbtiType && (
                  <p className="text-base text-red-500">{errors.mbtiType}</p>
                )}
              </div>

              <div className="grid sm:grid-cols-2 gap-4 md:gap-6">
                <div className="space-y-2">
                  <div className="flex items-center gap-1.5">
                    <Label>Maximum Mentees</Label>
                    <HintIcon hint="Consider your availability. Most start with 1-2 mentees." />
                  </div>
                  <Select
                    value={formData.maxMentees}
                    onValueChange={(v) => updateField("maxMentees", v)}
                  >
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
                  <div className="flex items-center gap-1.5">
                    <Label>Availability (hours/month)</Label>
                    <HintIcon hint="Hours you can dedicate monthly. Each mentee needs 2-4 hours/month." />
                  </div>
                  <Select
                    value={formData.availabilityHoursPerMonth}
                    onValueChange={(v) =>
                      updateField("availabilityHoursPerMonth", v)
                    }
                  >
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
            </div>

            <div className="h-px bg-border" />

            {/* Review Summary */}
            <div className="bg-[#eaf2ff]/50 rounded-lg p-5 space-y-4">
              <h3 className="font-semibold text-foreground pb-2 border-b border-border">
                Application Summary
              </h3>
              <div className="grid grid-cols-2 gap-2 text-base">
                <div className="text-muted-foreground">Name:</div>
                <div className="font-medium">{formData.fullName}</div>
                <div className="text-muted-foreground">Email:</div>
                <div className="font-medium">{formData.email}</div>
                <div className="text-muted-foreground">City:</div>
                <div className="font-medium">
                  {nzCities.find((c) => c.value === formData.city)?.label}
                </div>
                <div className="text-muted-foreground">Role:</div>
                <div className="font-medium">
                  {formData.jobTitle} at {formData.company}
                </div>
              </div>
              <div className="pt-2">
                <div className="text-muted-foreground text-base mb-1.5">
                  Expert Skills:
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    ...formData.softSkillsExpert,
                    ...formData.industrySkillsExpert,
                  ].map((s) => (
                    <span
                      key={s}
                      className="bg-[#f7e5f3] text-brand px-2.5 py-1 rounded text-base"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="h-px bg-border" />

            {/* Agreements */}
            <div className="space-y-4">
              <h3 className="font-semibold text-foreground">Commitments</h3>
              <div className="space-y-3">
                <div className="flex items-start space-x-3">
                  <Checkbox
                    id="agreeToTerms"
                    checked={formData.agreeToTerms}
                    onCheckedChange={(checked) =>
                      updateField("agreeToTerms", !!checked)
                    }
                  />
                  <Label
                    htmlFor="agreeToTerms"
                    className="text-base leading-relaxed cursor-pointer"
                  >
                    I agree to the{" "}
                    <Link
                      href="/terms-of-service"
                      className="text-foreground underline"
                    >
                      Terms of Service
                    </Link>{" "}
                    and{" "}
                    <Link
                      href="/privacy-policy"
                      className="text-foreground underline"
                    >
                      Privacy Policy
                    </Link>
                  </Label>
                </div>
                {errors.agreeToTerms && (
                  <p className="text-base text-red-500 ml-7">
                    {errors.agreeToTerms}
                  </p>
                )}

                <div className="flex items-start space-x-3">
                  <Checkbox
                    id="agreeToCommitment"
                    checked={formData.agreeToCommitment}
                    onCheckedChange={(checked) =>
                      updateField("agreeToCommitment", !!checked)
                    }
                  />
                  <Label
                    htmlFor="agreeToCommitment"
                    className="text-base leading-relaxed cursor-pointer"
                  >
                    I commit to being an active mentor, responding to mentees
                    within 48 hours, and participating in at least 2 mentoring
                    sessions per month
                  </Label>
                </div>
                {errors.agreeToCommitment && (
                  <p className="text-base text-red-500 ml-7">
                    {errors.agreeToCommitment}
                  </p>
                )}
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <WarpBackground
      className="min-h-screen bg-white"
      beamsPerSide={4}
      beamSize={6}
      beamDuration={5}
      perspective={120}
    >
      <section className="pt-12 md:pt-16 pb-12 md:pb-16">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-center mb-12 mt-8">
              Apply as Mentor
            </h2>
            <Card className="shadow-lg">
              <CardHeader className="pb-6">
                <div className="mb-4">
                  <div className="flex justify-between mb-2">
                    {steps.map((step) => (
                      <div
                        key={step.id}
                        className={`flex items-center gap-1.5 text-base ${currentStep >= step.id
                          ? "text-foreground"
                          : "text-gray-400"
                          }`}
                      >
                        <div
                          className={`w-6 h-6 rounded-full flex items-center justify-center text-base font-medium ${currentStep > step.id
                            ? "bg-brand text-white"
                            : currentStep === step.id
                              ? "bg-[#f7e5f3] text-brand border-2 border-brand"
                              : "bg-gray-100 text-gray-400"
                            }`}
                        >
                          {currentStep > step.id ? (
                            <Check className="h-3 w-3" />
                          ) : (
                            step.id
                          )}
                        </div>
                        <span className="hidden md:inline font-medium">
                          {step.title}
                        </span>
                      </div>
                    ))}
                  </div>
                  <Progress
                    value={(currentStep / 5) * 100}
                    className="h-1.5 [&>div]:bg-brand"
                  />
                </div>

                <CardTitle className="text-3xl">
                  {steps[currentStep - 1].title}
                </CardTitle>
                <CardDescription>
                  {currentStep === 1 &&
                    "Upload your photo and provide basic information"}
                  {currentStep === 2 &&
                    "Tell us about your location and professional background"}
                  {currentStep === 3 &&
                    "Select skills you can teach and have expertise in"}
                  {currentStep === 4 &&
                    "Share your mentoring goals and preferences"}
                  {currentStep === 5 &&
                    "Review your application and confirm commitment"}
                </CardDescription>
              </CardHeader>

              <CardContent className="pt-2 px-4 sm:px-6">
                {renderStepContent()}

                <div className="flex justify-between mt-10 pt-6 border-t">
                  {currentStep > 1 ? (
                    <Button
                      variant="outline"
                      onClick={handleBack}
                      disabled={loading}
                    >
                      <ChevronLeft className="h-4 w-4 mr-1" />
                      Back
                    </Button>
                  ) : (
                    <div />
                  )}

                  {currentStep < 5 ? (
                    <Button variant="brand" onClick={handleNext}>
                      Next
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  ) : (
                    <Button
                      variant="brand"
                      onClick={handleSubmit}
                      disabled={loading}
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

            <div className="text-center my-6 space-y-2">
              <p className="text-gray-600">
                Already have an invitation code?{" "}
                <Link
                  href="/sign-up"
                  className="text-foreground hover:underline font-medium"
                >
                  Sign up here
                </Link>
              </p>
              <p className="text-gray-600">
                Looking to become a mentee?{" "}
                <Link
                  href="/mentorship/mentee"
                  className="text-foreground hover:underline font-medium"
                >
                  Join as mentee
                </Link>
              </p>
            </div>
          </div>
        </div>
      </section>
    </WarpBackground>
  );
}
