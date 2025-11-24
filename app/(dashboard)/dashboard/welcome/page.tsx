'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { GraduationCap, Users, Sparkles, ArrowRight, Check } from 'lucide-react';

export default function WelcomePage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [activeRoles, setActiveRoles] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      const response = await fetch('/api/user');
      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
        
        // Fetch user roles
        const rolesResponse = await fetch('/api/user/roles');
        if (rolesResponse.ok) {
          const rolesData = await rolesResponse.json();
          setActiveRoles(rolesData.activeRoles || []);
        }
      }
    } catch (err) {
      console.error('Failed to fetch user data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRoleSelection = (role: 'mentor' | 'mentee' | 'both') => {
    if (role === 'both') {
      router.push('/dashboard/onboarding?roles=mentor,mentee');
    } else {
      router.push(`/dashboard/onboarding?role=${role}`);
    }
  };

  const roleCards = [
    {
      id: 'mentor',
      title: 'Become a Mentor',
      icon: Users,
      description: 'Share your expertise and guide others in their STEM journey',
      features: [
        'Share your professional knowledge',
        'Help others grow in their careers',
        'Build your professional network',
        'Give back to the community'
      ],
      color: 'from-purple-dark to-purple-mid',
      bgColor: 'bg-purple-light',
      borderColor: 'border-purple-dark',
      isActive: activeRoles.includes('mentor')
    },
    {
      id: 'mentee',
      title: 'Find a Mentor',
      icon: GraduationCap,
      description: 'Connect with experienced professionals for career guidance',
      features: [
        'Find the right mentor for you',
        'Get personalized career advice',
        'Accelerate your professional growth',
        'Access exclusive resources'
      ],
      color: 'from-periwinkle-dark to-periwinkle-mid',
      bgColor: 'bg-periwinkle-light',
      borderColor: 'border-periwinkle-dark',
      isActive: activeRoles.includes('mentee')
    },
    {
      id: 'both',
      title: 'Both Mentor & Mentee',
      icon: Sparkles,
      description: 'Experience the full journey - guide others while learning yourself',
      features: [
        'Mentor juniors in your expertise',
        'Learn from senior professionals',
        'Complete growth experience',
        'Maximum networking opportunities'
      ],
      color: 'from-mint-dark to-mint-mid',
      bgColor: 'bg-mint-light',
      borderColor: 'border-mint-dark',
      isActive: activeRoles.includes('mentor') && activeRoles.includes('mentee')
    }
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  // If user already has active roles, redirect to dashboard
  if (activeRoles.length > 0) {
    router.push('/dashboard');
    return null;
  }

  return (
    <div className="container mx-auto py-8 px-4 sm:px-6 lg:px-8 max-w-6xl">
      {/* Welcome Header */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-primary mb-4">
          Welcome to She Sharp!
        </h1>
        <p className="text-xl text-foreground max-w-3xl mx-auto">
          {user?.name ? `Hello ${user.name}! ` : ''}
          Choose how you'd like to participate in our mentorship program.
          You can always add more roles later.
        </p>
      </div>

      {/* Role Selection Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {roleCards.map((role) => {
          const Icon = role.icon;
          return (
            <Card 
              key={role.id}
              className={`relative overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer group ${
                role.isActive ? role.borderColor + ' border-2' : 'border-border'
              }`}
              onClick={() => !role.isActive && handleRoleSelection(role.id as 'mentor' | 'mentee' | 'both')}
            >
              {/* Gradient Background */}
              <div className={`absolute inset-0 bg-gradient-to-br ${role.color} opacity-5 group-hover:opacity-10 transition-opacity`} />
              
              {/* Active Badge */}
              {role.isActive && (
                <div className="absolute top-4 right-4">
                  <div className="flex items-center gap-1 bg-accent text-foreground px-2 py-1 rounded-full text-xs font-semibold">
                    <Check className="h-3 w-3" />
                    Active
                  </div>
                </div>
              )}

              <CardHeader className="relative">
                <div className={`flex h-14 w-14 items-center justify-center rounded-lg bg-primary/10 mb-4`}>
                  <Icon className={`h-8 w-8 text-primary`} />
                </div>
                <CardTitle className="text-2xl">{role.title}</CardTitle>
                <CardDescription className="mt-2">
                  {role.description}
                </CardDescription>
              </CardHeader>

              <CardContent className="relative">
                <ul className="space-y-2 mb-6">
                  {role.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>

                {!role.isActive && (
                  <Button 
                    variant={role.id === 'mentor' ? 'default' : role.id === 'mentee' ? 'secondary' : 'accent'}
                    size="lg"
                    className="w-full"
                  >
                    Get Started
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Additional Information */}
      <div className="bg-accent rounded-lg p-6 text-center">
        <h3 className="text-lg font-semibold text-foreground mb-2">Not Sure Which to Choose?</h3>
        <p className="text-muted-foreground mb-4">
          Many of our members are both mentors and mentees. You can start with one role and add another later as you grow.
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <Button variant="outline" onClick={() => router.push('/mentorship')}>
            Learn About Our Program
          </Button>
          <Button variant="outline" onClick={() => router.push('/dashboard')}>
            Skip for Now
          </Button>
        </div>
      </div>
    </div>
  );
}