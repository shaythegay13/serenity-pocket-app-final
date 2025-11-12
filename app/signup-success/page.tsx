'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Mail, CheckCircle2 } from 'lucide-react';

function SignupSuccessContent() {
  const searchParams = useSearchParams();
  const email = searchParams.get('email') || '';

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-blue-50 via-white to-green-50">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <CheckCircle2 className="h-8 w-8 text-green-600" />
          </div>
          <CardTitle className="text-2xl">Check Your Email!</CardTitle>
          <CardDescription>
            We've sent a confirmation link to your email address
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center gap-2 p-4 bg-blue-50 rounded-lg">
              <Mail className="h-5 w-5 text-blue-600" />
              <span className="font-medium text-gray-900">{email}</span>
            </div>

            <div className="text-sm text-muted-foreground space-y-2 text-left">
              <p className="font-medium text-gray-900">What happens next:</p>
              <ol className="list-decimal list-inside space-y-1">
                <li>Check your email inbox (and spam folder)</li>
                <li>Click the confirmation link in the email</li>
                <li>Sign in to view your survey results</li>
              </ol>
            </div>

            <div className="pt-4 space-y-2">
              <p className="text-sm text-muted-foreground">
                Your survey results are saved and waiting for you!
              </p>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => window.location.href = '/signin'}
              >
                Go to Sign In Page
              </Button>
            </div>

            <div className="text-xs text-muted-foreground">
              <p>Didn't receive the email?</p>
              <p>Please wait a few minutes and check your spam folder.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function SignupSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    }>
      <SignupSuccessContent />
    </Suspense>
  );
}
