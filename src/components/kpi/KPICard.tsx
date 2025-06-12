import { Project } from '../../types';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Progress } from '../ui/progress';
import { CheckCircle, AlertCircle } from 'lucide-react';

interface KPICardProps {
  project: Project;
  completion: {
    actualPercentage: number;
    expectedPercentage: number;
    phaseCompletions: {
      phase: string;
      actual: number;
      target: number;
    }[];
  };
  isOnTrack: boolean;
}

export function KPICard({ project, completion, isOnTrack }: KPICardProps) {
  const getStatusColor = (actual: number, target: number) => {
    const ratio = actual / target;
    if (ratio >= 1) return 'bg-green-500';
    if (ratio >= 0.8) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">
          {project.name}
        </CardTitle>
        {isOnTrack ? (
          <CheckCircle className="h-4 w-4 text-green-500" />
        ) : (
          <AlertCircle className="h-4 w-4 text-red-500" />
        )}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">
          {Math.round(completion.actualPercentage)}%
        </div>
        <p className="text-xs text-muted-foreground">
          Expected: {Math.round(completion.expectedPercentage)}%
        </p>
        <div className="mt-4 space-y-3">
          {completion.phaseCompletions.map(({ phase, actual, target }) => (
            <div key={phase} className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="capitalize">{phase}</span>
                <span>{Math.round(actual)}%</span>
              </div>
              <Progress
                value={(actual / target) * 100}
                className={getStatusColor(actual, target)}
              />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
} 