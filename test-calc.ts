import { surveyService } from './lib/services/survey-service';

console.log(surveyService.calculateUnifiedScores([
  { questionId: 'c1', selectedOption: 'Never' },
  { questionId: 'c2', selectedOption: 'Very unlikely' },
  { questionId: 'c3', selectedOption: 'Sometimes' },
  { questionId: 'c4', selectedOption: 'Often' }
]));
