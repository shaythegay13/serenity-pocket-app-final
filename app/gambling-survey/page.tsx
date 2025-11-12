'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function GamblingSurveyPage() {
  const router = useRouter();
  
  useEffect(() => {
    // Redirect to home page where the integrated survey flow is
    router.push('/');
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-muted-foreground">Redirecting to survey...</div>
    </div>
  );
}
