'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { AuthenticatedSurveyRetake } from '@/components/AuthenticatedSurveyRetake';

export default function GamblingSurveyPage() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        // User is authenticated, show the retake survey
        setIsAuthenticated(true);
      } else {
        // User is not authenticated, redirect to home for initial survey
        router.push('/');
      }
    };
    
    checkAuth();
  }, [router]);

  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
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
