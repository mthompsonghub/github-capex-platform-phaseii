import { create } from 'zustand';
import { KPITarget, KPIActual } from '../types';

interface KPIStore {
  targets: Record<string, KPITarget>;
  actuals: Record<string, KPIActual>;
  updateTarget: (target: KPITarget) => void;
  updateActual: (actual: KPIActual) => void;
  removeTarget: (id: string) => void;
  removeActual: (id: string) => void;
  reset: () => void;
}

export const useKPIStore = create<KPIStore>((set) => ({
  targets: {},
  actuals: {},
  
  updateTarget: (target) => 
    set((state) => ({
      targets: { ...state.targets, [target.id]: target }
    })),
    
  updateActual: (actual) =>
    set((state) => ({
      actuals: { ...state.actuals, [actual.id]: actual }
    })),
    
  removeTarget: (id) =>
    set((state) => {
      const { [id]: _, ...rest } = state.targets;
      return { targets: rest };
    }),
    
  removeActual: (id) =>
    set((state) => {
      const { [id]: _, ...rest } = state.actuals;
      return { actuals: rest };
    }),
    
  reset: () => set({ targets: {}, actuals: {} })
})); 