'use client';

import { useState, useCallback } from 'react';
import { SurveyQuestion, SurveyAnswer, SURVEY_QUESTIONS } from '@/types/survey';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Progress } from '@/components/ui/progress';
import { AlertCircle } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';

interface SurveyFormProps {
  onSubmit: (responses: SurveyAnswer[]) => Promise<void>;
  isSubmitting: boolean;
  questions?: readonly SurveyQuestion[] | SurveyQuestion[];
}

export default function SurveyForm({ onSubmit, isSubmitting, questions }: SurveyFormProps) {
  const qs = (questions as readonly SurveyQuestion[]) || SURVEY_QUESTIONS;
  const [answers, setAnswers] = useState<SurveyAnswer[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const currentQuestion = qs[currentQuestionIndex];
  const progressPercentage = ((currentQuestionIndex + 1) / qs.length) * 100;

  const handleSingleSelect = useCallback((questionId: string, selectedOption: string) => {
    setAnswers((prev) => {
      // Remove any existing answers for this questionId
      const filtered = prev.filter((a) => a.questionId !== questionId);
      const newAnswer: SurveyAnswer = {
        questionId,
        selectedOption,
        timestamp: new Date(),
      };
      return [...filtered, newAnswer];
    });

    setValidationErrors((prev) => {
      const updated = { ...prev };
      delete updated[questionId];
      return updated;
    });
  }, []);

  const handleMultiToggle = useCallback((questionId: string, option: string, checked: boolean) => {
    setAnswers((prev) => {
      const existing = prev.find((a) => a.questionId === questionId);
      const currentOptions = Array.isArray(existing?.selectedOption)
        ? [...existing.selectedOption]
        : existing?.selectedOption ? [existing.selectedOption] : [];

      let nextOptions: string[];
      if (checked) {
        nextOptions = Array.from(new Set([...currentOptions, option]));
      } else {
        nextOptions = currentOptions.filter((opt) => opt !== option);
      }

      const filtered = prev.filter((a) => a.questionId !== questionId);
      if (nextOptions.length === 0) return filtered;

      return [
        ...filtered,
        { questionId, selectedOption: nextOptions, timestamp: new Date() },
      ];
    });

    setValidationErrors((prev) => {
      const updated = { ...prev };
      delete updated[questionId];
      return updated;
    });
  }, []);

  const handleNextQuestion = useCallback(() => {
    // Small delay to ensure state update completes
    setTimeout(() => {
      // Validate current question is answered
      const countForCurrent = answers.filter((a) => a.questionId === currentQuestion.id).length;
      const needsAtLeast = currentQuestion.multi ? 1 : 1;
      if (countForCurrent < needsAtLeast) {
        setValidationErrors((prev) => ({
          ...prev,
          [currentQuestion.id]: 'Please select an answer before continuing',
        }));
        return;
      }

      if (currentQuestionIndex < qs.length - 1) {
        setCurrentQuestionIndex((prev) => prev + 1);
      }
    }, 50);
  }, [answers, currentQuestion.id, currentQuestionIndex, qs.length, currentQuestion.multi]);

  const handlePreviousQuestion = useCallback(() => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((prev) => prev - 1);
    }
  }, [currentQuestionIndex]);

  const handleSubmit = useCallback(async () => {
    // Validate all questions are answered
    const unansweredQuestions = qs.filter((q) => {
      const count = answers.filter((a) => a.questionId === q.id).length;
      return q.multi ? count < 1 : count !== 1;
    });

    if (unansweredQuestions.length > 0) {
      const currentUnanswered = unansweredQuestions.find((q) => q.id === currentQuestion.id);
      if (currentUnanswered) {
        setValidationErrors((prev) => ({
          ...prev,
          [currentQuestion.id]: 'Please answer this question before submitting',
        }));
      } else {
        // If current question is answered but others aren't, navigate to first unanswered
        const firstUnanswered = unansweredQuestions[0];
        const firstUnansweredIndex = qs.findIndex((q) => q.id === firstUnanswered.id);
        if (firstUnansweredIndex !== -1) {
          setCurrentQuestionIndex(firstUnansweredIndex);
          setValidationErrors((prev) => ({
            ...prev,
            [firstUnanswered.id]: 'Please answer this question',
          }));
        }
      }
      return;
    }

    // Clear any validation errors before submitting
    setValidationErrors({});
    await onSubmit(answers);
  }, [answers, currentQuestion.id, onSubmit, qs]);

  const isOptionSelected = (questionId: string, option: string) => {
    const answer = answers.find((a) => a.questionId === questionId);
    if (!answer) return false;
    return Array.isArray(answer.selectedOption)
      ? answer.selectedOption.includes(option)
      : answer.selectedOption === option;
  };

  const getCurrentAnswer = () => {
    const answer = answers.find((a) => a.questionId === currentQuestion.id);
    if (!answer) return '';
    return Array.isArray(answer.selectedOption) ? '' : answer.selectedOption;
  };

  return (
    <div className="w-full max-w-2xl mx-auto p-6 space-y-6 bg-white rounded-lg">
      {/* Progress indicator */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm text-gray-600">
          <span>Question {currentQuestionIndex + 1} of {qs.length}</span>
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
        {currentQuestion.multi ? (
          <div className="space-y-3">
            {currentQuestion.options.map((option, index) => (
              <div key={index} className="flex items-center space-x-2">
                <Checkbox
                  id={`${currentQuestion.id}-${index}`}
                  checked={isOptionSelected(currentQuestion.id, option)}
                  onCheckedChange={(checked) => handleMultiToggle(currentQuestion.id, option, Boolean(checked))}
                />
                <Label
                  htmlFor={`${currentQuestion.id}-${index}`}
                  className="cursor-pointer flex-1 py-2 text-black"
                >
                  {option}
                </Label>
              </div>
            ))}
          </div>
        ) : (
          <RadioGroup
            value={getCurrentAnswer()}
            onValueChange={(value) => handleSingleSelect(currentQuestion.id, value)}
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
        )}
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

        {currentQuestionIndex === qs.length - 1 ? (
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
