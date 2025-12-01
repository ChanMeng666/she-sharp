'use client';

import { Suspense } from 'react';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Mail, ArrowRight, Loader2, AlertCircle } from 'lucide-react';
import Link from 'next/link';

function PaymentSuccessContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const alreadyPaid = searchParams.get('already_paid');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Verify session if needed
    if (sessionId || alreadyPaid) {
      setLoading(false);
    } else {
      setLoading(false);
    }
  }, [sessionId, alreadyPaid]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-foreground" />
      </div>
    );
  }

  if (!sessionId && !alreadyPaid) {
    return (
      <div className="min-h-screen bg-muted py-16">
        <div className="container mx-auto px-4 max-w-lg">
          <Card className="border-orange-200 bg-orange-50">
            <CardContent className="pt-6 text-center">
              <AlertCircle className="h-12 w-12 text-orange-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-foreground mb-2">Session Not Found</h2>
              <p className="text-gray-600 mb-6">
                We couldn&apos;t verify your payment session. If you completed a payment, please check
                your email for the confirmation and invitation code.
              </p>
              <div className="space-y-3">
                <Link href="/mentorship/join">
                  <Button className="w-full bg-foreground">
                    Return to Membership Page
                  </Button>
                </Link>
                <Link href="/contact">
                  <Button variant="outline" className="w-full">
                    Contact Support
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted py-16">
      <div className="container mx-auto px-4 max-w-lg">
        <Card className="border-green-200 shadow-lg">
          <CardHeader className="text-center pb-2">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="h-10 w-10 text-green-600" />
            </div>
            <CardTitle className="text-2xl font-bold text-foreground">
              Payment Successful!
            </CardTitle>
            <CardDescription className="text-gray-600">
              Thank you for joining the She Sharp Mentorship Program
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Email Notification */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Mail className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-blue-900 mb-1">Check Your Email</h3>
                  <p className="text-sm text-blue-700">
                    We&apos;ve sent your invitation code to your email address. Use this code to
                    complete your registration and start your mentorship journey.
                  </p>
                </div>
              </div>
            </div>

            {/* Next Steps */}
            <div className="space-y-4">
              <h3 className="font-semibold text-foreground">Next Steps</h3>
              <ol className="space-y-3">
                <li className="flex items-start gap-3">
                  <span className="w-6 h-6 bg-muted rounded-full flex items-center justify-center text-foreground font-semibold text-sm flex-shrink-0">
                    1
                  </span>
                  <span className="text-gray-600">
                    Check your email for the invitation code
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-6 h-6 bg-muted rounded-full flex items-center justify-center text-foreground font-semibold text-sm flex-shrink-0">
                    2
                  </span>
                  <span className="text-gray-600">
                    Use the invitation code to create your account
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-6 h-6 bg-muted rounded-full flex items-center justify-center text-foreground font-semibold text-sm flex-shrink-0">
                    3
                  </span>
                  <span className="text-gray-600">
                    Complete your profile and fill out the mentee form
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-6 h-6 bg-muted rounded-full flex items-center justify-center text-foreground font-semibold text-sm flex-shrink-0">
                    4
                  </span>
                  <span className="text-gray-600">
                    Get matched with a mentor and start your journey!
                  </span>
                </li>
              </ol>
            </div>

            {/* CTA Buttons */}
            <div className="space-y-3 pt-4">
              <Link href="/sign-up">
                <Button className="w-full h-12 bg-foreground text-white">
                  Create Your Account
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href="/">
                <Button variant="outline" className="w-full">
                  Return to Home
                </Button>
              </Link>
            </div>

            {/* Support Info */}
            <div className="text-center pt-4 border-t">
              <p className="text-sm text-gray-500">
                Didn&apos;t receive your email?{' '}
                <Link href="/contact" className="text-foreground hover:underline">
                  Contact our support team
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-foreground" />
      </div>
    }>
      <PaymentSuccessContent />
    </Suspense>
  );
}
