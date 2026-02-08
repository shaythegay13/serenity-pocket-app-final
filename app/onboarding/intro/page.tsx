"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface SnapshotResult {
  tag: string;
  blurb: string;
}

function getFullExplanation(tag: string): { title: string; paragraphs: string[]; tips: string[] } {
  switch (tag) {
    case "Methodical Analyst":
      return {
        title: "Steady. Disciplined. Data-Driven.",
        paragraphs: [
          "You prefer structure and preparation. You make decisions with research and keep a measured pace.",
          "Your strengths include calm decision-making and consistent bankroll habits. Guard against analysis paralysis and missing value due to over-caution.",
        ],
        tips: [
          "Pre-plan bet sizes and accept small edges when research aligns.",
          "Set clear stop-times so research doesn't delay execution.",
          "Review outcomes weekly to iterate—not after every single bet.",
        ],
      };
    case "Action Seeker":
      return {
        title: "High Energy. Fast Tempo.",
        paragraphs: [
          "You’re excitement-oriented and enjoy the thrill of the moment.",
          "Your strengths include decisiveness and momentum. Guard against overexposure and tilt after losses.",
        ],
        tips: [
          "Use cool-down timers and pre-set daily limits.",
          "Favor fewer, higher-confidence spots over constant action.",
          "Log emotions after swings to prevent chasing.",
        ],
      };
    default:
      return {
        title: "Confidence-Driven. Momentum Aware.",
        paragraphs: [
          "You ride confidence and streaks, which can amplify both good runs and drawdowns.",
          "Your strengths include decisiveness and trusting your read. Guard against post-loss chasing and bet size creep.",
        ],
        tips: [
          "Lock in pre-defined max stake and daily bet limits.",
          "Pause 5–10 minutes after losses before next decision.",
          "Journal brief notes on why a bet was made to anchor discipline.",
        ],
      };
  }
}

export default function OnboardingIntroPage() {
  const router = useRouter();
  const [snapshot, setSnapshot] = useState<SnapshotResult | null>(null);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("snapshotResult");
      if (raw) {
        const parsed = JSON.parse(raw) as SnapshotResult;
        if (parsed && parsed.tag) setSnapshot(parsed);
      }
    } catch (error) {
      // Non-critical: snapshot data couldn't be loaded from session storage
      console.warn('[Onboarding] Failed to load snapshot from session storage:', error)
    }
  }, []);

  const exp = getFullExplanation(snapshot?.tag || "Momentum Player");

  return (
    <div className="min-h-screen py-8 bg-gradient-to-br from-blue-50 via-white to-green-50">
      <div className="container mx-auto px-4 max-w-3xl space-y-6">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Your Profile Preview</CardTitle>
            <CardDescription>Instant tag based on your quick snapshot</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center space-y-2 mb-4">
              <div className="text-sm text-muted-foreground">You are a</div>
              <div className="text-3xl font-bold text-gray-900">{snapshot?.tag || "Momentum Player"}</div>
              <div className="text-gray-700">{snapshot?.blurb || "Confidence-driven, rides streaks—watch for tilt."}</div>
            </div>

            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-gray-900">What this means</h3>
              {exp.paragraphs.map((p, i) => (
                <p key={i} className="text-sm text-gray-700">{p}</p>
              ))}

              <h3 className="text-lg font-semibold text-gray-900 mt-4">Suggested next steps</h3>
              <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                {exp.tips.map((t, i) => (
                  <li key={i}>{t}</li>
                ))}
              </ul>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <Button className="flex-1" onClick={() => router.push("/gambling-survey")}>Complete your full profile</Button>
                <Button variant="outline" className="flex-1" onClick={() => router.push("/dashboard")}>Skip for now</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
