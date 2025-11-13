'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function DashboardPage() {
  const router = useRouter();
  const [isCheckingPendingSurvey, setIsCheckingPendingSurvey] = useState(true);

  useEffect(() => {
    const checkAndLinkPendingSurvey = async () => {
      try {
        // Check if user is authenticated
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
          // Not authenticated, redirect to home
          router.push('/');
          return;
        }

        // Check for pending survey link in localStorage
        const pendingSurveyData = localStorage.getItem('pending_survey_link');

        if (pendingSurveyData) {
          try {
            const { email, surveyId, timestamp } = JSON.parse(pendingSurveyData);

            // Check if the pending survey is for this user
            if (email === user.email) {
              console.log('Found pending survey, linking to account...');

              // Attempt to link the survey
              const linkResponse = await fetch('/api/gambling-survey/link-confirm', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email }),
                credentials: 'include',
              });

              if (linkResponse.ok) {
                console.log('Successfully linked pending survey');
                // Remove the pending survey data
                localStorage.removeItem('pending_survey_link');
              } else {
                console.warn('Failed to link pending survey, will try again later');
              }
            } else {
              // Different user, clear the pending survey
              localStorage.removeItem('pending_survey_link');
            }
          } catch (parseError) {
            console.error('Error parsing pending survey data:', parseError);
            localStorage.removeItem('pending_survey_link');
          }
        }
      } catch (error) {
        console.error('Error checking pending survey:', error);
      } finally {
        setIsCheckingPendingSurvey(false);
        // Redirect to the home page (main dashboard)
        router.push('/');
      }
    };

    checkAndLinkPendingSurvey();
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      {isCheckingPendingSurvey && (
        <p className="mt-4 text-sm text-muted-foreground">Loading your dashboard...</p>
      )}
    </div>
  );
}
