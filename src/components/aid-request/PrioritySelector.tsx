import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Badge } from '../ui/badge';
import { priorityLevels } from '../constants/aidRequestConstants';

interface PrioritySelectorProps {
  selectedPriority: string;
  onPrioritySelect: (priority: string) => void;
}

export function PrioritySelector({ selectedPriority, onPrioritySelect }: PrioritySelectorProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Priority Level</CardTitle>
        <CardDescription>How urgent is your request?</CardDescription>
      </CardHeader>
      <CardContent>
        <Select value={selectedPriority} onValueChange={onPrioritySelect}>
          <SelectTrigger>
            <SelectValue placeholder="Select priority level" />
          </SelectTrigger>
          <SelectContent>
            {priorityLevels.map((level) => (
              <SelectItem key={level.value} value={level.value}>
                <div className="flex items-center space-x-2">
                  <Badge className={level.color}>{level.label}</Badge>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </CardContent>
    </Card>
  );
}