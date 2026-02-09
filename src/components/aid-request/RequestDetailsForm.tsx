import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { MapPin } from 'lucide-react';
import { AidRequestFormData } from '../constants/aidRequestConstants';

interface RequestDetailsFormProps {
  formData: AidRequestFormData;
  onFormChange: (updates: Partial<AidRequestFormData>) => void;
  onLocationDetect: () => void;
}

export function RequestDetailsForm({ formData, onFormChange, onLocationDetect }: RequestDetailsFormProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Request Details</CardTitle>
        <CardDescription>Provide specific information about your needs</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="peopleCount">Number of People Affected</Label>
            <Input
              id="peopleCount"
              type="number"
              placeholder="e.g., 4"
              value={formData.peopleCount}
              onChange={(e) => onFormChange({ peopleCount: e.target.value })}
              required
            />
          </div>
          <div>
            <Label htmlFor="contactPhone">Contact Phone Number</Label>
            <Input
              id="contactPhone"
              type="tel"
              placeholder="(555) 123-4567"
              value={formData.contactPhone}
              onChange={(e) => onFormChange({ contactPhone: e.target.value })}
              required
            />
          </div>
        </div>

        <div>
          <Label htmlFor="location">Your Current Location</Label>
          <div className="flex space-x-2">
            <Input
              id="location"
              placeholder="Enter address or coordinates"
              value={formData.location}
              onChange={(e) => onFormChange({ location: e.target.value })}
              required
            />
            <Button type="button" variant="outline" onClick={onLocationDetect}>
              <MapPin className="h-4 w-4 mr-1" />
              Detect
            </Button>
          </div>
        </div>

        <div>
          <Label htmlFor="description">Detailed Description</Label>
          <Textarea
            id="description"
            placeholder="Describe your situation and specific needs..."
            value={formData.description}
            onChange={(e) => onFormChange({ description: e.target.value })}
            rows={4}
            required
          />
        </div>
      </CardContent>
    </Card>
  );
}