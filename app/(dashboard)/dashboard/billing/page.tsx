'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  CreditCard, 
  Check, 
  X, 
  Download, 
  Calendar,
  TrendingUp,
  Users,
  Zap,
  Shield,
  HeadphonesIcon,
  AlertTriangle,
  CheckCircle2,
  Clock,
  DollarSign,
  FileText
} from 'lucide-react';

interface Plan {
  id: string;
  name: string;
  price: number;
  interval: 'month' | 'year';
  features: string[];
  highlighted?: boolean;
}

interface Invoice {
  id: string;
  date: string;
  amount: number;
  status: 'paid' | 'pending' | 'failed';
  description: string;
}

export default function BillingPage() {
  const [currentPlan, setCurrentPlan] = useState('free');
  const [isLoading, setIsLoading] = useState(true);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [usage, setUsage] = useState({
    members: { current: 3, limit: 5 },
    storage: { current: 2.3, limit: 5 }, // in GB
    apiCalls: { current: 8500, limit: 10000 },
  });

  const plans: Plan[] = [
    {
      id: 'free',
      name: 'Free',
      price: 0,
      interval: 'month',
      features: [
        'Up to 5 team members',
        '5 GB storage',
        'Basic support',
        'Community access',
      ],
    },
    {
      id: 'pro',
      name: 'Pro',
      price: 29,
      interval: 'month',
      highlighted: true,
      features: [
        'Up to 20 team members',
        '50 GB storage',
        'Priority support',
        'Advanced analytics',
        'Custom integrations',
        'API access',
      ],
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      price: 99,
      interval: 'month',
      features: [
        'Unlimited team members',
        'Unlimited storage',
        'Dedicated support',
        'Custom features',
        'SLA guarantee',
        'Advanced security',
        'Training sessions',
      ],
    },
  ];

  useEffect(() => {
    fetchBillingData();
  }, []);

  const fetchBillingData = async () => {
    setIsLoading(true);
    try {
      // Mock data - replace with actual API call
      const mockInvoices: Invoice[] = [
        {
          id: 'INV-001',
          date: '2024-03-01',
          amount: 29.00,
          status: 'paid',
          description: 'Pro Plan - Monthly',
        },
        {
          id: 'INV-002',
          date: '2024-02-01',
          amount: 29.00,
          status: 'paid',
          description: 'Pro Plan - Monthly',
        },
        {
          id: 'INV-003',
          date: '2024-01-01',
          amount: 29.00,
          status: 'paid',
          description: 'Pro Plan - Monthly',
        },
      ];
      setInvoices(mockInvoices);
      setCurrentPlan('pro');
    } catch (err) {
      console.error('Failed to fetch billing data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpgrade = (planId: string) => {
    console.log('Upgrade to plan:', planId);
    // Implement upgrade logic
  };

  const handleManagePayment = () => {
    console.log('Manage payment method');
    // Implement payment management
  };

  const handleDownloadInvoice = (invoiceId: string) => {
    console.log('Download invoice:', invoiceId);
    // Implement invoice download
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 md:py-8 px-4 md:px-6 lg:px-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-primary">Billing & Subscription</h1>
        <p className="text-sm sm:text-base text-muted-foreground mt-2">Manage your subscription plan and billing information</p>
      </div>

      {/* Current Plan */}
      <Card className="mb-8">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle>Current Plan</CardTitle>
              <CardDescription>You are currently on the Pro plan</CardDescription>
            </div>
            <Badge variant="default" className="text-lg px-4 py-1 w-fit">
              Pro Plan
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <p className="text-2xl sm:text-3xl font-bold">$29<span className="text-base sm:text-lg font-normal text-muted-foreground">/month</span></p>
              <p className="text-xs sm:text-sm text-muted-foreground">Next billing date: April 1, 2024</p>
            </div>
            <Button variant="outline" onClick={handleManagePayment} className="text-sm sm:text-base">
              <CreditCard className="mr-2 h-4 w-4" />
              Manage Payment Method
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Usage Statistics */}
      <div className="grid gap-4 md:grid-cols-3 mb-8 md:gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Team Members</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold mb-2">
              {usage.members.current} / {usage.members.limit}
            </div>
            <Progress
              value={(usage.members.current / usage.members.limit) * 100}
              className="h-2"
            />
            <p className="text-xs text-muted-foreground mt-2">
              {usage.members.limit - usage.members.current} members remaining
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Storage Used</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold mb-2">
              {usage.storage.current} GB / {usage.storage.limit} GB
            </div>
            <Progress
              value={(usage.storage.current / usage.storage.limit) * 100}
              className="h-2"
            />
            <p className="text-xs text-muted-foreground mt-2">
              {(usage.storage.limit - usage.storage.current).toFixed(1)} GB available
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">API Calls</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold mb-2">
              {usage.apiCalls.current.toLocaleString()} / {usage.apiCalls.limit.toLocaleString()}
            </div>
            <Progress
              value={(usage.apiCalls.current / usage.apiCalls.limit) * 100}
              className="h-2"
            />
            <p className="text-xs text-muted-foreground mt-2">
              Resets in 15 days
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Available Plans */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Available Plans</CardTitle>
          <CardDescription>Choose the plan that best fits your needs</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3 md:gap-6">
            {plans.map((plan) => (
              <div
                key={plan.id}
                className={`relative rounded-lg border p-6 ${
                  plan.highlighted ? 'border-primary shadow-lg' : 'border-border'
                } ${currentPlan === plan.id ? 'bg-muted/50' : ''}`}
              >
                {plan.highlighted && (
                  <Badge variant="default" className="absolute -top-3 left-1/2 -translate-x-1/2">
                    Most Popular
                  </Badge>
                )}
                {currentPlan === plan.id && (
                  <Badge className="absolute -top-3 right-4 bg-green-600 text-white">
                    Current Plan
                  </Badge>
                )}
                <div className="mb-4">
                  <h3 className="text-lg font-semibold">{plan.name}</h3>
                  <p className="text-3xl font-bold mt-2">
                    ${plan.price}
                    <span className="text-lg font-normal text-muted-foreground">/{plan.interval}</span>
                  </p>
                </div>
                <ul className="space-y-2 mb-6">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-center text-sm">
                      <Check className="mr-2 h-4 w-4 text-green-500 flex-shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
                {currentPlan === plan.id ? (
                  <Button className="w-full" disabled>
                    Current Plan
                  </Button>
                ) : (
                  <Button
                    className="w-full"
                    variant={plan.highlighted ? 'default' : 'outline'}
                    onClick={() => handleUpgrade(plan.id)}
                  >
                    {plan.price > plans.find(p => p.id === currentPlan)!.price ? 'Upgrade' : 'Downgrade'}
                  </Button>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Invoice History */}
      <Card>
        <CardHeader>
          <CardTitle>Invoice History</CardTitle>
          <CardDescription>Download your past invoices and receipts</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      No invoices found
                    </TableCell>
                  </TableRow>
                ) : (
                  invoices.map((invoice) => (
                    <TableRow key={invoice.id}>
                      <TableCell className="font-medium">{invoice.id}</TableCell>
                      <TableCell>{formatDate(invoice.date)}</TableCell>
                      <TableCell>{invoice.description}</TableCell>
                      <TableCell>${invoice.amount.toFixed(2)}</TableCell>
                      <TableCell>
                        {invoice.status === 'paid' ? (
                          <Badge className="bg-green-100 text-green-700">
                            <CheckCircle2 className="mr-1 h-3 w-3" />
                            Paid
                          </Badge>
                        ) : invoice.status === 'pending' ? (
                          <Badge className="bg-amber-100 text-amber-700">
                            <Clock className="mr-1 h-3 w-3" />
                            Pending
                          </Badge>
                        ) : (
                          <Badge variant="destructive">
                            <X className="mr-1 h-3 w-3" />
                            Failed
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDownloadInvoice(invoice.id)}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Billing Support */}
      <Alert className="mt-8 border-primary/20 bg-muted">
        <HeadphonesIcon className="h-4 w-4 text-primary" />
        <AlertDescription className="text-foreground">
          Need help with billing? Contact our support team at{' '}
          <a href="mailto:billing@shesharp.org" className="font-medium underline">
            billing@shesharp.org
          </a>{' '}
          or visit our{' '}
          <a href="/support" className="font-medium underline">
            support center
          </a>
          .
        </AlertDescription>
      </Alert>
    </div>
  );
}