'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Search, 
  Download, 
  Eye, 
  FileText, 
  Video, 
  Image, 
  File,
  Lock,
  Users,
  Folder,
  BookOpen,
  ArrowRight,
  Info,
  Sparkles
} from 'lucide-react';

interface Resource {
  id: number;
  title: string;
  description: string;
  category: string;
  resourceType: string;
  fileUrl: string;
  fileSize: number;
  mimeType: string;
  thumbnailUrl?: string;
  isPublic: boolean;
  isMembersOnly: boolean;
  tags: string[];
  viewCount: number;
  downloadCount: number;
  createdAt: string;
}

export default function ResourcesPage() {
  const [resources, setResources] = useState<Resource[]>([]);
  const [categories, setCategories] = useState<{ category: string; count: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  useEffect(() => {
    fetchResources();
  }, [searchTerm, selectedCategory]);

  const fetchResources = async () => {
    try {
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (selectedCategory && selectedCategory !== 'all') {
        params.append('category', selectedCategory);
      }

      const response = await fetch(`/api/resources?${params}`);
      if (response.ok) {
        const data = await response.json();
        setResources(data.resources);
        setCategories(data.categories);
      }
    } catch (error) {
      console.error('Error fetching resources:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (resource: Resource) => {
    try {
      await fetch(`/api/resources/${resource.id}/download`, {
        method: 'POST',
      });
      window.open(resource.fileUrl, '_blank');
    } catch (error) {
      console.error('Error downloading resource:', error);
    }
  };

  const getResourceIcon = (type: string) => {
    const iconClass = "h-5 w-5";
    switch (type) {
      case 'document':
        return <FileText className={iconClass} />;
      case 'video':
        return <Video className={iconClass} />;
      case 'image':
        return <Image className={iconClass} />;
      default:
        return <File className={iconClass} />;
    }
  };

  const getResourceTypeColor = (type: string) => {
    switch (type) {
      case 'document':
        return 'bg-purple-light text-primary';
      case 'video':
        return 'bg-periwinkle-light text-periwinkle-dark';
      case 'image':
        return 'bg-mint-light text-mint-dark';
      default:
        return 'bg-accent text-foreground';
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const ResourceCard = ({ resource }: { resource: Resource }) => (
    <Card className="group hover:shadow-xl transition-all duration-300 border-border hover:border-purple-mid/30 bg-white h-full overflow-hidden">
      <CardHeader>
        <div className="flex items-start justify-between mb-2">
          <div className={`p-2 rounded-lg ${getResourceTypeColor(resource.resourceType)} flex-shrink-0`}>
            {getResourceIcon(resource.resourceType)}
          </div>
          <div className="flex gap-2">
            {!resource.isPublic && (
              <Badge className="bg-purple-light/50 text-primary border-purple-mid/20 text-xs">
                <Lock className="h-3 w-3 mr-1" />
                Private
              </Badge>
            )}
            {resource.isMembersOnly && (
              <Badge className="bg-periwinkle-light text-periwinkle-dark border-periwinkle-dark/20 text-xs">
                <Users className="h-3 w-3 mr-1" />
                Members
              </Badge>
            )}
          </div>
        </div>
        <CardTitle className="text-lg font-semibold text-navy-dark group-hover:text-primary transition-colors line-clamp-2">
          {resource.title}
        </CardTitle>
        <div className="flex items-center gap-2 mt-2">
          <Badge variant="outline" className="text-xs border-purple-mid/30 text-primary">
            {resource.category}
          </Badge>
          <span className="text-xs text-gray">
            {formatFileSize(resource.fileSize)}
          </span>
        </div>
      </CardHeader>
      <CardContent className="flex-1 space-y-4">
        {resource.description && (
          <CardDescription className="line-clamp-2 text-gray text-sm">
            {resource.description}
          </CardDescription>
        )}
        
        {resource.tags && resource.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {resource.tags.slice(0, 3).map((tag, index) => (
              <Badge key={index} className="text-xs bg-purple-light/30 text-primary border-purple-mid/20">
                {tag}
              </Badge>
            ))}
            {resource.tags.length > 3 && (
              <Badge className="text-xs bg-accent text-gray border-border">
                +{resource.tags.length - 3}
              </Badge>
            )}
          </div>
        )}

        <div className="flex items-center justify-between text-sm text-gray pt-2">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <Eye className="h-3.5 w-3.5" />
              <span className="font-medium">{resource.viewCount}</span>
            </span>
            <span className="flex items-center gap-1">
              <Download className="h-3.5 w-3.5" />
              <span className="font-medium">{resource.downloadCount}</span>
            </span>
          </div>
          <span className="text-xs">
            {new Date(resource.createdAt).toLocaleDateString()}
          </span>
        </div>
      </CardContent>
      <CardFooter className="border-t border-border bg-accent/50 p-4">
        <Button 
          onClick={() => handleDownload(resource)}
          variant="default"
          className="w-full"
          size="sm"
        >
          <Download className="h-4 w-4 mr-2" />
          Download Resource
        </Button>
      </CardFooter>
    </Card>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray">Loading resources...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-4 sm:py-6 lg:py-8 px-4 sm:px-6 lg:px-8 max-w-7xl">
      {/* Header Section */}
      <div className="mb-6 sm:mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
          <BookOpen className="h-5 w-5 sm:h-6 sm:w-6 text-primary flex-shrink-0" />
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-purple-dark to-purple-mid bg-clip-text text-transparent">
            Resource Library
          </h1>
        </div>
        <p className="text-gray text-base sm:text-lg">
          Access learning materials, guides, and resources to support your STEM journey
        </p>
      </div>

      {/* Info Alert */}
      <Alert className="mb-6 sm:mb-8 border-periwinkle-dark/20 bg-periwinkle-light/20">
        <Info className="h-4 w-4 text-periwinkle-dark" />
        <AlertDescription className="text-navy-dark">
          <strong className="font-semibold">Expand your knowledge!</strong>
          <span className="block sm:inline"> Browse our curated collection of resources, from beginner guides to advanced materials.</span>
        </AlertDescription>
      </Alert>

      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary" />
          <Input
            placeholder="Search resources..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 border-purple-mid/30 focus:border-primary focus:ring-purple-dark/20"
          />
        </div>
      </div>

      {/* Tabs Section */}
      <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="space-y-6">
        <TabsList className="flex flex-wrap h-auto bg-muted text-muted-foreground p-1">
          <TabsTrigger 
            value="all" 
            className="gap-2 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
          >
            <Folder className="h-4 w-4" />
            All ({resources.length})
          </TabsTrigger>
          {categories.map(cat => (
            <TabsTrigger 
              key={cat.category} 
              value={cat.category} 
              className="gap-2 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
            >
              <Folder className="h-4 w-4" />
              {cat.category} ({cat.count})
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value={selectedCategory} className="space-y-4">
          {resources.length === 0 ? (
            <Card className="border-purple-light shadow-sm">
              <CardContent className="text-center py-12">
                <Sparkles className="h-12 w-12 text-purple-mid mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-navy-dark mb-2">
                  {searchTerm 
                    ? `No resources found for "${searchTerm}"`
                    : 'No resources available'}
                </h3>
                <p className="text-gray">
                  {searchTerm 
                    ? 'Try adjusting your search terms'
                    : 'Check back soon for new resources!'}
                </p>
                {searchTerm && (
                  <Button 
                    onClick={() => setSearchTerm('')}
                    variant="outline"
                    className="mt-4 border-purple-mid/30 text-primary hover:bg-purple-light"
                    size="sm"
                  >
                    Clear Search
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {resources.map(resource => (
                <ResourceCard key={resource.id} resource={resource} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}