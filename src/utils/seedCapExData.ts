import { supabase } from '../lib/supabase';

const capexProjects = [
  {
    name: 'Cardinal Capital Project',
    type: 'project',
    status: 'on_track',
    priority: 'high',
    owner: 'T. Bolt',
    start_date: '2023-12-31',
    end_date: '2024-12-30',
    total_budget: 1604000,
    actual_cost: 123000,
    completion_percentage: 45,
    description: 'Cardinal capital improvement project'
  },
  {
    name: 'DeltaV Migration',
    type: 'project',
    status: 'on_track',
    priority: 'high',
    owner: 'M. Smith',
    start_date: '2023-12-31',
    end_date: '2024-12-30',
    total_budget: 2500000,
    actual_cost: 1250000,
    completion_percentage: 52,
    description: 'DeltaV system migration project'
  },
  {
    name: 'Capital IT Server Replacement',
    type: 'asset_purchase',
    status: 'on_track',
    priority: 'medium',
    owner: 'R. Johnson',
    start_date: '2024-01-01',
    end_date: '2024-12-31',
    total_budget: 750000,
    actual_cost: 600000,
    completion_percentage: 66,
    description: 'IT infrastructure server replacement'
  }
];

export async function seedCapExProjects() {
  const { data, error } = await supabase.from('capex_projects').insert(capexProjects);
  if (error) {
    console.error('Error seeding CapEx projects:', error);
    return { success: false, error };
  }
  console.log('Seeded CapEx projects:', data);
  return { success: true, data };
} 