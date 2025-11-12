'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, AlertCircle } from 'lucide-react';

interface SurveyLinkingConfirmationProps {
  email: string;
  onConfirm: () => Promise<void>;
  onDecline: () => void;
  isOpen?: boolean;
}

export default function SurveyLinkingConfirmation({
  email,
  onConfirm,
  onDecline,
  isOpen: initialIsOpen = true,
}: SurveyLinkingConfirmationProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(initialIsOpen);
  const [isLinking, setIsLinking] = useState(false);
  const [linkingError, setLinkingError] = useState<string | null>(null);

  const handleConfirm = async () => {
    setIsLinking(true);
    setLinkingError(null);

    try {
      await onConfirm();
      setIsOpen(false);
      // Navigate to dashboard after successful linking
      router.push('/dashboard/survey-history');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to link survey';
      setLinkingError(errorMessage);
    } finally {
      setIsLinking(false);
    }
  };

  const handleDecline = () => {
    onDecline();
    setIsOpen(false);
    // Navigate to dashboard without linking
    router.push('/dashboard');
  };

  const handleOpenChange = (open: boolean) => {
    // Prevent closing during linking process
    if (!isLinking) {
      setIsOpen(open);
      if (!open) {
        onDecline();
      }
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-500" />
            Link Your Previous Survey
          </DialogTitle>
        </DialogHeader>

        <div className="pt-3 space-y-3 text-sm text-muted-foreground">
          <p>
            We found a survey you completed with the email address{' '}
            <span className="font-medium">{email}</span> before creating your account.
          </p>
          <p>
            Would you like to link this survey to your account? This will allow you to:
          </p>
          <ul className="list-disc list-inside space-y-1 text-sm">
            <li>View your initial assessment results</li>
            <li>Track your progress over time</li>
            <li>Compare future results with your baseline</li>
          </ul>
          <div className="flex items-center gap-2 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-md">
            <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400 flex-shrink-0" />
            <p className="text-sm text-amber-600 dark:text-amber-400">
              This action is permanent and cannot be undone.
            </p>
          </div>
        </div>

        {linkingError && (
          <div className="flex items-center gap-2 p-3 text-sm text-destructive bg-destructive/10 rounded-md">
            <XCircle className="h-4 w-4" />
            <span>{linkingError}</span>
          </div>
        )}

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={handleDecline}
            disabled={isLinking}
          >
            <XCircle className="h-4 w-4 mr-2" />
            Skip for Now
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={isLinking}
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            {isLinking ? 'Linking...' : 'Link Survey'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
