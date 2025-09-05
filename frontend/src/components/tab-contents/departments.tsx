import { DepartmentTable } from "@/components/tables/department-table";
import departmentColumns from "@/components/tables/columns/department-columns";
import {
  useDepartments,
  useFetchDepartments,
  useSetSelectedDepartment,
} from "@/store/departmentStore";
import { useEffect, useState } from "react";
import { type Department } from "@/models/department-model";

const Departments = () => {
  const [isAddDepartmentModalOpen, setIsAddDepartmentModalOpen] =
    useState(false);
  // TODO: Uncomment when modal components are implemented
  // const [isViewDepartmentModalOpen, setIsViewDepartmentModalOpen] = useState(false);
  // const [isEditDepartmentModalOpen, setIsEditDepartmentModalOpen] = useState(false);

  // Use department store
  const departments = useDepartments();
  const fetchDepartments = useFetchDepartments();
  const setSelectedDepartment = useSetSelectedDepartment();

  // Fetch departments on component mount
  useEffect(() => {
    fetchDepartments();
  }, [fetchDepartments]);

  const handleViewDetails = (department: Department) => {
    setSelectedDepartment(department);
    // TODO: Open view modal
    console.log("View department:", department);
  };

  const handleEdit = (department: Department) => {
    setSelectedDepartment(department);
    // TODO: Open edit modal
    console.log("Edit department:", department);
  };

  const handleDelete = (department: Department) => {
    // TODO: Implement delete functionality
    console.log("Delete department:", department);
  };

  const columns = departmentColumns({
    setIsViewDepartmentModalOpen: () => {}, // TODO: Replace with actual setter when modal is implemented
    setIsEditDepartmentModalOpen: () => {}, // TODO: Replace with actual setter when modal is implemented
    onViewDetails: handleViewDetails,
    onEdit: handleEdit,
    onDelete: handleDelete,
  });
  // TODO: Add modal components when implemented
  // {isAddDepartmentModalOpen && <AddDepartmentModal />}
  // {isViewDepartmentModalOpen && <ViewDepartmentModal />}
  // {isEditDepartmentModalOpen && <EditDepartmentModal />}

  // Suppress unused variable warning - will be used when modal is implemented
  void isAddDepartmentModalOpen;

  return (
    <DepartmentTable
      columns={columns}
      data={departments}
      setIsAddDepartmentModalOpen={setIsAddDepartmentModalOpen}
    />
  );
};

export default Departments;
