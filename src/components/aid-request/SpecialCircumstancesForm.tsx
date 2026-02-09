import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Checkbox } from '../ui/checkbox';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { AidRequestFormData } from '../constants/aidRequestConstants';

interface SpecialCircumstancesFormProps {
  formData: AidRequestFormData;
  onFormChange: (updates: Partial<AidRequestFormData>) => void;
}

export function SpecialCircumstancesForm({ formData, onFormChange }: SpecialCircumstancesFormProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Special Circumstances</CardTitle>
        <CardDescription>Help us prioritize and prepare appropriate assistance</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="hasDisabilities"
              checked={formData.hasDisabilities}
              onCheckedChange={(checked) => onFormChange({ hasDisabilities: checked as boolean })}
            />
            <Label htmlFor="hasDisabilities">People with disabilities present</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="hasChildren"
              checked={formData.hasChildren}
              onCheckedChange={(checked) => onFormChange({ hasChildren: checked as boolean })}
            />
            <Label htmlFor="hasChildren">Children (under 18) present</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="hasElderly"
              checked={formData.hasElderly}
              onCheckedChange={(checked) => onFormChange({ hasElderly: checked as boolean })}
            />
            <Label htmlFor="hasElderly">Elderly (over 65) present</Label>
          </div>
        </div>

        <div>
          <Label htmlFor="additionalNeeds">Additional Needs or Medical Conditions</Label>
          <Textarea
            id="additionalNeeds"
            placeholder="Any medical conditions, allergies, or special requirements..."
            value={formData.additionalNeeds}
            onChange={(e) => onFormChange({ additionalNeeds: e.target.value })}
            rows={3}
          />
        </div>
      </CardContent>
    </Card>
  );
}