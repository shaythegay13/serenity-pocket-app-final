'use client';

import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Heart, Brain, ChevronRight, ChevronLeft } from 'lucide-react';

// Core emotions with 10 sub-emotions each (reused from existing system)
const coreEmotions = [
  {
    id: "joy",
    label: "JOY",
    color: "#f59e0b",
    subEmotions: ["Happy", "Excited", "Optimistic", "Grateful", "Confident", "Proud", "Hopeful", "Content", "Cheerful", "Inspired"]
  },
  {
    id: "calm",
    label: "CALM",
    color: "#14b8a6",
    subEmotions: ["Peaceful", "Relaxed", "Centered", "Focused", "Balanced", "Serene", "Patient", "Composed", "Tranquil", "Stable"]
  },
  {
    id: "fear",
    label: "FEAR",
    color: "#ef4444",
    subEmotions: ["Anxious", "Worried", "Nervous", "Scared", "Uncertain", "Panicked", "Hesitant", "Overwhelmed", "Tense", "Uneasy"]
  },
  {
    id: "greed",
    label: "GREED",
    color: "#8b5cf6",
    subEmotions: ["FOMO", "Euphoric", "Impulsive", "Overconfident", "Eager", "Craving", "Obsessed", "Compulsive", "Restless", "Driven"]
  },
  {
    id: "frustration",
    label: "FRUSTRATION",
    color: "#f97316",
    subEmotions: ["Angry", "Irritated", "Disappointed", "Impatient", "Stressed", "Resentful", "Annoyed", "Agitated", "Bitter", "Exhausted"]
  },
  {
    id: "sadness",
    label: "SADNESS",
    color: "#6366f1",
    subEmotions: ["Down", "Discouraged", "Regretful", "Defeated", "Helpless", "Lonely", "Empty", "Hopeless", "Dejected", "Grief"]
  }
];

export interface EmotionDriver {
  emotion: string;
  intensity: number;
  timestamp: Date;
}

interface TiltLabEmotionDriverCheckInProps {
  onComplete: (emotionDrivers: EmotionDriver[]) => void;
  onBack?: () => void;
}

export function TiltLabEmotionDriverCheckIn({ onComplete, onBack }: TiltLabEmotionDriverCheckInProps) {
  const [step, setStep] = useState<"core" | "sub" | "intensity">("core");
  const [selectedCore, setSelectedCore] = useState<typeof coreEmotions[0] | null>(null);
  const [selectedEmotion, setSelectedEmotion] = useState("");
  const [intensity, setIntensity] = useState([5]);
  const [emotionDrivers, setEmotionDrivers] = useState<EmotionDriver[]>([]);

  const handleCoreSelect = useCallback((core: typeof coreEmotions[0]) => {
    setSelectedCore(core);
    setStep("sub");
  }, []);

  const handleSubEmotionSelect = useCallback((emotion: string) => {
    setSelectedEmotion(emotion);
    setStep("intensity");
  }, []);

  const handleIntensitySubmit = useCallback(() => {
    if (!selectedEmotion) return;

    const newDriver: EmotionDriver = {
      emotion: selectedEmotion,
      intensity: intensity[0],
      timestamp: new Date()
    };

    const updatedDrivers = [...emotionDrivers, newDriver];
    setEmotionDrivers(updatedDrivers);

    // Check if we should add more emotions or continue
    if (updatedDrivers.length < 3 && updatedDrivers.length < coreEmotions.length) {
      // Reset for next emotion
      setSelectedCore(null);
      setSelectedEmotion("");
      setIntensity([5]);
      setStep("core");
    } else {
      // Complete the check-in
      onComplete(updatedDrivers);
    }
  }, [selectedEmotion, intensity, emotionDrivers, onComplete]);

  const handleSkipEmotion = useCallback(() => {
    if (emotionDrivers.length === 0) {
      // If no emotions selected, complete with empty array
      onComplete([]);
    } else {
      // Complete with current emotions
      onComplete(emotionDrivers);
    }
  }, [emotionDrivers, onComplete]);

  const renderCoreEmotionStep = () => (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <Brain className="h-10 w-10 mx-auto text-primary/80" />
        <h3 className="text-xl font-semibold text-foreground">What's driving your decision today?</h3>
        <p className="text-sm text-muted-foreground max-w-xs mx-auto">
          Taking a moment to check in can be the biggest edge you have.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {coreEmotions.map((core) => (
          <button
            key={core.id}
            onClick={() => handleCoreSelect(core)}
            className="p-4 rounded-xl border-2 transition-all hover:border-primary/50 hover:bg-accent/50 active:scale-95 flex flex-col items-center justify-center gap-2 aspect-square md:aspect-auto md:h-32"
            style={{ borderColor: core.color + '40' }}
          >
            <div 
              className="w-6 h-6 rounded-full shadow-sm"
              style={{ backgroundColor: core.color }}
            />
            <div className="font-semibold text-sm text-foreground">{core.label}</div>
          </button>
        ))}
      </div>

      <div className="flex justify-between pt-2">
        {onBack && (
          <Button variant="ghost" size="sm" onClick={onBack} className="text-muted-foreground">
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back
          </Button>
        )}
        <Button variant="ghost" size="sm" onClick={handleSkipEmotion} className="text-muted-foreground">
          Skip for now
        </Button>
      </div>
    </div>
  );

  const renderSubEmotionStep = () => (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <div 
          className="w-10 h-10 rounded-full mx-auto shadow-md transition-all"
          style={{ backgroundColor: selectedCore?.color }}
        />
        <h3 className="text-xl font-semibold text-foreground">{selectedCore?.label}</h3>
        <p className="text-sm text-muted-foreground">
          Digging a bit deeper... what does that feel like specifically?
        </p>
      </div>

      {/* Mobile-friendly horizontal scroll */}
      <div className="relative">
        <div className="flex overflow-x-auto gap-3 pb-4 -mx-6 px-6 snap-x hide-scrollbar">
          {selectedCore?.subEmotions.map((emotion) => (
            <button
              key={emotion}
              onClick={() => handleSubEmotionSelect(emotion)}
              className="shrink-0 snap-center px-6 py-3 rounded-full border bg-background text-sm font-medium hover:border-primary hover:bg-primary/5 transition-all shadow-sm active:scale-95"
            >
              {emotion}
            </button>
          ))}
        </div>
        {/* Fade indicators for scroll */}
        <div className="absolute left-0 top-0 bottom-4 w-6 bg-gradient-to-r from-background to-transparent pointer-events-none md:hidden" />
        <div className="absolute right-0 top-0 bottom-4 w-6 bg-gradient-to-l from-background to-transparent pointer-events-none md:hidden" />
      </div>

      <div className="flex justify-center pt-2">
        <Button variant="ghost" size="sm" onClick={() => setStep("core")} className="text-muted-foreground">
          <ChevronLeft className="h-4 w-4 mr-1" />
          Choose a different category
        </Button>
      </div>
    </div>
  );

  const renderIntensityStep = () => (
    <div className="space-y-8">
      <div className="text-center space-y-2">
        <Heart className="h-10 w-10 mx-auto text-primary/80" />
        <h3 className="text-xl font-semibold text-foreground">How strong is that feeling?</h3>
        <p className="text-sm text-muted-foreground">
          Rate the intensity of <span className="font-semibold text-foreground">{selectedEmotion}</span> right now.
        </p>
      </div>

      <div className="space-y-6 px-4">
        <div className="text-center">
          <span className="text-6xl font-bold text-primary tabular-nums tracking-tight">{intensity[0]}</span>
          <p className="text-xs uppercase tracking-widest text-muted-foreground mt-2 font-medium">Intensity</p>
        </div>

        <Slider
          value={intensity}
          onValueChange={setIntensity}
          min={1}
          max={10}
          step={1}
          className="w-full py-4 cursor-pointer"
        />

        <div className="flex justify-between text-xs font-medium text-muted-foreground uppercase tracking-wider">
          <span>Mild</span>
          <span>Overwhelming</span>
        </div>
      </div>

      <div className="bg-muted/30 rounded-xl p-4 text-center border border-border/50">
        <p className="text-sm text-muted-foreground">
          {emotionDrivers.length === 0 ? (
            "This will help tailor your insights."
          ) : (
            `You've logged ${emotionDrivers.length} emotion${emotionDrivers.length !== 1 ? 's' : ''} so far.`
          )}
        </p>
      </div>

      <div className="flex flex-col gap-3 pt-2">
        <div className="grid grid-cols-2 gap-3">
          <Button variant="outline" size="lg" onClick={() => setStep("sub")}>
            Back
          </Button>
          <Button size="lg" onClick={handleIntensitySubmit} className="shadow-md">
            {emotionDrivers.length < 2 ? "Add Emotion" : "Complete"}
            <ChevronRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
        
        {emotionDrivers.length > 0 && (
          <Button variant="ghost" size="sm" onClick={handleSkipEmotion} className="text-muted-foreground">
            I'm done adding emotions
          </Button>
        )}
      </div>
    </div>
  );

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="text-xl">Emotional Driver Check-In</CardTitle>
        <p className="text-sm text-muted-foreground">
          {emotionDrivers.length > 0 && `Emotions captured: ${emotionDrivers.length}/3`}
        </p>
      </CardHeader>
      <CardContent>
        {step === "core" && renderCoreEmotionStep()}
        {step === "sub" && renderSubEmotionStep()}
        {step === "intensity" && renderIntensityStep()}
      </CardContent>
    </Card>
  );
}

export default TiltLabEmotionDriverCheckIn;
