import { useState } from 'react';
import { useSubmitRequest } from '../hooks/useDisasterData';
import { Button } from './ui/button';
import { Alert, AlertDescription } from './ui/alert';
import { AlertTriangle, Zap } from 'lucide-react';
import { SuccessView } from './aid-request/SuccessView';
import { AidTypeSelector } from './aid-request/AidTypeSelector';
import { PrioritySelector } from './aid-request/PrioritySelector';
import { RequestDetailsForm } from './aid-request/RequestDetailsForm';
import { SpecialCircumstancesForm } from './aid-request/SpecialCircumstancesForm';
import { initialFormData, AidRequestFormData } from './constants/aidRequestConstants';
import { toast } from 'sonner';

interface AidRequestFormProps {
  onSuccess: () => void;
}

export function AidRequestForm({ onSuccess }: AidRequestFormProps) {
  const [formData, setFormData] = useState<AidRequestFormData>(initialFormData);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [requestId, setRequestId] = useState<string | null>(null);
  const [lat, setLat] = useState<number>(0);
  const [lng, setLng] = useState<number>(0);

  const { submitRequest, submitting, error } = useSubmitRequest();

  const handleFormChange = (updates: Partial<AidRequestFormData>) => {
    setFormData(prev => ({ ...prev, ...updates }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate required fields
    if (!formData.aidType || !formData.priority) {
      toast.error('Please select aid type and priority level');
      return;
    }

    if (!lat || !lng) {
      toast.error('Please detect your location or enter coordinates');
      return;
    }

    // Map priority to urgency (1-5 scale)
    const urgencyMap: Record<string, number> = {
      'low': 2,
      'medium': 3,
      'high': 4,
      'critical': 5,
    };

    // Prepare special needs
    const specialNeeds = [];
    if (formData.hasDisabilities) specialNeeds.push('Disabilities');
    if (formData.hasChildren) specialNeeds.push('Children');
    if (formData.hasElderly) specialNeeds.push('Elderly');
    if (formData.additionalNeeds) specialNeeds.push(formData.additionalNeeds);

    // Submit to API
    const result = await submitRequest({
      category: formData.aidType as 'food' | 'medical' | 'shelter' | 'emergency',
      title: `${formData.aidType.charAt(0).toUpperCase() + formData.aidType.slice(1)} Request - ${formData.priority}`,
      description: formData.description || undefined,
      urgency: urgencyMap[formData.priority] || 3,
      lat,
      lng,
      location_address: formData.location || undefined,
      people_count: formData.peopleCount ? parseInt(formData.peopleCount) : undefined,
      special_needs: specialNeeds.length > 0 ? specialNeeds.join(', ') : undefined,
    });

    if (result.success) {
      setRequestId(result.data?.id || null);
      setIsSubmitted(true);
      toast.success('Help is on the way! 🚁', {
        description: 'Your request has been submitted to our emergency response team.',
        duration: 4000,
      });

      // Call onSuccess after showing success view
      setTimeout(() => {
        onSuccess();
      }, 3000);
    }
  };

  const handleLocationDetect = () => {
    if (navigator.geolocation) {
      toast.info('Detecting your location...', { duration: 2000 });
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setLat(latitude);
          setLng(longitude);
          setFormData(prev => ({
            ...prev,
            location: `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`
          }));
          toast.success('Location detected successfully!');
        },
        (error) => {
          console.error('Location detection failed:', error);
          toast.error('Failed to detect location. Please enter manually.');
        }
      );
    } else {
      toast.error('Geolocation is not supported by your browser');
    }
  };

  if (isSubmitted) {
    return (
      <SuccessView
        requestId={requestId}
        onSubmitAnother={() => {
          setIsSubmitted(false);
          setFormData(initialFormData);
          setRequestId(null);
        }}
      />
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-semibold mb-2">Request Emergency Aid</h1>
        <p className="text-muted-foreground">
          Fill out this form to request assistance. Our emergency response team will be notified immediately.
        </p>
      </div>

      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          For life-threatening emergencies, call 911 immediately. This form is for non-critical aid requests.
        </AlertDescription>
      </Alert>

      {error && (
        <Alert className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950">
          <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />
          <AlertDescription className="text-red-800 dark:text-red-200">
            {error}
          </AlertDescription>
        </Alert>
      )}

      {submitting && (
        <Alert className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950">
          <Zap className="h-4 w-4 text-blue-600 dark:text-blue-400 animate-pulse" />
          <AlertDescription className="text-blue-800 dark:text-blue-200">
            Submitting your request to emergency response team...
          </AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <AidTypeSelector
          selectedType={formData.aidType}
          onTypeSelect={(typeId) => handleFormChange({ aidType: typeId })}
        />

        <PrioritySelector
          selectedPriority={formData.priority}
          onPrioritySelect={(priority) => handleFormChange({ priority })}
        />

        <RequestDetailsForm
          formData={formData}
          onFormChange={handleFormChange}
          onLocationDetect={handleLocationDetect}
        />

        <SpecialCircumstancesForm
          formData={formData}
          onFormChange={handleFormChange}
        />

        <div className="flex space-x-4">
          <Button
            type="submit"
            className="flex-1 bg-red-600 hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-700"
            disabled={submitting}
          >
            {submitting ? (
              <>
                <Zap className="h-4 w-4 mr-2 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <AlertTriangle className="h-4 w-4 mr-2" />
                Submit Aid Request
              </>
            )}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => setFormData(initialFormData)}
            disabled={submitting}
          >
            Clear Form
          </Button>
        </div>
      </form>
    </div>
  );
}