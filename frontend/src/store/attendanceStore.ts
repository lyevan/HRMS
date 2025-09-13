import { create } from "zustand";
import { devtools } from "zustand/middleware";
import type {
  AttendanceRecord,
  AttendanceSummary,
  TodayAttendanceRecord,
  ClockInRequest,
  ClockOutRequest,
  ManualAttendanceRequest,
} from "@/models/attendance-model";
import {
  fetchAllAttendance,
  fetchEmployeeAttendance,
  fetchTodayAttendance,
  fetchEmployeeAttendanceSummary,
  clockInEmployee,
  clockOutEmployee,
  createManualAttendance,
  updateAttendanceRecord,
  deleteAttendanceRecord,
  calculateAttendanceStats,
} from "@/models/attendance-model";

interface AttendanceStore {
  // State
  attendanceRecords: AttendanceRecord[];
  todayAttendance: TodayAttendanceRecord[];
  selectedRecord: AttendanceRecord | null;
  attendanceSummary: AttendanceSummary | null;
  loading: boolean;
  error: string | null;
  clockingIn: boolean;
  clockingOut: boolean;
  submittingManual: boolean;

  // Computed stats
  attendanceStats: {
    total: number;
    present: number;
    absent: number;
    late: number;
    undertime: number;
    halfday: number;
    leave: number;
    totalHours: number;
    averageHours: number;
    attendanceRate: number;
  };

  // Actions
  setAttendanceRecords: (records: AttendanceRecord[]) => void;
  setTodayAttendance: (records: TodayAttendanceRecord[]) => void;
  setSelectedRecord: (record: AttendanceRecord | null) => void;
  setAttendanceSummary: (summary: AttendanceSummary | null) => void;
  updateAttendanceRecord: (updatedRecord: AttendanceRecord) => void;
  addAttendanceRecord: (newRecord: AttendanceRecord) => void;
  removeAttendanceRecord: (attendanceId: number) => void;

  // API Actions
  fetchAttendanceRecords: (bustCache?: boolean) => Promise<void>;
  fetchEmployeeAttendanceRecords: (employeeId: string) => Promise<void>;
  fetchTodayAttendanceRecords: () => Promise<void>;
  fetchEmployeeSummary: (
    employeeId: string,
    startDate?: string,
    endDate?: string
  ) => Promise<void>;
  clockIn: (data: ClockInRequest) => Promise<void>;
  clockOut: (data: ClockOutRequest) => Promise<void>;
  createManualRecord: (data: ManualAttendanceRequest) => Promise<void>;
  updateRecord: (
    attendanceId: number,
    data: Partial<ManualAttendanceRequest>
  ) => Promise<void>;
  deleteRecord: (attendanceId: number) => Promise<void>;

  // Utility actions
  clearError: () => void;
  setLoading: (loading: boolean) => void;
  setClockingIn: (clocking: boolean) => void;
  setClockingOut: (clocking: boolean) => void;
  setSubmittingManual: (submitting: boolean) => void;
  refetch: (bustCache?: boolean) => Promise<void>;
}

export const useAttendanceStore = create<AttendanceStore>()(
  devtools(
    (set, get) => ({
      // Initial state
      attendanceRecords: [],
      todayAttendance: [],
      selectedRecord: null,
      attendanceSummary: null,
      loading: false,
      error: null,
      clockingIn: false,
      clockingOut: false,
      submittingManual: false,

      // Computed stats - will be recalculated when attendance records change
      get attendanceStats() {
        const { attendanceRecords } = get();
        return calculateAttendanceStats(attendanceRecords);
      },

      // Set all attendance records
      setAttendanceRecords: (records) =>
        set({ attendanceRecords: records }, false, "setAttendanceRecords"),

      // Set today's attendance
      setTodayAttendance: (records) =>
        set({ todayAttendance: records }, false, "setTodayAttendance"),

      // Set selected record
      setSelectedRecord: (record) =>
        set({ selectedRecord: record }, false, "setSelectedRecord"),

      // Set attendance summary
      setAttendanceSummary: (summary) =>
        set({ attendanceSummary: summary }, false, "setAttendanceSummary"),

      // Update a specific attendance record in the list
      updateAttendanceRecord: (updatedRecord) =>
        set(
          (state) => {
            const updatedRecords = state.attendanceRecords.map((record) =>
              record.attendance_id === updatedRecord.attendance_id
                ? updatedRecord
                : record
            );

            return {
              attendanceRecords: updatedRecords,
              selectedRecord:
                state.selectedRecord?.attendance_id ===
                updatedRecord.attendance_id
                  ? updatedRecord
                  : state.selectedRecord,
            };
          },
          false,
          "updateAttendanceRecord"
        ),

      // Add new attendance record
      addAttendanceRecord: (newRecord) =>
        set(
          (state) => ({
            attendanceRecords: [newRecord, ...state.attendanceRecords],
          }),
          false,
          "addAttendanceRecord"
        ),

      // Remove attendance record
      removeAttendanceRecord: (attendanceId) =>
        set(
          (state) => ({
            attendanceRecords: state.attendanceRecords.filter(
              (record) => record.attendance_id !== attendanceId
            ),
            selectedRecord:
              state.selectedRecord?.attendance_id === attendanceId
                ? null
                : state.selectedRecord,
          }),
          false,
          "removeAttendanceRecord"
        ),

      // Fetch all attendance records
      fetchAttendanceRecords: async (bustCache = false) => {
        if (!bustCache && get().attendanceRecords.length > 0) {
          return; // Don't refetch if we already have data and cache busting is not requested
        }

        set(
          { loading: true, error: null },
          false,
          "fetchAttendanceRecords:start"
        );

        try {
          const records = await fetchAllAttendance();
          set(
            {
              attendanceRecords: records,
              loading: false,
            },
            false,
            "fetchAttendanceRecords:success"
          );
        } catch (error) {
          set(
            {
              error:
                error instanceof Error
                  ? error.message
                  : "Failed to fetch attendance records",
              loading: false,
            },
            false,
            "fetchAttendanceRecords:error"
          );
        }
      },

      // Fetch attendance records for a specific employee
      fetchEmployeeAttendanceRecords: async (employeeId) => {
        set(
          { loading: true, error: null },
          false,
          "fetchEmployeeAttendanceRecords:start"
        );

        try {
          const records = await fetchEmployeeAttendance(employeeId);
          set(
            {
              attendanceRecords: records,
              loading: false,
            },
            false,
            "fetchEmployeeAttendanceRecords:success"
          );
        } catch (error) {
          set(
            {
              error:
                error instanceof Error
                  ? error.message
                  : "Failed to fetch employee attendance",
              loading: false,
            },
            false,
            "fetchEmployeeAttendanceRecords:error"
          );
        }
      },

      // Fetch today's attendance
      fetchTodayAttendanceRecords: async () => {
        set(
          { loading: true, error: null },
          false,
          "fetchTodayAttendanceRecords:start"
        );

        try {
          const records = await fetchTodayAttendance();
          set(
            {
              todayAttendance: records,
              loading: false,
            },
            false,
            "fetchTodayAttendanceRecords:success"
          );
        } catch (error) {
          set(
            {
              error:
                error instanceof Error
                  ? error.message
                  : "Failed to fetch today's attendance",
              loading: false,
            },
            false,
            "fetchTodayAttendanceRecords:error"
          );
        }
      },

      // Fetch employee attendance summary
      fetchEmployeeSummary: async (employeeId, startDate, endDate) => {
        set(
          { loading: true, error: null },
          false,
          "fetchEmployeeSummary:start"
        );

        try {
          const summary = await fetchEmployeeAttendanceSummary(
            employeeId,
            startDate,
            endDate
          );
          set(
            {
              attendanceSummary: summary,
              loading: false,
            },
            false,
            "fetchEmployeeSummary:success"
          );
        } catch (error) {
          set(
            {
              error:
                error instanceof Error
                  ? error.message
                  : "Failed to fetch attendance summary",
              loading: false,
            },
            false,
            "fetchEmployeeSummary:error"
          );
        }
      },

      // Clock in employee
      clockIn: async (data) => {
        set({ clockingIn: true, error: null }, false, "clockIn:start");

        try {
          const record = await clockInEmployee(data);
          const { attendanceRecords } = get();
          set(
            {
              attendanceRecords: [record, ...attendanceRecords],
              clockingIn: false,
            },
            false,
            "clockIn:success"
          );
        } catch (error) {
          set(
            {
              error:
                error instanceof Error ? error.message : "Failed to clock in",
              clockingIn: false,
            },
            false,
            "clockIn:error"
          );
          throw error;
        }
      },

      // Clock out employee
      clockOut: async (data) => {
        set({ clockingOut: true, error: null }, false, "clockOut:start");

        try {
          const record = await clockOutEmployee(data);
          get().updateAttendanceRecord(record);
          set({ clockingOut: false }, false, "clockOut:success");
        } catch (error) {
          set(
            {
              error:
                error instanceof Error ? error.message : "Failed to clock out",
              clockingOut: false,
            },
            false,
            "clockOut:error"
          );
          throw error;
        }
      },

      // Create manual attendance record
      createManualRecord: async (data) => {
        set(
          { submittingManual: true, error: null },
          false,
          "createManualRecord:start"
        );

        try {
          const record = await createManualAttendance(data);
          get().addAttendanceRecord(record);
          set({ submittingManual: false }, false, "createManualRecord:success");
        } catch (error) {
          set(
            {
              error:
                error instanceof Error
                  ? error.message
                  : "Failed to create manual attendance",
              submittingManual: false,
            },
            false,
            "createManualRecord:error"
          );
          throw error;
        }
      },

      // Update attendance record
      updateRecord: async (attendanceId, data) => {
        set(
          { submittingManual: true, error: null },
          false,
          "updateRecord:start"
        );

        try {
          const record = await updateAttendanceRecord(attendanceId, data);
          get().updateAttendanceRecord(record);
          set({ submittingManual: false }, false, "updateRecord:success");
        } catch (error) {
          set(
            {
              error:
                error instanceof Error
                  ? error.message
                  : "Failed to update attendance record",
              submittingManual: false,
            },
            false,
            "updateRecord:error"
          );
          throw error;
        }
      },

      // Delete attendance record
      deleteRecord: async (attendanceId) => {
        set(
          { submittingManual: true, error: null },
          false,
          "deleteRecord:start"
        );

        try {
          await deleteAttendanceRecord(attendanceId);
          get().removeAttendanceRecord(attendanceId);
          set({ submittingManual: false }, false, "deleteRecord:success");
        } catch (error) {
          set(
            {
              error:
                error instanceof Error
                  ? error.message
                  : "Failed to delete attendance record",
              submittingManual: false,
            },
            false,
            "deleteRecord:error"
          );
          throw error;
        }
      },

      // Utility actions
      clearError: () => set({ error: null }, false, "clearError"),

      setLoading: (loading) => set({ loading }, false, "setLoading"),

      setClockingIn: (clocking) =>
        set({ clockingIn: clocking }, false, "setClockingIn"),

      setClockingOut: (clocking) =>
        set({ clockingOut: clocking }, false, "setClockingOut"),

      setSubmittingManual: (submitting) =>
        set({ submittingManual: submitting }, false, "setSubmittingManual"),

      // Refetch data (alias for fetchAttendanceRecords with cache busting)
      refetch: async (bustCache = true) => {
        await get().fetchAttendanceRecords(bustCache);
      },
    }),
    {
      name: "attendance-store", // Name for Redux DevTools
    }
  )
);
