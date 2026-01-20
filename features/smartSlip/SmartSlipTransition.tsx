'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sparkles, ArrowRight, Target, Shield } from 'lucide-react';

interface SmartSlipTransitionProps {
  onComplete: () => void;
  onBack?: () => void;
}

export function SmartSlipTransition({ onComplete, onBack }: SmartSlipTransitionProps) {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 rounded-full bg-primary/10">
              <Sparkles className="h-8 w-8 text-primary" />
            </div>
          </div>
          <CardTitle className="text-xl">Let's find your next confident pick!</CardTitle>
          <p className="text-muted-foreground">
            Smart Slip will analyze games and recommend bets that match your strategy
          </p>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-full bg-green-100 dark:bg-green-950/20">
                <Target className="h-4 w-4 text-green-600" />
              </div>
              <div>
                <h3 className="font-medium">AI-Powered Analysis</h3>
                <p className="text-sm text-muted-foreground">
                  Advanced algorithms analyze EV, market conditions, and psychological factors
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="p-2 rounded-full bg-blue-100 dark:bg-blue-950/20">
                <Shield className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <h3 className="font-medium">Risk Management</h3>
                <p className="text-sm text-muted-foreground">
                  Personalized stake ranges and emotional state monitoring
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="p-2 rounded-full bg-purple-100 dark:bg-purple-950/20">
                <Sparkles className="h-4 w-4 text-purple-600" />
              </div>
              <div>
                <h3 className="font-medium">Smart Recommendations</h3>
                <p className="text-sm text-muted-foreground">
                  Games aligned with your betting strategy and risk tolerance
                </p>
              </div>
            </div>
          </div>

          <div className="bg-muted/50 rounded-lg p-4 text-center">
            <p className="text-sm text-muted-foreground mb-2">
              Ready to discover your next smart bet?
            </p>
            <div className="text-xs text-muted-foreground">
              All recommendations include direct links to place bets securely
            </div>
          </div>

          <div className="flex gap-2">
            {onBack && (
              <Button variant="outline" onClick={onBack} className="flex-1">
                Back
              </Button>
            )}
            <Button onClick={onComplete} className="flex-1">
              Let's Go!
              <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default SmartSlipTransition;
