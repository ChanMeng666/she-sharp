'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  CheckCircle, 
  XCircle,
  Download,
  MessageSquare,
  Award,
  Video,
  Building,
  Globe,
  Sparkles,
  ArrowRight,
  Info,
  Ticket
} from 'lucide-react';
import { format } from 'date-fns';

interface EventRegistration {
  registrationId: number;
  registeredAt: string;
  roleInEvent: string;
  checkedInAt: string | null;
  feedbackSubmitted: boolean;
  certificateIssued: boolean;
  certificateUrl: string | null;
  event: {
    id: number;
    title: string;
    description: string;
    eventType: string;
    startTime: string;
    endTime: string;
    timezone: string;
    locationType: string;
    locationDetails: any;
    agenda: any;
    speakers: any;
    materials: any;
  };
}

export default function MyRegistrationsPage() {
  const [registrations, setRegistrations] = useState<{
    upcoming: EventRegistration[];
    ongoing: EventRegistration[];
    past: EventRegistration[];
  }>({ upcoming: [], ongoing: [], past: [] });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('upcoming');

  useEffect(() => {
    fetchRegistrations();
  }, []);

  const fetchRegistrations = async () => {
    try {
      const response = await fetch('/api/events/my-registrations');
      if (response.ok) {
        const data = await response.json();
        setRegistrations(data);
      }
    } catch (error) {
      console.error('Error fetching registrations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelRegistration = async (eventId: number) => {
    if (!confirm('Are you sure you want to cancel your registration?')) {
      return;
    }

    try {
      const response = await fetch(`/api/events/${eventId}/register`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchRegistrations();
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to cancel registration');
      }
    } catch (error) {
      console.error('Error cancelling registration:', error);
      alert('Failed to cancel registration');
    }
  };

  const getLocationIcon = (locationType: string) => {
    switch (locationType) {
      case 'virtual':
        return <Video className="h-4 w-4" />;
      case 'physical':
        return <Building className="h-4 w-4" />;
      case 'hybrid':
        return <Globe className="h-4 w-4" />;
      default:
        return <MapPin className="h-4 w-4" />;
    }
  };

  const getEventTypeColor = (eventType: string) => {
    switch (eventType) {
      case 'workshop':
        return 'bg-purple-light text-primary border-purple-mid/20';
      case 'networking':
        return 'bg-mint-light text-mint-dark border-mint-dark/20';
      case 'mentorship':
        return 'bg-periwinkle-light text-periwinkle-dark border-periwinkle-dark/20';
      case 'conference':
        return 'bg-navy-light text-navy-dark border-navy-dark/20';
      case 'social':
        return 'bg-purple-light text-primary border-purple-mid/20';
      default:
        return 'bg-accent text-foreground border-border';
    }
  };

  const RegistrationCard = ({ registration }: { registration: EventRegistration }) => (
    <Card className="group hover:shadow-xl transition-all duration-300 border-border hover:border-purple-mid/30 bg-white h-full overflow-hidden">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div className="space-y-2 flex-1">
            <CardTitle className="text-lg font-semibold text-navy-dark group-hover:text-primary transition-colors line-clamp-2">
              {registration.event.title}
            </CardTitle>
            <div className="flex flex-wrap gap-2">
              <Badge className={`${getEventTypeColor(registration.event.eventType)} text-xs font-medium`}>
                {registration.event.eventType}
              </Badge>
              {registration.checkedInAt && (
                <Badge className="bg-mint-light text-mint-dark border-mint-dark/20 text-xs">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Attended
                </Badge>
              )}
              {registration.feedbackSubmitted && (
                <Badge className="bg-periwinkle-light text-periwinkle-dark border-periwinkle-dark/20 text-xs">
                  <MessageSquare className="h-3 w-3 mr-1" />
                  Feedback Given
                </Badge>
              )}
            </div>
          </div>
          {registration.certificateIssued && (
            <div className="flex-shrink-0 ml-2">
              <Badge className="bg-purple-light text-primary border-purple-mid/20 text-xs">
                <Award className="h-3 w-3 mr-1" />
                Certificate
              </Badge>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="flex-1 space-y-4">
        {registration.event.description && (
          <CardDescription className="line-clamp-2 text-gray text-sm">
            {registration.event.description}
          </CardDescription>
        )}
        
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-gray">
            <Calendar className="h-4 w-4 text-primary" />
            <span className="font-medium text-navy-dark">
              {format(new Date(registration.event.startTime), 'PPP')}
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray">
            <Clock className="h-4 w-4 text-primary" />
            <span>
              {format(new Date(registration.event.startTime), 'p')} - {format(new Date(registration.event.endTime), 'p')}
              {registration.event.timezone && ` (${registration.event.timezone})`}
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray">
            <span className="text-primary">{getLocationIcon(registration.event.locationType)}</span>
            <span className="capitalize">{registration.event.locationType}</span>
            {registration.event.locationDetails?.venue && (
              <span className="text-navy-dark font-medium">• {registration.event.locationDetails.venue}</span>
            )}
          </div>
        </div>

        <div className="pt-2 border-t border-border">
          <div className="flex items-center gap-2 text-xs text-gray">
            <Ticket className="h-3.5 w-3.5 text-primary" />
            <span>Registered on {format(new Date(registration.registeredAt), 'PPP')}</span>
          </div>
        </div>
      </CardContent>
      <CardFooter className="border-t border-border bg-accent/50 flex flex-wrap gap-2 p-4">
          {/* Actions for upcoming events */}
          {new Date(registration.event.startTime) > new Date() && (
            <>
              {registration.event.locationDetails?.meetingLink && (
                <Button 
                  onClick={() => window.open(registration.event.locationDetails.meetingLink, '_blank')}
                  variant="default" 
                  className="min-w-[100px]"
                  size="sm"
                >
                  Join Meeting
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              )}
              <Button 
                variant="outline" 
                onClick={() => handleCancelRegistration(registration.event.id)}
                className="min-w-[100px]"
                size="sm"
              >
                <XCircle className="h-4 w-4 mr-2" />
                Cancel
              </Button>
            </>
          )}

          {/* Actions for past events */}
          {new Date(registration.event.endTime) < new Date() && (
            <>
              {registration.certificateUrl && (
                <Button 
                  onClick={() => window.open(registration.certificateUrl!, '_blank')}
                  variant="default" 
                  className="min-w-[100px]"
                  size="sm"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Certificate
                </Button>
              )}
              {!registration.feedbackSubmitted && (
                <Button 
                  variant="outline" 
                  className="min-w-[100px]"
                  size="sm"
                >
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Give Feedback
                </Button>
              )}
            </>
          )}

          <Button 
            variant="outline" 
            className="min-w-[100px] border-border hover:border-purple-mid/30 hover:bg-purple-light/30 transition-all"
            size="sm"
          >
            View Details
          </Button>
      </CardFooter>
    </Card>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray">Loading your registrations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-4 sm:py-6 lg:py-8 px-4 sm:px-6 lg:px-8 max-w-7xl">
      {/* Header Section */}
      <div className="mb-6 sm:mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
          <Ticket className="h-5 w-5 sm:h-6 sm:w-6 text-primary flex-shrink-0" />
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-purple-dark to-purple-mid bg-clip-text text-transparent">
            My Event Registrations
          </h1>
        </div>
        <p className="text-gray text-base sm:text-lg">
          Manage your event registrations and access event materials
        </p>
      </div>

      {/* Info Alert */}
      {registrations.upcoming.length > 0 && (
        <Alert className="mb-6 sm:mb-8 border-purple-mid/20 bg-purple-light/20">
          <Info className="h-4 w-4 text-primary" />
          <AlertDescription className="text-navy-dark">
            <strong className="font-semibold">You have {registrations.upcoming.length} upcoming event{registrations.upcoming.length !== 1 ? 's' : ''}!</strong>
            <span className="block sm:inline"> Don't forget to mark your calendar and prepare for your registered events.</span>
          </AlertDescription>
        </Alert>
      )}

      {/* Tabs Section */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full max-w-md grid-cols-3 bg-muted text-muted-foreground p-1">
          <TabsTrigger 
            value="upcoming"
            className="data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
          >
            Upcoming ({registrations.upcoming.length})
          </TabsTrigger>
          <TabsTrigger 
            value="ongoing"
            className="data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
          >
            Ongoing ({registrations.ongoing.length})
          </TabsTrigger>
          <TabsTrigger 
            value="past"
            className="data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
          >
            Past ({registrations.past.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming" className="space-y-4">
          {registrations.upcoming.length === 0 ? (
            <Card className="border-purple-light shadow-sm">
              <CardContent className="text-center py-12">
                <Calendar className="h-12 w-12 text-purple-mid mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-navy-dark mb-2">No upcoming events</h3>
                <p className="text-gray mb-6">You haven't registered for any upcoming events yet</p>
                <Button 
                  onClick={() => window.location.href = '/dashboard/events'}
                  variant="default"
                  size="sm"
                >
                  Browse Events
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {registrations.upcoming.map(registration => (
                <RegistrationCard key={registration.registrationId} registration={registration} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="ongoing" className="space-y-4">
          {registrations.ongoing.length === 0 ? (
            <Card className="border-purple-light shadow-sm">
              <CardContent className="text-center py-12">
                <Clock className="h-12 w-12 text-purple-mid mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-navy-dark mb-2">No ongoing events</h3>
                <p className="text-gray">You don't have any events happening right now</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {registrations.ongoing.map(registration => (
                <RegistrationCard key={registration.registrationId} registration={registration} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="past" className="space-y-4">
          {registrations.past.length === 0 ? (
            <Card className="border-purple-light shadow-sm">
              <CardContent className="text-center py-12">
                <Sparkles className="h-12 w-12 text-purple-mid mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-navy-dark mb-2">No past events</h3>
                <p className="text-gray">Your attended events will appear here</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {registrations.past.map(registration => (
                <RegistrationCard key={registration.registrationId} registration={registration} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}