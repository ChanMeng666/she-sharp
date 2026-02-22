'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Card } from '@/components/ui/card';
import { Container } from '@/components/layout/container';
import {
  ArrowLeft,
  ArrowRight,
  Loader2,
  CheckCircle2,
  PartyPopper,
  type LucideIcon,
} from 'lucide-react';

export interface FormStep {
  id: number;
  title: string;
  description: string;
  icon: LucideIcon;
  encouragement?: string;
}

export interface MultiStepFormProps {
  title: string;
  subtitle: string;
  steps: FormStep[];
  renderStep: (step: number) => React.ReactNode;
  validateStep: (step: number) => boolean;
  onSubmit: () => Promise<void>;
  isSubmitting: boolean;
  successTitle?: string;
  successMessage?: string;
  backLink: { href: string; label: string };
}

const BRAND_COLORS = ['#9b2e83', '#8982ff', '#b1f6e9', '#f7e5f3'];

function fireConfetti() {
  // First burst
  confetti({
    particleCount: 150,
    spread: 80,
    origin: { y: 0.6 },
    colors: BRAND_COLORS,
  });
  // Second burst after delay
  setTimeout(() => {
    confetti({
      particleCount: 80,
      spread: 100,
      origin: { y: 0.5, x: 0.3 },
      colors: BRAND_COLORS,
    });
  }, 200);
  setTimeout(() => {
    confetti({
      particleCount: 80,
      spread: 100,
      origin: { y: 0.5, x: 0.7 },
      colors: BRAND_COLORS,
    });
  }, 400);
}

export function MultiStepFormWrapper({
  title,
  subtitle,
  steps,
  renderStep,
  validateStep,
  onSubmit,
  isSubmitting,
  successTitle = 'Application Submitted!',
  successMessage = 'Thank you for your application. We will review it and get back to you soon.',
  backLink,
}: MultiStepFormProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [showEncouragement, setShowEncouragement] = useState(false);
  const [encouragementText, setEncouragementText] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const totalSteps = steps.length;
  const progressPercent = ((currentStep + 1) / totalSteps) * 100;
  const isLastStep = currentStep === totalSteps - 1;
  const CurrentIcon = steps[currentStep]?.icon;

  const goNext = useCallback(() => {
    if (!validateStep(currentStep)) return;

    const encouragement = steps[currentStep]?.encouragement;
    if (encouragement) {
      setEncouragementText(encouragement);
      setShowEncouragement(true);
      setTimeout(() => {
        setShowEncouragement(false);
        setDirection(1);
        setCurrentStep((prev) => prev + 1);
      }, 1200);
    } else {
      setDirection(1);
      setCurrentStep((prev) => prev + 1);
    }
  }, [currentStep, validateStep, steps]);

  const goBack = useCallback(() => {
    setDirection(-1);
    setCurrentStep((prev) => prev - 1);
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!validateStep(currentStep)) return;
    setServerError(null);

    try {
      await onSubmit();
      setSubmitted(true);
      fireConfetti();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      setServerError(
        err instanceof Error ? err.message : 'Something went wrong. Please try again.'
      );
    }
  }, [currentStep, validateStep, onSubmit]);

  if (submitted) {
    return (
      <section className="w-full bg-background text-foreground min-h-screen">
        <div className="py-24 md:py-32">
          <Container size="content">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
              className="max-w-lg mx-auto text-center space-y-6"
            >
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <PartyPopper className="h-10 w-10 text-green-600" />
              </div>
              <h1 className="text-display-sm text-foreground">{successTitle}</h1>
              <p className="text-muted-foreground text-lg">{successMessage}</p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
                <Button asChild variant="brand" size="lg">
                  <Link href="/">Return to Home</Link>
                </Button>
                <Button asChild variant="outline" size="lg">
                  <Link href={backLink.href}>{backLink.label}</Link>
                </Button>
              </div>
            </motion.div>
          </Container>
        </div>
      </section>
    );
  }

  return (
    <section className="w-full bg-background text-foreground">
      {/* Hero */}
      <div className="bg-gradient-to-b from-brand/5 to-background py-12 md:py-16">
        <Container size="content">
          <div className="max-w-2xl mx-auto text-center space-y-3">
            <Link
              href={backLink.href}
              className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-2"
            >
              <ArrowLeft className="h-4 w-4" />
              {backLink.label}
            </Link>
            <h1 className="text-display-sm md:text-display-md text-foreground">
              {title}
            </h1>
            <p className="text-muted-foreground text-base md:text-lg">{subtitle}</p>
          </div>
        </Container>
      </div>

      {/* Form */}
      <div className="pb-16 md:pb-24">
        <Container size="content">
          <div className="max-w-2xl mx-auto">
            {/* Progress bar */}
            <div className="mb-6 space-y-2">
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span className="flex items-center gap-2">
                  {CurrentIcon && <CurrentIcon className="h-4 w-4" />}
                  Step {currentStep + 1} of {totalSteps}: {steps[currentStep]?.title}
                </span>
                <span>{Math.round(progressPercent)}%</span>
              </div>
              <Progress value={progressPercent} className="h-2" />
            </div>

            <Card className="p-6 md:p-8 overflow-hidden">
              {/* Step description */}
              <div className="mb-6">
                <h2 className="text-lg font-semibold text-foreground">
                  {steps[currentStep]?.title}
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  {steps[currentStep]?.description}
                </p>
              </div>

              {/* Encouragement overlay */}
              <AnimatePresence>
                {showEncouragement && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="flex items-center justify-center py-12"
                  >
                    <div className="text-center space-y-3">
                      <CheckCircle2 className="h-10 w-10 text-green-500 mx-auto" />
                      <p className="text-lg font-medium text-foreground">
                        {encouragementText}
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Step content */}
              {!showEncouragement && (
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentStep}
                    initial={{ opacity: 0, x: direction > 0 ? 30 : -30 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: direction > 0 ? -30 : 30 }}
                    transition={{ duration: 0.3, ease: 'easeInOut' }}
                  >
                    <div className="space-y-5">{renderStep(currentStep)}</div>
                  </motion.div>
                </AnimatePresence>
              )}

              {/* Server error */}
              {serverError && (
                <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                  {serverError}
                </div>
              )}

              {/* Navigation buttons */}
              {!showEncouragement && (
                <div className="flex items-center justify-between mt-8 pt-6 border-t">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={goBack}
                    disabled={currentStep === 0 || isSubmitting}
                    className={currentStep === 0 ? 'invisible' : ''}
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back
                  </Button>

                  {isLastStep ? (
                    <Button
                      type="button"
                      variant="brand"
                      size="lg"
                      onClick={handleSubmit}
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          Submitting...
                        </>
                      ) : (
                        'Submit Application'
                      )}
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      variant="brand"
                      onClick={goNext}
                    >
                      Next
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  )}
                </div>
              )}
            </Card>
          </div>
        </Container>
      </div>
    </section>
  );
}
