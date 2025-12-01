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
import { 
  Search, 
  Filter, 
  Download,
  Mail,
  Phone,
  MapPin,
  Briefcase,
  Calendar,
  Star,
  Users,
  Clock,
  CheckCircle,
  Shield,
  Award,
  MessageSquare,
  MoreVertical,
  Eye,
  Edit,
  Ban
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const mockMentors = [
  {
    id: 1,
    name: 'Dr. Sarah Johnson',
    email: 'sarah.johnson@techcorp.com',
    phone: '+1 (555) 123-4567',
    location: 'San Francisco, CA',
    company: 'TechCorp Inc.',
    role: 'Senior Engineering Manager',
    expertise: ['Cloud Architecture', 'Team Leadership', 'Product Strategy'],
    verifiedDate: '2024-01-15',
    rating: 4.8,
    activeMentees: 3,
    totalMentees: 28,
    sessionsCompleted: 145,
    nextAvailable: '2024-12-22',
    status: 'active',
    responseTime: '< 24 hours',
    avatar: null
  },
  {
    id: 2,
    name: 'Emily Chen',
    email: 'emily.chen@innovate.io',
    phone: '+1 (555) 234-5678',
    location: 'Seattle, WA',
    company: 'Innovate.io',
    role: 'VP of Engineering',
    expertise: ['Machine Learning', 'Data Science', 'Python'],
    verifiedDate: '2023-11-20',
    rating: 4.9,
    activeMentees: 2,
    totalMentees: 42,
    sessionsCompleted: 210,
    nextAvailable: '2024-12-21',
    status: 'active',
    responseTime: '< 12 hours',
    avatar: null
  },
  {
    id: 3,
    name: 'Jessica Martinez',
    email: 'jessica.m@designstudio.com',
    phone: '+1 (555) 345-6789',
    location: 'Austin, TX',
    company: 'Design Studio Pro',
    role: 'Creative Director',
    expertise: ['UX Design', 'Product Design', 'Design Systems'],
    verifiedDate: '2024-02-10',
    rating: 4.7,
    activeMentees: 4,
    totalMentees: 35,
    sessionsCompleted: 168,
    nextAvailable: '2024-12-23',
    status: 'busy',
    responseTime: '< 48 hours',
    avatar: null
  },
  {
    id: 4,
    name: 'Dr. Rachel Williams',
    email: 'rachel.w@biotech.com',
    phone: '+1 (555) 456-7890',
    location: 'Boston, MA',
    company: 'BioTech Solutions',
    role: 'Research Director',
    expertise: ['Biotechnology', 'Research Methods', 'Scientific Writing'],
    verifiedDate: '2023-09-05',
    rating: 5.0,
    activeMentees: 1,
    totalMentees: 22,
    sessionsCompleted: 98,
    nextAvailable: '2024-12-20',
    status: 'active',
    responseTime: '< 24 hours',
    avatar: null
  },
  {
    id: 5,
    name: 'Maria Rodriguez',
    email: 'maria.r@fintech.com',
    phone: '+1 (555) 567-8901',
    location: 'New York, NY',
    company: 'FinTech Innovations',
    role: 'Chief Data Officer',
    expertise: ['Financial Technology', 'Risk Analysis', 'Blockchain'],
    verifiedDate: '2024-03-12',
    rating: 4.6,
    activeMentees: 0,
    totalMentees: 18,
    sessionsCompleted: 76,
    nextAvailable: '2024-12-20',
    status: 'paused',
    responseTime: 'N/A',
    avatar: null
  }
];

export default function VerifiedMentorsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [expertiseFilter, setExpertiseFilter] = useState('all');
  const [sortBy, setSortBy] = useState('name');

  const getStatusBadge = (status: string) => {
    const variants = {
      active: { text: 'Active', className: 'bg-green-100 text-green-800' },
      busy: { text: 'Busy', className: 'bg-yellow-100 text-yellow-800' },
      paused: { text: 'Paused', className: 'bg-accent text-foreground' },
    };
    const variant = variants[status as keyof typeof variants];
    return <Badge className={variant.className}>{variant.text}</Badge>;
  };

  const filteredMentors = mockMentors.filter(mentor => {
    const matchesSearch = 
      mentor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      mentor.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      mentor.company.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || mentor.status === statusFilter;
    const matchesExpertise = expertiseFilter === 'all' || 
      mentor.expertise.some(e => e.toLowerCase().includes(expertiseFilter.toLowerCase()));
    return matchesSearch && matchesStatus && matchesExpertise;
  });

  return (
    <div className="container mx-auto px-4 py-6 md:px-6 lg:px-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Verified Mentors</h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-2">
            Manage and monitor verified mentors in the program
          </p>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
          <Button variant="outline" className="text-sm sm:text-base">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Button className="text-sm sm:text-base">
            <Mail className="w-4 h-4 mr-2" />
            Send Announcement
          </Button>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 md:gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Verified</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <p className="text-2xl font-bold">85</p>
              <Shield className="w-8 h-8 text-primary" />
            </div>
            <p className="text-xs text-muted-foreground mt-2">+5 this month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Mentors</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <p className="text-2xl font-bold text-green-600">72</p>
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <p className="text-xs text-muted-foreground mt-2">84.7% active rate</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Avg Rating</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <p className="text-2xl font-bold">4.8</p>
              <Star className="w-8 h-8 text-yellow-500 fill-yellow-500" />
            </div>
            <p className="text-xs text-muted-foreground mt-2">From 1,247 reviews</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Sessions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <p className="text-2xl font-bold">3,842</p>
              <MessageSquare className="w-8 h-8 text-blue-600" />
            </div>
            <p className="text-xs text-muted-foreground mt-2">This year</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
              <Input
                type="search"
                placeholder="Search by name, email, or company..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="busy">Busy</SelectItem>
                <SelectItem value="paused">Paused</SelectItem>
              </SelectContent>
            </Select>

            <Select value={expertiseFilter} onValueChange={setExpertiseFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="All Expertise" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Expertise</SelectItem>
                <SelectItem value="cloud">Cloud Architecture</SelectItem>
                <SelectItem value="data">Data Science</SelectItem>
                <SelectItem value="design">Design</SelectItem>
                <SelectItem value="engineering">Engineering</SelectItem>
                <SelectItem value="product">Product</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Sort By" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name">Name</SelectItem>
                <SelectItem value="rating">Rating</SelectItem>
                <SelectItem value="mentees">Active Mentees</SelectItem>
                <SelectItem value="sessions">Total Sessions</SelectItem>
              </SelectContent>
            </Select>

            <Button variant="outline" size="icon">
              <Filter className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Mentors Table */}
      <Card>
        <CardHeader>
          <CardTitle>Mentor Directory</CardTitle>
          <CardDescription>
            {filteredMentors.length} verified mentors
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Mentor</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Expertise</TableHead>
                  <TableHead>Metrics</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
              {filteredMentors.map((mentor) => (
                <TableRow key={mentor.id}>
                  <TableCell>
                    <div className="flex items-center space-x-3">
                      <Avatar>
                        <AvatarImage src={mentor.avatar || ''} />
                        <AvatarFallback>
                          {mentor.name.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{mentor.name}</p>
                        <p className="text-sm text-muted-foreground">{mentor.role}</p>
                        <p className="text-xs text-muted-foreground">{mentor.company}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1 text-sm">
                      <div className="flex items-center space-x-1 text-muted-foreground">
                        <Mail className="w-3 h-3" />
                        <span className="text-xs">{mentor.email}</span>
                      </div>
                      <div className="flex items-center space-x-1 text-muted-foreground">
                        <Phone className="w-3 h-3" />
                        <span className="text-xs">{mentor.phone}</span>
                      </div>
                      <div className="flex items-center space-x-1 text-muted-foreground">
                        <MapPin className="w-3 h-3" />
                        <span className="text-xs">{mentor.location}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {mentor.expertise.slice(0, 2).map(skill => (
                        <Badge key={skill} variant="secondary" className="text-xs">
                          {skill}
                        </Badge>
                      ))}
                      {mentor.expertise.length > 2 && (
                        <Badge variant="outline" className="text-xs">
                          +{mentor.expertise.length - 2}
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1 text-sm">
                      <div className="flex items-center space-x-2">
                        <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                        <span className="font-medium">{mentor.rating}</span>
                      </div>
                      <div className="flex items-center space-x-2 text-muted-foreground">
                        <Users className="w-3 h-3" />
                        <span className="text-xs">{mentor.activeMentees} active / {mentor.totalMentees} total</span>
                      </div>
                      <div className="flex items-center space-x-2 text-muted-foreground">
                        <Clock className="w-3 h-3" />
                        <span className="text-xs">{mentor.responseTime}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-2">
                      {getStatusBadge(mentor.status)}
                      <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                        <Award className="w-3 h-3" />
                        <span>Since {new Date(mentor.verifiedDate).toLocaleDateString()}</span>
                      </div>
                    </div>
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
                          View Profile
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Edit className="w-4 h-4 mr-2" />
                          Edit Details
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <MessageSquare className="w-4 h-4 mr-2" />
                          Send Message
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-red-600">
                          <Ban className="w-4 h-4 mr-2" />
                          Suspend Mentor
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