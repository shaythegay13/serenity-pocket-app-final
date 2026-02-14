'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function DashboardPage() {
  const router = useRouter();
  const [isCheckingPendingSurvey, setIsCheckingPendingSurvey] = useState(true);

  useEffect(() => {
    let mounted = true;
    
    const checkAndLinkPendingSurvey = async () => {
      try {
        // Add timeout to prevent hanging
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Auth timeout')), 3000)
        );
        
        // Use getSession() with timeout
        const authPromise = supabase.auth.getSession();
        
        const { data: { session } } = await Promise.race([authPromise, timeoutPromise]) as any;

        if (!mounted) return;
        
        if (!session?.user) {
          // Not authenticated, redirect to home
          router.push('/');
          return;
        }

        const user = session.user;

        // Check for pending survey link in localStorage
        const pendingSurveyData = localStorage.getItem('pending_survey_link');

        if (pendingSurveyData) {
          try {
            const { email, surveyId, timestamp } = JSON.parse(pendingSurveyData);

            // Check if the pending survey is for this user
            if (email === user.email) {
              console.log('Found pending survey, linking to account...');

              // Attempt to link the survey with timeout
              const linkPromise = fetch('/api/gambling-survey/link-confirm', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email }),
                credentials: 'include',
              });

              const linkTimeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Link timeout')), 5000)
              );

              const linkResponse = await Promise.race([linkPromise, linkTimeoutPromise]) as any;

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
        // Continue even if there's an error
      } finally {
        if (mounted) {
          setIsCheckingPendingSurvey(false);
          // Redirect to the home page (main dashboard)
          router.push('/');
        }
      }
    };

    checkAndLinkPendingSurvey();

    return () => {
      mounted = false;
    };
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
