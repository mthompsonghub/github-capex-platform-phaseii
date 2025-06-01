import { create } from 'zustand';
import { startOfQuarter, addQuarters } from 'date-fns';
import { QuarterGroup } from '../types';

interface DateState {
  currentDate: Date;
  currentQuarter: number;
  currentYear: number;
  displayOffset: number;
  resetTrigger: number;
  getQuarterRange: () => QuarterGroup[];
  setDisplayOffset: (offset: number) => void;
  resetView: () => void;
}

export const useDateStore = create<DateState>((set, get) => ({
  currentDate: new Date(),
  currentQuarter: Math.floor(new Date().getMonth() / 3) + 1,
  currentYear: new Date().getFullYear(),
  displayOffset: 0,
  resetTrigger: 0,

  getQuarterRange: () => {
    const { currentDate, displayOffset } = get();
    const startQuarter = startOfQuarter(addQuarters(currentDate, displayOffset));
    const quarterGroups: QuarterGroup[] = [];
    let currentGroup: QuarterGroup | null = null;

    for (let i = 0; i < 12; i++) {
      const date = addQuarters(startQuarter, i);
      const year = date.getFullYear();
      const quarter = Math.floor(date.getMonth() / 3) + 1;

      if (!currentGroup || currentGroup.year !== year) {
        if (currentGroup) {
          quarterGroups.push(currentGroup);
        }
        currentGroup = {
          year,
          quarters: [],
        };
      }

      currentGroup.quarters.push({
        quarter,
        label: `Q${quarter}`,
      });
    }

    if (currentGroup && currentGroup.quarters.length > 0) {
      quarterGroups.push(currentGroup);
    }

    return quarterGroups;
  },

  setDisplayOffset: (offset: number) => set({ displayOffset: offset }),
  resetView: () => set(state => ({ displayOffset: 0, resetTrigger: state.resetTrigger + 1 })),
}));