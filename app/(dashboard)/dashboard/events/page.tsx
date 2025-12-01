"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  Video,
  Building,
  Globe,
  Sparkles,
  ArrowRight,
  Info,
} from "lucide-react";
import { format } from "date-fns";

interface Event {
  id: number;
  title: string;
  description: string;
  eventType: string;
  startTime: string;
  endTime: string;
  timezone: string;
  locationType: string;
  locationDetails: any;
  capacity: number;
  currentRegistrations: number;
  isMembersOnly: boolean;
  isRegistered: boolean;
  spotsRemaining: number | null;
  isFull: boolean;
  isPast: boolean;
  isUpcoming: boolean;
  isOngoing: boolean;
}

export default function EventsPage() {
  const [events, setEvents] = useState<{
    upcoming: Event[];
    ongoing: Event[];
    past: Event[];
  }>({ upcoming: [], ongoing: [], past: [] });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("upcoming");

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const response = await fetch("/api/events");
      if (response.ok) {
        const data = await response.json();
        setEvents(data);
      }
    } catch (error) {
      console.error("Error fetching events:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (eventId: number) => {
    try {
      const response = await fetch(`/api/events/${eventId}/register`, {
        method: "POST",
      });

      if (response.ok) {
        fetchEvents();
      } else {
        const error = await response.json();
        alert(error.error || "Failed to register");
      }
    } catch (error) {
      console.error("Error registering for event:", error);
      alert("Failed to register for event");
    }
  };

  const handleCancelRegistration = async (eventId: number) => {
    try {
      const response = await fetch(`/api/events/${eventId}/register`, {
        method: "DELETE",
      });

      if (response.ok) {
        fetchEvents();
      } else {
        const error = await response.json();
        alert(error.error || "Failed to cancel registration");
      }
    } catch (error) {
      console.error("Error cancelling registration:", error);
      alert("Failed to cancel registration");
    }
  };

  const getLocationIcon = (locationType: string) => {
    switch (locationType) {
      case "virtual":
        return <Video className="h-4 w-4" />;
      case "physical":
        return <Building className="h-4 w-4" />;
      case "hybrid":
        return <Globe className="h-4 w-4" />;
      default:
        return <MapPin className="h-4 w-4" />;
    }
  };

  const getEventTypeColor = (eventType: string) => {
    return "bg-muted text-foreground border-border";
  };

  const EventCard = ({ event }: { event: Event }) => (
    <Card className="group hover:shadow-xl transition-all duration-300 border-border bg-background h-full overflow-hidden">
      <CardHeader>
        <div className="flex justify-between items-start mb-2">
          <div className="space-y-2 flex-1">
            <CardTitle className="text-lg font-semibold text-foreground group-hover:text-foreground transition-colors line-clamp-2">
              {event.title}
            </CardTitle>
            <div className="flex flex-wrap gap-2">
              <Badge
                className={`${getEventTypeColor(event.eventType)} text-xs font-medium`}
              >
                {event.eventType}
              </Badge>
              {event.isMembersOnly && (
                <Badge className="bg-muted text-foreground border-border text-xs">
                  Members Only
                </Badge>
              )}
              {event.isOngoing && (
                <Badge className="bg-muted text-foreground border-border text-xs">
                  Happening Now
                </Badge>
              )}
            </div>
          </div>
          {event.capacity && (
            <div className="text-right ml-4">
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Users className="h-4 w-4" />
                <span className="font-medium">
                  {event.currentRegistrations}/{event.capacity}
                </span>
              </div>
              {event.spotsRemaining !== null && event.spotsRemaining > 0 && (
                <p className="text-xs text-foreground mt-1 font-medium">
                  {event.spotsRemaining} spots left
                </p>
              )}
              {event.isFull && (
                <p className="text-xs text-error mt-1 font-medium">
                  Event Full
                </p>
              )}
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="flex-1 space-y-4">
        {event.description && (
          <CardDescription className="line-clamp-2 text-muted-foreground text-sm">
            {event.description}
          </CardDescription>
        )}

        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4 text-foreground" />
            <span className="font-medium text-foreground">
              {format(new Date(event.startTime), "PPP")}
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4 text-foreground" />
            <span>
              {format(new Date(event.startTime), "p")} -{" "}
              {format(new Date(event.endTime), "p")}
              {event.timezone && ` (${event.timezone})`}
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className="text-foreground">
              {getLocationIcon(event.locationType)}
            </span>
            <span className="capitalize">{event.locationType}</span>
            {event.locationDetails?.venue && (
              <span className="text-foreground font-medium">
                • {event.locationDetails.venue}
              </span>
            )}
          </div>
        </div>
      </CardContent>
      <CardFooter className="border-t border-border bg-muted flex flex-wrap gap-2 p-4">
        {event.isUpcoming &&
          !event.isFull &&
          (event.isRegistered ? (
            <Button
              variant="outline"
              onClick={() => handleCancelRegistration(event.id)}
              className="min-w-[130px]"
              size="lg"
            >
              Cancel Registration
            </Button>
          ) : (
            <Button
              onClick={() => handleRegister(event.id)}
              variant="default"
              className="min-w-[130px]"
              size="lg"
            >
              Register Now
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          ))}
        {event.isUpcoming && event.isFull && !event.isRegistered && (
          <Button disabled className="min-w-[130px]" size="lg">
            Event Full
          </Button>
        )}
        <Button
          variant="outline"
          className="min-w-[100px] border-border transition-all"
          size="lg"
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
          <p className="mt-4 text-muted-foreground">Loading events...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-4 sm:py-6 lg:py-8 px-4 sm:px-6 lg:px-8 max-w-7xl">
      {/* Header Section */}
      <div className="mb-6 sm:mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
          <Calendar className="h-5 w-5 sm:h-6 sm:w-6 text-foreground flex-shrink-0" />
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground">
            Events & Workshops
          </h1>
        </div>
        <p className="text-muted-foreground text-base sm:text-lg">
          Discover and register for upcoming She Sharp events
        </p>
      </div>

      {/* Info Alert */}
      <Alert className="mb-6 sm:mb-8 border-border bg-muted">
        <Info className="h-4 w-4 text-foreground" />
        <AlertDescription className="text-foreground">
          <strong className="font-semibold">Join our community events!</strong>
          <span className="block sm:inline">
            {" "}
            Connect with fellow women in STEM through workshops, networking
            sessions, and conferences.
          </span>
        </AlertDescription>
      </Alert>

      {/* Tabs Section */}
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-6"
      >
        <TabsList className="grid w-full max-w-md grid-cols-3 bg-muted text-muted-foreground p-1">
          <TabsTrigger
            value="upcoming"
            className="data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
          >
            Upcoming ({events.upcoming.length})
          </TabsTrigger>
          <TabsTrigger
            value="ongoing"
            className="data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
          >
            Ongoing ({events.ongoing.length})
          </TabsTrigger>
          <TabsTrigger
            value="past"
            className="data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
          >
            Past ({events.past.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming" className="space-y-4">
          {events.upcoming.length === 0 ? (
            <Card className="border-border shadow-sm">
              <CardContent className="text-center py-12">
                <Sparkles className="h-12 w-12 text-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  No upcoming events
                </h3>
                <p className="text-muted-foreground">Check back soon for new events!</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {events.upcoming.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="ongoing" className="space-y-4">
          {events.ongoing.length === 0 ? (
            <Card className="border-border shadow-sm">
              <CardContent className="text-center py-12">
                <Clock className="h-12 w-12 text-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  No ongoing events
                </h3>
                <p className="text-muted-foreground">No events are happening right now</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {events.ongoing.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="past" className="space-y-4">
          {events.past.length === 0 ? (
            <Card className="border-border shadow-sm">
              <CardContent className="text-center py-12">
                <Calendar className="h-12 w-12 text-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  No past events
                </h3>
                <p className="text-muted-foreground">Past events will appear here</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {events.past.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
