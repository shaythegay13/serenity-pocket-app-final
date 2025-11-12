'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import AccountCreationFlow from '@/components/AccountCreationFlow';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

function CreateAccountContent() {
  const searchParams = useSearchParams();
  const email = searchParams.get('email') || '';
  const surveyId = searchParams.get('surveyId') || '';
  const score = parseInt(searchParams.get('score') || '0', 10);

  if (!email || !surveyId) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <p className="text-destructive">Invalid survey information. Please complete the survey first.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8">
      <div className="container mx-auto px-4">
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Welcome Message Card */}
          <Card>
            <CardHeader>
              <CardTitle>Create Your Account</CardTitle>
              <CardDescription>
                Your survey has been saved. Create an account to view your results and track your progress.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center p-6 bg-gradient-to-r from-blue-50 to-green-50 rounded-lg">
                <div className="text-5xl mb-3">🎯</div>
                <div className="text-lg font-semibold text-gray-900 mb-2">
                  Almost There!
                </div>
                <div className="text-sm text-gray-700">
                  Complete your account setup to unlock your personalized assessment results
                </div>
              </div>
              <div className="mt-4 space-y-2">
                <p className="text-sm font-medium text-muted-foreground">What you'll get:</p>
                <ul className="text-sm text-muted-foreground space-y-1 ml-4">
                  <li>• Your detailed assessment score and risk level</li>
                  <li>• Personalized insights and recommendations</li>
                  <li>• Progress tracking over time</li>
                  <li>• Access to helpful resources and tools</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Account Creation Form */}
          <Card>
            <AccountCreationFlow email={email} surveyId={surveyId} />
          </Card>
        </div>
      </div>
    </div>
  );
}

export default function CreateAccountPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    }>
      <CreateAccountContent />
    </Suspense>
  );
}
