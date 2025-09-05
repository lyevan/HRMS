import { create } from "zustand";
import { devtools } from "zustand/middleware";
import type { Position } from "@/models/position-model";
import { fetchAllPositions } from "@/models/position-model";

interface PositionStore {
  // State
  positions: Position[];
  selectedPosition: Position | null;
  loading: boolean;
  error: string | null;

  // Actions
  setPositions: (positions: Position[]) => void;
  setSelectedPosition: (position: Position | null) => void;
  updatePosition: (updatedPosition: Position) => void;
  addPosition: (newPosition: Position) => void;
  removePosition: (positionId: number) => void;
  fetchPositions: (bustCache?: boolean) => Promise<void>;
  refetch: (bustCache?: boolean) => Promise<void>;

  // Loading states
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const usePositionStore = create<PositionStore>()(
  devtools(
    (set, get) => ({
      // Initial state
      positions: [],
      selectedPosition: null,
      loading: false,
      error: null,

      // Set all positions
      setPositions: (positions) => set({ positions }, false, "setPositions"),

      // Set selected position
      setSelectedPosition: (position) =>
        set({ selectedPosition: position }, false, "setSelectedPosition"),

      // Update a specific position in the list and selected position if it matches
      updatePosition: (updatedPosition) =>
        set(
          (state) => {
            const updatedPositions = state.positions.map((pos) =>
              pos.position_id === updatedPosition.position_id
                ? updatedPosition
                : pos
            );

            return {
              positions: updatedPositions,
              selectedPosition:
                state.selectedPosition?.position_id ===
                updatedPosition.position_id
                  ? updatedPosition
                  : state.selectedPosition,
            };
          },
          false,
          "updatePosition"
        ),

      // Add new position
      addPosition: (newPosition) =>
        set(
          (state) => ({
            positions: [...state.positions, newPosition],
          }),
          false,
          "addPosition"
        ),

      // Remove position
      removePosition: (positionId) =>
        set(
          (state) => ({
            positions: state.positions.filter(
              (pos) => pos.position_id !== positionId
            ),
            selectedPosition:
              state.selectedPosition?.position_id === positionId
                ? null
                : state.selectedPosition,
          }),
          false,
          "removePosition"
        ), // Fetch positions from API
      fetchPositions: async (_bustCache = false) => {
        // _bustCache parameter reserved for future cache invalidation
        try {
          set({ loading: true, error: null }, false, "fetchPositions:start");

          const response = await fetchAllPositions();

          set(
            {
              positions: response.result,
              loading: false,
              error: null,
            },
            false,
            "fetchPositions:success"
          );
        } catch (error: any) {
          console.error("Error fetching positions:", error);
          set(
            {
              error: "Failed to fetch positions",
              loading: false,
            },
            false,
            "fetchPositions:error"
          );
        }
      },

      // Refetch (alias for fetchPositions)
      refetch: async (bustCache = false) => {
        await get().fetchPositions(bustCache);
      },

      // Loading state setters
      setLoading: (loading) => set({ loading }, false, "setLoading"),

      setError: (error) => set({ error }, false, "setError"),
    }),
    {
      name: "position-store", // Persist name for devtools
    }
  )
);

// Selector hooks for better performance
export const usePositions = () => usePositionStore((state) => state.positions);
export const useSelectedPosition = () =>
  usePositionStore((state) => state.selectedPosition);
export const usePositionLoading = () =>
  usePositionStore((state) => state.loading);
export const usePositionError = () => usePositionStore((state) => state.error);

// Individual action hooks to prevent re-renders
export const useFetchPositions = () =>
  usePositionStore((state) => state.fetchPositions);
export const useUpdatePosition = () =>
  usePositionStore((state) => state.updatePosition);
export const useSetSelectedPosition = () =>
  usePositionStore((state) => state.setSelectedPosition);
