'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { AuthenticatedSurveyRetake } from '@/components/AuthenticatedSurveyRetake';

export default function GamblingSurveyPage() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  
  useEffect(() => {
    let mounted = true;
    
    const checkAuth = async () => {
      try {
        // Add timeout to prevent hanging
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Auth timeout')), 3000)
        );
        
        // Use getSession() with timeout
        const authPromise = supabase.auth.getSession();
        
        const { data: { session } } = await Promise.race([authPromise, timeoutPromise]) as any;

        if (mounted) {
          if (session?.user) {
            // User is authenticated, show the retake survey
            setIsAuthenticated(true);
          } else {
            // User is not authenticated, redirect to home for initial survey
            router.push('/');
          }
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        // Fallback: redirect to home if auth fails
        if (mounted) {
          router.push('/');
        }
      }
    };

    // Set up auth state listener for faster updates
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (mounted && event === 'SIGNED_IN' && session?.user) {
        setIsAuthenticated(true);
      }
    });

    checkAuth();

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [router]);

  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-blue-50 to-green-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <div className="text-muted-foreground">Checking authentication...</div>
        </div>
      </div>
    );
  }

  if (isAuthenticated) {
    return <AuthenticatedSurveyRetake />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-muted-foreground">Redirecting to survey...</div>
    </div>
  );
}
