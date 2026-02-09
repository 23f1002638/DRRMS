import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { aidTypes } from '../constants/aidRequestConstants';

interface AidTypeSelectorProps {
  selectedType: string;
  onTypeSelect: (typeId: string) => void;
}

export function AidTypeSelector({ selectedType, onTypeSelect }: AidTypeSelectorProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Type of Assistance Needed</CardTitle>
        <CardDescription>Select the primary type of aid you require</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {aidTypes.map((type) => {
            const Icon = type.icon;
            return (
              <div
                key={type.id}
                className={`border-2 rounded-lg p-4 cursor-pointer transition-colors ${
                  selectedType === type.id 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => onTypeSelect(type.id)}
              >
                <div className="flex items-start space-x-3">
                  <Icon className="h-6 w-6 text-blue-600 mt-1" />
                  <div>
                    <h3 className="font-medium">{type.label}</h3>
                    <p className="text-sm text-muted-foreground">{type.description}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}