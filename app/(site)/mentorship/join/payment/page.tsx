'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Loader2,
  Check,
  CreditCard,
  Shield,
  AlertCircle,
  ChevronLeft,
  Sparkles,
} from 'lucide-react';
import Link from 'next/link';

interface FormSummary {
  id: number;
  email: string;
  fullName: string;
  status: string;
  paymentCompleted: boolean;
}

const includedFeatures = [
  '1-on-1 mentor sessions',
  'AI-powered mentor matching',
  'Access to all events',
  'Premium learning resources',
  'Networking opportunities',
  'Career guidance support',
  'Community access',
  'Certificate of completion',
];

function PaymentContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const submissionId = searchParams.get('id');

  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [formData, setFormData] = useState<FormSummary | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchFormData() {
      if (!submissionId) {
        setError('No application found. Please complete the application form first.');
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`/api/forms/mentee/public?id=${submissionId}`);
        const data = await response.json();

        if (!data.exists || !data.form) {
          setError('Application not found. Please submit a new application.');
          setLoading(false);
          return;
        }

        if (data.form.paymentCompleted) {
          // Already paid, redirect to success
          router.push('/mentorship/join/success?already_paid=true');
          return;
        }

        setFormData(data.form);
      } catch (err) {
        setError('Failed to load application data. Please try again.');
      } finally {
        setLoading(false);
      }
    }

    fetchFormData();
  }, [submissionId, router]);

  const handleCheckout = async () => {
    if (!formData) return;

    setCheckoutLoading(true);
    setError('');

    try {
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          formSubmissionId: formData.id,
        }),
      });

      const data = await response.json();

      if (data.error) {
        setError(data.error);
        return;
      }

      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      setError('Failed to start checkout. Please try again.');
    } finally {
      setCheckoutLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-purple-50 to-white">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-purple-dark mx-auto mb-4" />
          <p className="text-gray-600">Loading your application...</p>
        </div>
      </div>
    );
  }

  if (error && !formData) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white py-16">
        <div className="container mx-auto px-4 max-w-lg">
          <Card className="border-orange-200 bg-orange-50">
            <CardContent className="pt-6 text-center">
              <AlertCircle className="h-12 w-12 text-orange-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-navy-dark mb-2">Application Not Found</h2>
              <p className="text-gray-600 mb-6">{error}</p>
              <Link href="/mentorship/join">
                <Button className="w-full bg-purple-dark hover:bg-purple-dark/90">
                  <ChevronLeft className="h-4 w-4 mr-2" />
                  Start New Application
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white py-12">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-xl mx-auto mb-8">
          <div className="inline-flex items-center gap-2 bg-purple-100 text-purple-dark px-4 py-2 rounded-full mb-4">
            <Sparkles className="h-4 w-4" />
            <span className="text-sm font-medium">Complete Your Registration</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-navy-dark mb-2">
            Payment
          </h1>
          <p className="text-gray-600">
            Complete your membership payment to receive your invitation code
          </p>
        </div>

        <div className="max-w-lg mx-auto">
          {/* Application Summary */}
          {formData && (
            <Card className="mb-6">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Application Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Name:</span>
                    <span className="font-medium">{formData.fullName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Email:</span>
                    <span className="font-medium">{formData.email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Application ID:</span>
                    <span className="font-medium">#{formData.id}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Payment Card */}
          <Card className="border-2 border-purple-dark shadow-lg">
            <CardHeader className="text-center pb-2">
              <div className="bg-purple-dark text-white text-xs font-semibold px-3 py-1 rounded-full inline-block mb-3 mx-auto">
                ANNUAL MEMBERSHIP
              </div>
              <CardTitle className="text-3xl font-bold text-navy-dark">
                $100 <span className="text-lg font-normal text-gray-500">NZD/year</span>
              </CardTitle>
              <CardDescription className="text-gray-600">
                Full access to the mentorship program
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Features List */}
              <ul className="space-y-2">
                {includedFeatures.map((feature, index) => (
                  <li key={index} className="flex items-center gap-3">
                    <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <Check className="h-3 w-3 text-green-600" />
                    </div>
                    <span className="text-gray-700 text-sm">{feature}</span>
                  </li>
                ))}
              </ul>

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-red-700 text-sm">{error}</p>
                </div>
              )}

              {/* Checkout Button */}
              <Button
                onClick={handleCheckout}
                disabled={checkoutLoading || !formData}
                className="w-full h-12 bg-purple-dark hover:bg-purple-dark/90 text-white font-semibold"
              >
                {checkoutLoading ? (
                  <>
                    <Loader2 className="animate-spin mr-2 h-4 w-4" />
                    Processing...
                  </>
                ) : (
                  <>
                    <CreditCard className="mr-2 h-4 w-4" />
                    Pay $100 NZD
                  </>
                )}
              </Button>

              {/* Security Note */}
              <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
                <Shield className="h-4 w-4" />
                <span>Secure payment powered by Stripe</span>
              </div>
            </CardContent>
          </Card>

          {/* Back Link */}
          <div className="text-center mt-6">
            <Link
              href="/mentorship/join"
              className="text-gray-600 hover:text-purple-dark inline-flex items-center"
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Back to application form
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PaymentPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-purple-50 to-white">
          <Loader2 className="h-8 w-8 animate-spin text-purple-dark" />
        </div>
      }
    >
      <PaymentContent />
    </Suspense>
  );
}
