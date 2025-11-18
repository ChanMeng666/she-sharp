'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar, Clock, MapPin, Users, Globe, Video, Building, DollarSign, Image, Plus, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function CreateEventPage() {
  const [eventType, setEventType] = useState('workshop');
  const [locationType, setLocationType] = useState('hybrid');
  const [isMembersOnly, setIsMembersOnly] = useState(false);
  const [enableWaitlist, setEnableWaitlist] = useState(true);
  const [speakers, setSpeakers] = useState<string[]>(['']);
  const [tags, setTags] = useState<string[]>([]);
  const [currentTag, setCurrentTag] = useState('');

  const addSpeaker = () => {
    setSpeakers([...speakers, '']);
  };

  const removeSpeaker = (index: number) => {
    setSpeakers(speakers.filter((_, i) => i !== index));
  };

  const updateSpeaker = (index: number, value: string) => {
    const updated = [...speakers];
    updated[index] = value;
    setSpeakers(updated);
  };

  const addTag = () => {
    if (currentTag.trim() && !tags.includes(currentTag.trim())) {
      setTags([...tags, currentTag.trim()]);
      setCurrentTag('');
    }
  };

  const removeTag = (tag: string) => {
    setTags(tags.filter(t => t !== tag));
  };

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Create New Event</h1>
          <p className="text-muted-foreground mt-2">
            Set up a new event for the community
          </p>
        </div>
      </div>

      <form className="space-y-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
            <CardDescription>Essential details about your event</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title">Event Title *</Label>
                <Input id="title" placeholder="Enter event title" />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="type">Event Type *</Label>
                <Select value={eventType} onValueChange={setEventType}>
                  <SelectTrigger id="type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="workshop">Workshop</SelectItem>
                    <SelectItem value="networking">Networking</SelectItem>
                    <SelectItem value="training">Training</SelectItem>
                    <SelectItem value="social">Social</SelectItem>
                    <SelectItem value="thrive">THRIVE</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea 
                id="description" 
                placeholder="Provide a detailed description of the event"
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <Label>Tags</Label>
              <div className="flex items-center space-x-2">
                <Input
                  value={currentTag}
                  onChange={(e) => setCurrentTag(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                  placeholder="Add tags (press Enter)"
                  className="flex-1"
                />
                <Button type="button" onClick={addTag} size="sm">Add</Button>
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {tags.map(tag => (
                  <Badge key={tag} variant="secondary" className="px-2 py-1">
                    {tag}
                    <X 
                      className="w-3 h-3 ml-1 cursor-pointer" 
                      onClick={() => removeTag(tag)}
                    />
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Date & Time */}
        <Card>
          <CardHeader>
            <CardTitle>Date & Time</CardTitle>
            <CardDescription>When will your event take place?</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="start-date">Start Date & Time *</Label>
                <div className="flex space-x-2">
                  <Input type="date" className="flex-1" />
                  <Input type="time" className="w-32" />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="end-date">End Date & Time *</Label>
                <div className="flex space-x-2">
                  <Input type="date" className="flex-1" />
                  <Input type="time" className="w-32" />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="timezone">Timezone</Label>
                <Select defaultValue="PST">
                  <SelectTrigger id="timezone">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PST">Pacific Standard Time</SelectItem>
                    <SelectItem value="EST">Eastern Standard Time</SelectItem>
                    <SelectItem value="CST">Central Standard Time</SelectItem>
                    <SelectItem value="MST">Mountain Standard Time</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="registration-deadline">Registration Deadline</Label>
                <Input type="datetime-local" id="registration-deadline" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Location */}
        <Card>
          <CardHeader>
            <CardTitle>Location</CardTitle>
            <CardDescription>Where will your event be held?</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Location Type *</Label>
              <div className="flex space-x-4">
                <Button
                  type="button"
                  variant={locationType === 'online' ? 'default' : 'outline'}
                  onClick={() => setLocationType('online')}
                  className="flex-1"
                >
                  <Globe className="w-4 h-4 mr-2" />
                  Online
                </Button>
                <Button
                  type="button"
                  variant={locationType === 'in_person' ? 'default' : 'outline'}
                  onClick={() => setLocationType('in_person')}
                  className="flex-1"
                >
                  <Building className="w-4 h-4 mr-2" />
                  In Person
                </Button>
                <Button
                  type="button"
                  variant={locationType === 'hybrid' ? 'default' : 'outline'}
                  onClick={() => setLocationType('hybrid')}
                  className="flex-1"
                >
                  <Video className="w-4 h-4 mr-2" />
                  Hybrid
                </Button>
              </div>
            </div>

            {(locationType === 'in_person' || locationType === 'hybrid') && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="venue">Venue Name</Label>
                  <Input id="venue" placeholder="Enter venue name" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address">Address</Label>
                  <Input id="address" placeholder="Enter full address" />
                </div>
              </>
            )}

            {(locationType === 'online' || locationType === 'hybrid') && (
              <div className="space-y-2">
                <Label htmlFor="meeting-link">Meeting Link</Label>
                <Input id="meeting-link" placeholder="https://zoom.us/..." />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Registration & Capacity */}
        <Card>
          <CardHeader>
            <CardTitle>Registration & Capacity</CardTitle>
            <CardDescription>Manage event attendance</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="capacity">Maximum Capacity *</Label>
                <Input id="capacity" type="number" placeholder="100" />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="price">Price (USD)</Label>
                <Input id="price" type="number" placeholder="0" step="0.01" />
                <p className="text-xs text-muted-foreground">Leave as 0 for free events</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Members Only</Label>
                  <p className="text-sm text-muted-foreground">Restrict to registered members</p>
                </div>
                <Switch checked={isMembersOnly} onCheckedChange={setIsMembersOnly} />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Enable Waitlist</Label>
                  <p className="text-sm text-muted-foreground">Allow waitlist when event is full</p>
                </div>
                <Switch checked={enableWaitlist} onCheckedChange={setEnableWaitlist} />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Speakers */}
        <Card>
          <CardHeader>
            <CardTitle>Speakers & Facilitators</CardTitle>
            <CardDescription>Add event speakers or facilitators</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {speakers.map((speaker, index) => (
              <div key={index} className="flex items-center space-x-2">
                <Input
                  value={speaker}
                  onChange={(e) => updateSpeaker(index, e.target.value)}
                  placeholder="Speaker name and title"
                  className="flex-1"
                />
                {speakers.length > 1 && (
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => removeSpeaker(index)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </div>
            ))}
            <Button type="button" variant="outline" onClick={addSpeaker}>
              <Plus className="w-4 h-4 mr-2" />
              Add Speaker
            </Button>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-end space-x-4">
          <Button variant="outline" type="button">
            Save as Draft
          </Button>
          <Button type="submit" className="bg-purple-600 hover:bg-purple-700">
            Create Event
          </Button>
        </div>
      </form>
    </div>
  );
}