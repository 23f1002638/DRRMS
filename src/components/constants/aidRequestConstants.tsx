import { Package, Heart, Home, AlertTriangle } from 'lucide-react';

export const aidTypes = [
  { id: 'food', label: 'Food & Water', icon: Package, description: 'Emergency food supplies and clean water' },
  { id: 'medical', label: 'Medical Aid', icon: Heart, description: 'Medical supplies and healthcare assistance' },
  { id: 'shelter', label: 'Shelter', icon: Home, description: 'Temporary housing and shelter materials' },
  { id: 'emergency', label: 'Emergency Rescue', icon: AlertTriangle, description: 'Immediate rescue and evacuation' },
];

export const priorityLevels = [
  { value: 'low', label: 'Low Priority', color: 'bg-blue-100 text-blue-800' },
  { value: 'medium', label: 'Medium Priority', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'high', label: 'High Priority', color: 'bg-orange-100 text-orange-800' },
  { value: 'critical', label: 'Critical Emergency', color: 'bg-red-100 text-red-800' },
];

export interface AidRequestFormData {
  aidType: string;
  priority: string;
  description: string;
  peopleCount: string;
  location: string;
  contactPhone: string;
  hasDisabilities: boolean;
  hasChildren: boolean;
  hasElderly: boolean;
  additionalNeeds: string;
}

export const initialFormData: AidRequestFormData = {
  aidType: '',
  priority: '',
  description: '',
  peopleCount: '',
  location: '',
  contactPhone: '',
  hasDisabilities: false,
  hasChildren: false,
  hasElderly: false,
  additionalNeeds: '',
};