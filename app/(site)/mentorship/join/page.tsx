'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Check, Loader2, Sparkles, Users, Calendar, BookOpen, Award } from 'lucide-react';
import Link from 'next/link';

const benefits = [
  { icon: Users, title: 'Mentor Matching', description: 'AI-powered matching with experienced mentors in your field' },
  { icon: Calendar, title: 'Priority Access', description: 'Early access to exclusive networking events and workshops' },
  { icon: BookOpen, title: 'Learning Resources', description: 'Premium guides, templates, and career development materials' },
  { icon: Award, title: 'Recognition', description: 'Points and achievements for active participation' },
];

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

export default function MembershipJoinPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleCheckout = async () => {
    if (!email) {
      setError('Please enter your email address');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Please enter a valid email address');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
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
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white">
      {/* Hero Section */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <div className="inline-flex items-center gap-2 bg-purple-100 text-purple-dark px-4 py-2 rounded-full mb-6">
              <Sparkles className="h-4 w-4" />
              <span className="text-sm font-medium">Mentorship Program</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-navy-dark mb-6">
              Join She Sharp Mentorship Program
            </h1>
            <p className="text-lg text-gray-600">
              Connect with experienced professionals, accelerate your career growth, and become
              part of a supportive community of women in STEM.
            </p>
          </div>

          {/* Benefits Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
            {benefits.map((benefit, index) => (
              <Card key={index} className="border-0 shadow-md hover:shadow-lg transition-shadow">
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <benefit.icon className="h-6 w-6 text-purple-dark" />
                  </div>
                  <h3 className="font-semibold text-navy-dark mb-2">{benefit.title}</h3>
                  <p className="text-sm text-gray-600">{benefit.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Pricing Card */}
          <div className="max-w-lg mx-auto">
            <Card className="border-2 border-purple-dark shadow-xl">
              <CardHeader className="text-center pb-0">
                <div className="bg-purple-dark text-white text-xs font-semibold px-3 py-1 rounded-full inline-block mb-4">
                  ANNUAL MEMBERSHIP
                </div>
                <CardTitle className="text-3xl font-bold text-navy-dark">
                  $100 <span className="text-lg font-normal text-gray-500">NZD/year</span>
                </CardTitle>
                <CardDescription className="text-gray-600 mt-2">
                  Full access to the mentorship program and all premium benefits
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                {/* Features List */}
                <ul className="space-y-3 mb-8">
                  {includedFeatures.map((feature, index) => (
                    <li key={index} className="flex items-center gap-3">
                      <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <Check className="h-3 w-3 text-green-600" />
                      </div>
                      <span className="text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>

                {/* Email Input */}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="h-12"
                    />
                    <p className="text-xs text-gray-500">
                      Your invitation code will be sent to this email after payment.
                    </p>
                  </div>

                  {error && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                      <p className="text-red-700 text-sm">{error}</p>
                    </div>
                  )}

                  <Button
                    onClick={handleCheckout}
                    disabled={loading}
                    className="w-full h-12 bg-purple-dark hover:bg-purple-dark/90 text-white font-semibold"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="animate-spin mr-2 h-4 w-4" />
                        Processing...
                      </>
                    ) : (
                      'Get Started - $100 NZD/year'
                    )}
                  </Button>

                  <p className="text-xs text-center text-gray-500">
                    Secure payment powered by Stripe. Cancel anytime.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Already have a code? */}
            <div className="text-center mt-6">
              <p className="text-gray-600">
                Already have an invitation code?{' '}
                <Link href="/sign-up" className="text-purple-dark hover:underline font-medium">
                  Sign up here
                </Link>
              </p>
            </div>

            {/* Mentor Application */}
            <div className="text-center mt-4">
              <p className="text-gray-600">
                Want to become a mentor?{' '}
                <Link href="/mentorship/become-a-mentor" className="text-purple-dark hover:underline font-medium">
                  Apply to mentor
                </Link>
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4 max-w-3xl">
          <h2 className="text-2xl font-bold text-navy-dark text-center mb-8">
            Frequently Asked Questions
          </h2>
          <div className="space-y-6">
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h3 className="font-semibold text-navy-dark mb-2">How does the mentorship matching work?</h3>
              <p className="text-gray-600">
                Our AI-powered system matches you with mentors based on your MBTI personality type,
                career goals, industry preferences, and skills. You&apos;ll receive personalized mentor
                recommendations to ensure the best fit.
              </p>
            </div>
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h3 className="font-semibold text-navy-dark mb-2">What happens after I pay?</h3>
              <p className="text-gray-600">
                After successful payment, you&apos;ll receive an invitation code via email. Use this code
                to complete your registration on She Sharp. Once registered, you can fill out your
                profile and start the mentorship matching process.
              </p>
            </div>
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h3 className="font-semibold text-navy-dark mb-2">Can I cancel my membership?</h3>
              <p className="text-gray-600">
                Yes, you can cancel your membership at any time. Your access will continue until the
                end of your billing period. No refunds are provided for partial periods.
              </p>
            </div>
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h3 className="font-semibold text-navy-dark mb-2">Is this program only for women?</h3>
              <p className="text-gray-600">
                She Sharp is dedicated to empowering women in STEM. While our primary focus is on
                supporting women, we welcome anyone who supports our mission of bridging the gender
                gap in technology.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
