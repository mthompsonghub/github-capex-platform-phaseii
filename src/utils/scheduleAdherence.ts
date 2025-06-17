// utils/scheduleAdherence.ts - Utility for calculating schedule adherence

import { CapexProject, ScheduleAdherence } from '../types/capex';
import { calculateBusinessDays } from './businessDays';

/**
 * Calculate schedule adherence for a project
 * Returns the percentage of time remaining vs. work remaining
 */
export function calculateScheduleAdherence(project: CapexProject): ScheduleAdherence {
  const today = new Date();
  const adherence: ScheduleAdherence = {
    overall: 0,
    byPhase: {
      feasibility: 0,
      planning: 0,
      execution: 0,
      close: 0
    }
  };

  // Calculate adherence for each phase
  if (project.feasibilityStartDate && project.feasibilityEndDate) {
    adherence.byPhase.feasibility = calculatePhaseAdherence(
      project.feasibilityStartDate,
      project.feasibilityEndDate,
      project.phases.feasibility?.completion || 0
    );
  }

  if (project.planningStartDate && project.planningEndDate) {
    adherence.byPhase.planning = calculatePhaseAdherence(
      project.planningStartDate,
      project.planningEndDate,
      project.phases.planning?.completion || 0
    );
  }

  if (project.executionStartDate && project.executionEndDate) {
    adherence.byPhase.execution = calculatePhaseAdherence(
      project.executionStartDate,
      project.executionEndDate,
      project.phases.execution?.completion || 0
    );
  }

  if (project.closeStartDate && project.closeEndDate) {
    adherence.byPhase.close = calculatePhaseAdherence(
      project.closeStartDate,
      project.closeEndDate,
      project.phases.close?.completion || 0
    );
  }

  // Calculate overall adherence based on phase weights
  const weights = getPhaseWeights(project.type);
  let totalWeight = 0;
  let weightedSum = 0;

  Object.entries(adherence.byPhase).forEach(([phase, value]) => {
    const weight = weights[phase as keyof typeof weights] || 0;
    if (weight > 0) {
      totalWeight += weight;
      weightedSum += value * weight;
    }
  });

  adherence.overall = totalWeight > 0 ? Math.round(weightedSum / totalWeight) : 0;

  return adherence;
}

/**
 * Calculate adherence for a single phase
 * Returns the percentage of time remaining vs. work remaining
 */
function calculatePhaseAdherence(
  startDate: string,
  endDate: string,
  completion: number
): number {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const today = new Date();

  // If the phase hasn't started yet
  if (today < start) {
    return 100;
  }

  // If the phase is complete
  if (completion >= 100) {
    return 100;
  }

  // Calculate total business days in the phase
  const totalDays = calculateBusinessDays(start, end);
  if (totalDays === 0) return 0;

  // Calculate business days elapsed
  const daysElapsed = calculateBusinessDays(start, today);
  if (daysElapsed === 0) return 0;

  // Calculate time progress percentage
  const timeProgress = (daysElapsed / totalDays) * 100;

  // Calculate adherence (work progress vs time progress)
  const adherence = (completion / timeProgress) * 100;

  // Cap at 100% and ensure non-negative
  return Math.min(100, Math.max(0, Math.round(adherence)));
}

/**
 * Get phase weights based on project type
 */
function getPhaseWeights(type: 'Complex Project' | 'Asset Purchase'): Record<string, number> {
  if (type === 'Complex Project') {
    return {
      feasibility: 15,
      planning: 35,
      execution: 45,
      close: 5
    };
  } else {
    return {
      planning: 45,
      execution: 50,
      close: 5
    };
  }
} 