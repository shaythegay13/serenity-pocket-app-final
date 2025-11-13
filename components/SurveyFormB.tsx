'use client';

import { useState, useCallback } from 'react';
import { SurveyQuestion, SurveyAnswer, SURVEY_B_QUESTIONS } from '@/types/survey';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Progress } from '@/components/ui/progress';
import { AlertCircle } from 'lucide-react';

interface SurveyFormBProps {
  onSubmit: (responses: SurveyAnswer[]) => Promise<void>;
  isSubmitting: boolean;
}

export default function SurveyFormB({ onSubmit, isSubmitting }: SurveyFormBProps) {
  const [answers, setAnswers] = useState<SurveyAnswer[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const currentQuestion = SURVEY_B_QUESTIONS[currentQuestionIndex];
  const progressPercentage = ((currentQuestionIndex + 1) / SURVEY_B_QUESTIONS.length) * 100;

  const handleAnswerSelect = useCallback((questionId: string, selectedOption: string) => {
    setAnswers((prev) => {
      const existingIndex = prev.findIndex((a) => a.questionId === questionId);
      const newAnswer: SurveyAnswer = {
        questionId,
        selectedOption,
        timestamp: new Date(),
      };

      if (existingIndex !== -1) {
        const updated = [...prev];
        updated[existingIndex] = newAnswer;
        return updated;
      }
      return [...prev, newAnswer];
    });

    // Clear validation error for this question
    setValidationErrors((prev) => {
      const updated = { ...prev };
      delete updated[questionId];
      return updated;
    });
  }, []);

  const handleNextQuestion = useCallback(() => {
    // Validate current question is answered
    const currentAnswer = answers.find((a) => a.questionId === currentQuestion.id);
    if (!currentAnswer) {
      setValidationErrors((prev) => ({
        ...prev,
        [currentQuestion.id]: 'Please select an answer before continuing',
      }));
      return;
    }

    if (currentQuestionIndex < SURVEY_B_QUESTIONS.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
    }
  }, [answers, currentQuestion.id, currentQuestionIndex]);

  const handlePreviousQuestion = useCallback(() => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((prev) => prev - 1);
    }
  }, [currentQuestionIndex]);

  const handleSubmit = useCallback(async () => {
    // Validate all questions are answered
    const unansweredQuestions = SURVEY_B_QUESTIONS.filter(
      (q) => !answers.find((a) => a.questionId === q.id)
    );

    if (unansweredQuestions.length > 0) {
      const currentUnanswered = unansweredQuestions.find((q) => q.id === currentQuestion.id);
      if (currentUnanswered) {
        setValidationErrors((prev) => ({
          ...prev,
          [currentQuestion.id]: 'Please answer this question',
        }));
      }
      return;
    }

    await onSubmit(answers);
  }, [answers, currentQuestion.id, onSubmit]);

  const getCurrentAnswer = () => {
    const answer = answers.find((a) => a.questionId === currentQuestion.id);
    return answer?.selectedOption || '';
  };

  return (
    <div className="w-full max-w-2xl mx-auto p-6 space-y-6 bg-white rounded-lg">
      {/* Progress indicator */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm text-gray-600">
          <span>Question {currentQuestionIndex + 1} of {SURVEY_B_QUESTIONS.length}</span>
          <span>{Math.round(progressPercentage)}% Complete</span>
        </div>
        <Progress value={progressPercentage} className="h-2" />
      </div>

      {/* Question */}
      <div className="space-y-4">
        <div className="space-y-2">
          <Label className="text-lg font-medium text-black">
            {currentQuestion.text}
          </Label>
          {validationErrors[currentQuestion.id] && (
            <div className="flex items-center gap-2 text-sm text-destructive">
              <AlertCircle className="h-4 w-4" />
              <span>{validationErrors[currentQuestion.id]}</span>
            </div>
          )}
        </div>

        {/* Answer options */}
        <RadioGroup
          value={getCurrentAnswer()}
          onValueChange={(value) => handleAnswerSelect(currentQuestion.id, value)}
          className="space-y-3"
        >
          {currentQuestion.options.map((option, index) => (
            <div key={index} className="flex items-center space-x-2">
              <RadioGroupItem 
                value={option} 
                id={`${currentQuestion.id}-${index}`}
                className="text-gray-700 border-gray-400"
              />
              <Label 
                htmlFor={`${currentQuestion.id}-${index}`}
                className="cursor-pointer flex-1 py-2 text-black"
              >
                {option}
              </Label>
            </div>
          ))}
        </RadioGroup>
      </div>

      {/* Navigation buttons */}
      <div className="flex justify-between pt-6">
        <Button
          variant="outline"
          onClick={handlePreviousQuestion}
          disabled={currentQuestionIndex === 0}
        >
          Previous
        </Button>

        {currentQuestionIndex === SURVEY_B_QUESTIONS.length - 1 ? (
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Submitting...' : 'Submit Survey'}
          </Button>
        ) : (
          <Button onClick={handleNextQuestion}>
            Next
          </Button>
        )}
      </div>
    </div>
  );
}
