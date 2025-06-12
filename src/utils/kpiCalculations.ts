import { KPITarget, KPIActual } from '../types';

interface CompletionResult {
  actualPercentage: number;
  expectedPercentage: number;
}

export function calculateProjectCompletion(
  targets: KPITarget[],
  actuals: KPIActual[]
): CompletionResult {
  if (!targets.length) return { actualPercentage: 0, expectedPercentage: 0 };

  // Calculate weighted completion based on phase weights
  const totalWeight = targets.reduce((sum, target) => sum + target.weight, 0);
  
  const actualCompletion = actuals.reduce((sum, actual) => {
    const target = targets.find(t => t.id === actual.target_id);
    return sum + (target ? (actual.value / target.target_value) * target.weight : 0);
  }, 0);

  // Calculate expected completion based on current date
  const now = new Date();
  const expectedCompletion = targets.reduce((sum, target) => {
    const startDate = new Date(target.start_date);
    const endDate = new Date(target.end_date);
    const totalDays = endDate.getTime() - startDate.getTime();
    const elapsedDays = now.getTime() - startDate.getTime();
    const expectedProgress = Math.min(1, Math.max(0, elapsedDays / totalDays));
    return sum + (expectedProgress * target.weight);
  }, 0);

  return {
    actualPercentage: Math.round((actualCompletion / totalWeight) * 100),
    expectedPercentage: Math.round((expectedCompletion / totalWeight) * 100)
  };
} 