'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle, ThumbsUp, ThumbsDown } from 'lucide-react';

interface LostBetQuestionProps {
  onYes: () => void;
  onNo: () => void;
}

export function LostBetQuestion({ onYes, onNo }: LostBetQuestionProps) {
  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center pb-2">
          <div className="flex justify-center mb-3">
            <div className="p-3 rounded-full bg-orange-100 dark:bg-orange-950/30">
              <AlertCircle className="h-8 w-8 text-orange-600" />
            </div>
          </div>
          <CardTitle className="text-xl">Quick Check-In</CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <p className="text-center text-muted-foreground">
            Did you lose a bet recently?
          </p>
          
          <p className="text-center text-sm text-muted-foreground">
            Be honest - this helps us give you the right support.
          </p>
          
          <div className="flex gap-3">
            <Button 
              onClick={onYes}
              variant="outline"
              className="flex-1 h-14 border-orange-300 hover:bg-orange-50 hover:border-orange-400 dark:border-orange-800 dark:hover:bg-orange-950/30"
            >
              <ThumbsDown className="h-5 w-5 mr-2 text-orange-600" />
              <span>Yes, I did</span>
            </Button>
            
            <Button 
              onClick={onNo}
              className="flex-1 h-14 bg-green-600 hover:bg-green-700"
            >
              <ThumbsUp className="h-5 w-5 mr-2" />
              <span>No, I'm good</span>
            </Button>
          </div>
          
          <p className="text-center text-xs text-muted-foreground">
            Your response helps personalize your experience
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

export default LostBetQuestion;
