import { supabase } from './supabase';
import { KPITarget, KPIActual, ProjectCompletion } from '../types';

export async function getProjectKPIs(projectId: string) {
  const [targetsResponse, actualsResponse, completionResponse] = await Promise.all([
    supabase
      .from('kpi_targets')
      .select('*')
      .eq('project_id', projectId)
      .order('target_date', { ascending: true }),
    supabase
      .from('kpi_actuals')
      .select('*')
      .eq('project_id', projectId)
      .order('completion_date', { ascending: true }),
    supabase
      .from('project_completion')
      .select('*')
      .eq('project_id', projectId)
  ]);

  return {
    targets: targetsResponse.data as KPITarget[],
    actuals: actualsResponse.data as KPIActual[],
    completion: completionResponse.data as ProjectCompletion[]
  };
}

export async function createKPITarget(
  target: Omit<KPITarget, 'id' | 'created_at' | 'updated_at'>
) {
  const { data, error } = await supabase
    .from('kpi_targets')
    .insert([target])
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function createKPIActual(
  actual: Omit<KPIActual, 'id' | 'created_at' | 'updated_at'>
) {
  const { data, error } = await supabase
    .from('kpi_actuals')
    .insert([actual])
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getPhaseWeights(projectType: 'project' | 'asset_purchase') {
  const { data, error } = await supabase
    .from('phase_weights')
    .select('*')
    .eq('project_type', projectType);

  if (error) throw error;
  return data;
}

export async function updateKPITarget(
  targetId: string,
  updates: Partial<Omit<KPITarget, 'id' | 'created_at' | 'updated_at'>>
) {
  const { data, error } = await supabase
    .from('kpi_targets')
    .update(updates)
    .eq('id', targetId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateKPIActual(
  actualId: string,
  updates: Partial<Omit<KPIActual, 'id' | 'created_at' | 'updated_at'>>
) {
  const { data, error } = await supabase
    .from('kpi_actuals')
    .update(updates)
    .eq('id', actualId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteKPITarget(targetId: string) {
  const { error } = await supabase
    .from('kpi_targets')
    .delete()
    .eq('id', targetId);

  if (error) throw error;
}

export async function deleteKPIActual(actualId: string) {
  const { error } = await supabase
    .from('kpi_actuals')
    .delete()
    .eq('id', actualId);

  if (error) throw error;
} 