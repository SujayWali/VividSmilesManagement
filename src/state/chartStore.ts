import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { indexedDBStorage } from 'zustand-indexeddb-storage';

// Zustand persist expects getItem to always return a Promise
const asyncIndexedDBStorage = {
  ...indexedDBStorage,
  getItem: async (name: string) => {
    const value = await indexedDBStorage.getItem(name);
    return value ? JSON.parse(value) : null;
  },
  setItem: (name: string, value: any) => {
    indexedDBStorage.setItem(name, JSON.stringify(value));
  },
};
import { z } from 'zod';

// Types
export type NumberingSystem = 'universal' | 'fdi' | 'palmer';
export type Dentition = 'adult' | 'primary' | 'mixed';
export type Surface = 'O' | 'M' | 'D' | 'B' | 'F' | 'L' | 'P' | 'I' | 'C';
export type TreatmentStatus = 'planned' | 'completed' | 'failed';

export interface Treatment {
  id: string;
  tooth: number;
  surfaces: Surface[];
  type: string;
  status: TreatmentStatus;
  provider: string;
  date: string;
  fee?: number;
  duration?: number;
  shade?: string;
  material?: string;
  notes?: string;
  attachments?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface ToothNote {
  id: string;
  tooth: number;
  text: string;
  createdAt: string;
  userId: string;
}

export interface Chart {
  patientId: string;
  numberingSystem: NumberingSystem;
  dentition: Dentition;
  treatments: Treatment[];
  notes: ToothNote[];
  missing: number[];
  erupting: number[];
  audit: AuditLog[];
}

export interface AuditLog {
  id: string;
  userId: string;
  timestamp: string;
  action: string;
  payload: any;
}

interface ChartStore {
  selectedTeeth: number[];
  numberingSystem: NumberingSystem;
  dentition: Dentition;
  chart: Chart | null;
  toggleTooth: (n: number) => void;
  selectRange: (a: number, b: number) => void;
  clearSelection: () => void;
  addTreatment: (payload: Omit<Treatment, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateTreatment: (id: string, patch: Partial<Treatment>) => void;
  deleteTreatment: (id: string) => void;
  addNote: (tooth: number, text: string, userId: string) => void;
  setNumberingSystem: (ns: NumberingSystem) => void;
  setDentition: (d: Dentition) => void;
  loadChart: (patientId: string, chart?: Chart) => void;
  saveChart: (patientId: string) => Promise<void>;
}

export const useChartStore = create<ChartStore>()(
  persist(
    (set, get) => ({
      selectedTeeth: [],
      numberingSystem: 'universal',
      dentition: 'adult',
      chart: null,
      toggleTooth: (n: number) => {
        set((state: ChartStore) => {
          const selected = state.selectedTeeth.includes(n)
            ? state.selectedTeeth.filter((t: number) => t !== n)
            : [...state.selectedTeeth, n];
          return { selectedTeeth: selected };
        });
      },
      selectRange: (a: number, b: number) => {
        const range = Array.from({ length: Math.abs(b - a) + 1 }, (_, i) => a < b ? a + i : a - i);
        set((state: ChartStore) => ({ ...state, selectedTeeth: range }));
      },
      clearSelection: () => set((state: ChartStore) => ({ ...state, selectedTeeth: [] })),
      addTreatment: (payload: Omit<Treatment, 'id' | 'createdAt' | 'updatedAt'>) => {
        set((state: ChartStore) => {
          if (!state.chart) return {};
          const now = new Date().toISOString();
          const newTreatments = state.selectedTeeth.map((tooth: number) => ({
            ...payload,
            tooth,
            id: `${tooth}-${now}-${Math.random().toString(36).slice(2,8)}`,
            createdAt: now,
            updatedAt: now,
          }));
          return {
            chart: {
              ...state.chart,
              treatments: [...state.chart.treatments, ...newTreatments],
              audit: [
                ...state.chart.audit,
                ...newTreatments.map((t: Treatment) => ({
                  id: `${t.id}-audit`,
                  userId: 'system',
                  timestamp: now,
                  action: 'addTreatment',
                  payload: t,
                }))
              ]
            }
          };
        });
      },
      updateTreatment: (id: string, patch: Partial<Treatment>) => {
        set((state: ChartStore) => {
          if (!state.chart) return {};
          const now = new Date().toISOString();
          return {
            chart: {
              ...state.chart,
              treatments: state.chart.treatments.map((t: Treatment) =>
                t.id === id ? { ...t, ...patch, updatedAt: now } : t
              ),
              audit: [
                ...state.chart.audit,
                {
                  id: `${id}-audit-update-${now}`,
                  userId: 'system',
                  timestamp: now,
                  action: 'updateTreatment',
                  payload: { id, patch },
                }
              ]
            }
          };
        });
      },
      deleteTreatment: (id: string) => {
        set((state: ChartStore) => {
          if (!state.chart) return {};
          const now = new Date().toISOString();
          return {
            chart: {
              ...state.chart,
              treatments: state.chart.treatments.filter((t: Treatment) => t.id !== id),
              audit: [
                ...state.chart.audit,
                {
                  id: `${id}-audit-delete-${now}`,
                  userId: 'system',
                  timestamp: now,
                  action: 'deleteTreatment',
                  payload: { id },
                }
              ]
            }
          };
        });
      },
      addNote: (tooth: number, text: string, userId: string) => {
        set((state: ChartStore) => {
          if (!state.chart) return {};
          const now = new Date().toISOString();
          const note: ToothNote = {
            id: `${tooth}-note-${now}-${Math.random().toString(36).slice(2,8)}`,
            tooth,
            text,
            createdAt: now,
            userId,
          };
          return {
            chart: {
              ...state.chart,
              notes: [...state.chart.notes, note],
              audit: [
                ...state.chart.audit,
                {
                  id: `${note.id}-audit`,
                  userId,
                  timestamp: now,
                  action: 'addNote',
                  payload: note,
                }
              ]
            }
          };
        });
      },
      setNumberingSystem: (ns: NumberingSystem) => set((state: ChartStore) => ({ ...state, numberingSystem: ns })),
      setDentition: (d: Dentition) => set((state: ChartStore) => ({ ...state, dentition: d })),
      loadChart: (patientId: string, chart?: Chart) => {
        if (chart) {
          set((state: ChartStore) => ({ ...state, chart }));
        } else {
          set((state: ChartStore) => ({
            ...state,
            chart: {
              patientId,
              numberingSystem: 'universal',
              dentition: 'adult',
              treatments: [],
              notes: [],
              missing: [],
              erupting: [],
              audit: [],
            }
          }));
        }
      },
      saveChart: async (patientId: string) => {
        // Placeholder: implement API call to save chart
        // await fetch(`/api/patients/${patientId}/chart`, { method: 'PUT', body: JSON.stringify(get().chart) });
      },
    }),
    {
      name: 'tooth-chart-store',
      storage: asyncIndexedDBStorage,
      partialize: (state: ChartStore) => ({
        selectedTeeth: state.selectedTeeth,
        numberingSystem: state.numberingSystem,
        dentition: state.dentition,
        chart: state.chart,
      }),
    }
  )
);
