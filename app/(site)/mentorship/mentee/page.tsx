"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
  ChevronRight,
  ChevronLeft,
  User,
  Briefcase,
  Target,
  FileText,
  MapPin,
  Lightbulb,
  Sparkles,
  ExternalLink,
  Plus,
  X,
} from "lucide-react";
import Link from "next/link";
import { MentorshipHeroSection } from "@/components/mentorship/mentorship-hero-section";
import { BenefitsSection } from "@/components/mentorship/benefits-section";
import { Trophy, Rocket, Users } from "lucide-react";
// Import mentee components
import { MenteeResponsibilitiesSection } from "@/components/mentorship/mentee/mentee-responsibilities-section";
import { BecomeMenteeCTASection } from "@/components/mentorship/mentee/become-mentee-cta-section";


// New Zealand cities for location matching
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

const currentStageOptions = [
  { value: "undergraduate", label: "Undergraduate/Graduate" },
  { value: "postgraduate", label: "Post Graduate" },
  { value: "early_career", label: "Professional - Early Career (0-3 years)" },
  { value: "mid_career", label: "Professional - Mid Career (3-7 years)" },
  { value: "senior", label: "Professional - Senior (7+ years)" },
  { value: "career_transition", label: "Career Transition" },
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

const meetingFrequencyOptions = [
  { value: "weekly", label: "Weekly" },
  { value: "biweekly", label: "Bi-weekly" },
  { value: "monthly", label: "Monthly" },
  { value: "flexible", label: "Flexible" },
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
  photoUrl: "",
  fullName: "",
  email: "",
  phone: "",
  gender: "",
  age: "",
  city: "",
  preferredMeetingFormat: "",
  currentStage: "",
  currentJobTitle: "",
  currentIndustry: "",
  preferredIndustries: [],
  bio: "",
  softSkillsBasic: [],
  industrySkillsBasic: [],
  softSkillsExpert: [],
  industrySkillsExpert: [],
  longTermGoals: "",
  shortTermGoals: "",
  whyMentor: "",
  programExpectations: "",
  mbtiType: "",
  preferredMeetingFrequency: "",
};

const steps = [
  { id: 1, title: "Photo & Info", icon: User },
  { id: 2, title: "Background", icon: Briefcase },
  { id: 3, title: "Skills", icon: Target },
  { id: 4, title: "Goals", icon: Target },
  { id: 5, title: "Review", icon: FileText },
];

export default function MenteeApplicationPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>(
    {}
  );

  // Custom skill input states
  const [customSoftSkillBasic, setCustomSoftSkillBasic] = useState("");
  const [customIndustrySkillBasic, setCustomIndustrySkillBasic] = useState("");
  const [customSoftSkillExpert, setCustomSoftSkillExpert] = useState("");
  const [customIndustrySkillExpert, setCustomIndustrySkillExpert] =
    useState("");

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

  const addCustomSkill = (
    field: keyof FormData,
    skill: string,
    setCustomSkill: (value: string) => void
  ) => {
    const trimmedSkill = skill.trim();
    if (!trimmedSkill) return;

    const currentArray = formData[field] as string[];
    // Check if skill already exists (case-insensitive)
    const exists = currentArray.some(
      (s) => s.toLowerCase() === trimmedSkill.toLowerCase()
    );
    if (exists) {
      setCustomSkill("");
      return;
    }

    updateField(field, [
      ...currentArray,
      trimmedSkill,
    ] as FormData[typeof field]);
    setCustomSkill("");
  };

  const removeCustomSkill = (field: keyof FormData, skill: string) => {
    const currentArray = formData[field] as string[];
    updateField(
      field,
      currentArray.filter((s) => s !== skill) as FormData[typeof field]
    );
  };

  // Check if a skill is custom (not in predefined options)
  const isCustomSkill = (skill: string, predefinedOptions: string[]) => {
    return !predefinedOptions.includes(skill);
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
      if (!formData.currentStage)
        newErrors.currentStage = "Please select your career stage";
      if (!formData.currentJobTitle.trim())
        newErrors.currentJobTitle = "Current role is required";
      if (!formData.currentIndustry)
        newErrors.currentIndustry = "Please select your industry";
      if (!formData.bio.trim() || formData.bio.length < 50) {
        newErrors.bio = "Please provide a bio (at least 50 characters)";
      }
    }

    if (step === 3) {
      if (formData.softSkillsBasic.length === 0) {
        newErrors.softSkillsBasic =
          "Please select at least one basic soft skill";
      }
      if (formData.industrySkillsBasic.length === 0) {
        newErrors.industrySkillsBasic =
          "Please select at least one basic industry skill";
      }
    }

    if (step === 4) {
      if (
        !formData.longTermGoals.trim() ||
        formData.longTermGoals.length < 20
      ) {
        newErrors.longTermGoals =
          "Please describe your long-term goals (at least 20 characters)";
      }
      if (
        !formData.shortTermGoals.trim() ||
        formData.shortTermGoals.length < 20
      ) {
        newErrors.shortTermGoals =
          "Please describe your short-term goals (at least 20 characters)";
      }
      if (!formData.whyMentor.trim()) {
        newErrors.whyMentor = "Please explain why you want a mentor";
      }
      if (!formData.mbtiType) {
        newErrors.mbtiType = "Please select your personality type";
      }
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
    if (!validateStep(currentStep)) return;

    setLoading(true);
    try {
      const checkResponse = await fetch(
        `/api/forms/mentee/public?email=${encodeURIComponent(formData.email)}`
      );
      const checkData = await checkResponse.json();

      if (checkData.exists && !checkData.paymentCompleted) {
        router.push(`/mentorship/mentee/payment?id=${checkData.submissionId}`);
        return;
      }

      const response = await fetch("/api/forms/mentee/public", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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

      router.push(`/mentorship/mentee/payment?id=${data.submissionId}`);
    } catch (error) {
      setErrors({ email: "Failed to submit application. Please try again." });
      setLoading(false);
    }
  };

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
                type="mentee"
                email={formData.email}
                label="Your Photo"
                description="A clear, professional headshot helps your mentor recognise you at events. This will be visible only to your assigned mentor."
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
                    <HintIcon hint="Please use your legal name as it appears on official documents." />
                  </div>
                  <Input
                    id="fullName"
                    placeholder="Jane Smith"
                    value={formData.fullName}
                    onChange={(e) => updateField("fullName", e.target.value)}
                    className={errors.fullName ? "border-red-500" : ""}
                  />
                  {errors.fullName && (
                    <p className="text-sm text-red-500">{errors.fullName}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-1.5">
                    <Label htmlFor="email">Email Address *</Label>
                    <HintIcon hint="We'll send your mentor matching results and programme updates here." />
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
                    <p className="text-sm text-red-500">{errors.email}</p>
                  )}
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4 md:gap-6">
                <div className="space-y-2">
                  <div className="flex items-center gap-1.5">
                    <Label htmlFor="phone">Phone Number *</Label>
                    <HintIcon hint="Your mentor may contact you via text. Include country code if needed." />
                  </div>
                  <Input
                    id="phone"
                    placeholder="+64 21 123 4567"
                    value={formData.phone}
                    onChange={(e) => updateField("phone", e.target.value)}
                    className={errors.phone ? "border-red-500" : ""}
                  />
                  {errors.phone && (
                    <p className="text-sm text-red-500">{errors.phone}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-1.5">
                    <Label htmlFor="age">Age (Optional)</Label>
                    <HintIcon hint="Helps us understand our community demographics." />
                  </div>
                  <Input
                    id="age"
                    type="number"
                    min="16"
                    max="100"
                    placeholder="Enter your age"
                    value={formData.age}
                    onChange={(e) => updateField("age", e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="h-px bg-border" />

            {/* Gender Section */}
            <div className="space-y-2">
              <div className="flex items-center gap-1.5">
                <Label>Gender *</Label>
                <HintIcon hint="We collect this to support our mission of advancing women in STEM." />
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
                <p className="text-sm text-red-500">{errors.gender}</p>
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
                  <p className="text-sm font-medium text-brand">
                    Location Matching
                  </p>
                  <p className="text-sm text-[#1f1e44] leading-relaxed">
                    Auckland is She Sharp&apos;s primary activity city.
                    Selecting Auckland increases opportunities for in-person
                    events and meetings.
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
                    <HintIcon hint="Selecting your city helps us match you with local mentors." />
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
                    <p className="text-sm text-red-500">{errors.city}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-1.5">
                    <Label>Preferred Meeting Format *</Label>
                    <HintIcon hint="Choose how you'd prefer to meet. Hybrid gives you the most flexibility." />
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
                    <p className="text-sm text-red-500">
                      {errors.preferredMeetingFormat}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="h-px bg-border" />

            {/* Professional Context Group */}
            <div className="space-y-5">
              <div className="space-y-2">
                <div className="flex items-center gap-1.5">
                  <Label>Current Education/Career Stage *</Label>
                  <HintIcon hint="This helps us match you with mentors who understand your challenges." />
                </div>
                <Select
                  value={formData.currentStage}
                  onValueChange={(v) => updateField("currentStage", v)}
                >
                  <SelectTrigger
                    className={errors.currentStage ? "border-red-500" : ""}
                  >
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
                {errors.currentStage && (
                  <p className="text-sm text-red-500">{errors.currentStage}</p>
                )}
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-1.5">
                  <Label htmlFor="jobTitle">Current Role *</Label>
                  <HintIcon hint="Your job title or student status (e.g., 'Data Analyst' or '3rd Year CS Student')" />
                </div>
                <Input
                  id="jobTitle"
                  placeholder="e.g., Software Developer, Marketing Intern, Final Year Student"
                  value={formData.currentJobTitle}
                  onChange={(e) =>
                    updateField("currentJobTitle", e.target.value)
                  }
                  className={errors.currentJobTitle ? "border-red-500" : ""}
                />
                {errors.currentJobTitle && (
                  <p className="text-sm text-red-500">
                    {errors.currentJobTitle}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-1.5">
                  <Label>Industry Sector *</Label>
                  <HintIcon hint="Select your current industry. Students: choose your field of study." />
                </div>
                <Select
                  value={formData.currentIndustry}
                  onValueChange={(v) => updateField("currentIndustry", v)}
                >
                  <SelectTrigger
                    className={errors.currentIndustry ? "border-red-500" : ""}
                  >
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
                {errors.currentIndustry && (
                  <p className="text-sm text-red-500">
                    {errors.currentIndustry}
                  </p>
                )}
              </div>
            </div>

            <div className="h-px bg-border" />

            {/* Preferred Industries Group */}
            <div className="bg-[#eaf2ff] rounded-lg p-5 space-y-3">
              <div className="flex items-center gap-1.5">
                <Label>Industries for Mentorship (Optional)</Label>
                <HintIcon hint="Industries you'd like to transition into or learn more about." />
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 sm:gap-3 max-h-48 overflow-y-auto p-3 bg-background border rounded-lg">
                {industryOptions.map((opt) => (
                  <div key={opt.value} className="flex items-center space-x-2">
                    <Checkbox
                      id={`pref-${opt.value}`}
                      checked={formData.preferredIndustries.includes(opt.value)}
                      onCheckedChange={() =>
                        toggleArrayItem("preferredIndustries", opt.value)
                      }
                    />
                    <label
                      htmlFor={`pref-${opt.value}`}
                      className="text-sm cursor-pointer"
                    >
                      {opt.label}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            <div className="h-px bg-border" />

            {/* Bio Section */}
            <div className="space-y-2">
              <div className="flex items-center gap-1.5">
                <Label htmlFor="bio">Brief Bio About Yourself *</Label>
                <HintIcon hint="Share your education, achievements, current role, and what drives you in STEM. (100+ words recommended)" />
              </div>
              <Textarea
                id="bio"
                placeholder="Tell us about yourself, your background, achievements, and what makes you unique..."
                value={formData.bio}
                onChange={(e) => updateField("bio", e.target.value)}
                rows={5}
                className={errors.bio ? "border-red-500" : ""}
              />
              <div className="flex justify-between text-xs text-muted-foreground">
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
          </div>
        );

      case 3:
        return (
          <div className="space-y-6 md:space-y-8">
            {/* Skills Matching Info Box */}
            <div className="bg-[#f7e5f3] border border-brand/30 rounded-lg p-5">
              <div className="flex items-start gap-3">
                <Lightbulb className="h-5 w-5 text-brand mt-0.5 shrink-0" />
                <div className="space-y-1">
                  <p className="text-sm font-medium text-brand">
                    Skills Matching
                  </p>
                  <p className="text-sm text-[#1f1e44] leading-relaxed">
                    Your basic skills will be matched with mentors who have
                    expertise in those areas. Be honest about your current level
                    for the best match.
                  </p>
                </div>
              </div>
            </div>

            {/* Basic Skills Section */}
            <div className="bg-[#eaf2ff] rounded-lg p-5 space-y-6">
              <h3 className="font-medium text-foreground">
                Skills You Want to Learn
              </h3>

              <div className="space-y-3">
                <div className="flex items-center gap-1.5">
                  <Label>Soft Skills You&apos;re Developing *</Label>
                  <HintIcon hint="Choose skills you'd like to develop. Select 3-5 for best matching, or add your own." />
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
                      className={`justify-start text-xs h-9 min-h-[44px] ${formData.softSkillsBasic.includes(skill) ? "bg-[#8982ff] border-[#8982ff] hover:bg-[#7a74e6]" : ""}`}
                      onClick={() => toggleArrayItem("softSkillsBasic", skill)}
                    >
                      {skill}
                    </Button>
                  ))}
                </div>
                {/* Custom soft skills display */}
                {formData.softSkillsBasic.filter((s) =>
                  isCustomSkill(s, softSkillsOptions)
                ).length > 0 && (
                    <div className="flex flex-wrap gap-2.5 sm:gap-3 pt-2">
                      {formData.softSkillsBasic
                        .filter((s) => isCustomSkill(s, softSkillsOptions))
                        .map((skill) => (
                          <span
                            key={skill}
                            className="inline-flex items-center gap-2 rounded-full font-medium border-2 text-xs h-9 min-h-[44px] px-3 bg-[#8982ff] border-[#8982ff] text-white"
                          >
                            {skill}
                            <button
                              type="button"
                              onClick={() =>
                                removeCustomSkill("softSkillsBasic", skill)
                              }
                              className="hover:bg-white/20 rounded-full p-0.5 -mr-1 transition-colors"
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </span>
                        ))}
                    </div>
                  )}
                {/* Custom skill input */}
                <div className="flex gap-2 pt-1">
                  <Input
                    placeholder="Add your own skill..."
                    value={customSoftSkillBasic}
                    onChange={(e) => setCustomSoftSkillBasic(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addCustomSkill(
                          "softSkillsBasic",
                          customSoftSkillBasic,
                          setCustomSoftSkillBasic
                        );
                      }
                    }}
                    className="flex-1 h-9 text-sm"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-9 px-3"
                    onClick={() =>
                      addCustomSkill(
                        "softSkillsBasic",
                        customSoftSkillBasic,
                        setCustomSoftSkillBasic
                      )
                    }
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                {errors.softSkillsBasic && (
                  <p className="text-sm text-red-500">
                    {errors.softSkillsBasic}
                  </p>
                )}
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-1.5">
                  <Label>Industry Skills You&apos;re Developing *</Label>
                  <HintIcon hint="Technical skills you're learning or want to explore, or add your own." />
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
                      className={`justify-start text-xs h-9 min-h-[44px] ${formData.industrySkillsBasic.includes(skill) ? "bg-[#8982ff] border-[#8982ff] hover:bg-[#7a74e6]" : ""}`}
                      onClick={() =>
                        toggleArrayItem("industrySkillsBasic", skill)
                      }
                    >
                      {skill}
                    </Button>
                  ))}
                </div>
                {/* Custom industry skills display */}
                {formData.industrySkillsBasic.filter((s) =>
                  isCustomSkill(s, industrySkillsOptions)
                ).length > 0 && (
                    <div className="flex flex-wrap gap-2.5 sm:gap-3 pt-2">
                      {formData.industrySkillsBasic
                        .filter((s) => isCustomSkill(s, industrySkillsOptions))
                        .map((skill) => (
                          <span
                            key={skill}
                            className="inline-flex items-center gap-2 rounded-full font-medium border-2 text-xs h-9 min-h-[44px] px-3 bg-[#8982ff] border-[#8982ff] text-white"
                          >
                            {skill}
                            <button
                              type="button"
                              onClick={() =>
                                removeCustomSkill("industrySkillsBasic", skill)
                              }
                              className="hover:bg-white/20 rounded-full p-0.5 -mr-1 transition-colors"
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </span>
                        ))}
                    </div>
                  )}
                {/* Custom skill input */}
                <div className="flex gap-2 pt-1">
                  <Input
                    placeholder="Add your own skill..."
                    value={customIndustrySkillBasic}
                    onChange={(e) =>
                      setCustomIndustrySkillBasic(e.target.value)
                    }
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addCustomSkill(
                          "industrySkillsBasic",
                          customIndustrySkillBasic,
                          setCustomIndustrySkillBasic
                        );
                      }
                    }}
                    className="flex-1 h-9 text-sm"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-9 px-3"
                    onClick={() =>
                      addCustomSkill(
                        "industrySkillsBasic",
                        customIndustrySkillBasic,
                        setCustomIndustrySkillBasic
                      )
                    }
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                {errors.industrySkillsBasic && (
                  <p className="text-sm text-red-500">
                    {errors.industrySkillsBasic}
                  </p>
                )}
              </div>
            </div>

            <div className="h-px bg-border" />

            {/* Expert Skills Section */}
            <div className="bg-[#eaf2ff] rounded-lg p-5 space-y-6">
              <h3 className="font-medium text-foreground">
                Skills You Already Have (Optional)
              </h3>

              <div className="space-y-3">
                <div className="flex items-center gap-1.5">
                  <Label>Expert Soft Skills</Label>
                  <HintIcon hint="Skills you're confident in - you might help others in the community with these!" />
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
                      className={`justify-start text-xs h-9 min-h-[44px] ${formData.softSkillsExpert.includes(skill) ? "bg-[#8982ff] border-[#8982ff] hover:bg-[#7a74e6]" : ""}`}
                      onClick={() => toggleArrayItem("softSkillsExpert", skill)}
                    >
                      {skill}
                    </Button>
                  ))}
                </div>
                {/* Custom expert soft skills display */}
                {formData.softSkillsExpert.filter((s) =>
                  isCustomSkill(s, softSkillsOptions)
                ).length > 0 && (
                    <div className="flex flex-wrap gap-2.5 sm:gap-3 pt-2">
                      {formData.softSkillsExpert
                        .filter((s) => isCustomSkill(s, softSkillsOptions))
                        .map((skill) => (
                          <span
                            key={skill}
                            className="inline-flex items-center gap-2 rounded-full font-medium border-2 text-xs h-9 min-h-[44px] px-3 bg-[#8982ff] border-[#8982ff] text-white"
                          >
                            {skill}
                            <button
                              type="button"
                              onClick={() =>
                                removeCustomSkill("softSkillsExpert", skill)
                              }
                              className="hover:bg-white/20 rounded-full p-0.5 -mr-1 transition-colors"
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </span>
                        ))}
                    </div>
                  )}
                {/* Custom skill input */}
                <div className="flex gap-2 pt-1">
                  <Input
                    placeholder="Add your own skill..."
                    value={customSoftSkillExpert}
                    onChange={(e) => setCustomSoftSkillExpert(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addCustomSkill(
                          "softSkillsExpert",
                          customSoftSkillExpert,
                          setCustomSoftSkillExpert
                        );
                      }
                    }}
                    className="flex-1 h-9 text-sm"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-9 px-3"
                    onClick={() =>
                      addCustomSkill(
                        "softSkillsExpert",
                        customSoftSkillExpert,
                        setCustomSoftSkillExpert
                      )
                    }
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-1.5">
                  <Label>Expert Industry Skills</Label>
                  <HintIcon hint="Share your technical strengths, or add your own." />
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
                      className={`justify-start text-xs h-9 min-h-[44px] ${formData.industrySkillsExpert.includes(skill) ? "bg-[#8982ff] border-[#8982ff] hover:bg-[#7a74e6]" : ""}`}
                      onClick={() =>
                        toggleArrayItem("industrySkillsExpert", skill)
                      }
                    >
                      {skill}
                    </Button>
                  ))}
                </div>
                {/* Custom expert industry skills display */}
                {formData.industrySkillsExpert.filter((s) =>
                  isCustomSkill(s, industrySkillsOptions)
                ).length > 0 && (
                    <div className="flex flex-wrap gap-2.5 sm:gap-3 pt-2">
                      {formData.industrySkillsExpert
                        .filter((s) => isCustomSkill(s, industrySkillsOptions))
                        .map((skill) => (
                          <span
                            key={skill}
                            className="inline-flex items-center gap-2 rounded-full font-medium border-2 text-xs h-9 min-h-[44px] px-3 bg-[#8982ff] border-[#8982ff] text-white"
                          >
                            {skill}
                            <button
                              type="button"
                              onClick={() =>
                                removeCustomSkill("industrySkillsExpert", skill)
                              }
                              className="hover:bg-white/20 rounded-full p-0.5 -mr-1 transition-colors"
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </span>
                        ))}
                    </div>
                  )}
                {/* Custom skill input */}
                <div className="flex gap-2 pt-1">
                  <Input
                    placeholder="Add your own skill..."
                    value={customIndustrySkillExpert}
                    onChange={(e) =>
                      setCustomIndustrySkillExpert(e.target.value)
                    }
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addCustomSkill(
                          "industrySkillsExpert",
                          customIndustrySkillExpert,
                          setCustomIndustrySkillExpert
                        );
                      }
                    }}
                    className="flex-1 h-9 text-sm"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-9 px-3"
                    onClick={() =>
                      addCustomSkill(
                        "industrySkillsExpert",
                        customIndustrySkillExpert,
                        setCustomIndustrySkillExpert
                      )
                    }
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6 md:space-y-8">
            {/* Career Goals Section */}
            <div className="space-y-5">
              <div className="space-y-2">
                <div className="flex items-center gap-1.5">
                  <Label htmlFor="longTermGoals">
                    What is your long-term career goal? *
                  </Label>
                  <HintIcon hint="Where do you see yourself in 5-10 years? Example: 'Lead a product team at a tech company'" />
                </div>
                <Textarea
                  id="longTermGoals"
                  placeholder="Describe your long-term career aspirations..."
                  value={formData.longTermGoals}
                  onChange={(e) => updateField("longTermGoals", e.target.value)}
                  rows={3}
                  className={errors.longTermGoals ? "border-red-500" : ""}
                />
                {errors.longTermGoals && (
                  <p className="text-sm text-red-500">{errors.longTermGoals}</p>
                )}
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-1.5">
                  <Label htmlFor="shortTermGoals">
                    What is your short-term goal? *
                  </Label>
                  <HintIcon hint="What do you want to achieve in 6-12 months? Example: 'Get my first developer role'" />
                </div>
                <Textarea
                  id="shortTermGoals"
                  placeholder="What do you want to achieve in the next 6-12 months?"
                  value={formData.shortTermGoals}
                  onChange={(e) =>
                    updateField("shortTermGoals", e.target.value)
                  }
                  rows={3}
                  className={errors.shortTermGoals ? "border-red-500" : ""}
                />
                {errors.shortTermGoals && (
                  <p className="text-sm text-red-500">
                    {errors.shortTermGoals}
                  </p>
                )}
              </div>
            </div>

            <div className="h-px bg-border" />

            {/* Mentorship Motivation Section */}
            <div className="space-y-5">
              <div className="space-y-2">
                <div className="flex items-center gap-1.5">
                  <Label htmlFor="whyMentor">
                    Why do you want to have a mentor? *
                  </Label>
                  <HintIcon hint="What specific guidance are you hoping to receive?" />
                </div>
                <Textarea
                  id="whyMentor"
                  placeholder="What specific guidance are you seeking from a mentor?"
                  value={formData.whyMentor}
                  onChange={(e) => updateField("whyMentor", e.target.value)}
                  rows={3}
                  className={errors.whyMentor ? "border-red-500" : ""}
                />
                {errors.whyMentor && (
                  <p className="text-sm text-red-500">{errors.whyMentor}</p>
                )}
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-1.5">
                  <Label htmlFor="expectations">
                    What would you hope to get from this programme? (Optional)
                  </Label>
                  <HintIcon hint="Share any specific outcomes you're hoping for from this programme." />
                </div>
                <Textarea
                  id="expectations"
                  placeholder="Your expectations from the mentorship programme..."
                  value={formData.programExpectations}
                  onChange={(e) =>
                    updateField("programExpectations", e.target.value)
                  }
                  rows={2}
                />
              </div>
            </div>

            <div className="h-px bg-border" />

            {/* MBTI Test Info Box */}
            <div className="bg-[#f7e5f3] border border-brand/30 rounded-lg p-5">
              <div className="flex items-start gap-3">
                <Sparkles className="h-5 w-5 text-brand mt-0.5 shrink-0" />
                <div className="space-y-2">
                  <p className="text-sm font-medium text-brand">
                    Don&apos;t Know Your MBTI Type?
                  </p>
                  <p className="text-sm text-[#1f1e44] leading-relaxed">
                    Your personality type helps us match you with a compatible
                    mentor. If you don&apos;t know your MBTI type, take the free
                    test (about 10 minutes) to discover it.
                  </p>
                  <a
                    href="https://www.16personalities.com/free-personality-test"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-sm font-medium text-brand hover:text-[#7a2468] transition-colors"
                  >
                    Take the Free MBTI Test
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                </div>
              </div>
            </div>

            {/* Personality & Preferences Section */}
            <div className="bg-[#eaf2ff] rounded-lg p-5 space-y-5">
              <div className="space-y-3">
                <div className="flex items-center gap-1.5">
                  <Label>Your Personality Type (MBTI) *</Label>
                  <HintIcon hint="Select your 4-letter personality type from the options below" />
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
                  <p className="text-sm text-red-500">{errors.mbtiType}</p>
                )}
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-1.5">
                  <Label>Preferred Meeting Frequency</Label>
                  <HintIcon hint="How often would you like to meet? Most successful pairs meet bi-weekly." />
                </div>
                <Select
                  value={formData.preferredMeetingFrequency}
                  onValueChange={(v) =>
                    updateField("preferredMeetingFrequency", v)
                  }
                >
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
          </div>
        );

      case 5:
        return (
          <div className="space-y-5">
            {/* Photo & Personal Info */}
            <div className="bg-[#eaf2ff]/50 rounded-lg p-5 space-y-4">
              <h3 className="font-semibold text-foreground flex items-center gap-2 pb-2 border-b border-border">
                <User className="h-4 w-4" /> Personal Information
              </h3>
              <div className="flex gap-4">
                {formData.photoUrl && (
                  <img
                    src={formData.photoUrl}
                    alt="Profile"
                    className="w-16 h-16 rounded-lg object-cover"
                  />
                )}
                <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm flex-1">
                  <div className="text-muted-foreground">Name:</div>
                  <div className="font-medium">{formData.fullName}</div>
                  <div className="text-muted-foreground">Email:</div>
                  <div className="font-medium">{formData.email}</div>
                  <div className="text-muted-foreground">Phone:</div>
                  <div className="font-medium">{formData.phone}</div>
                  <div className="text-muted-foreground">Gender:</div>
                  <div className="font-medium">
                    {
                      genderOptions.find((o) => o.value === formData.gender)
                        ?.label
                    }
                  </div>
                </div>
              </div>
            </div>

            {/* Location & Background */}
            <div className="bg-[#eaf2ff]/50 rounded-lg p-5 space-y-4">
              <h3 className="font-semibold text-foreground flex items-center gap-2 pb-2 border-b border-border">
                <MapPin className="h-4 w-4" /> Location & Background
              </h3>
              <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                <div className="text-muted-foreground">City:</div>
                <div className="font-medium">
                  {nzCities.find((c) => c.value === formData.city)?.label}
                </div>
                <div className="text-muted-foreground">Meeting Format:</div>
                <div className="font-medium">
                  {
                    meetingFormatOptions.find(
                      (o) => o.value === formData.preferredMeetingFormat
                    )?.label
                  }
                </div>
                <div className="text-muted-foreground">Career Stage:</div>
                <div className="font-medium">
                  {
                    currentStageOptions.find(
                      (o) => o.value === formData.currentStage
                    )?.label
                  }
                </div>
                <div className="text-muted-foreground">Current Role:</div>
                <div className="font-medium">{formData.currentJobTitle}</div>
                <div className="text-muted-foreground">Industry:</div>
                <div className="font-medium">
                  {
                    industryOptions.find(
                      (o) => o.value === formData.currentIndustry
                    )?.label
                  }
                </div>
              </div>
            </div>

            {/* Skills */}
            <div className="bg-[#eaf2ff]/50 rounded-lg p-5 space-y-4">
              <h3 className="font-semibold text-foreground flex items-center gap-2 pb-2 border-b border-border">
                <Target className="h-4 w-4" /> Skills
              </h3>
              <div className="space-y-3">
                {formData.softSkillsBasic.length > 0 && (
                  <div>
                    <div className="text-muted-foreground text-sm mb-1.5">
                      Learning (Soft):
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {formData.softSkillsBasic.map((s) => (
                        <span
                          key={s}
                          className="bg-[#f7e5f3] text-brand px-2.5 py-1 rounded text-xs"
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {formData.industrySkillsBasic.length > 0 && (
                  <div>
                    <div className="text-muted-foreground text-sm mb-1.5">
                      Learning (Technical):
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {formData.industrySkillsBasic.map((s) => (
                        <span
                          key={s}
                          className="bg-[#f4f4fa] text-[#8982ff] px-2.5 py-1 rounded text-xs"
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Goals */}
            <div className="bg-[#eaf2ff]/50 rounded-lg p-5 space-y-4">
              <h3 className="font-semibold text-foreground pb-2 border-b border-border">
                Goals & Personality
              </h3>
              <div className="text-sm space-y-3">
                <div>
                  <span className="text-muted-foreground">Long-term Goal:</span>
                  <p className="mt-1">{formData.longTermGoals}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">
                    Short-term Goal:
                  </span>
                  <p className="mt-1">{formData.shortTermGoals}</p>
                </div>
                <div className="grid grid-cols-2 gap-2 pt-2">
                  <div>
                    <span className="text-muted-foreground">MBTI:</span>{" "}
                    <span className="font-medium">{formData.mbtiType}</span>
                  </div>
                  {formData.preferredMeetingFrequency && (
                    <div>
                      <span className="text-muted-foreground">Meeting:</span>{" "}
                      <span className="font-medium">
                        {
                          meetingFrequencyOptions.find(
                            (o) =>
                              o.value === formData.preferredMeetingFrequency
                          )?.label
                        }
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Payment Info */}
            <div className="bg-[#f7e5f3] border border-brand/30 rounded-lg p-5">
              <h3 className="font-semibold text-brand mb-2">
                Next Step: Payment
              </h3>
              <p className="text-sm text-[#1f1e44] leading-relaxed">
                After submitting, you&apos;ll be redirected to complete your
                membership payment of{" "}
                <span className="font-semibold">$100 NZD/year</span>. Upon
                successful payment, you&apos;ll receive an invitation code to
                complete your registration.
              </p>
            </div>
          </div>
        );
    }
  };

  return (
    <>
      <MentorshipHeroSection
        topLeftTitle={
          <>
            BECOME A
            <br />
            MENTEE
          </>
        }
        topLeftBgColor="bg-brand"
        topRightImage="/img/mentees.jpg"
        topRightImageAlt="She Sharp mentorship programme"
        bottomLeftVideo="/video/Mentee-Video.mp4"
        bottomRightTitle="Learn and be inspired by our empowering mentors in STEM"
        bottomRightDescription="Gain valuable advice, inspiration, and empowerment from our amazing mentors in STEM to support your personal and professional development journey."
      />
      <BenefitsSection
        title="Benefits of Becoming a Mentee"
        benefits={[
          {
            icon: Trophy,
            title: "Personalised direction and evaluation",
            description:
              "Get personalised guidance and feedback from your mentor, tailored to your specific needs and goals.",
          },
          {
            icon: Rocket,
            title: "Navigate your growth",
            description:
              "Identify your strengths and areas for improvement, guiding you towards becoming the best version of yourself.",
          },
          {
            icon: Users,
            title: "Opportunities for career growth",
            description:
              "Seize the opportunity to advance in your professional journey and confidently achieve your career goals.",
          },
        ]}
      />

      <MenteeResponsibilitiesSection />


      <BecomeMenteeCTASection />

      {/* Apply as Mentee Section */}
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
                Apply as Mentee
              </h2>
              <Card className="shadow-lg">
                <CardHeader className="pb-6">
                  <div className="mb-4">
                    <div className="flex justify-between mb-2">
                      {steps.map((step) => (
                        <div
                          key={step.id}
                          className={`flex items-center gap-1.5 text-xs ${currentStep >= step.id
                            ? "text-foreground"
                            : "text-gray-400"
                            }`}
                        >
                          <div
                            className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${currentStep > step.id
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

                  <CardTitle className="text-xl">
                    {steps[currentStep - 1].title}
                  </CardTitle>
                  <CardDescription>
                    {currentStep === 1 &&
                      "Upload your photo and provide basic information"}
                    {currentStep === 2 &&
                      "Tell us about your location and professional background"}
                    {currentStep === 3 &&
                      "Select skills you want to develop and already have"}
                    {currentStep === 4 &&
                      "Share your goals and personality type"}
                    {currentStep === 5 &&
                      "Review your application before proceeding to payment"}
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
                            Submit & Continue to Payment
                            <ChevronRight className="h-4 w-4 ml-1" />
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
                  Want to become a mentor?{" "}
                  <Link
                    href="/mentorship/mentor"
                    className="text-foreground hover:underline font-medium"
                  >
                    Apply as mentor
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </section>
      </WarpBackground>

    </>
  );
}
