import { PositionTable } from "@/components/tables/position-table";
import positionColumns from "@/components/tables/columns/position-columns";
import {
  usePositions,
  useFetchPositions,
  useSetSelectedPosition,
} from "@/store/positionStore";
import { useFetchDepartments } from "@/store/departmentStore";
import { useEffect, useState } from "react";
import { type Position } from "@/models/position-model";

const Positions = () => {
  const [isAddPositionModalOpen, setIsAddPositionModalOpen] = useState(false);
  // TODO: Uncomment when modal components are implemented
  // const [isViewPositionModalOpen, setIsViewPositionModalOpen] = useState(false);
  // const [isEditPositionModalOpen, setIsEditPositionModalOpen] = useState(false);
  // Use position store
  const positions = usePositions();
  const fetchPositions = useFetchPositions();
  const setSelectedPosition = useSetSelectedPosition();

  // Also fetch departments for department name lookup
  const fetchDepartments = useFetchDepartments();

  // Fetch positions and departments on component mount
  useEffect(() => {
    fetchPositions();
    fetchDepartments(); // Load departments for name lookup
  }, [fetchPositions, fetchDepartments]);

  const handleViewDetails = (position: Position) => {
    setSelectedPosition(position);
    // TODO: Open view modal
    console.log("View position:", position);
  };

  const handleEdit = (position: Position) => {
    setSelectedPosition(position);
    // TODO: Open edit modal
    console.log("Edit position:", position);
  };

  const handleDelete = (position: Position) => {
    // TODO: Implement delete functionality
    console.log("Delete position:", position);
  };

  const columns = positionColumns({
    setIsViewPositionModalOpen: () => {}, // TODO: Replace with actual setter when modal is implemented
    setIsEditPositionModalOpen: () => {}, // TODO: Replace with actual setter when modal is implemented
    onViewDetails: handleViewDetails,
    onEdit: handleEdit,
    onDelete: handleDelete,
  });
  // TODO: Add modal components when implemented
  // {isAddPositionModalOpen && <AddPositionModal />}
  // {isViewPositionModalOpen && <ViewPositionModal />}
  // {isEditPositionModalOpen && <EditPositionModal />}

  // Suppress unused variable warning - will be used when modal is implemented
  void isAddPositionModalOpen;

  return (
    <PositionTable
      columns={columns}
      data={positions}
      setIsAddPositionModalOpen={setIsAddPositionModalOpen}
    />
  );
};

export default Positions;
