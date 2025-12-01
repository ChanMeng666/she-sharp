'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Search, 
  Filter, 
  Download,
  Upload,
  Calendar,
  Clock,
  MapPin,
  Users,
  UserCheck,
  UserX,
  Mail,
  Phone,
  Ticket,
  CreditCard,
  CheckCircle,
  XCircle,
  AlertCircle,
  MoreVertical,
  Eye,
  Edit,
  Trash2,
  Send,
  QrCode,
  FileText
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const mockRegistrations = [
  {
    id: 'REG-001',
    eventName: 'Cloud Architecture Workshop',
    eventDate: '2024-12-28T14:00:00Z',
    eventLocation: 'Tech Hub, San Francisco',
    attendee: {
      name: 'Alice Thompson',
      email: 'alice.t@example.com',
      phone: '+1 (555) 123-4567',
      avatar: null,
      memberStatus: 'member'
    },
    registrationDate: '2024-12-10T10:30:00Z',
    status: 'confirmed',
    paymentStatus: 'paid',
    amount: 45.00,
    ticketType: 'Regular',
    checkedIn: false,
    dietaryRestrictions: 'Vegetarian',
    specialNeeds: null
  },
  {
    id: 'REG-002',
    eventName: 'Cloud Architecture Workshop',
    eventDate: '2024-12-28T14:00:00Z',
    eventLocation: 'Tech Hub, San Francisco',
    attendee: {
      name: 'Bob Wilson',
      email: 'bob.w@example.com',
      phone: '+1 (555) 234-5678',
      avatar: null,
      memberStatus: 'non-member'
    },
    registrationDate: '2024-12-12T14:20:00Z',
    status: 'waitlist',
    paymentStatus: 'pending',
    amount: 65.00,
    ticketType: 'Non-Member',
    checkedIn: false,
    dietaryRestrictions: null,
    specialNeeds: 'Wheelchair access'
  },
  {
    id: 'REG-003',
    eventName: 'Women in Tech Networking',
    eventDate: '2024-12-22T18:00:00Z',
    eventLocation: 'Online',
    attendee: {
      name: 'Carol Davis',
      email: 'carol.d@example.com',
      phone: '+1 (555) 345-6789',
      avatar: null,
      memberStatus: 'member'
    },
    registrationDate: '2024-12-08T09:15:00Z',
    status: 'confirmed',
    paymentStatus: 'free',
    amount: 0,
    ticketType: 'Member Free',
    checkedIn: true,
    dietaryRestrictions: null,
    specialNeeds: null
  },
  {
    id: 'REG-004',
    eventName: 'AI/ML Career Panel',
    eventDate: '2024-12-30T16:00:00Z',
    eventLocation: 'Innovation Center, Seattle',
    attendee: {
      name: 'Diana Lee',
      email: 'diana.l@example.com',
      phone: '+1 (555) 456-7890',
      avatar: null,
      memberStatus: 'member'
    },
    registrationDate: '2024-12-15T11:45:00Z',
    status: 'confirmed',
    paymentStatus: 'paid',
    amount: 35.00,
    ticketType: 'Early Bird',
    checkedIn: false,
    dietaryRestrictions: 'Gluten-free',
    specialNeeds: null
  },
  {
    id: 'REG-005',
    eventName: 'AI/ML Career Panel',
    eventDate: '2024-12-30T16:00:00Z',
    eventLocation: 'Innovation Center, Seattle',
    attendee: {
      name: 'Eve Brown',
      email: 'eve.b@example.com',
      phone: '+1 (555) 567-8901',
      avatar: null,
      memberStatus: 'non-member'
    },
    registrationDate: '2024-12-18T16:30:00Z',
    status: 'cancelled',
    paymentStatus: 'refunded',
    amount: 55.00,
    ticketType: 'Regular',
    checkedIn: false,
    dietaryRestrictions: null,
    specialNeeds: null
  }
];

const upcomingEvents = [
  { name: 'Cloud Architecture Workshop', date: '2024-12-28', registrations: 42, capacity: 50 },
  { name: 'Women in Tech Networking', date: '2024-12-22', registrations: 78, capacity: 100 },
  { name: 'AI/ML Career Panel', date: '2024-12-30', registrations: 35, capacity: 75 },
];

export default function EventRegistrationsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [eventFilter, setEventFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedRegistrations, setSelectedRegistrations] = useState<string[]>([]);

  const getStatusBadge = (status: string) => {
    const variants = {
      confirmed: { text: 'Confirmed', className: 'bg-green-100 text-green-800' },
      waitlist: { text: 'Waitlist', className: 'bg-yellow-100 text-yellow-800' },
      cancelled: { text: 'Cancelled', className: 'bg-red-100 text-red-800' },
      pending: { text: 'Pending', className: 'bg-accent text-foreground' },
    };
    const variant = variants[status as keyof typeof variants];
    return <Badge className={variant?.className}>{variant?.text || status}</Badge>;
  };

  const getPaymentBadge = (status: string) => {
    const variants = {
      paid: { text: 'Paid', className: 'bg-green-100 text-green-800', icon: CheckCircle },
      pending: { text: 'Pending', className: 'bg-yellow-100 text-yellow-800', icon: Clock },
      refunded: { text: 'Refunded', className: 'bg-accent text-foreground', icon: XCircle },
      free: { text: 'Free', className: 'bg-blue-100 text-blue-800', icon: Ticket },
    };
    const variant = variants[status as keyof typeof variants];
    const Icon = variant?.icon || AlertCircle;
    return (
      <Badge className={variant?.className}>
        <Icon className="w-3 h-3 mr-1" />
        {variant?.text || status}
      </Badge>
    );
  };

  const filteredRegistrations = mockRegistrations.filter(reg => {
    const matchesSearch = 
      reg.attendee.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      reg.attendee.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      reg.eventName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesEvent = eventFilter === 'all' || reg.eventName === eventFilter;
    const matchesStatus = statusFilter === 'all' || reg.status === statusFilter;
    return matchesSearch && matchesEvent && matchesStatus;
  });

  const toggleRegistration = (id: string) => {
    setSelectedRegistrations(prev => 
      prev.includes(id) ? prev.filter(r => r !== id) : [...prev, id]
    );
  };

  const toggleAllRegistrations = () => {
    if (selectedRegistrations.length === filteredRegistrations.length) {
      setSelectedRegistrations([]);
    } else {
      setSelectedRegistrations(filteredRegistrations.map(r => r.id));
    }
  };

  return (
    <div className="container mx-auto px-4 py-6 md:px-6 lg:px-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Event Registrations</h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-2">
            Manage attendee registrations and check-ins
          </p>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
          <Button variant="outline" className="text-sm sm:text-base">
            <Upload className="w-4 h-4 mr-2" />
            Import
          </Button>
          <Button variant="outline" className="text-sm sm:text-base">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Button className="text-sm sm:text-base">
            <QrCode className="w-4 h-4 mr-2" />
            Check-In Mode
          </Button>
        </div>
      </div>

      {/* Upcoming Events Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
        {upcomingEvents.map((event) => (
          <Card key={event.name}>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">{event.name}</CardTitle>
              <CardDescription className="text-xs">
                <Calendar className="w-3 h-3 inline mr-1" />
                {new Date(event.date).toLocaleDateString()}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Registrations</span>
                  <span className="text-sm font-medium">{event.registrations}/{event.capacity}</span>
                </div>
                <Progress value={(event.registrations / event.capacity) * 100} className="h-2" />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{event.capacity - event.registrations} spots left</span>
                  <span>{Math.round((event.registrations / event.capacity) * 100)}% full</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 md:gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Registrations</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">487</p>
            <p className="text-xs text-muted-foreground mt-2">Across 12 events</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Check-In Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">78%</p>
            <p className="text-xs text-muted-foreground mt-2">Last 30 days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Waitlist</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-yellow-600">23</p>
            <p className="text-xs text-muted-foreground mt-2">Pending confirmation</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">$8,450</p>
            <p className="text-xs text-muted-foreground mt-2">This month</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Actions */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
              <Input
                type="search"
                placeholder="Search by name, email, or event..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={eventFilter} onValueChange={setEventFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="All Events" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Events</SelectItem>
                <SelectItem value="Cloud Architecture Workshop">Cloud Architecture Workshop</SelectItem>
                <SelectItem value="Women in Tech Networking">Women in Tech Networking</SelectItem>
                <SelectItem value="AI/ML Career Panel">AI/ML Career Panel</SelectItem>
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="waitlist">Waitlist</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>

            <Button variant="outline" size="icon">
              <Filter className="w-4 h-4" />
            </Button>
          </div>

          {selectedRegistrations.length > 0 && (
            <div className="flex items-center gap-4 mt-4 p-3 bg-muted rounded-lg">
              <span className="text-sm text-foreground">
                {selectedRegistrations.length} registration(s) selected
              </span>
              <div className="flex gap-2">
                <Button size="sm" variant="outline">
                  <Mail className="w-4 h-4 mr-2" />
                  Send Email
                </Button>
                <Button size="sm" variant="outline">
                  <UserCheck className="w-4 h-4 mr-2" />
                  Confirm
                </Button>
                <Button size="sm" variant="outline" className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700 hover:border-red-300">
                  <UserX className="w-4 h-4 mr-2" />
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Registrations Table */}
      <Card>
        <CardHeader>
          <CardTitle>Registration List</CardTitle>
          <CardDescription>
            {filteredRegistrations.length} registrations found
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={selectedRegistrations.length === filteredRegistrations.length}
                      onCheckedChange={toggleAllRegistrations}
                    />
                  </TableHead>
                  <TableHead>Registration ID</TableHead>
                  <TableHead>Attendee</TableHead>
                  <TableHead>Event</TableHead>
                  <TableHead>Registration</TableHead>
                  <TableHead>Payment</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
              {filteredRegistrations.map((registration) => (
                <TableRow key={registration.id}>
                  <TableCell>
                    <Checkbox 
                      checked={selectedRegistrations.includes(registration.id)}
                      onCheckedChange={() => toggleRegistration(registration.id)}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <p className="font-medium text-sm">{registration.id}</p>
                      {registration.checkedIn && (
                        <Badge className="bg-green-100 text-green-800 text-xs">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Checked In
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-3">
                      <Avatar className="w-8 h-8">
                        <AvatarImage src={registration.attendee.avatar || ''} />
                        <AvatarFallback className="text-xs">
                          {registration.attendee.name.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-sm">{registration.attendee.name}</p>
                        <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                          <Mail className="w-3 h-3" />
                          <span>{registration.attendee.email}</span>
                        </div>
                        {registration.attendee.memberStatus === 'member' && (
                          <Badge variant="secondary" className="text-xs mt-1">Member</Badge>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <p className="font-medium text-sm">{registration.eventName}</p>
                      <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                        <Calendar className="w-3 h-3" />
                        <span>{new Date(registration.eventDate).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                        <MapPin className="w-3 h-3" />
                        <span>{registration.eventLocation}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <p className="text-sm">{registration.ticketType}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(registration.registrationDate).toLocaleDateString()}
                      </p>
                      {(registration.dietaryRestrictions || registration.specialNeeds) && (
                        <div title="Has special requirements">
                          <FileText className="w-3 h-3 text-yellow-600" />
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-2">
                      {getPaymentBadge(registration.paymentStatus)}
                      {registration.amount > 0 && (
                        <p className="text-sm font-medium">${registration.amount.toFixed(2)}</p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(registration.status)}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="icon">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <Eye className="w-4 h-4 mr-2" />
                          View Details
                        </DropdownMenuItem>
                        {!registration.checkedIn && registration.status === 'confirmed' && (
                          <DropdownMenuItem>
                            <UserCheck className="w-4 h-4 mr-2" />
                            Check In
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem>
                          <Mail className="w-4 h-4 mr-2" />
                          Send Email
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Edit className="w-4 h-4 mr-2" />
                          Edit Registration
                        </DropdownMenuItem>
                        {registration.paymentStatus === 'paid' && (
                          <DropdownMenuItem>
                            <CreditCard className="w-4 h-4 mr-2" />
                            Process Refund
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-red-600">
                          <Trash2 className="w-4 h-4 mr-2" />
                          Cancel Registration
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}