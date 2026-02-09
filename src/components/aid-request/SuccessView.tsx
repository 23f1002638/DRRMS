import React from 'react';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { CheckCircle } from 'lucide-react';

interface SuccessViewProps {
  requestId: string | null;
  onSubmitAnother: () => void;
}

export function SuccessView({ requestId, onSubmitAnother }: SuccessViewProps) {
  return (
    <div className="p-6 space-y-6 max-w-2xl mx-auto">
      <Card className="border-green-200 bg-green-50">
        <CardContent className="p-6">
          <div className="text-center space-y-4">
            <CheckCircle className="h-16 w-16 text-green-600 mx-auto" />
            <h2 className="text-2xl font-semibold text-green-800">Request Submitted Successfully</h2>
            <p className="text-green-700">
              Your aid request has been received and assigned reference number{' '}
              <strong>{requestId?.split('_')[2] || 'REQ-' + Date.now().toString().slice(-6)}</strong>
            </p>
            <div className="bg-white p-4 rounded-lg border border-green-200">
              <p className="text-sm text-green-800">
                <strong>What happens next:</strong><br />
                • Our team will review your request within 30 minutes<br />
                • You'll receive an SMS with your case worker's contact<br />
                • Emergency response team will be dispatched if needed<br />
                • Track your request status in the dashboard
              </p>
            </div>
            <Button onClick={onSubmitAnother} className="w-full">
              Submit Another Request
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}