import { SurveyService } from './survey-service';
import { SurveyAnswer } from '@/types/survey';

const surveyService = new SurveyService();

const responses: SurveyAnswer[] = [
  { questionId: 'c1', selectedOption: 'Never', timestamp: new Date() },
  { questionId: 'c2', selectedOption: 'Very unlikely', timestamp: new Date() },
  { questionId: 'c3', selectedOption: 'Sometimes', timestamp: new Date() },
  { questionId: 'c4', selectedOption: 'Often', timestamp: new Date() },
];

// @ts-ignore to access private method for testing
const result = surveyService.calculateUnifiedScores(responses);

console.log(result);
