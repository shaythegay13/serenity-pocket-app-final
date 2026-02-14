'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { format, subMonths } from 'date-fns';
import { getUserSurveyHistoryFiltered } from '@/lib/surveyService';
import { TimeRangeFilter, ChartDataPoint, getScoreInterpretation } from '@/types/survey';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { TrendingDown, TrendingUp, Minus, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface SurveyHistoryDashboardProps {
  userId: string;
}

export default function SurveyHistoryDashboard({ userId }: SurveyHistoryDashboardProps) {
  const router = useRouter();
  const [surveyHistory, setSurveyHistory] = useState<any>(null);
  const [selectedTimeRange, setSelectedTimeRange] = useState<TimeRangeFilter>('all-time');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchHistory = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const history = await getUserSurveyHistoryFiltered(userId, selectedTimeRange);
        setSurveyHistory(history);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to fetch survey history';
        setError(errorMessage);
      } finally {
        setIsLoading(false);
      }
    };

    fetchHistory();
  }, [userId, selectedTimeRange]);

  const chartData = useMemo(() => {
    if (!surveyHistory || !surveyHistory.surveys) return [];

    return surveyHistory.surveys
      .map((survey: any) => ({
        date: new Date(survey.createdAt),
        score: survey.score,
        label: format(new Date(survey.createdAt), 'MMM dd, yyyy'),
      }))
      .sort((a: ChartDataPoint, b: ChartDataPoint) => a.date.getTime() - b.date.getTime());
  }, [surveyHistory]);

  const scoreChange = useMemo(() => {
    if (!surveyHistory || surveyHistory.surveys.length < 2) return null;

    const latest = surveyHistory.surveys[0].score;
    const previous = surveyHistory.surveys[1].score;
    return latest - previous;
  }, [surveyHistory]);

  const handleTimeRangeChange = (value: TimeRangeFilter) => {
    setSelectedTimeRange(value);
  };

  const handleRetakeSurvey = () => {
    router.push('/gambling-survey');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <p className="text-destructive">{error}</p>
        <Button onClick={() => window.location.reload()}>Retry</Button>
      </div>
    );
  }

  if (!surveyHistory || surveyHistory.surveys.length === 0) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardContent className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
          <p className="text-muted-foreground text-center">
            You haven&apos;t taken any surveys yet. Start by taking your first assessment.
          </p>
          <Button onClick={handleRetakeSurvey}>Take Your First Survey</Button>
        </CardContent>
      </Card>
    );
  }

  const latestScore = surveyHistory.latestScore;
  const interpretation = getScoreInterpretation(latestScore);
  const getScoreColor = (score: number) => {
    if (score >= 1 && score <= 17) return '#10b981'; // Green (Low)
    if (score >= 18 && score <= 34) return '#eab308'; // Yellow (Medium)
    if (score >= 35 && score <= 50) return '#f97316'; // Orange (High)
    return '#10b981'; // Green for 0 (Low)
  };

  return (
    <div className="space-y-6">
      {/* Latest Score Card */}
      <Card>
        <CardHeader>
          <CardTitle>Your Latest Assessment</CardTitle>
          <CardDescription>
            Completed on {format(new Date(surveyHistory.surveys[0].createdAt), 'MMMM d, yyyy')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <div className="text-5xl font-bold" style={{ color: getScoreColor(latestScore) }}>
                {latestScore}
              </div>
              <div className="text-lg font-medium">{interpretation}</div>
            </div>

            {scoreChange !== null && (
              <div className="flex items-center gap-2">
                {scoreChange > 0 ? (
                  <TrendingUp className="h-5 w-5 text-destructive" />
                ) : scoreChange < 0 ? (
                  <TrendingDown className="h-5 w-5 text-green-500" />
                ) : (
                  <Minus className="h-5 w-5 text-muted-foreground" />
                )}
                <div className="text-lg">
                  <span className={scoreChange > 0 ? 'text-destructive' : scoreChange < 0 ? 'text-green-500' : 'text-muted-foreground'}>
                    {scoreChange > 0 ? '+' : ''}{scoreChange}
                  </span>
                  <span className="text-muted-foreground text-sm ml-1">
                    from previous
                  </span>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Progress Chart */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Progress Over Time</CardTitle>
              <CardDescription>Track your assessment scores</CardDescription>
            </div>
            <Select value={selectedTimeRange} onValueChange={handleTimeRangeChange}>
              <SelectTrigger className="w-[160px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="three-months">Last 3 months</SelectItem>
                <SelectItem value="six-months">Last 6 months</SelectItem>
                <SelectItem value="one-year">Last year</SelectItem>
                <SelectItem value="all-time">All time</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis
                  dataKey="label"
                  className="text-xs"
                  angle={-45}
                  textAnchor="end"
                  height={70}
                />
                <YAxis
                  domain={[0, 50]}
                  ticks={[0, 10, 20, 30, 40, 50]}
                  className="text-xs"
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--background)',
                    border: '1px solid var(--border)',
                    borderRadius: '6px',
                  }}
                  formatter={(value: number) => [
                    `Score: ${value} (${getScoreInterpretation(value)})`,
                    '',
                  ]}
                />
                <Line
                  type="monotone"
                  dataKey="score"
                  stroke={getScoreColor(latestScore)}
                  strokeWidth={2}
                  dot={{ fill: getScoreColor(latestScore), r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[300px] text-muted-foreground">
              No data available for the selected time range
            </div>
          )}
        </CardContent>
      </Card>

      {/* Survey History List */}
      <Card>
        <CardHeader>
          <CardTitle>Assessment History</CardTitle>
          <CardDescription>All your completed assessments</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {surveyHistory.surveys.slice(0, 10).map((survey: any) => (
              <div
                key={survey.id}
                className="flex justify-between items-center p-3 rounded-lg border"
              >
                <div>
                  <div className="font-medium">
                    {format(new Date(survey.createdAt), 'MMMM d, yyyy')}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {format(new Date(survey.createdAt), 'h:mm a')}
                    {survey.isInitialSurvey && (
                      <span className="ml-2 text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                        Initial Assessment
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold" style={{ color: getScoreColor(survey.score) }}>
                    {survey.score}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {getScoreInterpretation(survey.score)}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <Button
            onClick={handleRetakeSurvey}
            className="w-full mt-6"
            variant="outline"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Retake Survey
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
