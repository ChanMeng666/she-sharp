'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Download, 
  FileText, 
  Video, 
  Image, 
  File,
  Calendar,
  Clock,
  ExternalLink,
  Folder,
  BookOpen,
  ArrowRight,
  Info,
  Sparkles,
  Eye,
  FolderOpen
} from 'lucide-react';
import { format } from 'date-fns';

interface DownloadedResource {
  id: number;
  resourceId: number;
  downloadedAt: string;
  resource: {
    title: string;
    description: string;
    category: string;
    resourceType: string;
    fileUrl: string;
    fileSize: number;
    mimeType: string;
  };
}

export default function MyDownloadsPage() {
  const [downloads, setDownloads] = useState<DownloadedResource[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('recent');

  useEffect(() => {
    fetchDownloads();
  }, []);

  const fetchDownloads = async () => {
    try {
      // For now, we'll simulate this with local storage since we don't have a downloads API yet
      const mockDownloads: DownloadedResource[] = [
        {
          id: 1,
          resourceId: 1,
          downloadedAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
          resource: {
            title: 'Getting Started with Python',
            description: 'A comprehensive guide to Python programming for beginners',
            category: 'Programming',
            resourceType: 'document',
            fileUrl: '/resources/python-guide.pdf',
            fileSize: 2457600,
            mimeType: 'application/pdf',
          },
        },
        {
          id: 2,
          resourceId: 2,
          downloadedAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
          resource: {
            title: 'Data Science Fundamentals',
            description: 'Learn the basics of data science and machine learning',
            category: 'Data Science',
            resourceType: 'video',
            fileUrl: '/resources/ds-fundamentals.mp4',
            fileSize: 15728640,
            mimeType: 'video/mp4',
          },
        },
        {
          id: 3,
          resourceId: 3,
          downloadedAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
          resource: {
            title: 'Cloud Architecture Best Practices',
            description: 'Essential patterns and practices for cloud-native applications',
            category: 'Cloud Computing',
            resourceType: 'document',
            fileUrl: '/resources/cloud-architecture.pdf',
            fileSize: 3145728,
            mimeType: 'application/pdf',
          },
        },
      ];
      setDownloads(mockDownloads);
    } catch (error) {
      console.error('Error fetching downloads:', error);
    } finally {
      setLoading(false);
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
    return 'bg-muted text-foreground';
  };

  const getCategoryColor = (category: string) => {
    return 'bg-muted text-foreground border-border';
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const getTimeAgo = (date: string) => {
    const now = new Date();
    const downloadDate = new Date(date);
    const diffInMs = now.getTime() - downloadDate.getTime();
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    if (diffInHours < 24) {
      return 'Today';
    } else if (diffInDays === 1) {
      return 'Yesterday';
    } else if (diffInDays < 7) {
      return `${diffInDays} days ago`;
    } else if (diffInDays < 30) {
      const weeks = Math.floor(diffInDays / 7);
      return `${weeks} week${weeks !== 1 ? 's' : ''} ago`;
    } else {
      return format(downloadDate, 'MMM d, yyyy');
    }
  };

  const handleRedownload = (resource: any) => {
    window.open(resource.fileUrl, '_blank');
  };

  // Group downloads by time period
  const groupedDownloads = {
    recent: downloads.filter(d => {
      const days = Math.floor((new Date().getTime() - new Date(d.downloadedAt).getTime()) / (1000 * 60 * 60 * 24));
      return days < 7;
    }),
    older: downloads.filter(d => {
      const days = Math.floor((new Date().getTime() - new Date(d.downloadedAt).getTime()) / (1000 * 60 * 60 * 24));
      return days >= 7;
    }),
  };

  const DownloadCard = ({ download }: { download: DownloadedResource }) => (
    <Card className="group hover:shadow-xl transition-all duration-300 border-border bg-background h-full overflow-hidden">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <div className={`p-2 rounded-lg ${getResourceTypeColor(download.resource.resourceType)} flex-shrink-0`}>
              {getResourceIcon(download.resource.resourceType)}
            </div>
            <div className="flex-1 min-w-0">
              <CardTitle className="text-lg font-semibold text-foreground group-hover:text-foreground transition-colors line-clamp-1">
                {download.resource.title}
              </CardTitle>
              <div className="flex flex-wrap items-center gap-2 mt-2">
                <Badge className={`${getCategoryColor(download.resource.category)} text-xs font-medium`}>
                  {download.resource.category}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {formatFileSize(download.resource.fileSize)}
                </span>
                <span className="text-xs text-foreground font-medium">
                  • {getTimeAgo(download.downloadedAt)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-1 space-y-4">
        {download.resource.description && (
          <CardDescription className="line-clamp-2 text-muted-foreground text-sm">
            {download.resource.description}
          </CardDescription>
        )}
        
        <div className="pt-2 border-t border-border">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Download className="h-3.5 w-3.5 text-foreground" />
            <span>Downloaded on {format(new Date(download.downloadedAt), 'PPP')} at {format(new Date(download.downloadedAt), 'p')}</span>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 pt-4">
          <Button
            onClick={() => handleRedownload(download.resource)}
            variant="default"
            className="min-w-[120px]"
            size="sm"
          >
            <Download className="h-4 w-4 mr-2" />
            Download Again
          </Button>
          <Button
            variant="outline"
            onClick={() => window.location.href = `/dashboard/resources/${download.resourceId}`}
            className="min-w-[120px]"
            size="sm"
          >
            View Details
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading your downloads...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-4 sm:py-6 lg:py-8 px-4 sm:px-6 lg:px-8 max-w-7xl">
      {/* Header Section */}
      <div className="mb-6 sm:mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
          <FolderOpen className="h-5 w-5 sm:h-6 sm:w-6 text-foreground flex-shrink-0" />
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground">
            My Downloads
          </h1>
        </div>
        <p className="text-muted-foreground text-base sm:text-lg">
          Access your previously downloaded resources anytime
        </p>
      </div>

      {/* Info Alert */}
      {downloads.length > 0 && (
        <Alert className="mb-6 sm:mb-8 border-border bg-muted">
          <Info className="h-4 w-4 text-foreground" />
          <AlertDescription className="text-foreground">
            <strong className="font-semibold">You have {downloads.length} downloaded resource{downloads.length !== 1 ? 's' : ''}!</strong>
            <span className="block sm:inline"> All your downloads are stored locally for quick access.</span>
          </AlertDescription>
        </Alert>
      )}

      {/* Tabs Section */}
      {downloads.length === 0 ? (
        <Card className="border-border shadow-sm">
          <CardContent className="text-center py-12">
            <Sparkles className="h-12 w-12 text-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">No downloads yet</h3>
            <p className="text-muted-foreground mb-6">
              Resources you download will appear here for easy access
            </p>
            <Button 
              onClick={() => window.location.href = '/dashboard/resources'}
              variant="default"
              size="sm"
            >
              Browse Resources
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full max-w-xs grid-cols-2 bg-muted text-muted-foreground p-1">
            <TabsTrigger 
              value="recent"
              className="data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
            >
              Recent ({groupedDownloads.recent.length})
            </TabsTrigger>
            <TabsTrigger 
              value="all"
              className="data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
            >
              All ({downloads.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="recent" className="space-y-4">
            {groupedDownloads.recent.length === 0 ? (
              <Card className="border-border shadow-sm">
                <CardContent className="text-center py-12">
                  <Clock className="h-12 w-12 text-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">No recent downloads</h3>
                  <p className="text-muted-foreground">Downloads from the past week will appear here</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {groupedDownloads.recent.map(download => (
                  <DownloadCard key={download.id} download={download} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="all" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {downloads.map(download => (
                <DownloadCard key={download.id} download={download} />
              ))}
            </div>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}