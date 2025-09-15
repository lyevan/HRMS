import { DepartmentTable } from "@/components/tables/department-table";
import departmentColumns from "@/components/tables/columns/department-columns";
import {
  useDepartments,
  useFetchDepartments,
  useSetSelectedDepartment,
  useSelectedDepartment,
} from "@/store/departmentStore";
import { useEffect, useState } from "react";
import { type Department } from "@/models/department-model";
import { DepartmentModal } from "@/components/modals/department-modal";

const Departments = () => {
  const [isAddDepartmentModalOpen, setIsAddDepartmentModalOpen] =
    useState(false);
  const [isViewDepartmentModalOpen, setIsViewDepartmentModalOpen] =
    useState(false);
  const [isEditDepartmentModalOpen, setIsEditDepartmentModalOpen] =
    useState(false);

  // Use department store
  const departments = useDepartments();
  const fetchDepartments = useFetchDepartments();
  const setSelectedDepartment = useSetSelectedDepartment();
  const selectedDepartment = useSelectedDepartment();

  // Fetch departments on component mount
  useEffect(() => {
    fetchDepartments();
  }, [fetchDepartments]);

  const handleViewDetails = (department: Department) => {
    setSelectedDepartment(department);
    setIsViewDepartmentModalOpen(true);
  };

  const handleEdit = (department: Department) => {
    setSelectedDepartment(department);
    setIsEditDepartmentModalOpen(true);
  };

  const handleDelete = (department: Department) => {
    // TODO: Implement delete functionality
    console.log("Delete department:", department);
  };

  const columns = departmentColumns({
    setIsViewDepartmentModalOpen,
    setIsEditDepartmentModalOpen,
    onViewDetails: handleViewDetails,
    onEdit: handleEdit,
    onDelete: handleDelete,
  });

  return (
    <>
      <DepartmentTable
        columns={columns}
        data={departments}
        setIsAddDepartmentModalOpen={setIsAddDepartmentModalOpen}
      />

      {/* Department Modals */}
      <DepartmentModal
        open={isAddDepartmentModalOpen}
        onOpenChange={setIsAddDepartmentModalOpen}
        mode="create"
      />

      <DepartmentModal
        open={isViewDepartmentModalOpen}
        onOpenChange={setIsViewDepartmentModalOpen}
        department={selectedDepartment || undefined}
        mode="view"
      />

      <DepartmentModal
        open={isEditDepartmentModalOpen}
        onOpenChange={setIsEditDepartmentModalOpen}
        department={selectedDepartment || undefined}
        mode="edit"
      />
    </>
  );
};

export default Departments;
