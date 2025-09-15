import { PositionTable } from "@/components/tables/position-table";
import positionColumns from "@/components/tables/columns/position-columns";
import {
  usePositions,
  useFetchPositions,
  useSetSelectedPosition,
  useSelectedPosition,
} from "@/store/positionStore";
import { useFetchDepartments, useDepartments } from "@/store/departmentStore";
import { useEffect, useState } from "react";
import { type Position } from "@/models/position-model";
import { PositionModal } from "@/components/modals/position-modal";

const Positions = () => {
  const [isAddPositionModalOpen, setIsAddPositionModalOpen] = useState(false);
  const [isViewPositionModalOpen, setIsViewPositionModalOpen] = useState(false);
  const [isEditPositionModalOpen, setIsEditPositionModalOpen] = useState(false);
  // Use position store
  const positions = usePositions();
  const fetchPositions = useFetchPositions();
  const setSelectedPosition = useSetSelectedPosition();
  const selectedPosition = useSelectedPosition();

  // Also fetch departments for department name lookup
  const fetchDepartments = useFetchDepartments();
  const departments = useDepartments();

  // Fetch positions and departments on component mount
  useEffect(() => {
    fetchPositions();
    fetchDepartments(); // Load departments for name lookup
  }, [fetchPositions, fetchDepartments]);

  const handleViewDetails = (position: Position) => {
    setSelectedPosition(position);
    setIsViewPositionModalOpen(true);
  };

  const handleEdit = (position: Position) => {
    setSelectedPosition(position);
    setIsEditPositionModalOpen(true);
  };

  const handleDelete = (position: Position) => {
    // TODO: Implement delete functionality
    console.log("Delete position:", position);
  };

  const columns = positionColumns({
    setIsViewPositionModalOpen,
    setIsEditPositionModalOpen,
    onViewDetails: handleViewDetails,
    onEdit: handleEdit,
    onDelete: handleDelete,
    departments: departments, // Pass departments data to columns
  });

  return (
    <>
      <PositionTable
        columns={columns}
        data={positions}
        setIsAddPositionModalOpen={setIsAddPositionModalOpen}
      />

      {/* Position Modals */}
      <PositionModal
        open={isAddPositionModalOpen}
        onOpenChange={setIsAddPositionModalOpen}
        mode="create"
      />

      <PositionModal
        open={isViewPositionModalOpen}
        onOpenChange={setIsViewPositionModalOpen}
        position={selectedPosition || undefined}
        mode="view"
      />

      <PositionModal
        open={isEditPositionModalOpen}
        onOpenChange={setIsEditPositionModalOpen}
        position={selectedPosition || undefined}
        mode="edit"
      />
    </>
  );
};

export default Positions;
