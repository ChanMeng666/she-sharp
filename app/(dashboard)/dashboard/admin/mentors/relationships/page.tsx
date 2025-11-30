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
import { 
  Search, 
  Filter, 
  Download,
  Users,
  Calendar,
  Clock,
  Target,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  XCircle,
  MessageSquare,
  Video,
  FileText,
  BarChart,
  Link2,
  MoreVertical,
  Eye,
  Edit,
  Trash2,
  Send
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const mockRelationships = [
  {
    id: 1,
    mentor: {
      name: 'Dr. Sarah Johnson',
      email: 'sarah.johnson@techcorp.com',
      avatar: null,
      expertise: 'Cloud Architecture'
    },
    mentee: {
      name: 'Alice Thompson',
      email: 'alice.t@example.com',
      avatar: null,
      level: 'Junior Developer'
    },
    startDate: '2024-09-15',
    status: 'active',
    progress: 65,
    sessionsCompleted: 8,
    totalSessions: 12,
    nextSession: '2024-12-22T14:00:00Z',
    goals: ['Learn AWS', 'System Design', 'Career Growth'],
    communicationFrequency: 'Weekly',
    satisfactionScore: 4.8,
    lastActivity: '2024-12-19T10:30:00Z'
  },
  {
    id: 2,
    mentor: {
      name: 'Emily Chen',
      email: 'emily.chen@innovate.io',
      avatar: null,
      expertise: 'Machine Learning'
    },
    mentee: {
      name: 'Bob Wilson',
      email: 'bob.w@example.com',
      avatar: null,
      level: 'Data Analyst'
    },
    startDate: '2024-10-01',
    status: 'active',
    progress: 42,
    sessionsCompleted: 5,
    totalSessions: 12,
    nextSession: '2024-12-21T15:00:00Z',
    goals: ['Python Mastery', 'ML Fundamentals', 'Project Portfolio'],
    communicationFrequency: 'Bi-weekly',
    satisfactionScore: 4.9,
    lastActivity: '2024-12-18T14:20:00Z'
  },
  {
    id: 3,
    mentor: {
      name: 'Jessica Martinez',
      email: 'jessica.m@designstudio.com',
      avatar: null,
      expertise: 'UX Design'
    },
    mentee: {
      name: 'Carol Davis',
      email: 'carol.d@example.com',
      avatar: null,
      level: 'UI Designer'
    },
    startDate: '2024-08-20',
    status: 'at_risk',
    progress: 25,
    sessionsCompleted: 3,
    totalSessions: 12,
    nextSession: null,
    goals: ['Design Systems', 'User Research', 'Portfolio Review'],
    communicationFrequency: 'Monthly',
    satisfactionScore: 3.2,
    lastActivity: '2024-12-01T09:15:00Z'
  },
  {
    id: 4,
    mentor: {
      name: 'Dr. Rachel Williams',
      email: 'rachel.w@biotech.com',
      avatar: null,
      expertise: 'Biotechnology'
    },
    mentee: {
      name: 'Diana Lee',
      email: 'diana.l@example.com',
      avatar: null,
      level: 'Research Assistant'
    },
    startDate: '2024-07-10',
    status: 'completed',
    progress: 100,
    sessionsCompleted: 12,
    totalSessions: 12,
    nextSession: null,
    goals: ['Research Methods', 'Paper Writing', 'PhD Preparation'],
    communicationFrequency: 'Weekly',
    satisfactionScore: 5.0,
    lastActivity: '2024-12-15T16:45:00Z'
  },
  {
    id: 5,
    mentor: {
      name: 'Maria Rodriguez',
      email: 'maria.r@fintech.com',
      avatar: null,
      expertise: 'Financial Technology'
    },
    mentee: {
      name: 'Eve Brown',
      email: 'eve.b@example.com',
      avatar: null,
      level: 'Business Analyst'
    },
    startDate: '2024-11-01',
    status: 'paused',
    progress: 33,
    sessionsCompleted: 4,
    totalSessions: 12,
    nextSession: null,
    goals: ['Blockchain Basics', 'Risk Analysis', 'Product Management'],
    communicationFrequency: 'Weekly',
    satisfactionScore: 4.5,
    lastActivity: '2024-12-10T11:00:00Z'
  }
];

export default function MentorRelationshipsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('recent');

  const getStatusBadge = (status: string) => {
    const variants = {
      active: { text: 'Active', className: 'bg-green-100 text-green-800', icon: CheckCircle },
      at_risk: { text: 'At Risk', className: 'bg-yellow-100 text-yellow-800', icon: AlertCircle },
      paused: { text: 'Paused', className: 'bg-accent text-foreground', icon: Clock },
      completed: { text: 'Completed', className: 'bg-blue-100 text-blue-800', icon: Target },
    };
    const variant = variants[status as keyof typeof variants];
    const Icon = variant.icon;
    return (
      <Badge className={variant.className}>
        <Icon className="w-3 h-3 mr-1" />
        {variant.text}
      </Badge>
    );
  };

  const getProgressColor = (progress: number) => {
    if (progress >= 75) return 'bg-green-600';
    if (progress >= 50) return 'bg-blue-600';
    if (progress >= 25) return 'bg-yellow-600';
    return 'bg-red-600';
  };

  const filteredRelationships = mockRelationships.filter(rel => {
    const matchesSearch = 
      rel.mentor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rel.mentee.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rel.mentor.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rel.mentee.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || rel.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="container mx-auto px-4 py-6 md:px-6 lg:px-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Mentorship Relationships</h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-2">
            Track and manage active mentor-mentee pairings
          </p>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
          <Button variant="outline" className="text-sm sm:text-base">
            <Download className="w-4 h-4 mr-2" />
            Export Report
          </Button>
          <Button variant="default" className="text-sm sm:text-base">
            <Link2 className="w-4 h-4 mr-2" />
            New Pairing
          </Button>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 md:gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Active</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">127</p>
            <div className="flex items-center mt-2">
              <TrendingUp className="w-4 h-4 text-green-600 mr-1" />
              <span className="text-xs text-green-600">+12% vs last month</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">At Risk</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-yellow-600">8</p>
            <p className="text-xs text-muted-foreground mt-2">Need attention</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Avg Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">58%</p>
            <Progress value={58} className="mt-2 h-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Satisfaction</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">4.6</p>
            <p className="text-xs text-muted-foreground mt-2">Out of 5.0</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Sessions/Month</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">342</p>
            <p className="text-xs text-muted-foreground mt-2">Avg 2.7 per pair</p>
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
                placeholder="Search by mentor or mentee name/email..."
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
                <SelectItem value="at_risk">At Risk</SelectItem>
                <SelectItem value="paused">Paused</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Sort By" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recent">Most Recent</SelectItem>
                <SelectItem value="progress">Progress</SelectItem>
                <SelectItem value="satisfaction">Satisfaction</SelectItem>
                <SelectItem value="activity">Last Activity</SelectItem>
              </SelectContent>
            </Select>

            <Button variant="outline" size="icon">
              <Filter className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Relationships Table */}
      <Card>
        <CardHeader>
          <CardTitle>Active Relationships</CardTitle>
          <CardDescription>
            {filteredRelationships.length} relationships found
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Mentor</TableHead>
                  <TableHead>Mentee</TableHead>
                  <TableHead>Progress & Goals</TableHead>
                  <TableHead>Activity</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
              {filteredRelationships.map((relationship) => (
                <TableRow key={relationship.id}>
                  <TableCell>
                    <div className="flex items-center space-x-3">
                      <Avatar className="w-8 h-8">
                        <AvatarImage src={relationship.mentor.avatar || ''} />
                        <AvatarFallback className="text-xs">
                          {relationship.mentor.name.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-sm">{relationship.mentor.name}</p>
                        <p className="text-xs text-muted-foreground">{relationship.mentor.expertise}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-3">
                      <Avatar className="w-8 h-8">
                        <AvatarImage src={relationship.mentee.avatar || ''} />
                        <AvatarFallback className="text-xs">
                          {relationship.mentee.name.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-sm">{relationship.mentee.name}</p>
                        <p className="text-xs text-muted-foreground">{relationship.mentee.level}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Progress 
                          value={relationship.progress} 
                          className="w-20 h-2"
                        />
                        <span className="text-xs font-medium">{relationship.progress}%</span>
                      </div>
                      <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                        <Target className="w-3 h-3" />
                        <span>{relationship.sessionsCompleted}/{relationship.totalSessions} sessions</span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {relationship.goals.slice(0, 2).map(goal => (
                          <Badge key={goal} variant="outline" className="text-xs">
                            {goal}
                          </Badge>
                        ))}
                        {relationship.goals.length > 2 && (
                          <Badge variant="outline" className="text-xs">
                            +{relationship.goals.length - 2}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1 text-sm">
                      <div className="flex items-center space-x-1 text-muted-foreground">
                        <Calendar className="w-3 h-3" />
                        <span className="text-xs">Started {new Date(relationship.startDate).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center space-x-1 text-muted-foreground">
                        <Clock className="w-3 h-3" />
                        <span className="text-xs">{relationship.communicationFrequency}</span>
                      </div>
                      {relationship.nextSession && (
                        <div className="flex items-center space-x-1 text-blue-600">
                          <Video className="w-3 h-3" />
                          <span className="text-xs">
                            Next: {new Date(relationship.nextSession).toLocaleDateString()}
                          </span>
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-2">
                      {getStatusBadge(relationship.status)}
                      <div className="flex items-center space-x-1 text-xs">
                        <BarChart className="w-3 h-3 text-muted-foreground" />
                        <span className="text-muted-foreground">Score: {relationship.satisfactionScore}</span>
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
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <MessageSquare className="w-4 h-4 mr-2" />
                          Send Message
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <FileText className="w-4 h-4 mr-2" />
                          View Reports
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Edit className="w-4 h-4 mr-2" />
                          Edit Pairing
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-red-600">
                          <Trash2 className="w-4 h-4 mr-2" />
                          End Relationship
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