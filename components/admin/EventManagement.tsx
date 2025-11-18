'use client';

import { useState, useEffect } from 'react';
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  Edit,
  Trash2,
  Eye,
  MoreVertical,
  Plus,
  Filter,
  Download,
  CalendarClock,
  Globe,
  Video,
  Building,
  CheckCircle,
  XCircle,
  AlertCircle,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import Link from 'next/link';

interface Event {
  id: number;
  title: string;
  description: string;
  eventType: 'workshop' | 'networking' | 'training' | 'social' | 'thrive';
  startTime: string;
  endTime: string;
  locationType: 'online' | 'in_person' | 'hybrid';
  locationDetails: {
    venue?: string;
    address?: string;
    meetingLink?: string;
  };
  capacity: number;
  currentRegistrations: number;
  registrationDeadline: string;
  status: 'upcoming' | 'ongoing' | 'completed' | 'cancelled';
  isMembersOnly: boolean;
  createdBy: string;
}

export default function EventManagement() {
  const [events, setEvents] = useState<Event[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('upcoming');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEvents();
  }, [typeFilter, statusFilter]);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (typeFilter !== 'all') params.append('type', typeFilter);
      if (statusFilter !== 'all') params.append('status', statusFilter);

      const response = await fetch(`/api/admin/events?${params}`);
      if (response.ok) {
        const data = await response.json();
        setEvents(data.events || []);
      }
    } catch (error) {
      console.error('Failed to fetch events:', error);
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  const getEventTypeColor = (type: string) => {
    switch (type) {
      case 'workshop':
        return 'bg-blue-100 text-blue-700';
      case 'networking':
        return 'bg-green-100 text-green-700';
      case 'training':
        return 'bg-purple-100 text-purple-700';
      case 'social':
        return 'bg-pink-100 text-pink-700';
      case 'thrive':
        return 'bg-gradient-to-r from-purple-500 to-purple-700 text-white';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getLocationIcon = (type: string) => {
    switch (type) {
      case 'online':
        return <Globe className="w-4 h-4" />;
      case 'in_person':
        return <Building className="w-4 h-4" />;
      case 'hybrid':
        return <Video className="w-4 h-4" />;
      default:
        return <MapPin className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'upcoming':
        return 'text-blue-600';
      case 'ongoing':
        return 'text-green-600';
      case 'completed':
        return 'text-gray-600';
      case 'cancelled':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const filteredEvents = events.filter(event =>
    event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    event.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getRegistrationPercentage = (current: number, capacity: number) => {
    return Math.round((current / capacity) * 100);
  };

  if (loading) {
    return <div>Loading events...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Tabs for different views */}
      <Tabs defaultValue="list" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-3">
          <TabsTrigger value="list">List View</TabsTrigger>
          <TabsTrigger value="calendar">Calendar</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="space-y-6">
          {/* Filters and Actions */}
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <Input
                    type="search"
                    placeholder="Search events..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                
                <div className="flex gap-2">
                  <Select value={typeFilter} onValueChange={setTypeFilter}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Event Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="workshop">Workshop</SelectItem>
                      <SelectItem value="networking">Networking</SelectItem>
                      <SelectItem value="training">Training</SelectItem>
                      <SelectItem value="social">Social</SelectItem>
                      <SelectItem value="thrive">THRIVE</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="upcoming">Upcoming</SelectItem>
                      <SelectItem value="ongoing">Ongoing</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>

                  <Button variant="outline" size="icon">
                    <Filter className="w-4 h-4" />
                  </Button>

                  <Link href="/dashboard/admin/events/new">
                    <Button className="bg-purple-600 hover:bg-purple-700">
                      <Plus className="w-4 h-4 mr-2" />
                      Create Event
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Events Table */}
          <Card>
            <CardHeader>
              <CardTitle>Events</CardTitle>
              <CardDescription>
                {filteredEvents.length} events found
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Event</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Date & Time</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Registration</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredEvents.map((event) => {
                      const percentage = getRegistrationPercentage(
                        event.currentRegistrations,
                        event.capacity
                      );
                      
                      return (
                        <TableRow key={event.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium text-gray-900">{event.title}</p>
                              <p className="text-sm text-gray-500 line-clamp-1">
                                {event.description}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="secondary"
                              className={cn('text-xs', getEventTypeColor(event.eventType))}
                            >
                              {event.eventType}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              <div className="flex items-center space-x-1">
                                <CalendarClock className="w-4 h-4 text-gray-400" />
                                <span>{new Date(event.startTime).toLocaleDateString()}</span>
                              </div>
                              <div className="flex items-center space-x-1 text-gray-500">
                                <Clock className="w-4 h-4" />
                                <span>
                                  {new Date(event.startTime).toLocaleTimeString([], {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })}
                                </span>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              {getLocationIcon(event.locationType)}
                              <div>
                                <p className="text-sm capitalize">{event.locationType.replace('_', ' ')}</p>
                                {event.locationDetails.venue && (
                                  <p className="text-xs text-gray-500">{event.locationDetails.venue}</p>
                                )}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              <div className="flex items-center justify-between">
                                <span className="text-sm">
                                  {event.currentRegistrations}/{event.capacity}
                                </span>
                                <span className="text-xs text-gray-500">{percentage}%</span>
                              </div>
                              <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                                <div
                                  className={cn(
                                    'h-full transition-all',
                                    percentage >= 90 ? 'bg-red-500' : 
                                    percentage >= 70 ? 'bg-yellow-500' : 'bg-green-500'
                                  )}
                                  style={{ width: `${percentage}%` }}
                                />
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className={cn('text-sm font-medium', getStatusColor(event.status))}>
                              {event.status}
                            </span>
                          </TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreVertical className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem>
                                  <Eye className="w-4 h-4 mr-2" />
                                  View Details
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <Edit className="w-4 h-4 mr-2" />
                                  Edit Event
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <Users className="w-4 h-4 mr-2" />
                                  Manage Registrations
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <Download className="w-4 h-4 mr-2" />
                                  Export Attendees
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem className="text-red-600">
                                  <Trash2 className="w-4 h-4 mr-2" />
                                  Cancel Event
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="calendar">
          <Card>
            <CardContent className="p-6">
              <p className="text-gray-500">Calendar view coming soon...</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600">Total Events</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{events.length}</p>
                <p className="text-xs text-gray-500">This month</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600">Total Registrations</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">
                  {events.reduce((sum, e) => sum + e.currentRegistrations, 0)}
                </p>
                <p className="text-xs text-gray-500">Across all events</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600">Average Attendance</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">
                  {Math.round(
                    events.reduce((sum, e) => sum + (e.currentRegistrations / e.capacity) * 100, 0) / 
                    events.length
                  )}%
                </p>
                <p className="text-xs text-gray-500">Registration rate</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600">Upcoming Events</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">
                  {events.filter(e => e.status === 'upcoming').length}
                </p>
                <p className="text-xs text-gray-500">Next 30 days</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}