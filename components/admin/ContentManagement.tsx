'use client';

import { useState, useEffect } from 'react';
import {
  FileText,
  Image,
  Video,
  Download,
  Upload,
  Edit,
  Trash2,
  Eye,
  MoreVertical,
  Plus,
  Search,
  Filter,
  Folder,
  File,
  Link2,
  Calendar,
  User,
  Lock,
  Unlock,
  Star,
  Archive,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

interface Resource {
  id: number;
  title: string;
  description: string;
  type: 'document' | 'video' | 'link' | 'template' | 'guide';
  category: string;
  fileSize?: number;
  url?: string;
  accessLevel: 'public' | 'member' | 'premium';
  downloads: number;
  rating: number;
  uploadedBy: string;
  uploadedAt: string;
  lastModified: string;
  tags: string[];
  status: 'published' | 'draft' | 'archived';
}

interface ContentStats {
  totalResources: number;
  totalDownloads: number;
  totalViews: number;
  storageUsed: number;
  storageLimit: number;
}

export default function ContentManagement() {
  const [resources, setResources] = useState<Resource[]>([]);
  const [stats, setStats] = useState<ContentStats | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [accessFilter, setAccessFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('resources');

  useEffect(() => {
    fetchContent();
    fetchStats();
  }, [typeFilter, accessFilter]);

  const fetchContent = async () => {
    try {
      setLoading(true);
      // Simulate API call
      setTimeout(() => {
        setResources(generateMockResources());
        setLoading(false);
      }, 500);
    } catch (error) {
      console.error('Failed to fetch content:', error);
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    // Simulate fetching stats
    setStats({
      totalResources: 256,
      totalDownloads: 3842,
      totalViews: 12567,
      storageUsed: 2.3,
      storageLimit: 10,
    });
  };

  const generateMockResources = (): Resource[] => {
    return [
      {
        id: 1,
        title: 'Getting Started with Python Programming',
        description: 'A comprehensive guide for beginners to learn Python',
        type: 'document',
        category: 'Programming',
        fileSize: 2.5,
        accessLevel: 'public',
        downloads: 453,
        rating: 4.8,
        uploadedBy: 'Sarah Johnson',
        uploadedAt: '2024-12-01',
        lastModified: '2024-12-15',
        tags: ['python', 'programming', 'beginner'],
        status: 'published',
      },
      {
        id: 2,
        title: 'Women in Tech Interview Preparation',
        description: 'Video series on technical interview preparation',
        type: 'video',
        category: 'Career Development',
        url: 'https://example.com/video1',
        accessLevel: 'member',
        downloads: 0,
        rating: 4.9,
        uploadedBy: 'Emily Chen',
        uploadedAt: '2024-12-10',
        lastModified: '2024-12-10',
        tags: ['interview', 'career', 'tech'],
        status: 'published',
      },
      {
        id: 3,
        title: 'Resume Template for Tech Roles',
        description: 'Professional resume template optimized for tech positions',
        type: 'template',
        category: 'Career Resources',
        fileSize: 0.5,
        accessLevel: 'premium',
        downloads: 234,
        rating: 4.7,
        uploadedBy: 'Jessica Martinez',
        uploadedAt: '2024-11-20',
        lastModified: '2024-12-05',
        tags: ['resume', 'template', 'career'],
        status: 'published',
      },
      {
        id: 4,
        title: 'Data Science Learning Path',
        description: 'Curated list of resources for learning data science',
        type: 'guide',
        category: 'Learning Paths',
        accessLevel: 'member',
        downloads: 567,
        rating: 4.6,
        uploadedBy: 'Admin',
        uploadedAt: '2024-11-15',
        lastModified: '2024-12-18',
        tags: ['data-science', 'learning', 'guide'],
        status: 'published',
      },
    ];
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'document':
        return <FileText className="w-4 h-4" />;
      case 'video':
        return <Video className="w-4 h-4" />;
      case 'link':
        return <Link2 className="w-4 h-4" />;
      case 'template':
        return <File className="w-4 h-4" />;
      case 'guide':
        return <Folder className="w-4 h-4" />;
      default:
        return <File className="w-4 h-4" />;
    }
  };

  const getAccessIcon = (level: string) => {
    switch (level) {
      case 'public':
        return <Unlock className="w-4 h-4 text-green-600" />;
      case 'member':
        return <Lock className="w-4 h-4 text-blue-600" />;
      case 'premium':
        return <Star className="w-4 h-4 text-yellow-600" />;
      default:
        return <Lock className="w-4 h-4" />;
    }
  };

  const formatFileSize = (size?: number) => {
    if (!size) return 'N/A';
    if (size < 1) return `${(size * 1024).toFixed(0)} KB`;
    return `${size.toFixed(1)} MB`;
  };

  const filteredResources = resources.filter(resource => {
    const matchesSearch = resource.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          resource.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = typeFilter === 'all' || resource.type === typeFilter;
    const matchesAccess = accessFilter === 'all' || resource.accessLevel === accessFilter;
    return matchesSearch && matchesType && matchesAccess;
  });

  if (loading) {
    return <div>Loading content...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Statistics Overview */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Resources</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{stats.totalResources}</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Downloads</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{stats.totalDownloads.toLocaleString()}</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Views</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{stats.totalViews.toLocaleString()}</p>
            </CardContent>
          </Card>
          
          <Card className="md:col-span-2">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Storage Usage</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>{stats.storageUsed} GB</span>
                  <span>{stats.storageLimit} GB</span>
                </div>
                <Progress value={(stats.storageUsed / stats.storageLimit) * 100} />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full max-w-full sm:max-w-md grid-cols-4">
          <TabsTrigger value="resources">Resources</TabsTrigger>
          <TabsTrigger value="media">Media</TabsTrigger>
          <TabsTrigger value="newsletters">Newsletters</TabsTrigger>
          <TabsTrigger value="blog">Blog</TabsTrigger>
        </TabsList>

        <TabsContent value="resources" className="space-y-4">
          {/* Filters and Actions */}
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
                  <Input
                    type="search"
                    placeholder="Search resources..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                
                <div className="flex gap-2">
                  <Select value={typeFilter} onValueChange={setTypeFilter}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Resource Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="document">Documents</SelectItem>
                      <SelectItem value="video">Videos</SelectItem>
                      <SelectItem value="template">Templates</SelectItem>
                      <SelectItem value="guide">Guides</SelectItem>
                      <SelectItem value="link">Links</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={accessFilter} onValueChange={setAccessFilter}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Access Level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Levels</SelectItem>
                      <SelectItem value="public">Public</SelectItem>
                      <SelectItem value="member">Members Only</SelectItem>
                      <SelectItem value="premium">Premium</SelectItem>
                    </SelectContent>
                  </Select>

                  <Button className="bg-purple-600 hover:bg-purple-700">
                    <Upload className="w-4 h-4 mr-2" />
                    Upload Resource
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Resources Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredResources.map((resource) => (
              <Card key={resource.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="flex items-start space-x-3">
                      <div className={cn(
                        "p-2 rounded-lg",
                        resource.type === 'document' && "bg-blue-100",
                        resource.type === 'video' && "bg-red-100",
                        resource.type === 'template' && "bg-green-100",
                        resource.type === 'guide' && "bg-muted",
                        resource.type === 'link' && "bg-accent"
                      )}>
                        {getTypeIcon(resource.type)}
                      </div>
                      <div className="flex-1">
                        <CardTitle className="text-base line-clamp-1">{resource.title}</CardTitle>
                        <CardDescription className="text-xs mt-1 line-clamp-2">
                          {resource.description}
                        </CardDescription>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <Eye className="w-4 h-4 mr-2" />
                          View
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Edit className="w-4 h-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Download className="w-4 h-4 mr-2" />
                          Download
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Archive className="w-4 h-4 mr-2" />
                          Archive
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-red-600">
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {/* Tags */}
                    <div className="flex flex-wrap gap-1">
                      {resource.tags.slice(0, 3).map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>

                    {/* Metadata */}
                    <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                      <div className="flex items-center space-x-1">
                        {getAccessIcon(resource.accessLevel)}
                        <span className="capitalize">{resource.accessLevel}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Download className="w-3 h-3" />
                        <span>{resource.downloads} downloads</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <User className="w-3 h-3" />
                        <span className="truncate">{resource.uploadedBy}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Calendar className="w-3 h-3" />
                        <span>{new Date(resource.uploadedAt).toLocaleDateString()}</span>
                      </div>
                    </div>

                    {/* File Size or Rating */}
                    <div className="flex justify-between items-center pt-2 border-t">
                      <span className="text-xs text-muted-foreground">
                        {resource.fileSize ? formatFileSize(resource.fileSize) : 'External'}
                      </span>
                      <div className="flex items-center space-x-1">
                        <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                        <span className="text-xs font-medium">{resource.rating}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="media">
          <Card>
            <CardContent className="p-6">
              <p className="text-muted-foreground">Media gallery management coming soon...</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="newsletters">
          <Card>
            <CardContent className="p-6">
              <p className="text-muted-foreground">Newsletter management coming soon...</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="blog">
          <Card>
            <CardContent className="p-6">
              <p className="text-muted-foreground">Blog post management coming soon...</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}