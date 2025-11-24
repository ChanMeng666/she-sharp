import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Shield, Globe, Mail, Database, Server, Bell, Lock, Save } from 'lucide-react';

export default function SystemSettingsPage() {
  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">System Configuration</h1>
        <p className="text-muted-foreground mt-2">
          Configure platform settings and preferences
        </p>
      </div>

      <Tabs defaultValue="general" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-4">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="email">Email</TabsTrigger>
          <TabsTrigger value="database">Database</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Platform Settings</CardTitle>
              <CardDescription>General configuration for the platform</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="site-name">Site Name</Label>
                <Input id="site-name" defaultValue="She Sharp" />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="site-url">Site URL</Label>
                <Input id="site-url" defaultValue="https://shesharp.org" />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="contact-email">Contact Email</Label>
                <Input id="contact-email" type="email" defaultValue="contact@shesharp.org" />
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch id="maintenance-mode" />
                <Label htmlFor="maintenance-mode">Maintenance Mode</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch id="registration" defaultChecked />
                <Label htmlFor="registration">Allow New Registrations</Label>
              </div>
              
              <Button className="bg-purple-600 hover:bg-purple-700">
                <Save className="w-4 h-4 mr-2" />
                Save Changes
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Security Settings</CardTitle>
              <CardDescription>Configure security and authentication settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <Switch id="two-factor" defaultChecked />
                <Label htmlFor="two-factor">Require Two-Factor Authentication for Admins</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch id="session-timeout" defaultChecked />
                <Label htmlFor="session-timeout">Auto Logout After Inactivity</Label>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="session-duration">Session Duration (minutes)</Label>
                <Input id="session-duration" type="number" defaultValue="60" />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password-policy">Password Policy</Label>
                <div className="space-y-2 ml-4">
                  <div className="flex items-center space-x-2">
                    <Switch id="password-length" defaultChecked />
                    <Label htmlFor="password-length">Minimum 8 characters</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch id="password-uppercase" defaultChecked />
                    <Label htmlFor="password-uppercase">Require uppercase letter</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch id="password-number" defaultChecked />
                    <Label htmlFor="password-number">Require number</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch id="password-special" />
                    <Label htmlFor="password-special">Require special character</Label>
                  </div>
                </div>
              </div>
              
              <Button className="bg-purple-600 hover:bg-purple-700">
                <Save className="w-4 h-4 mr-2" />
                Save Security Settings
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="email">
          <Card>
            <CardContent className="p-6">
              <p className="text-muted-foreground">Email configuration coming soon...</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="database">
          <Card>
            <CardContent className="p-6">
              <p className="text-muted-foreground">Database configuration coming soon...</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}