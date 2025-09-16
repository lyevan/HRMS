import { create } from "zustand";
import {
  type Holiday,
  fetchAllHolidays,
  fetchCurrentYearHolidays,
  fetchUpcomingHolidays,
  createHoliday,
  updateHoliday,
  deleteHoliday,
  initializePhilippineHolidays,
  type CreateHolidayRequest,
  type UpdateHolidayRequest,
} from "@/models/holidays-model";

interface HolidaysState {
  holidays: Holiday[];
  currentYearHolidays: Holiday[];
  upcomingHolidays: Holiday[];
  loading: boolean;
  error: string | null;

  // Actions
  fetchHolidays: () => Promise<void>;
  fetchCurrentYearHolidays: () => Promise<void>;
  fetchUpcomingHolidays: () => Promise<void>;
  createHoliday: (holidayData: CreateHolidayRequest) => Promise<Holiday>;
  updateHoliday: (
    holidayId: number,
    holidayData: UpdateHolidayRequest
  ) => Promise<Holiday>;
  deleteHoliday: (holidayId: number) => Promise<void>;
  initializePhilippineHolidays: () => Promise<any>;
  setError: (error: string | null) => void;
  clearError: () => void;
}

export const useHolidaysStore = create<HolidaysState>((set, get) => ({
  holidays: [],
  currentYearHolidays: [],
  upcomingHolidays: [],
  loading: false,
  error: null,

  fetchHolidays: async () => {
    set({ loading: true, error: null });
    try {
      const holidays = await fetchAllHolidays();
      set({ holidays, loading: false });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to fetch holidays";
      set({ error: errorMessage, loading: false });
      throw error;
    }
  },

  fetchCurrentYearHolidays: async () => {
    set({ loading: true, error: null });
    try {
      const currentYearHolidays = await fetchCurrentYearHolidays();
      set({ currentYearHolidays, loading: false });
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to fetch current year holidays";
      set({ error: errorMessage, loading: false });
      throw error;
    }
  },

  fetchUpcomingHolidays: async () => {
    set({ loading: true, error: null });
    try {
      const upcomingHolidays = await fetchUpcomingHolidays();
      set({ upcomingHolidays, loading: false });
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to fetch upcoming holidays";
      set({ error: errorMessage, loading: false });
      throw error;
    }
  },

  createHoliday: async (holidayData: CreateHolidayRequest) => {
    set({ loading: true, error: null });
    try {
      const newHoliday = await createHoliday(holidayData);

      // Update the holidays arrays
      const { holidays } = get();
      const updatedHolidays = [...holidays, newHoliday].sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
      );

      set({
        holidays: updatedHolidays,
        currentYearHolidays: updatedHolidays.filter(
          (h) => new Date(h.date).getFullYear() === new Date().getFullYear()
        ),
        loading: false,
      });

      return newHoliday;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to create holiday";
      set({ error: errorMessage, loading: false });
      throw error;
    }
  },

  updateHoliday: async (
    holidayId: number,
    holidayData: UpdateHolidayRequest
  ) => {
    set({ loading: true, error: null });
    try {
      const updatedHoliday = await updateHoliday(holidayId, holidayData);

      // Update the holidays arrays
      const { holidays } = get();
      const updatedHolidays = holidays
        .map((h) => (h.holiday_id === holidayId ? updatedHoliday : h))
        .sort(
          (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
        );

      set({
        holidays: updatedHolidays,
        currentYearHolidays: updatedHolidays.filter(
          (h) => new Date(h.date).getFullYear() === new Date().getFullYear()
        ),
        loading: false,
      });

      return updatedHoliday;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to update holiday";
      set({ error: errorMessage, loading: false });
      throw error;
    }
  },

  deleteHoliday: async (holidayId: number) => {
    set({ loading: true, error: null });
    try {
      await deleteHoliday(holidayId);

      // Remove from all arrays
      const { holidays, currentYearHolidays, upcomingHolidays } = get();
      set({
        holidays: holidays.filter((h) => h.holiday_id !== holidayId),
        currentYearHolidays: currentYearHolidays.filter(
          (h) => h.holiday_id !== holidayId
        ),
        upcomingHolidays: upcomingHolidays.filter(
          (h) => h.holiday_id !== holidayId
        ),
        loading: false,
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to delete holiday";
      set({ error: errorMessage, loading: false });
      throw error;
    }
  },

  initializePhilippineHolidays: async () => {
    set({ loading: true, error: null });
    try {
      const result = await initializePhilippineHolidays();

      // Refresh current year holidays after initialization
      await get().fetchCurrentYearHolidays();

      set({ loading: false });
      return result;
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to initialize Philippine holidays";
      set({ error: errorMessage, loading: false });
      throw error;
    }
  },

  setError: (error: string | null) => set({ error }),
  clearError: () => set({ error: null }),
}));
