import { create } from "zustand";
import { devtools } from "zustand/middleware";
import {
  fetchAllSchedules,
  createSchedule,
  updateSchedule,
  deleteSchedule,
  bulkAssignSchedule,
} from "../models/schedules-model";
import type { Schedule, BulkAssignRequest } from "../models/schedules-model";

interface SchedulesState {
  schedules: Schedule[];
  loading: boolean;
  error: string | null;

  // Actions
  fetchSchedules: (bustCache?: boolean) => Promise<void>;
  addSchedule: (
    scheduleData: Omit<Schedule, "schedule_id" | "created_at" | "updated_at">
  ) => Promise<void>;
  editSchedule: (
    scheduleId: number,
    scheduleData: Partial<
      Omit<Schedule, "schedule_id" | "created_at" | "updated_at">
    >
  ) => Promise<void>;
  removeSchedule: (scheduleId: number) => Promise<void>;
  assignScheduleBulk: (assignmentData: BulkAssignRequest) => Promise<void>;
  clearError: () => void;
  setLoading: (loading: boolean) => void;
}

export const useSchedulesStore = create<SchedulesState>()(
  devtools(
    (set) => ({
      schedules: [],
      loading: false,
      error: null,

      fetchSchedules: async (bustCache = false) => {
        set({ loading: true, error: null });
        try {
          const response = await fetchAllSchedules(bustCache);

          // Ensure response has the expected structure
          const schedules = response?.results || [];

          set({
            schedules: schedules,
            loading: false,
            error: null,
          });
        } catch (error) {
          console.error("Error in fetchSchedules:", error);
          set({
            schedules: [], // Ensure schedules is always an array
            loading: false,
            error:
              error instanceof Error
                ? error.message
                : "Failed to fetch schedules",
          });
        }
      },

      addSchedule: async (scheduleData) => {
        set({ loading: true, error: null });
        try {
          const newSchedule = await createSchedule(scheduleData);
          set((state) => ({
            schedules: [...state.schedules, newSchedule],
            loading: false,
            error: null,
          }));
        } catch (error) {
          set({
            loading: false,
            error:
              error instanceof Error
                ? error.message
                : "Failed to create schedule",
          });
        }
      },

      editSchedule: async (scheduleId, scheduleData) => {
        set({ loading: true, error: null });
        try {
          const updatedSchedule = await updateSchedule(
            scheduleId,
            scheduleData
          );
          set((state) => ({
            schedules: state.schedules.map((schedule) =>
              schedule.schedule_id === scheduleId ? updatedSchedule : schedule
            ),
            loading: false,
            error: null,
          }));
        } catch (error) {
          set({
            loading: false,
            error:
              error instanceof Error
                ? error.message
                : "Failed to update schedule",
          });
        }
      },

      removeSchedule: async (scheduleId) => {
        set({ loading: true, error: null });
        try {
          await deleteSchedule(scheduleId);
          set((state) => ({
            schedules: state.schedules.filter(
              (schedule) => schedule.schedule_id !== scheduleId
            ),
            loading: false,
            error: null,
          }));
        } catch (error) {
          set({
            loading: false,
            error:
              error instanceof Error
                ? error.message
                : "Failed to delete schedule",
          });
        }
      },

      assignScheduleBulk: async (assignmentData) => {
        set({ loading: true, error: null });
        try {
          await bulkAssignSchedule(assignmentData);
          set({
            loading: false,
            error: null,
          });
        } catch (error) {
          set({
            loading: false,
            error:
              error instanceof Error
                ? error.message
                : "Failed to assign schedule",
          });
        }
      },

      clearError: () => set({ error: null }),

      setLoading: (loading) => set({ loading }),
    }),
    {
      name: "schedules-store",
    }
  )
);

// Selector hooks for better performance
export const useSchedules = () =>
  useSchedulesStore((state) => state.schedules || []);
export const useSchedulesLoading = () =>
  useSchedulesStore((state) => state.loading);
export const useSchedulesError = () =>
  useSchedulesStore((state) => state.error);

// Individual action hooks to prevent re-renders and infinite loops
export const useFetchSchedules = () =>
  useSchedulesStore((state) => state.fetchSchedules);
export const useAddSchedule = () =>
  useSchedulesStore((state) => state.addSchedule);
export const useEditSchedule = () =>
  useSchedulesStore((state) => state.editSchedule);
export const useRemoveSchedule = () =>
  useSchedulesStore((state) => state.removeSchedule);
export const useAssignScheduleBulk = () =>
  useSchedulesStore((state) => state.assignScheduleBulk);

// Combined actions hook (use with caution in useEffect dependencies)
export const useSchedulesActions = () =>
  useSchedulesStore((state) => ({
    fetchSchedules: state.fetchSchedules,
    addSchedule: state.addSchedule,
    editSchedule: state.editSchedule,
    removeSchedule: state.removeSchedule,
    assignScheduleBulk: state.assignScheduleBulk,
    clearError: state.clearError,
    setLoading: state.setLoading,
  }));
