import { useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useKPIStore } from '../stores/kpiStore';
import toast from 'react-hot-toast';
import { KPITarget, KPIActual } from '../types';

export function useKPISubscription(projectId?: string) {
  const { updateTarget, updateActual, removeTarget, removeActual } = useKPIStore();

  useEffect(() => {
    // Subscribe to KPI targets changes
    const targetsSubscription = supabase
      .channel('kpi-targets-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'kpi_targets',
          filter: projectId ? `project_id=eq.${projectId}` : undefined
        },
        (payload) => {
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            updateTarget(payload.new as KPITarget);
            toast.success('KPI target updated', { id: 'kpi-target-update' });
          } else if (payload.eventType === 'DELETE') {
            removeTarget(payload.old.id);
          }
        }
      )
      .subscribe();

    // Subscribe to KPI actuals changes
    const actualsSubscription = supabase
      .channel('kpi-actuals-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'kpi_actuals',
          filter: projectId ? `project_id=eq.${projectId}` : undefined
        },
        (payload) => {
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            updateActual(payload.new as KPIActual);
            toast.success('KPI actual updated', { id: 'kpi-actual-update' });
          } else if (payload.eventType === 'DELETE') {
            removeActual(payload.old.id);
          }
        }
      )
      .subscribe();

    // Cleanup subscriptions
    return () => {
      targetsSubscription.unsubscribe();
      actualsSubscription.unsubscribe();
    };
  }, [projectId, updateTarget, updateActual, removeTarget, removeActual]);
} 